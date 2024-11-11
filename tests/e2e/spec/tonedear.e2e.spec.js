/**
 * tonedear.e2e.spec.js : End-to-end tests
 */
import { By, until } from 'selenium-webdriver';
import assert from 'assert';
import paths from '../paths.js';

// Get the BrowserStack environment variable
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
        });
    });
}

export default {
    runTests: runTests
};
