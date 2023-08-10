import { Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import legacyRayCharles from './legacy-ray_charles.e2e.spec.js';

/* eslint-disable camelcase */

async function loadFirefoxDriver () {
    const options = new firefox.Options();
    // Run it headless if the environment variable GITHUB_ACTIONS is set
    if (process.env.GITHUB_ACTIONS) {
        options.headless();
    }
    const driver = await new Builder(options)
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();
    return driver;
};

const driver_fx = await loadFirefoxDriver();

legacyRayCharles.runTests(driver_fx);
