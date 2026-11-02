/**
 * kiwixApi.js: Reusable API dispatcher for article and search data.
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

var ERROR_CODES = {
    INVALID_ARGUMENT: 'INVALID_ARGUMENT',
    NO_ZIM_LOADED: 'NO_ZIM_LOADED',
    FULLTEXT_UNAVAILABLE: 'FULLTEXT_UNAVAILABLE',
    NOT_FOUND: 'NOT_FOUND',
    UNSUPPORTED_ARCHIVE: 'UNSUPPORTED_ARCHIVE',
    UNSUPPORTED_CONTENT_TYPE: 'UNSUPPORTED_CONTENT_TYPE',
    CONTENT_REQUIRES_RENDERING: 'CONTENT_REQUIRES_RENDERING',
    NO_EXTRACTABLE_TEXT: 'NO_EXTRACTABLE_TEXT',
    REDIRECT_LOOP: 'REDIRECT_LOOP',
    WORKER_TIMEOUT: 'WORKER_TIMEOUT',
    WORKER_ERROR: 'WORKER_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

var API_SCHEMA = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Kiwix article data API call',
    description: 'A method call to the Kiwix article data API.',
    type: 'object',
    oneOf: [
        {
            type: 'object',
            description: 'Search article content in the loaded ZIM archive.',
            properties: {
                method: { const: 'search' },
                params: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', minLength: 1 },
                        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                    },
                    required: ['query'],
                    additionalProperties: false
                }
            },
            required: ['method', 'params'],
            additionalProperties: false
        },
        {
            type: 'object',
            description: 'Suggest article titles matching a prefix.',
            properties: {
                method: { const: 'suggest' },
                params: {
                    type: 'object',
                    properties: {
                        prefix: { type: 'string', minLength: 1 },
                        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
                    },
                    required: ['prefix'],
                    additionalProperties: false
                }
            },
            required: ['method', 'params'],
            additionalProperties: false
        },
        {
            type: 'object',
            description: 'Retrieve article text and metadata by canonical libzim path.',
            properties: {
                method: { const: 'getArticle' },
                params: {
                    type: 'object',
                    properties: {
                        path: { type: 'string', minLength: 1, description: 'Canonical libzim path; passed through unchanged.' },
                        maxChars: { type: 'integer', minimum: 1, maximum: 100000, default: 10000 },
                        offset: { type: 'integer', minimum: 0, default: 0 },
                        section: { type: 'string', minLength: 1, description: 'Exact section id or heading title.' }
                    },
                    required: ['path'],
                    additionalProperties: false
                }
            },
            required: ['method', 'params'],
            additionalProperties: false
        },
        {
            type: 'object',
            description: 'Get archive metadata and libzim initialization state.',
            properties: {
                method: { const: 'getInfo' },
                params: { type: 'object', properties: {}, additionalProperties: false }
            },
            required: ['method', 'params'],
            additionalProperties: false
        }
    ]
};

function makeError (code, message) {
    return { ok: false, error: { code: code, message: message } };
}

function normalizeError (error) {
    if (error && (error.code === 'ARCHIVE_CHANGED' || error.code === 'WORKER_UNAVAILABLE')) {
        return makeError(ERROR_CODES.NO_ZIM_LOADED, error.message || 'No ZIM archive is currently loaded');
    }
    if (error && Object.prototype.hasOwnProperty.call(ERROR_CODES, error.code)) {
        return makeError(error.code, error.message || 'The API call failed');
    }
    return makeError(ERROR_CODES.INTERNAL_ERROR, error && error.message ? error.message : 'The API call failed');
}

function validateObject (params) {
    return params !== null && typeof params === 'object' && !Array.isArray(params);
}

function hasOnlyProperties (params, allowedProperties) {
    return Object.keys(params).every(function (key) {
        return allowedProperties.indexOf(key) !== -1;
    });
}

function validateString (params, key) {
    return typeof params[key] === 'string' && params[key].trim().length > 0;
}

function validateLimit (params) {
    return params.limit === undefined || Number.isInteger(params.limit) && params.limit >= 1 && params.limit <= 100;
}

function validateArticleOptions (params) {
    return (params.maxChars === undefined || Number.isInteger(params.maxChars) && params.maxChars >= 1 && params.maxChars <= 100000) &&
        (params.offset === undefined || Number.isInteger(params.offset) && params.offset >= 0) &&
        (params.section === undefined || typeof params.section === 'string' && params.section.trim().length > 0);
}

function createKiwixApi (options) {
    options = options || {};
    var callWorker = options.callWorker;
    var hasFullText = options.hasFullText === true;
    var isCurrent = typeof options.isCurrent === 'function' ? options.isCurrent : function () { return true; };
    var extractArticle = options.extractArticle;
    var getArchiveInfo = options.getArchiveInfo;
    var getLibzimState = typeof options.getLibzimState === 'function' ? options.getLibzimState : function () { return 'unavailable'; };
    var isZimit = options.isZimit === true;

    function checkAvailable () {
        try {
            if (!isCurrent()) return makeError(ERROR_CODES.NO_ZIM_LOADED, 'No ZIM archive is currently loaded');
        } catch (error) {
            return normalizeError(error);
        }
        if (typeof callWorker !== 'function') {
            return makeError(ERROR_CODES.NO_ZIM_LOADED, 'The libzim worker is unavailable');
        }
        return null;
    }

    function search (params) {
        if (!validateObject(params) || !hasOnlyProperties(params, ['query', 'limit']) || !validateString(params, 'query') || !validateLimit(params)) {
            return Promise.resolve(makeError(ERROR_CODES.INVALID_ARGUMENT, 'search expects a non-empty query and an optional limit from 1 to 100'));
        }
        var unavailable = checkAvailable();
        if (unavailable) return Promise.resolve(unavailable);
        if (!hasFullText) {
            return Promise.resolve(makeError(ERROR_CODES.FULLTEXT_UNAVAILABLE, 'Full-text search is unavailable for the loaded archive'));
        }
        return Promise.resolve().then(function () {
            return callWorker({
                action: 'searchWithSnippets',
                text: params.query.trim(),
                numResults: params.limit || 20
            });
        }).then(function (response) {
            if (!isCurrent()) return makeError(ERROR_CODES.NO_ZIM_LOADED, 'The loaded archive changed during the search');
            if (!response || response.error) return makeError(ERROR_CODES.WORKER_ERROR, response && response.error || 'Search returned no response');
            if (!Array.isArray(response.results)) return makeError(ERROR_CODES.INTERNAL_ERROR, 'Search returned an invalid response');
            return { ok: true, data: response.results };
        }).catch(normalizeError);
    }

    function suggest (params) {
        if (!validateObject(params) || !hasOnlyProperties(params, ['prefix', 'limit']) || !validateString(params, 'prefix') || !validateLimit(params)) {
            return Promise.resolve(makeError(ERROR_CODES.INVALID_ARGUMENT, 'suggest expects a non-empty prefix and an optional limit from 1 to 100'));
        }
        var unavailable = checkAvailable();
        if (unavailable) return Promise.resolve(unavailable);
        return Promise.resolve().then(function () {
            return callWorker({
                action: 'suggest',
                text: params.prefix.trim(),
                numResults: params.limit || 10
            });
        }).then(function (response) {
            if (!isCurrent()) return makeError(ERROR_CODES.NO_ZIM_LOADED, 'The loaded archive changed during suggestions');
            if (!response || response.error) return makeError(ERROR_CODES.WORKER_ERROR, response && response.error || 'Suggestions returned no response');
            if (!Array.isArray(response.suggestions)) return makeError(ERROR_CODES.INTERNAL_ERROR, 'Suggestions returned an invalid response');
            return { ok: true, data: response.suggestions };
        }).catch(normalizeError);
    }

    function getArticle (params) {
        if (!validateObject(params) || !hasOnlyProperties(params, ['path', 'maxChars', 'offset', 'section']) ||
            !validateString(params, 'path') || !validateArticleOptions(params)) {
            return Promise.resolve(makeError(ERROR_CODES.INVALID_ARGUMENT, 'getArticle expects a non-empty path and valid pagination or section options'));
        }
        var unavailable = checkAvailable();
        if (unavailable) return Promise.resolve(unavailable);
        function fetchEntry (path, visitedPaths) {
            if (visitedPaths.indexOf(path) !== -1 || visitedPaths.length >= 20) {
                return Promise.reject({ code: ERROR_CODES.REDIRECT_LOOP, message: 'Article redirect loop or redirect limit reached' });
            }
            return Promise.resolve().then(function () {
                return callWorker({ action: 'getEntryByPath', path: path, follow: false });
            }).then(function (response) {
                if (!isCurrent()) throw { code: 'ARCHIVE_CHANGED', message: 'The loaded archive changed during article retrieval' };
                if (!response || response.error) {
                    throw { code: ERROR_CODES.WORKER_ERROR, message: response && response.error || 'Article retrieval returned no response' };
                }
                if (response.isRedirect) {
                    if (typeof response.redirectPath !== 'string' || response.redirectPath.length === 0) {
                        throw { code: ERROR_CODES.WORKER_ERROR, message: 'Worker returned a redirect without a destination path' };
                    }
                    return fetchEntry(response.redirectPath, visitedPaths.concat(path));
                }
                if (!response.content || response.mimetype === 'unknown') {
                    throw { code: ERROR_CODES.NOT_FOUND, message: 'Article was not found' };
                }
                return { response: response, path: path };
            });
        }
        return fetchEntry(params.path, []).then(function (entry) {
            var response = entry.response;
            if (typeof extractArticle !== 'function') return makeError(ERROR_CODES.INTERNAL_ERROR, 'Article extraction is unavailable');
            return Promise.resolve(extractArticle(response.content, response.mimetype, entry.path)).then(function (article) {
                if (!isCurrent()) throw { code: 'ARCHIVE_CHANGED', message: 'The loaded archive changed during article extraction' };
                var articleText = typeof article === 'string' ? article : article && article.text;
                var sections = article && Array.isArray(article.sections) ? article.sections : [];
                if (typeof articleText !== 'string') return makeError(ERROR_CODES.INTERNAL_ERROR, 'Article extraction returned an invalid response');
                if (params.section !== undefined) {
                    var selectedSection = sections.find(function (section) {
                        return section && (section.id === params.section || section.title === params.section);
                    });
                    if (!selectedSection || typeof selectedSection.text !== 'string') {
                        return makeError(ERROR_CODES.NOT_FOUND, 'Article section was not found');
                    }
                    articleText = selectedSection.text;
                }
                var offset = params.offset === undefined ? 0 : params.offset;
                var maxChars = params.maxChars === undefined ? 10000 : params.maxChars;
                if (offset > articleText.length) return makeError(ERROR_CODES.INVALID_ARGUMENT, 'offset exceeds the article text length');
                var end = Math.min(offset + maxChars, articleText.length);
                var articleImages = params.section !== undefined ? selectedSection.images : article && article.images;
                var images = Array.isArray(articleImages) ? articleImages.map(function (image) {
                    var imagePath = image && typeof image.path === 'string' ? image.path : '';
                    var isEmbedded = !!(image && image.isEmbedded) || /^data:/i.test(imagePath);
                    var isExternal = !!(image && image.isExternal);
                    return {
                        path: isEmbedded ? '' : imagePath,
                        alt: image && typeof image.alt === 'string' ? image.alt : '',
                        caption: image && typeof image.caption === 'string' ? image.caption : '',
                        source: isEmbedded ? 'embedded' : isExternal ? 'external' : image && typeof image.source === 'string' ? image.source : 'archive',
                        isExternal: isExternal,
                        isEmbedded: isEmbedded
                    };
                }) : [];
                var data = {
                    path: entry.path,
                    text: articleText.slice(offset, end),
                    offset: offset,
                    totalLength: articleText.length,
                    truncated: end < articleText.length,
                    nextOffset: end < articleText.length ? end : null,
                    sections: sections.map(function (section) {
                        return { id: section.id, title: section.title };
                    }),
                    images: images,
                    textExtractionMayBeImperfect: isZimit
                };
                if (entry.path !== params.path) data.redirectedFrom = params.path;
                if (params.section !== undefined) data.section = params.section;
                return { ok: true, data: data };
            });
        }).catch(normalizeError);
    }

    function getInfo (params) {
        if (params !== undefined && (!validateObject(params) || !hasOnlyProperties(params, []))) {
            return Promise.resolve(makeError(ERROR_CODES.INVALID_ARGUMENT, 'getInfo does not accept parameters'));
        }
        try {
            if (!isCurrent()) return Promise.resolve(makeError(ERROR_CODES.NO_ZIM_LOADED, 'No ZIM archive is currently loaded'));
        } catch (error) {
            return Promise.resolve(normalizeError(error));
        }
        if (typeof getArchiveInfo !== 'function') {
            return Promise.resolve(makeError(ERROR_CODES.INTERNAL_ERROR, 'Archive info bridge is unavailable'));
        }
        return Promise.resolve().then(function () {
            return getArchiveInfo();
        }).then(function (info) {
            if (!isCurrent()) return makeError(ERROR_CODES.NO_ZIM_LOADED, 'The loaded archive changed while reading archive information');
            if (!validateObject(info)) return makeError(ERROR_CODES.INTERNAL_ERROR, 'Archive info bridge returned an invalid response');
            var state = getLibzimState();
            if (state === null || state === undefined || state === 'pending') state = 'initializing';
            if (['not-initialized', 'initializing', 'ready', 'error', 'inactive', 'unavailable'].indexOf(state) === -1) state = 'unavailable';
            return {
                ok: true,
                data: Object.assign({}, info, {
                    hasFullText: hasFullText,
                    libzim: { state: state }
                })
            };
        }).catch(normalizeError);
    }

    var methods = {
        search: search,
        suggest: suggest,
        getArticle: getArticle,
        getInfo: getInfo
    };

    function call (method, params) {
        if (typeof method !== 'string' || !Object.prototype.hasOwnProperty.call(methods, method)) {
            return Promise.resolve(makeError(ERROR_CODES.INVALID_ARGUMENT, 'Unknown API method'));
        }
        try {
            return Promise.resolve(methods[method](params)).catch(normalizeError);
        } catch (error) {
            return Promise.resolve(normalizeError(error));
        }
    }

    return {
        call: call,
        search: search,
        suggest: suggest,
        getArticle: getArticle,
        getInfo: getInfo,
        describe: function () { return JSON.parse(JSON.stringify(API_SCHEMA)); }
    };
}

export default {
    createKiwixApi: createKiwixApi,
    errorCodes: ERROR_CODES
};
