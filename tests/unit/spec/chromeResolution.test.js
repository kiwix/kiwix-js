/* eslint-disable no-undef */
/**
 * chromeResolution.test.js : Unit tests for Chrome Extension E2E browser resolution.
 *
 * Verifies that resolveCompatibleChromeBinary() and isConsumerGoogleChrome()
 * correctly distinguish compatible browsers (Chromium, Chrome for Testing) from
 * incompatible consumer-branded Google Chrome builds that ignore --load-extension.
 *
 * Part of Kiwix JS issue #1528.
 */

import { assert } from 'chai';
import { resolveCompatibleChromeBinary, isConsumerGoogleChrome } from '../../e2e/runners/chrome/chromium-extension.e2e.runner.js';

describe('Chrome Extension Runner - Browser Resolution (#1528)', function () {
    describe('isConsumerGoogleChrome()', function () {
        it('identifies Chrome for Testing version output as compatible', function () {
            const mockExec = () => 'Google Chrome for Testing 131.0.6778.85';
            assert.isFalse(isConsumerGoogleChrome('/opt/custom/chrome', mockExec));
        });

        it('identifies Chromium version output as compatible', function () {
            const mockExec = () => 'Chromium 130.0.6723.69 Built on Ubuntu';
            assert.isFalse(isConsumerGoogleChrome('/opt/custom/chrome', mockExec));
        });

        it('identifies consumer Google Chrome version output as incompatible', function () {
            const mockExec = () => 'Google Chrome 131.0.6778.85';
            assert.isTrue(isConsumerGoogleChrome('/opt/custom/chrome', mockExec));
        });

        it('identifies paths containing "for-testing" or "chromium" as compatible', function () {
            assert.isFalse(isConsumerGoogleChrome('/opt/chrome-for-testing/chrome', () => { throw new Error('not executable'); }));
            assert.isFalse(isConsumerGoogleChrome('/usr/bin/chromium', () => { throw new Error('not executable'); }));
        });

        it('identifies consumer Google Chrome binary names by fallback heuristic when not executable', function () {
            const throwExec = () => { throw new Error('exec failed'); };
            assert.isTrue(isConsumerGoogleChrome('/usr/bin/google-chrome', throwExec));
            assert.isTrue(isConsumerGoogleChrome('/usr/bin/google-chrome-stable', throwExec));
            assert.isTrue(isConsumerGoogleChrome('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', throwExec));
        });
    });

    describe('resolveCompatibleChromeBinary()', function () {
        it('skips incompatible consumer Chrome in CHROME_BIN and falls back to system Chromium', function () {
            const fakeFiles = new Set(['/usr/bin/google-chrome', '/usr/bin/chromium']);
            const resolved = resolveCompatibleChromeBinary({
                env: {
                    CHROME_BIN: '/usr/bin/google-chrome',
                    HOME: '/mock/home'
                },
                platform: 'linux',
                existsSync: (p) => fakeFiles.has(p),
                isConsumerCheck: (p) => p.includes('google-chrome'),
                execSync: () => '',
                skipSeleniumManager: true
            });

            assert.strictEqual(resolved, '/usr/bin/chromium');
        });

        it('uses an explicitly configured compatible browser from CHROME_BIN', function () {
            const fakeFiles = new Set(['/custom/path/to/chromium']);
            const resolved = resolveCompatibleChromeBinary({
                env: {
                    CHROME_BIN: '/custom/path/to/chromium',
                    HOME: '/mock/home'
                },
                platform: 'linux',
                existsSync: (p) => fakeFiles.has(p),
                isConsumerCheck: () => false,
                execSync: () => '',
                skipSeleniumManager: true
            });

            assert.strictEqual(resolved, '/custom/path/to/chromium');
        });

        it('uses an explicitly configured compatible browser from CHROMIUM_BIN', function () {
            const fakeFiles = new Set(['/snap/bin/chromium', '/usr/bin/google-chrome']);
            const resolved = resolveCompatibleChromeBinary({
                env: {
                    CHROMIUM_BIN: '/snap/bin/chromium',
                    CHROME_BIN: '/usr/bin/google-chrome',
                    HOME: '/mock/home'
                },
                platform: 'linux',
                existsSync: (p) => fakeFiles.has(p),
                isConsumerCheck: (p) => p.includes('google-chrome'),
                execSync: () => '',
                skipSeleniumManager: true
            });

            assert.strictEqual(resolved, '/snap/bin/chromium');
        });

        it('returns null when no compatible browser is available and only consumer Chrome is present', function () {
            const fakeFiles = new Set(['/usr/bin/google-chrome']);
            const resolved = resolveCompatibleChromeBinary({
                env: {
                    CHROME_BIN: '/usr/bin/google-chrome',
                    HOME: '/mock/home'
                },
                platform: 'linux',
                existsSync: (p) => fakeFiles.has(p),
                isConsumerCheck: (p) => p.includes('google-chrome'),
                execSync: () => { throw new Error('command not found'); },
                skipSeleniumManager: true
            });

            assert.isNull(resolved);
        });
    });
});
