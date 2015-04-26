/**
 * zimArchive.js: Support for archives in ZIM format.
 *
 * Copyright 2015 Mossroy and contributors
 * License GPL v3:
 *
 * This file is part of Evopedia.
 *
 * Evopedia is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Evopedia is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Evopedia (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */
'use strict';
define(['zimfile', 'zimDirEntry', 'util'], function(zimfile, zimDirEntry, util) {
    /**
     * Creates a ZIM arhive object to access the ZIM file at the given path in the given storage.
     */
    function ZIMArchive(storage, path) {
        var that = this;
        that._file = null;
        that.language = ""; //@TODO
        storage.get(path).then(function(file) {
            return zimfile.fromFile(file).then(function(file) {
                that._file = file;
            });
        }, function(error) {
            alert("Error reading ZIM file " + path + ": " + error);
        });
    };

    ZIMArchive.prototype.isReady = function() {
        return this._file !== null;
    };

    ZIMArchive.prototype.hasCoordinates = function() {
        return false;
    };

    ZIMArchive.prototype.parseTitleId = function(titleId) {
        return zimDirEntry.DirEntry.fromStringId(this._file, titleId);
    };

    ZIMArchive.prototype.findTitlesWithPrefix = function(prefix, resultSize, callback) {
        var that = this;
        util.binarySearch(0, this._file.articleCount, function(i) {
            return that._file.dirEntryByTitleIndex(i).then(function(dirEntry) {
                return prefix < dirEntry.title ? -1 : 1;
            });
        }, true).then(function(firstIndex) {
            //@todo do not add titles that do not have the right prefix
            var titles = [];
            var addTitles = function(index) {
                if (index >= firstIndex + resultSize || index >= that._file.articleCount)
                    return titles;
                return that._file.dirEntryByTitleIndex(index).then(function(dirEntry) {
                    titles.push(that._dirEntryToTitleObject(dirEntry));
                    return addTitles(index + 1);
                });
            };
            return addTitles(firstIndex);
        }).then(callback);
    };

    ZIMArchive.prototype.getTitlesInCoords = function(rectangle, resultSize, callback) {
        callback([]);
    };

    ZIMArchive.prototype.resolveRedirect = function(title, callback) {

    };

    ZIMArchive.prototype.readArticle = function(title, callback) {
        return title.readData().then(function(data) {
            callback(title.name(), data);
        });
    };

    ZIMArchive.prototype.loadMathImage = function(hexString, callback) {

    };

    ZIMArchive.prototype.getTitleByName = function(titleName, callback) {
        var that = this;
        util.binarySearch(0, this._file.articleCount, function(i) {
            return that._file.dirEntryByUrlIndex(i).then(function(dirEntry) {
                if (titleName < dirEntry.url)
                    return -1;
                else if (titleName > dirEntry.url)
                    return 1;
                else
                    return 0;
            });
        }).then(function(index) {
            return that._file.dirEntryByUrlIndex(index);
        }).then(function(dirEntry) {
            callback(that._dirEntryToTitleObject(dirEntry));
        });
    };

    ZIMArchive.prototype.getRandomTitle = function(callback) {
        var that = this;
        var index = Math.floor(Math.random() * this._file.articleCount);
        this._file.dirEntryByUrlIndex(index).then(function(dirEntry) {
            return that._dirEntryToTitleObject(dirEntry);
        }).then(callback)
    };

    ZIMArchive.prototype._dirEntryToTitleObject = function(dirEntry) {
        return new zimDirEntry.DirEntry(this._file, dirEntry);
    };

    /**
     * Functions and classes exposed by this module
     */
    return {
        ZIMArchive: ZIMArchive
    };
});
