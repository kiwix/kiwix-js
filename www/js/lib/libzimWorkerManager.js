'use strict';

var REQUEST_TIMEOUT_MS = 30000;
var INIT_TIMEOUT_MS = 120000;
var activeArchive = null;
var worker = null;
var initPromise = null;
var workerState = 'inactive';
var pendingRequests = new Set();

function makeWorkerError (code, message, cause) {
    var error = new Error(message);
    error.code = code;
    if (cause) error.cause = cause;
    return error;
}

function closeRequest (request) {
    if (request.timer) clearTimeout(request.timer);
    request.port.close();
    pendingRequests.delete(request);
}

function settleRequest (request, handler, value) {
    if (request.settled) return;
    request.settled = true;
    closeRequest(request);
    handler(value);
}

function rejectPendingRequests (error) {
    Array.from(pendingRequests).forEach(function (request) {
        settleRequest(request, request.reject, error);
    });
}

function clearWorker (error, expectedWorker, nextState) {
    if (expectedWorker && worker !== expectedWorker) return;
    var oldWorker = worker;
    worker = null;
    initPromise = null;
    workerState = nextState || (activeArchive ? 'not-initialized' : 'inactive');
    rejectPendingRequests(error);
    if (oldWorker) oldWorker.terminate();
}

function sendMessage (targetWorker, parameters, timeoutMs) {
    return new Promise(function (resolve, reject) {
        var channel = new MessageChannel();
        var request = {
            port: channel.port1,
            worker: targetWorker,
            reject: reject,
            settled: false,
            timer: null
        };
        pendingRequests.add(request);
        request.port.onmessage = function (event) {
            settleRequest(request, resolve, event.data);
        };
        request.port.onmessageerror = function (event) {
            settleRequest(request, reject, makeWorkerError('WORKER_ERROR', 'Could not read libzim worker response', event));
        };
        request.port.onerror = function (event) {
            settleRequest(request, reject, makeWorkerError('WORKER_ERROR', 'Libzim worker response channel failed', event));
        };
        if (timeoutMs) {
            request.timer = setTimeout(function () {
                settleRequest(request, reject, makeWorkerError('WORKER_TIMEOUT', 'Timed out waiting for libzim worker response'));
            }, timeoutMs);
        }
        try {
            targetWorker.postMessage(parameters, [channel.port2]);
        } catch (error) {
            settleRequest(request, reject, makeWorkerError('WORKER_ERROR', 'Could not send request to libzim worker', error));
        }
    });
}

var libzimWorkerManager = {
    setArchive: function (archive) {
        if (activeArchive !== archive) {
            clearWorker(makeWorkerError('ARCHIVE_CHANGED', 'The active archive changed'), null, archive ? 'not-initialized' : 'inactive');
            activeArchive = archive;
        }
    },

    initialize: function (archive, files, workerUrl) {
        if (activeArchive !== archive) {
            return Promise.reject(new Error('Cannot initialize libzim for an inactive archive'));
        }
        if (initPromise) return initPromise;

        workerState = 'initializing';
        var currentWorker;
        try {
            currentWorker = new Worker(workerUrl);
        } catch (error) {
            workerState = 'error';
            return Promise.reject(makeWorkerError('WORKER_ERROR', 'Could not create libzim worker', error));
        }
        worker = currentWorker;
        currentWorker.onerror = function (event) {
            var error = makeWorkerError('WORKER_ERROR', event.message || 'Libzim worker failed', event.error);
            clearWorker(error, currentWorker, 'error');
        };
        currentWorker.onmessageerror = function (event) {
            clearWorker(makeWorkerError('WORKER_ERROR', 'Could not read libzim worker message', event), currentWorker, 'error');
        };

        var currentInitPromise = sendMessage(currentWorker, { action: 'init', files: files }, INIT_TIMEOUT_MS)
            .then(function (response) {
                if (activeArchive !== archive || worker !== currentWorker) {
                    throw makeWorkerError('ARCHIVE_CHANGED', 'The active archive changed during libzim initialization');
                }
                workerState = 'ready';
                return response;
            })
            .catch(function (error) {
                clearWorker(error, currentWorker, 'error');
                throw error;
            });
        initPromise = currentInitPromise;
        return currentInitPromise;
    },

    call: function (archive, parameters) {
        if (activeArchive !== archive || !initPromise || !worker) {
            return Promise.reject(makeWorkerError('WORKER_UNAVAILABLE', 'Libzim worker is not available for the active archive'));
        }
        var currentInitPromise = initPromise;
        var currentWorker = worker;
        return currentInitPromise.then(function () {
            if (activeArchive !== archive || worker !== currentWorker || initPromise !== currentInitPromise) {
                throw makeWorkerError('ARCHIVE_CHANGED', 'The active archive changed before the libzim call');
            }
            return sendMessage(currentWorker, parameters, REQUEST_TIMEOUT_MS);
        });
    },

    isActive: function (archive) {
        return activeArchive === archive;
    },

    hasWorker: function (archive) {
        return activeArchive === archive && !!worker;
    },

    getState: function (archive) {
        return activeArchive === archive ? workerState : 'inactive';
    },

    terminate: function (archive) {
        if (archive && activeArchive !== archive) return;
        clearWorker(makeWorkerError('ARCHIVE_CHANGED', 'Libzim worker terminated'), null, 'inactive');
        activeArchive = null;
    }
};

export default libzimWorkerManager;