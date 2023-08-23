/**
 * init.js : Configuration for the library require.js
 * This file handles the dependencies between javascript libraries, for the unit tests
 *
 * Copyright 2013-2014 Mossroy and contributors
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

/* global webpHero */

// Define global params needed for tests to run on existing app code
// eslint-disable-next-line no-unused-vars
var params = {};

// Test if WebP is natively supported, and if not, load a webpMachine instance. This is used in uiUtils.js.
// eslint-disable-next-line no-unused-vars
var webpMachine = false;

// We use a self-invoking function here to avoid defining unnecessary global functions and variables
(function (callback) {
    // Tests for native WebP support
    var webP = new Image();
    webP.onload = webP.onerror = function () {
        callback(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
})(function (support) {
    if (!support) {
        // Note we set the location of this to be the directory where scripts reside **after bundling**
        var webpScript = document.createElement('script');
        webpScript.onload = function () {
            webpMachine = new webpHero.WebpMachine({ useCanvasElements: true });
        }
        webpScript.src = '../../www/js/webpHeroBundle_0.0.2.js';
        document.head.appendChild(webpScript);
    }
});
