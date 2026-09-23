/* eslint-disable no-undef */
/**
 * Tests for abstractFilesystemAccess.isMatchingZimPart and file selection matching
 */

import { expect } from 'chai';
import '../js/init.js';
import abstractFilesystemAccess from '../../../www/js/lib/abstractFilesystemAccess.js';

describe('abstractFilesystemAccess archive matching (isMatchingZimPart)', function () {
    const isMatchingZimPart = abstractFilesystemAccess.isMatchingZimPart;

    it('matches standalone .zim archives', function () {
        expect(isMatchingZimPart('wiki.zim', 'wiki')).to.be.true;
        expect(isMatchingZimPart('wikipedia_en_all_maxi.zim', 'wikipedia_en_all_maxi')).to.be.true;
    });

    it('matches split .zim archives with two-letter chunk suffixes', function () {
        expect(isMatchingZimPart('wiki.zimaa', 'wiki')).to.be.true;
        expect(isMatchingZimPart('wiki.zimab', 'wiki')).to.be.true;
        expect(isMatchingZimPart('wiki.zimba', 'wiki')).to.be.true;
        expect(isMatchingZimPart('wiki.zimzz', 'wiki')).to.be.true;
    });

    it('handles case-insensitivity for both base name and candidate filename', function () {
        expect(isMatchingZimPart('WIKI.ZIM', 'wiki')).to.be.true;
        expect(isMatchingZimPart('wiki.ZIMAA', 'WIKI')).to.be.true;
        expect(isMatchingZimPart('Wikipedia_En.ZimAb', 'wikipedia_en')).to.be.true;
    });

    it('does not match unrelated archives that share a name prefix', function () {
        expect(isMatchingZimPart('wikipedia.zim', 'wiki')).to.be.false;
        expect(isMatchingZimPart('wikivoyage.zim', 'wiki')).to.be.false;
        expect(isMatchingZimPart('wiktionary.zimaa', 'wiki')).to.be.false;
        expect(isMatchingZimPart('wiki_en_all.zim', 'wiki')).to.be.false;
        expect(isMatchingZimPart('mathematics.zim', 'math')).to.be.false;
    });

    it('does not match filenames with invalid split suffixes or extensions', function () {
        expect(isMatchingZimPart('wiki.zim.bak', 'wiki')).to.be.false;
        expect(isMatchingZimPart('wiki.zima', 'wiki')).to.be.false;
        expect(isMatchingZimPart('wiki.zimaaa', 'wiki')).to.be.false;
        expect(isMatchingZimPart('wiki.zim12', 'wiki')).to.be.false;
        expect(isMatchingZimPart('wiki.zim_part1', 'wiki')).to.be.false;
    });

    it('returns false for empty, null, or undefined inputs', function () {
        expect(isMatchingZimPart('', 'wiki')).to.be.false;
        expect(isMatchingZimPart('wiki.zim', '')).to.be.false;
        expect(isMatchingZimPart('', '')).to.be.false;
        expect(isMatchingZimPart(null, 'wiki')).to.be.false;
        expect(isMatchingZimPart('wiki.zim', null)).to.be.false;
        expect(isMatchingZimPart(undefined, undefined)).to.be.false;
    });

    it('getSelectedZimFromWebkitList only extracts parts belonging to the selected archive', function () {
        const mockFiles = [
            { name: 'wiki.zim' },
            { name: 'wikipedia.zim' },
            { name: 'wikipedia.zimaa' },
            { name: 'wikivoyage.zim' },
            { name: 'other.zim' }
        ];

        const wikiMatches = abstractFilesystemAccess.getSelectedZimFromWebkitList(mockFiles, 'wiki.zim');
        expect(wikiMatches.map(f => f.name)).to.deep.equal(['wiki.zim']);

        const wikipediaMatches = abstractFilesystemAccess.getSelectedZimFromWebkitList(mockFiles, 'wikipedia.zim');
        expect(wikipediaMatches.map(f => f.name)).to.deep.equal(['wikipedia.zim', 'wikipedia.zimaa']);

        const emptyMatches = abstractFilesystemAccess.getSelectedZimFromWebkitList(mockFiles, '');
        expect(emptyMatches).to.deep.equal([]);
    });
});
