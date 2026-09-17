/* eslint-disable no-undef */
/**
 * Tests for DirEntry.prototype.toStringId / DirEntry.fromStringId in www/js/lib/zimDirEntry.js
 *
 * toStringId() joins several DirEntry fields with "|" so the id can be stored as a single HTML
 * attribute (see app.js buildArticleListElement, which wraps the result in encodeURIComponent()
 * before writing it to the DOM, and findDirEntryFromDirEntryIdAndLaunchArticleRead, which reverses
 * that with decodeURIComponent() before calling fromStringId()). Because that outer
 * encodeURIComponent()/decodeURIComponent() pair also encodes/decodes any literal "|" inside the id,
 * it does not stop a "|" that occurs inside url or title from being mistaken for the field
 * separator once fromStringId() splits on "|" again.
 *
 * "|" in titles is common in real archives, e.g. inline LaTeX using "|" for absolute value
 * (Stack Exchange sites such as hsm.stackexchange.com) or "<Page title> | <Site name>" titles
 * produced by Zimit (e.g. tonedear.com — the same "Contact | Ear Training" title below can also
 * be found in our own tests/zims/tonedear test archive). The url is unaffected because it is
 * serialized before title, so navigation still works; the visible symptom is a title truncated
 * at the first "|". Confirmed against real directory entries extracted from those two archives.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import zimDirEntry from '../../../www/js/lib/zimDirEntry.js';

const DirEntry = zimDirEntry.DirEntry;

const fakeZimFile = {
    mimeTypes: new Map([[0, 'text/html'], [1, 'text/plain']])
};

// Simulates the app.js round trip: toStringId() -> encodeURIComponent() (stored in the DOM) ->
// decodeURIComponent() -> fromStringId().
function roundTripViaAppJsPipeline (entryData) {
    const original = new DirEntry(fakeZimFile, entryData);
    const storedInDom = encodeURIComponent(original.toStringId());
    const afterDomRoundTrip = decodeURIComponent(storedInDom);
    return DirEntry.fromStringId(fakeZimFile, afterDomRoundTrip);
}

describe('DirEntry stringId round trip (real-world "|" titles)', function () {
    it('preserves a title with LaTeX absolute-value bars (hsm.stackexchange.com)', function () {
        const reconstructed = roundTripViaAppJsPipeline({
            offset: 12345,
            mimetypeInteger: 0,
            namespace: 'C',
            cluster: 10,
            blob: 2,
            url: 'questions/4956/did-bolzano-conclude-that-mathbb-r-ne-mathbb-n',
            title: 'Did Bolzano conclude that $| \\mathbb R | \\ne | \\mathbb N|$?',
            redirect: false,
            redirectTarget: undefined
        });

        expect(reconstructed.url).to.equal('questions/4956/did-bolzano-conclude-that-mathbb-r-ne-mathbb-n');
        expect(reconstructed.title).to.equal('Did Bolzano conclude that $| \\mathbb R | \\ne | \\mathbb N|$?');
    });

    it('preserves a "Page | Site" title produced by Zimit (tonedear.com)', function () {
        const reconstructed = roundTripViaAppJsPipeline({
            offset: 999,
            mimetypeInteger: 0,
            namespace: 'C',
            cluster: 1,
            blob: 0,
            url: 'tonedear.com/contact',
            title: 'Contact | Ear Training',
            redirect: false,
            redirectTarget: undefined
        });

        expect(reconstructed.url).to.equal('tonedear.com/contact');
        expect(reconstructed.title).to.equal('Contact | Ear Training');
    });

    it('preserves multiple pipes in both url and title, and a redirect target', function () {
        const reconstructed = roundTripViaAppJsPipeline({
            offset: 5678,
            mimetypeInteger: 1,
            namespace: 'A',
            cluster: 100,
            blob: 3,
            url: 'regex|pattern|match',
            title: 'Title | with | multiple | pipes',
            redirect: true,
            redirectTarget: 42
        });

        expect(reconstructed.url).to.equal('regex|pattern|match');
        expect(reconstructed.title).to.equal('Title | with | multiple | pipes');
        expect(reconstructed.redirect).to.equal(true);
        expect(reconstructed.isRedirect()).to.equal(true);
    });

    it('falls back to the url via getTitleOrUrl() when title is empty', function () {
        const reconstructed = roundTripViaAppJsPipeline({
            offset: 1,
            mimetypeInteger: 0,
            namespace: 'C',
            cluster: 0,
            blob: 0,
            url: 'Main_Page',
            title: '',
            redirect: false,
            redirectTarget: undefined
        });

        expect(reconstructed.getTitleOrUrl()).to.equal('Main_Page');
    });

    it('does not throw on a malformed percent-encoded sequence and falls back to the raw text', function () {
        const warnStub = sinon.stub(console, 'warn');
        const malformedStringId = '100|0|C|10|1|%ZZmalformed|plain title|false|undefined';
        let parsed;
        expect(function () { parsed = DirEntry.fromStringId(fakeZimFile, malformedStringId); }).to.not.throw();
        expect(parsed.url).to.equal('%ZZmalformed');
        expect(warnStub.called).to.equal(true);
        warnStub.restore();
    });
});
