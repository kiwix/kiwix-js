import { Builder } from 'selenium-webdriver';
import legacyRayCharles from './legacy-ray_charles.e2e.spec.js';

/* eslint-disable camelcase */

// Input capabilities
const capabilities = {
    'bstack:options': {
        os: 'Windows',
        osVersion: '10',
        browserVersion: '56.0',
        projectName: 'BStack Project Name: Kiwix JS e2e tests',
        buildName: 'BStack Build Name: Firefox Legacy',
        localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
        userName: process.env.BROWSERSTACK_USERNAME,
        accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        seleniumVersion: '3.141.59'
    },
    browserName: 'Firefox'
};

async function loadFireFoxDriver () {
    const driver = await new Builder()
        // .forBrowser('edge')
        .usingServer('https://hub-cloud.browserstack.com/wd/hub')
        .withCapabilities(capabilities)
        .build();
    return driver;
};

const driver_fx = await loadFireFoxDriver();

legacyRayCharles.runTests(driver_fx);
