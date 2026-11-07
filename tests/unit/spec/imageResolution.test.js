/* eslint-disable no-undef */
/**
 * Tests for shared image, asset URL resolution, and queue utilities in uiUtil.js (Issue #277).
 *
 * Verifies that:
 * - Relative URLs are correctly resolved against explicit article base URLs.
 * - Zimit-specific transformations (canonical prefix, root-relative, protocol-relative, analytics removal) work as expected.
 * - Restricted-mode HTML transformation rewrites assets in a single pass.
 * - Characterization output on multi-asset documents matches expected targets.
 * - Sequential queue execution and WebP decode serialization operate safely.
 */

import { assert } from 'chai';
import '../js/init.js';
import uiUtil from '../../../www/js/lib/uiUtil.js';

describe('Shared Image and Asset URL Resolution (Issue #277)', function () {
    describe('uiUtil.resolveImageUrl', function () {
        it('resolves relative and sibling asset URLs against standard article base URL with proper encoding', function () {
            assert.equal(uiUtil.resolveImageUrl('../I/RayCharles.jpg', 'A/Ray_Charles.html'), 'I/RayCharles.jpg');
            assert.equal(uiUtil.resolveImageUrl('thumb.png', 'A/Music/'), 'A/Music/thumb.png');
            assert.equal(uiUtil.resolveImageUrl('../I/imágen.png', 'A/'), 'I/im%C3%A1gen.png');
            assert.equal(uiUtil.resolveImageUrl('', 'A/'), '');
            assert.equal(uiUtil.resolveImageUrl(null, 'A/'), '');
            assert.equal(uiUtil.resolveImageUrl('data:image/webp;base64,abc', 'A/'), '');
            assert.equal(uiUtil.resolveImageUrl('data:image/png;base64,abc', 'A/'), '');
        });

        it('resolves root-relative, absolute HTTPS, and protocol-relative URLs in classic Zimit 1 archives', function () {
            const options = { zimType: 'zimit', indexRoot: '/app/test.zim/' };
            assert.equal(uiUtil.resolveImageUrl('/app/test.zim/C/wp-content/pic.jpg', 'C/', options), 'C/wp-content/pic.jpg');
            assert.equal(uiUtil.resolveImageUrl('/pix/xmr.svg', 'C/A/based.cooking/', { zimType: 'zimit' }), 'C/A/based.cooking/pix/xmr.svg');
            assert.equal(uiUtil.resolveImageUrl('https://based.cooking/pix/btc.svg', 'C/A/based.cooking/', { zimType: 'zimit' }), 'C/A/based.cooking/pix/btc.svg');
            assert.equal(uiUtil.resolveImageUrl('//based.cooking/pix/btc.svg', 'C/A/based.cooking/', { zimType: 'zimit' }), 'C/A/based.cooking/pix/btc.svg');
            assert.equal(uiUtil.resolveImageUrl('C/A/based.cooking/pix/xmr.svg', 'C/A/based.cooking/', { zimType: 'zimit' }), 'C/A/based.cooking/pix/xmr.svg');
        });

        it('resolves relative URLs in Zimit 2 without unwanted A/ namespace insertion', function () {
            assert.equal(uiUtil.resolveImageUrl('../assets/logo.png', 'C/site/sub/', { zimType: 'zimit2' }), 'C/site/assets/logo.png');
            assert.equal(uiUtil.resolveImageUrl('media/pic.jpg', 'C/site/', { zimType: 'zimit2' }), 'C/site/media/pic.jpg');
        });
    });

    describe('uiUtil.transformArticleHtmlForRestrictedMode', function () {
        it('rewrites relative img src to data-kiwixurl and srcset to data-kiwixsrcset', function () {
            const html = '<p><img src="../I/photo.jpg" alt="Photo" srcset="../I/photo-1x.jpg 1x, ../I/photo-2x.jpg 2x"></p>';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, { baseUrl: 'A/' });
            assert.include(transformed, 'data-kiwixurl="I/photo.jpg"');
            assert.include(transformed, 'data-kiwixsrcset="../I/photo-1x.jpg 1x, ../I/photo-2x.jpg 2x"');
            assert.notInclude(transformed, 'src="../I/photo.jpg"');
        });

        it('preserves plain text containing data-kiwixurl while transforming tags', function () {
            const html = '<p>The tag uses data-kiwixurl for offline reading.</p>' +
                '<img src="../I/diagram.png" alt="Diagram">';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, { baseUrl: 'A/' });
            assert.include(transformed, '<p>The tag uses data-kiwixurl for offline reading.</p>');
            assert.include(transformed, 'data-kiwixurl="I/diagram.png"');
        });

        it('rewrites script, link, and track tags in addition to images and removes empty media tags', function () {
            const html = '<link rel="stylesheet" href="../-/s/app.css">' +
                '<script src="../-/j/main.js"></script>' +
                '<audio></audio><video></video>';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, { baseUrl: 'A/' });
            assert.include(transformed, 'data-kiwixurl="-/s/app.css"');
            assert.include(transformed, 'data-kiwixurl="-/j/main.js"');
            assert.notInclude(transformed, '<audio></audio>');
            assert.notInclude(transformed, '<video></video>');
        });

        it('resolves canonical Zimit prefix, root-relative, and protocol-relative URLs in classic Zimit 1', function () {
            const dirEntry = { namespace: 'C', url: 'example.com/dir/page.html' };
            const html = '<link rel="canonical" href="https://example.com/dir/page.html">' +
                '<img src="/static/img/hero.jpg" alt="Root">' +
                '<img src="https://example.com/static/img/abs.png" alt="Abs">' +
                '<img src="//example.com/static/img/proto.gif" alt="Proto">';

            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                dirEntry: dirEntry,
                zimType: 'zimit'
            });

            assert.include(transformed, 'data-kiwixurl="C/A/example.com/static/img/hero.jpg"');
            assert.include(transformed, 'data-kiwixurl="C/A/example.com/static/img/abs.png"');
            assert.include(transformed, 'data-kiwixurl="C/A/example.com/static/img/proto.gif"');
        });

        it('removes analytics links in Zimit articles', function () {
            const dirEntry = { namespace: 'C', url: 'example.com/index.html' };
            const html = '<link rel="canonical" href="https://example.com/index.html">' +
                '<script src="https://example.com/analytics.js"></script>' +
                '<img src="/img/valid.png" alt="Valid">';

            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                dirEntry: dirEntry,
                zimType: 'zimit'
            });

            assert.notInclude(transformed, 'analytics.js');
            assert.include(transformed, 'data-kiwixurl="C/A/example.com/img/valid.png"');
        });

        it('resolves zimit2 and modern C/ namespace archives without unwanted classic Zimit prefix insertion', function () {
            const dirEntry = { namespace: 'C', url: 'site.org/page' };
            const html = '<img src="../assets/logo.png" alt="Logo">';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                dirEntry: dirEntry,
                zimType: 'zimit2',
                baseUrl: 'C/site.org/'
            });
            assert.include(transformed, 'data-kiwixurl="C/assets/logo.png"');
        });

        it('matches pre-refactor characterization output on a multi-asset document', function () {
            const sampleDoc =
                '<head><link rel="stylesheet" href="../-/s/style.css"></head>' +
                '<body>' +
                '  <img src="../I/img1.jpg" alt="Pic 1">' +
                '  <img src=\'../I/img2.jpg\' srcset=\'../I/img2-1x.jpg 1x, ../I/img2-2x.jpg 2x\'>' +
                '  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==">' +
                '  <script src="../-/j/code.js"></script>' +
                '  <audio></audio>' +
                '</body>';

            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(sampleDoc, {
                baseUrl: 'A/',
                webpMachine: false
            });

            assert.include(transformed, '<link rel="stylesheet" data-kiwixurl="-/s/style.css">');
            assert.include(transformed, '<img data-kiwixurl="I/img1.jpg" alt="Pic 1">');
            assert.include(transformed, "<img data-kiwixurl='I/img2.jpg' data-kiwixsrcset='../I/img2-1x.jpg 1x, ../I/img2-2x.jpg 2x'>");
            assert.include(transformed, '<img src="data:image/png;base64,');
            assert.include(transformed, '<script data-kiwixurl="-/j/code.js"></script>');
            assert.notInclude(transformed, '<audio></audio>');
        });
    });

    describe('uiUtil Queue and Deduplication Utilities', function () {
        it('uiUtil.processSequentialQueue executes items in FIFO order and halts on cancellation', async function () {
            const items = ['a', 'b', 'c'];
            const startLog = [];
            const completeLog = [];
            let cancel = false;

            await uiUtil.processSequentialQueue(items, function (item, next) {
                startLog.push(item);
                if (item === 'b') cancel = true;
                setTimeout(function () {
                    completeLog.push(item);
                    next();
                }, 5);
            }, { isCancelled: () => cancel });

            assert.deepEqual(startLog, ['a', 'b'], 'Item c must not start after cancellation on b');
            assert.deepEqual(completeLog, ['a', 'b']);
        });

        it('uiUtil.queueWebpDecode serializes concurrent WebP tasks strictly sequentially', async function () {
            let activeTasks = 0;
            let maxConcurrency = 0;
            const log = [];

            function makeTask (name, delayMs) {
                return function () {
                    activeTasks++;
                    if (activeTasks > maxConcurrency) maxConcurrency = activeTasks;
                    log.push(name + '_start');
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            log.push(name + '_end');
                            activeTasks--;
                            resolve(name);
                        }, delayMs);
                    });
                };
            }

            const p1 = uiUtil.queueWebpDecode(makeTask('t1', 20));
            const p2 = uiUtil.queueWebpDecode(makeTask('t2', 10));
            const p3 = uiUtil.queueWebpDecode(makeTask('t3', 5));

            const res = await Promise.all([p1, p2, p3]);
            assert.deepEqual(res, ['t1', 't2', 't3']);
            assert.equal(maxConcurrency, 1, 'Concurrency must never exceed 1');
            assert.deepEqual(log, ['t1_start', 't1_end', 't2_start', 't2_end', 't3_start', 't3_end']);
        });
    });
});
