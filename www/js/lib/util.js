/**
 * util.js : Utility functions
 * 
 * Copyright 2013-2014 Mossroy and contributors
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
define(['q'], function(q) {

    /**
     * Utility function : return true if the given string ends with the suffix
     * @param {String} str
     * @param {String} suffix
     * @returns {Boolean}
     */
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
    
    /**
     * Returns the same String with the first letter in upper-case
     * @param {String} string
     * @returns {String}
     */
    function ucFirstLetter(string) {
        if (string && string.length >= 1) {
            return string[0].toLocaleUpperCase() + string.slice(1);
        } else {
            return string;
        }
    }
    
    /**
     * Returns the same String with the first letter in lower-case
     * @param {String} string
     * @returns {String}
     */
    function lcFirstLetter(string) {
        if (string) {
            if (string.length >= 1) {
                return string.charAt(0).toLocaleLowerCase() + string.slice(1);
            } else {
                return string;
            }
        } else {
            return string;
        }
    }
    
    /**
     * Returns the same String with the first letter of every word in upper-case
     * @param {String} string
     * @returns {String}
     */
    function ucEveryFirstLetter(string) {
        if (string) {
            return string.replace( /\b\w/g, function (m) {
                return m.toLocaleUpperCase();
            });
        } else {
            return string;
        }
    }
    
    /**
     * Generates an array of DirEntry, where all duplicates (same title) have been removed
     * (it also sorts them on their title)
     * 
     * @param {Array.<DirEntry>} array of DirEntry
     * @returns {Array.<DirEntry>} same array of DirEntry, without duplicates
     */
    function removeDuplicateTitlesInDirEntryArray(array) {
        array.sort(function(dirEntryA, dirEntryB) {
            if (dirEntryA.title < dirEntryB.title) return -1;
            if (dirEntryA.title > dirEntryB.title) return 1;
            return 0;
        });
        for(var i = 1; i < array.length; ){
            if(array[i-1].title === array[i].title){
                array.splice(i, 1);
            } else {
                i++;
            }
        }
        return array;
    }
    
    /**
     * Generates an array of Strings, where all duplicates have been removed
     * (without changing the order)
     * It is optimized for small arrays.
     * Source : http://codereview.stackexchange.com/questions/60128/removing-duplicates-from-an-array-quickly
     * 
     * @param {Array} array of String
     * @returns {Array} same array of Strings, without duplicates
     */
    function removeDuplicateStringsInSmallArray(array) {
        var unique = [];
        for (var i = 0; i < array.length; i++) {
            var current = array[i];
            if (unique.indexOf(current) < 0)
                unique.push(current);
        }
        return unique;
    }
    
    /**
     * Read an integer encoded in 4 bytes, little endian
     * @param {Array} byteArray
     * @param {Integer} firstIndex
     * @returns {Integer}
     */
    function readIntegerFrom4Bytes(byteArray, firstIndex) {
        var dataView = new DataView(byteArray.buffer, firstIndex, 4);
        var integer = dataView.getUint32(0, true);
        return integer;
    }

    /**
     * Read an integer encoded in 2 bytes, little endian
     * @param {Array} byteArray
     * @param {Integer} firstIndex
     * @returns {Integer}
     */
    function readIntegerFrom2Bytes(byteArray, firstIndex) {
        var dataView = new DataView(byteArray.buffer, firstIndex, 2);
        var integer = dataView.getUint16(0, true);
        return integer;
    }
    
    /**
     * Read a float encoded in 2 bytes
     * @param {Array} byteArray
     * @param {Integer} firstIndex
     * @param {Boolean} littleEndian (optional)
     * @returns {Float}
     */
    function readFloatFrom4Bytes(byteArray, firstIndex, littleEndian) {
        var dataView = new DataView(byteArray.buffer, firstIndex, 4);
        var float = dataView.getFloat32(0, littleEndian);
        return float;
    }

    /**
     * Convert a Uint8Array to a lowercase hex string
     * @param {Array} byteArray
     * @returns {String}
     */
    function uint8ArrayToHex(byteArray) {
        var s = '';
        var hexDigits = '0123456789abcdef';
        for (var i = 0; i < byteArray.length; i++) {
            var v = byteArray[i];
            s += hexDigits[(v & 0xff) >> 4];
            s += hexDigits[v & 0xf];
        }
        return s;
    }

    /**
     * Convert a Uint8Array to base64
     * TODO : might be replaced by btoa() built-in function? https://developer.mozilla.org/en-US/docs/Web/API/window.btoa
     * @param {Array} byteArray
     * @returns {String}
     */
    function uint8ArrayToBase64(byteArray) {
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var bits, h1, h2, h3, h4, i = 0;
        var enc = "";

        for (var i = 0; i < byteArray.length; ) {
            bits = byteArray[i++] << 16;
            bits |= byteArray[i++] << 8;
            bits |= byteArray[i++];

            h1 = bits >> 18 & 0x3f;
            h2 = bits >> 12 & 0x3f;
            h3 = bits >> 6 & 0x3f;
            h4 = bits & 0x3f;

            enc += b64[h1] + b64[h2] + b64[h3] + b64[h4];
        }

        var r = byteArray.length % 3;

        return (r > 0 ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    }

    /**
     * Reads a Uint8Array from the given file starting at byte offset begin and
     * for given size.
     * @param {File} file
     * @param {Integer} begin
     * @param {Integer} size
     * @returns {Promise} Promise
     */
    function readFileSlice(file, begin, size) {
        var deferred = q.defer();
        var reader = new FileReader();
        reader.onload = function(e) {
            deferred.resolve(new Uint8Array(e.target.result));
        };
        reader.onerror = reader.onabort = function(e) {
            deferred.reject(e);
        };
        reader.readAsArrayBuffer(file.slice(begin, begin + size));
        return deferred.promise;
    }

    /**
     * Performs a binary search on indices begin <= i < end, utilizing query(i) to return where to
     * continue the search.
     * If lowerBound is not set, returns only indices where query returns 0 and null otherwise.
     * If lowerBound is set, returns the smallest index where query does not return > 0.
     * @param {Integer} begin The beginning of the search window
     * @param {Integer} end The end of the search window
     * @param {Function} query The query to run to test the current point in the window
     * @param {Boolean} lowerBound Determines the type of search
     * @returns {Promise} Promise for the lowest dirEntry that fulfils (or fails to fulfil) the query
     */
    function binarySearch(begin, end, query, lowerBound) {
        if (end <= begin)
            return lowerBound ? begin : null;
        var mid = Math.floor((begin + end) / 2);
        return query(mid).then(function(decision)
        {
            if (decision < 0)
                return binarySearch(begin, mid, query, lowerBound);
            else if (decision > 0)
                return binarySearch(mid + 1, end, query, lowerBound);
            else
                return mid;
        });
    }
    
    /**
     * Converts a Base64 Content to a Blob
     * From https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
     * 
     * @param {String} b64Data Base64-encoded data
     * @param {String} contentType
     * @param {Integer} sliceSize
     * @returns {Blob}
     */
    function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }
    
    /**
     * Converts a UInt Array to a UTF-8 encoded string
     * source : http://michael-rushanan.blogspot.de/2014/03/javascript-uint8array-hacks-and-cheat.html
     * 
     * @param {UIntArray} uintArray
     * @returns {String}
     */
    function uintToString(uintArray) {
        var s = '';
        for (var i = 0; i < uintArray.length; i++) {
            s += String.fromCharCode(uintArray[i]);
        }
        return s;
    }
    
    /**
     * Does a "left shift" on an integer.
     * It is equivalent to int << bits (which works only on 32-bit integers),
     * but compatible with 64-bit integers.
     * 
     * @param {Integer} int
     * @param {Integer} bits
     * @returns {Integer}
     */
    function leftShift(int, bits) {
        return int * Math.pow(2, bits);
    }

    /**
     * Functions and classes exposed by this module
     */
    return {
        endsWith: endsWith,
        ucFirstLetter: ucFirstLetter,
        lcFirstLetter: lcFirstLetter,
        ucEveryFirstLetter: ucEveryFirstLetter,
        removeDuplicateTitlesInDirEntryArray: removeDuplicateTitlesInDirEntryArray,
        removeDuplicateStringsInSmallArray: removeDuplicateStringsInSmallArray,
        readIntegerFrom4Bytes: readIntegerFrom4Bytes,
        readIntegerFrom2Bytes : readIntegerFrom2Bytes,
        readFloatFrom4Bytes : readFloatFrom4Bytes,
        uint8ArrayToHex : uint8ArrayToHex,
        uint8ArrayToBase64 : uint8ArrayToBase64,
        readFileSlice : readFileSlice,
        binarySearch: binarySearch,
        b64toBlob: b64toBlob,
        uintToString: uintToString,
        leftShift: leftShift
    };
});
