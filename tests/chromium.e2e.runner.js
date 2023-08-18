import { Builder } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome.js';
import legacyRayCharles from './legacy-ray_charles.e2e.spec.js';
import gutenbergRo from './gutenberg_ro.e2e.spec.js';
import paths from './paths.js';

/* eslint-disable camelcase */

async function loadChromiumDriver () {
    const options = new Options();
    // Run it headless if the environment variable GITHUB_ACTIONS is set
    if (process.env.GITHUB_ACTIONS) {
        options.addArguments('--headless=new');
    }
    options.setUserPreferences({ 'download.default_directory': paths.downloadDir })
    const driver = await new Builder(options)
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    return driver;
};

legacyRayCharles.runTests(await loadChromiumDriver());
gutenbergRo.runTests(await loadChromiumDriver());
