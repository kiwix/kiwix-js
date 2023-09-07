/**
 * zimDirEntry.js: Container to hold data of a ZIM directory entry.
 *
 * Copyright 2015 Mossroy and contributors
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

function DirEntry (zimfile, dirEntryData) {
    this._zimfile = zimfile;
    this.redirect = dirEntryData.redirect;
    this.offset = dirEntryData.offset;
    this.mimetypeInteger = dirEntryData.mimetypeInteger;
    this.namespace = dirEntryData.namespace;
    this.redirectTarget = dirEntryData.redirectTarget;
    this.cluster = dirEntryData.cluster;
    this.blob = dirEntryData.blob;
    this.url = dirEntryData.url;
    this.title = dirEntryData.title;
}

/**
 * Serialize some attributes of a DirEntry, to be able to store them in a HTML tag attribute,
 * and retrieve them later.
 *
 * @returns {String}
 */
DirEntry.prototype.toStringId = function () {
    // @todo also store isRedirect and redirectTarget
    return this.offset + '|' + this.mimetypeInteger + '|' + this.namespace + '|' + this.cluster + '|' +
            this.blob + '|' + this.url + '|' + this.title + '|' + this.redirect + '|' + this.redirectTarget;
};

/**
 *
 * @returns {Boolean}
 */
DirEntry.prototype.isRedirect = function () {
    return this.redirect;
};

/**
 *
 * @returns {Promise}
 */
DirEntry.prototype.readData = function () {
    return this._zimfile.blob(this.cluster, this.blob);
};

/**
 *
 * @param {File} zimfile
 * @param {String} stringId
 * @returns {DirEntry}
 */
DirEntry.fromStringId = function (zimfile, stringId) {
    var data = {};
    var idParts = stringId.split('|');
    data.offset = parseInt(idParts[0], 10);
    data.mimetypeInteger = parseInt(idParts[1], 10);
    data.namespace = idParts[2];
    data.cluster = parseInt(idParts[3], 10);
    data.blob = parseInt(idParts[4], 10);
    data.url = idParts[5];
    data.title = idParts[6];
    data.redirect = (idParts[7] === 'true');
    data.redirectTarget = idParts[8];
    return new DirEntry(zimfile, data);
};

/**
 * Defines a function that returns the URL if the title is empty, as per the specification
 * See https://wiki.openzim.org/wiki/ZIM_file_format#Directory_Entries
 *
 * @returns {String} The dirEntry's title or, if empty, the dirEntry's (unescaped) URL
 */
DirEntry.prototype.getTitleOrUrl = function () {
    return this.title ? this.title : this.url;
};

/**
 * Looks up the dirEntry's mimetype number in the ZIM file's MIME type list, and returns the corresponding MIME type
 *
 * @return {String} The MIME type corresponding to mimetypeInteger in the ZIM file's MIME type list
 */
DirEntry.prototype.getMimetype = function () {
    return this._zimfile.mimeTypes.get(this.mimetypeInteger);
};

export default {
    DirEntry: DirEntry
};
