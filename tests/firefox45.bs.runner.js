import { Builder } from 'selenium-webdriver';
import legacyRayCharles from './legacy-ray_charles.e2e.spec.js';

/* eslint-disable camelcase */

// Input capabilities
const capabilities = {
    'bstack:options': {
        os: 'Windows',
        osVersion: '10',
        browserVersion: '45.0',
        projectName: 'BStack Project Name: Kiwix JS e2e tests',
        buildName: 'BStack Build Name: Firefox Legacy 45',
        local: true,
        localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
        userName: process.env.BROWSERSTACK_USERNAME,
        accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        seleniumVersion: '3.2.0'
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

// Run tests in jQuery mode only (this browser does not support Service Workers)
const driver_fx = await loadFirefoxDriver();

// Maximize the window so that full browser state is visible in the screenshots
await driver_fx.manage().window().maximize();

legacyRayCharles.runTests(driver_fx, ['jquery']);
