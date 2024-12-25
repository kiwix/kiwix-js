/**
 * tonedear.e2e.spec.js : End-to-end tests
 */
import { By, until } from 'selenium-webdriver';
import assert from 'assert';
import paths from '../paths.js';

const BROWSERSTACK = !!process.env.BROWSERSTACK_LOCAL_IDENTIFIER;
const port = BROWSERSTACK ? '8099' : '8080';

// Set the archive to load
let tonedearBaseFile = paths.tonedearBaseFile;
if (BROWSERSTACK) {
    tonedearBaseFile = '/tests/zims/tonedear/tonedear.com_en_2024-09.zim';
}

/* global describe, it */
/**
 * Run the tests
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {array} modes Array of modes to run the tests in ['jquery', 'serviceworker']
 */
function runTests (driver, modes) {
    // Set default modes if not provided
    if (!modes) {
        modes = ['jquery', 'serviceworker'];
    }

    let browserName, browserVersion;
    driver.getCapabilities().then(function (caps) {
        browserName = caps.get('browserName');
        browserVersion = caps.get('browserVersion');
        console.log('\nRunning Tonedear tests on: ' + browserName + ' ' + browserVersion);
    });

    // Set implicit wait timeout
    driver.manage().setTimeouts({ implicit: 3000 });

    modes.forEach(function (mode) {
        let serviceWorkerAPI = true;

        // eslint-disable-next-line no-undef
        describe('Tonedear Test Suite ' + (mode === 'jquery' ? '[JQuery mode]' : '[SW mode]'), function () {
            this.timeout(60000);
            this.slow(10000);

            it('Load Kiwix JS and verify title', async function () {
                await driver.get('http://localhost:' + port + '/dist/www/index.html?noPrompts=true');
                await driver.sleep(1300);
                await driver.navigate().refresh();
                await driver.sleep(800);
                const title = await driver.getTitle();
                assert.equal('Kiwix', title);
            });

            it('Switch to ' + mode + ' mode', async function () {
                const modeSelector = await driver.wait(
                    until.elementLocated(By.id(mode + 'ModeRadio'))
                );
                await driver.executeScript(
                    'var el=arguments[0]; el.scrollIntoView(true); setTimeout(function() {el.click();}, 50); return el.offsetParent;',
                    modeSelector
                );
                await driver.sleep(1300);

                try {
                    const activeAlertModal = await driver.findElement(
                        By.css('.modal[style*="display: block"]')
                    );
                    if (activeAlertModal) {
                        serviceWorkerAPI = await driver.findElement(By.id('modalLabel'))
                            .getText()
                            .then(function (alertText) {
                                return !/ServiceWorker\sAPI\snot\savailable/i.test(alertText);
                            });
                        const approveButton = await driver.wait(
                            until.elementLocated(By.id('approveConfirm'))
                        );
                        await approveButton.click();
                    }
                } catch (e) {
                    // Do nothing
                }

                if (mode === 'serviceworker') {
                    // Disable source verification in SW mode as the dialogue box gave inconsistent test results
                    const sourceVerificationCheckbox = await driver.findElement(By.id('enableSourceVerification'));
                    if (sourceVerificationCheckbox.isSelected()) {
                        await sourceVerificationCheckbox.click();
                    }
                }
            });

            it('Load Tonedear archive and verify content', async function () {
                if (!serviceWorkerAPI) {
                    console.log('\x1b[33m%s\x1b[0m', '    - Following test skipped:');
                    this.skip();
                }

                const archiveFiles = await driver.findElement(By.id('archiveFiles'));
                await driver.executeScript('arguments[0].style.display = "block";', archiveFiles);

                if (!BROWSERSTACK) {
                    await archiveFiles.sendKeys(tonedearBaseFile);
                    await driver.executeScript('window.setLocalArchiveFromFileSelect();');
                } else {
                    await driver.executeScript(
                        'window.setRemoteArchives.apply(this, [arguments[0]]);',
                        [tonedearBaseFile]
                    );
                    await driver.sleep(1300);
                }

                await driver.wait(
                    until.elementLocated(By.id('articleContent')),
                    20000,
                    'Iframe not loaded'
                );
            });

            it('Navigate from main page to Android & iOS section', async function () {
                // Check for Dialog Box and click any Approve Button in subsequent dialog box
                try {
                    const activeAlertModal = await driver.findElement(By.css('.modal[style*="display: block"]'));
                    if (activeAlertModal) {
                        // console.log('Found active alert modal');
                        const approveButton = await driver.findElement(By.id('approveConfirm'));
                        await approveButton.click();
                    }
                } catch (e) {
                    // Do nothing
                    console.log('Modal not found within the timeout. Continuing test...');
                }

                // Switch to the iframe if the content is inside 'articleContent'
                await driver.switchTo().frame('articleContent');
                // console.log('Switched to iframe successfully');

                // Wait until the link "Android & iOS App" is present in the DOM
                await driver.wait(async function () {
                    const contentAvailable = await driver.executeScript('return document.querySelector(\'a[href="android-ios-ear-training-app"]\') !== null;');
                    return contentAvailable;
                }, 10000); // Increased to 10 seconds for more loading time

                // Find the "Android & iOS App" link
                const androidLink = await driver.findElement(By.css('a[href="android-ios-ear-training-app"]'));

                // Test that the element is found
                assert(androidLink !== null, 'Android & iOS App link was not found');

                // Scroll the element into view and click it
                // await driver.executeScript('arguments[0].scrollIntoView(true);', androidLink);
                // await driver.wait(until.elementIsVisible(androidLink), 10000); // Wait until it's visible
                await androidLink.click();

                // Switch back to the default content
                await driver.switchTo().defaultContent();
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
                        // ServiceWorker mode test for image loading
                        await driver.sleep(3000);

                        const swRegistration = await driver.executeScript('return navigator.serviceWorker.ready');
                        assert.ok(swRegistration, 'Service Worker is registered');

                        // console.log('Current URL:', await driver.getCurrentUrl());

                        // Switch to the iframe that contains the Android and iOS images
                        const iframe = await driver.findElement(By.id('articleContent'));
                        await driver.switchTo().frame(iframe);

                        // Wait for images to be visible on the page inside the iframe
                        await driver.wait(async function () {
                            const images = await driver.findElements(By.css('img[alt="Get it on Google Play"], img[alt="Get the iOS app"]'));
                            if (images.length === 0) return false;

                            // Check if all images are visible
                            const visibility = await Promise.all(images.map(async (img) => {
                                return await img.isDisplayed();
                            }));
                            return visibility.every((isVisible) => isVisible);
                        }, 30000, 'No visible store images found after 30 seconds');

                        const androidImage = await driver.findElement(By.css('img[alt="Get it on Google Play"]'));
                        const iosImage = await driver.findElement(By.css('img[alt="Get the iOS app"]'));

                        // Wait for images to load and verify dimensions
                        await driver.wait(async function () {
                            const androidLoaded = await driver.executeScript('return arguments[0].complete && arguments[0].naturalWidth > 0 && arguments[0].naturalHeight > 0;', androidImage);
                            const iosLoaded = await driver.executeScript('return arguments[0].complete && arguments[0].naturalWidth > 0 && arguments[0].naturalHeight > 0;', iosImage);
                            return androidLoaded && iosLoaded;
                        }, 5000, 'Images did not load successfully');

                        const androidWidth = await driver.executeScript('return arguments[0].naturalWidth;', androidImage);
                        const androidHeight = await driver.executeScript('return arguments[0].naturalHeight;', androidImage);

                        const iosWidth = await driver.executeScript('return arguments[0].naturalWidth;', iosImage);
                        const iosHeight = await driver.executeScript('return arguments[0].naturalHeight;', iosImage);

                        assert.ok(androidWidth > 0 && androidHeight > 0, 'Android image has valid dimensions');
                        assert.ok(iosWidth > 0 && iosHeight > 0, 'iOS image has valid dimensions');

                        // Switch back to the main content after finishing the checks
                        await driver.switchTo().defaultContent();
                    } catch (err) {
                        // If we still can't find the images, log the page source to help debug
                        console.error('Failed to find store images:', err.message);
                        throw err;
                    }
                }
            });
        });
    });
}

export default {
    runTests: runTests
};
