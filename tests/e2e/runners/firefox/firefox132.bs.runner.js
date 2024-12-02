import { Builder } from 'selenium-webdriver';
import tonedearTests from '../../spec/tonedear.e2e.spec.js';

/* eslint-disable camelcase */

// Input capabilities
const capabilities = {
    'bstack:options': {
        os: 'Windows',
        osVersion: '11',
        browserVersion: '132.0.2',
        projectName: 'BStack Project Name: Kiwix JS e2e tests',
        buildName: 'BStack Build Name: Firefox 132',
        local: true,
        localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
        userName: process.env.BROWSERSTACK_USERNAME,
        accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        seleniumVersion: '3.141.59'
    },
    browserName: 'Firefox'
};

async function loadFirefoxDriver () {
    const driver = await new Builder()
        .usingServer('https://hub-cloud.browserstack.com/wd/hub')
        .withCapabilities(capabilities)
        .build();
    return driver;
};

const driver_fx = await loadFirefoxDriver();

// Maximize the window so that full browser state is visible in the screenshots
await driver_fx.manage().window().maximize();

// Run Tonedear tests in both modes if supported (assuming Firefox 132 supports Service Workers)
console.log(' ');
console.log('\x1b[33m%s\x1b[0m', 'Running Tonedear tests for Firefox 132');
console.log(' ');

// Run tests in both modes if needed
await tonedearTests.runTests(driver_fx, ['jquery', 'sw']); // Run in both jQuery and Service Worker modes if supported
