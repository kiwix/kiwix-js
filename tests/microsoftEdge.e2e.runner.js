import { Builder } from 'selenium-webdriver';
import e2e from './kiwix-js.e2e.spec.js';

/* eslint-disable camelcase */

async function loadMSEdgeDriver () {
    const driver = await new Builder().forBrowser('MicrosoftEdge').build();
    return driver;
};

const driver_fx = await loadMSEdgeDriver();

e2e.runTests(driver_fx);
