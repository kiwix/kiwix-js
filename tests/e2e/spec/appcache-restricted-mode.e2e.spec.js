/**
 * appcache-restricted-mode.e2e.spec.js : Tests that the AppCache bypass is usable in Restricted mode
 *
 * The app used to refuse to switch to Restricted mode while "Bypass AppCache" was set, bouncing the user
 * back to ServiceWorker mode, and the setting could not be turned off from Restricted mode either. That
 * block was removed in kiwix-js #1465: Restricted mode does not stop the Service Worker running, it only
 * stops it intercepting requests for ZIM assets, so the app's own code is still served from APP_CACHE,
 * which is exactly what this setting bypasses.
 *
 * These tests therefore need a browser that HAS the ServiceWorker API, and skip themselves otherwise
 * (the companion spec serviceworker-unavailable.e2e.spec.js covers the browsers that do not).
 *
 * Copyright 2026 Jaifroid and contributors
 * Licence GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */

import assert from 'assert';

/* global describe, it, before, after, process */

const BROWSERSTACK = !!process.env.BROWSERSTACK_LOCAL_IDENTIFIER;
const port = BROWSERSTACK ? '8099' : '8080';
const appUrl = 'http://localhost:' + port + '/dist/www/index.html';

/**
 * Reports the state of the settings this spec manipulates
 * @param {WebDriver} driver Selenium WebDriver object
 * @returns {Promise<Object>} Any visible dialogue, the stored mode and AppCache settings, the checkbox
 *      state, and whether the setting is offered in the UI at all
 */
function getAppState (driver) {
    return driver.executeScript(
        'var modal = document.getElementById("alertModal");' +
        'return {' +
        '    dialogue: modal && modal.style.display === "block" ? document.getElementById("modalLabel").innerHTML : null,' +
        '    storedMode: localStorage.getItem("kiwixjs-contentInjectionMode"),' +
        '    storedAppCache: localStorage.getItem("kiwixjs-appCache"),' +
        '    bypassChecked: document.getElementById("bypassAppCacheCheck").checked,' +
        '    bypassOffered: document.getElementById("bypassAppCacheDiv").style.display !== "none"' +
        '};'
    );
}

/**
 * Clicks an element with JavaScript. DEV: the expert settings live in a collapsed section of the
 * Configuration page, so a WebDriver click can find the element not interactable
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {String} id The id of the element to click
 * @param {Number} pause Milliseconds to wait for the app to settle afterwards
 * @returns {Promise<void>} A Promise for the completion of the click
 */
async function clickAndSettle (driver, id, pause) {
    await driver.executeScript('document.getElementById("' + id + '").click();');
    await driver.sleep(pause);
}

/**
 * Run the tests
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {boolean} keepDriver Whether to keep the driver open after the tests have run
 * @returns {Promise<void>} A Promise for the completion of the tests
 */
function runTests (driver, keepDriver) {
    driver.getCapabilities().then(function (caps) {
        console.log('\nRunning AppCache-in-Restricted-mode tests on: ' + caps.get('browserName') + ' ' + caps.get('browserVersion'));
    });

    driver.manage().setTimeouts({ implicit: 3000 });

    describe('AppCache bypass in Restricted mode [kiwix-js #1465]', function () {
        this.timeout(60000);
        this.slow(10000);

        before(async function () {
            await driver.get(appUrl + '?contentInjectionMode=jquery');
            await driver.sleep(1300);
            const serviceWorkerAPI = await driver.executeScript('return "serviceWorker" in navigator;');
            if (!serviceWorkerAPI) {
                console.log('    (skipped: this browser has no ServiceWorker API)');
                this.skip();
            }
            // Start from a clean Store, in ServiceWorker mode with the bypass already set. The mode-change
            // alert is marked as answered so that only dialogues raised by these settings can appear
            await driver.executeScript('localStorage.clear();');
            await driver.get(appUrl + '?contentInjectionMode=serviceworker&appCache=false&defaultModeChangeAlertDisplayed=true');
            await driver.sleep(2500);
        });

        // The app used to refuse this switch and send the user back to ServiceWorker mode
        it('Switches to Restricted mode while the AppCache bypass is set', async function () {
            const onLaunch = await getAppState(driver);
            assert.strictEqual(onLaunch.storedAppCache, 'false', 'The launch should have set the AppCache bypass');
            assert.ok(onLaunch.bypassChecked, 'The bypass checkbox should be ticked');
            await clickAndSettle(driver, 'jqueryModeRadio', 2500);
            const afterSwitch = await getAppState(driver);
            assert.strictEqual(afterSwitch.dialogue, null, 'No dialogue should refuse the switch to Restricted mode');
            assert.strictEqual(afterSwitch.storedMode, 'jquery', 'The app should have switched to Restricted mode');
            assert.ok(afterSwitch.bypassChecked, 'The bypass should have been left as the user set it');
            // The setting used to be hidden outside ServiceWorker mode, which would leave it set but unreachable
            assert.ok(afterSwitch.bypassOffered, 'The bypass setting should still be offered in Restricted mode');
        });

        // Turning the bypass off reloads the app (settingsStore.reset), which also proves the setting persisted
        it('Turns the AppCache bypass off from Restricted mode', async function () {
            await clickAndSettle(driver, 'bypassAppCacheCheck', 4000);
            const state = await getAppState(driver);
            assert.strictEqual(state.dialogue, null, 'No dialogue should refuse the change');
            assert.strictEqual(state.storedAppCache, 'true', 'Turning the bypass off should have been saved');
            assert.ok(!state.bypassChecked, 'The bypass checkbox should be unticked');
            assert.strictEqual(state.storedMode, 'jquery', 'The app should still be in Restricted mode');
        });

        it('Turns the AppCache bypass back on from Restricted mode', async function () {
            await clickAndSettle(driver, 'bypassAppCacheCheck', 2500);
            const state = await getAppState(driver);
            assert.strictEqual(state.dialogue, null, 'No dialogue should refuse the change');
            assert.strictEqual(state.storedAppCache, 'false', 'Turning the bypass on should have been saved');
            assert.ok(state.bypassChecked, 'The bypass checkbox should be ticked');
            assert.strictEqual(state.storedMode, 'jquery', 'The app should still be in Restricted mode');
        });

        // init.js used to force the bypass off at launch whenever the app was in Restricted mode, to break
        // the loop the old block caused. With the block gone, a deliberate setting must now survive
        it('Keeps the AppCache bypass set across a relaunch in Restricted mode', async function () {
            await driver.get(appUrl);
            await driver.sleep(2500);
            const state = await getAppState(driver);
            assert.strictEqual(state.storedMode, 'jquery', 'The app should relaunch in Restricted mode');
            assert.strictEqual(state.storedAppCache, 'false', 'The stored bypass setting should be untouched');
            assert.ok(state.bypassChecked, 'The bypass checkbox should still be ticked');
        });

        after(async function () {
            await driver.executeScript('localStorage.clear();');
            if (!keepDriver) await driver.quit();
        });
    });
}

export default {
    runTests: runTests
};
