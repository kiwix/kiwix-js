/**
 * translateUi.js : Translation of the user interface
 *
 * Copyright 2023 Jaifroid and contributors
 * License GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */

'use strict';

// DEV: We are currently not using any features of i18next that cannot be provided simply by loading the translation strings
// and looking up the key in the object. If you need more features, you can switch to using i18next by installing it, importing
// it here, and using the commented-out code below. Instead of currentLanguage[string], use i18next.t(string). You will also need
// to add a dependency on i18next in /scripts/gitignore.patch. To support IE11 and older browsers, you should use a version of
// i18next that is no higher than 14.0.

// import i18next from '../../../node_modules/i18next/dist/es/i18next.js';
import util from './util.js';

var currentLanguage = {};

// Fallbacks come from the HTML, which is in English by default
var fallback = true;
// DEV: Uncomment line below to force placeholder (useful when writing new translations)
// fallback = false;

// Load the translation strings as a JSONP object for a given language code
function loadTranslationStrings (langCode) {
    return util.getJSONPObject('../i18n/' + langCode + '.jsonp').then(function (translations) {
        currentLanguage = translations[langCode]['translation'];
        // i18next.init({
        //     lng: langCode, // if you're using a language detector, do not define the lng option
        //     debug: true,
        //     resources: translations
        // });
    }).catch(function (err) {
        console.error('Error loading translation strings for language code ' + langCode, err);
        throw err;
    });
}

// Check if a translation exists for a given key
function exists (key) {
    return currentLanguage[key] !== undefined;
};

// Translate a single string
function translateString (string) {
    return (!fallback || exists(string)) ? currentLanguage[string] : '';
}

// Translate the UI
function translateApp (languageCode) {
    // Load the translation strings for the given language code
    return loadTranslationStrings(languageCode).then(function () {
        document.querySelectorAll('[data-i18n]').forEach(function (element) {
            var key = element.dataset.i18n;
            if (!fallback || exists(key)) {
                element.innerHTML = currentLanguage[key];
            }
        });
        document.querySelectorAll('[data-i18n-tip]').forEach(function (element) {
            var key = element.dataset.i18nTip;
            if (!fallback || exists(key)) {
                element.title = currentLanguage[key];
            }
        });
        document.getElementById('prefix').setAttribute('placeholder',
            translateString('home-prefix-placeholder') || 'Search...');
    }).catch(function (err) {
        console.error('Error translating the UI', err);
        throw err;
    });
}

export default {
    t: translateString,
    translateApp: translateApp
};
