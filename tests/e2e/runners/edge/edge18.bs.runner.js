import { Builder } from 'selenium-webdriver';
import legacyRayCharles from '../../spec/legacy-ray_charles.e2e.spec.js';
import gutenbergRo from '../../spec/gutenberg_ro.e2e.spec.js';
import tonedear from '../../spec/tonedear.e2e.spec.js';

/* eslint-disable camelcase */

// Input capabilities
const capabilities = {
    'bstack:options': {
        os: 'Windows',
        osVersion: '10',
        browserVersion: '18.0',
        projectName: 'BStack Project Name: Kiwix JS e2e tests',
        buildName: 'BStack Build Name: Edge Legacy',
        local: true,
        localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
        userName: process.env.BROWSERSTACK_USERNAME,
        accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
        seleniumVersion: '4.10.0',
        edge: {
            enablePopups: true
        }
    },
    browserName: 'Edge'
};

async function loadEdgeLegacyDriver () {
    const driver = await new Builder()
        // .forBrowser('edge')
        .usingServer('https://hub-cloud.browserstack.com/wd/hub')
        .withCapabilities(capabilities)
        .build();
    // Maximize the window so that full browser state is visible in the screenshots
    await driver.manage().window().maximize();
    return driver;
};

// Chain driver loading and test running to avoid starting the driver before the previous test is finished
await loadEdgeLegacyDriver()
    .then(driver => tonedear.runTests(driver))
    .catch(err => console.error('Tonedear tests failed:', err));

await loadEdgeLegacyDriver()
    .then(driver => legacyRayCharles.runTests(driver))
    .catch(err => console.error('Ray Charles tests failed:', err));

await loadEdgeLegacyDriver()
    .then(driver => gutenbergRo.runTests(driver))
    .catch(err => console.error('Gutenberg tests failed:', err));
