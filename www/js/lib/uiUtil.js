/**
 * uiUtil.js : Utility functions for the User Interface
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
define([], function() {

    
    /**
     * Creates a Blob from the given content, then a URL from this Blob
     * And put this URL in the attribute of the DOM node
     * 
     * This is useful to inject images (and other dependencies) inside an article
     * 
     * @param {Object} jQueryNode
     * @param {String} nodeAttribute
     * @param {Uint8Array} content
     * @param {String} mimeType
     */
    function feedNodeWithBlob(jQueryNode, nodeAttribute, content, mimeType) {
        var blob = new Blob([content], {type: mimeType});
        var url = URL.createObjectURL(blob);
        jQueryNode.on('load', function () {
            URL.revokeObjectURL(url);
        });
        jQueryNode.attr(nodeAttribute, url);
    }

    /**
     * Creates a Blob from a supplied script string and attaches it to the
     * specified document or iframe. Attaches to document body in case the 
     * document does not have a head. Returns the new URL for the Blob and
     * sets a callback to run a specified function once the script has loaded
     * 
     * @param {Document} iframe document to which the script should be attached 
     * @param {String} script string containing the script to attach
     * @param {Node} node node object of the original script, if any
     * @param {Boolean} keep set to true to prevent revocation of Blob URL
     * @param {Function} callback a function to run once the script has loaded
     * @returns {String} the URL of the new Blob
     */
    function createScriptBlob(iframe, script, node, keep, callback) {
        var scriptBlob = new Blob([script], { type: 'text/javascript' });
        var scriptUrl = URL.createObjectURL(scriptBlob);
        var newScript = iframe.createElement('script');
        if (node && node.dataset.kiwixsrc) newScript.dataset.kiwixsrc = node.dataset.kiwixsrc;
        newScript.onload = function() {
            if (callback) {
                callback();
            }
            if (!keep) URL.revokeObjectURL(scriptUrl);
        };
        newScript.src = scriptUrl;
        iframe.head.appendChild(newScript);
        return scriptUrl;
    }

    // Creates a BLOB URI but does not attach the asset
    function createBlobUri(asset, assetType) {
        var assetBlob = new Blob([asset], { type: assetType });
        var assetUri = URL.createObjectURL(assetBlob);
        return assetUri;
    }

    // Compile regular expressions for replaceInlineEvents function
    // This regex matches any tag that contains an on- event attribute; case-sensitivity is intentional for speed
    var regexpFindElesWithEvents = /<(?=[^>]+\son\w+=["'])[^>]+>/g;
    // This regex matches all on- events inside a tag and saves the event name and the script
    // It works with, e.g., onmousover="alert('\"Wow!\"');" and onclick='myfunction("Show \'me\'");'
    var regexpParseInlineEvents = /\s(on\w+)=(["'])\s*((?:\\\2|(?!\2).)+)\2/g;
    
    function replaceInlineEvents(html) {
        var matchCounter = 0;
        var eventsSheet = "";
        html = html.replace(regexpFindElesWithEvents, function(fullTag) {
            var dataKiwixevents = "";
            var match = regexpParseInlineEvents.exec(fullTag);
            while (match) {
                var functionID = match[1] + '_' + matchCounter + '_' + match.index;
                // Store a string version of the function
                eventsSheet += 'function ' + functionID + '() {\r\n' + match[3] + '\r\n}\r\n\r\n';
                dataKiwixevents += functionID + ';';
                match = regexpParseInlineEvents.exec(fullTag);
            }
            fullTag = fullTag.replace(regexpParseInlineEvents, '');
            // Insert the functionID into a data attribute so it can be retrieved for attaching the event
            fullTag = fullTag.replace(/>$/, ' data-kiwixevents="' + dataKiwixevents + '">');
            matchCounter++;
            return fullTag;
        });
        return [html, eventsSheet];
    }
        
    /**
     * Attaches a set of event handlers to corresponding functions in the iframe
     * 
     * @param {String} frame The name of the window to use (either "window" or iframe's element id)
     * @param {Element} el An element as DOM node
     * @param {Array} eventFns A list of event functions to attach to the node.
     * Event functions must have the format "onevent_functionID".
     */
    function attachInlineFunctions(frame, el, eventFns) {
        var context = frame == "window" ? window : document.getElementById(frame).contentWindow;
        for (var e = 0; e < eventFns.length; e++) {
            var thisEvent = eventFns[e].replace(/^on([^_]+).+/, '$1');
            var thisFunction = context[eventFns[e]];
            if (typeof thisFunction === 'function') {
                el.addEventListener(thisEvent, thisFunction);
            } else {
                console.error('[attachInlineFunctions] The specified functions could not be found in the content window!');
            }
        }
    }

    /**
     * Replace the given CSS link (from the DOM) with an inline CSS of the given content
     * 
     * Due to CSP, Firefox OS does not accept <link> syntax with href="data:text/css..." or href="blob:..."
     * So we replace the tag with a <style type="text/css">...</style>
     * while copying some attributes of the original tag
     * Cf http://jonraasch.com/blog/javascript-style-node
     * 
     * @param {Element} link from the DOM
     * @param {String} cssContent
     */
    function replaceCSSLinkWithInlineCSS (link, cssContent) {
        var cssElement = document.createElement('style');
        cssElement.type = 'text/css';
        if (cssElement.styleSheet) {
            cssElement.styleSheet.cssText = cssContent;
        } else {
            cssElement.appendChild(document.createTextNode(cssContent));
        }
        var mediaAttributeValue = link.attr('media');
        if (mediaAttributeValue) {
            cssElement.media = mediaAttributeValue;
        }
        var disabledAttributeValue = link.attr('disabled');
        if (disabledAttributeValue) {
            cssElement.disabled = disabledAttributeValue;
        }
        link.replaceWith(cssElement);
    }
        
    var regexpRemoveUrlParameters = new RegExp(/([^?#]+)[?#].*$/);
    
    /**
     * Removes parameters and anchors from a URL
     * @param {type} url
     * @returns {String} same URL without its parameters and anchors
     */
    function removeUrlParameters(url) {
        return url.replace(regexpRemoveUrlParameters, "$1");
    }

    /**
     * Derives the URL.pathname from a relative or semi-relative URL using the given base ZIM URL
     * 
     * @param {String} url The (URI-encoded) URL to convert (e.g. "Einstein", "../Einstein",
     *      "../../I/im%C3%A1gen.png", "-/s/style.css", "/A/Einstein.html")
     * @param {String} base The base ZIM URL of the currently loaded article (e.g. "A/" or "A/subdir1/subdir2/")
     * @returns {String} The derived ZIM URL in decoded form (e.g. "A/Einstein", "I/imágen.png")
     */
    function deriveZimUrlFromRelativeUrl(url, base) {
        // We use a dummy domain because URL API requires a valid URI
        var dummy = 'http://d/';
        var deriveZimUrl = function(url, base) {
            if (typeof URL === 'function') return new URL(url, base);
            // IE11 lacks URL API: workaround adapted from https://stackoverflow.com/a/28183162/9727685
            var d = document.implementation.createHTMLDocument('t');
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
    function displayActiveContentWarning() {
        var alertActiveContent = document.getElementById('activeContent');
        alertActiveContent.style.display = 'block';
        if (!activeContentWarningSetup) {
            // We are setting up the active content warning for the first time
            activeContentWarningSetup = true;
            alertActiveContent.querySelector('button[data-hide]').addEventListener('click', function() {
                alertActiveContent.style.display = 'none';
            });
            ['swModeLink', 'stop'].forEach(function(id) {
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
                    document.getElementById('btnConfigure').click();
                });
            });
        }
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
    function displayFileDownloadAlert(title, download, contentType, content) {
        var downloadAlert = document.getElementById('downloadAlert');
        downloadAlert.style.display = 'block';
        if (!downloadAlertSetup) downloadAlert.querySelector('button[data-hide]').addEventListener('click', function() {
            // We are setting up the alert for the first time
            downloadAlert.style.display = 'none';
        });
        downloadAlertSetup = true;
        // Download code adapted from https://stackoverflow.com/a/19230668/9727685 
        // Set default contentType if none was provided
        if (!contentType) contentType = 'application/octet-stream';
        var a = document.createElement('a');
        var blob = new Blob([content], { 'type': contentType });
        // If the filename to use for saving has not been specified, construct it from title
        var filename = download === true ? title.replace(/^.*\/([^\/]+)$/, '$1') : download;
        // Make filename safe
        filename = filename.replace(/[\/\\:*?"<>|]/g, '_');
        a.href = window.URL.createObjectURL(blob);
        a.target = '_blank';
        a.type = contentType;
        a.download = filename;
        a.classList.add('alert-link');
        a.innerHTML = filename;
        var alertMessage = document.getElementById('alertMessage');
        alertMessage.innerHTML = '<strong>Download</strong> If the download does not start, please tap the following link: ';
        // We have to add the anchor to a UI element for Firefox to be able to click it programmatically: see https://stackoverflow.com/a/27280611/9727685
        alertMessage.appendChild(a);
        try { a.click(); }
        catch (err) {
            // If the click fails, user may be able to download by manually clicking the link
            // But for IE11 we need to force use of the saveBlob method with the onclick event 
            if (window.navigator && window.navigator.msSaveBlob) {
                a.addEventListener('click', function(e) {
                    window.navigator.msSaveBlob(blob, filename);
                    e.preventDefault();
                });
            }
        }
        $("#searchingArticles").hide();
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
    function isElementInView(el, fully) {
        var rect = el.getBoundingClientRect();
        if (fully)
            return rect.top > 0 && rect.bottom < window.innerHeight && rect.left > 0 && rect.right < window.innerWidth;
        else 
            return rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
    }

    /**
     * Encodes the html escape characters in the string before using it as html class name,id etc.
     * 
     * @param {String} string The string in which html characters are to be escaped
     * 
     */
    function htmlEscapeChars(string) {
        var escapechars = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        string = String(string).replace(/[&<>"'`=/]/g, function (s) {
            return escapechars[s];
        });
        return string;
    }

    /**
     * Removes the animation effect between various sections
     */
    function removeAnimationClasses() {
        $('#about').removeClass('slideIn_L').removeClass('slideOut_R');
        $('#configuration').removeClass('slideIn_L').removeClass('slideIn_R').removeClass('slideOut_L').removeClass('slideOut_R');
        $('#articleContent').removeClass('slideIn_R').removeClass('slideOut_L');
    }
    
    /**
     * Adds the slide animation between different sections
     * 
     * @param {String} section It takes the name of the section to which the animation is to be added
     * 
     */
    function applyAnimationToSection(section) {
        if (section == 'home') {
            if (!$('#configuration').is(':hidden')) {
                $('#configuration').addClass('slideOut_R');
                setTimeout(function () {
                    $('#configuration').hide();
                }, 300);
            }
            if (!$('#about').is(':hidden')) {
                $('#about').addClass('slideOut_R');
                setTimeout(function () {
                    $('#about').hide();
                }, 300);
            }
            $('#articleContent').addClass('slideIn_R');
            setTimeout(function () {
                $('#articleContent').show();
            }, 300);
        } else if (section == 'config') {
            if (!$('#about').is(':hidden')) {
                $('#about').addClass('slideOut_R');
                $('#configuration').addClass('slideIn_R');
                setTimeout(function () {
                    $('#about').hide();
                }, 300);
            } else if (!$('#articleContent').is(':hidden')) {
                $('#articleContent').addClass('slideOut_L');
                $('#configuration').addClass('slideIn_L');
                setTimeout(function () {
                    $('#articleContent').hide();
                }, 300);
            }
            setTimeout(function () {
                $('#configuration').show();
            }, 300);
        } else if (section == 'about') {
            if (!$('#configuration').is(':hidden')) {
                $('#configuration').addClass('slideOut_L');
                setTimeout(function () {
                    $('#configuration').hide();
                }, 300);
            }
            if (!$('#articleContent').is(':hidden')) {
                $('#articleContent').addClass('slideOut_L');
                setTimeout(function () {
                    $('#articleContent').hide();
                }, 300);
            }
            $('#about').addClass('slideIn_L');
            setTimeout(function () {
                $('#about').show();
            }, 300);
        }
    }

    /**
     * Applies the requested app and content theme
     * 
     * A <theme> string consists of two parts, the appTheme (theme to apply to the app shell only), and an optional
     * contentTheme beginning with an underscore: e.g. 'dark_invert' = 'dark' (appTheme) + '_invert' (contentTheme)
     * Current themes are: light, dark, dark_invert, dark_mwInvert but code below is written for extensibility
     * For each appTheme (except the default 'light'), a corresponding set of rules must be present in app.css
     * For each contentTheme, a stylesheet must be provided in www/css that is named 'kiwixJS' + contentTheme
     * A rule may additionally be needed in app.css for full implementation of contentTheme
     * 
     * @param {String} theme The theme to apply (light|dark[_invert|_mwInvert])
     */
    function applyAppTheme(theme) {
        var htmlEl = document.querySelector('html');
        var footer = document.querySelector('footer');
        var oldTheme = htmlEl.dataset.theme || '';
        var iframe = document.getElementById('articleContent');
        var doc = iframe.contentDocument;
        var kiwixJSSheet = doc ? doc.getElementById('kiwixJSTheme') || null : null;
        var appTheme = theme.replace(/_.*$/, '');
        var contentTheme = theme.replace(/^[^_]*/, '');
        var oldAppTheme = oldTheme.replace(/_.*$/, '');
        var oldContentTheme = oldTheme.replace(/^[^_]*/, '');
        // Remove oldAppTheme and oldContentTheme
        if (oldAppTheme) htmlEl.classList.remove(oldAppTheme);
        // A missing contentTheme implies _light
        footer.classList.remove(oldContentTheme || '_light');
        // Apply new appTheme (NB it will not be added twice if it's already there)
        if (appTheme) htmlEl.classList.add(appTheme);
        // We also add the contentTheme to the footer to avoid dark css rule being applied to footer when content
        // is not dark (but we want it applied when the content is dark or inverted)
        footer.classList.add(contentTheme || '_light');
        // Embed a reference to applied theme, so we can remove it generically in the future
        htmlEl.dataset.theme = theme;
        // Hide any previously displayed help
        var oldHelp = document.getElementById(oldTheme + '-help');
        if (oldHelp) oldHelp.style.display = 'none';
        // Show any specific help for selected contentTheme
        var help = document.getElementById(theme + '-help');
        if (help) help.style.display = 'block';
        
        // If there is no ContentTheme or we are applying a different ContentTheme, remove any previously applied ContentTheme
        if (oldContentTheme && oldContentTheme !== contentTheme) {
            iframe.classList.remove(oldContentTheme);
            if (kiwixJSSheet) {
                kiwixJSSheet.disabled = true;
                kiwixJSSheet.parentNode.removeChild(kiwixJSSheet);
            }
        }
        // Apply the requested ContentTheme (if not already attached)
        if (contentTheme && (!kiwixJSSheet || !~kiwixJSSheet.href.search('kiwixJS' + contentTheme + '.css'))) {
            iframe.classList.add(contentTheme);
            // Use an absolute reference because Service Worker needs this (if an article loaded in SW mode is in a ZIM
            // subdirectory, then relative links injected into the article will not work as expected)
            // Note that location.pathname returns the path plus the filename, but is useful because it removes any query string
            var prefix = (window.location.protocol + '//' + window.location.host + window.location.pathname).replace(/\/[^/]*$/, '');
            if (doc) {
                var link = doc.createElement('link');
                link.setAttribute('id', 'kiwixJSTheme');
                link.setAttribute('rel', 'stylesheet');
                link.setAttribute('type', 'text/css');
                link.setAttribute('href', prefix + '/css/kiwixJS' + contentTheme + '.css');
                doc.head.appendChild(link);
            }
        }
        // If we are in Config and a real document has been loaded already, expose return link so user can see the result of the change
        // DEV: The Placeholder string below matches the dummy article.html that is loaded before any articles are loaded
        if (document.getElementById('liConfigureNav').classList.contains('active') &&
            doc.title !== "Placeholder for injecting an article into the iframe") {
            showReturnLink();
        }
    }

    // Displays the return link and handles click event. Called by applyAppTheme()
    function showReturnLink() {
        var viewArticle = document.getElementById('viewArticle');
        viewArticle.style.display = 'block';
        viewArticle.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('liConfigureNav').classList.remove('active');
            document.getElementById('liHomeNav').classList.add('active');
            removeAnimationClasses();
            if (params.showUIAnimations) { 
                applyAnimationToSection('home');
            } else {
                document.getElementById('configuration').style.display = 'none';
                document.getElementById('articleContent').style.display = 'block';
            }
            document.getElementById('navigationButtons').style.display = 'inline-flex';
            document.getElementById('formArticleSearch').style.display = 'block';
            viewArticle.style.display = 'none';
        });
    }

    /**
     * Functions and classes exposed by this module
     */
    return {
        feedNodeWithBlob: feedNodeWithBlob,
        createScriptBlob: createScriptBlob,
        createBlobUri: createBlobUri,
        replaceInlineEvents: replaceInlineEvents,
        attachInlineFunctions: attachInlineFunctions,
        replaceCSSLinkWithInlineCSS: replaceCSSLinkWithInlineCSS,
        deriveZimUrlFromRelativeUrl: deriveZimUrlFromRelativeUrl,
        removeUrlParameters: removeUrlParameters,
        displayActiveContentWarning: displayActiveContentWarning,
        displayFileDownloadAlert: displayFileDownloadAlert,
        isElementInView: isElementInView,
        htmlEscapeChars: htmlEscapeChars,
        removeAnimationClasses: removeAnimationClasses,
        applyAnimationToSection: applyAnimationToSection,
        applyAppTheme: applyAppTheme
    };
});
