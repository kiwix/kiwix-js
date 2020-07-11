# Changelog of Kiwix JS

Please note that this application has changed its name over time.
It was first called Evopedia (and was using the file format of Evopedia).
Then it was renamed Kiwix-html5 (and uses ZIM files), and then again was renamed to Kiwix-JS.

## Kiwix-JS v2.8.0

Released on *2020-07-11*

* NEW: Intelligently select the best Storage API for storing settings between sessions (`cookie` or `localStorage`)
* NEW: Display title search results progressively instead of waiting for search to complete before displaying them
* NEW: User can change depth of title search from Configuration
* UPDATE: Better handling of case in title search, returning more accurate search results
* UPDATE: Use `const` to declare constants, enabling better app memory management
* UPDATE: Use `SameSite=Strict` for any residual cookie usage to conform to new security standards
* BUGFIX: Major blocking bug causing high memory usage and slow load times when reading MIME type table of recent ZIM archives

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/22?closed=1

## Kiwix-JS v2.7.0

Released on *2020-03-29*

* NEW: Selectable dark mode for app UI and for articles (does not work on IE11)
* NEW: Optional transition between app pages
* NEW: Native asset caching in Service Worker mode - considerably speeds up article load times in some contexts
* UPDATE: Privacy Policy
* UPDATE: Minor changes to Kiwix icon
* UPDATE: Bootstrap updated to v4
* UPDATE: Q Promise library updated to v1.5.1
* UPDATE: Various code simplifications and cleanup
* BUGFIX: Support details-summary tags to ensure all article subheadings are open in jQuery mode
* BUGFIX: Broken display when search results have special characters
* BUGFIX: Display of random article fragments when using back/forward buttons quickly
* BUGFIX: Several UI bugs (search results disappearing, redundant scroll bar)

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/21?closed=1

## Kiwix-JS v2.6.0

Released on *2019-07-20*

* NEW: Support for imagemaps (area tags) in jQuery mode, like for maps in Wikivoyage
* NEW: Enable keyboard selection in search results
* NEW: Drag and drop support of ZIM files (on desktop)
* NEW: Support download of epub files (for Gutenberg ZIM files) and some other types of downloads
* NEW: Generic handling of MIME Types, instead of the previously hard-coded ones
* NEW: Add explanations and detect when there are CORS issues when running kiwix-js through file://
* UPDATE: Upgrade the underlying Ubuntu Touch platform to Xenial
* UPDATE: Improve the automated UI tests with a more complete scenario
* UPDATE: Simplify the code by removing the base tag
* BUGFIX: Fix for some cache issues with Chromium extension in ServiceWorker mode, that were mixing content from different ZIM files
* BUGFIX: Some fixes for filenames with question marks, hyperlinks with hashtags, articles with no title, and articles with special characters in their URL
* BUGFIX: Fix for articles with a slash in their title in ServiceWorker mode (at least for StackOverflow ZIM files). Note that some Wikivoyage ZIM files (of 2019-06) had incorrect links on their homepage, and are not working with this fix. This has been fixed in 2019-07 ZIM files (see https://github.com/openzim/mwoffliner/issues/726).

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/20?closed=1

## Kiwix-JS v2.5.0

Released on *2019-01-16*

* NEW: Support for javascript content inside the ZIM file, only in ServiceWorker mode. Handle noscript tags in jQuery mode, and display a warning when some unhandled javascript is detected
* NEW: Preliminary support of video/audio content (including subtitles): these content types are now supported. You can read them for example in TED/TEDx, dirtybiology, oer4schools, etc. BUT the main page of these ZIM files needs javascript to work properly, which is only enabled in ServiceWorker mode. In jQuery mode, the user needs to reach the pages through a search
* UPDATE: In the UI, replace the spinner by a more modern one
* BUGFIX: Some technical fixes: footnotes in Wikimedia ZIM files (and, more generally, anchors in hyperlinks), incomplete searches in some specific ZIM files (PhET and TED), compatibility with URLs that contain an apostrophe, remove debug logs in ServiceWorker mode

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/19?closed=1

## Kiwix-JS v2.4.0

Released on *2018-09-22*

* UPDATE: Performance improvement on decompression of content (now twice as fast)
* BUGFIX: Stability improvement for the ServiceWorker mode

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/16?closed=1

## Kiwix-JS v2.3.1

Released on *2018-09-08*

* NEW: Add favicon
* BUGFIX: Fix excessive memory consumption
* BUGFIX: Fix SVG file handling

## Kiwix-JS v2.3.0

Released on *2018-06-04*

* NEW: Add a cache on CSS stylesheets to improve performance in jQuery mode
* UPDATE: Change the technical way to display articles, so that all CSS styles can be loaded, and to avoid other technical issues
* UPDATE: Make the content visible only when CSS styles are read, to avoid repaints that can be very slow
* BUGFIX: Fix redirections in ServiceWorker mode in ZIM files like StackExchange, and make the ServiceWorker handle all the articles (including the main one, and the first displayed after a search or random search)
* BUGFIX: Fix links with an anchor in the URL
* BUGFIX: In recent Wikipedia and other Wikimedia ZIM files, open all the sections when using a small screen (mobile stylesheet), so that the content remains readable (it only works in jQuery mode, this should be fixed in ServiceWorker mode in next version)
* BUGFIX: Fix CSS UTF-8 encoding

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/18?closed=1

## Kiwix-JS v2.2.0

Released on *2018-01-07*

* NEW: Support for StackExchange ZIM files (and maybe for some other ZIM files with a structure different than the Mediawiki-based ZIM files).
* NEW: Make geo: and tel: links work.
* NEW: Ubuntu Touch support.
* UPDATE: Rename the project to Kiwix-JS instead of Kiwix-html5.
* UPDATE: Compatibility with split English Wikipedia ZIM files (which now have more than 26 files).
* UPDATE: Slightly improved memory handling of content decompression.
* UPDATE: Library updates (jQuery, Bootstrap, requireJS).
* UPDATE: Improved continuous integration (automated testing on several browsers).
* UPDATE: Some code refactoring/cleaning on the way we handle the jQuery mode.
* BUGFIX: Avoid unnecessary 404 errors on images.
* BUGFIX: Minor UI enhancements and fixes.

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/6?closed=1


## Kiwix-html5 v2.1.0

Released on *2017-06-05*

Add more user info on which ZIM files are compatible.

Fix for back/forward buttons in browsing history.

Drop some legacy code (Evopedia file format compatibility, uncomplete Cordova/Phonegap port).

Refactoring the code to make it more easily readable for contributors.

Fix for unit tests on Chrome.

Enhancements on nightly builds and automatic generation of packages for public releases.

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/15?closed=1

## Kiwix-html5 v2.0.0

Released on *2017-04-08*

This version targets browser extensions (Firefox and Chrome), even if still compatible with Firefox OS.

It also runs the unit tests and some UI tests on Travis.

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/14?closed=1

## Kiwix-html5 v2.0-beta

Released on *2016-06-26*

This is the first version of the HTML5 version of Kiwix, with Firefox OS as the main target.

This version adds ZIM file format support and integrates it into the Kiwix project. Evopedia is discontinued but this app is still compatible with its archive format.

This version has been submitted on the Firefox Marketplace, but was never reviewed by Mozilla and never distributed.

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/12?closed=1

## Evopedia-html5 v1.1.4

Released on *2015-01-29*

Fix for wiktionary archives, where links between articles were not working

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/2?closed=1

## Evopedia-html5 v1.1.3

Released on *2015-01-29*

Small bugfix for Android devices.

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/10?closed=1

## Evopedia-html5 v1.1.2

Released on *2015-01-28*

Documentation update about the current status of Android compatibility
+ very minor updates

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/9?closed=1

## Evopedia-html5 v1.1.1

Released on *2014-08-11*

Solve an issue with articles containing a quote, and makes it compatible with Flatfish tablets.

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/8?closed=1

## Evopedia-html5 v1.1.0

Released on *2014-04-12*

This version includes some refactoring of the code, and a new feature using the geolocation of the device (to find articles around this location).
The access to the SD-card has been put in an abstraction layer, to prepare for an Apache Cordova port (this port is not finished yet).

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/2?closed=1

## Evopedia-html5 v1.0.3

Released on *2013-12-31*

Add a warning about the size of text on the Geeksphone Peak device, when using Firefox OS <1.1

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/7?closed=1

## Evopedia-html5 v1.0.2

Released on *2013-10-06*

Fix compatibility with Firefox OS >=1.1, due to changed in DeviceStorage API

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/5?closed=1

## Evopedia-html5 v1.0.1

Released on *2013-08-25*

Minor bugfix before submitting to the Marketplace

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/4?closed=1

## Evopedia-html5 v1.0.0

Released on *2013-08-23*

First public version, targeting Firefox OS and deployed on the Firefox Marketplace

Detailed changelog: https://github.com/kiwix/kiwix-js/milestone/1?closed=1

## Initial work

The idea of porting Evopedia in javascript emerged in November 2012.

Some work has started on this in December 2012.
