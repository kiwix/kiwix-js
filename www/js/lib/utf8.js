/**
 * utf8.js : UTF8 conversion functions
 * Original code from http://stackoverflow.com/users/553542/kadm , taken from
 * http://stackoverflow.com/questions/1240408/reading-bytes-from-a-javascript-string
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
define([], function() {

    var utf8 = {};

    /**
     * Convert a String into a byte Array, with UTF8 encoding
     * @param {String} str
     * @returns {Array}
     */
    utf8.toByteArray = function(str) {
        var byteArray = [];
        for (var i = 0; i < str.length; i++)
            if (str.charCodeAt(i) <= 0x7F)
                byteArray.push(str.charCodeAt(i));
            else {
                var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
                for (var j = 0; j < h.length; j++)
                    byteArray.push(parseInt(h[j], 16));
            }
        return byteArray;
    };

    /**
     * Convert a byte Array into a String, with UTF8 encoding
     * @param {Array} byteArray
     * @returns {String}
     */
    utf8.parse = function(byteArray) {
        var str = '';
        for (var i = 0; i < byteArray.length; i++)
            str += byteArray[i] <= 0x7F ?
                    byteArray[i] === 0x25 ? "%25" : // %
                    String.fromCharCode(byteArray[i]) :
                    "%" + byteArray[i].toString(16).toUpperCase();
        return decodeURIComponent(str);
    };

    return {
        toByteArray: utf8.toByteArray,
        parse: utf8.parse
    };
});