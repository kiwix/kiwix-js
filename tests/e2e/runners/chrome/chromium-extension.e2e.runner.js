/**
 * chromium-extension.e2e.runner.js : E2E runner for Chrome extension tests.
 *
 * Stages the Chromium MV3 extension with a deterministic test public key,
 * loads it in Chrome for Testing or Chromium, and executes the extension Library tests.
 *
 * Part of Kiwix JS issue #1528.
 */

/* global process */

import { Builder } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome.js';
import path from 'path';
import fs from 'fs';
import cp from 'child_process';
import extensionLibrarySpec from '../../spec/extension-library.e2e.spec.js';

// Deterministic test public key and corresponding extension ID computed from key hash
const TEST_PUBLIC_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnbzB9g5L+ifBKrn8lmogBsMu4VtFq+0SHx6EGyjK0nF1k+AX2673xUnTucdQqFhDRpyHLjgrpnW1tnyqus04+xrFv906vWKrd3IsjtP6mOGb6Mx35jJC1280zhiuw4ihH3FAVEb1QENFQOVK+3pZx94pbfYeKRIPhcMoAQAbF5ZE4AilT8/zJrPGlvqPNBBRbAmEG89DzcfodXWpxBgQqxFWp5lQXamCxAmSGfzPdzwZVCpwTOdjD6YtTNkDYNZs/+Qe8g2kM//kQ+I0h51/vSqR+Bs0UxEsS5VUTQNeeAKM7R6rt1f2Cd6/TYXGBoOKI+cE9fpsAx8lodwc0WGamQIDAQAB';
const FIXED_EXTENSION_ID = 'blgcknakefpjfnlnompaabdnfhdbeejg';

const distDir = path.resolve('./dist');
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'manifest.json'))) {
    throw new Error('Build directory dist/ not found. Run "npm run build" before running extension tests.');
}

// Stage the Chrome MV3 extension with the fixed test key in tmp/
const stagingDir = path.resolve('./tmp/chrome-extension-mv3');
if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(path.resolve('./tmp'), { recursive: true });
fs.cpSync(distDir, stagingDir, { recursive: true });

const manifestPath = path.join(stagingDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.key = TEST_PUBLIC_KEY;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

/**
 * Searches a directory recursively for files matching a test predicate.
 * @param {string} dir Directory path
 * @param {RegExp} pattern Regex to match against file basenames
 * @returns {string[]} Array of matching full paths
 */
function findFilesRecursively (dir, pattern) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                results = results.concat(findFilesRecursively(fullPath, pattern));
            } else if (pattern.test(entry.name)) {
                results.push(fullPath);
            }
        }
    } catch {
        // Ignore permission or read errors
    }
    return results;
}

/**
 * Resolves a compatible Chrome for Testing or Chromium binary that permits `--load-extension`.
 * Starting in Chrome 137+, consumer-branded Google Chrome builds ignore `--load-extension`.
 * @returns {string | null} Path to compatible browser binary, or null to rely on default resolution
 */
function resolveCompatibleChromeBinary () {
    // 1. Explicit environment variables (local or CI override)
    for (const envVar of ['CHROME_BIN', 'CHROME_PATH', 'CHROMIUM_BIN', 'PUPPETEER_EXECUTABLE_PATH']) {
        if (process.env[envVar] && fs.existsSync(process.env[envVar])) {
            return process.env[envVar];
        }
    }

    // 2. Look for cached Chrome for Testing binaries in ~/.cache/selenium/chrome/
    const home = process.env.HOME || process.env.USERPROFILE || '';
    const seleniumChromeCache = path.join(home, '.cache', 'selenium', 'chrome');
    const cachedBinaries = findFilesRecursively(seleniumChromeCache, /Google Chrome for Testing$|^chrome$/i);
    if (cachedBinaries.length > 0) {
        return cachedBinaries[0];
    }

    // 3. Fallback: ask selenium-manager to provision Chrome for Testing if available
    const platformDir = process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : 'linux';
    const smBinaryName = process.platform === 'win32' ? 'selenium-manager.exe' : 'selenium-manager';
    const smPath = path.resolve('node_modules', 'selenium-webdriver', 'bin', platformDir, smBinaryName);
    if (fs.existsSync(smPath)) {
        try {
            const smOutput = cp.execSync(
                `"${smPath}" --browser chrome --browser-version stable --force-browser-download --output json`,
                { encoding: 'utf8', timeout: 60000 }
            );
            const smJson = JSON.parse(smOutput);
            if (smJson?.result?.browser_path && fs.existsSync(smJson.result.browser_path)) {
                return smJson.result.browser_path;
            }
        } catch {
            // Ignore error and fall back to default
        }
    }

    return null;
}

async function loadChromiumExtensionDriver () {
    const options = new Options();
    const compatibleBinary = resolveCompatibleChromeBinary();
    if (compatibleBinary) {
        options.setBinaryPath(compatibleBinary);
    } else {
        options.setBrowserVersion('stable');
    }

    if (process.env.GITHUB_ACTIONS || process.env.CI || process.env.HEADLESS !== 'false') {
        options.addArguments('--headless=new');
    }
    options.addArguments(`--load-extension=${stagingDir}`);
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    // Verify the extension is genuinely loaded in the browser (Requirement 4)
    try {
        const targets = await driver.sendAndGetDevToolsCommand('Target.getTargets');
        const extensionLoaded = targets.targetInfos?.some(t =>
            t.url && t.url.includes(`chrome-extension://${FIXED_EXTENSION_ID}`)
        );
        if (!extensionLoaded) {
            await driver.quit();
            throw new Error(
                `Chrome extension (${FIXED_EXTENSION_ID}) failed to load. ` +
                `The browser dropped or ignored the extension. ` +
                `Ensure Chrome for Testing or Chromium is used instead of consumer-branded Chrome.`
            );
        }
    } catch (e) {
        if (e.message.includes(`Chrome extension (${FIXED_EXTENSION_ID}) failed to load`)) {
            throw e;
        }
        // If CDP command is unsupported in some environments, continue to page assertions
    }

    return driver;
}

const driver = await loadChromiumExtensionDriver();
const extensionUrl = `chrome-extension://${FIXED_EXTENSION_ID}/www/index.html`;

await extensionLibrarySpec.runChromeTests(driver, extensionUrl);
