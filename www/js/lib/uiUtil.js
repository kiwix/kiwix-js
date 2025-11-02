/**
 * uiUtil.js : Utility functions for the User Interface
 *
 * Copyright 2013-2024 Mossroy, Jaifroid and contributors
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

/* global webpMachine, webpHero, params */

import util from './util.js';
import settingsStore from './settingsStore.js';
import translateUI from './translateUI.js';

// Placeholders for the article container and the article window
const header = document.getElementById('top');
const footer = document.getElementById('footer');
const activeContent = document.getElementById('activeContent');
let articleContainer = document.getElementById('articleContent');

/**
 * Hides slide-away UI elements
 */
function hideSlidingUIElements () {
    const articleContainer = document.getElementById('articleContent');
    const articleElement = document.querySelector('article');
    const footerStyles = getComputedStyle(footer);
    const footerHeight = parseFloat(footerStyles.height) + parseFloat(footerStyles.marginTop) - 2;
    const headerStyles = getComputedStyle(header);
    const headerHeight = parseFloat(headerStyles.height) + parseFloat(headerStyles.marginBottom) + 8;
    const iframeHeight = parseFloat(articleElement.style.height.replace('px', ''));
    footer.style.transform = 'translateY(' + footerHeight + 'px)';
    articleContainer.style.height = iframeHeight + headerHeight + 'px';
    header.style.transform = 'translateY(-' + headerHeight + 'px)';
    articleElement.style.transform = 'translateY(-' + headerHeight + 'px)';
    hideActiveContentWarning();
}

/**
 * Restores slide-away UI elements
 */
function showSlidingUIElements () {
    const articleContainer = document.getElementById('articleContent');
    const articleElement = document.querySelector('article');
    const headerStyles = getComputedStyle(document.getElementById('top'));
    const headerHeight = parseFloat(headerStyles.height) + parseFloat(headerStyles.marginBottom) - 2;
    header.style.transform = 'translateY(0)';
    // Needed for Windows Mobile to prevent header disappearing beneath iframe
    articleElement.style.transform = 'translateY(-1px)';
    footer.style.transform = 'translateY(0)';
    articleElement.style.height = window.innerHeight - headerHeight + 'px';
    articleContainer.style.height = window.innerHeight - headerHeight + 'px';
}

let scrollThrottle = false;

/**
 * Luuncher for the slide-away function, including a throttle to prevent it being called too often
 */
function scroller (e) {
    // We have to refresh the articleContainer when the window changes
    articleContainer = document.getElementById('articleContent');
    // Get the replay_iframe if it exists
    if (articleContainer.contentWindow && articleContainer.contentWindow.document && articleContainer.contentWindow.document.getElementById('replay_iframe')) {
        articleContainer = articleContainer.contentWindow.document.getElementById('replay_iframe');
    }
    if (scrollThrottle) return;
    // windowIsScrollable gets set and reset in slideAway()
    if (windowIsScrollable && e.type === 'wheel') return;
    const newScrollY = articleContainer.contentWindow.pageYOffset;
    // If it's a non-scroll event and we're actually scrolling, get out of the way and let the scroll event handle it
    if ((/^touch|^wheel|^keydown/.test(e.type)) && newScrollY !== oldScrollY) {
        oldScrollY = newScrollY;
        return;
    }
    if (e.type === 'touchstart') {
        oldTouchY = e.touches[0].screenY;
        return;
    }
    scrollThrottle = true;
    // Call the main function
    slideAway(e);
    // Set timeouts for the throttle
    let timeout = 250;
    if (/^touch|^keydown/.test(e.type)) {
        scrollThrottle = false;
        return;
    } else if (e.type === 'wheel' && Math.abs(e.deltaY) > 6) {
        timeout = 1200;
    }
    setTimeout(function () {
        scrollThrottle = false;
    }, timeout);
};

// Edge Legacy requires setting the z-index of the header to prevent it disappearing beneath the iframe
if ('MSBlobBuilder' in window) {
    header.style.position = 'relative';
    header.style.zIndex = 1;
}

let oldScrollY = 0;
let oldTouchY = 0;
let timeoutResetScrollable;
let windowIsScrollable = false;

// Slides away or restores the header and footer
function slideAway (e) {
    const newScrollY = articleContainer.contentWindow.pageYOffset;
    let delta;
    const visibleState = /\(0p?x?\)/.test(header.style.transform);
    // If the search field is focused and elements are not showing, do not slide away
    if (document.activeElement === document.getElementById('prefix')) {
        if (!visibleState) showSlidingUIElements();
    } else if (e.type === 'scroll') {
        windowIsScrollable = true;
        if (newScrollY === oldScrollY) return;
        if (newScrollY < oldScrollY) {
            showSlidingUIElements();
        } else if (newScrollY - oldScrollY > 50 && /\(0p?x?\)/.test(header.style.transform)) {
            // Hide the toolbars if user has scrolled and not already hidden
            hideSlidingUIElements();
        }
        oldScrollY = newScrollY;
        // Debounces the scroll at end of page
        const resetScrollable = function () {
            windowIsScrollable = false;
        };
        clearTimeout(timeoutResetScrollable);
        timeoutResetScrollable = setTimeout(resetScrollable, 3000);
    } else {
        let hideOrShow = visibleState ? hideSlidingUIElements : showSlidingUIElements;
        if (newScrollY === 0 && windowIsScrollable) {
            // If we are at the top of a scrollable page, always restore the UI elements
            hideOrShow = showSlidingUIElements;
        }
        if (e.type === 'touchend') {
            delta = Math.abs(oldTouchY - e.changedTouches[0].screenY);
            if (delta > 50) {
                hideOrShow();
            }
        } else if (e.type === 'wheel') {
            delta = Math.abs(e.deltaY);
            if (delta > 6) {
                hideOrShow();
            }
        } else if (e.type === 'keydown') {
            // IE11 produces Up and Down instead of ArrowUp and ArrowDown
            if ((e.ctrlKey || e.metaKey) && /^(Arrow)?(Up|Down)$/.test(e.key)) {
                hideOrShow();
            }
        }
        // DEBUG for non-scrolling events events
        // console.debug('eventType: ' + e.type + ' oldScrollY: ' + oldScrollY + ' newScrollY: ' + newScrollY + ' windowIsScrollable: ' + windowIsScrollable);
    }
}

/**
 * Extracts a list of headings from an article and provides methods to interact with them.
 *
 * @class
 * @param {Document} articleDoc The document object of the article from which headings are to be extracted.
 */
function HeadingsTOC (articleDoc) {
    this.doc = articleDoc;
    this.headings = this.doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    this.getHeadingObjects = function () {
        const headings = [];
        for (let i = 0; i < this.headings.length; i++) {
            const element = this.headings[i];
            const obj = {};

            if (element.id) {
                obj.id = element.id;
            } else {
                // generating custom id if id attribute is not present in element
                const generatedId = element.textContent
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-');
                obj.id = 'pph-' + i + '-' + generatedId;
                element.id = obj.id; // to target the element
            }
            obj.index = i;
            obj.textContent = element.textContent;
            obj.tagName = element.tagName;
            headings.push(obj);
        }
        return headings;
    };
}

/**
    * Sets up table of contents (TOC) by extracting all headings from the article.
    * Adds click handlers to scroll to sections and highlight them.
    *
    * @returns {void}
*/
function setUpTOC () {
    const innerDoc = articleContainer ? (articleContainer.contentDocument || articleContainer.contentWindow.document) : null;

    if (!innerDoc) {
        console.warn('null articleContainer');
        return;
    }

    const tableOfContents = new HeadingsTOC(innerDoc);
    const headings = tableOfContents.getHeadingObjects();

    let dropupHtml = '';
    headings.forEach(function (heading) {
        if (/^h1$/i.test(heading.tagName)) {
            dropupHtml += '<li class="toc-item-h1" ><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
        } else if (/^h2$/i.test(heading.tagName)) {
            dropupHtml += '<li class="toc-item-h2" ><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
        } else if (/^h3$/i.test(heading.tagName)) {
            dropupHtml += '<li class="toc-item-h3" ><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
        } else if (/^h4$/i.test(heading.tagName)) {
            dropupHtml += '<li class="toc-item-h4" ><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
        }
        // Skip smaller headings (if there are any) to avoid making list too long
    });
    const ToCList = document.getElementById('ToCList');
    ToCList.style.maxHeight = ~~(window.innerHeight * 0.75) + 'px';
    ToCList.innerHTML = dropupHtml;
    Array.from(ToCList.getElementsByTagName('a'))
        .forEach(function (listElement) {
            listElement.addEventListener('click', function () {
                const sectionEle = innerDoc.getElementById(this.dataset.headingId)

                const sectionsToOpen = getParentSections(sectionEle); // get all parents which are 'section' or 'details'
                openSection(sectionsToOpen); // open all parents
                // why..? because if the section is inside a details element, it will be closed by default

                sectionEle.scrollIntoView();

                // highlighting the section
                sectionEle.style.backgroundColor = '#bdd1e5';
                setTimeout(function () {
                    sectionEle.style.backgroundColor = '';
                }, 2000);
                sectionEle.style.transition = 'background-color 300ms ease-out';
            }
        );
    });
}

// Event listeners to handle interactions with dropup button and TOCList
document.addEventListener('DOMContentLoaded', function () {
    const dropup = document.getElementById('dropup');
    dropup.setAttribute('tabindex', '0'); // dropup focusable with the keyboard
    const ToCList = document.getElementById('ToCList');

    // to close TOC when clicking inside the iframe
    const onContainerLoad = function () {
        const innerDoc = articleContainer.contentDocument || articleContainer.contentWindow.document;
        innerDoc.addEventListener('click', function () {
            closeTOC();
        });
    };
    articleContainer.removeEventListener('load', onContainerLoad);
    articleContainer.addEventListener('load', onContainerLoad);

    // to close toc when user clicks outside of it
    const documentClickHandler = function (event) {
        if (!dropup.contains(event.target) && !ToCList.contains(event.target)) {
            closeTOC();
        }
    }
    document.removeEventListener('click', documentClickHandler);
    document.addEventListener('click', documentClickHandler);

    // handling clicks on dropup separately
    const dropupClickHandler = function () {
        const isVisible = getComputedStyle(ToCList).display !== 'none';
        if (isVisible) {
            ToCList.style.display = 'none';
        } else {
            setUpTOC();
            ToCList.style.display = 'flex';
            ToCList.style.flexDirection = 'column';
        }
    };
    dropup.removeEventListener('click', dropupClickHandler);
    dropup.addEventListener('click', dropupClickHandler);
});

function closeTOC () {
    console.log('pp closeTOC called')
    const ToCList = document.getElementById('ToCList');
    ToCList.style.display = 'none';
}

// get all parent elements which are 'section' or 'details'
function getParentSections (element) {
    const parents = [];
    let currentElement = element;
    while (currentElement) {
        if (/section|details/i.test(currentElement.tagName)) {
            parents.push(currentElement);
        }
        currentElement = currentElement.parentElement;
    }
    return parents;
};

// Function to open a specific section and all its parent sections
function openSection (sectionsToOpen) {
    if (!sectionsToOpen) return;
    sectionsToOpen.forEach(section => {
        if (section.tagName === 'DETAILS') {
            section.setAttribute('open', '');
        } else if (section.tagName === 'SECTION') {
            section.style.display = '';
            Array.from(section.children).forEach(child => {
                if (!/SUMMARY|H\d/.test(child.tagName)) {
                    child.style.display = '';
                }
            });
        }
    });
};

/**
 * Displays a Bootstrap alert or confirm dialog box depending on the options provided
 *
 * @param {String} message The alert message(can be formatted using HTML) to display in the body of the modal.
 * @param {String} label The modal's label or title which appears in the header (optional, Default = "Confirmation" or "Message")
 * @param {Boolean} isConfirm If true, the modal will be a confirm dialog box, otherwise it will be a simple alert message
 * @param {String} declineConfirmLabel The text to display on the decline confirmation button (optional, Default = "Cancel")
 * @param {String} approveConfirmLabel  The text to display on the approve confirmation button (optional, Default = "Confirm")
 * @param {String} closeMessageLabel  The text to display on the close alert message button (optional, Default = "Okay")
 * @param {String} hideOptionLabel  The text to display on the hide option button (optional, Default = "Don't ask again")
 * @param {Boolean} displayHideOption If true, option to permanently hide the modal will be shown (currently only implemented for hideExternalLinkWarning)
 * @returns {Promise<Boolean>} A promise which resolves to true if the user clicked Confirm, false if the user clicked Cancel/Okay, backdrop or the cross(x) button
 */
function systemAlert (message, label, isConfirm, declineConfirmLabel, approveConfirmLabel, closeMessageLabel, hideOptionLabel, displayHideOption) {
    declineConfirmLabel = declineConfirmLabel || (translateUI.t('dialog-cancel') || 'Cancel');
    approveConfirmLabel = approveConfirmLabel || (translateUI.t('dialog-confirm') || 'Confirm');
    closeMessageLabel = closeMessageLabel || (translateUI.t('dialog-ok') || 'Okay');
    hideOptionLabel = hideOptionLabel || (translateUI.t('dialog-hide') || "Don't ask again");
    displayHideOption = displayHideOption || false;
    label = label || (isConfirm ? 'Confirmation' : 'Message');
    return util.PromiseQueue.enqueue(function () {
        return new Promise(function (resolve, reject) {
            if (!message) reject(new Error('Missing body message'));
            // Set the text to the modal and its buttons
            document.getElementById('approveConfirm').textContent = approveConfirmLabel;
            document.getElementById('declineConfirm').textContent = declineConfirmLabel;
            document.getElementById('closeMessage').textContent = closeMessageLabel;
            document.getElementById('hideOption').textContent = hideOptionLabel;
            // Some titles need &nbsp; or other HTML, so we have to use innerHTML
            document.getElementById('modalLabel').innerHTML = label;
            // Using innerHTML to set the message to allow HTML formatting
            document.getElementById('modalText').innerHTML = message;
            // Display buttons acc to the type of alert
            document.getElementById('approveConfirm').style.display = isConfirm ? 'inline' : 'none';
            document.getElementById('declineConfirm').style.display = isConfirm ? 'inline' : 'none';
            document.getElementById('closeMessage').style.display = isConfirm ? 'none' : 'inline';
            document.getElementById('hideOption').style.display = displayHideOption ? 'inline' : 'none';
            // Display the modal
            const modal = document.querySelector('#alertModal');
            const backdrop = document.createElement('div');
            backdrop.classList.add('modal-backdrop');
            document.body.appendChild(backdrop);

            // Show the modal
            document.body.classList.add('modal-open');
            modal.classList.add('show');
            modal.style.display = 'block';
            backdrop.classList.add('show');

            // Set the ARIA attributes for the modal
            modal.setAttribute('aria-hidden', 'false');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('role', 'dialog');

            // Hide modal handlers
            var closeModalHandler = function () {
                document.body.classList.remove('modal-open');
                modal.classList.remove('show');
                modal.style.display = 'none';
                backdrop.classList.remove('show');
                if (Array.from(document.body.children).indexOf(backdrop) >= 0) {
                    document.body.removeChild(backdrop);
                }
                // remove event listeners
                document.getElementById('modalCloseBtn').removeEventListener('click', close);
                document.getElementById('declineConfirm').removeEventListener('click', close);
                document.getElementById('closeMessage').removeEventListener('click', close);
                document.getElementById('approveConfirm').removeEventListener('click', closeConfirm);
                document.getElementById('hideOption').removeEventListener('click', hideConfirm);
                modal.removeEventListener('click', close);
                document.getElementsByClassName('modal-dialog')[0].removeEventListener('click', stopOutsideModalClick);
                modal.removeEventListener('keyup', keyHandler);
            };

            // function to call when modal is closed
            var close = function () {
                closeModalHandler();
                resolve(false);
            };
            var closeConfirm = function () {
                closeModalHandler();
                resolve(true);
            };
            var hideConfirm = function () {
                document.getElementById('hideExternalLinkWarningCheck').click();
                closeModalHandler();
                resolve(true);
            };
            var stopOutsideModalClick = function (e) {
                e.stopPropagation();
            };
            var keyHandler = function (e) {
                if (/Enter/.test(e.key)) {
                    // We need to focus before clicking the button, because the handler above is based on document.activeElement
                    if (isConfirm) {
                        document.getElementById('approveConfirm').focus();
                        document.getElementById('approveConfirm').click();
                    } else {
                        document.getElementById('closeMessage').focus();
                        document.getElementById('closeMessage').click();
                    }
                } else if (/Esc/.test(e.key)) {
                    document.getElementById('modalCloseBtn').focus();
                    document.getElementById('modalCloseBtn').click();
                }
            };

            // When hide modal is called, resolve promise with true if hidden using approve button, false otherwise
            document.getElementById('modalCloseBtn').addEventListener('click', close);
            document.getElementById('declineConfirm').addEventListener('click', close);
            document.getElementById('closeMessage').addEventListener('click', close);
            document.getElementById('approveConfirm').addEventListener('click', closeConfirm);
            document.getElementById('hideOption').addEventListener('click', hideConfirm);

            modal.addEventListener('click', close);
            document.getElementsByClassName('modal-dialog')[0].addEventListener('click', stopOutsideModalClick);

            modal.addEventListener('keyup', keyHandler);
            // Set focus to the first focusable element inside the modal
            modal.focus();
        });
    });
}

/**
 * Creates a data: URI from the given content
 * The given attribute of the DOM node (nodeAttribute) is then set to this URI
 *
 * This is used to inject images (and other dependencies) into the article DOM
 *
 * @param {Object} node The node to which the URI should be added
 * @param {String} nodeAttribute The attribute to set to the URI
 * @param {Uint8Array} content The binary content to convert to a URI
 * @param {String} mimeType The MIME type of the content
 * @param {Function} callback An optional function to call to start processing the next item
 */
function feedNodeWithDataURI (node, nodeAttribute, content, mimeType, callback) {
    // Decode WebP data if the browser does not support WebP and the mimeType is webp
    if (webpMachine && /image\/webp/i.test(mimeType)) {
        // If we're dealing with a dataURI, first convert to Uint8Array
        if (/^data:/i.test(content)) {
            content = util.dataURItoUint8Array(content);
        }
        // DEV: Note that webpMachine is single threaded and will reject an image if it is busy
        // However, the loadImagesJQuery() function in app.js is sequential (it waits for a callback
        // before processing another image) so we do not need to queue WebP images here
        var canvas = document.createElement('canvas');
        webpMachine.decodeToCanvas(canvas, content).then(function () {
            if (callback) callback(); // Calling back as soon as possible speeds up extraction
            if (params.useCanvasElementsForWebpTranscoding) {
                // Replace images by canvas. This is necessary for some browsers with obsolete anti-fingerprinting protection, like IceCat 60.7
                webpMachine.constructor.replaceImageWithCanvas(node, canvas);
            } else {
                // For standard browsers that have access to the canvas, we simply convert the canvas to a data URI
                node.setAttribute(nodeAttribute, canvas.toDataURL());
            }
        }).catch(function (err) {
            console.error('There was an error decoding image in WebpMachine', err);
            if (callback) callback();
        });
    } else {
        if (callback) callback(); // Calling back as soon as possible speeds up extraction
        // In browsers that support WebP natively, or for non-WebP images, we can simply convert the Uint8Array to a data URI
        getDataUriFromUint8Array(content, mimeType).then(function (dataUri) {
            node.setAttribute(nodeAttribute, dataUri);
        }).catch(function (err) {
            console.error('There was an error converting Uint8Array to data URI', err);
        });
    }
}

/**
 * Creates a data: URI from the given content
 * @param {Uint8Array} content The binary content to convert to a URI
 * @param {String} mimeType The MIME type of the content
 * @returns {Promise<String>} A promise that resolves to the data URI
 */
function getDataUriFromUint8Array (content, mimeType) {
    // Use FileReader method because btoa fails on utf8 strings (in SVGs, for example)
    // See https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
    // This native browser method is very fast: see https://stackoverflow.com/a/66046176/9727685
    return new Promise((resolve, reject) => {
        var myReader = new FileReader();
        myReader.onloadend = function () {
            var url = myReader.result;
            resolve(url);
        };
        myReader.onerror = function (err) {
            reject(err);
        };
        myReader.readAsDataURL(new Blob([content], { type: mimeType }));
    });
}

/**
 * Determines whether the Canvas Elements Workaround for decoding WebP images is needed, and sets UI accordingly.
 * This also sets a global app parameter (useCanvasElementsForWebpTranscoding) that determines whether the workaround will be used in jQuery mode.
 * Note that the workaround will never be used in Service Worker mode, but we still need to determine it in case the user switches modes.
 * @returns {Boolean} A value to indicate the browser's capability (whether it requires the workaround or not)
 */
function determineCanvasElementsWorkaround () {
    var userPreference = settingsStore.getItem('useCanvasElementsForWebpTranscoding') !== 'false';
    // Determine whether the browser is able to read canvas data correctly
    var browserRequiresWorkaround = webpMachine && webpHero && !webpHero.detectCanvasReadingSupport();
    console.debug('Determination for canvas elements workaround with WebP transcoding is: ' + browserRequiresWorkaround);
    // Hide the UI for this feature (we'll display it below if needed)
    var imgHandlingModeDiv = document.getElementById('imgHandlingModeDiv');
    var useCanvasElementsCheck = document.getElementById('useCanvasElementsCheck');
    imgHandlingModeDiv.style.display = 'none';
    useCanvasElementsCheck.checked = false;
    if (browserRequiresWorkaround && params.contentInjectionMode === 'jquery') {
        // The feature is required, so display the UI
        imgHandlingModeDiv.style.display = 'block';
        useCanvasElementsCheck.checked = userPreference;
    }
    params.useCanvasElementsForWebpTranscoding = browserRequiresWorkaround ? userPreference : false;
    // Return the determined browser capability (which may be different from the user's preference) in case caller wants this
    return browserRequiresWorkaround;
}

/**
 * Replace the given CSS link (from the DOM) with an inline CSS of the given content
 *
 * Due to CSP, Firefox OS does not accept <link> syntax with href="data:text/css..." or href="blob:..."
 * So we replace the tag with a <style type="text/css">...</style>
 * while copying some attributes of the original tag
 * Cf http://jonraasch.com/blog/javascript-style-node
 *
 * @param {Element} link The original link node from the DOM
 * @param {String} cssContent The content to insert as an inline stylesheet
 * @param {String} id An optional id to add to the style element
 */
function replaceCSSLinkWithInlineCSS (link, cssContent, id) {
    var cssElement = document.createElement('style');
    if (id) {
        cssElement.id = id;
    }
    cssElement.type = 'text/css'; // Still needed for FFOS
    if (cssElement.styleSheet) {
        cssElement.styleSheet.cssText = cssContent;
    } else {
        cssElement.appendChild(document.createTextNode(cssContent));
    }
    var mediaAttributeValue = link.getAttribute('media');
    if (mediaAttributeValue) {
        cssElement.media = mediaAttributeValue;
    }
    var disabledAttributeValue = link.getAttribute('disabled');
    if (disabledAttributeValue) {
        cssElement.disabled = disabledAttributeValue;
    }
    link.parentNode.replaceChild(cssElement, link);
}

/**
 * Removes parameters and anchors from a URL
 * @param {type} url The URL to be processed
 * @returns {String} The same URL without its parameters and anchors
 */
function removeUrlParameters (url) {
    // Remove any querystring
    var strippedUrl = url.replace(/\?[^?]*$/, '');
    // Remove any anchor parameters - note that we are deliberately excluding entity references, e.g. '&#39;'.
    strippedUrl = strippedUrl.replace(/#[^#;]*$/, '');
    return strippedUrl;
}

/**
 * Derives the URL.pathname from a relative or semi-relative URL using the given base ZIM URL
 *
 * @param {String} url The (URI-encoded) URL to convert (e.g. "Einstein", "../Einstein",
 *      "../../I/im%C3%A1gen.png", "-/s/style.css", "/A/Einstein.html", "../static/bootstrap/css/bootstrap.min.css")
 * @param {String} base The base ZIM URL of the currently loaded article (e.g. "A/", "A/subdir1/subdir2/", "C/Singapore/")
 * @returns {String} The derived ZIM URL in decoded form (e.g. "A/Einstein", "I/imágen.png", "C/")
 */
function deriveZimUrlFromRelativeUrl (url, base) {
    // We use a dummy domain because URL API requires a valid URI
    var dummy = 'http://d/';
    var deriveZimUrl = function (url, base) {
        if (typeof URL === 'function') return new URL(url, base);
        // IE11 lacks URL API: workaround adapted from https://stackoverflow.com/a/28183162/9727685
        var d = document.implementation.createHTMLDocument('t');
        // innerHTML required as string contains HTML tags
        d.head.innerHTML = '<base href="' + base + '">';
        var a = d.createElement('a');
        a.href = url;
        return { pathname: a.href.replace(dummy, '') };
    };
    var zimUrl = deriveZimUrl(url, dummy + base);
    return decodeURIComponent(zimUrl.pathname.replace(/^\//, ''));
}

/**
 * Displays a Bootstrap warning alert with information about how to access content in a ZIM with unsupported active UI
 */
var activeContentWarningSetup = false;
function displayActiveContentWarning (mode) {
    // Adapt the text for other modes (e.g., ServiceWorkerLocal)
    if (mode) {
        activeContent.innerHTML = activeContent.innerHTML.replace(translateUI.t('alert-activecontentwarning-restrictedmode') || 'Restricted', mode);
        // We have to set up event listeners again
        activeContentWarningSetup = false;
    }
    activeContent.style.display = '';
    if (!activeContentWarningSetup) {
        // We are setting up the active content warning for the first time
        activeContentWarningSetup = true;
        activeContent.querySelector('button[data-hide]').addEventListener('click', function () {
            hideActiveContentWarning();
        });
        ['swModeLink', 'stop'].forEach(function (id) {
            // Define event listeners for both hyperlinks in alert box: these take the user to the Config tab and highlight
            // the options that the user needs to select
            document.getElementById(id).addEventListener('click', function () {
                var elementID = id === 'stop' ? 'hideActiveContentWarningCheck' : 'serviceworkerModeRadio';
                var thisLabel = document.getElementById(elementID).parentNode;
                thisLabel.style.borderColor = 'red';
                thisLabel.style.borderStyle = 'solid';
                var btnHome = document.getElementById('btnHome');
                [thisLabel, btnHome].forEach(function (ele) {
                    // Define event listeners to cancel the highlighting both on the highlighted element and on the Home tab
                    ele.addEventListener('mousedown', function () {
                        thisLabel.style.borderColor = '';
                        thisLabel.style.borderStyle = '';
                    });
                });
                var anchor = this.getAttribute('href');
                document.getElementById('btnConfigure').click();
                // We have to use a timeout or the scroll is cancelled by the slide transtion animation
                // @TODO This is a workaround. The regression should be fixed as it affects the aboutLinks as well
                setTimeout(function () {
                    document.querySelector(anchor).scrollIntoView();
                }, 600);
            });
        });
    }
}

/**
 * Hides the active content warning alert box with a fade-out effect
 */
function hideActiveContentWarning () {
    const alertBoxHeader = document.getElementById('alertBoxHeader');
    if (activeContent.style.display === 'none') return;
    alertBoxHeader.style.opacity = 0;
    alertBoxHeader.style.maxHeight = 0;
    setTimeout(function () {
        activeContent.style.display = 'none';
        alertBoxHeader.style.opacity = 1;
        alertBoxHeader.style.maxHeight = '';
    }, 500);
}

/**
 * Displays a Bootstrap alert box at the foot of the page to enable saving the content of the given title to the device's filesystem
 * and initiates download/save process if this is supported by the OS or Browser
 *
 * @param {String} title The path and filename to the file to be extracted
 * @param {Boolean|String} download A Bolean value that will trigger download of title, or the filename that should
 *     be used to save the file in local FS
 * @param {String} contentType The mimetype of the downloadable file, if known
 * @param {Uint8Array} content The binary-format content of the downloadable file
 */
var downloadAlertSetup = false;
function displayFileDownloadAlert (title, download, contentType, content) {
    var downloadAlert = document.getElementById('downloadAlert');
    downloadAlert.style.display = 'block';
    if (!downloadAlertSetup) {
        downloadAlert.querySelector('button[data-hide]').addEventListener('click', function () {
            // We are setting up the alert for the first time
            downloadAlert.style.display = 'none';
        });
    }
    downloadAlertSetup = true;
    // Download code adapted from https://stackoverflow.com/a/19230668/9727685
    // Set default contentType if none was provided
    if (!contentType) contentType = 'application/octet-stream';
    var a = document.createElement('a');
    var blob = new Blob([content], { type: contentType });
    // If the filename to use for saving has not been specified, construct it from title
    var filename = download === true ? title.replace(/^.*\/([^/]+)$/, '$1') : download;
    // Make filename safe
    filename = filename.replace(/[/\\:*?"<>|]/g, '_');
    a.href = window.URL.createObjectURL(blob);
    a.target = '_blank';
    a.type = contentType;
    a.download = filename;
    a.classList.add('alert-link');
    a.textContent = filename;
    var alertMessage = document.getElementById('alertMessage');
    // innerHTML required as it has HTML tags
    alertMessage.innerHTML = (translateUI.t('alert-download-message') || '<strong>Download</strong> If the download does not begin, please tap the following link:') + ' ';
    // We have to add the anchor to a UI element for Firefox to be able to click it programmatically: see https://stackoverflow.com/a/27280611/9727685
    alertMessage.appendChild(a);
    try {
        a.click();
    } catch (err) {
        // If the click fails, user may be able to download by manually clicking the link
        // But for IE11 we need to force use of the saveBlob method with the onclick event
        if (window.navigator && window.navigator.msSaveBlob) {
            a.addEventListener('click', function (e) {
                window.navigator.msSaveBlob(blob, filename);
                e.preventDefault();
            });
        } else {
            console.error('Error downloading file: ' + err);
        }
    }
    spinnerDisplay(false);
}

/**
 * Check for update of Service Worker (PWA) and display information to user
 */
var updateAlert = document.getElementById('updateAlert');
function checkUpdateStatus (appstate) {
    if ('serviceWorker' in navigator && !appstate.pwaUpdateNeeded) {
        settingsStore.getCacheNames(function (cacheNames) {
            if (cacheNames && !cacheNames.error) {
                // Store the cacheNames globally for use elsewhere
                params.cacheNames = cacheNames;
                caches.keys().then(function (keyList) {
                    updateAlert.style.display = 'none';
                    var cachePrefix = cacheNames.app.replace(/^([^\d]+).+/, '$1');
                    keyList.forEach(function (key) {
                        if (key === cacheNames.app || key === cacheNames.assets) return;
                        // Ignore any keys that do not begin with the appCache prefix (they could be from other apps using the same domain)
                        if (key.indexOf(cachePrefix)) return;
                        // If we get here, then there is a cache key that does not match our version, i.e. a PWA-in-waiting
                        appstate.pwaUpdateNeeded = true;
                        updateAlert.style.display = 'block';
                        document.getElementById('persistentMessage').textContent = (translateUI.t('alert-update-version') || 'Version') + ' ' + key.replace(cachePrefix, '') + ' ' +
                            (translateUI.t('alert-update-available') || 'is ready to install. (Re-launch app to install.)');
                    });
                });
            }
        });
    }
}
if (updateAlert) {
    updateAlert.querySelector('button[data-hide]').addEventListener('click', function () {
        updateAlert.style.display = 'none';
    });
}

/**
 * Checks if a server is accessible by attempting to load a test image from the server
 * @param {String} imageSrc The full URI of the image
 * @param {any} onSuccess A function to call if the image can be loaded
 * @param {any} onError A function to call if the image cannot be loaded
 */
function checkServerIsAccessible (imageSrc, onSuccess, onError) {
    var image = new Image();
    image.onload = onSuccess;
    image.onerror = onError;
    image.src = imageSrc;
}

/**
 * Show or hide the spinner together with a message
 * @param {Boolean} show True to show the spinner, false to hide it
 * @param {String} message A message to display, or hide the message if null
 */
function spinnerDisplay (show, message) {
    var searchingArticles = document.getElementById('searchingArticles');
    var spinnerMessage = document.getElementById('cachingAssets');
    if (show) searchingArticles.style.display = 'block';
    else searchingArticles.style.display = 'none';
    if (message) {
        spinnerMessage.textContent = message;
        spinnerMessage.style.display = 'block';
    } else {
        spinnerMessage.textContent = translateUI.t('spinner-caching-assets') || 'Caching assets...';
        spinnerMessage.style.display = 'none';
    }
}

/**
 * Checks whether an element is partially or fully inside the current viewport
 *
 * @param {Element} el The DOM element for which to check visibility
 * @param {Boolean} fully If true, checks that the entire element is inside the viewport;
 *          if false, checks whether any part of the element is inside the viewport
 * @returns {Boolean} True if the element is fully or partially (depending on the value of <fully>)
 *          inside the current viewport
 */
function isElementInView (el, fully) {
    var rect = el.getBoundingClientRect();
    if (fully) {
        return rect.top > 0 && rect.bottom < window.innerHeight && rect.left > 0 && rect.right < window.innerWidth;
    } else {
        return rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
    }
}

/**
 * Show elements in bulk (using display: '')
 *
 * @param {Array<HTMLElement>} elements It takes the name of the section to which the animation is to be added
 * @example showElements(element1, element2, element3)
 * @returns {void}
*/
function showElements (...elements) {
    for (const element of elements) {
        if (element) element.style.display = '';
    }
}

/**
 * Hide elements in bulk (using display: none)
 *
 * @param {Array<HTMLElement>} elements Any element that you want to be hidden
 * @example hideElements(element1, element2, element3)
 * @returns {void}
*/
function hideElements (...elements) {
    for (const element of elements) {
        if (element) element.style.display = 'none';
    }
}

/**
 * Removes the animation classes that are added by the slide animation in previous transition
 * @returns {void}
 */
function removeAnimationClasses () {
    const config = document.getElementById('configuration');
    const about = document.getElementById('about');
    const home = document.getElementById('articleContent');
    const library = document.getElementById('library');

    const tabs = [config, about, home, library]
    tabs.forEach(tab => {
        tab.classList.remove('slideIn_L');
        tab.classList.remove('slideIn_R');
        tab.classList.remove('slideOut_L');
        tab.classList.remove('slideOut_R');
    });
}

/**
 * Adds the slide animation between different sections
 *
 * @param {HTMLElement} sectionToShow Element which is gonna be slide in from left (show)
 * @param {HTMLElement} sectionToHide Element which is gonna be slide to the left (hide)
 * @returns {void}
 */
function slideToLeft (sectionToShow, sectionToHide) {
    sectionToShow.classList.add('slideIn_L');
    setTimeout(function () {
        sectionToShow.style.display = '';
        // sectionToShow.classList.remove('slideIn_L');
    }, 300);

    sectionToHide.classList.add('slideOut_L');
    setTimeout(function () {
        sectionToHide.style.display = 'none';
        // sectionToHide.classList.remove('slideOut_L');
    }, 300);
}

/**
 * Adds the slide animation between different sections
 *
 * @param {HTMLElement} sectionToShow Element which is gonna be slide in from right (show)
 * @param {HTMLElement} sectionToHide Element which is gonna be slide to the right (hide)
 * @returns {void}
 */
function slideToRight (sectionToShow, sectionToHide) {
    sectionToHide.classList.add('slideOut_R');
    setTimeout(function () {
        sectionToHide.style.display = 'none';
        // sectionToHide.classList.remove('slideOut_R');
    }, 300);

    sectionToShow.classList.add('slideIn_R');
    setTimeout(function () {
        sectionToShow.style.display = '';
        // sectionToShow.classList.remove('slideIn_R');
    }, 300);
}

/**
 * Returns the name of the section which is currently visible
 * @returns {String} The name of the section which is currently visible
 */
function fromSection () {
    const isConfigPageVisible = document.getElementById('configuration').style.display !== 'none';
    const isAboutPageVisible = document.getElementById('about').style.display !== 'none';
    const isArticlePageVisible = document.getElementById('articleContent').style.display !== 'none';
    const isLibraryPageVisible = document.getElementById('library').style.display !== 'none';
    if (isConfigPageVisible) return 'config';
    if (isLibraryPageVisible) return 'library';
    else if (isAboutPageVisible) return 'about';
    else if (isArticlePageVisible) return 'home';
}

/**
 * Adds the slide animation between different sections
 *
 * @param {String} toSection It takes the name of the section to which the animation is to be added
 * @param {Boolean} isAnimationRequired To enable or disable the animation
 * @returns {void}
 */
function tabTransitionToSection (toSection, isAnimationRequired = false) {
    // all the references of the sections/tabs
    const config = document.getElementById('configuration');
    const about = document.getElementById('about');
    const library = document.getElementById('library');
    const home = document.getElementById('articleContent');

    // references of extra elements that are in UI but not tabs
    // prefix with extra to avoid confusion and easy identification
    const extraNavBtns = document.getElementById('navigationButtons');
    const extraArticleSearch = document.getElementById('formArticleSearch');
    const extraWelcomeText = document.getElementById('welcomeText');
    const extraSearchingArticles = document.getElementById('searchingArticles');
    const extraKiwixAlert = document.getElementById('kiwix-alert');

    // removing any classes that have been added by previous transition
    removeAnimationClasses()
    const from = fromSection();

    if (isAnimationRequired) {
        if (toSection === 'home') {
            if (from === 'config') slideToRight(home, config);
            if (from === 'about') slideToRight(home, about);
            if (from === 'library') slideToRight(home, library);

            showElements(extraNavBtns, extraArticleSearch, extraWelcomeText, extraKiwixAlert);
        } else if (toSection === 'config') {
            if (from === 'about') slideToRight(config, about);
            if (from === 'library') slideToRight(config, library);
            if (from === 'home') slideToLeft(config, home);

            hideElements(extraNavBtns, extraArticleSearch, extraWelcomeText, extraSearchingArticles, extraKiwixAlert);
        } else if (toSection === 'about') {
            if (from === 'library') slideToRight(about, library);
            if (from === 'home') slideToLeft(about, home);
            if (from === 'config') slideToLeft(about, config);

            hideElements(extraNavBtns, extraArticleSearch, extraWelcomeText, extraSearchingArticles, extraKiwixAlert);
        } else if (toSection === 'library') {
            // it will be always coming from config page
            slideToLeft(library, config);
            hideElements(extraNavBtns, extraArticleSearch, extraWelcomeText, extraSearchingArticles, extraKiwixAlert);
        }
    } else {
        if (toSection === 'home') {
            hideElements(config, about, library);
            showElements(home, extraNavBtns, extraArticleSearch, extraWelcomeText);
        }
        if (toSection === 'config') {
            hideElements(about, home, library, extraNavBtns, extraArticleSearch, extraWelcomeText, extraSearchingArticles, extraKiwixAlert);
            showElements(config);
        }
        if (toSection === 'about') {
            hideElements(config, home, library);
            showElements(about);
        }
        if (toSection === 'library') {
            hideElements(config, about, home, extraNavBtns, extraArticleSearch, extraWelcomeText, extraSearchingArticles, extraKiwixAlert);
            showElements(library);
        }
    }
    // Remove any active content warning (as we will have slidden away, we don't need to use the fade out effect)
    activeContent.style.display = 'none';
}

/**
 * Applies the requested app and content theme
 *
 * A <theme> string consists of two parts, the appTheme (theme to apply to the app shell only), and an optional
 * contentTheme beginning with an underscore: e.g. 'dark_invert' = 'dark' (appTheme) + '_invert' (contentTheme)
 * Current themes are: light, dark, dark_invert, dark_mwInvert, dark_wikimediaNative, but code below is written for extensibility
 * For each appTheme (except the default 'light'), a corresponding set of rules must be present in app.css
 * For each contentTheme (except _wikimediaNative), a stylesheet must be provided in www/css that is named 'kiwixJS' + contentTheme
 * The _wikimediaNative theme is an exception: it uses the ZIM's built-in theme system via native CSS classes
 * A rule may additionally be needed in app.css for full implementation of contentTheme
 *
 * @param {String} theme The theme to apply (light|dark|auto[_invert|_mwInvert|_wikimediaNative])
 * @returns {String} The actual theme applied (may differ from requested theme if fallback occurred)
 */
function applyAppTheme (theme) {
    // Validate the theme parameter to prevent XSS
    // Only allow specific valid theme formats
    if (!theme.match(/^(light|dark|auto)(_invert|_mwInvert|_wikimediaNative)?$/)) {
        console.error('Invalid theme format:', theme);
        theme = 'light';
    }
    // Store the base theme (light/dark/auto) to reconstruct the final theme string if fallback occurs
    var baseTheme = theme.replace(/_.*$/, '');
    // Resolve the app theme from the matchMedia preference (for auto themes) or from the theme string
    var appTheme = isDarkTheme(theme) ? 'dark' : 'light';
    // Get contentTheme from chosen theme
    var contentTheme = theme.replace(/^[^_]*/, '');
    var requestedContentTheme = contentTheme; // Store original request for comparison
    // Fallback for _wikimediaNative: check if native theme is available, otherwise fall back
    if (contentTheme === '_wikimediaNative') {
        if (!params.isWikimediaZim) {
            // Not a Wikimedia ZIM at all, fall back to _invert
            contentTheme = '_invert';
        }
    }
    var htmlEl = document.querySelector('html');
    var footer = document.querySelector('footer');
    var oldTheme = htmlEl.dataset.theme || '';
    var iframe = document.getElementById('articleContent');
    const library = document.getElementById('libraryContent');
    var doc = iframe.contentDocument;
    var kiwixJSSheet = doc ? doc.getElementById('kiwixJSTheme') || null : null;
    var oldContentTheme = oldTheme.replace(/^[^_]*/, '');
    // Remove both possible app theme classes to ensure clean state
    // (The old theme might have been 'auto' which could have resolved to either 'dark' or 'light')
    htmlEl.classList.remove('dark', 'light');
    // A missing contentTheme implies _light
    footer.classList.remove(oldContentTheme || '_light');
    // Apply new appTheme (NB it will not be added twice if it's already there)
    // Note: 'light' is the default state, so we only add a class for 'dark'
    if (appTheme === 'dark') {
        htmlEl.classList.add('dark');
    }
    // We also add the contentTheme to the footer to avoid dark css rule being applied to footer when content
    // is not dark (but we want it applied when the content is dark or inverted)
    // For _wikimediaNative, apply appropriate footer class based on resolved appTheme
    var footerTheme = contentTheme;
    if (contentTheme === '_wikimediaNative') {
        footerTheme = appTheme === 'dark' ? '_mwInvert' : '_light';
    }
    footer.classList.add(footerTheme || '_light');
    // Safely handle help element IDs
    var safeOldContentTheme = oldContentTheme.replace(/[^a-zA-Z0-9-]/g, '');
    var safeContentTheme = contentTheme.replace(/[^a-zA-Z0-9-]/g, '');
    // Hide any previously displayed help
    var oldHelp = document.getElementById(safeOldContentTheme.replace(/_/, '') + '-help');
    if (oldHelp) oldHelp.style.display = 'none';
    // Show any specific help for selected contentTheme
    var help = document.getElementById(safeContentTheme.replace(/_/, '') + '-help');
    if (help) help.style.display = 'block';
    // Hide any previously displayed description for auto themes
    var oldDescription = document.getElementById('kiwix-auto-description');
    if (oldDescription) oldDescription.style.display = 'none';    
    // Safely handle description element IDs
    var safeThemeBase = theme.replace(/_.*$/, '').replace(/[^a-zA-Z0-9-]/g, '');    
    // Show description for auto themes
    var description = document.getElementById('kiwix-' + safeThemeBase + '-description');
    if (description) description.style.display = 'block';
    // If there is no ContentTheme or we are applying a different ContentTheme, remove any previously applied ContentTheme
    if (oldContentTheme && oldContentTheme !== contentTheme) {
        iframe.classList.remove(oldContentTheme);
        library.classList.remove(oldContentTheme);
        if (kiwixJSSheet) {
            kiwixJSSheet.disabled = true;
            kiwixJSSheet.parentNode.removeChild(kiwixJSSheet);
        }
        // Clean up native Wikimedia theme classes if we're switching away from _wikimediaNative
        if (oldContentTheme === '_wikimediaNative' && doc && doc.documentElement) {
            doc.documentElement.classList.remove('skin-theme-clientpref-night', 'skin-theme-clientpref-os', 'skin-theme-clientpref-day');
        }
    }
    // Handle native Wikimedia theme for _wikimediaNative content theme
    if (contentTheme === '_wikimediaNative') {
        // Remove any existing _wikimediaNative class from iframe/library (in case it was added before)
        if (iframe.classList.contains('_wikimediaNative')) {
            iframe.classList.remove('_wikimediaNative');
        }
        if (library.classList.contains('_wikimediaNative')) {
            library.classList.remove('_wikimediaNative');
        }
        if (doc && doc.documentElement) {
            var hasNativeTheme = detectNativeZIMThemeSupport(doc);
            if (hasNativeTheme) {
                // Remove any fallback theme classes that might have been applied on a previous article
                if (iframe.classList.contains('_mwInvert')) {
                    iframe.classList.remove('_mwInvert');
                }
                if (library.classList.contains('_mwInvert')) {
                    library.classList.remove('_mwInvert');
                }
                // Remove any fallback stylesheet that was injected
                if (kiwixJSSheet && kiwixJSSheet.href && kiwixJSSheet.href.includes('kiwixJS_mwInvert.css')) {
                    kiwixJSSheet.disabled = true;
                    kiwixJSSheet.parentNode.removeChild(kiwixJSSheet);
                }
                // Apply native Wikimedia theme classes
                applyNativeWikimediaTheme(doc, appTheme);
                // Do NOT add contentTheme class to iframe for native themes - the ZIM handles styling internally
                // We only track it in the app HTML element via dataset.theme
            } else {
                // Native theme not detected, fall back to _mwInvert (only if in dark mode)
                if (appTheme === 'dark') {
                    contentTheme = '_mwInvert';
                } else {
                    // Light mode: no content theme needed
                    contentTheme = null;
                }
                // Continue to apply _mwInvert or null below
            }
        } else {
            // No document available, fall back to _mwInvert (only if in dark mode)
            console.warn('[applyAppTheme] No document available! Falling back. appTheme:', appTheme);
            if (appTheme === 'dark') {
                contentTheme = '_mwInvert';
            } else {
                // Light mode: no content theme needed
                contentTheme = null;
            }
        }
    }

    // Handle plain light/dark themes on Wikimedia ZIMs (no content theme suffix)
    // Apply native theme classes if ZIM supports it, to override OS preference
    if (!contentTheme && params.isWikimediaZim && doc && doc.documentElement) {
        var zimHasNativeTheme = detectNativeZIMThemeSupport(doc);
        if (zimHasNativeTheme) {
            applyNativeWikimediaTheme(doc, appTheme);
        }
    }

    // Apply the requested ContentTheme (if not already attached) - skip for _wikimediaNative as it uses native classes
    if (contentTheme && contentTheme !== '_wikimediaNative' && (!kiwixJSSheet || !~kiwixJSSheet.href.search('kiwixJS' + contentTheme + '.css'))) {
        // Remove native Wikimedia theme classes if present, to prevent conflicts with invert themes
        if (doc && doc.documentElement) {
            doc.documentElement.classList.remove('skin-theme-clientpref-night', 'skin-theme-clientpref-os', 'skin-theme-clientpref-day');
        }
        iframe.classList.add(contentTheme);
        library.classList.add(contentTheme);
        // Use an absolute reference because Service Worker needs this (if an article loaded in SW mode is in a ZIM
        // subdirectory, then relative links injected into the article will not work as expected)
        // Note that location.pathname returns the path plus the filename, but is useful because it removes any query string
        var prefix = (window.location.protocol + '//' + window.location.host + window.location.pathname).replace(/\/[^/]*$/, '');
        if (doc) {
            var link = doc.createElement('link');
            link.setAttribute('id', 'kiwixJSTheme');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('type', 'text/css');
            var safeContentThemeForURL = contentTheme.replace(/[^a-zA-Z0-9_-]/g, '');
            var stylesheetPath = prefix + '/css/kiwixJS' + safeContentThemeForURL + '.css';
            link.setAttribute('href', stylesheetPath);
            doc.head.appendChild(link);
        } else {
            console.warn('[applyAppTheme] No doc available, cannot inject stylesheet for contentTheme:', contentTheme);
        }
    }
    // If we are in Config and a real document has been loaded already, expose return link so user can see the result of the change
    // DEV: The Placeholder string below matches the dummy article.html that is loaded before any articles are loaded
    if (document.getElementById('liConfigureNav').classList.contains('active') && doc &&
        // Check if the document contains a meta element with name="description"
        !(doc.querySelector('meta[content="Placeholder for injecting an article into the iframe or window"]'))) {
        showReturnLink();
    }
    // Return the actual theme applied (which may differ from the requested theme if fallback occurred)
    var actualTheme = appTheme + contentTheme;
    // Embed a reference to the ACTUAL applied theme (after fallbacks), so we can remove it generically in the future
    htmlEl.dataset.theme = actualTheme;
    // Log theme application details for developers (only visible with verbose logging)
    console.debug('[applyAppTheme] Requested:', theme, '| Applied:', actualTheme,
        '| Base:', baseTheme, '| App:', appTheme, '| Content:', contentTheme || 'none',
        '| Fallback:', requestedContentTheme !== contentTheme);
    return actualTheme;
}

// Helper function to apply native Wikimedia theme classes
function applyNativeWikimediaTheme(doc, appTheme) {
    if (appTheme === 'dark') {
        // Dark mode: force night theme
        if (!doc.documentElement.classList.contains('skin-theme-clientpref-night')) {
            doc.documentElement.classList.add('skin-theme-clientpref-night');
        }
        doc.documentElement.classList.remove('skin-theme-clientpref-os', 'skin-theme-clientpref-day');
    } else {
        // Light mode: remove all classes then explicitly set day theme
        doc.documentElement.classList.remove('skin-theme-clientpref-night', 'skin-theme-clientpref-os', 'skin-theme-clientpref-day');
        doc.documentElement.classList.add('skin-theme-clientpref-day');
    }
}

// Determines whether the user has requested a dark theme based on preference and browser settings
function isDarkTheme (theme) {
    return /^auto/.test(theme) ? !!window.matchMedia('(prefers-color-scheme:dark)').matches : theme.replace(/_.*$/, '') === 'dark';
}

// Displays the return link and handles click event. Called by applyAppTheme()
function showReturnLink () {
    var viewArticle = document.getElementById('viewArticle');
    viewArticle.style.display = 'block';
    viewArticle.addEventListener('click', returnToCurrentPage);
}

/**
 * Detects whether the currently loaded Wikimedia article uses Wikimedia's native automatic theme system
 * Each article is checked individually as support may vary between articles in the same ZIM
 * @param {Document} zimDocument The document of the currently loaded ZIM article
 * @returns {Boolean} True if the article has Wikimedia's native automatic theme system; false otherwise
 */
function detectNativeZIMThemeSupport (zimDocument) {
    var hasProvidedWikimediaTheme = false;
    if (params.isWikimediaZim) {
        var htmlElement = zimDocument ? zimDocument.documentElement : null;
        if (htmlElement) {
            // First check if we've already detected and marked this specific article
            if (htmlElement.hasAttribute('data-kiwix-has-skin-theme-clientpref')) {
                hasProvidedWikimediaTheme = htmlElement.getAttribute('data-kiwix-has-skin-theme-clientpref') === 'true';
            } else if (htmlElement.classList) {
                // Initial detection: check if the html element has one of the theme preference classes
                hasProvidedWikimediaTheme = htmlElement.classList.contains('skin-theme-clientpref-night') ||
                    htmlElement.classList.contains('skin-theme-clientpref-os');
                // Remember this detection for subsequent theme switches on the same article
                htmlElement.setAttribute('data-kiwix-has-skin-theme-clientpref', hasProvidedWikimediaTheme ? 'true' : 'false');
            }
        }
        return hasProvidedWikimediaTheme;
    }
    return false;
}

// Function to switch back to currently loaded page
function returnToCurrentPage () {
    document.getElementById('liConfigureNav').classList.remove('active');
    document.getElementById('liAboutNav').classList.remove('active');
    document.getElementById('liHomeNav').classList.add('active');
    document.getElementById('btnHome').focus();
    var navbarCollapse = document.querySelector('.navbar-collapse');
    navbarCollapse.classList.remove('show');
    tabTransitionToSection('home', params.showUIAnimations);
    const welcomeText = document.getElementById('welcomeText');
    welcomeText.style.display = 'none';
    document.getElementById('viewArticle').style.display = 'none';
}

// Reports an error in loading one of the ASM or WASM machines to the UI API Status Panel
// This can't be done in app.js because the error occurs after the API panel is first displayed
function reportAssemblerErrorToAPIStatusPanel (decoderType, error, assemblerMachineType) {
    console.error('Could not instantiate any ' + decoderType + ' decoder!', error);
    params.decompressorAPI.assemblerMachineType = assemblerMachineType;
    params.decompressorAPI.errorStatus = (translateUI.t('api-decompressor-error-loading-part1') || 'Error loading') + ' ' + decoderType + ' ' +
        (translateUI.t('api-decompressor-error-loading-part2') || 'decompressor!');
    var decompAPI = document.getElementById('decompressorAPIStatus');
    decompAPI.textContent = (translateUI.t('api-decompressor-label') || 'Decompressor API:') + ' ' + params.decompressorAPI.errorStatus;
    decompAPI.className = 'apiBroken';
    document.getElementById('apiStatusDiv').className = 'card card-danger';
}

// Reports the search provider to the API Status Panel
function reportSearchProviderToAPIStatusPanel (provider) {
    var providerAPI = document.getElementById('searchProviderStatus');
    if (providerAPI) { // NB we need this so that tests don't fail
        providerAPI.textContent = (translateUI.t('api-searchprovider-label') || 'Search Provider:') + ' ' + (/^fulltext/.test(provider)
            ? (translateUI.t('api-searchprovider-title') || 'Title') + ' + Xapian [' + provider + ']'
            : /^title/.test(provider) ? (translateUI.t('api-searchprovider-titleonly') || 'Title only') + ' [' + provider + ']'
            : (translateUI.t('api-error-uninitialized_masculine') || 'Not initialized'));
        providerAPI.className = /^fulltext/.test(provider) ? 'apiAvailable' : !/ERROR/.test(provider) ? 'apiUnavailable' : 'apiBroken';
    }
}

/**
 * Warn the user that they clicked on an external link, and open it in a new tab
 *
 * @param {Event} event The click event to handle. If not provided, then clickedAnchor must be provided.
 * @param {Element} clickedAnchor The DOM anchor that has been clicked (optional, defaults to event.target)
 * @param {ZIMArchive} archive The archive object from which the link was scraped (optional)
 */
function warnAndOpenExternalLinkInNewTab (event, clickedAnchor, archive) {
    if (event) {
        // We have to prevent any blank target from firing on the original event
        event.target.removeAttribute('target');
        event.preventDefault();
        event.stopPropagation();
    }
    if (!clickedAnchor) clickedAnchor = event.target;
    // This is for Zimit-style relative links where the link isn't in the archive, so we have to reconstruct the original URL it was scraped from
    if (archive && articleContainer.contentWindow && clickedAnchor.origin === articleContainer.contentWindow.location.origin) {
        clickedAnchor.href = clickedAnchor.href.replace(clickedAnchor.origin, archive.source.replace(/\/$/, ''));
    }
    var target = clickedAnchor.target;
    if (!target) {
        target = '_blank';
    }
    let href = clickedAnchor.href;
    // @WORKAROUND: Note that for Zimit2 ZIMs (only), any querystring in an external link will be overencoded.
    // See https://github.com/kiwix/kiwix-js/issues/1258. DEV: Monitor this issue, and remove the workaround if it is fixed upstream.
    if (params.zimType === 'zimit2') {
        href = decodeURIComponent(href);
    }
    if (params.hideExternalLinkWarning) {
        window.open(href, target);
        return;
    }
    var message = translateUI.t('dialog-open-externalurl-message') || '<p>Do you want to open this external link?';
    if (target === '_blank') {
        message += ' ' + (translateUI.t('dialog-open-externalurl-newtab') || '(in a new tab)');
    }
    message += '</p><p style="word-break:break-all;">' + href + '</p>';
    systemAlert(message, translateUI.t('dialog-open-externalurl-title') || 'Opening external link', true, null, null, null, null, true).then(function (response) {
        if (response) {
            window.open(href, target);
        }
    });
}

/**
 * Finds the closest <a> or <area> enclosing tag of an element.
 * Returns undefined if there isn't any.
 *
 * @param {Element} element The element to test
 * @returns {Element} closest enclosing anchor tag (if any)
 */
function closestAnchorEnclosingElement (element) {
    if (Element.prototype.closest) {
        // Recent browsers support that natively. See https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
        return element.closest('a,area');
    } else {
        // For other browsers, notably IE, we do that by hand (we did not manage to make polyfills work on IE11)
        var currentElement = element;
        while (currentElement.tagName !== 'A' && currentElement.tagName !== 'AREA') {
            // If there is no parent Element, we did not find any enclosing A tag
            if (!currentElement.parentElement) {
                return;
            } else {
                // Else we try the next parent Element
                currentElement = currentElement.parentElement;
            }
        }
        // If we reach this line, it means the currentElement is the enclosing Anchor we're looking for
        return currentElement;
    }
}

/**
 * Get the base language code that has been set in the browser
 * If the browser language is unavailable, the default language is set to British English
 *
 * @returns {Object} A language object consisting of a base language code and a locale
 */

function getBrowserLanguage () {
    // This defines the default language to return if user hasn't selected one
    var language = {
        base: 'en',
        locale: 'GB'
    }
    var fullLanguage = navigator.language || navigator.userLanguage;
    if (fullLanguage) {
        language.base = fullLanguage.replace(/-.+$/, '').toLowerCase();
        language.locale = fullLanguage.replace(/^[^-]+-/, '').toUpperCase();
    }
    return language;
}

/**
 * Handles the click on the title of an article in search results
 * @param {Event} event The click event to handle
 * @param {Function} findDirEntryCallback Callback to find and launch article
 */
function handleTitleClick(event, findDirEntryCallback) {
    event.preventDefault();
    // User may have clicked on a child element of the list item if it contains HTML (for example, italics),
    // so we may need to find the closest list item
    let target = event.target;
    if (!/list-group-item/.test(target.className)) {
        console.warn('User clicked on child element of list item, looking for parent...');
        while (target && !/list-group-item/.test(target.className)) {
            target = target.parentNode;
        }
        if (!target) {
            // No list item found, so we can't do anything
            console.warn('No list item could be found for clicked event!');
            return;
        }
    }
    var dirEntryId = decodeURIComponent(target.getAttribute('dirEntryId'));
    findDirEntryCallback(dirEntryId);
}

/**
 * Creates and inserts snippet elements for search results
 * @param {Array} entriesArray Array of directory entries
 * @param {NodeList} links The article link elements  
 * @param {Number} length Number of items to process
 */
function createSnippetElements(entriesArray, links, length) {
    for (var i = 0; i < length; i++) {
        var dirEntry = entriesArray[i];
        
        // Add snippet if it exists
        if (dirEntry.snippet && links[i]) {
            var snippetId = 'snippet-' + i;
            
            // Create snippet container
            var snippetContainer = document.createElement('div');
            snippetContainer.className = 'snippet-container';
            
            // Create and populate snippet header
            var snippetHeader = document.createElement('div');
            snippetHeader.className = 'snippet-header';
            snippetHeader.tabIndex = 0;
            snippetHeader.setAttribute('data-target', snippetId);
            snippetHeader.setAttribute('aria-expanded', 'false');
            
            var indicator = document.createElement('span');
            indicator.className = 'snippet-indicator';
            indicator.textContent = '▶';
            
            var preview = document.createElement('span');
            preview.className = 'snippet-preview';
            preview.innerHTML = dirEntry.snippet.substring(0, 80) + '...';
            
            snippetHeader.appendChild(indicator);
            snippetHeader.appendChild(preview);
            
            // Create snippet content
            var content = document.createElement('div');
            content.id = snippetId;
            content.className = 'snippet-content collapsed';
            content.innerHTML = dirEntry.snippet;
            
            // Assemble and insert
            snippetContainer.appendChild(snippetHeader);
            snippetContainer.appendChild(content);
            
            // Insert after the article link
            links[i].parentNode.insertBefore(snippetContainer, links[i].nextSibling);
        }
    }
}

/**
 * Expands or collapses fulltext search snippet content when the header is selected
 * @param {Element} ele The container element that was selected 
 * @param {Event} ev The event to handle or null if called programmatically  
*/
function toggleSnippet (ele, ev) {
    if (ev) {
        ev.preventDefault();
        ev.stopPropagation(); // Prevent triggering the article link        
    }
    var header = ele.children[0]; // Snippet header
    var content = ele.children[1]; // Snippet content
    var isExpanded = header.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
        // Collapse
        content.classList.add('collapsed');
        header.setAttribute('aria-expanded', 'false');
    } else {
        // Expand
        content.classList.remove('collapsed');
        header.setAttribute('aria-expanded', 'true');
    }
}

/**
 * Attaches event listeners to article list and snippet container elements
 * @param {Function} findDirEntryCallback Function to find and launch article by dirEntryId
 * @param {Object} appstate App state object containing search status
 */
function attachArticleListEventListeners(findDirEntryCallback, appstate) {
    // We have to use mousedown below instead of click as otherwise the prefix blur event fires first
    // and prevents this event from firing; note that touch also triggers mousedown
    document.querySelectorAll('#articleList a, .snippet-container').forEach(function (element) {
        element.addEventListener('mousedown', function (e) {
            if (element.classList.contains('snippet-container')) {
                // Handle snippet toggle
                toggleSnippet(element, e);
            } else {
                // Handle article link
                appstate.search.status = 'cancelled';
                handleTitleClick(e, findDirEntryCallback);
            }
        });
        
        // Add hover functionality for snippet containers with delay
        if (element.classList.contains('snippet-container')) {
            var hoverTimeout;
            element.addEventListener('mouseenter', function () {
                // Clear any existing timeout
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                }
                // Set a delay before expanding (e.g., 300ms)
                hoverTimeout = setTimeout(function() {
                    // Safety check: ensure the element still has the expected children
                    if (element.children.length < 2) return;
                    
                    var header = element.children[0];
                    var content = element.children[1];
                    var isExpanded = header.getAttribute('aria-expanded') === 'true';
                    // Only expand if not already expanded
                    if (!isExpanded) {
                        content.classList.remove('collapsed');
                        header.setAttribute('aria-expanded', 'true');
                    }
                }, 400);
            });
            
            element.addEventListener('mouseleave', function () {
                // Clear the timeout if user leaves before delay completes
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }
                // Safety check: ensure the element still has the expected children
                if (element.children.length < 2) return;
                
                // Always collapse on mouse leave
                // var header = element.children[0];
                // var content = element.children[1];
                // content.classList.add('collapsed');
                // header.setAttribute('aria-expanded', 'false');
            });
        }
    });
}


/**
 * Functions and classes exposed by this module
 */
export default {
    hideSlidingUIElements: hideSlidingUIElements,
    showSlidingUIElements: showSlidingUIElements,
    scroller: scroller,
    systemAlert: systemAlert,
    feedNodeWithDataURI: feedNodeWithDataURI,
    getDataUriFromUint8Array: getDataUriFromUint8Array,
    determineCanvasElementsWorkaround: determineCanvasElementsWorkaround,
    replaceCSSLinkWithInlineCSS: replaceCSSLinkWithInlineCSS,
    deriveZimUrlFromRelativeUrl: deriveZimUrlFromRelativeUrl,
    setUpTOC: setUpTOC,
    removeUrlParameters: removeUrlParameters,
    displayActiveContentWarning: displayActiveContentWarning,
    displayFileDownloadAlert: displayFileDownloadAlert,
    checkUpdateStatus: checkUpdateStatus,
    checkServerIsAccessible: checkServerIsAccessible,
    spinnerDisplay: spinnerDisplay,
    isElementInView: isElementInView,
    removeAnimationClasses: removeAnimationClasses,
    tabTransitionToSection: tabTransitionToSection,
    applyAppTheme: applyAppTheme,
    isDarkTheme: isDarkTheme,
    detectNativeZIMThemeSupport: detectNativeZIMThemeSupport,
    reportAssemblerErrorToAPIStatusPanel: reportAssemblerErrorToAPIStatusPanel,
    reportSearchProviderToAPIStatusPanel: reportSearchProviderToAPIStatusPanel,
    warnAndOpenExternalLinkInNewTab: warnAndOpenExternalLinkInNewTab,
    closestAnchorEnclosingElement: closestAnchorEnclosingElement,
    getBrowserLanguage: getBrowserLanguage,
    returnToCurrentPage: returnToCurrentPage,
    fromSection: fromSection,
    handleTitleClick: handleTitleClick,
    createSnippetElements: createSnippetElements,
    toggleSnippet: toggleSnippet,
    attachArticleListEventListeners: attachArticleListEventListeners
};
