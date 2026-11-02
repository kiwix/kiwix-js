import { expect } from 'chai';
import { describe, it } from 'mocha';
import kiwixApiBrowser from '../../../www/js/lib/kiwixApiBrowser.js';

describe('kiwixApiBrowser', function () {
    function makeArchive (name, suggestions) {
        return {
            name: name,
            title: name,
            zimType: 'open',
            libzimReady: null,
            file: {
                name: name + '.zim',
                _files: [{ name: name + '.zim' }],
                fullTextIndex: null,
                entryCount: 4,
                articleCount: 3
            },
            suggestions: suggestions,
            isReady: function () { return true; }
        };
    }

    function makeAdapter (getArchive, manager, overrides) {
        const selectedArchive = getArchive();
        if (selectedArchive && manager.setArchive) manager.setArchive(selectedArchive);
        return kiwixApiBrowser.createKiwixApiBrowser(Object.assign({
            getSelectedArchive: getArchive,
            workerManager: manager,
            getWorkerUrl: function () { return 'libzim-test.js'; },
            extractArticle: function () { return 'text'; }
        }, overrides));
    }

    it('binds a fresh core to the currently selected archive per request', async function () {
        let selectedArchive = makeArchive('first', [{ path: 'A/First', title: 'First' }]);
        const initializedArchives = [];
        const states = new WeakMap();
        const manager = {
            activeArchive: null,
            setArchive: function (archive) { this.activeArchive = archive; },
            initialize: function (archive, files, url) {
                expect(files).to.equal(archive.file._files);
                expect(url).to.equal('libzim-test.js');
                this.activeArchive = archive;
                if (initializedArchives.indexOf(archive) === -1) initializedArchives.push(archive);
                states.set(archive, 'ready');
                return Promise.resolve();
            },
            isActive: function (archive) { return this.activeArchive === archive; },
            getState: function (archive) { return states.get(archive) || 'not-initialized'; },
            call: function (archive, message) {
                expect(this.activeArchive).to.equal(archive);
                if (message.action === 'suggest') return Promise.resolve({ suggestions: archive.suggestions });
                return Promise.resolve({ results: [] });
            }
        };
        const api = makeAdapter(function () { return selectedArchive; }, manager);
        const firstArchive = selectedArchive;

        expect(await api.call('suggest', { prefix: 'first' })).to.deep.equal({
            ok: true,
            data: [{ path: 'A/First', title: 'First' }]
        });
        selectedArchive = makeArchive('second', [{ path: 'A/Second', title: 'Second' }]);
        manager.setArchive(selectedArchive);
        expect(await api.suggest({ prefix: 'second' })).to.deep.equal({
            ok: true,
            data: [{ path: 'A/Second', title: 'Second' }]
        });
        expect(initializedArchives).to.have.length(2);
        expect(initializedArchives[0]).to.equal(firstArchive);
        expect(initializedArchives[1]).to.equal(selectedArchive);
    });

    it('returns NO_ZIM_LOADED without initializing a worker when no archive is selected', async function () {
        let initializeCalls = 0;
        const manager = {
            setArchive: function () {},
            initialize: function () { initializeCalls++; return Promise.resolve(); },
            isActive: function () { return false; },
            getState: function () { return 'inactive'; },
            call: function () { throw new Error('must not call worker'); }
        };
        const api = makeAdapter(function () { return null; }, manager);

        expect(await api.getInfo()).to.deep.equal({
            ok: false,
            error: { code: 'NO_ZIM_LOADED', message: 'No ZIM archive is currently loaded' }
        });
        expect(initializeCalls).to.equal(0);
    });

    it('reports manager readiness without initializing as part of getInfo', async function () {
        const archive = makeArchive('state', []);
        let initializeCalls = 0;
        const manager = {
            activeArchive: null,
            state: 'not-initialized',
            setArchive: function (active) { this.activeArchive = active; },
            initialize: function () { initializeCalls++; this.state = 'ready'; return Promise.resolve(); },
            isActive: function (active) { return this.activeArchive === active; },
            getState: function () { return this.state; },
            call: function () { return Promise.resolve({ suggestions: [] }); }
        };
        const api = makeAdapter(function () { return archive; }, manager);

        const beforeInit = await api.getInfo();
        expect(beforeInit.data.libzim.state).to.equal('not-initialized');
        expect(initializeCalls).to.equal(0);
        await api.suggest({ prefix: 'query' });
        expect(initializeCalls).to.equal(1);
        expect((await api.getInfo()).data.libzim.state).to.equal('ready');
    });

    it('rejects split archives before asking the manager to initialize', async function () {
        const archive = makeArchive('split', []);
        archive.file._files[0].name = 'split.zimaa';
        let initializeCalls = 0;
        const manager = {
            activeArchive: null,
            setArchive: function (active) { this.activeArchive = active; },
            initialize: function () { initializeCalls++; return Promise.resolve(); },
            isActive: function (active) { return this.activeArchive === active; },
            getState: function () { return 'not-initialized'; },
            call: function () { return Promise.resolve({ suggestions: [] }); }
        };
        const api = makeAdapter(function () { return archive; }, manager);
        const result = await api.suggest({ prefix: 'query' });

        expect(result.ok).to.equal(false);
        expect(result.error.code).to.equal('UNSUPPORTED_ARCHIVE');
        expect(initializeCalls).to.equal(0);
    });

    it('does not reactivate an archive for a queued request after selection changes', async function () {
        let selectedArchive = makeArchive('old', []);
        const initializedArchives = [];
        const manager = {
            activeArchive: null,
            setArchive: function (archive) { this.activeArchive = archive; },
            initialize: function (archive) { initializedArchives.push(archive); return Promise.resolve(); },
            isActive: function (archive) { return this.activeArchive === archive; },
            getState: function () { return 'not-initialized'; },
            call: function () { return Promise.resolve({ suggestions: [] }); }
        };
        const api = makeAdapter(function () { return selectedArchive; }, manager);
        const pending = api.suggest({ prefix: 'old' });

        selectedArchive = makeArchive('new', []);
        manager.setArchive(selectedArchive);
        const result = await pending;

        expect(result.ok).to.equal(false);
        expect(result.error.code).to.equal('NO_ZIM_LOADED');
        expect(manager.activeArchive).to.equal(selectedArchive);
        expect(initializedArchives).to.deep.equal([]);
    });

    it('extracts image captions by walking ancestors without Element.closest', async function () {
        const originalDOMParser = globalThis.DOMParser;
        const originalTextDecoder = globalThis.TextDecoder;
        const originalClosest = window.Element.prototype.closest;
        globalThis.DOMParser = window.DOMParser;
        delete window.Element.prototype.closest;
        const archive = makeArchive('article', []);
        const manager = {
            activeArchive: null,
            setArchive: function (active) { this.activeArchive = active; },
            initialize: function () { return Promise.resolve(); },
            isActive: function (active) { return this.activeArchive === active; },
            getState: function () { return 'ready'; },
            call: function () {
                return Promise.resolve({ content: new TextEncoder().encode('<figure><img src="cover.jpg" alt="Cover"><figcaption>Caption text</figcaption></figure>'), mimetype: 'text/html' });
            }
        };
        try {
            const api = makeAdapter(function () { return archive; }, manager, { extractArticle: undefined });
            const result = await api.getArticle({ path: 'A/Article.html' });
            expect(result.data.images).to.deep.equal([{ path: 'A/cover.jpg', alt: 'Cover', caption: 'Caption text', source: 'archive', isExternal: false, isEmbedded: false }]);
        } finally {
            globalThis.DOMParser = originalDOMParser;
            globalThis.TextDecoder = originalTextDecoder;
            if (originalClosest) window.Element.prototype.closest = originalClosest;
        }
    });
});