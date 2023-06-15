/**
 * service-worker.js : Service Worker implementation,
 * in order to capture the HTTP requests made by an article, and respond with the
 * corresponding content, coming from the archive
 *
 * Copyright 2022 Mossroy, Jaifroid and contributors
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

/* global chrome */

/**
 * App version number - ENSURE IT MATCHES VALUE IN app.js
 * DEV: Changing this will cause the browser to recognize that the Service Worker has changed, and it will
 * download and install a new copy; we have to hard code this here because it is needed before any other file
 * is cached in APP_CACHE
 */
const appVersion = '3.8.1';

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
var useAssetsCache = true;

/**
 * A global Boolean that governs whether the APP_CACHE will be used
 * This is an expert setting in Configuration
 * @type {Boolean}
 */
var useAppCache = true;

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
const regexpZIMUrlWithNamespace = /(?:^|\/)([^/]+\/)([-ABCIJMUVWX])\/(.+)/;

/**
 * Pattern to parse the first offset of a "range" request header
 * NB: this only reads the first offset of the first byte range, where the spec allows several ranges, and several units.
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range
 * But, in our case, we send a header to tell the browser we only accept the bytes unit.
 * I did not see multiple ranges asked by a browser.
 *
 * @type {RegExp}
 */
const regexpByteRangeHeader = /^\s*bytes=(\d+)-/;

/**
 * The list of files that the app needs in order to run entirely from offline code
 */
const precacheFiles = [
    '.', // This caches the redirect to www/index.html, in case a user launches the app from its root directory
    'manifest.json',
    'service-worker.js',
    'www/css/app.css',
    'www/css/bootstrap.css',
    'www/css/kiwixJS_invert.css',
    'www/css/kiwixJS_mwInvert.css',
    'www/css/transition.css',
    'www/img/icons/kiwix-256.png',
    'www/img/icons/kiwix-32.png',
    'www/img/icons/kiwix-60.png',
    'www/img/spinner.gif',
    'www/img/Icon_External_Link.png',
    'www/index.html',
    'www/article.html',
    'www/main.html',
    'www/js/app.js',
    'www/js/init.js',
    'www/js/lib/abstractFilesystemAccess.js',
    'www/js/lib/arrayFromPolyfill.js',
    'www/js/lib/bootstrap.bundle.js',
    'www/js/lib/filecache.js',
    'www/js/lib/jquery-3.7.0.slim.min.js',
    'www/js/lib/promisePolyfill.js',
    'www/js/lib/require.js',
    'www/js/lib/settingsStore.js',
    'www/js/lib/uiUtil.js',
    'www/js/lib/utf8.js',
    'www/js/lib/util.js',
    'www/js/lib/xzdec_wrapper.js',
    'www/js/lib/zstddec_wrapper.js',
    'www/js/lib/zimArchive.js',
    'www/js/lib/zimArchiveLoader.js',
    'www/js/lib/zimDirEntry.js',
    'www/js/lib/zimfile.js',
    'www/js/lib/fontawesome/fontawesome.js',
    'www/js/lib/fontawesome/solid.js'
];

if ('WebAssembly' in self) {
    precacheFiles.push(
        'www/js/lib/xzdec-wasm.js',
        'www/js/lib/xzdec-wasm.wasm',
        'www/js/lib/zstddec-wasm.js',
        'www/js/lib/zstddec-wasm.wasm',
        'www/js/lib/libzim-wasm.js',
        'www/js/lib/libzim-wasm.wasm'
    );
} else {
    precacheFiles.push(
        'www/js/lib/xzdec-asm.js',
        'www/js/lib/zstddec-asm.js',
        'www/js/lib/libzim-asm.js'
    );
}

/**
 * If we're in a Chromium extension, add a listener to launch the tab when the icon is clicked
 */
if (typeof chrome !== 'undefined' && chrome.action) {
    chrome.action.onClicked.addListener(function () {
        var newURL = chrome.runtime.getURL('www/index.html');
        chrome.tabs.create({ url: newURL });
    });
}

// Process install event
self.addEventListener('install', function (event) {
    console.debug('[SW] Install Event processing');
    // DEV: We can't skip waiting because too many params are loaded at an early stage from the old file before the new one can activate...
    // self.skipWaiting();
    // We try to circumvent the browser's cache by adding a header to the Request, and it ensures all files are explicitly versioned
    var requests = precacheFiles.map(function (urlPath) {
        return new Request(urlPath + '?v' + appVersion, { cache: 'no-cache' });
    });
    if (!regexpExcludedURLSchema.test(requests[0].url)) {
        event.waitUntil(caches.open(APP_CACHE).then(function (cache) {
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
        }));
    }
});

// Allow sw to control current page
self.addEventListener('activate', function (event) {
    // "Claiming" the ServiceWorker is necessary to make it work right away,
    // without the need to reload the page.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim
    event.waitUntil(self.clients.claim());
    console.debug('[SW] Claiming clients for current page');
    // Check all the cache keys, and delete any old caches
    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                console.debug('[SW] Current cache key is ' + key);
                if (key !== APP_CACHE && key !== ASSETS_CACHE) {
                    console.debug('[SW] App updated to version ' + appVersion + ': deleting old cache');
                    return caches.delete(key);
                }
            }));
        })
    );
});

let outgoingMessagePort = null;
let fetchCaptureEnabled = false;

/**
 * Intercept selected Fetch requests from the browser window
 */
self.addEventListener('fetch', function (event) {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;
    var rqUrl = event.request.url;
    var urlObject = new URL(rqUrl);
    // Test the URL with parameters removed
    var strippedUrl = urlObject.pathname;
    // Select cache depending on request format
    var cache = /\.zim\//i.test(strippedUrl) ? ASSETS_CACHE : APP_CACHE;
    if (cache === ASSETS_CACHE && !fetchCaptureEnabled) return;
    // For APP_CACHE assets, we should ignore any querystring (whereas it should be conserved for ZIM assets,
    // especially .js assets, where it may be significant). Anchor targets are irreleveant in this context.
    if (cache === APP_CACHE) rqUrl = strippedUrl;
    event.respondWith(
        // First see if the content is in the cache
        fromCache(cache, rqUrl).then(function (response) {
            // The response was found in the cache so we respond with it
            return response;
        }, function () {
            // The response was not found in the cache so we look for it in the ZIM
            // and add it to the cache if it is an asset type (css or js)
            if (cache === ASSETS_CACHE && regexpZIMUrlWithNamespace.test(strippedUrl)) {
                const range = event.request.headers.get('range');
                return fetchUrlFromZIM(urlObject, range).then(function (response) {
                    // Add css or js assets to ASSETS_CACHE (or update their cache entries) unless the URL schema is not supported
                    if (regexpCachedContentTypes.test(response.headers.get('Content-Type')) &&
                        !regexpExcludedURLSchema.test(event.request.url)) {
                        event.waitUntil(updateCache(ASSETS_CACHE, rqUrl, response.clone()));
                    }
                    return response;
                }).catch(function (msgPortData) {
                    console.error('Invalid message received from app.js for ' + strippedUrl, msgPortData);
                    return msgPortData;
                });
            } else {
                // It's not an asset, or it doesn't match a ZIM URL pattern, so we should fetch it with Fetch API
                return fetch(event.request).then(function (response) {
                    // If request was successful, add or update it in the cache, but be careful not to cache the ZIM archive itself!
                    if (!regexpExcludedURLSchema.test(event.request.url) && !/\.zim\w{0,2}$/i.test(strippedUrl)) {
                        event.waitUntil(updateCache(APP_CACHE, rqUrl, response.clone()));
                    }
                    return response;
                }).catch(function (error) {
                    console.debug('[SW] Network request failed and no cache.', error);
                });
            }
        })
    );
});

/**
 * Handle custom commands sent from app.js
 */
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
        var oldValue;
        if (event.data.action.assetsCache) {
            // Turns caching on or off (a string value of 'enable' turns it on, any other string turns it off)
            oldValue = useAssetsCache;
            useAssetsCache = event.data.action.assetsCache === 'enable';
            if (useAssetsCache !== oldValue) console.debug('[SW] Use of assetsCache was switched to: ' + useAssetsCache);
        }
        if (event.data.action.appCache) {
            // Enables or disables use of appCache
            oldValue = useAppCache;
            useAppCache = event.data.action.appCache === 'enable';
            if (useAppCache !== oldValue) console.debug('[SW] Use of appCache was switched to: ' + useAppCache);
        }
        if (event.data.action === 'getCacheNames') {
            event.ports[0].postMessage({ app: APP_CACHE, assets: ASSETS_CACHE });
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
 * Handles URLs that need to be extracted from the ZIM archive
 *
 * @param {URL} urlObject The URL object to be processed for extraction from the ZIM
 * @param {String} range Optional byte range string
 * @returns {Promise<Response>} A Promise for the Response, or rejects with the invalid message port data
 */
function fetchUrlFromZIM (urlObject, range) {
    return new Promise(function (resolve, reject) {
        // Note that titles may contain bare question marks or hashes, so we must use only the pathname without any URL parameters.
        // Be sure that you haven't encoded any querystring along with the URL.
        var barePathname = decodeURIComponent(urlObject.pathname);
        var partsOfZIMUrl = regexpZIMUrlWithNamespace.exec(barePathname);
        var prefix = partsOfZIMUrl[1];
        var nameSpace = partsOfZIMUrl[2];
        var title = partsOfZIMUrl[3];

        var titleWithNameSpace = nameSpace + '/' + title;

        // Let's instantiate a new messageChannel, to allow app.js to give us the content
        var messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function (msgPortEvent) {
            if (msgPortEvent.data.action === 'giveContent') {
                // Content received from app.js
                var contentLength = msgPortEvent.data.content ? (msgPortEvent.data.content.byteLength || msgPortEvent.data.content.length) : null;
                var contentType = msgPortEvent.data.mimetype;
                var headers = new Headers();
                if (contentLength) headers.set('Content-Length', contentLength);
                // Set Content-Security-Policy to sandbox the content (prevent XSS attacks from malicious ZIMs)
                headers.set('Content-Security-Policy', "default-src 'self' data: blob: about: chrome-extension: moz-extension: https://browser-extension.kiwix.org https://kiwix.github.io 'unsafe-inline' 'unsafe-eval'; sandbox allow-scripts allow-same-origin allow-modals allow-popups allow-forms allow-downloads;");
                headers.set('Referrer-Policy', 'no-referrer');
                if (contentType) headers.set('Content-Type', contentType);

                // Test if the content is a video or audio file. In this case, Chrome & Edge need us to support ranges.
                // See kiwix-js #519 and openzim/zimwriterfs #113 for why we test for invalid types like "mp4" or "webm" (without "video/")
                // The full list of types produced by zimwriterfs is in https://github.com/openzim/zimwriterfs/blob/master/src/tools.cpp
                if (contentLength >= 1 && /^(video|audio)|(^|\/)(mp4|webm|og[gmv]|mpeg)$/i.test(contentType)) {
                    headers.set('Accept-Ranges', 'bytes');
                }

                var slicedData = msgPortEvent.data.content;
                if (range) {
                    // The browser asks for a range of bytes (usually for a video or audio stream)
                    // In this case, we partially honor the request: if it asks for offsets x to y,
                    // we send partial contents starting at x offset, till the end of the data (ignoring y offset)
                    // Our backend can currently only read the whole content from the ZIM file.
                    // So it's probably better to send all we have: hopefully it will avoid some subsequent requests of
                    // the browser to get the following chunks (which would trigger some other complete reads in the ZIM file)
                    // This might be improved in the future with the libzim wasm backend, that should be able to handle ranges.
                    const partsOfRangeHeader = regexpByteRangeHeader.exec(range);
                    const begin = partsOfRangeHeader[1];
                    const end = contentLength - 1;
                    slicedData = slicedData.slice(begin);

                    headers.set('Content-Range', 'bytes ' + begin + '-' + end + '/' + contentLength);
                    headers.set('Content-Length', end - begin + 1);
                }

                var responseInit = {
                    // HTTP status is usually 200, but has to bee 206 when partial content (range) is sent
                    status: range ? 206 : 200,
                    statusText: 'OK',
                    headers
                };

                var httpResponse = new Response(slicedData, responseInit);

                // Let's send the content back from the ServiceWorker
                resolve(httpResponse);
            } else if (msgPortEvent.data.action === 'sendRedirect') {
                resolve(Response.redirect(prefix + msgPortEvent.data.redirectUrl));
            } else {
                reject(msgPortEvent.data, titleWithNameSpace);
            }
        };
        outgoingMessagePort.postMessage({
            action: 'askForContent',
            title: titleWithNameSpace
        }, [messageChannel.port2]);
    });
}

/**
 * Looks up a Request in a cache and returns a Promise for the matched Response
 * @param {String} cache The name of the cache to look in
 * @param {String} requestUrl The Request URL to fulfill from cache
 * @returns {Promise<Response>} A Promise for the cached Response, or rejects with strings 'disabled' or 'no-match'
 */
function fromCache (cache, requestUrl) {
    // Prevents use of Cache API if user has disabled it
    if (!(useAppCache && cache === APP_CACHE || useAssetsCache && cache === ASSETS_CACHE)) {
        return Promise.reject(new Error('disabled'));
    }
    return caches.open(cache).then(function (cacheObj) {
        return cacheObj.match(requestUrl).then(function (matching) {
            if (!matching || matching.status === 404) {
                return Promise.reject(new Error('no-match'));
            }
            console.debug('[SW] Supplying ' + requestUrl + ' from ' + cache + '...');
            return matching;
        });
    });
}

/**
 * Stores or updates in a cache the given Request/Response pair
 * @param {String} cache The name of the cache to open
 * @param {Request|String} request The original Request object or the URL string requested
 * @param {Response} response The Response received from the server/ZIM
 * @returns {Promise} A Promise for the update action
 */
function updateCache (cache, request, response) {
    // Prevents use of Cache API if user has disabled it
    if (!response.ok || !(useAppCache && cache === APP_CACHE || useAssetsCache && cache === ASSETS_CACHE)) {
        return Promise.resolve();
    }
    return caches.open(cache).then(function (cacheObj) {
        console.debug('[SW] Adding ' + (request.url || request) + ' to ' + cache + '...');
        return cacheObj.put(request, response);
    });
}

/**
 * Tests the caching strategy available to this app and if it is Cache API, count the
 * number of assets in ASSETS_CACHE
 * @param {String} url A URL to test against excludedURLSchema
 * @returns {Promise<Array>} A Promise for an array of format [cacheType, cacheDescription, assetCount]
 */
function testCacheAndCountAssets (url) {
    if (regexpExcludedURLSchema.test(url)) return Promise.resolve(['custom', 'custom', 'Custom', '-']);
    if (!useAssetsCache) return Promise.resolve(['none', 'none', 'None', 0]);
    return caches.open(ASSETS_CACHE).then(function (cache) {
        return cache.keys().then(function (keys) {
            return ['cacheAPI', ASSETS_CACHE, 'Cache API', keys.length];
        }).catch(function (err) {
            return err;
        });
    }).catch(function (err) {
        return err;
    });
}
