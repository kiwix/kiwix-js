/**
 * zimArchive.js: Support for archives in ZIM format.
 *
 * Copyright 2015 Mossroy and contributors
 * License GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */
'use strict';
define(['zimfile', 'zimDirEntry', 'util', 'utf8'],
    function(zimfile, zimDirEntry, util, utf8) {
    
    /**
     * ZIM Archive
     * 
     * 
     * @typedef ZIMArchive
     * @property {ZIMFile} _file The ZIM file (instance of ZIMFile, that might physically be split into several actual files)
     * @property {String} _language Language of the content
     */
    
    /**
     * @callback callbackZIMArchive
     * @param {ZIMArchive} zimArchive Ready-to-use ZIMArchive
     */
    
    /**
     * @callback callbackMetadata
     * @param {String} data metadata string
     */
    
    /**
     * Creates a ZIM archive object to access the ZIM file at the given path in the given storage.
     * This constructor can also be used with a single File parameter.
     * 
     * @param {StorageFirefoxOS|Array.<Blob>} storage Storage (in this case, the path must be given) or Array of Files (path parameter must be omitted)
     * @param {String} path
     * @param {callbackZIMArchive} callbackReady
     */
    function ZIMArchive(storage, path, callbackReady) {
        var that = this;
        that._file = null;
        that._language = ""; //@TODO
        var createZimfile = function(fileArray) {
            zimfile.fromFileArray(fileArray).then(function(file) {
                that._file = file;
                callbackReady(that);
            });
        };
        if (storage && !path) {
            var fileList = storage;
            // We need to convert the FileList into an Array
            var fileArray = [].slice.call(fileList);
            // The constructor has been called with an array of File/Blob parameter
            createZimfile(fileArray);
        }
        else {
            if (/.*zim..$/.test(path)) {
                // split archive
                that._searchArchiveParts(storage, path.slice(0, -2)).then(function(fileArray) {
                    createZimfile(fileArray);
                }, function(error) {
                    alert("Error reading files in split archive " + path + ": " + error);
                });
            }
            else {
                storage.get(path).then(function(file) {
                    createZimfile([file]);
                }, function(error) {
                    alert("Error reading ZIM file " + path + " : " + error);
                });
            }
        }
    }

    /**
     * Searches the directory for all parts of a split archive.
     * @param {Storage} storage storage interface
     * @param {String} prefixPath path to the split files, missing the "aa" / "ab" / ... suffix.
     * @returns {Promise} that resolves to the array of file objects found.
     */
    ZIMArchive.prototype._searchArchiveParts = function(storage, prefixPath) {
        var fileArray = [];
        var nextFile = function(part) {
            var suffix = String.fromCharCode(0x61 + Math.floor(part / 26)) + String.fromCharCode(0x61 + part % 26);
            return storage.get(prefixPath + suffix)
                .then(function(file) {
                    fileArray.push(file);
                    return nextFile(part + 1);
                }, function(error) {
                    return fileArray;
                });
        };
        return nextFile(0);
    };

    /**
     * 
     * @returns {Boolean}
     */
    ZIMArchive.prototype.isReady = function() {
        return this._file !== null;
    };
    
    /**
     * Looks for the DirEntry of the main page
     * @param {callbackDirEntry} callback
     * @returns {Promise} that resolves to the DirEntry
     */
    ZIMArchive.prototype.getMainPageDirEntry = function(callback) {
        if (this.isReady()) {
            var mainPageUrlIndex = this._file.mainPage;
            this._file.dirEntryByUrlIndex(mainPageUrlIndex).then(callback);
        }
    };

    /**
     * 
     * @param {String} dirEntryId
     * @returns {DirEntry}
     */
    ZIMArchive.prototype.parseDirEntryId = function(dirEntryId) {
        return zimDirEntry.DirEntry.fromStringId(this._file, dirEntryId);
    };
    
    /**
     * @callback callbackDirEntryList
     * @param {Array.<DirEntry>} dirEntryArray Array of DirEntries found
     */

    /**
     * Look for DirEntries with title starting with the prefix of the current search object.
     * For now, ZIM titles are case sensitive.
     * So, as workaround, we try several variants of the prefix to find more results.
     * This should be enhanced when the ZIM format will be modified to store normalized titles
     * See https://phabricator.wikimedia.org/T108536
     * 
     * @param {Object} search The current globalstate.search object
     * @param {Integer} resultSize The number of dirEntries to find
     * @param {callbackDirEntryList} callback The function to call with the result
     * @param {Boolean} noInterim A flag to prevent callback until all results are ready (used in testing) 
     */
    ZIMArchive.prototype.findDirEntriesWithPrefix = function (search, resultSize, callback, noInterim) {
        // Create a local invariable copy of the search prefix
        const localPrefix = search.prefix;
        var that = this;
        // Establish array of initial values that must be searched first. All of these patterns are generated by the full
        // search type, and some by basic, but we need the most common patterns to be searched first, as it returns search
        // results much more quickly if we do this (and the user can click on a result before the rarer patterns complete)
        // NB duplicates are removed before processing search array
        var startArray = [];
        // Ensure a search is done on the string exactly as typed
        startArray.push(localPrefix);
        // Normalize any spacing and make string all lowercase
        var prefix = localPrefix.replace(/\s+/g, ' ').toLocaleLowerCase();
        // Add lowercase string with initial uppercase (this is a very common pattern)
        startArray.push(prefix.replace(/^./, function (m) {
            return m.toLocaleUpperCase();
        }));
        // Get the full array of combinations to check number of combinations
        var fullCombos = util.removeDuplicateStringsInSmallArray(util.allCaseFirstLetters(prefix, 'full'));
        // Put cap on exponential number of combinations (five words = 3^5 = 243 combinations)
        search.type = fullCombos.length < 200 ? 'full' : 'basic';
        // We have to remove duplicate string combinations because util.allCaseFirstLetters() can return some combinations
        // where uppercase and lowercase combinations are exactly the same, e.g. where prefix begins with punctuation
        // or currency signs, for languages without case, or where user-entered case duplicates calculated case
        var prefixVariants = util.removeDuplicateStringsInSmallArray(
            startArray.concat(
                // Get basic combinations first for speed of returning results
                util.allCaseFirstLetters(prefix).concat(
                    search.type === 'full' ? fullCombos : []
                )
            )
        );
        var dirEntries = [];

        function searchNextVariant() {
            // If user has initiated a new search, cancel this one
            if (search.status === 'cancelled' || search.prefix !== localPrefix) return callback([], localPrefix);
            if (prefixVariants.length === 0 || dirEntries.length >= resultSize) {
                search.status = 'complete';
                return callback(dirEntries, localPrefix);
            }
            // Dynamically populate list of articles
            search.status = 'interim';
            if (!noInterim) callback(dirEntries, localPrefix);
            var prefix = prefixVariants[0];
            prefixVariants = prefixVariants.slice(1);
            that.findDirEntriesWithPrefixCaseSensitive(prefix, resultSize - dirEntries.length, localPrefix, search,
                function (newDirEntries, interim) {
                    if (search.status === 'cancelled' || search.prefix !== localPrefix) return callback([], localPrefix);
                    if (interim) {// Only push interim results (else results will be pushed again at end of variant loop)                    
                        [].push.apply(dirEntries, newDirEntries);
                        if (!noInterim && newDirEntries.length) callback(dirEntries, localPrefix);
                    } else searchNextVariant();
                }
            );
        }
        searchNextVariant();
    };
    
    /**
     * Look for dirEntries with title starting with the given prefix (case-sensitive)
     * 
     * @param {String} prefix The case-sensitive value against which dirEntry titles (or url) will be compared
     * @param {Integer} resultSize The maximum number of results to return
     * @param {String} originalPrefix The original prefix typed by the user to initiate the local search 
     * @param {Object} search The globalstate.search object (for comparison, so that we can cancel long binary searches)
     * @param {callbackDirEntryList} callback The function to call with the array of dirEntries with titles that begin with prefix
     */
    ZIMArchive.prototype.findDirEntriesWithPrefixCaseSensitive = function(prefix, resultSize, originalPrefix, search, callback) {
        var that = this;
        util.binarySearch(0, this._file.articleCount, function(i) {
            return that._file.dirEntryByTitleIndex(i).then(function(dirEntry) {
                if (dirEntry.namespace < 'A') return 1;
                if (dirEntry.namespace > 'A') return -1;
                // We should now be in namespace A
                return prefix <= dirEntry.getTitleOrUrl() ? -1 : 1;
            });
        }, true).then(function(firstIndex) {
            var dirEntries = [];
            var addDirEntries = function(index) {
                if (search.status === 'cancelled' || search.prefix !== originalPrefix || index >= firstIndex + resultSize || index >= that._file.articleCount)
                    return dirEntries;
                return that._file.dirEntryByTitleIndex(index).then(function(dirEntry) {
                    var title = dirEntry.getTitleOrUrl();
                    // Only return dirEntries with titles that actually begin with prefix
                    if (dirEntry.namespace === 'A' && title.indexOf(prefix) === 0) {
                        dirEntries.push(dirEntry);
                        // Report interim result
                        callback([dirEntry], true);
                    }
                    return addDirEntries(index + 1);
                });
            };
            return addDirEntries(firstIndex);
        }).then(callback);
    };
    
    /**
     * @callback callbackDirEntry
     * @param {DirEntry} dirEntry The DirEntry found
     */

    /**
     * 
     * @param {DirEntry} dirEntry
     * @param {callbackDirEntry} callback
     */
    ZIMArchive.prototype.resolveRedirect = function(dirEntry, callback) {
        this._file.dirEntryByUrlIndex(dirEntry.redirectTarget).then(callback);
    };
    
    /**
     * @callback callbackStringContent
     * @param {String} content String content
     */
    
    /**
     * 
     * @param {DirEntry} dirEntry
     * @param {callbackStringContent} callback
     */
    ZIMArchive.prototype.readUtf8File = function(dirEntry, callback) {
        dirEntry.readData().then(function(data) {
            callback(dirEntry, utf8.parse(data));
        });
    };

    /**
     * @callback callbackBinaryContent
     * @param {Uint8Array} content binary content
     */

    /**
     * Read a binary file.
     * @param {DirEntry} dirEntry
     * @param {callbackBinaryContent} callback
     */
    ZIMArchive.prototype.readBinaryFile = function(dirEntry, callback) {
        return dirEntry.readData().then(function(data) {
            callback(dirEntry, data);
        });
    };

    /**
     * Searches a DirEntry (article / page) by its title.
     * @param {String} title
     * @return {Promise} resolving to the DirEntry object or null if not found.
     */
    ZIMArchive.prototype.getDirEntryByTitle = function(title) {
        var that = this;
        return util.binarySearch(0, this._file.articleCount, function(i) {
            return that._file.dirEntryByUrlIndex(i).then(function(dirEntry) {
                var url = dirEntry.namespace + "/" + dirEntry.url;
                if (title < url)
                    return -1;
                else if (title > url)
                    return 1;
                else
                    return 0;
            });
        }).then(function(index) {
            if (index === null) return null;
            return that._file.dirEntryByUrlIndex(index);
        }).then(function(dirEntry) {
            return dirEntry;
        });
    };

    /**
     * 
     * @param {callbackDirEntry} callback
     */
    ZIMArchive.prototype.getRandomDirEntry = function(callback) {
        var index = Math.floor(Math.random() * this._file.articleCount);
        this._file.dirEntryByUrlIndex(index).then(callback);
    };
    
    /**
     * Read a Metadata string inside the ZIM file.
     * @param {String} key
     * @param {callbackMetadata} callback
     */
    ZIMArchive.prototype.getMetadata = function (key, callback) {
        var that = this;
        this.getDirEntryByTitle("M/" + key).then(function (dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                console.warn("Title M/" + key + " not found in the archive");
                callback();
            } else {
                that.readUtf8File(dirEntry, function (dirEntryRead, data) {
                    callback(data);
                });
            }
        }).catch(function (e) {
            console.warn("Metadata with key " + key + " not found in the archive", e);
            callback();
        });
    };

    /**
     * Functions and classes exposed by this module
     */
    return {
        ZIMArchive: ZIMArchive
    };
});
