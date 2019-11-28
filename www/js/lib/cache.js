/**
 * cache.js : Provide a cache for assets from the ZIM archive using indexedDB, localStorage or memory cache
 * 
 * Copyright 2018 Mossroy, Jaifroid and contributors
 * License GPL v3:
 * 
 * This file is part of Kiwix.
 * 
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */

'use strict';
define(['q', 'uiUtil'], function(Q, uiUtil) {

    var CACHE_NAME = 'kiwixjs-assetCache'; // Set the database or cache name here
    var objStore = 'Assets'; // Name of the object store
    
    // DEV: Regex below defines the permitted key types for the cache; add further types as needed
    // NB: The key type of '.zim', or '.zimaa' (etc.) is used to store a ZIM's last-accessed article 
    var regexpKeyTypes = /(?:(?:^|\/)A\/.+|\.[Jj][Ss]|\.[Cc][Ss][Ss]|\.[Zz][Ii][Mm]\w{0,2})$/;

    /** 
     * Tests the enviornment's caching capabilities and sets assetsCache.capability to the supported level
     * 
     * @param {Function} callback Function to indicate that the capability level has been set
     */
    function test(callback) {
        // Test for indexedDB capability
        if (typeof assetsCache.capability !== 'undefined') {
            callback(true);
            return;
        }
        // Set baseline capability
        assetsCache.capability = 'memory'; 
        idxDB('count', function(result) {
            if (result !== false) {
                assetsCache.capability = 'indexedDB|' + assetsCache.capability;
            } else {
                console.log("inexedDB is not supported");
            }
            // Test for Cache API
            if('caches' in window && /https?:/i.test(window.location.protocol)) {
                assetsCache.capability = 'cacheAPI|' + assetsCache.capability;
                console.log('Cache API is available, but in development in this app');
            } else {
                console.log('CacheAPI is not supported' + (/https?:/i.test(window.location.protocol) ? '' : 
                    ' with the ' + window.location.protocol + ' protocol'));
            }
            // Test for localCache capability (this is a fallback, indexedDB is preferred because it permits more storage)
            if (typeof Storage !== "undefined") {
                try {
                    // If localStorage is really supported, this won't produce an error
                    var item = window.localStorage.length;
                    assetsCache.capability = assetsCache.capability + '|localStorage';
                } catch (err) {
                    console.log("localStorage is not supported");
                }
            }
            console.log('Setting storage type to ' + assetsCache.capability.match(/^[^|]+/)[0]);
            if (/localStorage/.test(assetsCache.capability)) {
                console.log("DEV: 'UnknownError' may be produced as part of localStorage capability detection");
            }
            callback(result);
        });
    }

    /**
     * Counts the numnber of cached assets
     * 
     * @param {Function} callback which will receive an array containing [cacheType, cacheCount]
     */
    function count(callback) {
        test(function(result) {
            var type = null;
            var description = null;
            var cacheCount = null;
            switch (assetsCache.capability.match(/^[^|]+/)[0]) {
                case 'memory':
                    type = 'memory';
                    description = 'Memory';
                    cacheCount = assetsCache.size;
                    break;
                case 'localStorage':
                    type = 'localStorage';
                    description = 'LocalStorage';
                    cacheCount = localStorage.length;
                    break;
                case 'indexedDB':
                    type = 'indexedDB';
                    description = 'IndexedDB';
                    // Sometimes we already have the count as a result of test, so no need to look again
                    if (typeof result !== 'boolean' && (result === 0 || result > 0)) { 
                        cacheCount = result;
                    } else {
                        idxDB('count', function(cacheCount) {
                            callback({'type': type, 'description': description, 'count': cacheCount});
                        });
                    }
                    break;
                case 'cacheAPI':
                    type = 'cacheAPI';
                    description = 'CacheAPI';
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.keys().then(function (keys) {
                            callback({'type': type, 'description': description, 'count': keys.length});
                        });
                    });
                    break;
                default:
                    // User has turned off caching
                    type = 'none';
                    description = 'None';
                    cacheCount = 'null';
            }
            if (cacheCount || cacheCount === 0) {
                callback({'type': type, 'description': description, 'count': cacheCount});
            }
        });
    } 

    /**
     * Opens an IndexedDB database and adds or retrieves a key-value pair to it, or performs utility commands
     * on the database
     * 
     * @param {String} keyOrCommand The key of the value to be written or read, or commands 'clear' (clears objStore),
     *     'count' (counts number of objects in objStore), 'delete' (deletes a record with key passed in valueOrCallback)         
     * @param {Variable} valueOrCallback The value to write, or a callback function for read and command transactions
     * @param {Function} callback Callback for write transactions only
     */
    function idxDB(keyOrCommand, valueOrCallback, callback) {
        var value = callback ? valueOrCallback : null;
        var rtnFn = callback || valueOrCallback;
        if (typeof window.indexedDB === 'undefined') {
            rtnFn(false);
            return;
        } 
        
        // Open (or create) the database
        var open = indexedDB.open(CACHE_NAME, 1);

        open.onerror = function(e) {
            // Suppress error reporting if testing (older versions of Firefox support indexedDB but cannot use it with
            // the file:// protocol, so will report an error)
            if (assetsCache.capability !== 'test') {
                console.error('IndexedDB failed to open: ' + open.error.message);
            }
            rtnFn(false);
        };
        
        // Create the schema
        open.onupgradeneeded = function() {
            var db = open.result;
            var store = db.createObjectStore(objStore);
        };

        open.onsuccess = function() {
            // Start a new transaction
            var db = open.result;
            
            // Set the store to readwrite or read only according to presence or not of value variable
            var tx = value !== null || keyOrCommand === 'clear' ? db.transaction(objStore, "readwrite") : db.transaction(objStore);
            var store = tx.objectStore(objStore);
            
            var processData;
            // Process commands
            if (keyOrCommand === 'clear') {
                // Delete all keys and values in the store
                processData = store.clear();
            } else if (keyOrCommand === 'count') {
                // Count the objects in the store
                processData = store.count();
            } else if (keyOrCommand === 'delete') {
                // Delete the record with key set to value
                processData = store.delete(value);
            } else {
                // Request addition or retrieval of data
                processData = value !== null ? store.put(value, keyOrCommand) : store.get(keyOrCommand);
            }
            // Call the callback with the result
            processData.onsuccess = function(e) {
                if (keyOrCommand === 'delete') {
                    rtnFn(true);
                } else {
                    rtnFn(processData.result);
                }
            };
            processData.onerror = function(e){
                console.error('IndexedDB command failed: ' + processData.error);
                rtnFn(false);
            };

            // Close the db when the transaction is done
            tx.oncomplete = function() {
                db.close();
            };
        };
    }

    /**
     * Opens a CacheAPI cache and adds or retrieves a key-value pair to it, or performs utility commands
     * on the cache. This interface also allows the use of callbacks inside the Cache Promise API for ease of
     * interoperability with the interface for idxDB code above.
     * 
     * @param {String} keyOrCommand The key of the value to be written or read, or commands 'clear' (clears cache),
     *     'delete' (deletes a record with key passed in valueOrCallback)         
     * @param {Variable} valueOrCallback The value to write, or a callback function for read and command transactions
     * @param {Function} callback Callback for write transactions only
     */
    function cacheAPI(keyOrCommand, valueOrCallback, callback) {
        var value = callback ? valueOrCallback : null;
        var rtnFn = callback || valueOrCallback;
        // Process commands
        if (keyOrCommand === 'clear') {
            caches.delete(CACHE_NAME).then(rtnFn);
        } else if (keyOrCommand === 'delete') {
            caches.open(CACHE_NAME).then(function(cache) {
                cache.delete(value).then(rtnFn);
            });
        } else if (value === null) {
            // Request retrieval of data
            caches.open(CACHE_NAME).then(function(cache) {
                cache.match('../' + keyOrCommand).then(function(response) {
                    if (!response) {
                        rtnFn(null);
                    } else {
                        response.text().then(function(data) {
                            rtnFn(data);
                        });
                    }
                }).catch(function(err) {
                    console.error('Unable to match assets from Cache API!', err);
                    rtnFn(null);
                });
            });
        } else {
            // Request storing of data in cache
            caches.open(CACHE_NAME).then(function(cache) {
                // Construct a Response from value
                var response = new Response(value);
                cache.put('../' + keyOrCommand, response).then(function() {
                    rtnFn(true);
                }).catch(function(err) {
                    console.error('Unable to store assets in Cache API!', err);
                    rtnFn(null);
                });
            });
        }
    }
    
    /**
     * Stores information about the last visited page in a cookie and, if available, in localStorage or indexedDB
     * 
     * @param {String} zimFile The filename (or name of first file in set) of the ZIM archive
     * @param {String} article The URL of the article (including namespace)
     * @param {String} content The content of the page to be stored
     * @param {Function} callback Callback function to report the outcome of the operation
     */
    function setArticle(zimFile, article, content, callback) {
        // Prevent storage if user has deselected the option in Configuration
        if (/rememberLastPage=false\b/i.test(document.cookie)) {
            callback(-1);
            return;
        }
        document.cookie = zimFile + '=' + encodeURIComponent(article) + ';expires=Fri, 31 Dec 9999 23:59:59 GMT';
        setItem(zimFile, content, function(response) {
            callback(response);
        });
    }
    
    /**
     * Retrieves article contents from cache only if the article's key has been stored in cookie
     * (since checking the cookie is synchronous, it prevents unnecessary async cache lookups)
     * 
     * @param {String} zimFile The filename (or name of first file in set) of the ZIM archive
     * @param {String} article The URL of the article to be retrieved (including namespace)
     * @param {Function} callback The function to call with the result
     */
    function getArticle(zimFile, article, callback) {
        var encodedTitle = encodeURIComponent(article);
        if (~document.cookie.indexOf(zimFile + '=' + encodedTitle)) {
            getItem(zimFile, callback);
        } else {
            callback(false);
        }
    }
  
    /**
     * Caches the contents of an asset in memory or local storage
     * 
     * @param {String} key The database key of the asset to cache
     * @param {String} contents The file contents to be stored in the cache
     * @param {Function} callback Callback function to report outcome of operation
     */
    function setItem(key, contents, callback) {
        // Prevent use of storage if user has deselected the option in Configuration
        // or if the asset is of the wrong type
        if (/useCache=false\b/i.test(document.cookie) || !regexpKeyTypes.test(key)) {
            callback(-1);
            return;
        }
        // Check if we're actually setting an article 
        var keyArticle = key.match(/([^/]+)\/(A\/.+$)/);
        if (keyArticle) { // We're setting an article, so go to setArticle function
            setArticle(keyArticle[1], keyArticle[2], contents, callback);
            return;
        }
        // Post a message to the UI that we are caching an asset
        var shortTitle = key.replace(/[^/]+\//g, '').substring(0, 18);
        document.getElementById('cachingAssets').innerHTML = 'Caching ' + shortTitle + '...';
        if (/^localStorage/.test(assetsCache.capability)) {
            localStorage.setItem(key, contents);
        } else {
            assetsCache.set(key, contents);
        }
        if (/^indexedDB/.test(assetsCache.capability)) {
            idxDB(key, contents, function(result) {
                callback(result);
            });
        } else if (/^cacheAPI/.test(assetsCache.capability)) {
            cacheAPI(key, contents, function(result) {
                callback(result);
            });
        } else {
            callback(key);
        }
    }
    
    /**
     * Retrieves a ZIM file asset that has been cached with the addItem function 
     * either from the memory cache or local storage
     * 
     * @param {String} key The database key of the asset to retrieve
     * @param {Function} callback The function to call with the result
     */
    function getItem(key, callback) {
        // Only look up assets of the type stored in the cache
        if (!regexpKeyTypes.test(key)) {
            callback(false);
            return;
        }
        // Check if we're actually calling an article 
        // DEV: See above about this regex (may need expanding)
        var keyArticle = key.match(/([^/]+)\/(A\/.+$)/);
        if (keyArticle) { // We're retrieving an article, so go to getArticle function
            getArticle(keyArticle[1], keyArticle[2], callback);
            return;
        }
        var contents = null;
        if (assetsCache.has(key)) {
            contents = assetsCache.get(key);
            callback(contents);
        } else if (/^localStorage/.test(assetsCache.capability)) {
            contents = localStorage.getItem(key);
            callback(contents);
        } else if (/^cacheAPI/.test(assetsCache.capability)) {
            cacheAPI(key, function(contents) {
                callback(contents);      
            });
        } else if (/^indexedDB/.test(assetsCache.capability)) {
            idxDB(key, function(contents) {
                if (typeof contents !== 'undefined') {
                    // Also store in fast memory cache to prevent repaints
                    assetsCache.set(key, contents);
                }
                callback(contents);
            });
        } else {
            callback(contents);
        } 
    }

    /**
     * Gets an item from the cache, or extracts it from the ZIM if it is not cached. After extracting
     * an item from the ZIM, it is added to the cache if it is of the type specified in regexpKeyTypes.
     * 
     * @param {Object} selectedArchive The ZIM archive picked by the user 
     * @param {String} key The cache key of the item to retrieve 
     * @param {Function} callback A function to call with the result 
     * @param {Object} dirEntry If the item's dirEntry has already been looked up, it can optionally be
     *   supplied here (saves a redundant dirEntry lookup) 
     */
    function getItemFromCacheOrZIM(selectedArchive, key, callback, dirEntry) {
        // First check if the item is already in the cache
        var title = key.replace(/^[^/]+\//, '');
        getItem(key, function(result) {
            if (result !== null && result !== false && typeof result !== 'undefined') {
                console.log("Cache supplied " + title);
                if (/\.css$/.test(title)) {
                    assetsCache.cssLoading--;
                    if (assetsCache.cssLoading <= 0) {
                        document.getElementById('articleContent').style.display = 'block';
                        document.getElementById('cachingAssets').style.display = 'none';
                        document.getElementById('searchingArticles').style.display = 'none';
                    }                
                }
                callback(result);
                return;
            }
            // Since there was no result, post UI messages and look up asset in ZIM
            if (regexpKeyTypes.test(key)) {
                if (!/\.css$|\.js$/.test(key)) {
                    document.getElementById('cachingAssets').style.display = 'none';
                    document.getElementById('searchingArticles').style.display = 'block';
                } else if (/useCache=true\b/i.test(document.cookie)) {
                    var shortTitle = key.replace(/[^/]+\//g, '').substring(0, 18);
                    document.getElementById('cachingAssets').innerHTML = 'Getting ' + shortTitle + '...';
                    document.getElementById('cachingAssets').style.display = 'block';
                }
            }
            // Set the read function to use according to filetype
            var readFile = regexpKeyTypes.test(title) ? 
                selectedArchive.readUtf8File : selectedArchive.readBinaryFile;
            // Bypass getting dirEntry if we already have it
            var getDirEntry = dirEntry ? Q.Promise.resolve() :
                selectedArchive.getDirEntryByTitle(title);
            // Read data from ZIM
            getDirEntry.then(function(resolvedDirEntry) {
                if (dirEntry) resolvedDirEntry = dirEntry;
                if (resolvedDirEntry === null) {
                    console.log("Error: asset file not found: " + title);
                    callback();
                } else {
                    readFile(resolvedDirEntry, function (fileDirEntry, content) {
                        if (regexpKeyTypes.test(title)) {
                            console.log('Cache retrieved ' + title + ' from ZIM');
                            // Process any pre-cache transforms
                            content = transform(content, title.replace(/^.*\.([^.]+)$/, '$1'));
                        }
                        // Hide article while it is rendering
                        if (/^text\/html$/.test(fileDirEntry.getMimetype())) {
                            // Count CSS so we can attempt to show article before JS/images are fully loaded
                            var cssCount = content.match(/<(?:link)[^>]+?href=["']([^"']+)[^>]+>/ig);
                            assetsCache.cssLoading = cssCount ? cssCount.length : 0;
                            if (assetsCache.cssLoading) document.getElementById('articleContent').style.display = 'none';
                        }
                        if (/\.css$/.test(title)) {
                            assetsCache.cssLoading--;
                            if (assetsCache.cssLoading <= 0) {
                                document.getElementById('articleContent').style.display = 'block';
                                document.getElementById('cachingAssets').style.display = 'none';
                                document.getElementById('searchingArticles').style.display = 'none';
                            }
                        }
                        callback(content);
                        setItem(key, content, function(result) {
                            if (result === -1) {
                                // Cache rejected item due to user settings
                            } else if (result) {
                                console.log('Cache: stored asset ' + title);
                            } else {
                                console.error('Cache: failed to store asset ' + title);
                            }
                        });
                    });
                }
            }).fail(function (e) {
                console.error("could not find DirEntry for asset : " + title, e);
                callback();              
            });
        });
    }

    /**
     * Clears caches (including cookie) according to the scope represented by the 'items' variable
     * 
     * @param {String} items Either 'lastpages' (last visited pages of various archives) or 'all'
     * @param {Function} callback Callback function to report the number of items cleared
     */
    function clear(items, callback) {
        if (!/lastpages|all/.test(items)) {
            callback(false);
            return;
        }    
        // Delete cookie entries with a key containing '.zim' or '.zimaa' etc. followed by article namespace
        var itemsCount = 0;
        var key;
        var capability = assetsCache.capability;
        var zimRegExp = /(?:^|;)\s*([^=]+)=([^;]*)/ig;
        var currentCookies = document.cookie;
        var cookieCrumb = zimRegExp.exec(currentCookies);
        while (cookieCrumb !== null) {
            if (/\.zim\w{0,2}=A\//i.test(decodeURIComponent(cookieCrumb[0]))) {
                key = cookieCrumb[1];
                // This expiry date will cause the browser to delete the cookie on next page refresh
                document.cookie = key + '=;expires=Thu, 21 Sep 1979 00:00:01 UTC;';
                if (items === 'lastpages') {
                    assetsCache.delete(key);
                    // See note on loose test below
                    if (/localStorage/.test(capability)) {
                        localStorage.removeItem(key);
                    }
                    if (/indexedDB/.test(capability)) {
                        idxDB('delete', key, function(){});
                    }
                    if (/cacheAPI/.test(capability)) {
                        cacheAPI('delete', key, function(){});
                    }
                    itemsCount++;
                }
            }
            cookieCrumb = zimRegExp.exec(currentCookies);
        }
        if (items === 'all') {
            var result;
            if (/^(memory|indexedDB|cacheAPI)/.test(capability)) {
                itemsCount += assetsCache.size;
                result = "assetsCache";
            }
            // Delete and reinitialize assetsCache
            assetsCache = new Map();
            assetsCache.capability = capability;
            // Loose test here ensures we clear localStorage even if it wasn't being used in this session
            if (/localStorage/.test(capability)) {
                itemsCount += localStorage.length;
                localStorage.clear();
                result = result ? result + " and localStorage" : "localStorage";
            }
            // Loose test here ensures we clear indexedDB even if it wasn't being used in this session
            if (/indexedDB/.test(capability)) {
                result = result ? result + " and indexedDB" : "indexedDB";
                idxDB('count', function(number) {
                    itemsCount += number;
                    idxDB('clear', function() {
                        result = result ? result + " (" + itemsCount + " items deleted)" : "no assets to delete";
                        console.log("cache.clear: " + result);
                        if (!/^cacheAPI/.test(capability)) callback(itemsCount);
                    });
                });
            }
            // No need to use loose test here because cacheAPI trumps the others
            if (/^cacheAPI/.test(capability)) {
                result = result ? result + " and cacheAPI" : "cacheAPI";
                count(function(number) {
                    itemsCount += number[1];
                    cacheAPI('clear', function() {
                        result = result ? result + " (" + itemsCount + " items deleted)" : "no assets to delete";
                        console.log("cache.clear: " + result);
                        callback(itemsCount);
                    });
                });
            }
        }
        if (!/^cacheAPI|indexedDB/.test(capability)) {
            result = result ? result + " (" + itemsCount + " items deleted)" : "no assets to delete";
            console.log("cache.clear: " + result);
            callback(itemsCount);
        }
    }

    /**
     * Replaces all assets that have the given attribute in the html string with inline tags containing content
     * from the cache entries corresponding to the given zimFile
     * Function is intended for link or script tags, but could be extended
     * Returns the substituted html in the callback function (even if no substitutions were made)
     * 
     * @param {String} html The html string to process
     * @param {String} tags The html tag or tags ('link|script') containing the asset to replace;
     *  multiple tags must be separated with a pipe
     * @param {String} attribute The attribute that stores the URL to be substituted
     * @param {String} zimFile The name of the ZIM file (or first file in the file set)
     * @param {Object} selectedArchive The archive selected by the user in app.js
     * @param {Function} callback The function to call with the substituted html
     */
    function replaceAssetRefsWithUri(html, tags, attribute, zimFile, selectedArchive, callback) {
        // Creates an array of all link tags that have the given attribute
        var regexpTagsWithAttribute = new RegExp('<(?:' + tags + ')[^>]+?' + attribute + '=["\']([^"\']+)[^>]+>', 'ig');
        var titles = [];
        var tagArray = regexpTagsWithAttribute.exec(html);
        while (tagArray !== null) {
            titles.push([tagArray[0], 
                decodeURIComponent(tagArray[1])]);
            tagArray = regexpTagsWithAttribute.exec(html);
        }
        if (!titles.length) {
            callback(html);
        }
        // Iterate through the erray of titles, populating the HTML string with substituted tags containing
        // a reference to the content from the Cache or from the ZIM
        assetsCache.busy = titles.length;
        titles.forEach(function(title) {
            getItemFromCacheOrZIM(selectedArchive, zimFile + '/' + title[1], function(assetContent) {
                assetsCache.busy--;
                if (assetContent || assetContent === '') {
                    var newAssetTag = uiUtil.createNewAssetElement(title[0], attribute, assetContent);
                    html = html.replace(title[0], newAssetTag);
                }
                if (!assetsCache.busy) callback(html);
            });
        });
    }

    /**
     * Provides "Server Side" transformation of textual content "served" to app.js
     * For performance reasons, this is only hooked into content extracted from the ZIM: the transformed
     * content will then be cached in its transformed state
     * 
     * @param {String} string The string to transform
     * @param {String} filter An optional filter: only transforms which match the filter will be executed
     * @returns {String} The tranformed content
     */
    function transform(string, filter) {
        switch(filter) {
            case 'html':

                // Filter to remove any BOM (causes quirks mode in browser)
                string = string.replace(/^[^<]*/, '');

                // Filter to open all heading sections
                string = string.replace(/(class=["'][^"']*?collapsible-(?:heading|block)(?!\s+open-block))/g,
                    '$1 open-block');
            
            break;
        }
        return string;
    }

    /** 
     * Wraps a semaphor in a Promise. A function can signal that it is done by setting a sempahor to true, 
     * if it has first set it to false at the outset of the procedure. Ensure no other functions use the same
     * sempahor. The semaphor must be an object key of the app-wide assetsCache object. 
     * 
     * @param {String} semaphor The name of a semaphor key in the assetsCache object
     * @param {String|Object} value An optional value or object to pass in the resolved promise
     * @returns {Promise} A promise that resolves when assetsCache[semaphor] is true    
     */  
    function wait(semaphor, value) {
        var p = Q.Promise(function (resolve) {
            setTimeout(function awaitCache() {
                if (assetsCache[semaphor]) {
                    return resolve(value);
                }
                setTimeout(awaitCache, 300);
            }, 0);
        });
        return p;
    }
    
    // Alternative, less compact implementation?
    // function wait(semaphor, value) {
    //     return new Promise(function(resolve){
    //         var timer;
    //         function awaitCache() {
    //             clearTimeout(timer);
    //             if (assetsCache[semaphor]) {
    //                 return resolve(value);
    //             } else {
    //                 timer = setTimeout(awaitCache, 300);
    //             }
    //         }
    //         awaitCache();
    //     });
    // }

    /**
     * Functions and classes exposed by this module
     */
    return {
        test: test,
        count: count,
        setArticle: setArticle,
        getArticle: getArticle,
        setItem: setItem,
        getItem: getItem,
        clear: clear,
        wait: wait,
        getItemFromCacheOrZIM: getItemFromCacheOrZIM,
        replaceAssetRefsWithUri: replaceAssetRefsWithUri
    };
});