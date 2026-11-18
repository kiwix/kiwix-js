/* eslint-disable no-undef */
// Converted Test from test.js file
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import '../js/init.js';
import zimArchive from '../../../www/js/lib/zimArchive.js';
import zimDirEntry from '../../../www/js/lib/zimDirEntry.js';
import util from '../../../www/js/lib/util.js';
import uiUtil from '../../../www/js/lib/uiUtil.js';
import utf8 from '../../../www/js/lib/utf8.js';

let localZimArchive;

/**
 * Read a file and return it as a Blob
 *
 * @param {String} filePath Path to the file
 * @param {String} name Name to give to the Blob instance
 * @returns {Promise<Blob>} A Promise for the Blob
 */
async function readFileAsBlob (filePath, name) {
    try {
        const buffer = await fs.readFile(filePath);
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        blob.name = name;
        return blob;
    } catch (error) {
        console.error('Error reading file:', filePath, error);
        throw error;
    }
}

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test files before running tests
let zimArchiveFiles = [];
before(async function () {
    const testFolder = join(__dirname, '../../../tests/zims/legacy-ray-charles');
    const splitBlobs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o'].map(function (c) {
        const filename = 'wikipedia_en_ray_charles_2015-06.zima' + c;
        return readFileAsBlob(join(testFolder, filename), filename);
    });

    zimArchiveFiles = await Promise.all(splitBlobs);
    return new Promise((resolve) => {
        localZimArchive = new zimArchive.ZIMArchive(zimArchiveFiles, null, function () {
            resolve();
        });
    });
});

describe('Environment', function () {
    it('Configure Mocha Test', function () {
        expect('test').to.equal('test');
    });

    it('Load archive files', function () {
        expect(zimArchiveFiles && zimArchiveFiles[0] && zimArchiveFiles[0].size > 0).to.be.true;
    });
});

describe('Utils', function () {
    it('Correctly read an IEEE_754 float from 4 bytes', function () {
        const byteArray = new Uint8Array([194, 237, 64, 0]);
        const float = util.readFloatFrom4Bytes(byteArray, 0);
        expect(float).to.equal(-118.625);
    });

    it('Handle upper/lower case variation', function () {
        const testCases = [
            { input: 'téléphone', expected: 'Téléphone', description: 'The first letter should be uppercase' },
            { input: 'Paris', expected: 'paris', description: 'The first letter should be lowercase' },
            { input: 'le Couvre-chef Est sur le porte-manteaux', expected: 'Le Couvre-Chef Est Sur Le Porte-Manteaux', description: 'The first letter of every word should be uppercase' },
            { input: 'épée', expected: 'Épée', description: 'The first letter should be uppercase (with accent)' },
            { input: '$￥€"«xριστός» †¡Ἀνέστη!"', expected: '$￥€"«Xριστός» †¡ἀνέστη!"', description: 'First non-punctuation/non-currency Unicode letter should be uppercase, second (with breath mark) lowercase' },
            { input: 'Καλά Νερά Μαγνησία žižek', expected: 'ΚΑΛΆ ΝΕΡΆ ΜΑΓΝΗΣΊΑ ŽIŽEK', options: 'full', description: 'All Unicode letters should be uppercase' }
        ];

        testCases.forEach(({ input, expected, options, description }) => {
            const results = options
                ? util.allCaseFirstLetters(input, options)
                : util.allCaseFirstLetters(input);

            expect(results, description).to.be.an('array');
            expect(results.some(result => result === expected), description).to.be.true;
        });
    });

    it('Remove parameters from URLs', function () {
        const baseUrl = "A/Che cosa e l'amore?.html";
        const testUrls = [
            "A/Che%20cosa%20e%20l'amore%3F.html?param1=toto&param2=titi",
            "A/Che%20cosa%20e%20l'amore%3F.html?param1=toto&param2=titi#anchor",
            "A/Che%20cosa%20e%20l'amore%3F.html#anchor"
        ];

        testUrls.forEach(testUrl => {
            const result = uiUtil.removeUrlParameters(testUrl);
            // Compare normalized strings (removing special characters)
            const normalizedResult = decodeURIComponent(result).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const normalizedExpected = baseUrl.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            expect(normalizedResult).to.equal(normalizedExpected);
        });
    });

    it('Resolve nested relative ZIM URLs and ignore query strings and fragments', function () {
        const url = '../../../I/im%C3%A1gen.png?size=large#preview';
        const base = 'A/subdir1/subdir2/article.html';

        expect(uiUtil.deriveZimUrlFromRelativeUrl(url, base)).to.equal('I/imágen.png');
    });

    it('Convert dataURI to Uint8Array (base64, percent-encoded, and edge cases)', function () {
        // Base64 dataURI
        const b64DataURI = 'data:text/plain;base64,SGVsbG8sIHdvcmxkIQ==';
        const b64Arr = util.dataURItoUint8Array(b64DataURI);
        const b64Str = String.fromCharCode.apply(null, b64Arr);
        expect(b64Str).to.equal('Hello, world!');

        // Line-wrapped base64 dataURIs (\n, and \r\n with indentation) should decode to the same bytes
        const wrappedLF = 'data:text/plain;base64,SGVsbG8s\nIHdvcmxk\nIQ==';
        const wrappedCRLF = 'data:text/plain;base64,SGVsbG8s\r\n    IHdvcmxk\r\n    IQ==';
        expect(Array.from(util.dataURItoUint8Array(wrappedLF))).to.deep.equal(Array.from(b64Arr));
        expect(Array.from(util.dataURItoUint8Array(wrappedCRLF))).to.deep.equal(Array.from(b64Arr));

        // Non-base64 percent-encoded dataURI containing reserved characters (%2C, %20)
        const percentDataURI = 'data:text/plain,hello%2C%20world';
        const percentArr = util.dataURItoUint8Array(percentDataURI);
        const percentStr = String.fromCharCode.apply(null, percentArr);
        expect(percentStr).to.equal('hello, world');
        expect(percentArr.length).to.equal(12);

        // Percent escapes decoded directly to raw bytes without UTF-8 character conversion
        const octetURI1 = 'data:application/octet-stream,%C3%A9';
        const octetArr1 = util.dataURItoUint8Array(octetURI1);
        expect(Array.from(octetArr1)).to.deep.equal([195, 169]);

        const octetURI2 = 'data:application/octet-stream,%C3%A9%FF';
        const octetArr2 = util.dataURItoUint8Array(octetURI2);
        expect(Array.from(octetArr2)).to.deep.equal([195, 169, 255]);

        // Invalid or empty inputs should return empty Uint8Array without throwing
        expect(util.dataURItoUint8Array('')).to.be.instanceOf(Uint8Array);
        expect(util.dataURItoUint8Array('').length).to.equal(0);
        expect(util.dataURItoUint8Array('not-a-data-uri').length).to.equal(0);
        expect(util.dataURItoUint8Array(null).length).to.equal(0);
        expect(util.dataURItoUint8Array(undefined).length).to.equal(0);

        // Malformed percent encoding should not throw
        const malformedDataURI = 'data:text/plain,%E0%A4';
        expect(() => util.dataURItoUint8Array(malformedDataURI)).to.not.throw();
        expect(util.dataURItoUint8Array(malformedDataURI)).to.be.instanceOf(Uint8Array);
    });

    it('Escape HTML-significant characters and handle empty input', function () {
        expect(util.escapeHtml('Tom & Jerry <b>"quoted"</b> l\'amore')).to.equal('Tom &amp; Jerry &lt;b&gt;&quot;quoted&quot;&lt;/b&gt; l&#39;amore');
        // An existing entity must be escaped once only, so it is displayed literally rather than garbled
        expect(util.escapeHtml('&lt;')).to.equal('&amp;lt;');
        expect(util.escapeHtml('A/Paris.html')).to.equal('A/Paris.html');
        expect(util.escapeHtml(404)).to.equal('404');
        expect(util.escapeHtml(null)).to.equal('');
        expect(util.escapeHtml(undefined)).to.equal('');
    });

    it('Distinguish file-access errors from other errors and explain them appropriately', function () {
        const accessErrors = [
            new DOMException('A requested file or directory could not be found', 'NotFoundError'),
            new DOMException('The requested file could not be read', 'NotReadableError'),
            new DOMException('The request is not allowed', 'NoModificationAllowedError'),
            Object.assign(new Error('no such file or directory'), { code: 'ENOENT' }),
            Object.assign(new Error('permission denied'), { code: 'EACCES' }),
            Object.assign(new Error('operation not permitted'), { code: 'EPERM' })
        ];
        accessErrors.forEach(err => {
            expect(uiUtil.isFileAccessError(err), err.name + ' ' + (err.code || '')).to.be.true;
        });
        [new Error('Unexpected end of data'), new RangeError('Offset is outside the bounds of the DataView'),
            new DOMException('Aborted', 'AbortError'), 'some error', null, undefined].forEach(err => {
            expect(uiUtil.isFileAccessError(err), String(err)).to.be.false;
        });

        // An OS denial of access points the user to permissions, while a missing file asks the user to pick it again
        const denied = uiUtil.fileAccessErrorMessage(new DOMException('The requested file could not be read', 'NotReadableError'));
        expect(denied).to.contain('refused access');
        expect(denied).to.not.contain('could not find your archive');
        const missing = uiUtil.fileAccessErrorMessage(new DOMException('A requested file or directory could not be found', 'NotFoundError'));
        expect(missing).to.contain('could not find your archive');
        expect(missing).to.not.contain('refused access');

        // The system error text (which may contain a file path) is included, escaped
        const withPath = uiUtil.fileAccessErrorMessage(Object.assign(new Error("ENOENT: no such file, open 'C:\\Archives & <ZIMs>\\wiki.zim'"), { code: 'ENOENT' }));
        expect(withPath).to.contain('C:\\Archives &amp; &lt;ZIMs&gt;\\wiki.zim');
        expect(withPath).to.not.contain('<ZIMs>');
    });
});

describe('ZIM initialization', function () {
    it('Set archive as ready', function () {
        expect(localZimArchive.isReady()).to.be.true;
    });

    it('_readSplitSlice returns a Uint8Array on empty and non-empty slices', async function () {
        const emptySlice = await localZimArchive.file._readSplitSlice(0, 0);
        expect(emptySlice).to.be.instanceOf(Uint8Array);
        expect(emptySlice.length).to.equal(0);
        expect(typeof emptySlice.subarray).to.equal('function');

        const nonRangeSlice = await localZimArchive.file._readSplitSlice(100000000000, 100000000000);
        expect(nonRangeSlice).to.be.instanceOf(Uint8Array);
        expect(nonRangeSlice.length).to.equal(0);

        const regularSlice = await localZimArchive.file._readSplitSlice(0, 4);
        expect(regularSlice).to.be.instanceOf(Uint8Array);
        expect(regularSlice.length).to.equal(4);
    });
});

describe('ZIM metadata', function () {
    it('Read ZIM language', async function () {
        const language = await new Promise(resolve => {
            localZimArchive.getMetadata('Language', resolve);
        });
        expect(language).to.equal('eng');
    });

    it('Handle missing metadata', async function () {
        const result = await new Promise(resolve => {
            localZimArchive.getMetadata('zzz', resolve);
        });
        expect(result).to.be.undefined;
    });
});

describe('ZIM directory entry search and read', function () {
    it('DirEntry.fromStringId "A Fool for You"', async function () {
        const aFoolForYouDirEntry = zimDirEntry.DirEntry.fromStringId(
            localZimArchive.file,
            '5856|7|A|0|2|A_Fool_for_You.html|A Fool for You|false|undefined'
        );

        const htmlArticle = await new Promise(resolve => {
            localZimArchive.readUtf8File(aFoolForYouDirEntry, (_, article) => resolve(article));
        });

        expect(htmlArticle).to.have.length.above(0);
        const normalizedArticle = htmlArticle.replace(/[\r\n]/g, ' ');
        expect(normalizedArticle).to.match(/^.*<h1[^>]*>A Fool for You<\/h1>/);
    });

    it('FindDirEntriesWithPrefix "A"', async function () {
        const dirEntryList = await new Promise(resolve => {
            localZimArchive.findDirEntriesWithPrefix({ prefix: 'A', size: 5 }, resolve, true);
        });

        expect(dirEntryList).to.have.length(5);
        expect(dirEntryList[0].getTitleOrUrl()).to.equal('A Fool for You');
    });

    it('FindDirEntriesWithPrefix "a"', async function () {
        const dirEntryList = await new Promise(resolve => {
            localZimArchive.findDirEntriesWithPrefix({ prefix: 'a', size: 5 }, resolve, true);
        });

        expect(dirEntryList).to.have.length(5);
        expect(dirEntryList[0].getTitleOrUrl()).to.equal('A Fool for You');
    });

    it('FindDirEntriesWithPrefix "blues brothers"', async function () {
        const dirEntryList = await new Promise(resolve => {
            localZimArchive.findDirEntriesWithPrefix({ prefix: 'blues brothers', size: 5 }, resolve, true);
        });

        expect(dirEntryList).to.have.length(3);
        expect(dirEntryList[0].getTitleOrUrl()).to.equal('Blues Brothers (film)');
    });

    it('Redirect article "(The Night Time Is) The Right Time" to "Night Time Is the Right Time"', async function () {
        const dirEntry = await localZimArchive.getDirEntryByPath('A/(The_Night_Time_Is)_The_Right_Time.html');
        expect(dirEntry).to.not.be.null;
        expect(dirEntry.isRedirect()).to.be.true;
        expect(dirEntry.getTitleOrUrl()).to.equal('(The Night Time Is) The Right Time');

        const resolvedDirEntry = await new Promise(resolve => {
            localZimArchive.resolveRedirect(dirEntry, resolve);
        });

        expect(resolvedDirEntry).to.not.be.null;
        expect(resolvedDirEntry.isRedirect()).to.be.false;
        expect(resolvedDirEntry.getTitleOrUrl()).to.equal('Night Time Is the Right Time');
    });

    it('Redirect article "Raelettes"  to "The Raelettes"', async function () {
        const dirEntry = await localZimArchive.getDirEntryByPath('A/Raelettes.html');
        expect(dirEntry).to.not.be.null;
        expect(dirEntry.isRedirect()).to.be.true;
        expect(dirEntry.getTitleOrUrl()).to.equal('Raelettes');

        const resolvedDirEntry = await new Promise(resolve => {
            localZimArchive.resolveRedirect(dirEntry, resolve);
        });

        expect(resolvedDirEntry).to.not.be.null;
        expect(resolvedDirEntry.isRedirect()).to.be.false;
        expect(resolvedDirEntry.getTitleOrUrl()).to.equal('The Raelettes');
    });

    it('Redirect article "Bein Green" to "Bein\' Green"', async function () {
        const dirEntry = await localZimArchive.getDirEntryByPath('A/Bein_Green.html');
        expect(dirEntry).to.not.be.null;
        expect(dirEntry.isRedirect()).to.be.true;
        expect(dirEntry.getTitleOrUrl()).to.equal('Bein Green');

        const resolvedDirEntry = await new Promise(resolve => {
            localZimArchive.resolveRedirect(dirEntry, resolve);
        });

        expect(resolvedDirEntry).to.not.be.null;
        expect(resolvedDirEntry.isRedirect()).to.be.false;
        expect(resolvedDirEntry.getTitleOrUrl()).to.equal("Bein' Green");
    });

    it('Redirect article "America, the Beautiful" to "America the Beautiful"', async function () {
        const dirEntry = await localZimArchive.getDirEntryByPath('A/America,_the_Beautiful.html');
        expect(dirEntry).to.not.be.null;
        expect(dirEntry.isRedirect()).to.be.true;
        expect(dirEntry.getTitleOrUrl()).to.equal('America, the Beautiful');

        const resolvedDirEntry = await new Promise(resolve => {
            localZimArchive.resolveRedirect(dirEntry, resolve);
        });

        expect(resolvedDirEntry).to.not.be.null;
        expect(resolvedDirEntry.isRedirect()).to.be.false;
        expect(resolvedDirEntry.getTitleOrUrl()).to.equal('America the Beautiful');
    });

    it('Load image "m/RayCharles_AManAndHisSoul.jpg"', async function () {
        const dirEntry = await localZimArchive.getDirEntryByPath('I/m/RayCharles_AManAndHisSoul.jpg');
        expect(dirEntry).to.not.be.null;
        expect(dirEntry.namespace + '/' + dirEntry.url).to.equal('I/m/RayCharles_AManAndHisSoul.jpg');
        expect(dirEntry.getMimetype()).to.equal('image/jpeg');

        const data = await new Promise(resolve => {
            localZimArchive.readBinaryFile(dirEntry, (_, data) => resolve(data));
        });

        expect(data.length).to.equal(4951);
        const beginning = new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0, 0, 1]);
        expect(data.slice(0, beginning.length).toString()).to.equal(beginning.toString());
    });

    it('Load stylesheet "-/s/style.css"', async function () {
        const dirEntry = await localZimArchive.getDirEntryByPath('-/s/style.css');
        expect(dirEntry).to.not.be.null;
        expect(dirEntry.namespace + '/' + dirEntry.url).to.equal('-/s/style.css');
        expect(dirEntry.getMimetype()).to.equal('text/css');

        const data = await new Promise(resolve => {
            localZimArchive.readBinaryFile(dirEntry, (_, data) => resolve(data));
        });

        expect(data.length).to.equal(104495);
        const parsedData = utf8.parse(data);
        const beginning = '\n/* start http://en.wikipedia.org/w/load.php?debug=false&lang=en&modules=site&only=styles&skin=vector';
        expect(parsedData.slice(0, beginning.length)).to.equal(beginning);
    });

    it('Load javascript "-/j/local.js"', async function () {
        const dirEntry = await localZimArchive.getDirEntryByPath('-/j/local.js');
        expect(dirEntry).to.not.be.null;
        expect(dirEntry.namespace + '/' + dirEntry.url).to.equal('-/j/local.js');
        expect(dirEntry.getMimetype()).to.equal('application/javascript');

        const data = await new Promise(resolve => {
            localZimArchive.readBinaryFile(dirEntry, (_, data) => resolve(data));
        });

        expect(data.length).to.equal(41);
        const parsedData = utf8.parse(data);
        const beginning = 'console.log( "mw.loader';
        expect(parsedData.slice(0, beginning.length)).to.equal(beginning);
    });

    it('Load split article "A/Ray_Charles.html"', async function () {
        const dirEntry = await localZimArchive.getDirEntryByPath('A/Ray_Charles.html');
        expect(dirEntry).to.not.be.null;
        expect(dirEntry.namespace + '/' + dirEntry.url).to.equal('A/Ray_Charles.html');
        expect(dirEntry.getMimetype()).to.equal('text/html');

        const article = await new Promise(resolve => {
            localZimArchive.readUtf8File(dirEntry, (_, article) => resolve(article));
        });

        expect(dirEntry.getTitleOrUrl()).to.equal('Ray Charles');
        expect(article.length).to.equal(157186);
        expect(article.indexOf('the only true genius in show business')).to.equal(5535);
        expect(article.indexOf('Random Access Memories')).to.equal(154107);

        const transformed = uiUtil.transformArticleHtmlForRestrictedMode(article, {
            dirEntry: dirEntry,
            archive: localZimArchive
        });
        expect(transformed).to.have.string('data-kiwixurl="I/m/');
        expect(transformed).to.not.have.string('src="../I/');
    });
});

describe('Zim random and main articles', function () {
    it('Find a random article', async function () {
        const dirEntry = await new Promise(resolve => {
            localZimArchive.getRandomDirEntry(resolve);
        });

        expect(dirEntry).to.not.be.null;
        expect(dirEntry.getTitleOrUrl()).to.not.be.null;
    });

    it('Find the main article', async function () {
        const dirEntry = await new Promise(resolve => {
            localZimArchive.getMainPageDirEntry(resolve);
        });

        expect(dirEntry).to.not.be.null;
        expect(dirEntry.getTitleOrUrl()).to.equal('Summary');
    });

    it('getMainPageDirEntry returns null when archive has no main page (0xffffffff)', async function () {
        const originalMainPage = localZimArchive.file.mainPage;
        localZimArchive.file.mainPage = 0xffffffff;
        try {
            const dirEntry = await new Promise(resolve => {
                localZimArchive.getMainPageDirEntry(resolve);
            });
            expect(dirEntry).to.be.null;
        } finally {
            localZimArchive.file.mainPage = originalMainPage;
        }
    });

    it('getMainPageDirEntry returns null when main page index equals entryCount', async function () {
        const originalMainPage = localZimArchive.file.mainPage;
        localZimArchive.file.mainPage = localZimArchive.file.entryCount;
        try {
            const dirEntry = await new Promise(resolve => {
                localZimArchive.getMainPageDirEntry(resolve);
            });
            expect(dirEntry).to.be.null;
        } finally {
            localZimArchive.file.mainPage = originalMainPage;
        }
    });
});
