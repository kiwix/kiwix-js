/**
 * same-name-archive.e2e.spec.js : Checks that a second archive with the same file name as the first is read from its own
 * file, and not from blocks that the block cache (filecache.js) kept from the first archive.
 *
 * The second archive is a copy of the Tonedear archive written to a temporary folder under the same file name, with one
 * letter of one title changed. It has the same size as the original, as a new version of an archive often would, and a
 * later modification time.
 */

import { By, until } from 'selenium-webdriver';
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import paths from '../paths.js';

/* global describe, it, after, Buffer */

const port = '8080';
const tonedearBaseFile = paths.tonedearBaseFile;
const originalTitle = 'Ear Training Android';
const changedTitle = 'Ear Training Androix';

/**
 * Writes a copy of the Tonedear archive with the same file name to a new temporary folder, changing the title of the
 * android-ios-ear-training-app entry from originalTitle to changedTitle (same length, same sort position)
 * @returns {String} The path of the copy
 */
function writeChangedCopy () {
    const data = fs.readFileSync(tonedearBaseFile);
    const dirEntryText = Buffer.from('android-ios-ear-training-app\0' + originalTitle + '\0');
    const pos = data.indexOf(dirEntryText);
    assert.ok(pos > 0, 'Directory entry for android-ios-ear-training-app found in the Tonedear archive');
    // Change the last letter of the title
    data[pos + dirEntryText.length - 2] = 'x'.charCodeAt(0);
    const copy = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kiwix-js-e2e-')), path.basename(tonedearBaseFile));
    fs.writeFileSync(copy, data);
    const modified = new Date(fs.statSync(tonedearBaseFile).mtimeMs + 60000);
    fs.utimesSync(copy, modified, modified);
    return copy;
}

/**
 * Run the tests
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {Array} modes Not used: the block cache is the same in every mode, so the tests run in the app's default mode
 * @param {boolean} keepDriver Whether to keep the driver open after the tests have run
 * @returns {Promise<void>} A Promise for the completion of the tests
 */
function runTests (driver, modes, keepDriver) {
    let browserName, browserVersion;
    driver.getCapabilities().then(function (caps) {
        browserName = caps.get('browserName');
        browserVersion = caps.get('browserVersion');
        console.log('\nRunning same-name archive tests on: ' + browserName + ' ' + browserVersion);
    });

    // Set the implicit wait to 3 seconds
    driver.manage().setTimeouts({ implicit: 3000 });

    let changedCopy;

    /**
     * Picks an archive in the file selector and loads it
     * @param {String} file The path of the archive
     */
    async function loadArchive (file) {
        await driver.switchTo().defaultContent();
        // Treat the test archive as already verified, so that loading it does not raise the source verification dialogue
        await driver.executeScript('params.sourceVerification = false;');
        // Empty the file selector, so that the new file replaces the previous one
        await driver.executeScript('document.getElementById("archiveFiles").value = "";');
        const archiveFiles = await driver.findElement(By.id('archiveFiles'));
        await archiveFiles.sendKeys(file);
        await driver.executeScript('window.setLocalArchiveFromFileSelect();');
        const fileName = await driver.executeScript('var files = document.getElementById("archiveFiles").files; return files.length === 1 ? files[0].name : null;');
        assert.equal(fileName, path.basename(tonedearBaseFile));
        await driver.sleep(2000);
    }

    /**
     * Searches the title index and returns the titles listed. The search is typed again until the expected title is
     * listed, because a search typed while the archive is still loading is not run again once it has loaded
     * @param {String} prefix The text to search for
     * @param {String} expected The title that should be listed
     * @returns {Promise<Array<String>>} The titles listed by the last search
     */
    async function searchTitles (prefix, expected) {
        await driver.switchTo().defaultContent();
        const searchBox = await driver.wait(until.elementIsVisible(driver.findElement(By.id('prefix'))), 1500);
        let titles = [];
        await driver.wait(async function () {
            await searchBox.clear();
            await searchBox.sendKeys(prefix);
            await driver.sleep(1500);
            titles = await driver.executeScript('return Array.prototype.map.call(document.querySelectorAll("#articleList a"), function (a) { return a.textContent.trim(); });');
            return titles.indexOf(expected) !== -1;
        }, 15000).catch(function () {
            // Let the assertions in the test report what was listed
        });
        await searchBox.clear();
        return titles;
    }

    describe('Archives with the same file name', function () {
        this.timeout(60000);
        this.slow(10000);

        it('Load Kiwix JS and check title', async function () {
            changedCopy = writeChangedCopy();
            await driver.get('http://localhost:' + port + '/dist/www/index.html?noPrompts=true');
            await driver.sleep(1300);
            await driver.navigate().refresh();
            await driver.sleep(800);
            const title = await driver.getTitle();
            assert.equal('Kiwix', title);
        });

        it('Load the Tonedear archive and find "' + originalTitle + '"', async function () {
            await loadArchive(tonedearBaseFile);
            const titles = await searchTitles('Ear Training Andro', originalTitle);
            assert.ok(titles.indexOf(originalTitle) !== -1, 'Titles listed: ' + JSON.stringify(titles));
        });

        it('Load a changed copy with the same file name and find "' + changedTitle + '"', async function () {
            await loadArchive(changedCopy);
            const titles = await searchTitles('Ear Training Andro', changedTitle);
            assert.ok(titles.indexOf(changedTitle) !== -1, 'Titles listed: ' + JSON.stringify(titles));
            assert.equal(titles.indexOf(originalTitle), -1, 'Titles listed: ' + JSON.stringify(titles));
        });

        after(async function () {
            if (changedCopy) fs.rmSync(path.dirname(changedCopy), { recursive: true, force: true });
            if (!keepDriver) await driver.quit();
        });
    });
}

export default {
    runTests: runTests
};
