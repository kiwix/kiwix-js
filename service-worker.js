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

self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
    // "Claiming" the ServiceWorker is necessary to make it work right away,
    // without the need to reload the page.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim
    event.waitUntil(self.clients.claim());
});

var regexpRemoveUrlParameters = new RegExp(/([^?#]+)[?#].*$/);

// This function is duplicated from uiUtil.js
// because using requirejs would force to add the 'fetch' event listener
// after the initial evaluation of this script, which is not supported any more
// in recent versions of the browsers.
// Cf https://bugzilla.mozilla.org/show_bug.cgi?id=1181127
// TODO : find a way to avoid this duplication

/**
 * Removes parameters and anchors from a URL
 * @param {type} url
 * @returns {String} same URL without its parameters and anchors
 */
function removeUrlParameters(url) {
    return url.replace(regexpRemoveUrlParameters, "$1");
}

var outgoingMessagePort = null;
var fetchCaptureEnabled = false;
self.addEventListener('fetch', fetchEventListener);

self.addEventListener('message', function (event) {
    if (event.data.action === 'init') {
        // On 'init' message, we initialize the outgoingMessagePort and enable the fetchEventListener
        outgoingMessagePort = event.ports[0];
        fetchCaptureEnabled = true;
    }
    if (event.data.action === 'disable') {
        // On 'disable' message, we delete the outgoingMessagePort and disable the fetchEventListener
        outgoingMessagePort = null;
        fetchCaptureEnabled = false;
    }
});

// TODO : this way to recognize content types is temporary
// It must be replaced by reading the actual MIME-Type from the backend
var regexpJPEG = new RegExp(/\.jpe?g$/i);
var regexpPNG = new RegExp(/\.png$/i);
var regexpJS = new RegExp(/\.js/i);
var regexpCSS = new RegExp(/\.css$/i);
var regexpSVG = new RegExp(/\.svg$/i);
var regexpWEBM = new RegExp(/\.webm$/i);
var regexpMP4 = new RegExp(/\.mp4$/i);
var regexpOGG = new RegExp(/\.og[mvg]$/i);
var regexpVTT = new RegExp(/\.vtt$/i);

// Pattern for ZIM file namespace - see https://wiki.openzim.org/wiki/ZIM_file_format#Namespaces
var regexpZIMUrlWithNamespace = new RegExp(/(?:^|\/)([-ABIJMUVWX])\/(.+)/);

function fetchEventListener(event) {
    if (fetchCaptureEnabled) {
        if (regexpZIMUrlWithNamespace.test(event.request.url)) {
            // The ServiceWorker will handle this request
            // Let's ask app.js for that content
            event.respondWith(new Promise(function(resolve, reject) {
                var nameSpace;
                var title;
                var titleWithNameSpace;
                var contentType;
                var regexpResult = regexpZIMUrlWithNamespace.exec(event.request.url);
                nameSpace = regexpResult[1];
                title = regexpResult[2];

                // The namespace defines the type of content. See https://wiki.openzim.org/wiki/ZIM_file_format#Namespaces
                // TODO : read the contentType from the ZIM file instead of hard-coding it here
                if (nameSpace === 'A') {
                    if (regexpVTT.test(title)) {
                        // It's a subtitle
                        contentType = 'text/vtt';
                    }
                    else {
                        // It's an article
                        contentType = 'text/html';
                    }
                }
                else if (nameSpace === 'I' || nameSpace === 'J') {
                    // It's an image or another kind of media
                    if (regexpJPEG.test(title)) {
                        contentType = 'image/jpeg';
                    }
                    else if (regexpPNG.test(title)) {
                        contentType = 'image/png';
                    } 
                    else if (regexpSVG.test(title)) {
                        contentType = 'image/svg+xml';
                    }
                    else if (regexpWEBM.test(title)) {
                        contentType = 'video/webm';
                    }
                    else if (regexpMP4.test(title)) {
                        contentType = 'video/mp4';
                    }
                    else if (regexpOGG.test(title)) {
                        contentType = 'video/ogg';
                    }
                }
                else if (nameSpace === '-') {
                    // It's a layout dependency
                    if (regexpJS.test(title)) {
                        contentType = 'text/javascript';
                    }
                    else if (regexpCSS.test(title)) {
                        contentType = 'text/css';
                    }
                    else if (regexpVTT.test(title)) {
                        // It's a subtitle
                        contentType = 'text/vtt';
                    }
                }

                // We need to remove the potential parameters in the URL
                title = removeUrlParameters(decodeURIComponent(title));

                titleWithNameSpace = nameSpace + '/' + title;

                // Let's instanciate a new messageChannel, to allow app.s to give us the content
                var messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = function(event) {
                    if (event.data.action === 'giveContent') {
                        // Content received from app.js
                        var contentLength;
                        var headers = new Headers ();
                        if (event.data.content && event.data.content.byteLength) {
                            contentLength = event.data.content.byteLength;
                            headers.set('Content-Length', contentLength);
                        }
                        if (contentType) {
                            headers.set('Content-Type', contentType);
                        }
                        // Test if the content is a video.
                        // String.prototype.startsWith is not supported by IE11, but IE11 does not support service workers, so it's safe to use it here.
                        // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
                        if (contentLength && contentLength >= 1 && contentType && contentType.startsWith('video/')) {
                            // In case of a video, Chrome and Edge need these HTTP headers else seeking doesn't work
                            // (even if we always send all the video content, not the requested range, until the backend supports it)
                            headers.set('Accept-Ranges', 'bytes');
                            headers.set('Content-Range', 'bytes 0-' + (contentLength-1) + '/' + contentLength);
                        }
                        var responseInit = {
                            status: 200,
                            statusText: 'OK',
                            headers: headers
                        };

                        var httpResponse = new Response(event.data.content, responseInit);

                        // Let's send the content back from the ServiceWorker
                        resolve(httpResponse);
                    }
                    else if (event.data.action === 'sendRedirect') {
                        resolve(Response.redirect(event.data.redirectUrl));
                    }
                    else {
                        console.error('Invalid message received from app.js for ' + titleWithNameSpace, event.data);
                        reject(event.data);
                    }
                };
                outgoingMessagePort.postMessage({'action': 'askForContent', 'title': titleWithNameSpace}, [messageChannel.port2]);
            }));
        }
        // If event.respondWith() isn't called because this wasn't a request that we want to handle,
        // then the default request/response behavior will automatically be used.
    }
}
