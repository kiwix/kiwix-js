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

    /**
     * Replaces all CSS links that have the given attribute in the html string with inline script tags containing content
     * from the cache entries. Returns the substituted html in the callback function (even if no substitutions were made).
     * 
     * @param {String} html The html string to process
     * @param {String} attribute The attribute that stores the URL to be substituted
     * @param {Function} callback The function to call with the substituted html
         
     }}
     */
    function replaceCSSLinksInHtml(html, attribute, callback) {
        // This regex creates an array of all link tags that have the given attribute
        var regexpLinksWithAttribute = new RegExp('<link[^>]+?' + attribute + '=["\']([^"\']+)[^>]*>', 'ig');
        var titles = [];
        var linkArray = regexpLinksWithAttribute.exec(html);
        while (linkArray !== null) {
            // Store both the link to be replaced and the decoded URL
            titles.push([linkArray[0], 
                decodeURIComponent(linkArray[1])]);
            linkArray = regexpLinksWithAttribute.exec(html);
        }
        assetsCache.cssCount = 0;
        assetsCache.cssFulfilled = 0;
        titles.forEach(function(title) {
            assetsCache.cssCount++;
            var cssContent = assetsCache.get(title[1]);
            if (cssContent) {
                assetsCache.cssFulfilled++;
                html = html.replace(title[0], 
                    '<style ' + attribute + '="' + title[1] + '">' + cssContent + '</style>');
            }
            if (assetsCache.cssCount >= titles.length) {
                callback(html);
            }
        });
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
     * Functions and classes exposed by this module
     */
    return {
        feedNodeWithBlob: feedNodeWithBlob,
        replaceCSSLinkWithInlineCSS: replaceCSSLinkWithInlineCSS,
        replaceCSSLinksInHtml: replaceCSSLinksInHtml,
        removeUrlParameters: removeUrlParameters
    };
});
