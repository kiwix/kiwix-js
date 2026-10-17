/**
 * dropped-folder.e2e.spec.js : Checks that every ZIM file in a folder dropped onto the app is listed, when the folder
 * is read through webkitGetAsEntry() (the path taken by browsers without the File System Access API).
 *
 * FileSystemDirectoryReader.readEntries() returns a folder's entries in batches; Chromium returns at most 100 per call.
 * In Chromium browsers the test drops a real folder with 150 files from the browser's sandboxed file system
 * (webkitRequestFileSystem). Where that is not available (Firefox), it drops a stand-in folder whose reader returns
 * at most 100 entries per call, as Chromium's does.
 */

import { By, until } from 'selenium-webdriver';
import assert from 'assert';

/* global describe, it, after */

const port = '8080';
const fileCount = 150;

/**
 * Run the tests
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {Array} modes Not used: dropping a folder does not depend on the content injection mode
 * @param {boolean} keepDriver Whether to keep the driver open after the tests have run
 * @returns {Promise<void>} A Promise for the completion of the tests
 */
function runTests (driver, modes, keepDriver) {
    let browserName, browserVersion;
    driver.getCapabilities().then(function (caps) {
        browserName = caps.get('browserName');
        browserVersion = caps.get('browserVersion');
        console.log('\nRunning dropped folder tests on: ' + browserName + ' ' + browserVersion);
    });

    // Set the implicit wait to 3 seconds
    driver.manage().setTimeouts({ implicit: 3000 });

    describe('Dropping a folder of ' + fileCount + ' ZIM files', function () {
        this.timeout(60000);
        this.slow(10000);

        it('Load Kiwix JS and check title', async function () {
            await driver.get('http://localhost:' + port + '/dist/www/index.html?noPrompts=true');
            await driver.sleep(1300);
            await driver.navigate().refresh();
            await driver.sleep(800);
            const title = await driver.getTitle();
            assert.equal('Kiwix', title);
        });

        it('Drop the folder and check that every ZIM file is listed', async function () {
            const folderType = await driver.executeAsyncScript(function (fileCount) {
                var done = arguments[arguments.length - 1];
                var names = [];
                for (var i = 1; i <= fileCount; i++) names.push('zim' + String(i).padStart(3, '0') + '.zim');
                var drop = function (folder, folderType) {
                    // Read the folder with webkitGetAsEntry(), as browsers without the File System Access API do
                    window.params.isFileSystemApiSupported = false;
                    var event = new Event('drop', { bubbles: true, cancelable: true });
                    Object.defineProperty(event, 'dataTransfer', {
                        value: { files: [], items: [{ webkitGetAsEntry: function () { return folder; } }] }
                    });
                    document.getElementById('search-article').dispatchEvent(event);
                    done(folderType);
                };
                var requestFileSystem = window.webkitRequestFileSystem;
                if (!requestFileSystem) {
                    var position = 0;
                    var entries = names.map(function (name) {
                        return { isFile: true, isDirectory: false, name: name, file: function (callback) { callback(new File([], name)); } };
                    });
                    var reader = {
                        readEntries: function (callback) {
                            var batch = entries.slice(position, position + 100);
                            position += batch.length;
                            setTimeout(function () { callback(batch); }, 0);
                        }
                    };
                    return drop({ isFile: false, isDirectory: true, name: 'zims', createReader: function () { return reader; } }, 'stand-in');
                }
                var fail = function (err) { done('error: ' + (err && err.name)); };
                requestFileSystem(window.TEMPORARY, 1024 * 1024, function (fs) {
                    fs.root.getDirectory('dropped-folder-test', { create: true }, function (folder) {
                        var created = 0;
                        var createNext = function () {
                            if (created === names.length) return drop(folder, 'sandboxed file system');
                            folder.getFile(names[created++], { create: true }, createNext, fail);
                        };
                        createNext();
                    }, fail);
                }, fail);
            }, fileCount);
            console.log('      Dropped a folder from the ' + folderType);
            assert.ok(!/^error/.test(folderType), folderType);

            let listed = [];
            await driver.wait(async function () {
                listed = await driver.executeScript('return Array.prototype.map.call(document.getElementById("archiveList").options, function (o) { return o.value; });');
                return listed.length >= fileCount;
            }, 10000).catch(function () {
                // Let the assertions below report what was listed
            });
            assert.equal(listed.length, fileCount, listed.length + ' of ' + fileCount + ' archives listed');
            const expected = [];
            for (let i = 1; i <= fileCount; i++) expected.push('zim' + String(i).padStart(3, '0') + '.zim');
            assert.deepEqual(listed.slice().sort(), expected);
            const countText = await driver.wait(until.elementLocated(By.id('numberOfFilesCount')), 3000).getAttribute('textContent');
            assert.equal(countText, String(fileCount));
        });

        after(async function () {
            // Remove the folder from the sandboxed file system, if one was made
            await driver.executeAsyncScript(function () {
                var done = arguments[arguments.length - 1];
                if (!window.webkitRequestFileSystem) return done();
                window.webkitRequestFileSystem(window.TEMPORARY, 1024 * 1024, function (fs) {
                    fs.root.getDirectory('dropped-folder-test', {}, function (folder) {
                        folder.removeRecursively(done, done);
                    }, done);
                }, done);
            }).catch(function () {});
            if (!keepDriver) await driver.quit();
        });
    });
}

export default {
    runTests: runTests
};
