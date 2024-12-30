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

            it('Verify app store images are present', async function () {
                if (!serviceWorkerAPI && mode === 'serviceworker') {
                    console.log('\x1b[33m%s\x1b[0m', '    - Following test skipped:');
                    return;
                }

                await driver.switchTo().frame('articleContent');
                const androidImage = await driver.findElement(By.css('img[alt="Get it on Google Play"]'));
                const iosImage = await driver.findElement(By.css('img[alt="Get the iOS app"]'));
                // Verify images are present by checking if findElement doesn't throw an error
                assert(androidImage !== null, 'Android app store image is present');
                assert(iosImage !== null, 'iOS app store image is present');

                console.log('Image founds');

                await driver.switchTo().defaultContent();
            });
        });
    });
}

export default {
    runTests: runTests
};
