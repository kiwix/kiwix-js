'use strict';
define([], function () {
  /**
   * settingsStore.js
   * 
   * A reader/writer framework for cookies or localStorage with full unicode support based on the Mozilla cookies framework.
   * The Mozilla code has been adapted to test for the availability of the localStorage API, and to use it in preference to cookies.
   * 
   * Mozilla version information:
   * 
   * Revision #1 - September 4, 2014
   * 
   * https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
   * https://developer.mozilla.org/User:fusionchess
   * 
   * This framework is released under the GNU Public License, version 3 or later.
   * http://www.gnu.org/licenses/gpl-3.0-standalone.html
   *
   * Syntaxes:
   *
   *  * settingsStore.setItem(name, value[, end[, path[, domain[, secure]]]])
   *  * settingsStore.getItem(name)
   *  * settingsStore.removeItem(name[, path[, domain]])
   *  * settingsStore.hasItem(name)
   * 
   */

  /**
   * A RegExp of the settings keys used in the cookie that should be migrated to localStorage if the API is available
   * DEV: It should not be necessary to keep this list up-to-date because any keys added after this list was created 
   * (April 2020) will already be stored in localStorage if it is available to the client's browser or platform and 
   * will not need to be migrated
   * @type {RegExp}
   */
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
   * Or, if a paramter is supplied, deletes or disables the object
   * 
   * @param {String} object Optional name of the object to disable or delete ('cookie', 'localStorage', 'cacheAPI')
   */
  function reset(object) {
    // If no specific object was specified, we are doing a general reset, so ask user for confirmation
    if (!object && !confirm('WARNING: This will reset the app to a freshly installed state, deleting all app caches and settings!')) return;
    
    // Clear any cookie entries
    if (!object || object === 'cookie') {
      var cookieKeys = /(?:^|;)\s*([^=]+)=([^;]*)/ig;
      var currentCookies = document.cookie;
      var cookieCrumb = cookieKeys.exec(currentCookies);
      var cook = false;
      while (cookieCrumb !== null) {
        // If the cookie key starts with the keyPrefix
        if (~params.keyPrefix.indexOf(decodeURIComponent(cookieCrumb[0]))) {
          cook = true;
          key = cookieCrumb[1];
          // This expiry date will cause the browser to delete the cookie on next page refresh
          document.cookie = key + '=;expires=Thu, 21 Sep 1979 00:00:01 UTC;';
        }
        cookieCrumb = cookieKeys.exec(currentCookies);
      }
      if (cook) console.debug('All cookies were expiered...');
    }

    // Clear any localStorage settings
    if (!object || object === 'localStorage') {
      if (params.storeType === 'local_storage') {
        localStorage.clear();
        console.debug('All Local Storage settings were deleted...');
      }
    }

    // Clear any Cache API caches
    if (!object || object === 'cacheAPI') {
      _getCacheNames(function () {
        if (params.cacheNames) {
          var cnt = 0;
          for (var cacheName in params.cacheNames) {
            cnt++;
            caches.delete(params.cacheNames[cacheName]).then(function () {
              cnt--;
              if (!cnt) {
                // All caches deleted
                console.debug('All Cache API caches were deleted...');
                if (!object || params.appCache) _reloadApp();
              }
            });
          };
        } else {
          console.debug('No Cache API caches were in use (or we do not have access to the names).');
          // All operations complete
          if (!object || params.appCache) _reloadApp();
        }
      });
    }
  }

  function _getCacheNames(callback) {
    // Get cache names from Service Worker, as we cannot rely on having them in params.cacheNames
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      var channel = new MessageChannel();
      channel.port1.onmessage = function (event) {
        var cacheNames = event.data;
        if (!cacheNames.error) params.cacheNames = cacheNames;
        callback();
      };
      navigator.serviceWorker.controller.postMessage({
        action: 'getCacheNames'
      }, [channel.port2]);
    } else {
      callback();
    }
  }

  function _reloadApp() {
    var reboot = function () {
      console.debug('Performing app reload...');
      setTimeout(function () {
        window.location.reload();
      }, 300);
    };
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
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[-.+*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
      } else {
        return localStorage.getItem(keyPrefix + sKey);
      }
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
      if (params.storeType !== 'local_storage') {
        if (!sKey || /^(?:expires|max-age|path|domain|secure)$/i.test(sKey)) {
          return false;
        }
        var sExpires = "";
        if (vEnd) {
          switch (vEnd.constructor) {
            case Number:
              sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
              break;
            case String:
              sExpires = "; expires=" + vEnd;
              break;
            case Date:
              sExpires = "; expires=" + vEnd.toUTCString();
              break;
          }
        }
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
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
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
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
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[-.+*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
      } else {
        return localStorage.getItem(keyPrefix + sKey) === null ? false : true;
      }
    },
    _cookieKeys: function () {
      var aKeys = document.cookie.replace(/((?:^|\s*;)[^=]+)(?=;|$)|^\s*|\s*(?:=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:=[^;]*)?;\s*/);
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

  return {
    getItem: settingsStore.getItem,
    setItem: settingsStore.setItem,
    removeItem: settingsStore.removeItem,
    hasItem: settingsStore.hasItem,
    reset: reset,
    getBestAvailableStorageAPI: getBestAvailableStorageAPI
  };
});
