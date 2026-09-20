/* eslint-disable no-undef */
/**
 * i18n-typography-paths.test.js : Regression guard for translation encoding paths (issue #1474)
 *
 * Kiwix JS translates UI strings through two different DOM paths:
 * 1. HTML paths (e.g. [data-i18n] via innerHTML, uiUtil.systemAlert modalText.innerHTML, decompAPIStatusDiv.innerHTML):
 *    HTML entities like &nbsp; are decoded by the browser into non-breaking spaces.
 * 2. Plain-text paths (e.g. [data-i18n-tip] via element.title, textContent, innerText):
 *    HTML entities are NOT decoded and appear as literal "&nbsp;" in the UI.
 *    Plain-text paths must use literal U+00A0 non-breaking spaces instead.
 *
 * This suite verifies:
 * - No "-tip" keys contain "&nbsp;" (preventing entity leakage into element.title)
 * - Known plain-text keys do not contain "&nbsp;"
 * - French plain-text keys use literal U+00A0 non-breaking spaces before high punctuation
 * - French HTML-path keys use "&nbsp;" before high punctuation
 * - Deprecated/orphan translation keys (e.g. dialog-server-access-check-failed) remain absent
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect } from 'chai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadTranslationStrings (langCode) {
    const filePath = path.resolve(__dirname, `../../../i18n/${langCode}.jsonp.js`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonStr = fileContent.replace(/^\s*document\.localeJson\s*=\s*/, '').replace(/;\s*$/, '');
    return JSON.parse(jsonStr)[langCode].translation;
}

const plainTextKeys = [
    'configure-expert-enable-source-verification-tip',
    'api-messagechannel-available',
    'api-messagechannel-unavailable',
    'api-serviceworker-available-registered',
    'api-serviceworker-available-unregistered',
    'api-serviceworker-unavailable',
    'api-storage-used-label',
    'api-searchprovider-label',
    'spinner-caching',
    'dialog-metadata-name',
    'dialog-metadata-creator',
    'dialog-metadata-publisher',
    'dialog-metadata-scraper'
];

const htmlPathKeysWithPunctuation = [
    'configure-expert-enablecontenttheme',
    'about-app-para1',
    'about-step4',
    'api-decompressor-label',
    'api-pwa-origin-label',
    'dialog-invalid-zim-message',
    'dialog-launchlocal-message',
    'dialog-launchpwa-fail-message',
    'dialog-open-externalurl-message',
    'dialog-other-language-message'
];

describe('i18n typography and DOM path encoding guard (issue #1474)', function () {
    const frTranslations = loadTranslationStrings('fr');
    const enTranslations = loadTranslationStrings('en');
    const esTranslations = loadTranslationStrings('es');

    describe('Tooltip keys (data-i18n-tip -> element.title)', function () {
        it('ensures no -tip key in French translations contains &nbsp;', function () {
            Object.keys(frTranslations).forEach(function (key) {
                if (key.endsWith('-tip')) {
                    expect(frTranslations[key]).to.not.include('&nbsp;',
                        `Key "${key}" is rendered to element.title and must not contain literal &nbsp;`);
                }
            });
        });

        it('ensures no -tip key in English translations contains &nbsp;', function () {
            Object.keys(enTranslations).forEach(function (key) {
                if (key.endsWith('-tip')) {
                    expect(enTranslations[key]).to.not.include('&nbsp;',
                        `Key "${key}" is rendered to element.title and must not contain literal &nbsp;`);
                }
            });
        });

        it('ensures no -tip key in Spanish translations contains &nbsp;', function () {
            Object.keys(esTranslations).forEach(function (key) {
                if (key.endsWith('-tip')) {
                    expect(esTranslations[key]).to.not.include('&nbsp;',
                        `Key "${key}" is rendered to element.title and must not contain literal &nbsp;`);
                }
            });
        });
    });

    describe('Plain-text path translation keys (textContent / innerText)', function () {
        it('ensures none of the plain-text-path keys contain &nbsp;', function () {
            plainTextKeys.forEach(function (key) {
                expect(frTranslations[key]).to.be.a('string', `Key "${key}" should exist in fr translations`);
                expect(frTranslations[key]).to.not.include('&nbsp;',
                    `Plain-text key "${key}" must not contain &nbsp;`);
            });
        });

        it('ensures French plain-text keys use literal U+00A0 before colon instead of regular space', function () {
            plainTextKeys.forEach(function (key) {
                const text = frTranslations[key];
                if (text && text.includes(':')) {
                    expect(text).to.include('\u00A0:',
                        `Plain-text key "${key}" should use literal U+00A0 before colon`);
                    expect(text).to.not.match(/ :/,
                        `Plain-text key "${key}" should not use standard ASCII space before colon`);
                }
            });
        });
    });

    describe('HTML path translation keys (innerHTML)', function () {
        it('ensures French HTML-path keys use &nbsp; for non-breaking space before high punctuation', function () {
            htmlPathKeysWithPunctuation.forEach(function (key) {
                const text = frTranslations[key];
                expect(text).to.be.a('string', `Key "${key}" should exist in fr translations`);
                expect(text).to.include('&nbsp;',
                    `HTML-path key "${key}" should use &nbsp; for non-breaking space`);
                expect(text).to.not.match(/ [!?:;]/,
                    `HTML-path key "${key}" should not have regular space before high punctuation`);
            });
        });
    });

    describe('Orphan translation keys cleanup', function () {
        it('ensures dialog-server-access-check-failed is removed from all translation files', function () {
            expect(frTranslations['dialog-server-access-check-failed']).to.be.undefined;
            expect(enTranslations['dialog-server-access-check-failed']).to.be.undefined;
            expect(esTranslations['dialog-server-access-check-failed']).to.be.undefined;
        });
    });

    describe('DOM sink rendering behavior', function () {
        it('renders HTML-path translations decoded without literal &nbsp; in textContent', function () {
            const div = document.createElement('div');
            div.innerHTML = frTranslations['api-decompressor-label'];
            expect(div.textContent).to.include('\u00A0:');
            expect(div.textContent).to.not.include('&nbsp;');
        });

        it('renders Plain-text path translations without literal &nbsp;', function () {
            const div = document.createElement('div');
            div.textContent = frTranslations['api-storage-used-label'];
            expect(div.textContent).to.include('\u00A0:');
            expect(div.textContent).to.not.include('&nbsp;');
        });

        it('renders tooltip title attributes without literal &nbsp;', function () {
            const label = document.createElement('label');
            label.title = frTranslations['configure-expert-enable-source-verification-tip'];
            expect(label.title).to.include('\u00A0:');
            expect(label.title).to.not.include('&nbsp;');
        });
    });
});
