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
 * - Gallery image delivery uses unified data URIs with zero blob URLs created.
 */

import { assert, expect } from 'chai';
import '../js/init.js';
import uiUtil from '../../../www/js/lib/uiUtil.js';
import {
    cleanCaption,
    filterJunkImage,
    extractImagesFromArticleHtml,
    imageGallery
} from '../../../www/js/lib/imageGallery.js';

describe('Image Gallery Extraction and Controller (Issue #277)', function () {
    describe('cleanCaption', function () {
        it('collapses extra whitespace and trims edges', function () {
            var raw = '  A photo of Albert Einstein in 1921.   ';
            assert.equal(cleanCaption(raw), 'A photo of Albert Einstein in 1921.');
        });

        it('normalizes newlines, tabs, and spaces to single spaces', function () {
            var raw = 'Portrait of\nMarie Curie\t\tduring\r\n1911.';
            assert.equal(cleanCaption(raw), 'Portrait of Marie Curie during 1911.');
        });

        it('handles null, undefined, or empty string gracefully', function () {
            assert.equal(cleanCaption(null), '');
            assert.equal(cleanCaption(undefined), '');
            assert.equal(cleanCaption(''), '');
            assert.equal(cleanCaption(123), '');
            assert.equal(cleanCaption({}), '');
        });

        it('preserves legitimate text such as a < b and mathematical comparisons', function () {
            assert.equal(cleanCaption('a < b'), 'a < b');
            assert.equal(cleanCaption('Condition: 0 < a < b and x > y'), 'Condition: 0 < a < b and x > y');
            assert.equal(cleanCaption('Temperature > 0 degrees and Pressure < 100 kPa'), 'Temperature > 0 degrees and Pressure < 100 kPa');
            assert.equal(cleanCaption('x <= y and a >= b'), 'x <= y and a >= b');
            assert.equal(cleanCaption('Arrow: a -> b and Bitwise: a << 2'), 'Arrow: a -> b and Bitwise: a << 2');
            assert.equal(cleanCaption('Compare: x < 5 and y > 3'), 'Compare: x < 5 and y > 3');
        });

        it('does not strip HTML-like strings by additional sanitization', function () {
            assert.equal(cleanCaption('Figure 1: <custom-tag> details'), 'Figure 1: <custom-tag> details');
            assert.equal(cleanCaption('Notation: <foo> and <bar>'), 'Notation: <foo> and <bar>');
            assert.equal(cleanCaption('<3 hearts & love'), '<3 hearts & love');
            assert.equal(cleanCaption('Unclosed tag: <div class='), 'Unclosed tag: <div class=');
        });

        it('does not decode already-decoded entities a second time', function () {
            assert.equal(cleanCaption('Literal entity &amp; preserved'), 'Literal entity &amp; preserved');
            assert.equal(cleanCaption('&lt;tag&gt; and &quot;quote&quot;'), '&lt;tag&gt; and &quot;quote&quot;');
            assert.equal(cleanCaption('Value &#39;test&#39; and &nbsp; code'), 'Value &#39;test&#39; and &nbsp; code');
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

        it('extracts captions with entities and comparisons naturally decoded by DOMParser', function () {
            var html = '<figure>' +
                '<img src="../I/Diagram.png" width="300" height="200">' +
                '<figcaption>  Graph where a &lt; b &amp; c &gt; d with <i>italicized note</i>.  </figcaption>' +
                '</figure>';

            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1);
            assert.equal(images[0].caption, 'Graph where a < b & c > d with italicized note.');
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

        it('transforms images even when article text mentions data-kiwixurl in body', function () {
            var html = '<div>' +
                '<p>In Kiwix-JS, the data-kiwixurl attribute is used for restricted mode asset resolution.</p>' +
                '<img src="../I/Diagram.jpg" width="300" height="200" alt="Architecture Diagram">' +
                '</div>';
            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1);
            assert.equal(images[0].url, 'I/Diagram.jpg');
        });

        it('does not re-transform HTML that genuinely contains data-kiwixurl tag attributes', function () {
            var html = '<div>' +
                '<img data-kiwixurl="I/PreTransformed.jpg" src="blob:already-set" width="300" height="200" alt="Pretransformed">' +
                '</div>';
            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 1);
            assert.equal(images[0].url, 'I/PreTransformed.jpg');
        });

        it('correctly extracts mixed HTML containing both already-transformed and untransformed images', function () {
            var html = '<div>' +
                '<img data-kiwixurl="I/AlreadyDone.jpg" width="300" height="200" alt="Pretransformed">' +
                '<img src="../I/NeedsTransformation.jpg" width="300" height="200" alt="Untransformed">' +
                '</div>';
            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 2);
            assert.equal(images[0].url, 'I/AlreadyDone.jpg');
            assert.equal(images[1].url, 'I/NeedsTransformation.jpg');
        });

        it('transforms multiple untransformed images in article HTML', function () {
            var html = '<div>' +
                '<img src="../I/Photo1.jpg" width="300" height="200" alt="First">' +
                '<img src="../I/Photo2.jpg" width="300" height="200" alt="Second">' +
                '<img src="../I/Photo3.jpg" width="300" height="200" alt="Third">' +
                '</div>';
            var images = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images.length, 3);
            assert.equal(images[0].url, 'I/Photo1.jpg');
            assert.equal(images[1].url, 'I/Photo2.jpg');
            assert.equal(images[2].url, 'I/Photo3.jpg');
        });

        it('handles repeated processing of the same HTML without URL corruption or duplication', function () {
            var html = '<div><img src="../I/Repeated.jpg" width="300" height="200" alt="Photo"></div>';
            var images1 = extractImagesFromArticleHtml(html, mockDirEntry);
            assert.equal(images1.length, 1);
            assert.equal(images1[0].url, 'I/Repeated.jpg');

            // Re-processing already transformed HTML produces identical results
            var transformedHtml = '<img data-kiwixurl="I/Repeated.jpg" width="300" height="200" alt="Photo">';
            var images2 = extractImagesFromArticleHtml(transformedHtml, mockDirEntry);
            assert.equal(images2.length, 1);
            assert.equal(images2[0].url, 'I/Repeated.jpg');

            var images3 = extractImagesFromArticleHtml(transformedHtml, mockDirEntry);
            assert.equal(images3.length, 1);
            assert.equal(images3[0].url, 'I/Repeated.jpg');
        });

        it('resolves representative classic Zimit 1 URL forms (root-relative /, https://, and relative A/)', function () {
            var zimit1Entry = {
                namespace: 'A',
                url: 'example.com/page.html',
                title: 'Page',
                toStringId: function () { return 'A/example.com/page.html'; }
            };
            var zimit1Html = '<link rel="canonical" href="https://example.com/page.html">' +
                '<img src="/static/img/root.jpg" width="300" height="200" alt="Root relative">' +
                '<img src="https://example.com/static/img/absolute.jpg" width="300" height="200" alt="Absolute">' +
                '<img src="A/example.com/static/img/a_relative.jpg" width="300" height="200" alt="A relative">';
            var images = extractImagesFromArticleHtml(zimit1Html, zimit1Entry, {
                zimType: 'zimit',
                zimitPrefix: 'example.com',
                fileName: 'test.zim',
                indexRoot: ''
            });
            assert.equal(images.length, 3);
            assert.equal(images[0].url, 'A/example.com/static/img/root.jpg');
            assert.equal(images[1].url, 'A/example.com/static/img/absolute.jpg');
            assert.equal(images[2].url, 'A/example.com/static/img/a_relative.jpg');
        });

        it('resolves representative Zimit 2 namespace URLs (C/ namespace)', function () {
            var zimit2Entry = {
                namespace: 'C',
                url: 'example.org/article',
                title: 'Article',
                toStringId: function () { return 'C/example.org/article'; }
            };
            var zimit2Html = '<link rel="canonical" href="https://example.org/article">' +
                '<img src="/assets/zimit2.jpg" width="400" height="300" alt="Zimit 2">';
            var images = extractImagesFromArticleHtml(zimit2Html, zimit2Entry, {
                zimType: 'zimit',
                zimitPrefix: 'example.org',
                fileName: 'test.zim',
                indexRoot: ''
            });
            assert.equal(images.length, 1);
            assert.equal(images[0].url, 'C/A/example.org/assets/zimit2.jpg');
        });

        it('preserves standard ZIM image URLs without corruption', function () {
            var standardEntry = {
                namespace: 'A',
                url: 'Standard_Article.html',
                title: 'Standard',
                toStringId: function () { return 'A/Standard_Article.html'; }
            };
            var standardHtml = '<div><img src="../I/Standard_Photo.jpg" width="300" height="200" alt="Standard"></div>';
            var images = extractImagesFromArticleHtml(standardHtml, standardEntry);
            assert.equal(images.length, 1);
            assert.equal(images[0].url, 'I/Standard_Photo.jpg');
        });

        it('ensures article display transformation and gallery extraction agree on transformed URLs', function () {
            var zimit1Entry = {
                namespace: 'C',
                url: 'based.cooking/chicken-parm.html',
                title: 'Chicken Parmesan',
                toStringId: function () { return 'C/based.cooking/chicken-parm.html'; }
            };
            var html = '<link rel="canonical" href="https://based.cooking/chicken-parm.html">' +
                '<img src="/pix/xmr.svg" width="300" height="200" alt="Monero">' +
                '<img src="https://based.cooking/pix/btc.svg" width="300" height="200" alt="Bitcoin">';

            var articleTransformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                dirEntry: zimit1Entry,
                zimType: 'zimit',
                zimitPrefix: 'based.cooking'
            });

            var galleryImages = extractImagesFromArticleHtml(html, zimit1Entry, {
                zimType: 'zimit',
                zimitPrefix: 'based.cooking'
            });

            assert.equal(galleryImages.length, 2);
            assert.equal(galleryImages[0].url, 'C/A/based.cooking/pix/xmr.svg');
            assert.equal(galleryImages[1].url, 'C/A/based.cooking/pix/btc.svg');

            assert.include(articleTransformed, 'data-kiwixurl="C/A/based.cooking/pix/xmr.svg"');
            assert.include(articleTransformed, 'data-kiwixurl="C/A/based.cooking/pix/btc.svg"');
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
            imageGallery.BATCH_SIZE = 12;
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

        it('safely renders captions with legitimate inequalities a < b via textContent', function () {
            var mathItem = {
                url: 'I/MathDiagram.png',
                caption: 'Proof step: a < b and c > d',
                alt: 'Diagram',
                articleTitle: 'Math Article',
                dirEntry: { toStringId: function () { return 'A/Math'; } }
            };

            grid.innerHTML = '';
            imageGallery.renderImageCard(mathItem, function () { return false; });

            var cards = grid.querySelectorAll('.image-gallery-card');
            assert.equal(cards.length, 1);
            var captionEle = cards[0].querySelector('.image-gallery-caption');
            assert.isNotNull(captionEle);
            assert.equal(captionEle.textContent, 'Proof step: a < b and c > d');
            assert.equal(captionEle.children.length, 0);
        });

        it('cleans up resources and cancels processing on cleanup', function () {
            var mockSearch = { status: 'interim' };
            imageGallery.activeSearch = mockSearch;
            imageGallery.isExtracting = true;
            imageGallery.cleanup();

            assert.equal(mockSearch.status, 'cancelled');
            assert.isNull(imageGallery.activeSearch);
            assert.isFalse(imageGallery.isExtracting);
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
            var reportingSearch = { prefix: 'einstein', status: 'interim' };

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
            imageGallery.loadImagesForSearch([entry1], reportingSearch, { archive: mockArchive });

            // Final delivers [entry1, entry2]
            reportingSearch.status = 'final';
            imageGallery.loadImagesForSearch([entry1, entry2], reportingSearch, { archive: mockArchive });

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

        it('allows repeating the same search after opening a gallery article', function () {
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<figure><img src="../I/Repeat.jpg" width="200" height="200"><figcaption>Repeat Caption</figcaption></figure>');
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

            var entry1 = { namespace: 'A', url: 'Repeat.html', isRedirect: () => false, toStringId: () => 'A/Repeat.html' };
            var search1 = { prefix: 'repeat', status: 'final' };

            // Initial search
            imageGallery.loadImagesForSearch([entry1], search1, { archive: mockArchive });

            return new Promise(function (resolve) {
                setTimeout(function () {
                    assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1);

                    // User opens article from gallery -> cancel() is called
                    imageGallery.cancel();
                    assert.isTrue(imageGallery.cancelled);

                    // User repeats the same search
                    var search2 = { prefix: 'repeat', status: 'final' };
                    imageGallery.loadImagesForSearch([entry1], search2, { archive: mockArchive });
                    assert.isFalse(imageGallery.cancelled, 'Cancelled state must be reset for new search');

                    setTimeout(function () {
                        assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1);
                        resolve();
                    }, 50);
                }, 50);
            });
        });

        it('allows repeating the same search after Escape cancels the gallery', function () {
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<figure><img src="../I/Escape.jpg" width="200" height="200"><figcaption>Escape Caption</figcaption></figure>');
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

            var entry = { namespace: 'A', url: 'Escape.html', isRedirect: () => false, toStringId: () => 'A/Escape.html' };
            var search1 = { prefix: 'escape', status: 'final' };

            imageGallery.loadImagesForSearch([entry], search1, { archive: mockArchive });

            return new Promise(function (resolve) {
                setTimeout(function () {
                    assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1);

                    // Escape cancels gallery
                    imageGallery.cancel();
                    assert.isTrue(imageGallery.cancelled);

                    // User re-executes search with same prefix
                    var search2 = { prefix: 'escape', status: 'final' };
                    imageGallery.loadImagesForSearch([entry], search2, { archive: mockArchive });
                    assert.isFalse(imageGallery.cancelled, 'Cancelled state must be reset for re-executed search');

                    setTimeout(function () {
                        assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1);
                        resolve();
                    }, 50);
                }, 50);
            });
        });

        it('discards results from a replaced search when new search arrives mid-load', function () {
            var pendingReadCb = null;
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    if (entry.url === 'Old.html') {
                        // Delay resolution of old article until after replacement
                        pendingReadCb = function () {
                            cb(entry, '<figure><img src="../I/Old.jpg" width="200" height="200"><figcaption>Old</figcaption></figure>');
                        };
                        return Promise.resolve();
                    }
                    cb(entry, '<figure><img src="../I/New.jpg" width="200" height="200"><figcaption>New</figcaption></figure>');
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

            var oldEntry = { namespace: 'A', url: 'Old.html', isRedirect: () => false, toStringId: () => 'A/Old.html' };
            var newEntry = { namespace: 'A', url: 'New.html', isRedirect: () => false, toStringId: () => 'A/New.html' };

            var search1 = { prefix: 'old', status: 'interim' };
            var search2 = { prefix: 'new', status: 'final' };

            // Start search 1
            imageGallery.loadImagesForSearch([oldEntry], search1, { archive: mockArchive });

            // Replace search while search 1 is pending
            search1.status = 'cancelled';
            imageGallery.loadImagesForSearch([newEntry], search2, { archive: mockArchive });

            // If old async read completes now, it must be ignored
            if (pendingReadCb) pendingReadCb();

            return new Promise(function (resolve) {
                setTimeout(function () {
                    var cards = grid.querySelectorAll('.image-gallery-card');
                    assert.equal(cards.length, 1);
                    var caption = cards[0].querySelector('.image-gallery-caption');
                    assert.equal(caption.textContent, 'New', 'Only cards from replacement search should render');
                    resolve();
                }, 50);
            });
        });

        it('prevents loadMore from executing when search has finished or been cancelled', function () {
            var readCount = 0;
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    readCount++;
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
            imageGallery.BATCH_SIZE = 1;

            var entry1 = { namespace: 'A', url: 'Item1.html', isRedirect: () => false, toStringId: () => 'A/Item1.html' };
            var search1 = { prefix: 'finished', status: 'final' };

            imageGallery.loadImagesForSearch([entry1], search1, { archive: mockArchive });

            return new Promise(function (resolve) {
                setTimeout(function () {
                    assert.equal(readCount, 1);
                    assert.equal(imageGallery.pendingDirEntries.length, 0);

                    // Case A: Finished search (no pending entries)
                    var prevCount = readCount;
                    imageGallery.loadMore();
                    assert.equal(readCount, prevCount, 'loadMore on exhausted entries should not read archive');

                    // Case B: Cancelled search
                    search1.status = 'cancelled';
                    imageGallery.pendingDirEntries = [entry1]; // inject an entry
                    imageGallery.loadMore();
                    assert.equal(readCount, prevCount, 'loadMore on cancelled search should not read archive');
                    resolve();
                }, 50);
            });
        });

        it('uses shared feedNodeWithDataURI pipeline for ServiceWorker mode without direct swUrl assignment', function (done) {
            var card = document.createElement('div');
            var img = document.createElement('img');
            card.appendChild(img);
            grid.appendChild(card);

            var readBinaryCalled = false;
            var mockArchive = {
                file: { name: 'test.zim' },
                getDirEntryByPath: function () {
                    return Promise.resolve({
                        getMimetype: () => 'image/jpeg'
                    });
                },
                readBinaryFile: function (entry, cb) {
                    readBinaryCalled = true;
                    cb(entry, new Uint8Array([1, 2, 3]));
                    return Promise.resolve();
                }
            };

            // Configure SW mode in params
            imageGallery.getParams = function () {
                return { contentInjectionMode: 'serviceworker' };
            };
            imageGallery.options = { archive: mockArchive };

            imageGallery.loadImageSource(img, card, 'I/TestSW.jpg', function () { return false; }, function (err) {
                try {
                    assert.isNull(err);
                    assert.isTrue(readBinaryCalled, 'archive.readBinaryFile must be called in ServiceWorker mode');
                    assert.isFalse(/^..\//.test(img.src), 'img.src must not be a relative service-worker path');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('uses shared feedNodeWithDataURI pipeline for non-ServiceWorker (jquery) mode', function (done) {
            var card = document.createElement('div');
            var img = document.createElement('img');
            card.appendChild(img);
            grid.appendChild(card);

            var readBinaryCalled = false;
            var mockArchive = {
                file: { name: 'test.zim' },
                getDirEntryByPath: function () {
                    return Promise.resolve({
                        getMimetype: () => 'image/png'
                    });
                },
                readBinaryFile: function (entry, cb) {
                    readBinaryCalled = true;
                    cb(entry, new Uint8Array([137, 80, 78, 71]));
                    return Promise.resolve();
                }
            };

            imageGallery.getParams = function () {
                return { contentInjectionMode: 'jquery' };
            };
            imageGallery.options = { archive: mockArchive };

            imageGallery.loadImageSource(img, card, 'I/TestJQuery.png', function () { return false; }, function (err) {
                try {
                    assert.isNull(err);
                    assert.isTrue(readBinaryCalled, 'archive.readBinaryFile must be called in jQuery mode');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('respects params.useCanvasElementsForWebpTranscoding in shared image pipeline', function (done) {
            var origWebpMachine = global.webpMachine;
            var origParams = global.params;
            var replaceImageWithCanvasCalled = false;

            global.webpMachine = {
                decodeToCanvas: function (canvas) {
                    canvas.toDataURL = function () { return 'data:image/png;base64,WEBP_DECODED'; };
                    return Promise.resolve();
                },
                constructor: {
                    replaceImageWithCanvas: function (node, canvas) {
                        replaceImageWithCanvasCalled = true;
                        if (node.parentNode) {
                            node.parentNode.replaceChild(canvas, node);
                        }
                    }
                }
            };
            global.params = { useCanvasElementsForWebpTranscoding: true };

            var card = document.createElement('div');
            var img = document.createElement('img');
            card.appendChild(img);
            grid.appendChild(card);

            var mockArchive = {
                getDirEntryByPath: function () {
                    return Promise.resolve({
                        getMimetype: () => 'image/webp'
                    });
                },
                readBinaryFile: function (entry, cb) {
                    cb(entry, new Uint8Array([82, 73, 70, 70]));
                    return Promise.resolve();
                }
            };
            imageGallery.options = { archive: mockArchive };

            imageGallery.loadImageSource(img, card, 'I/Photo.webp', function () { return false; }, function (err) {
                try {
                    assert.isNull(err);
                    assert.isTrue(replaceImageWithCanvasCalled, 'replaceImageWithCanvas must be called when useCanvasElementsForWebpTranscoding is true');
                    assert.equal(card.querySelectorAll('canvas').length, 1);
                    global.webpMachine = origWebpMachine;
                    global.params = origParams;
                    done();
                } catch (e) {
                    global.webpMachine = origWebpMachine;
                    global.params = origParams;
                    done(e);
                }
            });
        });

        it('aborts image loading and does not update node when cancelled during asynchronous archive operations', function (done) {
            var card = document.createElement('div');
            var img = document.createElement('img');
            card.appendChild(img);
            grid.appendChild(card);

            var cancelled = false;
            var mockArchive = {
                getDirEntryByPath: function () {
                    // Simulate search cancellation happening in-flight
                    cancelled = true;
                    return Promise.resolve({
                        getMimetype: () => 'image/jpeg'
                    });
                },
                readBinaryFile: function (entry, cb) {
                    cb(entry, new Uint8Array([1, 2, 3]));
                    return Promise.resolve();
                }
            };
            imageGallery.options = { archive: mockArchive };

            imageGallery.loadImageSource(img, card, 'I/Cancelled.jpg', function () { return cancelled; }, function (err) {
                try {
                    assert.isNotNull(err);
                    assert.equal(err.message, 'Cancelled');
                    assert.equal(img.src, '');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('ensures image loading failures on one card do not break sibling cards in the gallery', function () {
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<figure><img src="../I/' + entry.url + '.jpg" width="200" height="200"><figcaption>Cap</figcaption></figure>');
                    return Promise.resolve();
                },
                getDirEntryByPath: function (path) {
                    if (path.indexOf('Fail') !== -1) {
                        return Promise.resolve(null); // Missing image
                    }
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

            var entryGood = { namespace: 'A', url: 'Good.html', isRedirect: () => false, toStringId: () => 'A/Good.html' };
            var entryFail = { namespace: 'A', url: 'Fail.html', isRedirect: () => false, toStringId: () => 'A/Fail.html' };
            var search = { prefix: 'resilience', status: 'final' };

            return imageGallery.loadImagesForSearch([entryFail, entryGood], search, { archive: mockArchive }).then(function () {
                // Fail card was removed, but Good card was preserved and rendered
                var cards = grid.querySelectorAll('.image-gallery-card');
                assert.equal(cards.length, 1);
                var caption = cards[0].querySelector('.image-gallery-caption');
                assert.equal(caption.textContent, 'Cap');
            });
        });

        it('guarantees deduplication of identical image URLs across multiple batches', function () {
            imageGallery.BATCH_SIZE = 1;

            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    // Both articles contain the exact same image URL
                    cb(entry, '<img src="../I/SharedImage.jpg" width="300" height="200" alt="Shared">');
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

            var entry1 = { namespace: 'A', url: 'Page1.html', isRedirect: () => false, toStringId: () => 'A/Page1.html' };
            var entry2 = { namespace: 'A', url: 'Page2.html', isRedirect: () => false, toStringId: () => 'A/Page2.html' };
            var search = { prefix: 'shared', status: 'final' };

            imageGallery.loadImagesForSearch([entry1, entry2], search, { archive: mockArchive });

            return new Promise(function (resolve) {
                setTimeout(function () {
                    // Batch 1 processed Page1 (1 image)
                    assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1);

                    // Load more to process Page2 (same image)
                    imageGallery.loadMore();

                    setTimeout(function () {
                        // Grid should still have only 1 card because SharedImage.jpg was already seen
                        assert.equal(grid.querySelectorAll('.image-gallery-card').length, 1);
                        resolve();
                    }, 50);
                }, 50);
            });
        });

        it('respects params.useCanvasElementsForWebpTranscoding: false by setting data URI without canvas replacement', function (done) {
            var origWebpMachine = global.webpMachine;
            var origParams = global.params;
            var replaceImageWithCanvasCalled = false;

            global.webpMachine = {
                decodeToCanvas: function (canvas) {
                    canvas.toDataURL = function () { return 'data:image/png;base64,WEBP_DECODED_DATA_URI'; };
                    return Promise.resolve();
                },
                constructor: {
                    replaceImageWithCanvas: function (node, canvas) {
                        replaceImageWithCanvasCalled = true;
                        if (node.parentNode) {
                            node.parentNode.replaceChild(canvas, node);
                        }
                    }
                }
            };
            global.params = { useCanvasElementsForWebpTranscoding: false };

            var card = document.createElement('div');
            var thumbContainer = document.createElement('div');
            var img = document.createElement('img');
            thumbContainer.appendChild(img);
            card.appendChild(thumbContainer);
            grid.appendChild(card);

            var mockArchive = {
                getDirEntryByPath: function () {
                    return Promise.resolve({
                        getMimetype: () => 'image/webp'
                    });
                },
                readBinaryFile: function (entry, cb) {
                    cb(entry, new Uint8Array([82, 73, 70, 70]));
                    return Promise.resolve();
                }
            };
            imageGallery.options = { archive: mockArchive };

            imageGallery.loadImageSource(img, card, 'I/PhotoDataUri.webp', function () { return false; }, function (err) {
                try {
                    assert.isNull(err);
                    assert.isFalse(replaceImageWithCanvasCalled, 'replaceImageWithCanvas must NOT be called when useCanvasElementsForWebpTranscoding is false');
                    assert.equal(card.querySelectorAll('canvas').length, 0);
                    assert.equal(img.src, 'data:image/png;base64,WEBP_DECODED_DATA_URI');
                    global.webpMachine = origWebpMachine;
                    global.params = origParams;
                    done();
                } catch (e) {
                    global.webpMachine = origWebpMachine;
                    global.params = origParams;
                    done(e);
                }
            });
        });

        it('creates zero blob URLs during gallery image loading', async function () {
            var blobUrlsCreated = 0;
            var origCreateObjectURL = (typeof URL !== 'undefined' && URL.createObjectURL) || null;
            if (typeof URL !== 'undefined') {
                URL.createObjectURL = function () {
                    blobUrlsCreated++;
                    return 'blob:mock-url';
                };
            }

            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<figure><img src="../I/BlobCheck.jpg" width="200" height="200"><figcaption>Blob Check</figcaption></figure>');
                    return Promise.resolve();
                },
                getDirEntryByPath: function () {
                    return Promise.resolve({
                        getMimetype: () => 'image/jpeg'
                    });
                },
                readBinaryFile: function (entry, cb) {
                    cb(entry, new Uint8Array([255, 216, 255]));
                    return Promise.resolve();
                }
            };
            imageGallery.getArchive = function () { return mockArchive; };

            var entry = { namespace: 'A', url: 'BlobTest.html', isRedirect: () => false, toStringId: () => 'A/BlobTest.html' };
            var search = { prefix: 'noblob', status: 'final' };

            try {
                await imageGallery.loadImagesForSearch([entry], search, { archive: mockArchive });
                assert.equal(blobUrlsCreated, 0, 'URL.createObjectURL must not be called anywhere in gallery loading');
                var thumbs = grid.querySelectorAll('.image-gallery-thumb');
                assert.isAbove(thumbs.length, 0);
                for (var i = 0; i < thumbs.length; i++) {
                    assert.isFalse(thumbs[i].src.startsWith('blob:'), 'Image src must not be a blob URL');
                    assert.isTrue(thumbs[i].src.startsWith('data:'), 'Image src must be a data URI');
                }
            } finally {
                if (typeof URL !== 'undefined' && origCreateObjectURL) {
                    URL.createObjectURL = origCreateObjectURL;
                }
            }
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

        it('bounds initial image batch to TARGET_BATCH_IMAGES (default 15) and loads remaining via loadMore', async function () {
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
            delete imageGallery.BATCH_IMAGE_LIMIT;
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

        it('recovers from failed archive reads without stalling subsequent images', async function () {
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<img src="../I/Img_Good1.jpg" width="100" height="100">' +
                              '<img src="../I/Img_Corrupt.jpg" width="100" height="100">' +
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
                    if (entry.url && entry.url.indexOf('Img_Corrupt') !== -1) {
                        throw new Error('Corrupt file read failure');
                    }
                    cb(entry, new Uint8Array([1, 2, 3]));
                    return Promise.resolve();
                }
            };
            imageGallery.getArchive = function () { return mockArchive; };

            var entry = { namespace: 'A', url: 'FailRecovery.html', isRedirect: () => false, toStringId: () => 'A/FailRecovery.html' };
            var search = { prefix: 'recovery', status: 'final' };

            await imageGallery.loadImagesForSearch([entry], search, { archive: mockArchive });

            var cards = grid.querySelectorAll('.image-gallery-card');
            assert.equal(cards.length, 2, 'Only the 2 valid images should remain rendered in the grid');
            assert.isFalse(imageGallery.isExtracting, 'Queue must finish gracefully and not stall');
        });

        it('cancellation clears pendingImages and halts queue immediately', function () {
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<img src="../I/Cancel1.jpg" width="100" height="100">');
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

            imageGallery.pendingImages = [
                { url: 'I/Pending1.jpg' },
                { url: 'I/Pending2.jpg' }
            ];

            imageGallery.cancel();

            assert.isTrue(imageGallery.cancelled);
            assert.equal(imageGallery.pendingImages.length, 0, 'pendingImages must be cleared on cancel()');
            assert.isFalse(imageGallery.isExtracting);
        });
    });

    describe('Usability Bug Fixes & View Integration (Issue #277)', function () {
        var articleContent, articleListWithHeader, articleList, galleryContainer, galleryGrid;
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
            galleryGrid = document.createElement('div');
            galleryGrid.id = 'imageGalleryGrid';
            galleryContainer.appendChild(galleryGrid);
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

            imageGallery.init({
                container: galleryContainer,
                grid: galleryGrid
            });
            imageGallery.reset();
            imageGallery.BATCH_SIZE = 12;
        });

        afterEach(function () {
            imageGallery.reset();
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

        it('closes search and cancels gallery when prefix input loses focus (blur)', function () {
            var searchArticlesFocused = false;
            var hidden = false;
            var cancelled = false;
            var testGallery = {
                cancel: function () { cancelled = true; }
            };

            var onPrefixBlur = function () {
                if (!searchArticlesFocused) {
                    testGallery.cancel();
                    hidden = true;
                }
            };

            onPrefixBlur();
            assert.isTrue(hidden, 'Search results should be hidden on prefix blur');
            assert.isTrue(cancelled, 'Gallery should be cancelled on prefix blur');
        });

        it('prevents default on loadMoreBtn mousedown so prefix input does not trigger blur cancellation', function () {
            var defaultPrevented = false;
            var mockEvent = {
                preventDefault: function () {
                    defaultPrevented = true;
                }
            };

            var testBtn = document.createElement('button');
            var mousedownListener = null;
            var origAddEventListener = testBtn.addEventListener;
            testBtn.addEventListener = function (type, fn) {
                if (type === 'mousedown') mousedownListener = fn;
                return origAddEventListener.call(testBtn, type, fn);
            };

            imageGallery.init({
                loadMoreBtn: testBtn
            });

            assert.isNotNull(mousedownListener, 'mousedown listener must be registered on loadMoreBtn');
            mousedownListener(mockEvent);
            assert.isTrue(defaultPrevented, 'loadMoreBtn mousedown must call preventDefault to prevent focus blur');
        });

        it('centralizes visibility via updateSearchAndGalleryVisibility preventing contradictory UI states', function () {
            var currentSearchView = 'articles';
            var updateSearchAndGalleryVisibility = function (options) {
                options = options || {};
                var showResults = options.showResults !== undefined ? options.showResults : (articleListWithHeader && articleListWithHeader.style.display !== 'none');
                var view = options.view || currentSearchView;

                if (!showResults) {
                    if (articleListWithHeader) articleListWithHeader.style.display = 'none';
                    if (articleContent) articleContent.style.visibility = '';
                    return;
                }

                if (articleListWithHeader) articleListWithHeader.style.display = '';

                if (view === 'images') {
                    if (btnImages) btnImages.classList.add('active');
                    if (btnArticles) btnArticles.classList.remove('active');
                    if (articleList) articleList.style.display = 'none';
                    if (galleryContainer) galleryContainer.style.display = '';
                    if (articleContent) articleContent.style.visibility = 'hidden';
                } else {
                    if (btnArticles) btnArticles.classList.add('active');
                    if (btnImages) btnImages.classList.remove('active');
                    if (galleryContainer) galleryContainer.style.display = 'none';
                    if (articleList) articleList.style.display = '';
                    if (articleContent) articleContent.style.visibility = '';
                }
            };

            // Scenario 1: Initial state (closed)
            updateSearchAndGalleryVisibility({ showResults: false });
            assert.equal(articleListWithHeader.style.display, 'none');
            assert.equal(articleContent.style.visibility, '');

            // Scenario 2: Open in images view
            currentSearchView = 'images';
            updateSearchAndGalleryVisibility({ view: 'images', showResults: true });
            assert.equal(articleListWithHeader.style.display, '');
            assert.equal(galleryContainer.style.display, '');
            assert.equal(articleList.style.display, 'none');
            assert.equal(articleContent.style.visibility, 'hidden');
            assert.isTrue(btnImages.classList.contains('active'));
            assert.isFalse(btnArticles.classList.contains('active'));

            // Scenario 3: Switch to articles view
            currentSearchView = 'articles';
            updateSearchAndGalleryVisibility({ view: 'articles', showResults: true });
            assert.equal(articleListWithHeader.style.display, '');
            assert.equal(galleryContainer.style.display, 'none');
            assert.equal(articleList.style.display, '');
            assert.equal(articleContent.style.visibility, '');
            assert.isTrue(btnArticles.classList.contains('active'));
            assert.isFalse(btnImages.classList.contains('active'));

            // Scenario 4: Close results from images view
            currentSearchView = 'images';
            updateSearchAndGalleryVisibility({ view: 'images', showResults: true });
            assert.equal(articleContent.style.visibility, 'hidden');
            updateSearchAndGalleryVisibility({ showResults: false });
            assert.equal(articleListWithHeader.style.display, 'none');
            assert.equal(articleContent.style.visibility, '', 'articleContent visibility must be restored when closing from images view');

            // Scenario 5: Repeatedly cycle open/close operations
            for (var i = 0; i < 5; i++) {
                updateSearchAndGalleryVisibility({ view: 'images', showResults: true });
                assert.equal(articleContent.style.visibility, 'hidden');
                updateSearchAndGalleryVisibility({ showResults: false });
                assert.equal(articleContent.style.visibility, '');
            }
        });

        it('cancels gallery and hides overlay on prefix blur even while in images view', function () {
            var searchArticlesFocused = false;
            var search = { prefix: 'test', status: 'interim' };
            var appstate = { search: search };
            var updateCalledWith = null;

            var updateSearchAndGalleryVisibility = function (options) {
                updateCalledWith = options;
                if (!options.showResults) {
                    articleListWithHeader.style.display = 'none';
                    articleContent.style.visibility = '';
                }
            };

            // Set UI to open images view
            articleListWithHeader.style.display = '';
            articleContent.style.visibility = 'hidden';

            var onPrefixBlur = function () {
                if (!searchArticlesFocused) {
                    imageGallery.cancel();
                    if (appstate.search) appstate.search.status = 'cancelled';
                    updateSearchAndGalleryVisibility({ showResults: false });
                }
            };

            // Blur occurs while images view is active
            onPrefixBlur();

            assert.isTrue(imageGallery.cancelled);
            assert.equal(search.status, 'cancelled');
            assert.isNotNull(updateCalledWith);
            assert.isFalse(updateCalledWith.showResults);
            assert.equal(articleListWithHeader.style.display, 'none');
            assert.equal(articleContent.style.visibility, '');

            // Verify that if searchArticlesFocused was true, blur is ignored
            searchArticlesFocused = true;
            updateCalledWith = null;
            search.status = 'final';
            imageGallery.cancelled = false;

            onPrefixBlur();
            assert.isFalse(imageGallery.cancelled);
            assert.equal(search.status, 'final');
            assert.isNull(updateCalledWith);
        });

        it('reopening the gallery after closing or cancellation starts a fresh search lifecycle', function () {
            var mockArchive = {
                readUtf8File: function (entry, cb) {
                    cb(entry, '<figure><img src="../I/Fresh.jpg" width="200" height="200"><figcaption>Fresh</figcaption></figure>');
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

            var entry = { namespace: 'A', url: 'Fresh.html', isRedirect: () => false, toStringId: () => 'A/Fresh.html' };
            var search1 = { prefix: 'fresh', status: 'final' };

            // Step 1: Initial search
            return imageGallery.loadImagesForSearch([entry], search1, { archive: mockArchive }).then(function () {
                assert.equal(galleryGrid.querySelectorAll('.image-gallery-card').length, 1);

                // Step 2: Gallery is closed/cancelled
                imageGallery.cancel();
                assert.isTrue(imageGallery.cancelled);

                // Step 3: User reopens gallery with the same search prefix
                var search2 = { prefix: 'fresh', status: 'final' };
                return imageGallery.loadImagesForSearch([entry], search2, { archive: mockArchive }).then(function () {
                    assert.isFalse(imageGallery.cancelled, 'Cancelled state must be cleared on reopen');
                    assert.equal(galleryGrid.querySelectorAll('.image-gallery-card').length, 1);
                });
            });
        });

        it('prunes card node from DOM when search is cancelled during in-flight read', function (done) {
            var card = document.createElement('div');
            var img = document.createElement('img');
            card.appendChild(img);
            galleryGrid.appendChild(card);

            var cancelled = false;
            var mockArchive = {
                getDirEntryByPath: function () {
                    // Cancel search while archive is resolving path
                    cancelled = true;
                    return Promise.resolve({
                        getMimetype: () => 'image/jpeg'
                    });
                },
                readBinaryFile: function (entry, cb) {
                    cb(entry, new Uint8Array([1, 2, 3]));
                    return Promise.resolve();
                }
            };
            imageGallery.options = { archive: mockArchive };

            imageGallery.loadImageSource(img, card, 'I/CancelledPrune.jpg', function () { return cancelled; }, function (err) {
                try {
                    assert.isNotNull(err);
                    assert.equal(err.message, 'Cancelled');
                    assert.isNull(card.parentNode, 'Card node must be pruned from parent when cancelled in-flight');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('cancels active gallery extraction immediately and restores articleContent when article is selected', function () {
            articleContent.style.visibility = 'hidden';
            articleListWithHeader.style.display = '';

            var mockSearch = { status: 'interim' };
            imageGallery.activeSearch = mockSearch;
            imageGallery.isExtracting = true;

            var selectedEntry = null;
            var onSelectArticle = function (dirEntryOrId) {
                selectedEntry = dirEntryOrId;
                imageGallery.cleanup();
                articleListWithHeader.style.display = 'none';
                articleContent.style.visibility = '';
            };

            onSelectArticle('A/SelectedArticle.html');

            assert.equal(selectedEntry, 'A/SelectedArticle.html');
            assert.isTrue(imageGallery.cancelled);
            assert.isNull(imageGallery.activeSearch);
            assert.isFalse(imageGallery.isExtracting);
            assert.equal(articleListWithHeader.style.display, 'none');
            assert.equal(articleContent.style.visibility, '');
        });

        describe('Mentor Fourth Feedback: Search-State Synchronization & Discarding Stale Work', function () {
            var mockAppstate;
            var testArchive;

            beforeEach(function () {
                mockAppstate = { search: null };
                imageGallery.getAppstate = function () { return mockAppstate; };

                testArchive = {
                    readUtf8File: function (entry, cb) {
                        var html = '';
                        if (entry.url === 'Paris1.html') {
                            html = '<figure><img src="../I/p1.jpg"><figcaption>Paris 1</figcaption></figure>' +
                                   '<figure><img src="../I/p2.jpg"><figcaption>Paris 2</figcaption></figure>';
                        } else if (entry.url === 'Paris2.html') {
                            html = '<figure><img src="../I/p3.jpg"><figcaption>Paris 3</figcaption></figure>';
                        } else if (entry.url === 'ParisBig.html') {
                            var figures = [];
                            for (var i = 1; i <= 25; i++) {
                                figures.push('<figure><img src="../I/img' + i + '.jpg"><figcaption>Img ' + i + '</figcaption></figure>');
                            }
                            html = figures.join('');
                        } else if (entry.url === 'London.html') {
                            html = '<figure><img src="../I/london.jpg"><figcaption>London 1</figcaption></figure>';
                        }
                        cb(entry, html);
                        return Promise.resolve();
                    },
                    getDirEntryByPath: function (path) {
                        return Promise.resolve({
                            getMimetype: () => 'image/jpeg'
                        });
                    },
                    readBinaryFile: function (entry, cb) {
                        cb(entry, new Uint8Array([1, 2, 3]));
                        return Promise.resolve();
                    }
                };
                imageGallery.getArchive = function () { return testArchive; };
            });

            it('tracks specific search object and clears old cards when searching "Paris" after opening an article', async function () {
                var search1 = { prefix: 'Paris', status: 'final' };
                mockAppstate.search = search1;
                var entry1 = { namespace: 'A', url: 'Paris1.html', isRedirect: () => false, toStringId: () => 'A/Paris1.html' };

                // Step 1: Initial search for Paris
                await imageGallery.loadImagesForSearch([entry1], search1, { archive: testArchive });
                var cards1 = galleryGrid.querySelectorAll('.image-gallery-card');
                assert.equal(cards1.length, 2, 'Initial Paris search must render 2 cards');
                assert.equal(imageGallery.activeSearch, search1);

                // Step 2: User opens an article from the gallery card
                imageGallery.cleanup();
                mockAppstate.search.prefix = '';

                assert.isTrue(imageGallery.cancelled);
                assert.isNull(imageGallery.activeSearch);

                // Step 3: User searches for "Paris" again (creates new search object in memory)
                var search2 = { prefix: 'Paris', status: 'final' };
                mockAppstate.search = search2;
                var entry2 = { namespace: 'A', url: 'Paris2.html', isRedirect: () => false, toStringId: () => 'A/Paris2.html' };

                await imageGallery.loadImagesForSearch([entry2], search2, { archive: testArchive });

                // Step 4: Confirm old cards do not reappear and only search2 cards exist
                var cards2 = galleryGrid.querySelectorAll('.image-gallery-card');
                assert.equal(cards2.length, 1, 'Only the new search cards must be present; old cards must not linger');
                var caption = cards2[0].querySelector('.image-gallery-caption');
                assert.equal(caption.textContent, 'Paris 3');
                assert.equal(imageGallery.activeSearch, search2);
                assert.isFalse(imageGallery.cancelled, 'Cancelled state must be cleared for new search');
            });

            it('tracks specific search object and allows Load More after Escape cancels and user re-searches', async function () {
                var statusDiv = document.createElement('div');
                var loadMoreCont = document.createElement('div');
                var loadMoreButton = document.createElement('button');
                loadMoreCont.appendChild(loadMoreButton);

                imageGallery.init({
                    container: galleryContainer,
                    grid: galleryGrid,
                    status: statusDiv,
                    loadMoreContainer: loadMoreCont,
                    loadMoreBtn: loadMoreButton,
                    getAppstate: () => mockAppstate,
                    getArchive: () => testArchive
                });
                imageGallery.TARGET_BATCH_IMAGES = 15;
                imageGallery.BATCH_SIZE = 15;

                var search1 = { prefix: 'Paris', status: 'final' };
                mockAppstate.search = search1;
                var bigEntry = { namespace: 'A', url: 'ParisBig.html', isRedirect: () => false, toStringId: () => 'A/ParisBig.html' };

                // Initial search
                await imageGallery.loadImagesForSearch([bigEntry], search1, { archive: testArchive });
                assert.equal(galleryGrid.querySelectorAll('.image-gallery-card').length, 15);
                assert.equal(imageGallery.pendingImages.length, 10);
                assert.equal(loadMoreCont.style.display, '');

                // User presses Escape
                imageGallery.cancel();
                mockAppstate.search.status = 'cancelled';
                mockAppstate.search.prefix = '';

                assert.isTrue(imageGallery.isCancelled());

                // User re-executes search for Paris (new search object)
                var search2 = { prefix: 'Paris', status: 'final' };
                mockAppstate.search = search2;

                await imageGallery.loadImagesForSearch([bigEntry], search2, { archive: testArchive });

                assert.equal(galleryGrid.querySelectorAll('.image-gallery-card').length, 15, 'Initial batch of 15 reset for new search');
                assert.equal(imageGallery.pendingImages.length, 10, 'Pending images initialized for new search');
                assert.equal(loadMoreCont.style.display, '', 'Load more button must be visible for active search');

                // User clicks Load More
                await imageGallery.loadMore();

                assert.equal(galleryGrid.querySelectorAll('.image-gallery-card').length, 25, 'Load more must successfully render remaining 10 cards to reach 25');
                assert.equal(imageGallery.pendingImages.length, 0);
                assert.equal(loadMoreCont.style.display, 'none', 'Load more button must be hidden when images are exhausted');
            });

            it('prevents callbacks from an earlier search from modifying a newer search gallery', async function () {
                var delayedBinaryCb = null;
                var slowArchive = {
                    readUtf8File: function (entry, cb) {
                        if (entry.url === 'SlowParis.html') {
                            cb(entry, '<figure><img src="../I/slow.jpg"><figcaption>Slow Paris</figcaption></figure>');
                            return Promise.resolve();
                        }
                        cb(entry, '<figure><img src="../I/london.jpg"><figcaption>Fast London</figcaption></figure>');
                        return Promise.resolve();
                    },
                    getDirEntryByPath: function () {
                        return Promise.resolve({
                            getMimetype: () => 'image/jpeg'
                        });
                    },
                    readBinaryFile: function (entry, cb) {
                        if (entry.url === 'slow.jpg') {
                            // Hold the binary callback until after replacement search has finished
                            delayedBinaryCb = function () {
                                cb(entry, new Uint8Array([1, 2, 3]));
                            };
                            return Promise.resolve();
                        }
                        cb(entry, new Uint8Array([1, 2, 3]));
                        return Promise.resolve();
                    }
                };

                imageGallery.getArchive = function () { return slowArchive; };

                var search1 = { prefix: 'Paris', status: 'final' };
                mockAppstate.search = search1;
                var entry1 = { namespace: 'A', url: 'SlowParis.html', isRedirect: () => false, toStringId: () => 'A/SlowParis.html' };

                // Start search 1 (will pause at delayedBinaryCb)
                imageGallery.loadImagesForSearch([entry1], search1, { archive: slowArchive });

                // Before search 1 binary read completes, user starts search 2
                search1.status = 'cancelled';
                var search2 = { prefix: 'London', status: 'final' };
                mockAppstate.search = search2;
                var entry2 = { namespace: 'A', url: 'FastLondon.html', isRedirect: () => false, toStringId: () => 'A/FastLondon.html' };

                await imageGallery.loadImagesForSearch([entry2], search2, { archive: slowArchive });

                // Confirm search 2 has rendered London card
                var cardsSearch2 = galleryGrid.querySelectorAll('.image-gallery-card');
                assert.equal(cardsSearch2.length, 1);
                assert.equal(cardsSearch2[0].querySelector('.image-gallery-caption').textContent, 'Fast London');

                // Now Search 1's delayed callback fires
                if (delayedBinaryCb) delayedBinaryCb();

                // Wait a tick and verify Search 1's card was discarded and did not modify the gallery
                await new Promise(r => setTimeout(r, 40));

                var cardsFinal = galleryGrid.querySelectorAll('.image-gallery-card');
                assert.equal(cardsFinal.length, 1, 'Search 1 delayed callback must not inject cards into Search 2 gallery');
                assert.equal(cardsFinal[0].querySelector('.image-gallery-caption').textContent, 'Fast London');
            });

            it('isCancelled detects status=cancelled and appstate.search pointer changes', function () {
                var search1 = { prefix: 'Paris', status: 'final' };
                var search2 = { prefix: 'Paris', status: 'final' };
                mockAppstate.search = search1;
                imageGallery.activeSearch = search1;
                imageGallery.cancelled = false;

                assert.isFalse(imageGallery.isCancelled(search1), 'Active matching search must not be cancelled');

                // Condition A: search status marked cancelled
                search1.status = 'cancelled';
                assert.isTrue(imageGallery.isCancelled(search1), 'Search with status=cancelled must be cancelled');

                // Condition B: appstate.search moved to a different search object
                search1.status = 'final';
                mockAppstate.search = search2;
                assert.isTrue(imageGallery.isCancelled(search1), 'Superseded search object must be cancelled when appstate.search points to new object');

                // Condition C: activeSearch is null or mismatched
                imageGallery.activeSearch = search2;
                assert.isTrue(imageGallery.isCancelled(search1), 'Search mismatching activeSearch must be cancelled');

                // Condition D: appstate.search status is cancelled
                mockAppstate.search.status = 'cancelled';
                assert.isTrue(imageGallery.isCancelled(search2), 'Search must be cancelled when appstate.search.status is cancelled');
            });

            it('cancel() executes in safe order and avoids null-reference errors', function () {
                var search = { prefix: 'test', status: 'interim' };
                imageGallery.activeSearch = search;

                // Step 1: cancel() when activeSearch is present
                assert.doesNotThrow(function () {
                    imageGallery.cancel();
                });
                assert.equal(search.status, 'cancelled', 'activeSearch status must be marked cancelled before clearing reference');
                assert.isNull(imageGallery.activeSearch, 'activeSearch must be set to null after marking status');
                assert.isTrue(imageGallery.cancelled);

                // Step 2: cancel() when activeSearch is already null
                assert.doesNotThrow(function () {
                    imageGallery.cancel();
                }, 'Calling cancel() when activeSearch is null must not throw null-reference error');
                assert.isNull(imageGallery.activeSearch);

                // Step 3: cancel() when activeSearch is undefined
                imageGallery.activeSearch = undefined;
                assert.doesNotThrow(function () {
                    imageGallery.cancel();
                }, 'Calling cancel() when activeSearch is undefined must not throw error');
                assert.isNull(imageGallery.activeSearch);
            });
        });
    });
});
