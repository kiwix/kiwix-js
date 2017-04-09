/**
 * backgroundscript.js: Background script for the WebExtension
 *
 * Copyright 2017 Mossroy and contributors
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

// In order to work on both Firefox and Chromium/Chrome (and derivatives).
// browser and chrome variables expose almost the same APIs
var genericBrowser;
if (typeof browser !== 'undefined') {
    // Firefox
    genericBrowser = browser;
}
else {
    // Chromium/Chrome
    genericBrowser = chrome;
}

genericBrowser.browserAction.onClicked.addListener(handleClick);

function handleClick(event) {
    genericBrowser.tabs.create({
        url: genericBrowser.runtime.getURL('/www/index.html')
    });
}