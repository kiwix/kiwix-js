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
define(['util'], function(util) {
    /**
     * Global variables
     */
    var itemsCount = false;
    
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
     * @param {Boolean} revokeBLOB If true or not set, revoke the object on load; if explicitly set to false, do not revoke
     */
    function feedNodeWithBlob(jQueryNode, nodeAttribute, content, mimeType, revokeBLOB) {
        var url;
        var blob = new Blob([content], {type: mimeType});
        if (revokeBLOB === false) {
            url = 'data:' + mimeType + ';base64,' + btoa(util.uintToString(content));
            jQueryNode.attr(nodeAttribute, url);
        } else {
            url = URL.createObjectURL(blob);
            jQueryNode.on('load', function () {
                URL.revokeObjectURL(url);
            });
        }
        jQueryNode.attr(nodeAttribute, url);
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
     * Displays a Bootstrap warning alert with information about how to access content in a ZIM with unsupported active UI
     */
    function displayActiveContentWarning() {
        // We have to add the alert box in code, because Bootstrap removes it completely from the DOM when the user dismisses it
        var alertHTML =
            '<div id="activeContent" class="alert alert-warning alert-dismissible fade in">' +
                '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
                '<strong>Unable to display active content:</strong> This ZIM is not fully supported in jQuery mode.<br />' +
                'Content may be available by searching above (type a space or a letter of the alphabet), or else ' +
                '<a id="swModeLink" href="#contentInjectionModeDiv" class="alert-link">switch to Service Worker mode</a> ' +
                'if your platform supports it. &nbsp;[<a id="stop" href="#displaySettingsDiv" class="alert-link">Permanently hide</a>]' +
            '</div>';
        document.getElementById('alertBoxHeader').innerHTML = alertHTML;
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

    /**
     * Displays a Bootstrap alert box at the foot of the page to enable saving the content of the given title to the device's filesystem
     * and initiates download/save process if this is supported by the OS or Browser
     * 
     * @param {String} title The path and filename to the file to be extracted
     * @param {Boolean|String} download A Bolean value that will trigger download of title, or the filename that should
     *     be used to save the file in local FS
     * @param {String} contentType The mimetype of the downloadable file, if known
     * @param {Uint8Array} content The binary-format content of the downloadable file
     * @param {Boolean} autoDismiss If true, dismiss the alert programmatically
     */
    function displayFileDownloadAlert(title, download, contentType, content, autoDismiss) {
        // We have to create the alert box in code, because Bootstrap removes it completely from the DOM when the user dismisses it
        document.getElementById('alertBoxFooter').innerHTML =
        '<div id="downloadAlert" class="alert alert-info alert-dismissible">' +
        '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
        '    <span id="alertMessage"></span>' +
        '</div>';
        // Download code adapted from https://stackoverflow.com/a/19230668/9727685 
        if (!contentType) {
            // DEV: Add more contentTypes here for downloadable files
            if (/\.epub$/.test(title)) contentType = 'application/epub+zip';
            if (/\.pdf$/.test(title)) contentType = 'application/pdf';
            if (/\.zip$/.test(title)) contentType = 'application/zip';
        }
        // Set default contentType if there has been no match
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
        try { 
            a.click(); 
            // Following line should run only if there was no error, leaving the alert showing in case of error
            if (autoDismiss) $('#downloadAlert').alert('close');
        }
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
        finally {
            $("#searchingArticles").hide();
        }
    }

    /**
     * Initiates XMLHttpRequest
     * Can be used for loading local files; CSP may restrict access to remote files due to CORS
     *
     * @param {URL} url The Uniform Resource Locator to be read
     * @param {String} responseType The response type to return (arraybuffer|blob|document|json|text);
     *     (passing an empty or null string defaults to text)
     * @param {Function} callback The function to call with the result: data, mimetype, and status or error code
     */
    function XHR(url, responseType, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (e) {
            if (this.readyState == 4) {
                callback(this.response, this.response.type, this.status);
            }
        };
        var err = false;
        try {
            xhr.open('GET', url, true);
            if (responseType) xhr.responseType = responseType;
        }
        catch (e) {
            console.log("Exception during GET request: " + e);
            err = true;
        }
        if (!err) {
            xhr.send();
        } else {
            callback("Error", null, 500);
        }
    }

    /**
     * Inserts a link to break the page out to a new browser window
     */
    function insertBreakoutLink() {
        var iframe = document.getElementById('articleContent').contentDocument;
        var div = document.createElement('div');
        div.style.cssText = 'font-size: xx-large; left: 90%; position: absolute; opacity: 0.5; z-index: 2;';
        div.id = "openInTab";
        div.innerHTML = '<a href="#">[⬈]</a>';
        iframe.body.insertBefore(div, iframe.body.firstChild);
        var openInTab = iframe.getElementById('openInTab');
        // Have to use jQuery here becasue e.preventDefault is not working properly in some browsers
        $(openInTab).on('click', function() {
            extractHTML();
            return false;
        });
    }
    
    /**
     * Extracts self-contained HTML from the iframe DOM, transforming BLOB references to dataURIs
     */
    function extractHTML() {
        var iframe = document.getElementById('articleContent').contentDocument;
        // Store the html for the head section, to restore later (in SW mode, stylesheets will be transformed to dataURI links,
        // which only work from file:/// URL, due to CORS, so they have to be restored)
        var headHtml = iframe.head.innerHTML;
        var title = iframe.title;
        if (itemsCount === false) {
            // Establish the source items that need to be extracted to self-contained URIs
            // DEV: Add any further sources to the querySelector below
            var items = iframe.querySelectorAll('img[src],link[href]');
            itemsCount = items.length;
            Array.prototype.slice.call(items).forEach(function (item) {
                // Extract the BLOB itself from the URL (even if it's a blob: URL)                    
                XHR(item.href || item.src, 'blob', function (response, mimetype, status) {
                    if (status == 500) { 
                        itemsCount--;
                        return;
                    }
                    // Now read the data from the extracted blob
                    var myReader = new FileReader();
                    myReader.addEventListener("loadend", function () {
                        if (item.href) item.href = myReader.result;
                        if (item.src) item.src = myReader.result;
                        itemsCount--;
                        if (itemsCount === 0) extractHTML();
                    });
                    //Start the reading process.
                    myReader.readAsDataURL(response);
                });
            });
        }
        if (itemsCount > 0) return; //Ensures function stops if we are still extracting images or css
        // Construct filename (forbidden characters will be removed in the download function)
        //title = title.replace(/([^/]\/)+/, '');
        var filename = title.replace(/(\.html?)*$/i, '.html');
        var html = iframe.documentElement.outerHTML;
        // Remove openInTab div (we can't do this using DOM methods because it causes a navigation)
        html = html.replace(/<div\s(?=[^<]+?openInTab)(?:[^<]|<(?!\/div>))+<\/div>\s*/, '');
        var blob = new Blob([html], { type: 'text/html' });
        // We can't use window.open() because pop-up blockers block it, so use explicit BLOB download
        displayFileDownloadAlert(title, filename, 'text/html', blob, true);
        // Restore original head section (to restore any transformed stylesheets)
        iframe.head.innerHTML = headHtml;
        itemsCount = false;
    }


    /**
     * Functions and classes exposed by this module
     */
    return {
        feedNodeWithBlob: feedNodeWithBlob,
        replaceCSSLinkWithInlineCSS: replaceCSSLinkWithInlineCSS,
        removeUrlParameters: removeUrlParameters,
        displayActiveContentWarning: displayActiveContentWarning,
        displayFileDownloadAlert: displayFileDownloadAlert,
        insertBreakoutLink: insertBreakoutLink
    };
});
