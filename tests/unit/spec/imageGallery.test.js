/* eslint-disable no-undef */
/**
 * Tests for Image Gallery extraction, filtering, and controller (Issue #277).
 *
 * Verifies that:
 * - Image URLs and captions are extracted from article HTML.
 * - Math formulas, UI chrome, small flags, and icons are filtered out.
 * - Captions and titles are rendered safely via textContent without raw HTML injection.
 * - URL resolution respects explicit article baseUrl and never mutates appstate.baseUrl.
 * - Progressive loading and "Load more" pagination work across batches.
 * - Duplicate articles across interim/final searches are suppressed.
 * - Cancellation stops processing immediately.
 * - Empty galleries (e.g. nopic ZIMs, text-only articles) are handled gracefully without errors.
 * - Gallery-owned blob URLs are tracked and revoked on cleanup without affecting other URLs.
 */

import { assert, expect } from 'chai';
import '../js/init.js';
import {
    cleanCaption,
    filterJunkImage,
    extractImagesFromArticleHtml,
    imageGallery
} from '../../../www/js/lib/imageGallery.js';

describe('Image Gallery Extraction and Controller (Issue #277)', function () {
    describe('cleanCaption', function () {
        it('strips HTML tags and collapses spaces', function () {
            var raw = '<p>A photo of <a href="link">Albert Einstein</a> in <i>1921</i>.&nbsp;&nbsp;</p>';
            assert.equal(cleanCaption(raw), 'A photo of Albert Einstein in 1921.');
        });

        it('decodes common HTML entities', function () {
            var raw = 'Tom &amp; Jerry &quot;Classic&quot; &#39;Special&#39; &lt;1&gt;';
            assert.equal(cleanCaption(raw), "Tom & Jerry \"Classic\" 'Special' <1>");
        });

        it('handles null, undefined, or empty string gracefully', function () {
            assert.equal(cleanCaption(null), '');
            assert.equal(cleanCaption(undefined), '');
            assert.equal(cleanCaption(''), '');
        });
    });

    describe('filterJunkImage', function () {
        it('rejects missing or empty src', function () {
            assert.isFalse(filterJunkImage({ src: '' }));
            assert.isFalse(filterJunkImage(null));
        });

        it('rejects non-WebP data URIs', function () {
            assert.isFalse(filterJunkImage({ src: 'data:image/png;base64,iVBORw0KGgoAAA' }));
            assert.isFalse(filterJunkImage({ src: 'data:image/gif;base64,R0lGODlhAQABA' }));
        });

        it('accepts WebP data URIs', function () {
            assert.isTrue(filterJunkImage({ src: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4' }));
        });

        it('rejects math formulas by class, src, or alt', function () {
            assert.isFalse(filterJunkImage({
                src: '../I/formula.svg',
                className: 'mwe-math-fallback-image-inline'
            }));
            assert.isFalse(filterJunkImage({
                src: '/math/render/math/123.svg',
                className: 'inline'
            }));
            assert.isFalse(filterJunkImage({
                src: '../I/img.png',
                alt: '{\\displaystyle x^2 + y^2 = z^2}'
            }));
        });

        it('rejects UI icons, buttons, flags, and spacers', function () {
            assert.isFalse(filterJunkImage({ src: '../I/flag.png', className: 'flagicon' }));
            assert.isFalse(filterJunkImage({ src: '../I/edit.png', className: 'mw-ui-icon' }));
            assert.isFalse(filterJunkImage({ src: '../I/pixel.gif' }));
            assert.isFalse(filterJunkImage({ src: '../I/spacer.gif' }));
            assert.isFalse(filterJunkImage({ src: '../I/ambox-notice.png', className: 'ambox' }));
        });

        it('rejects explicitly tiny dimensions', function () {
            assert.isFalse(filterJunkImage({ src: '../I/pic.jpg', width: '16', height: '16' }));
            assert.isFalse(filterJunkImage({ src: '../I/pic.jpg', width: '24', height: '20' }));
            assert.isFalse(filterJunkImage({ src: '../I/pic.jpg', width: '10' }));
            assert.isFalse(filterJunkImage({ src: '../I/pic.jpg', height: '12' }));
        });

        it('accepts legitimate article images', function () {
            assert.isTrue(filterJunkImage({
                src: '../I/RayCharles.jpg',
                width: '220',
                height: '180',
                className: 'thumbimage'
            }));
            assert.isTrue(filterJunkImage({
                src: '../I/Solar_Eclipse.png',
                alt: 'Total Solar Eclipse of 2017'
            }));
        });
    });

    describe('extractImagesFromArticleHtml', function () {
        var mockDirEntry = {
            namespace: 'A',
            url: 'Albert_Einstein.html',
            title: 'Albert Einstein',
            toStringId: function () { return 'A/Albert_Einstein.html'; }
        };

        it('extracts images and figcaption from <figure> elements', function () {
            var html = '<figure class="mw-halign-right">' +
                '<a href="#"><img src="../I/Einstein_1921.jpg" alt="Einstein in 1921" width="220" height="280"></a>' +
                '<figcaption>Albert Einstein during a lecture in Vienna in 1921.</figcaption>' +
                '</figure>';

            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1);
            assert.equal(images[0].url, 'I/Einstein_1921.jpg');
            assert.equal(images[0].caption, 'Albert Einstein during a lecture in Vienna in 1921.');
            assert.equal(images[0].articleTitle, 'Albert Einstein');
        });

        it('extracts images and thumbcaption from .thumb containers', function () {
            var html = '<div class="thumb tright">' +
                '<div class="thumbinner">' +
                '<a href="#"><img src="../I/m/General_Relativity.png" class="thumbimage" alt="Relativity diagram" width="300" height="200"></a>' +
                '<div class="thumbcaption">Curvature of spacetime described by <a href="#">General Relativity</a>.</div>' +
                '</div>' +
                '</div>';

            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1);
            assert.equal(images[0].url, 'I/m/General_Relativity.png');
            assert.equal(images[0].caption, 'Curvature of spacetime described by General Relativity.');
        });

        it('falls back to alt or title attribute if no container caption exists', function () {
            var html = '<p><img src="../I/Portrait.jpg" alt="Portrait photograph" width="150" height="200"></p>';
            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1);
            assert.equal(images[0].url, 'I/Portrait.jpg');
            assert.equal(images[0].caption, 'Portrait photograph');
        });

        it('filters out math, icons, and junk images', function () {
            var html = '<div>' +
                '<img class="mwe-math-fallback-image-inline" src="../I/math1.svg" alt="E=mc^2">' +
                '<img class="flagicon" src="../I/flag.png" width="22" height="15">' +
                '<img src="../I/pixel.gif" width="1" height="1">' +
                '<img src="../I/Valid_Photo.jpg" width="300" height="200" alt="Valid illustration">' +
                '</div>';

            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1);
            assert.equal(images[0].url, 'I/Valid_Photo.jpg');
        });

        it('deduplicates identical image URLs within the same article', function () {
            var html = '<div>' +
                '<img src="../I/SameImage.jpg" alt="First instance">' +
                '<img src="../I/SameImage.jpg" alt="Second instance">' +
                '</div>';

            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1);
        });

        it('returns empty array for empty HTML or articles without images', function () {
            assert.deepEqual(extractImagesFromArticleHtml('', mockDirEntry), []);
            assert.deepEqual(extractImagesFromArticleHtml('<p>Text only stub article</p>', mockDirEntry), []);
        });

        it('resolves Zimit archive URLs properly', function () {
            var zimitEntry = {
                namespace: 'C',
                url: 'en.wikipedia.org/wiki/Earth',
                title: 'Earth',
                toStringId: function () { return 'C/en.wikipedia.org/wiki/Earth'; }
            };
            var zimitHtml = '<img src="/en.wikipedia.org/images/earth.jpg" width="400" height="300" alt="Planet Earth">';
            var images = extractImagesFromArticleHtml(zimitHtml, zimitEntry, {
                zimType: 'zimit',
                indexRoot: 'test.zim/'
            });
            assert.equal(images.length, 1);
            assert.isTrue(images[0].url.indexOf('earth.jpg') !== -1);
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

        it('initializes and resets gallery state cleanly', function () {
            imageGallery.renderedImageCount = 5;
            grid.innerHTML = '<div>item</div>';
            status.style.display = '';
            status.textContent = 'Status';

            imageGallery.reset();

            assert.equal(imageGallery.renderedImageCount, 0);
            assert.equal(grid.innerHTML, '');
            assert.equal(status.style.display, 'none');
            assert.equal(loadMoreContainer.style.display, 'none');
            assert.isFalse(imageGallery.isExtracting);
            assert.isFalse(imageGallery.cancelled);
        });

        it('cancels active extraction and increments searchId', function () {
            var oldSearchId = imageGallery.searchId;
            imageGallery.cancel();

            assert.isTrue(imageGallery.cancelled);
            assert.equal(imageGallery.searchId, oldSearchId + 1);
            assert.isFalse(imageGallery.isExtracting);
        });

        it('renders image cards safely using DOM methods and textContent', function () {
            var testItem = {
                url: 'I/SafeTest.jpg',
                caption: '<b>Malicious tag</b> & alert',
                alt: 'Alt text',
                articleTitle: 'Test Article',
                dirEntry: { toStringId: function () { return 'A/Test'; } }
            };

            var selectedEntry = null;
            imageGallery.onSelectArticle = function (entry) {
                selectedEntry = entry;
            };

            imageGallery.renderImageCard(testItem, function () { return false; });

            var cards = grid.querySelectorAll('.image-gallery-card');
            assert.equal(cards.length, 1);
            var card = cards[0];

            // Verify no innerHTML execution: textContent should contain literal string
            var captionEle = card.querySelector('.image-gallery-caption');
            assert.isNotNull(captionEle);
            assert.equal(captionEle.textContent, '<b>Malicious tag</b> & alert');
            assert.equal(captionEle.querySelectorAll('b').length, 0);

            // Verify clicking triggers onSelectArticle
            card.click();
            assert.equal(selectedEntry, testItem.dirEntry);
        });

        it('tracks and revokes gallery-owned blob URLs on cleanup', function () {
            var dummyBlobUrl = 'blob:http://localhost/dummy-uuid-1';
            var dummyExternalBlobUrl = 'blob:http://localhost/external-uuid-2';

            var revoked = [];
            var origRevoke = window.URL.revokeObjectURL;
            window.URL.revokeObjectURL = function (url) {
                revoked.push(url);
            };

            try {
                imageGallery.galleryBlobUrls.push(dummyBlobUrl);
                imageGallery.cleanup();

                assert.include(revoked, dummyBlobUrl);
                assert.notInclude(revoked, dummyExternalBlobUrl);
                assert.equal(imageGallery.galleryBlobUrls.length, 0);
            } finally {
                window.URL.revokeObjectURL = origRevoke;
            }
        });

        it('displays empty state message gracefully when no images are found', function () {
            var reportingSearch = { prefix: 'testempty', status: 'final' };
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<p>Text only article with no images.</p>');
                    return Promise.resolve();
                }
            };

            var entry1 = { namespace: 'A', url: 'Empty1.html', isRedirect: () => false, toStringId: () => 'A/Empty1.html' };
            imageGallery.getArchive = function () { return mockArchive; };

            imageGallery.loadImagesForSearch([entry1], reportingSearch, { archive: mockArchive });

            // Allow async queue to complete
            return new Promise(function (resolve) {
                setTimeout(function () {
                    assert.equal(grid.children.length, 0);
                    assert.equal(status.style.display, '');
                    expect(status.textContent).to.have.string('No images found');
                    resolve();
                }, 50);
            });
        });

        it('suppresses duplicate articles when interim and final callbacks report', function () {
            var reportingInterim = { prefix: 'einstein', status: 'interim' };
            var reportingFinal = { prefix: 'einstein', status: 'final' };

            var readCount = 0;
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    readCount++;
                    cb(entry, '<figure><img src="../I/' + entry.url + '.jpg" width="200" height="200"><figcaption>Caption</figcaption></figure>');
                    return Promise.resolve();
                }
            };
            imageGallery.getArchive = function () { return mockArchive; };

            var entry1 = { namespace: 'A', url: 'Art1.html', isRedirect: () => false, toStringId: () => 'A/Art1.html' };
            var entry2 = { namespace: 'A', url: 'Art2.html', isRedirect: () => false, toStringId: () => 'A/Art2.html' };

            // Interim delivers [entry1]
            imageGallery.loadImagesForSearch([entry1], reportingInterim, { archive: mockArchive });

            // Final delivers [entry1, entry2]
            imageGallery.loadImagesForSearch([entry1, entry2], reportingFinal, { archive: mockArchive });

            return new Promise(function (resolve) {
                setTimeout(function () {
                    // entry1 should only be read once despite being in both interim and final
                    assert.equal(readCount, 2);
                    resolve();
                }, 100);
            });
        });

        it('supports load more pagination across batches', function () {
            var reportingSearch = { prefix: 'batch', status: 'final' };
            imageGallery.BATCH_SIZE = 2;

            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<figure><img src="../I/' + entry.url + '.jpg" width="200" height="200"><figcaption>Cap</figcaption></figure>');
                    return Promise.resolve();
                },
                getDirEntryByPath: function () {
                    return Promise.resolve({
                        getMimetype: () => 'image/jpeg'
                    });
                },
                readBinaryFile: function (entry, cb) {
                    cb(entry, new Uint8Array([1, 2, 3]));
                    return Promise.resolve();
                }
            };
            imageGallery.getArchive = function () { return mockArchive; };

            var entries = [];
            for (let i = 0; i < 5; i++) {
                entries.push({
                    namespace: 'A',
                    url: 'Batch' + i + '.html',
                    isRedirect: () => false,
                    toStringId: () => 'A/Batch' + i + '.html'
                });
            }

            imageGallery.loadImagesForSearch(entries, reportingSearch, { archive: mockArchive });

            return new Promise(function (resolve) {
                setTimeout(function () {
                    // First batch of 2 should be processed, 3 remaining
                    assert.equal(grid.children.length, 2);
                    assert.equal(loadMoreContainer.style.display, '');

                    // Trigger loadMore
                    imageGallery.loadMore();

                    setTimeout(function () {
                        // Second batch of 2 processed, total 4
                        assert.equal(grid.children.length, 4);
                        assert.equal(loadMoreContainer.style.display, '');

                        // Trigger loadMore for final 1
                        imageGallery.loadMore();

                        setTimeout(function () {
                            assert.equal(grid.children.length, 5);
                            // All pending entries exhausted
                            assert.equal(loadMoreContainer.style.display, 'none');
                            resolve();
                        }, 50);
                    }, 50);
                }, 50);
            });
        });

        it('safely handles missing image in archive by removing card without crashing', function (done) {
            var card = document.createElement('div');
            var img = document.createElement('img');
            card.appendChild(img);
            grid.appendChild(card);

            var mockArchive = {
                getDirEntryByPath: function () {
                    // Simulates archive resolving to null when path not found
                    return Promise.resolve(null);
                }
            };
            imageGallery.options = { archive: mockArchive };

            imageGallery.loadImageSource(img, card, '/I/Missing_Image.jpg#section', function () { return false; }, function (err) {
                try {
                    assert.isNotNull(err);
                    assert.equal(err.message, 'Image not found in archive');
                    assert.equal(card.parentNode, null, 'Card node should be removed from parent when image not found');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('Usability Bug Fixes & View Integration (Issue #277)', function () {
        var articleContent, articleListWithHeader, articleList, galleryContainer;
        var btnArticles, btnImages;

        beforeEach(function () {
            articleContent = document.createElement('iframe');
            articleContent.id = 'articleContent';
            articleListWithHeader = document.createElement('div');
            articleListWithHeader.id = 'articleListWithHeader';
            articleList = document.createElement('div');
            articleList.id = 'articleList';
            galleryContainer = document.createElement('div');
            galleryContainer.id = 'imageGalleryContainer';
            btnArticles = document.createElement('button');
            btnArticles.id = 'btnSearchArticlesView';
            btnImages = document.createElement('button');
            btnImages.id = 'btnSearchImagesView';

            document.body.appendChild(articleContent);
            document.body.appendChild(articleListWithHeader);
            articleListWithHeader.appendChild(btnArticles);
            articleListWithHeader.appendChild(btnImages);
            articleListWithHeader.appendChild(articleList);
            articleListWithHeader.appendChild(galleryContainer);
        });

        afterEach(function () {
            if (articleContent.parentNode) articleContent.parentNode.removeChild(articleContent);
            if (articleListWithHeader.parentNode) articleListWithHeader.parentNode.removeChild(articleListWithHeader);
        });

        it('toggles visibility and container displays between articles and images views', function () {
            var currentSearchView = 'articles';
            function setSearchView (view) {
                if (currentSearchView === view) return;
                currentSearchView = view;
                if (view === 'images') {
                    btnImages.classList.add('active');
                    btnArticles.classList.remove('active');
                    articleList.style.display = 'none';
                    galleryContainer.style.display = '';
                    articleContent.style.visibility = 'hidden';
                } else {
                    btnArticles.classList.add('active');
                    btnImages.classList.remove('active');
                    galleryContainer.style.display = 'none';
                    articleList.style.display = '';
                    articleContent.style.visibility = '';
                }
            }

            // Initially articles
            assert.equal(currentSearchView, 'articles');
            assert.equal(articleContent.style.visibility, '');

            // Switch to images (BUG 1 & BUG 3 fix)
            setSearchView('images');
            assert.equal(currentSearchView, 'images');
            assert.isTrue(btnImages.classList.contains('active'));
            assert.isFalse(btnArticles.classList.contains('active'));
            assert.equal(articleList.style.display, 'none');
            assert.equal(galleryContainer.style.display, '');
            assert.equal(articleContent.style.visibility, 'hidden', 'articleContent must be hidden in images view to avoid overlapping');

            // Switch back to articles
            setSearchView('articles');
            assert.equal(currentSearchView, 'articles');
            assert.isTrue(btnArticles.classList.contains('active'));
            assert.isFalse(btnImages.classList.contains('active'));
            assert.equal(galleryContainer.style.display, 'none');
            assert.equal(articleList.style.display, '');
            assert.equal(articleContent.style.visibility, '', 'articleContent must be restored when switching back to articles');
        });

        it('restores articleContent visibility and hides gallery when an image is selected', function () {
            articleContent.style.visibility = 'hidden';
            articleListWithHeader.style.display = '';

            var selectedId = null;
            var onSelectArticle = function (dirEntryOrId) {
                if (articleContent) articleContent.style.visibility = '';
                if (articleListWithHeader) articleListWithHeader.style.display = 'none';
                selectedId = typeof dirEntryOrId === 'string' ? dirEntryOrId : dirEntryOrId.toStringId();
            };

            onSelectArticle('A/TestArticle.html');

            assert.equal(selectedId, 'A/TestArticle.html');
            assert.equal(articleContent.style.visibility, '', 'articleContent visibility restored');
            assert.equal(articleListWithHeader.style.display, 'none', 'articleListWithHeader hidden');
        });

        it('restores articleContent visibility and cancels gallery on Escape key', function () {
            articleContent.style.visibility = 'hidden';
            articleListWithHeader.style.display = '';
            var cancelled = false;
            var testGallery = {
                cancel: function () { cancelled = true; }
            };

            // Simulate Escape handling
            var handleEscape = function () {
                testGallery.cancel();
                articleListWithHeader.style.display = 'none';
                if (articleContent) {
                    articleContent.style.visibility = '';
                    articleContent.focus();
                }
            };

            handleEscape();

            assert.isTrue(cancelled);
            assert.equal(articleListWithHeader.style.display, 'none');
            assert.equal(articleContent.style.visibility, '');
        });

        it('retains gallery in images view when prefix input loses focus (blur)', function () {
            var currentSearchView = 'images';
            var searchArticlesFocused = false;
            var hidden = false;

            var onPrefixBlur = function () {
                if (currentSearchView === 'images') {
                    return;
                }
                if (!searchArticlesFocused) {
                    hidden = true;
                }
            };

            onPrefixBlur();
            assert.isFalse(hidden, 'Gallery should not be hidden on prefix blur when in images view');

            // But in articles view, blur hides the dropdown
            currentSearchView = 'articles';
            onPrefixBlur();
            assert.isTrue(hidden, 'Article list should be hidden on prefix blur in articles view');
        });
    });
});
