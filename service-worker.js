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
    console.log("ServiceWorker installed");
});

self.addEventListener('activate', function(event) {
    // "Claiming" the ServiceWorker is necessary to make it work right away,
    // without the need to reload the page.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim
    event.waitUntil(self.clients.claim());
    console.log("ServiceWorker activated");
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
    
console.log("ServiceWorker startup");

var outgoingMessagePort = null;
var fetchCaptureEnabled = false;
self.addEventListener('fetch', fetchEventListener);
console.log('fetchEventListener set');

self.addEventListener('message', function (event) {
    if (event.data.action === 'init') {
        console.log('Init message received', event.data);
        outgoingMessagePort = event.ports[0];
        console.log('outgoingMessagePort initialized', outgoingMessagePort);
        fetchCaptureEnabled = true;
        console.log('fetchEventListener enabled');
    }
    if (event.data.action === 'disable') {
        console.log('Disable message received');
        outgoingMessagePort = null;
        console.log('outgoingMessagePort deleted');
        fetchCaptureEnabled = false;
        console.log('fetchEventListener disabled');
    }
});

// TODO : this way to recognize content types is temporary
// It must be replaced by reading the actual MIME-Type from the backend
var regexpJPEG = new RegExp(/\.jpe?g$/i);
var regexpPNG = new RegExp(/\.png$/i);
var regexpJS = new RegExp(/\.js/i);
var regexpCSS = new RegExp(/\.css$/i);
var regexpSVG = new RegExp(/\.svg$/i);

// Pattern for ZIM file namespace - see http://www.openzim.org/wiki/ZIM_file_format#Namespaces
var regexpZIMUrlWithNamespace = new RegExp(/(?:^|\/)([-ABIJMUVWX])\/(.+)/);

function fetchEventListener(event) {
    if (fetchCaptureEnabled) {
        console.log('ServiceWorker handling fetch event for : ' + event.request.url);

        if (regexpZIMUrlWithNamespace.test(event.request.url)) {

            console.log('Asking app.js for a content', event.request.url);
            event.respondWith(new Promise(function(resolve, reject) {
                var nameSpace;
                var title;
                var titleWithNameSpace;
                var contentType;
                var regexpResult = regexpZIMUrlWithNamespace.exec(event.request.url);
                nameSpace = regexpResult[1];
                title = regexpResult[2];

                // The namespace defines the type of content. See http://www.openzim.org/wiki/ZIM_file_format#Namespaces
                // TODO : read the contentType from the ZIM file instead of hard-coding it here
                if (nameSpace === 'A') {
                    console.log("It's an article : " + title);
                    contentType = 'text/html';
                }
                else if (nameSpace === 'I' || nameSpace === 'J') {
                    console.log("It's an image : " + title);
                    if (regexpJPEG.test(title)) {
                        contentType = 'image/jpeg';
                    }
                    else if (regexpPNG.test(title)) {
                        contentType = 'image/png';
                    } 
                    else if (regexpSVG.test(title)) {
                        contentType = 'image/svg+xml';
                    }
                }
                else if (nameSpace === '-') {
                    console.log("It's a layout dependency : " + title);
                    if (regexpJS.test(title)) {
                        contentType = 'text/javascript';
                    }
                    else if (regexpCSS.test(title)) {
                        contentType = 'text/css';
                    }
                }

                // We need to remove the potential parameters in the URL
                title = removeUrlParameters(decodeURIComponent(title));

                titleWithNameSpace = nameSpace + '/' + title;

                // Let's instanciate a new messageChannel, to allow app.s to give us the content
                var messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = function(event) {
                    if (event.data.action === 'giveContent') {
                        console.log('content message received for ' + titleWithNameSpace, event.data);
                        var responseInit = {
                            status: 200,
                            statusText: 'OK',
                            headers: {
                                'Content-Type': contentType
                            }
                        };

                        var httpResponse = new Response(event.data.content, responseInit);

                        console.log('ServiceWorker responding to the HTTP request for ' + titleWithNameSpace + ' (size=' + event.data.content.length + ' octets)' , httpResponse);
                        resolve(httpResponse);
                    }
                    else if (event.data.action === 'sendRedirect') {
                        resolve(Response.redirect(event.data.redirectUrl));
                    }
                    else {
                        console.log('Invalid message received from app.js for ' + titleWithNameSpace, event.data);
                        reject(event.data);
                    }
                };
                console.log('Eventlistener added to listen for an answer to ' + titleWithNameSpace);
                outgoingMessagePort.postMessage({'action': 'askForContent', 'title': titleWithNameSpace}, [messageChannel.port2]);
                console.log('Message sent to app.js through outgoingMessagePort');
            }));
        }
        // If event.respondWith() isn't called because this wasn't a request that we want to handle,
        // then the default request/response behavior will automatically be used.
    }
}
