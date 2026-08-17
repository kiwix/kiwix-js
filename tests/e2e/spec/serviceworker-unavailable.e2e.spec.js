/**
 * serviceworker-unavailable.e2e.spec.js : Regression tests for kiwix-js #1465
 *
 * In a browser with no ServiceWorker API, launching the app with ServiceWorker mode already selected used
 * to show the "ServiceWorker API not available" dialogue in an unbreakable loop: dismissing it restored
 * the mode the app had just rejected, which brought the dialogue straight back, so the app could not be
 * used at all. These tests launch the app in exactly that state and check that it warns the user once,
 * then settles in Restricted mode and stays there.
 *
 * There is nothing to test in a browser that has the ServiceWorker API, so the suite skips itself unless
 * the API is missing. In CI that means it runs in IE Mode, and is skipped everywhere else.
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
 * Reports what the app is currently showing and which mode it has settled on
 * @param {WebDriver} driver Selenium WebDriver object
 * @returns {Promise<Object>} The title of any visible dialogue, the stored mode, and whether search is usable
 */
function getAppState (driver) {
    return driver.executeScript(`
        var modal = document.getElementById('alertModal');
        var prefix = document.getElementById('prefix');
        return {
            dialogue: modal && modal.style.display === 'block' ? document.getElementById('modalLabel').innerHTML : null,
            storedMode: localStorage.getItem('kiwixjs-contentInjectionMode'),
            bypassAppCacheChecked: document.getElementById('bypassAppCacheCheck').checked,
            searchUsable: !!prefix && !prefix.disabled
        };
    `);
}

/**
 * Launches the app from a clean Settings Store with the given querystring
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {String} querystring The querystring to launch with, including the leading '?'
 * @returns {Promise<void>} A Promise for the completion of the launch
 */
async function launchWith (driver, querystring) {
    // Restricted mode launches without any dialogue, which gives us a quiet page on which to clear the Store
    await driver.get(appUrl + '?contentInjectionMode=jquery');
    await driver.sleep(1300);
    await driver.executeScript('localStorage.clear();');
    await driver.get(appUrl + querystring);
    await driver.sleep(2500);
}

/**
 * Dismisses the dialogue with the given button. DEV: we click with JavaScript because in IE Mode a
 * lingering modal backdrop can intercept a WebDriver click on the button beneath it
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {String} buttonId The id of the button to click ('approveConfirm' or 'declineConfirm')
 * @returns {Promise<void>} A Promise for the completion of the dismissal
 */
async function dismissDialogue (driver, buttonId) {
    await driver.executeScript('document.getElementById("' + buttonId + '").click();');
    await driver.sleep(2500);
}

/**
 * Run the tests
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {boolean} keepDriver Whether to keep the driver open after the tests have run
 * @returns {Promise<void>} A Promise for the completion of the tests
 */
function runTests (driver, keepDriver) {
    driver.getCapabilities().then(function (caps) {
        console.log('\nRunning ServiceWorker-unavailable tests on: ' + caps.get('browserName') + ' ' + caps.get('browserVersion'));
    });

    driver.manage().setTimeouts({ implicit: 3000 });

    describe('Recovery from ServiceWorker mode in a browser without the API [kiwix-js #1465]', function () {
        this.timeout(60000);
        this.slow(10000);

        before(async function () {
            await driver.get(appUrl + '?contentInjectionMode=jquery');
            await driver.sleep(1300);
            const serviceWorkerAPI = await driver.executeScript('return "serviceWorker" in navigator;');
            if (serviceWorkerAPI) {
                console.log('    (skipped: this browser supports the ServiceWorker API)');
                this.skip();
            }
        });

        // Both buttons of the dialogue used to lead to the same place: back into the mode just rejected
        ['approveConfirm', 'declineConfirm'].forEach(function (buttonId) {
            const buttonName = buttonId === 'approveConfirm' ? '"Use Restricted mode"' : '"Cancel"';
            it('Falls back to Restricted mode when the dialogue is dismissed with ' + buttonName, async function () {
                await launchWith(driver, '?contentInjectionMode=serviceworker');
                const onLaunch = await getAppState(driver);
                assert.match(onLaunch.dialogue || '', /ServiceWorker\sAPI\snot\savailable/i,
                    'The app should warn that the ServiceWorker API is unavailable');
                await dismissDialogue(driver, buttonId);
                const afterDismissal = await getAppState(driver);
                assert.strictEqual(afterDismissal.dialogue, null, 'The dialogue should not reappear once dismissed');
                assert.strictEqual(afterDismissal.storedMode, 'jquery', 'The app should have settled in Restricted mode');
                assert.ok(afterDismissal.searchUsable, 'The app should be usable');
            });
        });

        // With prompts suppressed the fallback runs without user input, and used to recurse until the stack blew
        it('Falls back to Restricted mode with no dialogue when prompts are suppressed', async function () {
            await launchWith(driver, '?contentInjectionMode=serviceworker&noPrompts=true');
            const state = await getAppState(driver);
            assert.strictEqual(state.dialogue, null, 'No dialogue should be shown when prompts are suppressed');
            assert.strictEqual(state.storedMode, 'jquery', 'The app should have settled in Restricted mode');
            assert.ok(state.searchUsable, 'The app should be usable');
        });

        // Restricted mode refuses to start while "Bypass AppCache" is set, which gave a second loop between
        // that dialogue and the one above. The bypass is meaningless without a Service Worker to bypass
        it('Turns off "Bypass AppCache" rather than looping when it blocks the fallback', async function () {
            await launchWith(driver, '?contentInjectionMode=serviceworker&appCache=false');
            const onLaunch = await getAppState(driver);
            assert.ok(onLaunch.bypassAppCacheChecked, 'The launch should have set the AppCache bypass');
            await dismissDialogue(driver, 'approveConfirm');
            const afterDismissal = await getAppState(driver);
            assert.strictEqual(afterDismissal.dialogue, null, 'No further dialogue should be shown');
            assert.strictEqual(afterDismissal.storedMode, 'jquery', 'The app should have settled in Restricted mode');
            assert.ok(!afterDismissal.bypassAppCacheChecked, 'The AppCache bypass should have been turned off');
        });

        after(async function () {
            // The browser profile is shared with the other specs, so leave the Store in the state they expect:
            // Restricted mode, with the mode-change alert already answered, so no dialogue greets the next run
            await driver.executeScript('localStorage.clear();');
            await driver.get(appUrl + '?contentInjectionMode=jquery&defaultModeChangeAlertDisplayed=true');
            await driver.sleep(1300);
            if (!keepDriver) await driver.quit();
        });
    });
}

export default {
    runTests: runTests
};
