import { expect } from 'chai';
import libzimWorkerManager from '../../../www/js/lib/libzimWorkerManager.js';
import zimArchiveModule from '../../../www/js/lib/zimArchive.js';

describe('libzimWorkerManager archive switching', function () {
    let originalWorker;
    let workers;

    class ControlledWorker {
        constructor (url) {
            this.url = url;
            this.actions = [];
            workers.push(this);
        }

        postMessage (message, ports) {
            this.actions.push(message.action);
            if (message.action === 'init') this.initPort = ports[0];
            else if (message.action === 'search' && this.deferSearch) this.searchPort = ports[0];
            else if (message.action === 'search') ports[0].postMessage({ error: 'full-text index unavailable' });
            else ports[0].postMessage({ action: message.action });
        }

        terminate () {
            this.terminated = true;
        }

        finishInitialization () {
            this.initPort.postMessage('ready');
        }
    }

    beforeEach(function () {
        originalWorker = globalThis.Worker;
        workers = [];
        globalThis.Worker = ControlledWorker;
    });

    afterEach(function () {
        libzimWorkerManager.terminate();
        globalThis.Worker = originalWorker;
    });

    it('ignores errors from an old worker after a replacement is active', async function () {
        const oldArchive = {};
        const currentArchive = {};
        libzimWorkerManager.setArchive(oldArchive);
        const oldInit = libzimWorkerManager.initialize(oldArchive, [], 'old-worker.js');
        oldInit.catch(function () {});

        libzimWorkerManager.setArchive(currentArchive);
        const currentInit = libzimWorkerManager.initialize(currentArchive, [], 'current-worker.js');
        const oldWorker = workers[0];
        const currentWorker = workers[1];
        oldWorker.onerror({ message: 'late worker failure' });
        currentWorker.finishInitialization();
        await currentInit;

        expect(libzimWorkerManager.hasWorker(currentArchive)).to.equal(true);
        expect(await libzimWorkerManager.call(currentArchive, { action: 'ping' })).to.deep.equal({ action: 'ping' });
        expect(currentWorker.actions).to.deep.equal(['init', 'ping']);
    });

    it('tracks not-initialized, initializing, and ready states for the active archive', async function () {
        const archive = {};
        libzimWorkerManager.setArchive(archive);
        expect(libzimWorkerManager.getState(archive)).to.equal('not-initialized');

        const init = libzimWorkerManager.initialize(archive, [], 'state-worker.js');
        expect(libzimWorkerManager.getState(archive)).to.equal('initializing');
        workers[0].finishInitialization();
        await init;

        expect(libzimWorkerManager.getState(archive)).to.equal('ready');
        expect(libzimWorkerManager.getState({})).to.equal('inactive');
    });

    it('does not send a queued old-archive call to the replacement worker', async function () {
        const oldArchive = {};
        const currentArchive = {};
        libzimWorkerManager.setArchive(oldArchive);
        const oldInit = libzimWorkerManager.initialize(oldArchive, [], 'old-worker.js');
        oldInit.catch(function () {});
        const queuedCall = libzimWorkerManager.call(oldArchive, { action: 'old-call' });
        const queuedCallResult = queuedCall.then(function () { return null; }, function (error) { return error; });

        libzimWorkerManager.setArchive(currentArchive);
        const currentInit = libzimWorkerManager.initialize(currentArchive, [], 'current-worker.js');
        const oldWorker = workers[0];
        const currentWorker = workers[1];
        oldWorker.finishInitialization();
        currentWorker.finishInitialization();
        await currentInit;

        const result = await queuedCallResult;
        expect(result).to.be.instanceOf(Error);
        expect(currentWorker.actions).to.deep.equal(['init']);
    });

    it('does not send a queued call to a replacement worker for the same archive object', async function () {
        const archive = {};
        libzimWorkerManager.setArchive(archive);
        const firstInit = libzimWorkerManager.initialize(archive, [], 'first-worker.js');
        const firstWorker = workers[0];
        firstWorker.finishInitialization();
        await firstInit;

        const queuedCall = libzimWorkerManager.call(archive, { action: 'queued-call' });
        const queuedCallResult = queuedCall.then(function () { return null; }, function (error) { return error; });
        libzimWorkerManager.terminate(archive);
        libzimWorkerManager.setArchive(archive);
        const replacementInit = libzimWorkerManager.initialize(archive, [], 'replacement-worker.js');
        const replacementWorker = workers[1];
        replacementWorker.finishInitialization();
        await replacementInit;

        const result = await queuedCallResult;
        expect(result).to.be.instanceOf(Error);
        expect(replacementWorker.actions).to.deep.equal(['init']);
    });

    it('completes title search when the libzim full-text action returns an error', async function () {
        const archive = Object.create(zimArchiveModule.ZIMArchive.prototype);
        archive.file = { fullTextIndex: true, minorVersion: 0 };
        archive.findDirEntriesWithPrefixCaseSensitive = function (prefix, search, callback) {
            callback([], false, false);
        };
        libzimWorkerManager.setArchive(archive);
        const init = libzimWorkerManager.initialize(archive, [], 'search-worker.js');
        const worker = workers[0];
        worker.finishInitialization();
        await init;

        const search = { prefix: 'query', size: 2, status: 'new' };
        const results = await new Promise(function (resolve) {
            archive.findDirEntriesWithPrefix(search, resolve, true);
        });
        await new Promise(function (resolve) { setTimeout(resolve, 0); });

        expect(results).to.deep.equal([]);
        expect(search.status).to.equal('complete');
        expect(search.type).to.not.equal('fulltext');
        expect(worker.actions).to.include('search');
    });

    it('waits for pending full-text results after title search exhausts', async function () {
        const archive = Object.create(zimArchiveModule.ZIMArchive.prototype);
        archive.file = { fullTextIndex: true, minorVersion: 0 };
        archive.findDirEntriesWithPrefixCaseSensitive = function (prefix, search, callback) {
            callback([], false, false);
        };
        libzimWorkerManager.setArchive(archive);
        const init = libzimWorkerManager.initialize(archive, [], 'deferred-search-worker.js');
        const worker = workers[0];
        worker.finishInitialization();
        await init;
        worker.deferSearch = true;

        const search = { prefix: 'query', size: 2, status: 'new' };
        const callbacks = [];
        const searchComplete = new Promise(function (resolve) {
            archive.findDirEntriesWithPrefix(search, function (entries, result) {
                callbacks.push({ entries: entries, status: result.status });
                if (result.status === 'complete') resolve(entries);
            }, true);
        });

        await Promise.resolve();
        await Promise.resolve();
        expect(search.status).to.equal('interim');
        expect(callbacks).to.deep.equal([]);
        expect(worker.searchPort).to.exist;

        worker.searchPort.postMessage({ results: [] });
        expect(await searchComplete).to.deep.equal([]);
        expect(callbacks).to.have.length(1);
        expect(search.status).to.equal('complete');
        expect(search.type).to.equal('fulltext');
    });
});