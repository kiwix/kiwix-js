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
define(['zimfile', 'zimDirEntry', 'util', 'utf8'],
    function(zimfile, zimDirEntry, util, utf8) {
    
    /**
     * ZIM Archive
     * 
     * 
     * @typedef ZIMArchive
     * @property {ZIMFile} _file The ZIM file
     * @property {String} _language Language of the content
     */
    
    /**
     * @callback callbackZIMArchive
     * @param {ZIMArchive} zimArchive Ready-to-use ZIMArchive
     */
    
    
    /**
     * Creates a ZIM archive object to access the ZIM file at the given path in the given storage.
     * This constructor can also be used with a single File parameter.
     * 
     * @param {StorageFirefoxOS|StoragePhoneGap|Blob} storage Storage (in this case, the path must be given) or File (path must be omitted)
     * @param {String} path
     * @param {callbackZIMArchive} callbackReady
     */
    function ZIMArchive(storage, path, callbackReady) {
        var that = this;
        that._file = null;
        that._language = ""; //@TODO
        if (storage && storage instanceof Blob && !path) {
            // The constructor has been called with a single File/Blob parameter
            zimfile.fromFile(storage).then(function(file) {
                that._file = file;
                callbackReady(that);
            });
        }
        else {
            console.log(storage);
            storage.get(path).then(function(file) {
                return zimfile.fromFile(file).then(function(file) {
                    that._file = file;
                    callbackReady(that);
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
        util.binarySearch(0, this._file.articleCount, function(i) {
            return that._file.dirEntryByTitleIndex(i).then(function(dirEntry) {
                if (dirEntry.title === "")
                    return -1; // ZIM sorts empty titles (assets) to the end
                else if (dirEntry.namespace < "A")
                    return 1;
                else if (dirEntry.namespace > "A")
                    return -1;
                return prefix <= dirEntry.title ? -1 : 1;
            });
        }, true).then(function(firstIndex) {
            var titles = [];
            var addTitles = function(index) {
                if (index >= firstIndex + resultSize || index >= that._file.articleCount)
                    return titles;
                return that._file.dirEntryByTitleIndex(index).then(function(dirEntry) {
                    if (dirEntry.title.slice(0, prefix.length) === prefix && dirEntry.namespace === "A")
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
            callback(title.name(), utf8.parse(data));
        });
    };

    /**
     * @callback callbackBinaryContent
     * @param {Uint8Array} content binary content
     */

    /**
     * Read a binary file.
     * @param {DirEntry} title
     * @param {callbackBinaryContent} callback
     */
    ZIMArchive.prototype.readBinaryFile = function(title, callback) {
        return title.readData().then(function(data) {
            callback(title.name(), data);
        });
    };
    
    var regexpTitleNameWithoutNameSpace = /^[^\/]+$/;

    /**
     * Searches a title (article / page) by name.
     * @param {String} titleName
     * @return {Promise} resolving to the title object or null if not found.
     */
    ZIMArchive.prototype.getTitleByName = function(titleName) {
        var that = this;
        // If no namespace is mentioned, it's an article, and we have to add it
        if (regexpTitleNameWithoutNameSpace.test(titleName)) {
            titleName= "A/" + titleName;
        }
        return util.binarySearch(0, this._file.articleCount, function(i) {
            return that._file.dirEntryByUrlIndex(i).then(function(dirEntry) {
                var url = dirEntry.namespace + "/" + dirEntry.url;
                if (titleName < url)
                    return -1;
                else if (titleName > url)
                    return 1;
                else
                    return 0;
            });
        }).then(function(index) {
            if (index === null) return null;
            return that._file.dirEntryByUrlIndex(index);
        }).then(function(dirEntry) {
            if (dirEntry === null)
                return null;
            else
                return that._dirEntryToTitleObject(dirEntry);
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
