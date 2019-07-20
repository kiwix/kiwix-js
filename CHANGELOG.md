# Changelog of Kiwix JS

Please note that this application has changed its name over time.
It was first called Evopedia (and was using the file format of Evopedia)
Then it was renamed Kiwix-html5 (and uses ZIM files), then was renamed Kiwix-JS.

## Kiwix-JS v2.7.0
Released on TODO

Detailed changelog : TODO

## Kiwix-JS v2.6.0
Released on 2019-07-20

Support for imagemaps (area tags) in jQuery mode, like for maps in wikivoyage

Enable keyboard selection in search results

Drag and drop support of ZIM files (on desktop)

Support download of epub files (for Gutenberg ZIM files) and some other types of downloads

Generic handling of MIME Types, instead of the previously hard-coded ones

Add explanations and detect when there are CORS issues when running kiwix-js through file://

Fix for some cache issues with Chromium extension in ServiceWorker mode, that were mixing content from different ZIM files

Some fixes for filenames with question marks, hyperlinks with hashtags, articles with no title, and articles with special characters in their URL

Fix for articles with a slash in their title in ServiceWorker mode (at least for StackOverflow ZIM files). Note that some wikivoyage ZIM files (of 2019-06) had incorrect links in their homepage, and are not working with this fix. This has been fixed in 2019-07 ZIM files (see https://github.com/openzim/mwoffliner/issues/726).

Upgrade the underlying Ubuntu Touch platform to Xenial

Improve the automated UI tests with a more complete scenario

Simplify the code by removing the base tag

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/20?closed=1

## Kiwix-JS v2.5.0
Released on 2019-01-16

Support for javascript content inside the ZIM file, only in ServiceWorker mode. Handle noscript tags in jQuery mode, and display a warning when some unhandled javascript is detected

Preliminary support of video/audio content (including subtitles) : these content types are now supported. You can read them for example in TED/TEDx, dirtybiology, oer4schools etc. BUT the main page of these ZIM files needs javascript to work properly, which is only enabled in ServiceWorker mode. In jQuery mode, the user needs to reach the pages through a search

Some technical fixes : footnotes in wikimedia ZIM files (and, more generally, anchors in hyperlinks), incomplete searches in some specific ZIM files (PhET and TED), compatibility with URLs that contain an apostrophe, remove debug logs in ServiceWorker mode

In the UI, replace the spinner by a more modern one

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/19?closed=1

## Kiwix-JS v2.4.0
Released on 2018-09-22

Performance improvement on decompression of content (now twice as fast)

Stability improvement for the ServiceWorker mode

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/16?closed=1

## Kiwix-JS v2.3.1
Released on 2018-09-08

Fix excessive memory consumption

Fix SVG file handling

Add favicon

## Kiwix-JS v2.3.0
Released on 2018-06-04

Add a cache on CSS stylesheets to improve performance in jQuery mode

Change the technical way to display articles, so that all CSS styles can be loaded, and to avoid other technical issues

Make the content visible only when CSS styles are read, in order to avoir repaints that can be very slow

Fix redirections in ServiceWorker mode in ZIM files like StackExchange, and make the ServiceWorker handle all the articles (including the main one, and the first displayed after a search or random search)

Fix links with an anchor in the URL

In recent wikipedia and other wikimedia ZIM files, open all the sections when using a small screen (mobile stylesheet), so that the content remains readable (it only works in jQuery mode, this should be fixed in ServiceWorker mode in next version)

Fix CSS UTF-8 encoding

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/18?closed=1

## Kiwix-JS v2.2.0
Released on 2018-01-07

Rename the project to Kiwix-JS instead of Kiwix-html5.

Compatibility with split English wikipedia ZIM files (which now have more than 26 files).

Slightly improved memory handling of content decompression.

Library updates (jQuery, Bootstrap, requireJS).

Improved continuous integration (automated testing on several browsers).

Avoid unnecessary 404 errors on images.

Ubuntu Touch support.

Minor UI enhancements and fixes.

Support for StackExchange ZIM files (and maybe for some other ZIM files with a structure different than the Mediawiki-based ZIM files).

Some code refactoring/cleaning on the way we handle the jQuery mode.

Make geo: and tel: links work.

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/6?closed=1


## Kiwix-html5 v2.1.0
Released on 2017-06-05

Add more user info on which ZIM files are compatible.

Fix for back/forward buttons in browsing history.

Drop some legacy code (Evopedia file format compatibility, uncomplete Cordova/Phonegap port).

Refactoring of the code to make it more easily readable for contributors.

Fix for unit tests on Chrome.

Enhancements on nightly builds and automatic generation of packages for public releases.

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/15?closed=1

## Kiwix-html5 v2.0.0
Released on 2017-04-08

This version targets browser extensions (Firefox and Chrome), even if still compatible with Firefox OS.

It also runs the unit tests and some UI tests on Travis.

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/14?closed=1

## Kiwix-html5 v2.0-beta
Released on 2016-06-26

This is a first version of HTML5 version of Kiwix, with Firefox OS as the main target.

This version adds ZIM file format support, and integrates into the Kiwix project. Evopedia is discontinued but this app is still compatible with its archive format.

This version has been submitted on the Firefox Marketplace, but was never reviewed by Mozilla and never distributed.

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/12?closed=1

## Evopedia-html5 v1.1.4
Released on 2015-01-29

Fix for wiktionary archives, where links between articles were not working

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/2?closed=1

## Evopedia-html5 v1.1.3
Released on 2015-01-29

Small bugfix for Android devices.

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/10?closed=1

## Evopedia-html5 v1.1.2
Released on 2015-01-28

Documentation update about the current status of Android compatibility
+ very minor updates

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/9?closed=1

## Evopedia-html5 v1.1.1
Released on 2014-08-11

Solve an issue with articles containing a quote, and makes it compatible with Flatfish tablets.

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/8?closed=1

## Evopedia-html5 v1.1.0
Released on 2014-04-12

This version includes some refactoring of the code, and a new feature using the geolocation of the device (to find articles around this location).
The access to the SD-card has been put in an abstraction layer, in order to prepare for an Apache Cordova port (this port is not finished yet).

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/2?closed=1

## Evopedia-html5 v1.0.3
Released on 2013-12-31

Add a warning about the size of text on the Geeksphone Peak device, when using Firefox OS <1.1

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/7?closed=1

## Evopedia-html5 v1.0.2
Released on 2013-10-06

Fix compatibility with Firefox OS >=1.1, due to changed in DeviceStorage API

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/5?closed=1

## Evopedia-html5 v1.0.1
Released on 2013-08-25

Minor bugfix before submitting to the Marketplace

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/4?closed=1

## Evopedia-html5 v1.0.0
Released on 2013-08-23

First public version, targeting Firefox OS and deployed on the Firefox Marketplace

Detailed changelog : https://github.com/kiwix/kiwix-js/milestone/1?closed=1

## Initial work
The idea of porting Evopedia in javascript emerged in November 2012.

Some work has started on this in December 2012
