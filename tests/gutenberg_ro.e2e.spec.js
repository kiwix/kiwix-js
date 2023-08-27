/**
 * legacy-ray_charles.e2e.spec.js : End-to-end tests implemented with Selenium WebDriver and Mocha
 *
 * Copyright 2023 Jaifroid, RG7279805 and contributors
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
import assert from 'assert';
import paths from './paths.js';
import fs from 'fs';

/* eslint-disable camelcase */
/* global describe, it */

const port = process.env.BROWSERSTACK_LOCAL_IDENTIFIER ? '8099' : '8080';

/**
 *  Run the tests
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {Array} modes Array of modes to run the tests in
 * @returns {Promise<void>}  A Promise for the completion of the tests
*/
function runTests (driver, modes) {
    let browserName, browserVersion;
    driver.getCapabilities().then(function (caps) {
        browserName = caps.get('browserName');
        browserVersion = caps.get('browserVersion');
        console.log('\nRunning Gutenberg RO tests on: ' + browserName + ' ' + browserVersion);
    });

    // Set the implicit wait to 3 seconds
    driver.manage().setTimeouts({ implicit: 3000 });

    // Perform app reset before running tests if we are not running CI (this is a convenience for local testers)
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

    // Run in both jquery and serviceworker modes by default
    if (!modes) {
        modes = ['jquery', 'serviceworker'];
    }

    modes.forEach(function (mode) {
        // SW mode tests will need to be skipped if the browser does not support the SW API
        let serviceWorkerAPI = true;
        const isJqueryMode = mode === 'jquery';
        describe('Gutenberg_ro test [ZSTD compression] ' + (mode === 'jquery' ? '[JQuery mode]' : mode === 'serviceworker' ? '[SW mode]' : ''), async function () {
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
                const modeSelector = await driver.wait(until.elementLocated(By.id(mode + 'ModeRadio')));
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
                    const approveButton = await driver.wait(until.elementLocated(By.id('approveConfirm')));
                    await approveButton.click();
                } catch (e) {
                    // Do nothing
                }
                if (mode === 'jquery' || serviceWorkerAPI) {
                    // Wait until the mode has switched
                    await driver.sleep(500);
                    let serviceWorkerStatus = await driver.findElement(By.id('serviceWorkerStatus')).getText();
                    try {
                        if (mode === 'serviceworker') {
                            assert.ok(true, /and\sregistered/i.test(serviceWorkerStatus));
                        } else {
                            assert.ok(true, /not\sregistered|unavailable/i.test(serviceWorkerStatus));
                        }
                    } catch (e) {
                        if (!~modes.indexOf('serviceworker')) {
                            // We can't switch to serviceworker mode if it is not being tested, so we should fail the test
                            throw e;
                        }
                        // We failed to switch modes, so let's try switching back and switching to this mode again
                        console.log('\x1b[33m%s\x1b[0m', '      Failed to switch to ' + mode + ' mode, trying again...');
                        const otherModeSelector = await driver.findElement(By.id(mode === 'jquery' ? 'serviceworkerModeRadio' : 'jqueryModeRadio'));
                        // Click the other mode selector
                        await otherModeSelector.click();
                        // Wait until the mode has switched
                        await driver.sleep(330);
                        // Click the mode selector again
                        await modeSelector.click();
                        // Wait until the mode has switched
                        await driver.sleep(330);
                        serviceWorkerStatus = await driver.findElement(By.id('serviceWorkerStatus')).getText();
                        if (mode === 'serviceworker') {
                            assert.equal(true, /and\sregistered/i.test(serviceWorkerStatus));
                        } else {
                            assert.equal(true, /not\sregistered|unavailable/i.test(serviceWorkerStatus));
                        }
                    }
                } else {
                    // Skip remaining SW mode tests if the browser does not support the SW API
                    console.log('\x1b[33m%s\x1b[0m', '      Skipping SW mode tests because browser does not support API');
                    await driver.quit();
                }
            });

            // Loads the ZIM archive for the mode if the mode is not skipped
            it('Load Modern zim file', async function () {
                if (!serviceWorkerAPI) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                const archiveFiles = await driver.findElement(By.id('archiveFiles'));
                await archiveFiles.sendKeys(paths.gutenbergRoBaseFile);
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

            // In JQuery mode, the app warns the user that there is active content it cannot run, so we test for this and dismiss
            it('Checking active content warning', async function () {
                const activeContentWarning = await driver.wait(async function () {
                    const element = await driver.findElement(By.id('activeContent'));
                    return await element.isDisplayed();
                }, 2000).catch(() => false);
                if (isJqueryMode) {
                    assert.ok(true, activeContentWarning);
                } else {
                    assert.equal(false, activeContentWarning);
                }
            });

            it('Sorting books by popularity', async function () {
                if (isJqueryMode) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                await driver.switchTo().frame('articleContent');
                await driver.wait(until.elementIsVisible(driver.findElement(By.id('popularity_sort')))).click();
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
                await driver.wait(until.elementIsVisible(driver.findElement(By.id('alpha_sort')))).click();
                await driver.sleep(1500);
                const firstBookName = await driver.wait(async function () {
                    return await driver.findElement(By.xpath('//*[@id="books_table"]/tbody/tr[1]/td[1]/div[2]/div/div/span[2]')).getText();
                }, 3000);
                // get the text of first result and check if it is the same as expected
                assert.equal(firstBookName, 'Creierul, O Enigma Descifrata');
            });

            it('Change Language', async function () {
                if (isJqueryMode) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                // click on the language dropdown and select option French
                const languageOptions = await driver.wait(until.elementsLocated(By.xpath('//*[@id="l10nselect"]/option')), 1500);
                await languageOptions[1].click();
                const mainTitle = await driver.findElement(By.xpath('//*[@class="main_title"]/h1')).getText();
                // revert back the language to English
                await languageOptions[0].click();
                assert.equal(mainTitle, 'Bibliothèque du projet Gutenberg');
            });

            it('Primary Search Autocomplete', async function () {
                await driver.switchTo().defaultContent();
                const searchBox = await driver.wait(until.elementIsVisible(driver.findElement(By.id('prefix'))), 1500);
                await searchBox.sendKeys('Poezii.35323.html');
                // checks if the autocomplete list is displayed has one element
                // waits until autocomplete list is displayed (might take a second)
                let searchListCount = 0
                try {
                    const searchList = await driver.wait(until.elementsLocated(By.xpath('//*[@id="articleList"]/a')), 3000);
                    searchListCount = searchList.length;
                } catch (error) {
                    // retry test one more time if search doesnt find any results
                    // it might be that the search is too fast and the autocomplete list is not displayed (rare)
                    await searchBox.clear();
                    await searchBox.sendKeys('Poezii.35323.html');
                    await driver.sleep(1000);
                    const searchList = await driver.wait(until.elementsLocated(By.xpath('//*[@id="articleList"]/a')), 3000);
                    searchListCount = searchList.length;
                }
                // revert whatever was typed in the search box
                await searchBox.clear()
                assert.equal(searchListCount, 1);
            });

            // Loads the universal HTML view of the selected book
            it('Viewing HTML view', async function () {
                await driver.switchTo().defaultContent();
                const searchBox = await driver.wait(until.elementIsVisible(driver.findElement(By.id('prefix'))), 1500);
                await searchBox.sendKeys('Poezii.35323.ht');
                // Press enter 2 time to go and visit the first result of the search
                // [DEV] I was not able to find a better way to do this feel free to change this
                await driver.sleep(1000);
                const searchListFirstElement = await driver.wait(until.elementLocated(By.xpath('//*[@id="articleList"]/a[1]')), 1500);
                await searchListFirstElement.click();
                await driver.sleep(2000);
                // if title is not loaded in next 4 seconds then return empty string and fail test
                await searchBox.clear();
                await driver.switchTo().frame('articleContent');
                const authorAndBookName = await driver.wait(until.elementLocated(By.id('id00000')), 5000).getText().catch(() => '');
                assert.equal(authorAndBookName, 'MIHAI EMINESCU, POET AL FIINTEI');
            });

            it('Navigating back', async function () {
                // button lies on main page so we need to switch to default content
                await driver.switchTo().defaultContent();
                const btnBack = await driver.wait(until.elementLocated(By.id('btnBack')));
                // [DEV] I am not sure why i need to click a button three times to go back
                await btnBack.click();
                await btnBack.click();
                await btnBack.click();
                // Title lies in iframe so we need to switch to it
                await driver.switchTo().frame('articleContent');
                // in some browsers the title is loaded slowly so we need to wait for it
                // if title is not loaded in next 4 seconds then return empty string and fail test
                const mainTitle = await driver.wait(until.elementLocated(By.xpath('//*[@class="main_title"]/h1')), 4000).getText();
                assert.equal(mainTitle, 'Project Gutenberg Library');
            });

            it('Author search Autocomplete', async function () {
                if (isJqueryMode) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                const filter = await driver.wait(until.elementIsVisible(driver.findElement(By.id('author_filter'))), 1500);
                await filter.sendKeys('Mihai Eminescu');
                const searchList = await driver.wait(until.elementsLocated(By.className('ui-menu-item')), 1500);
                assert.equal(searchList.length, 1);
            });

            it('Author search Results', async function () {
                if (isJqueryMode) {
                    console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                    return;
                }
                // search by author name and press enter to apply the filter
                const filter = await driver.wait(until.elementIsVisible(driver.findElement(By.id('author_filter'))), 1500);
                await filter.sendKeys(Key.ENTER);
                const searchList = await driver.wait(until.elementsLocated(By.xpath('//*[@id="books_table"]/tbody')));
                // revert whatever was typed in the search box and press enter to remove filter
                await filter.clear();
                await filter.sendKeys(Key.ENTER);
                assert.equal(searchList.length, 1);
            });

            // Modern browsers can download an EPUB version of a book and save it to the FS, so we test for this
            it('Download EPUB file', async function () {
                const downloadFileName = 'Poezii.35323.epub'
                await driver.switchTo().defaultContent();
                const searchBox = await driver.wait(until.elementIsVisible(driver.findElement(By.id('prefix'))), 1500);
                await searchBox.clear(1000);
                await searchBox.sendKeys('Poezii_cover.35323.html');
                await driver.sleep(1000);
                // Go and visit the first result of the search
                const searchList = await driver.wait(until.elementsLocated(By.xpath('//*[@id="articleList"]/a')), 1500);
                await searchList[0].click();
                // await searchBox.clear();
                // if title is not loaded in next 4 seconds then return empty string and fail test
                await driver.switchTo().frame('articleContent');
                // click on the download button
                await driver.wait(until.elementLocated(By.xpath('//*[@id="content"]/div/div[2]/div[5]/a[2]')), 1500);
                await driver.executeScript('document.querySelector("#content > div > div.pure-u-1.pure-u-md-1-2.bibrec.sidedimg > div.cover-detail.icons-footer > a:nth-child(2)").click()');
                // const downloadButton = await driver.wait(until.elementIsEnabled(driver.findElement(By.xpath('//*[@id="content"]/div/div[2]/div[5]/a[2]'))), 1500);
                // await downloadButton.click();
                const downloadFileStatus = await driver.wait(async function () {
                    // We can only check if the file exist in firefox and chrome (IE and Edge not supported)
                    if (!['firefox', 'chrome'].includes(browserName)) {
                        // will skip if any other browser and pass test
                        return true;
                    }
                    const downloadFileStatus = fs.readdirSync(paths.downloadDir).includes(downloadFileName);
                    if (downloadFileStatus) fs.rmSync(paths.downloadDir + '/' + downloadFileName);
                    return downloadFileStatus;
                }, 5000).catch(() => false);
                assert.ok(downloadFileStatus);

                // exit if every test and mode is completed
                if (mode === modes[modes.length - 1]) {
                    return driver.quit();
                }
            });
        });
    });
}

export default {
    runTests: runTests
};
