/**
 * titleIterators.js : Various classes to iterate over titles, for example as a
 * result of searching.
 * 
 * Copyright 2014 Evopedia developers
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
define(['utf8', 'title', 'util', 'q'], function(utf8, evopediaTitle, util, q) {
    // Maximum length of a title
    // 300 bytes is arbitrary : we actually do not really know how long the titles will be
    // But mediawiki titles seem to be limited to ~200 bytes, so 300 should be more than enough
    var MAX_TITLE_LENGTH = 300;
    
    /**
     * Iterates over all titles starting at the given offset.
     * The asynchronous method advance has to be called before this.title is
     * valid.
     * 
     * @typedef SequentialTitleIterator
     * @property {File} _titleFile Title File
     * @property {LocalArchive} _archive Archive
     * @property {Integer} _offset
     * @property {Title} _title
     * 
     * @param {LocalArchive} archive
     * @param {Integer} offset
     */
    function SequentialTitleIterator(archive, offset) {
        this._titleFile = archive._titleFile;
        this._archive = archive;
        this._offset = offset;
        this._title = null;
    };
    /**
     * Advances to the next title (or the first), if possible.
     * @returns {Promise} Promise containing the next title or null if there is no
     * next title
     */
    SequentialTitleIterator.prototype.advance = function() {
        if (this._offset >= this._titleFile.size) {
            this._title = null;
            return q.when(this._title);
        }
        var that = this;
        return util.readFileSlice(this._titleFile, this._offset,
                                  MAX_TITLE_LENGTH).then(function(byteArray) {
            var newLineIndex = 15;
            while (newLineIndex < byteArray.length && byteArray[newLineIndex] !== 10) {
                newLineIndex++;
            }
            var encodedTitle = byteArray.subarray(0, newLineIndex);
            that._title = evopediaTitle.Title.parseTitle(encodedTitle, that._archive, that._offset);
            that._offset += newLineIndex + 1;
            return that._title;
        });
    };

    /**
     * Searches for the offset into the given title file where the first title
     * with the given prefix (or lexicographically larger) is located.
     * The given function normalize is applied to every title before comparison.
     * @param {File} titleFile
     * @param {String} prefix
     * @param normalize function to be applied to every title before comparison
     * @returns Promise giving the offset
     */
    function findPrefixOffset(titleFile, prefix, normalize) {
        prefix = normalize(prefix);
        var lo = 0;
        var hi = titleFile.size;
        var iterate = function() {
            if (lo >= hi - 1) {
                if (lo > 0)
                    lo += 2; // Let lo point to the start of an entry
                return q.when(lo);
            } else {
                var mid = Math.floor((lo + hi) / 2);
                return util.readFileSlice(titleFile, mid, MAX_TITLE_LENGTH).then(function(byteArray) {
                    // Look for the index of the next NewLine
                    var newLineIndex = 0;
                    while (newLineIndex < byteArray.length && byteArray[newLineIndex] !== 10) {
                        newLineIndex++;
                    }
                    var startIndex = 0;
                    if (mid > 0) {
                        startIndex = newLineIndex + 16;
                        newLineIndex = startIndex;
                        // Look for the index of the next NewLine	
                        while (newLineIndex < byteArray.length && byteArray[newLineIndex] !== 10) {
                            newLineIndex++;
                        }
                    }
                    if (newLineIndex === startIndex) {
                        // End of file reached
                        hi = mid;
                    } else {
                        var normalizedTitle = normalize(utf8.parse(byteArray.subarray(startIndex, newLineIndex)));
                        if (normalizedTitle < prefix) {
                            lo = mid + newLineIndex - 1;
                        } else {
                            hi = mid;
                        }
                    }
                    return iterate();
                });
            }
        };
        return iterate();
    }

    /**
     * Functions and classes exposed by this module
     */
    return {
        SequentialTitleIterator : SequentialTitleIterator,
        findPrefixOffset : findPrefixOffset,
        MAX_TITLE_LENGTH : MAX_TITLE_LENGTH
    };
});
