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

// The number of milliseconds we are prepared to wait for a library server to answer before we give up on it
const SERVER_TIMEOUT = 10000;

/**
 * Tests if browser can execute code required for library.kiwix.org functionality
 * @returns {boolean} True if the browser can execute required code in the library iframe
 */
function canExecuteCode () {
    try {         
        Function('try{}catch{}')();
        return true;
    } catch (error) {
        console.warn('Browser cannot run required code for ' + params.libraryUrl, error);
        return false;
    }
}

/**
 * Attempts to load a URL header and returns a Promise with the result. NB this only works with servers that send
 * CORS headers: if they do not, the browser blocks the response even when the server answered normally, and we
 * cannot distinguish that from an unreachable server (see checkUrlByImage below)
 * @param {String} url A URL to check
 * @param {Number} timeoutMs The number of milliseconds to wait before giving up on the server
 * @returns {Promise} A promise that resolves if the URL is reachable, or rejects with an error
 */
function checkUrl (url, timeoutMs) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, true);
        // Without this, a server that accepts the connection but never answers would leave the user looking at the
        // loading animation indefinitely (NB the timeout must be set after open() for IE11)
        xhr.timeout = timeoutMs;
        xhr.ontimeout = () => reject(new Error(`Timed out waiting for ${url}`));
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

/**
 * Tests whether a server is reachable by loading a small image from it. Unlike XMLHttpRequest, image loading is not
 * subject to CORS, so this is the only check available to us for the file-index mirrors, none of which send an
 * Access-Control-Allow-Origin header [kiwix-js #1461]
 * @param {String} url The URL of a small image on the server we wish to test
 * @param {Number} timeoutMs The number of milliseconds to wait before giving up on the server
 * @returns {Promise} A promise that resolves if the image loads, or rejects with an error
 */
function checkUrlByImage (url, timeoutMs) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        let settled = false;
        const settle = (callback, error) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            img.onload = null;
            img.onerror = null;
            callback(error);
        };
        const timer = setTimeout(() => settle(reject, new Error(`Timed out waiting for ${url}`)), timeoutMs);
        img.onload = () => settle(resolve);
        img.onerror = () => settle(reject, new Error(`Cannot reach ${url}`));
        // Add a unique query so that a cached copy of the image cannot make a server that is now down look reachable
        img.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'kiwixprobe=' + Date.now();
    });
}

/**
 * Checks that the alternative (file-index) library is reachable, using the most precise test available to us
 * @returns {Promise} A promise that resolves if the alternative library is reachable, or rejects with an error
 */
function checkAltLibrary () {
    // Where we have been given a probe image on the same server, we must use it, because the mirrors that still
    // publish a traditional file index do not send CORS headers, which makes the XHR check useless for them
    return params.altLibraryProbe ? checkUrlByImage(params.altLibraryProbe, SERVER_TIMEOUT)
        : checkUrl(params.altLibraryUrl, SERVER_TIMEOUT);
}

/**
 * Creates the base HTML template with a status message area and loading indicator
 * @returns {String} The base HTML template
 */
function createBaseHtml () {
    const title = translateUI.t('configure-library-connecting') || 'Connecting to Library';
    return `<!DOCTYPE html>
        <html>
            <head>
                <title>${title}</title>
                <style>
                    /* Main heading container */
                    #mainHeading {
                        margin: 1em 0;
                    }
                    .heading-text {
                        display: flex;
                        align-items: center;
                        gap: 0.5em;
                        font-size: 2em;  /* Make heading prominent */
                    }
                    /* Loading dots animation */
                    .loading-dots span {
                        display: inline-block;
                        animation: loadingDot 1.5s infinite;
                        margin-left: 2px;
                    }
                    .loading-dots span:nth-child(2) {
                        animation-delay: 0.5s;
                    }
                    .loading-dots span:nth-child(3) {
                        animation-delay: 1s;
                    }
                    @keyframes loadingDot {
                        0%, 20% { opacity: 0; }
                        50% { opacity: 1; }
                        80%, 100% { opacity: 0; }
                    }
                    /* Status message styles */
                    #statusMessage {
                        margin: 2em 0;
                        font-size: 1.2em;
                        color: #333;
                    }
                    .error-message {
                        color: #cc0000;
                        font-weight: bold;
                    }
                    /* Mirror list styles */
                    .mirror-intro {
                        font-size: 1.2em;
                        margin: 1.5em 0;
                    }
                    .mirror-list {
                        list-style: none;
                        padding: 0;
                        margin: 2em 0;
                    }
                    .mirror-item {
                        margin: 1em 0;
                        font-size: 1.2em;
                    }
                    .mirror-item a {
                        color: #0066cc;
                        text-decoration: none;
                        padding: 0.2em 0;
                    }
                    .mirror-item a:hover {
                        text-decoration: underline;
                    }
                    /* Responsive adjustments */
                    @media (max-width: 768px) {
                        #statusMessage,
                        .mirror-intro,
                        .mirror-item {
                            font-size: 1em;
                        }
                    }
                </style>
            </head>
            <body>
                <div id="mainHeading">
                    <h1 class="heading-text">
                        ${title}<span class="loading-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </h1>
                </div>
                <div id="statusMessage"></div>
                <div id="mirrorList"></div>
            </body>
        </html>
    `;
}

/**
 * Updates the status message in the iframe with loading indicator
 * @param {Object} frame The iframe DOM object
 * @param {String} message The status message to display in the iframe
 */
function updateStatus (frame, message) {
    try {
        const statusElement = frame.contentWindow.document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.innerHTML = `<p>${message}</p>`;
        }
    } catch (e) {
        console.warn('Could not update status:', e);
    }
}

/**
 * Initialize the iframe with the base template
 * @param {Objet} frame The iframe DOM object to initialize
 * @returns {Promise} A promise that resolves when the iframe is initialized
 */
function initializeFrame (frame) {
    return new Promise((resolve) => {
        frame.src = 'about:blank';
        frame.onload = () => {
            frame.onload = null;
            frame.contentWindow.document.open();
            frame.contentWindow.document.write(createBaseHtml());
            frame.contentWindow.document.close();
            resolve(); // Signal that initialization is complete
        };
    });
}

/**
 * Creates HTML content for the mirror list
 * @returns {String} The HTML content for the mirror list
 */
function createMirrorListHtml () {
    const mirrorListText = translateUI.t('configure-library-mirrors') || 'Library Mirrors';
    const unreachableMsg = translateUI.t('configure-library-unreachable') || 'appears to be unreachable. Please try one of these mirrors:';
    const altLibraryMsg = translateUI.t('configure-library-altlibrary') || 'The library at';

    let html = `
        <h2>${mirrorListText}</h2>
        <p class="mirror-intro">
            ${altLibraryMsg} ${params.altLibraryUrl} ${unreachableMsg}
        </p>
        <ul class="mirror-list">`;

    // Don't offer the alternative library as an alternative, given that we have just failed to reach it
    params.kiwixDownloadMirrors.filter(mirror => mirror !== params.altLibraryUrl).forEach(mirror => {
        const domain = mirror.replace(/^([^/]+\/\/[^/]+).*/, '$1');
        html += `
            <li class="mirror-item">
                <a href="${mirror}" target="_blank">${domain}</a>
            </li>`;
    });

    html += '</ul>';
    return html;
}

/**
 * Displays the mirror list in the iframe
 * @param {Object} frame The iframe DOM object in which to display the mirror list
 */
function showMirrorList (frame) {
    try {
        const doc = frame.contentWindow.document;
        // Remove the loading heading since we're showing mirrors
        const mainHeading = doc.getElementById('mainHeading');
        if (mainHeading && mainHeading.parentNode) {
            // Using the traditional removeChild method for IE11 compatibility
            mainHeading.parentNode.removeChild(mainHeading);
        }
        // Update status with error message
        const statusElement = doc.getElementById('statusMessage');
        const mirrorListElement = doc.getElementById('mirrorList');

        if (statusElement && mirrorListElement) {
            const allUnreachableMsg = translateUI.t('configure-library-all-unreachable') ||
                'All library servers are currently unreachable.';
            // Show error message in status area
            statusElement.innerHTML = `<p class="error-message">${allUnreachableMsg}</p>`;
            // Show mirror list
            mirrorListElement.innerHTML = createMirrorListHtml();
        }
    } catch (e) {
        console.warn('Could not show mirror list:', e);
    }
}

/**
 * Main library loading logic
 * @param {Object} iframe The iframe DOM object into which to load the library
 */
async function loadLibrary (iframe) {
    await initializeFrame(iframe);
    try {
        // First check browser compatibility
        if (!canExecuteCode()) {
            const incompatibilityError = new Error('Browser cannot execute code');
            incompatibilityError.name = 'BrowserIncompatibilityError';
            throw incompatibilityError;
        }
        // Try primary library URL
        const tryingPrimaryMsg = translateUI.t('configure-library-trying-primary') ||
            'Attempting to contact primary library server';
        updateStatus(iframe, tryingPrimaryMsg + ' ' + params.libraryUrl);
        await checkUrl(params.libraryUrl, SERVER_TIMEOUT);
        iframe.src = params.libraryUrl;
    } catch (primaryError) {
        let tryingAlternativeMsg;
        if (primaryError.name === 'BrowserIncompatibilityError') {
            // For browser incompatibility, combine both messages
            console.warn('Browser compatibility check failed: Browser cannot execute code in library iframe');
            const incompatibilityMsg = translateUI.t('configure-library-incompatible') ||
                'Browser is incompatible with primary library';
            tryingAlternativeMsg = translateUI.t('configure-library-trying-alternative') ||
                'Attempting to contact backup server';
            // Show both messages together, maintaining the error styling for the incompatibility message
            updateStatus(iframe,
                `<p class="error-message">${incompatibilityMsg}</p>
                 <p>${tryingAlternativeMsg} ${params.altLibraryUrl}</p>`);
        } else {
            // For connection errors, show the standard unreachable message
            console.warn('Primary library unreachable:', primaryError);
            tryingAlternativeMsg = translateUI.t('configure-library-primary-unreachable') ||
                '<p class="error-message">Primary server unreachable.</p><p>';
            tryingAlternativeMsg += translateUI.t('configure-library-trying-alternative') ||
                'Attempting to contact backup server';
            updateStatus(iframe, tryingAlternativeMsg + ' ' + params.altLibraryUrl + '</p>');
        }
        try {
            // Try alternative library URL
            await checkAltLibrary();
            iframe.src = params.altLibraryUrl;
        } catch (alternativeError) {
            console.warn('Alternative library unreachable:', alternativeError);
            showMirrorList(iframe);
        }
    }
}

export default {
    loadLibrary
};
