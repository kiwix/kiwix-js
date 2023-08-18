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

// eslint-disable-next-line no-unused-vars
import { By, Key, until, WebDriver } from 'selenium-webdriver';
// import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import paths from './paths.js';
import fs from 'fs';
/* eslint-disable camelcase */
/* global describe, it */

const port = process.env.BROWSERSTACK_LOCAL_IDENTIFIER ? '8099' : '8080';

// Set the archives to load
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
    if (!process.env.CI) {
        describe('Reset app', function () {
            this.timeout(60000);
            this.slow(10000);
            it('Click the app reset button and accept warning', async function () {
                await driver.get('http://localhost:' + port + '/dist/www/index.html');
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
    }

    if (!modes) {
        modes = ['jquery', 'serviceworker'];
    }

    modes.forEach(function (mode) {
        // SW mode tests will need to be skipped if the browser does not support the SW API
        let serviceWorkerAPI = true;
        const isJqueryMode = mode === 'jquery';
        describe('Non Legacy ' + (mode === 'jquery' ? '[JQuery mode]' : mode === 'serviceworker' ? '[SW mode]' : ''), async function () {
            this.timeout(60000);
            this.slow(10000);
            // Run tests twice, once in serviceworker mode and once in jquery mode
            it('Load Kiwix JS and check title', async function () {
                await driver.get('http://localhost:8080/dist/www/index.html');
                const title = await driver.getTitle();
                assert.equal('Kiwix', title);
            });
            // Switch to the requested contentInjectionMode
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

            it('Load Modern zim file', async function () {
                if (!serviceWorkerAPI) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                const archiveFiles = await driver.findElement(By.id('archiveFiles'));
                await archiveFiles.sendKeys(paths.nonLegacyZimFilePath);
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
            it('Checking active content warning', async function () {
                const activeContentWarning = await driver.findElement(By.id('activeContent'));
                if (isJqueryMode) {
                    assert.equal(true, await activeContentWarning.isDisplayed());
                } else {
                    assert.equal(false, await activeContentWarning.isDisplayed());
                }
            });
            it('Sorting books by popularity', async function () {
                if (isJqueryMode) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                await driver.switchTo().frame('articleContent');
                await driver.findElement(By.id('popularity_sort')).click();
                await driver.sleep(500);
                // get the text of first result and check if it is the same as expected
                const firstBookName = await driver.wait(async function () {
                    return await driver.findElement(By.xpath('//*[@id="books_table"]/tbody/tr[1]/td[1]/div[2]/div/div/span[2]')).getText();
                })
                assert.equal(firstBookName, 'Poezii');
            });
            it('Sorting books by name', async function () {
                if (isJqueryMode) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                await driver.findElement(By.id('alpha_sort')).click();
                await driver.sleep(500);
                const firstBookName = await driver.wait(async function () {
                    return await driver.findElement(By.xpath('//*[@id="books_table"]/tbody/tr[1]/td[1]/div[2]/div/div/span[2]')).getText();
                }, 3000)
                // get the text of first result and check if it is the same as expected
                assert.equal(firstBookName, 'Creierul, O Enigma Descifrata');
            });

            it('Change Language', async function () {
                if (isJqueryMode) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                // click on the language dropdown and select option French
                await driver.findElement(By.xpath('//*[@id="l10nselect"]/option[2]')).click();
                const mainTitle = await driver.findElement(By.xpath('//*[@class="main_title"]/h1')).getText();
                // revert back the language to English
                await driver.findElement(By.xpath('//*[@id="l10nselect"]/option[1]')).click()
                assert.equal(mainTitle, 'Bibliothèque du projet Gutenberg');
            });
            it('Primary Search Autocomplete', async function () {
                await driver.switchTo().defaultContent();
                const searchBox = await driver.findElement(By.id('prefix'))
                await searchBox.sendKeys('Poezii.35323.html');
                await driver.sleep(500);
                // checks if the autocomplete list is displayed has one element
                const searchListCount = (await driver.findElements(By.xpath('//*[@id="articleList"]/a'))).length
                // revert whatever was typed in the search box
                await searchBox.clear()
                assert.equal(searchListCount, 1);
            });
            it('Viewing HTML view', async function () {
                await driver.switchTo().defaultContent();
                const searchBox = await driver.findElement(By.id('prefix'))
                await searchBox.sendKeys('Poezii.35323.html');
                // Press enter 2 time to go and visit the first result of the search
                // I was not able to find a better way to do this feel free to change this
                await searchBox.sendKeys(Key.ENTER);
                await searchBox.sendKeys(Key.ENTER);
                await driver.sleep(500);
                const authorAndBookName = await driver.wait(async function () {
                    await driver.switchTo().frame('articleContent');
                    until.elementLocated(By.id('id00000'));
                    return await driver.findElement(By.id('id00000')).getText();
                })
                assert.equal(authorAndBookName, 'MIHAI EMINESCU, POET AL FIINTEI');
            });
            it('Navigating back', async function () {
                // button lies on main page so we need to switch to default content
                await driver.switchTo().defaultContent();
                const btnBack = await driver.findElement(By.id('btnBack'))
                // I am not sure why i need to click a button two times to go back
                // Maybe since the first click is to focus on the button and the second one is to click it or element is a <a> not <button>
                await btnBack.click();
                await btnBack.click();
                // Title lies in iframe so we need to switch to it
                await driver.switchTo().frame('articleContent');
                const mainTitle = await driver.findElement(By.xpath('//*[@class="main_title"]/h1')).getText();
                assert.equal(mainTitle, 'Project Gutenberg Library');
            });
            it('Author search Autocomplete', async function () {
                if (isJqueryMode) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                const filter = await driver.findElement(By.id('author_filter'))
                await filter.sendKeys('Mihai Eminescu');
                const searchListCount = (await driver.findElements(By.id('ui-id-1'))).length;
                assert.equal(searchListCount, 1);
            });
            it('Author search Results', async function () {
                if (isJqueryMode) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                // something is wrong here
                // search by author name and press enter to apply the filter
                const filter = await driver.findElement(By.id('author_filter'))
                await filter.sendKeys(Key.ENTER);
                const searchListCount = (await driver.findElements(By.xpath('//*[@id="books_table"]/tbody'))).length;
                // revert whatever was typed in the search box and press enter to remove filter
                await filter.clear();
                await filter.sendKeys(Key.ENTER);
                assert.equal(searchListCount, 1);
            });
            const downloadFileName = 'Poezii.35323.epub'
            it('Download EPUB file', async function () {
                if (isJqueryMode) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                // click on the download button of the second result
                const downloadButton = await driver.wait(async function () {
                    return driver.findElement(By.xpath('//*[@id="books_table"]/tbody/tr[3]/td[2]/a[2]/i'));
                }, 5000);
                await downloadButton.click();
                await driver.sleep(2000);
                const downloadFileStatus = driver.wait(async function () {
                    // We can only check if the file exist in firefox and chrome (IE and Edge not supported)
                    // [TODO] only run this part if chrome or firefox
                    const downloadFileStatus = fs.readdirSync(paths.downloadDir).includes(downloadFileName);
                    if (downloadFileStatus) fs.rmSync(paths.downloadDir + '/' + downloadFileName);
                    return downloadFileStatus;
                });
                assert.ok(downloadFileStatus);

                // exit if every test and mode is completed
                if (mode === modes[modes.length - 1]) {
                    await driver.quit();
                }
            });
        });
    });
}

export default {
    runTests: runTests
};
