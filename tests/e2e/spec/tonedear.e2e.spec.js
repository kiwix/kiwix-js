/* eslint-disable no-undef */
import { By, until } from 'selenium-webdriver';
import assert from 'assert';
import paths from '../paths.js';

const BROWSERSTACK = !!process.env.BROWSERSTACK_LOCAL_IDENTIFIER;
const port = BROWSERSTACK ? '8099' : '8080';
const tonedearBaseFile = BROWSERSTACK ? '/tests/zims/tonedear/tonedear.com_en_2024-09.zim' : paths.tonedearBaseFile;

/**
 * Run the tests
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {Array} modes Array of modes to run the tests in
 * @returns {Promise<void>} A Promise for the completion of the tests
 */
function runTests (driver, modes) {
    let browserName, browserVersion;
    driver.getCapabilities().then(function (caps) {
        browserName = caps.get('browserName');
        browserVersion = caps.get('browserVersion');
        console.log('\nRunning Tonedear tests on: ' + browserName + ' ' + browserVersion);
    });

    // Set the implicit wait to 3 seconds
    driver.manage().setTimeouts({ implicit: 3000 });

    // Run in both jquery and serviceworker modes by default
    if (!modes) {
        modes = ['jquery', 'serviceworker'];
    }

    modes.forEach(function (mode) {
        let serviceWorkerAPI = true;
        describe('Tonedear test ' + (mode === 'jquery' ? '[JQuery mode]' : '[SW mode]'), function () {
            this.timeout(60000);
            this.slow(10000);

            it('Load Kiwix JS and check title', async function () {
                await driver.get('http://localhost:' + port + '/dist/www/index.html?noPrompts=true');
                await driver.sleep(1300);
                await driver.navigate().refresh();
                await driver.sleep(800);
                const title = await driver.getTitle();
                assert.equal('Kiwix', title);
            });

            it('Switch to ' + mode + ' mode', async function () {
                const modeSelector = await driver.wait(until.elementLocated(By.id(mode + 'ModeRadio')));
                await driver.wait(async function () {
                    const elementIsVisible = await driver.executeScript(
                        'var el=arguments[0]; el.scrollIntoView(true); setTimeout(function () {el.click();}, 50); return el.offsetParent;',
                        modeSelector
                    );
                    return elementIsVisible;
                }, 5000);
                await driver.sleep(1300);

                try {
                    const activeAlertModal = await driver.findElement(By.css('.modal[style*="display: block"]'));
                    if (activeAlertModal) {
                        serviceWorkerAPI = await driver.findElement(By.id('modalLabel')).getText().then(function (alertText) {
                            return !/ServiceWorker\sAPI\snot\savailable/i.test(alertText);
                        });
                        const approveButton = await driver.wait(until.elementLocated(By.id('approveConfirm')));
                        await approveButton.click();
                    }
                } catch (e) {
                    // Do nothing
                }

                if (mode === 'serviceworker' && !serviceWorkerAPI) {
                    console.log('\x1b[33m%s\x1b[0m', '      Skipping SW mode tests because browser does not support API');
                    await driver.quit();
                    return;
                }

                // Disable source verification in SW mode
                if (mode === 'serviceworker') {
                    const sourceVerificationCheckbox = await driver.findElement(By.id('enableSourceVerification'));
                    if (await sourceVerificationCheckbox.isSelected()) {
                        await sourceVerificationCheckbox.click();
                    }
                }
            });

            it('Load Tonedear archive', async function () {
                if (!serviceWorkerAPI && mode === 'serviceworker') {
                    console.log('\x1b[33m%s\x1b[0m', '    - Following test skipped:');
                    return;
                }

                if (!BROWSERSTACK) {
                    const archiveFiles = await driver.findElement(By.id('archiveFiles'));
                    await archiveFiles.sendKeys(tonedearBaseFile);
                    await driver.executeScript('window.setLocalArchiveFromFileSelect();');
                    const filesLength = await driver.executeScript('return document.getElementById("archiveFiles").files.length');
                    assert.equal(1, filesLength);
                } else {
                    await driver.executeScript('var files = arguments[0]; window.setRemoteArchives.apply(this, files);', [tonedearBaseFile]);
                    await driver.sleep(1300);
                }

                // Handle security alert if it appears
                try {
                    const securityAlert = await driver.wait(until.elementLocated(By.css('.modal[style*="display: block"]')), 3000);
                    if (securityAlert) {
                        const trustSourceButton = await driver.findElement(By.xpath("//button[contains(text(), 'Trust Source')]"));
                        await trustSourceButton.click();
                    }
                } catch (e) {
                    // No security alert found, continue with test
                }
            });

            it('Navigate to Android & iOS section', async function () {
                if (!serviceWorkerAPI && mode === 'serviceworker') {
                    console.log('\x1b[33m%s\x1b[0m', '    - Following test skipped:');
                    return;
                }

                await driver.sleep(2000); // Give time for content to load
                await driver.switchTo().frame('articleContent');
                const androidIosLink = await driver.wait(until.elementLocated(By.css('a[href="android-ios-ear-training-app"]')), 5000);
                await androidIosLink.click();

                // Switch back to default content before handling dialogs or verifying content
                await driver.switchTo().defaultContent();

                // Wait time
                await driver.sleep(1000);
            });

            it('Verify Android and iOS store images in ' + (mode === 'jquery' ? 'Restricted' : 'ServiceWorker') + ' mode', async function () {
                if (!serviceWorkerAPI && mode === 'jquery') {
                    // Restricted mode test for data URIs
                    const androidImage = await driver.findElement(By.css('img[alt="Get it on Google Play"]'));
                    const iosImage = await driver.findElement(By.css('img[alt="Get the iOS app"]'));

                    // Verify src attribute has changed to a data URI
                    const androidSrc = await androidImage.getAttribute('src');
                    const iosSrc = await iosImage.getAttribute('src');

                    assert.ok(androidSrc.startsWith('data:image/png;base64,'), 'Android image src is a data URI');
                    assert.ok(iosSrc.startsWith('data:image/png;base64,'), 'iOS image src is a data URI');

                    // Compare the first 30 characters of data URIs
                    const androidDataSnippet = androidSrc.substring(22, 52);
                    const iosDataSnippet = iosSrc.substring(22, 52);

                    // Expected snippet for comparison
                    const expectedAndroidSnippet = 'iVBORw0KGgoAAAANSUhEUg';
                    const expectedIosSnippet = 'iVBORw0KGgoAAAANSUhEUg';

                    assert.strictEqual(androidDataSnippet, expectedAndroidSnippet, 'Android image data matches expected');
                    assert.strictEqual(iosDataSnippet, expectedIosSnippet, 'iOS image data matches expected');
                } else if (serviceWorkerAPI && mode === 'serviceworker') {
                    try {
                        // Wait for any alerts and handle them
                        await driver.sleep(2000);
                        try {
                            const alert = await driver.findElement(By.css('.modal[style*="display: block"]'));
                            if (alert) {
                                const okButton = await driver.findElement(By.css('button.btn-primary'));
                                await okButton.click();
                            }
                        } catch (e) {
                            // No alert present, continue
                        }

                        // First, verify we're on the correct page
                        const iframe = await driver.wait(
                            until.elementLocated(By.id('articleContent')),
                            10000,
                            'Article content iframe not found'
                        );

                        // Switch to iframe
                        await driver.switchTo().frame(iframe);

                        // Click the Android & iOS link - make sure we're looking for the exact text
                        const androidIosLink = await driver.wait(
                            until.elementLocated(By.xpath("//a[contains(text(), 'Android & iOS App')]")),
                            10000,
                            'Android & iOS link not found'
                        );
                        await androidIosLink.click();

                        // Switch back to main frame to handle any dialogs
                        await driver.switchTo().defaultContent();

                        // Wait for any navigation alerts
                        await driver.sleep(1000);
                        try {
                            const navigationAlert = await driver.findElement(By.css('.modal[style*="display: block"]'));
                            if (navigationAlert) {
                                const okayButton = await driver.findElement(By.css('button.btn-primary'));
                                await okayButton.click();
                            }
                        } catch (e) {
                            // No alert present, continue
                        }

                        // Wait for iframe to update after navigation
                        await driver.sleep(2000);

                        // Switch back to iframe
                        await driver.switchTo().frame(iframe);

                        // Look for store buttons with more specific selectors
                        await driver.wait(async function () {
                            try {
                                // First check if we're on the right page by looking for a specific heading or text
                                const pageContent = await driver.findElements(
                                    By.xpath("//*[contains(text(), 'Android') or contains(text(), 'iOS')]")
                                );
                                if (pageContent.length === 0) {
                                    console.log('Not on Android/iOS page yet...');
                                    return false;
                                }

                                // Look for images or links containing store references
                                const storeElements = await driver.findElements(
                                    By.css([
                                        'img[src*="play"]',
                                        'img[src*="apple"]',
                                        'img[src*="store"]',
                                        'a[href*="play.google.com"]',
                                        'a[href*="apps.apple.com"]'
                                    ].join(','))
                                );

                                if (storeElements.length === 0) {
                                    console.log('Store elements not found yet...');
                                    return false;
                                }

                                // Log what we found for debugging
                                for (const el of storeElements) {
                                    const tagName = await el.getTagName();
                                    const src = tagName === 'img' ? await el.getAttribute('src') : await el.getAttribute('href');
                                    console.log(`Found ${tagName} with src/href: ${src}`);
                                }

                                return storeElements.length >= 2;
                            } catch (e) {
                                console.log('Error in wait condition:', e.message);
                                return false;
                            }
                        }, 15000, 'Store elements not found after navigation');

                        // Switch back to default content
                        await driver.switchTo().defaultContent();
                    } catch (err) {
                        // Log error details that won't cause cyclic reference issues
                        console.error('Test failure:', {
                            message: err.message,
                            name: err.name
                        });

                        // Try to log current iframe src
                        try {
                            const iframeSrc = await driver.executeScript(
                                'return document.getElementById("articleContent").src'
                            );
                            console.log('Current iframe src:', iframeSrc);
                        } catch (e) {
                            console.log('Could not get iframe src:', e.message);
                        }

                        throw err;
                    }
                }

                // Exit if every test has been run and passed
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
