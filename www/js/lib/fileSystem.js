// refer to this article for easy explanation of File System API https://developer.chrome.com/articles/file-system-access/

/**
 * @typedef {Object} FileSystemHandlers
 * @property {Array<string>} files All the File names to be shown in the dropdown
 * @property {Object} fileOrDirHandle The FileSystemHandle of the selected file or directory
 */

import cache from './cache.js';

/**
 * @param {FileSystemHandlers} fileSystemHandler The FileSystemHandlers object containing filenames and File/Directory handle
 * @param {string} selectedFile The name of the file to be selected in the dropdown
 * @returns {Promise<Array<string>>} Array of unique filenames (if a split zim is considered a single file)
 */
async function updateZimDropdownOptions (fileSystemHandler, selectedFile) {
    const select = document.getElementById('zimSelectDropdown');
    let options = '';
    if (fileSystemHandler.files.length !== 0) options += '<option value="">Select an archive..</option>';

    fileSystemHandler.files.forEach(fileName => {
        if (fileName.endsWith('.zim') || fileName.endsWith('.zimaa')) options += `<option value="${fileName}">${fileName}</option>`;
    });
    select.innerHTML = options;
    document.getElementById('zimSelectDropdown').value = selectedFile;
    document.getElementById('numberOfFilesDisplay').innerText = fileSystemHandler.files.length;
}

/**
 * Opens the File System API to select a directory
 */
async function selectDirectoryFromPickerViaFileSystemApi () {
    const handle = await window.showDirectoryPicker();
    const fileNames = []
    for await (const entry of handle.values()) {
        fileNames.push(entry.name)
    }

    /** @type FileSystemHandlers */
    const FSHandler = {
        fileOrDirHandle: handle,
        files: fileNames
    }
    updateZimDropdownOptions(FSHandler, '')
    cache.idxDB('zimFiles', FSHandler, function () {
        // save file in DB
    });
}

/**
 * Opens the File System API to select a file
 * @returns {Promise<Array<File>>} The selected file from picker
 */
async function selectFileFromPickerViaFileSystemApi () {
    const fileHandles = await window.showOpenFilePicker({ multiple: false })
    const [selectedFile] = fileHandles
    const file = await selectedFile.getFile();

    /** @type FileSystemHandlers */
    const FSHandler = {
        fileOrDirHandle: selectedFile,
        files: [selectedFile.name]
    }
    cache.idxDB('zimFiles', FSHandler, function () {
        // file saved in DB
    })
    updateZimDropdownOptions(FSHandler, selectedFile.name)
    return [file];
}

/**
 * Gets the selected zim file from the IndexedDB
 * @param {string} selectedFilename The name of the file to get back from DB
 * @returns {Promise<Array<File>>} The selected File Object from cache
 */
function getSelectedZimFromCache (selectedFilename) {
    return new Promise((resolve, _reject) => {
        cache.idxDB('zimFiles', async function (FSHandler) {
            if (await FSHandler.fileOrDirHandle.queryPermission() !== 'granted') await FSHandler.fileOrDirHandle.requestPermission()

            if (FSHandler.fileOrDirHandle.kind === 'directory') {
                const files = []
                for await (const entry of FSHandler.fileOrDirHandle.values()) {
                    const filenameWithoutExtension = selectedFilename.replace(/\.zim\w\w$/i, '')
                    const regex = new RegExp(`\\${filenameWithoutExtension}.zim\\w\\w$`, 'i');
                    if (regex.test(entry.name) || entry.name === selectedFilename) {
                        files.push(await entry.getFile())
                    }
                }
                resolve(files)
            } else {
                const file = await FSHandler.fileOrDirHandle.getFile();
                resolve([file])
            }
        })
    })
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
    const filenameWithoutExtension = filename.replace(/\.zim\w\w$/i, '')

    const regex = new RegExp(`\\${filenameWithoutExtension}.zim\\w\\w$`, 'i');
    const files = []
    for (const file of webKitFileList) {
        if (regex.test(file.name) || file.name === filename) {
            files.push(file)
        }
    }
    return files
}

/**
 * Loads the Previously selected zim file via IndexedDB
 */
function loadPreviousZimFile () {
    if (typeof window.showOpenFilePicker === 'function') {
        cache.idxDB('zimFiles', async function (FSHandler) {
            if (!FSHandler) return console.info('There is no previous zim file in DB')
            updateZimDropdownOptions(FSHandler, '')
        })
    }
}

/**
 * Handles the folder drop event via File System API
 * @param {DragEvent} packet The DragEvent packet
 * @returns {Promise<boolean>} Whether the dropped item is a file or directory
 */
async function handleFolderDropViaFileSystemAPI (packet) {
    const isFSAPIsupported = typeof window.showOpenFilePicker === 'function'
    if (!isFSAPIsupported) return true

    // Only runs when browser support File System API
    const fileInfo = packet.dataTransfer.items[0]
    const fileOrDirHandle = await fileInfo.getAsFileSystemHandle();
    if (fileOrDirHandle.kind === 'file') {
        /** @type FileSystemHandlers */
        const FSHandler = {
            fileOrDirHandle: fileOrDirHandle,
            files: [fileOrDirHandle.name]
        }
        cache.idxDB('zimFiles', FSHandler, function () {
            // save file in DB
            updateZimDropdownOptions(FSHandler, fileOrDirHandle.name)
        });
        return true
    }
    if (fileOrDirHandle.kind === 'directory') {
        const fileNames = []
        for await (const entry of fileOrDirHandle.values()) {
            fileNames.push(entry.name)
        }
        /** @type FileSystemHandlers */
        const FSHandler = {
            fileOrDirHandle: fileOrDirHandle,
            files: fileNames
        }
        cache.idxDB('zimFiles', FSHandler, function () {
            updateZimDropdownOptions(FSHandler, '')
            // save file in DB
        });
        return false
    }
}

/**
 * Handles the folder drop event via WebkitGetAsEntry
 * @param {DragEvent} event The DragEvent packet
 * @returns {Promise<{loadZim: boolean, files: Array<File>} | void>} Whether the dropped item is a file or directory and FileList
 */
async function handleFolderDropViaWebkit (event) {
    var dt = event.dataTransfer;

    var entry = dt.items[0].webkitGetAsEntry();
    if (entry.isFile) {
        return { loadZim: true, files: [entry.file] }
    } else if (entry.isDirectory) {
        var reader = entry.createReader();
        const files = await getFilesFromReader(reader);
        const fileNames = []
        files.forEach(file => fileNames.push(file.name));
        await updateZimDropdownOptions({ files: fileNames }, '')
        return { loadZim: false, files: files }
    }
}

/**
 * Gets the files from the FileSystemReader
 * @param {FileSystemDirectoryReader} reader The FileSystemReader to get files from
 * @returns {Promise<Array<File>>} The files from the reader
 */
async function getFilesFromReader (reader) {
    const files = []
    const promise = new Promise(function (resolve, _reject) {
        reader.readEntries(function (entries) {
            resolve(entries)
        })
    })
    const entries = await promise

    for (let index = 0; index < entries.length; index++) {
        const fileOrDir = entries[index];
        if (fileOrDir.isFile) {
            const filePromise = await new Promise(function (resolve, _reject) {
                fileOrDir.file(function (file) {
                    resolve(file)
                })
            });
            files.push(filePromise)
        }
    }
    return files
}

export default {
    updateZimDropdownOptions,
    selectDirectoryFromPickerViaFileSystemApi,
    selectFileFromPickerViaFileSystemApi,
    getSelectedZimFromCache,
    loadPreviousZimFile,
    handleFolderDropViaWebkit,
    handleFolderDropViaFileSystemAPI,
    getSelectedZimFromWebkitList
}
