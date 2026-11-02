/**
 * articleText.js: Decode article bytes and extract structured text from HTML.
 *
 * Licence GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public Licence as published by
 * the Free Software Foundation, either version 3 of the Licence, or
 * (at your option) any later version.
 *
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public Licence for more details.
 *
 * You should have received a copy of the GNU General Public Licence
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */

'use strict';

import utf8 from './utf8.js';

var HTML_TYPES = ['text/html', 'application/xhtml+xml'];
var TEXT_TYPES = ['text/plain'];
var REMOVED_ELEMENTS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED'];
var BLOCK_ELEMENTS = [
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'CAPTION', 'DD', 'DETAILS', 'DIV', 'DL', 'DT', 'FIELDSET',
    'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR', 'LI', 'MAIN',
    'OL', 'P', 'PRE', 'SECTION', 'SUMMARY', 'TABLE', 'TBODY', 'THEAD', 'TFOOT', 'TR', 'UL'
];

function normalizeContentType (mimetype) {
    return typeof mimetype === 'string' ? mimetype.split(';')[0].trim().toLowerCase() : '';
}

function decodeArticleContent (content) {
    if (typeof content === 'string') return content;
    if (content instanceof ArrayBuffer) content = new Uint8Array(content);
    if (!content || typeof content.length !== 'number') throw new TypeError('Article content must be a string or byte array');
    if (typeof TextDecoder === 'function') return new TextDecoder('utf-8').decode(content);
    return utf8.parse(content);
}

function hasElement (element, names) {
    return names.indexOf(element.tagName) !== -1;
}

function cleanDocument (document) {
    REMOVED_ELEMENTS.forEach(function (tagName) {
        Array.prototype.slice.call(document.getElementsByTagName(tagName.toLowerCase())).forEach(function (element) {
            if (element.parentNode) element.parentNode.removeChild(element);
        });
    });
}

function chooseArticleContainer (document) {
    var selectors = [
        '.mw-parser-output',
        'article',
        '[role="main"]',
        'main',
        '#content',
        '.content',
        'body'
    ];
    for (var i = 0; i < selectors.length; i++) {
        var candidate = document.querySelector(selectors[i]);
        if (candidate && (candidate.textContent || '').trim()) return candidate;
    }
    return document.body || document.documentElement;
}

function appendText (parts, text) {
    text = text.replace(/[\t\r\n\f ]+/g, ' ');
    if (!text) return;
    parts.push(text);
}

function appendPreformattedText (parts, text) {
    if (parts.length && parts[parts.length - 1] !== '\n') parts.push('\n');
    parts.push('\u0001' + text + '\u0002');
    parts.push('\n');
}

function appendBlockBreak (parts) {
    if (parts.length && parts[parts.length - 1] !== '\n') parts.push('\n');
}

function updateBuffers (buffers, method, value) {
    buffers.forEach(function (buffer) { method(buffer, value); });
}

function cleanExtractedText (parts) {
    return parts.join('').split(/(\u0001[\s\S]*?\u0002)/).map(function (part) {
        if (part.charAt(0) === '\u0001' && part.charAt(part.length - 1) === '\u0002') return part;
        return part
            .replace(/ {2,}/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n[ \t]+/g, '\n')
            .replace(/\n{3,}/g, '\n\n');
    }).join('').trim().replace(/[\u0001\u0002]/g, '');
}

function headingLevel (element) {
    return /^H[1-6]$/.test(element.tagName) ? Number(element.tagName.slice(1)) : 0;
}

function slugify (text) {
    var slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug || 'section';
}

function extractContentInOrder (container) {
    var usedIds = Object.create(null);
    var authoredIds = Object.create(null);
    var sections = [];
    var activeSections = [];
    var articleParts = [];
    Array.prototype.forEach.call(container.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'), function (heading) {
        authoredIds[heading.id] = true;
    });

    function uniqueSectionId (heading, title) {
        var authoredId = heading.id;
        var baseId = authoredId || 'section-' + slugify(title);
        var id = baseId;
        var suffix = 2;
        while (usedIds[id] || !authoredId && authoredIds[id]) {
            id = baseId + '-' + suffix;
            suffix++;
        }
        usedIds[id] = true;
        heading.id = id;
        return id;
    }

    function walk (node) {
        if (node.nodeType === 3) {
            var text = node.nodeValue || '';
            appendText(articleParts, text);
            updateBuffers(activeSections.map(function (section) { return section.parts; }), appendText, text);
            return;
        }
        if (node.nodeType !== 1 || hasElement(node, REMOVED_ELEMENTS)) return;

        if (node.tagName === 'PRE') {
            appendPreformattedText(articleParts, node.textContent || '');
            updateBuffers(activeSections.map(function (section) { return section.parts; }), appendPreformattedText, node.textContent || '');
            return;
        }

        var level = headingLevel(node);
        if (level) {
            while (activeSections.length && activeSections[activeSections.length - 1].level >= level) activeSections.pop();
            var title = (node.textContent || '').replace(/[\t\r\n\f ]+/g, ' ').trim();
            var section = {
                id: uniqueSectionId(node, title),
                title: title,
                level: level,
                parts: []
            };
            sections.push(section);
            activeSections.push(section);
        }

        var isBlock = hasElement(node, BLOCK_ELEMENTS);
        var isCell = node.tagName === 'TD' || node.tagName === 'TH';
        if (node.tagName === 'BR' || node.tagName === 'HR') {
            appendBlockBreak(articleParts);
            updateBuffers(activeSections.map(function (item) { return item.parts; }), appendBlockBreak);
            return;
        }
        if (isBlock) {
            appendBlockBreak(articleParts);
            updateBuffers(activeSections.map(function (item) { return item.parts; }), appendBlockBreak);
        }
        if (isCell) {
            var precedingCell = node.previousElementSibling;
            while (precedingCell && precedingCell.tagName !== 'TD' && precedingCell.tagName !== 'TH') precedingCell = precedingCell.previousElementSibling;
            if (precedingCell) {
                articleParts.push(' | ');
                updateBuffers(activeSections.map(function (item) { return item.parts; }), function (parts) { parts.push(' | '); });
            }
        }
        Array.prototype.forEach.call(node.childNodes, walk);
        if (isBlock) {
            appendBlockBreak(articleParts);
            updateBuffers(activeSections.map(function (item) { return item.parts; }), appendBlockBreak);
        }
    }

    walk(container);
    return {
        text: cleanExtractedText(articleParts),
        sections: sections.map(function (section) {
            return {
                id: section.id,
                title: section.title,
                level: section.level,
                text: cleanExtractedText(section.parts) || section.title
            };
        })
    };
}

function resolveArchiveImagePath (imagePath, articlePath) {
    if (!articlePath || !imagePath || imagePath.charAt(0) === '#') return imagePath;
    var base = articlePath.split('/');
    base.pop();
    var segments = imagePath.charAt(0) === '/' ? [] : base;
    imagePath.replace(/\\/g, '/').split('/').forEach(function (segment) {
        if (!segment || segment === '.') return;
        if (segment === '..') segments.pop();
        else segments.push(segment);
    });
    return segments.join('/');
}

function getImageMetadata (container, articlePath) {
    return Array.prototype.map.call(container.querySelectorAll('img'), function (image) {
        var figure = image.parentElement;
        while (figure && figure.tagName !== 'FIGURE') figure = figure.parentElement;
        var caption = figure && figure.querySelector('figcaption');
        var rawPath = image.getAttribute('src') || '';
        var isExternal = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(rawPath) && !/^data:/i.test(rawPath);
        var isEmbedded = /^data:/i.test(rawPath);
        var path = isEmbedded ? '' : isExternal ? rawPath : resolveArchiveImagePath(rawPath, articlePath);
        return {
            path: path,
            alt: image.getAttribute('alt') || '',
            caption: caption ? (caption.textContent || '').replace(/[\t\r\n\f ]+/g, ' ').trim() : '',
            source: isExternal ? 'external' : isEmbedded ? 'embedded' : 'archive',
            isExternal: isExternal,
            isEmbedded: isEmbedded
        };
    });
}

function extractHtmlArticle (html, articlePath) {
    if (typeof html !== 'string') throw new TypeError('HTML article extraction expects a string');
    if (typeof DOMParser !== 'function') throw new Error('DOMParser is unavailable');
    var document = new DOMParser().parseFromString(html, 'text/html');
    cleanDocument(document);
    var container = chooseArticleContainer(document);
    var extracted = extractContentInOrder(container);
    return {
        text: extracted.text,
        sections: extracted.sections,
        images: getImageMetadata(container, articlePath)
    };
}

function extractArticleContent (content, mimetype, articlePath) {
    var type = normalizeContentType(mimetype);
    if (HTML_TYPES.indexOf(type) !== -1) return extractHtmlArticle(decodeArticleContent(content), articlePath);
    if (TEXT_TYPES.indexOf(type) !== -1) {
        return { text: decodeArticleContent(content).trim(), sections: [], images: [] };
    }
    var error = new Error('Unsupported article content type: ' + (type || 'unknown'));
    error.code = 'UNSUPPORTED_CONTENT_TYPE';
    throw error;
}

/*
 * Keep decoding bytes separate from DOM extraction. The HTML extractor accepts
 * only an HTML string, so it remains independently testable and reusable.
 */
function getArticleText (content, mimetype, articlePath) {
    return extractArticleContent(content, mimetype, articlePath);
}

/*
 * The following definitions are intentionally exported for focused tests and
 * alternate Kiwix browser adapters.
 */
function getArticleContentType (mimetype) {
    var type = normalizeContentType(mimetype);
    if (HTML_TYPES.indexOf(type) !== -1) return 'html';
    if (TEXT_TYPES.indexOf(type) !== -1) return 'text';
    return null;
}

export default {
    decodeArticleContent: decodeArticleContent,
    extractHtmlArticle: extractHtmlArticle,
    extractArticleContent: getArticleText,
    getArticleContentType: getArticleContentType
};
