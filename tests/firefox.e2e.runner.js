import { Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import legacyRayCharles from './legacy-ray_charles.e2e.spec.js';
import gutenbergRo from './gutenberg_ro.e2e.spec.js';
import paths from './paths.js';

/* eslint-disable camelcase */

async function loadFirefoxDriver () {
    const options = new firefox.Options();
    // Run it headless if the environment variable GITHUB_ACTIONS is set
    if (process.env.GITHUB_ACTIONS) {
        options.headless();
    }
    options.setPreference('browser.download.folderList', 2);
    options.setPreference('browser.download.dir', paths.downloadDir);
    options.setPreference('browser.download.manager.showWhenStarting', false);
    options.setPreference('browser.helperApps.neverAsk.saveToDisk', 'octet-stream');
    const driver = await new Builder(options)
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build();
    return driver;
};

legacyRayCharles.runTests(await loadFirefoxDriver());
gutenbergRo.runTests(await loadFirefoxDriver());
