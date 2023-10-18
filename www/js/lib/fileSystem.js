/**
 * @typedef {Object} FileSystemHandlers
 * @property {Array<string>} files All the File names to be shown in the dropdown
 * @property {Object} fileOrDirHandle The FileSystemHandle of the selected file or directory
 */

import cache from './cache.js';

/**
 * @param {FileSystemHandlers} fileSystemHandler
 */
async function updateZimDropdownOptions (fileSystemHandler, selectedFile) {
    const select = document.getElementById('zimSelectDropdown')
    let options = '<option value="" disabled selected>Select a file...</option>'
    fileSystemHandler.files.forEach(fileName => {
        options += `<option value="${fileName}">${fileName}</option>`
    });
    select.innerHTML = options
    document.getElementById('zimSelectDropdown').value = selectedFile
}

async function selectDirectoryFromPicker () {
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

async function selectFileFromPicker () {
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

function changeSelectedZim (selectedFilename) {
    return new Promise((resolve, reject) => {
        cache.idxDB('zimFiles', async function (FSHandler) {
            // const selectedFile = FSHandler.fileOrDirHandle
            console.log(await FSHandler.fileOrDirHandle.queryPermission());
            if (await FSHandler.fileOrDirHandle.queryPermission() !== 'granted') await FSHandler.fileOrDirHandle.requestPermission()
            let file = null
            if (FSHandler.fileOrDirHandle.kind === 'directory') {
                file = await (await FSHandler.fileOrDirHandle.getFileHandle(selectedFilename)).getFile()
                resolve(file)
            } else {
                file = await FSHandler.fileOrDirHandle.getFile();
                resolve(file)
            }
        })
    })
}

/**
 * Loads the Previously selected zim file via IndexedDB
 */
function loadPreviousZimFile () {
    if (typeof window.showOpenFilePicker === 'function') {
        cache.idxDB('zimFiles', async function (FSHandler) {
            if (!FSHandler) return console.info('There is no previous zim file in DB')
            console.log('Loading this handler from old time', FSHandler);
            updateZimDropdownOptions(FSHandler, '')
            // refer to this article for easy explanation https://developer.chrome.com/articles/file-system-access/
        })
    }
}

async function handleFolderDropViaFSAPI (packet) {
    const isFSAPIsupported = typeof window.showOpenFilePicker === 'function'
    if (!isFSAPIsupported) return true

    // Only runs when browser support File System API
    const fileInfo = await packet.dataTransfer.items[0]
    const fileOrDirHandle = await fileInfo.getAsFileSystemHandle();
    console.log(fileOrDirHandle, fileInfo);
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
    // will be later on used
    if (fileOrDirHandle.kind === 'directory') {
        // const dirHandle = fileInfo.getAsFileSystemHandle();
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

async function handleFolderDropViaWebkit (event) {
    var dt = event.dataTransfer;

    var entry = dt.items[0].webkitGetAsEntry();
    if (entry.isFile) {
        // do whatever you want

        return { loadZim: true, files: [entry.file] }
    } else if (entry.isDirectory) {
        // do whatever you want
        var reader = entry.createReader();
        const files = await getFilesFromReader(reader);
        console.log('[DEBUG] After files', files);
        const fileNames = []
        files.forEach(file => fileNames.push(file.name));
        await updateZimDropdownOptions({ files: fileNames }, '')
        return { loadZim: false, files: files }
    }
}

async function getFilesFromReader (reader) {
    const files = []
    const promise = new Promise(function (resolve, reject) {
        reader.readEntries(function (entries) {
            resolve(entries)
        })
    })
    const entries = await promise

    for (let index = 0; index < entries.length; index++) {
        const fileOrDir = entries[index];
        if (fileOrDir.isFile) {
            const filePromise = await new Promise(function (resolve, reject) {
                fileOrDir.file(function (file) {
                    // console.log(file);
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
    selectDirectoryFromPicker,
    selectFileFromPicker,
    changeSelectedZim,
    loadPreviousZimFile,
    handleFolderDropViaWebkit,
    handleFolderDropViaFSAPI
}
