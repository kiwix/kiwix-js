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
importScripts('./www/js/lib/require.js');

require({
    baseUrl: "./www/js/lib/"
},
["util"],

function(util) {

    console.log("SW startup");

    self.addEventListener('install', function(event) {
      console.log("SW installed");
    });

    self.addEventListener('activate', function(event) {
      console.log("SW activated");
    });

    self.addEventListener('fetch', function(event) {
      console.log('Handling fetch event for : ' + event.request.url);

      if (util.endsWith(event.request.url,'Ray_Charles.html')) {

        var responseInit = {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'text/html'
          }
        };

        var responseBody = "This is a mock response from the service worker for : " + event.request.url;

        var mockResponse = new Response(responseBody, responseInit);

        console.log('Responding with a mock response body :' + responseBody);
        event.respondWith(mockResponse);
      }

      // If event.respondWith() isn't called because this wasn't a request that we want to mock,
      // then the default request/response behavior will automatically be used.
    });

});
