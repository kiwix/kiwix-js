import { expect } from 'chai';
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

    it('chooses a sensible article container and removes executable or non-content nodes', function () {
        const html = '<body><nav>Navigation noise</nav><div id="content"><article><p>Keep this.</p><script>drop()</script><style>.x{}</style><noscript>fallback</noscript><iframe>frame</iframe><table><tr><td>Keep table</td></tr></table></article></div></body>';
        const extracted = articleText.extractHtmlArticle(html);

        expect(extracted.text).to.contain('Keep this.');
        expect(extracted.text).to.contain('Keep table');
        expect(extracted.text).to.not.contain('Navigation noise');
        expect(extracted.text).to.not.match(/drop\(\)|fallback|frame|\.x\{\}/);
    });

    it('builds ordered heading sections with existing and generated unique ids', function () {
        const html = '<article><p>Lead.</p><h2 id="history">History</h2><p>First part.</p><h3>Early years</h3><p>Details.</p><h2 id="history">History</h2><p>Second part.</p></article>';
        const extracted = articleText.extractHtmlArticle(html);

        expect(extracted.sections).to.deep.equal([
            { id: 'history', title: 'History', level: 2, text: 'History\nFirst part.\nEarly years\nDetails.' },
            { id: 'section-early-years', title: 'Early years', level: 3, text: 'Early years\nDetails.' },
            { id: 'history-2', title: 'History', level: 2, text: 'History\nSecond part.' }
        ]);
    });

    it('does not let an early generated section id shadow a later authored id', function () {
        const extracted = articleText.extractHtmlArticle('<article><h2>History</h2><p>First.</p><h2 id="section-history">History</h2><p>Second.</p></article>');

        expect(extracted.sections.map(function (section) { return section.id; }))
            .to.deep.equal(['section-history-2', 'section-history']);
    });

    it('collects archive, external, and embedded image metadata', function () {
        const html = '<article><figure><img src="I/local.jpg" alt="Local"><figcaption>Local caption</figcaption></figure>' +
            '<img src="https://images.example/external.png" alt="Remote"><img src="data:image/png;base64,AA==" alt="Inline"></article>';
        const extracted = articleText.extractHtmlArticle(html);

        expect(extracted.images).to.deep.equal([
            { path: 'I/local.jpg', alt: 'Local', caption: 'Local caption', source: 'archive', isExternal: false, isEmbedded: false },
            { path: 'https://images.example/external.png', alt: 'Remote', caption: '', source: 'external', isExternal: true, isEmbedded: false },
            { path: '', alt: 'Inline', caption: '', source: 'embedded', isExternal: false, isEmbedded: true }
        ]);
    });

    it('resolves relative image references against the resolved article path and omits embedded payloads', function () {
        const html = '<article><img src="../I/local.jpg"><img src="data:image/png;base64,SECRET"></article>';
        const extracted = articleText.extractHtmlArticle(html, 'A/redirected/final.html');

        expect(extracted.images).to.deep.equal([
            { path: 'A/I/local.jpg', alt: '', caption: '', source: 'archive', isExternal: false, isEmbedded: false },
            { path: '', alt: '', caption: '', source: 'embedded', isExternal: false, isEmbedded: true }
        ]);
        expect(JSON.stringify(extracted)).to.not.contain('SECRET');
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