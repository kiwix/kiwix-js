    /**
     * Utility function : return true if the given string ends with the suffix
     * @param str
     * @param suffix
     * @returns {Boolean}
     */
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

console.log("SW startup");

self.addEventListener('install', function(event) {
  console.log("SW installed");
});

self.addEventListener('activate', function(event) {
  console.log("SW activated");
});

self.addEventListener('fetch', function(event) {
  console.log('Handling fetch event for', event.request.url);
  
  if (endsWith(event.request.url,'Ray_Charles.html')) {

    var responseInit = {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'text/html'
      }
    };
    
    var responseBody = "This is a mock response from the service worker";

    var mockResponse = new Response(responseBody, responseInit);

    console.log('Responding with a mock response body:', responseBody);
    event.respondWith(mockResponse);
  }

  // If event.respondWith() isn't called because this wasn't a request that we want to mock,
  // then the default request/response behavior will automatically be used.
});
