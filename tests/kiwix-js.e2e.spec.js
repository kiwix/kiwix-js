import { By } from 'selenium-webdriver';
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

    // Set the modes to test if they were not passed to the testing function
    if (!modes) {
        modes = ['jquery', 'serviceworker'];
    }

    // Run tests for each mode
    modes.forEach(function (mode) {
        describe('Legacy Ray Charles test (XZ compression)', async function () {
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
                    // Click any approve button in dialogue box
                    try {
                        const approveButton = await driver.findElement(By.id('approvConfirm'));
                        await approveButton.click();
                    } catch (e) {
                        // Do nothing
                    }
                    // Wait until the mode has switched
                    driver.findElement(By.id('serviceWorkerStatus')).getText().then(function (serviceWorkerStatus) {
                        // console.log('Service worker status: ' + serviceWorkerStatus);
                        if (mode === 'serviceworker') {
                            assert.equal(true, /and\registered/i.test(serviceWorkerStatus));
                        } else {
                            assert.equal(true, /not\sregistered|unavailable/i.test(serviceWorkerStatus));
                        }
                    });
                });
            });
            describe('Load archive', function () {
                it('Load legacy Ray Charles and check index contains specified article', async function () {
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
                    await driver.switchTo().defaultContent();
                    const prefix = await driver.findElement(By.id('prefix'));
                    // Focus the prefix element
                    // await prefix.click();
                    // await driver.wait(async function () {
                    //     const prefixContainsText = await driver.executeScript('var el = document.getElementById("prefix"); el.focus(); el.value = "ray"; return el.value;');
                    //     console.log('Prefix contains text: ' + prefixContainsText);
                    //     return prefixContainsText;
                    // }, 5000);
                    await prefix.sendKeys('Ray');
                    await prefix.click();
                    // Wait for the result to appear and click it
                    await driver.wait(async function () {
                        const resultElement = await driver.findElement(By.xpath("//div[@id='articleList']/a[text()='Ray Charles']"));
                        const resultText = await resultElement.getText();
                        assert.equal('Ray Charles', resultText);
                        await resultElement.click();
                        return resultText;
                    }, 5000);
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
