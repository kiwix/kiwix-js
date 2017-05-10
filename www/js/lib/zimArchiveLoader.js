/**
 * zimArchiveLoader.js: Functions to search and read ZIM archives.
 *
 * Copyright 2015 Mossroy and contributors
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
define(['zimArchive', 'jquery'],
       function(zimArchive, jQuery) {

    /**
     * Create a ZIMArchive from DeviceStorage location
     * @param {DeviceStorage} storage
     * @param {String} path
     * @param {callbackZIMArchive} callback
     * @returns {ZIMArchive}
     */
    function loadArchiveFromDeviceStorage(storage, path, callback) {
        return new zimArchive.ZIMArchive(storage, path, callback);
    };
    /**
     * Create a ZIMArchive from Files
     * @param {Array.<File>} files
     * @param {callbackZIMArchive} callback
     * @returns {ZIMArchive}
     */
    function loadArchiveFromFiles(files, callback) {
        if (files.length >= 1) {
            return new zimArchive.ZIMArchive(files, null, callback);
        }
    };
    
    /**
     * @callback callbackPathList
     * @param {Array.<String>} directoryList List of directories
     */
    
    
    /**
     *  Scans the DeviceStorage for archives
     *
     * @param {Array.<DeviceStorage>} storages List of DeviceStorage instances
     * @param {callbackPathList} callbackFunction Function to call with the list of directories where archives are found
     */
    function scanForArchives(storages, callbackFunction) {
        var directories = [];
        var promises = jQuery.map(storages, function(storage) {
            return storage.scanForArchives()
                .then(function(dirs) {
                    jQuery.merge(directories, dirs);
                    return true;
                });
        });
        jQuery.when.apply(null, promises).then(function() {
            callbackFunction(directories);
        }, function(error) {
            alert("Error scanning your SD card : " + error
                    + ". If you're using the Firefox OS Simulator, please put the archives in "
                    + "a 'fake-sdcard' directory inside your Firefox profile "
                    + "(ex : ~/.mozilla/firefox/xxxx.default/extensions/fxos_2_x_simulator@mozilla.org/"
                    + "profile/fake-sdcard/wikipedia_en_ray_charles_2015-06.zim)");
            callbackFunction(null);
        });
    };

    /**
     * Functions and classes exposed by this module
     */
    return {
        loadArchiveFromDeviceStorage: loadArchiveFromDeviceStorage,
        loadArchiveFromFiles: loadArchiveFromFiles,
        scanForArchives: scanForArchives
    };
});
