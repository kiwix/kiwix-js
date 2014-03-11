/**
 * osabstraction.js: Abstraction layer for file access
 * 
 * Copyright 2014 Evopedia developers
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
define(['util', 'jquery'], function(util, jQuery) {
    /**
     * Creates an abstraction layer around the FirefoxOS storage.
     * @see StoragePhoneGap
     * @param storage FirefoxOS DeviceStorage object
     */
    function StorageFirefoxOS(storage) {
        this._storage = storage;
        this.storageName = storage.storageName;
    }
    /**
     * Access the given file.
     * @param path absolute path to the file
     * @return jQuery promise which is resolved with a HTML5 file object and
     *         rejected with an error message.
     */
    StorageFirefoxOS.prototype.get = function(path) {
        var deferred = jQuery.Deferred();
        var request = this._storage.get(path);
        request.onsuccess = function() { deferred.resolve(this.result); }
        request.onerror = function() { deferred.reject(this.error.name); }
        return deferred.promise();
    }
    /**
     * Searches for directories containing a file with the given name.
     * @param fileName  file name to search
     * @return jQuery promise which is resolved with an array of directory
     *         paths and  rejected with an error message.
     */
    StorageFirefoxOS.prototype.scanForDirectoriesContainingFile
                            = function(fileName) {
        var deferred = jQuery.Deferred();
        var directories = [];
        var cursor = this._storage.enumerate();
        cursor.onerror = function() {
            deferred.reject(cursor.error);
        };
        cursor.onsuccess = function() {
            if (!cursor.result) {
                deferred.resolve(directories);
                return;
            }
            var file = cursor.result;

            if (!util.endsWith(file.name, fileName)) {
                cursor.continue();
                return;
            }

            // Handle the case of archive files at the root of the sd-card
            // (without a subdirectory)
            var directory = "/";

            if (file.name.lastIndexOf('/') !== -1) {
                // We want to return the directory where the file is stored
                // We also keep the trailing slash
                directory = file.name.substring(0,
                                      file.name.lastIndexOf('/') + 1);
            }
            directories.push(directory);

            cursor.continue();
        };
        return deferred.promise();
    }

    /**
     * Creates an abstraction layour around the PhoneGap storage.
     * @see StorageFirefoxOS
     * @param storage PhoneGap FileSystem object
     */
    function StoragePhoneGap(storage) {
        this._storage = storage;
        this.storageName = 'PhoneGapStorage'; // TODO
    }
    /**
     * Access the given file.
     * @param path absolute path to the file
     * @return jQuery promise which is resolved with a HTML5 file object and
     *         rejected with an error message.
     */
    StoragePhoneGap.prototype.get = function(path) {
        console.log("Trying to access " + path);
        var deferred = jQuery.Deferred();
        var that = this;
        var onSuccess = function(file) {
            deferred.resolve(file);
        };
        var onError = function(error) {
            console.log("Error code: " + error.code);
            deferred.reject(that._errorCodeToString(error.code));
        };
        var onSuccessInt = function(fileEntry) {
            fileEntry.file(onSuccess, onError);
        };
        var options = {create: false, exclusive: false};
        if (path.substr(0, 7) == 'file://')
            path = path.substr(7);
        this._storage.root.getFile(path, options, onSuccessInt, onError);
        return deferred.promise();
    }
    /**
     * Searches for directories containing a file with the given name.
     * @param fileName  file name to search
     * @return jQuery promise which is resolved with an array of directory
     *         paths and  rejected with an error message.
     */
    StoragePhoneGap.prototype.scanForDirectoriesContainingFile
                            = function(fileName) {
        var that = this;
        var deferred = jQuery.Deferred();
        var directories = [];
        var stack = [this._storage.root];

        var dirReaderSuccess = function(entries) {
            var dir = stack[stack.length - 1];
            stack.pop();
            for (var i = 0; i < entries.length; i ++) {
                var entry = entries[i];
                if (entry.isDirectory) {
                    stack.push(entry);
                } else if (util.endsWith(entry.name, fileName)) {
                    var path = dir.fullPath;
                    if (path.length == 0 || path[path.length - 1] != '/')
                        path += '/';
                    directories.push(path);
                }
            }
            iteration();
        }
        var dirReaderFail = function(error) {
            deferred.reject(that._errorCodeToString(error.code));
        }
        var iteration = function() {
            if (stack.length == 0) {
                deferred.resolve(directories);
                return;
            }
            var reader = stack[stack.length - 1].createReader();
            reader.readEntries(dirReaderSuccess, dirReaderFail);
        }
        iteration();
        return deferred.promise();
    }

    /**
     * Convert HTML5 FileError codes to strings.
     * @param code FileError code
     * @return string message corresponding to the error code
     */
    StoragePhoneGap.prototype._errorCodeToString = function(code) {
        switch (code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                return 'QUOTA_EXCEEDED_ERR';
            case FileError.NOT_FOUND_ERR:
                return 'NOT_FOUND_ERR';
            case FileError.SECURITY_ERR:
                return 'SECURITY_ERR';
            case FileError.INVALID_MODIFICATION_ERR:
                return 'INVALID_MODIFICATION_ERR';
            case FileError.INVALID_STATE_ERR:
                return 'INVALID_STATE_ERR';
            default:
                return 'Unknown Error';
        }
    }

    return {
        StorageFirefoxOS: StorageFirefoxOS,
        StoragePhoneGap: StoragePhoneGap
    };
});
