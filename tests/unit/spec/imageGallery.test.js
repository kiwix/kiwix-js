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
import {
    cleanCaption,
    filterJunkImage,
    extractImagesFromArticleHtml,
    imageGallery
} from '../../../www/js/lib/imageGallery.js';

describe('Image Gallery Extraction and Controller (Issue #277)', function () {
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
        it('rejects math formulas, UI icons, tiny dimensions, empty src, and non-WebP data URIs', function () {
            // Missing or empty src
            assert.isFalse(filterJunkImage({}));
            assert.isFalse(filterJunkImage({ src: '' }));

            // Non-WebP data URIs
            assert.isFalse(filterJunkImage({ src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==' }));
            assert.isFalse(filterJunkImage({ src: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }));

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

        it('accepts legitimate article images and WebP data URIs', function () {
            assert.isTrue(filterJunkImage({ src: 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA=' }));
            assert.isTrue(filterJunkImage({
                src: '../I/RayCharles_Piano.jpg',
                width: 300,
                height: 250,
                alt: 'Ray Charles playing piano'
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
            imageGallery.cleanup();
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
            imageGallery.BATCH_SIZE = 15;

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

        it('discards results from a replaced search and halts in-flight extraction on cleanup', function () {
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

                    // Verify cleanup resets state and cancels extraction
                    imageGallery.cleanup();
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
    });
});
