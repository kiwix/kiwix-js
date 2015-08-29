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
define(['zimfile', 'zimDirEntry', 'util', 'normalize_string'],
    function(zimfile, zimDirEntry, util, normalize_string) {
    
    /**
     * ZIM Archive
     * 
     * 
     * @typedef ZIMArchive
     * @property {ZIMFile} _file The ZIM file
     * @property {String} _language Language of the content
     */
    
    
    /**
     * Creates a ZIM archive object to access the ZIM file at the given path in the given storage.
     * This constructor can also be used with a single File parameter.
     * 
     * @param {StorageFirefoxOS|StoragePhoneGap|File} storage Storage (in this case, the path must be given) or File (path must be omitted)
     * @param {String} path
     */
    function ZIMArchive(storage, path) {
        var that = this;
        that._file = null;
        that._language = ""; //@TODO
        if (storage && storage instanceof File && !path) {
            // The constructor has been called with a single File parameter
            zimfile.fromFile(storage).then(function(file) {
                that._file = file;
            });
        }
        else {
            storage.get(path).then(function(file) {
                return zimfile.fromFile(file).then(function(file) {
                    that._file = file;
                });
            }, function(error) {
                alert("Error reading ZIM file " + path + ": " + error);
            });
        }
    };

    /**
     * 
     * @returns {Boolean}
     */
    ZIMArchive.prototype.isReady = function() {
        return this._file !== null;
    };
    
    /**
     * 
     * @returns {Boolean}
     */
    ZIMArchive.prototype.needsWikimediaCSS = function() {
        return false;
    };

    /**
     * 
     * @returns {Boolean}
     */
    ZIMArchive.prototype.hasCoordinates = function() {
        return false;
    };

    /**
     * 
     * @param {String} titleId
     * @returns {DirEntry}
     */
    ZIMArchive.prototype.parseTitleId = function(titleId) {
        return zimDirEntry.DirEntry.fromStringId(this._file, titleId);
    };
    
    /**
     * @callback callbackTitleList
     * @param {Array.<Title>} titleArray Array of Titles found
     */

    /**
     * 
     * @param {String} prefix
     * @param {Integer} resultSize
     * @param {type} callback
     * @returns {callbackTitleList}
     */
    ZIMArchive.prototype.findTitlesWithPrefix = function(prefix, resultSize, callback) {
        var that = this;
        prefix = normalize_string.normalizeString(prefix);
        util.binarySearch(0, this._file.articleCount, function(i) {
            return that._file.dirEntryByTitleIndex(i).then(function(dirEntry) {
                return prefix < normalize_string.normalizeString(dirEntry.title) ? -1 : 1;
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

    /**
     * 
     * @param {rect} rectangle
     * @param {Integer} resultSize
     * @param {callbackTitleList} callback
     */
    ZIMArchive.prototype.getTitlesInCoords = function(rectangle, resultSize, callback) {
        callback([]);
    };
    
    /**
     * @callback callbackTitle
     * @param {Title} title Title found
     */

    /**
     * 
     * @param {DirEntry} title
     * @param {callbackTitle} callback
     */
    ZIMArchive.prototype.resolveRedirect = function(title, callback) {
        var that = this;
        this._file.dirEntryByTitleIndex(title.redirectTarget).then(function(dirEntry) {
            return that._dirEntryToTitleObject(dirEntry);
        }).then(callback);
    };
    
    /**
     * @callback callbackStringContent
     * @param {String} content String content
     */
    
    /**
     * 
     * @param {DirEntry} title
     * @param {callbackStringContent} callback
     */
    ZIMArchive.prototype.readArticle = function(title, callback) {
        return title.readData().then(function(data) {
            callback(title.name(), data);
        });
    };

    /**
     * 
     * @param {String} titleName
     * @param {callbackTitle} callback
     */
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

    /**
     * 
     * @param {callbackTitle} callback
     */
    ZIMArchive.prototype.getRandomTitle = function(callback) {
        var that = this;
        var index = Math.floor(Math.random() * this._file.articleCount);
        this._file.dirEntryByUrlIndex(index).then(function(dirEntry) {
            return that._dirEntryToTitleObject(dirEntry);
        }).then(callback)
    };

    /**
     * 
     * @param dirEntry
     * @returns {DirEntry}
     */
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
