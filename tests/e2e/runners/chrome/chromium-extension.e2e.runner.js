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
const stagingDir = path.resolve('./tmp/chrome-extension-mv3');

/**
 * Stages the Chrome MV3 extension with the fixed test public key in tmp/
 */
function stageChromeExtension () {
    const distDir = path.resolve('./dist');
    if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'manifest.json'))) {
        throw new Error('Build directory dist/ not found. Run "npm run build" before running extension tests.');
    }

    if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
    }
    fs.mkdirSync(path.resolve('./tmp'), { recursive: true });
    fs.cpSync(distDir, stagingDir, { recursive: true });

    const manifestPath = path.join(stagingDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.key = TEST_PUBLIC_KEY;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

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
 * Checks whether a browser binary is incompatible consumer-branded Google Chrome.
 * Consumer Google Chrome (v130+) ignores or drops `--load-extension` in headless mode,
 * whereas Chromium and Google Chrome for Testing permit automated extension loading.
 *
 * @param {string} binaryPath Path to browser executable
 * @returns {boolean} True if the binary is consumer-branded Google Chrome, false otherwise
 */
function isConsumerGoogleChrome (binaryPath, execFileSync = cp.execFileSync) {
    if (!binaryPath || typeof binaryPath !== 'string') return false;

    // 1. Fast path checks: if path contains indicators of compatible builds
    const normalized = binaryPath.toLowerCase();
    if (normalized.includes('for-testing') || normalized.includes('for_testing') ||
        normalized.includes('for testing') || normalized.includes('chromium')) {
        return false;
    }

    // 2. Query binary version output if executable
    try {
        const versionOutput = execFileSync(binaryPath, ['--version'], {
            encoding: 'utf8',
            timeout: 5000,
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();

        if (/for testing/i.test(versionOutput) || /chromium/i.test(versionOutput)) {
            return false;
        }
        if (/google chrome/i.test(versionOutput)) {
            return true;
        }
    } catch {
        // Fall back to path/basename heuristics if --version cannot be executed
    }

    // 3. Path and basename heuristics
    const base = path.basename(binaryPath).toLowerCase();
    if (base === 'google-chrome' || base === 'google-chrome-stable' ||
        base === 'google-chrome-beta' || base === 'google-chrome-unstable' || base === 'google-chrome-dev') {
        return true;
    }
    if ((normalized.includes('/google chrome/') || normalized.includes('\\google\\chrome\\')) &&
        !normalized.includes('for testing')) {
        return true;
    }

    return false;
}

/**
 * Resolves a compatible Chrome for Testing or Chromium binary that permits `--load-extension`.
 * Starting in Chrome 137+, consumer-branded Google Chrome builds ignore `--load-extension`.
 *
 * @param {object} [options] Optional configuration options for testing or custom environments
 * @param {NodeJS.ProcessEnv} [options.env=process.env] Environment variables map
 * @param {string} [options.platform=process.platform] Platform string ('linux', 'darwin', 'win32')
 * @param {function} [options.existsSync=fs.existsSync] File existence check function
 * @param {function} [options.isConsumerCheck=isConsumerGoogleChrome] Function to check if a binary is consumer Chrome
 * @param {function} [options.execSync=cp.execSync] Synchronous command execution function
 * @param {boolean} [options.skipSeleniumManager=false] Whether to skip Selenium Manager provisioning
 * @returns {string | null} Path to compatible browser binary, or null if none could be resolved
 */
function resolveCompatibleChromeBinary (options = {}) {
    const env = options.env || process.env;
    const platform = options.platform || process.platform;
    const exists = options.existsSync || fs.existsSync;
    const isConsumer = options.isConsumerCheck || isConsumerGoogleChrome;
    const execSync = options.execSync || cp.execSync;
    const home = env.HOME || env.USERPROFILE || '';

    // 1. Explicit environment variables (local or CI override)
    for (const envVar of ['CHROMIUM_BIN', 'CHROME_BIN', 'CHROME_PATH', 'PUPPETEER_EXECUTABLE_PATH']) {
        const candidate = env[envVar];
        if (candidate) {
            if (exists(candidate)) {
                if (isConsumer(candidate) && env.ALLOW_CONSUMER_CHROME !== 'true') {
                    console.log(`[Chrome Runner] Skipping ${envVar} ("${candidate}"): consumer-branded Google Chrome drops --load-extension. Searching for Chromium or Chrome for Testing...`);
                    continue;
                }
                console.log(`[Chrome Runner] Using browser from ${envVar}: ${candidate}`);
                return candidate;
            } else {
                console.warn(`[Chrome Runner] Environment variable ${envVar} is set to "${candidate}", but no file exists at that path.`);
            }
        }
    }

    // 2. Standard system locations for Chromium or Chrome for Testing
    const systemCandidates = [];
    if (platform === 'linux') {
        systemCandidates.push(
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/snap/bin/chromium',
            '/usr/local/bin/chromium',
            '/usr/bin/google-chrome-for-testing'
        );
        for (const cmd of ['which chromium', 'which chromium-browser']) {
            try {
                const resolved = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
                if (resolved && exists(resolved)) {
                    systemCandidates.push(resolved);
                }
            } catch {
                // Ignore lookup errors
            }
        }
    } else if (platform === 'darwin') {
        systemCandidates.push(
            '/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            path.join(home, 'Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
            path.join(home, 'Applications/Chromium.app/Contents/MacOS/Chromium')
        );
    } else if (platform === 'win32') {
        const localAppData = env.LOCALAPPDATA || '';
        const programFiles = env.PROGRAMFILES || '';
        const programFilesX86 = env['PROGRAMFILES(X86)'] || '';
        systemCandidates.push(
            path.join(localAppData, 'Chromium', 'Application', 'chrome.exe'),
            path.join(programFiles, 'Chromium', 'Application', 'chrome.exe'),
            path.join(programFilesX86, 'Chromium', 'Application', 'chrome.exe')
        );
    }

    for (const candidate of systemCandidates) {
        if (candidate && exists(candidate) && !isConsumer(candidate)) {
            console.log(`[Chrome Runner] Found system browser binary: ${candidate}`);
            return candidate;
        }
    }

    // 3. Look for cached Chrome for Testing binaries in ~/.cache/selenium/chrome/
    const seleniumChromeCache = path.join(home, '.cache', 'selenium', 'chrome');
    const cachedBinaries = findFilesRecursively(seleniumChromeCache, /Google Chrome for Testing$|^chrome$/i);
    for (const cached of cachedBinaries) {
        if (exists(cached) && !isConsumer(cached)) {
            console.log(`[Chrome Runner] Found cached Chrome for Testing: ${cached}`);
            return cached;
        }
    }

    // 4. Fallback: ask selenium-manager to provision Chrome for Testing if available
    if (!options.skipSeleniumManager) {
        const platformDir = platform === 'darwin' ? 'macos' : platform === 'win32' ? 'windows' : 'linux';
        const smBinaryName = platform === 'win32' ? 'selenium-manager.exe' : 'selenium-manager';
        const smPath = path.resolve('node_modules', 'selenium-webdriver', 'bin', platformDir, smBinaryName);
        if (exists(smPath)) {
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
                if (smJson?.result?.browser_path && exists(smJson.result.browser_path)) {
                    console.log(`[Chrome Runner] Selenium Manager provisioned Chrome: ${smJson.result.browser_path}`);
                    return smJson.result.browser_path;
                }
            } catch (err) {
                console.warn(`[Chrome Runner] Selenium Manager provisioning failed: ${err.message}`);
            }
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

const isMainRunner = process.argv.some(arg => typeof arg === 'string' && arg.includes('chromium-extension.e2e.runner'));
if (isMainRunner) {
    stageChromeExtension();
    const driver = await loadChromiumExtensionDriver();
    const extensionUrl = `chrome-extension://${FIXED_EXTENSION_ID}/www/index.html`;

    await extensionLibrarySpec.runChromeTests(driver, extensionUrl);
}

export {
    stageChromeExtension,
    isConsumerGoogleChrome,
    resolveCompatibleChromeBinary,
    loadChromiumExtensionDriver
};
