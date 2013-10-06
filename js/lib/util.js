/**
 * util.js : Utility functions
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

    /**
     * Utility function : return true if the given string ends with the suffix
     * @param str
     * @param suffix
     * @returns {Boolean}
     */
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
    
        /**
     * Read an integer encoded in 4 bytes
     * @param {type} byteArray
     * @param {type} firstIndex
     * @returns {Number}
     */
    function readIntegerFrom4Bytes(byteArray, firstIndex) {
        return byteArray[firstIndex] + byteArray[firstIndex + 1] * 256 + byteArray[firstIndex + 2] * 65536 + byteArray[firstIndex + 3] * 16777216;
    }

    /**
     * Read an integer encoded in 2 bytes
     * @param {type} byteArray
     * @param {type} firstIndex
     * @returns {Number}
     */
    function readIntegerFrom2Bytes(byteArray, firstIndex) {
        return byteArray[firstIndex] + byteArray[firstIndex + 1] * 256;
    }

    /**
     * Convert a Uint8Array to a lowercase hex string
     * @param {type} byteArray
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
     * @param {type} byteArray
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
     * This function emulates a "composite" storage enumeration
     * (i.e. returns files from all the storage areas)
     * This is needed since the removal of composite storage :
     * see https://bugzilla.mozilla.org/show_bug.cgi?id=885753
     * 
     * This code was copied (with only slight modifications) from Gaia source code :
     * https://bug893282.bugzilla.mozilla.org/attachment.cgi?id=785076
     * 
     * @param {type} storages List of DeviceStorage instances
     * @returns {_L22.enumerateAll.cursor} Cursor of files found in device storages
     */
    function enumerateAll(storages) {
        var storageIndex = 0;
        var ds_cursor = null;

        var cursor = {
            continue: function cursor_continue() {
                ds_cursor.continue();
            }
        };

        function enumerateNextStorage() {
            ds_cursor = storages[storageIndex].enumerate();
            ds_cursor.onsuccess = onsuccess;
            ds_cursor.onerror = onerror;
        };

        function onsuccess(e) {
            cursor.result = e.target.result;
            if (!cursor.result) {
                storageIndex++;
                if (storageIndex < storages.length) {
                    enumerateNextStorage();
                    return;
                }
                // If we've run out of storages, then we fall through and call
                // onsuccess with the null result.
            }
            if (cursor.onsuccess) {
                try {
                    cursor.onsuccess(e);
                } catch (err) {
                    console.warn('enumerateAll onsuccess threw', err);
                }
            }
        };

        function onerror(e) {
            cursor.error = e.target.error;
            if (cursor.onerror) {
                try {
                    cursor.onerror(e);
                } catch (err) {
                    console.warn('enumerateAll onerror threw', err);
                }
            }
        };

        enumerateNextStorage();
        return cursor;
    }
    
    
    
    /**
     * Functions and classes exposed by this module
     */
    return {
        endsWith: endsWith,
        readIntegerFrom4Bytes: readIntegerFrom4Bytes,
        readIntegerFrom2Bytes : readIntegerFrom2Bytes,
        uint8ArrayToHex : uint8ArrayToHex,
        uint8ArrayToBase64 : uint8ArrayToBase64,
        enumerateAll : enumerateAll
    };
});