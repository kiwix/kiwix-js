var dec = require('./xzdec.js');
dec._init();

module.exports.decompress = function(data, callback)
{
    var mem = dec._malloc(data.length);
    dec.writeArrayToMemory(data, mem);
    dec._uncompress(mem, data.length);
    var uncompressed = dec.Pointer_stringify(dec._getUncompressedBuffer(), dec._getUncompressedLength());
    dec._free(mem);
    callback(uncompressed);
};
