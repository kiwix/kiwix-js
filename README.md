kiwix-html5
==============

Kiwix is an offline wikipedia viewer. See the official site: http://www.kiwix.org/

This application is developed in HTML5/Javascript, with Firefox OS as the primary target.
It also works on Android (since Firefox 34) but suffers from a major bug of the platform: https://bugzilla.mozilla.org/show_bug.cgi?id=1117136.

It's not yet on the Firefox Marketplace, but should be soon.

You can search among the article titles, and read any of them without any Internet access.
All the content of wikipedia is inside your device (including the images). It also works with any content in the OpenZIM format: http://www.openzim.org/wiki/OpenZIM

If your Internet access is expensive/rare/slow/unreliable/watched/censored, you still can browse this amazing amount of knowledge and culture.
A "search nearby" feature can also list articles found around your location (after geolocating your device, only for deprecated Evopedia archive format, for now)

It uses ZIM files that you can download from http://download.kiwix.org/
You have to store them in a sub-directory of your SD-card (or internal storage).

This application is released under the GPL v3 license. See http://www.gnu.org/licenses/ or the included LICENSE-GPLv3.txt file
The source code can be found at https://github.com/kiwix/kiwix-html5

Unit tests can be run by opening tests.html file

The first versions of this application were originally part of the Evopedia project: http://www.evopedia.info which is already available on the Marketplace: https://marketplace.firefox.com/app/evopedia/.
But the Evopedia project and archive format are now discontinued: the dev team has joined the Kiwix project, in particular to adapt the app to be able to read ZIM archives.
