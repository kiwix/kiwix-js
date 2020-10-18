/**
 * filecache.js: Generic least-recently-used-cache used for reading file chunks.
 *
 * Copyright 2020 Mossroy, peter-x, jaifroid and contributors
 * License GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix JS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kiwix JS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kiwix JS (file LICENSE).  If not, see <http://www.gnu.org/licenses/>
 */
'use strict';
define(['q'], function(Q) {
    /**
     * Set maximum number of cache blocks of BLOCK_SIZE bytes each
     * Maximum size of cache in bytes = MAX_CACHE_SIZE * BLOCK_SIZE
     * @type {Integer}
     */
    const MAX_CACHE_SIZE = 4000;

    /**
     * The maximum blocksize to read or store via the block cache (bytes)
     * @type {Integer}
    */
    const BLOCK_SIZE = 4096;

    /**
     * Creates a new cache with max size limit
     * @param {Integer} limit The maximum number of blocks of BLOCK_SIZE to be cached
     */
    function LRUCache(limit) {
        console.log("Creating cache of size " + limit);
        this._limit = limit;
        this._size = 0;
        // Mapping from id to {value: , prev: , next: }
        this._entries = {};
        // linked list of entries
        this._first = null;
        this._last = null;
    }

    /**
     * Tries to retrieve an element by its id. If it is not present in the cache, returns undefined; if it is present,
     * then the value is returned and the entry is moved to the top of the cache
     * @param {String} id The block cache entry key
     * @returns {Uint8Array|undefined} The requested cache data or undefined 
     */
    LRUCache.prototype.get = function(id) {
        var entry = this._entries[id]; 
        if (entry === undefined) {
            return entry;
        }
        this.moveToTop(entry);
        return entry.value;
    };
    /**
     * Stores a value in the cache by id and prunes the least recently used entry if the cache is larger than MAX_CACHE_SIZE
     * @param {String} id The key under which to store the value (consists of filename + file number)
     * @param {Uint16Array} value The value to store in the cache 
     */
    LRUCache.prototype.store = function(id, value) {
        var entry = this._entries[id];
        if (entry === undefined) {
            entry = this._entries[id] = {id: id, prev: null, next: null, value: value};
            this.insertAtTop(entry);
            if (this._size >= this._limit) {
                var e = this._last;
                this.unlink(e);
                delete this._entries[e.id];
            } else {
                this._size++;
            }
        } else {
            entry.value = value;
            this.moveToTop(entry);
        }
    };

    /**
     * Delete a cache entry
     * @param {String} entry The entry to delete 
     */
    LRUCache.prototype.unlink = function(entry) {
        if (entry.next === null) {
            this._last = entry.prev;
        } else {
            entry.next.prev = entry.prev;
        }
        if (entry.prev === null) {
            this._first = null;
        } else {
            entry.prev.next = entry.next;
        }
    };

    /**
     * Insert a cache entry at the top of the cache
     * @param {String} entry The entry to insert 
     */
    LRUCache.prototype.insertAtTop = function(entry) {
        if (this._first === null) {
            this._first = this._last = entry;
        } else {
            this._first.prev = entry;
            entry.next = this._first;
            this._first = entry;
        }
    };

    /**
     * Move a cache entry to the top of the cache
     * @param {String} entry The entry to move 
     */
    LRUCache.prototype.moveToTop = function(entry) {
        this.unlink(entry);
        this.insertAtTop(entry);
    };

    // Create a new cache
    var cache = new LRUCache(MAX_CACHE_SIZE);
    
    // Counters for reporting only
    var hits = 0;
    var misses = 0;

    /**
     * Read a certain byte range in the given file, breaking the range into chunks that go through the cache
     * If a read of more than blocksize (bytes) is requested, do not use the cache
     * @param {Object} file The requested ZIM archive to read from
     * @param {Integer} begin The byte from which to start reading
     * @param {Integer} end The byte at which to stop reading (end will not be read)
     * @return {Promise<Uint8Array>} A Promise that resolves to the correctly concatenated data from the split ZIM file set
     */
    var read = function(file, begin, end) {
        // Read large chunks bypassing the block cache because we would have to
        // stitch together too many blocks and would clog the cache
        if (end - begin > BLOCK_SIZE * 2) return file._readSplitSlice(begin, end);
        var readRequests = [];
        var blocks = {};
        for (var i = Math.floor(begin / BLOCK_SIZE) * BLOCK_SIZE; i < end; i += BLOCK_SIZE) {
            var block = cache.get(file.name + i);
            if (block === undefined) {
                misses++;
                readRequests.push(function(offset) {
                    return file._readSplitSlice(offset, offset + BLOCK_SIZE).then(function(result) {
                        cache.store(file.name + offset, result);
                        blocks[offset] = result;
                    });
                }(i));
            } else {
                hits++;
                blocks[i] = block;
            }
        }
        if (misses + hits > 2000) {
            console.log("** Block cache hit rate: " + Math.round(hits / (hits + misses) * 1000) / 10 + "% [ hits:" + hits + " / misses:" + misses + " ]");
            hits = 0;
            misses = 0;
        }
        return Q.all(readRequests).then(function() {
            var result = new Uint8Array(end - begin);
            var pos = 0;
            for (var i = Math.floor(begin / BLOCK_SIZE) * BLOCK_SIZE; i < end; i += BLOCK_SIZE) {
                var b = Math.max(i, begin) - i;
                var e = Math.min(end, i + BLOCK_SIZE) - i;
                if (blocks[i].subarray) result.set(blocks[i].subarray(b, e), pos);
                pos += e - b;
            }
            return result;
        });
    };

    return {
        read: read
    };
});