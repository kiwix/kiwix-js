/**
 * utf8.js : UTF8 conversion functions
 * Original code from http://stackoverflow.com/users/553542/kadm , taken from
 * http://stackoverflow.com/questions/1240408/reading-bytes-from-a-javascript-string
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
     * @param {Array} data
     * @param {Boolean} zeroTerminated
     * @returns {String}
     */
    utf8.parse = function(data, zeroTerminated)
    {
        var u0, u1, u2, u3, u4, u5;

        var str = '';
        for (var idx = 0; idx < data.length; ) {
            u0 = data[idx++];
            if (u0 === 0 && zeroTerminated)
                break;
            if (!(u0 & 0x80))
            {
                str += String.fromCharCode(u0);
                continue;
            }
            u1 = data[idx++] & 63;
            if ((u0 & 0xe0) == 0xc0)
            {
                str += String.fromCharCode(((u0 & 31) << 6) | u1);
                continue;
            }
            u2 = data[idx++] & 63;
            if ((u0 & 0xf0) == 0xe0)
                u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
            else
            {
                u3 = data[idx++] & 63;
                if ((u0 & 0xF8) == 0xF0)
                    u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
                else
                {
                    u4 = data[idx++] & 63;
                    if ((u0 & 0xFC) == 0xF8)
                        u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
                    else
                    {
                        u5 = data[idx++] & 63;
                        u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
                    }
                }
            }
            if (u0 < 0x10000)
                str += String.fromCharCode(u0);
            else
            {
                var ch = u0 - 0x10000;
                str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
            }
        }
        return str;
    };

    return {
        toByteArray: utf8.toByteArray,
        parse: utf8.parse
    };
});
