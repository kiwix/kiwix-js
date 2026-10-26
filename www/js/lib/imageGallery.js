/**
 * imageGallery.js : Image gallery extraction and rendering controller (Issue #277)
 *
 * Extracts images and captions from article HTML in matching search results
 * and renders an image gallery supporting both ServiceWorker and Restricted modes.
 *
 * Copyright 2026 Kiwix-JS contributors
 * Licence GPL v3
 */

'use strict';

import uiUtil from './uiUtil.js';
import translateUI from './translateUI.js';

/**
 * Tidies whitespace for captions extracted from the DOM.
 *
 * @param {String} rawText Extracted text string
 * @returns {String} Normalized plain text
 */
function cleanCaption (rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    return rawText.replace(/\s+/g, ' ').trim();
}

/**
 * Evaluates image attributes to filter out UI chrome, small flags, icons,
 * spacer pixels, and mathematical SVGs, while preserving legitimate article images.
 *
 * @param {Object} attrs Image attributes { src, className, alt, width, height }
 * @returns {Boolean} True if image passes filter, false if junk
 */
function filterJunkImage (attrs) {
    if (!attrs) return false;
    var src = attrs.src || attrs.rawSrc || '';
    if (!src) return false;

    // Reject data URIs (e.g. inline spacer gifs, icons, or base64 placeholders)
    if (/^data:/i.test(src)) {
        return false;
    }

    // Reject mathematical SVGs and formulas
    var className = attrs.className || attrs['class'] || '';
    if (/(?:mwe-math|fallback-image-inline|\bmath\b|formula)/i.test(className)) {
        return false;
    }
    if (/(?:\/math\/|render\/math|\.svg.*math)/i.test(src)) {
        return false;
    }
    var alt = attrs.alt || '';
    if (/^(?:\{\\displaystyle|\\text\{)/.test(alt.trim())) {
        return false;
    }

    // Reject UI chrome, icons, buttons, navigation/metadata, bullets, spacers
    if (/(?:flagicon|\bicon\b|\bbutton\b|\bnavbox\b|\bambox\b|\bmetadata\b|\bnoprint\b|\bmagnify-clip\b|mw-logo)/i.test(className)) {
        return false;
    }
    if (/(?:pixel\.gif|spacer\.gif|spinner|disambig)/i.test(src)) {
        return false;
    }

    // Dimension filtering: reject explicitly tiny dimensions (icons, bullets)
    var width = parseInt(attrs.width, 10);
    var height = parseInt(attrs.height, 10);
    var hasWidth = !isNaN(width);
    var hasHeight = !isNaN(height);

    if (hasWidth && hasHeight) {
        if ((width < 48 && height < 48) || width < 32 || height < 32) {
            return false;
        }
    } else if (hasWidth && width < 32) {
        return false;
    } else if (hasHeight && height < 32) {
        return false;
    }

    return true;
}

/**
 * Extracts candidate images and captions from article HTML content.
 * Never mutates global appstate.baseUrl.
 *
 * @param {String} htmlArticle The HTML content of the article
 * @param {DirEntry} dirEntry The DirEntry object of the article
 * @param {Object} [options] Archive options (zimType, archive, indexRoot, fileName)
 * @returns {Array<Object>} Array of extracted image items
 */
function extractImagesFromArticleHtml (htmlArticle, dirEntry, options) {
    if (!htmlArticle || typeof htmlArticle !== 'string') return [];
    options = options || {};

    var baseUrl = options.baseUrl;
    if (!baseUrl && dirEntry) {
        var ns = dirEntry.namespace || '';
        var entryUrl = dirEntry.url || '';
        baseUrl = encodeURI(ns + '/' + entryUrl.replace(/[^/]+$/, ''));
    }
    baseUrl = baseUrl || '';

    // Ensure asset URLs are transformed according to archive type (Zimit1/Zimit2/standard).
    // transformArticleHtmlForRestrictedMode safely handles standard ZIM, classic Zimit 1,
    // Zimit 2, and mixed HTML in a single pass.
    htmlArticle = uiUtil.transformArticleHtmlForRestrictedMode(htmlArticle, {
        dirEntry: dirEntry,
        baseUrl: baseUrl,
        archive: options.archive,
        zimType: options.zimType || (options.archive && options.archive.zimType),
        zimitPrefix: options.zimitPrefix || (options.archive && options.archive.zimitPrefix),
        fileName: options.fileName || (options.archive && options.archive.file && options.archive.file.name),
        indexRoot: options.indexRoot
    });

    var articleTitle = (dirEntry && (dirEntry.title || (typeof dirEntry.getTitleOrUrl === 'function' && dirEntry.getTitleOrUrl()))) || '';
    var articleUrl = (dirEntry && dirEntry.url) || '';
    var extracted = [];
    var seenUrlsInArticle = new Set();

    // Check for DOMParser in globalThis or window
    var DOMParserClass = typeof DOMParser !== 'undefined' ? DOMParser : (typeof window !== 'undefined' ? window.DOMParser : null);

    if (DOMParserClass) {
        try {
            var parser = new DOMParserClass();
            var doc = parser.parseFromString(htmlArticle, 'text/html');
            var imgElements = doc.querySelectorAll('img');

            for (var i = 0; i < imgElements.length; i++) {
                var imgNode = imgElements[i];
                var rawSrc = imgNode.getAttribute('data-kiwixurl') || imgNode.getAttribute('src') || '';
                if (!rawSrc) continue;

                var className = imgNode.className || '';
                var alt = imgNode.getAttribute('alt') || '';
                var title = imgNode.getAttribute('title') || '';
                var width = imgNode.getAttribute('width') || '';
                var height = imgNode.getAttribute('height') || '';

                if (!filterJunkImage({
                    src: rawSrc,
                    className: className,
                    alt: alt,
                    width: width,
                    height: height
                })) {
                    continue;
                }

                // Resolve image URL against explicit baseUrl without touching global state
                var resolvedUrl = imgNode.getAttribute('data-kiwixurl') || uiUtil.resolveImageUrl(rawSrc, baseUrl, options);
                if (!resolvedUrl || seenUrlsInArticle.has(resolvedUrl)) {
                    continue;
                }
                seenUrlsInArticle.add(resolvedUrl);

                // Extract caption from closest figure/thumb/infobox or fallback to alt/title
                var caption = '';
                var fig = typeof imgNode.closest === 'function' ? imgNode.closest('figure') : null;
                if (fig) {
                    var figcap = fig.querySelector('figcaption');
                    if (figcap) caption = cleanCaption(figcap.textContent);
                }
                if (!caption) {
                    var thumb = typeof imgNode.closest === 'function' ? imgNode.closest('.thumb') : null;
                    if (thumb) {
                        var thumbcap = thumb.querySelector('.thumbcaption');
                        if (thumbcap) caption = cleanCaption(thumbcap.textContent);
                    }
                }
                if (!caption) {
                    var infobox = typeof imgNode.closest === 'function' ? imgNode.closest('.infobox, table') : null;
                    if (infobox) {
                        var infocap = infobox.querySelector('.infobox-caption');
                        if (infocap) caption = cleanCaption(infocap.textContent);
                    }
                }
                if (!caption) {
                    if (alt && !/\.(?:jpe?g|png|gif|svg|webp)$/i.test(alt.trim())) {
                        caption = cleanCaption(alt);
                    } else if (title) {
                        caption = cleanCaption(title);
                    }
                }

                extracted.push({
                    url: resolvedUrl,
                    rawSrc: rawSrc,
                    caption: caption,
                    alt: cleanCaption(alt),
                    dirEntry: dirEntry,
                    articleTitle: articleTitle,
                    articleUrl: articleUrl
                });
            }
            return extracted;
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
            return [];
        }
    }

    return [];
}

/**
 * Filters an array of DirEntry objects, returning only those that have not yet been processed,
 * and adds newly seen entries to the tracking set.
 *
 * @param {Array} dirEntryArray Array of DirEntry objects
 * @param {Set|Object} processedSet A Set (or Object map) tracking processed entry IDs
 * @returns {Array} Array of DirEntry objects that have not been processed yet
 */
function filterUnprocessedDirEntries (dirEntryArray, processedSet) {
    if (!dirEntryArray || !dirEntryArray.length) return [];
    if (!processedSet) return dirEntryArray.slice();

    var isSet = typeof processedSet.has === 'function' && typeof processedSet.add === 'function';
    var newEntries = [];

    for (var i = 0; i < dirEntryArray.length; i++) {
        var entry = dirEntryArray[i];
        if (!entry) continue;
        var id = entry.toStringId ? entry.toStringId() : (entry.url || String(i));
        var alreadyProcessed = isSet ? processedSet.has(id) : Boolean(processedSet[id]);
        if (!alreadyProcessed) {
            if (isSet) {
                processedSet.add(id);
            } else {
                processedSet[id] = true;
            }
            newEntries.push(entry);
        }
    }
    return newEntries;
}

/**
 * ImageGallery controller managing the gallery state, pagination,
 * cancellation, and rendering pipeline.
 */
var imageGallery = {
    activeSearch: null,
    searchId: 0,
    isExtracting: false,
    cancelled: false,

    processedDirEntries: new Set(),
    seenImageUrls: new Set(),
    pendingDirEntries: [],
    pendingImages: [],
    renderedImageCount: 0,

    container: null,
    grid: null,
    status: null,
    loadMoreContainer: null,
    loadMoreBtn: null,
    onSelectArticle: null,
    getArchive: null,
    getAppstate: null,
    options: {},

    TARGET_BATCH_IMAGES: 15,

    /**
     * Initialize gallery UI bindings and callbacks.
     */
    init: function (config) {
        config = config || {};
        this.container = config.container || null;
        this.grid = config.grid || null;
        this.status = config.status || null;
        this.loadMoreContainer = config.loadMoreContainer || null;
        this.loadMoreBtn = config.loadMoreBtn || null;
        this.onSelectArticle = config.onSelectArticle || null;
        this.getArchive = config.getArchive || null;
        this.getAppstate = config.getAppstate || null;

        var that = this;
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('mousedown', function (e) {
                e.preventDefault();
            });
            this.loadMoreBtn.addEventListener('click', function () {
                that.loadMore();
            });
        }
    },

    /**
     * Checks whether processing for the given search object (or active search) is cancelled.
     */
    isCancelled: function (searchObj) {
        if (this.cancelled) return true;
        var search = searchObj || this.activeSearch;
        if (!search) return true;
        if (search.status === 'cancelled') return true;
        if (this.activeSearch && search !== this.activeSearch) return true;
        if (typeof this.getAppstate === 'function') {
            var appstate = this.getAppstate();
            if (appstate && appstate.search) {
                if (appstate.search !== search || appstate.search.status === 'cancelled') {
                    return true;
                }
            }
        }
        return false;
    },

    /**
     * Resets all search and gallery state.
     */
    reset: function () {
        this.cancel();
        this.cancelled = false;
        this.searchId++;
        this.activeSearch = null;
        this.isExtracting = false;
        this.processedDirEntries = new Set();
        this.seenImageUrls = new Set();
        this.pendingDirEntries = [];
        this.pendingImages = [];
        this.renderedImageCount = 0;

        if (this.grid) {
            this.grid.innerHTML = '';
        }
        if (this.status) {
            this.status.textContent = '';
            this.status.style.display = 'none';
        }
        if (this.loadMoreContainer) {
            this.loadMoreContainer.style.display = 'none';
        }
    },

    /**
     * Cancels any active or pending extraction tasks.
     */
    cancel: function () {
        this.cancelled = true;
        this.searchId++;
        this.activeSearch = null;
        this.pendingImages = [];
        this.pendingDirEntries = [];
        this.isExtracting = false;
    },

    /**
     * Clean up resources when search is closed or navigating away.
     */
    cleanup: function () {
        this.cancel();
    },

    /**
     * Ingests search result articles and triggers progressive image extraction.
     * Avoids duplicate processing across interim and final search callbacks.
     */
    loadImagesForSearch: function (dirEntryArray, reportingSearch, options) {
        if (!dirEntryArray || !reportingSearch) return Promise.resolve();
        if (reportingSearch.status === 'cancelled') {
            return Promise.resolve();
        }
        if (typeof this.getAppstate === 'function') {
            var appstate = this.getAppstate();
            if (appstate && appstate.search && (appstate.search !== reportingSearch || appstate.search.status === 'cancelled')) {
                return Promise.resolve();
            }
        }

        if (this.activeSearch !== reportingSearch || this.cancelled) {
            this.reset();
            this.activeSearch = reportingSearch;
        } else if (this.isCancelled(reportingSearch)) {
            return Promise.resolve();
        }

        this.options = options || {};

        var newEntries = filterUnprocessedDirEntries(dirEntryArray, this.processedDirEntries);
        if (!newEntries.length && this.isExtracting) {
            return Promise.resolve();
        }

        this.pendingDirEntries = this.pendingDirEntries.concat(newEntries);

        if (!this.isExtracting) {
            return this.processQueue();
        }
        return Promise.resolve();
    },

    /**
     * Processes pending articles in batches until ~10-20 images are found or entries are exhausted.
     * Performs sequential archive reads for both HTML and binary image files.
     */
    processQueue: function () {
        if (this.isExtracting || this.isCancelled()) return Promise.resolve();
        if (!this.pendingDirEntries.length && !this.pendingImages.length) {
            this.updateStatusAndControls();
            return Promise.resolve();
        }

        this.isExtracting = true;
        var currentSearch = this.activeSearch;
        var currentSearchId = this.searchId;
        var that = this;

        var checkCancelled = function () {
            return that.searchId !== currentSearchId || that.isCancelled(currentSearch);
        };

        if (this.status && this.renderedImageCount === 0) {
            this.status.textContent = translateUI.t('search-gallery-loading') || 'Loading images...';
            this.status.style.display = '';
        }

        var imagesFoundInBatch = 0;
        var targetBatchImages = this.TARGET_BATCH_IMAGES || 15;

        return new Promise(function (resolve) {
            function step () {
                if (checkCancelled()) {
                    that.isExtracting = false;
                    resolve();
                    return;
                }

                if (imagesFoundInBatch >= targetBatchImages) {
                    that.isExtracting = false;
                    that.updateStatusAndControls();
                    resolve();
                    return;
                }

                if (that.pendingImages.length > 0) {
                    var imgItem = that.pendingImages.shift();
                    that.renderImageCard(imgItem, checkCancelled, function (err) {
                        if (checkCancelled()) {
                            that.isExtracting = false;
                            resolve();
                            return;
                        }
                        if (!err) {
                            imagesFoundInBatch++;
                            that.renderedImageCount++;
                        }
                        step();
                    });
                    return;
                }

                if (that.pendingDirEntries.length > 0) {
                    var dirEntry = that.pendingDirEntries.shift();
                    that.loadAndExtractArticle(dirEntry, that.options, checkCancelled, function (err, images) {
                        if (checkCancelled()) {
                            that.isExtracting = false;
                            resolve();
                            return;
                        }
                        if (!err && images && images.length) {
                            for (var i = 0; i < images.length; i++) {
                                var candidate = images[i];
                                if (!that.seenImageUrls.has(candidate.url)) {
                                    that.seenImageUrls.add(candidate.url);
                                    that.pendingImages.push(candidate);
                                }
                            }
                        }
                        step();
                    });
                    return;
                }

                that.isExtracting = false;
                that.updateStatusAndControls();
                resolve();
            }

            step();
        });
    },

    /**
     * User-facing "Load more" trigger.
     */
    loadMore: function () {
        if (this.isExtracting || this.isCancelled() || (!this.pendingDirEntries.length && !this.pendingImages.length)) return Promise.resolve();
        if (this.loadMoreContainer) {
            this.loadMoreContainer.style.display = 'none';
        }
        return this.processQueue();
    },

    /**
     * Updates visibility of "Load more" button and empty state status.
     */
    updateStatusAndControls: function () {
        if (this.isCancelled()) return;

        if (this.pendingDirEntries.length > 0 || this.pendingImages.length > 0) {
            if (this.loadMoreContainer) {
                this.loadMoreContainer.style.display = '';
            }
            if (this.status) {
                this.status.style.display = 'none';
            }
        } else {
            if (this.loadMoreContainer) {
                this.loadMoreContainer.style.display = 'none';
            }
            if (this.status) {
                if (this.renderedImageCount === 0) {
                    this.status.textContent = translateUI.t('search-gallery-no-images') || 'No images found for this search.';
                    this.status.style.display = '';
                } else {
                    this.status.style.display = 'none';
                }
            }
        }
    },

    /**
     * Reads article HTML from archive (resolving redirects if needed) and extracts images.
     */
    loadAndExtractArticle: function (dirEntry, options, checkCancelled, callback) {
        options = options || this.options || {};
        var archive = options.archive || (this.getArchive ? this.getArchive() : null);
        if (!archive || !dirEntry) {
            return callback(new Error('Archive or DirEntry missing'));
        }
        if (!options.archive) {
            options = Object.assign({}, options, { archive: archive });
        }

        function readEntry (entryToRead) {
            if (checkCancelled()) return callback(new Error('Cancelled'));
            try {
                var readPromise = archive.readUtf8File(entryToRead, function (fileEntry, html) {
                    if (checkCancelled()) return callback(new Error('Cancelled'));
                    try {
                        var images = extractImagesFromArticleHtml(html, entryToRead, options);
                        callback(null, images);
                    } catch (e) {
                        callback(e);
                    }
                });
                if (readPromise && typeof readPromise.catch === 'function') {
                    readPromise.catch(function (err) {
                        callback(err);
                    });
                }
            } catch (err) {
                callback(err);
            }
        }

        if (typeof dirEntry.isRedirect === 'function' && dirEntry.isRedirect()) {
            try {
                var redirectPromise = archive.resolveRedirect(dirEntry, function (targetEntry) {
                    if (checkCancelled()) return callback(new Error('Cancelled'));
                    if (!targetEntry) return callback(new Error('Redirect could not be resolved'));
                    readEntry(targetEntry);
                });
                if (redirectPromise && typeof redirectPromise.catch === 'function') {
                    redirectPromise.catch(function (err) {
                        callback(err);
                    });
                }
            } catch (err) {
                callback(err);
            }
        } else {
            readEntry(dirEntry);
        }
    },

    /**
     * Renders a single image card safely using DOM methods and textContent.
     */
    renderImageCard: function (imgItem, checkCancelled, callback) {
        var that = this;
        if (!this.grid || checkCancelled()) {
            if (callback) callback();
            return;
        }

        var card = document.createElement('a');
        card.href = '#';
        card.className = 'image-gallery-card';
        card.setAttribute('role', 'option');
        card.setAttribute('tabindex', '0');

        var captionText = imgItem.caption || imgItem.alt || imgItem.articleTitle || '';
        card.setAttribute('aria-label', captionText);

        var thumbContainer = document.createElement('div');
        thumbContainer.className = 'image-gallery-thumb-container';

        var img = document.createElement('img');
        img.className = 'image-gallery-thumb';
        img.alt = captionText;

        thumbContainer.appendChild(img);
        card.appendChild(thumbContainer);

        if (captionText) {
            var captionDiv = document.createElement('div');
            captionDiv.className = 'image-gallery-caption';
            captionDiv.textContent = captionText;
            card.appendChild(captionDiv);
        }

        var onActivate = function (e) {
            if (e) e.preventDefault();
            if (typeof that.onSelectArticle === 'function') {
                that.onSelectArticle(imgItem.dirEntry);
            }
        };

        card.addEventListener('mousedown', function (e) {
            e.preventDefault();
        });
        card.addEventListener('click', onActivate);
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                onActivate(e);
            }
        });

        this.grid.appendChild(card);

        this.loadImageSource(img, card, imgItem.url, checkCancelled, callback);
    },

    /**
     * Loads the image binary data and feeds via shared uiUtil.feedNodeWithDataURI.
     * Uses one unified pipeline in all modes, honouring WebP transcoding and canvas configurations.
     */
    loadImageSource: function (imgNode, cardNode, resolvedUrl, checkCancelled, callback) {
        var archive = this.options.archive || (this.getArchive ? this.getArchive() : null);

        var cleanPath = (resolvedUrl || '').replace(/^\//, '').replace(/#.*$/, '');

        if (!archive || typeof archive.getDirEntryByPath !== 'function') {
            if (callback) callback(new Error('No archive available'));
            return;
        }

        var decodedPath = decodeURIComponent(cleanPath);
        archive.getDirEntryByPath(decodedPath).then(function (entry) {
            if (checkCancelled()) {
                if (cardNode && cardNode.parentNode) {
                    cardNode.parentNode.removeChild(cardNode);
                }
                if (callback) callback(new Error('Cancelled'));
                return;
            }
            if (!entry) {
                if (cardNode && cardNode.parentNode) {
                    cardNode.parentNode.removeChild(cardNode);
                }
                if (callback) callback(new Error('Image not found in archive'));
                return;
            }
            try {
                var readPromise = archive.readBinaryFile(entry, function (fileEntry, content) {
                    if (checkCancelled()) {
                        if (cardNode && cardNode.parentNode) {
                            cardNode.parentNode.removeChild(cardNode);
                        }
                        if (callback) callback(new Error('Cancelled'));
                        return;
                    }
                    var mimeType = (typeof entry.getMimetype === 'function' ? entry.getMimetype() : '') || 'image/jpeg';
                    uiUtil.feedNodeWithDataURI(imgNode, 'src', content, mimeType, function () {
                        if (callback) callback(null);
                    }, checkCancelled);
                });
                if (readPromise && typeof readPromise.catch === 'function') {
                    readPromise.catch(function (err) {
                        if (cardNode && cardNode.parentNode) {
                            cardNode.parentNode.removeChild(cardNode);
                        }
                        if (callback) callback(err);
                    });
                }
            } catch (readErr) {
                if (cardNode && cardNode.parentNode) {
                    cardNode.parentNode.removeChild(cardNode);
                }
                if (callback) callback(readErr);
            }
        }).catch(function (err) {
            if (cardNode && cardNode.parentNode) {
                cardNode.parentNode.removeChild(cardNode);
            }
            if (callback) callback(err);
        });
    }
};

export {
    cleanCaption,
    filterJunkImage,
    extractImagesFromArticleHtml,
    filterUnprocessedDirEntries,
    imageGallery
};

export default imageGallery;
