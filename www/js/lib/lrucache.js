/**
 * lrucache.js: Generic least-recently-used-cache used for dir entries.
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
     * Creates a new cache with size size
     * @param {Integer} size
     */
    function cache(size) {
        this._size = size;
        this._entries = {};
    }
    /**
     * Tries to retrieve an element by its id. If it is not present in the cache,
     * the callback is used to retrieve it.
     * @param id The id of the element
     * @praam {Function} callback function to retrieve the element, called with id
     *                            as parameter, should return a promise that resolves to the object
     * @return {Promise} promise that resolves to the element
     */
    cache.prototype.get = function(id, retrieve) {
        var that = this;
        if (this._entries[id] !== undefined)
            return Q(this._entries[id]);
        return retrieve(id).then(function(value) {
            that._entries[id] = value;
            return value;
        });
    };
    // TODO Actually limit the size of the cache

    return {
        cache: cache
    };
});
