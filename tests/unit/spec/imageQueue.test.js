/* eslint-disable no-undef */
/**
 * Tests for shared sequential image-loading pipeline and WebP serialization (Issue #277 Step 2).
 *
 * Verifies that:
 * - WebP decoding operations through webpMachine are strictly serialized (zero concurrent decodes).
 * - processSequentialQueue executes items in FIFO order, waiting for each item's completion.
 * - Errors in individual items or candidates do not stall the queue or discard other items.
 * - Cancellation (via function or search object) prevents future items from starting.
 * - Stale DOM updates are prevented when an operation is cancelled in flight.
 * - Cancelled queues do not permanently block subsequent operations.
 * - Duplicate next() invocations are safely ignored.
 * - filterUnprocessedDirEntries deduplicates DirEntries across search stages.
 */

import { assert } from 'chai';
import '../js/init.js';
import uiUtil from '../../../www/js/lib/uiUtil.js';

describe('Shared Sequential Image Pipeline and WebP Serialization (Issue #277 Step 2)', function () {
    let originalWebpMachine;
    let originalParams;

    beforeEach(function () {
        uiUtil.resetWebpDecodeQueue();
        originalWebpMachine = global.webpMachine;
        originalParams = global.params;
        global.params = global.params || {};
        global.params.useCanvasElementsForWebpTranscoding = false;
    });

    afterEach(function () {
        global.webpMachine = originalWebpMachine;
        global.params = originalParams;
        uiUtil.resetWebpDecodeQueue();
    });

    describe('processSequentialQueue', function () {
        it('processes items in strict sequential order', async function () {
            const items = ['item1', 'item2', 'item3'];
            const startLog = [];
            const completeLog = [];

            await uiUtil.processSequentialQueue(items, function (item, next) {
                startLog.push(item);
                // Simulate asynchronous work
                setTimeout(function () {
                    completeLog.push(item);
                    next();
                }, 10);
            });

            assert.deepEqual(startLog, ['item1', 'item2', 'item3']);
            assert.deepEqual(completeLog, ['item1', 'item2', 'item3']);
        });

        it('supports Promise-returning processItem functions', async function () {
            const items = [1, 2, 3];
            const processed = [];

            await uiUtil.processSequentialQueue(items, function (item) {
                return new Promise(function (resolve) {
                    processed.push(item * 2);
                    resolve();
                });
            });

            assert.deepEqual(processed, [2, 4, 6]);
        });

        it('handles an empty list cleanly without errors', async function () {
            let onCompleteCalled = false;
            await uiUtil.processSequentialQueue([], function () {
                assert.fail('Should not process any item');
            }, {
                onComplete: function () {
                    onCompleteCalled = true;
                }
            });
            assert.isTrue(onCompleteCalled);
        });

        it('recovers from errors without blocking later independent items', async function () {
            const items = ['good1', 'fail', 'good2'];
            const processed = [];
            const errors = [];

            await uiUtil.processSequentialQueue(items, function (item, next) {
                if (item === 'fail') {
                    throw new Error('Failure processing item');
                }
                processed.push(item);
                next();
            }, {
                onError: function (err, item) {
                    errors.push({ item: item, error: err.message });
                }
            });

            assert.deepEqual(processed, ['good1', 'good2']);
            assert.equal(errors.length, 1);
            assert.equal(errors[0].item, 'fail');
        });

        it('recovers when next(err) is called with an error', async function () {
            const items = ['a', 'b_error', 'c'];
            const processed = [];
            const errorItems = [];

            await uiUtil.processSequentialQueue(items, function (item, next) {
                if (item === 'b_error') {
                    next(new Error('Async error in b'));
                    return;
                }
                processed.push(item);
                next();
            }, {
                onError: function (err, item) {
                    errorItems.push(item);
                }
            });

            assert.deepEqual(processed, ['a', 'c']);
            assert.deepEqual(errorItems, ['b_error']);
        });

        it('safely ignores duplicate next() calls for the same item', async function () {
            const items = ['first', 'second'];
            const processed = [];

            await uiUtil.processSequentialQueue(items, function (item, next) {
                processed.push(item);
                next();
                next(); // Redundant invocation
                next();
            });

            assert.deepEqual(processed, ['first', 'second']);
        });

        it('stops before starting when initially cancelled via function', async function () {
            let processed = false;
            let onCompleteCalled = false;

            await uiUtil.processSequentialQueue(['item1', 'item2'], function (item, next) {
                processed = true;
                next();
            }, {
                isCancelled: function () { return true; },
                onComplete: function () {
                    onCompleteCalled = true;
                }
            });

            assert.isFalse(processed);
            assert.isTrue(onCompleteCalled);
        });

        it('stops before starting when search object has status cancelled', async function () {
            let processed = false;
            const search = { prefix: 'test', status: 'cancelled' };

            await uiUtil.processSequentialQueue(['item1'], function (item, next) {
                processed = true;
                next();
            }, {
                search: search
            });

            assert.isFalse(processed);
        });

        it('cancels mid-queue and prevents subsequent items from starting', async function () {
            const items = [1, 2, 3, 4];
            const processed = [];
            let cancelled = false;

            await uiUtil.processSequentialQueue(items, function (item, next) {
                processed.push(item);
                if (item === 2) {
                    cancelled = true;
                }
                next();
            }, {
                isCancelled: function () { return cancelled; }
            });

            assert.deepEqual(processed, [1, 2]);
        });

        it('ensures a cancelled queue does not permanently block subsequent queues', async function () {
            // First queue is cancelled
            await uiUtil.processSequentialQueue(['c1', 'c2'], function (item, next) {
                next();
            }, {
                isCancelled: function () { return true; }
            });

            // Second queue should run normally
            const processed = [];
            await uiUtil.processSequentialQueue(['ok1', 'ok2'], function (item, next) {
                processed.push(item);
                next();
            });

            assert.deepEqual(processed, ['ok1', 'ok2']);
        });
    });

    describe('WebP Decoding Serialization (queueWebpDecode)', function () {
        it('guarantees that concurrent decode operations are executed strictly sequentially', async function () {
            let concurrentDecodes = 0;
            let maxConcurrentDecodes = 0;
            const executionOrder = [];

            function createMockTask (id, delayMs) {
                return function () {
                    concurrentDecodes++;
                    if (concurrentDecodes > maxConcurrentDecodes) {
                        maxConcurrentDecodes = concurrentDecodes;
                    }
                    executionOrder.push(id + '_start');

                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            executionOrder.push(id + '_end');
                            concurrentDecodes--;
                            resolve(id + '_result');
                        }, delayMs);
                    });
                };
            }

            // Launch 3 tasks concurrently into queueWebpDecode
            const p1 = uiUtil.queueWebpDecode(createMockTask('task1', 25));
            const p2 = uiUtil.queueWebpDecode(createMockTask('task2', 15));
            const p3 = uiUtil.queueWebpDecode(createMockTask('task3', 5));

            const results = await Promise.all([p1, p2, p3]);

            assert.deepEqual(results, ['task1_result', 'task2_result', 'task3_result']);
            assert.equal(maxConcurrentDecodes, 1, 'Max concurrent decodes must never exceed 1');
            assert.deepEqual(executionOrder, [
                'task1_start', 'task1_end',
                'task2_start', 'task2_end',
                'task3_start', 'task3_end'
            ]);
        });

        it('continues processing subsequent WebP tasks even if a prior task rejects', async function () {
            let task2Ran = false;

            const p1 = uiUtil.queueWebpDecode(function () {
                return Promise.reject(new Error('Decode failed'));
            });

            const p2 = uiUtil.queueWebpDecode(function () {
                task2Ran = true;
                return Promise.resolve('ok');
            });

            try {
                await p1;
                assert.fail('p1 should have rejected');
            } catch (err) {
                assert.equal(err.message, 'Decode failed');
            }

            const res2 = await p2;
            assert.isTrue(task2Ran);
            assert.equal(res2, 'ok');
        });

        it('ensures resetting the queue cannot interfere with an in-flight decode', async function () {
            let task1Done = false;
            let task2StartedWhileTask1Pending = false;

            const p1 = uiUtil.queueWebpDecode(function () {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        task1Done = true;
                        resolve('task1_done');
                    }, 25);
                });
            });

            // Reset queue while task1 is in flight
            uiUtil.resetWebpDecodeQueue();

            // Enqueue task2 immediately after reset
            const p2 = uiUtil.queueWebpDecode(function () {
                if (!task1Done) {
                    task2StartedWhileTask1Pending = true;
                }
                return Promise.resolve('task2_done');
            });

            const results = await Promise.all([p1, p2]);
            assert.deepEqual(results, ['task1_done', 'task2_done']);
            assert.isFalse(task2StartedWhileTask1Pending, 'Task 2 must not start while Task 1 is still in flight');
        });
    });

    describe('uiUtil.transcodeWebpToDataUri', function () {
        it('transcodes WebP content via webpMachine and returns a data URI', async function () {
            let decodeCalled = false;
            global.webpMachine = {
                decodeToCanvas: function (canvas) {
                    decodeCalled = true;
                    canvas.toDataURL = function () {
                        return 'data:image/png;base64,TRANSMUTED';
                    };
                    return Promise.resolve();
                }
            };

            const dataUri = await uiUtil.transcodeWebpToDataUri(new Uint8Array([1, 2, 3]));
            assert.isTrue(decodeCalled);
            assert.equal(dataUri, 'data:image/png;base64,TRANSMUTED');
        });

        it('rejects immediately when isCancelled returns true', async function () {
            let decodeCalled = false;
            global.webpMachine = {
                decodeToCanvas: function () {
                    decodeCalled = true;
                    return Promise.resolve();
                }
            };

            try {
                await uiUtil.transcodeWebpToDataUri(new Uint8Array([1, 2, 3]), function () { return true; });
                assert.fail('Should reject when cancelled');
            } catch (err) {
                assert.include(err.message, 'cancelled');
            }
            assert.isFalse(decodeCalled);
        });
    });

    describe('uiUtil.feedNodeWithDataURI with cancellation and WebP', function () {
        it('serializes WebP feedNodeWithDataURI calls and updates node attribute', async function () {
            let decodeCount = 0;
            let activeDecodes = 0;
            let maxConcurrent = 0;

            global.webpMachine = {
                decodeToCanvas: function (canvas) {
                    activeDecodes++;
                    decodeCount++;
                    if (activeDecodes > maxConcurrent) maxConcurrent = activeDecodes;
                    canvas.toDataURL = function () {
                        return 'data:image/png;base64,DECODED_' + decodeCount;
                    };
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            activeDecodes--;
                            resolve();
                        }, 10);
                    });
                }
            };

            const node1 = {
                attrs: {},
                setAttribute: function (k, v) { this.attrs[k] = v; }
            };
            const node2 = {
                attrs: {},
                setAttribute: function (k, v) { this.attrs[k] = v; }
            };

            const p1 = new Promise(function (resolve) {
                uiUtil.feedNodeWithDataURI(node1, 'src', new Uint8Array([1]), 'image/webp', resolve);
            });
            const p2 = new Promise(function (resolve) {
                uiUtil.feedNodeWithDataURI(node2, 'src', new Uint8Array([2]), 'image/webp', resolve);
            });

            await Promise.all([p1, p2]);

            assert.equal(maxConcurrent, 1, 'WebP decoding must never overlap');
            assert.equal(node1.attrs.src, 'data:image/png;base64,DECODED_1');
            assert.equal(node2.attrs.src, 'data:image/png;base64,DECODED_2');
        });

        it('does not mutate node when cancelled before or during WebP decoding', async function () {
            let decodeStarted = false;
            let cancelled = false;

            global.webpMachine = {
                decodeToCanvas: function (canvas) {
                    decodeStarted = true;
                    canvas.toDataURL = function () {
                        return 'data:image/png;base64,STALE';
                    };
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            cancelled = true; // Cancel while decode is in flight
                            resolve();
                        }, 10);
                    });
                }
            };

            const node = {
                attrs: {},
                setAttribute: function (k, v) { this.attrs[k] = v; }
            };

            await new Promise(function (resolve) {
                uiUtil.feedNodeWithDataURI(node, 'src', new Uint8Array([1]), 'image/webp', resolve, function () { return cancelled; });
            });

            assert.isTrue(decodeStarted);
            assert.isUndefined(node.attrs.src, 'Cancelled operation must not update DOM node');
        });

        it('does not mutate node when cancelled for non-WebP image', async function () {
            const node = {
                attrs: {},
                setAttribute: function (k, v) { this.attrs[k] = v; }
            };

            await new Promise(function (resolve) {
                uiUtil.feedNodeWithDataURI(node, 'src', new Uint8Array([1, 2]), 'image/png', resolve, function () { return true; });
            });

            // Wait a tick for getDataUriFromUint8Array promise to resolve
            await new Promise(function (resolve) { setTimeout(resolve, 20); });

            assert.isUndefined(node.attrs.src, 'Cancelled non-WebP must not mutate node');
        });

        it('preserves srcset candidate order and descriptors in sequential processing', async function () {
            const srcsetArr = ['small.jpg 1x', 'medium.jpg 2x', 'large.jpg 3x'];
            const mockArchive = {
                'small.jpg': 'data:image/jpeg;base64,SMALL',
                'medium.jpg': 'data:image/jpeg;base64,MEDIUM',
                'large.jpg': 'data:image/jpeg;base64,LARGE'
            };
            const mockElement = { srcset: '' };
            const results = [];

            await uiUtil.processSequentialQueue(srcsetArr, function (candidateStr, next) {
                const parts = candidateStr.trim().split(/\s+/);
                const url = parts[0];
                const descriptor = parts[1] || '';
                setTimeout(function () {
                    const dataUri = mockArchive[url];
                    results.push(dataUri + (descriptor ? ' ' + descriptor : ''));
                    mockElement.srcset = results.join(', ');
                    next();
                }, 10);
            });

            assert.equal(
                mockElement.srcset,
                'data:image/jpeg;base64,SMALL 1x, data:image/jpeg;base64,MEDIUM 2x, data:image/jpeg;base64,LARGE 3x'
            );
        });

        it('continues processing remaining srcset candidates when one candidate fails', async function () {
            const srcsetArr = ['valid1.jpg 1x', 'missing.jpg 2x', 'valid2.jpg 3x'];
            const results = [];

            await uiUtil.processSequentialQueue(srcsetArr, function (candidateStr, next) {
                const parts = candidateStr.trim().split(/\s+/);
                const url = parts[0];
                const descriptor = parts[1] || '';
                if (url === 'missing.jpg') {
                    // Simulates lookup error
                    next(new Error('File not found in archive'));
                    return;
                }
                results.push('data:image/jpeg;base64,' + url + (descriptor ? ' ' + descriptor : ''));
                next();
            });

            assert.deepEqual(results, [
                'data:image/jpeg;base64,valid1.jpg 1x',
                'data:image/jpeg;base64,valid2.jpg 3x'
            ]);
        });
    });

    describe('filterUnprocessedDirEntries', function () {
        it('deduplicates DirEntries against a Set of previously processed IDs', function () {
            const processedSet = new Set(['entry-1']);
            const entries = [
                { toStringId: () => 'entry-1', title: 'Article 1' },
                { toStringId: () => 'entry-2', title: 'Article 2' },
                { toStringId: () => 'entry-3', title: 'Article 3' }
            ];

            const filtered = uiUtil.filterUnprocessedDirEntries(entries, processedSet);
            assert.equal(filtered.length, 2);
            assert.equal(filtered[0].title, 'Article 2');
            assert.equal(filtered[1].title, 'Article 3');
            assert.isTrue(processedSet.has('entry-2'));
            assert.isTrue(processedSet.has('entry-3'));
        });

        it('deduplicates DirEntries against a plain Object map', function () {
            const processedMap = { 'entry-1': true };
            const entries = [
                { toStringId: () => 'entry-1', title: 'Article 1' },
                { toStringId: () => 'entry-2', title: 'Article 2' }
            ];

            const filtered = uiUtil.filterUnprocessedDirEntries(entries, processedMap);
            assert.equal(filtered.length, 1);
            assert.equal(filtered[0].title, 'Article 2');
            assert.isTrue(processedMap['entry-2']);
        });

        it('handles null, undefined, and empty arrays safely', function () {
            assert.deepEqual(uiUtil.filterUnprocessedDirEntries([], new Set()), []);
            assert.deepEqual(uiUtil.filterUnprocessedDirEntries(null, new Set()), []);
            assert.deepEqual(uiUtil.filterUnprocessedDirEntries([{ url: 'a' }], null), [{ url: 'a' }]);
        });
    });
});
