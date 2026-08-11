/* eslint-disable no-undef */
/**
 * Tests for zimArchiveLoader.scanForArchives
 *
 * This is the Firefox OS / DeviceStorage code path, which cannot be reached by the e2e suite
 * and is otherwise only testable by hand in the Firefox OS Simulator. It used jQuery ($.map,
 * $.merge and $.when) until #1233 removed jQuery from the app, so it is worth pinning down the
 * merging and error behaviour here. DeviceStorage instances are mocked: the only thing
 * scanForArchives requires of them is a scanForArchives() method returning a Promise for an
 * array of directory names.
 */

import { expect } from 'chai';
import '../js/init.js';
import zimArchiveLoader from '../../../www/js/lib/zimArchiveLoader.js';

/**
 * Creates a mock DeviceStorage that resolves with the given directory names
 * @param {Array.<String>} dirs Directory names the mock should report
 * @param {Number} [delay] Optional delay in ms before resolving, to vary completion order
 * @returns {Object} A mock DeviceStorage
 */
function mockStorage (dirs, delay) {
    return {
        scanForArchives: function () {
            return new Promise(function (resolve) {
                setTimeout(function () { resolve(dirs); }, delay || 0);
            });
        }
    };
}

/**
 * Creates a mock DeviceStorage that rejects
 * @param {Error} error The error to reject with
 * @param {Number} [delay] Optional delay in ms before rejecting
 * @returns {Object} A mock DeviceStorage
 */
function failingStorage (error, delay) {
    return {
        scanForArchives: function () {
            return new Promise(function (resolve, reject) {
                setTimeout(function () { reject(error); }, delay || 0);
            });
        }
    };
}

/**
 * Runs scanForArchives and resolves with whichever callback fired, so that the
 * callback-based API can be awaited in tests
 * @param {Array.<Object>} storages Mock DeviceStorage instances
 * @returns {Promise<Object>} Result object describing which callback was invoked
 */
function runScan (storages) {
    return new Promise(function (resolve) {
        zimArchiveLoader.scanForArchives(storages, function (directories) {
            resolve({ succeeded: true, directories: directories });
        }, function (message, title) {
            resolve({ succeeded: false, message: message, title: title });
        });
    });
}

describe('zimArchiveLoader.scanForArchives', function () {
    it('Report archives found in a single storage', async function () {
        const result = await runScan([mockStorage(['a.zim', 'b.zim'])]);
        expect(result.succeeded).to.be.true;
        expect(result.directories).to.have.members(['a.zim', 'b.zim']);
    });

    it('Merge archives found across several storages', async function () {
        const result = await runScan([
            mockStorage(['a.zim']),
            mockStorage(['b.zim', 'c.zim']),
            mockStorage(['d.zim'])
        ]);
        expect(result.succeeded).to.be.true;
        expect(result.directories).to.have.members(['a.zim', 'b.zim', 'c.zim', 'd.zim']);
    });

    it('Collect every archive when storages resolve out of order', async function () {
        const result = await runScan([
            mockStorage(['slow.zim'], 40),
            mockStorage(['fast.zim'], 5)
        ]);
        expect(result.succeeded).to.be.true;
        // Both must be present. Each storage appends to the same list as it resolves, so a
        // rewrite that built a new array and dropped it (e.g. calling concat without
        // assigning the result) would silently lose archives
        expect(result.directories).to.have.members(['fast.zim', 'slow.zim']);
    });

    it('Report an empty list when no storages are supplied', async function () {
        const result = await runScan([]);
        expect(result.succeeded).to.be.true;
        expect(result.directories).to.be.an('array').that.is.empty;
    });

    it('Skip storages that contain no archives', async function () {
        const result = await runScan([
            mockStorage([]),
            mockStorage(['only.zim']),
            mockStorage([])
        ]);
        expect(result.succeeded).to.be.true;
        expect(result.directories).to.have.members(['only.zim']);
    });

    it('Invoke the error callback if any storage fails to scan', async function () {
        const result = await runScan([
            mockStorage(['a.zim']),
            failingStorage(new Error('scan failed'))
        ]);
        expect(result.succeeded).to.be.false;
        // The message should carry the underlying error, and mention the Simulator workaround
        expect(result.message).to.contain('scan failed');
        expect(result.message).to.contain('fake-sdcard');
    });

    it('Invoke the error callback only once when every storage fails', async function () {
        let errorCallbackCount = 0;
        await new Promise(function (resolve) {
            zimArchiveLoader.scanForArchives([
                failingStorage(new Error('e1')),
                failingStorage(new Error('e2'), 20)
            ], function () {
                resolve();
            }, function () {
                errorCallbackCount++;
                // Wait beyond the second rejection to be sure it does not fire again
                setTimeout(resolve, 60);
            });
        });
        expect(errorCallbackCount).to.equal(1);
    });
});
