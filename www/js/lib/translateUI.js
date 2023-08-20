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

/* global Banana */

import '../../../node_modules/banana-i18n/dist/banana-i18n.js';
// In the future you may be able to do it like this. Currently, it only works in Chromium.
// import es from '../../../i18n/es.json' assert { type: 'json' };
// import en from '../../../i18n/en.json' assert { type: 'json' };
import uiUtil from './uiUtil.js';

const banana = new Banana();

// Load the translation strings as a JSON object for a given language code
function loadTranslationStrings (langCode) {
    return uiUtil.getJSONObject('../i18n/' + langCode + '.json').then(function (translations) {
        banana.load(translations, langCode);
        // Set the locale to the language code
        banana.setLocale(langCode);
    }).catch(function (err) {
        console.error('Error loading translation strings for language code ' + langCode, err);
    });
}

// Translate the UI
function translateApp (languageCode) {
    // Load the translation strings for the given language code
    return loadTranslationStrings(languageCode).then(function () {
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            element.innerHTML = banana.i18n(element.dataset.i18n);
        });
    }).catch(function (err) {
        console.error('Error translating the UI', err);
    });
}

export default {
    translateApp: translateApp
};
