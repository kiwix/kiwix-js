'use strict';

/* global params */

var regexpCookieKeysToMigrate = new RegExp([
    'hideActiveContentWarning', 'showUIAnimations', 'appTheme', 'useCache',
    'contentInjectionMode', 'listOfArchives', 'lastSelectedArchive'
].join('|'));

/**
 * A list of deprecated keys that should be removed. Add any further keys to the list of strings separated by a comma.
 * @type {Array}
 */
var deprecatedKeys = [
    'lastContentInjectionMode',
    'useCache'
];

/**
 * The prefix that will be added to keys when stored in localStorage: this is used to prevent
 * potential collision of key names with localStorage keys used by code inside ZIM archives
 * It is set in init.js because it is needed early in app loading
 * @type {String}
 */
var keyPrefix = params.keyPrefix;

// Tests for available Storage APIs (document.cookie or localStorage) and returns the best available of these
function getBestAvailableStorageAPI() {
    // DEV: In FF extensions, cookies are blocked since at least FF 68.6 but possibly since FF 55 [kiwix-js #612]
    var type = 'none';
    // First test for localStorage API support
    var localStorageTest;
    try {
        localStorageTest = 'localStorage' in window && window['localStorage'] !== null;
        // DEV: Above test returns true in IE11 running from file:// protocol, but attempting to write a key to
        // localStorage causes an exception; so to test fully, we must now attempt to write and remove a test key
        if (localStorageTest) {
            localStorage.setItem('tempKiwixStorageTest', '');
            localStorage.removeItem('tempKiwixStorageTest');
        }
    } catch (e) {
        localStorageTest = false;
        console.warn('localStorage not supported in this context', e);
    }
    // Now test for document.cookie API support
    document.cookie = 'tempKiwixCookieTest=working; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=Strict';
    var kiwixCookieTest = /tempKiwixCookieTest=working/.test(document.cookie);
    // Remove test value by expiring the key
    document.cookie = 'tempKiwixCookieTest=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    if (kiwixCookieTest) type = 'cookie';
    // Prefer localStorage if supported due to some platforms removing cookies once the session ends in some contexts
    if (localStorageTest) type = 'local_storage';
    // If both cookies and localStorage are supported, and document.cookie contains keys to migrate,
    // migrate settings to use localStorage
    if (kiwixCookieTest && localStorageTest && regexpCookieKeysToMigrate.test(document.cookie)) _migrateStorageSettings();
    // Remove any deprecated keys
    deprecatedKeys.forEach(function (key) {
        if (localStorageTest) localStorage.removeItem(keyPrefix + key);
        settingsStore.removeItem(key); // Because this runs before we have returned a store type, this will remove from cookie too
    });
    // Note that if this function returns 'none', the cookie implementations below will run anyway. This is because storing a cookie
    // does not cause an exception even if cookies are blocked in some contexts, whereas accessing localStorage may cause an exception
    return type;
}

/**
 * Performs a full app reset, deleting all caches and settings
 * Or, if a parameter is supplied, deletes or disables the object
 * @param {String} object Optional name of the object to disable or delete ('cookie', 'localStorage', 'indexedDB', 'cacheAPI')
 */
// function reset(object) {
//     // 1. Clear any cookie entries
//     if (!object || object === 'cookie') {
//         var regexpCookieKeys = /(?:^|;)\s*([^=]+)=([^;]*)/ig;
//         var currentCookie = document.cookie;
//         var foundCrumb = false;
//         var cookieCrumb = regexpCookieKeys.exec(currentCookie);
//         while (cookieCrumb !== null) {
//             // DEV: Note that we don't use the keyPrefix in legacy cookie support
//             foundCrumb = true;
//             // This expiry date will cause the browser to delete the cookie crumb on next page refresh
//             document.cookie = cookieCrumb[1] + '=;expires=Thu, 21 Sep 1979 00:00:01 UTC;';
//             cookieCrumb = regexpCookieKeys.exec(currentCookie);
//         }
//         if (foundCrumb) console.debug('All cookie keys were expired...');
//     }

//     // 2. Clear any localStorage settings
//     if (!object || object === 'localStorage') {
//         if (params.storeType === 'local_storage') {
//             localStorage.clear();
//             console.debug('All Local Storage settings were deleted...');
//         }
//     }

//     // 3. Clear any IndexedDB databases
//     if (!object || object === 'indexedDB') {
//         if (window.indexedDB) {
//             // Attempt to delete all databases (only works in Chromium-based browsers)
//             if (indexedDB.databases) {
//                 var result = 0;
//                 indexedDB.databases().then(function (dbs) {
//                     dbs.forEach(function (db) {
//                         result++;
//                         indexedDB.deleteDatabase(db.name);
//                         console.debug('Deleting ' + db.name + '...');
//                     });
//                 }).then(function () {
//                     console.debug('Deleted ' + result + ' indexedDB databases...');
//                 }).catch(function (err) {
//                     console.error('Error deleting indexedDB databases', err);
//                 });
//             } else {
//                 // For Firefox, we can only delete databases we know the names of
//                 var dbNames = [params.cacheIDB, 'collDB'];
//                 dbNames.forEach(function (dbName) {
//                     var deleteRequest = indexedDB.deleteDatabase(dbName);
//                     deleteRequest.onsuccess = function () {
//                         console.debug('Deleted ' + dbName + '...');
//                     }
//                     deleteRequest.onerror = function (ev) {
//                         console.error('Error deleting ' + dbName + '...', ev);
//                     }
//                 });
//             }
//         }
//     }

//     // 4. Clear any Cache API caches
//     if (!object || object === 'cacheAPI') {
//         if ('caches' in window) {
//             // Get all cache names directly from Cache API
//             caches.keys().then(function (cacheNames) {
//                 if (cacheNames && cacheNames.length > 0) {
//                     var deletePromises = cacheNames.map(function (cacheName) {
//                         console.debug('Deleting cache: ' + cacheName);
//                         return caches.delete(cacheName);
//                     });

//                     return Promise.all(deletePromises);
//                 }
//             }).then(function () {
//                 console.debug('All Cache API caches were deleted...');
//                 // Reload if user performed full reset or if appCache is needed
//                 if (!object || params.appCache) _reloadApp();
//             }).catch(function (err) {
//                 console.error('Error deleting caches:', err);
//                 // Still reload on error
//                 if (!object || params.appCache) _reloadApp();
//             });
//         } else {
//             console.debug('Cache API not available');
//             if (!object || params.appCache) _reloadApp();
//         }
//     }
// }
function reset(object) {
    // Helper function to handle reload after all operations
    var shouldReload = function () {
        return !object || params.appCache;
    };

    // 1. Clear any cookie entries
    if (!object || object === 'cookie') {
        var regexpCookieKeys = /(?:^|;)\s*([^=]+)=([^;]*)/ig;
        var currentCookie = document.cookie;
        var foundCrumb = false;
        var cookieCrumb = regexpCookieKeys.exec(currentCookie);
        while (cookieCrumb !== null) {
            foundCrumb = true;
            document.cookie = cookieCrumb[1] + '=;expires=Thu, 21 Sep 1979 00:00:01 UTC;';
            cookieCrumb = regexpCookieKeys.exec(currentCookie);
        }
        if (foundCrumb) console.debug('All cookie keys were expired...');
    }

    // 2. Clear any localStorage settings
    if (!object || object === 'localStorage') {
        if (params.storeType === 'local_storage') {
            localStorage.clear();
            console.debug('All Local Storage settings were deleted...');
        }
    }

    // 3. Clear any IndexedDB databases
    var indexedDBPromise = Promise.resolve();
    if (!object || object === 'indexedDB') {
        if (window.indexedDB) {
            if (indexedDB.databases) {
                indexedDBPromise = indexedDB.databases().then(function (dbs) {
                    var deletePromises = dbs.map(function (db) {
                        console.debug('Deleting ' + db.name + '...');
                        return new Promise(function (resolve) {
                            var req = indexedDB.deleteDatabase(db.name);
                            req.onsuccess = resolve;
                            req.onerror = resolve; // Resolve even on error
                        });
                    });
                    return Promise.all(deletePromises);
                }).then(function () {
                    console.debug('Deleted all indexedDB databases...');
                }).catch(function (err) {
                    console.error('Error deleting indexedDB databases', err);
                });
            } else {
                // For Firefox
                var dbNames = [params.cacheIDB, 'collDB'];
                var deletePromises = dbNames.map(function (dbName) {
                    return new Promise(function (resolve) {
                        var deleteRequest = indexedDB.deleteDatabase(dbName);
                        deleteRequest.onsuccess = function () {
                            console.debug('Deleted ' + dbName + '...');
                            resolve();
                        };
                        deleteRequest.onerror = function (ev) {
                            console.error('Error deleting ' + dbName + '...', ev);
                            resolve(); // Resolve even on error
                        };
                    });
                });
                indexedDBPromise = Promise.all(deletePromises);
            }
        }
    }

    // 4. Clear any Cache API caches
    var cachePromise = Promise.resolve();
    if (!object || object === 'cacheAPI') {
        if ('caches' in window) {
            cachePromise = caches.keys().then(function (cacheNames) {
                if (cacheNames && cacheNames.length > 0) {
                    var deletePromises = cacheNames.map(function (cacheName) {
                        console.debug('Deleting cache: ' + cacheName);
                        return caches.delete(cacheName);
                    });
                    return Promise.all(deletePromises);
                }
            }).then(function () {
                console.debug('All Cache API caches were deleted...');
            }).catch(function (err) {
                console.error('Error deleting caches:', err);
            });
        } else {
            console.debug('Cache API not available');
        }
    }

    // Wait for all async operations to complete before reloading
    Promise.all([indexedDBPromise, cachePromise]).then(function () {
        if (shouldReload()) {
            _reloadApp();
        }
    }).catch(function (err) {
        console.error('Error during reset:', err);
        if (shouldReload()) {
            _reloadApp();
        }
    });
}



// Gets cache names from Service Worker, as we cannot rely on having them in params.cacheNames
function getCacheNames(callback) {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        var channel = new MessageChannel();
        channel.port1.onmessage = function (event) {
            var names = event.data;
            callback(names);
        };
        navigator.serviceWorker.controller.postMessage({
            action: 'getCacheNames'
        }, [channel.port2]);
    } else {
        callback(null);
    }
}

// Deregisters all Service Workers and reboots the app
function _reloadApp() {
    var reboot = function () {
        console.debug('Performing app reload...');
        setTimeout(function () {
            window.location.href = location.origin + location.pathname + uriParams
        }, 300);
    };
    // Blank the querystring, so that parameters are not set on reload
    var uriParams = '';
    if (~window.location.href.indexOf(params.PWAServer) && params.referrerExtensionURL) {
        // However, if we're in a PWA that was called from local code, then by definition we must remain in SW mode and we need to
        // ensure the user still has access to the referrerExtensionURL (so they can get back to local code from the UI)
        uriParams = '?allowInternetAccess=truee&contentInjectionMode=serviceworker';
        uriParams += '&referrerExtensionURL=' + encodeURIComponent(params.referrerExtensionURL);
    }
    if (navigator && navigator.serviceWorker) {
        console.debug('Deregistering Service Workers...');
        var cnt = 0;
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            if (!registrations.length) {
                reboot();
                return;
            }
            cnt++;
            registrations.forEach(function (registration) {
                registration.unregister().then(function () {
                    cnt--;
                    if (!cnt) {
                        console.debug('All Service Workers unregistered...');
                        reboot();
                    }
                }).catch(function (err) {
                    console.error(err);
                    reboot();
                });
            });
        }).catch(function (err) {
            console.error(err);
            reboot();
        });
    } else {
        console.debug('Performing app reload...');
        reboot();
    }
}

var settingsStore = {
    getItem: function (sKey) {
        if (!sKey) {
            return null;
        }
        if (params.storeType !== 'local_storage') {
            return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[-.+*\\]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
        } else {
            return localStorage.getItem(keyPrefix + sKey);
        }
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (params.storeType !== 'local_storage') {
            if (!sKey || /^(?:expires|max-age|path|domain|secure)$/i.test(sKey)) {
                return false;
            }
            var sExpires = '';
            if (vEnd) {
                switch (vEnd.constructor) {
                    case Number:
                        sExpires = vEnd === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + vEnd;
                        break;
                    case String:
                        sExpires = '; expires=' + vEnd;
                        break;
                    case Date:
                        sExpires = '; expires=' + vEnd.toUTCString();
                        break;
                }
            }
            document.cookie = encodeURIComponent(sKey) + '=' + encodeURIComponent(sValue) + sExpires + (sDomain ? '; domain=' + sDomain : '') + (sPath ? '; path=' + sPath : '') + (bSecure ? '; secure' : '');
        } else {
            localStorage.setItem(keyPrefix + sKey, sValue);
        }
        return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
        if (!this.hasItem(sKey)) {
            return false;
        }
        if (params.storeType !== 'local_storage') {
            document.cookie = encodeURIComponent(sKey) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + (sDomain ? '; domain=' + sDomain : '') + (sPath ? '; path=' + sPath : '');
        } else {
            localStorage.removeItem(keyPrefix + sKey);
        }
        return true;
    },
    hasItem: function (sKey) {
        if (!sKey) {
            return false;
        }
        if (params.storeType !== 'local_storage') {
            return (new RegExp('(?:^|;\\s*)' + encodeURIComponent(sKey).replace(/[-.+*\\]/g, '\\$&') + '\\s*\\=')).test(document.cookie);
        } else {
            return localStorage.getItem(keyPrefix + sKey) !== null;
        }
    },
    _cookieKeys: function () {
        // Disabling linter check because this is library code
        // eslint-disable-next-line no-useless-backreference
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^=]+)(?=;|$)|^\s*|\s*(?:=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:=[^;]*)?;\s*/);
        for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
            aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
        }
        return aKeys;
    }
};

// One-off migration of storage settings from cookies to localStorage
function _migrateStorageSettings() {
    console.log('Migrating Settings Store from cookies to localStorage...');
    var cookieKeys = settingsStore._cookieKeys();
    // Note that because migration occurs before setting params.storeType, settingsStore.getItem() will get the item from
    // document.cookie instead of localStorage, which is the intended behaviour
    for (var i = 0; i < cookieKeys.length; i++) {
        if (regexpCookieKeysToMigrate.test(cookieKeys[i])) {
            var migratedKey = keyPrefix + cookieKeys[i];
            localStorage.setItem(migratedKey, settingsStore.getItem(cookieKeys[i]));
            settingsStore.removeItem(cookieKeys[i]);
            console.log('- ' + migratedKey);
        }
    }
    console.log('Migration done.');
}

export default {
    getItem: settingsStore.getItem,
    setItem: settingsStore.setItem,
    removeItem: settingsStore.removeItem,
    hasItem: settingsStore.hasItem,
    getCacheNames: getCacheNames,
    reset: reset,
    getBestAvailableStorageAPI: getBestAvailableStorageAPI
};
