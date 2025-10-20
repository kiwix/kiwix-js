# Automated tests

[For information about manual tests we expect contributors to undertake before requesting a review, please see [Contributing -> Testing](./CONTRIBUTING.md#testing).
The information below is about the automated testing that is undertaken. You will need this information if an automated test fails, so that you can debug the failure
by running the automated tests locally.]

We run two types of automated tests on each push and pull request. These are Unit tests and End-to-end (e2e) tests. Unit tests are designed to test small units of code, crucial
functions that the rest of the app relies on. End-to-end tests are designed to test the functionality of the app as it might be used by a typical user.

## Unit tests

Unit tests are implemented using Mocha.

You can run the Unit tests in a NodeJS environment with `npm test` in your terminal. Before running the tests, if you didn't already,
you will need to fetch development dependencies (see "[Build system and setup](./CONTRIBUTING.md#build-system-and-setup)").

## End-to-end tests

End-to-end (e2e) tests are implemented with [Selenium WebDriver](https://www.selenium.dev/documentation/webdriver/), which in turn uses [Mocha](https://mochajs.org/) as the testing
framework. The tests can be found in the `tests/e2e` directory, and are implemented as ES6 modules. Each test consists of a runner for a specified browser (e.g.
`microsoftEdge.e2e.runner.js`) which in turn imports one or more specification test suites (e.g. `legacy-ray_charles.e2e.spec.js`). The test suites load a specific ZIM archive,
and undertake tests in both jQuery and ServiceWorker modes. Each ZIM tested should have its own `e2e.spec.js` suite. You will also see some runners designed to do remote testing on legacy browsers on BrowserStack. These are named `*.bs.runner.js`.

Standard e2e tests on GitHub Actions are run automatically on every push and pull request by the GitHub Actions runner `CI.yml` (in the `.github/workflows` directory). They can also
be run locally with the following procedure:

* Ensure you have installed the dependencies (`npm install` in the project root);
* **Build the app first:** The e2e tests require a built version of the app. Run `npm run build-src` (for easier debugging with source maps) or `npm run build` (for production build);
* **Run tests from the project root:** After building, run the tests from the project root directory using the commands below - they will test the built version in `dist/www/`;
* The test runner automatically starts an `http-server` instance and cleanly shuts it down after tests complete, so you don't need to manually start a server;
* The script will verify that `dist/www/index.html` exists and give you a helpful error if you forgot to build;
* Run `npm run test-e2e-firefox` (or `test-e2e-edge` or `test-e2e-chrome`) to run tests in a specific browser;
* If you have Microsoft Edge installed on Windows, you can run the tests in IE Mode with `npm run test-e2e-iemode`;
* You can run `npm run test-e2e` to run all browser tests sequentially (Firefox, Chrome, Edge, and IE Mode), but you will need to ensure all browsers are installed in standard locations, and the IE Mode test will only work on Windows (Edge for Linux does not include this mode);
* If you need to run tests multiple times in the same terminal session, the server cleanup ensures the port is properly released between runs;
* **Note:** If you're iterating on code changes, you'll need to rebuild (`npm run build-src`) between test runs to see your changes reflected in the tests.

The runners designed for BrowserStack do not work with PRs from forked repositories for security reasons (they cannot have access to the secrets needed to authenticate with
BrowserStack). However, if you are interested in developing local tests, a maintainer can run a parallel PR to your own that will run these tests to ensure that your code does
not break them.

The ZIM archives that are tested are found in `tests/zims`. In the case of `legacy-ray_charles.e2e.spec.js`, this is a legacy split ZIM archive that has XZ compression, so a useful test
of that type of ZIM. Another test suite, `gutenberg_ro.e2e.spec.js`, tests a modern Gutenberg ZIM with ZSTD compression and dynamic content. The `tonedear.e2e.spec.js` suite tests a small
modern ZIM with multimedia content.

If you wish to develop tests for a new archive, be sure to create a new `e2e.spec.js` file that corresponds to that archive. It will be easiest to duplicate one of the existing test suites and change the name of your copy. Be sure that the filename easily allows developers to identify which ZIM it corresponds to. To launch your new tests, you will
need to add them to each browser's runner as an import. You will need to load a new instance of the driver (in the respective `*.e2e.spec.js` files) to run your new test suite.
Tests should run in chronological order of ZIM archives (oldest ZIM archives should be tested first).

Please note that we are currently using **Selenium** WebDriver, *not* WebDriver.io, which is a different (but related) project with subtly different test syntax.
