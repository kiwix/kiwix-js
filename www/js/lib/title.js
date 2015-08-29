/**
 * title.js : Class for the title of an article
 * 
 * Copyright 2013-2014 Mossroy and contributors
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
define(['utf8', 'util'], function(utf8, util) {
       
    /**
     * Title class : defines the title of an article and some methods to manipulate it
     * 
     * @typedef Title
     * @property {String} _name Name of the title
     * @property {Integer} _fileNr Number of the archive file
     * @property {Integer} _blockStart
     * @property {Integer} _blockOffset
     * @property {Integer} _articleLength Length of the article
     * @property {LocalArchive} _archive Archive where the Title is
     * @property {Integer} _titleOffset
     * @property {Integer} _titleEntryLength
     * @property {point} _geolocation
     */
    function Title() {
        this._name = null;
        this._fileNr = null;
        this._blockStart = null;
        this._blockOffset = null;
        this._articleLength = null;
        this._archive = null;
        this._titleOffset = null;
        this._titleEntryLength = null;
        this._geolocation = null;
    };

    /**
     * Replaces underscores by spaces, to get a readable name
     * @returns {String}
     */
    Title.prototype.getReadableName = function() {
        return this._name.replace(/_/g, " ");
    };


    /**
     * Creates a Title instance from an encoded title line from a title file
     * @param {String} encodedTitle
     * @param {LocalArchive} archive
     * @param {Integer} titleOffset
     * @returns {Title}
     */
    Title.parseTitle = function(encodedTitle, archive, titleOffset) {
        if (archive === null) {
            throw new Error("Error while parsing an encoded title line un title File : archive cannot be null");
        }
        if (titleOffset < 0) {
            throw new Error("Error while parsing an encoded title line un title File : titleOffset cannot be negative (was " + titleOffset + ")");
        }
        var t = new Title();
        t._archive = archive;
        t._titleOffset = titleOffset;

        if (encodedTitle === null || encodedTitle.length < 15)
            return null;

        if (encodedTitle[encodedTitle.length - 1] === '\n') {
            t._titleEntryLength = encodedTitle.length;
        } else {
            t._titleEntryLength = encodedTitle.length + 1;
        }

        var escapedEncodedTitle = new Uint8Array(encodedTitle);
        var escapes = util.readIntegerFrom2Bytes(encodedTitle, 0);
        if ((escapes & (1 << 14)) != 0)
            escapes |= 10;
        for (var i = 0; i < 13; i++) {
            if ((escapes & (1 << i)) != 0)
                escapedEncodedTitle[i + 2] = 10; // Corresponds to \n
        }

        t._fileNr = 1 * escapedEncodedTitle[2];
        t._blockStart = util.readIntegerFrom4Bytes(escapedEncodedTitle, 3);
        t._blockOffset = util.readIntegerFrom4Bytes(escapedEncodedTitle, 7);
        t._articleLength = util.readIntegerFrom4Bytes(escapedEncodedTitle, 11);

        t._name = Title.parseNameOnly(escapedEncodedTitle);

        return t;
    };

    /*
     * Retrieves the name of an article from an encoded title line
     * @param {String} encodedTitle
     * @return {String} Name of the title
     */
    Title.parseNameOnly = function(encodedTitle) {
        var len = encodedTitle.length;
        if (len < 15) {
            return null;
        }
        if (len > 15 && encodedTitle[len - 1] === '\n') {
            len--;
        }
        return utf8.parse(encodedTitle.subarray(15, len));
    };

    /**
     * Creates a title instance from a serialized id
     * @param {LocalArchive} localArchive
     * @param {String} titleId
     * @returns {Title}
     */
    Title.parseTitleId = function(localArchive, titleId) {
        var title = new Title();
        var idParts = titleId.split("|");
        title._archive = localArchive;
        title._fileNr = parseInt(idParts[2], 10);
        title._titleOffset = parseInt(idParts[3], 10);
        title._name = idParts[4];
        title._blockStart = parseInt(idParts[5], 10);
        title._blockOffset = parseInt(idParts[6], 10);
        title._articleLength = parseInt(idParts[7], 10);
        return title;
    };

    /**
     * Name of the title
     * @returns {String}
     */
    Title.prototype.name = function() {
        return this._name;
    };
    
    /**
     * Is this title a redirection?
     * @returns {Boolean}
     */
    Title.prototype.isRedirect = function() {
        return this._fileNr === 0xff;
    };

    /**
     * Serialize the title with its values
     * @returns {String}
     */
    Title.prototype.toStringId = function() {
        return this._archive._language + "|" + this._archive.date + "|" + this._fileNr + "|"
                + this._titleOffset + "|" + this._name + "|" + this._blockStart + "|" + this._blockOffset + "|" + this._articleLength;
    };

    /**
     * Serialize the title in a readable way
     * @returns {String}
     */
    Title.prototype.toString = function() {
        return "title.id = " + this.toStringId() + " title.name = " + this._name + " title.fileNr = " + this._fileNr + " title.blockStart = " + this._blockStart + " title.blockOffset = " + this._blockOffset + " title.articleLength = " + this._articleLength;
    };
    
    /**
     * Functions and classes exposed by this module
     */
    return {
        Title: Title
    };
});
