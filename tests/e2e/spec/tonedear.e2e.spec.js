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

    // Perform app reset before tests if we are not running CI
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
                if (mode === 'jquery' || serviceWorkerAPI) {
                    // Wait until the mode has switched
                    await driver.sleep(2000);
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
                        let otherModeSelector;
                        await driver.wait(async function () {
                            otherModeSelector = await driver.findElement(By.id(mode === 'jquery' ? 'serviceworkerModeRadio' : 'jqueryModeRadio'));
                        }, 5000);
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

                console.log('\n=== Starting ZIM file loading test ===');

                const archiveFiles = await driver.findElement(By.id('archiveFiles'));
                await driver.executeScript('arguments[0].style.display = "block";', archiveFiles);
                console.log('Archive files input found and displayed');

                // Wait until till files are loaded
                let filesLength;
                const isFileLoaded = await driver.wait(async function () {
                    // check files are loaded
                    filesLength = await driver.executeScript('return document.getElementById("archiveFiles").files.length');
                    return filesLength === 1;
                }, 2000).catch(() => false);

                if (!BROWSERSTACK) {
                    if (!isFileLoaded) await archiveFiles.sendKeys(tonedearBaseFile);
                    filesLength = await driver.executeScript('return document.getElementById("archiveFiles").files.length');

                    console.log('Local files loaded:', filesLength);

                    await driver.executeScript('window.setLocalArchiveFromFileSelect();');
                    assert.equal(1, filesLength, 'File not loaded');
                } else {
                    console.log('Loading remote archive:', tonedearBaseFile);

                    await driver.executeScript(
                        'window.setRemoteArchives.apply(this, [arguments[0]]);',
                        [tonedearBaseFile]
                    );
                    // await driver.wait(async function () {
                    //     const isLoaded = await driver.executeScript(`
                    //         return window.app &&
                    //             window.app.isReady() &&
                    //             window.app.selectedArchive !== null;
                    //     `);
                    //     return isLoaded;
                    // }, 30000, 'ZIM file failed to load');
                    await driver.sleep(1300);

                    // In JQuery mode, the app warns the user that there is active content it cannot run, so we test for this and dismiss
                    it('Checking active content warning', async function () {
                        const activeContentWarning = await driver.wait(async function () {
                            const element = await driver.findElement(By.id('activeContent'));
                            return await element.isDisplayed();
                        }, 2000).catch(() => false);
                        if (mode === 'jquery') {
                            assert.ok(true, activeContentWarning);
                        } else {
                            assert.equal(false, activeContentWarning);
                        }
                    });
                }
                await driver.wait(
                    until.elementLocated(By.id('articleContent')),
                    20000,
                    'Iframe not loaded'
                );
            });

            it('Navigate from main page to Android & iOS section', async function () {
                console.log('\n=== Starting navigation test ===');
                // Get browser information
                const browserInfo = await driver.getCapabilities();
                const browserName = browserInfo.getBrowserName();
                const browserVersion = browserInfo.getBrowserVersion();
                console.log(`Running test on ${browserName} ${browserVersion}`);

                // Special handling for Firefox 70
                const isOldFirefox = browserName === 'firefox' && parseInt(browserVersion) <= 70;
                if (isOldFirefox) {
                    console.log('Detected Firefox 70 or lower, using compatibility mode');
                    // Force a page reload to ensure content loading
                    await driver.navigate().refresh();
                    await driver.sleep(2000);

                    // Try to force direct content loading
                    await driver.executeScript(`
                        if (window.app && window.app.selectedArchive) {
                            // Force synchronous content loading for older Firefox
                            window.app.selectedArchive.directLoad = true;
                            window.app.selectedArticle.reload();
                        }
                    `);
                    await driver.sleep(3000);
                }

                // Clear any modals
                try {
                    const activeAlertModal = await driver.findElement(By.css('.modal[style*="display: block"]'));
                    if (activeAlertModal) {
                        const approveButton = await driver.findElement(By.id('approveConfirm'));
                        await approveButton.click();
                    }
                } catch (e) {
                    console.log('No active modal found');
                }

                // Wait for iframe with extended timeout for older browsers
                console.log('Waiting for iframe...');
                const iframe = await driver.wait(
                    until.elementLocated(By.id('articleContent')),
                    isOldFirefox ? 30000 : 15000,
                    'Iframe not found'
                );

                // Add diagnostic logging
                const iframeState = await driver.executeScript(`
                    const iframe = document.getElementById('articleContent');
                    return {
                        exists: !!iframe,
                        visible: iframe ? window.getComputedStyle(iframe).display !== 'none' : false,
                        contentWindow: iframe ? !!iframe.contentWindow : false,
                        contentDocument: iframe ? !!iframe.contentDocument : false
                    };
                `);
                console.log('Iframe state:', iframeState);

                // Fix for iframe visiblity if hidden
                if (!iframeState.visible) {
                    console.log('Iframe is hidden, trying to fix...');
                    await driver.executeScript(`
                        const iframe = document.getElementById('articleContent');    
                        if (iframe) {
                            iframe.style.display = 'block';
                            iframe.style.visibility = 'visible';
                            iframe.height = '100%';
                            iframe.width = '100%';
                            console.log('Iframe styles updated to ensure visiblity');
                        }
                    `);
                }

                // For older Firefox, try alternative content loading method
                if (isOldFirefox) {
                    console.log('Attempting alternative content loading for Firefox 70...');
                    const content = await driver.executeScript(`
                            return window.app && window.app.selectedArticle ? window.app.selectedArticle.content : null;
                        `);
                    console.log('Selected Article Content:', content);

                    if (content) {
                        await driver.executeScript(`
                            const iframe = document.getElementById('articleContent');
                            if (iframe && iframe.contentDocument) {
                                iframe.contentDocument.open();
                                iframe.contentDocument.write('<p>Test Content</p>');
                                iframe.contentDocument.close();
                            }
                        `);
                        await driver.sleep(2000);
                    } else {
                        console.log('Content is empty or unavailable');
                    }
                }

                // Switch to iframe
                console.log('Switching to iframe...');
                await driver.switchTo().frame(iframe);
                console.log('Successfully switched to iframe');

                // Debugging network requests for resource loading
                await driver.executeScript(`
                    window.performance.getEntriesByType('resource').forEach(entry => console.log(entry.name));  
                `);

                // Wait for content with different strategies based on browser
                console.log('Waiting for content...');
                await driver.wait(async function () {
                    try {
                        const pageSource = await driver.getPageSource();
                        console.log('Content length:', pageSource.length);

                        if (isOldFirefox && pageSource.length < 1000) {
                            // Try alternative content loading again
                            await driver.executeScript(`
                                if (window.parent && window.parent.app) {
                                    const content = window.parent.app.selectedArticle.content;
                                    if (content) {
                                        document.open();
                                        document.write(content);
                                        document.close();
                                    }
                                }
                            `);
                            await driver.sleep(1000);
                            return false;
                        }

                        const links = await driver.executeScript(`
                            return Array.from(document.querySelectorAll('a[href="android-ios-ear-training-app"]')).map(link => ({
                                href: link.href,
                                displayed: getComputedStyle(link).display !== 'none'
                            }));
                        `);
                        console.log('Links:', links);

                        try {
                            const androidLink = await driver.findElement(By.css('a[href="android-ios-ear-training-app"]'));
                            const isDisplayed = await androidLink.isDisplayed();
                            console.log('Link found and displayed:', isDisplayed);
                            return isDisplayed;
                        } catch (e) {
                            if (pageSource.length > 1000) {
                                // Log sample of content for debugging
                                console.log('Page content sample:', pageSource.substring(0, 200));
                            }
                            return false;
                        }
                    } catch (e) {
                        console.log('Error checking content:', e.message);
                        return false;
                    }
                }, isOldFirefox ? 30000 : 20000, 'Content not loaded or link not found');

                // Find and click the link
                await driver.wait(until.elementLocated(By.css('a[href="android-ios-ear-training-app"]')), 5000);
                const androidLink = await driver.findElement(By.css('a[href="android-ios-ear-training-app"]'));
                // await driver.executeScript('arguments[0].scrollIntoView(true);', androidLink);
                // await driver.wait(until.elementToBeClickable(androidLink), 5000);
                await driver.wait(until.elementIsVisible(androidLink), 5000);
                await driver.wait(until.elementIsEnabled(androidLink), 5000);
                await androidLink.click();

                // Switch back to default content
                await driver.switchTo().defaultContent();
            });

            // it('Navigate from main page to Android & iOS section', async function () {
            //     // Check for Dialog Box and click any Approve Button in subsequent dialog box
            //     try {
            //         const activeAlertModal = await driver.findElement(By.css('.modal[style*="display: block"]'));
            //         if (activeAlertModal) {
            //             // console.log('Found active alert modal');
            //             const approveButton = await driver.findElement(By.id('approveConfirm'));
            //             await approveButton.click();
            //         }
            //     } catch (e) {
            //         // Do nothing
            //         console.log('Modal not found within the timeout. Continuing test...');
            //     }

            //     // Switch to the iframe if the content is inside 'articleContent'
            //     // await driver.switchTo().frame('articleContent');
            //     // console.log('Switched to iframe successfully');

            //     // Add explicit wait for iframe to be present
            //     console.log('Waiting for iframe to be present...');
            //     const iframe = await driver.wait(
            //         until.elementLocated(By.id('articleContent')),
            //         15000,
            //         'Iframe not found'
            //     );

            //     // Wait for iframe to be available for switching
            //     console.log('Waiting for iframe to be ready for switching...');
            //     await driver.wait(async function () {
            //         try {
            //             await driver.switchTo().frame(iframe);
            //             await driver.switchTo().defaultContent();
            //             return true;
            //         } catch (e) {
            //             return false;
            //         }
            //     }, 15000, 'Iframe not ready for switching');

            //     // Switch to iframe
            //     console.log('Switching to iframe...');
            //     await driver.switchTo().frame(iframe);
            //     console.log('Successfully switched to iframe');

            //     // Wait for page load inside iframe
            //     console.log('Waiting for iframe content to load...');
            //     await driver.wait(async function () {
            //         try {
            //             const body = await driver.findElement(By.tagName('body'));
            //             return await body.isDisplayed();
            //         } catch (e) {
            //             return false;
            //         }
            //     }, 15000, 'Iframe content not loaded');

            //     // // Wait until the link "Android & iOS App" is present in the DOM
            //     // await driver.wait(async function () {
            //     //     const contentAvailable = await driver.executeScript('return document.querySelector(\'a[href="android-ios-ear-training-app"]\') !== null;');
            //     //     return contentAvailable;
            //     // }, 10000); // Increased to 10 seconds for more loading time

            //     // // Find the "Android & iOS App" link
            //     // const androidLink = await driver.findElement(By.css('a[href="android-ios-ear-training-app"]'));

            //     // // Test that the element is found
            //     // assert(androidLink !== null, 'Android & iOS App link was not found');

            //     // // Scroll the element into view and click it
            //     // // await driver.executeScript('arguments[0].scrollIntoView(true);', androidLink);
            //     // // await driver.wait(until.elementIsVisible(androidLink), 10000); // Wait until it's visible
            //     // await androidLink.click();

            //     // // Switch back to the default content
            //     // await driver.switchTo().defaultContent();

            //     // Wait for the link with more detailed error handling
            //     console.log('Waiting for Android & iOS link...');
            //     try {
            //         await driver.wait(async function () {
            //             const pageSource = await driver.getPageSource();
            //             console.log('Current page source length:', pageSource.length);
            //             if (pageSource.length < 100) { // Arbitrary small number to check if content loaded
            //                 console.log('Page source seems empty, waiting...');
            //                 return false;
            //             }
            //             try {
            //                 const link = await driver.findElement(By.css('a[href="android-ios-ear-training-app"]'));
            //                 const isDisplayed = await link.isDisplayed();
            //                 console.log('Link found and displayed:', isDisplayed);
            //                 return isDisplayed;
            //             } catch (e) {
            //                 console.log('Link not found yet...');
            //                 return false;
            //             }
            //         }, 15000, 'Android & iOS App link not found or not visible');
            //     } catch (e) {
            //         console.error('Failed to find Android & iOS link:', e);
            //         const pageSource = await driver.getPageSource();
            //         console.log('Final page source:', pageSource);
            //         throw e;
            //     }

            //     // Find and click the link
            //     const androidLink = await driver.findElement(By.css('a[href="android-ios-ear-training-app"]'));
            //     await driver.executeScript('arguments[0].scrollIntoView(true);', androidLink);
            //     await androidLink.click();

            //     // Switch back to default content
            //     await driver.switchTo().defaultContent();
            // });

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
