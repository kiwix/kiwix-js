/* eslint-disable no-undef */
/**
 * Tests for Image Gallery extraction, filtering, and controller (Issue #277).
 *
 * Verifies that:
 * - Image URLs and captions are extracted from article HTML.
 * - Math formulas, UI chrome, small flags, and icons are filtered out.
 * - Captions and titles are rendered safely via textContent without raw HTML injection.
 * - Bounded sequential archive reads (concurrency = 1) and progressive loadMore batching work.
 * - Search lifecycle, cancellation, and re-searching after article navigation or Escape work cleanly.
 * - Missing images or archive read failures are handled gracefully without stalling.
 */

import { assert } from 'chai';
import '../js/init.js';
import uiUtil from '../../../www/js/lib/uiUtil.js';
import {
    cleanCaption,
    filterJunkImage,
    extractImagesFromArticleHtml,
    filterUnprocessedDirEntries,
    imageGallery
} from '../../../www/js/lib/imageGallery.js';

describe('Image Gallery Extraction and Controller (Issue #277)', function () {
    var originalFileReader;
    var originalWebpMachine;

    before(function () {
        originalFileReader = globalThis.FileReader;
        originalWebpMachine = globalThis.webpMachine;

        if (!globalThis.FileReader) {
            globalThis.FileReader = class MockFileReader {
                constructor () {
                    this.onloadend = null;
                    this.onerror = null;
                    this.result = null;
                }

                readAsDataURL (blob) {
                    if (blob && typeof blob.arrayBuffer === 'function') {
                        blob.arrayBuffer().then((buffer) => {
                            var base64 = Buffer.from(buffer).toString('base64');
                            var type = blob.type || 'application/octet-stream';
                            this.result = 'data:' + type + ';base64,' + base64;
                            if (typeof this.onloadend === 'function') {
                                this.onloadend();
                            }
                        }).catch((err) => {
                            if (typeof this.onerror === 'function') {
                                this.onerror(err);
                            }
                        });
                    } else {
                        setTimeout(() => {
                            this.result = 'data:application/octet-stream;base64,';
                            if (typeof this.onloadend === 'function') {
                                this.onloadend();
                            }
                        }, 0);
                    }
                }
            };
        }

        if (globalThis.webpMachine === undefined) {
            globalThis.webpMachine = null;
        }
    });

    after(function () {
        if (originalFileReader !== undefined) {
            globalThis.FileReader = originalFileReader;
        } else {
            delete globalThis.FileReader;
        }

        if (originalWebpMachine !== undefined) {
            globalThis.webpMachine = originalWebpMachine;
        } else {
            delete globalThis.webpMachine;
        }
    });

    describe('cleanCaption', function () {
        it('collapses extra whitespace, normalizes newlines/tabs, and handles null/undefined/empty gracefully', function () {
            assert.equal(cleanCaption('  A photo of Albert Einstein in 1921.   '), 'A photo of Albert Einstein in 1921.');
            assert.equal(cleanCaption('Portrait of\nMarie Curie\t\tduring\r\n1911.'), 'Portrait of Marie Curie during 1911.');
            assert.equal(cleanCaption(null), '');
            assert.equal(cleanCaption(undefined), '');
            assert.equal(cleanCaption(''), '');
            assert.equal(cleanCaption(123), '');
            assert.equal(cleanCaption({}), '');
        });

        it('preserves mathematical comparisons (a < b) and decoded entities without double-unescaping', function () {
            assert.equal(cleanCaption('Condition: a < b and c > d'), 'Condition: a < b and c > d');
            assert.equal(cleanCaption('Einstein & Bohr, 1927'), 'Einstein & Bohr, 1927');
            assert.equal(cleanCaption('Photo: &copy; 2024 Jane Doe'), 'Photo: &copy; 2024 Jane Doe');
            assert.equal(cleanCaption('Tom &amp; Jerry'), 'Tom &amp; Jerry');
        });
    });

    describe('filterJunkImage', function () {
        it('rejects math formulas, UI icons, tiny dimensions, empty src, and data URIs', function () {
            // Missing or empty src
            assert.isFalse(filterJunkImage({}));
            assert.isFalse(filterJunkImage({ src: '' }));

            // Data URIs (inline spacers, base64 icons, or placeholders)
            assert.isFalse(filterJunkImage({ src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==' }));
            assert.isFalse(filterJunkImage({ src: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }));
            assert.isFalse(filterJunkImage({ src: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA=' }));

            // Math formulas
            assert.isFalse(filterJunkImage({ src: '../math/formula123.svg' }));
            assert.isFalse(filterJunkImage({ src: '../I/eq.png', className: 'mwe-math-fallback-image-inline' }));
            assert.isFalse(filterJunkImage({ src: '../I/tex.png', alt: '{\\displaystyle x^2+y^2}' }));

            // UI icons, buttons, spacers, flags
            assert.isFalse(filterJunkImage({ src: '../I/clip.png', className: 'magnify-clip' }));
            assert.isFalse(filterJunkImage({ src: '../I/btn.svg', className: 'button' }));
            assert.isFalse(filterJunkImage({ src: '../I/flag.png', className: 'flagicon' }));
            assert.isFalse(filterJunkImage({ src: '../I/spacer.gif' }));

            // Explicitly tiny dimensions
            assert.isFalse(filterJunkImage({ src: '../I/tiny.jpg', width: 20, height: 20 }));
            assert.isFalse(filterJunkImage({ src: '../I/wide_flat.jpg', width: 200, height: 10 }));
        });

        it('accepts legitimate article images including WebP archive files', function () {
            assert.isTrue(filterJunkImage({
                src: '../I/RayCharles_Piano.jpg',
                width: 300,
                height: 250,
                alt: 'Ray Charles playing piano'
            }));
            assert.isTrue(filterJunkImage({
                src: '../I/RayCharles_Cover.webp',
                width: 300,
                height: 250,
                alt: 'Ray Charles album cover in WebP'
            }));
            assert.isTrue(filterJunkImage({
                src: '../I/Scientific_Diagram.svg',
                alt: 'Diagram of photosynthesis'
            }));
        });
    });

    describe('extractImagesFromArticleHtml', function () {
        var mockDirEntry = {
            namespace: 'A',
            url: 'Test_Article.html',
            title: 'Test Article',
            toStringId: function () { return 'A/Test_Article.html'; }
        };

        it('extracts images and figcaption from <figure> elements', function () {
            var html = '<figure>' +
                '  <img src="../I/Elephant.jpg" width="400" height="300" alt="African Elephant">' +
                '  <figcaption>An African elephant in Kenya, 2018.</figcaption>' +
                '</figure>';

            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1);
            assert.equal(images[0].url, 'I/Elephant.jpg');
            assert.equal(images[0].caption, 'An African elephant in Kenya, 2018.');
            assert.equal(images[0].alt, 'African Elephant');
            assert.equal(images[0].articleTitle, 'Test Article');
            assert.equal(images[0].dirEntry, mockDirEntry);
        });

        it('extracts images and thumbcaption from .thumb containers with alt or title fallback', function () {
            var htmlWithCaption = '<div class="thumb tright">' +
                '  <div class="thumbinner">' +
                '    <img src="../I/Guitar.jpg" width="300" height="200" alt="Fender Stratocaster">' +
                '    <div class="thumbcaption">Fender Stratocaster electric guitar</div>' +
                '  </div>' +
                '</div>';

            var images1 = extractImagesFromArticleHtml(htmlWithCaption, mockDirEntry);
            assert.equal(images1.length, 1);
            assert.equal(images1[0].url, 'I/Guitar.jpg');
            assert.equal(images1[0].caption, 'Fender Stratocaster electric guitar');

            var htmlFallback = '<div><img src="../I/Sunset.jpg" width="300" height="200" alt="Sunset over sea"></div>';
            var images2 = extractImagesFromArticleHtml(htmlFallback, mockDirEntry);
            assert.equal(images2.length, 1);
            assert.equal(images2[0].caption, 'Sunset over sea', 'Caption should fall back to alt attribute');
        });

        it('deduplicates identical image URLs within the same article', function () {
            var html = '<figure>' +
                '  <img src="../I/Repeated.jpg" width="400" height="300">' +
                '  <figcaption>First caption</figcaption>' +
                '</figure>' +
                '<figure>' +
                '  <img src="../I/Repeated.jpg" width="400" height="300">' +
                '  <figcaption>Second caption</figcaption>' +
                '</figure>';

            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1, 'Duplicate image URL within the same article must be deduplicated');
        });

        it('extracts WebP archive images while ignoring inline data URIs', function () {
            var html = '<figure>' +
                '  <img src="../I/Photo.webp" width="400" height="300" alt="WebP Photo">' +
                '  <figcaption>A WebP photo in archive</figcaption>' +
                '</figure>' +
                '<div>' +
                '  <img src="data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA=" alt="Inline WebP">' +
                '</div>';

            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1);
            assert.equal(images[0].url, 'I/Photo.webp');
            assert.equal(images[0].caption, 'A WebP photo in archive');
        });
    });

    describe('filterUnprocessedDirEntries', function () {
        it('deduplicates DirEntries against a tracking Set', function () {
            var processedSet = new Set(['entry-1']);
            var entries = [
                { toStringId: () => 'entry-1', title: 'A1' },
                { toStringId: () => 'entry-2', title: 'A2' },
                { toStringId: () => 'entry-3', title: 'A3' }
            ];

            var filtered = filterUnprocessedDirEntries(entries, processedSet);
            assert.equal(filtered.length, 2);
            assert.equal(filtered[0].title, 'A2');
            assert.equal(filtered[1].title, 'A3');
            assert.isTrue(processedSet.has('entry-2'));
            assert.isTrue(processedSet.has('entry-3'));
        });
    });

    describe('imageGallery Controller', function () {
        var container, grid, status, loadMoreContainer, loadMoreBtn;

        beforeEach(function () {
            container = document.createElement('div');
            grid = document.createElement('div');
            status = document.createElement('div');
            loadMoreContainer = document.createElement('div');
            loadMoreBtn = document.createElement('button');

            container.appendChild(grid);
            container.appendChild(status);
            container.appendChild(loadMoreContainer);
            loadMoreContainer.appendChild(loadMoreBtn);

            imageGallery.init({
                container: container,
                grid: grid,
                status: status,
                loadMoreContainer: loadMoreContainer,
                loadMoreBtn: loadMoreBtn
            });
            imageGallery.reset();
        });

        afterEach(function () {
            imageGallery.cancel();
        });

        it('renders image cards safely using DOM methods and textContent', function () {
            var testItem = {
                url: 'I/SafeTest.jpg',
                caption: '<b>Malicious tag</b> & a < b',
                alt: 'Alt text',
                articleTitle: 'Test Article',
                dirEntry: { toStringId: function () { return 'A/Test'; } }
            };

            var selectedEntry = null;
            imageGallery.onSelectArticle = function (entry) {
                selectedEntry = entry;
            };

            imageGallery.renderImageCard(testItem, function () { return false; });

            var card = grid.querySelector('.image-gallery-card');
            assert.isNotNull(card);
            assert.isTrue(card.classList.contains('image-gallery-card'));

            var captionEl = card.querySelector('.image-gallery-caption');
            assert.isNotNull(captionEl);
            assert.equal(captionEl.textContent, '<b>Malicious tag</b> & a < b', 'TextContent must preserve raw string without HTML parsing');
            assert.isNull(captionEl.querySelector('b'), 'Caption must not contain rendered HTML elements');

            card.click();
            assert.equal(selectedEntry, testItem.dirEntry, 'Clicking card must invoke onSelectArticle with the entry');
        });

        it('bounds initial image batch to TARGET_BATCH_IMAGES (15) and loads remaining via loadMore', async function () {
            var imgHtml = '';
            for (var i = 1; i <= 25; i++) {
                imgHtml += '<figure><img src="../I/Photo_' + i + '.jpg" width="200" height="200"><figcaption>Photo ' + i + '</figcaption></figure>';
            }

            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, imgHtml);
                    return Promise.resolve();
                },
                getDirEntryByPath: function () {
                    return Promise.resolve({ getMimetype: () => 'image/jpeg' });
                },
                readBinaryFile: function (entry, cb) {
                    cb(entry, new Uint8Array([1, 2, 3]));
                    return Promise.resolve();
                }
            };
            imageGallery.getArchive = function () { return mockArchive; };
            imageGallery.TARGET_BATCH_IMAGES = 15;

            var entry = { namespace: 'A', url: 'LongArticle.html', isRedirect: () => false, toStringId: () => 'A/LongArticle.html' };
            var search = { prefix: 'long', status: 'final' };

            await imageGallery.loadImagesForSearch([entry], search, { archive: mockArchive });

            var cardsFirstBatch = grid.querySelectorAll('.image-gallery-card');
            assert.equal(cardsFirstBatch.length, 15, 'Initial batch must be bounded to 15 images');
            assert.equal(imageGallery.pendingImages.length, 10, 'Remaining 10 images must be queued in pendingImages');
            assert.equal(loadMoreContainer.style.display, '', 'Load more button must be visible');

            await imageGallery.loadMore();

            var cardsSecondBatch = grid.querySelectorAll('.image-gallery-card');
            assert.equal(cardsSecondBatch.length, 25, 'Total cards rendered after loadMore must be 25');
            assert.equal(imageGallery.pendingImages.length, 0, 'pendingImages must be empty after draining');
            assert.equal(loadMoreContainer.style.display, 'none', 'Load more button must be hidden when all images exhausted');
        });

        it('executes archive reads strictly sequentially with max concurrency of 1', async function () {
            var activeReads = 0;
            var maxConcurrentReads = 0;

            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    activeReads++;
                    if (activeReads > maxConcurrentReads) maxConcurrentReads = activeReads;
                    setTimeout(function () {
                        activeReads--;
                        cb(entry, '<img src="../I/' + entry.url + '_img1.jpg" width="100" height="100">' +
                                  '<img src="../I/' + entry.url + '_img2.jpg" width="100" height="100">');
                    }, 10);
                    return Promise.resolve();
                },
                getDirEntryByPath: function (path) {
                    return Promise.resolve({
                        getMimetype: () => 'image/jpeg',
                        url: path
                    });
                },
                readBinaryFile: function (entry, cb) {
                    activeReads++;
                    if (activeReads > maxConcurrentReads) maxConcurrentReads = activeReads;
                    setTimeout(function () {
                        activeReads--;
                        cb(entry, new Uint8Array([1, 2, 3]));
                    }, 10);
                    return Promise.resolve();
                }
            };
            imageGallery.getArchive = function () { return mockArchive; };

            var entry1 = { namespace: 'A', url: 'Seq1.html', isRedirect: () => false, toStringId: () => 'A/Seq1.html' };
            var entry2 = { namespace: 'A', url: 'Seq2.html', isRedirect: () => false, toStringId: () => 'A/Seq2.html' };
            var search = { prefix: 'seq', status: 'final' };

            await imageGallery.loadImagesForSearch([entry1, entry2], search, { archive: mockArchive });

            assert.equal(maxConcurrentReads, 1, 'Maximum concurrent archive reads must be strictly 1');
            assert.equal(grid.querySelectorAll('.image-gallery-card').length, 4);
        });

        it('discards results from a replaced search and halts in-flight extraction on cancel', function () {
            var pendingReadCb = null;
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    if (entry.url === 'Old.html') {
                        pendingReadCb = function () {
                            cb(entry, '<figure><img src="../I/Old.jpg" width="200" height="200"><figcaption>Old</figcaption></figure>');
                        };
                        return Promise.resolve();
                    }
                    cb(entry, '<figure><img src="../I/New.jpg" width="200" height="200"><figcaption>New</figcaption></figure>');
                    return Promise.resolve();
                },
                getDirEntryByPath: function () {
                    return Promise.resolve({ getMimetype: () => 'image/jpeg' });
                },
                readBinaryFile: function (entry, cb) {
                    cb(entry, new Uint8Array([1, 2, 3]));
                    return Promise.resolve();
                }
            };
            imageGallery.getArchive = function () { return mockArchive; };

            var oldEntry = { namespace: 'A', url: 'Old.html', isRedirect: () => false, toStringId: () => 'A/Old.html' };
            var newEntry = { namespace: 'A', url: 'New.html', isRedirect: () => false, toStringId: () => 'A/New.html' };

            var search1 = { prefix: 'old', status: 'interim' };
            var search2 = { prefix: 'new', status: 'final' };

            imageGallery.loadImagesForSearch([oldEntry], search1, { archive: mockArchive });

            // Replace search while search1 read is pending
            search1.status = 'cancelled';
            imageGallery.loadImagesForSearch([newEntry], search2, { archive: mockArchive });

            // If old async read resolves now, it must be ignored
            if (pendingReadCb) pendingReadCb();

            return new Promise(function (resolve) {
                setTimeout(function () {
                    var cards = grid.querySelectorAll('.image-gallery-card');
                    assert.equal(cards.length, 1, 'Only cards from new search must exist');
                    var caption = cards[0].querySelector('.image-gallery-caption');
                    assert.equal(caption.textContent, 'New');

                    // Verify cancel resets state and stops extraction
                    imageGallery.cancel();
                    assert.isTrue(imageGallery.cancelled);
                    assert.isNull(imageGallery.activeSearch);
                    resolve();
                }, 50);
            });
        });

        it('allows repeating the same search after opening a gallery article or Escape dismissal', function () {
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<figure><img src="../I/Repeat.jpg" width="200" height="200"><figcaption>Repeat Caption</figcaption></figure>');
                    return Promise.resolve();
                },
                getDirEntryByPath: function () {
                    return Promise.resolve({ getMimetype: () => 'image/jpeg' });
                },
                readBinaryFile: function (entry, cb) {
                    cb(entry, new Uint8Array([1, 2, 3]));
                    return Promise.resolve();
                }
            };
            imageGallery.getArchive = function () { return mockArchive; };

            var entry = { namespace: 'A', url: 'Repeat.html', isRedirect: () => false, toStringId: () => 'A/Repeat.html' };
            var search1 = { prefix: 'repeat', status: 'final' };

            // Initial search
            imageGallery.loadImagesForSearch([entry], search1, { archive: mockArchive });

            return new Promise(function (resolve) {
                setTimeout(function () {
                    assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1);

                    // User opens article or presses Escape -> cancel() is called
                    imageGallery.cancel();
                    assert.isTrue(imageGallery.cancelled);
                    assert.equal(search1.status, 'final', 'Gallery cancel() must not mutate search1.status');

                    // User repeats the same search
                    var search2 = { prefix: 'repeat', status: 'final' };
                    imageGallery.loadImagesForSearch([entry], search2, { archive: mockArchive });
                    assert.isFalse(imageGallery.cancelled, 'Cancelled state must be cleared for new search');

                    setTimeout(function () {
                        assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1);
                        resolve();
                    }, 50);
                }, 50);
            });
        });

        it('cancels gallery operations without modifying the search object status', function () {
            var searchObj = { prefix: 'test', status: 'final' };
            var mockArchive = {
                readUtf8File: function () { return Promise.resolve(); },
                getDirEntryByPath: function () { return Promise.resolve(null); },
                readBinaryFile: function () { return Promise.resolve(); }
            };
            imageGallery.getArchive = function () { return mockArchive; };

            imageGallery.loadImagesForSearch([], searchObj, { archive: mockArchive });
            assert.equal(imageGallery.activeSearch, searchObj);

            imageGallery.cancel();
            assert.isTrue(imageGallery.cancelled, 'Gallery must be marked cancelled internally');
            assert.isNull(imageGallery.activeSearch, 'Gallery activeSearch must be cleared');
            assert.equal(searchObj.status, 'final', 'searchObj.status must not be mutated to cancelled');
        });

        it('recovers from failed archive reads and missing images without stalling subsequent images', async function () {
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<img src="../I/Img_Good1.jpg" width="100" height="100">' +
                              '<img src="../I/Img_Missing.jpg" width="100" height="100">' +
                              '<img src="../I/Img_Good2.jpg" width="100" height="100">');
                    return Promise.resolve();
                },
                getDirEntryByPath: function (path) {
                    if (path.indexOf('Img_Missing') !== -1) {
                        return Promise.resolve(null);
                    }
                    return Promise.resolve({
                        getMimetype: () => 'image/jpeg',
                        url: path
                    });
                },
                readBinaryFile: function (entry, cb) {
                    cb(entry, new Uint8Array([1, 2, 3]));
                    return Promise.resolve();
                }
            };
            imageGallery.getArchive = function () { return mockArchive; };

            var entry = { namespace: 'A', url: 'ErrorTest.html', isRedirect: () => false, toStringId: () => 'A/ErrorTest.html' };
            var search = { prefix: 'err', status: 'final' };

            await imageGallery.loadImagesForSearch([entry], search, { archive: mockArchive });

            var cards = grid.querySelectorAll('.image-gallery-card');
            assert.equal(cards.length, 2, 'Missing image card should be pruned; good image cards must render');
        });

        it('converts binary content to data URI via uiUtil.getDataUriFromUint8Array', async function () {
            var data = new Uint8Array([1, 2, 3]);
            var dataUri = await uiUtil.getDataUriFromUint8Array(data, 'image/jpeg');
            assert.equal(dataUri, 'data:image/jpeg;base64,AQID');
        });

        describe('Search Lifecycle, Cancellation, and Resumption (Phase 1)', function () {
            function createMockArchive (articlesMap) {
                return {
                    readUtf8File: function (entry, cb) {
                        var html = articlesMap[entry.url] || '';
                        cb(entry, html);
                        return Promise.resolve();
                    },
                    getDirEntryByPath: function (path) {
                        return Promise.resolve({
                            getMimetype: () => (/\.svg$/i.test(path) ? 'image/svg+xml' : 'image/jpeg'),
                            url: path
                        });
                    },
                    readBinaryFile: function (entry, cb) {
                        cb(entry, new Uint8Array([1, 2, 3]));
                        return Promise.resolve();
                    }
                };
            }

            it('Search "Paris", switch to Images, wait for the first batch, press Escape, and return', async function () {
                var imgHtml = '';
                for (var i = 1; i <= 20; i++) {
                    imgHtml += '<figure><img src="../I/Paris_' + i + '.jpg" width="200" height="200"><figcaption>Paris ' + i + '</figcaption></figure>';
                }
                var mockArchive = createMockArchive({ 'Paris.html': imgHtml });
                imageGallery.getArchive = function () { return mockArchive; };
                imageGallery.TARGET_BATCH_IMAGES = 15;

                var entry = { namespace: 'A', url: 'Paris.html', isRedirect: () => false, toStringId: () => 'A/Paris.html' };
                var searchParis = { prefix: 'Paris', status: 'final' };

                // Search "Paris" and switch to Images
                await imageGallery.loadImagesForSearch([entry], searchParis, { archive: mockArchive });

                var initialCards = grid.querySelectorAll('.image-gallery-card');
                assert.equal(initialCards.length, 15, 'First batch must contain 15 cards');

                // User presses Escape: hides search/gallery UI without mutating search or cancelling gallery
                container.style.display = 'none';
                assert.equal(searchParis.status, 'final', 'Escape must never mutate search object status');
                assert.isFalse(imageGallery.isCancelled(), 'Escape must not cancel imageGallery state');

                // User returns to search box: UI is restored
                container.style.display = '';

                // Completed results must be preserved, not wiped or duplicated
                var cardsAfterReturn = grid.querySelectorAll('.image-gallery-card');
                assert.equal(cardsAfterReturn.length, 15, 'Cards must remain intact after returning');
                assert.equal(imageGallery.activeSearch, searchParis, 'activeSearch must remain linked');
            });

            it('Search "Paris", switch to Images, click outside search box (blur), then focus it again', async function () {
                var imgHtml = '<figure><img src="../I/Paris_Eiffel.jpg" width="300" height="200"><figcaption>Eiffel Tower</figcaption></figure>';
                var mockArchive = createMockArchive({ 'Paris.html': imgHtml });
                imageGallery.getArchive = function () { return mockArchive; };

                var entry = { namespace: 'A', url: 'Paris.html', isRedirect: () => false, toStringId: () => 'A/Paris.html' };
                var searchParis = { prefix: 'Paris', status: 'final' };

                await imageGallery.loadImagesForSearch([entry], searchParis, { archive: mockArchive });
                assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1);

                // User blurs search box: hides results without cancelling
                container.style.display = 'none';
                assert.equal(searchParis.status, 'final', 'Blur must not set search status to cancelled');
                assert.isFalse(imageGallery.isCancelled(), 'Blur must not cancel imageGallery');

                // User focuses search box again
                container.style.display = '';
                assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1, 'Existing cards must be preserved on focus');
            });

            it('Leave before the first image batch completes and return', async function () {
                var slowReadResolve;
                var mockArchive = {
                    readUtf8File: function (entry, cb) {
                        return new Promise(function (resolve) {
                            slowReadResolve = function () {
                                cb(entry, '<figure><img src="../I/Slow_1.jpg" width="200" height="200"><figcaption>Slow 1</figcaption></figure>');
                                resolve();
                            };
                        });
                    },
                    getDirEntryByPath: function (path) {
                        return Promise.resolve({ getMimetype: () => 'image/jpeg', url: path });
                    },
                    readBinaryFile: function (entry, cb) {
                        cb(entry, new Uint8Array([1, 2, 3]));
                        return Promise.resolve();
                    }
                };
                imageGallery.getArchive = function () { return mockArchive; };

                var entry = { namespace: 'A', url: 'Slow.html', isRedirect: () => false, toStringId: () => 'A/Slow.html' };
                var search = { prefix: 'slow', status: 'interim' };

                // Start loading images (in flight)
                var loadPromise = imageGallery.loadImagesForSearch([entry], search, { archive: mockArchive });

                // User leaves before read completes
                container.style.display = 'none';

                // Now read completes while user is away
                slowReadResolve();
                await loadPromise;

                // User returns: container visible, extraction finished cleanly
                container.style.display = '';
                var cards = grid.querySelectorAll('.image-gallery-card');
                assert.equal(cards.length, 1, 'Card rendered cleanly upon return');
                assert.equal(status.style.display, 'none', 'Status indicator must not be stuck visible');
            });

            it('Switch Images -> Articles -> Images while full-text search is pending', async function () {
                var mockArchive = createMockArchive({
                    'Art1.html': '<figure><img src="../I/Img1.jpg" width="200" height="200"><figcaption>Img 1</figcaption></figure>'
                });
                imageGallery.getArchive = function () { return mockArchive; };

                var entry = { namespace: 'A', url: 'Art1.html', isRedirect: () => false, toStringId: () => 'A/Art1.html' };
                var search = { prefix: 'test', status: 'interim' };

                // User switches to Articles view (gallery hidden)
                container.style.display = 'none';

                // Search finishes while on Articles view, delivering search results
                search.status = 'final';

                // User switches back to Images view
                container.style.display = '';
                await imageGallery.loadImagesForSearch([entry], search, { archive: mockArchive });

                var cards = grid.querySelectorAll('.image-gallery-card');
                assert.equal(cards.length, 1, 'Gallery must display extracted images after switching back');
            });

            it('Open an article from the gallery and return to the same search', async function () {
                var mockArchive = createMockArchive({
                    'Article.html': '<figure><img src="../I/Photo.jpg" width="200" height="200"><figcaption>Photo</figcaption></figure>'
                });
                imageGallery.getArchive = function () { return mockArchive; };

                var selectedEntry = null;
                imageGallery.onSelectArticle = function (entry) {
                    selectedEntry = entry;
                    imageGallery.cancel();
                };

                var entry = { namespace: 'A', url: 'Article.html', isRedirect: () => false, toStringId: () => 'A/Article.html' };
                var search1 = { prefix: 'same', status: 'final' };

                await imageGallery.loadImagesForSearch([entry], search1, { archive: mockArchive });
                var card = grid.querySelector('.image-gallery-card');
                assert.isNotNull(card);

                // User clicks card to open article
                card.click();
                assert.equal(selectedEntry, entry);
                assert.isTrue(imageGallery.isCancelled(), 'Gallery must be cancelled when navigating to article');
                assert.equal(search1.status, 'final', 'Search object must not be mutated');

                // User returns to the same search (e.g. clicks search or types same prefix)
                var search2 = { prefix: 'same', status: 'final' };
                await imageGallery.loadImagesForSearch([entry], search2, { archive: mockArchive });

                assert.isFalse(imageGallery.isCancelled(), 'Cancelled state must be cleared for returned search');
                assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1, 'Clean rendering of cards for returned search');
            });

            it('Load More after returning', async function () {
                var imgHtml = '';
                for (var i = 1; i <= 25; i++) {
                    imgHtml += '<figure><img src="../I/Item_' + i + '.jpg" width="200" height="200"><figcaption>Item ' + i + '</figcaption></figure>';
                }
                var mockArchive = createMockArchive({ 'Items.html': imgHtml });
                imageGallery.getArchive = function () { return mockArchive; };
                imageGallery.TARGET_BATCH_IMAGES = 15;

                var entry = { namespace: 'A', url: 'Items.html', isRedirect: () => false, toStringId: () => 'A/Items.html' };
                var search = { prefix: 'items', status: 'final' };

                await imageGallery.loadImagesForSearch([entry], search, { archive: mockArchive });
                assert.equal(grid.querySelectorAll('.image-gallery-card').length, 15);
                assert.equal(loadMoreContainer.style.display, '', 'Load more button visible');

                // User temporarily leaves and returns
                container.style.display = 'none';
                container.style.display = '';

                // Click Load More
                await imageGallery.loadMore();

                assert.equal(grid.querySelectorAll('.image-gallery-card').length, 25, 'All 25 cards loaded after returning and clicking Load More');
                assert.equal(loadMoreContainer.style.display, 'none', 'Load more hidden when pending images exhausted');
            });

            it('Start a genuinely different search and ensure old results cannot leak into it', async function () {
                var slowParisResolve;
                var mockArchive = {
                    readUtf8File: function (entry, cb) {
                        if (entry.url === 'Paris.html') {
                            return new Promise(function (resolve) {
                                slowParisResolve = function () {
                                    cb(entry, '<figure><img src="../I/Paris_Leak.jpg" width="200" height="200"><figcaption>Paris</figcaption></figure>');
                                    resolve();
                                };
                            });
                        }
                        cb(entry, '<figure><img src="../I/London_Good.jpg" width="200" height="200"><figcaption>London</figcaption></figure>');
                        return Promise.resolve();
                    },
                    getDirEntryByPath: function (path) {
                        return Promise.resolve({ getMimetype: () => 'image/jpeg', url: path });
                    },
                    readBinaryFile: function (entry, cb) {
                        cb(entry, new Uint8Array([1, 2, 3]));
                        return Promise.resolve();
                    }
                };
                imageGallery.getArchive = function () { return mockArchive; };

                var parisEntry = { namespace: 'A', url: 'Paris.html', isRedirect: () => false, toStringId: () => 'A/Paris.html' };
                var londonEntry = { namespace: 'A', url: 'London.html', isRedirect: () => false, toStringId: () => 'A/London.html' };

                var searchParis = { prefix: 'Paris', status: 'final' };
                var searchLondon = { prefix: 'London', status: 'final' };

                // Start Paris search (pending)
                imageGallery.loadImagesForSearch([parisEntry], searchParis, { archive: mockArchive });

                // User starts genuinely different search "London"
                await imageGallery.loadImagesForSearch([londonEntry], searchLondon, { archive: mockArchive });

                // Now slow Paris read finishes
                slowParisResolve();
                await new Promise(function (resolve) { setTimeout(resolve, 30); });

                var cards = grid.querySelectorAll('.image-gallery-card');
                assert.equal(cards.length, 1, 'Only London cards must exist');
                var caption = cards[0].querySelector('.image-gallery-caption');
                assert.equal(caption.textContent, 'London', 'Old Paris results must not leak into London search');
            });

            it('Confirms imageGallery.cleanup is removed and cancel() handles all lifecycle cleanup', function () {
                assert.isUndefined(imageGallery.cleanup, 'imageGallery.cleanup must be completely removed');
                assert.isFunction(imageGallery.cancel, 'imageGallery.cancel must be present');
                assert.isFunction(imageGallery.reset, 'imageGallery.reset must be present');
            });

            it('Clearing search prefix resets prefix tracking allowing repeated search of the same string (Scenario 6)', async function () {
                var mockArchive = createMockArchive({
                    'Paris.html': '<figure><img src="../I/Paris.jpg" width="200" height="200"><figcaption>Paris</figcaption></figure>'
                });
                imageGallery.getArchive = function () { return mockArchive; };

                var parisEntry = { namespace: 'A', url: 'Paris.html', isRedirect: () => false, toStringId: () => 'A/Paris.html' };
                var searchParis1 = { prefix: 'Paris', status: 'final' };

                await imageGallery.loadImagesForSearch([parisEntry], searchParis1, { archive: mockArchive });
                assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1);

                // User clears the prefix input: cancel + reset gallery
                imageGallery.cancel();
                imageGallery.reset();
                assert.equal(grid.querySelectorAll('.image-gallery-card').length, 0, 'Grid cleared on reset');

                // User searches for the exact same prefix again
                var searchParis2 = { prefix: 'Paris', status: 'final' };
                await imageGallery.loadImagesForSearch([parisEntry], searchParis2, { archive: mockArchive });

                assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1, 'Fresh search for same prefix renders cards correctly');
            });
        });
    });
});
