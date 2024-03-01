/**
 * abstractFilesystemAccess.js: Abstraction layer for file access.
 * This is currently only implemented for FirefoxOS and Standard browser (using File System Access API), but could be extended to
 * Cordova, Electron or other ways to directly browse and read files from the
 * filesystem.
*
* Copyright 2014-2023 Kiwix developers and Rishabhg71
* Licence GPL v3:
*
* This file is part of Kiwix.
*
* Kiwix is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public Licence as published by
* the Free Software Foundation, either version 3 of the Licence, or
* (at your option) any later version.
*
* Kiwix is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public Licence for more details.
*
* You should have received a copy of the GNU General Public Licence
* along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
*/

'use strict';

import cache from './cache.js';
import translateUI from './translateUI.js';
import settingsStore from './settingsStore.js';

function StorageFirefoxOS (storage) {
    this._storage = storage;
    this.storageName = storage.storageName;
}

/**
 * Access the given file.
 * @param {String} path absolute path to the file
 * @return {Promise} Promise which is resolved with a HTML5 file object and
 *         rejected with an error message.
 */
StorageFirefoxOS.prototype.get = function (path) {
    var that = this;
    return new Promise(function (resolve, reject) {
        var request = that._storage.get(path);
        request.onsuccess = function () { resolve(this.result); };
        request.onerror = function () { reject(this.error.name); };
    });
};

// We try to match both a standalone ZIM file (.zim) or
// the first file of a split ZIM files collection (.zimaa)
var regexpZIMFileName = /\.zim(aa)?$/i;

/**
 * Searches for archive files or directories.
 * @return {Promise} Promise which is resolved with an array of
 *         paths and rejected with an error message.
 */
StorageFirefoxOS.prototype.scanForArchives = function () {
    var that = this;
    return new Promise(function (resolve, reject) {
        var directories = [];
        var cursor = that._storage.enumerate();
        cursor.onerror = function () {
            reject(cursor.error);
        };
        cursor.onsuccess = function () {
            if (!cursor.result) {
                resolve(directories);
                return;
            }
            var file = cursor.result;

            if (regexpZIMFileName.test(file.name)) {
                directories.push(file.name);
            }

            cursor.continue();
        };
    });
};

/**
 * Browse a path through DeviceStorage API
 * @param path Path where to look for files
 * @return {DOMCursor} Cursor of files found in given path
 */
StorageFirefoxOS.prototype.enumerate = function (path) {
    return this._storage.enumerate();
};

// refer to this article for easy explanation of File System API https://developer.chrome.com/articles/file-system-access/

/**
 * @param {Array<string>} files All the File names to be shown in the dropdown
 * @param {string} selectedFile The name of the file to be selected in the dropdown
 * @returns {Promise<Array<string>>} Array of unique filenames (if a split zim is considered a single file)
 */
async function updateZimDropdownOptions (files, selectedFile) {
    const isFireFoxOsNativeFileApiAvailable = typeof navigator.getDeviceStorages === 'function';
    // This will make sure that there is no race around condition when platform is firefox os
    // as other function will handle the dropdown UI updates
    if (isFireFoxOsNativeFileApiAvailable) return // do nothing let other function handle it

    const select = document.getElementById('archiveList');
    const options = [];
    let count = 0;
    select.innerHTML = '';
    if (files.length !== 0) {
        const placeholderOption = new Option(translateUI.t('configure-select-file-first-option'), '');
        placeholderOption.disabled = true;
        select.appendChild(placeholderOption);
    };

    files.forEach((fileName) => {
        if (/\.zim(aa)?$/i.test(fileName)) {
            options.push(new Option(fileName, fileName));
            select.appendChild(new Option(fileName, fileName));
            count++;
        }
    });
    document.getElementById('archiveList').value = selectedFile;
    document.getElementById('numberOfFilesCount').style.display = '';
    document.getElementById('fileCountDisplay').style.display = '';

    document.getElementById('numberOfFilesCount').innerText = count.toString();
    document.getElementById('fileCountDisplay').innerText = translateUI.t('configure-select-file-numbers');
}

/**
 * Opens the File System API to select a directory
 * @returns {Promise<Array<File>>} Previously selected file if available in selected folder
 */
async function selectDirectoryFromPickerViaFileSystemApi () {
    const handle = await window.showDirectoryPicker();
    const fileNames = [];
    const previousZimFile = []
    const lastZimName = settingsStore.getItem('previousZimFileName') || '';
    const lastZimNameWithoutExtension = lastZimName.replace(/\.zim\w?\w?$/i, '');
    // Iterate over all files in directory, store an array of ZIM files, and get the previously selectee ZIM file if it exists
    for await (const entry of handle.values()) {
        if (entry.kind === 'file' && /\.zim\w?\w?$/i.test(entry.name)) {
            fileNames.push(entry.name);
            if (!entry.name.indexOf(lastZimNameWithoutExtension)) {
                previousZimFile.push(await entry.getFile());
            }
        }
    }
    settingsStore.setItem('zimFilenames', fileNames.join('|'), Infinity);
    updateZimDropdownOptions(fileNames, previousZimFile.length !== 0 ? lastZimName : '');
    cache.idxDB('zimFiles', handle, function () {
        // save file in DB
    });
    return previousZimFile;
}

/**
 * Opens the File System API to select a file
 * @returns {Promise<Array<File>>} The selected file from picker
 */
async function selectFileFromPickerViaFileSystemApi () {
    const fileHandles = await window.showOpenFilePicker({ multiple: false });
    const [selectedFile] = fileHandles;
    const file = await selectedFile.getFile();
    const filenameList = [selectedFile.name];
    settingsStore.setItem('zimFilenames', filenameList.join('|'));
    cache.idxDB('zimFiles', selectedFile, function () {
        // file saved in DB
        updateZimDropdownOptions(filenameList, selectedFile.name);
    });
    return [file];
}

/**
 * Gets the selected zim file from the IndexedDB
 * @param {string} selectedFilename The name of the file to get back from DB
 * @returns {Promise<Array<File>>} The selected File Object from cache
 */
function getSelectedZimFromCache (selectedFilename) {
    return new Promise((resolve, reject) => {
        cache.idxDB('zimFiles', async function (fileOrDirHandle) {
            if (!fileOrDirHandle) {
                reject(new Error('No file or directory selected'));
            }
            // Left it here for debugging purposes as its sometimes asking for permission even when its granted
            // console.debug('FileHandle and Permission', fileOrDirHandle, await fileOrDirHandle.queryPermission())
            if ((await fileOrDirHandle.queryPermission()) !== 'granted') await fileOrDirHandle.requestPermission();

            if (fileOrDirHandle.kind === 'directory') {
                const files = [];
                for await (const entry of fileOrDirHandle.values()) {
                    const filenameWithoutExtension = selectedFilename.replace(/\.zim\w?\w?$/i, '');
                    // const regex = new RegExp(`\\${filenameWithoutExtension}.zim\\w\\w$`, 'i');
                    if (!entry.name.indexOf(filenameWithoutExtension)) {
                        files.push(await entry.getFile());
                    }
                }
                resolve(files);
            } else {
                const file = await fileOrDirHandle.getFile();
                resolve([file]);
            }
        });
    });
}

/**
 * @typedef {Object.<number, File>} WebkitFileList
 */

/**
 * Gets the selected zim file from the WebkitFileList
 * @param {WebkitFileList} webKitFileList The WebkitFileList to get the selected file from
 * @param {string} filename The name of the file to get back from webkitFileList
 * @returns {Array<File>} The selected Files Object from webkitFileList
 */
function getSelectedZimFromWebkitList (webKitFileList, filename) {
    const filenameWithoutExtension = filename.replace(/\.zim\w\w$/i, '');

    const regex = new RegExp(`\\${filenameWithoutExtension}.zim\\w\\w$`, 'i');
    const files = [];
    for (const file of webKitFileList) {
        if (regex.test(file.name) || file.name === filename) {
            files.push(file);
        }
    }
    return files;
}

/**
 * Loads the Previously loaded zim filename(s) via local storage
 */
function loadPreviousZimFile () {
    // If we call `updateZimDropdownOptions` without any delay it will run before the internationalization is initialized
    // It's a bit hacky but it works and I am not sure if there is any other way ATM
    setTimeout(() => {
        if (window.params.isFileSystemApiSupported || window.params.isWebkitDirApiSupported) {
            const filenames = settingsStore.getItem('zimFilenames');
            if (filenames) updateZimDropdownOptions(filenames.split('|'), '');
        }
    }, 200);
}

/**
 * Handles the folder drop event via File System API
 * @param {DragEvent} packet The DragEvent packet
 * @returns {Promise<boolean>} Whether the dropped item is a file or directory
 */
async function handleFolderOrFileDropViaFileSystemAPI (packet) {
    if (!window.params.isFileSystemApiSupported) return true;

    // Only runs when browser support File System API
    const fileInfo = packet.dataTransfer.items[0];
    const fileOrDirHandle = await fileInfo.getAsFileSystemHandle();
    if (fileOrDirHandle.kind === 'file') {
        settingsStore.setItem([fileOrDirHandle.name], [fileOrDirHandle.name].join('|'), Infinity);
        cache.idxDB('zimFiles', fileOrDirHandle, function () {
            // save file in DB
            updateZimDropdownOptions([fileOrDirHandle.name], fileOrDirHandle.name);
        });
        settingsStore.setItem('zimFilenames', [fileOrDirHandle.name].join('|'), Infinity);
        return true;
    }
    if (fileOrDirHandle.kind === 'directory') {
        const fileNames = [];
        for await (const entry of fileOrDirHandle.values()) {
            fileNames.push(entry.name);
        }
        settingsStore.setItem('zimFilenames', fileNames.join('|'), Infinity);
        cache.idxDB('zimFiles', fileOrDirHandle, function () {
            updateZimDropdownOptions(fileNames, '');
            // save file in DB
        });
        return false;
    }
}

/**
 * Handles the folder drop event via WebkitGetAsEntry
 * @param {DragEvent} event The DragEvent packet
 * @returns {Promise<{loadZim: boolean, files: Array<File>} | void>} Whether the dropped item is a file or directory and FileList
 */
async function handleFolderOrFileDropViaWebkit (event) {
    var dt = event.dataTransfer;

    var entry = dt.items[0].webkitGetAsEntry();
    if (entry.isFile) {
        settingsStore.setItem('zimFilenames', [entry.name].join('|'), Infinity);
        await updateZimDropdownOptions([entry.name], entry.name);
        return { loadZim: true, files: [entry.file] };
    } else if (entry.isDirectory) {
        var reader = entry.createReader();
        const files = await getFilesFromReader(reader);
        const fileNames = [];
        files.forEach((file) => fileNames.push(file.name));
        settingsStore.setItem('zimFilenames', fileNames.join('|'), Infinity);
        await updateZimDropdownOptions(fileNames, '');
        return { loadZim: false, files: files };
    }
}

/**
 * Gets the files from the FileSystemReader
 * @param {FileSystemDirectoryReader} reader The FileSystemReader to get files from
 * @returns {Promise<Array<File>>} The files from the reader
 */
async function getFilesFromReader (reader) {
    const files = [];
    const promise = new Promise(function (resolve, _reject) {
        reader.readEntries(function (entries) {
            resolve(entries);
        });
    });
    const entries = await promise;

    for (let index = 0; index < entries.length; index++) {
        const fileOrDir = entries[index];
        if (fileOrDir.isFile) {
            const filePromise = await new Promise(function (resolve, _reject) {
                fileOrDir.file(function (file) {
                    resolve(file);
                });
            });
            files.push(filePromise);
        }
    }
    return files;
}

export default {
    StorageFirefoxOS: StorageFirefoxOS,
    updateZimDropdownOptions: updateZimDropdownOptions,
    selectDirectoryFromPickerViaFileSystemApi: selectDirectoryFromPickerViaFileSystemApi,
    selectFileFromPickerViaFileSystemApi: selectFileFromPickerViaFileSystemApi,
    getSelectedZimFromCache: getSelectedZimFromCache,
    loadPreviousZimFile: loadPreviousZimFile,
    handleFolderOrFileDropViaWebkit: handleFolderOrFileDropViaWebkit,
    handleFolderOrFileDropViaFileSystemAPI: handleFolderOrFileDropViaFileSystemAPI,
    getSelectedZimFromWebkitList: getSelectedZimFromWebkitList
};
