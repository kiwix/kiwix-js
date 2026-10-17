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
 * @returns {string | null} Path to compatible browser binary, or null if none could be resolved
 */
function resolveCompatibleChromeBinary () {
    const home = process.env.HOME || process.env.USERPROFILE || '';

    // 1. Explicit environment variables (local or CI override)
    for (const envVar of ['CHROME_BIN', 'CHROME_PATH', 'CHROMIUM_BIN', 'PUPPETEER_EXECUTABLE_PATH']) {
        if (process.env[envVar]) {
            if (fs.existsSync(process.env[envVar])) {
                console.log(`[Chrome Runner] Using browser from ${envVar}: ${process.env[envVar]}`);
                return process.env[envVar];
            } else {
                console.warn(`[Chrome Runner] Environment variable ${envVar} is set to "${process.env[envVar]}", but no file exists at that path.`);
            }
        }
    }

    // 2. Standard system locations for Chromium or Chrome for Testing
    const systemCandidates = [];
    if (process.platform === 'linux') {
        systemCandidates.push(
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/snap/bin/chromium',
            '/usr/local/bin/chromium',
            '/usr/bin/google-chrome-for-testing'
        );
        for (const cmd of ['which chromium', 'which chromium-browser']) {
            try {
                const resolved = cp.execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
                if (resolved && fs.existsSync(resolved)) {
                    systemCandidates.push(resolved);
                }
            } catch {
                // Ignore lookup errors
            }
        }
    } else if (process.platform === 'darwin') {
        systemCandidates.push(
            '/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            path.join(home, 'Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
            path.join(home, 'Applications/Chromium.app/Contents/MacOS/Chromium')
        );
    } else if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || '';
        const programFiles = process.env.PROGRAMFILES || '';
        const programFilesX86 = process.env['PROGRAMFILES(X86)'] || '';
        systemCandidates.push(
            path.join(localAppData, 'Chromium', 'Application', 'chrome.exe'),
            path.join(programFiles, 'Chromium', 'Application', 'chrome.exe'),
            path.join(programFilesX86, 'Chromium', 'Application', 'chrome.exe')
        );
    }

    for (const candidate of systemCandidates) {
        if (candidate && fs.existsSync(candidate)) {
            console.log(`[Chrome Runner] Found system browser binary: ${candidate}`);
            return candidate;
        }
    }

    // 3. Look for cached Chrome for Testing binaries in ~/.cache/selenium/chrome/
    const seleniumChromeCache = path.join(home, '.cache', 'selenium', 'chrome');
    const cachedBinaries = findFilesRecursively(seleniumChromeCache, /Google Chrome for Testing$|^chrome$/i);
    if (cachedBinaries.length > 0) {
        console.log(`[Chrome Runner] Found cached Chrome for Testing: ${cachedBinaries[0]}`);
        return cachedBinaries[0];
    }

    // 4. Fallback: ask selenium-manager to provision Chrome for Testing if available
    const platformDir = process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : 'linux';
    const smBinaryName = process.platform === 'win32' ? 'selenium-manager.exe' : 'selenium-manager';
    const smPath = path.resolve('node_modules', 'selenium-webdriver', 'bin', platformDir, smBinaryName);
    if (fs.existsSync(smPath)) {
        try {
            fs.chmodSync(smPath, 0o755);
        } catch {
            // Ignore chmod errors
        }
        try {
            console.log('[Chrome Runner] Invoking Selenium Manager to provision Chrome for Testing...');
            const smOutput = cp.execSync(
                `"${smPath}" --browser chrome --skip-browser-in-path --force-browser-download --output json`,
                { encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] }
            );
            const smJson = JSON.parse(smOutput);
            if (smJson?.result?.browser_path && fs.existsSync(smJson.result.browser_path)) {
                console.log(`[Chrome Runner] Selenium Manager provisioned Chrome: ${smJson.result.browser_path}`);
                return smJson.result.browser_path;
            }
        } catch (err) {
            console.warn(`[Chrome Runner] Selenium Manager provisioning failed: ${err.message}`);
        }
    }

    console.warn('[Chrome Runner] No compatible Chrome for Testing or Chromium binary could be resolved on the system.');
    return null;
}

async function loadChromiumExtensionDriver () {
    const options = new Options();
    const compatibleBinary = resolveCompatibleChromeBinary();
    if (!compatibleBinary) {
        throw new Error(
            'Cannot run Chrome extension E2E tests: no compatible Chrome for Testing or Chromium binary could be resolved. ' +
            'Consumer-branded Google Chrome builds ignore --load-extension. ' +
            'Please install Chromium or Chrome for Testing, or set CHROME_BIN to a compatible browser binary.'
        );
    }
    options.setBinaryPath(compatibleBinary);

    if (process.env.GITHUB_ACTIONS || process.env.CI || process.env.HEADLESS !== 'false') {
        options.addArguments('--headless=new');
    }
    options.addArguments(`--disable-extensions-except=${stagingDir}`);
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
        let extensionLoaded = false;
        const startTime = Date.now();
        // Poll for up to 10 seconds to allow the background service worker to initialize
        while (Date.now() - startTime < 10000) {
            const targets = await driver.sendAndGetDevToolsCommand('Target.getTargets');
            if (targets.targetInfos?.some(t =>
                t.url && t.url.includes(`chrome-extension://${FIXED_EXTENSION_ID}`)
            )) {
                extensionLoaded = true;
                break;
            }
            await new Promise(r => setTimeout(r, 250));
        }

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
