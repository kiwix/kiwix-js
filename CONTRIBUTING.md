# Kiwix JS Contribution Guide

If you have some development experience with HTML and JavaScript, we welcome Pull Requests on existing issues. If you are thinking of contributing, we would kindly ask
you to read this guide very carefully **all the way through**. We often have potential contributors asking us to guide them on issues that are fully explained here!

If you are looking for an issue to work on, please look at this repository's Issue tracker, in particular those marked "good first issue". Ask to be assigned first before
starting work in case someone else is already working on an issue, and also to check that the issue is still wanted/current.

If you have found a bug, check first that we do not have an existing issue covering it, and if not, feel free to create one.

If you intend to contribute code rather than, say, documentation, then you will need to be (or become) familiar with the use of
[JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript), [git](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/GitHub),
[GitHub](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/GitHub) and
[Node Package Manager](https://nodejs.dev/en/learn/an-introduction-to-the-npm-package-manager/) (NPM). Instructions for installing Node/NPM and setting up are below.

## Build system and setup

Kiwix JS prides itself on supporting old frameworks and browsers, while not compromising on performance in modern browsers. Therefore we use a modern bundling
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
* Test the development server by running `npm run serve`. This will open the (unbundled) source code in your browser. **While viewing this, we strongly recommend**
  **that you go to configuration and turn on the option to Bypass AppCache under "Expert Settings", as this will ensure you are always looking at the latest version**
  (otherwise the app caches its own code, and you won't see your changes easily). You can exit this server by typing `q` in the Terminal that launched it;
* Test that bundling works by running `npm run preview`. This should build the app and launch a preview of the production code in a server. Again, we strongly recommend,
  while here, that you **turn on the Bypass AppCache option**. To exit this server, press `Ctrl-C` in the Terminal that launched it;
* You can build the bundled version without previewing it with `npm run build`. It will be built to the `/dist` directory.

You can use any Integrated Development Environment (IDE) that you wish. If you don't have a preference, we can recommend
[Visual Studio Code](https://code.visualstudio.com/). If using this, also install the
[ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) within VS Code.

## Contributing guidelines

To contribute code, please follow these guidelines carefully:

* Ask to be assigned to an issue you wish to work on first (we have lots of past issues, some of which are no longer relevant or wanted);
* We ask you only to pick issues for which you are confident that you have a solution;
* Check out a new branch with a name relevant to the issue you are working on;
* Follow the coding style of the area you are editing, including indentation, and be consistent with quotation marks and spacing. We use an ESLint configuration, so if your IDE
  supports this, it will advise you on the expected coding style;
* We use Rollup, Babel and core-js to bundle modules and transpile code to IE11+. The coding target has historically been [ECMAScript 5](https://caniuse.com/es5). If you use EM6
  features, be sure that they will transpile correctly. Arrow functions are OK, but you should avoid `async/await` unless you are creating your own new asynchronous function (you
  must not alter a large existing function to `async` style without consulting about it first). `Async/await` are just sugar for Promises, and all `await` can be rewritten as
  `Promise` functions (a Promise polyfill is included for older browsers). If you are working on small parts of existing functions, don't change the function style unnecessarily;
* Do not prettify code you are not working on -- we often have to ask contributors to revert commits because they have committed huge stylistic changes to a whole file, and we can't
  see the specific code they're working on;
* _Before asking for review, thoroughly **test** (see below) both the **source code** and the **production (bundled) code** on at least Chrome/Edge and Firefox, and_
  _**test that your code works as an add-on/extension** in both of these browsers. **If you have not tested your code yourself, do not expect us to test it and review it for you!**_

## Adding runtime dependencies via NPM

If your PR adds a runtime dependency with `npm install xxx` (as opposed to a development dependency with `npm install xxx --save-dev`), then you will need to ensure that your dependency files are available both in the unbundled and the bundled versions of the app, without simply committing them to `main`. You can find more details on how to do this in [ADDING_DEPENDENCIES_NODE_MODULES](./ADDING_DEPENDENCIES_NODE_MODULES.md). 

## Testing

Please note that the app caches its own code so that it can run as an offline-first Progressive Web App. This can complicate development, because you may not see your changes,
even after you refresh the browser. In Configuration, under "Expert settings", you will find a button that allows you to do a full app reset, which will erase the PWA. When
Service Worker mode is turned on, there is also a checkbox that bypasses the App Cache. You can turn this on if you are frequently changing code and refreshing. Remember to
turn it off for final testing. You can manually delete the App Cache in the browser's DevTools (see Application or Storage tabs) and manually delete/unregister the Service Worker.
We also recommend you disable the browser's built-in cache, using the checkbox in the DevTools Network tab. _In extremis_, you can also turn on the setting (in Chromium browsers)
under Application -> Service Workers to force the Service Worker to update itself on reload, though this can also force an update on each navigation and can give strange results.

_You must test your code yourself before asking for review, like this_:

* If you did the recommended setup above, you can test source code as you develop. Do this by starting the Vite development server with `npm run serve`. You should see a live view
  in your browser of the rendered source code. If the page looks disordered, and if you turned on the option "Bypass AppCache" as recommended above, then you can simply refresh
  (Ctrl-R) to re-compose the page (or for a more thorough refresh, open DevTools [F12], and press Ctrl-Shift-R). If you forgot to turn on "Bypass AppCache", you will need to
  search for it in the disordered display and try to turn it on.
* When you update code and save it in your IDE, the Vite live view will auto-refresh to show the latest version of your code (but only if "Bypass AppCache" is turned on);
* Once the source code is working as expected, you will need to build the production code and do full UI tests on that. To do this, you can run `npm run preview`, which will build
  the app and open it in the preview server. Note the address in the browser's address bar, and use this address to test in other browsers you have installed. Note that code built
  this way is not minified (though a minified bundle is also built, but not used). This is because testing minified code is not generally useful. However, if you wish to build and
  test a minified bundle, you can run `npm run build-min`;
* Manually test your bundle in at least Firefox and Chromium (Edge or Chrome), ideally also in IE11 or in "IE Mode" in Edge. Be sure that you actually load a ZIM and test the code in
  real-world scenarios. You can download ZIMs for testing from https://library.kiwix.org or https://download.kiwix.org/zim/;
* _You **must** test your fix in both "JQuery" mode and "ServiceWorker" modes_ (under Compatibility settings). You will be astonished the number of times a new contributor tells us
  that their fix is working, but we discover they only applied the fix in one of these two modes. Don't be **that** contributor!
* Unit tests, which test for regressions with basic app functions, are run automatically with GitHub Actions on each PR and push to a PR. If one of these tests fails, you will want
  to debug. First, see if you can also see the failure by running the tests with `npm test`, which should run the tests in all your installed browsers. To address any issues
  identified, see [TESTS](./TESTS.md) so you can debug;
* End-to-end (e2e) tests are also run on GitHub Actions when you push to your PR. These test typical user actions in a headless browser. Tests are currently enabled for latest
  Firefox, Edge, Chrome in Linux and Windows, and in IE Mode on Windows (this is the equivalent to testing on Internet Explorer 11). You can run these tests yourself in a
  non-headless browser with `npm run tests-e2e-firefox`, `npm run tests-e2e-iemode`, etc. For more information, see [TESTS](./TESTS.md). For IE Mode, you will need to have the Edge
  browser installed in Windows (the Linux version doesn't have IE Mode).
* E2e tests also run on BrowserStack, but these cannot be run for PRs from a forked repository for security reasons (no access to the secrets). These tests will only run once a
  maintainer merges your code, so don't be surprised if an issue is detected even after your code has been accepted and merged. In that case, we may request a remedial PR from you,
  though in practice this is unlikely. 
* As an alternative to the Vite server, we also provide [http-server](https://www.npmjs.com/package/http-server), which you can launch by running `npm run web-server` in the root of
  this repository. This does not have Hot Module Replacement, and you will need to refresh the page yourself by doing `Ctrl-Shift-R` with DevTools open. Again, you will only see the
  latest version of your code if you turn on "Bypass AppCache" and turn off the browser's native caching (see above).

If all the tests are working fine in your browsers, you **must finally test the extension versions with production code**. Please note that we are using Manifest V3 for the Chromium
extensions, and Manifest V2 for the Firefox extension, so there are different instructions for the two browser families:

* Build the production code by running `npm run build-min`;
* In Chromium, you can install the extension by loading the distribution folder with Extensions -> Load Unpacked (with Developer Mode turned ON) -> navigate to and enter the `dist` directory of the repository -> Select Folder;
* In Firefox, you need to rename `manifest.json` in the `dist` folder to `manifest.v3.json`, and then rename `manifest.v2.json` to `manifest.json`. Then you can load the extension with Manage Your Extensions -> Debug Add-ons -> Load Temporary Add-on, navigate to and enter the `dist` directory, and then pick any file in that directory;
* Optionally, you can also test the MV3 version for Firefox (though we currently only publish the MV2 version in the Mozilla store). To do this, look for `manifest.fx.v3.json` and rename this to `manifest.json` as above, and load the temporary extension in the same way (it might be easier if you remove the MV2 extension first);
* You only need to revert manifest changes if you want to do further testing with MV3. The `dist` folder is erased next time the app is built.

If your feature works and tests are passing, make a PR, describe the testing you have done, and ask for a code review. If you do not state what testing you have done, we reserve
the right not to review your code until you have completed these manual tests!
