/**
 * zimfile.js: Low-level ZIM file reader.
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
define(['xzdec_wrapper', 'util', 'utf8', 'q', 'zimDirEntry'], function(xz, util, utf8, Q, zimDirEntry) {

    var readInt = function(data, offset, size)
    {
        var r = 0;
        for (var i = 0; i < size; i++)
        {
            var c = (data[offset + i] + 256) & 0xff;
            r += util.leftShift(c, 8 * i);
        }
        return r;
    };
                
    /**
     * A ZIM File
     * 
     * See https://wiki.openzim.org/wiki/ZIM_file_format#Header
     * 
     * @typedef ZIMFile
     * @property {Array.<File>} _files Array of ZIM files
     * @property {Integer} articleCount total number of articles
     * @property {Integer} clusterCount total number of clusters
     * @property {Integer} urlPtrPos position of the directory pointerlist ordered by URL
     * @property {Integer} titlePtrPos position of the directory pointerlist ordered by title
     * @property {Integer} clusterPtrPos position of the cluster pointer list
     * @property {Integer} mimeListPos position of the MIME type list (also header size)
     * @property {Integer} mainPage main page or 0xffffffff if no main page
     * @property {Integer} layoutPage layout page or 0xffffffffff if no layout page
     * 
     */
    
    /**
     * @param {Array.<File>} abstractFileArray
     */
    function ZIMFile(abstractFileArray)
    {
        this._files = abstractFileArray;
    }

    /**
     * 
     * @param {Integer} offset
     * @param {Integer} size
     * @returns {Integer}
     */
    ZIMFile.prototype._readInteger = function(offset, size)
    {
        return this._readSlice(offset, size).then(function(data)
        {
            return readInt(data, 0, size);
        });
    };

    /**
     * 
     * @param {Integer} offset
     * @param {Integer} size
     * @returns {Promise}
     */
    ZIMFile.prototype._readSlice = function(offset, size)
    {
        var readRequests = [];
        var currentOffset = 0;
        for (var i = 0; i < this._files.length; currentOffset += this._files[i].size, ++i) {
            var currentSize = this._files[i].size;
            if (offset < currentOffset + currentSize && currentOffset < offset + size) {
                var readStart = Math.max(0, offset - currentOffset);
                var readSize = Math.min(currentSize, offset + size - currentOffset - readStart);
                readRequests.push(util.readFileSlice(this._files[i], readStart, readSize));
            }
        }
        if (readRequests.length == 0) {
            return Q(new Uint8Array(0).buffer);
        } else if (readRequests.length == 1) {
            return readRequests[0];
        } else {
            // Wait until all are resolved and concatenate.
            console.log("CONCAT");
            return Q.all(readRequests).then(function(arrays) {
                var concatenated = new Uint8Array(size);
                var sizeSum = 0;
                for (var i = 0; i < arrays.length; ++i) {
                    concatenated.set(new Uint8Array(arrays[i]), sizeSum);
                    sizeSum += arrays[i].byteLength;
                }
                return concatenated;
            });
        }
    };

    /**
     * 
     * @param {Integer} offset
     * @returns {DirEntry} DirEntry
     */
    ZIMFile.prototype.dirEntry = function(offset)
    {
        var that = this;
        return this._readSlice(offset, 2048).then(function(data)
        {
            var dirEntry =
            {
                offset: offset,
                mimetype: readInt(data, 0, 2),
                namespace: String.fromCharCode(data[3])
            };
            dirEntry.redirect = (dirEntry.mimetype === 0xffff);
            if (dirEntry.redirect)
                dirEntry.redirectTarget = readInt(data, 8, 4);
            else
            {
                dirEntry.cluster = readInt(data, 8, 4);
                dirEntry.blob = readInt(data, 12, 4);
            }
            var pos = dirEntry.redirect ? 12 : 16;
            if (data.subarray) {
                dirEntry.url = utf8.parse(data.subarray(pos), true);
                while (data[pos] !== 0)
                    pos++;
                dirEntry.title = utf8.parse(data.subarray(pos + 1), true);
                return new zimDirEntry.DirEntry(that, dirEntry);
            }
        });
    };

    /**
     * 
     * @param {Integer} index
     * @returns {DirEntry} DirEntry
     */
    ZIMFile.prototype.dirEntryByUrlIndex = function(index)
    {
        var that = this;
        return this._readInteger(this.urlPtrPos + index * 8, 8).then(function(dirEntryPos)
        {
            return that.dirEntry(dirEntryPos);
        });
    };

    /**
     * 
     * @param {Integer} index
     * @returns {DirEntry} DirEntry
     */
    ZIMFile.prototype.dirEntryByTitleIndex = function(index)
    {
        var that = this;
        return this._readInteger(this.titlePtrPos + index * 4, 4).then(function(urlIndex)
        {
            return that.dirEntryByUrlIndex(urlIndex);
        });
    };

    /**
     * 
     * @param {Integer} cluster
     * @param {Integer} blob
     * @returns {String}
     */
    ZIMFile.prototype.blob = function(cluster, blob)
    {
        var that = this;
        return this._readSlice(this.clusterPtrPos + cluster * 8, 16).then(function(clusterOffsets)
        {
            var clusterOffset = readInt(clusterOffsets, 0, 8);
            var nextCluster = readInt(clusterOffsets, 8, 8);
            return that._readSlice(clusterOffset, 1).then(function(compressionType) {
                var decompressor;
                var plainBlobReader = function(offset, size) {
                    return that._readSlice(clusterOffset + 1 + offset, size);
                };
                if (compressionType[0] === 0 || compressionType[0] === 1) {
                    // uncompressed
                    decompressor = { readSliceSingleThread: plainBlobReader };
                } else if (compressionType[0] === 4) {
                    decompressor = new xz.Decompressor(plainBlobReader);
                } else {
                    return new Uint8Array(); // unsupported compression type
                }
                return decompressor.readSliceSingleThread(blob * 4, 8).then(function(data) {
                    var blobOffset = readInt(data, 0, 4);
                    var nextBlobOffset = readInt(data, 4, 4);
                    return decompressor.readSliceSingleThread(blobOffset, nextBlobOffset - blobOffset);
                });
            });
        });
    };

    return {
        /**
         * 
         * @param {Array.<File>} fileArray
         * @returns {Promise}
         */
        fromFileArray: function(fileArray) {
            // Array of blob objects should be sorted by their name property
            fileArray.sort(function(a, b) {
                  var nameA = a.name.toUpperCase(); 
                  var nameB = b.name.toUpperCase(); 
                  if (nameA < nameB) {
                    return -1;
                  }
                  if (nameA > nameB) {
                    return 1;
                  }
                  return 0;
            });
            return util.readFileSlice(fileArray[0], 0, 80).then(function(header)
            {
                var zf = new ZIMFile(fileArray);
                zf.articleCount = readInt(header, 24, 4);
                zf.clusterCount = readInt(header, 28, 4);
                zf.urlPtrPos = readInt(header, 32, 8);
                zf.titlePtrPos = readInt(header, 40, 8);
                zf.clusterPtrPos = readInt(header, 48, 8);
                zf.mimeListPos = readInt(header, 56, 8);
                zf.mainPage = readInt(header, 64, 4);
                zf.layoutPage = readInt(header, 68, 4);
                return zf;
            });
        }
    };
});
