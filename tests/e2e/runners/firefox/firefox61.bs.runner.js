import { Builder } from 'selenium-webdriver';
import legacyRayCharles from '../../spec/legacy-ray_charles.e2e.spec.js';

/* eslint-disable camelcase */

// Input capabilities
const capabilities = {
    'bstack:options': {
        os: 'Windows',
        osVersion: '10',
        browserVersion: '61.0',
        projectName: 'BStack Project Name: Kiwix JS e2e tests',
        buildName: 'BStack Build Name: Firefox 61',
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
    return driver;
};

const driver_fx = await loadFirefoxDriver();

// Maximize the window so that full browser state is visible in the screenshots
await driver_fx.manage().window().maximize();

// Run test in SW mode only
console.log('Running tests in Service Worker mode only for this browser version');
legacyRayCharles.runTests(driver_fx, ['serviceworker']);
