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

/* global params, webpMachine */

import uiUtil from './uiUtil.js';
import translateUI from './translateUI.js';

/**
 * Strips HTML tags and normalizes entities to produce safe plain text for captions.
 *
 * @param {String} rawText HTML or text string
 * @returns {String} Normalized plain text
 */
function cleanCaption (rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    // Replace block-level end tags and linebreaks with spaces
    var text = rawText.replace(/(?:<\/(?:p|div|li|tr|figure|figcaption)>|<br\b[^>]*>)/gi, ' ');
    // Strip all remaining inline HTML tags, repeating to handle nested or malformed tags
    // Bounded with explicit termination checks to guarantee completion
    var prev = '';
    var passes = 0;
    while (text !== prev && passes < 10) {
        prev = text;
        text = text.replace(/<[a-zA-Z/!?][^<>]*>/g, '');
        passes++;
    }
    // Remove any unclosed tag-like prefix or suffix (e.g. <script without matching >)
    text = text.replace(/<[a-z/][^>]*$/gi, '');
    // Replace non-breaking spaces and entity codes in a single pass to prevent double unescaping
    var entityMap = {
        '&nbsp;': ' ',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&amp;': '&'
    };
    text = text.replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, function (entity) {
        return entityMap[entity] || entity;
    });
    // Remove space before punctuation introduced by tag stripping
    text = text.replace(/\s+([.,;:!?])/g, '$1');
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
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

    // Reject non-WebP data URIs (e.g. inline spacer gifs or base64 icons)
    if (/^data:(?!image\/webp)/i.test(src)) {
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
                var rawSrc = imgNode.getAttribute('src') || imgNode.getAttribute('data-kiwixurl') || '';
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
                var resolvedUrl = uiUtil.resolveImageUrl(rawSrc, baseUrl, options);
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
            // Fall back to regex parsing if DOMParser throws
        }
    }

    // Fallback regex parsing (for environments without DOMParser)
    var imgRegex = /<img\b([^>]*?)>/gi;
    var match;
    while ((match = imgRegex.exec(htmlArticle)) !== null) {
        var tagAttrs = match[1];
        var srcMatch = tagAttrs.match(/(?:src|data-kiwixurl)\s*=\s*(["'])(.+?)\1/i);
        if (!srcMatch) continue;
        var src = srcMatch[2];

        var classMatch = tagAttrs.match(/class\s*=\s*(["'])(.+?)\1/i);
        var cls = classMatch ? classMatch[2] : '';

        var altMatch = tagAttrs.match(/alt\s*=\s*(["'])(.+?)\1/i);
        var altText = altMatch ? altMatch[2] : '';

        var titleMatch = tagAttrs.match(/title\s*=\s*(["'])(.+?)\1/i);
        var titleText = titleMatch ? titleMatch[2] : '';

        var widthMatch = tagAttrs.match(/width\s*=\s*(["']?)(\d+)\1?/i);
        var w = widthMatch ? widthMatch[2] : '';

        var heightMatch = tagAttrs.match(/height\s*=\s*(["']?)(\d+)\1?/i);
        var h = heightMatch ? heightMatch[2] : '';

        if (!filterJunkImage({
            src: src,
            className: cls,
            alt: altText,
            width: w,
            height: h
        })) {
            continue;
        }

        var resolved = uiUtil.resolveImageUrl(src, baseUrl, options);
        if (!resolved || seenUrlsInArticle.has(resolved)) {
            continue;
        }
        seenUrlsInArticle.add(resolved);

        var cap = '';
        if (altText && !/\.(?:jpe?g|png|gif|svg|webp)$/i.test(altText.trim())) {
            cap = cleanCaption(altText);
        } else if (titleText) {
            cap = cleanCaption(titleText);
        }

        extracted.push({
            url: resolved,
            rawSrc: src,
            caption: cap,
            alt: cleanCaption(altText),
            dirEntry: dirEntry,
            articleTitle: articleTitle,
            articleUrl: articleUrl
        });
    }

    return extracted;
}

/**
 * ImageGallery controller managing the gallery state, pagination,
 * cancellation, and rendering pipeline.
 */
var imageGallery = {
    searchId: 0,
    searchPrefix: '',
    isExtracting: false,
    cancelled: false,

    processedDirEntries: new Set(),
    seenImageUrls: new Set(),
    pendingDirEntries: [],
    renderedImageCount: 0,
    galleryBlobUrls: [],

    container: null,
    grid: null,
    status: null,
    loadMoreContainer: null,
    loadMoreBtn: null,
    onSelectArticle: null,
    getArchive: null,
    getParams: null,
    getAppstate: null,
    options: {},

    BATCH_SIZE: 10,

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
        this.getParams = config.getParams || null;
        this.getAppstate = config.getAppstate || null;

        var that = this;
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', function () {
                that.loadMore();
            });
        }
    },

    /**
     * Resets all search and gallery state and revokes any gallery-owned blob URLs.
     */
    reset: function () {
        this.cancel();
        this.searchId++;
        this.searchPrefix = '';
        this.isExtracting = false;
        this.cancelled = false;
        this.processedDirEntries = new Set();
        this.seenImageUrls = new Set();
        this.pendingDirEntries = [];
        this.renderedImageCount = 0;
        this.revokeGalleryBlobUrls();

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
        this.isExtracting = false;
    },

    /**
     * Revokes only blob URLs created and owned by the gallery.
     */
    revokeGalleryBlobUrls: function () {
        if (this.galleryBlobUrls && this.galleryBlobUrls.length) {
            for (var i = 0; i < this.galleryBlobUrls.length; i++) {
                try {
                    if (typeof window !== 'undefined' && window.URL && typeof window.URL.revokeObjectURL === 'function') {
                        window.URL.revokeObjectURL(this.galleryBlobUrls[i]);
                    }
                // eslint-disable-next-line no-unused-vars
                } catch (e) {
                    // Ignore errors during revocation
                }
            }
            this.galleryBlobUrls = [];
        }
    },

    /**
     * Clean up resources when search is closed or navigating away.
     */
    cleanup: function () {
        this.cancel();
        this.revokeGalleryBlobUrls();
    },

    /**
     * Ingests search result articles and triggers progressive image extraction.
     * Avoids duplicate processing across interim and final search callbacks.
     */
    loadImagesForSearch: function (dirEntryArray, reportingSearch, options) {
        if (!dirEntryArray || !reportingSearch) return;
        if (reportingSearch.status === 'cancelled') {
            this.cancel();
            return;
        }

        var prefix = reportingSearch.prefix || '';
        if (prefix !== this.searchPrefix) {
            this.reset();
            this.searchPrefix = prefix;
        }

        this.options = options || {};

        var newEntries = uiUtil.filterUnprocessedDirEntries(dirEntryArray, this.processedDirEntries);
        if (!newEntries.length && this.isExtracting) {
            return;
        }

        this.pendingDirEntries = this.pendingDirEntries.concat(newEntries);

        if (!this.isExtracting) {
            return this.processQueue();
        }
        return Promise.resolve();
    },

    /**
     * Processes pending articles in batches.
     */
    processQueue: function () {
        if (this.cancelled || this.isExtracting) return Promise.resolve();
        if (!this.pendingDirEntries.length) {
            this.updateStatusAndControls();
            return Promise.resolve();
        }

        this.isExtracting = true;
        var currentSearchId = this.searchId;
        var that = this;

        var checkCancelled = function () {
            return that.cancelled || currentSearchId !== that.searchId;
        };

        if (this.status && this.renderedImageCount === 0) {
            this.status.textContent = translateUI.t('search-gallery-loading') || 'Loading images...';
            this.status.style.display = '';
        }

        var batch = this.pendingDirEntries.splice(0, this.BATCH_SIZE);
        var imagesFoundInBatch = 0;

        return uiUtil.processSequentialQueue(batch, function (dirEntry, nextEntry) {
            if (checkCancelled()) {
                return nextEntry();
            }

            that.loadAndExtractArticle(dirEntry, that.options, checkCancelled, function (err, images) {
                if (checkCancelled()) {
                    return nextEntry();
                }
                if (!err && images && images.length) {
                    for (var i = 0; i < images.length; i++) {
                        var imgItem = images[i];
                        if (!that.seenImageUrls.has(imgItem.url)) {
                            that.seenImageUrls.add(imgItem.url);
                            that.renderImageCard(imgItem, checkCancelled);
                            imagesFoundInBatch++;
                            that.renderedImageCount++;
                        }
                    }
                }
                nextEntry();
            });
        }, {
            isCancelled: checkCancelled,
            onComplete: function () {
                that.isExtracting = false;
                if (checkCancelled()) return;

                // If no images found in this batch but more articles remain, auto-process next batch
                if (imagesFoundInBatch === 0 && that.pendingDirEntries.length > 0) {
                    that.processQueue();
                } else {
                    that.updateStatusAndControls();
                }
            }
        });
    },

    /**
     * User-facing "Load more" trigger.
     */
    loadMore: function () {
        if (this.isExtracting || !this.pendingDirEntries.length) return Promise.resolve();
        if (this.loadMoreContainer) {
            this.loadMoreContainer.style.display = 'none';
        }
        return this.processQueue();
    },

    /**
     * Updates visibility of "Load more" button and empty state status.
     */
    updateStatusAndControls: function () {
        if (this.cancelled) return;

        if (this.pendingDirEntries.length > 0) {
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
        var archive = options.archive || (this.getArchive ? this.getArchive() : null);
        if (!archive || !dirEntry) {
            return callback(new Error('Archive or DirEntry missing'));
        }

        function readEntry (entryToRead) {
            if (checkCancelled()) return callback(new Error('Cancelled'));
            archive.readUtf8File(entryToRead, function (fileEntry, html) {
                if (checkCancelled()) return callback(new Error('Cancelled'));
                try {
                    var images = extractImagesFromArticleHtml(html, entryToRead, options);
                    callback(null, images);
                } catch (e) {
                    callback(e);
                }
            }).catch(function (err) {
                callback(err);
            });
        }

        if (typeof dirEntry.isRedirect === 'function' && dirEntry.isRedirect()) {
            archive.resolveRedirect(dirEntry, function (targetEntry) {
                if (checkCancelled()) return callback(new Error('Cancelled'));
                if (!targetEntry) return callback(new Error('Redirect could not be resolved'));
                readEntry(targetEntry);
            }).catch(function (err) {
                callback(err);
            });
        } else {
            readEntry(dirEntry);
        }
    },

    /**
     * Renders a single image card safely using DOM methods and textContent.
     */
    renderImageCard: function (imgItem, checkCancelled) {
        var that = this;
        if (!this.grid || checkCancelled()) return;

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

        this.loadImageSource(img, card, imgItem.url, checkCancelled);
    },

    /**
     * Loads the image binary data or assigns SW URL based on content injection mode.
     * Uses serialized WebP transcoding if webpMachine is active.
     */
    loadImageSource: function (imgNode, cardNode, resolvedUrl, checkCancelled, callback) {
        var that = this;
        var archive = this.options.archive || (this.getArchive ? this.getArchive() : null);
        var paramsObj = this.getParams ? this.getParams() : (typeof params !== 'undefined' ? params : {});
        var contentMode = (paramsObj && paramsObj.contentInjectionMode) || 'jquery';
        var isWebpMachineActive = Boolean(typeof webpMachine !== 'undefined' && webpMachine);

        var isSwMode = contentMode === 'serviceworker' || contentMode === 'serviceworkerlocal';

        var cleanPath = (resolvedUrl || '').replace(/^\//, '').replace(/#.*$/, '');

        // SW Mode: use service-worker URL unless WebP transcoding is required
        if (isSwMode && archive && archive.file && archive.file.name && (!isWebpMachineActive || !/\.webp(?:\?.*)?$/i.test(cleanPath))) {
            var swUrl = '../' + encodeURI(archive.file.name) + '/' + cleanPath;
            imgNode.src = swUrl;
            imgNode.onload = function () {
                if (callback) callback(null);
            };
            imgNode.onerror = function () {
                if (cardNode && cardNode.parentNode) {
                    cardNode.parentNode.removeChild(cardNode);
                }
                if (callback) callback(new Error('Image failed to load in SW mode'));
            };
            return;
        }

        // Restricted Mode (or WebP with webpMachine active):
        if (!archive || typeof archive.getDirEntryByPath !== 'function') {
            if (callback) callback(new Error('No archive available'));
            return;
        }

        var decodedPath = decodeURIComponent(cleanPath);
        archive.getDirEntryByPath(decodedPath).then(function (entry) {
            if (checkCancelled()) {
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
            archive.readBinaryFile(entry, function (fileEntry, content) {
                if (checkCancelled()) {
                    if (callback) callback(new Error('Cancelled'));
                    return;
                }
                var mimeType = (typeof entry.getMimetype === 'function' ? entry.getMimetype() : '') || 'image/jpeg';

                if (isWebpMachineActive && /image\/webp/i.test(mimeType)) {
                    uiUtil.transcodeWebpToDataUri(content, checkCancelled).then(function (dataUri) {
                        if (!checkCancelled()) {
                            imgNode.src = dataUri;
                            if (callback) callback(null);
                        }
                    }).catch(function (err) {
                        if (callback) callback(err);
                    });
                } else {
                    try {
                        var blob = new Blob([content], { type: mimeType });
                        var blobUrl = (typeof window !== 'undefined' && window.URL && typeof window.URL.createObjectURL === 'function')
                            ? window.URL.createObjectURL(blob)
                            : '';
                        if (blobUrl) {
                            that.galleryBlobUrls.push(blobUrl);
                            if (!checkCancelled()) {
                                imgNode.src = blobUrl;
                                if (callback) callback(null);
                            }
                            return;
                        }
                    // eslint-disable-next-line no-unused-vars
                    } catch (e) {
                        // Ignore and fall through to data URI
                    }

                    if (typeof FileReader !== 'undefined') {
                        uiUtil.getDataUriFromUint8Array(content, mimeType).then(function (dataUri) {
                            if (!checkCancelled()) {
                                imgNode.src = dataUri;
                                if (callback) callback(null);
                            }
                        }).catch(function (err) {
                            if (callback) callback(err);
                        });
                    } else if (callback) {
                        callback(null);
                    }
                }
            });
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
    imageGallery
};

export default imageGallery;
