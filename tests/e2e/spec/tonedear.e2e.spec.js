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
                        // Increased initial wait time for Firefox
                        await driver.sleep(5000);

                        const swRegistration = await driver.executeScript('return navigator.serviceWorker.ready');
                        assert.ok(swRegistration, 'Service Worker is registered');

                        // Wait for iframe to be present and switch to it
                        const iframe = await driver.wait(
                            until.elementLocated(By.id('articleContent')),
                            10000,
                            'Iframe not found after 10 seconds'
                        );
                        // Add explicit wait for iframe to be ready
                        await driver.wait(
                            until.elementIsVisible(iframe),
                            10000,
                            'Iframe not visible after 10 seconds'
                        );

                        await driver.switchTo().frame(iframe);

                        // More robust image location with longer timeout
                        await driver.wait(async function () {
                            try {
                                const images = await driver.findElements(
                                    By.css('img[alt="Get it on Google Play"], img[alt="Get the iOS app"]')
                                );
                                if (images.length === 0) return false;

                                // Verify both images are present and visible
                                for (const img of images) {
                                    const isDisplayed = await img.isDisplayed();
                                    const dimensions = await driver.executeScript(
                                        'return arguments[0].complete && arguments[0].naturalWidth > 0',
                                        img
                                    );
                                    if (!isDisplayed || !dimensions) return false;
                                }
                                return true;
                            } catch (e) {
                                return false;
                            }
                        }, 15000, 'Store images not found or loaded after 15 seconds');

                        // Get and verify individual images
                        const androidImage = await driver.findElement(By.css('img[alt="Get it on Google Play"]'));
                        const iosImage = await driver.findElement(By.css('img[alt="Get the iOS app"]'));

                        // Additional verification of image loading
                        await driver.wait(async function () {
                            const androidLoaded = await driver.executeScript(
                                'return arguments[0].complete && arguments[0].naturalWidth > 0',
                                androidImage
                            );
                            const iosLoaded = await driver.executeScript(
                                'return arguments[0].complete && arguments[0].naturalWidth > 0',
                                iosImage
                            );
                            return androidLoaded && iosLoaded;
                        }, 10000, 'Images failed to load completely');

                        // Verify dimensions
                        const androidDimensions = await driver.executeScript(
                            'return {width: arguments[0].naturalWidth, height: arguments[0].naturalHeight}',
                            androidImage
                        );
                        const iosDimensions = await driver.executeScript(
                            'return {width: arguments[0].naturalWidth, height: arguments[0].naturalHeight}',
                            iosImage
                        );

                        assert.ok(
                            androidDimensions.width > 0 && androidDimensions.height > 0,
                            'Android image has valid dimensions'
                        );
                        assert.ok(
                            iosDimensions.width > 0 && iosDimensions.height > 0,
                            'iOS image has valid dimensions'
                        );

                        // Switch back to default content
                        await driver.switchTo().defaultContent();
                    } catch (err) {
                        console.error('Detailed error:', err);
                        // Capture page source for debugging
                        const pageSource = await driver.getPageSource();
                        console.error('Page source at time of failure:', pageSource);
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
