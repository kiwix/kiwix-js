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
 * Resolves a Chromium-based browser suitable for loading extensions.
 *
 * Resolution order:
 * 1. CHROMIUM_BIN — explicit override.
 * 2. Standard system locations and `which chromium`.
 * 3. CHROME_BIN and CHROME_PATH environment variables.
 * 4. Selenium Manager as the final fallback.
 *
 * @returns {string | null} Path to a compatible browser, or null if none could be resolved
 */
function resolveCompatibleChromeBinary () {
    if (process.env.CHROMIUM_BIN) {
        if (fs.existsSync(process.env.CHROMIUM_BIN)) {
            console.log(`[Chrome Runner] Using browser from CHROMIUM_BIN: ${process.env.CHROMIUM_BIN}`);
            return process.env.CHROMIUM_BIN;
        }
        console.warn(`[Chrome Runner] CHROMIUM_BIN is set to "${process.env.CHROMIUM_BIN}", but no file exists at that path.`);
    }

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
                if (resolved && fs.existsSync(resolved)) systemCandidates.push(resolved);
            } catch {
                // Ignore lookup errors.
            }
        }
    } else if (process.platform === 'darwin') {
        systemCandidates.push(
            '/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
            '/Applications/Chromium.app/Contents/MacOS/Chromium'
        );
        try {
            const resolved = cp.execSync('which chromium', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
            if (resolved && fs.existsSync(resolved)) systemCandidates.push(resolved);
        } catch {
            // Ignore lookup errors.
        }
    } else if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || '';
        const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
        const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
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

    for (const envVar of ['CHROME_BIN', 'CHROME_PATH']) {
        if (process.env[envVar]) {
            if (fs.existsSync(process.env[envVar])) {
                console.log(`[Chrome Runner] Using browser from ${envVar}: ${process.env[envVar]}`);
                return process.env[envVar];
            }
            console.warn(`[Chrome Runner] ${envVar} is set to "${process.env[envVar]}", but no file exists at that path.`);
        }
    }

    const platformDir = process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : 'linux';
    const smBinaryName = process.platform === 'win32' ? 'selenium-manager.exe' : 'selenium-manager';
    const smPath = path.resolve('node_modules', 'selenium-webdriver', 'bin', platformDir, smBinaryName);
    if (fs.existsSync(smPath)) {
        try {
            fs.chmodSync(smPath, 0o755);
        } catch {
            // Ignore chmod errors.
        }
        try {
            console.log('[Chrome Runner] Invoking Selenium Manager as the final browser fallback...');
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

    console.warn('[Chrome Runner] No compatible Chromium-based browser could be resolved.');
    return null;
}

async function loadChromiumExtensionDriver () {
    const options = new Options();
    const compatibleBinary = resolveCompatibleChromeBinary();
    if (!compatibleBinary) {
        throw new Error(
            'Cannot run Chrome extension E2E tests: no compatible Chrome for Testing or Chromium binary could be resolved. ' +
            'Consumer-branded Google Chrome builds ignore --load-extension. ' +
            'Please install Chromium or Chrome for Testing, or set CHROMIUM_BIN to a compatible browser binary.'
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

stageChromeExtension();
const driver = await loadChromiumExtensionDriver();
const extensionUrl = `chrome-extension://${FIXED_EXTENSION_ID}/www/index.html`;

await extensionLibrarySpec.runChromeTests(driver, extensionUrl);
