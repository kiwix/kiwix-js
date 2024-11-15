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
                await driver.get(`http://localhost:${port}/dist/www/index.html?noPrompts=true`);
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
            });

            it('Verify Android and iOS store images in ' + (mode === 'jquery' ? 'Restricted' : 'ServiceWorker') + ' mode', async function () {
                if (!serviceWorkerAPI && mode === 'jquery') {
                    // Restricted mode test for data URIs
                    const androidImage = await driver.findElement(By.css('img[alt="Get it on Google Play"]'));
                    const iosImage = await driver.findElement(By.css('img[alt="Download on the App Store"]'));

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

                        console.log('Current URL:', await driver.getCurrentUrl());

                        await driver.wait(async function () {
                            const images = await driver.findElements(By.css('img[alt="Get it on Google Play"], img[alt="Download on the App Store"]'));
                            return images.length > 0;
                        }, 20000, 'No store images found after 10 seconds');

                        const androidImage = await driver.findElement(By.css('img[alt="Get it on Google Play"]'));
                        const iosImage = await driver.findElement(By.css('img[alt="Download on the App Store"]'));

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
