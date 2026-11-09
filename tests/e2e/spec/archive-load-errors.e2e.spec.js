import assert from 'assert';

/* global describe, it, before, after, process */

const port = process.env.BROWSERSTACK_LOCAL_IDENTIFIER ? '8099' : '8080';
const appUrl = 'http://localhost:' + port + '/dist/www/index.html';

/**
 * Checks the error dialogue and retry path through the archive dropdown.
 * File reads fail deterministically, without depending on OS permissions.
 * @param {WebDriver} driver Selenium WebDriver object
 * @param {Array<String>} modes Modes to test
 * @param {boolean} keepDriver Whether to leave the driver open for other suites
 */
function runTests (driver, modes, keepDriver) {
    modes.forEach(function (mode) {
        describe('Archive load errors [' + mode + ' mode]', function () {
            this.timeout(30000);

            before(async function () {
                await driver.get(appUrl + '?contentInjectionMode=' + mode + '&noPrompts=true&defaultModeChangeAlertDisplayed=true');
                await driver.wait(() => driver.executeScript('return typeof window.setLocalArchiveFromFileSelect === "function";'), 10000);
                const supportsArrayBuffer = await driver.executeScript('return "arrayBuffer" in Blob.prototype;');
                if (!supportsArrayBuffer) this.skip();
            });

            ['NotReadableError', 'Error'].forEach(function (errorName) {
                it('Allows retrying the dropdown after ' + errorName, async function () {
                    const previousState = await driver.executeScript(`
                        var input = document.getElementById('archiveFiles');
                        var select = document.getElementById('archiveList');
                        var previousState = { fileSystemApi: params.isFileSystemApiSupported, options: select.innerHTML, value: select.value };
                        var err = new Error('Cannot read <archive>');
                        err.name = arguments[0];
                        var file = { name: 'broken.zim', size: 1024, lastModified: 0,
                            slice: function () { return { arrayBuffer: function () { return Promise.reject(err); } }; } };
                        Object.defineProperty(input, 'files', { configurable: true, value: [file] });
                        params.isFileSystemApiSupported = false;
                        select.innerHTML = '<option value="broken.zim">broken.zim</option>';
                        return previousState;
                    `, errorName);

                    try {
                        let firstMessage;
                        for (let attempt = 0; attempt < 2; attempt++) {
                            await driver.executeScript('document.getElementById("archiveList").click();');
                            await driver.wait(() => driver.executeScript('return document.getElementById("alertModal").style.display === "block";'), 5000,
                                'Selecting the archive again should show its error');
                            const dialogue = await driver.executeScript(`
                                return { title: document.getElementById('modalLabel').textContent,
                                    message: document.getElementById('modalText').textContent };
                            `);
                            assert.strictEqual(dialogue.title, 'Error reading archive file(s)');
                            if (errorName === 'NotReadableError') {
                                assert.match(dialogue.message, /The browser was refused access to your archive by the operating system/);
                                assert.match(dialogue.message, /\[System error message: Cannot read <archive>\]/);
                            } else {
                                assert.strictEqual(dialogue.message, 'Error reading ZIM file broken.zim\u00a0: Cannot read <archive>');
                            }
                            if (attempt === 0) firstMessage = dialogue.message;
                            else assert.strictEqual(dialogue.message, firstMessage);
                            await driver.executeScript('document.getElementById("closeMessage").click();');
                            await driver.wait(() => driver.executeScript('return document.getElementById("alertModal").style.display !== "block";'), 5000);
                        }
                    } finally {
                        await driver.executeScript(`
                            delete document.getElementById('archiveFiles').files;
                            params.isFileSystemApiSupported = arguments[0].fileSystemApi;
                            document.getElementById('archiveList').innerHTML = arguments[0].options;
                            document.getElementById('archiveList').value = arguments[0].value;
                        `, previousState);
                    }
                });
            });

            after(async function () {
                if (mode === modes[modes.length - 1] && !keepDriver) await driver.quit();
            });
        });
    });
}

export default { runTests: runTests };
