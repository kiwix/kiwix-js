/**
 * kiwixLibrary.js : A module for loading a Library of Kiwix offline resources into an iframe
 *
 * Copyright 2024 Jaifroid and contributors
 * Licence GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public Licence as published by
 * the Free Software Foundation, either version 3 of the Licence, or
 * (at your option) any later version.
 *
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public Licence for more details.
 *
 * You should have received a copy of the GNU General Public Licence
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */

'use strict';

/* global params */

import translateUI from './translateUI.js';

// Tests if browser can execute code (required for library functionality)
function canExecuteCode () {
    try {
        // eslint-disable-next-line no-new-func
        Function('try{}catch{}')();
        return true;
    } catch (error) {
        console.warn('Browser cannot run code in the library iframe', error);
        return false;
    }
}

// Attempts to load a URL and returns a promise
function checkUrl (url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, true);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`Server ${url} returned status ${xhr.status}`));
                }
            }
        };
        xhr.onerror = () => reject(new Error(`Cannot reach ${url}`));
        xhr.send();
    });
}

// Creates HTML content for the mirror list
function createMirrorListHtml () {
    const title = translateUI.t('configure-library-mirrors') || 'Library Mirrors';
    const unreachableMsg = translateUI.t('configure-library-unreachable') || 'appears to be unreachable. Please try one of these mirrors:';
    const altLibraryMsg = translateUI.t('configure-library-altlibrary') || 'The library at';
    let html = `
        <html>
            <head><title>${title}</title></head>
            <body>
                <h1>${title}</h1>
                <p style="font-size: large;">
                    ${altLibraryMsg} ${params.altLibraryUrl} ${unreachableMsg}
                </p>
                <ul>`;
    params.kiwixDownloadMirrors.forEach(mirror => {
        const domain = mirror.replace(/^([^/]+\/\/[^/]+).*/, '$1');
        html += `
            <li style="font-size: large;" class="console">
                <a href="${mirror}" target="_blank">${domain}</a>
            </li>`;
    });

    html += '</ul></body></html>';
    return html;
}

// Displays the mirror list in the iframe
function showMirrorList (frame) {
    const html = createMirrorListHtml();
    frame.src = 'about:blank';
    // Write content after iframe loads blank page
    frame.onload = () => {
        frame.onload = null;
        frame.contentWindow.document.open();
        frame.contentWindow.document.write(html);
        frame.contentWindow.document.close();
    };
}

// Main library loading logic
async function loadLibrary (iframe) {
    // Clear existing content
    iframe.src = 'about:blank';
    try {
        // First check if we can execute code
        if (!canExecuteCode()) {
            throw new Error('Browser cannot execute code');
        }
        // Try primary library URL
        await checkUrl(params.libraryUrl);
        iframe.src = params.libraryUrl;
    } catch (primaryError) {
        console.warn('Primary library unreachable:', primaryError);
        try {
            // Try alternative library URL
            await checkUrl(params.altLibraryUrl);
            iframe.src = params.altLibraryUrl;
        } catch (alternativeError) {
            console.warn('Alternative library unreachable:', alternativeError);
            showMirrorList(iframe);
        }
    }
}

export default {
    loadLibrary: loadLibrary
};
