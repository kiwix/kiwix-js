/**
 * articleHistory.js : Keeps an optional list of the articles recently visited in each archive [kiwix-js #1368]
 *
 * Copyright 2026 Jaifroid and contributors
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

/* global params */

// The maximum number of entries kept for each archive, so that the stored lists cannot grow without limit
const maxEntries = 50;
// The maximum number of archives for which a list is kept. When there are more, the least recently used list is dropped
const maxArchives = 10;
// The key (without params.keyPrefix) under which the lists are stored
const storageKey = 'articleHistory';

// The lists in memory, one for each archive: { [file name of the archive]: { used: <ms since the epoch>, entries: [{ path, title, time }] } }
// The entries of each list are ordered newest first
var archives = {};
// The file name of the loaded archive
var currentZim = '';

/**
 * Reads the stored lists into memory. The lists are only stored when localStorage is available: they are too big for a cookie,
 * so with the cookie store they last only for the current session
 */
function load () {
    if (params.storeType !== 'local_storage') return;
    archives = {};
    try {
        var stored = JSON.parse(localStorage.getItem(params.keyPrefix + storageKey));
        if (stored && stored.archives && typeof stored.archives === 'object') {
            Object.keys(stored.archives).forEach(function (zim) {
                var list = stored.archives[zim];
                if (list && Array.isArray(list.entries)) archives[zim] = { used: +list.used || 0, entries: list.entries };
            });
        }
    } catch (e) {
        console.warn('Could not read the article history', e);
    }
}

/**
 * Drops the least recently used lists if there are more than the maximum number of archives
 */
function prune () {
    var zims = Object.keys(archives);
    if (zims.length <= maxArchives) return;
    zims.sort(function (a, b) {
        return archives[b].used - archives[a].used;
    });
    zims.slice(maxArchives).forEach(function (zim) {
        delete archives[zim];
    });
}

/**
 * Writes the lists in memory to localStorage (if available). Nothing is kept in storage while history is turned off
 * or while there are no lists
 */
function save () {
    if (params.storeType !== 'local_storage') return;
    try {
        if (params.recordArticleHistory && Object.keys(archives).length) {
            localStorage.setItem(params.keyPrefix + storageKey, JSON.stringify({ archives: archives }));
        } else {
            localStorage.removeItem(params.keyPrefix + storageKey);
        }
    } catch (e) {
        console.warn('Could not save the article history', e);
    }
}

/**
 * Tells the module which archive is loaded, so that only the list for that archive is used. The lists for other
 * archives are kept, and are used again if the user reopens those archives
 * @param {String} zimName The file name of the loaded archive
 */
function setArchive (zimName) {
    load();
    currentZim = zimName;
}

/**
 * Adds an article to the top of the list for the loaded archive (moving it there if it is already in the list),
 * if the user has turned history on
 * @param {String} path The ZIM path of the article, including the namespace (e.g. 'A/Ray_Charles')
 * @param {String} title The title of the article
 */
function record (path, title) {
    if (!params.recordArticleHistory || !path || !currentZim) return;
    var list = archives[currentZim] || (archives[currentZim] = { used: 0, entries: [] });
    list.entries = list.entries.filter(function (entry) {
        return entry.path !== path;
    });
    list.entries.unshift({ path: path, title: title || path.replace(/^.*\//, ''), time: Date.now() });
    if (list.entries.length > maxEntries) list.entries.length = maxEntries;
    list.used = Date.now();
    prune();
    save();
}

/**
 * Gets the entries for the loaded archive, newest first
 * @returns {Array<Object>} An array of { path, title, time } objects, where time is in ms since the epoch
 */
function getEntries () {
    return archives[currentZim] ? archives[currentZim].entries.slice() : [];
}

/**
 * Deletes the lists for all archives, from memory and from storage
 */
function clear () {
    archives = {};
    save();
}

export default {
    maxEntries: maxEntries,
    maxArchives: maxArchives,
    setArchive: setArchive,
    record: record,
    getEntries: getEntries,
    clear: clear
};
