/**
 * firefox-extension.e2e.runner.js : E2E runner for Firefox extension tests.
 *
 * Stages the Firefox MV2 extension, configures GeckoDriver with a fixed UUID,
 * installs the extension temporarily, and executes the extension Library tests.
 *
 * Part of Kiwix JS issue #1528.
 */

/* global process */

import { Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import path from 'path';
import fs from 'fs';
import extensionLibrarySpec from '../../spec/extension-library.e2e.spec.js';
import paths from '../../paths.js';

const FIXED_UUID = 'd3b07384-d113-4674-bc42-1234567890ab';
const EXTENSION_ID = 'kiwix-html5-unlisted@kiwix.org';

const distDir = path.resolve('./dist');
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'manifest.v2.json'))) {
    throw new Error('Build directory dist/ not found. Run "npm run build" before running extension tests.');
}

// Stage the Firefox MV2 extension in tmp/ so manifest.json points to the MV2 manifest
const stagingDir = path.resolve('./tmp/firefox-extension-mv2');
if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(path.resolve('./tmp'), { recursive: true });
fs.cpSync(distDir, stagingDir, { recursive: true });
fs.copyFileSync(path.join(distDir, 'manifest.v2.json'), path.join(stagingDir, 'manifest.json'));

/**
 * Opens a moz-extension:// page in Firefox using privileged chrome context.
 * In modern Firefox and GeckoDriver (0.36+), direct content navigation to
 * moz-extension:// URLs is blocked with UnsupportedOperationError.
 * @param {WebDriver} driver
 * @param {string} url
 */
async function openMozExtensionPage (driver, url) {
    const initialHandles = await driver.getAllWindowHandles();
    await driver.setContext(firefox.Context.CHROME);
    await driver.executeScript(`
        const secMan = (typeof Services !== 'undefined' && Services.scriptSecurityManager)
            ? Services.scriptSecurityManager
            : Components.classes['@mozilla.org/scriptsecuritymanager;1'].getService(Components.interfaces.nsIScriptSecurityManager);
        const principal = secMan.getSystemPrincipal();
        gBrowser.selectedTab = gBrowser.addTab(arguments[0], {
            triggeringPrincipal: principal,
        });
    `, url);
    await driver.setContext(firefox.Context.CONTENT);

    const newHandles = await driver.getAllWindowHandles();
    const newTab = newHandles.find(h => !initialHandles.includes(h)) || newHandles[newHandles.length - 1];
    await driver.switchTo().window(newTab);

    // Close any initial blank tab(s) to leave only the extension tab open
    for (const h of initialHandles) {
        try {
            await driver.switchTo().window(h);
            const currentUrl = await driver.getCurrentUrl();
            if (currentUrl === 'about:blank') {
                await driver.close();
            }
        } catch {
            // Ignore close errors
        }
    }
    await driver.switchTo().window(newTab);

    // Wait until the extension page is loaded
    await driver.wait(async () => {
        const u = await driver.getCurrentUrl().catch(() => '');
        return u.includes(url.split('?')[0]);
    }, 15000, 'Timed out waiting for Firefox extension page to load');
}

async function loadFirefoxExtensionDriver () {
    const options = new firefox.Options();
    if (process.env.GITHUB_ACTIONS || process.env.CI || process.env.HEADLESS !== 'false') {
        options.addArguments('--headless');
    }
    options.setPreference('extensions.webextensions.uuids', JSON.stringify({
        [EXTENSION_ID]: FIXED_UUID
    }));
    options.setPreference('browser.download.folderList', 2);
    options.setPreference('browser.download.dir', paths.downloadDir);
    options.setPreference('browser.download.manager.showWhenStarting', false);
    options.setPreference('browser.helperApps.neverAsk.saveToDisk', 'octet-stream');

    const service = new firefox.ServiceBuilder().addArguments('--allow-system-access');

    const driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .setFirefoxService(service)
        .build();

    // Intercept driver.get to handle moz-extension:// URLs via privileged chrome context
    const originalGet = driver.get.bind(driver);
    driver.get = async function (url) {
        if (url && url.startsWith('moz-extension://')) {
            const currentUrl = await driver.getCurrentUrl().catch(() => '');
            if (currentUrl && currentUrl.startsWith('moz-extension://')) {
                await driver.executeScript('window.location.href = arguments[0];', url);
                await driver.wait(async () => {
                    const u = await driver.getCurrentUrl().catch(() => '');
                    return u.includes(url.split('?')[0]);
                }, 15000);
                return;
            }
            return await openMozExtensionPage(driver, url);
        }
        return await originalGet(url);
    };

    return driver;
}

const driver = await loadFirefoxExtensionDriver();

// Install the staged extension temporarily in GeckoDriver
await driver.installAddon(stagingDir, true);

const extensionUrl = `moz-extension://${FIXED_UUID}/www/index.html?contentInjectionMode=jquery&defaultModeChangeAlertDisplayed=true`;

await extensionLibrarySpec.runFirefoxTests(driver, extensionUrl);
