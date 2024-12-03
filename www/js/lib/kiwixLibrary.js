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

// Creates the base HTML template with a status message area
function createBaseHtml () {
    const title = translateUI.t('configure-library-connecting') || 'Connecting to Library';
    return `
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
                    }            }
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
                    .error-message {
                        color: #cc0000;
                        font-weight: bold;
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

// Updates the status message in the iframe with loading indicator
function updateStatus(frame, message) {
    try {
        const statusElement = frame.contentWindow.document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.innerHTML = `<p>${message}</p>`;
        }
    } catch (e) {
        console.warn('Could not update status:', e);
    }
}

// Initialize the iframe with the base template
function initializeFrame (frame) {
    return new Promise((resolve) => {
        frame.src = 'about:blank';
        frame.onload = () => {
            frame.onload = null;
            frame.contentWindow.document.open();
            frame.contentWindow.document.write(createBaseHtml());
            frame.contentWindow.document.close();
            resolve();  // Signal that initialization is complete
        };
    });
}

// Creates HTML content for the mirror list
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

    params.kiwixDownloadMirrors.forEach(mirror => {
        const domain = mirror.replace(/^([^/]+\/\/[^/]+).*/, '$1');
        html += `
            <li class="mirror-item">
                <a href="${mirror}" target="_blank">${domain}</a>
            </li>`;
    });

    html += '</ul>';
    return html;
}

// Displays the mirror list in the iframe
function showMirrorList (frame) {
    try {
        const doc = frame.contentWindow.document;
        // Remove the loading heading since we're showing mirrors
        const mainHeading = doc.getElementById('mainHeading');
        if (mainHeading) {
            mainHeading.remove();
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

// Main library loading logic
async function loadLibrary (iframe) {
    await initializeFrame(iframe);
    try {
        if (!canExecuteCode()) {
            throw new Error('Browser cannot execute code');
        }
        // Try primary library URL
        const tryingPrimaryMsg = translateUI.t('configure-library-trying-primary') ||
            'Attempting to contact primary library server';
        updateStatus(iframe, tryingPrimaryMsg + ' ' + params.libraryUrl);
        await checkUrl(params.libraryUrl);
        iframe.src = params.libraryUrl;
    } catch (primaryError) {
        console.warn('Primary library unreachable:', primaryError);

        try {
            // Try alternative library URL
            const tryingAlternativeMsg = translateUI.t('configure-library-trying-alternative') ||
                '<p class="error-message">Primary server unreachable.</p><p>Attempting to contact backup server';
            updateStatus(iframe, tryingAlternativeMsg + ' ' + params.altLibraryUrl + '</p>');
            await checkUrl(params.altLibraryUrl);
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
