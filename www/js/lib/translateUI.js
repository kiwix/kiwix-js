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

import i18next from '../../../node_modules/i18next/dist/es/i18next.js';
import uiUtil from './uiUtil.js';

// Load the translation strings as a JSON object for a given language code
function loadTranslationStrings (langCode) {
    return uiUtil.getJSONObject('../i18n/' + langCode + '.json').then(function (translations) {
        i18next.init({
            lng: langCode, // if you're using a language detector, do not define the lng option
            debug: true,
            resources: translations
        });
    }).catch(function (err) {
        console.error('Error loading translation strings for language code ' + langCode, err);
    });
}

// Translate the UI
function translateApp (languageCode) {
    // Load the translation strings for the given language code
    return loadTranslationStrings(languageCode).then(function () {
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            element.innerHTML = i18next.t(element.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-tip]').forEach((element) => {
            element.title = i18next.t(element.dataset.i18nTip);
        });
    }).catch(function (err) {
        console.error('Error translating the UI', err);
    });
}

export default {
    translateApp: translateApp
};
