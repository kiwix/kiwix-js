import { By, Key } from 'selenium-webdriver';
// import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import path from 'path';

/* eslint-disable camelcase */
/* global describe, it */

// const options = new firefox.Options();
// options.setBinary('C:/UTILS/FirefoxPortable/App/Firefox64/firefox.exe');

// Set the browsers to test
// const driver_fx = new Builder().forBrowser('firefox').build();
// const driver_chr = new Builder().forBrowser('chrome').build();
// const driver_edge = new Builder().forBrowser('MicrosoftEdge').build();

// Set the archives to load
const rayCharlesBaseFile = path.resolve('./tests/wikipedia_en_ray_charles_2015-06.zimaa');
let rayCharlesAllParts = '';
for (let i = 0; i < 15; i++) {
    rayCharlesAllParts += rayCharlesBaseFile.replace(/zimaa$/, `zima${String.fromCharCode(97 + i)}`);
    if (i < 14) {
        rayCharlesAllParts += '\n';
    }
}

function runTests (driver, modes) {
    let browserName, browserVersion;
    driver.getCapabilities().then(function (caps) {
        browserName = caps.get('browserName');
        browserVersion = caps.get('browserVersion');
        console.log('\nRunning tests on: ' + browserName + ' ' + browserVersion);
    });
    // Set the implicit wait to 3 seconds
    driver.manage().setTimeouts({ implicit: 3000 });

    // Perform app reset before running tests (this is a convenience for local testers)
    describe('Reset app', function () {
        this.timeout(30000);
        this.slow(10000);
        it('Click the app reset button and accpet warning', async function () {
            await driver.get('http://localhost:8080/dist/www/index.html');
            // Pause by searching for a non-existent element
            try {
                driver.findElement(By.id('dummyElement'));
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

    // Set the modes to test if they were not passed to the testing function
    if (!modes) {
        modes = ['jquery', 'serviceworker'];
    }

    // Run tests for each mode
    modes.forEach(function (mode) {
        // SW mode tests will need to be skipped if the browser does not support the SW API
        let serviceWorkerAPI = true;
        describe('Legacy Ray Charles test [XZ compression] ' + (mode === 'jquery' ? '[JQuery mode]' : mode === 'serviceworker' ? '[SW mode]' : ''), async function () {
            this.timeout(30000);
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
                it('Load legacy Ray Charles and check index contains specified article', async function () {
                    if (!serviceWorkerAPI) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    const archiveFiles = await driver.findElement(By.id('archiveFiles'));
                    await archiveFiles.sendKeys(rayCharlesAllParts);
                    // Wait until files have loaded
                    var filesLength;
                    await driver.wait(async function () {
                        // if (browserName === 'internet explorer' || browserName === 'friefox') {
                        filesLength = await driver.executeScript('return document.getElementById("archiveFiles").files.length');
                        // } else {
                        //     filesLength = await driver.executeScript('setTimeout(function () {document.getElementById("btnHome").click();}, 500); return document.getElementById("archiveFiles").files.length');
                        // }
                        return filesLength === 15;
                    }, 5000);
                    // Check that we loaded 15 files
                    assert.equal(15, filesLength);
                });
            });
            describe('Navigate to linked article', function () {
                it('Navigate to "This Littlge Girl of Mine"', async function () {
                    if (!serviceWorkerAPI) {
                        console.log('\x1b[33m%s\x1b[0m', '      Test skipped.');
                        return;
                    }
                    // console.log('FilesLength outer: ' + filesLength);
                    // Switch to iframe and check that the index contains the specified article
                    await driver.switchTo().frame('articleContent');
                    // Wait until the index has loaded
                    await driver.wait(async function () {
                        const contentAvailable = await driver.executeScript('return document.getElementById("mw-content-text");');
                        return contentAvailable;
                    }, 5000);
                    const articleLink = await driver.findElement(By.xpath('/html/body/div/div/ul/li[77]/a[2]'));
                    // const articleLink = await driver.findElement(By.linkText('This Little Girl of Mine'));
                    assert.equal('This Little Girl of Mine', await articleLink.getText());
                    // Scroll the element into view and navigate to it
                    await driver.wait(async function () {
                        const elementIsVisible = await driver.executeScript('var el=arguments[0]; el.scrollIntoView(true); setTimeout(function () {el.click();}, 50); return el.offsetParent;', articleLink);
                        // console.log('Element is visible: ' + elementIsVisible);
                        return elementIsVisible;
                    }, 5000);
                    // Check that the article title is correct
                    assert.equal('Instrumentation by the Ray Charles Orchestra', await driver.findElement(By.id('mwYw')).getText());
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
                    await prefix.sendKeys('Ray');
                    // Wait for at least four results to appear
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
                    // await resultElement.click();
                    await driver.switchTo().frame('articleContent');
                    // Wait until the article has loaded and check title
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
                        await driver.quit();
                    }
                });
            });
        });
    });
}

export default {
    runTests: runTests
};
