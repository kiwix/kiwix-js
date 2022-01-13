# Kiwix JS

Kiwix is an offline Wikipedia viewer. See the official site: https://www.kiwix.org/.

This is a ZIM archive reader for browser extensions or add-ons, developed in HTML5/Javascript. You can get the extension from the Mozilla,
Chrome and Edge extension stores (search for "Kiwix", or click on a badge below). There is a version implemented as an offline-first
Progressive Web App (PWA) at https://moz-extension.kiwix.org/current/, primarily intended for use within the Mozilla Extension.

Once you have obtained an archive (see below), you can select it in Kiwix JS, and search for article titles. No further Internet access is required to
read the archive's content. For exmaple, you can have the entire content of Wikipedia in your own language inside your device (including images and
audiovisual content) entirely offline. If your Internet access is expensive, intermittent, slow, unreliable, observed or censored, you can still have
access to this amazing repository of knowledge and culture.

The reader also works with other content in the OpenZIM format: https://wiki.openzim.org/wiki/OpenZIM, but our main targets are Mediawiki-based
content (Wikipedia, Wikivoyage, Wikitionary, etc.), StackExchange, Project Gutenberg and TED Talks.

[![Build Status: Continuous Integration](https://github.com/kiwix/kiwix-js/workflows/CI/badge.svg?query=branch%3Amaster)](https://github.com/kiwix/kiwix-js/actions?query=branch%3Amaster)
[![Build Status: Release](https://github.com/kiwix/kiwix-js/workflows/Release/badge.svg?query=branch%3Amaster)](https://github.com/kiwix/kiwix-js/actions?query=branch%3Amaster)
[![CodeFactor](https://www.codefactor.io/repository/github/kiwix/kiwix-js/badge)](https://www.codefactor.io/repository/github/kiwix/kiwix-js)
[![Kiwix for Firefox](https://img.shields.io/amo/v/kiwix-offline?label=Kiwix%20for%20Firefox)](https://addons.mozilla.org/fr/firefox/addon/kiwix-offline/)
[![Kiwix for Chrome](https://img.shields.io/chrome-web-store/v/donaljnlmapmngakoipdmehbfcioahhk?label=Kiwix%20for%20Chrome)](https://chrome.google.com/webstore/detail/kiwix/donaljnlmapmngakoipdmehbfcioahhk)
[![Kiwix for Edge](https://img.shields.io/badge/dynamic/json?label=Kiwix%20for%20Edge&prefix=v&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fjlepddlenlljlnnhjinfaciabanbnjbp)](https://microsoftedge.microsoft.com/addons/detail/kiwix/jlepddlenlljlnnhjinfaciabanbnjbp)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## Usage

Install "Kiwix JS" from your browser's add-on store, or you can get it from http://download.kiwix.org/release/browsers/. Alternatively, bookmark or
install the PWA version from https://moz-extension.kiwix.org/current/. To install the PWA in Chromium browsers, go to Settings -> Apps ->
Install this site as an app. 

Additionally, the app requires ZIM archives that you can download from https://download.kiwix.org/zim/ or
https://wiki.kiwix.org/wiki/Content_in_all_languages. You have to download these separately, store them in your filesystem, and manually select them
after starting the application (or you can drag-and-drop one into the app).

It is unfortunately not yet technically possible to "remember" the selected ZIM file and open it automatically (browsers do not allow that for
security reasons). There are [versions of this app](https://www.kiwix.org/en/download/) that use frameworks like Electron, UWP or NWJS which have
this capability.

## Some technical details

Technically, after reading an article from a ZIM file, it is necessary to "inject" the dependencies (images, css, etc). For compatibility reasons,
there are two main ways of doing this:

- "JQuery" mode parses the DOM to find the HTML tags of these dependencies and modifies them to point to content we extract from the ZIM. This mode is
compatible with any browser. It works well on Mediawiki-based content but can miss some dependencies in some content;
- "ServiceWorker" mode uses a Service Worker to catch any HTTP request the page may send and reply with content read from the ZIM file. It is a
generic and much cleaner way of serving content to the browser than jQuery mode, but it does not work on all browsers. And Service Workers are
currently disabled by Mozilla in Firefox extensions. We use a workaround (an offline-first PWA version) as a substitute within the extension.

You can switch between these content injection modes in Configuration.

## Compatibility

Since the app is written in HTML/JavaScript, it should work in most recent browser engines and many older ones too, depending on the Content
Injection mode supported by the specific browser engine.

### Officially supported platforms

- Mozilla Firefox >=45 (as an extension : https://addons.mozilla.org/fr/firefox/addon/kiwix-offline/)
- Google Chrome (or Chromium) >=58 (as an extension : https://chrome.google.com/webstore/detail/kiwix/donaljnlmapmngakoipdmehbfcioahhk)
- Firefox OS >=1.2 (needs to be installed manually on the device with WebIDE)
- Microsoft Edge (Chromium) >=80 (as an add-on : https://microsoftedge.microsoft.com/addons/detail/kiwix/jlepddlenlljlnnhjinfaciabanbnjbp)
- Universal Windows Platform (UWP) >=10.0.10240, Electron and NWJS (as an HTML/JS application : see https://github.com/kiwix/kiwix-js-windows/)
- Ubuntu Touch (as an application : https://open-store.io/app/kiwix)

### Deprecated platforms

These platforms/browsers are deprecated. We still partially test against them, and we'll try to keep compatibility as long as it's not too complicated:

- Microsoft Edge Legacy >=40 (needs to run a local copy of the source code)
- Microsoft Internet Explorer 11 (needs to run a local copy of the source code)

## Licence

This application is released under the GPL v3 licence. See http://www.gnu.org/licenses/ or the included LICENSE-GPLv3.txt file
The source code can be found at https://github.com/kiwix/kiwix-js.

## Contributing

If you have some development experience with HTML and JavaScript, we welcome Pull Requests on existing issues. Please look at this repository's Issue
tracker, in particular those marked "good first issue". Please follow these guidelines when contributing:

- Ask to be assigned to an issue you wish to work on first (we have lots of back issues, some of which are no longer relevant or wanted);
- We ask you only to pick issues for which you are confident that you have a solution;
- Follow the coding style of the area you are editing, including indentation, and be consistent with quotation marks and spacing;
- Use no higher than [ECMAScript 5](https://caniuse.com/es5) - notably, do not use arrow functions or `async` functions. However, Promises *are*
  supported via a polyfill;
- Do not prettify code you are not working on;
- You must test your code yourself before asking for review, like this:
  - clone the repository;
  - set up a local Web server (we recommend Node/NPM's [http-server](https://www.npmjs.com/package/http-server));
  - serve the root directory of the repository (e.g. `http-server .`);
  - in a browser, navigate to the URL of the main `index.html` (e.g. http://localhost:8080/www/index.html);
  - manually test your fix in at least Firefox and Chromium (Edge or Chrome), ideally also in IE11 or in "IE Mode" in Edge;
  - be sure to test your fix in both "JQuery" mode and "Service Worker" mode (see Configuration);
  - run the Unit tests (see below) in at least the above browsers.

If your feature works and tests are passing, make a PR, describe the testing you have done, and ask for a code review.

Please note that the app caches its own code so that it can run as an offline-first Progressive Web App. This can complicate development, because you
may not see your changes, even after you refresh the browser. In Configuration, under "Expert settings", you will find a button that allows you to do
a full app reset, which will erase the PWA. When Service Worker mode is turned on, there is also a checkbox that bypasses the App Cache. You can turn
this on if you are frequently changing code and refreshing. Remember to turn it off for final testing. You can manually delete the App Cache in
the browser's DevTools (see Application or Storage tabs).

## Unit tests

Basic UI tests can be run by opening `tests/index.html` in Firefox, Edge, or Chromium/Chrome through a (local) web server.

You can also run the tests with npm. Before running the tests, a one-time setup is needed to fetch development dependencies from the npm registry.
Run `npm ci --ignore-scripts` to fetch the same versions as we use in CI. Then run `npm test` to run the tests against Chrome and Firefox headless
(these browsers need to be installed in default locations).

## Public releases and nightly builds

The browser extensions are distributed through the stores of each vendor (see links above). But the packages are also saved in https://download.kiwix.org/release/browsers/ if necessary.

Some nightly builds are generated, and should only be used for testing purpose: https://download.kiwix.org/nightly/.

There is a test implementation of the latest code at https://kiwix.github.io/kiwix-js/, but this is used for development, and may be buggy,
experimental or unstable.

## Previous versions

The first versions of this application were originally part of the Evopedia project: http://www.evopedia.info (discontinued). There was a "articles nearby" feature, that was able to find articles around your location. It has been deleted from the source code with everything related to Evopedia (but still in git history in versions<=2.0.0).

These first versions were targeting Firefox OS (now discontinued too: we're not lucky ;-) ).

See [CHANGELOG.md](CHANGELOG.md) for details of previous versions.
