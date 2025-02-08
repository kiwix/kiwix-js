/**
 * popovers.js : Functions to add popovers to the UI
 *
 * Copyright 2013-2024 Jaifroid and contributors
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

import uiUtil from './uiUtil.js';

/**
 * Parses a linked article in a loaded document in order to extract the first main paragraph (the 'lede') and first
 * main image (if any). This function currently only parses Wikimedia articles. It returns an HTML string, formatted
 * for display in a popover
 * @param {String} href The href of the article link from which to extract the lede
 * @param {String} baseUrl The base URL of the currently loaded article
 * @param {Document} articleDocument The DOM of the currently loaded article
 * @param {ZIMArchive} archive The archive from which to extract the lede
 * @returns {Promise<String>} A Promise for the linked article's lede HTML including first main image URL if any
 */
function getArticleLede (href, baseUrl, articleDocument, archive) {
    const uriComponent = uiUtil.removeUrlParameters(href);
    const zimURL = uiUtil.deriveZimUrlFromRelativeUrl(uriComponent, baseUrl);
    console.debug('Previewing ' + zimURL);
    const promiseForArticle = function (dirEntry) {
        // Wrap legacy callback-based code in a Promise
        return new Promise((resolve, reject) => {
            // As we're reading Wikipedia articles, we can assume that they are UTF-8 encoded HTML data
            archive.readUtf8File(dirEntry, function (fileDirEntry, htmlArticle) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlArticle, 'text/html');
                const articleBody = doc.body;
                if (articleBody) {
                    // Establish the popup balloon's base URL and the absolute path for calculating the ZIM URL of links and images
                    const balloonBaseURL = encodeURI(fileDirEntry.namespace + '/' + fileDirEntry.url.replace(/[^/]+$/, ''));
                    const docUrl = new URL(articleDocument.location.href);
                    const rootRelativePathPrefix = docUrl.pathname.replace(/([^.]\.zim\w?\w?\/).+$/i, '$1');
                    // Clean up the lede content
                    const nonEmptyParagraphs = cleanUpLedeContent(articleBody);
                    // Concatenate paragraphs to fill the balloon
                    let balloonString = '';
                    if (nonEmptyParagraphs.length > 0) {
                        balloonString = fillBalloonString(nonEmptyParagraphs, balloonBaseURL, rootRelativePathPrefix);
                    }
                    // If we have a lede, we can now add an image to the balloon, but only if we are in ServiceWorker mode
                    if (balloonString && params.contentInjectionMode === 'serviceworker') {
                        const imageHTML = getImageHTMLFromNode(articleBody, balloonBaseURL, rootRelativePathPrefix);
                        if (imageHTML) {
                            balloonString = imageHTML + balloonString;
                        }
                    }
                    if (!balloonString) {
                        reject(new Error('No article lede or image'));
                    } else {
                        resolve(balloonString);
                    }
                } else {
                    reject(new Error('No article body found'));
                }
            });
        });
    };
    const processDirEntry = function (dirEntry) {
        if (!dirEntry) throw new Error('No directory entry found');
        if (dirEntry.redirect) {
            return new Promise((resolve, reject) => {
                archive.resolveRedirect(dirEntry, function (reDirEntry) {
                    if (!reDirEntry) reject(new Error('Could not resolve redirect'));
                    resolve(promiseForArticle(reDirEntry));
                });
            });
        } else {
            return promiseForArticle(dirEntry);
        }
    };
    // Do a binary search in the URL index to get the directory entry for the requested article
    return archive.getDirEntryByPath(zimURL).then(processDirEntry).catch(function (err) {
        throw new Error('Could not get Directory Entry for ' + zimURL, err);
    });
};

// Helper function to clean up the lede content
function cleanUpLedeContent (node) {
    // Define an array of exclusion filters
    // (note `.exclude-this-class` is a dummy class used as an example for any future exclusion filters)
    const exclusionFilters = ['#pcs-edit-section-title-description', '.exclude-this-class'];
    // Construct the `:not()` CSS exclusion selector list
    const notSelector = exclusionFilters.map(filter => `:not(${filter})`).join('');

    // Remove all standalone style elements from the given DOM node, because their content is shown by innerText and textContent
    const styleElements = Array.from(node.querySelectorAll('style'));
    styleElements.forEach(style => {
        style.parentNode.removeChild(style);
    });
    // Apply this style-based exclusion filter to remove unwanted paragraphs in the popover
    const paragraphs = Array.from(node.querySelectorAll(`p${notSelector}`));

    // Filter out empty paragraphs or those with less than 50 characters
    const parasWithContent = paragraphs.filter(para => {
        // DEV: Note that innerText is not supported in Firefox OS, so we need to use textContent as a fallback
        // The reason we prefer innerText is that it strips out hidden text and unnecessary whitespace, which is not the case with textContent
        const innerText = para.innerText ? para.innerText : para.textContent;
        const text = innerText.trim();
        return !/^\s*$/.test(text) && text.length >= 50;
    });
    return parasWithContent;
}

// Helper function to concatenate paragraphs to fill the balloon
function fillBalloonString (paras, baseURL, pathPrefix) {
    let cumulativeCharCount = 0;
    let concatenatedText = '';
    // Add enough paras to complete the word count
    for (let i = 0; i < paras.length; i++) {
        // Get the character count: to fill the larger box we need ~850 characters (815 plus leeway)
        // DEV: Note that innerText is not supported in Firefox OS, so we need to use textContent as a fallback
        const plainText = paras[i].innerText ? paras[i].innerText : paras[i].textContent;
        cumulativeCharCount += plainText.length;
        // In ServiceWorker mode, we need to transform the URLs of any links in the paragraph
        if (params.contentInjectionMode === 'serviceworker') {
            const links = Array.from(paras[i].querySelectorAll('a'));
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && !/^#/.test(href)) {
                    const zimURL = uiUtil.deriveZimUrlFromRelativeUrl(href, baseURL);
                    link.href = pathPrefix + encodeURI(zimURL);
                }
            });
        }
        // Get the transformed HTML. Note that in Restricted mode, we risk breaking the UI if user clicks on an
        // embedded link, so only use plainText in that case
        const content = params.contentInjectionMode === 'jquery' ? plainText
            : paras[i].innerHTML;
        concatenatedText += '<p>' + content + '</p>';
        // If we have enough characters to fill the box, break
        if (cumulativeCharCount >= 850) break;
    }
    return concatenatedText;
}

// Helper function to get the first main image from the given node
function getImageHTMLFromNode (node, baseURL, pathPrefix) {
    const images = node.querySelectorAll('img');
    let firstImage = null;
    if (images) {
        // Iterate over images until we find one with a width greater than 50 pixels
        // (this filters out small icons)
        const imageArray = Array.from(images);
        for (let j = 0; j < imageArray.length; j++) {
            if (imageArray[j] && imageArray[j].width > 50) {
                firstImage = imageArray[j];
                break;
            }
        }
    }
    if (firstImage) {
        // Calculate root relative URL of image
        const imageZimURL = encodeURI(uiUtil.deriveZimUrlFromRelativeUrl(firstImage.getAttribute('src'), baseURL));
        firstImage.src = pathPrefix + imageZimURL;
        return firstImage.outerHTML;
    }
}

/**
 * A function to attach the tooltip CSS for popovers (NB this does not attach the box itself, only the CSS)
 * @param {Document} doc The document to which to attach the popover stylesheet
 * @param {Boolean} dark An optional parameter to adjust the background colour for dark themes (generally not needed for inversion-based themes)
 */
function attachKiwixPopoverCss (doc, dark) {
    const colour = dark && !/invert/i.test(params.cssTheme) ? 'lightgray' : 'black';
    const backgroundColour = dark && !/invert/i.test(params.cssTheme) ? '#121e1e' : '#ebf4fb';
    const borderColour = 'skyblue !important';
    const cssLink = document.createElement('link');
    doc.head.appendChild(cssLink);
    // DEV: Firefox OS blocks loading stylesheet files into iframe DOM content even if it is same origin, so we are forced to insert a style element instead
    uiUtil.replaceCSSLinkWithInlineCSS(cssLink, `
        .kiwixtooltip {
            position: absolute;
            bottom: 1em;
            /* prettify */
            padding: 0 5px 5px;
            color: ${colour};
            background: ${backgroundColour};
            border: 0.1em solid ${borderColour};
            /* round the corners */
            border-radius: 0.5em;
            /* handle overflow */
            overflow: visible;
            text-overflow: ellipsis;
            /* handle text wrap */
            overflow-wrap: break-word;
            word-wrap: break-word;
            /* add fade-in transition */
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 2;
        }
        
        .kiwixtooltip img {
            float: right;
            margin-left: 5px;
            max-width: 40%;
            height: auto;
        }
        
        #popcloseicon {
            padding-top: 1px;
            padding-right: 2px;
            font-size: 20px;
            font-family: sans-serif;
        }
        
        #popcloseicon:hover { 
            cursor: pointer;
        }
        
        #popbreakouticon {
            height: 18px;
            margin-right: 18px;
        }
        
        #popbreakouticon:hover {
            cursor: pointer;
        }
        
        /* Prevent native iOS popover on Safari if option is enabled */
        body { 
            -webkit-touch-callout: none !important;
        }
        `,
    // The id of the style element for easy manipulation
    'kiwixtooltipstylesheet');
}

/**
 * Attaches a popover div for the given link to the given document's DOM
 * @param {Event} ev The event which has fired this popover action
 * @param {Element} link The link element that is being actioned
 * @param {Object} state The globlal object defined in app.js that holds the current state of the app
 * @param {Boolean} dark An optional value to switch colour theme to dark if true
 * @param {ZIMArchive} archive The archive from which the popover information is extracted
 * @returns {Promise<div>} A Promise for the attached popover div or undefined if the popover is not attached
 */
function populateKiwixPopoverDiv (ev, link, state, dark, archive) {
    // Do not show popover if the user has initiated an article load (set in filterClickEvent)
    if (link.articleisloading || link.popoverisloading) return Promise.resolve();
    const linkHref = link.getAttribute('href');
    // Do not show popover if there is no href or with certain landing pages
    if (!linkHref || /^wikivoyage/i.test(archive.file.name) &&
      (state.expectedArticleURLToBeDisplayed === archive.landingPageUrl ||
      state.expectedArticleURLToBeDisplayed === 'A/Wikivoyage:Offline_reader_Expedition/Home_page')) {
        return Promise.resolve();
    }
    link.popoverisloading = true;
    // Do not display a popover if one is already showing for the current link
    const kiwixPopover = ev.target.ownerDocument.querySelector('.kiwixtooltip');
    // DEV: popoverIsLoading will get reset in app.js after user deselects link
    if (kiwixPopover && kiwixPopover.dataset.href === linkHref) return Promise.resolve();
    // console.debug('Attaching popover...');
    const currentDocument = ev.target.ownerDocument;
    const articleWindow = currentDocument.defaultView;
    // Remove any existing popover(s) that the user may not have closed before creating a new one
    removeKiwixPopoverDivs(currentDocument);
    // Timeout below ensures that popovers are not loaded if a user is simply moving their mouse around on a page
    // without hovering. It provides a 600ms pause before app begins the process of binary search and decompression
    setTimeout(function () {
        // Check if the user has moved away from the link or has clicked it, and abort display of popover if so
        if (link.articleisloading || !link.matches(':hover') && !link.touched && currentDocument.activeElement !== link) {
            // Aborting popover display because user has moved away from link or clicked it
            link.popoverisloading = false;
            return;
        }
        // Create a new Kiwix popover container
        const divWithArrow = createNewKiwixPopoverCointainer(articleWindow, link, ev);
        const div = divWithArrow.div;
        const span = divWithArrow.span;
        // Get the article's 'lede' (first main paragraph or two) and the first main image (if any)
        getArticleLede(linkHref, state.baseUrl, currentDocument, archive).then(function (html) {
            div.style.justifyContent = '';
            div.style.alignItems = '';
            div.style.display = 'block';
            const breakoutIconFile = window.location.pathname.replace(/\/[^/]*$/, '') + (dark ? '/img/icons/new_window_white.svg' : '/img/icons/new_window_black.svg');
            const backgroundColour = dark && !/invert/i.test(params.appTheme) ? 'black' : '#ebf4fb';
            // DEV: Most style declarations in this div only work properly inline. If added in stylesheet, even with !important, the positioning goes awry
            // (appears to be a timing issue related to the reservation of space given that the div is inserted dynamically).
            div.innerHTML = `<div style="position: relative; overflow: hidden; height: ${div.style.height};">
                <div style="background: ${backgroundColour} !important; opacity: 70%; position: absolute; top: 0; right: 0; display: flex; align-items: center; padding: 0; z-index: 1;">
                    <img id="popbreakouticon" src="${breakoutIconFile}" />
                    <span id="popcloseicon">X</span>
                </div>
                <div style="padding-top: 3px">${html}</div>
            </div>`;
            // Now it is populated, we can attach the arrow to the div
            div.appendChild(span);
            // Programme the icons
            addEventListenersToPopoverIcons(link, div, currentDocument);
            setTimeout(function () {
                div.popoverisloading = false;
            }, 900);
        }).catch(function (err) {
            console.warn(err);
            // Remove the div
            div.style.opacity = '0';
            div.parentElement.removeChild(div);
            link.dataset.touchevoked = false;
            link.popoverisloading = false;
        });
    }, 600);
}

/**
 * Create a new empty Kiwix popover container and attach it to the current document appropriately sized and positioned
 * in relation to the given anchor and available screen width and height. Also returns the arrow span element which can be
 * attached to the div after the div is populated with content.
 * @param {Window} win The window of the article DOM
 * @param {Element} anchor The anchor element that is being actioned
 * @param {Event} event The event which has fired this popover action
 * @returns {Object} An object containing the popover div and the arrow span elements
 */
function createNewKiwixPopoverCointainer (win, anchor, event) {
    const div = document.createElement('div');
    const linkHref = anchor.getAttribute('href');
    const currentDocument = win.document;
    div.popoverisloading = true;
    const zoomSupported = 'zoom' in currentDocument.documentElement.style && !isSafari();
    const zoomIsSet = zoomSupported && currentDocument.documentElement.style.zoom;
    let zoomFactor = zoomIsSet ? currentDocument.documentElement.style.zoom : 1;
    // Account for zoom when calculating available screen width
    const screenWidth = (win.innerWidth - 40) / zoomFactor;
    const screenHeight = document.documentElement.clientHeight;
    let margin = 40;
    // Base width scaled by zoom factor
    const divWidth = Math.min(512, screenWidth);
    if (screenWidth <= 512) {
        margin = 10;
    }
    // Check if we have restricted screen height
    const divHeight = screenHeight < 512 ? 160 : 256;
    div.style.width = divWidth + 'px';
    div.style.height = divHeight + 'px';
    div.style.display = 'flex';
    div.style.justifyContent = 'center';
    div.style.alignItems = 'center';
    div.className = 'kiwixtooltip';
    div.innerHTML = '<p>Loading ...</p>';
    div.dataset.href = linkHref;
    // DEV: We need to insert the div into the target document before we can obtain its computed dimensions accurately
    currentDocument.body.appendChild(div);
    // Calculate the position of the link that is being hovered
    const rect = anchor.getBoundingClientRect();
    const linkRect = {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width
    };
    // Note that since Chromium 128 getBoundingClientRect() now returns zoom-adjusted values, but if this is the case,
    // then currentCSSZoom will be defined as well, so we can adjust for this. Note that UWP also requires adjustment.
    if (/UWP/.test(params.appType) || 'MSBlobBuilder' in window || anchor.currentCSSZoom || isSafari()) {
        linkRect.top = linkRect.top / zoomFactor;
        linkRect.bottom = linkRect.bottom / zoomFactor;
        linkRect.left = linkRect.left / zoomFactor;
        linkRect.right = linkRect.right / zoomFactor;
        linkRect.width = linkRect.width / zoomFactor;
    }
    // Initially position the div 20px above the link
    const spacing = 20;
    let triangleDirection = 'top';
    const divOffsetHeight = div.offsetHeight + spacing;
    let divRectY = linkRect.top - divOffsetHeight;
    let triangleY = divHeight + 6;
    // If we're less than half margin from the top, move the div below the link
    if (divRectY < margin / 2) {
        triangleDirection = 'bottom';
        divRectY = linkRect.bottom + spacing;
        triangleY = -16;
    }
    // Position it horizontally in relation to the pointer position
    let divRectX, triangleX;
    if (event.type === 'touchstart') {
        divRectX = event.touches[0].clientX - divWidth / 2;
        triangleX = event.touches[0].clientX - divRectX - spacing;
    } else if (event.type === 'focus') {
        divRectX = linkRect.left * zoomFactor + linkRect.width / 2 - divWidth / 2;
        triangleX = linkRect.left * zoomFactor + linkRect.width / 2 - divRectX - spacing;
    } else {
        divRectX = event.clientX - divWidth / 2;
        triangleX = event.clientX - divRectX - spacing;
    }
    // If right edge of div is greater than margin from the right side of window, shift it to margin
    if (divRectX + divWidth * zoomFactor > screenWidth - margin) {
        triangleX += divRectX;
        divRectX = screenWidth - divWidth * zoomFactor - margin;
        triangleX -= divRectX;
    }
    // If we're less than margin to the left, shift it to margin px from left
    if (divRectX * zoomFactor < margin) {
        triangleX += divRectX;
        divRectX = margin;
        triangleX -= divRectX;
    }
    // Adjust triangleX if necessary
    if (triangleX < 10) triangleX = 10;
    if (triangleX > divWidth - 10) triangleX = divWidth - 10;
    // Adjust positions to take into account the font zoom factor
    const adjustedScrollY = win.scrollY / zoomFactor;
    if (isSafari()) {
        // We have to reinstate zoomFactor as it is only applied to horizontal positioning in Safari
        zoomFactor = params.relativeFontSize / 100;
    }
    divRectX = divRectX / zoomFactor;
    triangleX = triangleX / zoomFactor;
    // Now set the calculated x and y positions
    div.style.top = divRectY + adjustedScrollY + 'px';
    div.style.left = divRectX + 'px';
    div.style.opacity = '1';
    // Now create the arrow span element. Note that we cannot attach it yet as we need to populate the div first
    // and doing so will overwrite the innerHTML of the div
    const triangleColour = getComputedStyle(div).borderBottomColor; // Same as border colour of div (UWP needs specific border colour)
    const span = document.createElement('span');
    span.style.cssText = `
        width: 0;
        height: 0;
        border-${triangleDirection}: 16px solid ${triangleColour} !important;
        border-left: 8px solid transparent !important;
        border-right: 8px solid transparent !important;
        position: absolute;
        top: ${triangleY}px;
        left: ${triangleX}px;
    `;
    return { div: div, span: span };
}

function isSafari () {
    return typeof navigator !== 'undefined' &&
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
        CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
};

/**
 * Adds event listeners to the popover's control icons
 * @param {Element} anchor The anchor which launched the popover
 * @param {Element} popover The containing element of the popover (div)
 * @param {Document} doc The doucment on which to operate
 */
function addEventListenersToPopoverIcons (anchor, popover, doc) {
    const breakout = function (e) {
        // Adding the newcontainer property to the anchor will be cauught by the filterClickEvent function and will open in new tab
        anchor.newcontainer = true;
        anchor.click();
        closePopover(popover);
    }
    const closeIcon = doc.getElementById('popcloseicon');
    const breakoutIcon = doc.getElementById('popbreakouticon');
    // Register mousedown event (should work in all contexts)
    closeIcon.addEventListener('mousedown', function () {
        closePopover(popover);
    }, true);
    breakoutIcon.addEventListener('mousedown', breakout, true);
}

/**
 * Remove any preview popover DIVs found in the given document
 * @param {Document} doc The document from which to remove any popovers
 */
function removeKiwixPopoverDivs (doc) {
    const divs = doc.getElementsByClassName('kiwixtooltip');
    // Timeout is set to allow for a delay before removing popovers - so user can hover the popover itself to prevent it from closing,
    // or so that links and buttons in the popover can be clicked
    setTimeout(function () {
        // Gather any popover divs (on rare occasions, more than one may be displayed)
        Array.prototype.slice.call(divs).forEach(function (div) {
            // Do not remove any popover in process of loading
            if (div.popoverisloading) return;
            let timeoutID;
            const fadeOutDiv = function () {
                clearTimeout(timeoutID);
                // Do not close any div which is being hovered
                if (!div.matches(':hover')) {
                    closePopover(div);
                } else {
                    timeoutID = setTimeout(fadeOutDiv, 250);
                }
            };
            timeoutID = setTimeout(fadeOutDiv, 0);
        });
    }, 400);
}

/**
 * Closes the specified popover div, with fadeout effect, and removes it from the DOM
 * @param {Element} div The div to close
 */
function closePopover (div) {
    div.style.opacity = '0';
    // Timeout allows the animation to complete before removing the div
    setTimeout(function () {
        if (div && div.parentElement) {
            div.parentElement.removeChild(div);
        }
    }, 200);
};

/**
 * Functions and classes exposed by this module
 */
export default {
    attachKiwixPopoverCss: attachKiwixPopoverCss,
    populateKiwixPopoverDiv: populateKiwixPopoverDiv,
    removeKiwixPopoverDivs: removeKiwixPopoverDivs
};
