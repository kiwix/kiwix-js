/* eslint-disable no-undef */
/**
 * Tests for the querystring parameter overrides in www/js/init.js
 *
 * The overrideParams() block decides, for every `?key=value` pair in the querystring, whether it may
 * be applied to params and whether it may be written to the Settings Store. Four behaviours matter:
 *
 *   1. sourceVerification is refused from the querystring on every origin, development ones included,
 *      because a stored "off" persists and the app is self-hostable on localhost via Docker.
 *   2. The remaining parameters that weaken app protections (noPrompts and the URL-shaped ones) are
 *      honoured only when the app is served from a development or test location. This is the part that
 *      no other test reaches: the e2e suite always drives the app from localhost, which IS a trusted
 *      context, so it would stay green even if the check were removed altogether.
 *   3. The parameters the app passes between its own contexts (the local code <-> PWA handoff) must
 *      keep working from any origin, including the production PWA.
 *   4. Anything else may be applied for the current page load but must never be stored.
 *
 * init.js is a plain script rather than a module (it is loaded with a <script> tag before app.js), so
 * it cannot be imported. Instead each case evaluates the real file inside a fresh JSDOM window built
 * at the URL under test, and inspects the resulting params and storage. Nothing is copied from the
 * source file, so these tests follow it as it changes.
 */

import { JSDOM } from 'jsdom';
import { assert } from 'chai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const INIT_JS = readFileSync(fileURLToPath(new URL('../../../www/js/init.js', import.meta.url)), 'utf8');

// Origins that isTrustedContext() should reject: the production PWA, any other host on the network, and
// the packaged extensions (our MV2 manifest cannot restrict who may reach its web_accessible_resources,
// and Chromium extension IDs are stable and public, so an extension URL can be crafted by an attacker)
const PROD_PWA = 'https://browser-extension.kiwix.org/current/www/index.html';
const LAN_HOST = 'http://192.168.1.50:8080/www/index.html';
const FIREFOX_EXT = 'moz-extension://abc-123/www/index.html';
const CHROME_EXT = 'chrome-extension://abc-123/www/index.html';
// Origins it should accept: the dev server and the e2e suite, and the app running from the filesystem
const LOCALHOST = 'http://localhost:8080/www/index.html';
const LOOPBACK_IP = 'http://127.0.0.1:8080/www/index.html';
const FILE_PROTOCOL = 'file:///C:/kiwix-js/www/index.html';

/**
 * Builds a stand-in for a DOM element. init.js sets properties on a long list of Configuration
 * controls once it has established params, and the identity of those controls is irrelevant here, so
 * we return a permissive object: unknown properties read back as no-op functions, and assignments are
 * simply recorded. This keeps the spec working when new settings controls are added to init.js.
 * @returns {Proxy} An object tolerating any property read, write or method call
 */
function elementStub () {
    const target = {
        style: {},
        classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } }
    };
    return new Proxy(target, {
        get: function (obj, prop) {
            if (prop in obj) return obj[prop];
            return typeof prop === 'string' ? function () {} : undefined;
        },
        set: function (obj, prop, value) {
            obj[prop] = value;
            return true;
        }
    });
}

/**
 * Evaluates the real init.js in a JSDOM window created at the given URL, and reports what it did.
 * @param {String} baseUrl The URL the app is served from, which determines whether the context is trusted
 * @param {String} querystring The querystring to apply, including the leading '?'
 * @returns {Object} An object with the resulting params, the keys written to storage, and any warnings
 */
function loadInit (baseUrl, querystring) {
    // runScripts gives us window.eval, which is what runs init.js inside this window rather than in Node
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: baseUrl + querystring, runScripts: 'outside-only' });
    const win = dom.window;
    const warnings = [];
    const stored = {};
    // JSDOM refuses localStorage on the opaque origins of moz-extension: and file:, so supply our own.
    // It stringifies values exactly as the real API does, which is what init.js reads back.
    Object.defineProperty(win, 'localStorage', {
        configurable: true,
        value: {
            getItem: function (key) { return Object.prototype.hasOwnProperty.call(stored, key) ? stored[key] : null; },
            setItem: function (key, val) { stored[key] = String(val); },
            removeItem: function (key) { delete stored[key]; }
        }
    });
    // JSDOM has no navigator.serviceWorker, which would leave init.js in Restricted mode, where
    // sourceVerification is switched off regardless of the querystring. Stub it so the app defaults to
    // ServiceWorker mode, as it does in a real browser: that is the mode where the trust prompt applies,
    // and it lets us tell a refused override apart from an accepted one.
    Object.defineProperty(win.navigator, 'serviceWorker', { configurable: true, value: {} });
    win.document.getElementById = elementStub;
    win.console = {
        debug: function () {},
        log: function () {},
        error: function () {},
        warn: function (message) { warnings.push(message); }
    };
    // init.js is in strict mode, so its top-level `var params` stays inside the eval's own scope rather
    // than becoming a property of window. Append an export so we can read it back from out here.
    win.eval(INIT_JS + '\n;window.paramsUnderTest = params;');
    const result = { params: Object.assign({}, win.paramsUnderTest), stored: Object.assign({}, stored), warnings: warnings };
    win.close(); // Cancels the timers init.js sets, so they cannot outlive the test
    return result;
}

/**
 * Asserts that nothing was written to the Settings Store for the given key. Persistence is the part
 * that matters most: a stored value is read back on every subsequent visit, whereas a value that only
 * reached params is gone as soon as the app is reloaded.
 * @param {Object} result The return value of loadInit()
 * @param {String} key The parameter name that should not have been stored
 */
function assertNotStored (result, key) {
    assert.isUndefined(result.stored['kiwixjs-' + key], key + ' should not have been written to storage');
}

describe('init.js querystring overrides', function () {
    describe('parameters refused from the querystring on every origin', function () {
        it('ignores sourceVerification when served from the production PWA', function () {
            const result = loadInit(PROD_PWA, '?sourceVerification=false');
            assert.strictEqual(result.params.sourceVerification, true, 'source verification should still be on');
            assertNotStored(result, 'sourceVerification');
            assert.lengthOf(result.warnings, 1, 'a warning should explain why the parameter was ignored');
            assert.include(result.warnings[0], 'sourceVerification');
        });

        it('ignores sourceVerification on localhost, which is not necessarily a development machine', function () {
            // The app is self-hostable via the docker-compose.yml in the repository root, which publishes it
            // on port 8080, so localhost may well be an end user's own production instance. No origin test
            // can tell the two apart, which is why this parameter is refused everywhere rather than gated
            const result = loadInit(LOCALHOST, '?sourceVerification=false');
            assert.strictEqual(result.params.sourceVerification, true, 'source verification should still be on');
            assertNotStored(result, 'sourceVerification');
        });

        it('ignores sourceVerification on every other trusted origin too', function () {
            [LOOPBACK_IP, FILE_PROTOCOL, FIREFOX_EXT, CHROME_EXT, LAN_HOST].forEach(function (url) {
                const result = loadInit(url, '?sourceVerification=false');
                assert.strictEqual(result.params.sourceVerification, true, 'should be refused at: ' + url);
                assertNotStored(result, 'sourceVerification');
            });
        });
    });

    describe('parameters restricted to development and test contexts', function () {
        it('ignores noPrompts when served from the production PWA', function () {
            const result = loadInit(PROD_PWA, '?noPrompts=true');
            assert.isUndefined(result.params.noPrompts);
            assertNotStored(result, 'noPrompts');
        });

        it('ignores libraryUrl and altLibraryUrl when served from the production PWA', function () {
            const result = loadInit(PROD_PWA, '?libraryUrl=https://example.com&altLibraryUrl=https://example.com');
            assert.strictEqual(result.params.libraryUrl, 'https://browse.library.kiwix.org/', 'the default library should survive');
            assert.strictEqual(result.params.altLibraryUrl, 'https://ftp.fau.de/kiwix/zim/');
            assertNotStored(result, 'libraryUrl');
            assertNotStored(result, 'altLibraryUrl');
        });

        it('ignores PWAServer when served from the production PWA', function () {
            const result = loadInit(PROD_PWA, '?PWAServer=https://example.com');
            assert.strictEqual(result.params.PWAServer, 'https://browser-extension.kiwix.org/current/');
            assertNotStored(result, 'PWAServer');
        });

        it('honours noPrompts on localhost, so that the e2e suite keeps working', function () {
            const result = loadInit(LOCALHOST, '?noPrompts=true');
            assert.strictEqual(result.params.noPrompts, true);
            assert.strictEqual(result.stored['kiwixjs-noPrompts'], 'true');
            assert.lengthOf(result.warnings, 0);
        });

        it('honours the loopback IP and the file protocol', function () {
            [LOOPBACK_IP, FILE_PROTOCOL].forEach(function (url) {
                assert.strictEqual(loadInit(url, '?noPrompts=true').params.noPrompts, true, 'should be trusted: ' + url);
            });
        });

        it('ignores restricted parameters inside a packaged extension', function () {
            // MV2 cannot restrict which sites may reach www/index.html, and Chromium extension IDs are
            // derived from our signing key, so a link into the extension can be crafted by a third party
            [FIREFOX_EXT, CHROME_EXT].forEach(function (url) {
                const result = loadInit(url, '?sourceVerification=false&noPrompts=true');
                assert.strictEqual(result.params.sourceVerification, true, 'should not be trusted: ' + url);
                assert.isUndefined(result.params.noPrompts, 'should not be trusted: ' + url);
                assertNotStored(result, 'sourceVerification');
                assertNotStored(result, 'noPrompts');
            });
        });

        it('still completes the handoff when the app is running inside an extension', function () {
            // Only the dev-only parameters are refused there: the handoff keys must keep working, or the
            // PWA could not hand control back to the local extension code
            const result = loadInit(FIREFOX_EXT, '?allowInternetAccess=false&contentInjectionMode=jquery&defaultModeChangeAlertDisplayed=true');
            assert.strictEqual(result.stored['kiwixjs-allowInternetAccess'], 'false');
            assert.strictEqual(result.stored['kiwixjs-contentInjectionMode'], 'jquery');
            assert.strictEqual(result.stored['kiwixjs-defaultModeChangeAlertDisplayed'], 'true');
        });
    });

    describe('the handoff between local code and the PWA', function () {
        it('applies and stores the parameters sent when launching the PWA', function () {
            const result = loadInit(PROD_PWA, '?contentInjectionMode=serviceworker&allowInternetAccess=true' +
                '&referrerExtensionURL=moz-extension%3A%2F%2Fabc-123&appTheme=dark_invert&showUIAnimations=true');
            assert.strictEqual(result.stored['kiwixjs-contentInjectionMode'], 'serviceworker');
            assert.strictEqual(result.stored['kiwixjs-allowInternetAccess'], 'true');
            assert.strictEqual(result.stored['kiwixjs-referrerExtensionURL'], 'moz-extension://abc-123');
            assert.strictEqual(result.stored['kiwixjs-appTheme'], 'dark_invert');
            assert.strictEqual(result.stored['kiwixjs-showUIAnimations'], 'true');
        });

        it('applies and stores the parameters sent when reverting to local code', function () {
            const result = loadInit(PROD_PWA, '?allowInternetAccess=false&contentInjectionMode=jquery&hideActiveContentWarning=false');
            assert.strictEqual(result.stored['kiwixjs-allowInternetAccess'], 'false');
            assert.strictEqual(result.stored['kiwixjs-contentInjectionMode'], 'jquery');
            assert.strictEqual(result.stored['kiwixjs-hideActiveContentWarning'], 'false');
        });

        it('applies and stores defaultModeChangeAlertDisplayed', function () {
            const result = loadInit(PROD_PWA, '?allowInternetAccess=false&contentInjectionMode=jquery&defaultModeChangeAlertDisplayed=true');
            assert.strictEqual(result.stored['kiwixjs-defaultModeChangeAlertDisplayed'], 'true');
        });

        it('completes the handoff while still ignoring a restricted parameter added to the same link', function () {
            const result = loadInit(PROD_PWA, '?contentInjectionMode=serviceworker&allowInternetAccess=true' +
                '&referrerExtensionURL=moz-extension%3A%2F%2Fabc-123&sourceVerification=false');
            assert.strictEqual(result.stored['kiwixjs-contentInjectionMode'], 'serviceworker');
            assert.strictEqual(result.stored['kiwixjs-referrerExtensionURL'], 'moz-extension://abc-123');
            assert.strictEqual(result.params.sourceVerification, true, 'source verification should survive the handoff');
            assertNotStored(result, 'sourceVerification');
        });
    });

    describe('validation of referrerExtensionURL', function () {
        it('accepts a genuine extension URL', function () {
            assert.strictEqual(loadInit(PROD_PWA, '?referrerExtensionURL=moz-extension%3A%2F%2Fabc-123').params.referrerExtensionURL,
                'moz-extension://abc-123');
            assert.strictEqual(loadInit(PROD_PWA, '?referrerExtensionURL=chrome-extension%3A%2F%2Fabc-123').params.referrerExtensionURL,
                'chrome-extension://abc-123');
        });

        it('rejects a javascript: URL, which would otherwise reach location.href', function () {
            const result = loadInit(PROD_PWA, '?referrerExtensionURL=javascript%3Aalert(1)');
            assert.isNull(result.params.referrerExtensionURL, 'no referrer should have been recorded');
            assertNotStored(result, 'referrerExtensionURL');
            assert.lengthOf(result.warnings, 1);
        });

        it('rejects an http(s) URL, which would otherwise redirect the app off-site', function () {
            const result = loadInit(PROD_PWA, '?referrerExtensionURL=https%3A%2F%2Fexample.com');
            assert.isNull(result.params.referrerExtensionURL);
            assertNotStored(result, 'referrerExtensionURL');
        });

        it('rejects an extension URL with no host', function () {
            const result = loadInit(PROD_PWA, '?referrerExtensionURL=moz-extension%3A%2F%2F%2F..%2Fx');
            assert.isNull(result.params.referrerExtensionURL);
            assertNotStored(result, 'referrerExtensionURL');
        });
    });

    describe('parameters that are not in any list', function () {
        it('applies an unrecognised parameter to the current page load but does not store it', function () {
            const result = loadInit(PROD_PWA, '?someExperimentalSetting=42');
            assert.strictEqual(result.params.someExperimentalSetting, '42');
            assert.isUndefined(result.stored['kiwixjs-someExperimentalSetting']);
        });

        it('applies a known but non-persistable setting for the current page load only', function () {
            const result = loadInit(PROD_PWA, '?disableDragAndDrop=true');
            assert.strictEqual(result.params.disableDragAndDrop, true);
            assert.isUndefined(result.stored['kiwixjs-disableDragAndDrop']);
        });

        it('does not store anything for a parameter inherited from Object.prototype', function () {
            // Reading validatedParams['toString'] without a hasOwnProperty guard would throw and halt the app
            const result = loadInit(PROD_PWA, '?toString=x');
            assert.strictEqual(result.params.toString, 'x');
            assert.isUndefined(result.stored['kiwixjs-toString']);
        });

        it('ignores keys that could alter the prototype chain', function () {
            assert.isUndefined(loadInit(PROD_PWA, '?__proto__=x').stored['kiwixjs-__proto__']);
            assert.isUndefined(loadInit(PROD_PWA, '?constructor=x').stored['kiwixjs-constructor']);
        });

        it('leaves the title parameter to the router', function () {
            const result = loadInit(PROD_PWA, '?title=A%2FSome_article');
            assert.isUndefined(result.params.title);
            assert.isUndefined(result.stored['kiwixjs-title']);
        });
    });
});
