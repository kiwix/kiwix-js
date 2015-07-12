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

require({
    baseUrl: "./www/js/lib/"
},
["util"],

function(util) {

    console.log("ServiceWorker startup");
    
    var messagePort2 = null;

    self.addEventListener('install', function(event) {
        console.log("ServiceWorker installed");
    });

    self.addEventListener('activate', function(event) {
        console.log("ServiceWorker activated");
    });
    
    self.addEventListener('message', function (event) {
        if (event.data.action === 'init') {
            console.log('Init message received', event.data);
            messagePort2 = event.ports[0];
            console.log('messagePort2 initialized', messagePort2);
        }
    });
    
    var regexpJPEG = new RegExp(/\.jpe?g$/);
    var regexpPNG = new RegExp(/\.png$/);
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
            }
            messagePort2.postMessage({'action': 'askForContent', 'titleName': titleName});
            console.log('Message sent to app.js');
            // TODO : something is badly designed here :
            // There should be only one eventListener, that responds to all the incoming messages.
            // Else the first dependency response make all the other ones be rejected, and
            // But how to isolate the callback function and keep access to resolve and reject functions?
            self.addEventListener('message', function (event) {
                if (titleName === event.data.titleName && event.data.action === 'giveContent') {
                    console.log('content message received for ' + titleName, event.data);
                    var responseInit = {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'Content-Type': contentType
                        }
                    };

                    var responseBody;
                    if (regexpJPEG.test(titleName)) {
                        // TODO : temporary, until we manage to really read an image from the backend
                        var base64Image = "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";
                        responseBody = b64toBlob(base64Image, "image/jpeg");
                    }
                    else {
                        responseBody = event.data.content;
                    }

                    var httpResponse = new Response(responseBody, responseInit);

                    console.log('ServiceWorker responding to the HTTP request for ' + titleName + ' (size=' + responseBody.length + ' octets)' , httpResponse);
                    resolve(httpResponse);
                }
                else {
                    console.log('Invalid message received from app.js : it does not correspond to ' + titleName, event.data);
                    reject(event.data);
                }
                // TODO : we should remove this event listener, because it will probably never be used again
                // but how to do that with an anonymous function? ('this' does not point to it)
                //self.removeEventListener('message', this);
                });
                console.log('Eventlistener added to listen for an answer to ' + titleName);
            }));
        }

        // If event.respondWith() isn't called because this wasn't a request that we want to handle,
        // then the default request/response behavior will automatically be used.
    });

});
