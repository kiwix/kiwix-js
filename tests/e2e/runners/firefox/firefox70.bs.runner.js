import { Builder } from 'selenium-webdriver';
import gutenbergRo from '../../spec/gutenberg_ro.e2e.spec.js';
/* eslint-disable camelcase */

// Input capabilities
const capabilities = {
    'bstack:options': {
        os: 'Windows',
        osVersion: '10',
        browserVersion: '70.0',
        projectName: 'BStack Project Name: Kiwix JS e2e tests',
        buildName: 'BStack Build Name: Firefox 70',
        local: true,
        localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
        userName: process.env.BROWSERSTACK_USERNAME,
        accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        seleniumVersion: '4.1.2'
    },
    browserName: 'Firefox'
};

async function loadFirefoxDriver () {
    const driver = await new Builder()
        // .forBrowser('edge')
        .usingServer('https://hub-cloud.browserstack.com/wd/hub')
        .withCapabilities(capabilities)
        .build();
    // Maximize the window so that full browser state is visible in the screenshots
    await driver.manage().window().maximize();
    return driver;
};

const driver_gutenberg_fx = await loadFirefoxDriver();

// Run test in SW mode only
console.log('Running Gutenberg tests in ServiceWorker mode only for this browser version');
await gutenbergRo.runTests(driver_gutenberg_fx, ['serviceworker']);
