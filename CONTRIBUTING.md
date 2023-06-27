# Kiwix JS Contribution Guide

If you have some development experience with HTML and JavaScript, we welcome Pull Requests on existing issues. If you are thinking of contributing, we would ask you
to please read this guide very carefually **all the way through**. We often have potential contributors asking us to guide them on issues that are fully explained here!

If you are looking for an issue to work on, please look at this repository's Issue tracker, in particular those marked "good first issue". Ask to be assigned first before
starting work in case someoene else is already working on an issue, and also to check that the issue is still wanted/current.

If you have found a bug, check first that we do not have an existing issue covering it, and if not, feel free to create one.

If you intend to contribute code rather than, say, documentation, then you will need to be (or become) familiar with the use of
[JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript), [git](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/GitHub),
[GitHub](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/GitHub) and
[Node Package Manager](https://nodejs.dev/en/learn/an-introduction-to-the-npm-package-manager/) (NPM). Instructions for installing Node/NPM and setting up are below.

## Build system and setup

Kiwix JS prides itself on supporting old frameworks and browsers, while not compromosing on the performance in modern browsers. Therefore we use a modern bundling
system, with [Rollup](https://rollupjs.org/), which transpiles code to [ECMAScript 5](https://caniuse.com/es5). Although you can run and test your code in a modern
browser without transpiling, you will need to transpile in order to test your code thoroughly. We also use some development tools that are very useful:
a [Vite server](https://vitejs.dev/) with Hot Module Replacement (this means real-time update of what you see in the browser while you develop), and
[ESLint](https://eslint.org/) code parser that will pick up many issues in your code and ensure good coding style. It is therefore strongly recommended that you
do a one-time setup before you start coding, like this:

* If you do not have them, install NodeJS, NPM and Git. You can find a guide for Linux/WSL
  [here](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl#install-nvm-nodejs-and-npm),
  and for Windows [here](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows);
* Create a personal fork  of Kiwix JS and clone it locally (for more details, see [Kiwix guidelines](https://github.com/kiwix/overview/blob/main/CONTRIBUTING.md));
* In a Terminal (Bash, PowerShell) run `npm install` in the project's root directory to install development and bundling dependencies;
* Test the development server by running `npm run serve`. This will open the (unbundled) source code in your browser. **While viewing this, we strongly recommend
  that you go to configuration and turn on the option to Bypass AppCache under "Expert Settings", as this will ensure you are always looking at the latest version
  (otherwise the app caches its own code, and you won't see your changes easily)**. You can exit this server by typing `q` in the Terminal that launched it;
* Test that bundling works by running `npm run preview`. This should build the app and launch a preview of the production code in a server. Again, we strongly recommend,
  while here, that you turn on the Bypass AppCache option. To exit this server, press `Ctrl-C` in the Terminal that launched it.

You can use any Integrated Development Environment (IDE) that you wish. If you don't have a preference, we can recommend [Visual Studio Code](https://code.visualstudio.com/).
If using this, also install the [ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) within VS Code.

## Contributing guidelines

To contribute code, please follow these guidelines carefully:

* Ask to be assigned to an issue you wish to work on first (we have lots of past issues, some of which are no longer relevant or wanted);
* We ask you only to pick issues for which you are confident that you have a solution;
* Check out a new branch with a name relevant to the issue you are working on;
* Follow the coding style of the area you are editing, including indentation, and be consistent with quotation marks and spacing. We use an ESLint configuration, so if your IDE
  supports this, it will advise you on the expected coding style;
* We use Rollup, Babel and core-js to bundle modules and transpile code to IE11+. The coding target has historically been [ECMAScript 5](https://caniuse.com/es5). If you use EM6
  features, be sure that they will transpile correctly. Arrow functions should be OK, but you should avoid `async` functions and use Promise functions instead. If working on small
  parts of existing functions, don't change the function style unnecessarily;
* Do not prettify code you are not working on -- we often have to ask contributors to revert commits because they have committed huge stylistic changes to a whole file, and we can't
  see the specific code they're working on;
* _Before asking for review, thoroughly **test** (see below) both the **source code** and the **production (bundled) code** on at least Chrome/Edge and Firefox, and_
  _**test that your code works as an add-on/extension** in both of these browsers. **If you have not tested your code yourself, do not expect us test it and review it for you!**_

## Testing

Please note that the app caches its own code so that it can run as an offline-first Progressive Web App. This can complicate development, because you may not see your changes,
even after you refresh the browser. In Configuration, under "Expert settings", you will find a button that allows you to do a full app reset, which will erase the PWA. When
Service Worker mode is turned on, there is also a checkbox that bypasses the App Cache. You can turn this on if you are frequently changing code and refreshing. Remember to
turn it off for final testing. You can manually delete the App Cache in the browser's DevTools (see Application or Storage tabs) and manually delete/unregister the Service Worker.
We also recommend you disable the browser's built-in cache, using the checkbox in the DevTools Network tab.

_You must test your code yourself before asking for review, like this_:

* If you did the recommended setup above, you can test source code as you develop. Do this by starting the Vite development server with `npm run serve`. You should see a live view
  in your browser of the rendered source code. If the page looks disordered, and if you turned on the option "Bypass AppCache" as recommended above, then you can simply refresh
  (Ctrl-R) to re-compose the page (or for a more thorough refresh, open DevTools [F12], and press Ctrl-Shift-R). When you update code and save it in your IDE, this live view will
  auto-refresh to show the latest version of your code (but only if "Bypass AppCache" is turned on);
* Once the source code is working as expected, you will need to build the production code and do full UI tests on that. To do this, you can run `npm run preview`, which will build
  the app and open it in the preview server. Note the address in the browser's address bar, and use this address to test in other browsers you have installed. Note that code built
  this way is not minified (though a minified bundle is also built, but not used). This is because testing minified code is not generally useful. However, if you wish to build and
  test a minified bundle, you can run `npm run build-min`;
* Manually test your bundle in at least Firefox and Chromium (Edge or Chrome), ideally also in IE11 or in "IE Mode" in Edge. Be sure that you actually load a ZIM and test the code in
  real-world scenarios;
* _You **must** test your fix in both "JQuery" mode and "ServiceWorker" modes_ (under Compatibility settings). You will be astonished the number of times a new contributor tells us
  that their fix is working, but we discover they only applied the fix in one of these two modes. Don't be **that** contributor!
* **Run the Unit tests** with `npm test`, whcih should run the tests in all your installed browsers. These test for regressions with basic functions. Address any issues identified.
  If running this command proves problematic, see below under "Unit tests" for alternative ways of running them;
* As an alternative to the Vite server, we also provide [http-server](https://www.npmjs.com/package/http-server), which you can launch by running `npm run web-server` in the root of
  this repository. This does not have Hot Module Replacement, and you will need to refresh the page yourself by doing `Ctrl-Shift-R` with DevTools open. Again, you will only see the latest version of your code if you turn on "Bypass AppCache" and turn off the browser's native caching (see above).

If all the tests are working fine in your browsers, you **must finally test the extension versions**. Please note that we are using Manifest V3 for the Chromium extensions,
and Manifest V2 for the Firefox extension, so there are different instructions for the two browser families:

* In Chromium, you can install the extension by loading the root folder with Extensions -> Load Unpacked (with Developer Mode turned ON) -> select the root folder of the repository;
* In Firefox, you need to rename manifest.json to manifest.v3.json, and then rename manifest.v2.json to manifest.json. Then you can load the extension with Manage Your Extensions -> Debug Add-ons -> Load Temporary Add-on, and then pick any file in the repository. Be sure to revert the file renaming before committing further code.

If your feature works and tests are passing, make a PR, describe the testing you have done, and ask for a code review. If you do not state what testing you have done, we reserve
the right not to review your code until you have completed these manual tests!

## Unit tests

You can manually run Unit tests simply by opening `tests/index.html` in Firefox, Edge, or Chromium/Chrome through a (local) web server, such as Vite or http-server (see above). Note
that this only tests the unbundled (source) code, and so it only works in browsers that support ES6 modules. You can't use these tests in IE11 or older Firefox/Chromium.

You can run the UI tests with npm on all your installed browsers with `npm test` in your terminal. Before running the tests, if you didn't already, you will need to fetch development
dependencies (see "Background and setup" above). If testing this way, make sure that `http-server` is not already running, because it is used for these tests. If running tests in
parallel like this produces unexpected results (some tests might be too slow and assert before they have completed correctly), then you can run individual tests in headless mode with
`npm run test-unit-firefox`, `npm run test-unit-edge`, etc. (see `package.json` for full list of scripts). Note that browsers need to be available in standard locations for this to work:
they won't be fetched or installed by the script.

If you want to run individual tests visually, not headless, it's easiest simply to open `tests/index.html` in the respective browser. If you really want to do it from the commandline,
then you'll need, e.g., `npx testcafe chrome ./tests/initTestCafe.js --app "http-server --silent -p 8080 ."` (adapt the browser as necessary). 
