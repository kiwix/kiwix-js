/**
 * articleHistory.js : Keeps an optional list of the articles recently visited in the loaded archive [kiwix-js #1368]
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

// The maximum number of entries kept, so that the stored list cannot grow without limit
const maxEntries = 50;
// The key (without params.keyPrefix) under which the list is stored
const storageKey = 'articleHistory';

// The list in memory: { zim: <file name of the archive the entries belong to>, entries: [{ path, title, time }] }, newest first
var history = { zim: '', entries: [] };

/**
 * Reads the stored list into memory. The list is only stored when localStorage is available: it is too big for a cookie,
 * so with the cookie store it lasts only for the current session
 */
function load () {
    history = { zim: '', entries: [] };
    if (params.storeType !== 'local_storage') return;
    try {
        var stored = JSON.parse(localStorage.getItem(params.keyPrefix + storageKey));
        if (stored && typeof stored.zim === 'string' && Array.isArray(stored.entries)) history = stored;
    } catch (e) {
        console.warn('Could not read the article history', e);
    }
}

/**
 * Writes the list in memory to localStorage (if available). Nothing is kept in storage while history is turned off
 * or while the list is empty
 */
function save () {
    if (params.storeType !== 'local_storage') return;
    try {
        if (params.recordArticleHistory && history.entries.length) {
            localStorage.setItem(params.keyPrefix + storageKey, JSON.stringify(history));
        } else {
            localStorage.removeItem(params.keyPrefix + storageKey);
        }
    } catch (e) {
        console.warn('Could not save the article history', e);
    }
}

/**
 * Tells the module which archive is loaded. If it is not the archive the stored entries belong to, the entries are deleted,
 * because they could not be opened from the new archive. Reopening the same archive keeps them.
 * @param {String} zimName The file name of the loaded archive
 */
function setArchive (zimName) {
    load();
    if (history.zim === zimName) return;
    history = { zim: zimName, entries: [] };
    save();
}

/**
 * Adds an article to the top of the list (moving it there if it is already in the list), if the user has turned history on
 * @param {String} path The ZIM path of the article, including the namespace (e.g. 'A/Ray_Charles')
 * @param {String} title The title of the article
 */
function record (path, title) {
    if (!params.recordArticleHistory || !path || !history.zim) return;
    history.entries = history.entries.filter(function (entry) {
        return entry.path !== path;
    });
    history.entries.unshift({ path: path, title: title || path.replace(/^.*\//, ''), time: Date.now() });
    if (history.entries.length > maxEntries) history.entries.length = maxEntries;
    save();
}

/**
 * Gets the entries for the loaded archive, newest first
 * @returns {Array<Object>} An array of { path, title, time } objects, where time is in ms since the epoch
 */
function getEntries () {
    return history.entries.slice();
}

/**
 * Deletes all the entries, from memory and from storage
 */
function clear () {
    history.entries = [];
    save();
}

export default {
    maxEntries: maxEntries,
    setArchive: setArchive,
    record: record,
    getEntries: getEntries,
    clear: clear
};
