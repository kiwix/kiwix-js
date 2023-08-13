import { Builder } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome.js';
import legacyRayCharles from './legacy-ray_charles.e2e.spec.js';

/* eslint-disable camelcase */

async function loadChromiumDriver () {
    const options = new Options();
    // Run it headless if the environment variable GITHUB_ACTIONS is set
    if (process.env.GITHUB_ACTIONS) {
        options.addArguments('--headless=new');
    }
    const driver = await new Builder(options)
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
    return driver;
};

const driver_chrome = await loadChromiumDriver();

// Maximize the window
await driver_chrome.manage().window().maximize();

legacyRayCharles.runTests(driver_chrome);
