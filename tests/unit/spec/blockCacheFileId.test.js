/* eslint-disable no-undef */
/**
 * Checks that the block cache does not serve data from one archive to a different archive that has the same file name.
 *
 * filecache.js keys its blocks on ZIMFile.id plus a byte offset, and zimfile.js used to give the same id to every
 * archive with the same name, so the second archive read the first one's cached blocks.
 */

import { assert } from 'chai';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import '../js/init.js';
import zimfile from '../../../www/js/lib/zimfile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const zimsFolder = join(__dirname, '../../../tests/zims');

/**
 * Reads a test ZIM into a Blob with the given name
 * @param {String} relativePath Path of the ZIM inside tests/zims
 * @param {String} name The name to give to the Blob
 * @returns {Promise<Blob>} A Promise for the Blob
 */
async function zimBlob (relativePath, name) {
    const blob = new Blob([await fs.readFile(join(zimsFolder, relativePath))]);
    blob.name = name;
    return blob;
}

/**
 * Opens a ZIM and reads its first 80 bytes (the ZIM header) through the block cache
 * @param {Blob} blob The ZIM file
 * @returns {Promise<Object>} A Promise for the ZIMFile id and the bytes read
 */
async function headerOf (blob) {
    const zf = await zimfile.fromFileArray([blob]);
    const bytes = await zf._readSlice(0, 80);
    return { id: zf.id, bytes: Array.from(bytes) };
}

describe('Block cache with archives of the same name', function () {
    const tonedear = 'tonedear/tonedear.com_en_2024-09.zim';
    const gutenberg = 'gutenberg-ro/gutenberg_ro_all_2023-08.zim';

    it('reads the second archive\'s own data when a different archive with the same name was opened first', async function () {
        const onDisk = Array.from((await fs.readFile(join(zimsFolder, gutenberg))).subarray(0, 80));
        const first = await headerOf(await zimBlob(tonedear, 'archive.zim'));
        const second = await headerOf(await zimBlob(gutenberg, 'archive.zim'));
        assert.notDeepEqual(first.bytes, onDisk);
        assert.notEqual(second.id, first.id);
        assert.deepEqual(second.bytes, onDisk);
    });

    it('keeps the same id when the same archive is opened again, so its cached blocks are reused', async function () {
        const first = await headerOf(await zimBlob(gutenberg, 'reopened.zim'));
        const second = await headerOf(await zimBlob(gutenberg, 'reopened.zim'));
        assert.equal(second.id, first.id);
        assert.deepEqual(second.bytes, first.bytes);
    });
});
