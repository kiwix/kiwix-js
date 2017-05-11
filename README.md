kiwix-html5
==============

Kiwix is an offline Wikipedia viewer. See the official site: http://www.kiwix.org/

This is a browser extension developed in HTML5/Javascript.

You can search among the article titles, and read any of them without any Internet access.
All the content of Wikipedia is inside your device (including the images).
It might also works with other content in the OpenZIM format: http://www.openzim.org/wiki/OpenZIM , but has been only tested on the Wikipedia ones.

If your Internet access is expensive/rare/slow/unreliable/watched/censored, you still can browse this amazing amount of knowledge and culture.

It uses ZIM files that you can download from http://download.kiwix.org/
You have to download them separately, store them in your filesystem, and manually select them after starting the application.
It is unfortunately not technically possible to "remember" the selected ZIM file and open it automatically (the browsers refuse that for security reasons).

Technically, after reading an article from a ZIM file, there is a need to "inject" the dependencies (images, css etc). For compatibility reasons, there are several ways to do it :
- the "jQuery" mode parses the DOM to find the HTML tags of these dependencies, and modifies them to put the Base64 content in it. It is compatible with any browser, but is slow and can use a lot of memory. It works well on Wikimedia content, but can miss some dependencies on some contents
- the "ServiceWorker" mode uses a Service Worker to catch any HTTP request the page would send, and reply with content read from the ZIM file. It is a generic and much cleaner way than jQuery mode, but it does not work on all browsers. And ServiceWorkers are disabled by Mozilla in Firefox extensions
- maybe a "webRequest" mode will appear, which would use the webRequest API inside the Firefox extension (when the necessary APIs will be implemented by Mozilla)

This application is released under the GPL v3 license. See http://www.gnu.org/licenses/ or the included LICENSE-GPLv3.txt file
The source code can be found at https://github.com/kiwix/kiwix-html5
Unit tests can be run by opening tests.html file on Firefox.

The first versions of this application were originally part of the Evopedia project: http://www.evopedia.info (now discontinued)
These first versions were targeting Firefox OS (now discontinued too : we're not lucky ;-) ).