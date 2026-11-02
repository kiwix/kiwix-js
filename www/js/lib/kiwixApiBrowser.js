/**
 * kiwixApiBrowser.js: Browser adapter for the reusable Kiwix article data API.
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

import kiwixApi from './kiwixApi.js';
import libzimWorkerManager from './libzimWorkerManager.js';
import articleText from './articleText.js';

function getArchiveInfo (archive) {
    return {
        name: archive.name || archive.file.name || '',
        title: archive.title || '',
        description: archive.description || '',
        language: archive.language || '',
        creator: archive.creator || '',
        publisher: archive.publisher || '',
        date: archive.date || '',
        counter: archive.counter || '',
        zimType: archive.zimType || '',
        articleCount: archive.file.articleCount || null,
        entryCount: archive.file.entryCount || null
    };
}

function createKiwixApiBrowser (options) {
    options = options || {};
    var getSelectedArchive = options.getSelectedArchive;
    var manager = options.workerManager || libzimWorkerManager;
    var getWorkerUrl = options.getWorkerUrl;
    var extractArticle = options.extractArticle || articleText.extractArticleContent;

    function getCurrentArchive () {
        return typeof getSelectedArchive === 'function' ? getSelectedArchive() : null;
    }

    function createCoreForArchive (archive) {
        return kiwixApi.createKiwixApi({
            callWorker: function (message) {
                if (getCurrentArchive() !== archive || !manager.isActive(archive)) {
                    var changedError = new Error('The selected archive changed before the worker request');
                    changedError.code = 'ARCHIVE_CHANGED';
                    return Promise.reject(changedError);
                }
                var firstFile = archive.file._files && archive.file._files[0];
                if (firstFile && /\.zima.$/i.test(firstFile.name)) {
                    var error = new Error('Split ZIM archives are not supported by the libzim worker');
                    error.code = 'UNSUPPORTED_ARCHIVE';
                    return Promise.reject(error);
                }
                if (typeof getWorkerUrl !== 'function') {
                    var configError = new Error('Libzim worker configuration is unavailable');
                    configError.code = 'WORKER_UNAVAILABLE';
                    return Promise.reject(configError);
                }
                var workerUrl;
                try {
                    workerUrl = getWorkerUrl();
                } catch (urlError) {
                    urlError.code = urlError.code || 'WORKER_UNAVAILABLE';
                    return Promise.reject(urlError);
                }
                if (typeof workerUrl !== 'string' || workerUrl.length === 0) {
                    var invalidUrlError = new Error('Libzim worker configuration is unavailable');
                    invalidUrlError.code = 'WORKER_UNAVAILABLE';
                    return Promise.reject(invalidUrlError);
                }
                return manager.initialize(archive, archive.file._files, workerUrl)
                    .then(function () { return manager.call(archive, message); });
            },
            hasFullText: !!archive.file.fullTextIndex,
            isCurrent: function () { return getCurrentArchive() === archive && manager.isActive(archive); },
            extractArticle: extractArticle,
            getArchiveInfo: function () { return getArchiveInfo(archive); },
            getLibzimState: function () { return manager.getState(archive); },
            isZimit: /zimit/i.test(archive.zimType || '')
        });
    }

    function call (method, params) {
        var archive = getCurrentArchive();
        if (!archive || !archive.file || typeof archive.isReady !== 'function' || !archive.isReady()) {
            return Promise.resolve({ ok: false, error: { code: 'NO_ZIM_LOADED', message: 'No ZIM archive is currently loaded' } });
        }
        return createCoreForArchive(archive).call(method, params);
    }

    return {
        call: call,
        search: function (params) { return call('search', params); },
        suggest: function (params) { return call('suggest', params); },
        getArticle: function (params) { return call('getArticle', params); },
        getInfo: function (params) { return call('getInfo', params); },
        describe: function () { return kiwixApi.createKiwixApi({}).describe(); }
    };
}

export default {
    createKiwixApiBrowser: createKiwixApiBrowser
};
