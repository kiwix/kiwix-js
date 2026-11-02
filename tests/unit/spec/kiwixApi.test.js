import { expect } from 'chai';
import { describe, it } from 'mocha';
import kiwixApiModule from '../../../www/js/lib/kiwixApi.js';

describe('kiwixApi', function () {
    function createApi (overrides) {
        return kiwixApiModule.createKiwixApi(Object.assign({
            callWorker: function () { return Promise.resolve({}); },
            hasFullText: true,
            isCurrent: function () { return true; },
            extractArticle: function (content) { return 'article:' + Array.from(content).join(','); },
            getArchiveInfo: function () { return { title: 'Test archive' }; },
            getLibzimState: function () { return 'ready'; }
        }, overrides));
    }

    function createArticleApi (article, overrides) {
        return createApi(Object.assign({
            callWorker: function () {
                return { content: new Uint8Array([1]), mimetype: 'text/html' };
            },
            extractArticle: function () { return article; }
        }, overrides));
    }

    it('dispatches only registered methods through call()', async function () {
        const api = createApi({
            callWorker: function (message) {
                expect(message).to.deep.equal({ action: 'suggest', text: 'kiwix', numResults: 4 });
                return { suggestions: [{ path: 'A/Kiwix', title: 'Kiwix' }] };
            }
        });

        expect(await api.call('suggest', { prefix: ' kiwix ', limit: 4 })).to.deep.equal({
            ok: true,
            data: [{ path: 'A/Kiwix', title: 'Kiwix' }]
        });
        expect(await api.call('constructor', {})).to.deep.equal({
            ok: false,
            error: { code: 'INVALID_ARGUMENT', message: 'Unknown API method' }
        });
    });

    it('rejects invalid arguments and unknown parameters before accessing the archive', async function () {
        let workerCalls = 0;
        let infoCalls = 0;
        const api = createApi({
            callWorker: function () { workerCalls++; return {}; },
            getArchiveInfo: function () { infoCalls++; return {}; }
        });
        const cases = [
            ['search', { query: '   ' }],
            ['search', { query: 'term', limit: 101 }],
            ['search', { query: 'term', unexpected: true }],
            ['suggest', { prefix: 'term', unexpected: true }],
            ['getArticle', { path: 'A/Article', unexpected: true }],
            ['getInfo', { unexpected: true }]
        ];

        for (const [method, params] of cases) {
            const result = await api.call(method, params);
            expect(result.ok, method + ' ' + JSON.stringify(params)).to.equal(false);
            expect(result.error.code).to.equal('INVALID_ARGUMENT');
        }
        expect(workerCalls).to.equal(0);
        expect(infoCalls).to.equal(0);
    });

    it('uses the snippets search action and returns its result list', async function () {
        const api = createApi({
            callWorker: function (message) {
                expect(message).to.deep.equal({ action: 'searchWithSnippets', text: 'offline', numResults: 3 });
                return { results: [{ path: 'A/Offline', snippet: 'works offline' }] };
            }
        });
        const result = await api.search({ query: ' offline ', limit: 3 });

        expect(result).to.deep.equal({ ok: true, data: [{ path: 'A/Offline', snippet: 'works offline' }] });
    });

    it('returns FULLTEXT_UNAVAILABLE when the archive has no full-text index', async function () {
        const api = createApi({ hasFullText: false });
        const result = await api.search({ query: 'offline' });

        expect(result.ok).to.equal(false);
        expect(result.error.code).to.equal('FULLTEXT_UNAVAILABLE');
    });

    it('passes unchanged paths and article bytes to the extractor', async function () {
        const content = new Uint8Array([75, 74]);
        const api = createApi({
            callWorker: function (message) {
                expect(message).to.deep.equal({ action: 'getEntryByPath', path: ' A/Kiwix.html ', follow: false });
                return { content: content, mimetype: 'text/html' };
            },
            extractArticle: function (bytes, mimetype, path) {
                expect(bytes).to.equal(content);
                expect(mimetype).to.equal('text/html');
                expect(path).to.equal(' A/Kiwix.html ');
                return 'Kiwix article';
            }
        });
        const result = await api.getArticle({ path: ' A/Kiwix.html ' });

        expect(result.ok).to.equal(true);
        expect(result.data).to.include({ path: ' A/Kiwix.html ', text: 'Kiwix article' });
    });

    it('returns image metadata without payloads and flags best-effort Zimit extraction', async function () {
        const api = createArticleApi({
            text: 'Article text',
            images: [
                { path: 'I/image.jpg', alt: 'Cover', caption: 'An image', data: 'BINARY_PAYLOAD' },
                { path: 'data:image/png;base64,EMBEDDED_PAYLOAD', alt: 'Inline', caption: 'Data image' }
            ]
        }, { isZimit: true });
        const result = await api.getArticle({ path: 'A/Article.html' });

        expect(result.ok).to.equal(true);
        expect(result.data.images).to.deep.equal([
            { path: 'I/image.jpg', alt: 'Cover', caption: 'An image', source: 'archive', isExternal: false, isEmbedded: false },
            { path: '', alt: 'Inline', caption: 'Data image', source: 'embedded', isExternal: false, isEmbedded: true }
        ]);
        expect(result.data.textExtractionMayBeImperfect).to.equal(true);
        expect(JSON.stringify(result)).to.not.contain('PAYLOAD');
    });

    it('paginates article text and reports total length and continuation', async function () {
        const api = createArticleApi({ text: 'abcdefghij' });
        const page = await api.getArticle({ path: 'A/Long.html', offset: 3, maxChars: 4 });

        expect(page.ok).to.equal(true);
        expect(page.data).to.include({
            text: 'defg', offset: 3, totalLength: 10, truncated: true, nextOffset: 7
        });
    });

    it('selects a section before paginating and returns only its images', async function () {
        const api = createArticleApi({
            text: 'whole article',
            sections: [
                { id: 'intro', title: 'Introduction', text: 'first section', images: [{ path: 'intro.jpg' }] },
                { id: 'details', title: 'Details', text: 'second section text', images: [{ path: 'detail.jpg' }] }
            ],
            images: [{ path: 'intro.jpg' }, { path: 'detail.jpg' }]
        });
        const result = await api.getArticle({ path: 'A/Article.html', section: 'details', maxChars: 6 });

        expect(result.ok).to.equal(true);
        expect(result.data).to.include({
            text: 'second', offset: 0, totalLength: 19,
            truncated: true, nextOffset: 6, section: 'details'
        });
        expect(result.data.images.map(function (image) { return image.path; })).to.deep.equal(['detail.jpg']);
    });

    it('rejects invalid article limits, offsets, and sections', async function () {
        const api = createArticleApi({ text: 'text', sections: [] });
        const invalidLimit = await api.getArticle({ path: 'A/Article.html', maxChars: 0 });
        const invalidOffset = await api.getArticle({ path: 'A/Article.html', offset: 5 });
        const missingSection = await api.getArticle({ path: 'A/Article.html', section: 'missing' });

        expect(invalidLimit.error.code).to.equal('INVALID_ARGUMENT');
        expect(invalidOffset.error.code).to.equal('INVALID_ARGUMENT');
        expect(missingSection.error.code).to.equal('NOT_FOUND');
    });

    it('returns NOT_FOUND when the worker reports a missing article', async function () {
        const api = createApi({
            callWorker: function () { return { content: new Uint8Array(), mimetype: 'unknown' }; }
        });
        const result = await api.getArticle({ path: 'A/Missing.html' });

        expect(result.ok).to.equal(false);
        expect(result.error.code).to.equal('NOT_FOUND');
    });

    it('preserves extraction errors for empty pages and meta-refresh redirects', async function () {
        const redirectApi = createArticleApi(null, {
            extractArticle: function () {
                const error = new Error('render required');
                error.code = 'CONTENT_REQUIRES_RENDERING';
                throw error;
            }
        });
        const emptyApi = createArticleApi(null, {
            extractArticle: function () {
                const error = new Error('no text');
                error.code = 'NO_EXTRACTABLE_TEXT';
                throw error;
            }
        });

        expect((await redirectApi.getArticle({ path: 'A/Redirect.html' })).error.code).to.equal('CONTENT_REQUIRES_RENDERING');
        expect((await emptyApi.getArticle({ path: 'A/Empty.html' })).error.code).to.equal('NO_EXTRACTABLE_TEXT');
    });

    it('follows redirects explicitly and returns the destination and original path', async function () {
        const calls = [];
        const api = createApi({
            callWorker: function (message) {
                calls.push(message);
                if (message.path === 'A/Old.html') return { isRedirect: true, redirectPath: 'A/New.html', content: new Uint8Array() };
                return { isRedirect: false, content: new Uint8Array([1]), mimetype: 'text/html' };
            },
            extractArticle: function (content, mimetype, path) {
                expect(path).to.equal('A/New.html');
                return 'Destination article';
            }
        });
        const result = await api.getArticle({ path: 'A/Old.html' });

        expect(calls).to.deep.equal([
            { action: 'getEntryByPath', path: 'A/Old.html', follow: false },
            { action: 'getEntryByPath', path: 'A/New.html', follow: false }
        ]);
        expect(result.ok).to.equal(true);
        expect(result.data.path).to.equal('A/New.html');
        expect(result.data.redirectedFrom).to.equal('A/Old.html');
        expect(result.data.text).to.equal('Destination article');
    });

    it('returns REDIRECT_LOOP for cyclic redirect paths', async function () {
        const api = createApi({
            callWorker: function (message) {
                return { isRedirect: true, redirectPath: message.path === 'A/First' ? 'A/Second' : 'A/First' };
            }
        });
        const result = await api.getArticle({ path: 'A/First' });

        expect(result.ok).to.equal(false);
        expect(result.error.code).to.equal('REDIRECT_LOOP');
    });

    it('maps manager archive-change and timeout errors to stable API codes', async function () {
        const archiveChangedApi = createApi({
            callWorker: function () { return Promise.reject(Object.assign(new Error('archive changed'), { code: 'ARCHIVE_CHANGED' })); }
        });
        const timeoutApi = createApi({
            callWorker: function () { return Promise.reject(Object.assign(new Error('timed out'), { code: 'WORKER_TIMEOUT' })); }
        });

        expect((await archiveChangedApi.suggest({ prefix: 'kiwix' })).error.code).to.equal('NO_ZIM_LOADED');
        expect((await timeoutApi.suggest({ prefix: 'kiwix' })).error.code).to.equal('WORKER_TIMEOUT');
    });

    it('returns a consistent error if the archive changes during a worker call', async function () {
        let current = true;
        const api = createApi({
            callWorker: function () {
                current = false;
                return { suggestions: [] };
            },
            isCurrent: function () { return current; }
        });
        const result = await api.suggest({ prefix: 'kiwix' });

        expect(result.ok).to.equal(false);
        expect(result.error.code).to.equal('NO_ZIM_LOADED');
    });

    it('returns archive metadata and libzim initialization state without a worker', async function () {
        const api = createApi({
            callWorker: undefined,
            hasFullText: false,
            getArchiveInfo: function () { return { title: 'Offline archive', language: 'eng' }; },
            getLibzimState: function () { return null; }
        });
        const result = await api.getInfo();

        expect(result).to.deep.equal({
            ok: true,
            data: {
                title: 'Offline archive',
                language: 'eng',
                hasFullText: false,
                libzim: { state: 'initializing' }
            }
        });
    });
});
