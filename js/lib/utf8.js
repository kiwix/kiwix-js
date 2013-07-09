define(function(require) {

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