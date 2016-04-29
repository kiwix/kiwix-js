kiwix-html5
==============

Kiwix is an offline wikipedia viewer. See the official site: http://www.kiwix.org/

This application is developed in HTML5/Javascript, with Firefox OS as the primary target.

You can search among the article titles, and read any of them without any Internet access.
All the content of wikipedia is inside your device (including the images). It also works with any content in the OpenZIM format: http://www.openzim.org/wiki/OpenZIM

If your Internet access is expensive/rare/slow/unreliable/watched/censored, you still can browse this amazing amount of knowledge and culture.
A "search nearby" feature can also list articles found around your location (after geolocating your device, only for deprecated Evopedia archive format, for now)

It uses ZIM files that you can download from http://download.kiwix.org/
You have to store them in a sub-directory of your SD-card (or internal storage).

This application is released under the GPL v3 license. See http://www.gnu.org/licenses/ or the included LICENSE-GPLv3.txt file
The source code can be found at https://github.com/kiwix/kiwix-html5
Unit tests can be run by opening tests.html file on Firefox.

The first versions of this application were originally part of the Evopedia project: http://www.evopedia.info which is already available on the Marketplace: https://marketplace.firefox.com/app/evopedia/.
But the Evopedia project and archive format are now discontinued: the dev team has joined the Kiwix project, in particular to adapt the app to be able to read ZIM archives.

This application is currently in beta state, and not on the Mozilla Marketplace yet.
You can install it on a Firefox OS device through the WebIDE of Firefox :
- clone the source code from github
- run WebIDE (tools menu of Firefox)
- choose to open a packaged app, and select your local source code folder
- plug your Firefox OS device (adb needs to be configured on your computer, and adb option must be enabled in the developer settings of the device)
- click on your device name in WebIDE, and allow the connection on the device
- click on the "Play" button in WebIDE

You also can run it on a desktop browser of a computer (tested with Firefox and Chromium) :
- for jQuery mode, you can simply open the index.html file in the source code, but the browser will not allow to run a ServiceWorker this way
- for ServiceWorker mode, the source code needs to be served through a web server (even on localhost). On Firefox, you also need to use the developer edition of Firefox (>=v48.0a2) for now.
In both modes, you will have to manually select the ZIM file each time.
