/**
 * zimDirEntry.js: Container to hold data of a ZIM directory entry.
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
define([], function() {
    
    /**
     * A Directory Entry in a ZIM File
     * 
     * See https://wiki.openzim.org/wiki/ZIM_file_format#Directory_Entries
     * 
     * @typedef DirEntry
     * @property {File} _zimfile The ZIM file
     * @property {Boolean} redirect
     * @property {Integer} offset
     * @property {Integer} mimetype MIME type number as defined in the MIME type list
     * @property {String} namespace defines to which namespace this directory entry belongs 
     * @property {Integer} redirectTarget
     * @property {Integer} cluster cluster number in which the data of this directory entry is stored 
     * @property {Integer} blob blob number inside the compressed cluster where the contents are stored 
     * @property {String} url string with the URL as refered in the URL pointer list
     * @property {String} title string with a title as refered in the Title pointer list (or empty)
     * 
     */
    
    /**
     * @param {File} zimfile
     * @param {unresolved} dirEntryData
     */    
    function DirEntry(zimfile, dirEntryData) {
        this._zimfile = zimfile;
        this.redirect = dirEntryData.redirect;
        this.offset = dirEntryData.offset;
        this.mimetype = dirEntryData.mimetype;
        this.namespace = dirEntryData.namespace;
        this.redirectTarget = dirEntryData.redirectTarget;
        this.cluster = dirEntryData.cluster;
        this.blob = dirEntryData.blob;
        this.url = dirEntryData.url;
        this.title = dirEntryData.title;
    };

    /**
     * Serialize some attributes of a DirEntry, to be able to store them in a HTML tag attribute,
     * and retrieve them later.
     * 
     * @returns {String}
     */
    DirEntry.prototype.toStringId = function() {
        //@todo also store isRedirect and redirectTarget
        return this.offset + '|' + this.mimetype + '|' + this.namespace + '|' + this.cluster + '|' +
                this.blob + '|' + this.url + '|' + this.title + '|' + this.redirect + '|' + this.redirectTarget;
    };
    
    /**
     * 
     * @returns {Boolean}
     */
    DirEntry.prototype.isRedirect = function() {
        return this.redirect;
    };
    
    /**
     * 
     * @returns {Promise}
     */
    DirEntry.prototype.readData = function() {
        return this._zimfile.blob(this.cluster, this.blob);
    };

    /**
     * 
     * @param {File} zimfile
     * @param {String} stringId
     * @returns {DirEntry}
     */
    DirEntry.fromStringId = function(zimfile, stringId) {
        var data = {};
        var idParts = stringId.split("|");
        data.offset = parseInt(idParts[0], 10);
        data.mimetype = parseInt(idParts[1], 10);
        data.namespace = idParts[2];
        data.cluster = parseInt(idParts[3], 10);
        data.blob = parseInt(idParts[4], 10);
        data.url = idParts[5];
        data.title = idParts[6];
        data.redirect = ( idParts[7] === "true" );
        data.redirectTarget = idParts[8];
        return new DirEntry(zimfile, data);
    };

    /**
     * Functions and classes exposed by this module
     */
    return {
        DirEntry: DirEntry
    };
});
