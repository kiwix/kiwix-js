# Kiwix JS Contribution Guide

If you have some development experience with HTML and JavaScript, we welcome Pull Requests on existing issues. Please look at this repository's Issue
tracker, in particular those marked "good first issue". If you have found a bug, check first that we do not have an existing issue covering it, and if not, feel free to create an issue.

Please follow these guidelines when contributing:

- Ask to be assigned to an issue you wish to work on first (we have lots of past issues, some of which are no longer relevant or wanted);
- We ask you only to pick issues for which you are confident that you have a solution;
- If you are a newcomer to the repo, create a personal fork and clone it locally (for more details, see [Kiwix guidelines](https://github.com/kiwix/overview/blob/main/CONTRIBUTING.md)). Check out a new branch with a name relevant to the issue you are working on;
- Follow the coding style of the area you are editing, including indentation, and be consistent with quotation marks and spacing;
- Use no higher than [ECMAScript 5](https://caniuse.com/es5) - notably, do not use arrow functions or `async` functions. However, Promises *are*
  supported via a polyfill;
- Do not prettify code you are not working on;
- You must test your code yourself before asking for review, like this:
  - set up a local Web server: we recommend Node/NPM's [http-server](https://www.npmjs.com/package/http-server)), which you can launch by running `npm run serve` in the root of this repository;
  - in a browser, navigate to the URL of the main `index.html` (e.g. http://localhost:8080/www/index.html);
  - manually test your fix in at least Firefox and Chromium (Edge or Chrome), ideally also in IE11 or in "IE Mode" in Edge;
  - be sure to test your fix in both "JQuery" mode and "Service Worker" mode (see Configuration);
  - run the Unit tests (see below) in at least the above browsers.

If all the tests are working fine, you can finally test the extension versions. Plese note that we are using Manifest V3 for the Chromium extensions, and Manifest V2
for the Firefox extension, so there are different instructions for the two browser families:

  - In Chromium, you can install the extension by loading the root folder with Extensions -> Load Unpacked (with Developer Mode turned ON) -> select the root folder of the repository;
  - In Firefox, you need to rename manifest.json to manifest.v3.json, and then rename manifest.v2.json to manifest.json. Then you can load the extension with Manage Your Extensions -> Debug Add-ons -> Load Temporary Add-on, and then pick any file in the repository.

If your feature works and tests are passing, make a PR, describe the testing you have done, and ask for a code review.

Please note that the app caches its own code so that it can run as an offline-first Progressive Web App. This can complicate development, because you
may not see your changes, even after you refresh the browser. In Configuration, under "Expert settings", you will find a button that allows you to do
a full app reset, which will erase the PWA. When Service Worker mode is turned on, there is also a checkbox that bypasses the App Cache. You can turn
this on if you are frequently changing code and refreshing. Remember to turn it off for final testing. You can manually delete the App Cache in
the browser's DevTools (see Application or Storage tabs). We also recommend you disable the browser's built-in cache, using the checkbox in the DevTools Network tab.

## Unit tests

Basic UI tests can be run by opening `tests/index.html` in Firefox, Edge, or Chromium/Chrome through a (local) web server.

You can also run the UI tests with npm. Before running the tests, a one-time setup is needed to fetch development dependencies from the npm registry.
Run `npm ci --ignore-scripts` to fetch the same versions as we use in CI. Then run `npm test` to run the tests against Chrome and Firefox headless
(these browsers need to be installed in default locations).
