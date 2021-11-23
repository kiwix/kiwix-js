/**
 * service-worker.js : Service Worker implementation,
 * in order to capture the HTTP requests made by an article, and respond with the
 * corresponding content, coming from the archive
 * 
 * Copyright 2015 Mossroy and contributors
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

/**
 * App version number - ENSURE IT MATCHES VALUE IN app.js
 * DEV: Changing this will cause the browser to recognize that the Service Worker has changed, and it will
 * download and install a new copy; we have to hard code this here because it is needed before any other file
 * is cached in APP_CACHE
 */
const appVersion = '3.2.3';

/**
 * The name of the Cache API cache in which assets defined in regexpCachedContentTypes will be stored
 * The value is sometimes needed here before it can be passed from app.js, so we have to duplicate it
 * @type {String}
 */
// DEV: Ensure this matches the name defined in app.js
const ASSETS_CACHE = 'kiwixjs-assetsCache';

/**
 * The name of the application cache to use for caching online code so that it can be used offline
 * The cache name is made up of the prefix below and the appVersion: this is necessary so that when
 * the app is updated, a new cache is created. The new cache will start being used after the user
 * restarts the app, when we will also delete the old cache.
 * @type {String}
 */
 const APP_CACHE = 'kiwixjs-appCache-' + appVersion;

 /**
 * A global Boolean that governs whether ASSETS_CACHE will be used
 * Caching is on by default but can be turned off by the user in Configuration
 * @type {Boolean}
 */
var useCache = true;

/**  
 * A regular expression that matches the Content-Types of assets that may be stored in ASSETS_CACHE
 * Add any further Content-Types you wish to cache to the regexp, separated by '|'
 * @type {RegExp}
 */
var regexpCachedContentTypes = /text\/css|text\/javascript|application\/javascript/i;

/**
 * A regular expression that excludes listed schemata from caching attempts
 * As of 08-2019 the chrome-extension: schema is incompatible with the Cache API
 * 'example-extension' is included to show how to add another schema if necessary
 * @type {RegExp}
 */
var regexpExcludedURLSchema = /^(?:file|chrome-extension|example-extension):/i;

/** 
 * Pattern for ZIM file namespace: see https://wiki.openzim.org/wiki/ZIM_file_format#Namespaces
 * In our case, there is also the ZIM file name used as a prefix in the URL
 * @type {RegExp}
 */
var regexpZIMUrlWithNamespace = /(?:^|\/)([^/]+\/)([-ABCIJMUVWX])\/(.+)/;

/**
 * The list of files that the app needs in order to run entirely from offline code
 */
let precacheFiles = [
    ".", // This caches the redirect to www/index.html, in case a user launches the app from its root directory
    "manifest.json",
    "service-worker.js",
    "www/css/app.css",
    "www/css/bootstrap.css",
    "www/css/kiwixJS_invert.css",
    "www/css/kiwixJS_mwInvert.css",
    "www/css/transition.css",
    "www/img/icons/kiwix-256.png",
    "www/img/icons/kiwix-32.png",
    "www/img/icons/kiwix-60.png",
    "www/img/spinner.gif",
    "www/img/Icon_External_Link.png",
    "www/index.html",
    "www/article.html",
    "www/main.html",
    "www/js/app.js",
    "www/js/init.js",
    "www/js/lib/abstractFilesystemAccess.js",
    "www/js/lib/arrayFromPolyfill.js",
    "www/js/lib/bootstrap.bundle.js",
    "www/js/lib/filecache.js",
    "www/js/lib/jquery-3.2.1.slim.js",
    "www/js/lib/promisePolyfill.js",
    "www/js/lib/require.js",
    "www/js/lib/settingsStore.js",
    "www/js/lib/uiUtil.js",
    "www/js/lib/utf8.js",
    "www/js/lib/util.js",
    "www/js/lib/xzdec_wrapper.js",
    "www/js/lib/zstddec_wrapper.js",
    "www/js/lib/zimArchive.js",
    "www/js/lib/zimArchiveLoader.js",
    "www/js/lib/zimDirEntry.js",
    "www/js/lib/zimfile.js",
    "www/js/lib/fontawesome/fontawesome.js",
    "www/js/lib/fontawesome/solid.js",
    "www/js/lib/xzdec-asm.js",
    "www/js/lib/zstddec-asm.js",
    "www/js/lib/xzdec-wasm.js",
    "www/js/lib/xzdec-wasm.wasm",
    "www/js/lib/zstddec-wasm.js",
    "www/js/lib/zstddec-wasm.wasm"
];

// Process install event
self.addEventListener("install", function (event) {
    console.debug("[SW] Install Event processing");
    // DEV: We can't skip waiting because too many params are loaded at an early stage from the old file before the new one can activate...
    // self.skipWaiting();
    // We try to circumvent the browser's cache by adding a header to the Request
    var requests = precacheFiles.map(function (url) {
        // Ensuring all files are explicitly versioned via the querystring helps to prevent browser caching too
        return new Request(url + '?v' + appVersion, { cache: 'no-cache' });
    });
    if (!regexpExcludedURLSchema.test(requests[0].url)) event.waitUntil(
        caches.open(APP_CACHE).then(function (cache) {
            return Promise.all(
                requests.map(function (request) {
                    return fetch(request).then(function (response) {
                        // Fail on 404, 500 etc
                        if (!response.ok) throw Error('Could not fetch ' + request.url);
                        return cache.put(request.url.replace(/\?v[^?/]+$/, ''), response);
                    }).catch(function (err) {
                        console.error('There was an error pre-caching files', err);
                    });
                })
            );
        })
    );
});

// Allow sw to control current page
self.addEventListener('activate', function (event) {
    console.debug('[SW] Claiming clients for current page');
    // Check all the cache keys, and delete any old caches
    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                console.debug('[SW] Current cache key is ' + key);
                if (key !== APP_CACHE && key !== ASSETS_CACHE) {
                    console.debug('[SW] App updated to version ' + appVersion + ': deleting old cache')
                    return caches.delete(key);
                }
            }));
        })
    );
});

var outgoingMessagePort = null;
var fetchCaptureEnabled = false;

self.addEventListener('fetch', function (event) {
    // Only cache GET requests
    if (event.request.method !== "GET") return;
    // Remove any querystring before requesting from the cache
    var rqUrl = event.request.url.replace(/\?[^?]+$/i, '');
    // Select cache depending on request format
    var cache = /\.zim\//i.test(rqUrl) ? ASSETS_CACHE : APP_CACHE;
    if (cache === ASSETS_CACHE && !fetchCaptureEnabled) return;
    event.respondWith(
        // First see if the content is in the cache
        fromCache(cache, rqUrl).then(function (response) {
            // The response was found in the cache so we respond with it 
            return response;
        }, function () {
            // The response was not found in the cache so we look for it in the ZIM
            // and add it to the cache if it is an asset type (css or js)
            if (/\.zim\//i.test(rqUrl) && regexpZIMUrlWithNamespace.test(rqUrl)) {
                return fetchRequestFromZIM(event).then(function (response) {
                    // Add css or js assets to ASSETS_CACHE (or update their cache entries) unless the URL schema is not supported
                    if (regexpCachedContentTypes.test(response.headers.get('Content-Type')) &&
                        !regexpExcludedURLSchema.test(event.request.url)) {
                        event.waitUntil(updateCache(ASSETS_CACHE, event.request, response.clone()));
                    }
                    return response;
                }).catch(function (msgPortData, title) {
                    console.error('Invalid message received from app.js for ' + title, msgPortData);
                    return msgPortData;
                });
            } else {
                // It's not a ZIM URL
                return fetch(event.request).then(function (response) {
                  // If request was successful, add or update it in the cache, but be careful not to cache the ZIM archive itself!
                  if (!regexpExcludedURLSchema.test(rqUrl) && !/\.zim\w{0,2}$/i.test(rqUrl)) {
                    event.waitUntil(updateCache(APP_CACHE, event.request, response.clone()));
                  }
                  return response;
                }).catch(function (error) {
                  console.debug("[SW] Network request failed and no cache.", error);
                });
            }
        })
    );
});

self.addEventListener('message', function (event) {
    if (event.data.action) {
        if (event.data.action === 'init') {
            // On 'init' message, we initialize the outgoingMessagePort and enable the fetchEventListener
            outgoingMessagePort = event.ports[0];
            fetchCaptureEnabled = true;
        } else if (event.data.action === 'disable') {
            // On 'disable' message, we delete the outgoingMessagePort and disable the fetchEventListener
            outgoingMessagePort = null;
            fetchCaptureEnabled = false;
        }
        if (event.data.action.useCache) {
            // Turns caching on or off (a string value of 'on' turns it on, any other string turns it off)
            useCache = event.data.action.useCache === 'on';
            console.debug('[SW] Caching was turned ' + event.data.action.useCache);
        }
        if (event.data.action === 'getCacheNames') {
            event.ports[0].postMessage({ 'app': APP_CACHE, 'assets': ASSETS_CACHE });
        }
        if (event.data.action.checkCache) {
            // Checks and returns the caching strategy: checkCache key should contain a sample URL string to test
            testCacheAndCountAssets(event.data.action.checkCache).then(function (cacheArr) {
                event.ports[0].postMessage({ type: cacheArr[0], name: cacheArr[1], description: cacheArr[2], count: cacheArr[3] });
            });
        }
    }
});

/**
 * Handles fetch events that need to be extracted from the ZIM
 * 
 * @param {Event} fetchEvent The fetch event to be processed
 * @returns {Promise<Response>} A Promise for the Response, or rejects with the invalid message port data
 */
function fetchRequestFromZIM(fetchEvent) {
    return new Promise(function (resolve, reject) {
        var nameSpace;
        var title;
        var titleWithNameSpace;
        var regexpResult = regexpZIMUrlWithNamespace.exec(fetchEvent.request.url);
        var prefix = regexpResult[1];
        nameSpace = regexpResult[2];
        title = regexpResult[3];

        // We need to remove the potential parameters in the URL
        title = removeUrlParameters(decodeURIComponent(title));

        titleWithNameSpace = nameSpace + '/' + title;

        // Let's instantiate a new messageChannel, to allow app.js to give us the content
        var messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function (msgPortEvent) {
            if (msgPortEvent.data.action === 'giveContent') {
                // Content received from app.js
                var contentLength = msgPortEvent.data.content ? msgPortEvent.data.content.byteLength : null;
                var contentType = msgPortEvent.data.mimetype;
                var headers = new Headers();
                if (contentLength) headers.set('Content-Length', contentLength);
                if (contentType) headers.set('Content-Type', contentType);
                // Test if the content is a video or audio file
                // See kiwix-js #519 and openzim/zimwriterfs #113 for why we test for invalid types like "mp4" or "webm" (without "video/")
                // The full list of types produced by zimwriterfs is in https://github.com/openzim/zimwriterfs/blob/master/src/tools.cpp
                if (contentLength >= 1 && /^(video|audio)|(^|\/)(mp4|webm|og[gmv]|mpeg)$/i.test(contentType)) {
                    // In case of a video (at least), Chrome and Edge need these HTTP headers or else seeking doesn't work
                    // (even if we always send all the video content, not the requested range, until the backend supports it)
                    headers.set('Accept-Ranges', 'bytes');
                    headers.set('Content-Range', 'bytes 0-' + (contentLength - 1) + '/' + contentLength);
                }
                var responseInit = {
                    status: 200,
                    statusText: 'OK',
                    headers: headers
                };

                var httpResponse = new Response(msgPortEvent.data.content, responseInit);

                // Let's send the content back from the ServiceWorker
                resolve(httpResponse);
            } else if (msgPortEvent.data.action === 'sendRedirect') {
                resolve(Response.redirect(prefix + msgPortEvent.data.redirectUrl));
            } else {
                reject(msgPortEvent.data, titleWithNameSpace);
            }
        };
        outgoingMessagePort.postMessage({
            'action': 'askForContent',
            'title': titleWithNameSpace
        }, [messageChannel.port2]);
    });
}

/**
 * Removes parameters and anchors from a URL
 * @param {type} url The URL to be processed
 * @returns {String} The same URL without its parameters and anchors
 */
function removeUrlParameters(url) {
    return url.replace(/([^?#]+)[?#].*$/, '$1');
}

/**
 * Looks up a Request in a cache and returns a Promise for the matched Response
 * @param {String} cache The name of the cache to look in
 * @param {String} requestUrl The Request URL to fulfill from cache
 * @returns {Promise<Response>} A Promise for the cached Response, or rejects with strings 'disabled' or 'no-match'
 */
function fromCache(cache, requestUrl) {
    // Prevents use of Cache API if user has disabled it
    if (!useCache && cache === ASSETS_CACHE) return Promise.reject('disabled');
    return caches.open(cache).then(function (cacheObj) {
        return cacheObj.match(requestUrl).then(function (matching) {
            if (!matching || matching.status === 404) {
                return Promise.reject('no-match');
            }
            console.debug('[SW] Supplying ' + requestUrl + ' from ' + cache + '...');
            return matching;
        });
    });
}

/**
 * Stores or updates in a cache the given Request/Response pair
 * @param {String} cache The name of the cache to open
 * @param {Request} request The original Request object
 * @param {Response} response The Response received from the server/ZIM
 * @returns {Promise} A Promise for the update action
 */
function updateCache(cache, request, response) {
    // Prevents use of Cache API if user has disabled it
    if (!useCache && cache === ASSETS_CACHE) return Promise.resolve();
    return caches.open(cache).then(function (cacheObj) {
        console.debug('[SW] Adding ' + request.url + ' to ' + cache + '...');
        return cacheObj.put(request, response);
    });
}

/**
 * Tests the caching strategy available to this app and if it is Cache API, count the
 * number of assets in ASSETS_CACHE
 * @param {String} url A URL to test against excludedURLSchema
 * @returns {Promise<Array>} A Promise for an array of format [cacheType, cacheDescription, assetCount]
 */
function testCacheAndCountAssets(url) {
    if (regexpExcludedURLSchema.test(url)) return Promise.resolve(['custom', 'Custom', '-']);
    if (!useCache) return Promise.resolve(['none', 'none', 'None', 0]);
    return caches.open(ASSETS_CACHE).then(function (cache) {
        return cache.keys().then(function (keys) {
            return ['cacheAPI', ASSETS_CACHE, 'Cache API', keys.length];
        }).catch(function(err) {
            return err;
        });
    }).catch(function(err) {
        return err;
    });
}
