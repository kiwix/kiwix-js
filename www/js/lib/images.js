/**
 * images.js : Functions for the processing of images
 * 
 * Copyright 2013-2019 Mossroy and contributors
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
define(['uiUtil', 'cookies'], function(uiUtil, cookies) {

    /**
     * Declare a module-specific variable defining the contentInjectionMode. Its value may be 
     * changed in setContentInjectionMode() 
     */
    var contentInjectionMode = cookies.getItem('lastContentInjectionMode');

    /**
     * Iterates over an array or collection of image nodes, extracting the image data from the ZIM
     * and inserting a BLOB URL to each image in the image's src attribute
     * 
     * @param {Object} images An array or collection of DOM image nodes
     * @param {Object} selectedArchive The ZIM archive picked by the user
     */
    function extractImages(images, selectedArchive) {
        Array.prototype.slice.call(images).forEach(function (image) {
            var imageUrl = image.getAttribute('data-kiwixurl');
            if (!imageUrl) return;
            image.removeAttribute('data-kiwixurl');
            var title = decodeURIComponent(imageUrl);
            if (contentInjectionMode === 'serviceworker') {
                image.src = imageUrl + '?kiwix-display';
            } else {
                selectedArchive.getDirEntryByTitle(title).then(function (dirEntry) {
                    return selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                        image.style.background = '';
                        var mimetype = dirEntry.getMimetype();
                        uiUtil.feedNodeWithBlob(image, 'src', content, mimetype);
                    });
                }).fail(function (e) {
                    console.error('Could not find DirEntry for image: ' + title, e);
                });
            }
        });
    }

    /**
     * Iterates over an array or collection of image nodes, preparing each node for manual image
     * extraction when user taps the indicated area
     * 
     * @param {Object} images An array or collection of DOM image nodes
     * @param {Object} selectedArchive The ZIM archive picked by the user
     */
    function setupManualImageExtraction(images, selectedArchive) {
        Array.prototype.slice.call(images).forEach(function (image) {
            var originalHeight = image.getAttribute('height') || '';
            //Ensure 36px clickable image height so user can request images by tapping
            image.height = '36';
            if (contentInjectionMode ==='jquery') {
                image.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
                image.style.background = 'lightblue';
            }
            image.dataset.kiwixheight = originalHeight;
            image.addEventListener('click', function (e) {
                // If the image clicked on hasn't been extracted yet, cancel event bubbling, so that we don't navigate
                // away from the article if the image is hyperlinked
                if (image.dataset.kiwixurl) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                var visibleImages = queueImages(images);
                visibleImages.forEach(function (image) {
                    if (image.dataset.kiwixheight) image.height = image.dataset.kiwixheight;
                    else image.removeAttribute('height');
                    // Line below provides a visual indication to users of slow browsers that their click has been registered and
                    // images are being fetched; this is not necessary in SW mode because SW is only supported by faster browsers
                    if (contentInjectionMode ==='jquery') image.style.background = 'lightgray';
                });
                extractImages(visibleImages, selectedArchive);
            });
        });
    }

    /**
     * Sorts an array or collection of image nodes, returning a list of those that are inside the visible viewport 
     * 
     * @param {Object} images An array or collection of DOM image nodes
     * @returns {Array} An array of image nodes that are within the visible viewport 
     */
    function queueImages(images) {
        var visibleImages = [];
        for (var i = 0, l = images.length; i < l; i++) {
            if (!images[i].dataset.kiwixurl) continue;
            if (uiUtil.isElementInView(images[i])) {
                visibleImages.push(images[i]);
            }
        }
        return visibleImages;
    }

    /**
     * Prepares an array or collection of image nodes that have been disabled in Service Worker for manual extraction
     * 
     * @param {Object} images An array or collection of DOM image nodes
     * @param {String} displayType If 'progressive', lazyLoad will be used; if 'manual', setupManualImageExtraction will be used
     */
    function prepareImagesServiceWorker (images, displayType) {
        var zimImages = [];
        for (var i = 0, l = images.length; i < l; i++) {
            // DEV: make sure list of file types here is the same as the list in Service Worker code
            if (/(^|\/)[IJ]\/.*\.(jpe?g|png|svg|gif)($|[?#])/i.test(images[i].src)) {
                images[i].dataset.kiwixurl = images[i].getAttribute('src');
                zimImages.push(images[i]);
            }
        }
        if (displayType === 'manual') {
            setupManualImageExtraction(zimImages);
        } else {
            lazyLoad(zimImages);
        }
    }

    /**
     * Processes an array or collection of image nodes so that they will be lazy loaded (progressive extraction)
     * 
     * @param {Object} images And array or collection of DOM image nodes which will be processed for 
     *        progressive image extraction 
     * @param {Object} selectedArchive The archive picked by the user
     */
    function lazyLoad(images, selectedArchive) {
        var queue;
        var getImages = function() {
            queue = queueImages(images);
            extractImages(queue, selectedArchive);
        };
        getImages();
        // Sometimes the page hasn't been rendered when getImages() is run, especially in Firefox, so run again after delay
        setTimeout(getImages, 700);
        if (queue.length === images.length) return;
        // There are images remaining, so set up an event listener to load more images once user has stopped scrolling the iframe
        var iframe = document.getElementById('articleContent');
        var iframeWindow = iframe.contentWindow;
        iframeWindow.addEventListener('scroll', function() {
            clearTimeout(timer);
            // Waits for a period after scroll start to start checking for images
            var timer = setTimeout(getImages, 600);
        });
    }

    /**
     * A utility to set the contentInjectionmode in this module
     * It should be called when the user changes the contentInjectionMode
     * 
     * @param {String} injectionMode The contentInjectionMode selected by the user
     */
    function setContentInjectionMode(injectionMode) {
        contentInjectionMode = injectionMode;
    }

    /**
     * Functions and classes exposed by this module
     */
    return {
        extractImages: extractImages,
        setupManualImageExtraction: setupManualImageExtraction,
        prepareImagesServiceWorker: prepareImagesServiceWorker,
        lazyLoad: lazyLoad,
        setContentInjectionMode: setContentInjectionMode
    };
<<<<<<< refs/remotes/origin/Allow-manual-extraction-of-images
});
=======
});
>>>>>>> Image extraction #173
