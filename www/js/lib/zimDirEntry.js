/**
 * zimDirEntry.js: Container to hold data of a ZIM directory entry.
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
define([], function() {
    function DirEntry(zimfile, dirEntryData) {
        this._zimfile = zimfile;
        this.redirect = dirEntryData.isRedirect;
        this.offset = dirEntryData.offset;
        this.mimetype = dirEntryData.mimetype;
        this.namespace = dirEntryData.namespace;
        this.redirectTarget = dirEntryData.redirectTarget;
        this.cluster = dirEntryData.cluster;
        this.blob = dirEntryData.blob;
        this.url = dirEntryData.url;
        this.title = dirEntryData.title;
    };

    DirEntry.prototype.toStringId = function() {
        //@todo also store isRedirect and redirectTarget
        return this.offset + '|' + this.mimetype + '|' + this.namespace + '|' + this.cluster + '|' +
                this.blob + '|' + this.url + '|' + this.title;
    };
    DirEntry.prototype.getReadableName = function() {
        return this.title;
    };
    DirEntry.prototype.name = function() {
        return this.title;
    };
    DirEntry.prototype.isRedirect = function() {
        return this.redirect;
    };
    DirEntry.prototype.readData = function() {
        return this._zimfile.blob(this.cluster, this.blob);
    };

    DirEntry.fromStringId = function(zimfile, stringId) {
        //@todo also use isRedirect and redirectTarget
        var data = {};
        var idParts = stringId.split("|");
        data.offset = parseInt(idParts[0], 10);
        data.mimetype = parseInt(idParts[1], 10);
        data.namespace = idParts[2];
        data.cluster = parseInt(idParts[3], 10);
        data.blob = parseInt(idParts[4], 10);
        data.url = idParts[5];
        data.title = idParts[6];
        return new DirEntry(zimfile, data);
    };

    /**
     * Functions and classes exposed by this module
     */
    return {
        DirEntry: DirEntry
    };
});
