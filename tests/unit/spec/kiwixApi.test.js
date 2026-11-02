import { expect } from 'chai';
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

    it('validates method arguments without calling the worker', async function () {
        let called = false;
        const api = createApi({ callWorker: function () { called = true; } });

        const result = await api.search({ query: '   ', limit: 101 });
        expect(result.ok).to.equal(false);
        expect(result.error.code).to.equal('INVALID_ARGUMENT');
        expect(called).to.equal(false);
    });

    it('rejects unknown parameters for each method', async function () {
        let workerCalls = 0;
        let infoCalls = 0;
        const api = createApi({
            callWorker: function () { workerCalls++; return {}; },
            getArchiveInfo: function () { infoCalls++; return {}; }
        });
        const results = await Promise.all([
            api.search({ query: 'term', unexpected: true }),
            api.suggest({ prefix: 'term', unexpected: true }),
            api.getArticle({ path: 'A/Article', unexpected: true }),
            api.getInfo({ unexpected: true })
        ]);

        expect(results.every(function (result) { return result.error.code === 'INVALID_ARGUMENT'; })).to.equal(true);
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

    it('passes article bytes through the injected extractor', async function () {
        const api = createApi({
            callWorker: function (message) {
                expect(message).to.deep.equal({ action: 'getEntryByPath', path: ' A/Kiwix.html ', follow: false });
                return { content: new Uint8Array([75, 74]), mimetype: 'text/html' };
            },
            extractArticle: function (content, mimetype) {
                expect(mimetype).to.equal('text/html');
                return 'Kiwix article';
            }
        });

        expect(await api.getArticle({ path: ' A/Kiwix.html ' })).to.deep.equal({
            ok: true,
            data: {
                path: ' A/Kiwix.html ',
                text: 'Kiwix article',
                offset: 0,
                totalLength: 13,
                truncated: false,
                nextOffset: null,
                sections: [],
                images: [],
                textExtractionMayBeImperfect: false
            }
        });
    });

    it('returns image metadata and flags potentially imperfect Zimit text extraction', async function () {
        const api = createApi({
            isZimit: true,
            callWorker: function () { return { content: new Uint8Array([1]), mimetype: 'text/html' }; },
            extractArticle: function () {
                return {
                    text: 'Article text',
                    images: [{ path: 'I/image.jpg', alt: 'Cover', caption: 'An image', data: 'not exposed' }]
                };
            }
        });
        const result = await api.getArticle({ path: 'A/Article.html' });

        expect(result.data.images).to.deep.equal([{ path: 'I/image.jpg', alt: 'Cover', caption: 'An image', source: 'archive', isExternal: false, isEmbedded: false }]);
        expect(result.data.textExtractionMayBeImperfect).to.equal(true);
    });

    it('never includes embedded image data payloads in the API response', async function () {
        const api = createApi({
            callWorker: function () { return { content: new Uint8Array([1]), mimetype: 'text/html' }; },
            extractArticle: function () {
                return {
                    text: 'Article',
                    images: [{ path: 'data:image/png;base64,SECRET', alt: 'Inline', caption: 'Data image' }]
                };
            }
        });
        const result = await api.getArticle({ path: 'A/Article.html' });

        expect(result.data.images).to.deep.equal([{
            path: '', alt: 'Inline', caption: 'Data image', source: 'embedded', isExternal: false, isEmbedded: true
        }]);
        expect(JSON.stringify(result)).to.not.contain('SECRET');
    });

    it('paginates article text and reports total length and continuation', async function () {
        const api = createApi({
            callWorker: function () { return { content: new Uint8Array([1]), mimetype: 'text/html' }; },
            extractArticle: function () { return { text: 'abcdefghij', sections: [{ id: 'intro', title: 'Intro', text: 'abc' }] }; }
        });
        const result = await api.getArticle({ path: 'A/Long.html', offset: 3, maxChars: 4 });

        expect(result).to.deep.equal({
            ok: true,
            data: {
                path: 'A/Long.html',
                text: 'defg',
                offset: 3,
                totalLength: 10,
                truncated: true,
                nextOffset: 7,
                sections: [{ id: 'intro', title: 'Intro' }],
                images: [],
                textExtractionMayBeImperfect: false
            }
        });
    });

    it('selects a section by exact id or heading title before paginating', async function () {
        const api = createApi({
            callWorker: function () { return { content: new Uint8Array([1]), mimetype: 'text/html' }; },
            extractArticle: function () {
                return {
                    text: 'whole article',
                    sections: [
                        { id: 'intro', title: 'Introduction', text: 'first section' },
                        { id: 'details', title: 'Details', text: 'second section text' }
                    ]
                };
            }
        });
        const result = await api.getArticle({ path: 'A/Article.html', section: 'details', maxChars: 6 });

        expect(result).to.deep.equal({
            ok: true,
            data: {
                path: 'A/Article.html',
                text: 'second',
                offset: 0,
                totalLength: 19,
                truncated: true,
                nextOffset: 6,
                sections: [{ id: 'intro', title: 'Introduction' }, { id: 'details', title: 'Details' }],
                images: [],
                textExtractionMayBeImperfect: false,
                section: 'details'
            }
        });
    });

    it('rejects invalid article limits, offsets, and sections', async function () {
        const api = createApi({
            callWorker: function () { return { content: new Uint8Array([1]), mimetype: 'text/html' }; },
            extractArticle: function () { return { text: 'text', sections: [] }; }
        });
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

    it('follows redirects explicitly and returns the destination and original path', async function () {
        const calls = [];
        const api = createApi({
            callWorker: function (message) {
                calls.push(message);
                if (message.path === 'A/Old.html') return { isRedirect: true, redirectPath: 'A/New.html', content: new Uint8Array() };
                return { isRedirect: false, content: new Uint8Array([1]), mimetype: 'text/html' };
            },
            extractArticle: function () { return 'Destination article'; }
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

    it('passes the resolved article path to the extractor after redirects', async function () {
        let extractedPath;
        const api = createApi({
            callWorker: function (message) {
                if (message.path === 'A/Old.html') return { isRedirect: true, redirectPath: 'A/Folder/New.html' };
                return { isRedirect: false, content: new Uint8Array([1]), mimetype: 'text/html' };
            },
            extractArticle: function (content, mimetype, articlePath) {
                extractedPath = articlePath;
                return {
                    text: 'Article',
                    images: [{ path: '../I/photo.jpg', alt: 'Photo', source: 'archive' }]
                };
            }
        });
        const result = await api.getArticle({ path: 'A/Old.html' });

        expect(extractedPath).to.equal('A/Folder/New.html');
        expect(result.data.path).to.equal('A/Folder/New.html');
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

    it('normalizes synchronous current-archive callback errors', async function () {
        const api = createApi({ isCurrent: function () { throw new Error('archive check failed'); } });
        const result = await api.suggest({ prefix: 'offline' });

        expect(result.ok).to.equal(false);
        expect(result.error).to.deep.equal({ code: 'INTERNAL_ERROR', message: 'archive check failed' });
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

    it('returns the dispatch schema as valid JSON Schema structure', function () {
        const schema = createApi().describe();

        expect(schema.$schema).to.equal('https://json-schema.org/draft/2020-12/schema');
        expect(schema.type).to.equal('object');
        expect(schema.oneOf).to.have.length(4);
        expect(schema.oneOf.map(function (method) { return method.properties.method.const; }))
            .to.deep.equal(['search', 'suggest', 'getArticle', 'getInfo']);
        expect(schema.oneOf[2].properties.params.properties.maxChars.maximum).to.equal(100000);
    });

    it('returns a fresh copy of the JSON Schema on each describe call', function () {
        const api = createApi();
        const description = api.describe();
        description.oneOf[0].properties.params.properties.query.minLength = 0;

        expect(api.describe().oneOf[0].properties.params.properties.query.minLength).to.equal(1);
    });
});