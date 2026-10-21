/* eslint-disable no-undef */
/**
 * Checks that every file in a dropped folder is read when the browser returns the folder's entries in batches.
 *
 * FileSystemDirectoryReader.readEntries() returns the entries of a folder in batches, and must be called until it
 * returns an empty array. Chromium returns at most 100 entries per call, so abstractFilesystemAccess.js used to see
 * only the first 100 files of a folder dropped onto the app in browsers that take the webkitGetAsEntry() path.
 */

import { assert } from 'chai';
import '../js/init.js';
import abstractFilesystemAccess from '../../../www/js/lib/abstractFilesystemAccess.js';

/**
 * Builds a drop event for a folder whose reader returns its entries in batches, as a browser does
 * @param {String[]} names The names of the files in the folder
 * @param {Number} batchSize The largest number of entries returned by one call to readEntries()
 * @returns {Object} An object with the parts of a DragEvent that the drop handler uses
 */
function folderDropEvent (names, batchSize) {
    const entries = names.map(function (name) {
        return {
            isFile: true,
            isDirectory: false,
            name: name,
            file: function (callback) { callback(new File([], name)); }
        };
    });
    let position = 0;
    const reader = {
        readEntries: function (callback) {
            const batch = entries.slice(position, position + batchSize);
            position += batch.length;
            setTimeout(function () { callback(batch); }, 0);
        }
    };
    const folder = { isFile: false, isDirectory: true, name: 'zims', createReader: function () { return reader; } };
    return { dataTransfer: { items: [{ webkitGetAsEntry: function () { return folder; } }] } };
}

/**
 * Returns the names zim001.zim, zim002.zim ... for the given number of files
 * @param {Number} count The number of names
 * @returns {String[]} The names
 */
function zimNames (count) {
    const names = [];
    for (let i = 1; i <= count; i++) names.push('zim' + String(i).padStart(3, '0') + '.zim');
    return names;
}

describe('Dropping a folder (webkitGetAsEntry)', function () {
    // updateZimDropdownOptions() creates the dropdown entries with new Option(), which the test environment only has on window
    let addedOption = false;
    before(function () {
        if (typeof globalThis.Option === 'undefined') {
            globalThis.Option = window.Option;
            addedOption = true;
        }
    });

    after(function () {
        if (addedOption) delete globalThis.Option;
    });

    beforeEach(function () {
        document.body.innerHTML = '<div id="chooseArchiveFromLocalStorage" style="display: none"><select id="archiveList"></select></div>' +
            '<span id="numberOfFilesCount"></span><span id="fileCountDisplay"></span>';
    });

    it('reads every file when the entries come in batches of 100', async function () {
        const names = zimNames(150);
        const result = await abstractFilesystemAccess.handleFolderOrFileDropViaWebkit(folderDropEvent(names, 100));
        assert.equal(result.loadZim, false);
        assert.deepEqual(result.files.map(function (file) { return file.name; }), names);
        const listed = Array.from(document.getElementById('archiveList').options).map(function (option) { return option.value; });
        assert.deepEqual(listed, names);
        assert.equal(document.getElementById('numberOfFilesCount').innerText, '150');
    });

    it('reads every file when the entries come in a single batch', async function () {
        const names = zimNames(150);
        const result = await abstractFilesystemAccess.handleFolderOrFileDropViaWebkit(folderDropEvent(names, 1000));
        assert.deepEqual(result.files.map(function (file) { return file.name; }), names);
    });

    it('handles an empty folder', async function () {
        const result = await abstractFilesystemAccess.handleFolderOrFileDropViaWebkit(folderDropEvent([], 100));
        assert.deepEqual(result.files, []);
    });
});
