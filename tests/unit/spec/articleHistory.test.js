/* eslint-disable no-undef */
/**
 * Checks the list of recently visited articles kept by articleHistory.js [kiwix-js #1368]
 */

import { assert } from 'chai';
import articleHistory from '../../../www/js/lib/articleHistory.js';

describe('Article history', function () {
    const storedKey = 'kiwixjs-articleHistory';
    const savedParams = {};
    let savedLocalStorage;

    before(function () {
        ['storeType', 'keyPrefix', 'recordArticleHistory'].forEach(key => { savedParams[key] = params[key]; });
        // NodeJS has no localStorage, so we give the module a simple one
        savedLocalStorage = globalThis.localStorage;
        const store = new Map();
        globalThis.localStorage = {
            getItem: key => store.has(key) ? store.get(key) : null,
            setItem: (key, value) => store.set(key, String(value)),
            removeItem: key => store.delete(key)
        };
    });

    after(function () {
        Object.assign(params, savedParams);
        globalThis.localStorage = savedLocalStorage;
    });

    beforeEach(function () {
        params.storeType = 'local_storage';
        params.keyPrefix = 'kiwixjs-';
        params.recordArticleHistory = true;
        localStorage.removeItem(storedKey);
        articleHistory.setArchive('ray_charles.zim');
    });

    it('records nothing when history is turned off', function () {
        params.recordArticleHistory = false;
        articleHistory.record('A/Ray_Charles', 'Ray Charles');
        assert.lengthOf(articleHistory.getEntries(), 0);
        assert.isNull(localStorage.getItem(storedKey));
    });

    it('lists the newest article first and moves a revisited article to the top', function () {
        articleHistory.record('A/Ray_Charles', 'Ray Charles');
        articleHistory.record('A/Blues', 'Blues');
        articleHistory.record('A/Ray_Charles', 'Ray Charles');
        assert.deepEqual(articleHistory.getEntries().map(e => e.path), ['A/Ray_Charles', 'A/Blues']);
        assert.isNumber(articleHistory.getEntries()[0].time);
    });

    it('uses the last part of the path when there is no title', function () {
        articleHistory.record('A/Folder/Some_Article', '');
        assert.equal(articleHistory.getEntries()[0].title, 'Some_Article');
    });

    it('keeps at most ' + articleHistory.maxEntries + ' articles', function () {
        for (let i = 0; i < articleHistory.maxEntries + 5; i++) {
            articleHistory.record('A/Article_' + i, 'Article ' + i);
        }
        const entries = articleHistory.getEntries();
        assert.lengthOf(entries, articleHistory.maxEntries);
        assert.equal(entries[0].path, 'A/Article_' + (articleHistory.maxEntries + 4));
    });

    it('keeps the list when the same archive is reopened', function () {
        articleHistory.record('A/Ray_Charles', 'Ray Charles');
        articleHistory.setArchive('ray_charles.zim');
        assert.deepEqual(articleHistory.getEntries().map(e => e.path), ['A/Ray_Charles']);
    });

    it('keeps a separate list for each archive and shows only the list of the loaded archive', function () {
        articleHistory.record('A/Ray_Charles', 'Ray Charles');
        articleHistory.setArchive('gutenberg_ro.zim');
        assert.lengthOf(articleHistory.getEntries(), 0);
        articleHistory.record('A/Carte', 'Carte');
        assert.deepEqual(articleHistory.getEntries().map(e => e.path), ['A/Carte']);
        articleHistory.setArchive('ray_charles.zim');
        assert.deepEqual(articleHistory.getEntries().map(e => e.path), ['A/Ray_Charles']);
    });

    it('keeps the lists of at most ' + articleHistory.maxArchives + ' archives, dropping the least recently used', function () {
        const realNow = Date.now;
        let now = 1000;
        Date.now = () => now++;
        try {
            for (let i = 0; i < articleHistory.maxArchives; i++) {
                articleHistory.setArchive('archive_' + i + '.zim');
                articleHistory.record('A/Article', 'Article');
            }
            // Use the oldest list again, so that archive_1 becomes the least recently used
            articleHistory.setArchive('archive_0.zim');
            articleHistory.record('A/Another', 'Another');
            articleHistory.setArchive('newest.zim');
            articleHistory.record('A/Article', 'Article');
            articleHistory.setArchive('archive_1.zim');
            assert.lengthOf(articleHistory.getEntries(), 0);
            articleHistory.setArchive('archive_0.zim');
            assert.lengthOf(articleHistory.getEntries(), 2);
            articleHistory.setArchive('newest.zim');
            assert.lengthOf(articleHistory.getEntries(), 1);
            assert.equal(Object.keys(JSON.parse(localStorage.getItem(storedKey)).archives).length, articleHistory.maxArchives);
        } finally {
            Date.now = realNow;
        }
    });

    it('deletes the lists of all archives from storage when cleared', function () {
        articleHistory.record('A/Ray_Charles', 'Ray Charles');
        articleHistory.setArchive('gutenberg_ro.zim');
        articleHistory.record('A/Carte', 'Carte');
        assert.isNotNull(localStorage.getItem(storedKey));
        articleHistory.clear();
        assert.lengthOf(articleHistory.getEntries(), 0);
        assert.isNull(localStorage.getItem(storedKey));
        articleHistory.setArchive('ray_charles.zim');
        assert.lengthOf(articleHistory.getEntries(), 0);
    });

    it('keeps the list only in memory when localStorage is not in use', function () {
        params.storeType = 'cookie';
        articleHistory.record('A/Ray_Charles', 'Ray Charles');
        assert.lengthOf(articleHistory.getEntries(), 1);
        assert.isNull(localStorage.getItem(storedKey));
    });
});
