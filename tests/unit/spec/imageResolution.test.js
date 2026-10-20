/* eslint-disable no-undef */
/**
 * Tests for shared image and asset URL resolution logic in uiUtil.js (Issue #277).
 *
 * Verifies that:
 * - Relative URLs are correctly resolved against explicit article base URLs.
 * - Standard data URIs (PNG, JPEG) are preserved without unwanted rewriting.
 * - WebP data URIs are rewritten to data-kiwixurl only when webpMachine is active.
 * - Image srcsets are safely converted to data-kiwixsrcset.
 * - Zimit-specific transformations (canonical prefix, root-relative, protocol-relative, analytics removal) work as expected.
 * - Candidate article parsing does not require or mutate global appstate.baseUrl.
 */

import { assert } from 'chai';
import '../js/init.js';
import uiUtil from '../../../www/js/lib/uiUtil.js';

describe('Shared Image and Asset URL Resolution (Issue #277)', function () {
    describe('uiUtil.resolveImageUrl', function () {
        it('resolves relative asset URLs against standard article base URL', function () {
            const resolved = uiUtil.resolveImageUrl('../I/RayCharles.jpg', 'A/Ray_Charles.html');
            assert.equal(resolved, 'I/RayCharles.jpg');
        });

        it('resolves sibling asset URLs against directory base URL', function () {
            const resolved = uiUtil.resolveImageUrl('thumb.png', 'A/Music/');
            assert.equal(resolved, 'A/Music/thumb.png');
        });

        it('properly encodes special characters in resolved URL', function () {
            const resolved = uiUtil.resolveImageUrl('../I/imágen.png', 'A/');
            assert.equal(resolved, 'I/im%C3%A1gen.png');
        });

        it('handles empty or missing URL gracefully', function () {
            assert.equal(uiUtil.resolveImageUrl('', 'A/'), '');
            assert.equal(uiUtil.resolveImageUrl(null, 'A/'), '');
        });

        it('strips indexRoot in Zimit archives', function () {
            const options = {
                zimType: 'zimit',
                indexRoot: '/app/test.zim/'
            };
            const resolved = uiUtil.resolveImageUrl('/app/test.zim/C/wp-content/pic.jpg', 'C/', options);
            assert.equal(resolved, 'C/wp-content/pic.jpg');
        });

        it('resolves root-relative URLs in classic Zimit 1 archives', function () {
            const resolvedC = uiUtil.resolveImageUrl('/pix/xmr.svg', 'C/A/based.cooking/', { zimType: 'zimit' });
            assert.equal(resolvedC, 'C/A/based.cooking/pix/xmr.svg');

            const resolvedA = uiUtil.resolveImageUrl('/pix/xmr.svg', 'A/based.cooking/', { zimType: 'zimit' });
            assert.equal(resolvedA, 'A/based.cooking/pix/xmr.svg');
        });

        it('resolves absolute HTTPS and protocol-relative URLs in classic Zimit 1 archives', function () {
            const resolvedHttps = uiUtil.resolveImageUrl('https://based.cooking/pix/btc.svg', 'C/A/based.cooking/', { zimType: 'zimit' });
            assert.equal(resolvedHttps, 'C/A/based.cooking/pix/btc.svg');

            const resolvedProto = uiUtil.resolveImageUrl('//based.cooking/pix/btc.svg', 'C/A/based.cooking/', { zimType: 'zimit' });
            assert.equal(resolvedProto, 'C/A/based.cooking/pix/btc.svg');
        });

        it('preserves already-resolved canonical ZIM URLs without duplication or distortion', function () {
            const resolved = uiUtil.resolveImageUrl('C/A/based.cooking/pix/xmr.svg', 'C/A/based.cooking/', { zimType: 'zimit' });
            assert.equal(resolved, 'C/A/based.cooking/pix/xmr.svg');
        });

        it('resolves relative URLs in Zimit 2 without unwanted A/ namespace insertion', function () {
            const resolved = uiUtil.resolveImageUrl('../assets/logo.png', 'C/site/sub/', { zimType: 'zimit2' });
            assert.equal(resolved, 'C/site/assets/logo.png');

            const resolvedDirect = uiUtil.resolveImageUrl('media/pic.jpg', 'C/site/', { zimType: 'zimit2' });
            assert.equal(resolvedDirect, 'C/site/media/pic.jpg');
        });
    });

    describe('uiUtil.transformArticleHtmlForRestrictedMode', function () {
        const dummyDirEntry = {
            namespace: 'A',
            url: 'Subdir/Article.html'
        };

        it('rewrites relative img src to data-kiwixurl using explicit baseUrl', function () {
            const html = '<p><img src="../I/photo.jpg" alt="Photo"></p>';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                baseUrl: 'A/'
            });
            assert.include(transformed, 'data-kiwixurl="I/photo.jpg"');
            assert.notInclude(transformed, 'src="../I/photo.jpg"');
        });

        it('transforms untransformed images in mixed HTML while preserving already-transformed tags with whitespace around equals', function () {
            const mixedHtml = '<img data-kiwixurl = "I/already.jpg" alt="Already"><img src="../I/needs.jpg" alt="Needs">';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(mixedHtml, {
                baseUrl: 'A/'
            });
            assert.include(transformed, 'data-kiwixurl = "I/already.jpg"');
            assert.include(transformed, 'data-kiwixurl="I/needs.jpg"');
            assert.notInclude(transformed, 'src="../I/needs.jpg"');
        });

        it('does not mistake plain text mentioning data-kiwixurl for an already-transformed tag', function () {
            const html = '<p>This article explains data-kiwixurl specification.</p><img src="../I/needs.jpg" alt="Needs">';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                baseUrl: 'A/'
            });
            assert.include(transformed, 'data-kiwixurl specification');
            assert.include(transformed, 'data-kiwixurl="I/needs.jpg"');
            assert.notInclude(transformed, 'src="../I/needs.jpg"');
        });

        it('is idempotent on repeated calls without duplicating or corrupting data-kiwixurl attributes', function () {
            const html = '<img src="../I/photo.jpg" alt="Photo">';
            const first = uiUtil.transformArticleHtmlForRestrictedMode(html, { baseUrl: 'A/' });
            const second = uiUtil.transformArticleHtmlForRestrictedMode(first, { baseUrl: 'A/' });
            assert.equal(second, first);
        });

        it('derives baseUrl from dirEntry when baseUrl option is omitted', function () {
            const html = '<img src="../../I/photo.jpg" alt="Photo">';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                dirEntry: dummyDirEntry
            });
            assert.include(transformed, 'data-kiwixurl="I/photo.jpg"');
        });

        it('preserves standard PNG and JPEG data URIs without rewriting', function () {
            const pngData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            const html = '<img src="' + pngData + '" alt="Dot">';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                baseUrl: 'A/'
            });
            assert.include(transformed, 'src="' + pngData + '"');
            assert.notInclude(transformed, 'data-kiwixurl');
        });

        it('leaves WebP data URIs as src when webpMachine is inactive', function () {
            const webpData = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
            const html = '<img src="' + webpData + '" alt="WebP Image">';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                baseUrl: 'A/',
                webpMachine: false
            });
            assert.include(transformed, 'src="' + webpData + '"');
            assert.notInclude(transformed, 'data-kiwixurl');
        });

        it('rewrites WebP data URIs to data-kiwixurl when webpMachine is active', function () {
            const webpData = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
            const html = '<img src="' + webpData + '" alt="WebP Image">';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                baseUrl: 'A/',
                webpMachine: true
            });
            assert.include(transformed, 'data-kiwixurl="' + webpData + '"');
            assert.notInclude(transformed, 'src="' + webpData + '"');
        });

        it('converts srcset to data-kiwixsrcset', function () {
            const html = '<img src="../I/small.jpg" srcset="../I/small.jpg 1x, ../I/large.jpg 2x" alt="Responsive">';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                baseUrl: 'A/'
            });
            assert.include(transformed, 'data-kiwixurl="I/small.jpg"');
            assert.include(transformed, 'data-kiwixsrcset=');
            assert.notInclude(transformed, ' srcset=');
        });

        it('rewrites script, link, and track tags in addition to images', function () {
            const html = '<link rel="stylesheet" href="../-/s/style.css"><script src="../-/j/app.js"></script><track src="../-/t/sub.vtt">';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                baseUrl: 'A/'
            });
            assert.include(transformed, 'data-kiwixurl="-/s/style.css"');
            assert.include(transformed, 'data-kiwixurl="-/j/app.js"');
            assert.include(transformed, 'data-kiwixurl="-/t/sub.vtt"');
        });

        it('removes empty audio and video tags without media source', function () {
            const html = '<p>Text</p><video></video><audio></audio><p>More text</p>';
            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                baseUrl: 'A/'
            });
            assert.notInclude(transformed, '<video></video>');
            assert.notInclude(transformed, '<audio></audio>');
            assert.include(transformed, '<p>Text</p>');
            assert.include(transformed, '<p>More text</p>');
        });

        describe('Zimit archive handling', function () {
            const zimitDirEntry = {
                namespace: 'C',
                url: 'example.com/index.html'
            };

            it('resolves canonical Zimit prefix and root-relative URLs', function () {
                const html = '<link rel="canonical" href="https://example.com/index.html">' +
                    '<img src="/static/img/logo.png" alt="Logo">';
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    dirEntry: zimitDirEntry,
                    zimType: 'zimit',
                    zimitPrefix: 'example.com',
                    fileName: 'test.zim',
                    indexRoot: ''
                });
                assert.include(transformed, 'data-kiwixurl="C/A/example.com/static/img/logo.png"');
            });

            it('resolves protocol-relative and absolute http(s) URLs in Zimit', function () {
                const html = '<img src="//example.com/assets/banner.jpg" alt="Banner">';
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    dirEntry: zimitDirEntry,
                    zimType: 'zimit',
                    zimitPrefix: 'example.com',
                    fileName: 'test.zim',
                    indexRoot: ''
                });
                assert.include(transformed, 'data-kiwixurl="C/A/example.com/assets/banner.jpg"');
            });

            it('removes analytics links in Zimit articles', function () {
                const html = '<script src="https://www.google-analytics.com/analytics.js"></script>' +
                    '<img src="/logo.png" alt="Logo">';
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    dirEntry: zimitDirEntry,
                    zimType: 'zimit',
                    zimitPrefix: 'example.com',
                    fileName: 'test.zim',
                    indexRoot: ''
                });
                assert.notInclude(transformed, 'google-analytics.com');
                assert.include(transformed, 'data-kiwixurl="C/A/example.com/logo.png"');
            });

            it('transforms srcset entries in Zimit articles with proper prefix', function () {
                const html = '<img src="/pic.jpg" srcset="/pic-1x.jpg, /pic-2x.jpg 2x" alt="Pic">';
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    dirEntry: zimitDirEntry,
                    zimType: 'zimit',
                    zimitPrefix: 'example.com',
                    fileName: 'test.zim',
                    indexRoot: ''
                });
                assert.include(transformed, 'data-kiwixsrcset="C/A/example.com/pic-1x.jpg, C/A/example.com/pic-2x.jpg 2x"');
            });

            it('preserves already-transformed data-kiwixurl tags while transforming untransformed tags in Zimit articles', function () {
                const html = '<img data-kiwixurl="C/A/example.com/already.jpg" alt="Already">' +
                    '<img src="/needs.jpg" alt="Needs">';
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    dirEntry: zimitDirEntry,
                    zimType: 'zimit',
                    zimitPrefix: 'example.com',
                    fileName: 'test.zim',
                    indexRoot: ''
                });
                assert.include(transformed, 'data-kiwixurl="C/A/example.com/already.jpg"');
                assert.include(transformed, 'data-kiwixurl="C/A/example.com/needs.jpg"');
                assert.notInclude(transformed, 'src="/needs.jpg"');
            });
            it('resolves zimit2 archives using standard relative base URL rather than classic zimit prefix', function () {
                const zimit2Entry = {
                    namespace: 'C',
                    url: 'tonedear.com/ear-training/intervals.html'
                };
                const html = '<img src="../images/piano.png" alt="Piano">';
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    dirEntry: zimit2Entry,
                    zimType: 'zimit2',
                    zimitPrefix: 'tonedear.com'
                });
                assert.include(transformed, 'data-kiwixurl="C/tonedear.com/images/piano.png"');
                assert.notInclude(transformed, 'C/A/');
            });
        });

        describe('Attribute formatting and URL variations', function () {
            it('supports single-quoted src attributes and extra whitespace', function () {
                const html = "<img class='hero'  src = '../I/photo.jpg'  alt='Photo'>";
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    baseUrl: 'A/'
                });
                assert.include(transformed, "data-kiwixurl = 'I/photo.jpg'");
            });

            it('preserves hash fragments on asset URLs', function () {
                const html = '<img src="../I/icons.svg#chevron" alt="Arrow">';
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    baseUrl: 'A/'
                });
                assert.include(transformed, 'data-kiwixurl="I/icons.svg#chevron"');
            });

            it('properly encodes spaces and percent-encoded characters in asset URLs', function () {
                const html = '<img src="../I/my%20test%20image.png" alt="Test">' +
                    '<img src="../I/another test image.png" alt="Test 2">';
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    baseUrl: 'A/'
                });
                assert.include(transformed, 'data-kiwixurl="I/my%20test%20image.png"');
                assert.include(transformed, 'data-kiwixurl="I/another%20test%20image.png"');
            });

            it('does not rewrite external absolute http or https URLs', function () {
                const html = '<img src="https://example.com/photo.jpg" alt="External">' +
                    '<img src="http://example.com/photo2.jpg" alt="External 2">';
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    baseUrl: 'A/'
                });
                assert.include(transformed, 'src="https://example.com/photo.jpg"');
                assert.include(transformed, 'src="http://example.com/photo2.jpg"');
                assert.notInclude(transformed, 'data-kiwixurl');
            });

            it('resolves assets in the modern C/ namespace', function () {
                const html = '<img src="../assets/logo.png" alt="Logo">';
                const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                    baseUrl: 'C/site/sub/'
                });
                assert.include(transformed, 'data-kiwixurl="C/site/assets/logo.png"');
            });
        });

        it('never mutates global appstate.baseUrl during candidate processing', function () {
            globalThis.appstate = { baseUrl: 'A/Active_Main_Article/' };
            const candidateDirEntry = { namespace: 'A', url: 'Background_Candidate.html' };
            const html = '<img src="../I/candidate_thumb.jpg">';

            const transformed = uiUtil.transformArticleHtmlForRestrictedMode(html, {
                dirEntry: candidateDirEntry,
                baseUrl: 'A/'
            });

            assert.include(transformed, 'data-kiwixurl="I/candidate_thumb.jpg"');
            assert.equal(globalThis.appstate.baseUrl, 'A/Active_Main_Article/', 'Active article baseUrl was preserved');
        });

        it('matches pre-refactor characterization output on a multi-asset document', function () {
            // Characterization fixture containing mixed image, script, link, srcset, and data-uri assets
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

            // Assert exact characterization targets
            assert.include(transformed, '<link rel="stylesheet" data-kiwixurl="-/s/style.css">');
            assert.include(transformed, '<img data-kiwixurl="I/img1.jpg" alt="Pic 1">');
            assert.include(transformed, "<img data-kiwixurl='I/img2.jpg' data-kiwixsrcset='../I/img2-1x.jpg 1x, ../I/img2-2x.jpg 2x'>");
            assert.include(transformed, '<img src="data:image/png;base64,');
            assert.include(transformed, '<script data-kiwixurl="-/j/code.js"></script>');
            assert.notInclude(transformed, '<audio></audio>');
        });
    });
});
