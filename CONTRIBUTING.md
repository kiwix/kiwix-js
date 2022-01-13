# Kiwix JS Contribution Guide

If you have some development experience with HTML and JavaScript, we welcome Pull Requests on existing issues. Please look at this repository's Issue
tracker, in particular those marked "good first issue". Please follow these guidelines when contributing:

- Ask to be assigned to an issue you wish to work on first (we have lots of back issues, some of which are no longer relevant or wanted);
- We ask you only to pick issues for which you are confident that you have a solution;
- If you are a newcomer to the repo, create a personal fork and clone it locally. Chekout a new branch with a name relavant to the issue you are working on;
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
- If all the tests are working fine, you can test the actual extension version in the end, like this:
  - Remove the '-WIP' from the version key from the manifest.json file present in the root of this repo;
  - Load the root folder manually in chrome(or any other browser) to install the extension;

If your feature works and tests are passing, make a PR, describe the testing you have done, and ask for a code review.

Please note that the app caches its own code so that it can run as an offline-first Progressive Web App. This can complicate development, because you
may not see your changes, even after you refresh the browser. In Configuration, under "Expert settings", you will find a button that allows you to do
a full app reset, which will erase the PWA. When Service Worker mode is turned on, there is also a checkbox that bypasses the App Cache. You can turn
this on if you are frequently changing code and refreshing. Remember to turn it off for final testing. You can manually delete the App Cache in
the browser's DevTools (see Application or Storage tabs).
