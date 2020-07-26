/**
 * zstdec_wrapper.js: Javascript wrapper around compiled zstd decompressor.
 *
 * Copyright 2020 Jaifroid, Mossroy and contributors
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
define(['q', 'zstdec'], function(Q) {
    // DEV: zstdec.js has been compiled with `-s EXPORT_NAME="ZD" -s MODULARIZE=1` to avoid a clash with xzdec which uses "Module" as its exported object
    // Note that we include zstdec above in requireJS definition, but we cannot change the name in the function list
    // There is no longer any need to load it in index.html
    // For explanation of loading method below to avoid conflicts, see https://github.com/emscripten-core/emscripten/blob/master/src/settings.js
    var zd;
    // var createDStream, initDStream, decompressStream, isError, freeDStream;
    ZD().then(function(instance) {
        // Instantiate the zd object
        zd = instance;
        // Create JS API by wrapping C++ functions
        // createDStream = zd.cwrap('ZSTD_createDStream');
        // initDStream = zd.cwrap('ZSTD_initDStream');
        // decompressStream = zd.cwrap('ZSTD_decompressStream');
        // isError = zd.cwrap('ZSTD_isError');
        // freeDStream = zd.cwrap('ZSTD_freeDStream');
    });
    
    /**
     * Number of milliseconds to wait for the decompressor to be available for another chunk
     * @type Integer
     */
    var DELAY_WAITING_IDLE_DECOMPRESSOR = 50;
    
    /**
     * Is the decompressor already working?
     * @type Boolean
     */
    var busy = false;
    
    /**
     * @typedef Decompressor
     * @property {Integer} _chunkSize
     * @property {FileReader} _reader
     * @property {unresolved} _stream.decoder_stream
     * @property {Integer} _inStreamPos
     * @property {Integer} _outStreamPos
     * @property {Array} _outBuffer
     */
    
    /**
     * @constructor
     * @param {FileReader} reader
     * @param {Integer} chunkSize
     * @returns {Decompressor}
     */
    function Decompressor(reader, chunkSize) {
        this._chunkSize = chunkSize || 1024 * 5;
        this._reader = reader;
    };
    /**
     * Read length bytes, offset into the decompressed stream. Consecutive calls may only
     * advance in the stream and may not overlap.
     * @param {Integer} offset
     * @param {Integer} length
     */
    Decompressor.prototype.readSlice = function(offset, length) {
        busy = true;
        // Iniitialize stream tracking object (see https://github.com/openzim/libzim/blob/master/src/compression.cpp)
        this._stream = {
            next_in: null,
            avail_in: 0,
            next_out: null,
            avail_out: 0,
            total_out: 0,
            decoder_stream: null
        };
        // Initialize stream decoder
        this._stream.decoder_stream = zd._ZSTD_createDStream();
        var ret = zd._ZSTD_initDStream(this._stream.decoder_stream);
        if (zd._ZSTD_isError(ret)) {
            return Q.reject('Failed to initialize ZSTD decompression');
        }
        // this._inBufferPtr = zd.HEAPU32[(this._stream.decoder_stream >> 2) + 8];
        var that = this;
        return this._readLoop(offset, length).then(function(data) {
            zd._ZSTD_freeDStream(that._stream.decoder_stream);
            busy = false;
            return data;
        });
    };

    /**
     * Provision asm/wasm data block and get a pointer to the assigned location
     * @param {Number} sizeOfData The number of bytes to be allocated
     * @returns {Number} Pointer to the assigned data block
     */
    Decompressor.prototype._mallocOrDie = function (sizeOfData) {
		const dataPointer = zd._malloc(sizeOfData);
        if (dataPointer === 0) { // error allocating memory
            var errorMessage = 'Failed allocation of ' + sizeOfData + ' bytes.';
            console.error(errorMessage);
            throw new Error(errorMessage);
		}
		return dataPointer;
	};
    
    /**
     * Reads stream of data from file offset for length of bytes to send to the decompresor
     * This function ensures that only one decompression runs at a time
     * @param {Integer} offset The file offset at which to begin reading compressed data
     * @param {Integer} length The amount of data to read
     * @returns {Promise} A Promise for the read data
     */
    Decompressor.prototype.readSliceSingleThread = function (offset, length) {
        if (!busy) {
            return this.readSlice(offset, length);
        } else {
            // The decompressor is already in progress.
            // To avoid using too much memory, we wait until it has finished
            // before using it for another decompression
            var that = this;
            return Q.Promise(function (resolve, reject) {
                setTimeout(function () {
                    that.readSliceSingleThread(offset, length).then(resolve, reject);
                }, DELAY_WAITING_IDLE_DECOMPRESSOR);
            });
        }
    };

    /**
     * 
     * @param {Integer} offset
     * @param {Integer} length
     * @returns {Array}
     */
    Decompressor.prototype._readLoop = function(offset, length) {
        var that = this;
        return this._fillInBufferIfNeeded().then(function() {
            var ret = zd._ZSTD_decompressStream(that._stream.decoder_stream);
            var finished = false;
            if (ret === 0) {
                // supply more data or free output buffer
            } else if (ret === 1) {
                // stream ended
                finished = true;
            } else {
                // error @todo handle
                finished = true;
            }

            var outPos = zd._get_out_pos(that._stream.decoder_stream);
            if (outPos > 0 && that._outStreamPos + outPos >= offset)
            {
                var outBuffer = zd._get_out_buffer(that._stream.decoder_stream);
                var copyStart = offset - that._outStreamPos;
                if (copyStart < 0)
                    copyStart = 0;
                for (var i = copyStart; i < outPos && that._outBufferPos < that._outBuffer.length; i++)
                    that._outBuffer[that._outBufferPos++] = zd.HEAP8[outBuffer + i];
            }
            that._outStreamPos += outPos;
            if (outPos > 0)
                zd._out_buffer_cleared(that._stream.decoder_stream);
            if (finished || that._outStreamPos >= offset + length)
                return that._outBuffer;
            else
                return that._readLoop(offset, length);
        });
    };
    
    /**
     * 
     * @returns {Promise}
     */
    Decompressor.prototype._fillInBufferIfNeeded = function() {
        // if (!zd._input_empty(this._stream.decoder_stream)) {
        //     // DEV: When converting to Promise/A+, use Promise.resolve(0) here
        //     return Q.when(0);
        // }
        var that = this;
        return this._reader(this._inStreamPos, this._chunkSize).then(function(data) {
            if (data.length > that._chunkSize) data = data.slice(0, that._chunkSize);
            // var inBufferPtr = zd._ZSTD_getInBuffer();
            // var outBufferPtr = zd._ZSTD_getOutBuffer();
            // Populate inBuffer in asm/wasm memory
            
            zd.HEAPU8.set(data, inBufferPtr);
            zd._ZSTD_decompressStream(that._stream.decoder_stream, inBufferPtr, outBufferPtr);
            that._inStreamPos += data.length;
            zd._set_new_input(that._stream.decoder_stream, data.length);
            return 0;
        });
    };

    return {
        Decompressor: Decompressor
    };
});
