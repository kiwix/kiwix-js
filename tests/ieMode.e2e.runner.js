import { Builder } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/ie.js';
import e2e from './kiwix-js.e2e.spec.js';

/* eslint-disable camelcase */

async function loadIEModeDriver () {
    const ieOptions = new Options();
    ieOptions.setEdgeChromium(true);
    ieOptions.setEdgePath('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');

    const driver = await new Builder()
        .forBrowser('ie')
        .setIeOptions(ieOptions)
        .build();
    return driver;
};

const driver_ie = await loadIEModeDriver();

e2e.runTests(driver_ie);
