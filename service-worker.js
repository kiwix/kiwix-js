/**
 * service-worker.js : Service Worker implementation,
 * in order to capture the HTTP requests made by an article, and respond with the
 * corresponding content, coming from the archive
 * 
 * Copyright 2015 Mossroy and contributors
 * License GPL v3:
 * 
 * This file is part of Evopedia.
 * 
 * Evopedia is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Evopedia is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Evopedia (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */
'use strict';
// TODO : remove requirejs if it's really useless here
importScripts('./www/js/lib/require.js');

/**
 * From https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
 */
function b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

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

require({
    baseUrl: "./www/js/lib/"
},
["util", "utf8"],

function(util, utf8) {

    console.log("ServiceWorker startup");
    
    var outgoingMessagePort = null;
    
    self.addEventListener('message', function (event) {
        if (event.data.action === 'init') {
            console.log('Init message received', event.data);
            outgoingMessagePort = event.ports[0];
            console.log('outgoingMessagePort initialized', outgoingMessagePort);
        }
    });
    
    // TODO : this way to recognize content types is temporary
    // It must be replaced by reading the actual MIME-Type from the backend
    var regexpJPEG = new RegExp(/\.jpe?g$/i);
    var regexpPNG = new RegExp(/\.png$/i);
    var regexpJS = new RegExp(/\.js/i);
    var regexpCSS = new RegExp(/\.css$/i);

    var regexpContentUrl = new RegExp(/\/(.)\/(.*[^\/]+)$/);
    var regexpDummyArticle = new RegExp(/dummyArticle\.html$/);

    self.addEventListener('fetch', function(event) {
        console.log('ServiceWorker handling fetch event for : ' + event.request.url);
        
        // TODO handle the dummy article more properly
        if (regexpContentUrl.test(event.request.url) && !regexpDummyArticle.test(event.request.url)) {
        
            console.log('Asking app.js for a content', event.request.url);
            event.respondWith(new Promise(function(resolve, reject) {
                var regexpResult = regexpContentUrl.exec(event.request.url);
                var nameSpace = regexpResult[1];
                var titleName = regexpResult[2];
                var contentType;

                // The namespace defines the type of content. See http://www.openzim.org/wiki/ZIM_file_format#Namespaces
                // TODO : read the contentType from the ZIM file instead of hard-coding it here
                if (nameSpace === 'A') {
                    console.log("It's an article : " + titleName);
                    contentType = 'text/html';
                }
                else if (nameSpace === 'I' || nameSpace === 'J') {
                    console.log("It's an image : " + titleName);
                    if (regexpJPEG.test(titleName)) {
                        contentType = 'image/jpeg';
                    }
                    else if (regexpPNG.test(titleName)) {
                        contentType = 'image/png';
                    }
                }
                else if (nameSpace === '-') {
                    console.log("It's a layout dependency : " + titleName);
                    if (regexpJS.test(titleName)) {
                        contentType = 'text/javascript';
                    }
                    else if (regexpCSS.test(titleName)) {
                        contentType = 'image/css';
                    }
                    reject("temporarily refuse javascript and css dependencies");
                }

                // Let's instanciate a new messageChannel, to allow app.s to give us the content
                var messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = function(event) {
                    if (event.data.action === 'giveContent') {
                        console.log('content message received for ' + titleName, event.data);
                        var responseInit = {
                            status: 200,
                            statusText: 'OK',
                            headers: {
                                'Content-Type': contentType
                            }
                        };

                        var httpResponse = new Response(event.data.content, responseInit);

                        console.log('ServiceWorker responding to the HTTP request for ' + titleName + ' (size=' + event.data.content.length + ' octets)' , httpResponse);
                        resolve(httpResponse);
                    }
                    else {
                        console.log('Invalid message received from app.js for ' + titleName, event.data);
                        reject(event.data);
                    }
                };
                console.log('Eventlistener added to listen for an answer to ' + titleName);
                outgoingMessagePort.postMessage({'action': 'askForContent', 'titleName': titleName}, [messageChannel.port2]);
                console.log('Message sent to app.js through outgoingMessagePort');
            }));
        }
        // If event.respondWith() isn't called because this wasn't a request that we want to handle,
        // then the default request/response behavior will automatically be used.
    });

});
