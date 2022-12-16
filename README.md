# Kiwix JS

Kiwix is an offline viewer for Wikipedia, Stackexchange, Project Gutenberg, and other Web resources packaged as highly compressed ZIM
archives. For full information about the open-source Kiwix project, see our main Web site: https://www.kiwix.org/.

Kiwix JS is an official HTML5/Javascript implementation of the Kiwix software, principally targeting browser extensions or add-ons. You
can get the extension, completely free, from the Mozilla, Chrome and Edge extension stores (search for "Kiwix", or click on a badge
below). There is also a version implemented as an offline-first Progressive Web App (PWA) at https://moz-extension.kiwix.org/current/,
primarily intended for use within the Mozilla Extension.

Once you have obtained an archive (see below), select it in Kiwix JS, or drag-and-drop it into the app, and start searching for article
titles. No further Internet access is required to read the archive's content. For example, you can have the entire content of Wikipedia
in your own language inside your device (including images and audiovisual content) entirely offline. If your Internet access is
expensive, intermittent, slow, unreliable, controlled or censored, you can still have offline access to this amazing repository of
knowledge, information and culture.

The reader also works with other content in the [OpenZIM format](https://wiki.openzim.org/wiki/OpenZIM), but our main targets are
Mediawiki-based content (Wikipedia, Wikivoyage, Wikitionary, etc.), StackExchange, Project Gutenberg and TED Talks.

[![Build Status: Continuous Integration](https://github.com/kiwix/kiwix-js/workflows/CI/badge.svg?query=branch%3Amain)](https://github.com/kiwix/kiwix-js/actions?query=branch%3Amain)
[![Build Status: Release](https://github.com/kiwix/kiwix-js/workflows/Release/badge.svg?query=branch%3Amain)](https://github.com/kiwix/kiwix-js/actions?query=branch%3Amain)
[![CodeFactor](https://www.codefactor.io/repository/github/kiwix/kiwix-js/badge)](https://www.codefactor.io/repository/github/kiwix/kiwix-js)
[![Kiwix for Firefox](https://img.shields.io/amo/v/kiwix-offline?label=Kiwix%20for%20Firefox)](https://addons.mozilla.org/fr/firefox/addon/kiwix-offline/)
[![Kiwix for Chrome](https://img.shields.io/chrome-web-store/v/donaljnlmapmngakoipdmehbfcioahhk?label=Kiwix%20for%20Chrome)](https://chrome.google.com/webstore/detail/kiwix/donaljnlmapmngakoipdmehbfcioahhk)
[![Kiwix for Edge](https://img.shields.io/badge/dynamic/json?label=Kiwix%20for%20Edge&prefix=v&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fjlepddlenlljlnnhjinfaciabanbnjbp)](https://microsoftedge.microsoft.com/addons/detail/kiwix/jlepddlenlljlnnhjinfaciabanbnjbp)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## Usage

Install "Kiwix JS" from your browser's add-on store. This is the best way to get the extension, because it will be kept up to date automatically. If
you would rather not use a store, you can get a file-based version of the extension from http://download.kiwix.org/release/browsers/, but you will
have to update this manually. Alternatively, you can bookmark or install the PWA version from https://moz-extension.kiwix.org/current/ (it will
auto-update). To install the PWA in Chromium browsers, go to Settings -> Apps -> Install this site as an app.

Additionally, the app requires ZIM archives that you can download from https://download.kiwix.org/zim/ or
https://wiki.kiwix.org/wiki/Content_in_all_languages. You have to download these separately, store them in your filesystem, and manually select them
after starting the application (or you can drag-and-drop one into the app).

## Some technical details

Technically, after reading an article from a ZIM file, it is necessary to "inject" the dependencies (images, css, etc). For compatibility reasons,
there are two main ways of doing this:

- "ServiceWorker" mode (the default) uses a Service Worker to catch any HTTP request the page may send and reply with content read from
the ZIM file. It is a generic and clean way of serving content to the browser. It works in any recent browser, but not in older ones.
Service Workers are currently disabled by Mozilla in Firefox extensions, but we use a workaround (an offline-first PWA version) as a
substitute within the extension;
- "JQuery" mode (deprecated) parses the DOM to find the HTML tags of the dependencies and modifies them to point to content we extract
from the ZIM. This mode is compatible with any browser, but it cannot run JavaScript inside the ZIM file, so some ZIMs with dynamic
content do not work well (if at all). However, Mediawiki-based content (e.g. Wikipedia) works fine in this mode.

You can switch between these content injection modes in Configuration, but if your browser supports ServiceWorker mode, you are strongly
advised to remain in this mode.

## Compatibility

Since the app is written in HTML/JavaScript, it should work in most recent browser engines and many older ones too, depending on the Content
Injection mode supported by the specific browser engine.

### Officially supported platforms

- Mozilla Firefox >=52 (as an extension : https://addons.mozilla.org/fr/firefox/addon/kiwix-offline/)
- Google Chrome (or Chromium) >=58 (as an extension : https://chrome.google.com/webstore/detail/kiwix/donaljnlmapmngakoipdmehbfcioahhk)
- Microsoft Edge (Chromium) >=79 (as an add-on : https://microsoftedge.microsoft.com/addons/detail/kiwix/jlepddlenlljlnnhjinfaciabanbnjbp)
- Electron >=1.8.0 and NWJS >=0.14.7 (as an application : see https://kiwix.github.io/kiwix-js-windows/kiwix-js-electron.html)
- Universal Windows Platform (UWP) >=10.0.10240 (as an HTML/JS application : see https://www.microsoft.com/store/apps/9P8SLZ4J979J)
- Ubuntu Touch (as an application : https://open-store.io/app/kiwix)

### Deprecated platforms

These platforms/browsers are deprecated. We still partially test against them, and we'll try to keep compatibility as long as it's not too complicated:

- Firefox OS >=1.2 (needs to be installed manually on the device with WebIDE)
- Microsoft Edge Legacy >=40 (needs to run a local copy of the source code)
- Microsoft Internet Explorer 11 (needs to run a local copy of the source code)

### Limitations

It is unfortunately not yet technically possible to "remember" the selected ZIM file and open it automatically (browsers do not allow that for
security reasons). There are [versions of this app](https://www.kiwix.org/en/download/) that use frameworks like Electron, UWP or NWJS which have
this capability. You can drag-and-drop a ZIM file into the app, which is a quick way to open an archive and switch between several archives in a
folder.

Although the app has fast title search, it cannot yet do full text search of the entire archive. This may be possible in the future.

## Licence

This application is released under the GPL v3 licence. See http://www.gnu.org/licenses/ or the included LICENSE-GPLv3.txt file
The source code can be found at https://github.com/kiwix/kiwix-js.

## Contributing

Kiwix JS is an open-source project. We encourage individuals with experience of HTML and JavaScript development to contribute to the documentation and code in this repository.

To report a bug, read our [REPORT_BUG](REPORT_BUG.md) guide.

For code contributions, read our [CONTRIBUTING](CONTRIBUTING.md) guide.

To get to know the Kiwix project better, please familiarize yourself with the content on https://www.kiwix.org. There is also a Kiwix [Slack](https://join.slack.com/t/kiwixoffline/shared_invite/zt-19s7tsi68-xlgHdmDr5c6MJ7uFmJuBkg) group which you can join.

We also have a [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md) : everybody is expected to follow it.

## Public releases and nightly builds

The browser extensions are distributed through the stores of each vendor (see links above). But the packages are also saved in https://download.kiwix.org/release/browsers/ if necessary.

Some nightly builds are generated, and should only be used for testing purpose: https://download.kiwix.org/nightly/.

There is a test implementation of the latest code at https://kiwix.github.io/kiwix-js/, but this is used for development, and may be buggy, experimental or unstable.

## Previous versions

The first versions of this application were originally part of the Evopedia project: http://www.evopedia.info (discontinued). There was an "articles nearby" feature, that was able to find articles around your location. It has been deleted from the source code with everything related to Evopedia (but still in git history in versions<=2.0.0).

These first versions were targeting Firefox OS (discontinued too: we're not lucky ;-) ).

See [CHANGELOG.md](CHANGELOG.md) for details of previous versions.
