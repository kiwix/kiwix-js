import { Builder } from 'selenium-webdriver';
import legacyRayCharles from './legacy-ray_charles.e2e.spec.js';

/* eslint-disable camelcase */

// Input capabilities
const capabilities = {
    'bstack:options': {
        os: 'OS X',
        osVersion: 'Mojave',
        browserVersion: '12.0',
        projectName: 'BStack Project Name: Kiwix JS e2e tests',
        buildName: 'BStack Build Name: Safari 12 on Mojave',
        local: true,
        localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
        userName: process.env.BROWSERSTACK_USERNAME,
        accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        seleniumVersion: '4.10.0'
    },
    browserName: 'Safari'
};

async function loadSafariDriver () {
    const driver = await new Builder()
        // .forBrowser('edge')
        .usingServer('https://hub-cloud.browserstack.com/wd/hub')
        .withCapabilities(capabilities)
        .build();
    return driver;
};

const driver_safari = await loadSafariDriver();

// Maximize the window so that full browser state is visible in the screenshots
await driver_safari.manage().window().maximize();

legacyRayCharles.runTests(driver_safari);
