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
import { By, Key, WebDriver } from 'selenium-webdriver';
// import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import paths from './paths.js';

/* eslint-disable camelcase, one-var, prefer-const */
/* global describe, it */

// Get the BrowserStack environment variable
const BROWSERSTACK = !!process.env.BROWSERSTACK_LOCAL_IDENTIFIER;
// DEV: For local testing, use line below instead
// const BROWSERSTACK = true;

// Select the correct port according to the environment
const port = process.env.BROWSERSTACK_LOCAL_IDENTIFIER ? '8099' : '8080';

// Set the archives to load
let rayCharlesBaseFile = paths.rayCharlesBaseFile;
// For BrowserStack, we have to construct the file blops with XHR instead
if (BROWSERSTACK) {
    rayCharlesBaseFile = '/tests/wikipedia_en_ray_charles_2015-06.zimaa';
}
let rayCharlesAllParts = '', rayCharlesFileArray = [];
for (let i = 0; i < 15; i++) {
    let rayCharlesPart = rayCharlesBaseFile.replace(/zimaa$/, `zima${String.fromCharCode(97 + i)}`);
    // console.log('Loading archive: ' + rayCharlesPart);
    rayCharlesFileArray.push(rayCharlesPart);
    rayCharlesAllParts += rayCharlesPart;
    if (i < 14) {
        rayCharlesAllParts += '\n';
    }
}
console.log('\nLoading archive:\n' + rayCharlesAllParts + '\n');

/**
 *  Run the tests
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {array} modes Array of modes to run the tests in
 * @returns {Promise<void>}  A Promise for the completion of the tests
*/
function runTests (driver, modes) {
    let browserName, browserVersion;
    driver.getCapabilities().then(function (caps) {
        browserName = caps.get('browserName');
        browserVersion = caps.get('browserVersion');
        console.log('\nRunning tests on: ' + browserName + ' ' + browserVersion);
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

    // Set the modes to test if they were not passed to the testing function
    if (!modes) {
        modes = ['jquery', 'serviceworker'];
    }

    // Run tests for each mode
    modes.forEach(function (mode) {
        // SW mode tests will need to be skipped if the browser does not support the SW API
        let serviceWorkerAPI = true;
        describe('Legacy Ray Charles test [XZ compression] ' + (mode === 'jquery' ? '[JQuery mode]' : mode === 'serviceworker' ? '[SW mode]' : ''), async function () {
            this.timeout(60000);
            this.slow(10000);
            // Run tests twice, once in serviceworker mode and once in jquery mode
            describe('Load app', function () {
                it('Load Kiwix JS and check title', async function () {
                    await driver.get('http://localhost:' + port + '/dist/www/index.html');
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
                        const elementIsVisible = await driver.executeScript('var el=arguments[0]; el.scrollIntoView(true); setTimeout(function () {el.click();}, 250); return el.offsetParent;', modeSelector);
                        return elementIsVisible;
                    }, 6000);
                    // Pause for timeout
                    await driver.sleep(500);
                    // Check for and click any approve button in dialogue box
                    try {
                        const activeAlertModal = await driver.findElement(By.css('.modal[style*="display: block"]'));
                        if (activeAlertModal) {
                            // Check if ServiceWorker mode API is supported
                            if (mode === 'serviceworker') {
                                serviceWorkerAPI = await driver.findElement(By.id('modalLabel')).getText().then(function (alertText) {
                                    // DEV: Although I have tried to make this generic in the hope that the alert will contain the word
                                    // "ServiceWorker" or "Service Worker" in all languages, we may need to add some failure code to the dialogue box
                                    // to make this more robust, as translators may not be aware of the need to include this word in Roman script
                                    const supported = !/Service\s*Worker/i.test(alertText);
                                    console.log(supported ? '' : '\x1b[33m%s\x1b[0m', '      ' + alertText);
                                    return supported;
                                })
                            }
                        }
                        const approveButton = await driver.findElement(By.id('approveConfirm'));
                        await approveButton.click();
                    } catch (e) {
                        // Do nothing
                    }
                    if (mode === 'jquery' || serviceWorkerAPI) {
                        // Wait until the mode has switched
                        await driver.sleep(500);
                        let serviceWorkerStatus = await driver.findElement(By.id('serviceWorkerStatus')).getAttribute('class');
                        try {
                            if (mode === 'serviceworker') {
                                assert.equal(true, /apiAvailable/i.test(serviceWorkerStatus));
                            } else {
                                assert.equal(true, /apiUnavailable/i.test(serviceWorkerStatus));
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
                            await driver.sleep(400);
                            // Click the mode selector again
                            await modeSelector.click();
                            // Wait until the mode has switched
                            await driver.sleep(400);
                            serviceWorkerStatus = await driver.findElement(By.id('serviceWorkerStatus')).getAttribute('class');
                            if (mode === 'serviceworker') {
                                assert.equal(true, /apiAvailable/i.test(serviceWorkerStatus));
                            } else {
                                assert.equal(true, /apiUnavailable/i.test(serviceWorkerStatus));
                            }
                        }
                    } else {
                        // Skip remaining SW mode tests if the browser does not support the SW API
                        console.log('\x1b[33m%s\x1b[0m', '      Skipping SW mode tests...');
                        return driver.quit();
                    }
                });
            });
            describe('Load archive', function () {
                it('Load legacy Ray Charles and check index contains specified article', async function () {
                    if (!serviceWorkerAPI) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    const archiveFiles = await driver.findElement(By.id('archiveFiles'));
                    // Unhide the element using JavaScript in case it is hidden
                    await driver.executeScript('arguments[0].style.display = "block";', archiveFiles);
                    if (!BROWSERSTACK) {
                        // We are running tests locally or on GitHub Actions
                        await archiveFiles.sendKeys(rayCharlesAllParts);
                        // Wait until files have loaded
                        var filesLength;
                        await driver.wait(async function () {
                            filesLength = await driver.executeScript('return document.getElementById("archiveFiles").files.length');
                            return filesLength === 15;
                        }, 5000);
                        // Check that we loaded 15 files
                        assert.equal(15, filesLength);
                    } else {
                        // We are running tests on BrowserStack, so create files as blobs and use the setRemoteArchives function to initiate the app
                        await driver.executeScript('var files = arguments[0]; window.setRemoteArchives.apply(this, files);', rayCharlesFileArray);
                        await driver.sleep('1300');
                    }
                });
            });
            describe('Navigate to linked article', function () {
                it('Navigate to "This Little Girl of Mine"', async function () {
                    if (!serviceWorkerAPI) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    // console.log('FilesLength outer: ' + filesLength);
                    // Wait until the index has loaded
                    await driver.sleep(3000);
                    const contentAvailable = await driver.executeScript('return /little\\sgirl/i.test(document.getElementById("articleContent").contentDocument.documentElement.innerHTML)');
                    assert.equal(contentAvailable, true);
                    // Switch to iframe and check that the index contains the specified article
                    await driver.switchTo().frame('articleContent');
                    const articleLink = await driver.findElement(By.xpath('/html/body/div/div/ul/li[77]/a[2]'));
                    // const articleLink = await driver.findElement(By.linkText('This Little Girl of Mine'));
                    assert.equal('This Little Girl of Mine', await articleLink.getText());
                    // Scroll the element into view and navigate to it
                    await driver.wait(async function () {
                        const elementIsVisible = await driver.executeScript('var el=arguments[0]; el.scrollIntoView(true); setTimeout(function () {el.click();}, 150); return el.offsetParent;', articleLink);
                        // console.log('Element is visible: ' + elementIsVisible);
                        return elementIsVisible;
                    }, 10000);
                    // Pause for 1.3 second to allow article to load
                    await driver.sleep(1300);
                    let elementText = '';
                    try {
                        // Find the mwYw element in JavaScript and get its content
                        elementText = await driver.executeScript('return document.getElementById("mwYw").textContent;');
                    } catch (e) {
                        // We probably got a NoSuchFrameError on Safari, so try selecting it with a different method
                        await driver.switchTo().defaultContent();
                        elementText = await driver.executeScript('var iframeDoc = document.getElementById("articleContent").contentDocument; return iframeDoc.getElementById("mwYw").textContent;');
                    }
                    // console.log('Element text: ' + elementText);
                    // Check that the article title is correct
                    assert.equal('Instrumentation by the Ray Charles Orchestra', elementText);
                });
            });
            describe('Initiate search and navigate', function () {
                it('Search for Ray Charles in title index and go to article', async function () {
                    if (!serviceWorkerAPI) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    await driver.switchTo().defaultContent();
                    const prefix = await driver.findElement(By.id('prefix'));
                    // Search by setting the value of the prefix element using JavaScript
                    await driver.executeScript('arguments[0].value = "Ray"; document.getElementById("searchArticles").click();', prefix);
                    // Wait for at least four results to appear
                    await driver.sleep(500);
                    await driver.findElement(By.css('.list-group-item:nth-child(4)'));
                    // Check the contents of the result and Add the hover attribute to it so we can select it with the keyboard
                    await driver.wait(async function () {
                        // NB dispatchEvent for keydown does not work in IE, so we do this later using WebDriver methods
                        // const found = await driver.executeScript('return new Promise(function (resolve) { setTimeout(function () { var found = false; var el = document.querySelector(".list-group-item:nth-child(4)"); found = el.innerText === "Ray Charles"; el.scrollIntoView(false); el.classList.add("hover"); document.getElementById("prefix").dispatchEvent(new KeyboardEvent("keydown", {"key": "Enter"})); resolve(found); }, 1000); });');
                        const found = await driver.executeScript('var found = false; var el = document.querySelector(".list-group-item:nth-child(4)"); found = el.innerText === "Ray Charles"; el.scrollIntoView(false); el.classList.add("hover"); return found;');
                        assert.equal(true, found);
                        return found;
                    }, 3000);
                    // Now select the result by sending the enter key
                    await driver.findElement(By.id('prefix')).sendKeys(Key.ENTER);
                    // Check if that worked, and if search result still visible, try with a click instead
                    try {
                        const resultElement = await driver.findElement(By.css('.list-group-item:nth-child(4)'));
                        if (resultElement) {
                            await resultElement.click();
                        }
                    } catch (e) {
                        // Do nothing
                    }
                    await driver.switchTo().frame('articleContent');
                    // Wait until the article has loaded and check title
                    await driver.sleep(750);
                    await driver.wait(async function () {
                        const articleTitle = await driver.executeScript('return document.getElementById("titleHeading").innerText');
                        // console.log('Article title: ' + articleTitle);
                        return articleTitle === 'Ray Charles';
                    }, 5000);
                    // Check that the article title is correct
                    const title = await driver.findElement(By.id('titleHeading')).getText();
                    assert.equal('Ray Charles', title);
                    // If we have reached the last mode, quit the driver
                    if (mode === modes[modes.length - 1]) {
                        return driver.quit();
                    }
                });
            });
        });
    });
}

export default {
    runTests: runTests
};
