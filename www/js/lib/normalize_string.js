/**
 * normalize_string.js : Normalize a string in the same way the titles are normalized in an archive
 * This is necessary to search for titles in an archive
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
    
    // Algorithm copied from original application :
    // https://github.com/evopedia/evopedia_qt/blob/master/src/localarchive.cpp
    
    var nm = new Object();
    nm['Ḅ'] = 'b'; nm['Ć'] = 'c'; nm['Ȍ'] = 'o'; nm['ẏ'] = 'y'; nm['Ḕ'] = 'e'; nm['Ė'] = 'e';
    nm['ơ'] = 'o'; nm['Ḥ'] = 'h'; nm['Ȭ'] = 'o'; nm['ắ'] = 'a'; nm['Ḵ'] = 'k'; nm['Ķ'] = 'k';
    nm['ế'] = 'e'; nm['Ṅ'] = 'n'; nm['ņ'] = 'n'; nm['Ë'] = 'e'; nm['ỏ'] = 'o'; nm['Ǒ'] = 'o';
    nm['Ṕ'] = 'p'; nm['Ŗ'] = 'r'; nm['Û'] = 'u'; nm['ở'] = 'o'; nm['ǡ'] = 'a'; nm['Ṥ'] = 's';
    nm['ë'] = 'e'; nm['ữ'] = 'u'; nm['p'] = 'p'; nm['Ṵ'] = 'u'; nm['Ŷ'] = 'y'; nm['û'] = 'u';
    nm['ā'] = 'a'; nm['Ẅ'] = 'w'; nm['ȇ'] = 'e'; nm['ḏ'] = 'd'; nm['ȗ'] = 'u'; nm['ḟ'] = 'f';
    nm['ġ'] = 'g'; nm['Ấ'] = 'a'; nm['ȧ'] = 'a'; nm['ḯ'] = 'i'; nm['Ẵ'] = 'a'; nm['ḿ'] = 'm';
    nm['À'] = 'a'; nm['Ễ'] = 'e'; nm['ṏ'] = 'o'; nm['ő'] = 'o'; nm['Ổ'] = 'o'; nm['ǖ'] = 'u';
    nm['ṟ'] = 'r'; nm['š'] = 's'; nm['à'] = 'a'; nm['Ụ'] = 'u'; nm['Ǧ'] = 'g'; nm['k'] = 'k';
    nm['ṯ'] = 't'; nm['ű'] = 'u'; nm['Ỵ'] = 'y'; nm['ṿ'] = 'v'; nm['Ā'] = 'a'; nm['Ȃ'] = 'a';
    nm['ẅ'] = 'w'; nm['Ḋ'] = 'd'; nm['Ȓ'] = 'r'; nm['Ḛ'] = 'e'; nm['Ġ'] = 'g'; nm['ấ'] = 'a';
    nm['Ḫ'] = 'h'; nm['İ'] = 'i'; nm['Ȳ'] = 'y'; nm['ẵ'] = 'a'; nm['Ḻ'] = 'l'; nm['Á'] = 'a';
    nm['ễ'] = 'e'; nm['Ṋ'] = 'n'; nm['Ñ'] = 'n'; nm['Ő'] = 'o'; nm['ổ'] = 'o'; nm['Ǜ'] = 'u';
    nm['Ṛ'] = 'r'; nm['á'] = 'a'; nm['Š'] = 's'; nm['ụ'] = 'u'; nm['f'] = 'f'; nm['ǫ'] = 'o';
    nm['Ṫ'] = 't'; nm['ñ'] = 'n'; nm['Ű'] = 'u'; nm['ỵ'] = 'y'; nm['v'] = 'v'; nm['ǻ'] = 'a';
    nm['Ṻ'] = 'u'; nm['ḅ'] = 'b'; nm['ċ'] = 'c'; nm['Ẋ'] = 'x'; nm['ȍ'] = 'o'; nm['ḕ'] = 'e';
    nm['ě'] = 'e'; nm['Ơ'] = 'o'; nm['ḥ'] = 'h'; nm['ī'] = 'i'; nm['Ẫ'] = 'a'; nm['ȭ'] = 'o';
    nm['ư'] = 'u'; nm['ḵ'] = 'k'; nm['Ļ'] = 'l'; nm['Ẻ'] = 'e'; nm['ṅ'] = 'n'; nm['Ị'] = 'i';
    nm['ǐ'] = 'i'; nm['ṕ'] = 'p'; nm['Ö'] = 'o'; nm['ś'] = 's'; nm['Ớ'] = 'o'; nm['a'] = 'a';
    nm['Ǡ'] = 'a'; nm['ṥ'] = 's'; nm['ū'] = 'u'; nm['Ừ'] = 'u'; nm['q'] = 'q'; nm['ǰ'] = 'j';
    nm['ṵ'] = 'u'; nm['ö'] = 'o'; nm['Ż'] = 'z'; nm['Ȁ'] = 'a'; nm['ẃ'] = 'w'; nm['Ă'] = 'a';
    nm['Ḉ'] = 'c'; nm['Ȑ'] = 'r'; nm['Ē'] = 'e'; nm['Ḙ'] = 'e'; nm['ả'] = 'a'; nm['Ģ'] = 'g';
    nm['Ḩ'] = 'h'; nm['Ȱ'] = 'o'; nm['ẳ'] = 'a'; nm['Ḹ'] = 'l'; nm['ể'] = 'e'; nm['Ç'] = 'c';
    nm['Ṉ'] = 'n'; nm['Ǎ'] = 'a'; nm['ồ'] = 'o'; nm['Ṙ'] = 'r'; nm['ợ'] = 'o'; nm['Ţ'] = 't';
    nm['ç'] = 'c'; nm['Ṩ'] = 's'; nm['ǭ'] = 'o'; nm['l'] = 'l'; nm['ỳ'] = 'y'; nm['Ų'] = 'u';
    nm['Ṹ'] = 'u'; nm['ḃ'] = 'b'; nm['Ẉ'] = 'w'; nm['ȋ'] = 'i'; nm['č'] = 'c'; nm['ḓ'] = 'd';
    nm['ẘ'] = 'w'; nm['ț'] = 't'; nm['ĝ'] = 'g'; nm['ḣ'] = 'h'; nm['Ẩ'] = 'a'; nm['ȫ'] = 'o';
    nm['ĭ'] = 'i'; nm['ḳ'] = 'k'; nm['Ẹ'] = 'e'; nm['Ľ'] = 'l'; nm['ṃ'] = 'm'; nm['Ỉ'] = 'i';
    nm['ō'] = 'o'; nm['Ì'] = 'i'; nm['ṓ'] = 'o'; nm['ǒ'] = 'o'; nm['Ộ'] = 'o'; nm['ŝ'] = 's';
    nm['Ü'] = 'u'; nm['ṣ'] = 's'; nm['g'] = 'g'; nm['Ứ'] = 'u'; nm['ŭ'] = 'u'; nm['ì'] = 'i';
    nm['ṳ'] = 'u'; nm['w'] = 'w'; nm['Ỹ'] = 'y'; nm['Ž'] = 'z'; nm['ü'] = 'u'; nm['Ȇ'] = 'e';
    nm['ẉ'] = 'w'; nm['Č'] = 'c'; nm['Ḏ'] = 'd'; nm['Ȗ'] = 'u'; nm['ẙ'] = 'y'; nm['Ĝ'] = 'g';
    nm['Ḟ'] = 'f'; nm['Ȧ'] = 'a'; nm['ẩ'] = 'a'; nm['Ĭ'] = 'i'; nm['Ḯ'] = 'i'; nm['ẹ'] = 'e';
    nm['ļ'] = 'l'; nm['Ḿ'] = 'm'; nm['ỉ'] = 'i'; nm['Í'] = 'i'; nm['Ō'] = 'o'; nm['Ṏ'] = 'o';
    nm['Ǘ'] = 'u'; nm['ộ'] = 'o'; nm['Ý'] = 'y'; nm['Ŝ'] = 's'; nm['Ṟ'] = 'r'; nm['b'] = 'b';
    nm['ǧ'] = 'g'; nm['ứ'] = 'u'; nm['í'] = 'i'; nm['Ŭ'] = 'u'; nm['Ṯ'] = 't'; nm['r'] = 'r';
    nm['ỹ'] = 'y'; nm['ý'] = 'y'; nm['ż'] = 'z'; nm['Ṿ'] = 'v'; nm['ȁ'] = 'a'; nm['ć'] = 'c';
    nm['ḉ'] = 'c'; nm['Ẏ'] = 'y'; nm['ȑ'] = 'r'; nm['ė'] = 'e'; nm['ḙ'] = 'e'; nm['ḩ'] = 'h';
    nm['Ắ'] = 'a'; nm['ȱ'] = 'o'; nm['ķ'] = 'k'; nm['ḹ'] = 'l'; nm['Ế'] = 'e'; nm['Â'] = 'a';
    nm['Ň'] = 'n'; nm['ṉ'] = 'n'; nm['Ỏ'] = 'o'; nm['Ò'] = 'o'; nm['ŗ'] = 'r'; nm['ṙ'] = 'r';
    nm['ǜ'] = 'u'; nm['Ở'] = 'o'; nm['â'] = 'a'; nm['ṩ'] = 's'; nm['m'] = 'm'; nm['Ǭ'] = 'o';
    nm['Ữ'] = 'u'; nm['ò'] = 'o'; nm['ŷ'] = 'y'; nm['ṹ'] = 'u'; nm['Ȅ'] = 'e'; nm['ẇ'] = 'w';
    nm['Ḍ'] = 'd'; nm['Ď'] = 'd'; nm['Ȕ'] = 'u'; nm['ẗ'] = 't'; nm['Ḝ'] = 'e'; nm['Ğ'] = 'g';
    nm['ầ'] = 'a'; nm['Ḭ'] = 'i'; nm['Į'] = 'i'; nm['ặ'] = 'a'; nm['Ḽ'] = 'l'; nm['ľ'] = 'l';
    nm['Ã'] = 'a'; nm['ệ'] = 'e'; nm['Ṍ'] = 'o'; nm['Ŏ'] = 'o'; nm['Ó'] = 'o'; nm['ỗ'] = 'o';
    nm['Ǚ'] = 'u'; nm['Ṝ'] = 'r'; nm['Ş'] = 's'; nm['ã'] = 'a'; nm['ủ'] = 'u'; nm['ǩ'] = 'k';
    nm['h'] = 'h'; nm['Ṭ'] = 't'; nm['Ů'] = 'u'; nm['ó'] = 'o'; nm['ỷ'] = 'y'; nm['ǹ'] = 'n';
    nm['x'] = 'x'; nm['Ṽ'] = 'v'; nm['ž'] = 'z'; nm['ḇ'] = 'b'; nm['ĉ'] = 'c'; nm['Ẍ'] = 'x';
    nm['ȏ'] = 'o'; nm['ḗ'] = 'e'; nm['ę'] = 'e'; nm['ȟ'] = 'h'; nm['ḧ'] = 'h'; nm['ĩ'] = 'i';
    nm['Ậ'] = 'a'; nm['ȯ'] = 'o'; nm['ḷ'] = 'l'; nm['Ĺ'] = 'l'; nm['Ẽ'] = 'e'; nm['ṇ'] = 'n';
    nm['È'] = 'e'; nm['Ọ'] = 'o'; nm['ǎ'] = 'a'; nm['ṗ'] = 'p'; nm['ř'] = 'r'; nm['Ờ'] = 'o';
    nm['Ǟ'] = 'a'; nm['c'] = 'c'; nm['ṧ'] = 's'; nm['ũ'] = 'u'; nm['è'] = 'e'; nm['Ử'] = 'u';
    nm['s'] = 's'; nm['ṷ'] = 'u'; nm['Ź'] = 'z'; nm['Ḃ'] = 'b'; nm['Ĉ'] = 'c'; nm['Ȋ'] = 'i';
    nm['ẍ'] = 'x'; nm['Ḓ'] = 'd'; nm['Ę'] = 'e'; nm['Ț'] = 't'; nm['쎟'] = 's'; nm['Ḣ'] = 'h';
    nm['Ĩ'] = 'i'; nm['Ȫ'] = 'o'; nm['ậ'] = 'a'; nm['Ḳ'] = 'k'; nm['ẽ'] = 'e'; nm['Ṃ'] = 'm';
    nm['É'] = 'e'; nm['ň'] = 'n'; nm['ọ'] = 'o'; nm['Ǔ'] = 'u'; nm['Ṓ'] = 'o'; nm['Ù'] = 'u';
    nm['Ř'] = 'r'; nm['ờ'] = 'o'; nm['Ṣ'] = 's'; nm['é'] = 'e'; nm['Ũ'] = 'u'; nm['ử'] = 'u';
    nm['n'] = 'n'; nm['Ṳ'] = 'u'; nm['ù'] = 'u'; nm['Ÿ'] = 'y'; nm['ă'] = 'a'; nm['Ẃ'] = 'w';
    nm['ȅ'] = 'e'; nm['ḍ'] = 'd'; nm['ē'] = 'e'; nm['ȕ'] = 'u'; nm['ḝ'] = 'e'; nm['ģ'] = 'g';
    nm['Ả'] = 'a'; nm['ḭ'] = 'i'; nm['Ẳ'] = 'a'; nm['ḽ'] = 'l'; nm['Ń'] = 'n'; nm['Ể'] = 'e';
    nm['ṍ'] = 'o'; nm['Î'] = 'i'; nm['Ồ'] = 'o'; nm['ǘ'] = 'u'; nm['ṝ'] = 'r'; nm['ţ'] = 't';
    nm['Ợ'] = 'o'; nm['i'] = 'i'; nm['Ǩ'] = 'k'; nm['ṭ'] = 't'; nm['î'] = 'i'; nm['ų'] = 'u';
    nm['Ỳ'] = 'y'; nm['y'] = 'y'; nm['Ǹ'] = 'n'; nm['ṽ'] = 'v'; nm['Ḁ'] = 'a'; nm['Ȉ'] = 'i';
    nm['ẋ'] = 'x'; nm['Ċ'] = 'c'; nm['Ḑ'] = 'd'; nm['Ș'] = 's'; nm['Ě'] = 'e'; nm['Ḡ'] = 'g';
    nm['Ȩ'] = 'e'; nm['ẫ'] = 'a'; nm['Ī'] = 'i'; nm['Ḱ'] = 'k'; nm['ẻ'] = 'e'; nm['ĺ'] = 'l';
    nm['Ṁ'] = 'm'; nm['ị'] = 'i'; nm['Ï'] = 'i'; nm['Ṑ'] = 'o'; nm['Ǖ'] = 'u'; nm['ớ'] = 'o';
    nm['Ś'] = 's'; nm['ß'] = 's'; nm['Ṡ'] = 's'; nm['d'] = 'd'; nm['ừ'] = 'u'; nm['Ū'] = 'u';
    nm['ï'] = 'i'; nm['Ṱ'] = 't'; nm['ǵ'] = 'g'; nm['t'] = 't'; nm['ź'] = 'z'; nm['ÿ'] = 'y';
    nm['Ẁ'] = 'w'; nm['ȃ'] = 'a'; nm['ą'] = 'a'; nm['ḋ'] = 'd'; nm['ȓ'] = 'r'; nm['ĕ'] = 'e';
    nm['ḛ'] = 'e'; nm['Ạ'] = 'a'; nm['ĥ'] = 'h'; nm['ḫ'] = 'h'; nm['Ằ'] = 'a'; nm['ȳ'] = 'y';
    nm['ĵ'] = 'j'; nm['ḻ'] = 'l'; nm['Ề'] = 'e'; nm['Ņ'] = 'n'; nm['Ä'] = 'a'; nm['ṋ'] = 'n';
    nm['Ố'] = 'o'; nm['ŕ'] = 'r'; nm['Ô'] = 'o'; nm['ṛ'] = 'r'; nm['ǚ'] = 'u'; nm['Ỡ'] = 'o';
    nm['ť'] = 't'; nm['ä'] = 'a'; nm['ṫ'] = 't'; nm['Ǫ'] = 'o'; nm['o'] = 'o'; nm['Ự'] = 'u';
    nm['ŵ'] = 'w'; nm['ô'] = 'o'; nm['ṻ'] = 'u'; nm['Ǻ'] = 'a'; nm['ẁ'] = 'w'; nm['Ą'] = 'a';
    nm['Ḇ'] = 'b'; nm['Ȏ'] = 'o'; nm['Ĕ'] = 'e'; nm['Ḗ'] = 'e'; nm['Ȟ'] = 'h'; nm['ạ'] = 'a';
    nm['Ĥ'] = 'h'; nm['Ḧ'] = 'h'; nm['Ư'] = 'u'; nm['Ȯ'] = 'o'; nm['ằ'] = 'a'; nm['Ĵ'] = 'j';
    nm['Ḷ'] = 'l'; nm['ề'] = 'e'; nm['Å'] = 'a'; nm['ń'] = 'n'; nm['Ṇ'] = 'n'; nm['Ǐ'] = 'i';
    nm['ố'] = 'o'; nm['Õ'] = 'o'; nm['Ŕ'] = 'r'; nm['Ṗ'] = 'p'; nm['ǟ'] = 'a'; nm['ỡ'] = 'o';
    nm['å'] = 'a'; nm['Ť'] = 't'; nm['Ṧ'] = 's'; nm['j'] = 'j'; nm['ự'] = 'u'; nm['õ'] = 'o';
    nm['Ŵ'] = 'w'; nm['Ṷ'] = 'u'; nm['z'] = 'z'; nm['ḁ'] = 'a'; nm['Ẇ'] = 'w'; nm['ȉ'] = 'i';
    nm['ď'] = 'd'; nm['ḑ'] = 'd'; nm['ẖ'] = 'h'; nm['ș'] = 's'; nm['ğ'] = 'g'; nm['ḡ'] = 'g';
    nm['Ầ'] = 'a'; nm['ȩ'] = 'e'; nm['į'] = 'i'; nm['ḱ'] = 'k'; nm['Ặ'] = 'a'; nm['ṁ'] = 'm';
    nm['Ệ'] = 'e'; nm['Ê'] = 'e'; nm['ŏ'] = 'o'; nm['ṑ'] = 'o'; nm['ǔ'] = 'u'; nm['Ỗ'] = 'o';
    nm['Ú'] = 'u'; nm['ş'] = 's'; nm['ṡ'] = 's'; nm['e'] = 'e'; nm['Ủ'] = 'u'; nm['ê'] = 'e';
    nm['ů'] = 'u'; nm['ṱ'] = 't'; nm['u'] = 'u'; nm['Ǵ'] = 'g'; nm['Ỷ'] = 'y'; nm['ú'] = 'u';
    nm['0'] = '0'; nm['1'] = '1'; nm['2'] = '2'; nm['3'] = '3'; nm['4'] = '4'; nm['5'] = '5';
    nm['6'] = '6'; nm['7'] = '7'; nm['8'] = '8'; nm['9'] = '9';


    /**
     * Normalize the given String
     * @param {String} string String to normalize
     * @returns {String}
     */
    function normalizeString(string) {
        var normalizedStringArray = [];
        for (var i = 0; i < string.length; i++) {
            var c = string[i].toLowerCase();
            if (nm[c]) {
                normalizedStringArray[i] = nm[c];
            }
            else {
                normalizedStringArray[i] = '_';
            }
        }
        var normalizedString = normalizedStringArray.join("");
        return normalizedString;
    }


    return {
        normalizeString: normalizeString
    };
});
