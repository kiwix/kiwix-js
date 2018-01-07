# Changelog of Kiwix JS

Please note that this application has changed its name over time.
It was first called Evopedia (and was using the file format of Evopedia)
Then it was renamed Kiwix-html5 (and uses ZIM files), then was renamed Kiwix-JS.

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