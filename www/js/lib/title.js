/**
 * title.js : Class for the title of an article
 * 
 * Copyright 2013 Mossroy
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
define(function(require) {
    
    // Module dependencies
    var utf8 = require('utf8');
    var util = require('util');
    
    /**
     * Title class : defines the title of an article and some methods to manipulate it
     */
    function Title() {
        this.name = null;
        this.fileNr = null;
        this.blockStart = null;
        this.blockOffset = null;
        this.articleLength = null;
        this.archive = null;
        this.titleOffset = null;
        this.titleEntryLength = null;
    }
    ;

    Title.prototype.getReadableName = function() {
        return this.name.replace(/_/g, " ");
    };


    /**
     * Creates a Title instance from an encoded title line from a title file
     * @param {type} encodedTitle
     * @param {type} archive
     * @param {type} titleOffset
     * @returns {_L1.Title}
     */
    Title.parseTitle = function(encodedTitle, archive, titleOffset) {
        if (archive === null) {
            throw new Error("Error while parsing an encoded title line un title File : archive cannot be null");
        }
        if (titleOffset < 0) {
            throw new Error("Error while parsing an encoded title line un title File : titleOffset cannot be negative (was " + titleOffset + ")");
        }
        var t = new Title();
        t.archive = archive;
        t.titleOffset = titleOffset;

        if (encodedTitle === null || encodedTitle.length < 15)
            return null;

        if (encodedTitle[encodedTitle.length - 1] == '\n') {
            t.titleEntryLength = encodedTitle.length;
        } else {
            t.titleEntryLength = encodedTitle.length + 1;
        }

        var escapedEncodedTitle = new Uint8Array(encodedTitle);
        var escapes = util.readIntegerFrom2Bytes(encodedTitle, 0);
        if ((escapes & (1 << 14)) != 0)
            escapes |= 10;
        for (var i = 0; i < 13; i++) {
            if ((escapes & (1 << i)) != 0)
                escapedEncodedTitle[i + 2] = 10; // Corresponds to \n
        }

        t.fileNr = 1 * escapedEncodedTitle[2];
        t.blockStart = util.readIntegerFrom4Bytes(escapedEncodedTitle, 3);
        t.blockOffset = util.readIntegerFrom4Bytes(escapedEncodedTitle, 7);
        t.articleLength = util.readIntegerFrom4Bytes(escapedEncodedTitle, 11);

        t.name = Title.parseNameOnly(escapedEncodedTitle);

        return t;
    };

    /*
     * Retrieves the name of an article from an encoded title line
     */
    Title.parseNameOnly = function(encodedTitle) {
        var len = encodedTitle.length;
        if (len < 15) {
            return null;
        }
        if (len > 15 && encodedTitle[len - 1] == '\n') {
            len--;
        }
        return utf8.parse(encodedTitle.subarray(15, len));
    };

    /**
     * Creates a title instance from a serialized id
     * @param {type} localArchive
     * @param {type} titleId
     * @returns {_L1.Title}
     */
    Title.parseTitleId = function(localArchive, titleId) {
        var title = new Title();
        var idParts = titleId.split("|");
        title.archive = localArchive;
        title.fileNr = parseInt(idParts[2], 10);
        title.titleOffset = parseInt(idParts[3], 10);
        title.name = idParts[4];
        title.blockStart = parseInt(idParts[5], 10);
        title.blockOffset = parseInt(idParts[6], 10);
        title.articleLength = parseInt(idParts[7], 10);
        return title;
    };


    /**
     * Serialize the title with its values
     * @returns {String}
     */
    Title.prototype.toStringId = function() {
        return this.archive.language + "|" + this.archive.date + "|" + this.fileNr + "|"
                + this.titleOffset + "|" + this.name + "|" + this.blockStart + "|" + this.blockOffset + "|" + this.articleLength;
    };

    /**
     * Serialize the title in a readable way
     */
    Title.prototype.toString = function() {
        return "title.id = " + this.toStringId() + "title.name = " + this.name + " title.fileNr = " + this.fileNr + " title.blockStart = " + this.blockStart + " title.blockOffset = " + this.blockOffset + " title.articleLength = " + this.articleLength;
    };
    
    /**
     * Functions and classes exposed by this module
     */
    return {
        Title: Title
    };
});
