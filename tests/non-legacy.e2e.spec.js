/**
 * legacy-ray_charles.e2e.spec.js : End-to-end tests implemented with Selenium WebDriver and Mocha
 *
 * Copyright 2023 Jaifroid and contributors
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

import { By, Key, until } from 'selenium-webdriver';
// import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import path from 'path';

/* eslint-disable camelcase */
/* global describe, it */

// Set the archives to load
const nonLegacyZimFilePath = path.resolve('./tests/gutenberg_ro_all_2023-05.zim');

/**
 *  Run the tests
 * @param {WebDriver} driver - Selenium WebDriver object
 * @param {array} modes - Array of modes to run the tests in
 * @returns {undefined}
*/
function runTests (driver, modes) {
    let browserName, browserVersion;
    driver.getCapabilities().then(function (caps) {
        browserName = caps.get('browserName');
        browserVersion = caps.get('browserVersion');
        console.log('\nRunning tests on: ' + browserName + ' ' + browserVersion);
    });

    // Perform app reset before running tests (this is a convenience for local testers)
    describe('Reset app', function () {
        this.timeout(60000);
        this.slow(10000);
        it('Click the app reset button and accept warning', async function () {
            await driver.get('http://localhost:8080/dist/www/index.html');
            // Pause for 1.3 seconds to allow the app to load
            await driver.sleep(1300);
            // Accept any alert dialogue box on opening, e.g. for browsers that do not support the ServiceWorker API
            try {
                const activeAlertModal = await driver.findElement(By.css('.modal[style*="display: block"]'));
                if (activeAlertModal) {
                    // console.log('Found active alert modal');
                    const approveButton = await driver.findElement(By.id('approveConfirm'));
                    await approveButton.click();
                }
            } catch (e) {
                // Do nothing
            }
            const resetButton = await driver.findElement(By.id('btnReset'));
            await resetButton.click();
            // Check for and click any approve button in subsequent dialogue box
            // E.g. on IE11, a "ServiceWorker unsppoerted" alert will appear
            try {
                const activeAlertModal = await driver.findElement(By.css('.modal[style*="display: block"]'));
                if (activeAlertModal) {
                    // console.log('Found active alert modal');
                    const approveButton = await driver.findElement(By.id('approveConfirm'));
                    await approveButton.click();
                }
            } catch (e) {
                // Do nothing
            }
        });
    });

    if (!modes) {
        modes = ['jquery', 'serviceworker'];
    }

    modes.forEach(function (mode) {
        // SW mode tests will need to be skipped if the browser does not support the SW API
        let serviceWorkerAPI = true;
        describe('Non Legacy ' + (mode === 'jquery' ? '[JQuery mode]' : mode === 'serviceworker' ? '[SW mode]' : ''), async function () {
            this.timeout(60000);
            this.slow(10000);
            // Run tests twice, once in serviceworker mode and once in jquery mode
            describe('Load app', function () {
                it('Load Kiwix JS and check title', async function () {
                    await driver.get('http://localhost:8080/dist/www/index.html');
                    const title = await driver.getTitle();
                    assert.equal('Kiwix', title);
                });
            });
            // Switch to the requested contentInjectionMode
            describe('Switch to ' + mode + ' mode', function () {
                it('Switch to ' + mode + ' mode', async function () {
                    const modeSelector = await driver.findElement(By.id(mode + 'ModeRadio'));
                    // Scroll the element into view so that it can be clicked
                    await driver.wait(async function () {
                        const elementIsVisible = await driver.executeScript('var el=arguments[0]; el.scrollIntoView(true); setTimeout(function () {el.click();}, 50); return el.offsetParent;', modeSelector);
                        return elementIsVisible;
                    }, 5000);
                    // Pause for 1.3 seconds to allow app to reload
                    await driver.sleep(1300);
                    // Check for and click any approve button in dialogue box
                    try {
                        const activeAlertModal = await driver.findElement(By.css('.modal[style*="display: block"]'));
                        if (activeAlertModal) {
                            // Check if ServiceWorker mode API is supported
                            serviceWorkerAPI = await driver.findElement(By.id('modalLabel')).getText().then(function (alertText) {
                                return !/ServiceWorker\sAPI\snot\savailable/i.test(alertText);
                            });
                        }
                        const approveButton = await driver.findElement(By.id('approveConfirm'));
                        await approveButton.click();
                    } catch (e) {
                        // Do nothing
                    }
                    if (serviceWorkerAPI) {
                        // Wait until the mode has switched
                        await driver.findElement(By.id('serviceWorkerStatus')).getText().then(function (serviceWorkerStatus) {
                            if (mode === 'serviceworker') {
                                assert.equal(true, /and\sregistered/i.test(serviceWorkerStatus));
                            } else {
                                assert.equal(true, /not\sregistered|unavailable/i.test(serviceWorkerStatus));
                            }
                        });
                    } else {
                        // Skip remaining SW mode tests if the browser does not support the SW API
                        console.log('\x1b[33m%s\x1b[0m', '      Skipping SW mode tests because browser does not support API');
                        await driver.quit();
                    }
                });
            });
            describe('Load archive', function () {
                it('Load Modern zim file', async function () {
                    if (!serviceWorkerAPI) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    const archiveFiles = await driver.findElement(By.id('archiveFiles'));
                    await archiveFiles.sendKeys(nonLegacyZimFilePath);
                    // Wait until files have loaded
                    var filesLength;
                    await driver.wait(async function () {
                        // check if file has been loaded
                        filesLength = await driver.executeScript('return document.getElementById("archiveFiles").files.length');
                        return filesLength === 1;
                    }, 5000);
                    // Check that we loaded 1 file
                    assert.equal(1, filesLength);
                });
            });
            describe('Extra button and Language Dropdown', function () {
                const isJqueryMode = mode === 'jquery';
                it('Sorting books by popularity', async function () {
                    if (isJqueryMode) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    await driver.switchTo().frame('articleContent');
                    await driver.findElement(By.id('popularity_sort')).click();
                    driver.sleep(500);
                    const firstElementText = await driver.findElement(By.xpath('//*[@id="books_table"]/tbody/tr[1]/td[1]/div[2]/div/div/span[2]')).getText();
                    assert.equal(firstElementText, 'Poezii');
                });
                it('Sorting books by name', async function () {
                    if (isJqueryMode) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    await driver.findElement(By.xpath('//*[@id="alpha_sort"]')).click();
                    await driver.sleep(500);
                    const firstElementText = await driver.findElement(By.xpath('//*[@id="books_table"]/tbody/tr[1]/td[1]/div[2]/div/div/span[2]')).getText();
                    assert.equal(firstElementText, 'Creierul, O Enigma Descifrata');
                });

                it('Change Language', async function () {
                    if (isJqueryMode) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    // await driver.findElement(By.id('l10nselect'));
                    // driver.sleep(500);
                    await driver.findElement(By.xpath('//*[@id="l10nselect"]/option[2]')).click();
                    const mainTitle = await driver.findElement(By.xpath('//*[@class="main_title"]/h1')).getText();
                    // console.log(languageSelect);
                    assert.equal(mainTitle, 'Bibliothèque du projet Gutenberg');
                });
            });
            describe('Search and Results', function () {
                const isJqueryMode = mode === 'jquery';
                console.log('hello');
                it('Primary Search', async function () {
                    await driver.switchTo().defaultContent();
                    await driver.wait(until.elementLocated(By.xpath('//*[@id="prefix"]')), 10000)
                    await driver.findElement(By.xpath('//*[@id="prefix"]')).sendKeys('Poezii.35323.html');
                    const searchListCount = (await driver.findElements(By.id('articleList'))).length;
                    assert.equal(searchListCount, 1);
                });
                it('Secondary search Autocomplete', async function () {
                    if (isJqueryMode) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    await driver.switchTo().frame('articleContent');
                    const filter = await driver.findElement(By.id('author_filter'))
                    await filter.sendKeys('Mihai Eminescu');
                    const searchListCount = (await driver.findElements(By.id('ui-id-1'))).length;
                    assert.equal(searchListCount, 1);
                });
                it('Secondary search Results', async function () {
                    if (isJqueryMode) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    const filter = await driver.findElement(By.id('author_filter'))
                    // await filter.sendKeys('Mihai Eminescu');
                    await filter.sendKeys(Key.ENTER);
                    const searchListCount = (await driver.findElements(By.xpath('//*[@id="books_table"]/tbody'))).length;
                    await filter.clear();
                    await filter.sendKeys(Key.ENTER);
                    assert.equal(searchListCount, 1);
                });
            });
            describe('Download', function () {
                const isJqueryMode = mode === 'jquery';
                it('Download EPUB file', async function () {
                    if (isJqueryMode) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    await driver.sleep(1000);
                    await driver.findElement(By.xpath('//*[@id="books_table"]/tbody/tr[3]/td[2]/a[2]/i')).click();
                    // const searchListCount = (await driver.findElements(By.id('articleList'))).length;
                    // assert.equal(searchListCount, 1);
                });
                // it('Secondary search', async function () {
                //     if (isJqueryMode) {
                //         console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                //         return;
                //     }
                //     await driver.findElement(By.id('author_filter')).sendKeys('Mihai Eminescu');
                //     const searchListCount = (await driver.findElements(By.id('ui-id-1'))).length;
                //     assert.equal(searchListCount, 1);
                // });
            });
        });
    });
}

export default {
    runTests: runTests
};
