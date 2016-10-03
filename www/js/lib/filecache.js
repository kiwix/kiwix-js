/**
 * filecache.js: Generic least-recently-used-cache used for reading file chunks.
 *
 * Copyright 2016 Mossroy and contributors
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
define(['q'], function(Q) {
    /**
     * Creates a new cache with max size limit
     * @param {Integer} limit
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
     * Tries to retrieve an element by its namespace and id. If it is not present in the cache,
     * returns undefined.
     */
    LRUCache.prototype.get = function(id) {
        var entry = this._entries[id]; 
        if (entry === undefined) {
            this._misses++;
            return entry;
        }
        this.moveToTop(entry);
        return entry.value;
    };
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
    LRUCache.prototype.insertAtTop = function(entry) {
        if (this._first === null) {
            this._first = this._last = entry;
        } else {
            this._first.prev = entry;
            entry.next = this._first;
            this._first = entry;
        }
    };
    LRUCache.prototype.moveToTop = function(entry) {
        this.unlink(entry);
        this.insertAtTop(entry);
    };
    
    // Create a 200k cache.
    var cache = new LRUCache(100);

    var hits = 0;
    var misses = 0;

    /**
     * Read a certain byte range in the given file, breaking the range into chunks
     * that go through the cache.
     * If a read of more than 2048 bytes is requested, do not use the cache.
     * @return {Promise} promise that resolves to the correctly concatenated data.
     */
    var read = function(file, begin, end) {
        var blockSize = 2048;
        // Read large chunks bypassing the block cache because we would have to
        // stitch together too many blocks and would clog the cach.
        if (end - begin > 2048)
            return readInternal(file, begin, end);
        var readRequests = [];
        var blocks = {};
        for (var i = Math.floor(begin / blockSize) * blockSize; i < end; i += blockSize) {
            var block = cache.get(file.name + i);
            if (block === undefined) {
                misses++;
                readRequests.push(function(offset) {
                    return readInternal(file, offset, offset + blockSize).then(function(result) {
                        cache.store(file.name + offset, result);
                        blocks[offset] = result;
                    });
                }(i));
            } else {
                hits++;
                blocks[i] = block;
            }
        }
        if (misses + hits > 1000) {
            console.log("hits: " + hits + " misses: " + misses + " Perc: " + (hits / (hits + misses)));
            hits = 0;
            misses = 0;
        }
        return Q.all(readRequests).then(function() {
            var result = new Uint8Array(end - begin);
            var pos = 0;
            for (var i = Math.floor(begin / blockSize) * blockSize; i < end; i += blockSize) {
                var b = Math.max(i, begin) - i;
                var e = Math.min(end, i + blockSize) - i;
                result.set(blocks[i].subarray(b, e), pos);
                pos += e - b;
            }
            return result;
        });
    };
    var readInternal = function(file, begin, end) {
        var deferred = Q.defer();
        var reader = new FileReader();
        reader.onload = function(e) {
            deferred.resolve(new Uint8Array(e.target.result));
        };
        reader.onerror = reader.onabort = function(e) {
            deferred.reject(e);
        };
        reader.readAsArrayBuffer(file.slice(begin, end));
        return deferred.promise;
    };

    return {
        read: read
    };
});
