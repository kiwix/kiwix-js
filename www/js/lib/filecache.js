/**
 * filecache.js: Generic cache for small, frequently read file slices.
 * It discards cached blocks according to a least-recently-used algorithm.
 * It is used primarily for fast Directory Entry lookup, speeding up binary search.
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
define(['q'], function (Q) {
    /**
     * Set maximum number of cache blocks of BLOCK_SIZE bytes each
     * Maximum size of cache in bytes = MAX_CACHE_SIZE * BLOCK_SIZE
     * @constant
     * @type {Number}
     */
    const MAX_CACHE_SIZE = 4000;

    /**
     * The maximum blocksize to read or store via the block cache (bytes)
     * @constant
     * @type {Number}
     */
    const BLOCK_SIZE = 4096;

    /**
     * A Cache Entry
     * @typedef {Object} CacheEntry
     * @property {String} id The cache key (stored also in the entry)
     * @property {CacheEntry} prev The previous linked cache entry
     * @property {CacheEntry} next The next linked cache entry
     * @property {Uint8Array} value The cached data
     */

    /**
     * A Block Cache employing a Least Recently Used caching strategy
     * @typedef {Object} BlockCache
     * @property {Number} _limit The maximum number of entries in the cache 
     * @property {Map} _entries A map to store the cache keys and data
     * @property {CacheEntry} _first The most recently used entry in the cache
     * @property {CacheEntry} _last The least recently used entry in the cache
     */
    
    /**
     * Creates a new cache with max size limit of MAX_CACHE_SIZE blocks
     */
    function LRUCache() {
        console.log('Creating cache of size ' + MAX_CACHE_SIZE + ' * ' + BLOCK_SIZE + ' bytes');
        // Initialize persistent Cache properties
        this._limit = MAX_CACHE_SIZE;
        this._entries = new Map();
    }

    /**
     * Tries to retrieve an element by its id. If it is not present in the cache, returns undefined; if it is present,
     * then the value is returned and the entry is moved to the top of the cache
     * @param {String} key The block cache entry key (file.id + ':' + byte offset)
     * @returns {Uint8Array|undefined} The requested cache data or undefined 
     */
    LRUCache.prototype.get = function (key) {
        var entry = this._entries.get(key);
        if (entry === undefined) {
            return entry;
        }
        this.moveToTop(entry);
        return entry.value;
    };

    /**
     * Stores a value in the cache by id and prunes the least recently used entry if the cache is larger than MAX_CACHE_SIZE
     * @param {String} key The key under which to store the value (file.id + ':' + byte offset from start of ZIM archive)
     * @param {Uint8Array} value The value to store in the cache 
     */
    LRUCache.prototype.store = function (key, value) {
        if (!this._entries.has(key)) {
            /**
             * Define a new CacheEntry object in memory
             * @type {CacheEntry}
             */
            var entry = {
                id: key,
                prev: null,
                next: null,
                value: value
            };
            // Store a reference to the entry object in the Map
            this._entries.set(key, entry);
            this.insertAtTop(entry);
            if (this._entries.size > this._limit) {
                var e = this._last;
                this.unlink(e);
                this._entries.delete(e.id);
            }
        }
    };

    /**
     * Delete a cache entry
     * @param {CacheEntry} entry The entry to delete 
     */
    LRUCache.prototype.unlink = function (entry) {
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
     * @param {CacheEntry} entry The entry to insert 
     */
    LRUCache.prototype.insertAtTop = function (entry) {
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
     * @param {CacheEntry} entry The entry to move 
     */
    LRUCache.prototype.moveToTop = function (entry) {
        this.unlink(entry);
        this.insertAtTop(entry);
    };

    /**
     * A new Block Cache
     * @type {BlockCache}
     */
    var cache = new LRUCache();

    // Counters for reporting only
    var hits = 0;
    var misses = 0;

    /**
     * Initializes or resets the cache - this should be called whenever a new ZIM is loaded
     */
    var init = function () {
        console.log('Initialize or reset FileCache');
        // Initialize linked list of entries
        cache._first = null;
        cache._last = null;
        // DEV: Technically, we do not need to clear the FileCache object's Map, because each entry is marked with a 
        // ZIM ID, but it should free up memory on new ZIM load, and should provide a slight performance advantage while
        // the Map is being re-populated
        cache._entries.clear();
    };

    /**
     * Read a certain byte range in the given file, breaking the range into chunks that go through the cache
     * If a read of more than BLOCK_SIZE * 2 (bytes) is requested, do not use the cache
     * @param {Object} file The requested ZIM archive to read from
     * @param {Number} begin The byte from which to start reading
     * @param {Number} end The byte at which to stop reading (end will not be read)
     * @return {Promise<Uint8Array>} A Promise that resolves to the correctly concatenated data from the cache 
     *     or from the ZIM archive
     */
    var read = function (file, begin, end) {
        // Read large chunks bypassing the block cache because we would have to
        // stitch together too many blocks and would clog the cache
        if (end - begin > BLOCK_SIZE * 2) return file._readSplitSlice(begin, end);
        var readRequests = [];
        var blocks = {};
        // Look for the requested data in the blocks: we may need to stitch together data from two or more blocks
        for (var id = Math.floor(begin / BLOCK_SIZE) * BLOCK_SIZE; id < end; id += BLOCK_SIZE) {
            var block = cache.get(file.id + ':' + id);
            if (block === undefined) {
                // Data not in cache, so read from archive
                misses++;
                // DEV: This is a self-calling function, i.e. the function is called with an argument of <id> which then 
                // becomes the <offset> parameter
                readRequests.push(function (offset) {
                    return file._readSplitSlice(offset, offset + BLOCK_SIZE).then(function (result) {
                        cache.store(file.id + ':' + offset, result);
                        blocks[offset] = result;
                    });
                }(id));
            } else {
                hits++;
                blocks[id] = block;
            }
        }
        if (misses + hits > 2000) {
            console.log("** Block cache hit rate: " + Math.round(hits / (hits + misses) * 1000) / 10 + "% [ hits:" + hits + " / misses:" + misses + " ]");
            hits = 0;
            misses = 0;
        }
        // Wait for all the blocks to be read either from the cache or from the archive
        return Q.all(readRequests).then(function () {
            var result = new Uint8Array(end - begin);
            var pos = 0;
            // Stitch together the data parts in the right order
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
        read: read,
        init: init
    };
});