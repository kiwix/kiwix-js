# Kiwix JS Contribution Guide

If you have some development experience with HTML and JavaScript, we welcome Pull Requests on existing issues. Please look at this repository's Issue tracker,
in particular those marked "good first issue", but ask to be assigned first before starting work in case someoene else is already working on an issue, and also
to check that the issue is still wanted/current. If you have found a bug, check first that we do not have an existing issue covering it, and if not, feel free to
create one. If you intend to contribute code rather than, say, documentation, then you will need to be (or become) familiar with the use of
[JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript), [git](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/GitHub),
[GitHub](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/GitHub) and
[Node Package Manager](https://nodejs.dev/en/learn/an-introduction-to-the-npm-package-manager/) (NPM). Instructions for installing Node/NPM and setting up are below.

## Background and setup

Kiwix JS prides itself on supporting old frameworks and browsers, while not compromosing on the performance in modern browsers. Therefore we use a modern bundling
system, with [Rollup](https://rollupjs.org/), which transpiles code to [ECMAScript 5](https://caniuse.com/es5). Although you can run and test your code in a modern
browser without transpiling, you will need to transpile in order to test your code thoroughly. We also use some development tools that are very useful:
a [Vite server](https://vitejs.dev/) with Hot Module Replacement (this means real-time update of what you see in the browser while you develop), and
[ESLint](https://eslint.org/) code parser that will pick up many issues in your code and ensure good coding style. It is therefore strongly recommended that you
do a one-time setup before you start coding, like this:

* If you do not have them, install NodeJS, NPM and Git. You can find a guide for Linux/WSL [here](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl#install-nvm-nodejs-and-npm),
  and for Windows [here](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows);
* Create a personal fork  of Kiwix JS and clone it locally (for more details, see [Kiwix guidelines](https://github.com/kiwix/overview/blob/main/CONTRIBUTING.md));
* In a Terminal (Bash, PowerShell) run `npm install` in the project's root directory to install development and bundling dependencies;
* Test the development server by running `npm run serve`. This will open the (unbundled) source code in your browser. **Wh8le viewing this, we strongly recommend
  that you go to configuration and turn on the option to Bypass AppCache under "Expert Settings", as this will ensure you are always looking at the latest version
  (otherwise the app caches its own code, and you won't see your changes easily)**. You can exit this server by typing `q` in the Terminal that launched it;
* Test that bundling works by running `npm run preview`. This should build the app and launch it in a preview server. Again, we strongly recommend turning on the
  Bypass AppCache option here too. To exit this server, press `Ctrl-C` in the Terminal that launched it.

You can use any Integrated Development Environment (IDE) that you wish. If you don't have a preference, we can recommend [Visual Studio Code](https://code.visualstudio.com/).
If using this, also install the [ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) within VS Code.

## Contributing guidelines

Please follow these guidelines carefully:

* Ask to be assigned to an issue you wish to work on first (we have lots of past issues, some of which are no longer relevant or wanted);
* We ask you only to pick issues for which you are confident that you have a solution;
* Check out a new branch with a name relevant to the issue you are working on;
* Follow the coding style of the area you are editing, including indentation, and be consistent with quotation marks and spacing. We use an ESLint configuration, so if your IDE supports this, it will advise you on the expected coding style;
* We use Rollup, Babel and core-js to bundle modules and transpile code to IE11+. The coding target has historically been [ECMAScript 5](https://caniuse.com/es5). If you use EM6 features, be sure that they will transpile correctly. Arrow functions should be OK, but you should avoid `async` functions and use Promise format instead;
* Do not prettify code you are not working on;
* _Before asking for review, thoroughly *test* (see below) both the *source code* and the *production (bundled) code* on at least Chrome/Edge and Firefox, and *test that your code works as an add-on/extension* in both of these browsers. *If you have not tested your code yourself, do not expect us to review it!*_

## Testing

Please note that the app caches its own code so that it can run as an offline-first Progressive Web App. This can complicate development, because you
may not see your changes, even after you refresh the browser. In Configuration, under "Expert settings", you will find a button that allows you to do
a full app reset, which will erase the PWA. When Service Worker mode is turned on, there is also a checkbox that bypasses the App Cache. You can turn
this on if you are frequently changing code and refreshing. Remember to turn it off for final testing. You can manually delete the App Cache in
the browser's DevTools (see Application or Storage tabs) and manually delete/unregister the Service Worker. We also recommend you disable the browser's
built-in cache, using the checkbox in the DevTools Network tab.

_You must test your code yourself before asking for review, like this_:

* If you did the recommended setup above, you can test as you develop. Do this by starting the Vite development server with `npm run serve`. You should see a live view in your browser
  of your code. If the page looks disordered, and if you turned on the option "Bypass AppCache" as recommended above, then you can simply refresh (Ctrl-R) to re-compose the page. When
  you update code and save it in your IDE, this live view will auto-refresh to show the latest version of your code (but only if "Bypass AppCache" is turned on); 
* Manually test your fix in at least Firefox and Chromium (Edge or Chrome), ideally also in IE11 or in "IE Mode" in Edge;
* You **must** test your fix in both "JQuery" mode and "ServiceWorker" modes (under Compatibility settings). You will be astonished the number of times a new contributor tells me that
  their fix is working, but we discover they only applied the fix in one of these two modes. Don't be **that** contributor!
* **Run the Unit tests** with `npm test`, whcih should run the tests in all your installed browsers. Address any issues identified. If this is problematic, see below under "Unit tests";
* As an alternative to the Vite server, we also provide [http-server](https://www.npmjs.com/package/http-server), which you can launch by running `npm run web-server` in the root of
  this repository. This does not have Hot Module Replacement, and you will need to refresh the page yourself by doint `Ctrl-Shift-R` with DevTools open. Again, you will only see the latest version of your code if you turn on "Bypass AppCache" and turn off the browser's native caching (see above).

If all the tests are working fine in your browsers, you **must also test the extension versions**. Please note that we are using Manifest V3 for the Chromium extensions, and Manifest V2
for the Firefox extension, so there are different instructions for the two browser families:

* In Chromium, you can install the extension by loading the root folder with Extensions -> Load Unpacked (with Developer Mode turned ON) -> select the root folder of the repository;
* In Firefox, you need to rename manifest.json to manifest.v3.json, and then rename manifest.v2.json to manifest.json. Then you can load the extension with Manage Your Extensions -> Debug Add-ons -> Load Temporary Add-on, and then pick any file in the repository. Be sure to revert the file renaming before committing further code.

If your feature works and tests are passing, make a PR, describe the testing you have done, and ask for a code review. If you do not state what testing you have done, we reserve
the right not to review your code until you have completed these manual tests!

## Unit tests

You can manually run Unit tests simply by opening `tests/index.html` in Firefox, Edge, or Chromium/Chrome through a (local) web server, such as Vite or http-server (see above). Note
that this only tests the unbundled (source) code, and so it only works in browsers that support ES6 modules. You can't use these tests in IE11 or older Firefox/Chromium.

You can run the UI tests with npm on all your installed browsers with `npm test` in your terminal. Before running the tests, if you didn't already, you will need to fetch development
dependencies (see "Background and setup" above). If running tests in parallel like this produces unexpected results (some tests might be too slow and assert before they have completed
correctly), then you can run individual tests in headless mode with `npm run test-unit-firefox`, `npm run test-unit-edge`, etc. (see `package.json` for full list of scripts). Note that
browsers need to be available in standard locations for this to work: they won't be fetched or installed by the script.

If you want to run individual tests visually, not headless, it's easiest simply to open `tests/index.html` in the respective browser. If you really want to do it from the commandline,
then you'll need, e.g., `npx testcafe chrome ./tests/initTestCafe.js --app "http-server --silent -p 8080 ."` (adapt the browser as necessary). 
