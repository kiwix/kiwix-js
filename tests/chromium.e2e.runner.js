import { Builder } from 'selenium-webdriver';
import e2e from './kiwix-js.e2e.spec.js';

/* eslint-disable camelcase */

async function loadChromiumDriver () {
    const driver = await new Builder().forBrowser('chrome').build();
    return driver;
};

const driver_fx = await loadChromiumDriver();

e2e.runTests(driver_fx);
