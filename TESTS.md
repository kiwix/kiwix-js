# Automated tests

We run two types of automated tests on each push and pull request. These are Unit tests and End-to-end (e2e) tests. Unit tests are designed to test small units of code, crucial
functions that the rest of the app relies on. End-to-end tests are designed to test the functionality of the app as it might be used by a typical user.

## Unit tests

Unit tests are implemented, for historic reaons, with QUnit. When run in an automated way, these are currently run by using the browser testing framework Test_Café.

You can manually run and debug Unit tests simply by opening `tests/index.html` in Firefox, Edge, or Chromium/Chrome through a (local) web server, such as Vite or http-server (see
[CONTRIBUTING](https://github.com/kiwix/kiwix-js/blob/main/CONTRIBUTING.md)). Use DevTools (F12) to debug and find out what is failing. Note that this only tests the unbundled
(source) code, and so it only works in browsers that support ES6 modules. You *cannot* use these tests in IE11 or older Firefox/Chromium.

You can run the unit tests with npm on all your installed browsers with `npm test` in your terminal. Before running the tests, if you didn't already, you will need to fetch
development dependencies (see "[Build system and setup](https://github.com/kiwix/kiwix-js/blob/main/CONTRIBUTING.md#build-system-and-setup)"). If testing this way,
make sure that `http-server` is not already running, because another copy is launched for these tests, and the ports may conflict. If running tests in parallel like this produces
unexpected results (some tests might be too slow and assert before they have completed correctly), then you can run individual tests in headless mode with
`npm run test-unit-firefox`, `npm run test-unit-edge`, etc. (see `package.json` for full list of scripts). Note that browsers need to be available in standard locations for this
to work: they won't be fetched or installed by the script.

We currently use [TestCafé](https://testcafe.io/) to run the unit tests in headless browsers in GitHub actions. If you want to run this locally, you can find out which browsers it
knows about by running `npx testcafe --list-browsers` (it may take some time to discover local browsers).

When you run `npm test`, it will run the tests visually, not headless. The individual browser tests (e.g. `npm run test-unit-chrome`) are run headless. If you want to run these
individual tests visually, not headless, it's easiest simply to open `tests/index.html` in the respective browser, and this allows you to debug. If you really want to do it from the
commandline, then you'll need, e.g., `npx testcafe chrome ./tests/initTestCafe.js --app "http-server --silent -p 8080 ."` (adapt the browser as necessary).

## End-to-end tests

End-to-end (e2e) tests are implemented with Selenium WebDriver, which in turn uses Mocha as the testing framework. The tests can be found in the `tests` directory, and are
implemented as ES6 modules. Each test consists of a runner for a specified browser (e.g. `microsoftEdge.e2e.runner.js`) which in turn imports one or more specification test suites
(e.g. `legacy-ray_charles.e2e.spec.js`). The test suites load a specific ZIM archive, and undertake tests in both JQuery and ServiceWorker modes. Each ZIM tested should have its own
`e2e.spec.js` suite.

These tests are run automatically on every push and pull request by the GitHub Actions runner `CI.yml` (in the `.github/workflows` directory). They can also be run locally with the
following procedure:

* Ensure you have installed the dependencies (`npm install` in the project root);
* Ensure you have built the app with source code, so you can more easily debug (`npm build-src`);
* Ensure that no copy of `http-server` is currently running, because this will conflict with the test server that is launched with each test;
* Run `npm run test-e2e-firefox` (or edge or chrome) to check that it's working;
* If you have Microsoft Edge installed on Windows, you can run the tests in IE Mode with `npm run test-e2e-iemode`;
* You can run `npm run test-e2e` to run in all of Firefox, Chrome, Edge and IE Mode at once, but you will need to ensure all three browsers are installed in standard locations,
  and the IE Mode test will only work on Windows (Edge for Linux does not include this mode).

The ZIM archive that is tested is also found in `tests`. In the case of `legacy-ray_charles.e2e.spec.js`, this is a legacy split ZIM archive that has XZ compression, so a useful test
of that type of ZIM. We are looking to expand the tests to run also on a modern small ZIM with ZSTD compression and dynamic content.

If you wish to develop tests for a new archive, be sure to create a new `e2e.spc.js` file that corresponds to that archive. It will be easiest to duplicate the existing legacy
ray_charles suite and change the name of your copy. To luanch your new tests, you will need to add them to each browser's runner as an import. Finally, once the test is working
locally, it can be added to the corresponding script in `package.json` (`test-e2e-edge`, `test-e2e-chrome`, etc.).

Please note that we are currently using **Selenium** WebDriver, *not* WebDriver.io, which is a different (but related) project with subtly different test syntax.