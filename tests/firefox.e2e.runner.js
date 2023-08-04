import { Builder } from 'selenium-webdriver';
import e2e from './kiwix-js.e2e.spec.js';

/* eslint-disable camelcase */

async function loadFirefoxDriver () {
    const driver = await new Builder().forBrowser('firefox').build();
    return driver;
};

const driver_fx = await loadFirefoxDriver();

e2e.runTests(driver_fx);
