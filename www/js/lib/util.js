/**
 * util.js : Utility functions
 *
 * Copyright 2013-2023 Mossroy, Jaifroid and contributors
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

var regExpFindStringParts = /(?:^|.+?)(?:[\s$£€\uFFE5^+=`~<>{}[\]|\u3000-\u303F!-#%-\x2A,-/:;\x3F@\x5B-\x5D_\x7B}\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E3B\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+|$)/g;

/**
 * Generates an array of strings with all possible combinations of first-letter or all-letter case transformations
 * If caseMatchType is not 'full', then only combinations of first-letter cases for each word are calculated
 * If caseMatchType is 'full', then all-uppercase combinations of each word are added to the variations array
 * NB may produce duplicate strings if string begins with punctuation or if it is in a language with no case
 * @param {String} string The string to be converted
 * @param {String} caseMatchType ('basic'|'full') The type (complexity) of case variations to calculate
 * @return {Array} An array containing strings with all possible combinations of case types
 */
function allCaseFirstLetters (string, caseMatchType) {
    if (string) {
        var comboArray = [];
        // Split string into parts beginning with first word letters
        var strParts = string.match(regExpFindStringParts);
        // Prevent a full search if we have more than 6 string parts
        if (strParts.length > 6) caseMatchType = 'basic';
        // Set the base (binary or ternary) according to the complexity of the search
        var base = caseMatchType === 'full' ? 3 : 2;
        // If n = strParts.length, then the number of possible case combinations (numCombos) is base ^ n
        // For *basic* case calculation: think of numCombos as a binary number of n bits, with each bit representing lcase (0) or ucase (1)
        // For *full* case calculation: think of numCombos as a tertiary base number, e.g. 000, 111, 222,
        // with each bit representing all-lowercase (0), First-Letter-Uppercase (1) or ALL-UPPERCASE (2)
        var numCombos = Math.pow(base, strParts.length);
        // Prevent more than 1024 combinations (2^10) being calculated
        if (numCombos > 1024) numCombos = 1024;
        var typeCase, mixedTypeCaseStr, bitmask, caseBit;
        // Iterate through every possible combination, starting with (base ^ n) - 1 and decreasing; we go from high to low,
        // because title case (e.g. binary 1111) is more common than all lowercase (0000) so will be found first
        for (var i = numCombos; i--;) {
            mixedTypeCaseStr = '';
            bitmask = 1;
            for (var j = 0; j < strParts.length; j++) {
                // Get modulus of division (this is equivalent to bitwise AND for different bases)
                // caseBit will be 0, 1 or 2 (latter only for 'full' case calcualation)
                caseBit = ~~(i / bitmask % base);
                if (caseBit === 2) {
                    // All uppercase
                    typeCase = strParts[j].toLocaleUpperCase();
                } else {
                    // Modify only first letter
                    typeCase = strParts[j].replace(/^./, function (m) {
                        // 1 = uppercase, 0 = lowercase
                        return caseBit ? m.toLocaleUpperCase() : m.toLocaleLowerCase();
                    });
                }
                mixedTypeCaseStr += typeCase;
                // Shift bitmask to the next higher bit
                bitmask *= base;
            }
            comboArray.push(mixedTypeCaseStr);
        }
        return comboArray;
    } else {
        return [string];
    }
}

/**
 * Generates an array of Strings, where all duplicates have been removed
 * (without changing the order)
 * It is optimized for small arrays.
 * Source : http://codereview.stackexchange.com/questions/60128/removing-duplicates-from-an-array-quickly
 * @param {Array} array of String
 * @returns {Array} same array of Strings, without duplicates
 */
function removeDuplicateStringsInSmallArray (array) {
    var unique = [];
    for (var i = 0; i < array.length; i++) {
        var current = array[i];
        if (unique.indexOf(current) < 0) {
            unique.push(current);
        }
    }
    return unique;
}

/**
 * Utility function : return true if the given string ends with the suffix
 * @param {String} str
 * @param {String} suffix
 * @returns {Boolean}
 */
function endsWith (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/**
 * Read a float encoded in 2 bytes
 * @param {Array} byteArray
 * @param {Integer} firstIndex
 * @param {Boolean} littleEndian (optional)
 * @returns {Float}
 */
function readFloatFrom4Bytes (byteArray, firstIndex, littleEndian) {
    var dataView = new DataView(byteArray.buffer, firstIndex, 4);
    var float = dataView.getFloat32(0, littleEndian);
    return float;
}

/**
 * Reads a Uint8Array from the given file starting at byte offset begin until end
 * @param {File} file The file object to be read
 * @param {Integer} begin The offset in <File> at which to begin reading
 * @param {Integer} end The byte at whcih to stop reading (reads up to and including end - 1)
 * @returns {Promise<Uint8Array>} A Promise for an array buffer with the read data
 */
function readFileSlice (file, begin, end) {
    if (file.slice && 'arrayBuffer' in Blob.prototype) {
        // DEV: This method uses the native arrayBuffer method of Blob, if available, as it eliminates
        // the need to use FileReader and set up event listeners; it also uses the method's native Promise
        // rather than setting up potentially hundreds of new Q promises for small byte range reads
        // Also uses Native FS handle
        return file.slice(begin, end).arrayBuffer().then(function (buffer) {
            return new Uint8Array(buffer);
        });
    } else {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.readAsArrayBuffer(file.slice(begin, end));
            reader.addEventListener('load', function (e) {
                resolve(new Uint8Array(e.target.result));
            });
            reader.addEventListener('error', reject);
            reader.addEventListener('abort', reject);
        });
    }
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
function binarySearch (begin, end, query, lowerBound) {
    if (end <= begin) {
        return lowerBound ? begin : null;
    }
    var mid = Math.floor((begin + end) / 2);
    return query(mid).then(function (decision) {
        if (decision < 0) {
            return binarySearch(begin, mid, query, lowerBound);
        } else if (decision > 0) {
            return binarySearch(mid + 1, end, query, lowerBound);
        } else {
            return mid;
        }
    });
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
function leftShift (int, bits) {
    return int * Math.pow(2, bits);
}

/**
 * Converts base 64 code to Uint6
 * From https://developer.mozilla.org/en-US/docs/Glossary/Base64
 * @param {Integer} nChr Numerical character code
 * @returns {Integer} Converted character code
 */
function b64ToUint6 (nChr) {
    return nChr > 64 && nChr < 91
        ? nChr - 65
        : nChr > 96 && nChr < 123
        ? nChr - 71
        : nChr > 47 && nChr < 58
        ? nChr + 4
        : nChr === 43
        ? 62
        : nChr === 47
        ? 63
        : 0;
}

/**
 * Recommended rewrite of the faulty .btoa() function in JavaScript because of the problem with UTF-8-encoded data
 * From https://developer.mozilla.org/en-US/docs/Glossary/Base64
 * @param {String} sBase64 Base 64 encoded string
 * @param {Integer} nBlocksSize Optional block size
 * @returns {Uint8Array} A Uint8Array containing the converted data
 */
function base64DecToArr (sBase64, nBlocksSize) {
    var sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, ''),
        nInLen = sB64Enc.length,
        nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2,
        taBytes = new Uint8Array(nOutLen);
    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
            for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
            }
            nUint24 = 0;
        }
    }
    return taBytes;
}

/**
 Converts a dataURI to Uint8Array
 * @param {String} dataURI The data URI to convert
 * @returns {Uint8Array} A Uint8Array with the converted buffer
 */
function dataURItoUint8Array (dataURI) {
    var parsedString = dataURI.match(/^data:([^,]*),(.*)/i);
    if (parsedString && /base64/i.test(parsedString[1])) {
        return base64DecToArr(parsedString[2]);
    } else {
        var byteString = decodeURI(parsedString[2]);
        var ab = [];
        for (var i = 0; i < byteString.length; i++) {
            ab[i] = byteString.charCodeAt(i);
        }
        return new Uint8Array(ab);
    }
}

/**
 * Queues Promise Factories* to be resolved or rejected sequentially. This helps to avoid overlapping Promise functions.
 * Primarily used by uiUtil.systemAlert, to prevent alerts showing while others are being displayed.
 *
 *   *A Promise Factory is merely a Promise wrapped in a function to prevent it from executing immediately. E.g. to use
 *   this function with a Promise, call it like this (or, more likely, use your own pre-wrapped Promise):
 *
 *      return util.PromiseQueue.enqueue(function () {
 *          return new Promise(function (resolve, reject) { ... });
 *      });
 *
 * Adapted from https://medium.com/@karenmarkosyan/how-to-manage-promises-into-dynamic-queue-with-vanilla-javascript-9d0d1f8d4df5
 *
 * @type {Object} PromiseQueue
 * @property {Function} enqueue Queues a Promise Factory. Call this function repeatedly to queue Promises sequentially
 * @param {Function<Promise>} promiseFactory A Promise wrapped in an ordinary function
 * @returns {Promise} A Promise that resolves or rejects with the resolved/rejected value of the Promise Factory
 */
var PromiseQueue = {
    _queue: [],
    _working: false,
    enqueue: function (promiseFactory) {
        var that = this;
        return new Promise(function (resolve, reject) {
            // Don't allow more than four dialogues to queue up
            if (that._queue.length >= 4) reject(new Error('PromiseQueue: queue length exceeded'));
            else that._queue.push({ promise: promiseFactory, resolve: resolve, reject: reject });
            if (!that._working) that._dequeue();
        });
    },
    _dequeue: function () {
        this._working = true;
        var deferred = this._queue.shift();
        if (!deferred) {
            this._working = false;
            return false;
        }
        var that = this;
        return deferred.promise().then(function (val) {
            deferred.resolve(val);
            return that._dequeue();
        }).catch(function (err) {
            deferred.reject(err);
            return that._dequeue();
        });
    }
};

/**
 * Get Promise for a JSON object from a given JSONP URL (a JSON-formatted script with a function that returns the JSON object)
 *
 * @param {string} url The URL (JSONP file) from which to get the JSON object
 * @returns {Promise<Object>} A Promise that will be resolved when the JSON object has been loaded, or rejected with the error message
 */
function getJSONPObject (url) {
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.onload = function () {
            resolve(document.localeJson);
            // Remove the objects from the DOM to avoid memory leaks
            delete document.localeJson;
            document.body.removeChild(script);
        };
        script.onerror = function () {
            reject(new Error('Cannot load translation strings from ' + url));
            document.body.removeChild(script);
        };
        script.src = url;
        document.body.appendChild(script);
    });
}

export default {
    allCaseFirstLetters: allCaseFirstLetters,
    removeDuplicateStringsInSmallArray: removeDuplicateStringsInSmallArray,
    dataURItoUint8Array: dataURItoUint8Array,
    endsWith: endsWith,
    readFloatFrom4Bytes: readFloatFrom4Bytes,
    readFileSlice: readFileSlice,
    binarySearch: binarySearch,
    leftShift: leftShift,
    PromiseQueue: PromiseQueue,
    getJSONPObject: getJSONPObject
};
