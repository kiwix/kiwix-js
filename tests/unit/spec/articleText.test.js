import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import articleText from '../../../www/js/lib/articleText.js';

describe('articleText', function () {
    let originalDOMParser;

    beforeEach(function () {
        originalDOMParser = globalThis.DOMParser;
        globalThis.DOMParser = window.DOMParser;
    });

    afterEach(function () {
        globalThis.DOMParser = originalDOMParser;
    });

    it('decodes bytes separately and extracts paragraph and table structure in document order', function () {
        const html = '<main><p>First paragraph.</p><table><tr><th>Name</th><th>Value</th></tr><tr><td>Speed</td><td>Fast</td></tr></table><p>Last paragraph.</p></main>';
        const bytes = new TextEncoder().encode(html);
        const decoded = articleText.decodeArticleContent(bytes);
        const extracted = articleText.extractHtmlArticle(decoded);

        expect(decoded).to.equal(html);
        expect(extracted.text).to.equal('First paragraph.\nName | Value\nSpeed | Fast\nLast paragraph.');
    });

    it('does not insert spaces between inline text nodes or reformat literal pipes', function () {
        const extracted = articleText.extractHtmlArticle('<article><p>inter<strong>rup</strong>t<span>ed</span>a|b</p></article>');

        expect(extracted.text).to.equal('interrupteda|b');
    });

    it('preserves multiline preformatted text and literal pipe characters', function () {
        const preformatted = '  first | value\n    indented line\nlast';
        const extracted = articleText.extractHtmlArticle('<article><pre>' + preformatted + '</pre><p>After</p></article>');

        expect(extracted.text).to.equal(preformatted + '\nAfter');
    });

    it('selects article content and removes scripts and navigation while preserving data tables', function () {
        const html = '<body><nav>Outside navigation</nav><article>' +
            '<div class="navbox"><table><tr><td>Inside navigation</td></tr></table></div>' +
            '<p>Keep this.</p><script>drop()</script><style>.x{}</style><noscript>fallback</noscript><iframe>frame</iframe>' +
            '<table class="infobox"><tr><th>Population</th><td>100</td></tr></table></article></body>';
        const extracted = articleText.extractHtmlArticle(html);

        expect(extracted.text).to.contain('Keep this.');
        expect(extracted.text).to.contain('Population | 100');
        expect(extracted.text).to.not.match(/navigation|drop\(\)|fallback|frame|\.x\{\}/);
    });

    it('builds ordered heading sections with existing and generated unique ids', function () {
        const html = '<article><p>Lead.</p><h2 id="history">History</h2><p>First part.</p><h3>Early years</h3><p>Details.</p><h2 id="history">History</h2><p>Second part.</p></article>';
        const extracted = articleText.extractHtmlArticle(html);

        expect(extracted.sections).to.deep.equal([
            { id: 'history', title: 'History', level: 2, text: 'History\nFirst part.\nEarly years\nDetails.', images: [] },
            { id: 'section-early-years', title: 'Early years', level: 3, text: 'Early years\nDetails.', images: [] },
            { id: 'history-2', title: 'History', level: 2, text: 'History\nSecond part.', images: [] }
        ]);
    });

    it('does not let an early generated section id shadow a later authored id', function () {
        const extracted = articleText.extractHtmlArticle('<article><h2>History</h2><p>First.</p><h2 id="section-history">History</h2><p>Second.</p></article>');

        expect(extracted.sections.map(function (section) { return section.id; }))
            .to.deep.equal(['section-history-2', 'section-history']);
    });

    it('resolves article images and returns external and embedded metadata without payloads', function () {
        const html = '<article><figure><img src="../I/local.jpg" alt="Local"><figcaption>Local caption</figcaption></figure>' +
            '<img src="https://images.example/external.png" alt="Remote"><img src="data:image/png;base64,SECRET" alt="Inline"></article>';
        const extracted = articleText.extractHtmlArticle(html, 'A/redirected/final.html');

        expect(extracted.images).to.deep.equal([
            { path: 'A/I/local.jpg', alt: 'Local', caption: 'Local caption', source: 'archive', isExternal: false, isEmbedded: false },
            { path: 'https://images.example/external.png', alt: 'Remote', caption: '', source: 'external', isExternal: true, isEmbedded: false },
            { path: '', alt: 'Inline', caption: '', source: 'embedded', isExternal: false, isEmbedded: true }
        ]);
        expect(JSON.stringify(extracted)).to.not.contain('SECRET');
    });

    it('deduplicates identical images while retaining section-specific descriptions', function () {
        const html = '<article><h2>One</h2><img src="same.jpg"><img src="same.jpg">' +
            '<h2>Two</h2><figure><img src="same.jpg" alt="Described"><figcaption>Second caption</figcaption></figure>' +
            '<figure><img src="same.jpg" alt="Described"><figcaption>Second caption</figcaption></figure><img src="two.jpg"></article>';
        const extracted = articleText.extractHtmlArticle(html, 'A/page.html');

        expect(extracted.images).to.have.length(3);
        expect(extracted.sections[0].images).to.deep.equal([
            { path: 'A/same.jpg', alt: '', caption: '', source: 'archive', isExternal: false, isEmbedded: false }
        ]);
        expect(extracted.sections[1].images.map(function (image) {
            return { path: image.path, alt: image.alt, caption: image.caption };
        })).to.deep.equal([
            { path: 'A/same.jpg', alt: 'Described', caption: 'Second caption' },
            { path: 'A/two.jpg', alt: '', caption: '' }
        ]);
    });

    it('handles content types explicitly and keeps plain text out of the HTML parser', function () {
        const plain = articleText.extractArticleContent(new TextEncoder().encode('Plain\ntext'), 'text/plain; charset=utf-8');

        expect(plain).to.deep.equal({ text: 'Plain\ntext', sections: [], images: [] });
        expect(articleText.getArticleContentType('application/xhtml+xml')).to.equal('html');
        expect(articleText.getArticleContentType('application/pdf')).to.equal(null);
        expect(function () { articleText.extractArticleContent(new Uint8Array([0]), 'application/pdf'); })
            .to.throw('Unsupported article content type');
    });
});
