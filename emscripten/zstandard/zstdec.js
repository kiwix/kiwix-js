
var ZD = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return (
function(ZD) {
  ZD = ZD || {};



// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof ZD !== 'undefined' ? ZD : {};

// Include a Promise polyfill for legacy browsers. This is needed either for
// wasm2js, where we polyfill the wasm API which needs Promises, or when using
// modularize which creates a Promise for when the module is ready.

// Promise polyfill from https://github.com/taylorhakes/promise-polyfill
// License:
//==============================================================================
// Copyright (c) 2014 Taylor Hakes
// Copyright (c) 2014 Forbes Lindesay
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//==============================================================================

/** @suppress{duplicate} This is already defined in from Closure's built-in
    externs.zip//es6.js, Closure should not yell when seeing this again. */
var Promise = (function() {
  function noop() {}

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function() {
      fn.apply(thisArg, arguments);
    };
  }

  /**
   * @constructor
   * @param {Function} fn
   */
  function Promise(fn) {
    if (!(this instanceof Promise))
      throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    /** @type {!number} */
    this._state = 0;
    /** @type {!boolean} */
    this._handled = false;
    /** @type {Promise|undefined} */
    this._value = undefined;
    /** @type {!Array<!Function>} */
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    Promise._immediateFn(function() {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self)
        throw new TypeError('A promise cannot be resolved with itself.');
      if (
        newValue &&
        (typeof newValue === 'object' || typeof newValue === 'function')
      ) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      Promise._immediateFn(function() {
        if (!self._handled) {
          Promise._unhandledRejectionFn(self._value);
        }
      });
    }

    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  /**
   * @constructor
   */
  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(
        function(value) {
          if (done) return;
          done = true;
          resolve(self, value);
        },
        function(reason) {
          if (done) return;
          done = true;
          reject(self, reason);
        }
      );
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype['catch'] = function(onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    // @ts-ignore
    var prom = new this.constructor(noop);

    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.all = function(arr) {
    return new Promise(function(resolve, reject) {
      if (!Array.isArray(arr)) {
        return reject(new TypeError('Promise.all accepts an array'));
      }

      var args = Array.prototype.slice.call(arr);
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(
                val,
                function(val) {
                  res(i, val);
                },
                reject
              );
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function(value) {
    if (value && typeof value === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(function(resolve) {
      resolve(value);
    });
  };

  Promise.reject = function(value) {
    return new Promise(function(resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function(arr) {
    return new Promise(function(resolve, reject) {
      if (!Array.isArray(arr)) {
        return reject(new TypeError('Promise.race accepts an array'));
      }

      for (var i = 0, len = arr.length; i < len; i++) {
        Promise.resolve(arr[i]).then(resolve, reject);
      }
    });
  };

  // Use polyfill for setImmediate for performance gains
  Promise._immediateFn =
    // @ts-ignore
    (typeof setImmediate === 'function' &&
      function(fn) {
        // @ts-ignore
        setImmediate(fn);
      }) ||
    function(fn) {
      setTimeout(fn, 0); // XXX EMSCRIPTEN: just use setTimeout
    };

  Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
  };

  return Promise;
})();




// Set up the promise that indicates the Module is initialized
var readyPromiseResolve, readyPromiseReject;
Module['ready'] = new Promise(function(resolve, reject) {
  readyPromiseResolve = resolve;
  readyPromiseReject = reject;
});

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_ZSTD_createDStream')) {
        Object.defineProperty(Module['ready'], '_ZSTD_createDStream', { configurable: true, get: function() { abort('You are getting _ZSTD_createDStream on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_ZSTD_createDStream', { configurable: true, set: function() { abort('You are setting _ZSTD_createDStream on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_ZSTD_initDStream')) {
        Object.defineProperty(Module['ready'], '_ZSTD_initDStream', { configurable: true, get: function() { abort('You are getting _ZSTD_initDStream on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_ZSTD_initDStream', { configurable: true, set: function() { abort('You are setting _ZSTD_initDStream on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_ZSTD_decompressStream')) {
        Object.defineProperty(Module['ready'], '_ZSTD_decompressStream', { configurable: true, get: function() { abort('You are getting _ZSTD_decompressStream on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_ZSTD_decompressStream', { configurable: true, set: function() { abort('You are setting _ZSTD_decompressStream on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_ZSTD_decompressStream_simpleArgs')) {
        Object.defineProperty(Module['ready'], '_ZSTD_decompressStream_simpleArgs', { configurable: true, get: function() { abort('You are getting _ZSTD_decompressStream_simpleArgs on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_ZSTD_decompressStream_simpleArgs', { configurable: true, set: function() { abort('You are setting _ZSTD_decompressStream_simpleArgs on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_ZSTD_isError')) {
        Object.defineProperty(Module['ready'], '_ZSTD_isError', { configurable: true, get: function() { abort('You are getting _ZSTD_isError on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_ZSTD_isError', { configurable: true, set: function() { abort('You are setting _ZSTD_isError on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_ZSTD_freeDStream')) {
        Object.defineProperty(Module['ready'], '_ZSTD_freeDStream', { configurable: true, get: function() { abort('You are getting _ZSTD_freeDStream on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_ZSTD_freeDStream', { configurable: true, set: function() { abort('You are setting _ZSTD_freeDStream on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_ZSTD_getInBuffer')) {
        Object.defineProperty(Module['ready'], '_ZSTD_getInBuffer', { configurable: true, get: function() { abort('You are getting _ZSTD_getInBuffer on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_ZSTD_getInBuffer', { configurable: true, set: function() { abort('You are setting _ZSTD_getInBuffer on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_ZSTD_getOutBuffer')) {
        Object.defineProperty(Module['ready'], '_ZSTD_getOutBuffer', { configurable: true, get: function() { abort('You are getting _ZSTD_getOutBuffer on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_ZSTD_getOutBuffer', { configurable: true, set: function() { abort('You are setting _ZSTD_getOutBuffer on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_ZSTD_DStreamInSize')) {
        Object.defineProperty(Module['ready'], '_ZSTD_DStreamInSize', { configurable: true, get: function() { abort('You are getting _ZSTD_DStreamInSize on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_ZSTD_DStreamInSize', { configurable: true, set: function() { abort('You are setting _ZSTD_DStreamInSize on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_ZSTD_DStreamOutSize')) {
        Object.defineProperty(Module['ready'], '_ZSTD_DStreamOutSize', { configurable: true, get: function() { abort('You are getting _ZSTD_DStreamOutSize on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_ZSTD_DStreamOutSize', { configurable: true, set: function() { abort('You are setting _ZSTD_DStreamOutSize on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_malloc')) {
        Object.defineProperty(Module['ready'], '_malloc', { configurable: true, get: function() { abort('You are getting _malloc on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_malloc', { configurable: true, set: function() { abort('You are setting _malloc on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_free')) {
        Object.defineProperty(Module['ready'], '_free', { configurable: true, get: function() { abort('You are getting _free on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_free', { configurable: true, set: function() { abort('You are setting _free on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_stackSave')) {
        Object.defineProperty(Module['ready'], '_stackSave', { configurable: true, get: function() { abort('You are getting _stackSave on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_stackSave', { configurable: true, set: function() { abort('You are setting _stackSave on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_stackRestore')) {
        Object.defineProperty(Module['ready'], '_stackRestore', { configurable: true, get: function() { abort('You are getting _stackRestore on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_stackRestore', { configurable: true, set: function() { abort('You are setting _stackRestore on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '_stackAlloc')) {
        Object.defineProperty(Module['ready'], '_stackAlloc', { configurable: true, get: function() { abort('You are getting _stackAlloc on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '_stackAlloc', { configurable: true, set: function() { abort('You are setting _stackAlloc on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '___data_end')) {
        Object.defineProperty(Module['ready'], '___data_end', { configurable: true, get: function() { abort('You are getting ___data_end on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '___data_end', { configurable: true, set: function() { abort('You are setting ___data_end on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '___wasm_call_ctors')) {
        Object.defineProperty(Module['ready'], '___wasm_call_ctors', { configurable: true, get: function() { abort('You are getting ___wasm_call_ctors on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '___wasm_call_ctors', { configurable: true, set: function() { abort('You are setting ___wasm_call_ctors on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], '___errno_location')) {
        Object.defineProperty(Module['ready'], '___errno_location', { configurable: true, get: function() { abort('You are getting ___errno_location on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], '___errno_location', { configurable: true, set: function() { abort('You are setting ___errno_location on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

      if (!Object.getOwnPropertyDescriptor(Module['ready'], 'onRuntimeInitialized')) {
        Object.defineProperty(Module['ready'], 'onRuntimeInitialized', { configurable: true, get: function() { abort('You are getting onRuntimeInitialized on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
        Object.defineProperty(Module['ready'], 'onRuntimeInitialized', { configurable: true, set: function() { abort('You are setting onRuntimeInitialized on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js') } });
      }
    

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// {{PRE_JSES}}

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = function(status, toThrow) {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
}



// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

var nodeFS;
var nodePath;

if (ENVIRONMENT_IS_NODE) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = require('path').dirname(scriptDirectory) + '/';
  } else {
    scriptDirectory = __dirname + '/';
  }




  read_ = function shell_read(filename, binary) {
    var ret = tryParseAsDataURI(filename);
    if (ret) {
      return binary ? ret : ret.toString();
    }
    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');
    filename = nodePath['normalize'](filename);
    return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
  };

  readBinary = function readBinary(filename) {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };




  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = process['argv'].slice(2);

  // MODULARIZE will export the module in the proper place outside, we don't need to export here

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  process['on']('unhandledRejection', abort);

  quit_ = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };



} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      var data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    var data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit === 'function') {
    quit_ = function(status) {
      quit(status);
    };
  }

  if (typeof print !== 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console === 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr !== 'undefined' ? printErr : print);
  }


} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // When MODULARIZE, this JS may be executed later, after document.currentScript
  // is gone, so we saved it, and we use it here instead of any other info.
  if (_scriptDir) {
    scriptDirectory = _scriptDir;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }


  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  {




  read_ = function shell_read(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
    } catch (err) {
      var data = tryParseAsDataURI(url);
      if (data) {
        return intArrayToString(data);
      }
      throw err;
    }
  };

  if (ENVIRONMENT_IS_WORKER) {
    readBinary = function readBinary(url) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
      } catch (err) {
        var data = tryParseAsDataURI(url);
        if (data) {
          return data;
        }
        throw err;
      }
    };
  }

  readAsync = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      var data = tryParseAsDataURI(url);
      if (data) {
        onload(data.buffer);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };




  }

  setWindowTitle = function(title) { document.title = title };
} else
{
  throw new Error('environment detection error');
}


// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.
if (Module['arguments']) arguments_ = Module['arguments'];if (!Object.getOwnPropertyDescriptor(Module, 'arguments')) Object.defineProperty(Module, 'arguments', { configurable: true, get: function() { abort('Module.arguments has been replaced with plain arguments_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)') } });
if (Module['thisProgram']) thisProgram = Module['thisProgram'];if (!Object.getOwnPropertyDescriptor(Module, 'thisProgram')) Object.defineProperty(Module, 'thisProgram', { configurable: true, get: function() { abort('Module.thisProgram has been replaced with plain thisProgram (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)') } });
if (Module['quit']) quit_ = Module['quit'];if (!Object.getOwnPropertyDescriptor(Module, 'quit')) Object.defineProperty(Module, 'quit', { configurable: true, get: function() { abort('Module.quit has been replaced with plain quit_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)') } });

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] === 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] === 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] === 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] === 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
assert(typeof Module['TOTAL_MEMORY'] === 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
if (!Object.getOwnPropertyDescriptor(Module, 'read')) Object.defineProperty(Module, 'read', { configurable: true, get: function() { abort('Module.read has been replaced with plain read_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)') } });
if (!Object.getOwnPropertyDescriptor(Module, 'readAsync')) Object.defineProperty(Module, 'readAsync', { configurable: true, get: function() { abort('Module.readAsync has been replaced with plain readAsync (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)') } });
if (!Object.getOwnPropertyDescriptor(Module, 'readBinary')) Object.defineProperty(Module, 'readBinary', { configurable: true, get: function() { abort('Module.readBinary has been replaced with plain readBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)') } });
if (!Object.getOwnPropertyDescriptor(Module, 'setWindowTitle')) Object.defineProperty(Module, 'setWindowTitle', { configurable: true, get: function() { abort('Module.setWindowTitle has been replaced with plain setWindowTitle (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)') } });
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';






// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;

function dynamicAlloc(size) {
  assert(DYNAMICTOP_PTR);
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  assert(end <= HEAP8.length, 'failure to dynamicAlloc - memory growth etc. is not supported there, call malloc/sbrk directly');
  HEAP32[DYNAMICTOP_PTR>>2] = end;
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = Number(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}








// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {
  return func;
}

var freeTableIndexes = [];

// Weak map of functions in the table to their indexes, created on first use.
var functionsInTableMap;

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
  var table = wasmTable;

  // Check if the function is already in the table, to ensure each function
  // gets a unique index. First, create the map if this is the first use.
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap();
    for (var i = 0; i < table.length; i++) {
      var item = table.get(i);
      // Ignore null values.
      if (item) {
        functionsInTableMap.set(item, i);
      }
    }
  }
  if (functionsInTableMap.has(func)) {
    return functionsInTableMap.get(func);
  }

  // It's not in the table, add it now.


  var ret;
  // Reuse a free index if there is one, otherwise grow.
  if (freeTableIndexes.length) {
    ret = freeTableIndexes.pop();
  } else {
    ret = table.length;
    // Grow the table
    try {
      table.grow(1);
    } catch (err) {
      if (!(err instanceof RangeError)) {
        throw err;
      }
      throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
    }
  }

  // Set the new value.
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    table.set(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    assert(typeof sig !== 'undefined', 'Missing signature argument to addFunction');
    var wrapped = convertJsFunctionToWasm(func, sig);
    table.set(ret, wrapped);
  }

  functionsInTableMap.set(func, ret);

  return ret;
}

function removeFunctionWasm(index) {
  functionsInTableMap.delete(wasmTable.get(index));
  freeTableIndexes.push(index);
}

// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {
  assert(typeof func !== 'undefined');

  return addFunctionWasm(func, sig);
}

function removeFunction(index) {
  removeFunctionWasm(index);
}



var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}







function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

/** @param {Array=} args */
function dynCall(sig, ptr, args) {
  if (args && args.length) {
    // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
    assert(args.length === sig.substring(1).replace(/j/g, '--').length);
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    assert(sig.length == 1);
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    return Module['dynCall_' + sig].call(null, ptr);
  }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
};

var getTempRet0 = function() {
  return tempRet0;
};

function getCompilerSetting(name) {
  throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
}

// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;





// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html


var wasmBinary;if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];if (!Object.getOwnPropertyDescriptor(Module, 'wasmBinary')) Object.defineProperty(Module, 'wasmBinary', { configurable: true, get: function() { abort('Module.wasmBinary has been replaced with plain wasmBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)') } });
var noExitRuntime;if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];if (!Object.getOwnPropertyDescriptor(Module, 'noExitRuntime')) Object.defineProperty(Module, 'noExitRuntime', { configurable: true, get: function() { abort('Module.noExitRuntime has been replaced with plain noExitRuntime (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)') } });




// wasm2js.js - enough of a polyfill for the WebAssembly object so that we can load
// wasm2js code that way.

// Emit "var WebAssembly" if definitely using wasm2js. Otherwise, in MAYBE_WASM2JS
// mode, we can't use a "var" since it would prevent normal wasm from working.
/** @suppress{const} */
var
WebAssembly = {
  // Note that we do not use closure quoting (this['buffer'], etc.) on these
  // functions, as they are just meant for internal use. In other words, this is
  // not a fully general polyfill.
  Memory: function(opts) {
    this.buffer = new ArrayBuffer(opts['initial'] * 65536);
    this.grow = function(amount) {
      var oldBuffer = this.buffer;
      var ret = __growWasmMemory(amount);
      assert(this.buffer !== oldBuffer); // the call should have updated us
      return ret;
    };
  },

  // Table is not a normal constructor and instead returns the array object.
  // That lets us use the length property automatically, which is simpler and
  // smaller (but instanceof will not report that an instance of Table is an
  // instance of this function).
  Table: /** @constructor */ function(opts) {
    var ret = new Array(opts['initial']);
    ret.grow = function(by) {
      if (ret.length >= 1 + 0) {
        abort('Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH.')
      }
      ret.push(null);
    };
    ret.set = function(i, func) {
      ret[i] = func;
    };
    ret.get = function(i) {
      return ret[i];
    };
    return ret;
  },

  Module: function(binary) {
    // TODO: use the binary and info somehow - right now the wasm2js output is embedded in
    // the main JS
  },

  Instance: function(module, info) {
    // TODO: use the module and info somehow - right now the wasm2js output is embedded in
    // the main JS
    // This will be replaced by the actual wasm2js code.
    this.exports = (
function instantiate(asmLibraryArg, wasmMemory, wasmTable) {

function asmFunc(global, env, buffer) {
 var memory = env.memory;
 var FUNCTION_TABLE = wasmTable;
 var HEAP8 = new global.Int8Array(buffer);
 var HEAP16 = new global.Int16Array(buffer);
 var HEAP32 = new global.Int32Array(buffer);
 var HEAPU8 = new global.Uint8Array(buffer);
 var HEAPU16 = new global.Uint16Array(buffer);
 var HEAPU32 = new global.Uint32Array(buffer);
 var HEAPF32 = new global.Float32Array(buffer);
 var HEAPF64 = new global.Float64Array(buffer);
 var Math_imul = global.Math.imul;
 var Math_fround = global.Math.fround;
 var Math_abs = global.Math.abs;
 var Math_clz32 = global.Math.clz32;
 var Math_min = global.Math.min;
 var Math_max = global.Math.max;
 var Math_floor = global.Math.floor;
 var Math_ceil = global.Math.ceil;
 var Math_sqrt = global.Math.sqrt;
 var abort = env.abort;
 var nan = global.NaN;
 var infinity = global.Infinity;
 var fimport$0 = env.emscripten_resize_heap;
 var fimport$1 = env.emscripten_memcpy_big;
 var fimport$2 = env.__handle_stack_overflow;
 var global$0 = 5248080;
 var global$1 = 5028;
 var global$2 = 0;
 var i64toi32_i32$HIGH_BITS = 0;
 // EMSCRIPTEN_START_FUNCS
;
 function $0() {
  return 5040 | 0;
 }
 
 function $1() {
  $144();
 }
 
 function $2($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $9_1 = 0, $8_1 = 0, $5_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $8_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $8_1;
  }
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $5_1 = $3(HEAP32[($3_1 + 12 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   $9_1 = $3_1 + 16 | 0;
   if ($9_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $9_1;
  }
  return $5_1 | 0;
 }
 
 function $3($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  return (HEAP32[($3_1 + 12 | 0) >> 2] | 0) >>> 0 > -120 >>> 0 & 1 | 0 | 0;
 }
 
 function $4($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $14_1 = 0, $13_1 = 0, $10_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $13_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $13_1;
  }
  HEAP32[($3_1 + 8 | 0) >> 2] = $0_1;
  label$3 : {
   label$4 : {
    if ($3(HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) | 0) {
     break label$4
    }
    HEAP32[($3_1 + 12 | 0) >> 2] = 0;
    break label$3;
   }
   HEAP32[($3_1 + 12 | 0) >> 2] = 0 - (HEAP32[($3_1 + 8 | 0) >> 2] | 0) | 0;
  }
  $10_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  label$5 : {
   $14_1 = $3_1 + 16 | 0;
   if ($14_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $14_1;
  }
  return $10_1 | 0;
 }
 
 function $5($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $7_1 = 0, $17_1 = 0, $18_1 = 0, $9_1 = 0, $67_1 = 0, $179 = 0, $283 = 0, $291 = 0, $400 = 0, $399 = 0, $178 = 0, $289 = 0, $290 = 0, $396 = 0;
  $7_1 = global$0 - 96 | 0;
  label$1 : {
   $399 = $7_1;
   if ($7_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $399;
  }
  $9_1 = 0;
  HEAP32[($7_1 + 88 | 0) >> 2] = $0_1;
  HEAP32[($7_1 + 84 | 0) >> 2] = $1_1;
  HEAP32[($7_1 + 80 | 0) >> 2] = $2_1;
  HEAP32[($7_1 + 76 | 0) >> 2] = $3_1;
  HEAP32[($7_1 + 72 | 0) >> 2] = $4_1;
  HEAP32[($7_1 + 68 | 0) >> 2] = HEAP32[($7_1 + 76 | 0) >> 2] | 0;
  HEAP32[($7_1 + 64 | 0) >> 2] = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + (HEAP32[($7_1 + 72 | 0) >> 2] | 0) | 0;
  HEAP32[($7_1 + 60 | 0) >> 2] = HEAP32[($7_1 + 68 | 0) >> 2] | 0;
  HEAP32[($7_1 + 36 | 0) >> 2] = $9_1;
  HEAP32[($7_1 + 32 | 0) >> 2] = $9_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($7_1 + 72 | 0) >> 2] | 0) >>> 0 < 4 >>> 0 & 1 | 0)) {
     break label$4
    }
    $17_1 = $7_1 + 28 | 0;
    $18_1 = 0;
    HEAP8[$17_1 >> 0] = $18_1;
    HEAP8[($17_1 + 1 | 0) >> 0] = $18_1 >>> 8 | 0;
    HEAP8[($17_1 + 2 | 0) >> 0] = $18_1 >>> 16 | 0;
    HEAP8[($17_1 + 3 | 0) >> 0] = $18_1 >>> 24 | 0;
    $153($17_1 | 0, HEAP32[($7_1 + 76 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 72 | 0) >> 2] | 0 | 0) | 0;
    HEAP32[($7_1 + 24 | 0) >> 2] = $5(HEAP32[($7_1 + 88 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 84 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 80 | 0) >> 2] | 0 | 0, $17_1 | 0, 4 | 0) | 0;
    label$5 : {
     if (!($2(HEAP32[($7_1 + 24 | 0) >> 2] | 0 | 0) | 0)) {
      break label$5
     }
     HEAP32[($7_1 + 92 | 0) >> 2] = HEAP32[($7_1 + 24 | 0) >> 2] | 0;
     break label$3;
    }
    label$6 : {
     if (!((HEAP32[($7_1 + 24 | 0) >> 2] | 0) >>> 0 > (HEAP32[($7_1 + 72 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$6
     }
     HEAP32[($7_1 + 92 | 0) >> 2] = -20;
     break label$3;
    }
    HEAP32[($7_1 + 92 | 0) >> 2] = HEAP32[($7_1 + 24 | 0) >> 2] | 0;
    break label$3;
   }
   $154(HEAP32[($7_1 + 88 | 0) >> 2] | 0 | 0, 0 | 0, ((HEAP32[(HEAP32[($7_1 + 84 | 0) >> 2] | 0) >> 2] | 0) + 1 | 0) << 1 | 0 | 0) | 0;
   HEAP32[($7_1 + 44 | 0) >> 2] = $6(HEAP32[($7_1 + 60 | 0) >> 2] | 0 | 0) | 0;
   HEAP32[($7_1 + 56 | 0) >> 2] = ((HEAP32[($7_1 + 44 | 0) >> 2] | 0) & 15 | 0) + 5 | 0;
   label$7 : {
    if (!((HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0) > (15 | 0) & 1 | 0)) {
     break label$7
    }
    HEAP32[($7_1 + 92 | 0) >> 2] = -44;
    break label$3;
   }
   $67_1 = 1;
   HEAP32[($7_1 + 44 | 0) >> 2] = (HEAP32[($7_1 + 44 | 0) >> 2] | 0) >>> 4 | 0;
   HEAP32[($7_1 + 40 | 0) >> 2] = 4;
   HEAP32[(HEAP32[($7_1 + 80 | 0) >> 2] | 0) >> 2] = HEAP32[($7_1 + 56 | 0) >> 2] | 0;
   HEAP32[($7_1 + 52 | 0) >> 2] = ($67_1 << (HEAP32[($7_1 + 56 | 0) >> 2] | 0) | 0) + 1 | 0;
   HEAP32[($7_1 + 48 | 0) >> 2] = $67_1 << (HEAP32[($7_1 + 56 | 0) >> 2] | 0) | 0;
   HEAP32[($7_1 + 56 | 0) >> 2] = (HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 1 | 0;
   label$8 : {
    label$9 : while (1) {
     if (!(((HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0) > (1 | 0) & 1 | 0) & ((HEAP32[($7_1 + 36 | 0) >> 2] | 0) >>> 0 <= (HEAP32[(HEAP32[($7_1 + 84 | 0) >> 2] | 0) >> 2] | 0) >>> 0 & 1 | 0) | 0)) {
      break label$8
     }
     label$10 : {
      if (!(HEAP32[($7_1 + 32 | 0) >> 2] | 0)) {
       break label$10
      }
      HEAP32[($7_1 + 20 | 0) >> 2] = HEAP32[($7_1 + 36 | 0) >> 2] | 0;
      label$11 : {
       label$12 : while (1) {
        if (!(((HEAP32[($7_1 + 44 | 0) >> 2] | 0) & 65535 | 0 | 0) == (65535 | 0) & 1 | 0)) {
         break label$11
        }
        HEAP32[($7_1 + 20 | 0) >> 2] = (HEAP32[($7_1 + 20 | 0) >> 2] | 0) + 24 | 0;
        label$13 : {
         label$14 : {
          if (!((HEAP32[($7_1 + 60 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($7_1 + 64 | 0) >> 2] | 0) + -5 | 0) >>> 0 & 1 | 0)) {
           break label$14
          }
          HEAP32[($7_1 + 60 | 0) >> 2] = (HEAP32[($7_1 + 60 | 0) >> 2] | 0) + 2 | 0;
          HEAP32[($7_1 + 44 | 0) >> 2] = ($6(HEAP32[($7_1 + 60 | 0) >> 2] | 0 | 0) | 0) >>> (HEAP32[($7_1 + 40 | 0) >> 2] | 0) | 0;
          break label$13;
         }
         HEAP32[($7_1 + 44 | 0) >> 2] = (HEAP32[($7_1 + 44 | 0) >> 2] | 0) >>> 16 | 0;
         HEAP32[($7_1 + 40 | 0) >> 2] = (HEAP32[($7_1 + 40 | 0) >> 2] | 0) + 16 | 0;
        }
        continue label$12;
       };
      }
      label$15 : {
       label$16 : while (1) {
        if (!(((HEAP32[($7_1 + 44 | 0) >> 2] | 0) & 3 | 0 | 0) == (3 | 0) & 1 | 0)) {
         break label$15
        }
        HEAP32[($7_1 + 20 | 0) >> 2] = (HEAP32[($7_1 + 20 | 0) >> 2] | 0) + 3 | 0;
        HEAP32[($7_1 + 44 | 0) >> 2] = (HEAP32[($7_1 + 44 | 0) >> 2] | 0) >>> 2 | 0;
        HEAP32[($7_1 + 40 | 0) >> 2] = (HEAP32[($7_1 + 40 | 0) >> 2] | 0) + 2 | 0;
        continue label$16;
       };
      }
      HEAP32[($7_1 + 20 | 0) >> 2] = (HEAP32[($7_1 + 20 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 44 | 0) >> 2] | 0) & 3 | 0) | 0;
      HEAP32[($7_1 + 40 | 0) >> 2] = (HEAP32[($7_1 + 40 | 0) >> 2] | 0) + 2 | 0;
      label$17 : {
       if (!((HEAP32[($7_1 + 20 | 0) >> 2] | 0) >>> 0 > (HEAP32[(HEAP32[($7_1 + 84 | 0) >> 2] | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
        break label$17
       }
       HEAP32[($7_1 + 92 | 0) >> 2] = -48;
       break label$3;
      }
      label$18 : {
       label$19 : while (1) {
        if (!((HEAP32[($7_1 + 36 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 20 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
         break label$18
        }
        $178 = HEAP32[($7_1 + 88 | 0) >> 2] | 0;
        $179 = HEAP32[($7_1 + 36 | 0) >> 2] | 0;
        HEAP32[($7_1 + 36 | 0) >> 2] = $179 + 1 | 0;
        HEAP16[($178 + ($179 << 1 | 0) | 0) >> 1] = 0;
        continue label$19;
       };
      }
      label$20 : {
       label$21 : {
        label$22 : {
         if ((HEAP32[($7_1 + 60 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($7_1 + 64 | 0) >> 2] | 0) + -7 | 0) >>> 0 & 1 | 0) {
          break label$22
         }
         if (!(((HEAP32[($7_1 + 60 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 40 | 0) >> 2] | 0) >> 3 | 0) | 0) >>> 0 <= ((HEAP32[($7_1 + 64 | 0) >> 2] | 0) + -4 | 0) >>> 0 & 1 | 0)) {
          break label$21
         }
        }
        HEAP32[($7_1 + 60 | 0) >> 2] = (HEAP32[($7_1 + 60 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 40 | 0) >> 2] | 0) >> 3 | 0) | 0;
        HEAP32[($7_1 + 40 | 0) >> 2] = (HEAP32[($7_1 + 40 | 0) >> 2] | 0) & 7 | 0;
        HEAP32[($7_1 + 44 | 0) >> 2] = ($6(HEAP32[($7_1 + 60 | 0) >> 2] | 0 | 0) | 0) >>> (HEAP32[($7_1 + 40 | 0) >> 2] | 0) | 0;
        break label$20;
       }
       HEAP32[($7_1 + 44 | 0) >> 2] = (HEAP32[($7_1 + 44 | 0) >> 2] | 0) >>> 2 | 0;
      }
     }
     HEAP32[($7_1 + 16 | 0) >> 2] = (((HEAP32[($7_1 + 48 | 0) >> 2] | 0) << 1 | 0) - 1 | 0) - (HEAP32[($7_1 + 52 | 0) >> 2] | 0) | 0;
     label$23 : {
      label$24 : {
       if (!(((HEAP32[($7_1 + 44 | 0) >> 2] | 0) & ((HEAP32[($7_1 + 48 | 0) >> 2] | 0) - 1 | 0) | 0) >>> 0 < (HEAP32[($7_1 + 16 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
        break label$24
       }
       HEAP32[($7_1 + 12 | 0) >> 2] = (HEAP32[($7_1 + 44 | 0) >> 2] | 0) & ((HEAP32[($7_1 + 48 | 0) >> 2] | 0) - 1 | 0) | 0;
       HEAP32[($7_1 + 40 | 0) >> 2] = (HEAP32[($7_1 + 40 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 56 | 0) >> 2] | 0) - 1 | 0) | 0;
       break label$23;
      }
      HEAP32[($7_1 + 12 | 0) >> 2] = (HEAP32[($7_1 + 44 | 0) >> 2] | 0) & (((HEAP32[($7_1 + 48 | 0) >> 2] | 0) << 1 | 0) - 1 | 0) | 0;
      label$25 : {
       if (!((HEAP32[($7_1 + 12 | 0) >> 2] | 0 | 0) >= (HEAP32[($7_1 + 48 | 0) >> 2] | 0 | 0) & 1 | 0)) {
        break label$25
       }
       HEAP32[($7_1 + 12 | 0) >> 2] = (HEAP32[($7_1 + 12 | 0) >> 2] | 0) - (HEAP32[($7_1 + 16 | 0) >> 2] | 0) | 0;
      }
      HEAP32[($7_1 + 40 | 0) >> 2] = (HEAP32[($7_1 + 40 | 0) >> 2] | 0) + (HEAP32[($7_1 + 56 | 0) >> 2] | 0) | 0;
     }
     HEAP32[($7_1 + 12 | 0) >> 2] = (HEAP32[($7_1 + 12 | 0) >> 2] | 0) + -1 | 0;
     label$26 : {
      label$27 : {
       if (!((HEAP32[($7_1 + 12 | 0) >> 2] | 0 | 0) < (0 | 0) & 1 | 0)) {
        break label$27
       }
       $283 = 0 - (HEAP32[($7_1 + 12 | 0) >> 2] | 0) | 0;
       break label$26;
      }
      $283 = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
     }
     HEAP32[($7_1 + 52 | 0) >> 2] = (HEAP32[($7_1 + 52 | 0) >> 2] | 0) - $283 | 0;
     $289 = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
     $290 = HEAP32[($7_1 + 88 | 0) >> 2] | 0;
     $291 = HEAP32[($7_1 + 36 | 0) >> 2] | 0;
     HEAP32[($7_1 + 36 | 0) >> 2] = $291 + 1 | 0;
     HEAP16[($290 + ($291 << 1 | 0) | 0) >> 1] = $289;
     HEAP32[($7_1 + 32 | 0) >> 2] = ((HEAP32[($7_1 + 12 | 0) >> 2] | 0 | 0) != (0 | 0) ^ -1 | 0) & 1 | 0;
     label$28 : {
      label$29 : while (1) {
       if (!((HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0) < (HEAP32[($7_1 + 48 | 0) >> 2] | 0 | 0) & 1 | 0)) {
        break label$28
       }
       HEAP32[($7_1 + 56 | 0) >> 2] = (HEAP32[($7_1 + 56 | 0) >> 2] | 0) + -1 | 0;
       HEAP32[($7_1 + 48 | 0) >> 2] = (HEAP32[($7_1 + 48 | 0) >> 2] | 0) >> 1 | 0;
       continue label$29;
      };
     }
     label$30 : {
      label$31 : {
       label$32 : {
        if ((HEAP32[($7_1 + 60 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($7_1 + 64 | 0) >> 2] | 0) + -7 | 0) >>> 0 & 1 | 0) {
         break label$32
        }
        if (!(((HEAP32[($7_1 + 60 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 40 | 0) >> 2] | 0) >> 3 | 0) | 0) >>> 0 <= ((HEAP32[($7_1 + 64 | 0) >> 2] | 0) + -4 | 0) >>> 0 & 1 | 0)) {
         break label$31
        }
       }
       HEAP32[($7_1 + 60 | 0) >> 2] = (HEAP32[($7_1 + 60 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 40 | 0) >> 2] | 0) >> 3 | 0) | 0;
       HEAP32[($7_1 + 40 | 0) >> 2] = (HEAP32[($7_1 + 40 | 0) >> 2] | 0) & 7 | 0;
       break label$30;
      }
      HEAP32[($7_1 + 40 | 0) >> 2] = (HEAP32[($7_1 + 40 | 0) >> 2] | 0) - ((((HEAP32[($7_1 + 64 | 0) >> 2] | 0) + -4 | 0) - (HEAP32[($7_1 + 60 | 0) >> 2] | 0) | 0) << 3 | 0) | 0;
      HEAP32[($7_1 + 60 | 0) >> 2] = (HEAP32[($7_1 + 64 | 0) >> 2] | 0) + -4 | 0;
     }
     HEAP32[($7_1 + 44 | 0) >> 2] = ($6(HEAP32[($7_1 + 60 | 0) >> 2] | 0 | 0) | 0) >>> ((HEAP32[($7_1 + 40 | 0) >> 2] | 0) & 31 | 0) | 0;
     continue label$9;
    };
   }
   label$33 : {
    if (!((HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0) != (1 | 0) & 1 | 0)) {
     break label$33
    }
    HEAP32[($7_1 + 92 | 0) >> 2] = -20;
    break label$3;
   }
   label$34 : {
    if (!((HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) > (32 | 0) & 1 | 0)) {
     break label$34
    }
    HEAP32[($7_1 + 92 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[(HEAP32[($7_1 + 84 | 0) >> 2] | 0) >> 2] = (HEAP32[($7_1 + 36 | 0) >> 2] | 0) - 1 | 0;
   HEAP32[($7_1 + 60 | 0) >> 2] = (HEAP32[($7_1 + 60 | 0) >> 2] | 0) + (((HEAP32[($7_1 + 40 | 0) >> 2] | 0) + 7 | 0) >> 3 | 0) | 0;
   HEAP32[($7_1 + 92 | 0) >> 2] = (HEAP32[($7_1 + 60 | 0) >> 2] | 0) - (HEAP32[($7_1 + 68 | 0) >> 2] | 0) | 0;
  }
  $396 = HEAP32[($7_1 + 92 | 0) >> 2] | 0;
  label$35 : {
   $400 = $7_1 + 96 | 0;
   if ($400 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $400;
  }
  return $396 | 0;
 }
 
 function $6($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $14_1 = 0, $13_1 = 0, $10_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $13_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $13_1;
  }
  HEAP32[($3_1 + 8 | 0) >> 2] = $0_1;
  label$3 : {
   label$4 : {
    if (!($7() | 0)) {
     break label$4
    }
    HEAP32[($3_1 + 12 | 0) >> 2] = $8(HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) | 0;
    break label$3;
   }
   HEAP32[($3_1 + 12 | 0) >> 2] = $9($8(HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) | 0 | 0) | 0;
  }
  $10_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  label$5 : {
   $14_1 = $3_1 + 16 | 0;
   if ($14_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $14_1;
  }
  return $10_1 | 0;
 }
 
 function $7() {
  var $2_1 = 0;
  $2_1 = global$0 - 16 | 0;
  HEAP32[($2_1 + 8 | 0) >> 2] = HEAP32[(0 + 3736 | 0) >> 2] | 0;
  return (HEAPU8[($2_1 + 8 | 0) >> 0] | 0) & 255 | 0 | 0;
 }
 
 function $8($0_1) {
  $0_1 = $0_1 | 0;
  var $2_1 = 0, $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $2_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  return HEAPU8[$2_1 >> 0] | 0 | ((HEAPU8[($2_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[($2_1 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[($2_1 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0 | 0;
 }
 
 function $9($0_1) {
  $0_1 = $0_1 | 0;
  var $4_1 = 0, $3_1 = 0, $5_1 = 0, $7_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $4_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  $5_1 = 24;
  $7_1 = 8;
  return $4_1 << $5_1 | 0 | (($4_1 << $7_1 | 0) & 16711680 | 0) | 0 | (($4_1 >>> $7_1 | 0) & 65280 | 0 | ($4_1 >>> $5_1 | 0) | 0) | 0 | 0;
 }
 
 function $10($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  var $9_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, $255 = 0, $119_1 = 0, $118_1 = 0, $163 = 0, $195 = 0, $227 = 0, $254 = 0, $253 = 0, $250 = 0;
  $9_1 = global$0 - 352 | 0;
  label$1 : {
   $253 = $9_1;
   if ($9_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $253;
  }
  HEAP32[($9_1 + 344 | 0) >> 2] = $0_1;
  HEAP32[($9_1 + 340 | 0) >> 2] = $1_1;
  HEAP32[($9_1 + 336 | 0) >> 2] = $2_1;
  HEAP32[($9_1 + 332 | 0) >> 2] = $3_1;
  HEAP32[($9_1 + 328 | 0) >> 2] = $4_1;
  HEAP32[($9_1 + 324 | 0) >> 2] = $5_1;
  HEAP32[($9_1 + 320 | 0) >> 2] = $6_1;
  HEAP32[($9_1 + 312 | 0) >> 2] = HEAP32[($9_1 + 324 | 0) >> 2] | 0;
  label$3 : {
   label$4 : {
    if (HEAP32[($9_1 + 320 | 0) >> 2] | 0) {
     break label$4
    }
    HEAP32[($9_1 + 348 | 0) >> 2] = -72;
    break label$3;
   }
   HEAP32[($9_1 + 308 | 0) >> 2] = (HEAPU8[(HEAP32[($9_1 + 312 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0;
   label$5 : {
    label$6 : {
     if (!((HEAP32[($9_1 + 308 | 0) >> 2] | 0) >>> 0 >= 128 >>> 0 & 1 | 0)) {
      break label$6
     }
     HEAP32[($9_1 + 304 | 0) >> 2] = (HEAP32[($9_1 + 308 | 0) >> 2] | 0) - 127 | 0;
     HEAP32[($9_1 + 308 | 0) >> 2] = ((HEAP32[($9_1 + 304 | 0) >> 2] | 0) + 1 | 0) >>> 1 | 0;
     label$7 : {
      if (!(((HEAP32[($9_1 + 308 | 0) >> 2] | 0) + 1 | 0) >>> 0 > (HEAP32[($9_1 + 320 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$7
      }
      HEAP32[($9_1 + 348 | 0) >> 2] = -72;
      break label$3;
     }
     label$8 : {
      if (!((HEAP32[($9_1 + 304 | 0) >> 2] | 0) >>> 0 >= (HEAP32[($9_1 + 340 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$8
      }
      HEAP32[($9_1 + 348 | 0) >> 2] = -20;
      break label$3;
     }
     HEAP32[($9_1 + 312 | 0) >> 2] = (HEAP32[($9_1 + 312 | 0) >> 2] | 0) + 1 | 0;
     HEAP32[($9_1 + 300 | 0) >> 2] = 0;
     label$9 : {
      label$10 : while (1) {
       if (!((HEAP32[($9_1 + 300 | 0) >> 2] | 0) >>> 0 < (HEAP32[($9_1 + 304 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
        break label$9
       }
       HEAP8[((HEAP32[($9_1 + 344 | 0) >> 2] | 0) + (HEAP32[($9_1 + 300 | 0) >> 2] | 0) | 0) >> 0] = ((HEAPU8[((HEAP32[($9_1 + 312 | 0) >> 2] | 0) + ((HEAP32[($9_1 + 300 | 0) >> 2] | 0) >>> 1 | 0) | 0) >> 0] | 0) & 255 | 0) >> 4 | 0;
       HEAP8[((HEAP32[($9_1 + 344 | 0) >> 2] | 0) + ((HEAP32[($9_1 + 300 | 0) >> 2] | 0) + 1 | 0) | 0) >> 0] = ((HEAPU8[((HEAP32[($9_1 + 312 | 0) >> 2] | 0) + ((HEAP32[($9_1 + 300 | 0) >> 2] | 0) >>> 1 | 0) | 0) >> 0] | 0) & 255 | 0) & 15 | 0;
       HEAP32[($9_1 + 300 | 0) >> 2] = (HEAP32[($9_1 + 300 | 0) >> 2] | 0) + 2 | 0;
       continue label$10;
      };
     }
     break label$5;
    }
    label$11 : {
     if (!(((HEAP32[($9_1 + 308 | 0) >> 2] | 0) + 1 | 0) >>> 0 > (HEAP32[($9_1 + 320 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$11
     }
     HEAP32[($9_1 + 348 | 0) >> 2] = -72;
     break label$3;
    }
    HEAP32[($9_1 + 304 | 0) >> 2] = $11(HEAP32[($9_1 + 344 | 0) >> 2] | 0 | 0, (HEAP32[($9_1 + 340 | 0) >> 2] | 0) - 1 | 0 | 0, (HEAP32[($9_1 + 312 | 0) >> 2] | 0) + 1 | 0 | 0, HEAP32[($9_1 + 308 | 0) >> 2] | 0 | 0, $9_1 + 32 | 0 | 0, 6 | 0) | 0;
    label$12 : {
     if (!($2(HEAP32[($9_1 + 304 | 0) >> 2] | 0 | 0) | 0)) {
      break label$12
     }
     HEAP32[($9_1 + 348 | 0) >> 2] = HEAP32[($9_1 + 304 | 0) >> 2] | 0;
     break label$3;
    }
   }
   $118_1 = 0;
   $119_1 = HEAP32[($9_1 + 336 | 0) >> 2] | 0;
   i64toi32_i32$0 = 0;
   $255 = 0;
   i64toi32_i32$1 = $119_1;
   HEAP32[i64toi32_i32$1 >> 2] = $255;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   HEAP32[(i64toi32_i32$1 + 48 | 0) >> 2] = 0;
   i64toi32_i32$1 = i64toi32_i32$1 + 40 | 0;
   HEAP32[i64toi32_i32$1 >> 2] = $255;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$1 = $119_1 + 32 | 0;
   HEAP32[i64toi32_i32$1 >> 2] = $255;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$1 = $119_1 + 24 | 0;
   HEAP32[i64toi32_i32$1 >> 2] = $255;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$1 = $119_1 + 16 | 0;
   HEAP32[i64toi32_i32$1 >> 2] = $255;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$1 = $119_1 + 8 | 0;
   HEAP32[i64toi32_i32$1 >> 2] = $255;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   HEAP32[($9_1 + 316 | 0) >> 2] = $118_1;
   HEAP32[($9_1 + 28 | 0) >> 2] = $118_1;
   label$13 : {
    label$14 : while (1) {
     if (!((HEAP32[($9_1 + 28 | 0) >> 2] | 0) >>> 0 < (HEAP32[($9_1 + 304 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$13
     }
     label$15 : {
      if (!(((HEAPU8[((HEAP32[($9_1 + 344 | 0) >> 2] | 0) + (HEAP32[($9_1 + 28 | 0) >> 2] | 0) | 0) >> 0] | 0) & 255 | 0 | 0) >= (12 | 0) & 1 | 0)) {
       break label$15
      }
      HEAP32[($9_1 + 348 | 0) >> 2] = -20;
      break label$3;
     }
     $163 = (HEAP32[($9_1 + 336 | 0) >> 2] | 0) + (((HEAPU8[((HEAP32[($9_1 + 344 | 0) >> 2] | 0) + (HEAP32[($9_1 + 28 | 0) >> 2] | 0) | 0) >> 0] | 0) & 255 | 0) << 2 | 0) | 0;
     HEAP32[$163 >> 2] = (HEAP32[$163 >> 2] | 0) + 1 | 0;
     HEAP32[($9_1 + 316 | 0) >> 2] = (HEAP32[($9_1 + 316 | 0) >> 2] | 0) + ((1 << ((HEAPU8[((HEAP32[($9_1 + 344 | 0) >> 2] | 0) + (HEAP32[($9_1 + 28 | 0) >> 2] | 0) | 0) >> 0] | 0) & 255 | 0) | 0) >> 1 | 0) | 0;
     HEAP32[($9_1 + 28 | 0) >> 2] = (HEAP32[($9_1 + 28 | 0) >> 2] | 0) + 1 | 0;
     continue label$14;
    };
   }
   label$16 : {
    if (HEAP32[($9_1 + 316 | 0) >> 2] | 0) {
     break label$16
    }
    HEAP32[($9_1 + 348 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($9_1 + 24 | 0) >> 2] = ($12(HEAP32[($9_1 + 316 | 0) >> 2] | 0 | 0) | 0) + 1 | 0;
   label$17 : {
    if (!((HEAP32[($9_1 + 24 | 0) >> 2] | 0) >>> 0 > 12 >>> 0 & 1 | 0)) {
     break label$17
    }
    HEAP32[($9_1 + 348 | 0) >> 2] = -20;
    break label$3;
   }
   $195 = 1;
   HEAP32[(HEAP32[($9_1 + 328 | 0) >> 2] | 0) >> 2] = HEAP32[($9_1 + 24 | 0) >> 2] | 0;
   HEAP32[($9_1 + 20 | 0) >> 2] = $195 << (HEAP32[($9_1 + 24 | 0) >> 2] | 0) | 0;
   HEAP32[($9_1 + 16 | 0) >> 2] = (HEAP32[($9_1 + 20 | 0) >> 2] | 0) - (HEAP32[($9_1 + 316 | 0) >> 2] | 0) | 0;
   HEAP32[($9_1 + 12 | 0) >> 2] = $195 << ($12(HEAP32[($9_1 + 16 | 0) >> 2] | 0 | 0) | 0) | 0;
   HEAP32[($9_1 + 8 | 0) >> 2] = ($12(HEAP32[($9_1 + 16 | 0) >> 2] | 0 | 0) | 0) + 1 | 0;
   label$18 : {
    if (!((HEAP32[($9_1 + 12 | 0) >> 2] | 0 | 0) != (HEAP32[($9_1 + 16 | 0) >> 2] | 0 | 0) & 1 | 0)) {
     break label$18
    }
    HEAP32[($9_1 + 348 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP8[((HEAP32[($9_1 + 344 | 0) >> 2] | 0) + (HEAP32[($9_1 + 304 | 0) >> 2] | 0) | 0) >> 0] = HEAP32[($9_1 + 8 | 0) >> 2] | 0;
   $227 = (HEAP32[($9_1 + 336 | 0) >> 2] | 0) + ((HEAP32[($9_1 + 8 | 0) >> 2] | 0) << 2 | 0) | 0;
   HEAP32[$227 >> 2] = (HEAP32[$227 >> 2] | 0) + 1 | 0;
   label$19 : {
    label$20 : {
     if ((HEAP32[((HEAP32[($9_1 + 336 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 < 2 >>> 0 & 1 | 0) {
      break label$20
     }
     if (!((HEAP32[((HEAP32[($9_1 + 336 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) & 1 | 0)) {
      break label$19
     }
    }
    HEAP32[($9_1 + 348 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[(HEAP32[($9_1 + 332 | 0) >> 2] | 0) >> 2] = (HEAP32[($9_1 + 304 | 0) >> 2] | 0) + 1 | 0;
   HEAP32[($9_1 + 348 | 0) >> 2] = (HEAP32[($9_1 + 308 | 0) >> 2] | 0) + 1 | 0;
  }
  $250 = HEAP32[($9_1 + 348 | 0) >> 2] | 0;
  label$21 : {
   $254 = $9_1 + 352 | 0;
   if ($254 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $254;
  }
  return $250 | 0;
 }
 
 function $11($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $8_1 = 0, $61_1 = 0, $60_1 = 0, $57_1 = 0;
  $8_1 = global$0 - 576 | 0;
  label$1 : {
   $60_1 = $8_1;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $60_1;
  }
  HEAP32[($8_1 + 568 | 0) >> 2] = $0_1;
  HEAP32[($8_1 + 564 | 0) >> 2] = $1_1;
  HEAP32[($8_1 + 560 | 0) >> 2] = $2_1;
  HEAP32[($8_1 + 556 | 0) >> 2] = $3_1;
  HEAP32[($8_1 + 552 | 0) >> 2] = $4_1;
  HEAP32[($8_1 + 548 | 0) >> 2] = $5_1;
  HEAP32[($8_1 + 544 | 0) >> 2] = HEAP32[($8_1 + 560 | 0) >> 2] | 0;
  HEAP32[($8_1 + 540 | 0) >> 2] = HEAP32[($8_1 + 544 | 0) >> 2] | 0;
  HEAP32[($8_1 + 8 | 0) >> 2] = 255;
  HEAP32[($8_1 + 4 | 0) >> 2] = $5($8_1 + 16 | 0 | 0, $8_1 + 8 | 0 | 0, $8_1 + 12 | 0 | 0, HEAP32[($8_1 + 544 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 556 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   label$4 : {
    if (!($3(HEAP32[($8_1 + 4 | 0) >> 2] | 0 | 0) | 0)) {
     break label$4
    }
    HEAP32[($8_1 + 572 | 0) >> 2] = HEAP32[($8_1 + 4 | 0) >> 2] | 0;
    break label$3;
   }
   label$5 : {
    if (!((HEAP32[($8_1 + 12 | 0) >> 2] | 0) >>> 0 > (HEAP32[($8_1 + 548 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($8_1 + 572 | 0) >> 2] = -44;
    break label$3;
   }
   HEAP32[($8_1 + 540 | 0) >> 2] = (HEAP32[($8_1 + 540 | 0) >> 2] | 0) + (HEAP32[($8_1 + 4 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 556 | 0) >> 2] = (HEAP32[($8_1 + 556 | 0) >> 2] | 0) - (HEAP32[($8_1 + 4 | 0) >> 2] | 0) | 0;
   HEAP32[$8_1 >> 2] = $13(HEAP32[($8_1 + 552 | 0) >> 2] | 0 | 0, $8_1 + 16 | 0 | 0, HEAP32[($8_1 + 8 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 12 | 0) >> 2] | 0 | 0) | 0;
   label$6 : {
    if (!($3(HEAP32[$8_1 >> 2] | 0 | 0) | 0)) {
     break label$6
    }
    HEAP32[($8_1 + 572 | 0) >> 2] = HEAP32[$8_1 >> 2] | 0;
    break label$3;
   }
   HEAP32[($8_1 + 572 | 0) >> 2] = $14(HEAP32[($8_1 + 568 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 564 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 540 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 556 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 552 | 0) >> 2] | 0 | 0) | 0;
  }
  $57_1 = HEAP32[($8_1 + 572 | 0) >> 2] | 0;
  label$7 : {
   $61_1 = $8_1 + 576 | 0;
   if ($61_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $61_1;
  }
  return $57_1 | 0;
 }
 
 function $12($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  return Math_clz32(HEAP32[($3_1 + 12 | 0) >> 2] | 0) ^ 31 | 0 | 0;
 }
 
 function $13($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var $6_1 = 0, $58_1 = 0, $72_1 = 0, $88_1 = 0, $92_1 = 0, $117_1 = 0, $20_1 = 0, $21_1 = 0, $22_1 = 0, $150_1 = 0, $204 = 0, $208 = 0, $209 = 0, $247 = 0, $246 = 0, $70_1 = 0, $71_1 = 0, $216 = 0, $243 = 0;
  $6_1 = global$0 - 608 | 0;
  label$1 : {
   $246 = $6_1;
   if ($6_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $246;
  }
  HEAP32[($6_1 + 600 | 0) >> 2] = $0_1;
  HEAP32[($6_1 + 596 | 0) >> 2] = $1_1;
  HEAP32[($6_1 + 592 | 0) >> 2] = $2_1;
  HEAP32[($6_1 + 588 | 0) >> 2] = $3_1;
  HEAP32[($6_1 + 584 | 0) >> 2] = (HEAP32[($6_1 + 600 | 0) >> 2] | 0) + 4 | 0;
  HEAP32[($6_1 + 580 | 0) >> 2] = HEAP32[($6_1 + 584 | 0) >> 2] | 0;
  HEAP32[($6_1 + 60 | 0) >> 2] = (HEAP32[($6_1 + 592 | 0) >> 2] | 0) + 1 | 0;
  HEAP32[($6_1 + 56 | 0) >> 2] = 1 << (HEAP32[($6_1 + 588 | 0) >> 2] | 0) | 0;
  HEAP32[($6_1 + 52 | 0) >> 2] = (HEAP32[($6_1 + 56 | 0) >> 2] | 0) - 1 | 0;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($6_1 + 592 | 0) >> 2] | 0) >>> 0 > 255 >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($6_1 + 604 | 0) >> 2] = -46;
    break label$3;
   }
   label$5 : {
    if (!((HEAP32[($6_1 + 588 | 0) >> 2] | 0) >>> 0 > 12 >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($6_1 + 604 | 0) >> 2] = -44;
    break label$3;
   }
   HEAP16[($6_1 + 48 | 0) >> 1] = HEAP32[($6_1 + 588 | 0) >> 2] | 0;
   HEAP16[($6_1 + 50 | 0) >> 1] = 1;
   HEAP16[($6_1 + 46 | 0) >> 1] = 1 << ((HEAP32[($6_1 + 588 | 0) >> 2] | 0) - 1 | 0) | 0;
   HEAP32[($6_1 + 40 | 0) >> 2] = 0;
   label$6 : {
    label$7 : while (1) {
     if (!((HEAP32[($6_1 + 40 | 0) >> 2] | 0) >>> 0 < (HEAP32[($6_1 + 60 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$6
     }
     $58_1 = 16;
     label$8 : {
      label$9 : {
       if (!((((HEAPU16[((HEAP32[($6_1 + 596 | 0) >> 2] | 0) + ((HEAP32[($6_1 + 40 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] | 0) << $58_1 | 0) >> $58_1 | 0 | 0) == (-1 | 0) & 1 | 0)) {
        break label$9
       }
       $70_1 = HEAP32[($6_1 + 40 | 0) >> 2] | 0;
       $71_1 = HEAP32[($6_1 + 580 | 0) >> 2] | 0;
       $72_1 = HEAP32[($6_1 + 52 | 0) >> 2] | 0;
       HEAP32[($6_1 + 52 | 0) >> 2] = $72_1 + -1 | 0;
       HEAP8[(($71_1 + ($72_1 << 2 | 0) | 0) + 2 | 0) >> 0] = $70_1;
       HEAP16[(($6_1 + 64 | 0) + ((HEAP32[($6_1 + 40 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] = 1;
       break label$8;
      }
      $88_1 = 16;
      $92_1 = 16;
      label$10 : {
       if (!((((HEAPU16[((HEAP32[($6_1 + 596 | 0) >> 2] | 0) + ((HEAP32[($6_1 + 40 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] | 0) << $88_1 | 0) >> $88_1 | 0 | 0) >= (((HEAPU16[($6_1 + 46 | 0) >> 1] | 0) << $92_1 | 0) >> $92_1 | 0 | 0) & 1 | 0)) {
        break label$10
       }
       HEAP16[($6_1 + 50 | 0) >> 1] = 0;
      }
      HEAP16[(($6_1 + 64 | 0) + ((HEAP32[($6_1 + 40 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] = HEAPU16[((HEAP32[($6_1 + 596 | 0) >> 2] | 0) + ((HEAP32[($6_1 + 40 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] | 0;
     }
     HEAP32[($6_1 + 40 | 0) >> 2] = (HEAP32[($6_1 + 40 | 0) >> 2] | 0) + 1 | 0;
     continue label$7;
    };
   }
   $117_1 = 0;
   $20_1 = $6_1 + 48 | 0;
   $21_1 = HEAP32[($6_1 + 600 | 0) >> 2] | 0;
   $22_1 = HEAPU16[$20_1 >> 1] | 0 | ((HEAPU16[($20_1 + 2 | 0) >> 1] | 0) << 16 | 0) | 0;
   HEAP16[$21_1 >> 1] = $22_1;
   HEAP16[($21_1 + 2 | 0) >> 1] = $22_1 >>> 16 | 0;
   HEAP32[($6_1 + 36 | 0) >> 2] = (HEAP32[($6_1 + 56 | 0) >> 2] | 0) - 1 | 0;
   HEAP32[($6_1 + 32 | 0) >> 2] = (((HEAP32[($6_1 + 56 | 0) >> 2] | 0) >>> 1 | 0) + ((HEAP32[($6_1 + 56 | 0) >> 2] | 0) >>> 3 | 0) | 0) + 3 | 0;
   HEAP32[($6_1 + 24 | 0) >> 2] = $117_1;
   HEAP32[($6_1 + 28 | 0) >> 2] = $117_1;
   label$11 : {
    label$12 : while (1) {
     if (!((HEAP32[($6_1 + 28 | 0) >> 2] | 0) >>> 0 < (HEAP32[($6_1 + 60 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$11
     }
     HEAP32[($6_1 + 20 | 0) >> 2] = 0;
     label$13 : {
      label$14 : while (1) {
       $150_1 = 16;
       if (!((HEAP32[($6_1 + 20 | 0) >> 2] | 0 | 0) < (((HEAPU16[((HEAP32[($6_1 + 596 | 0) >> 2] | 0) + ((HEAP32[($6_1 + 28 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] | 0) << $150_1 | 0) >> $150_1 | 0 | 0) & 1 | 0)) {
        break label$13
       }
       HEAP8[(((HEAP32[($6_1 + 580 | 0) >> 2] | 0) + ((HEAP32[($6_1 + 24 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] = HEAP32[($6_1 + 28 | 0) >> 2] | 0;
       HEAP32[($6_1 + 24 | 0) >> 2] = ((HEAP32[($6_1 + 24 | 0) >> 2] | 0) + (HEAP32[($6_1 + 32 | 0) >> 2] | 0) | 0) & (HEAP32[($6_1 + 36 | 0) >> 2] | 0) | 0;
       label$15 : {
        label$16 : while (1) {
         if (!((HEAP32[($6_1 + 24 | 0) >> 2] | 0) >>> 0 > (HEAP32[($6_1 + 52 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
          break label$15
         }
         HEAP32[($6_1 + 24 | 0) >> 2] = ((HEAP32[($6_1 + 24 | 0) >> 2] | 0) + (HEAP32[($6_1 + 32 | 0) >> 2] | 0) | 0) & (HEAP32[($6_1 + 36 | 0) >> 2] | 0) | 0;
         continue label$16;
        };
       }
       HEAP32[($6_1 + 20 | 0) >> 2] = (HEAP32[($6_1 + 20 | 0) >> 2] | 0) + 1 | 0;
       continue label$14;
      };
     }
     HEAP32[($6_1 + 28 | 0) >> 2] = (HEAP32[($6_1 + 28 | 0) >> 2] | 0) + 1 | 0;
     continue label$12;
    };
   }
   label$17 : {
    if (!(HEAP32[($6_1 + 24 | 0) >> 2] | 0)) {
     break label$17
    }
    HEAP32[($6_1 + 604 | 0) >> 2] = -1;
    break label$3;
   }
   HEAP32[($6_1 + 16 | 0) >> 2] = 0;
   label$18 : {
    label$19 : while (1) {
     if (!((HEAP32[($6_1 + 16 | 0) >> 2] | 0) >>> 0 < (HEAP32[($6_1 + 56 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$18
     }
     HEAP8[($6_1 + 15 | 0) >> 0] = HEAPU8[(((HEAP32[($6_1 + 580 | 0) >> 2] | 0) + ((HEAP32[($6_1 + 16 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0;
     $204 = 1;
     $208 = ($6_1 + 64 | 0) + ((HEAPU8[($6_1 + 15 | 0) >> 0] | 0) << $204 | 0) | 0;
     $209 = HEAPU16[$208 >> 1] | 0;
     HEAP16[$208 >> 1] = $209 + $204 | 0;
     HEAP32[($6_1 + 8 | 0) >> 2] = $209 & 65535 | 0;
     $216 = (HEAP32[($6_1 + 588 | 0) >> 2] | 0) - ($12(HEAP32[($6_1 + 8 | 0) >> 2] | 0 | 0) | 0) | 0;
     HEAP8[(((HEAP32[($6_1 + 580 | 0) >> 2] | 0) + ((HEAP32[($6_1 + 16 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] = $216;
     HEAP16[((HEAP32[($6_1 + 580 | 0) >> 2] | 0) + ((HEAP32[($6_1 + 16 | 0) >> 2] | 0) << 2 | 0) | 0) >> 1] = ((HEAP32[($6_1 + 8 | 0) >> 2] | 0) << ((HEAPU8[(((HEAP32[($6_1 + 580 | 0) >> 2] | 0) + ((HEAP32[($6_1 + 16 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0) - (HEAP32[($6_1 + 56 | 0) >> 2] | 0) | 0;
     HEAP32[($6_1 + 16 | 0) >> 2] = (HEAP32[($6_1 + 16 | 0) >> 2] | 0) + 1 | 0;
     continue label$19;
    };
   }
   HEAP32[($6_1 + 604 | 0) >> 2] = 0;
  }
  $243 = HEAP32[($6_1 + 604 | 0) >> 2] | 0;
  label$20 : {
   $247 = $6_1 + 608 | 0;
   if ($247 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $247;
  }
  return $243 | 0;
 }
 
 function $14($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $7_1 = 0, $43_1 = 0, $77_1 = 0, $99_1 = 0, $134_1 = 0, $156_1 = 0, $191 = 0, $206 = 0, $225 = 0, $236 = 0, $259 = 0, $274 = 0, $293 = 0, $304 = 0, $339 = 0, $373 = 0, $395 = 0, $430 = 0, $452 = 0, $487 = 0, $502 = 0, $521 = 0, $532 = 0, $555 = 0, $570 = 0, $589 = 0, $600 = 0, $611 = 0, $610 = 0, $20_1 = 0, $21_1 = 0, $22_1 = 0, $23_1 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $607 = 0;
  $7_1 = global$0 - 208 | 0;
  label$1 : {
   $610 = $7_1;
   if ($7_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $610;
  }
  HEAP32[($7_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($7_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($7_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($7_1 + 16 | 0) >> 2] = $3_1;
  HEAP32[($7_1 + 12 | 0) >> 2] = $4_1;
  HEAP32[($7_1 + 8 | 0) >> 2] = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
  HEAP32[($7_1 + 4 | 0) >> 2] = HEAP32[($7_1 + 8 | 0) >> 2] | 0;
  HEAP32[$7_1 >> 2] = (HEAPU16[((HEAP32[($7_1 + 4 | 0) >> 2] | 0) + 2 | 0) >> 1] | 0) & 65535 | 0;
  label$3 : {
   label$4 : {
    if (!(HEAP32[$7_1 >> 2] | 0)) {
     break label$4
    }
    $20_1 = HEAP32[($7_1 + 24 | 0) >> 2] | 0;
    $21_1 = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
    $22_1 = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
    $23_1 = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
    HEAP32[($7_1 + 116 | 0) >> 2] = HEAP32[($7_1 + 28 | 0) >> 2] | 0;
    HEAP32[($7_1 + 112 | 0) >> 2] = $20_1;
    HEAP32[($7_1 + 108 | 0) >> 2] = $21_1;
    HEAP32[($7_1 + 104 | 0) >> 2] = $22_1;
    HEAP32[($7_1 + 100 | 0) >> 2] = $23_1;
    HEAP32[($7_1 + 96 | 0) >> 2] = 1;
    HEAP32[($7_1 + 92 | 0) >> 2] = HEAP32[($7_1 + 116 | 0) >> 2] | 0;
    HEAP32[($7_1 + 88 | 0) >> 2] = HEAP32[($7_1 + 92 | 0) >> 2] | 0;
    HEAP32[($7_1 + 84 | 0) >> 2] = (HEAP32[($7_1 + 88 | 0) >> 2] | 0) + (HEAP32[($7_1 + 112 | 0) >> 2] | 0) | 0;
    HEAP32[($7_1 + 80 | 0) >> 2] = (HEAP32[($7_1 + 84 | 0) >> 2] | 0) + -3 | 0;
    HEAP32[($7_1 + 36 | 0) >> 2] = $15($7_1 + 56 | 0 | 0, HEAP32[($7_1 + 108 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 104 | 0) >> 2] | 0 | 0) | 0;
    label$5 : {
     label$6 : {
      if (!($3(HEAP32[($7_1 + 36 | 0) >> 2] | 0 | 0) | 0)) {
       break label$6
      }
      HEAP32[($7_1 + 120 | 0) >> 2] = HEAP32[($7_1 + 36 | 0) >> 2] | 0;
      break label$5;
     }
     $43_1 = $7_1 + 56 | 0;
     $16($7_1 + 48 | 0 | 0, $43_1 | 0, HEAP32[($7_1 + 100 | 0) >> 2] | 0 | 0);
     $16($7_1 + 40 | 0 | 0, $43_1 | 0, HEAP32[($7_1 + 100 | 0) >> 2] | 0 | 0);
     label$7 : {
      label$8 : while (1) {
       if (!((($17($7_1 + 56 | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($7_1 + 88 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 80 | 0) >> 2] | 0) >>> 0 & 1 | 0) | 0)) {
        break label$7
       }
       label$9 : {
        label$10 : {
         if (!(HEAP32[($7_1 + 96 | 0) >> 2] | 0)) {
          break label$10
         }
         $77_1 = ($18($7_1 + 48 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
         break label$9;
        }
        $77_1 = ($19($7_1 + 48 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
       }
       HEAP8[(HEAP32[($7_1 + 88 | 0) >> 2] | 0) >> 0] = $77_1;
       label$11 : {
        label$12 : {
         if (!(HEAP32[($7_1 + 96 | 0) >> 2] | 0)) {
          break label$12
         }
         $99_1 = ($18($7_1 + 40 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
         break label$11;
        }
        $99_1 = ($19($7_1 + 40 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
       }
       HEAP8[((HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 1 | 0) >> 0] = $99_1;
       label$13 : {
        if (!(($17($7_1 + 56 | 0 | 0) | 0) >>> 0 > 0 >>> 0 & 1 | 0)) {
         break label$13
        }
        HEAP32[($7_1 + 88 | 0) >> 2] = (HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 2 | 0;
        break label$7;
       }
       label$14 : {
        label$15 : {
         if (!(HEAP32[($7_1 + 96 | 0) >> 2] | 0)) {
          break label$15
         }
         $134_1 = ($18($7_1 + 48 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
         break label$14;
        }
        $134_1 = ($19($7_1 + 48 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
       }
       HEAP8[((HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 2 | 0) >> 0] = $134_1;
       label$16 : {
        label$17 : {
         if (!(HEAP32[($7_1 + 96 | 0) >> 2] | 0)) {
          break label$17
         }
         $156_1 = ($18($7_1 + 40 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
         break label$16;
        }
        $156_1 = ($19($7_1 + 40 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
       }
       HEAP8[((HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 3 | 0) >> 0] = $156_1;
       HEAP32[($7_1 + 88 | 0) >> 2] = (HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 4 | 0;
       continue label$8;
      };
     }
     label$18 : while (1) {
      label$19 : {
       if (!((HEAP32[($7_1 + 88 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($7_1 + 84 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0)) {
        break label$19
       }
       HEAP32[($7_1 + 120 | 0) >> 2] = -70;
       break label$5;
      }
      label$20 : {
       label$21 : {
        if (!(HEAP32[($7_1 + 96 | 0) >> 2] | 0)) {
         break label$21
        }
        $191 = ($18($7_1 + 48 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
        break label$20;
       }
       $191 = ($19($7_1 + 48 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
      }
      $206 = HEAP32[($7_1 + 88 | 0) >> 2] | 0;
      HEAP32[($7_1 + 88 | 0) >> 2] = $206 + 1 | 0;
      HEAP8[$206 >> 0] = $191;
      label$22 : {
       label$23 : {
        if (!(($17($7_1 + 56 | 0 | 0) | 0 | 0) == (3 | 0) & 1 | 0)) {
         break label$23
        }
        label$24 : {
         label$25 : {
          if (!(HEAP32[($7_1 + 96 | 0) >> 2] | 0)) {
           break label$25
          }
          $225 = ($18($7_1 + 40 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
          break label$24;
         }
         $225 = ($19($7_1 + 40 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
        }
        $236 = HEAP32[($7_1 + 88 | 0) >> 2] | 0;
        HEAP32[($7_1 + 88 | 0) >> 2] = $236 + 1 | 0;
        HEAP8[$236 >> 0] = $225;
        break label$22;
       }
       label$26 : {
        if (!((HEAP32[($7_1 + 88 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($7_1 + 84 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0)) {
         break label$26
        }
        HEAP32[($7_1 + 120 | 0) >> 2] = -70;
        break label$5;
       }
       label$27 : {
        label$28 : {
         if (!(HEAP32[($7_1 + 96 | 0) >> 2] | 0)) {
          break label$28
         }
         $259 = ($18($7_1 + 40 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
         break label$27;
        }
        $259 = ($19($7_1 + 40 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
       }
       $274 = HEAP32[($7_1 + 88 | 0) >> 2] | 0;
       HEAP32[($7_1 + 88 | 0) >> 2] = $274 + 1 | 0;
       HEAP8[$274 >> 0] = $259;
       label$29 : {
        if (!(($17($7_1 + 56 | 0 | 0) | 0 | 0) == (3 | 0) & 1 | 0)) {
         break label$29
        }
        label$30 : {
         label$31 : {
          if (!(HEAP32[($7_1 + 96 | 0) >> 2] | 0)) {
           break label$31
          }
          $293 = ($18($7_1 + 48 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
          break label$30;
         }
         $293 = ($19($7_1 + 48 | 0 | 0, $7_1 + 56 | 0 | 0) | 0) & 255 | 0;
        }
        $304 = HEAP32[($7_1 + 88 | 0) >> 2] | 0;
        HEAP32[($7_1 + 88 | 0) >> 2] = $304 + 1 | 0;
        HEAP8[$304 >> 0] = $293;
        break label$22;
       }
       continue label$18;
      }
      break label$18;
     };
     HEAP32[($7_1 + 120 | 0) >> 2] = (HEAP32[($7_1 + 88 | 0) >> 2] | 0) - (HEAP32[($7_1 + 92 | 0) >> 2] | 0) | 0;
    }
    HEAP32[($7_1 + 32 | 0) >> 2] = HEAP32[($7_1 + 120 | 0) >> 2] | 0;
    break label$3;
   }
   $316 = HEAP32[($7_1 + 24 | 0) >> 2] | 0;
   $317 = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
   $318 = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
   $319 = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
   HEAP32[($7_1 + 200 | 0) >> 2] = HEAP32[($7_1 + 28 | 0) >> 2] | 0;
   HEAP32[($7_1 + 196 | 0) >> 2] = $316;
   HEAP32[($7_1 + 192 | 0) >> 2] = $317;
   HEAP32[($7_1 + 188 | 0) >> 2] = $318;
   HEAP32[($7_1 + 184 | 0) >> 2] = $319;
   HEAP32[($7_1 + 180 | 0) >> 2] = 0;
   HEAP32[($7_1 + 176 | 0) >> 2] = HEAP32[($7_1 + 200 | 0) >> 2] | 0;
   HEAP32[($7_1 + 172 | 0) >> 2] = HEAP32[($7_1 + 176 | 0) >> 2] | 0;
   HEAP32[($7_1 + 168 | 0) >> 2] = (HEAP32[($7_1 + 172 | 0) >> 2] | 0) + (HEAP32[($7_1 + 196 | 0) >> 2] | 0) | 0;
   HEAP32[($7_1 + 164 | 0) >> 2] = (HEAP32[($7_1 + 168 | 0) >> 2] | 0) + -3 | 0;
   HEAP32[($7_1 + 124 | 0) >> 2] = $15($7_1 + 144 | 0 | 0, HEAP32[($7_1 + 192 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 188 | 0) >> 2] | 0 | 0) | 0;
   label$32 : {
    label$33 : {
     if (!($3(HEAP32[($7_1 + 124 | 0) >> 2] | 0 | 0) | 0)) {
      break label$33
     }
     HEAP32[($7_1 + 204 | 0) >> 2] = HEAP32[($7_1 + 124 | 0) >> 2] | 0;
     break label$32;
    }
    $339 = $7_1 + 144 | 0;
    $16($7_1 + 136 | 0 | 0, $339 | 0, HEAP32[($7_1 + 184 | 0) >> 2] | 0 | 0);
    $16($7_1 + 128 | 0 | 0, $339 | 0, HEAP32[($7_1 + 184 | 0) >> 2] | 0 | 0);
    label$34 : {
     label$35 : while (1) {
      if (!((($17($7_1 + 144 | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($7_1 + 172 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 164 | 0) >> 2] | 0) >>> 0 & 1 | 0) | 0)) {
       break label$34
      }
      label$36 : {
       label$37 : {
        if (!(HEAP32[($7_1 + 180 | 0) >> 2] | 0)) {
         break label$37
        }
        $373 = ($18($7_1 + 136 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
        break label$36;
       }
       $373 = ($19($7_1 + 136 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
      }
      HEAP8[(HEAP32[($7_1 + 172 | 0) >> 2] | 0) >> 0] = $373;
      label$38 : {
       label$39 : {
        if (!(HEAP32[($7_1 + 180 | 0) >> 2] | 0)) {
         break label$39
        }
        $395 = ($18($7_1 + 128 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
        break label$38;
       }
       $395 = ($19($7_1 + 128 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
      }
      HEAP8[((HEAP32[($7_1 + 172 | 0) >> 2] | 0) + 1 | 0) >> 0] = $395;
      label$40 : {
       if (!(($17($7_1 + 144 | 0 | 0) | 0) >>> 0 > 0 >>> 0 & 1 | 0)) {
        break label$40
       }
       HEAP32[($7_1 + 172 | 0) >> 2] = (HEAP32[($7_1 + 172 | 0) >> 2] | 0) + 2 | 0;
       break label$34;
      }
      label$41 : {
       label$42 : {
        if (!(HEAP32[($7_1 + 180 | 0) >> 2] | 0)) {
         break label$42
        }
        $430 = ($18($7_1 + 136 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
        break label$41;
       }
       $430 = ($19($7_1 + 136 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
      }
      HEAP8[((HEAP32[($7_1 + 172 | 0) >> 2] | 0) + 2 | 0) >> 0] = $430;
      label$43 : {
       label$44 : {
        if (!(HEAP32[($7_1 + 180 | 0) >> 2] | 0)) {
         break label$44
        }
        $452 = ($18($7_1 + 128 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
        break label$43;
       }
       $452 = ($19($7_1 + 128 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
      }
      HEAP8[((HEAP32[($7_1 + 172 | 0) >> 2] | 0) + 3 | 0) >> 0] = $452;
      HEAP32[($7_1 + 172 | 0) >> 2] = (HEAP32[($7_1 + 172 | 0) >> 2] | 0) + 4 | 0;
      continue label$35;
     };
    }
    label$45 : while (1) {
     label$46 : {
      if (!((HEAP32[($7_1 + 172 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($7_1 + 168 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0)) {
       break label$46
      }
      HEAP32[($7_1 + 204 | 0) >> 2] = -70;
      break label$32;
     }
     label$47 : {
      label$48 : {
       if (!(HEAP32[($7_1 + 180 | 0) >> 2] | 0)) {
        break label$48
       }
       $487 = ($18($7_1 + 136 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
       break label$47;
      }
      $487 = ($19($7_1 + 136 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
     }
     $502 = HEAP32[($7_1 + 172 | 0) >> 2] | 0;
     HEAP32[($7_1 + 172 | 0) >> 2] = $502 + 1 | 0;
     HEAP8[$502 >> 0] = $487;
     label$49 : {
      label$50 : {
       if (!(($17($7_1 + 144 | 0 | 0) | 0 | 0) == (3 | 0) & 1 | 0)) {
        break label$50
       }
       label$51 : {
        label$52 : {
         if (!(HEAP32[($7_1 + 180 | 0) >> 2] | 0)) {
          break label$52
         }
         $521 = ($18($7_1 + 128 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
         break label$51;
        }
        $521 = ($19($7_1 + 128 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
       }
       $532 = HEAP32[($7_1 + 172 | 0) >> 2] | 0;
       HEAP32[($7_1 + 172 | 0) >> 2] = $532 + 1 | 0;
       HEAP8[$532 >> 0] = $521;
       break label$49;
      }
      label$53 : {
       if (!((HEAP32[($7_1 + 172 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($7_1 + 168 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0)) {
        break label$53
       }
       HEAP32[($7_1 + 204 | 0) >> 2] = -70;
       break label$32;
      }
      label$54 : {
       label$55 : {
        if (!(HEAP32[($7_1 + 180 | 0) >> 2] | 0)) {
         break label$55
        }
        $555 = ($18($7_1 + 128 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
        break label$54;
       }
       $555 = ($19($7_1 + 128 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
      }
      $570 = HEAP32[($7_1 + 172 | 0) >> 2] | 0;
      HEAP32[($7_1 + 172 | 0) >> 2] = $570 + 1 | 0;
      HEAP8[$570 >> 0] = $555;
      label$56 : {
       if (!(($17($7_1 + 144 | 0 | 0) | 0 | 0) == (3 | 0) & 1 | 0)) {
        break label$56
       }
       label$57 : {
        label$58 : {
         if (!(HEAP32[($7_1 + 180 | 0) >> 2] | 0)) {
          break label$58
         }
         $589 = ($18($7_1 + 136 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
         break label$57;
        }
        $589 = ($19($7_1 + 136 | 0 | 0, $7_1 + 144 | 0 | 0) | 0) & 255 | 0;
       }
       $600 = HEAP32[($7_1 + 172 | 0) >> 2] | 0;
       HEAP32[($7_1 + 172 | 0) >> 2] = $600 + 1 | 0;
       HEAP8[$600 >> 0] = $589;
       break label$49;
      }
      continue label$45;
     }
     break label$45;
    };
    HEAP32[($7_1 + 204 | 0) >> 2] = (HEAP32[($7_1 + 172 | 0) >> 2] | 0) - (HEAP32[($7_1 + 176 | 0) >> 2] | 0) | 0;
   }
   HEAP32[($7_1 + 32 | 0) >> 2] = HEAP32[($7_1 + 204 | 0) >> 2] | 0;
  }
  $607 = HEAP32[($7_1 + 32 | 0) >> 2] | 0;
  label$59 : {
   $611 = $7_1 + 208 | 0;
   if ($611 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $611;
  }
  return $607 | 0;
 }
 
 function $15($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, $167 = 0, $59_1 = 0, $67_1 = 0, $69_1 = 0, $74_1 = 0, $82_1 = 0, $91_1 = 0, $100_1 = 0, $109_1 = 0, $118_1 = 0, $127_1 = 0, $145_1 = 0, $158_1 = 0, $166 = 0, $165 = 0, $42_1 = 0, $162 = 0;
  $5_1 = global$0 - 32 | 0;
  label$1 : {
   $165 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $165;
  }
  HEAP32[($5_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 16 | 0) >> 2] = $2_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($5_1 + 16 | 0) >> 2] | 0) >>> 0 < 1 >>> 0 & 1 | 0)) {
     break label$4
    }
    i64toi32_i32$0 = 0;
    $167 = 0;
    i64toi32_i32$1 = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
    HEAP32[i64toi32_i32$1 >> 2] = $167;
    HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
    HEAP32[(i64toi32_i32$1 + 16 | 0) >> 2] = 0;
    i64toi32_i32$1 = i64toi32_i32$1 + 8 | 0;
    HEAP32[i64toi32_i32$1 >> 2] = $167;
    HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
    HEAP32[($5_1 + 28 | 0) >> 2] = -72;
    break label$3;
   }
   HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 12 | 0) >> 2] = HEAP32[($5_1 + 20 | 0) >> 2] | 0;
   HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 16 | 0) >> 2] = (HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 12 | 0) >> 2] | 0) + 4 | 0;
   label$5 : {
    label$6 : {
     if (!((HEAP32[($5_1 + 16 | 0) >> 2] | 0) >>> 0 >= 4 >>> 0 & 1 | 0)) {
      break label$6
     }
     HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 8 | 0) >> 2] = ((HEAP32[($5_1 + 20 | 0) >> 2] | 0) + (HEAP32[($5_1 + 16 | 0) >> 2] | 0) | 0) + -4 | 0;
     $42_1 = $132(HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0 | 0) | 0;
     HEAP32[(HEAP32[($5_1 + 24 | 0) >> 2] | 0) >> 2] = $42_1;
     HEAP8[($5_1 + 15 | 0) >> 0] = HEAPU8[((HEAP32[($5_1 + 20 | 0) >> 2] | 0) + ((HEAP32[($5_1 + 16 | 0) >> 2] | 0) - 1 | 0) | 0) >> 0] | 0;
     label$7 : {
      label$8 : {
       if (!((HEAPU8[($5_1 + 15 | 0) >> 0] | 0) & 255 | 0)) {
        break label$8
       }
       $59_1 = 8 - ($12((HEAPU8[($5_1 + 15 | 0) >> 0] | 0) & 255 | 0 | 0) | 0) | 0;
       break label$7;
      }
      $59_1 = 0;
     }
     HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 4 | 0) >> 2] = $59_1;
     label$9 : {
      if ((HEAPU8[($5_1 + 15 | 0) >> 0] | 0) & 255 | 0) {
       break label$9
      }
      HEAP32[($5_1 + 28 | 0) >> 2] = -1;
      break label$3;
     }
     break label$5;
    }
    $67_1 = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
    HEAP32[($67_1 + 8 | 0) >> 2] = HEAP32[($67_1 + 12 | 0) >> 2] | 0;
    $69_1 = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
    HEAP32[$69_1 >> 2] = HEAPU8[(HEAP32[($69_1 + 12 | 0) >> 2] | 0) >> 0] | 0;
    $74_1 = (HEAP32[($5_1 + 16 | 0) >> 2] | 0) + -2 | 0;
    label$10 : {
     switch ($74_1 | 0) {
     case 5:
      $82_1 = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
      HEAP32[$82_1 >> 2] = (HEAP32[$82_1 >> 2] | 0) + (((HEAPU8[((HEAP32[($5_1 + 20 | 0) >> 2] | 0) + 6 | 0) >> 0] | 0) & 255 | 0) << 16 | 0) | 0;
     case 4:
      $91_1 = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
      HEAP32[$91_1 >> 2] = (HEAP32[$91_1 >> 2] | 0) + (((HEAPU8[((HEAP32[($5_1 + 20 | 0) >> 2] | 0) + 5 | 0) >> 0] | 0) & 255 | 0) << 8 | 0) | 0;
     case 3:
      $100_1 = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
      HEAP32[$100_1 >> 2] = (HEAP32[$100_1 >> 2] | 0) + (((HEAPU8[((HEAP32[($5_1 + 20 | 0) >> 2] | 0) + 4 | 0) >> 0] | 0) & 255 | 0) << 0 | 0) | 0;
     case 2:
      $109_1 = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
      HEAP32[$109_1 >> 2] = (HEAP32[$109_1 >> 2] | 0) + (((HEAPU8[((HEAP32[($5_1 + 20 | 0) >> 2] | 0) + 3 | 0) >> 0] | 0) & 255 | 0) << 24 | 0) | 0;
     case 1:
      $118_1 = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
      HEAP32[$118_1 >> 2] = (HEAP32[$118_1 >> 2] | 0) + (((HEAPU8[((HEAP32[($5_1 + 20 | 0) >> 2] | 0) + 2 | 0) >> 0] | 0) & 255 | 0) << 16 | 0) | 0;
     case 0:
      $127_1 = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
      HEAP32[$127_1 >> 2] = (HEAP32[$127_1 >> 2] | 0) + (((HEAPU8[((HEAP32[($5_1 + 20 | 0) >> 2] | 0) + 1 | 0) >> 0] | 0) & 255 | 0) << 8 | 0) | 0;
      break;
     default:
      break label$10;
     };
    }
    HEAP8[($5_1 + 14 | 0) >> 0] = HEAPU8[((HEAP32[($5_1 + 20 | 0) >> 2] | 0) + ((HEAP32[($5_1 + 16 | 0) >> 2] | 0) - 1 | 0) | 0) >> 0] | 0;
    label$17 : {
     label$18 : {
      if (!((HEAPU8[($5_1 + 14 | 0) >> 0] | 0) & 255 | 0)) {
       break label$18
      }
      $145_1 = 8 - ($12((HEAPU8[($5_1 + 14 | 0) >> 0] | 0) & 255 | 0 | 0) | 0) | 0;
      break label$17;
     }
     $145_1 = 0;
    }
    HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 4 | 0) >> 2] = $145_1;
    label$19 : {
     if ((HEAPU8[($5_1 + 14 | 0) >> 0] | 0) & 255 | 0) {
      break label$19
     }
     HEAP32[($5_1 + 28 | 0) >> 2] = -20;
     break label$3;
    }
    $158_1 = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
    HEAP32[($158_1 + 4 | 0) >> 2] = (HEAP32[($158_1 + 4 | 0) >> 2] | 0) + ((4 - (HEAP32[($5_1 + 16 | 0) >> 2] | 0) | 0) << 3 | 0) | 0;
   }
   HEAP32[($5_1 + 28 | 0) >> 2] = HEAP32[($5_1 + 16 | 0) >> 2] | 0;
  }
  $162 = HEAP32[($5_1 + 28 | 0) >> 2] | 0;
  label$20 : {
   $166 = $5_1 + 32 | 0;
   if ($166 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $166;
  }
  return $162 | 0;
 }
 
 function $16($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $23_1 = 0, $22_1 = 0, $13_1 = 0;
  $5_1 = global$0 - 32 | 0;
  label$1 : {
   $22_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $22_1;
  }
  HEAP32[($5_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($5_1 + 16 | 0) >> 2] = HEAP32[($5_1 + 20 | 0) >> 2] | 0;
  HEAP32[($5_1 + 12 | 0) >> 2] = HEAP32[($5_1 + 16 | 0) >> 2] | 0;
  $13_1 = $133(HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0, (HEAPU16[(HEAP32[($5_1 + 12 | 0) >> 2] | 0) >> 1] | 0) & 65535 | 0 | 0) | 0;
  HEAP32[(HEAP32[($5_1 + 28 | 0) >> 2] | 0) >> 2] = $13_1;
  $17(HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0) | 0;
  HEAP32[((HEAP32[($5_1 + 28 | 0) >> 2] | 0) + 4 | 0) >> 2] = (HEAP32[($5_1 + 20 | 0) >> 2] | 0) + 4 | 0;
  label$3 : {
   $23_1 = $5_1 + 32 | 0;
   if ($23_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $23_1;
  }
  return;
 }
 
 function $17($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $43_1 = 0, $68_1 = 0, $75_1 = 0, $87_1 = 0, $86_1 = 0, $80_1 = 0, $83_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $86_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $86_1;
  }
  HEAP32[($3_1 + 8 | 0) >> 2] = $0_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 > 32 >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($3_1 + 12 | 0) >> 2] = 3;
    break label$3;
   }
   label$5 : {
    if (!((HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0) >>> 0 >= (HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 16 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($3_1 + 12 | 0) >> 2] = $36(HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) | 0;
    break label$3;
   }
   label$6 : {
    if (!((HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0 | 0) == (HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 12 | 0) >> 2] | 0 | 0) & 1 | 0)) {
     break label$6
    }
    label$7 : {
     if (!((HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 < 32 >>> 0 & 1 | 0)) {
      break label$7
     }
     HEAP32[($3_1 + 12 | 0) >> 2] = 1;
     break label$3;
    }
    HEAP32[($3_1 + 12 | 0) >> 2] = 2;
    break label$3;
   }
   $43_1 = 0;
   HEAP32[($3_1 + 4 | 0) >> 2] = (HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 3 | 0;
   HEAP32[$3_1 >> 2] = $43_1;
   label$8 : {
    if (!(((HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0) + ($43_1 - (HEAP32[($3_1 + 4 | 0) >> 2] | 0) | 0) | 0) >>> 0 < (HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 12 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$8
    }
    HEAP32[($3_1 + 4 | 0) >> 2] = (HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0) - (HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 12 | 0) >> 2] | 0) | 0;
    HEAP32[$3_1 >> 2] = 1;
   }
   $68_1 = HEAP32[($3_1 + 8 | 0) >> 2] | 0;
   HEAP32[($68_1 + 8 | 0) >> 2] = (HEAP32[($68_1 + 8 | 0) >> 2] | 0) + (0 - (HEAP32[($3_1 + 4 | 0) >> 2] | 0) | 0) | 0;
   $75_1 = HEAP32[($3_1 + 8 | 0) >> 2] | 0;
   HEAP32[($75_1 + 4 | 0) >> 2] = (HEAP32[($75_1 + 4 | 0) >> 2] | 0) - ((HEAP32[($3_1 + 4 | 0) >> 2] | 0) << 3 | 0) | 0;
   $80_1 = $132(HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0 | 0) | 0;
   HEAP32[(HEAP32[($3_1 + 8 | 0) >> 2] | 0) >> 2] = $80_1;
   HEAP32[($3_1 + 12 | 0) >> 2] = HEAP32[$3_1 >> 2] | 0;
  }
  $83_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  label$9 : {
   $87_1 = $3_1 + 16 | 0;
   if ($87_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $87_1;
  }
  return $83_1 | 0;
 }
 
 function $18($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $6_1 = 0, $7_1 = 0, $8_1 = 0, $35_1 = 0, $34_1 = 0, $31_1 = 0;
  $4_1 = global$0 - 32 | 0;
  label$1 : {
   $34_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $34_1;
  }
  HEAP32[($4_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 24 | 0) >> 2] = $1_1;
  $6_1 = (HEAP32[((HEAP32[($4_1 + 28 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) + ((HEAP32[(HEAP32[($4_1 + 28 | 0) >> 2] | 0) >> 2] | 0) << 2 | 0) | 0;
  $7_1 = $4_1 + 16 | 0;
  $8_1 = HEAPU16[$6_1 >> 1] | 0 | ((HEAPU16[($6_1 + 2 | 0) >> 1] | 0) << 16 | 0) | 0;
  HEAP16[$7_1 >> 1] = $8_1;
  HEAP16[($7_1 + 2 | 0) >> 1] = $8_1 >>> 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = (HEAPU8[($4_1 + 19 | 0) >> 0] | 0) & 255 | 0;
  HEAP8[($4_1 + 11 | 0) >> 0] = HEAPU8[($4_1 + 18 | 0) >> 0] | 0;
  HEAP32[($4_1 + 4 | 0) >> 2] = $134(HEAP32[($4_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0) | 0;
  HEAP32[(HEAP32[($4_1 + 28 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($4_1 + 16 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($4_1 + 4 | 0) >> 2] | 0) | 0;
  $31_1 = (HEAPU8[($4_1 + 11 | 0) >> 0] | 0) & 255 | 0;
  label$3 : {
   $35_1 = $4_1 + 32 | 0;
   if ($35_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $35_1;
  }
  return $31_1 | 0;
 }
 
 function $19($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $6_1 = 0, $7_1 = 0, $8_1 = 0, $35_1 = 0, $34_1 = 0, $31_1 = 0;
  $4_1 = global$0 - 32 | 0;
  label$1 : {
   $34_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $34_1;
  }
  HEAP32[($4_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 24 | 0) >> 2] = $1_1;
  $6_1 = (HEAP32[((HEAP32[($4_1 + 28 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) + ((HEAP32[(HEAP32[($4_1 + 28 | 0) >> 2] | 0) >> 2] | 0) << 2 | 0) | 0;
  $7_1 = $4_1 + 16 | 0;
  $8_1 = HEAPU16[$6_1 >> 1] | 0 | ((HEAPU16[($6_1 + 2 | 0) >> 1] | 0) << 16 | 0) | 0;
  HEAP16[$7_1 >> 1] = $8_1;
  HEAP16[($7_1 + 2 | 0) >> 1] = $8_1 >>> 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = (HEAPU8[($4_1 + 19 | 0) >> 0] | 0) & 255 | 0;
  HEAP8[($4_1 + 11 | 0) >> 0] = HEAPU8[($4_1 + 18 | 0) >> 0] | 0;
  HEAP32[($4_1 + 4 | 0) >> 2] = $133(HEAP32[($4_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0) | 0;
  HEAP32[(HEAP32[($4_1 + 28 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($4_1 + 16 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($4_1 + 4 | 0) >> 2] | 0) | 0;
  $31_1 = (HEAPU8[($4_1 + 11 | 0) >> 0] | 0) & 255 | 0;
  label$3 : {
   $35_1 = $4_1 + 32 | 0;
   if ($35_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $35_1;
  }
  return $31_1 | 0;
 }
 
 function $20($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  return HEAP32[($3_1 + 12 | 0) >> 2] | 0 | 0;
 }
 
 function $21($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  return HEAP32[($3_1 + 12 | 0) >> 2] | 0 | 0;
 }
 
 function $22($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $9_1 = 0, $8_1 = 0, $5_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $8_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $8_1;
  }
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $5_1 = $3(HEAP32[($3_1 + 12 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   $9_1 = $3_1 + 16 | 0;
   if ($9_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $9_1;
  }
  return $5_1 | 0;
 }
 
 function $23($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $9_1 = 0, $8_1 = 0, $5_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $8_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $8_1;
  }
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $5_1 = $4(HEAP32[($3_1 + 12 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   $9_1 = $3_1 + 16 | 0;
   if ($9_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $9_1;
  }
  return $5_1 | 0;
 }
 
 function $24($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $22_1 = 0, $21_1 = 0, $18_1 = 0;
  $4_1 = global$0 - 16 | 0;
  label$1 : {
   $21_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $21_1;
  }
  HEAP32[($4_1 + 8 | 0) >> 2] = $0_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[$1_1 >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
     break label$4
    }
    HEAP32[($4_1 + 12 | 0) >> 2] = FUNCTION_TABLE[HEAP32[$1_1 >> 2] | 0](HEAP32[($1_1 + 8 | 0) >> 2] | 0, HEAP32[($4_1 + 8 | 0) >> 2] | 0) | 0;
    break label$3;
   }
   HEAP32[($4_1 + 12 | 0) >> 2] = $148(HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0) | 0;
  }
  $18_1 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  label$5 : {
   $22_1 = $4_1 + 16 | 0;
   if ($22_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $22_1;
  }
  return $18_1 | 0;
 }
 
 function $25($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $26_1 = 0, $25_1 = 0;
  $4_1 = global$0 - 16 | 0;
  label$1 : {
   $25_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $25_1;
  }
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  label$3 : {
   if (!((HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
    break label$3
   }
   label$4 : {
    label$5 : {
     if (!((HEAP32[($1_1 + 4 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
      break label$5
     }
     FUNCTION_TABLE[HEAP32[($1_1 + 4 | 0) >> 2] | 0](HEAP32[($1_1 + 8 | 0) >> 2] | 0, HEAP32[($4_1 + 12 | 0) >> 2] | 0);
     break label$4;
    }
    $150(HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0);
   }
  }
  label$6 : {
   $26_1 = $4_1 + 16 | 0;
   if ($26_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $26_1;
  }
  return;
 }
 
 function $26($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $7_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $8_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, $18_1 = 0, $19_1 = 0, $20_1 = 0, $21_1 = 0, $22_1 = 0, $230 = 0, $229 = 0, $226 = 0;
  $7_1 = global$0 - 112 | 0;
  label$1 : {
   $229 = $7_1;
   if ($7_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $229;
  }
  $8_1 = 0;
  HEAP32[($7_1 + 104 | 0) >> 2] = $0_1;
  HEAP32[($7_1 + 100 | 0) >> 2] = $1_1;
  HEAP32[($7_1 + 96 | 0) >> 2] = $2_1;
  HEAP32[($7_1 + 92 | 0) >> 2] = $3_1;
  HEAP32[($7_1 + 88 | 0) >> 2] = $4_1;
  HEAP32[($7_1 + 84 | 0) >> 2] = $8_1;
  HEAP32[($7_1 + 80 | 0) >> 2] = $8_1;
  HEAP32[($7_1 + 72 | 0) >> 2] = (HEAP32[($7_1 + 104 | 0) >> 2] | 0) + 4 | 0;
  HEAP32[($7_1 + 68 | 0) >> 2] = HEAP32[($7_1 + 72 | 0) >> 2] | 0;
  HEAP32[($7_1 + 56 | 0) >> 2] = $8_1;
  HEAP32[($7_1 + 64 | 0) >> 2] = (HEAP32[($7_1 + 92 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 56 | 0) >> 2] | 0) << 2 | 0) | 0;
  HEAP32[($7_1 + 56 | 0) >> 2] = (HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 16 | 0;
  HEAP32[($7_1 + 60 | 0) >> 2] = (HEAP32[($7_1 + 92 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 56 | 0) >> 2] | 0) << 2 | 0) | 0;
  HEAP32[($7_1 + 56 | 0) >> 2] = (HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 64 | 0;
  label$3 : {
   label$4 : {
    if (!(((HEAP32[($7_1 + 56 | 0) >> 2] | 0) << 2 | 0) >>> 0 > (HEAP32[($7_1 + 88 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($7_1 + 108 | 0) >> 2] = -44;
    break label$3;
   }
   HEAP32[($7_1 + 76 | 0) >> 2] = $10(HEAP32[($7_1 + 60 | 0) >> 2] | 0 | 0, 256 | 0, HEAP32[($7_1 + 64 | 0) >> 2] | 0 | 0, $7_1 + 80 | 0 | 0, $7_1 + 84 | 0 | 0, HEAP32[($7_1 + 100 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 96 | 0) >> 2] | 0 | 0) | 0;
   label$5 : {
    if (!($3(HEAP32[($7_1 + 76 | 0) >> 2] | 0 | 0) | 0)) {
     break label$5
    }
    HEAP32[($7_1 + 108 | 0) >> 2] = HEAP32[($7_1 + 76 | 0) >> 2] | 0;
    break label$3;
   }
   $27($7_1 + 48 | 0 | 0, HEAP32[($7_1 + 104 | 0) >> 2] | 0 | 0);
   label$6 : {
    if (!((HEAP32[($7_1 + 84 | 0) >> 2] | 0) >>> 0 > (((HEAPU8[($7_1 + 48 | 0) >> 0] | 0) & 255 | 0) + 1 | 0) >>> 0 & 1 | 0)) {
     break label$6
    }
    HEAP32[($7_1 + 108 | 0) >> 2] = -44;
    break label$3;
   }
   HEAP8[($7_1 + 49 | 0) >> 0] = 0;
   HEAP8[($7_1 + 50 | 0) >> 0] = HEAP32[($7_1 + 84 | 0) >> 2] | 0;
   $10_1 = $7_1 + 48 | 0;
   $11_1 = HEAP32[($7_1 + 104 | 0) >> 2] | 0;
   $12_1 = HEAPU8[$10_1 >> 0] | 0 | ((HEAPU8[($10_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[($10_1 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[($10_1 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
   HEAP8[$11_1 >> 0] = $12_1;
   HEAP8[($11_1 + 1 | 0) >> 0] = $12_1 >>> 8 | 0;
   HEAP8[($11_1 + 2 | 0) >> 0] = $12_1 >>> 16 | 0;
   HEAP8[($11_1 + 3 | 0) >> 0] = $12_1 >>> 24 | 0;
   HEAP32[($7_1 + 40 | 0) >> 2] = 0;
   HEAP32[($7_1 + 44 | 0) >> 2] = 1;
   label$7 : {
    label$8 : while (1) {
     if (!((HEAP32[($7_1 + 44 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($7_1 + 84 | 0) >> 2] | 0) + 1 | 0) >>> 0 & 1 | 0)) {
      break label$7
     }
     HEAP32[($7_1 + 36 | 0) >> 2] = HEAP32[($7_1 + 40 | 0) >> 2] | 0;
     HEAP32[($7_1 + 40 | 0) >> 2] = (HEAP32[($7_1 + 40 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($7_1 + 64 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 44 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) << ((HEAP32[($7_1 + 44 | 0) >> 2] | 0) - 1 | 0) | 0) | 0;
     HEAP32[((HEAP32[($7_1 + 64 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 44 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] = HEAP32[($7_1 + 36 | 0) >> 2] | 0;
     HEAP32[($7_1 + 44 | 0) >> 2] = (HEAP32[($7_1 + 44 | 0) >> 2] | 0) + 1 | 0;
     continue label$8;
    };
   }
   HEAP32[($7_1 + 28 | 0) >> 2] = HEAP32[($7_1 + 80 | 0) >> 2] | 0;
   HEAP32[($7_1 + 32 | 0) >> 2] = 0;
   label$9 : {
    label$10 : while (1) {
     if (!((HEAP32[($7_1 + 32 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 28 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$9
     }
     HEAP32[($7_1 + 24 | 0) >> 2] = (HEAPU8[((HEAP32[($7_1 + 60 | 0) >> 2] | 0) + (HEAP32[($7_1 + 32 | 0) >> 2] | 0) | 0) >> 0] | 0) & 255 | 0;
     HEAP32[($7_1 + 20 | 0) >> 2] = (1 << (HEAP32[($7_1 + 24 | 0) >> 2] | 0) | 0) >> 1 | 0;
     HEAP32[($7_1 + 16 | 0) >> 2] = HEAP32[((HEAP32[($7_1 + 64 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 24 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
     HEAP32[($7_1 + 12 | 0) >> 2] = (HEAP32[($7_1 + 16 | 0) >> 2] | 0) + (HEAP32[($7_1 + 20 | 0) >> 2] | 0) | 0;
     HEAP8[$7_1 >> 0] = HEAP32[($7_1 + 32 | 0) >> 2] | 0;
     HEAP8[($7_1 + 1 | 0) >> 0] = ((HEAP32[($7_1 + 84 | 0) >> 2] | 0) + 1 | 0) - (HEAP32[($7_1 + 24 | 0) >> 2] | 0) | 0;
     HEAP32[((HEAP32[($7_1 + 64 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 24 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
     label$11 : {
      label$12 : {
       if (!((HEAP32[($7_1 + 20 | 0) >> 2] | 0) >>> 0 < 4 >>> 0 & 1 | 0)) {
        break label$12
       }
       HEAP32[($7_1 + 8 | 0) >> 2] = 0;
       label$13 : {
        label$14 : while (1) {
         if (!((HEAP32[($7_1 + 8 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 20 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
          break label$13
         }
         $13_1 = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + (((HEAP32[($7_1 + 16 | 0) >> 2] | 0) + (HEAP32[($7_1 + 8 | 0) >> 2] | 0) | 0) << 1 | 0) | 0;
         $14_1 = HEAPU8[$7_1 >> 0] | 0 | ((HEAPU8[($7_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
         HEAP8[$13_1 >> 0] = $14_1;
         HEAP8[($13_1 + 1 | 0) >> 0] = $14_1 >>> 8 | 0;
         HEAP32[($7_1 + 8 | 0) >> 2] = (HEAP32[($7_1 + 8 | 0) >> 2] | 0) + 1 | 0;
         continue label$14;
        };
       }
       break label$11;
      }
      HEAP32[($7_1 + 8 | 0) >> 2] = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
      label$15 : {
       label$16 : while (1) {
        if (!((HEAP32[($7_1 + 8 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 12 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
         break label$15
        }
        $15_1 = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + (((HEAP32[($7_1 + 8 | 0) >> 2] | 0) + 0 | 0) << 1 | 0) | 0;
        $16_1 = HEAPU8[$7_1 >> 0] | 0 | ((HEAPU8[($7_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
        HEAP8[$15_1 >> 0] = $16_1;
        HEAP8[($15_1 + 1 | 0) >> 0] = $16_1 >>> 8 | 0;
        $17_1 = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + (((HEAP32[($7_1 + 8 | 0) >> 2] | 0) + 1 | 0) << 1 | 0) | 0;
        $18_1 = HEAPU8[$7_1 >> 0] | 0 | ((HEAPU8[($7_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
        HEAP8[$17_1 >> 0] = $18_1;
        HEAP8[($17_1 + 1 | 0) >> 0] = $18_1 >>> 8 | 0;
        $19_1 = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + (((HEAP32[($7_1 + 8 | 0) >> 2] | 0) + 2 | 0) << 1 | 0) | 0;
        $20_1 = HEAPU8[$7_1 >> 0] | 0 | ((HEAPU8[($7_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
        HEAP8[$19_1 >> 0] = $20_1;
        HEAP8[($19_1 + 1 | 0) >> 0] = $20_1 >>> 8 | 0;
        $21_1 = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + (((HEAP32[($7_1 + 8 | 0) >> 2] | 0) + 3 | 0) << 1 | 0) | 0;
        $22_1 = HEAPU8[$7_1 >> 0] | 0 | ((HEAPU8[($7_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
        HEAP8[$21_1 >> 0] = $22_1;
        HEAP8[($21_1 + 1 | 0) >> 0] = $22_1 >>> 8 | 0;
        HEAP32[($7_1 + 8 | 0) >> 2] = (HEAP32[($7_1 + 8 | 0) >> 2] | 0) + 4 | 0;
        continue label$16;
       };
      }
     }
     HEAP32[($7_1 + 32 | 0) >> 2] = (HEAP32[($7_1 + 32 | 0) >> 2] | 0) + 1 | 0;
     continue label$10;
    };
   }
   HEAP32[($7_1 + 108 | 0) >> 2] = HEAP32[($7_1 + 76 | 0) >> 2] | 0;
  }
  $226 = HEAP32[($7_1 + 108 | 0) >> 2] | 0;
  label$17 : {
   $230 = $7_1 + 112 | 0;
   if ($230 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $230;
  }
  return $226 | 0;
 }
 
 function $27($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $3_1 = 0, $5_1 = 0, $6_1 = 0, $4_1 = 0;
  $4_1 = global$0 - 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = $1_1;
  $3_1 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  $5_1 = $0_1;
  $6_1 = HEAPU8[$3_1 >> 0] | 0 | ((HEAPU8[($3_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[($3_1 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[($3_1 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  HEAP8[$5_1 >> 0] = $6_1;
  HEAP8[($5_1 + 1 | 0) >> 0] = $6_1 >>> 8 | 0;
  HEAP8[($5_1 + 2 | 0) >> 0] = $6_1 >>> 16 | 0;
  HEAP8[($5_1 + 3 | 0) >> 0] = $6_1 >>> 24 | 0;
  return;
 }
 
 function $28($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $8_1 = 0, $87_1 = 0, $113_1 = 0, $139_1 = 0, $164 = 0, $206 = 0, $238 = 0, $251 = 0, $250 = 0, $16_1 = 0, $17_1 = 0, $18_1 = 0, $19_1 = 0, $42_1 = 0, $43_1 = 0, $44_1 = 0, $66_1 = 0, $67_1 = 0, $86_1 = 0, $92_1 = 0, $93_1 = 0, $112_1 = 0, $118_1 = 0, $119_1 = 0, $138_1 = 0, $143_1 = 0, $144_1 = 0, $163 = 0, $185 = 0, $186 = 0, $205 = 0, $217 = 0, $218 = 0, $237 = 0, $247 = 0;
  $8_1 = global$0 - 256 | 0;
  label$1 : {
   $250 = $8_1;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $250;
  }
  HEAP32[($8_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($8_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($8_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($8_1 + 16 | 0) >> 2] = $3_1;
  HEAP32[($8_1 + 12 | 0) >> 2] = $4_1;
  HEAP32[($8_1 + 8 | 0) >> 2] = $5_1;
  $16_1 = HEAP32[($8_1 + 24 | 0) >> 2] | 0;
  $17_1 = HEAP32[($8_1 + 20 | 0) >> 2] | 0;
  $18_1 = HEAP32[($8_1 + 16 | 0) >> 2] | 0;
  $19_1 = HEAP32[($8_1 + 12 | 0) >> 2] | 0;
  HEAP32[($8_1 + 104 | 0) >> 2] = HEAP32[($8_1 + 28 | 0) >> 2] | 0;
  HEAP32[($8_1 + 100 | 0) >> 2] = $16_1;
  HEAP32[($8_1 + 96 | 0) >> 2] = $17_1;
  HEAP32[($8_1 + 92 | 0) >> 2] = $18_1;
  HEAP32[($8_1 + 88 | 0) >> 2] = $19_1;
  HEAP32[($8_1 + 84 | 0) >> 2] = HEAP32[($8_1 + 104 | 0) >> 2] | 0;
  HEAP32[($8_1 + 80 | 0) >> 2] = (HEAP32[($8_1 + 84 | 0) >> 2] | 0) + (HEAP32[($8_1 + 100 | 0) >> 2] | 0) | 0;
  HEAP32[($8_1 + 76 | 0) >> 2] = (HEAP32[($8_1 + 88 | 0) >> 2] | 0) + 4 | 0;
  HEAP32[($8_1 + 72 | 0) >> 2] = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
  $27($8_1 + 40 | 0 | 0, HEAP32[($8_1 + 88 | 0) >> 2] | 0 | 0);
  HEAP32[($8_1 + 36 | 0) >> 2] = (HEAPU8[($8_1 + 42 | 0) >> 0] | 0) & 255 | 0;
  HEAP32[($8_1 + 32 | 0) >> 2] = $15($8_1 + 48 | 0 | 0, HEAP32[($8_1 + 96 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 92 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   label$4 : {
    if (!($3(HEAP32[($8_1 + 32 | 0) >> 2] | 0 | 0) | 0)) {
     break label$4
    }
    HEAP32[($8_1 + 108 | 0) >> 2] = HEAP32[($8_1 + 32 | 0) >> 2] | 0;
    break label$3;
   }
   $42_1 = HEAP32[($8_1 + 80 | 0) >> 2] | 0;
   $43_1 = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
   $44_1 = HEAP32[($8_1 + 36 | 0) >> 2] | 0;
   HEAP32[($8_1 + 132 | 0) >> 2] = HEAP32[($8_1 + 84 | 0) >> 2] | 0;
   HEAP32[($8_1 + 128 | 0) >> 2] = $8_1 + 48 | 0;
   HEAP32[($8_1 + 124 | 0) >> 2] = $42_1;
   HEAP32[($8_1 + 120 | 0) >> 2] = $43_1;
   HEAP32[($8_1 + 116 | 0) >> 2] = $44_1;
   HEAP32[($8_1 + 112 | 0) >> 2] = HEAP32[($8_1 + 132 | 0) >> 2] | 0;
   label$5 : {
    label$6 : while (1) {
     if (!((($17(HEAP32[($8_1 + 128 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 132 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($8_1 + 124 | 0) >> 2] | 0) + -3 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$5
     }
     label$7 : {
      if (!($29() | 0)) {
       break label$7
      }
      $66_1 = HEAP32[($8_1 + 120 | 0) >> 2] | 0;
      $67_1 = HEAP32[($8_1 + 116 | 0) >> 2] | 0;
      HEAP32[($8_1 + 152 | 0) >> 2] = HEAP32[($8_1 + 128 | 0) >> 2] | 0;
      HEAP32[($8_1 + 148 | 0) >> 2] = $66_1;
      HEAP32[($8_1 + 144 | 0) >> 2] = $67_1;
      HEAP32[($8_1 + 140 | 0) >> 2] = $30(HEAP32[($8_1 + 152 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 144 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 139 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 148 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 140 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 152 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 148 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 140 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $86_1 = HEAPU8[($8_1 + 139 | 0) >> 0] | 0;
      $87_1 = HEAP32[($8_1 + 132 | 0) >> 2] | 0;
      HEAP32[($8_1 + 132 | 0) >> 2] = $87_1 + 1 | 0;
      HEAP8[$87_1 >> 0] = $86_1;
     }
     label$8 : {
      if ($29() | 0) {
       break label$8
      }
     }
     $92_1 = HEAP32[($8_1 + 120 | 0) >> 2] | 0;
     $93_1 = HEAP32[($8_1 + 116 | 0) >> 2] | 0;
     HEAP32[($8_1 + 172 | 0) >> 2] = HEAP32[($8_1 + 128 | 0) >> 2] | 0;
     HEAP32[($8_1 + 168 | 0) >> 2] = $92_1;
     HEAP32[($8_1 + 164 | 0) >> 2] = $93_1;
     HEAP32[($8_1 + 160 | 0) >> 2] = $30(HEAP32[($8_1 + 172 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 164 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 159 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 168 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 160 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 172 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 168 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 160 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $112_1 = HEAPU8[($8_1 + 159 | 0) >> 0] | 0;
     $113_1 = HEAP32[($8_1 + 132 | 0) >> 2] | 0;
     HEAP32[($8_1 + 132 | 0) >> 2] = $113_1 + 1 | 0;
     HEAP8[$113_1 >> 0] = $112_1;
     label$9 : {
      if (!($29() | 0)) {
       break label$9
      }
      $118_1 = HEAP32[($8_1 + 120 | 0) >> 2] | 0;
      $119_1 = HEAP32[($8_1 + 116 | 0) >> 2] | 0;
      HEAP32[($8_1 + 192 | 0) >> 2] = HEAP32[($8_1 + 128 | 0) >> 2] | 0;
      HEAP32[($8_1 + 188 | 0) >> 2] = $118_1;
      HEAP32[($8_1 + 184 | 0) >> 2] = $119_1;
      HEAP32[($8_1 + 180 | 0) >> 2] = $30(HEAP32[($8_1 + 192 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 184 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 179 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 188 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 180 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 192 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 188 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 180 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $138_1 = HEAPU8[($8_1 + 179 | 0) >> 0] | 0;
      $139_1 = HEAP32[($8_1 + 132 | 0) >> 2] | 0;
      HEAP32[($8_1 + 132 | 0) >> 2] = $139_1 + 1 | 0;
      HEAP8[$139_1 >> 0] = $138_1;
     }
     $143_1 = HEAP32[($8_1 + 120 | 0) >> 2] | 0;
     $144_1 = HEAP32[($8_1 + 116 | 0) >> 2] | 0;
     HEAP32[($8_1 + 212 | 0) >> 2] = HEAP32[($8_1 + 128 | 0) >> 2] | 0;
     HEAP32[($8_1 + 208 | 0) >> 2] = $143_1;
     HEAP32[($8_1 + 204 | 0) >> 2] = $144_1;
     HEAP32[($8_1 + 200 | 0) >> 2] = $30(HEAP32[($8_1 + 212 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 204 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 199 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 208 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 200 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 212 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 208 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 200 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $163 = HEAPU8[($8_1 + 199 | 0) >> 0] | 0;
     $164 = HEAP32[($8_1 + 132 | 0) >> 2] | 0;
     HEAP32[($8_1 + 132 | 0) >> 2] = $164 + 1 | 0;
     HEAP8[$164 >> 0] = $163;
     continue label$6;
    };
   }
   label$10 : {
    if (!($32() | 0)) {
     break label$10
    }
    label$11 : {
     label$12 : while (1) {
      if (!((($17(HEAP32[($8_1 + 128 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 132 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 124 | 0) >> 2] | 0) >>> 0 & 1 | 0) | 0)) {
       break label$11
      }
      $185 = HEAP32[($8_1 + 120 | 0) >> 2] | 0;
      $186 = HEAP32[($8_1 + 116 | 0) >> 2] | 0;
      HEAP32[($8_1 + 232 | 0) >> 2] = HEAP32[($8_1 + 128 | 0) >> 2] | 0;
      HEAP32[($8_1 + 228 | 0) >> 2] = $185;
      HEAP32[($8_1 + 224 | 0) >> 2] = $186;
      HEAP32[($8_1 + 220 | 0) >> 2] = $30(HEAP32[($8_1 + 232 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 224 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 219 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 228 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 220 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 232 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 228 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 220 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $205 = HEAPU8[($8_1 + 219 | 0) >> 0] | 0;
      $206 = HEAP32[($8_1 + 132 | 0) >> 2] | 0;
      HEAP32[($8_1 + 132 | 0) >> 2] = $206 + 1 | 0;
      HEAP8[$206 >> 0] = $205;
      continue label$12;
     };
    }
   }
   label$13 : {
    label$14 : while (1) {
     if (!((HEAP32[($8_1 + 132 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 124 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$13
     }
     $217 = HEAP32[($8_1 + 120 | 0) >> 2] | 0;
     $218 = HEAP32[($8_1 + 116 | 0) >> 2] | 0;
     HEAP32[($8_1 + 252 | 0) >> 2] = HEAP32[($8_1 + 128 | 0) >> 2] | 0;
     HEAP32[($8_1 + 248 | 0) >> 2] = $217;
     HEAP32[($8_1 + 244 | 0) >> 2] = $218;
     HEAP32[($8_1 + 240 | 0) >> 2] = $30(HEAP32[($8_1 + 252 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 244 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 239 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 248 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 240 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 252 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 248 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 240 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $237 = HEAPU8[($8_1 + 239 | 0) >> 0] | 0;
     $238 = HEAP32[($8_1 + 132 | 0) >> 2] | 0;
     HEAP32[($8_1 + 132 | 0) >> 2] = $238 + 1 | 0;
     HEAP8[$238 >> 0] = $237;
     continue label$14;
    };
   }
   label$15 : {
    if ($33($8_1 + 48 | 0 | 0) | 0) {
     break label$15
    }
    HEAP32[($8_1 + 108 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($8_1 + 108 | 0) >> 2] = HEAP32[($8_1 + 100 | 0) >> 2] | 0;
  }
  $247 = HEAP32[($8_1 + 108 | 0) >> 2] | 0;
  label$16 : {
   $251 = $8_1 + 256 | 0;
   if ($251 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $251;
  }
  return $247 | 0;
 }
 
 function $29() {
  return 0 | 0;
 }
 
 function $30($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0;
  $4_1 = global$0 - 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 8 | 0) >> 2] = $1_1;
  HEAP32[($4_1 + 4 | 0) >> 2] = 31;
  return ((HEAP32[(HEAP32[($4_1 + 12 | 0) >> 2] | 0) >> 2] | 0) << ((HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) & 31 | 0) | 0) >>> ((32 - (HEAP32[($4_1 + 8 | 0) >> 2] | 0) | 0) & 31 | 0) | 0 | 0;
 }
 
 function $31($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $6_1 = 0;
  $4_1 = global$0 - 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 8 | 0) >> 2] = $1_1;
  $6_1 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  HEAP32[($6_1 + 4 | 0) >> 2] = (HEAP32[($6_1 + 4 | 0) >> 2] | 0) + (HEAP32[($4_1 + 8 | 0) >> 2] | 0) | 0;
  return;
 }
 
 function $32() {
  return 1 | 0;
 }
 
 function $33($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $14_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $14_1 = 0;
  label$1 : {
   if (!((HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0 | 0) == (HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 12 | 0) >> 2] | 0 | 0) & 1 | 0)) {
    break label$1
   }
   $14_1 = (HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0 | 0) == (32 | 0);
  }
  return $14_1 & 1 | 0 | 0;
 }
 
 function $34($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $8_1 = 0, $486 = 0, $175 = 0, $203 = 0, $231 = 0, $259 = 0, $287 = 0, $315 = 0, $343 = 0, $371 = 0, $399 = 0, $427 = 0, $455 = 0, $483 = 0, $489 = 0, $492 = 0, $495 = 0, $498 = 0, $520 = 0, $544 = 0, $568 = 0, $592 = 0, $700 = 0, $726 = 0, $752 = 0, $777 = 0, $819 = 0, $851 = 0, $903 = 0, $929 = 0, $955 = 0, $980 = 0, $1022 = 0, $1054 = 0, $1106 = 0, $1132 = 0, $1158 = 0, $1183 = 0, $1225 = 0, $1257 = 0, $1309 = 0, $1335 = 0, $1361 = 0, $1386 = 0, $1428 = 0, $1460 = 0, $1489 = 0, $1488 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $154_1 = 0, $155_1 = 0, $174 = 0, $182 = 0, $183 = 0, $202 = 0, $210 = 0, $211 = 0, $230 = 0, $238 = 0, $239 = 0, $258 = 0, $266 = 0, $267 = 0, $286 = 0, $294 = 0, $295 = 0, $314 = 0, $322 = 0, $323 = 0, $342 = 0, $350 = 0, $351 = 0, $370 = 0, $378 = 0, $379 = 0, $398 = 0, $406 = 0, $407 = 0, $426 = 0, $434 = 0, $435 = 0, $454 = 0, $462 = 0, $463 = 0, $482 = 0, $499 = 0, $500 = 0, $519 = 0, $523 = 0, $524 = 0, $543 = 0, $547 = 0, $548 = 0, $567 = 0, $571 = 0, $572 = 0, $591 = 0, $600 = 0, $608 = 0, $616 = 0, $624 = 0, $655 = 0, $656 = 0, $657 = 0, $679 = 0, $680 = 0, $699 = 0, $705 = 0, $706 = 0, $725 = 0, $731 = 0, $732 = 0, $751 = 0, $756 = 0, $757 = 0, $776 = 0, $798 = 0, $799 = 0, $818 = 0, $830 = 0, $831 = 0, $850 = 0, $858 = 0, $859 = 0, $860 = 0, $882 = 0, $883 = 0, $902 = 0, $908 = 0, $909 = 0, $928 = 0, $934 = 0, $935 = 0, $954 = 0, $959 = 0, $960 = 0, $979 = 0, $1001 = 0, $1002 = 0, $1021 = 0, $1033 = 0, $1034 = 0, $1053 = 0, $1061 = 0, $1062 = 0, $1063 = 0, $1085 = 0, $1086 = 0, $1105 = 0, $1111 = 0, $1112 = 0, $1131 = 0, $1137 = 0, $1138 = 0, $1157 = 0, $1162 = 0, $1163 = 0, $1182 = 0, $1204 = 0, $1205 = 0, $1224 = 0, $1236 = 0, $1237 = 0, $1256 = 0, $1264 = 0, $1265 = 0, $1266 = 0, $1288 = 0, $1289 = 0, $1308 = 0, $1314 = 0, $1315 = 0, $1334 = 0, $1340 = 0, $1341 = 0, $1360 = 0, $1365 = 0, $1366 = 0, $1385 = 0, $1407 = 0, $1408 = 0, $1427 = 0, $1439 = 0, $1440 = 0, $1459 = 0, $1485 = 0;
  $8_1 = global$0 - 1168 | 0;
  label$1 : {
   $1488 = $8_1;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $1488;
  }
  HEAP32[($8_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($8_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($8_1 + 16 | 0) >> 2] = $2_1;
  HEAP32[($8_1 + 12 | 0) >> 2] = $3_1;
  HEAP32[($8_1 + 8 | 0) >> 2] = $4_1;
  HEAP32[($8_1 + 4 | 0) >> 2] = $5_1;
  $11_1 = HEAP32[($8_1 + 20 | 0) >> 2] | 0;
  $12_1 = HEAP32[($8_1 + 16 | 0) >> 2] | 0;
  $13_1 = HEAP32[($8_1 + 12 | 0) >> 2] | 0;
  $14_1 = HEAP32[($8_1 + 8 | 0) >> 2] | 0;
  HEAP32[($8_1 + 264 | 0) >> 2] = HEAP32[($8_1 + 24 | 0) >> 2] | 0;
  HEAP32[($8_1 + 260 | 0) >> 2] = $11_1;
  HEAP32[($8_1 + 256 | 0) >> 2] = $12_1;
  HEAP32[($8_1 + 252 | 0) >> 2] = $13_1;
  HEAP32[($8_1 + 248 | 0) >> 2] = $14_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($8_1 + 252 | 0) >> 2] | 0) >>> 0 < 10 >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($8_1 + 244 | 0) >> 2] = HEAP32[($8_1 + 256 | 0) >> 2] | 0;
   HEAP32[($8_1 + 240 | 0) >> 2] = HEAP32[($8_1 + 264 | 0) >> 2] | 0;
   HEAP32[($8_1 + 236 | 0) >> 2] = (HEAP32[($8_1 + 240 | 0) >> 2] | 0) + (HEAP32[($8_1 + 260 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 232 | 0) >> 2] = (HEAP32[($8_1 + 236 | 0) >> 2] | 0) + -3 | 0;
   HEAP32[($8_1 + 228 | 0) >> 2] = (HEAP32[($8_1 + 248 | 0) >> 2] | 0) + 4 | 0;
   HEAP32[($8_1 + 224 | 0) >> 2] = HEAP32[($8_1 + 228 | 0) >> 2] | 0;
   HEAP32[($8_1 + 124 | 0) >> 2] = ($35(HEAP32[($8_1 + 244 | 0) >> 2] | 0 | 0) | 0) & 65535 | 0;
   HEAP32[($8_1 + 120 | 0) >> 2] = ($35((HEAP32[($8_1 + 244 | 0) >> 2] | 0) + 2 | 0 | 0) | 0) & 65535 | 0;
   HEAP32[($8_1 + 116 | 0) >> 2] = ($35((HEAP32[($8_1 + 244 | 0) >> 2] | 0) + 4 | 0 | 0) | 0) & 65535 | 0;
   HEAP32[($8_1 + 112 | 0) >> 2] = (HEAP32[($8_1 + 252 | 0) >> 2] | 0) - ((((HEAP32[($8_1 + 124 | 0) >> 2] | 0) + (HEAP32[($8_1 + 120 | 0) >> 2] | 0) | 0) + (HEAP32[($8_1 + 116 | 0) >> 2] | 0) | 0) + 6 | 0) | 0;
   HEAP32[($8_1 + 108 | 0) >> 2] = (HEAP32[($8_1 + 244 | 0) >> 2] | 0) + 6 | 0;
   HEAP32[($8_1 + 104 | 0) >> 2] = (HEAP32[($8_1 + 108 | 0) >> 2] | 0) + (HEAP32[($8_1 + 124 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 100 | 0) >> 2] = (HEAP32[($8_1 + 104 | 0) >> 2] | 0) + (HEAP32[($8_1 + 120 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 96 | 0) >> 2] = (HEAP32[($8_1 + 100 | 0) >> 2] | 0) + (HEAP32[($8_1 + 116 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 92 | 0) >> 2] = ((HEAP32[($8_1 + 260 | 0) >> 2] | 0) + 3 | 0) >>> 2 | 0;
   HEAP32[($8_1 + 88 | 0) >> 2] = (HEAP32[($8_1 + 240 | 0) >> 2] | 0) + (HEAP32[($8_1 + 92 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 84 | 0) >> 2] = (HEAP32[($8_1 + 88 | 0) >> 2] | 0) + (HEAP32[($8_1 + 92 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 80 | 0) >> 2] = (HEAP32[($8_1 + 84 | 0) >> 2] | 0) + (HEAP32[($8_1 + 92 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 76 | 0) >> 2] = HEAP32[($8_1 + 240 | 0) >> 2] | 0;
   HEAP32[($8_1 + 72 | 0) >> 2] = HEAP32[($8_1 + 88 | 0) >> 2] | 0;
   HEAP32[($8_1 + 68 | 0) >> 2] = HEAP32[($8_1 + 84 | 0) >> 2] | 0;
   HEAP32[($8_1 + 64 | 0) >> 2] = HEAP32[($8_1 + 80 | 0) >> 2] | 0;
   $27($8_1 + 56 | 0 | 0, HEAP32[($8_1 + 248 | 0) >> 2] | 0 | 0);
   HEAP32[($8_1 + 52 | 0) >> 2] = (HEAPU8[($8_1 + 58 | 0) >> 0] | 0) & 255 | 0;
   HEAP32[($8_1 + 48 | 0) >> 2] = 1;
   label$5 : {
    if (!((HEAP32[($8_1 + 112 | 0) >> 2] | 0) >>> 0 > (HEAP32[($8_1 + 252 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($8_1 + 44 | 0) >> 2] = $15($8_1 + 200 | 0 | 0, HEAP32[($8_1 + 108 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 124 | 0) >> 2] | 0 | 0) | 0;
   label$6 : {
    if (!($3(HEAP32[($8_1 + 44 | 0) >> 2] | 0 | 0) | 0)) {
     break label$6
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = HEAP32[($8_1 + 44 | 0) >> 2] | 0;
    break label$3;
   }
   HEAP32[($8_1 + 40 | 0) >> 2] = $15($8_1 + 176 | 0 | 0, HEAP32[($8_1 + 104 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 120 | 0) >> 2] | 0 | 0) | 0;
   label$7 : {
    if (!($3(HEAP32[($8_1 + 40 | 0) >> 2] | 0 | 0) | 0)) {
     break label$7
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = HEAP32[($8_1 + 40 | 0) >> 2] | 0;
    break label$3;
   }
   HEAP32[($8_1 + 36 | 0) >> 2] = $15($8_1 + 152 | 0 | 0, HEAP32[($8_1 + 100 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 116 | 0) >> 2] | 0 | 0) | 0;
   label$8 : {
    if (!($3(HEAP32[($8_1 + 36 | 0) >> 2] | 0 | 0) | 0)) {
     break label$8
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = HEAP32[($8_1 + 36 | 0) >> 2] | 0;
    break label$3;
   }
   HEAP32[($8_1 + 32 | 0) >> 2] = $15($8_1 + 128 | 0 | 0, HEAP32[($8_1 + 96 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 112 | 0) >> 2] | 0 | 0) | 0;
   label$9 : {
    if (!($3(HEAP32[($8_1 + 32 | 0) >> 2] | 0 | 0) | 0)) {
     break label$9
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = HEAP32[($8_1 + 32 | 0) >> 2] | 0;
    break label$3;
   }
   label$10 : {
    label$11 : while (1) {
     if (!((HEAP32[($8_1 + 48 | 0) >> 2] | 0) & ((HEAP32[($8_1 + 64 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 232 | 0) >> 2] | 0) >>> 0 & 1 | 0) | 0)) {
      break label$10
     }
     label$12 : {
      if (!($29() | 0)) {
       break label$12
      }
      $154_1 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $155_1 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 288 | 0) >> 2] = $8_1 + 200 | 0;
      HEAP32[($8_1 + 284 | 0) >> 2] = $154_1;
      HEAP32[($8_1 + 280 | 0) >> 2] = $155_1;
      HEAP32[($8_1 + 276 | 0) >> 2] = $30(HEAP32[($8_1 + 288 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 280 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 275 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 284 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 276 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 288 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 284 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 276 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $174 = HEAPU8[($8_1 + 275 | 0) >> 0] | 0;
      $175 = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
      HEAP32[($8_1 + 76 | 0) >> 2] = $175 + 1 | 0;
      HEAP8[$175 >> 0] = $174;
     }
     label$13 : {
      if (!($29() | 0)) {
       break label$13
      }
      $182 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $183 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 308 | 0) >> 2] = $8_1 + 176 | 0;
      HEAP32[($8_1 + 304 | 0) >> 2] = $182;
      HEAP32[($8_1 + 300 | 0) >> 2] = $183;
      HEAP32[($8_1 + 296 | 0) >> 2] = $30(HEAP32[($8_1 + 308 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 300 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 295 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 304 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 296 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 308 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 304 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 296 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $202 = HEAPU8[($8_1 + 295 | 0) >> 0] | 0;
      $203 = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
      HEAP32[($8_1 + 72 | 0) >> 2] = $203 + 1 | 0;
      HEAP8[$203 >> 0] = $202;
     }
     label$14 : {
      if (!($29() | 0)) {
       break label$14
      }
      $210 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $211 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 328 | 0) >> 2] = $8_1 + 152 | 0;
      HEAP32[($8_1 + 324 | 0) >> 2] = $210;
      HEAP32[($8_1 + 320 | 0) >> 2] = $211;
      HEAP32[($8_1 + 316 | 0) >> 2] = $30(HEAP32[($8_1 + 328 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 320 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 315 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 324 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 316 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 328 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 324 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 316 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $230 = HEAPU8[($8_1 + 315 | 0) >> 0] | 0;
      $231 = HEAP32[($8_1 + 68 | 0) >> 2] | 0;
      HEAP32[($8_1 + 68 | 0) >> 2] = $231 + 1 | 0;
      HEAP8[$231 >> 0] = $230;
     }
     label$15 : {
      if (!($29() | 0)) {
       break label$15
      }
      $238 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $239 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 348 | 0) >> 2] = $8_1 + 128 | 0;
      HEAP32[($8_1 + 344 | 0) >> 2] = $238;
      HEAP32[($8_1 + 340 | 0) >> 2] = $239;
      HEAP32[($8_1 + 336 | 0) >> 2] = $30(HEAP32[($8_1 + 348 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 340 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 335 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 344 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 336 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 348 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 344 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 336 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $258 = HEAPU8[($8_1 + 335 | 0) >> 0] | 0;
      $259 = HEAP32[($8_1 + 64 | 0) >> 2] | 0;
      HEAP32[($8_1 + 64 | 0) >> 2] = $259 + 1 | 0;
      HEAP8[$259 >> 0] = $258;
     }
     label$16 : {
      if ($29() | 0) {
       break label$16
      }
     }
     $266 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $267 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 368 | 0) >> 2] = $8_1 + 200 | 0;
     HEAP32[($8_1 + 364 | 0) >> 2] = $266;
     HEAP32[($8_1 + 360 | 0) >> 2] = $267;
     HEAP32[($8_1 + 356 | 0) >> 2] = $30(HEAP32[($8_1 + 368 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 360 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 355 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 364 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 356 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 368 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 364 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 356 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $286 = HEAPU8[($8_1 + 355 | 0) >> 0] | 0;
     $287 = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
     HEAP32[($8_1 + 76 | 0) >> 2] = $287 + 1 | 0;
     HEAP8[$287 >> 0] = $286;
     label$17 : {
      if ($29() | 0) {
       break label$17
      }
     }
     $294 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $295 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 388 | 0) >> 2] = $8_1 + 176 | 0;
     HEAP32[($8_1 + 384 | 0) >> 2] = $294;
     HEAP32[($8_1 + 380 | 0) >> 2] = $295;
     HEAP32[($8_1 + 376 | 0) >> 2] = $30(HEAP32[($8_1 + 388 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 380 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 375 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 384 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 376 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 388 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 384 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 376 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $314 = HEAPU8[($8_1 + 375 | 0) >> 0] | 0;
     $315 = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
     HEAP32[($8_1 + 72 | 0) >> 2] = $315 + 1 | 0;
     HEAP8[$315 >> 0] = $314;
     label$18 : {
      if ($29() | 0) {
       break label$18
      }
     }
     $322 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $323 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 408 | 0) >> 2] = $8_1 + 152 | 0;
     HEAP32[($8_1 + 404 | 0) >> 2] = $322;
     HEAP32[($8_1 + 400 | 0) >> 2] = $323;
     HEAP32[($8_1 + 396 | 0) >> 2] = $30(HEAP32[($8_1 + 408 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 400 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 395 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 404 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 396 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 408 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 404 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 396 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $342 = HEAPU8[($8_1 + 395 | 0) >> 0] | 0;
     $343 = HEAP32[($8_1 + 68 | 0) >> 2] | 0;
     HEAP32[($8_1 + 68 | 0) >> 2] = $343 + 1 | 0;
     HEAP8[$343 >> 0] = $342;
     label$19 : {
      if ($29() | 0) {
       break label$19
      }
     }
     $350 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $351 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 428 | 0) >> 2] = $8_1 + 128 | 0;
     HEAP32[($8_1 + 424 | 0) >> 2] = $350;
     HEAP32[($8_1 + 420 | 0) >> 2] = $351;
     HEAP32[($8_1 + 416 | 0) >> 2] = $30(HEAP32[($8_1 + 428 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 420 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 415 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 424 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 416 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 428 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 424 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 416 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $370 = HEAPU8[($8_1 + 415 | 0) >> 0] | 0;
     $371 = HEAP32[($8_1 + 64 | 0) >> 2] | 0;
     HEAP32[($8_1 + 64 | 0) >> 2] = $371 + 1 | 0;
     HEAP8[$371 >> 0] = $370;
     label$20 : {
      if (!($29() | 0)) {
       break label$20
      }
      $378 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $379 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 448 | 0) >> 2] = $8_1 + 200 | 0;
      HEAP32[($8_1 + 444 | 0) >> 2] = $378;
      HEAP32[($8_1 + 440 | 0) >> 2] = $379;
      HEAP32[($8_1 + 436 | 0) >> 2] = $30(HEAP32[($8_1 + 448 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 440 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 435 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 444 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 436 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 448 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 444 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 436 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $398 = HEAPU8[($8_1 + 435 | 0) >> 0] | 0;
      $399 = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
      HEAP32[($8_1 + 76 | 0) >> 2] = $399 + 1 | 0;
      HEAP8[$399 >> 0] = $398;
     }
     label$21 : {
      if (!($29() | 0)) {
       break label$21
      }
      $406 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $407 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 468 | 0) >> 2] = $8_1 + 176 | 0;
      HEAP32[($8_1 + 464 | 0) >> 2] = $406;
      HEAP32[($8_1 + 460 | 0) >> 2] = $407;
      HEAP32[($8_1 + 456 | 0) >> 2] = $30(HEAP32[($8_1 + 468 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 460 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 455 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 464 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 456 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 468 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 464 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 456 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $426 = HEAPU8[($8_1 + 455 | 0) >> 0] | 0;
      $427 = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
      HEAP32[($8_1 + 72 | 0) >> 2] = $427 + 1 | 0;
      HEAP8[$427 >> 0] = $426;
     }
     label$22 : {
      if (!($29() | 0)) {
       break label$22
      }
      $434 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $435 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 488 | 0) >> 2] = $8_1 + 152 | 0;
      HEAP32[($8_1 + 484 | 0) >> 2] = $434;
      HEAP32[($8_1 + 480 | 0) >> 2] = $435;
      HEAP32[($8_1 + 476 | 0) >> 2] = $30(HEAP32[($8_1 + 488 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 480 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 475 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 484 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 476 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 488 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 484 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 476 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $454 = HEAPU8[($8_1 + 475 | 0) >> 0] | 0;
      $455 = HEAP32[($8_1 + 68 | 0) >> 2] | 0;
      HEAP32[($8_1 + 68 | 0) >> 2] = $455 + 1 | 0;
      HEAP8[$455 >> 0] = $454;
     }
     label$23 : {
      if (!($29() | 0)) {
       break label$23
      }
      $462 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $463 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 508 | 0) >> 2] = $8_1 + 128 | 0;
      HEAP32[($8_1 + 504 | 0) >> 2] = $462;
      HEAP32[($8_1 + 500 | 0) >> 2] = $463;
      HEAP32[($8_1 + 496 | 0) >> 2] = $30(HEAP32[($8_1 + 508 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 500 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 495 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 504 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 496 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 508 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 504 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 496 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $482 = HEAPU8[($8_1 + 495 | 0) >> 0] | 0;
      $483 = HEAP32[($8_1 + 64 | 0) >> 2] | 0;
      HEAP32[($8_1 + 64 | 0) >> 2] = $483 + 1 | 0;
      HEAP8[$483 >> 0] = $482;
     }
     $486 = 0;
     $489 = $8_1 + 128 | 0;
     $492 = $8_1 + 152 | 0;
     $495 = $8_1 + 176 | 0;
     $498 = $8_1 + 200 | 0;
     $499 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $500 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 528 | 0) >> 2] = $498;
     HEAP32[($8_1 + 524 | 0) >> 2] = $499;
     HEAP32[($8_1 + 520 | 0) >> 2] = $500;
     HEAP32[($8_1 + 516 | 0) >> 2] = $30(HEAP32[($8_1 + 528 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 520 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 515 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 524 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 516 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 528 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 524 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 516 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $519 = HEAPU8[($8_1 + 515 | 0) >> 0] | 0;
     $520 = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
     HEAP32[($8_1 + 76 | 0) >> 2] = $520 + 1 | 0;
     HEAP8[$520 >> 0] = $519;
     $523 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $524 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 548 | 0) >> 2] = $495;
     HEAP32[($8_1 + 544 | 0) >> 2] = $523;
     HEAP32[($8_1 + 540 | 0) >> 2] = $524;
     HEAP32[($8_1 + 536 | 0) >> 2] = $30(HEAP32[($8_1 + 548 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 540 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 535 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 544 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 536 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 548 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 544 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 536 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $543 = HEAPU8[($8_1 + 535 | 0) >> 0] | 0;
     $544 = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
     HEAP32[($8_1 + 72 | 0) >> 2] = $544 + 1 | 0;
     HEAP8[$544 >> 0] = $543;
     $547 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $548 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 568 | 0) >> 2] = $492;
     HEAP32[($8_1 + 564 | 0) >> 2] = $547;
     HEAP32[($8_1 + 560 | 0) >> 2] = $548;
     HEAP32[($8_1 + 556 | 0) >> 2] = $30(HEAP32[($8_1 + 568 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 560 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 555 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 564 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 556 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 568 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 564 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 556 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $567 = HEAPU8[($8_1 + 555 | 0) >> 0] | 0;
     $568 = HEAP32[($8_1 + 68 | 0) >> 2] | 0;
     HEAP32[($8_1 + 68 | 0) >> 2] = $568 + 1 | 0;
     HEAP8[$568 >> 0] = $567;
     $571 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $572 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 588 | 0) >> 2] = $489;
     HEAP32[($8_1 + 584 | 0) >> 2] = $571;
     HEAP32[($8_1 + 580 | 0) >> 2] = $572;
     HEAP32[($8_1 + 576 | 0) >> 2] = $30(HEAP32[($8_1 + 588 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 580 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 575 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 584 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 576 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 588 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 584 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 576 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $591 = HEAPU8[($8_1 + 575 | 0) >> 0] | 0;
     $592 = HEAP32[($8_1 + 64 | 0) >> 2] | 0;
     HEAP32[($8_1 + 64 | 0) >> 2] = $592 + 1 | 0;
     HEAP8[$592 >> 0] = $591;
     $600 = ($36($498 | 0) | 0 | 0) == ($486 | 0) & 1 | 0;
     HEAP32[($8_1 + 48 | 0) >> 2] = (HEAP32[($8_1 + 48 | 0) >> 2] | 0) & $600 | 0;
     $608 = ($36($495 | 0) | 0 | 0) == ($486 | 0) & 1 | 0;
     HEAP32[($8_1 + 48 | 0) >> 2] = (HEAP32[($8_1 + 48 | 0) >> 2] | 0) & $608 | 0;
     $616 = ($36($492 | 0) | 0 | 0) == ($486 | 0) & 1 | 0;
     HEAP32[($8_1 + 48 | 0) >> 2] = (HEAP32[($8_1 + 48 | 0) >> 2] | 0) & $616 | 0;
     $624 = ($36($489 | 0) | 0 | 0) == ($486 | 0) & 1 | 0;
     HEAP32[($8_1 + 48 | 0) >> 2] = (HEAP32[($8_1 + 48 | 0) >> 2] | 0) & $624 | 0;
     continue label$11;
    };
   }
   label$24 : {
    if (!((HEAP32[($8_1 + 76 | 0) >> 2] | 0) >>> 0 > (HEAP32[($8_1 + 88 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$24
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   label$25 : {
    if (!((HEAP32[($8_1 + 72 | 0) >> 2] | 0) >>> 0 > (HEAP32[($8_1 + 84 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$25
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   label$26 : {
    if (!((HEAP32[($8_1 + 68 | 0) >> 2] | 0) >>> 0 > (HEAP32[($8_1 + 80 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$26
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   $655 = HEAP32[($8_1 + 88 | 0) >> 2] | 0;
   $656 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
   $657 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
   HEAP32[($8_1 + 612 | 0) >> 2] = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
   HEAP32[($8_1 + 608 | 0) >> 2] = $8_1 + 200 | 0;
   HEAP32[($8_1 + 604 | 0) >> 2] = $655;
   HEAP32[($8_1 + 600 | 0) >> 2] = $656;
   HEAP32[($8_1 + 596 | 0) >> 2] = $657;
   HEAP32[($8_1 + 592 | 0) >> 2] = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
   label$27 : {
    label$28 : while (1) {
     if (!((($17(HEAP32[($8_1 + 608 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 612 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($8_1 + 604 | 0) >> 2] | 0) + -3 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$27
     }
     label$29 : {
      if (!($29() | 0)) {
       break label$29
      }
      $679 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
      $680 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
      HEAP32[($8_1 + 632 | 0) >> 2] = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
      HEAP32[($8_1 + 628 | 0) >> 2] = $679;
      HEAP32[($8_1 + 624 | 0) >> 2] = $680;
      HEAP32[($8_1 + 620 | 0) >> 2] = $30(HEAP32[($8_1 + 632 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 624 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 619 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 628 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 620 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 632 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 628 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 620 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $699 = HEAPU8[($8_1 + 619 | 0) >> 0] | 0;
      $700 = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
      HEAP32[($8_1 + 612 | 0) >> 2] = $700 + 1 | 0;
      HEAP8[$700 >> 0] = $699;
     }
     label$30 : {
      if ($29() | 0) {
       break label$30
      }
     }
     $705 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
     $706 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
     HEAP32[($8_1 + 652 | 0) >> 2] = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
     HEAP32[($8_1 + 648 | 0) >> 2] = $705;
     HEAP32[($8_1 + 644 | 0) >> 2] = $706;
     HEAP32[($8_1 + 640 | 0) >> 2] = $30(HEAP32[($8_1 + 652 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 644 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 639 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 648 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 640 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 652 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 648 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 640 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $725 = HEAPU8[($8_1 + 639 | 0) >> 0] | 0;
     $726 = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
     HEAP32[($8_1 + 612 | 0) >> 2] = $726 + 1 | 0;
     HEAP8[$726 >> 0] = $725;
     label$31 : {
      if (!($29() | 0)) {
       break label$31
      }
      $731 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
      $732 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
      HEAP32[($8_1 + 672 | 0) >> 2] = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
      HEAP32[($8_1 + 668 | 0) >> 2] = $731;
      HEAP32[($8_1 + 664 | 0) >> 2] = $732;
      HEAP32[($8_1 + 660 | 0) >> 2] = $30(HEAP32[($8_1 + 672 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 664 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 659 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 668 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 660 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 672 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 668 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 660 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $751 = HEAPU8[($8_1 + 659 | 0) >> 0] | 0;
      $752 = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
      HEAP32[($8_1 + 612 | 0) >> 2] = $752 + 1 | 0;
      HEAP8[$752 >> 0] = $751;
     }
     $756 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
     $757 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
     HEAP32[($8_1 + 692 | 0) >> 2] = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
     HEAP32[($8_1 + 688 | 0) >> 2] = $756;
     HEAP32[($8_1 + 684 | 0) >> 2] = $757;
     HEAP32[($8_1 + 680 | 0) >> 2] = $30(HEAP32[($8_1 + 692 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 684 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 679 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 688 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 680 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 692 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 688 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 680 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $776 = HEAPU8[($8_1 + 679 | 0) >> 0] | 0;
     $777 = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
     HEAP32[($8_1 + 612 | 0) >> 2] = $777 + 1 | 0;
     HEAP8[$777 >> 0] = $776;
     continue label$28;
    };
   }
   label$32 : {
    if (!($32() | 0)) {
     break label$32
    }
    label$33 : {
     label$34 : while (1) {
      if (!((($17(HEAP32[($8_1 + 608 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 612 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 604 | 0) >> 2] | 0) >>> 0 & 1 | 0) | 0)) {
       break label$33
      }
      $798 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
      $799 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
      HEAP32[($8_1 + 712 | 0) >> 2] = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
      HEAP32[($8_1 + 708 | 0) >> 2] = $798;
      HEAP32[($8_1 + 704 | 0) >> 2] = $799;
      HEAP32[($8_1 + 700 | 0) >> 2] = $30(HEAP32[($8_1 + 712 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 704 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 699 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 708 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 700 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 712 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 708 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 700 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $818 = HEAPU8[($8_1 + 699 | 0) >> 0] | 0;
      $819 = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
      HEAP32[($8_1 + 612 | 0) >> 2] = $819 + 1 | 0;
      HEAP8[$819 >> 0] = $818;
      continue label$34;
     };
    }
   }
   label$35 : {
    label$36 : while (1) {
     if (!((HEAP32[($8_1 + 612 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 604 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$35
     }
     $830 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
     $831 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
     HEAP32[($8_1 + 732 | 0) >> 2] = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
     HEAP32[($8_1 + 728 | 0) >> 2] = $830;
     HEAP32[($8_1 + 724 | 0) >> 2] = $831;
     HEAP32[($8_1 + 720 | 0) >> 2] = $30(HEAP32[($8_1 + 732 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 724 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 719 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 728 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 720 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 732 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 728 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 720 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $850 = HEAPU8[($8_1 + 719 | 0) >> 0] | 0;
     $851 = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
     HEAP32[($8_1 + 612 | 0) >> 2] = $851 + 1 | 0;
     HEAP8[$851 >> 0] = $850;
     continue label$36;
    };
   }
   $858 = HEAP32[($8_1 + 84 | 0) >> 2] | 0;
   $859 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
   $860 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
   HEAP32[($8_1 + 756 | 0) >> 2] = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
   HEAP32[($8_1 + 752 | 0) >> 2] = $8_1 + 176 | 0;
   HEAP32[($8_1 + 748 | 0) >> 2] = $858;
   HEAP32[($8_1 + 744 | 0) >> 2] = $859;
   HEAP32[($8_1 + 740 | 0) >> 2] = $860;
   HEAP32[($8_1 + 736 | 0) >> 2] = HEAP32[($8_1 + 756 | 0) >> 2] | 0;
   label$37 : {
    label$38 : while (1) {
     if (!((($17(HEAP32[($8_1 + 752 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 756 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($8_1 + 748 | 0) >> 2] | 0) + -3 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$37
     }
     label$39 : {
      if (!($29() | 0)) {
       break label$39
      }
      $882 = HEAP32[($8_1 + 744 | 0) >> 2] | 0;
      $883 = HEAP32[($8_1 + 740 | 0) >> 2] | 0;
      HEAP32[($8_1 + 776 | 0) >> 2] = HEAP32[($8_1 + 752 | 0) >> 2] | 0;
      HEAP32[($8_1 + 772 | 0) >> 2] = $882;
      HEAP32[($8_1 + 768 | 0) >> 2] = $883;
      HEAP32[($8_1 + 764 | 0) >> 2] = $30(HEAP32[($8_1 + 776 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 768 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 763 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 772 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 764 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 776 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 772 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 764 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $902 = HEAPU8[($8_1 + 763 | 0) >> 0] | 0;
      $903 = HEAP32[($8_1 + 756 | 0) >> 2] | 0;
      HEAP32[($8_1 + 756 | 0) >> 2] = $903 + 1 | 0;
      HEAP8[$903 >> 0] = $902;
     }
     label$40 : {
      if ($29() | 0) {
       break label$40
      }
     }
     $908 = HEAP32[($8_1 + 744 | 0) >> 2] | 0;
     $909 = HEAP32[($8_1 + 740 | 0) >> 2] | 0;
     HEAP32[($8_1 + 796 | 0) >> 2] = HEAP32[($8_1 + 752 | 0) >> 2] | 0;
     HEAP32[($8_1 + 792 | 0) >> 2] = $908;
     HEAP32[($8_1 + 788 | 0) >> 2] = $909;
     HEAP32[($8_1 + 784 | 0) >> 2] = $30(HEAP32[($8_1 + 796 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 788 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 783 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 792 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 784 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 796 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 792 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 784 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $928 = HEAPU8[($8_1 + 783 | 0) >> 0] | 0;
     $929 = HEAP32[($8_1 + 756 | 0) >> 2] | 0;
     HEAP32[($8_1 + 756 | 0) >> 2] = $929 + 1 | 0;
     HEAP8[$929 >> 0] = $928;
     label$41 : {
      if (!($29() | 0)) {
       break label$41
      }
      $934 = HEAP32[($8_1 + 744 | 0) >> 2] | 0;
      $935 = HEAP32[($8_1 + 740 | 0) >> 2] | 0;
      HEAP32[($8_1 + 816 | 0) >> 2] = HEAP32[($8_1 + 752 | 0) >> 2] | 0;
      HEAP32[($8_1 + 812 | 0) >> 2] = $934;
      HEAP32[($8_1 + 808 | 0) >> 2] = $935;
      HEAP32[($8_1 + 804 | 0) >> 2] = $30(HEAP32[($8_1 + 816 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 808 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 803 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 812 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 804 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 816 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 812 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 804 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $954 = HEAPU8[($8_1 + 803 | 0) >> 0] | 0;
      $955 = HEAP32[($8_1 + 756 | 0) >> 2] | 0;
      HEAP32[($8_1 + 756 | 0) >> 2] = $955 + 1 | 0;
      HEAP8[$955 >> 0] = $954;
     }
     $959 = HEAP32[($8_1 + 744 | 0) >> 2] | 0;
     $960 = HEAP32[($8_1 + 740 | 0) >> 2] | 0;
     HEAP32[($8_1 + 836 | 0) >> 2] = HEAP32[($8_1 + 752 | 0) >> 2] | 0;
     HEAP32[($8_1 + 832 | 0) >> 2] = $959;
     HEAP32[($8_1 + 828 | 0) >> 2] = $960;
     HEAP32[($8_1 + 824 | 0) >> 2] = $30(HEAP32[($8_1 + 836 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 828 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 823 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 832 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 824 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 836 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 832 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 824 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $979 = HEAPU8[($8_1 + 823 | 0) >> 0] | 0;
     $980 = HEAP32[($8_1 + 756 | 0) >> 2] | 0;
     HEAP32[($8_1 + 756 | 0) >> 2] = $980 + 1 | 0;
     HEAP8[$980 >> 0] = $979;
     continue label$38;
    };
   }
   label$42 : {
    if (!($32() | 0)) {
     break label$42
    }
    label$43 : {
     label$44 : while (1) {
      if (!((($17(HEAP32[($8_1 + 752 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 756 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 748 | 0) >> 2] | 0) >>> 0 & 1 | 0) | 0)) {
       break label$43
      }
      $1001 = HEAP32[($8_1 + 744 | 0) >> 2] | 0;
      $1002 = HEAP32[($8_1 + 740 | 0) >> 2] | 0;
      HEAP32[($8_1 + 856 | 0) >> 2] = HEAP32[($8_1 + 752 | 0) >> 2] | 0;
      HEAP32[($8_1 + 852 | 0) >> 2] = $1001;
      HEAP32[($8_1 + 848 | 0) >> 2] = $1002;
      HEAP32[($8_1 + 844 | 0) >> 2] = $30(HEAP32[($8_1 + 856 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 848 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 843 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 852 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 844 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 856 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 852 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 844 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $1021 = HEAPU8[($8_1 + 843 | 0) >> 0] | 0;
      $1022 = HEAP32[($8_1 + 756 | 0) >> 2] | 0;
      HEAP32[($8_1 + 756 | 0) >> 2] = $1022 + 1 | 0;
      HEAP8[$1022 >> 0] = $1021;
      continue label$44;
     };
    }
   }
   label$45 : {
    label$46 : while (1) {
     if (!((HEAP32[($8_1 + 756 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 748 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$45
     }
     $1033 = HEAP32[($8_1 + 744 | 0) >> 2] | 0;
     $1034 = HEAP32[($8_1 + 740 | 0) >> 2] | 0;
     HEAP32[($8_1 + 876 | 0) >> 2] = HEAP32[($8_1 + 752 | 0) >> 2] | 0;
     HEAP32[($8_1 + 872 | 0) >> 2] = $1033;
     HEAP32[($8_1 + 868 | 0) >> 2] = $1034;
     HEAP32[($8_1 + 864 | 0) >> 2] = $30(HEAP32[($8_1 + 876 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 868 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 863 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 872 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 864 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 876 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 872 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 864 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $1053 = HEAPU8[($8_1 + 863 | 0) >> 0] | 0;
     $1054 = HEAP32[($8_1 + 756 | 0) >> 2] | 0;
     HEAP32[($8_1 + 756 | 0) >> 2] = $1054 + 1 | 0;
     HEAP8[$1054 >> 0] = $1053;
     continue label$46;
    };
   }
   $1061 = HEAP32[($8_1 + 80 | 0) >> 2] | 0;
   $1062 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
   $1063 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
   HEAP32[($8_1 + 900 | 0) >> 2] = HEAP32[($8_1 + 68 | 0) >> 2] | 0;
   HEAP32[($8_1 + 896 | 0) >> 2] = $8_1 + 152 | 0;
   HEAP32[($8_1 + 892 | 0) >> 2] = $1061;
   HEAP32[($8_1 + 888 | 0) >> 2] = $1062;
   HEAP32[($8_1 + 884 | 0) >> 2] = $1063;
   HEAP32[($8_1 + 880 | 0) >> 2] = HEAP32[($8_1 + 900 | 0) >> 2] | 0;
   label$47 : {
    label$48 : while (1) {
     if (!((($17(HEAP32[($8_1 + 896 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 900 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($8_1 + 892 | 0) >> 2] | 0) + -3 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$47
     }
     label$49 : {
      if (!($29() | 0)) {
       break label$49
      }
      $1085 = HEAP32[($8_1 + 888 | 0) >> 2] | 0;
      $1086 = HEAP32[($8_1 + 884 | 0) >> 2] | 0;
      HEAP32[($8_1 + 920 | 0) >> 2] = HEAP32[($8_1 + 896 | 0) >> 2] | 0;
      HEAP32[($8_1 + 916 | 0) >> 2] = $1085;
      HEAP32[($8_1 + 912 | 0) >> 2] = $1086;
      HEAP32[($8_1 + 908 | 0) >> 2] = $30(HEAP32[($8_1 + 920 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 912 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 907 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 916 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 908 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 920 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 916 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 908 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $1105 = HEAPU8[($8_1 + 907 | 0) >> 0] | 0;
      $1106 = HEAP32[($8_1 + 900 | 0) >> 2] | 0;
      HEAP32[($8_1 + 900 | 0) >> 2] = $1106 + 1 | 0;
      HEAP8[$1106 >> 0] = $1105;
     }
     label$50 : {
      if ($29() | 0) {
       break label$50
      }
     }
     $1111 = HEAP32[($8_1 + 888 | 0) >> 2] | 0;
     $1112 = HEAP32[($8_1 + 884 | 0) >> 2] | 0;
     HEAP32[($8_1 + 940 | 0) >> 2] = HEAP32[($8_1 + 896 | 0) >> 2] | 0;
     HEAP32[($8_1 + 936 | 0) >> 2] = $1111;
     HEAP32[($8_1 + 932 | 0) >> 2] = $1112;
     HEAP32[($8_1 + 928 | 0) >> 2] = $30(HEAP32[($8_1 + 940 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 932 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 927 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 936 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 928 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 940 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 936 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 928 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $1131 = HEAPU8[($8_1 + 927 | 0) >> 0] | 0;
     $1132 = HEAP32[($8_1 + 900 | 0) >> 2] | 0;
     HEAP32[($8_1 + 900 | 0) >> 2] = $1132 + 1 | 0;
     HEAP8[$1132 >> 0] = $1131;
     label$51 : {
      if (!($29() | 0)) {
       break label$51
      }
      $1137 = HEAP32[($8_1 + 888 | 0) >> 2] | 0;
      $1138 = HEAP32[($8_1 + 884 | 0) >> 2] | 0;
      HEAP32[($8_1 + 960 | 0) >> 2] = HEAP32[($8_1 + 896 | 0) >> 2] | 0;
      HEAP32[($8_1 + 956 | 0) >> 2] = $1137;
      HEAP32[($8_1 + 952 | 0) >> 2] = $1138;
      HEAP32[($8_1 + 948 | 0) >> 2] = $30(HEAP32[($8_1 + 960 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 952 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 947 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 956 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 948 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 960 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 956 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 948 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $1157 = HEAPU8[($8_1 + 947 | 0) >> 0] | 0;
      $1158 = HEAP32[($8_1 + 900 | 0) >> 2] | 0;
      HEAP32[($8_1 + 900 | 0) >> 2] = $1158 + 1 | 0;
      HEAP8[$1158 >> 0] = $1157;
     }
     $1162 = HEAP32[($8_1 + 888 | 0) >> 2] | 0;
     $1163 = HEAP32[($8_1 + 884 | 0) >> 2] | 0;
     HEAP32[($8_1 + 980 | 0) >> 2] = HEAP32[($8_1 + 896 | 0) >> 2] | 0;
     HEAP32[($8_1 + 976 | 0) >> 2] = $1162;
     HEAP32[($8_1 + 972 | 0) >> 2] = $1163;
     HEAP32[($8_1 + 968 | 0) >> 2] = $30(HEAP32[($8_1 + 980 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 972 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 967 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 976 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 968 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 980 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 976 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 968 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $1182 = HEAPU8[($8_1 + 967 | 0) >> 0] | 0;
     $1183 = HEAP32[($8_1 + 900 | 0) >> 2] | 0;
     HEAP32[($8_1 + 900 | 0) >> 2] = $1183 + 1 | 0;
     HEAP8[$1183 >> 0] = $1182;
     continue label$48;
    };
   }
   label$52 : {
    if (!($32() | 0)) {
     break label$52
    }
    label$53 : {
     label$54 : while (1) {
      if (!((($17(HEAP32[($8_1 + 896 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 900 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 892 | 0) >> 2] | 0) >>> 0 & 1 | 0) | 0)) {
       break label$53
      }
      $1204 = HEAP32[($8_1 + 888 | 0) >> 2] | 0;
      $1205 = HEAP32[($8_1 + 884 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1e3 | 0) >> 2] = HEAP32[($8_1 + 896 | 0) >> 2] | 0;
      HEAP32[($8_1 + 996 | 0) >> 2] = $1204;
      HEAP32[($8_1 + 992 | 0) >> 2] = $1205;
      HEAP32[($8_1 + 988 | 0) >> 2] = $30(HEAP32[($8_1 + 1e3 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 992 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 987 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 996 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 988 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 1e3 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 996 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 988 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $1224 = HEAPU8[($8_1 + 987 | 0) >> 0] | 0;
      $1225 = HEAP32[($8_1 + 900 | 0) >> 2] | 0;
      HEAP32[($8_1 + 900 | 0) >> 2] = $1225 + 1 | 0;
      HEAP8[$1225 >> 0] = $1224;
      continue label$54;
     };
    }
   }
   label$55 : {
    label$56 : while (1) {
     if (!((HEAP32[($8_1 + 900 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 892 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$55
     }
     $1236 = HEAP32[($8_1 + 888 | 0) >> 2] | 0;
     $1237 = HEAP32[($8_1 + 884 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1020 | 0) >> 2] = HEAP32[($8_1 + 896 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1016 | 0) >> 2] = $1236;
     HEAP32[($8_1 + 1012 | 0) >> 2] = $1237;
     HEAP32[($8_1 + 1008 | 0) >> 2] = $30(HEAP32[($8_1 + 1020 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1012 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 1007 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 1016 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1008 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 1020 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1016 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1008 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $1256 = HEAPU8[($8_1 + 1007 | 0) >> 0] | 0;
     $1257 = HEAP32[($8_1 + 900 | 0) >> 2] | 0;
     HEAP32[($8_1 + 900 | 0) >> 2] = $1257 + 1 | 0;
     HEAP8[$1257 >> 0] = $1256;
     continue label$56;
    };
   }
   $1264 = HEAP32[($8_1 + 236 | 0) >> 2] | 0;
   $1265 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
   $1266 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
   HEAP32[($8_1 + 1044 | 0) >> 2] = HEAP32[($8_1 + 64 | 0) >> 2] | 0;
   HEAP32[($8_1 + 1040 | 0) >> 2] = $8_1 + 128 | 0;
   HEAP32[($8_1 + 1036 | 0) >> 2] = $1264;
   HEAP32[($8_1 + 1032 | 0) >> 2] = $1265;
   HEAP32[($8_1 + 1028 | 0) >> 2] = $1266;
   HEAP32[($8_1 + 1024 | 0) >> 2] = HEAP32[($8_1 + 1044 | 0) >> 2] | 0;
   label$57 : {
    label$58 : while (1) {
     if (!((($17(HEAP32[($8_1 + 1040 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 1044 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($8_1 + 1036 | 0) >> 2] | 0) + -3 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$57
     }
     label$59 : {
      if (!($29() | 0)) {
       break label$59
      }
      $1288 = HEAP32[($8_1 + 1032 | 0) >> 2] | 0;
      $1289 = HEAP32[($8_1 + 1028 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1064 | 0) >> 2] = HEAP32[($8_1 + 1040 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1060 | 0) >> 2] = $1288;
      HEAP32[($8_1 + 1056 | 0) >> 2] = $1289;
      HEAP32[($8_1 + 1052 | 0) >> 2] = $30(HEAP32[($8_1 + 1064 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1056 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 1051 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 1060 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1052 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 1064 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1060 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1052 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $1308 = HEAPU8[($8_1 + 1051 | 0) >> 0] | 0;
      $1309 = HEAP32[($8_1 + 1044 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1044 | 0) >> 2] = $1309 + 1 | 0;
      HEAP8[$1309 >> 0] = $1308;
     }
     label$60 : {
      if ($29() | 0) {
       break label$60
      }
     }
     $1314 = HEAP32[($8_1 + 1032 | 0) >> 2] | 0;
     $1315 = HEAP32[($8_1 + 1028 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1084 | 0) >> 2] = HEAP32[($8_1 + 1040 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1080 | 0) >> 2] = $1314;
     HEAP32[($8_1 + 1076 | 0) >> 2] = $1315;
     HEAP32[($8_1 + 1072 | 0) >> 2] = $30(HEAP32[($8_1 + 1084 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1076 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 1071 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 1080 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1072 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 1084 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1080 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1072 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $1334 = HEAPU8[($8_1 + 1071 | 0) >> 0] | 0;
     $1335 = HEAP32[($8_1 + 1044 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1044 | 0) >> 2] = $1335 + 1 | 0;
     HEAP8[$1335 >> 0] = $1334;
     label$61 : {
      if (!($29() | 0)) {
       break label$61
      }
      $1340 = HEAP32[($8_1 + 1032 | 0) >> 2] | 0;
      $1341 = HEAP32[($8_1 + 1028 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1104 | 0) >> 2] = HEAP32[($8_1 + 1040 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1100 | 0) >> 2] = $1340;
      HEAP32[($8_1 + 1096 | 0) >> 2] = $1341;
      HEAP32[($8_1 + 1092 | 0) >> 2] = $30(HEAP32[($8_1 + 1104 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1096 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 1091 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 1100 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1092 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 1104 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1100 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1092 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $1360 = HEAPU8[($8_1 + 1091 | 0) >> 0] | 0;
      $1361 = HEAP32[($8_1 + 1044 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1044 | 0) >> 2] = $1361 + 1 | 0;
      HEAP8[$1361 >> 0] = $1360;
     }
     $1365 = HEAP32[($8_1 + 1032 | 0) >> 2] | 0;
     $1366 = HEAP32[($8_1 + 1028 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1124 | 0) >> 2] = HEAP32[($8_1 + 1040 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1120 | 0) >> 2] = $1365;
     HEAP32[($8_1 + 1116 | 0) >> 2] = $1366;
     HEAP32[($8_1 + 1112 | 0) >> 2] = $30(HEAP32[($8_1 + 1124 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1116 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 1111 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 1120 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1112 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 1124 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1120 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1112 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $1385 = HEAPU8[($8_1 + 1111 | 0) >> 0] | 0;
     $1386 = HEAP32[($8_1 + 1044 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1044 | 0) >> 2] = $1386 + 1 | 0;
     HEAP8[$1386 >> 0] = $1385;
     continue label$58;
    };
   }
   label$62 : {
    if (!($32() | 0)) {
     break label$62
    }
    label$63 : {
     label$64 : while (1) {
      if (!((($17(HEAP32[($8_1 + 1040 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 1044 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 1036 | 0) >> 2] | 0) >>> 0 & 1 | 0) | 0)) {
       break label$63
      }
      $1407 = HEAP32[($8_1 + 1032 | 0) >> 2] | 0;
      $1408 = HEAP32[($8_1 + 1028 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1144 | 0) >> 2] = HEAP32[($8_1 + 1040 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1140 | 0) >> 2] = $1407;
      HEAP32[($8_1 + 1136 | 0) >> 2] = $1408;
      HEAP32[($8_1 + 1132 | 0) >> 2] = $30(HEAP32[($8_1 + 1144 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1136 | 0) >> 2] | 0 | 0) | 0;
      HEAP8[($8_1 + 1131 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 1140 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1132 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
      $31(HEAP32[($8_1 + 1144 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1140 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1132 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
      $1427 = HEAPU8[($8_1 + 1131 | 0) >> 0] | 0;
      $1428 = HEAP32[($8_1 + 1044 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1044 | 0) >> 2] = $1428 + 1 | 0;
      HEAP8[$1428 >> 0] = $1427;
      continue label$64;
     };
    }
   }
   label$65 : {
    label$66 : while (1) {
     if (!((HEAP32[($8_1 + 1044 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 1036 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$65
     }
     $1439 = HEAP32[($8_1 + 1032 | 0) >> 2] | 0;
     $1440 = HEAP32[($8_1 + 1028 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1164 | 0) >> 2] = HEAP32[($8_1 + 1040 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1160 | 0) >> 2] = $1439;
     HEAP32[($8_1 + 1156 | 0) >> 2] = $1440;
     HEAP32[($8_1 + 1152 | 0) >> 2] = $30(HEAP32[($8_1 + 1164 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1156 | 0) >> 2] | 0 | 0) | 0;
     HEAP8[($8_1 + 1151 | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 1160 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1152 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0;
     $31(HEAP32[($8_1 + 1164 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1160 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1152 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0 | 0);
     $1459 = HEAPU8[($8_1 + 1151 | 0) >> 0] | 0;
     $1460 = HEAP32[($8_1 + 1044 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1044 | 0) >> 2] = $1460 + 1 | 0;
     HEAP8[$1460 >> 0] = $1459;
     continue label$66;
    };
   }
   HEAP32[($8_1 + 28 | 0) >> 2] = ((($33($8_1 + 200 | 0 | 0) | 0) & ($33($8_1 + 176 | 0 | 0) | 0) | 0) & ($33($8_1 + 152 | 0 | 0) | 0) | 0) & ($33($8_1 + 128 | 0 | 0) | 0) | 0;
   label$67 : {
    if (HEAP32[($8_1 + 28 | 0) >> 2] | 0) {
     break label$67
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($8_1 + 268 | 0) >> 2] = HEAP32[($8_1 + 260 | 0) >> 2] | 0;
  }
  $1485 = HEAP32[($8_1 + 268 | 0) >> 2] | 0;
  label$68 : {
   $1489 = $8_1 + 1168 | 0;
   if ($1489 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $1489;
  }
  return $1485 | 0;
 }
 
 function $35($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $25_1 = 0, $24_1 = 0, $21_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $24_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $24_1;
  }
  HEAP32[($3_1 + 8 | 0) >> 2] = $0_1;
  label$3 : {
   label$4 : {
    if (!($7() | 0)) {
     break label$4
    }
    HEAP16[($3_1 + 14 | 0) >> 1] = $64(HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) | 0;
    break label$3;
   }
   HEAP32[($3_1 + 4 | 0) >> 2] = HEAP32[($3_1 + 8 | 0) >> 2] | 0;
   HEAP16[($3_1 + 14 | 0) >> 1] = ((HEAPU8[(HEAP32[($3_1 + 4 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0) + (((HEAPU8[((HEAP32[($3_1 + 4 | 0) >> 2] | 0) + 1 | 0) >> 0] | 0) & 255 | 0) << 8 | 0) | 0;
  }
  $21_1 = (HEAPU16[($3_1 + 14 | 0) >> 1] | 0) & 65535 | 0;
  label$5 : {
   $25_1 = $3_1 + 16 | 0;
   if ($25_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $25_1;
  }
  return $21_1 | 0;
 }
 
 function $36($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $14_1 = 0, $19_1 = 0, $23_1 = 0, $35_1 = 0, $34_1 = 0, $29_1 = 0, $31_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $34_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $34_1;
  }
  HEAP32[($3_1 + 8 | 0) >> 2] = $0_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0) >>> 0 < (HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 16 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($3_1 + 12 | 0) >> 2] = 3;
    break label$3;
   }
   $14_1 = 0;
   $19_1 = HEAP32[($3_1 + 8 | 0) >> 2] | 0;
   HEAP32[($19_1 + 8 | 0) >> 2] = (HEAP32[($19_1 + 8 | 0) >> 2] | 0) + ($14_1 - ((HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 3 | 0) | 0) | 0;
   $23_1 = HEAP32[($3_1 + 8 | 0) >> 2] | 0;
   HEAP32[($23_1 + 4 | 0) >> 2] = (HEAP32[($23_1 + 4 | 0) >> 2] | 0) & 7 | 0;
   $29_1 = $132(HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0 | 0) | 0;
   HEAP32[(HEAP32[($3_1 + 8 | 0) >> 2] | 0) >> 2] = $29_1;
   HEAP32[($3_1 + 12 | 0) >> 2] = $14_1;
  }
  $31_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  label$5 : {
   $35_1 = $3_1 + 16 | 0;
   if ($35_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $35_1;
  }
  return $31_1 | 0;
 }
 
 function $37($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, $46_1 = 0, $45_1 = 0, $42_1 = 0;
  $10_1 = global$0 - 48 | 0;
  label$1 : {
   $45_1 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $45_1;
  }
  HEAP32[($10_1 + 40 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 36 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 32 | 0) >> 2] = $2_1;
  HEAP32[($10_1 + 28 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 24 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 20 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 16 | 0) >> 2] = $6_1;
  HEAP32[($10_1 + 12 | 0) >> 2] = $7_1;
  HEAP32[($10_1 + 8 | 0) >> 2] = HEAP32[($10_1 + 28 | 0) >> 2] | 0;
  HEAP32[($10_1 + 4 | 0) >> 2] = $26(HEAP32[($10_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   label$4 : {
    if (!($3(HEAP32[($10_1 + 4 | 0) >> 2] | 0 | 0) | 0)) {
     break label$4
    }
    HEAP32[($10_1 + 44 | 0) >> 2] = HEAP32[($10_1 + 4 | 0) >> 2] | 0;
    break label$3;
   }
   label$5 : {
    if (!((HEAP32[($10_1 + 4 | 0) >> 2] | 0) >>> 0 >= (HEAP32[($10_1 + 24 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($10_1 + 44 | 0) >> 2] = -72;
    break label$3;
   }
   HEAP32[($10_1 + 8 | 0) >> 2] = (HEAP32[($10_1 + 8 | 0) >> 2] | 0) + (HEAP32[($10_1 + 4 | 0) >> 2] | 0) | 0;
   HEAP32[($10_1 + 24 | 0) >> 2] = (HEAP32[($10_1 + 24 | 0) >> 2] | 0) - (HEAP32[($10_1 + 4 | 0) >> 2] | 0) | 0;
   HEAP32[($10_1 + 44 | 0) >> 2] = $34(HEAP32[($10_1 + 36 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 32 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 8 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0) | 0;
  }
  $42_1 = HEAP32[($10_1 + 44 | 0) >> 2] | 0;
  label$6 : {
   $46_1 = $10_1 + 48 | 0;
   if ($46_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $46_1;
  }
  return $42_1 | 0;
 }
 
 function $38($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $7_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $171 = 0, $172 = 0, $191 = 0, $303 = 0, $302 = 0, $299 = 0;
  $7_1 = global$0 - 160 | 0;
  label$1 : {
   $302 = $7_1;
   if ($7_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $302;
  }
  HEAP32[($7_1 + 152 | 0) >> 2] = $0_1;
  HEAP32[($7_1 + 148 | 0) >> 2] = $1_1;
  HEAP32[($7_1 + 144 | 0) >> 2] = $2_1;
  HEAP32[($7_1 + 140 | 0) >> 2] = $3_1;
  HEAP32[($7_1 + 136 | 0) >> 2] = $4_1;
  $27($7_1 + 112 | 0 | 0, HEAP32[($7_1 + 152 | 0) >> 2] | 0 | 0);
  HEAP32[($7_1 + 108 | 0) >> 2] = (HEAPU8[($7_1 + 112 | 0) >> 0] | 0) & 255 | 0;
  HEAP32[($7_1 + 100 | 0) >> 2] = (HEAP32[($7_1 + 152 | 0) >> 2] | 0) + 4 | 0;
  HEAP32[($7_1 + 96 | 0) >> 2] = HEAP32[($7_1 + 100 | 0) >> 2] | 0;
  HEAP32[($7_1 + 68 | 0) >> 2] = 0;
  HEAP32[($7_1 + 88 | 0) >> 2] = (HEAP32[($7_1 + 140 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 68 | 0) >> 2] | 0) << 2 | 0) | 0;
  HEAP32[($7_1 + 68 | 0) >> 2] = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + 156 | 0;
  HEAP32[($7_1 + 84 | 0) >> 2] = (HEAP32[($7_1 + 140 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 68 | 0) >> 2] | 0) << 2 | 0) | 0;
  HEAP32[($7_1 + 68 | 0) >> 2] = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + 13 | 0;
  HEAP32[($7_1 + 80 | 0) >> 2] = (HEAP32[($7_1 + 140 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 68 | 0) >> 2] | 0) << 2 | 0) | 0;
  HEAP32[($7_1 + 68 | 0) >> 2] = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + 14 | 0;
  HEAP32[($7_1 + 76 | 0) >> 2] = (HEAP32[($7_1 + 140 | 0) >> 2] | 0) + ((((HEAP32[($7_1 + 68 | 0) >> 2] | 0) << 2 | 0) >>> 1 | 0) << 1 | 0) | 0;
  HEAP32[($7_1 + 68 | 0) >> 2] = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + 128 | 0;
  HEAP32[($7_1 + 72 | 0) >> 2] = (HEAP32[($7_1 + 140 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 68 | 0) >> 2] | 0) << 2 | 0) | 0;
  HEAP32[($7_1 + 68 | 0) >> 2] = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + 64 | 0;
  label$3 : {
   label$4 : {
    if (!(((HEAP32[($7_1 + 68 | 0) >> 2] | 0) << 2 | 0) >>> 0 > (HEAP32[($7_1 + 136 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($7_1 + 156 | 0) >> 2] = -44;
    break label$3;
   }
   HEAP32[($7_1 + 92 | 0) >> 2] = (HEAP32[($7_1 + 80 | 0) >> 2] | 0) + 4 | 0;
   $154(HEAP32[($7_1 + 84 | 0) >> 2] | 0 | 0, 0 | 0, 108 | 0) | 0;
   label$5 : {
    if (!((HEAP32[($7_1 + 108 | 0) >> 2] | 0) >>> 0 > 12 >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($7_1 + 156 | 0) >> 2] = -44;
    break label$3;
   }
   HEAP32[($7_1 + 104 | 0) >> 2] = $10(HEAP32[($7_1 + 72 | 0) >> 2] | 0 | 0, 256 | 0, HEAP32[($7_1 + 84 | 0) >> 2] | 0 | 0, $7_1 + 120 | 0 | 0, $7_1 + 132 | 0 | 0, HEAP32[($7_1 + 148 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 144 | 0) >> 2] | 0 | 0) | 0;
   label$6 : {
    if (!($3(HEAP32[($7_1 + 104 | 0) >> 2] | 0 | 0) | 0)) {
     break label$6
    }
    HEAP32[($7_1 + 156 | 0) >> 2] = HEAP32[($7_1 + 104 | 0) >> 2] | 0;
    break label$3;
   }
   label$7 : {
    if (!((HEAP32[($7_1 + 132 | 0) >> 2] | 0) >>> 0 > (HEAP32[($7_1 + 108 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$7
    }
    HEAP32[($7_1 + 156 | 0) >> 2] = -44;
    break label$3;
   }
   HEAP32[($7_1 + 128 | 0) >> 2] = HEAP32[($7_1 + 132 | 0) >> 2] | 0;
   label$8 : {
    label$9 : while (1) {
     if (HEAP32[((HEAP32[($7_1 + 84 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 128 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) {
      break label$8
     }
     HEAP32[($7_1 + 128 | 0) >> 2] = (HEAP32[($7_1 + 128 | 0) >> 2] | 0) + -1 | 0;
     continue label$9;
    };
   }
   HEAP32[($7_1 + 60 | 0) >> 2] = 0;
   HEAP32[($7_1 + 64 | 0) >> 2] = 1;
   label$10 : {
    label$11 : while (1) {
     if (!((HEAP32[($7_1 + 64 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($7_1 + 128 | 0) >> 2] | 0) + 1 | 0) >>> 0 & 1 | 0)) {
      break label$10
     }
     HEAP32[($7_1 + 56 | 0) >> 2] = HEAP32[($7_1 + 60 | 0) >> 2] | 0;
     HEAP32[($7_1 + 60 | 0) >> 2] = (HEAP32[($7_1 + 60 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($7_1 + 84 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 64 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) | 0;
     HEAP32[((HEAP32[($7_1 + 92 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 64 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] = HEAP32[($7_1 + 56 | 0) >> 2] | 0;
     HEAP32[($7_1 + 64 | 0) >> 2] = (HEAP32[($7_1 + 64 | 0) >> 2] | 0) + 1 | 0;
     continue label$11;
    };
   }
   HEAP32[(HEAP32[($7_1 + 92 | 0) >> 2] | 0) >> 2] = HEAP32[($7_1 + 60 | 0) >> 2] | 0;
   HEAP32[($7_1 + 124 | 0) >> 2] = HEAP32[($7_1 + 60 | 0) >> 2] | 0;
   HEAP32[($7_1 + 52 | 0) >> 2] = 0;
   label$12 : {
    label$13 : while (1) {
     if (!((HEAP32[($7_1 + 52 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 120 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$12
     }
     HEAP32[($7_1 + 48 | 0) >> 2] = (HEAPU8[((HEAP32[($7_1 + 72 | 0) >> 2] | 0) + (HEAP32[($7_1 + 52 | 0) >> 2] | 0) | 0) >> 0] | 0) & 255 | 0;
     $171 = (HEAP32[($7_1 + 92 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 48 | 0) >> 2] | 0) << 2 | 0) | 0;
     $172 = HEAP32[$171 >> 2] | 0;
     HEAP32[$171 >> 2] = $172 + 1 | 0;
     HEAP32[($7_1 + 44 | 0) >> 2] = $172;
     HEAP8[((HEAP32[($7_1 + 76 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 44 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] = HEAP32[($7_1 + 52 | 0) >> 2] | 0;
     HEAP8[(((HEAP32[($7_1 + 76 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 44 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
     HEAP32[($7_1 + 52 | 0) >> 2] = (HEAP32[($7_1 + 52 | 0) >> 2] | 0) + 1 | 0;
     continue label$13;
    };
   }
   $191 = 0;
   HEAP32[(HEAP32[($7_1 + 92 | 0) >> 2] | 0) >> 2] = $191;
   HEAP32[($7_1 + 40 | 0) >> 2] = HEAP32[($7_1 + 88 | 0) >> 2] | 0;
   HEAP32[($7_1 + 36 | 0) >> 2] = ((HEAP32[($7_1 + 108 | 0) >> 2] | 0) - (HEAP32[($7_1 + 132 | 0) >> 2] | 0) | 0) - 1 | 0;
   HEAP32[($7_1 + 32 | 0) >> 2] = $191;
   HEAP32[($7_1 + 28 | 0) >> 2] = 1;
   label$14 : {
    label$15 : while (1) {
     if (!((HEAP32[($7_1 + 28 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($7_1 + 128 | 0) >> 2] | 0) + 1 | 0) >>> 0 & 1 | 0)) {
      break label$14
     }
     HEAP32[($7_1 + 24 | 0) >> 2] = HEAP32[($7_1 + 32 | 0) >> 2] | 0;
     HEAP32[($7_1 + 32 | 0) >> 2] = (HEAP32[($7_1 + 32 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($7_1 + 84 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 28 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) << ((HEAP32[($7_1 + 28 | 0) >> 2] | 0) + (HEAP32[($7_1 + 36 | 0) >> 2] | 0) | 0) | 0) | 0;
     HEAP32[((HEAP32[($7_1 + 40 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 28 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] = HEAP32[($7_1 + 24 | 0) >> 2] | 0;
     HEAP32[($7_1 + 28 | 0) >> 2] = (HEAP32[($7_1 + 28 | 0) >> 2] | 0) + 1 | 0;
     continue label$15;
    };
   }
   HEAP32[($7_1 + 20 | 0) >> 2] = ((HEAP32[($7_1 + 132 | 0) >> 2] | 0) + 1 | 0) - (HEAP32[($7_1 + 128 | 0) >> 2] | 0) | 0;
   HEAP32[($7_1 + 16 | 0) >> 2] = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
   label$16 : {
    label$17 : while (1) {
     if (!((HEAP32[($7_1 + 16 | 0) >> 2] | 0) >>> 0 < (((HEAP32[($7_1 + 108 | 0) >> 2] | 0) - (HEAP32[($7_1 + 20 | 0) >> 2] | 0) | 0) + 1 | 0) >>> 0 & 1 | 0)) {
      break label$16
     }
     HEAP32[($7_1 + 12 | 0) >> 2] = (HEAP32[($7_1 + 88 | 0) >> 2] | 0) + Math_imul(HEAP32[($7_1 + 16 | 0) >> 2] | 0, 52) | 0;
     HEAP32[($7_1 + 8 | 0) >> 2] = 1;
     label$18 : {
      label$19 : while (1) {
       if (!((HEAP32[($7_1 + 8 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($7_1 + 128 | 0) >> 2] | 0) + 1 | 0) >>> 0 & 1 | 0)) {
        break label$18
       }
       HEAP32[((HEAP32[($7_1 + 12 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 8 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] = (HEAP32[((HEAP32[($7_1 + 40 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 8 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) >>> (HEAP32[($7_1 + 16 | 0) >> 2] | 0) | 0;
       HEAP32[($7_1 + 8 | 0) >> 2] = (HEAP32[($7_1 + 8 | 0) >> 2] | 0) + 1 | 0;
       continue label$19;
      };
     }
     HEAP32[($7_1 + 16 | 0) >> 2] = (HEAP32[($7_1 + 16 | 0) >> 2] | 0) + 1 | 0;
     continue label$17;
    };
   }
   $39(HEAP32[($7_1 + 96 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 108 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 76 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 124 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 80 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 88 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 128 | 0) >> 2] | 0 | 0, (HEAP32[($7_1 + 132 | 0) >> 2] | 0) + 1 | 0 | 0);
   HEAP8[($7_1 + 114 | 0) >> 0] = HEAP32[($7_1 + 108 | 0) >> 2] | 0;
   HEAP8[($7_1 + 113 | 0) >> 0] = 1;
   $12_1 = $7_1 + 112 | 0;
   $13_1 = HEAP32[($7_1 + 152 | 0) >> 2] | 0;
   $14_1 = HEAPU8[$12_1 >> 0] | 0 | ((HEAPU8[($12_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[($12_1 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[($12_1 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
   HEAP8[$13_1 >> 0] = $14_1;
   HEAP8[($13_1 + 1 | 0) >> 0] = $14_1 >>> 8 | 0;
   HEAP8[($13_1 + 2 | 0) >> 0] = $14_1 >>> 16 | 0;
   HEAP8[($13_1 + 3 | 0) >> 0] = $14_1 >>> 24 | 0;
   HEAP32[($7_1 + 156 | 0) >> 2] = HEAP32[($7_1 + 104 | 0) >> 2] | 0;
  }
  $299 = HEAP32[($7_1 + 156 | 0) >> 2] | 0;
  label$20 : {
   $303 = $7_1 + 160 | 0;
   if ($303 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $303;
  }
  return $299 | 0;
 }
 
 function $39($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, $14_1 = 0, $21_1 = 0, $22_1 = 0, $26_1 = 0, $29_1 = 0, $32_1 = 0, $35_1 = 0, $38_1 = 0, $30_1 = 0, $31_1 = 0, $33_1 = 0, $171 = 0, $180 = 0, $179 = 0, $239 = 0, $259 = 0, $269 = 0, $279 = 0, $289 = 0, $299 = 0;
  $10_1 = global$0 - 160 | 0;
  label$1 : {
   $179 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $179;
  }
  $14_1 = $10_1 + 64 | 0;
  HEAP32[($10_1 + 156 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 152 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 148 | 0) >> 2] = $2_1;
  HEAP32[($10_1 + 144 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 140 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 136 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 132 | 0) >> 2] = $6_1;
  HEAP32[($10_1 + 128 | 0) >> 2] = $7_1;
  HEAP32[($10_1 + 60 | 0) >> 2] = (HEAP32[($10_1 + 128 | 0) >> 2] | 0) - (HEAP32[($10_1 + 152 | 0) >> 2] | 0) | 0;
  HEAP32[($10_1 + 56 | 0) >> 2] = (HEAP32[($10_1 + 128 | 0) >> 2] | 0) - (HEAP32[($10_1 + 132 | 0) >> 2] | 0) | 0;
  $21_1 = HEAP32[($10_1 + 136 | 0) >> 2] | 0;
  i64toi32_i32$2 = $21_1;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $239 = i64toi32_i32$0;
  i64toi32_i32$0 = $14_1;
  HEAP32[i64toi32_i32$0 >> 2] = $239;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
  $22_1 = 48;
  HEAP32[(i64toi32_i32$0 + $22_1 | 0) >> 2] = HEAP32[(i64toi32_i32$2 + $22_1 | 0) >> 2] | 0;
  $26_1 = 40;
  i64toi32_i32$2 = i64toi32_i32$2 + $26_1 | 0;
  i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $259 = i64toi32_i32$1;
  i64toi32_i32$1 = $14_1 + $26_1 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $259;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  $29_1 = 32;
  i64toi32_i32$2 = $21_1 + $29_1 | 0;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $269 = i64toi32_i32$0;
  i64toi32_i32$0 = $14_1 + $29_1 | 0;
  HEAP32[i64toi32_i32$0 >> 2] = $269;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
  $32_1 = 24;
  i64toi32_i32$2 = $21_1 + $32_1 | 0;
  i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $279 = i64toi32_i32$1;
  i64toi32_i32$1 = $14_1 + $32_1 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $279;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  $35_1 = 16;
  i64toi32_i32$2 = $21_1 + $35_1 | 0;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $289 = i64toi32_i32$0;
  i64toi32_i32$0 = $14_1 + $35_1 | 0;
  HEAP32[i64toi32_i32$0 >> 2] = $289;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
  $38_1 = 8;
  i64toi32_i32$2 = $21_1 + $38_1 | 0;
  i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $299 = i64toi32_i32$1;
  i64toi32_i32$1 = $14_1 + $38_1 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $299;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  HEAP32[($10_1 + 52 | 0) >> 2] = 0;
  label$3 : {
   label$4 : while (1) {
    if (!((HEAP32[($10_1 + 52 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 144 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$3
    }
    HEAP16[($10_1 + 50 | 0) >> 1] = (HEAPU8[((HEAP32[($10_1 + 148 | 0) >> 2] | 0) + ((HEAP32[($10_1 + 52 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0) & 255 | 0;
    HEAP32[($10_1 + 44 | 0) >> 2] = (HEAPU8[(((HEAP32[($10_1 + 148 | 0) >> 2] | 0) + ((HEAP32[($10_1 + 52 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0;
    HEAP32[($10_1 + 40 | 0) >> 2] = (HEAP32[($10_1 + 128 | 0) >> 2] | 0) - (HEAP32[($10_1 + 44 | 0) >> 2] | 0) | 0;
    HEAP32[($10_1 + 36 | 0) >> 2] = HEAP32[(($10_1 + 64 | 0) + ((HEAP32[($10_1 + 44 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
    HEAP32[($10_1 + 32 | 0) >> 2] = 1 << ((HEAP32[($10_1 + 152 | 0) >> 2] | 0) - (HEAP32[($10_1 + 40 | 0) >> 2] | 0) | 0) | 0;
    label$5 : {
     label$6 : {
      if (!(((HEAP32[($10_1 + 152 | 0) >> 2] | 0) - (HEAP32[($10_1 + 40 | 0) >> 2] | 0) | 0) >>> 0 >= (HEAP32[($10_1 + 56 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$6
      }
      HEAP32[($10_1 + 24 | 0) >> 2] = (HEAP32[($10_1 + 40 | 0) >> 2] | 0) + (HEAP32[($10_1 + 60 | 0) >> 2] | 0) | 0;
      label$7 : {
       if (!((HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0) < (1 | 0) & 1 | 0)) {
        break label$7
       }
       HEAP32[($10_1 + 24 | 0) >> 2] = 1;
      }
      HEAP32[($10_1 + 28 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 140 | 0) >> 2] | 0) + ((HEAP32[($10_1 + 24 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
      $40((HEAP32[($10_1 + 156 | 0) >> 2] | 0) + ((HEAP32[($10_1 + 36 | 0) >> 2] | 0) << 2 | 0) | 0 | 0, (HEAP32[($10_1 + 152 | 0) >> 2] | 0) - (HEAP32[($10_1 + 40 | 0) >> 2] | 0) | 0 | 0, HEAP32[($10_1 + 40 | 0) >> 2] | 0 | 0, (HEAP32[($10_1 + 136 | 0) >> 2] | 0) + Math_imul(HEAP32[($10_1 + 40 | 0) >> 2] | 0, 52) | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, (HEAP32[($10_1 + 148 | 0) >> 2] | 0) + ((HEAP32[($10_1 + 28 | 0) >> 2] | 0) << 1 | 0) | 0 | 0, (HEAP32[($10_1 + 144 | 0) >> 2] | 0) - (HEAP32[($10_1 + 28 | 0) >> 2] | 0) | 0 | 0, HEAP32[($10_1 + 128 | 0) >> 2] | 0 | 0, (HEAPU16[($10_1 + 50 | 0) >> 1] | 0) & 65535 | 0 | 0);
      break label$5;
     }
     $41($10_1 + 16 | 0 | 0, (HEAPU16[($10_1 + 50 | 0) >> 1] | 0) & 65535 | 0 | 0);
     HEAP8[($10_1 + 18 | 0) >> 0] = HEAP32[($10_1 + 40 | 0) >> 2] | 0;
     HEAP8[($10_1 + 19 | 0) >> 0] = 1;
     HEAP32[($10_1 + 12 | 0) >> 2] = (HEAP32[($10_1 + 36 | 0) >> 2] | 0) + (HEAP32[($10_1 + 32 | 0) >> 2] | 0) | 0;
     HEAP32[($10_1 + 8 | 0) >> 2] = HEAP32[($10_1 + 36 | 0) >> 2] | 0;
     label$8 : {
      label$9 : while (1) {
       if (!((HEAP32[($10_1 + 8 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 12 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
        break label$8
       }
       $30_1 = $10_1 + 16 | 0;
       $31_1 = (HEAP32[($10_1 + 156 | 0) >> 2] | 0) + ((HEAP32[($10_1 + 8 | 0) >> 2] | 0) << 2 | 0) | 0;
       $33_1 = HEAPU16[$30_1 >> 1] | 0 | ((HEAPU16[($30_1 + 2 | 0) >> 1] | 0) << 16 | 0) | 0;
       HEAP16[$31_1 >> 1] = $33_1;
       HEAP16[($31_1 + 2 | 0) >> 1] = $33_1 >>> 16 | 0;
       HEAP32[($10_1 + 8 | 0) >> 2] = (HEAP32[($10_1 + 8 | 0) >> 2] | 0) + 1 | 0;
       continue label$9;
      };
     }
    }
    $171 = ($10_1 + 64 | 0) + ((HEAP32[($10_1 + 44 | 0) >> 2] | 0) << 2 | 0) | 0;
    HEAP32[$171 >> 2] = (HEAP32[$171 >> 2] | 0) + (HEAP32[($10_1 + 32 | 0) >> 2] | 0) | 0;
    HEAP32[($10_1 + 52 | 0) >> 2] = (HEAP32[($10_1 + 52 | 0) >> 2] | 0) + 1 | 0;
    continue label$4;
   };
  }
  label$10 : {
   $180 = $10_1 + 160 | 0;
   if ($180 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $180;
  }
  return;
 }
 
 function $40($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1, $8_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  $8_1 = $8_1 | 0;
  var $11_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, $21_1 = 0, $24_1 = 0, $27_1 = 0, $30_1 = 0, $33_1 = 0, $32_1 = 0, $34_1 = 0, $35_1 = 0, $142_1 = 0, $36_1 = 0, $37_1 = 0, $38_1 = 0, $163 = 0, $172 = 0, $171 = 0, $215 = 0, $235 = 0, $245 = 0, $255 = 0, $265 = 0, $275 = 0, $141_1 = 0;
  $11_1 = global$0 - 144 | 0;
  label$1 : {
   $171 = $11_1;
   if ($11_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $171;
  }
  $15_1 = $11_1 + 48 | 0;
  HEAP32[($11_1 + 140 | 0) >> 2] = $0_1;
  HEAP32[($11_1 + 136 | 0) >> 2] = $1_1;
  HEAP32[($11_1 + 132 | 0) >> 2] = $2_1;
  HEAP32[($11_1 + 128 | 0) >> 2] = $3_1;
  HEAP32[($11_1 + 124 | 0) >> 2] = $4_1;
  HEAP32[($11_1 + 120 | 0) >> 2] = $5_1;
  HEAP32[($11_1 + 116 | 0) >> 2] = $6_1;
  HEAP32[($11_1 + 112 | 0) >> 2] = $7_1;
  HEAP16[($11_1 + 110 | 0) >> 1] = $8_1;
  $16_1 = HEAP32[($11_1 + 128 | 0) >> 2] | 0;
  i64toi32_i32$2 = $16_1;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $215 = i64toi32_i32$0;
  i64toi32_i32$0 = $15_1;
  HEAP32[i64toi32_i32$0 >> 2] = $215;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
  $17_1 = 48;
  HEAP32[(i64toi32_i32$0 + $17_1 | 0) >> 2] = HEAP32[(i64toi32_i32$2 + $17_1 | 0) >> 2] | 0;
  $21_1 = 40;
  i64toi32_i32$2 = i64toi32_i32$2 + $21_1 | 0;
  i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $235 = i64toi32_i32$1;
  i64toi32_i32$1 = $15_1 + $21_1 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $235;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  $24_1 = 32;
  i64toi32_i32$2 = $16_1 + $24_1 | 0;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $245 = i64toi32_i32$0;
  i64toi32_i32$0 = $15_1 + $24_1 | 0;
  HEAP32[i64toi32_i32$0 >> 2] = $245;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
  $27_1 = 24;
  i64toi32_i32$2 = $16_1 + $27_1 | 0;
  i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $255 = i64toi32_i32$1;
  i64toi32_i32$1 = $15_1 + $27_1 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $255;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  $30_1 = 16;
  i64toi32_i32$2 = $16_1 + $30_1 | 0;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $265 = i64toi32_i32$0;
  i64toi32_i32$0 = $15_1 + $30_1 | 0;
  HEAP32[i64toi32_i32$0 >> 2] = $265;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
  $33_1 = 8;
  i64toi32_i32$2 = $16_1 + $33_1 | 0;
  i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $275 = i64toi32_i32$1;
  i64toi32_i32$1 = $15_1 + $33_1 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $275;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  label$3 : {
   if (!((HEAP32[($11_1 + 124 | 0) >> 2] | 0 | 0) > (1 | 0) & 1 | 0)) {
    break label$3
   }
   HEAP32[($11_1 + 40 | 0) >> 2] = HEAP32[(($11_1 + 48 | 0) + ((HEAP32[($11_1 + 124 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
   $41($11_1 + 104 | 0 | 0, (HEAPU16[($11_1 + 110 | 0) >> 1] | 0) & 65535 | 0 | 0);
   HEAP8[($11_1 + 106 | 0) >> 0] = HEAP32[($11_1 + 132 | 0) >> 2] | 0;
   HEAP8[($11_1 + 107 | 0) >> 0] = 1;
   HEAP32[($11_1 + 44 | 0) >> 2] = 0;
   label$4 : {
    label$5 : while (1) {
     if (!((HEAP32[($11_1 + 44 | 0) >> 2] | 0) >>> 0 < (HEAP32[($11_1 + 40 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$4
     }
     $32_1 = $11_1 + 104 | 0;
     $34_1 = (HEAP32[($11_1 + 140 | 0) >> 2] | 0) + ((HEAP32[($11_1 + 44 | 0) >> 2] | 0) << 2 | 0) | 0;
     $35_1 = HEAPU16[$32_1 >> 1] | 0 | ((HEAPU16[($32_1 + 2 | 0) >> 1] | 0) << 16 | 0) | 0;
     HEAP16[$34_1 >> 1] = $35_1;
     HEAP16[($34_1 + 2 | 0) >> 1] = $35_1 >>> 16 | 0;
     HEAP32[($11_1 + 44 | 0) >> 2] = (HEAP32[($11_1 + 44 | 0) >> 2] | 0) + 1 | 0;
     continue label$5;
    };
   }
  }
  HEAP32[($11_1 + 36 | 0) >> 2] = 0;
  label$6 : {
   label$7 : while (1) {
    if (!((HEAP32[($11_1 + 36 | 0) >> 2] | 0) >>> 0 < (HEAP32[($11_1 + 116 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$6
    }
    HEAP32[($11_1 + 32 | 0) >> 2] = (HEAPU8[((HEAP32[($11_1 + 120 | 0) >> 2] | 0) + ((HEAP32[($11_1 + 36 | 0) >> 2] | 0) << 1 | 0) | 0) >> 0] | 0) & 255 | 0;
    HEAP32[($11_1 + 28 | 0) >> 2] = (HEAPU8[(((HEAP32[($11_1 + 120 | 0) >> 2] | 0) + ((HEAP32[($11_1 + 36 | 0) >> 2] | 0) << 1 | 0) | 0) + 1 | 0) >> 0] | 0) & 255 | 0;
    HEAP32[($11_1 + 24 | 0) >> 2] = (HEAP32[($11_1 + 112 | 0) >> 2] | 0) - (HEAP32[($11_1 + 28 | 0) >> 2] | 0) | 0;
    HEAP32[($11_1 + 20 | 0) >> 2] = 1 << ((HEAP32[($11_1 + 136 | 0) >> 2] | 0) - (HEAP32[($11_1 + 24 | 0) >> 2] | 0) | 0) | 0;
    HEAP32[($11_1 + 16 | 0) >> 2] = HEAP32[(($11_1 + 48 | 0) + ((HEAP32[($11_1 + 28 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
    HEAP32[($11_1 + 12 | 0) >> 2] = HEAP32[($11_1 + 16 | 0) >> 2] | 0;
    HEAP32[($11_1 + 8 | 0) >> 2] = (HEAP32[($11_1 + 16 | 0) >> 2] | 0) + (HEAP32[($11_1 + 20 | 0) >> 2] | 0) | 0;
    $41($11_1 + 104 | 0 | 0, (((HEAPU16[($11_1 + 110 | 0) >> 1] | 0) & 65535 | 0) + ((HEAP32[($11_1 + 32 | 0) >> 2] | 0) << 8 | 0) | 0) & 65535 | 0 | 0);
    HEAP8[($11_1 + 106 | 0) >> 0] = (HEAP32[($11_1 + 24 | 0) >> 2] | 0) + (HEAP32[($11_1 + 132 | 0) >> 2] | 0) | 0;
    HEAP8[($11_1 + 107 | 0) >> 0] = 2;
    label$8 : while (1) {
     $141_1 = HEAP32[($11_1 + 140 | 0) >> 2] | 0;
     $142_1 = HEAP32[($11_1 + 12 | 0) >> 2] | 0;
     HEAP32[($11_1 + 12 | 0) >> 2] = $142_1 + 1 | 0;
     $36_1 = $11_1 + 104 | 0;
     $37_1 = $141_1 + ($142_1 << 2 | 0) | 0;
     $38_1 = HEAPU16[$36_1 >> 1] | 0 | ((HEAPU16[($36_1 + 2 | 0) >> 1] | 0) << 16 | 0) | 0;
     HEAP16[$37_1 >> 1] = $38_1;
     HEAP16[($37_1 + 2 | 0) >> 1] = $38_1 >>> 16 | 0;
     if ((HEAP32[($11_1 + 12 | 0) >> 2] | 0) >>> 0 < (HEAP32[($11_1 + 8 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
      continue label$8
     }
     break label$8;
    };
    $163 = ($11_1 + 48 | 0) + ((HEAP32[($11_1 + 28 | 0) >> 2] | 0) << 2 | 0) | 0;
    HEAP32[$163 >> 2] = (HEAP32[$163 >> 2] | 0) + (HEAP32[($11_1 + 20 | 0) >> 2] | 0) | 0;
    HEAP32[($11_1 + 36 | 0) >> 2] = (HEAP32[($11_1 + 36 | 0) >> 2] | 0) + 1 | 0;
    continue label$7;
   };
  }
  label$9 : {
   $172 = $11_1 + 144 | 0;
   if ($172 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $172;
  }
  return;
 }
 
 function $41($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $22_1 = 0, $21_1 = 0;
  $4_1 = global$0 - 16 | 0;
  label$1 : {
   $21_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $21_1;
  }
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP16[($4_1 + 10 | 0) >> 1] = $1_1;
  label$3 : {
   label$4 : {
    if (!($7() | 0)) {
     break label$4
    }
    $137(HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0, (HEAPU16[($4_1 + 10 | 0) >> 1] | 0) & 65535 | 0 | 0);
    break label$3;
   }
   HEAP32[($4_1 + 4 | 0) >> 2] = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
   HEAP8[(HEAP32[($4_1 + 4 | 0) >> 2] | 0) >> 0] = HEAPU16[($4_1 + 10 | 0) >> 1] | 0;
   HEAP8[((HEAP32[($4_1 + 4 | 0) >> 2] | 0) + 1 | 0) >> 0] = ((HEAPU16[($4_1 + 10 | 0) >> 1] | 0) & 65535 | 0) >> 8 | 0;
  }
  label$5 : {
   $22_1 = $4_1 + 16 | 0;
   if ($22_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $22_1;
  }
  return;
 }
 
 function $42($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $8_1 = 0, $38_1 = 0, $41_1 = 0, $42_1 = 0, $44_1 = 0, $45_1 = 0, $46_1 = 0, $47_1 = 0, $48_1 = 0, $49_1 = 0, $50_1 = 0, $51_1 = 0, $52_1 = 0, $53_1 = 0, $54_1 = 0, $55_1 = 0, $56_1 = 0, $57_1 = 0, $58_1 = 0, $375 = 0, $374 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $39_1 = 0, $40_1 = 0, $43_1 = 0, $65_1 = 0, $66_1 = 0, $67_1 = 0, $99_1 = 0, $100_1 = 0, $101_1 = 0, $133_1 = 0, $134_1 = 0, $135_1 = 0, $166 = 0, $167 = 0, $168 = 0, $217 = 0, $218 = 0, $219 = 0, $259 = 0, $260 = 0, $261 = 0, $300 = 0, $301 = 0, $302 = 0, $371 = 0;
  $8_1 = global$0 - 256 | 0;
  label$1 : {
   $374 = $8_1;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $374;
  }
  HEAP32[($8_1 + 20 | 0) >> 2] = $0_1;
  HEAP32[($8_1 + 16 | 0) >> 2] = $1_1;
  HEAP32[($8_1 + 12 | 0) >> 2] = $2_1;
  HEAP32[($8_1 + 8 | 0) >> 2] = $3_1;
  HEAP32[($8_1 + 4 | 0) >> 2] = $4_1;
  HEAP32[$8_1 >> 2] = $5_1;
  $13_1 = HEAP32[($8_1 + 16 | 0) >> 2] | 0;
  $14_1 = HEAP32[($8_1 + 12 | 0) >> 2] | 0;
  $15_1 = HEAP32[($8_1 + 8 | 0) >> 2] | 0;
  $16_1 = HEAP32[($8_1 + 4 | 0) >> 2] | 0;
  HEAP32[($8_1 + 84 | 0) >> 2] = HEAP32[($8_1 + 20 | 0) >> 2] | 0;
  HEAP32[($8_1 + 80 | 0) >> 2] = $13_1;
  HEAP32[($8_1 + 76 | 0) >> 2] = $14_1;
  HEAP32[($8_1 + 72 | 0) >> 2] = $15_1;
  HEAP32[($8_1 + 68 | 0) >> 2] = $16_1;
  HEAP32[($8_1 + 44 | 0) >> 2] = $15($8_1 + 48 | 0 | 0, HEAP32[($8_1 + 76 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 72 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   label$4 : {
    if (!($3(HEAP32[($8_1 + 44 | 0) >> 2] | 0 | 0) | 0)) {
     break label$4
    }
    HEAP32[($8_1 + 88 | 0) >> 2] = HEAP32[($8_1 + 44 | 0) >> 2] | 0;
    break label$3;
   }
   HEAP32[($8_1 + 40 | 0) >> 2] = HEAP32[($8_1 + 84 | 0) >> 2] | 0;
   HEAP32[($8_1 + 36 | 0) >> 2] = (HEAP32[($8_1 + 40 | 0) >> 2] | 0) + (HEAP32[($8_1 + 80 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 32 | 0) >> 2] = (HEAP32[($8_1 + 68 | 0) >> 2] | 0) + 4 | 0;
   HEAP32[($8_1 + 28 | 0) >> 2] = HEAP32[($8_1 + 32 | 0) >> 2] | 0;
   $27($8_1 + 24 | 0 | 0, HEAP32[($8_1 + 68 | 0) >> 2] | 0 | 0);
   $39_1 = HEAP32[($8_1 + 36 | 0) >> 2] | 0;
   $40_1 = HEAP32[($8_1 + 28 | 0) >> 2] | 0;
   $43_1 = (HEAPU8[($8_1 + 26 | 0) >> 0] | 0) & 255 | 0;
   HEAP32[($8_1 + 112 | 0) >> 2] = HEAP32[($8_1 + 40 | 0) >> 2] | 0;
   HEAP32[($8_1 + 108 | 0) >> 2] = $8_1 + 48 | 0;
   HEAP32[($8_1 + 104 | 0) >> 2] = $39_1;
   HEAP32[($8_1 + 100 | 0) >> 2] = $40_1;
   HEAP32[($8_1 + 96 | 0) >> 2] = $43_1;
   HEAP32[($8_1 + 92 | 0) >> 2] = HEAP32[($8_1 + 112 | 0) >> 2] | 0;
   label$5 : {
    label$6 : while (1) {
     if (!((($17(HEAP32[($8_1 + 108 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 112 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($8_1 + 104 | 0) >> 2] | 0) + -3 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$5
     }
     label$7 : {
      if (!($29() | 0)) {
       break label$7
      }
      $65_1 = HEAP32[($8_1 + 108 | 0) >> 2] | 0;
      $66_1 = HEAP32[($8_1 + 100 | 0) >> 2] | 0;
      $67_1 = HEAP32[($8_1 + 96 | 0) >> 2] | 0;
      HEAP32[($8_1 + 132 | 0) >> 2] = HEAP32[($8_1 + 112 | 0) >> 2] | 0;
      HEAP32[($8_1 + 128 | 0) >> 2] = $65_1;
      HEAP32[($8_1 + 124 | 0) >> 2] = $66_1;
      HEAP32[($8_1 + 120 | 0) >> 2] = $67_1;
      HEAP32[($8_1 + 116 | 0) >> 2] = $30(HEAP32[($8_1 + 128 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 120 | 0) >> 2] | 0 | 0) | 0;
      $38_1 = (HEAP32[($8_1 + 124 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 116 | 0) >> 2] | 0) << 2 | 0) | 0;
      $41_1 = HEAP32[($8_1 + 132 | 0) >> 2] | 0;
      $42_1 = HEAPU8[$38_1 >> 0] | 0 | ((HEAPU8[($38_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$41_1 >> 0] = $42_1;
      HEAP8[($41_1 + 1 | 0) >> 0] = $42_1 >>> 8 | 0;
      $31(HEAP32[($8_1 + 128 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 124 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 116 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 112 | 0) >> 2] = (HEAP32[($8_1 + 112 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 124 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 116 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$8 : {
      if ($29() | 0) {
       break label$8
      }
     }
     $99_1 = HEAP32[($8_1 + 108 | 0) >> 2] | 0;
     $100_1 = HEAP32[($8_1 + 100 | 0) >> 2] | 0;
     $101_1 = HEAP32[($8_1 + 96 | 0) >> 2] | 0;
     HEAP32[($8_1 + 152 | 0) >> 2] = HEAP32[($8_1 + 112 | 0) >> 2] | 0;
     HEAP32[($8_1 + 148 | 0) >> 2] = $99_1;
     HEAP32[($8_1 + 144 | 0) >> 2] = $100_1;
     HEAP32[($8_1 + 140 | 0) >> 2] = $101_1;
     HEAP32[($8_1 + 136 | 0) >> 2] = $30(HEAP32[($8_1 + 148 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 140 | 0) >> 2] | 0 | 0) | 0;
     $44_1 = (HEAP32[($8_1 + 144 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 136 | 0) >> 2] | 0) << 2 | 0) | 0;
     $45_1 = HEAP32[($8_1 + 152 | 0) >> 2] | 0;
     $46_1 = HEAPU8[$44_1 >> 0] | 0 | ((HEAPU8[($44_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$45_1 >> 0] = $46_1;
     HEAP8[($45_1 + 1 | 0) >> 0] = $46_1 >>> 8 | 0;
     $31(HEAP32[($8_1 + 148 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 144 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 136 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 112 | 0) >> 2] = (HEAP32[($8_1 + 112 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 144 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 136 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     label$9 : {
      if (!($29() | 0)) {
       break label$9
      }
      $133_1 = HEAP32[($8_1 + 108 | 0) >> 2] | 0;
      $134_1 = HEAP32[($8_1 + 100 | 0) >> 2] | 0;
      $135_1 = HEAP32[($8_1 + 96 | 0) >> 2] | 0;
      HEAP32[($8_1 + 172 | 0) >> 2] = HEAP32[($8_1 + 112 | 0) >> 2] | 0;
      HEAP32[($8_1 + 168 | 0) >> 2] = $133_1;
      HEAP32[($8_1 + 164 | 0) >> 2] = $134_1;
      HEAP32[($8_1 + 160 | 0) >> 2] = $135_1;
      HEAP32[($8_1 + 156 | 0) >> 2] = $30(HEAP32[($8_1 + 168 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 160 | 0) >> 2] | 0 | 0) | 0;
      $47_1 = (HEAP32[($8_1 + 164 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 156 | 0) >> 2] | 0) << 2 | 0) | 0;
      $48_1 = HEAP32[($8_1 + 172 | 0) >> 2] | 0;
      $49_1 = HEAPU8[$47_1 >> 0] | 0 | ((HEAPU8[($47_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$48_1 >> 0] = $49_1;
      HEAP8[($48_1 + 1 | 0) >> 0] = $49_1 >>> 8 | 0;
      $31(HEAP32[($8_1 + 168 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 164 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 156 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 112 | 0) >> 2] = (HEAP32[($8_1 + 112 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 164 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 156 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     $166 = HEAP32[($8_1 + 108 | 0) >> 2] | 0;
     $167 = HEAP32[($8_1 + 100 | 0) >> 2] | 0;
     $168 = HEAP32[($8_1 + 96 | 0) >> 2] | 0;
     HEAP32[($8_1 + 192 | 0) >> 2] = HEAP32[($8_1 + 112 | 0) >> 2] | 0;
     HEAP32[($8_1 + 188 | 0) >> 2] = $166;
     HEAP32[($8_1 + 184 | 0) >> 2] = $167;
     HEAP32[($8_1 + 180 | 0) >> 2] = $168;
     HEAP32[($8_1 + 176 | 0) >> 2] = $30(HEAP32[($8_1 + 188 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 180 | 0) >> 2] | 0 | 0) | 0;
     $50_1 = (HEAP32[($8_1 + 184 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 176 | 0) >> 2] | 0) << 2 | 0) | 0;
     $51_1 = HEAP32[($8_1 + 192 | 0) >> 2] | 0;
     $52_1 = HEAPU8[$50_1 >> 0] | 0 | ((HEAPU8[($50_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$51_1 >> 0] = $52_1;
     HEAP8[($51_1 + 1 | 0) >> 0] = $52_1 >>> 8 | 0;
     $31(HEAP32[($8_1 + 188 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 184 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 176 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 112 | 0) >> 2] = (HEAP32[($8_1 + 112 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 184 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 176 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$6;
    };
   }
   label$10 : {
    label$11 : while (1) {
     if (!((($17(HEAP32[($8_1 + 108 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 112 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($8_1 + 104 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$10
     }
     $217 = HEAP32[($8_1 + 108 | 0) >> 2] | 0;
     $218 = HEAP32[($8_1 + 100 | 0) >> 2] | 0;
     $219 = HEAP32[($8_1 + 96 | 0) >> 2] | 0;
     HEAP32[($8_1 + 212 | 0) >> 2] = HEAP32[($8_1 + 112 | 0) >> 2] | 0;
     HEAP32[($8_1 + 208 | 0) >> 2] = $217;
     HEAP32[($8_1 + 204 | 0) >> 2] = $218;
     HEAP32[($8_1 + 200 | 0) >> 2] = $219;
     HEAP32[($8_1 + 196 | 0) >> 2] = $30(HEAP32[($8_1 + 208 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 200 | 0) >> 2] | 0 | 0) | 0;
     $53_1 = (HEAP32[($8_1 + 204 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 196 | 0) >> 2] | 0) << 2 | 0) | 0;
     $54_1 = HEAP32[($8_1 + 212 | 0) >> 2] | 0;
     $55_1 = HEAPU8[$53_1 >> 0] | 0 | ((HEAPU8[($53_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$54_1 >> 0] = $55_1;
     HEAP8[($54_1 + 1 | 0) >> 0] = $55_1 >>> 8 | 0;
     $31(HEAP32[($8_1 + 208 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 204 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 196 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 112 | 0) >> 2] = (HEAP32[($8_1 + 112 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 204 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 196 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$11;
    };
   }
   label$12 : {
    label$13 : while (1) {
     if (!((HEAP32[($8_1 + 112 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($8_1 + 104 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0)) {
      break label$12
     }
     $259 = HEAP32[($8_1 + 108 | 0) >> 2] | 0;
     $260 = HEAP32[($8_1 + 100 | 0) >> 2] | 0;
     $261 = HEAP32[($8_1 + 96 | 0) >> 2] | 0;
     HEAP32[($8_1 + 232 | 0) >> 2] = HEAP32[($8_1 + 112 | 0) >> 2] | 0;
     HEAP32[($8_1 + 228 | 0) >> 2] = $259;
     HEAP32[($8_1 + 224 | 0) >> 2] = $260;
     HEAP32[($8_1 + 220 | 0) >> 2] = $261;
     HEAP32[($8_1 + 216 | 0) >> 2] = $30(HEAP32[($8_1 + 228 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 220 | 0) >> 2] | 0 | 0) | 0;
     $56_1 = (HEAP32[($8_1 + 224 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 216 | 0) >> 2] | 0) << 2 | 0) | 0;
     $57_1 = HEAP32[($8_1 + 232 | 0) >> 2] | 0;
     $58_1 = HEAPU8[$56_1 >> 0] | 0 | ((HEAPU8[($56_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$57_1 >> 0] = $58_1;
     HEAP8[($57_1 + 1 | 0) >> 0] = $58_1 >>> 8 | 0;
     $31(HEAP32[($8_1 + 228 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 224 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 216 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 112 | 0) >> 2] = (HEAP32[($8_1 + 112 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 224 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 216 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$13;
    };
   }
   label$14 : {
    if (!((HEAP32[($8_1 + 112 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 104 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$14
    }
    $300 = HEAP32[($8_1 + 108 | 0) >> 2] | 0;
    $301 = HEAP32[($8_1 + 100 | 0) >> 2] | 0;
    $302 = HEAP32[($8_1 + 96 | 0) >> 2] | 0;
    HEAP32[($8_1 + 252 | 0) >> 2] = HEAP32[($8_1 + 112 | 0) >> 2] | 0;
    HEAP32[($8_1 + 248 | 0) >> 2] = $300;
    HEAP32[($8_1 + 244 | 0) >> 2] = $301;
    HEAP32[($8_1 + 240 | 0) >> 2] = $302;
    HEAP32[($8_1 + 236 | 0) >> 2] = $30(HEAP32[($8_1 + 248 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 240 | 0) >> 2] | 0 | 0) | 0;
    HEAP8[(HEAP32[($8_1 + 252 | 0) >> 2] | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 244 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 236 | 0) >> 2] | 0) << 2 | 0) | 0) >> 0] | 0;
    label$15 : {
     label$16 : {
      if (!(((HEAPU8[(((HEAP32[($8_1 + 244 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 236 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0 | 0) == (1 | 0) & 1 | 0)) {
       break label$16
      }
      $31(HEAP32[($8_1 + 248 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 244 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 236 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      break label$15;
     }
     label$17 : {
      if (!((HEAP32[((HEAP32[($8_1 + 248 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 < 32 >>> 0 & 1 | 0)) {
       break label$17
      }
      $31(HEAP32[($8_1 + 248 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 244 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 236 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      label$18 : {
       if (!((HEAP32[((HEAP32[($8_1 + 248 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 > 32 >>> 0 & 1 | 0)) {
        break label$18
       }
       HEAP32[((HEAP32[($8_1 + 248 | 0) >> 2] | 0) + 4 | 0) >> 2] = 32;
      }
     }
    }
    HEAP32[($8_1 + 112 | 0) >> 2] = (HEAP32[($8_1 + 112 | 0) >> 2] | 0) + 1 | 0;
   }
   label$19 : {
    if ($33($8_1 + 48 | 0 | 0) | 0) {
     break label$19
    }
    HEAP32[($8_1 + 88 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($8_1 + 88 | 0) >> 2] = HEAP32[($8_1 + 80 | 0) >> 2] | 0;
  }
  $371 = HEAP32[($8_1 + 88 | 0) >> 2] | 0;
  label$20 : {
   $375 = $8_1 + 256 | 0;
   if ($375 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $375;
  }
  return $371 | 0;
 }
 
 function $43($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $8_1 = 0, $582 = 0, $147_1 = 0, $148_1 = 0, $149_1 = 0, $150_1 = 0, $151_1 = 0, $152_1 = 0, $153_1 = 0, $154_1 = 0, $157_1 = 0, $158_1 = 0, $159_1 = 0, $160_1 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $585 = 0, $588 = 0, $591 = 0, $594 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $190 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $229 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $260 = 0, $261 = 0, $262 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $2112 = 0, $2111 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $155_1 = 0, $156_1 = 0, $191 = 0, $192 = 0, $227 = 0, $228 = 0, $263 = 0, $264 = 0, $299 = 0, $300 = 0, $335 = 0, $336 = 0, $371 = 0, $372 = 0, $407 = 0, $408 = 0, $443 = 0, $444 = 0, $479 = 0, $480 = 0, $515 = 0, $516 = 0, $551 = 0, $552 = 0, $596 = 0, $597 = 0, $628 = 0, $629 = 0, $660 = 0, $661 = 0, $692 = 0, $693 = 0, $778 = 0, $779 = 0, $780 = 0, $802 = 0, $803 = 0, $804 = 0, $836 = 0, $837 = 0, $838 = 0, $870 = 0, $871 = 0, $872 = 0, $903 = 0, $904 = 0, $905 = 0, $954 = 0, $955 = 0, $956 = 0, $996 = 0, $997 = 0, $998 = 0, $1037 = 0, $1038 = 0, $1039 = 0, $1106 = 0, $1107 = 0, $1108 = 0, $1130 = 0, $1131 = 0, $1132 = 0, $1164 = 0, $1165 = 0, $1166 = 0, $1198 = 0, $1199 = 0, $1200 = 0, $1231 = 0, $1232 = 0, $1233 = 0, $1282 = 0, $1283 = 0, $1284 = 0, $1324 = 0, $1325 = 0, $1326 = 0, $1365 = 0, $1366 = 0, $1367 = 0, $1434 = 0, $1435 = 0, $1436 = 0, $1458 = 0, $1459 = 0, $1460 = 0, $1492 = 0, $1493 = 0, $1494 = 0, $1526 = 0, $1527 = 0, $1528 = 0, $1559 = 0, $1560 = 0, $1561 = 0, $1610 = 0, $1611 = 0, $1612 = 0, $1652 = 0, $1653 = 0, $1654 = 0, $1693 = 0, $1694 = 0, $1695 = 0, $1762 = 0, $1763 = 0, $1764 = 0, $1786 = 0, $1787 = 0, $1788 = 0, $1820 = 0, $1821 = 0, $1822 = 0, $1854 = 0, $1855 = 0, $1856 = 0, $1887 = 0, $1888 = 0, $1889 = 0, $1938 = 0, $1939 = 0, $1940 = 0, $1980 = 0, $1981 = 0, $1982 = 0, $2021 = 0, $2022 = 0, $2023 = 0, $2108 = 0;
  $8_1 = global$0 - 1248 | 0;
  label$1 : {
   $2111 = $8_1;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $2111;
  }
  HEAP32[($8_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($8_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($8_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($8_1 + 16 | 0) >> 2] = $3_1;
  HEAP32[($8_1 + 12 | 0) >> 2] = $4_1;
  HEAP32[($8_1 + 8 | 0) >> 2] = $5_1;
  $11_1 = HEAP32[($8_1 + 24 | 0) >> 2] | 0;
  $12_1 = HEAP32[($8_1 + 20 | 0) >> 2] | 0;
  $13_1 = HEAP32[($8_1 + 16 | 0) >> 2] | 0;
  $14_1 = HEAP32[($8_1 + 12 | 0) >> 2] | 0;
  HEAP32[($8_1 + 264 | 0) >> 2] = HEAP32[($8_1 + 28 | 0) >> 2] | 0;
  HEAP32[($8_1 + 260 | 0) >> 2] = $11_1;
  HEAP32[($8_1 + 256 | 0) >> 2] = $12_1;
  HEAP32[($8_1 + 252 | 0) >> 2] = $13_1;
  HEAP32[($8_1 + 248 | 0) >> 2] = $14_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($8_1 + 252 | 0) >> 2] | 0) >>> 0 < 10 >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($8_1 + 244 | 0) >> 2] = HEAP32[($8_1 + 256 | 0) >> 2] | 0;
   HEAP32[($8_1 + 240 | 0) >> 2] = HEAP32[($8_1 + 264 | 0) >> 2] | 0;
   HEAP32[($8_1 + 236 | 0) >> 2] = (HEAP32[($8_1 + 240 | 0) >> 2] | 0) + (HEAP32[($8_1 + 260 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 232 | 0) >> 2] = (HEAP32[($8_1 + 236 | 0) >> 2] | 0) + -3 | 0;
   HEAP32[($8_1 + 228 | 0) >> 2] = (HEAP32[($8_1 + 248 | 0) >> 2] | 0) + 4 | 0;
   HEAP32[($8_1 + 224 | 0) >> 2] = HEAP32[($8_1 + 228 | 0) >> 2] | 0;
   HEAP32[($8_1 + 124 | 0) >> 2] = ($35(HEAP32[($8_1 + 244 | 0) >> 2] | 0 | 0) | 0) & 65535 | 0;
   HEAP32[($8_1 + 120 | 0) >> 2] = ($35((HEAP32[($8_1 + 244 | 0) >> 2] | 0) + 2 | 0 | 0) | 0) & 65535 | 0;
   HEAP32[($8_1 + 116 | 0) >> 2] = ($35((HEAP32[($8_1 + 244 | 0) >> 2] | 0) + 4 | 0 | 0) | 0) & 65535 | 0;
   HEAP32[($8_1 + 112 | 0) >> 2] = (HEAP32[($8_1 + 252 | 0) >> 2] | 0) - ((((HEAP32[($8_1 + 124 | 0) >> 2] | 0) + (HEAP32[($8_1 + 120 | 0) >> 2] | 0) | 0) + (HEAP32[($8_1 + 116 | 0) >> 2] | 0) | 0) + 6 | 0) | 0;
   HEAP32[($8_1 + 108 | 0) >> 2] = (HEAP32[($8_1 + 244 | 0) >> 2] | 0) + 6 | 0;
   HEAP32[($8_1 + 104 | 0) >> 2] = (HEAP32[($8_1 + 108 | 0) >> 2] | 0) + (HEAP32[($8_1 + 124 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 100 | 0) >> 2] = (HEAP32[($8_1 + 104 | 0) >> 2] | 0) + (HEAP32[($8_1 + 120 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 96 | 0) >> 2] = (HEAP32[($8_1 + 100 | 0) >> 2] | 0) + (HEAP32[($8_1 + 116 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 92 | 0) >> 2] = ((HEAP32[($8_1 + 260 | 0) >> 2] | 0) + 3 | 0) >>> 2 | 0;
   HEAP32[($8_1 + 88 | 0) >> 2] = (HEAP32[($8_1 + 240 | 0) >> 2] | 0) + (HEAP32[($8_1 + 92 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 84 | 0) >> 2] = (HEAP32[($8_1 + 88 | 0) >> 2] | 0) + (HEAP32[($8_1 + 92 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 80 | 0) >> 2] = (HEAP32[($8_1 + 84 | 0) >> 2] | 0) + (HEAP32[($8_1 + 92 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 76 | 0) >> 2] = HEAP32[($8_1 + 240 | 0) >> 2] | 0;
   HEAP32[($8_1 + 72 | 0) >> 2] = HEAP32[($8_1 + 88 | 0) >> 2] | 0;
   HEAP32[($8_1 + 68 | 0) >> 2] = HEAP32[($8_1 + 84 | 0) >> 2] | 0;
   HEAP32[($8_1 + 64 | 0) >> 2] = HEAP32[($8_1 + 80 | 0) >> 2] | 0;
   HEAP32[($8_1 + 60 | 0) >> 2] = 1;
   $27($8_1 + 56 | 0 | 0, HEAP32[($8_1 + 248 | 0) >> 2] | 0 | 0);
   HEAP32[($8_1 + 52 | 0) >> 2] = (HEAPU8[($8_1 + 58 | 0) >> 0] | 0) & 255 | 0;
   label$5 : {
    if (!((HEAP32[($8_1 + 112 | 0) >> 2] | 0) >>> 0 > (HEAP32[($8_1 + 252 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($8_1 + 48 | 0) >> 2] = $15($8_1 + 200 | 0 | 0, HEAP32[($8_1 + 108 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 124 | 0) >> 2] | 0 | 0) | 0;
   label$6 : {
    if (!($3(HEAP32[($8_1 + 48 | 0) >> 2] | 0 | 0) | 0)) {
     break label$6
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = HEAP32[($8_1 + 48 | 0) >> 2] | 0;
    break label$3;
   }
   HEAP32[($8_1 + 44 | 0) >> 2] = $15($8_1 + 176 | 0 | 0, HEAP32[($8_1 + 104 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 120 | 0) >> 2] | 0 | 0) | 0;
   label$7 : {
    if (!($3(HEAP32[($8_1 + 44 | 0) >> 2] | 0 | 0) | 0)) {
     break label$7
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = HEAP32[($8_1 + 44 | 0) >> 2] | 0;
    break label$3;
   }
   HEAP32[($8_1 + 40 | 0) >> 2] = $15($8_1 + 152 | 0 | 0, HEAP32[($8_1 + 100 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 116 | 0) >> 2] | 0 | 0) | 0;
   label$8 : {
    if (!($3(HEAP32[($8_1 + 40 | 0) >> 2] | 0 | 0) | 0)) {
     break label$8
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = HEAP32[($8_1 + 40 | 0) >> 2] | 0;
    break label$3;
   }
   HEAP32[($8_1 + 36 | 0) >> 2] = $15($8_1 + 128 | 0 | 0, HEAP32[($8_1 + 96 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 112 | 0) >> 2] | 0 | 0) | 0;
   label$9 : {
    if (!($3(HEAP32[($8_1 + 36 | 0) >> 2] | 0 | 0) | 0)) {
     break label$9
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = HEAP32[($8_1 + 36 | 0) >> 2] | 0;
    break label$3;
   }
   label$10 : {
    label$11 : while (1) {
     if (!((HEAP32[($8_1 + 60 | 0) >> 2] | 0) & ((HEAP32[($8_1 + 64 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 232 | 0) >> 2] | 0) >>> 0 & 1 | 0) | 0)) {
      break label$10
     }
     label$12 : {
      if (!($29() | 0)) {
       break label$12
      }
      $155_1 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $156_1 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 288 | 0) >> 2] = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
      HEAP32[($8_1 + 284 | 0) >> 2] = $8_1 + 200 | 0;
      HEAP32[($8_1 + 280 | 0) >> 2] = $155_1;
      HEAP32[($8_1 + 276 | 0) >> 2] = $156_1;
      HEAP32[($8_1 + 272 | 0) >> 2] = $30(HEAP32[($8_1 + 284 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 276 | 0) >> 2] | 0 | 0) | 0;
      $147_1 = (HEAP32[($8_1 + 280 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 272 | 0) >> 2] | 0) << 2 | 0) | 0;
      $148_1 = HEAP32[($8_1 + 288 | 0) >> 2] | 0;
      $149_1 = HEAPU8[$147_1 >> 0] | 0 | ((HEAPU8[($147_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$148_1 >> 0] = $149_1;
      HEAP8[($148_1 + 1 | 0) >> 0] = $149_1 >>> 8 | 0;
      $31(HEAP32[($8_1 + 284 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 280 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 272 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 76 | 0) >> 2] = (HEAP32[($8_1 + 76 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 280 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 272 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$13 : {
      if (!($29() | 0)) {
       break label$13
      }
      $191 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $192 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 308 | 0) >> 2] = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
      HEAP32[($8_1 + 304 | 0) >> 2] = $8_1 + 176 | 0;
      HEAP32[($8_1 + 300 | 0) >> 2] = $191;
      HEAP32[($8_1 + 296 | 0) >> 2] = $192;
      HEAP32[($8_1 + 292 | 0) >> 2] = $30(HEAP32[($8_1 + 304 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 296 | 0) >> 2] | 0 | 0) | 0;
      $150_1 = (HEAP32[($8_1 + 300 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 292 | 0) >> 2] | 0) << 2 | 0) | 0;
      $151_1 = HEAP32[($8_1 + 308 | 0) >> 2] | 0;
      $152_1 = HEAPU8[$150_1 >> 0] | 0 | ((HEAPU8[($150_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$151_1 >> 0] = $152_1;
      HEAP8[($151_1 + 1 | 0) >> 0] = $152_1 >>> 8 | 0;
      $31(HEAP32[($8_1 + 304 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 300 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 292 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 72 | 0) >> 2] = (HEAP32[($8_1 + 72 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 300 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 292 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$14 : {
      if (!($29() | 0)) {
       break label$14
      }
      $227 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $228 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 328 | 0) >> 2] = HEAP32[($8_1 + 68 | 0) >> 2] | 0;
      HEAP32[($8_1 + 324 | 0) >> 2] = $8_1 + 152 | 0;
      HEAP32[($8_1 + 320 | 0) >> 2] = $227;
      HEAP32[($8_1 + 316 | 0) >> 2] = $228;
      HEAP32[($8_1 + 312 | 0) >> 2] = $30(HEAP32[($8_1 + 324 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 316 | 0) >> 2] | 0 | 0) | 0;
      $153_1 = (HEAP32[($8_1 + 320 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 312 | 0) >> 2] | 0) << 2 | 0) | 0;
      $154_1 = HEAP32[($8_1 + 328 | 0) >> 2] | 0;
      $157_1 = HEAPU8[$153_1 >> 0] | 0 | ((HEAPU8[($153_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$154_1 >> 0] = $157_1;
      HEAP8[($154_1 + 1 | 0) >> 0] = $157_1 >>> 8 | 0;
      $31(HEAP32[($8_1 + 324 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 320 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 312 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 68 | 0) >> 2] = (HEAP32[($8_1 + 68 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 320 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 312 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$15 : {
      if (!($29() | 0)) {
       break label$15
      }
      $263 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $264 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 348 | 0) >> 2] = HEAP32[($8_1 + 64 | 0) >> 2] | 0;
      HEAP32[($8_1 + 344 | 0) >> 2] = $8_1 + 128 | 0;
      HEAP32[($8_1 + 340 | 0) >> 2] = $263;
      HEAP32[($8_1 + 336 | 0) >> 2] = $264;
      HEAP32[($8_1 + 332 | 0) >> 2] = $30(HEAP32[($8_1 + 344 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 336 | 0) >> 2] | 0 | 0) | 0;
      $158_1 = (HEAP32[($8_1 + 340 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 332 | 0) >> 2] | 0) << 2 | 0) | 0;
      $159_1 = HEAP32[($8_1 + 348 | 0) >> 2] | 0;
      $160_1 = HEAPU8[$158_1 >> 0] | 0 | ((HEAPU8[($158_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$159_1 >> 0] = $160_1;
      HEAP8[($159_1 + 1 | 0) >> 0] = $160_1 >>> 8 | 0;
      $31(HEAP32[($8_1 + 344 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 340 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 332 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 64 | 0) >> 2] = (HEAP32[($8_1 + 64 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 340 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 332 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$16 : {
      if ($29() | 0) {
       break label$16
      }
     }
     $299 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $300 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 368 | 0) >> 2] = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
     HEAP32[($8_1 + 364 | 0) >> 2] = $8_1 + 200 | 0;
     HEAP32[($8_1 + 360 | 0) >> 2] = $299;
     HEAP32[($8_1 + 356 | 0) >> 2] = $300;
     HEAP32[($8_1 + 352 | 0) >> 2] = $30(HEAP32[($8_1 + 364 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 356 | 0) >> 2] | 0 | 0) | 0;
     $161 = (HEAP32[($8_1 + 360 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 352 | 0) >> 2] | 0) << 2 | 0) | 0;
     $162 = HEAP32[($8_1 + 368 | 0) >> 2] | 0;
     $163 = HEAPU8[$161 >> 0] | 0 | ((HEAPU8[($161 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$162 >> 0] = $163;
     HEAP8[($162 + 1 | 0) >> 0] = $163 >>> 8 | 0;
     $31(HEAP32[($8_1 + 364 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 360 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 352 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 76 | 0) >> 2] = (HEAP32[($8_1 + 76 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 360 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 352 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     label$17 : {
      if ($29() | 0) {
       break label$17
      }
     }
     $335 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $336 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 388 | 0) >> 2] = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
     HEAP32[($8_1 + 384 | 0) >> 2] = $8_1 + 176 | 0;
     HEAP32[($8_1 + 380 | 0) >> 2] = $335;
     HEAP32[($8_1 + 376 | 0) >> 2] = $336;
     HEAP32[($8_1 + 372 | 0) >> 2] = $30(HEAP32[($8_1 + 384 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 376 | 0) >> 2] | 0 | 0) | 0;
     $164 = (HEAP32[($8_1 + 380 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 372 | 0) >> 2] | 0) << 2 | 0) | 0;
     $165 = HEAP32[($8_1 + 388 | 0) >> 2] | 0;
     $166 = HEAPU8[$164 >> 0] | 0 | ((HEAPU8[($164 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$165 >> 0] = $166;
     HEAP8[($165 + 1 | 0) >> 0] = $166 >>> 8 | 0;
     $31(HEAP32[($8_1 + 384 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 380 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 372 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 72 | 0) >> 2] = (HEAP32[($8_1 + 72 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 380 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 372 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     label$18 : {
      if ($29() | 0) {
       break label$18
      }
     }
     $371 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $372 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 408 | 0) >> 2] = HEAP32[($8_1 + 68 | 0) >> 2] | 0;
     HEAP32[($8_1 + 404 | 0) >> 2] = $8_1 + 152 | 0;
     HEAP32[($8_1 + 400 | 0) >> 2] = $371;
     HEAP32[($8_1 + 396 | 0) >> 2] = $372;
     HEAP32[($8_1 + 392 | 0) >> 2] = $30(HEAP32[($8_1 + 404 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 396 | 0) >> 2] | 0 | 0) | 0;
     $167 = (HEAP32[($8_1 + 400 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 392 | 0) >> 2] | 0) << 2 | 0) | 0;
     $168 = HEAP32[($8_1 + 408 | 0) >> 2] | 0;
     $169 = HEAPU8[$167 >> 0] | 0 | ((HEAPU8[($167 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$168 >> 0] = $169;
     HEAP8[($168 + 1 | 0) >> 0] = $169 >>> 8 | 0;
     $31(HEAP32[($8_1 + 404 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 400 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 392 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 68 | 0) >> 2] = (HEAP32[($8_1 + 68 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 400 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 392 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     label$19 : {
      if ($29() | 0) {
       break label$19
      }
     }
     $407 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $408 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 428 | 0) >> 2] = HEAP32[($8_1 + 64 | 0) >> 2] | 0;
     HEAP32[($8_1 + 424 | 0) >> 2] = $8_1 + 128 | 0;
     HEAP32[($8_1 + 420 | 0) >> 2] = $407;
     HEAP32[($8_1 + 416 | 0) >> 2] = $408;
     HEAP32[($8_1 + 412 | 0) >> 2] = $30(HEAP32[($8_1 + 424 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 416 | 0) >> 2] | 0 | 0) | 0;
     $170 = (HEAP32[($8_1 + 420 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 412 | 0) >> 2] | 0) << 2 | 0) | 0;
     $171 = HEAP32[($8_1 + 428 | 0) >> 2] | 0;
     $172 = HEAPU8[$170 >> 0] | 0 | ((HEAPU8[($170 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$171 >> 0] = $172;
     HEAP8[($171 + 1 | 0) >> 0] = $172 >>> 8 | 0;
     $31(HEAP32[($8_1 + 424 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 420 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 412 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 64 | 0) >> 2] = (HEAP32[($8_1 + 64 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 420 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 412 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     label$20 : {
      if (!($29() | 0)) {
       break label$20
      }
      $443 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $444 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 448 | 0) >> 2] = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
      HEAP32[($8_1 + 444 | 0) >> 2] = $8_1 + 200 | 0;
      HEAP32[($8_1 + 440 | 0) >> 2] = $443;
      HEAP32[($8_1 + 436 | 0) >> 2] = $444;
      HEAP32[($8_1 + 432 | 0) >> 2] = $30(HEAP32[($8_1 + 444 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 436 | 0) >> 2] | 0 | 0) | 0;
      $173 = (HEAP32[($8_1 + 440 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 432 | 0) >> 2] | 0) << 2 | 0) | 0;
      $174 = HEAP32[($8_1 + 448 | 0) >> 2] | 0;
      $175 = HEAPU8[$173 >> 0] | 0 | ((HEAPU8[($173 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$174 >> 0] = $175;
      HEAP8[($174 + 1 | 0) >> 0] = $175 >>> 8 | 0;
      $31(HEAP32[($8_1 + 444 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 440 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 432 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 76 | 0) >> 2] = (HEAP32[($8_1 + 76 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 440 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 432 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$21 : {
      if (!($29() | 0)) {
       break label$21
      }
      $479 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $480 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 468 | 0) >> 2] = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
      HEAP32[($8_1 + 464 | 0) >> 2] = $8_1 + 176 | 0;
      HEAP32[($8_1 + 460 | 0) >> 2] = $479;
      HEAP32[($8_1 + 456 | 0) >> 2] = $480;
      HEAP32[($8_1 + 452 | 0) >> 2] = $30(HEAP32[($8_1 + 464 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 456 | 0) >> 2] | 0 | 0) | 0;
      $176 = (HEAP32[($8_1 + 460 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 452 | 0) >> 2] | 0) << 2 | 0) | 0;
      $177 = HEAP32[($8_1 + 468 | 0) >> 2] | 0;
      $178 = HEAPU8[$176 >> 0] | 0 | ((HEAPU8[($176 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$177 >> 0] = $178;
      HEAP8[($177 + 1 | 0) >> 0] = $178 >>> 8 | 0;
      $31(HEAP32[($8_1 + 464 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 460 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 452 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 72 | 0) >> 2] = (HEAP32[($8_1 + 72 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 460 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 452 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$22 : {
      if (!($29() | 0)) {
       break label$22
      }
      $515 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $516 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 488 | 0) >> 2] = HEAP32[($8_1 + 68 | 0) >> 2] | 0;
      HEAP32[($8_1 + 484 | 0) >> 2] = $8_1 + 152 | 0;
      HEAP32[($8_1 + 480 | 0) >> 2] = $515;
      HEAP32[($8_1 + 476 | 0) >> 2] = $516;
      HEAP32[($8_1 + 472 | 0) >> 2] = $30(HEAP32[($8_1 + 484 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 476 | 0) >> 2] | 0 | 0) | 0;
      $179 = (HEAP32[($8_1 + 480 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 472 | 0) >> 2] | 0) << 2 | 0) | 0;
      $180 = HEAP32[($8_1 + 488 | 0) >> 2] | 0;
      $181 = HEAPU8[$179 >> 0] | 0 | ((HEAPU8[($179 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$180 >> 0] = $181;
      HEAP8[($180 + 1 | 0) >> 0] = $181 >>> 8 | 0;
      $31(HEAP32[($8_1 + 484 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 480 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 472 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 68 | 0) >> 2] = (HEAP32[($8_1 + 68 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 480 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 472 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$23 : {
      if (!($29() | 0)) {
       break label$23
      }
      $551 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
      $552 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 508 | 0) >> 2] = HEAP32[($8_1 + 64 | 0) >> 2] | 0;
      HEAP32[($8_1 + 504 | 0) >> 2] = $8_1 + 128 | 0;
      HEAP32[($8_1 + 500 | 0) >> 2] = $551;
      HEAP32[($8_1 + 496 | 0) >> 2] = $552;
      HEAP32[($8_1 + 492 | 0) >> 2] = $30(HEAP32[($8_1 + 504 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 496 | 0) >> 2] | 0 | 0) | 0;
      $182 = (HEAP32[($8_1 + 500 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 492 | 0) >> 2] | 0) << 2 | 0) | 0;
      $183 = HEAP32[($8_1 + 508 | 0) >> 2] | 0;
      $184 = HEAPU8[$182 >> 0] | 0 | ((HEAPU8[($182 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$183 >> 0] = $184;
      HEAP8[($183 + 1 | 0) >> 0] = $184 >>> 8 | 0;
      $31(HEAP32[($8_1 + 504 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 500 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 492 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 64 | 0) >> 2] = (HEAP32[($8_1 + 64 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 500 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 492 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     $582 = 0;
     $585 = $8_1 + 128 | 0;
     $588 = $8_1 + 152 | 0;
     $591 = $8_1 + 176 | 0;
     $594 = $8_1 + 200 | 0;
     $596 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $597 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 528 | 0) >> 2] = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
     HEAP32[($8_1 + 524 | 0) >> 2] = $594;
     HEAP32[($8_1 + 520 | 0) >> 2] = $596;
     HEAP32[($8_1 + 516 | 0) >> 2] = $597;
     HEAP32[($8_1 + 512 | 0) >> 2] = $30(HEAP32[($8_1 + 524 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 516 | 0) >> 2] | 0 | 0) | 0;
     $185 = (HEAP32[($8_1 + 520 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 512 | 0) >> 2] | 0) << 2 | 0) | 0;
     $186 = HEAP32[($8_1 + 528 | 0) >> 2] | 0;
     $187 = HEAPU8[$185 >> 0] | 0 | ((HEAPU8[($185 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$186 >> 0] = $187;
     HEAP8[($186 + 1 | 0) >> 0] = $187 >>> 8 | 0;
     $31(HEAP32[($8_1 + 524 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 520 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 512 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 76 | 0) >> 2] = (HEAP32[($8_1 + 76 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 520 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 512 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     $628 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $629 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 548 | 0) >> 2] = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
     HEAP32[($8_1 + 544 | 0) >> 2] = $591;
     HEAP32[($8_1 + 540 | 0) >> 2] = $628;
     HEAP32[($8_1 + 536 | 0) >> 2] = $629;
     HEAP32[($8_1 + 532 | 0) >> 2] = $30(HEAP32[($8_1 + 544 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 536 | 0) >> 2] | 0 | 0) | 0;
     $188 = (HEAP32[($8_1 + 540 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 532 | 0) >> 2] | 0) << 2 | 0) | 0;
     $189 = HEAP32[($8_1 + 548 | 0) >> 2] | 0;
     $190 = HEAPU8[$188 >> 0] | 0 | ((HEAPU8[($188 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$189 >> 0] = $190;
     HEAP8[($189 + 1 | 0) >> 0] = $190 >>> 8 | 0;
     $31(HEAP32[($8_1 + 544 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 540 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 532 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 72 | 0) >> 2] = (HEAP32[($8_1 + 72 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 540 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 532 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     $660 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $661 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 568 | 0) >> 2] = HEAP32[($8_1 + 68 | 0) >> 2] | 0;
     HEAP32[($8_1 + 564 | 0) >> 2] = $588;
     HEAP32[($8_1 + 560 | 0) >> 2] = $660;
     HEAP32[($8_1 + 556 | 0) >> 2] = $661;
     HEAP32[($8_1 + 552 | 0) >> 2] = $30(HEAP32[($8_1 + 564 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 556 | 0) >> 2] | 0 | 0) | 0;
     $193 = (HEAP32[($8_1 + 560 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 552 | 0) >> 2] | 0) << 2 | 0) | 0;
     $194 = HEAP32[($8_1 + 568 | 0) >> 2] | 0;
     $195 = HEAPU8[$193 >> 0] | 0 | ((HEAPU8[($193 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$194 >> 0] = $195;
     HEAP8[($194 + 1 | 0) >> 0] = $195 >>> 8 | 0;
     $31(HEAP32[($8_1 + 564 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 560 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 552 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 68 | 0) >> 2] = (HEAP32[($8_1 + 68 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 560 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 552 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     $692 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
     $693 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
     HEAP32[($8_1 + 588 | 0) >> 2] = HEAP32[($8_1 + 64 | 0) >> 2] | 0;
     HEAP32[($8_1 + 584 | 0) >> 2] = $585;
     HEAP32[($8_1 + 580 | 0) >> 2] = $692;
     HEAP32[($8_1 + 576 | 0) >> 2] = $693;
     HEAP32[($8_1 + 572 | 0) >> 2] = $30(HEAP32[($8_1 + 584 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 576 | 0) >> 2] | 0 | 0) | 0;
     $196 = (HEAP32[($8_1 + 580 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 572 | 0) >> 2] | 0) << 2 | 0) | 0;
     $197 = HEAP32[($8_1 + 588 | 0) >> 2] | 0;
     $198 = HEAPU8[$196 >> 0] | 0 | ((HEAPU8[($196 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$197 >> 0] = $198;
     HEAP8[($197 + 1 | 0) >> 0] = $198 >>> 8 | 0;
     $31(HEAP32[($8_1 + 584 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 580 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 572 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 64 | 0) >> 2] = (HEAP32[($8_1 + 64 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 580 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 572 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     HEAP32[($8_1 + 60 | 0) >> 2] = (((($36($594 | 0) | 0 | 0) == ($582 | 0) & 1 | 0) & (($36($591 | 0) | 0 | 0) == ($582 | 0) & 1 | 0) | 0) & (($36($588 | 0) | 0 | 0) == ($582 | 0) & 1 | 0) | 0) & (($36($585 | 0) | 0 | 0) == ($582 | 0) & 1 | 0) | 0;
     continue label$11;
    };
   }
   label$24 : {
    if (!((HEAP32[($8_1 + 76 | 0) >> 2] | 0) >>> 0 > (HEAP32[($8_1 + 88 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$24
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   label$25 : {
    if (!((HEAP32[($8_1 + 72 | 0) >> 2] | 0) >>> 0 > (HEAP32[($8_1 + 84 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$25
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   label$26 : {
    if (!((HEAP32[($8_1 + 68 | 0) >> 2] | 0) >>> 0 > (HEAP32[($8_1 + 80 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$26
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   $778 = HEAP32[($8_1 + 88 | 0) >> 2] | 0;
   $779 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
   $780 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
   HEAP32[($8_1 + 612 | 0) >> 2] = HEAP32[($8_1 + 76 | 0) >> 2] | 0;
   HEAP32[($8_1 + 608 | 0) >> 2] = $8_1 + 200 | 0;
   HEAP32[($8_1 + 604 | 0) >> 2] = $778;
   HEAP32[($8_1 + 600 | 0) >> 2] = $779;
   HEAP32[($8_1 + 596 | 0) >> 2] = $780;
   HEAP32[($8_1 + 592 | 0) >> 2] = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
   label$27 : {
    label$28 : while (1) {
     if (!((($17(HEAP32[($8_1 + 608 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 612 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($8_1 + 604 | 0) >> 2] | 0) + -3 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$27
     }
     label$29 : {
      if (!($29() | 0)) {
       break label$29
      }
      $802 = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
      $803 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
      $804 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
      HEAP32[($8_1 + 632 | 0) >> 2] = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
      HEAP32[($8_1 + 628 | 0) >> 2] = $802;
      HEAP32[($8_1 + 624 | 0) >> 2] = $803;
      HEAP32[($8_1 + 620 | 0) >> 2] = $804;
      HEAP32[($8_1 + 616 | 0) >> 2] = $30(HEAP32[($8_1 + 628 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 620 | 0) >> 2] | 0 | 0) | 0;
      $199 = (HEAP32[($8_1 + 624 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 616 | 0) >> 2] | 0) << 2 | 0) | 0;
      $200 = HEAP32[($8_1 + 632 | 0) >> 2] | 0;
      $201 = HEAPU8[$199 >> 0] | 0 | ((HEAPU8[($199 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$200 >> 0] = $201;
      HEAP8[($200 + 1 | 0) >> 0] = $201 >>> 8 | 0;
      $31(HEAP32[($8_1 + 628 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 624 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 616 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 612 | 0) >> 2] = (HEAP32[($8_1 + 612 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 624 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 616 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$30 : {
      if ($29() | 0) {
       break label$30
      }
     }
     $836 = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
     $837 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
     $838 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
     HEAP32[($8_1 + 652 | 0) >> 2] = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
     HEAP32[($8_1 + 648 | 0) >> 2] = $836;
     HEAP32[($8_1 + 644 | 0) >> 2] = $837;
     HEAP32[($8_1 + 640 | 0) >> 2] = $838;
     HEAP32[($8_1 + 636 | 0) >> 2] = $30(HEAP32[($8_1 + 648 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 640 | 0) >> 2] | 0 | 0) | 0;
     $202 = (HEAP32[($8_1 + 644 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 636 | 0) >> 2] | 0) << 2 | 0) | 0;
     $203 = HEAP32[($8_1 + 652 | 0) >> 2] | 0;
     $204 = HEAPU8[$202 >> 0] | 0 | ((HEAPU8[($202 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$203 >> 0] = $204;
     HEAP8[($203 + 1 | 0) >> 0] = $204 >>> 8 | 0;
     $31(HEAP32[($8_1 + 648 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 644 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 636 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 612 | 0) >> 2] = (HEAP32[($8_1 + 612 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 644 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 636 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     label$31 : {
      if (!($29() | 0)) {
       break label$31
      }
      $870 = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
      $871 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
      $872 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
      HEAP32[($8_1 + 672 | 0) >> 2] = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
      HEAP32[($8_1 + 668 | 0) >> 2] = $870;
      HEAP32[($8_1 + 664 | 0) >> 2] = $871;
      HEAP32[($8_1 + 660 | 0) >> 2] = $872;
      HEAP32[($8_1 + 656 | 0) >> 2] = $30(HEAP32[($8_1 + 668 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 660 | 0) >> 2] | 0 | 0) | 0;
      $205 = (HEAP32[($8_1 + 664 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 656 | 0) >> 2] | 0) << 2 | 0) | 0;
      $206 = HEAP32[($8_1 + 672 | 0) >> 2] | 0;
      $207 = HEAPU8[$205 >> 0] | 0 | ((HEAPU8[($205 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$206 >> 0] = $207;
      HEAP8[($206 + 1 | 0) >> 0] = $207 >>> 8 | 0;
      $31(HEAP32[($8_1 + 668 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 664 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 656 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 612 | 0) >> 2] = (HEAP32[($8_1 + 612 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 664 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 656 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     $903 = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
     $904 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
     $905 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
     HEAP32[($8_1 + 692 | 0) >> 2] = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
     HEAP32[($8_1 + 688 | 0) >> 2] = $903;
     HEAP32[($8_1 + 684 | 0) >> 2] = $904;
     HEAP32[($8_1 + 680 | 0) >> 2] = $905;
     HEAP32[($8_1 + 676 | 0) >> 2] = $30(HEAP32[($8_1 + 688 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 680 | 0) >> 2] | 0 | 0) | 0;
     $208 = (HEAP32[($8_1 + 684 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 676 | 0) >> 2] | 0) << 2 | 0) | 0;
     $209 = HEAP32[($8_1 + 692 | 0) >> 2] | 0;
     $210 = HEAPU8[$208 >> 0] | 0 | ((HEAPU8[($208 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$209 >> 0] = $210;
     HEAP8[($209 + 1 | 0) >> 0] = $210 >>> 8 | 0;
     $31(HEAP32[($8_1 + 688 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 684 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 676 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 612 | 0) >> 2] = (HEAP32[($8_1 + 612 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 684 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 676 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$28;
    };
   }
   label$32 : {
    label$33 : while (1) {
     if (!((($17(HEAP32[($8_1 + 608 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 612 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($8_1 + 604 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$32
     }
     $954 = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
     $955 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
     $956 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
     HEAP32[($8_1 + 712 | 0) >> 2] = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
     HEAP32[($8_1 + 708 | 0) >> 2] = $954;
     HEAP32[($8_1 + 704 | 0) >> 2] = $955;
     HEAP32[($8_1 + 700 | 0) >> 2] = $956;
     HEAP32[($8_1 + 696 | 0) >> 2] = $30(HEAP32[($8_1 + 708 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 700 | 0) >> 2] | 0 | 0) | 0;
     $211 = (HEAP32[($8_1 + 704 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 696 | 0) >> 2] | 0) << 2 | 0) | 0;
     $212 = HEAP32[($8_1 + 712 | 0) >> 2] | 0;
     $213 = HEAPU8[$211 >> 0] | 0 | ((HEAPU8[($211 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$212 >> 0] = $213;
     HEAP8[($212 + 1 | 0) >> 0] = $213 >>> 8 | 0;
     $31(HEAP32[($8_1 + 708 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 704 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 696 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 612 | 0) >> 2] = (HEAP32[($8_1 + 612 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 704 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 696 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$33;
    };
   }
   label$34 : {
    label$35 : while (1) {
     if (!((HEAP32[($8_1 + 612 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($8_1 + 604 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0)) {
      break label$34
     }
     $996 = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
     $997 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
     $998 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
     HEAP32[($8_1 + 732 | 0) >> 2] = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
     HEAP32[($8_1 + 728 | 0) >> 2] = $996;
     HEAP32[($8_1 + 724 | 0) >> 2] = $997;
     HEAP32[($8_1 + 720 | 0) >> 2] = $998;
     HEAP32[($8_1 + 716 | 0) >> 2] = $30(HEAP32[($8_1 + 728 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 720 | 0) >> 2] | 0 | 0) | 0;
     $214 = (HEAP32[($8_1 + 724 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 716 | 0) >> 2] | 0) << 2 | 0) | 0;
     $215 = HEAP32[($8_1 + 732 | 0) >> 2] | 0;
     $216 = HEAPU8[$214 >> 0] | 0 | ((HEAPU8[($214 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$215 >> 0] = $216;
     HEAP8[($215 + 1 | 0) >> 0] = $216 >>> 8 | 0;
     $31(HEAP32[($8_1 + 728 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 724 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 716 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 612 | 0) >> 2] = (HEAP32[($8_1 + 612 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 724 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 716 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$35;
    };
   }
   label$36 : {
    if (!((HEAP32[($8_1 + 612 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 604 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$36
    }
    $1037 = HEAP32[($8_1 + 608 | 0) >> 2] | 0;
    $1038 = HEAP32[($8_1 + 600 | 0) >> 2] | 0;
    $1039 = HEAP32[($8_1 + 596 | 0) >> 2] | 0;
    HEAP32[($8_1 + 752 | 0) >> 2] = HEAP32[($8_1 + 612 | 0) >> 2] | 0;
    HEAP32[($8_1 + 748 | 0) >> 2] = $1037;
    HEAP32[($8_1 + 744 | 0) >> 2] = $1038;
    HEAP32[($8_1 + 740 | 0) >> 2] = $1039;
    HEAP32[($8_1 + 736 | 0) >> 2] = $30(HEAP32[($8_1 + 748 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 740 | 0) >> 2] | 0 | 0) | 0;
    HEAP8[(HEAP32[($8_1 + 752 | 0) >> 2] | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 744 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 736 | 0) >> 2] | 0) << 2 | 0) | 0) >> 0] | 0;
    label$37 : {
     label$38 : {
      if (!(((HEAPU8[(((HEAP32[($8_1 + 744 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 736 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0 | 0) == (1 | 0) & 1 | 0)) {
       break label$38
      }
      $31(HEAP32[($8_1 + 748 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 744 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 736 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      break label$37;
     }
     label$39 : {
      if (!((HEAP32[((HEAP32[($8_1 + 748 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 < 32 >>> 0 & 1 | 0)) {
       break label$39
      }
      $31(HEAP32[($8_1 + 748 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 744 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 736 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      label$40 : {
       if (!((HEAP32[((HEAP32[($8_1 + 748 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 > 32 >>> 0 & 1 | 0)) {
        break label$40
       }
       HEAP32[((HEAP32[($8_1 + 748 | 0) >> 2] | 0) + 4 | 0) >> 2] = 32;
      }
     }
    }
    HEAP32[($8_1 + 612 | 0) >> 2] = (HEAP32[($8_1 + 612 | 0) >> 2] | 0) + 1 | 0;
   }
   $1106 = HEAP32[($8_1 + 84 | 0) >> 2] | 0;
   $1107 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
   $1108 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
   HEAP32[($8_1 + 776 | 0) >> 2] = HEAP32[($8_1 + 72 | 0) >> 2] | 0;
   HEAP32[($8_1 + 772 | 0) >> 2] = $8_1 + 176 | 0;
   HEAP32[($8_1 + 768 | 0) >> 2] = $1106;
   HEAP32[($8_1 + 764 | 0) >> 2] = $1107;
   HEAP32[($8_1 + 760 | 0) >> 2] = $1108;
   HEAP32[($8_1 + 756 | 0) >> 2] = HEAP32[($8_1 + 776 | 0) >> 2] | 0;
   label$41 : {
    label$42 : while (1) {
     if (!((($17(HEAP32[($8_1 + 772 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 776 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($8_1 + 768 | 0) >> 2] | 0) + -3 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$41
     }
     label$43 : {
      if (!($29() | 0)) {
       break label$43
      }
      $1130 = HEAP32[($8_1 + 772 | 0) >> 2] | 0;
      $1131 = HEAP32[($8_1 + 764 | 0) >> 2] | 0;
      $1132 = HEAP32[($8_1 + 760 | 0) >> 2] | 0;
      HEAP32[($8_1 + 796 | 0) >> 2] = HEAP32[($8_1 + 776 | 0) >> 2] | 0;
      HEAP32[($8_1 + 792 | 0) >> 2] = $1130;
      HEAP32[($8_1 + 788 | 0) >> 2] = $1131;
      HEAP32[($8_1 + 784 | 0) >> 2] = $1132;
      HEAP32[($8_1 + 780 | 0) >> 2] = $30(HEAP32[($8_1 + 792 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 784 | 0) >> 2] | 0 | 0) | 0;
      $217 = (HEAP32[($8_1 + 788 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 780 | 0) >> 2] | 0) << 2 | 0) | 0;
      $218 = HEAP32[($8_1 + 796 | 0) >> 2] | 0;
      $219 = HEAPU8[$217 >> 0] | 0 | ((HEAPU8[($217 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$218 >> 0] = $219;
      HEAP8[($218 + 1 | 0) >> 0] = $219 >>> 8 | 0;
      $31(HEAP32[($8_1 + 792 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 788 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 780 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 776 | 0) >> 2] = (HEAP32[($8_1 + 776 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 788 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 780 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$44 : {
      if ($29() | 0) {
       break label$44
      }
     }
     $1164 = HEAP32[($8_1 + 772 | 0) >> 2] | 0;
     $1165 = HEAP32[($8_1 + 764 | 0) >> 2] | 0;
     $1166 = HEAP32[($8_1 + 760 | 0) >> 2] | 0;
     HEAP32[($8_1 + 816 | 0) >> 2] = HEAP32[($8_1 + 776 | 0) >> 2] | 0;
     HEAP32[($8_1 + 812 | 0) >> 2] = $1164;
     HEAP32[($8_1 + 808 | 0) >> 2] = $1165;
     HEAP32[($8_1 + 804 | 0) >> 2] = $1166;
     HEAP32[($8_1 + 800 | 0) >> 2] = $30(HEAP32[($8_1 + 812 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 804 | 0) >> 2] | 0 | 0) | 0;
     $220 = (HEAP32[($8_1 + 808 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 800 | 0) >> 2] | 0) << 2 | 0) | 0;
     $221 = HEAP32[($8_1 + 816 | 0) >> 2] | 0;
     $222 = HEAPU8[$220 >> 0] | 0 | ((HEAPU8[($220 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$221 >> 0] = $222;
     HEAP8[($221 + 1 | 0) >> 0] = $222 >>> 8 | 0;
     $31(HEAP32[($8_1 + 812 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 808 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 800 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 776 | 0) >> 2] = (HEAP32[($8_1 + 776 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 808 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 800 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     label$45 : {
      if (!($29() | 0)) {
       break label$45
      }
      $1198 = HEAP32[($8_1 + 772 | 0) >> 2] | 0;
      $1199 = HEAP32[($8_1 + 764 | 0) >> 2] | 0;
      $1200 = HEAP32[($8_1 + 760 | 0) >> 2] | 0;
      HEAP32[($8_1 + 836 | 0) >> 2] = HEAP32[($8_1 + 776 | 0) >> 2] | 0;
      HEAP32[($8_1 + 832 | 0) >> 2] = $1198;
      HEAP32[($8_1 + 828 | 0) >> 2] = $1199;
      HEAP32[($8_1 + 824 | 0) >> 2] = $1200;
      HEAP32[($8_1 + 820 | 0) >> 2] = $30(HEAP32[($8_1 + 832 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 824 | 0) >> 2] | 0 | 0) | 0;
      $223 = (HEAP32[($8_1 + 828 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 820 | 0) >> 2] | 0) << 2 | 0) | 0;
      $224 = HEAP32[($8_1 + 836 | 0) >> 2] | 0;
      $225 = HEAPU8[$223 >> 0] | 0 | ((HEAPU8[($223 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$224 >> 0] = $225;
      HEAP8[($224 + 1 | 0) >> 0] = $225 >>> 8 | 0;
      $31(HEAP32[($8_1 + 832 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 828 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 820 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 776 | 0) >> 2] = (HEAP32[($8_1 + 776 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 828 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 820 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     $1231 = HEAP32[($8_1 + 772 | 0) >> 2] | 0;
     $1232 = HEAP32[($8_1 + 764 | 0) >> 2] | 0;
     $1233 = HEAP32[($8_1 + 760 | 0) >> 2] | 0;
     HEAP32[($8_1 + 856 | 0) >> 2] = HEAP32[($8_1 + 776 | 0) >> 2] | 0;
     HEAP32[($8_1 + 852 | 0) >> 2] = $1231;
     HEAP32[($8_1 + 848 | 0) >> 2] = $1232;
     HEAP32[($8_1 + 844 | 0) >> 2] = $1233;
     HEAP32[($8_1 + 840 | 0) >> 2] = $30(HEAP32[($8_1 + 852 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 844 | 0) >> 2] | 0 | 0) | 0;
     $226 = (HEAP32[($8_1 + 848 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 840 | 0) >> 2] | 0) << 2 | 0) | 0;
     $229 = HEAP32[($8_1 + 856 | 0) >> 2] | 0;
     $230 = HEAPU8[$226 >> 0] | 0 | ((HEAPU8[($226 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$229 >> 0] = $230;
     HEAP8[($229 + 1 | 0) >> 0] = $230 >>> 8 | 0;
     $31(HEAP32[($8_1 + 852 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 848 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 840 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 776 | 0) >> 2] = (HEAP32[($8_1 + 776 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 848 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 840 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$42;
    };
   }
   label$46 : {
    label$47 : while (1) {
     if (!((($17(HEAP32[($8_1 + 772 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 776 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($8_1 + 768 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$46
     }
     $1282 = HEAP32[($8_1 + 772 | 0) >> 2] | 0;
     $1283 = HEAP32[($8_1 + 764 | 0) >> 2] | 0;
     $1284 = HEAP32[($8_1 + 760 | 0) >> 2] | 0;
     HEAP32[($8_1 + 876 | 0) >> 2] = HEAP32[($8_1 + 776 | 0) >> 2] | 0;
     HEAP32[($8_1 + 872 | 0) >> 2] = $1282;
     HEAP32[($8_1 + 868 | 0) >> 2] = $1283;
     HEAP32[($8_1 + 864 | 0) >> 2] = $1284;
     HEAP32[($8_1 + 860 | 0) >> 2] = $30(HEAP32[($8_1 + 872 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 864 | 0) >> 2] | 0 | 0) | 0;
     $231 = (HEAP32[($8_1 + 868 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 860 | 0) >> 2] | 0) << 2 | 0) | 0;
     $232 = HEAP32[($8_1 + 876 | 0) >> 2] | 0;
     $233 = HEAPU8[$231 >> 0] | 0 | ((HEAPU8[($231 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$232 >> 0] = $233;
     HEAP8[($232 + 1 | 0) >> 0] = $233 >>> 8 | 0;
     $31(HEAP32[($8_1 + 872 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 868 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 860 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 776 | 0) >> 2] = (HEAP32[($8_1 + 776 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 868 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 860 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$47;
    };
   }
   label$48 : {
    label$49 : while (1) {
     if (!((HEAP32[($8_1 + 776 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($8_1 + 768 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0)) {
      break label$48
     }
     $1324 = HEAP32[($8_1 + 772 | 0) >> 2] | 0;
     $1325 = HEAP32[($8_1 + 764 | 0) >> 2] | 0;
     $1326 = HEAP32[($8_1 + 760 | 0) >> 2] | 0;
     HEAP32[($8_1 + 896 | 0) >> 2] = HEAP32[($8_1 + 776 | 0) >> 2] | 0;
     HEAP32[($8_1 + 892 | 0) >> 2] = $1324;
     HEAP32[($8_1 + 888 | 0) >> 2] = $1325;
     HEAP32[($8_1 + 884 | 0) >> 2] = $1326;
     HEAP32[($8_1 + 880 | 0) >> 2] = $30(HEAP32[($8_1 + 892 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 884 | 0) >> 2] | 0 | 0) | 0;
     $234 = (HEAP32[($8_1 + 888 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 880 | 0) >> 2] | 0) << 2 | 0) | 0;
     $235 = HEAP32[($8_1 + 896 | 0) >> 2] | 0;
     $236 = HEAPU8[$234 >> 0] | 0 | ((HEAPU8[($234 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$235 >> 0] = $236;
     HEAP8[($235 + 1 | 0) >> 0] = $236 >>> 8 | 0;
     $31(HEAP32[($8_1 + 892 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 888 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 880 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 776 | 0) >> 2] = (HEAP32[($8_1 + 776 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 888 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 880 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$49;
    };
   }
   label$50 : {
    if (!((HEAP32[($8_1 + 776 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 768 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$50
    }
    $1365 = HEAP32[($8_1 + 772 | 0) >> 2] | 0;
    $1366 = HEAP32[($8_1 + 764 | 0) >> 2] | 0;
    $1367 = HEAP32[($8_1 + 760 | 0) >> 2] | 0;
    HEAP32[($8_1 + 916 | 0) >> 2] = HEAP32[($8_1 + 776 | 0) >> 2] | 0;
    HEAP32[($8_1 + 912 | 0) >> 2] = $1365;
    HEAP32[($8_1 + 908 | 0) >> 2] = $1366;
    HEAP32[($8_1 + 904 | 0) >> 2] = $1367;
    HEAP32[($8_1 + 900 | 0) >> 2] = $30(HEAP32[($8_1 + 912 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 904 | 0) >> 2] | 0 | 0) | 0;
    HEAP8[(HEAP32[($8_1 + 916 | 0) >> 2] | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 908 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 900 | 0) >> 2] | 0) << 2 | 0) | 0) >> 0] | 0;
    label$51 : {
     label$52 : {
      if (!(((HEAPU8[(((HEAP32[($8_1 + 908 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 900 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0 | 0) == (1 | 0) & 1 | 0)) {
       break label$52
      }
      $31(HEAP32[($8_1 + 912 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 908 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 900 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      break label$51;
     }
     label$53 : {
      if (!((HEAP32[((HEAP32[($8_1 + 912 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 < 32 >>> 0 & 1 | 0)) {
       break label$53
      }
      $31(HEAP32[($8_1 + 912 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 908 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 900 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      label$54 : {
       if (!((HEAP32[((HEAP32[($8_1 + 912 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 > 32 >>> 0 & 1 | 0)) {
        break label$54
       }
       HEAP32[((HEAP32[($8_1 + 912 | 0) >> 2] | 0) + 4 | 0) >> 2] = 32;
      }
     }
    }
    HEAP32[($8_1 + 776 | 0) >> 2] = (HEAP32[($8_1 + 776 | 0) >> 2] | 0) + 1 | 0;
   }
   $1434 = HEAP32[($8_1 + 80 | 0) >> 2] | 0;
   $1435 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
   $1436 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
   HEAP32[($8_1 + 940 | 0) >> 2] = HEAP32[($8_1 + 68 | 0) >> 2] | 0;
   HEAP32[($8_1 + 936 | 0) >> 2] = $8_1 + 152 | 0;
   HEAP32[($8_1 + 932 | 0) >> 2] = $1434;
   HEAP32[($8_1 + 928 | 0) >> 2] = $1435;
   HEAP32[($8_1 + 924 | 0) >> 2] = $1436;
   HEAP32[($8_1 + 920 | 0) >> 2] = HEAP32[($8_1 + 940 | 0) >> 2] | 0;
   label$55 : {
    label$56 : while (1) {
     if (!((($17(HEAP32[($8_1 + 936 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 940 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($8_1 + 932 | 0) >> 2] | 0) + -3 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$55
     }
     label$57 : {
      if (!($29() | 0)) {
       break label$57
      }
      $1458 = HEAP32[($8_1 + 936 | 0) >> 2] | 0;
      $1459 = HEAP32[($8_1 + 928 | 0) >> 2] | 0;
      $1460 = HEAP32[($8_1 + 924 | 0) >> 2] | 0;
      HEAP32[($8_1 + 960 | 0) >> 2] = HEAP32[($8_1 + 940 | 0) >> 2] | 0;
      HEAP32[($8_1 + 956 | 0) >> 2] = $1458;
      HEAP32[($8_1 + 952 | 0) >> 2] = $1459;
      HEAP32[($8_1 + 948 | 0) >> 2] = $1460;
      HEAP32[($8_1 + 944 | 0) >> 2] = $30(HEAP32[($8_1 + 956 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 948 | 0) >> 2] | 0 | 0) | 0;
      $237 = (HEAP32[($8_1 + 952 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 944 | 0) >> 2] | 0) << 2 | 0) | 0;
      $238 = HEAP32[($8_1 + 960 | 0) >> 2] | 0;
      $239 = HEAPU8[$237 >> 0] | 0 | ((HEAPU8[($237 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$238 >> 0] = $239;
      HEAP8[($238 + 1 | 0) >> 0] = $239 >>> 8 | 0;
      $31(HEAP32[($8_1 + 956 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 952 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 944 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 940 | 0) >> 2] = (HEAP32[($8_1 + 940 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 952 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 944 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$58 : {
      if ($29() | 0) {
       break label$58
      }
     }
     $1492 = HEAP32[($8_1 + 936 | 0) >> 2] | 0;
     $1493 = HEAP32[($8_1 + 928 | 0) >> 2] | 0;
     $1494 = HEAP32[($8_1 + 924 | 0) >> 2] | 0;
     HEAP32[($8_1 + 980 | 0) >> 2] = HEAP32[($8_1 + 940 | 0) >> 2] | 0;
     HEAP32[($8_1 + 976 | 0) >> 2] = $1492;
     HEAP32[($8_1 + 972 | 0) >> 2] = $1493;
     HEAP32[($8_1 + 968 | 0) >> 2] = $1494;
     HEAP32[($8_1 + 964 | 0) >> 2] = $30(HEAP32[($8_1 + 976 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 968 | 0) >> 2] | 0 | 0) | 0;
     $240 = (HEAP32[($8_1 + 972 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 964 | 0) >> 2] | 0) << 2 | 0) | 0;
     $241 = HEAP32[($8_1 + 980 | 0) >> 2] | 0;
     $242 = HEAPU8[$240 >> 0] | 0 | ((HEAPU8[($240 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$241 >> 0] = $242;
     HEAP8[($241 + 1 | 0) >> 0] = $242 >>> 8 | 0;
     $31(HEAP32[($8_1 + 976 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 972 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 964 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 940 | 0) >> 2] = (HEAP32[($8_1 + 940 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 972 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 964 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     label$59 : {
      if (!($29() | 0)) {
       break label$59
      }
      $1526 = HEAP32[($8_1 + 936 | 0) >> 2] | 0;
      $1527 = HEAP32[($8_1 + 928 | 0) >> 2] | 0;
      $1528 = HEAP32[($8_1 + 924 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1e3 | 0) >> 2] = HEAP32[($8_1 + 940 | 0) >> 2] | 0;
      HEAP32[($8_1 + 996 | 0) >> 2] = $1526;
      HEAP32[($8_1 + 992 | 0) >> 2] = $1527;
      HEAP32[($8_1 + 988 | 0) >> 2] = $1528;
      HEAP32[($8_1 + 984 | 0) >> 2] = $30(HEAP32[($8_1 + 996 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 988 | 0) >> 2] | 0 | 0) | 0;
      $243 = (HEAP32[($8_1 + 992 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 984 | 0) >> 2] | 0) << 2 | 0) | 0;
      $244 = HEAP32[($8_1 + 1e3 | 0) >> 2] | 0;
      $245 = HEAPU8[$243 >> 0] | 0 | ((HEAPU8[($243 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$244 >> 0] = $245;
      HEAP8[($244 + 1 | 0) >> 0] = $245 >>> 8 | 0;
      $31(HEAP32[($8_1 + 996 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 992 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 984 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 940 | 0) >> 2] = (HEAP32[($8_1 + 940 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 992 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 984 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     $1559 = HEAP32[($8_1 + 936 | 0) >> 2] | 0;
     $1560 = HEAP32[($8_1 + 928 | 0) >> 2] | 0;
     $1561 = HEAP32[($8_1 + 924 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1020 | 0) >> 2] = HEAP32[($8_1 + 940 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1016 | 0) >> 2] = $1559;
     HEAP32[($8_1 + 1012 | 0) >> 2] = $1560;
     HEAP32[($8_1 + 1008 | 0) >> 2] = $1561;
     HEAP32[($8_1 + 1004 | 0) >> 2] = $30(HEAP32[($8_1 + 1016 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1008 | 0) >> 2] | 0 | 0) | 0;
     $246 = (HEAP32[($8_1 + 1012 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1004 | 0) >> 2] | 0) << 2 | 0) | 0;
     $247 = HEAP32[($8_1 + 1020 | 0) >> 2] | 0;
     $248 = HEAPU8[$246 >> 0] | 0 | ((HEAPU8[($246 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$247 >> 0] = $248;
     HEAP8[($247 + 1 | 0) >> 0] = $248 >>> 8 | 0;
     $31(HEAP32[($8_1 + 1016 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1012 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1004 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 940 | 0) >> 2] = (HEAP32[($8_1 + 940 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 1012 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1004 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$56;
    };
   }
   label$60 : {
    label$61 : while (1) {
     if (!((($17(HEAP32[($8_1 + 936 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 940 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($8_1 + 932 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$60
     }
     $1610 = HEAP32[($8_1 + 936 | 0) >> 2] | 0;
     $1611 = HEAP32[($8_1 + 928 | 0) >> 2] | 0;
     $1612 = HEAP32[($8_1 + 924 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1040 | 0) >> 2] = HEAP32[($8_1 + 940 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1036 | 0) >> 2] = $1610;
     HEAP32[($8_1 + 1032 | 0) >> 2] = $1611;
     HEAP32[($8_1 + 1028 | 0) >> 2] = $1612;
     HEAP32[($8_1 + 1024 | 0) >> 2] = $30(HEAP32[($8_1 + 1036 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1028 | 0) >> 2] | 0 | 0) | 0;
     $249 = (HEAP32[($8_1 + 1032 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1024 | 0) >> 2] | 0) << 2 | 0) | 0;
     $250 = HEAP32[($8_1 + 1040 | 0) >> 2] | 0;
     $251 = HEAPU8[$249 >> 0] | 0 | ((HEAPU8[($249 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$250 >> 0] = $251;
     HEAP8[($250 + 1 | 0) >> 0] = $251 >>> 8 | 0;
     $31(HEAP32[($8_1 + 1036 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1032 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1024 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 940 | 0) >> 2] = (HEAP32[($8_1 + 940 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 1032 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1024 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$61;
    };
   }
   label$62 : {
    label$63 : while (1) {
     if (!((HEAP32[($8_1 + 940 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($8_1 + 932 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0)) {
      break label$62
     }
     $1652 = HEAP32[($8_1 + 936 | 0) >> 2] | 0;
     $1653 = HEAP32[($8_1 + 928 | 0) >> 2] | 0;
     $1654 = HEAP32[($8_1 + 924 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1060 | 0) >> 2] = HEAP32[($8_1 + 940 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1056 | 0) >> 2] = $1652;
     HEAP32[($8_1 + 1052 | 0) >> 2] = $1653;
     HEAP32[($8_1 + 1048 | 0) >> 2] = $1654;
     HEAP32[($8_1 + 1044 | 0) >> 2] = $30(HEAP32[($8_1 + 1056 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1048 | 0) >> 2] | 0 | 0) | 0;
     $252 = (HEAP32[($8_1 + 1052 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1044 | 0) >> 2] | 0) << 2 | 0) | 0;
     $253 = HEAP32[($8_1 + 1060 | 0) >> 2] | 0;
     $254 = HEAPU8[$252 >> 0] | 0 | ((HEAPU8[($252 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$253 >> 0] = $254;
     HEAP8[($253 + 1 | 0) >> 0] = $254 >>> 8 | 0;
     $31(HEAP32[($8_1 + 1056 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1052 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1044 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 940 | 0) >> 2] = (HEAP32[($8_1 + 940 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 1052 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1044 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$63;
    };
   }
   label$64 : {
    if (!((HEAP32[($8_1 + 940 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 932 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$64
    }
    $1693 = HEAP32[($8_1 + 936 | 0) >> 2] | 0;
    $1694 = HEAP32[($8_1 + 928 | 0) >> 2] | 0;
    $1695 = HEAP32[($8_1 + 924 | 0) >> 2] | 0;
    HEAP32[($8_1 + 1080 | 0) >> 2] = HEAP32[($8_1 + 940 | 0) >> 2] | 0;
    HEAP32[($8_1 + 1076 | 0) >> 2] = $1693;
    HEAP32[($8_1 + 1072 | 0) >> 2] = $1694;
    HEAP32[($8_1 + 1068 | 0) >> 2] = $1695;
    HEAP32[($8_1 + 1064 | 0) >> 2] = $30(HEAP32[($8_1 + 1076 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1068 | 0) >> 2] | 0 | 0) | 0;
    HEAP8[(HEAP32[($8_1 + 1080 | 0) >> 2] | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 1072 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1064 | 0) >> 2] | 0) << 2 | 0) | 0) >> 0] | 0;
    label$65 : {
     label$66 : {
      if (!(((HEAPU8[(((HEAP32[($8_1 + 1072 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1064 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0 | 0) == (1 | 0) & 1 | 0)) {
       break label$66
      }
      $31(HEAP32[($8_1 + 1076 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1072 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1064 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      break label$65;
     }
     label$67 : {
      if (!((HEAP32[((HEAP32[($8_1 + 1076 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 < 32 >>> 0 & 1 | 0)) {
       break label$67
      }
      $31(HEAP32[($8_1 + 1076 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1072 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1064 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      label$68 : {
       if (!((HEAP32[((HEAP32[($8_1 + 1076 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 > 32 >>> 0 & 1 | 0)) {
        break label$68
       }
       HEAP32[((HEAP32[($8_1 + 1076 | 0) >> 2] | 0) + 4 | 0) >> 2] = 32;
      }
     }
    }
    HEAP32[($8_1 + 940 | 0) >> 2] = (HEAP32[($8_1 + 940 | 0) >> 2] | 0) + 1 | 0;
   }
   $1762 = HEAP32[($8_1 + 236 | 0) >> 2] | 0;
   $1763 = HEAP32[($8_1 + 224 | 0) >> 2] | 0;
   $1764 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
   HEAP32[($8_1 + 1104 | 0) >> 2] = HEAP32[($8_1 + 64 | 0) >> 2] | 0;
   HEAP32[($8_1 + 1100 | 0) >> 2] = $8_1 + 128 | 0;
   HEAP32[($8_1 + 1096 | 0) >> 2] = $1762;
   HEAP32[($8_1 + 1092 | 0) >> 2] = $1763;
   HEAP32[($8_1 + 1088 | 0) >> 2] = $1764;
   HEAP32[($8_1 + 1084 | 0) >> 2] = HEAP32[($8_1 + 1104 | 0) >> 2] | 0;
   label$69 : {
    label$70 : while (1) {
     if (!((($17(HEAP32[($8_1 + 1100 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 1104 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($8_1 + 1096 | 0) >> 2] | 0) + -3 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$69
     }
     label$71 : {
      if (!($29() | 0)) {
       break label$71
      }
      $1786 = HEAP32[($8_1 + 1100 | 0) >> 2] | 0;
      $1787 = HEAP32[($8_1 + 1092 | 0) >> 2] | 0;
      $1788 = HEAP32[($8_1 + 1088 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1124 | 0) >> 2] = HEAP32[($8_1 + 1104 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1120 | 0) >> 2] = $1786;
      HEAP32[($8_1 + 1116 | 0) >> 2] = $1787;
      HEAP32[($8_1 + 1112 | 0) >> 2] = $1788;
      HEAP32[($8_1 + 1108 | 0) >> 2] = $30(HEAP32[($8_1 + 1120 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1112 | 0) >> 2] | 0 | 0) | 0;
      $255 = (HEAP32[($8_1 + 1116 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1108 | 0) >> 2] | 0) << 2 | 0) | 0;
      $256 = HEAP32[($8_1 + 1124 | 0) >> 2] | 0;
      $257 = HEAPU8[$255 >> 0] | 0 | ((HEAPU8[($255 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$256 >> 0] = $257;
      HEAP8[($256 + 1 | 0) >> 0] = $257 >>> 8 | 0;
      $31(HEAP32[($8_1 + 1120 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1116 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1108 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 1104 | 0) >> 2] = (HEAP32[($8_1 + 1104 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 1116 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1108 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     label$72 : {
      if ($29() | 0) {
       break label$72
      }
     }
     $1820 = HEAP32[($8_1 + 1100 | 0) >> 2] | 0;
     $1821 = HEAP32[($8_1 + 1092 | 0) >> 2] | 0;
     $1822 = HEAP32[($8_1 + 1088 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1144 | 0) >> 2] = HEAP32[($8_1 + 1104 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1140 | 0) >> 2] = $1820;
     HEAP32[($8_1 + 1136 | 0) >> 2] = $1821;
     HEAP32[($8_1 + 1132 | 0) >> 2] = $1822;
     HEAP32[($8_1 + 1128 | 0) >> 2] = $30(HEAP32[($8_1 + 1140 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1132 | 0) >> 2] | 0 | 0) | 0;
     $258 = (HEAP32[($8_1 + 1136 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1128 | 0) >> 2] | 0) << 2 | 0) | 0;
     $259 = HEAP32[($8_1 + 1144 | 0) >> 2] | 0;
     $260 = HEAPU8[$258 >> 0] | 0 | ((HEAPU8[($258 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$259 >> 0] = $260;
     HEAP8[($259 + 1 | 0) >> 0] = $260 >>> 8 | 0;
     $31(HEAP32[($8_1 + 1140 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1136 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1128 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 1104 | 0) >> 2] = (HEAP32[($8_1 + 1104 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 1136 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1128 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     label$73 : {
      if (!($29() | 0)) {
       break label$73
      }
      $1854 = HEAP32[($8_1 + 1100 | 0) >> 2] | 0;
      $1855 = HEAP32[($8_1 + 1092 | 0) >> 2] | 0;
      $1856 = HEAP32[($8_1 + 1088 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1164 | 0) >> 2] = HEAP32[($8_1 + 1104 | 0) >> 2] | 0;
      HEAP32[($8_1 + 1160 | 0) >> 2] = $1854;
      HEAP32[($8_1 + 1156 | 0) >> 2] = $1855;
      HEAP32[($8_1 + 1152 | 0) >> 2] = $1856;
      HEAP32[($8_1 + 1148 | 0) >> 2] = $30(HEAP32[($8_1 + 1160 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1152 | 0) >> 2] | 0 | 0) | 0;
      $261 = (HEAP32[($8_1 + 1156 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1148 | 0) >> 2] | 0) << 2 | 0) | 0;
      $262 = HEAP32[($8_1 + 1164 | 0) >> 2] | 0;
      $265 = HEAPU8[$261 >> 0] | 0 | ((HEAPU8[($261 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
      HEAP8[$262 >> 0] = $265;
      HEAP8[($262 + 1 | 0) >> 0] = $265 >>> 8 | 0;
      $31(HEAP32[($8_1 + 1160 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1156 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1148 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      HEAP32[($8_1 + 1104 | 0) >> 2] = (HEAP32[($8_1 + 1104 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 1156 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1148 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     }
     $1887 = HEAP32[($8_1 + 1100 | 0) >> 2] | 0;
     $1888 = HEAP32[($8_1 + 1092 | 0) >> 2] | 0;
     $1889 = HEAP32[($8_1 + 1088 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1184 | 0) >> 2] = HEAP32[($8_1 + 1104 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1180 | 0) >> 2] = $1887;
     HEAP32[($8_1 + 1176 | 0) >> 2] = $1888;
     HEAP32[($8_1 + 1172 | 0) >> 2] = $1889;
     HEAP32[($8_1 + 1168 | 0) >> 2] = $30(HEAP32[($8_1 + 1180 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1172 | 0) >> 2] | 0 | 0) | 0;
     $266 = (HEAP32[($8_1 + 1176 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1168 | 0) >> 2] | 0) << 2 | 0) | 0;
     $267 = HEAP32[($8_1 + 1184 | 0) >> 2] | 0;
     $268 = HEAPU8[$266 >> 0] | 0 | ((HEAPU8[($266 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$267 >> 0] = $268;
     HEAP8[($267 + 1 | 0) >> 0] = $268 >>> 8 | 0;
     $31(HEAP32[($8_1 + 1180 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1176 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1168 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 1104 | 0) >> 2] = (HEAP32[($8_1 + 1104 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 1176 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1168 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$70;
    };
   }
   label$74 : {
    label$75 : while (1) {
     if (!((($17(HEAP32[($8_1 + 1100 | 0) >> 2] | 0 | 0) | 0 | 0) == (0 | 0) & 1 | 0) & ((HEAP32[($8_1 + 1104 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($8_1 + 1096 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0) | 0)) {
      break label$74
     }
     $1938 = HEAP32[($8_1 + 1100 | 0) >> 2] | 0;
     $1939 = HEAP32[($8_1 + 1092 | 0) >> 2] | 0;
     $1940 = HEAP32[($8_1 + 1088 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1204 | 0) >> 2] = HEAP32[($8_1 + 1104 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1200 | 0) >> 2] = $1938;
     HEAP32[($8_1 + 1196 | 0) >> 2] = $1939;
     HEAP32[($8_1 + 1192 | 0) >> 2] = $1940;
     HEAP32[($8_1 + 1188 | 0) >> 2] = $30(HEAP32[($8_1 + 1200 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1192 | 0) >> 2] | 0 | 0) | 0;
     $269 = (HEAP32[($8_1 + 1196 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1188 | 0) >> 2] | 0) << 2 | 0) | 0;
     $270 = HEAP32[($8_1 + 1204 | 0) >> 2] | 0;
     $271 = HEAPU8[$269 >> 0] | 0 | ((HEAPU8[($269 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$270 >> 0] = $271;
     HEAP8[($270 + 1 | 0) >> 0] = $271 >>> 8 | 0;
     $31(HEAP32[($8_1 + 1200 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1196 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1188 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 1104 | 0) >> 2] = (HEAP32[($8_1 + 1104 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 1196 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1188 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$75;
    };
   }
   label$76 : {
    label$77 : while (1) {
     if (!((HEAP32[($8_1 + 1104 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($8_1 + 1096 | 0) >> 2] | 0) + -2 | 0) >>> 0 & 1 | 0)) {
      break label$76
     }
     $1980 = HEAP32[($8_1 + 1100 | 0) >> 2] | 0;
     $1981 = HEAP32[($8_1 + 1092 | 0) >> 2] | 0;
     $1982 = HEAP32[($8_1 + 1088 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1224 | 0) >> 2] = HEAP32[($8_1 + 1104 | 0) >> 2] | 0;
     HEAP32[($8_1 + 1220 | 0) >> 2] = $1980;
     HEAP32[($8_1 + 1216 | 0) >> 2] = $1981;
     HEAP32[($8_1 + 1212 | 0) >> 2] = $1982;
     HEAP32[($8_1 + 1208 | 0) >> 2] = $30(HEAP32[($8_1 + 1220 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1212 | 0) >> 2] | 0 | 0) | 0;
     $272 = (HEAP32[($8_1 + 1216 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1208 | 0) >> 2] | 0) << 2 | 0) | 0;
     $273 = HEAP32[($8_1 + 1224 | 0) >> 2] | 0;
     $274 = HEAPU8[$272 >> 0] | 0 | ((HEAPU8[($272 + 1 | 0) >> 0] | 0) << 8 | 0) | 0;
     HEAP8[$273 >> 0] = $274;
     HEAP8[($273 + 1 | 0) >> 0] = $274 >>> 8 | 0;
     $31(HEAP32[($8_1 + 1220 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1216 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1208 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
     HEAP32[($8_1 + 1104 | 0) >> 2] = (HEAP32[($8_1 + 1104 | 0) >> 2] | 0) + ((HEAPU8[(((HEAP32[($8_1 + 1216 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1208 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0;
     continue label$77;
    };
   }
   label$78 : {
    if (!((HEAP32[($8_1 + 1104 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 1096 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$78
    }
    $2021 = HEAP32[($8_1 + 1100 | 0) >> 2] | 0;
    $2022 = HEAP32[($8_1 + 1092 | 0) >> 2] | 0;
    $2023 = HEAP32[($8_1 + 1088 | 0) >> 2] | 0;
    HEAP32[($8_1 + 1244 | 0) >> 2] = HEAP32[($8_1 + 1104 | 0) >> 2] | 0;
    HEAP32[($8_1 + 1240 | 0) >> 2] = $2021;
    HEAP32[($8_1 + 1236 | 0) >> 2] = $2022;
    HEAP32[($8_1 + 1232 | 0) >> 2] = $2023;
    HEAP32[($8_1 + 1228 | 0) >> 2] = $30(HEAP32[($8_1 + 1240 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 1232 | 0) >> 2] | 0 | 0) | 0;
    HEAP8[(HEAP32[($8_1 + 1244 | 0) >> 2] | 0) >> 0] = HEAPU8[((HEAP32[($8_1 + 1236 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1228 | 0) >> 2] | 0) << 2 | 0) | 0) >> 0] | 0;
    label$79 : {
     label$80 : {
      if (!(((HEAPU8[(((HEAP32[($8_1 + 1236 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1228 | 0) >> 2] | 0) << 2 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0 | 0) == (1 | 0) & 1 | 0)) {
       break label$80
      }
      $31(HEAP32[($8_1 + 1240 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1236 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1228 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      break label$79;
     }
     label$81 : {
      if (!((HEAP32[((HEAP32[($8_1 + 1240 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 < 32 >>> 0 & 1 | 0)) {
       break label$81
      }
      $31(HEAP32[($8_1 + 1240 | 0) >> 2] | 0 | 0, (HEAPU8[(((HEAP32[($8_1 + 1236 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 1228 | 0) >> 2] | 0) << 2 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0);
      label$82 : {
       if (!((HEAP32[((HEAP32[($8_1 + 1240 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 > 32 >>> 0 & 1 | 0)) {
        break label$82
       }
       HEAP32[((HEAP32[($8_1 + 1240 | 0) >> 2] | 0) + 4 | 0) >> 2] = 32;
      }
     }
    }
    HEAP32[($8_1 + 1104 | 0) >> 2] = (HEAP32[($8_1 + 1104 | 0) >> 2] | 0) + 1 | 0;
   }
   HEAP32[($8_1 + 32 | 0) >> 2] = ((($33($8_1 + 200 | 0 | 0) | 0) & ($33($8_1 + 176 | 0 | 0) | 0) | 0) & ($33($8_1 + 152 | 0 | 0) | 0) | 0) & ($33($8_1 + 128 | 0 | 0) | 0) | 0;
   label$83 : {
    if (HEAP32[($8_1 + 32 | 0) >> 2] | 0) {
     break label$83
    }
    HEAP32[($8_1 + 268 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($8_1 + 268 | 0) >> 2] = HEAP32[($8_1 + 260 | 0) >> 2] | 0;
  }
  $2108 = HEAP32[($8_1 + 268 | 0) >> 2] | 0;
  label$84 : {
   $2112 = $8_1 + 1248 | 0;
   if ($2112 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $2112;
  }
  return $2108 | 0;
 }
 
 function $44($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, $46_1 = 0, $45_1 = 0, $42_1 = 0;
  $10_1 = global$0 - 48 | 0;
  label$1 : {
   $45_1 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $45_1;
  }
  HEAP32[($10_1 + 40 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 36 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 32 | 0) >> 2] = $2_1;
  HEAP32[($10_1 + 28 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 24 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 20 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 16 | 0) >> 2] = $6_1;
  HEAP32[($10_1 + 12 | 0) >> 2] = $7_1;
  HEAP32[($10_1 + 8 | 0) >> 2] = HEAP32[($10_1 + 28 | 0) >> 2] | 0;
  HEAP32[($10_1 + 4 | 0) >> 2] = $38(HEAP32[($10_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   label$4 : {
    if (!($3(HEAP32[($10_1 + 4 | 0) >> 2] | 0 | 0) | 0)) {
     break label$4
    }
    HEAP32[($10_1 + 44 | 0) >> 2] = HEAP32[($10_1 + 4 | 0) >> 2] | 0;
    break label$3;
   }
   label$5 : {
    if (!((HEAP32[($10_1 + 4 | 0) >> 2] | 0) >>> 0 >= (HEAP32[($10_1 + 24 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($10_1 + 44 | 0) >> 2] = -72;
    break label$3;
   }
   HEAP32[($10_1 + 8 | 0) >> 2] = (HEAP32[($10_1 + 8 | 0) >> 2] | 0) + (HEAP32[($10_1 + 4 | 0) >> 2] | 0) | 0;
   HEAP32[($10_1 + 24 | 0) >> 2] = (HEAP32[($10_1 + 24 | 0) >> 2] | 0) - (HEAP32[($10_1 + 4 | 0) >> 2] | 0) | 0;
   HEAP32[($10_1 + 44 | 0) >> 2] = $43(HEAP32[($10_1 + 36 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 32 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 8 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0) | 0;
  }
  $42_1 = HEAP32[($10_1 + 44 | 0) >> 2] | 0;
  label$6 : {
   $46_1 = $10_1 + 48 | 0;
   if ($46_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $46_1;
  }
  return $42_1 | 0;
 }
 
 function $45($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $20_1 = 0, $13_1 = 0;
  $4_1 = global$0 - 32 | 0;
  HEAP32[($4_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 24 | 0) >> 2] = $1_1;
  label$1 : {
   label$2 : {
    if (!((HEAP32[($4_1 + 24 | 0) >> 2] | 0) >>> 0 >= (HEAP32[($4_1 + 28 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$2
    }
    $13_1 = 15;
    break label$1;
   }
   $13_1 = (((HEAP32[($4_1 + 24 | 0) >> 2] | 0) << 4 | 0) >>> 0) / ((HEAP32[($4_1 + 28 | 0) >> 2] | 0) >>> 0) | 0;
  }
  $20_1 = 1024;
  HEAP32[($4_1 + 20 | 0) >> 2] = $13_1;
  HEAP32[($4_1 + 16 | 0) >> 2] = (HEAP32[($4_1 + 28 | 0) >> 2] | 0) >>> 8 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = (HEAP32[($20_1 + Math_imul(HEAP32[($4_1 + 20 | 0) >> 2] | 0, 24) | 0) >> 2] | 0) + Math_imul(HEAP32[(($20_1 + Math_imul(HEAP32[($4_1 + 20 | 0) >> 2] | 0, 24) | 0) + 4 | 0) >> 2] | 0, HEAP32[($4_1 + 16 | 0) >> 2] | 0) | 0;
  HEAP32[($4_1 + 8 | 0) >> 2] = (HEAP32[(($20_1 + Math_imul(HEAP32[($4_1 + 20 | 0) >> 2] | 0, 24) | 0) + 8 | 0) >> 2] | 0) + Math_imul(HEAP32[(($20_1 + Math_imul(HEAP32[($4_1 + 20 | 0) >> 2] | 0, 24) | 0) + 12 | 0) >> 2] | 0, HEAP32[($4_1 + 16 | 0) >> 2] | 0) | 0;
  HEAP32[($4_1 + 8 | 0) >> 2] = (HEAP32[($4_1 + 8 | 0) >> 2] | 0) + ((HEAP32[($4_1 + 8 | 0) >> 2] | 0) >>> 3 | 0) | 0;
  return (HEAP32[($4_1 + 8 | 0) >> 2] | 0) >>> 0 < (HEAP32[($4_1 + 12 | 0) >> 2] | 0) >>> 0 & 1 | 0 | 0;
 }
 
 function $46($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $8_1 = 0, $21_1 = 0, $33_1 = 0, $32_1 = 0, $29_1 = 0;
  $8_1 = global$0 - 32 | 0;
  label$1 : {
   $32_1 = $8_1;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $32_1;
  }
  HEAP32[($8_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($8_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($8_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($8_1 + 16 | 0) >> 2] = $3_1;
  HEAP32[($8_1 + 12 | 0) >> 2] = $4_1;
  HEAP32[($8_1 + 8 | 0) >> 2] = $5_1;
  $27($8_1 | 0, HEAP32[($8_1 + 12 | 0) >> 2] | 0 | 0);
  label$3 : {
   label$4 : {
    if (!((HEAPU8[($8_1 + 1 | 0) >> 0] | 0) & 255 | 0)) {
     break label$4
    }
    $21_1 = $42(HEAP32[($8_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 8 | 0) >> 2] | 0 | 0) | 0;
    break label$3;
   }
   $21_1 = $28(HEAP32[($8_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 8 | 0) >> 2] | 0 | 0) | 0;
  }
  $29_1 = $21_1;
  label$5 : {
   $33_1 = $8_1 + 32 | 0;
   if ($33_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $33_1;
  }
  return $29_1 | 0;
 }
 
 function $47($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, $46_1 = 0, $45_1 = 0, $42_1 = 0;
  $10_1 = global$0 - 48 | 0;
  label$1 : {
   $45_1 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $45_1;
  }
  HEAP32[($10_1 + 40 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 36 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 32 | 0) >> 2] = $2_1;
  HEAP32[($10_1 + 28 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 24 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 20 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 16 | 0) >> 2] = $6_1;
  HEAP32[($10_1 + 12 | 0) >> 2] = $7_1;
  HEAP32[($10_1 + 8 | 0) >> 2] = HEAP32[($10_1 + 28 | 0) >> 2] | 0;
  HEAP32[($10_1 + 4 | 0) >> 2] = $26(HEAP32[($10_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   label$4 : {
    if (!($3(HEAP32[($10_1 + 4 | 0) >> 2] | 0 | 0) | 0)) {
     break label$4
    }
    HEAP32[($10_1 + 44 | 0) >> 2] = HEAP32[($10_1 + 4 | 0) >> 2] | 0;
    break label$3;
   }
   label$5 : {
    if (!((HEAP32[($10_1 + 4 | 0) >> 2] | 0) >>> 0 >= (HEAP32[($10_1 + 24 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($10_1 + 44 | 0) >> 2] = -72;
    break label$3;
   }
   HEAP32[($10_1 + 8 | 0) >> 2] = (HEAP32[($10_1 + 8 | 0) >> 2] | 0) + (HEAP32[($10_1 + 4 | 0) >> 2] | 0) | 0;
   HEAP32[($10_1 + 24 | 0) >> 2] = (HEAP32[($10_1 + 24 | 0) >> 2] | 0) - (HEAP32[($10_1 + 4 | 0) >> 2] | 0) | 0;
   HEAP32[($10_1 + 44 | 0) >> 2] = $28(HEAP32[($10_1 + 36 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 32 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 8 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0) | 0;
  }
  $42_1 = HEAP32[($10_1 + 44 | 0) >> 2] | 0;
  label$6 : {
   $46_1 = $10_1 + 48 | 0;
   if ($46_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $46_1;
  }
  return $42_1 | 0;
 }
 
 function $48($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $8_1 = 0, $21_1 = 0, $33_1 = 0, $32_1 = 0, $29_1 = 0;
  $8_1 = global$0 - 32 | 0;
  label$1 : {
   $32_1 = $8_1;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $32_1;
  }
  HEAP32[($8_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($8_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($8_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($8_1 + 16 | 0) >> 2] = $3_1;
  HEAP32[($8_1 + 12 | 0) >> 2] = $4_1;
  HEAP32[($8_1 + 8 | 0) >> 2] = $5_1;
  $27($8_1 | 0, HEAP32[($8_1 + 12 | 0) >> 2] | 0 | 0);
  label$3 : {
   label$4 : {
    if (!((HEAPU8[($8_1 + 1 | 0) >> 0] | 0) & 255 | 0)) {
     break label$4
    }
    $21_1 = $43(HEAP32[($8_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 8 | 0) >> 2] | 0 | 0) | 0;
    break label$3;
   }
   $21_1 = $34(HEAP32[($8_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 8 | 0) >> 2] | 0 | 0) | 0;
  }
  $29_1 = $21_1;
  label$5 : {
   $33_1 = $8_1 + 32 | 0;
   if ($33_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $33_1;
  }
  return $29_1 | 0;
 }
 
 function $49($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, $28_1 = 0, $43_1 = 0, $42_1 = 0, $39_1 = 0;
  $10_1 = global$0 - 48 | 0;
  label$1 : {
   $42_1 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $42_1;
  }
  HEAP32[($10_1 + 40 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 36 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 32 | 0) >> 2] = $2_1;
  HEAP32[($10_1 + 28 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 24 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 20 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 16 | 0) >> 2] = $6_1;
  HEAP32[($10_1 + 12 | 0) >> 2] = $7_1;
  label$3 : {
   label$4 : {
    if (HEAP32[($10_1 + 32 | 0) >> 2] | 0) {
     break label$4
    }
    HEAP32[($10_1 + 44 | 0) >> 2] = -70;
    break label$3;
   }
   label$5 : {
    if (HEAP32[($10_1 + 24 | 0) >> 2] | 0) {
     break label$5
    }
    HEAP32[($10_1 + 44 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($10_1 + 8 | 0) >> 2] = $45(HEAP32[($10_1 + 32 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0) | 0;
   label$6 : {
    label$7 : {
     if (!(HEAP32[($10_1 + 8 | 0) >> 2] | 0)) {
      break label$7
     }
     $28_1 = $44(HEAP32[($10_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 36 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 32 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0) | 0;
     break label$6;
    }
    $28_1 = $37(HEAP32[($10_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 36 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 32 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0) | 0;
   }
   HEAP32[($10_1 + 44 | 0) >> 2] = $28_1;
  }
  $39_1 = HEAP32[($10_1 + 44 | 0) >> 2] | 0;
  label$8 : {
   $43_1 = $10_1 + 48 | 0;
   if ($43_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $43_1;
  }
  return $39_1 | 0;
 }
 
 function $50($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  return HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0 | 0;
 }
 
 function $51($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  return HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0 | 0;
 }
 
 function $52($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $25_1 = 0, $59_1 = 0;
  $4_1 = global$0 - 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 8 | 0) >> 2] = $1_1;
  HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28952 | 0) >> 2] = HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 26676 | 0) >> 2] | 0;
  HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28732 | 0) >> 2] = HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0;
  HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28736 | 0) >> 2] = HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0;
  HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28740 | 0) >> 2] = (HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0) | 0;
  HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28728 | 0) >> 2] = HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28740 | 0) >> 2] | 0;
  label$1 : {
   label$2 : {
    if (!(HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 26680 | 0) >> 2] | 0)) {
     break label$2
    }
    $25_1 = 1;
    HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28808 | 0) >> 2] = $25_1;
    HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28812 | 0) >> 2] = $25_1;
    HEAP32[(HEAP32[($4_1 + 12 | 0) >> 2] | 0) >> 2] = (HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 12 | 0;
    HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 4 | 0) >> 2] = ((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 12 | 0) + 6160 | 0;
    HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 8 | 0) >> 2] = ((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 12 | 0) + 4104 | 0;
    HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 12 | 0) >> 2] = ((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 12 | 0) + 10264 | 0;
    HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 26668 | 0) >> 2] = HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 26664 | 0) >> 2] | 0;
    HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 26672 | 0) >> 2] = HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 26668 | 0) >> 2] | 0;
    HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 26676 | 0) >> 2] = HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 26672 | 0) >> 2] | 0;
    break label$1;
   }
   $59_1 = 0;
   HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28808 | 0) >> 2] = $59_1;
   HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28812 | 0) >> 2] = $59_1;
  }
  return;
 }
 
 function $53($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, $18_1 = 0, $24_1 = 0, $35_1 = 0, $50_1 = 0, $49_1 = 0, $91_1 = 0, $23_1 = 0, $125_1 = 0, $34_1 = 0, $152_1 = 0, $46_1 = 0;
  $3_1 = global$0 - 64 | 0;
  label$1 : {
   $49_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $49_1;
  }
  HEAP32[($3_1 + 56 | 0) >> 2] = $0_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($3_1 + 56 | 0) >> 2] | 0 | 0) == (0 | 0) & 1 | 0)) {
     break label$4
    }
    HEAP32[($3_1 + 60 | 0) >> 2] = 0;
    break label$3;
   }
   i64toi32_i32$2 = (HEAP32[($3_1 + 56 | 0) >> 2] | 0) + 26684 | 0;
   i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
   i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
   $91_1 = i64toi32_i32$0;
   i64toi32_i32$0 = $3_1 + 40 | 0;
   HEAP32[i64toi32_i32$0 >> 2] = $91_1;
   HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
   $18_1 = 8;
   HEAP32[(i64toi32_i32$0 + $18_1 | 0) >> 2] = HEAP32[(i64toi32_i32$2 + $18_1 | 0) >> 2] | 0;
   $23_1 = HEAP32[(HEAP32[($3_1 + 56 | 0) >> 2] | 0) >> 2] | 0;
   $24_1 = 8;
   HEAP32[(($3_1 + 8 | 0) + $24_1 | 0) >> 2] = HEAP32[(($3_1 + 40 | 0) + $24_1 | 0) >> 2] | 0;
   i64toi32_i32$2 = $3_1;
   i64toi32_i32$1 = HEAP32[($3_1 + 40 | 0) >> 2] | 0;
   i64toi32_i32$0 = HEAP32[($3_1 + 44 | 0) >> 2] | 0;
   $125_1 = i64toi32_i32$1;
   i64toi32_i32$1 = $3_1;
   HEAP32[($3_1 + 8 | 0) >> 2] = $125_1;
   HEAP32[($3_1 + 12 | 0) >> 2] = i64toi32_i32$0;
   $25($23_1 | 0, $3_1 + 8 | 0 | 0);
   $34_1 = HEAP32[($3_1 + 56 | 0) >> 2] | 0;
   $35_1 = 8;
   HEAP32[(($3_1 + 24 | 0) + $35_1 | 0) >> 2] = HEAP32[(($3_1 + 40 | 0) + $35_1 | 0) >> 2] | 0;
   i64toi32_i32$2 = $3_1;
   i64toi32_i32$0 = HEAP32[($3_1 + 40 | 0) >> 2] | 0;
   i64toi32_i32$1 = HEAP32[($3_1 + 44 | 0) >> 2] | 0;
   $152_1 = i64toi32_i32$0;
   i64toi32_i32$0 = $3_1;
   HEAP32[($3_1 + 24 | 0) >> 2] = $152_1;
   HEAP32[($3_1 + 28 | 0) >> 2] = i64toi32_i32$1;
   $25($34_1 | 0, $3_1 + 24 | 0 | 0);
   HEAP32[($3_1 + 60 | 0) >> 2] = 0;
  }
  $46_1 = HEAP32[($3_1 + 60 | 0) >> 2] | 0;
  label$5 : {
   $50_1 = $3_1 + 64 | 0;
   if ($50_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $50_1;
  }
  return $46_1 | 0;
 }
 
 function $54($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $7_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, $25_1 = 0, $41_1 = 0, $40_1 = 0, $139_1 = 0, $143_1 = 0, $34_1 = 0;
  $3_1 = global$0 - 48 | 0;
  label$1 : {
   $40_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $40_1;
  }
  $7_1 = 0;
  HEAP32[($3_1 + 44 | 0) >> 2] = $0_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28908 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28936 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28980 | 0) >> 2] = 134217729;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28948 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28944 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28740 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28956 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28960 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28968 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28972 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28988 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28964 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 29004 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 29008 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 29020 | 0) >> 2] = $7_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 160164 | 0) >> 2] = $7_1;
  $55($3_1 + 24 | 0 | 0);
  $25_1 = 8;
  i64toi32_i32$2 = ($3_1 + 24 | 0) + $25_1 | 0;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $139_1 = i64toi32_i32$0;
  i64toi32_i32$0 = ($3_1 + 8 | 0) + $25_1 | 0;
  HEAP32[i64toi32_i32$0 >> 2] = $139_1;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
  i64toi32_i32$2 = $3_1;
  i64toi32_i32$1 = HEAP32[($3_1 + 24 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAP32[($3_1 + 28 | 0) >> 2] | 0;
  $143_1 = i64toi32_i32$1;
  i64toi32_i32$1 = $3_1;
  HEAP32[($3_1 + 8 | 0) >> 2] = $143_1;
  HEAP32[($3_1 + 12 | 0) >> 2] = i64toi32_i32$0;
  $34_1 = $56($3_1 + 8 | 0 | 0) | 0;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 28940 | 0) >> 2] = $34_1;
  HEAP32[((HEAP32[($3_1 + 44 | 0) >> 2] | 0) + 29024 | 0) >> 2] = 0;
  label$3 : {
   $41_1 = $3_1 + 48 | 0;
   if ($41_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $41_1;
  }
  return;
 }
 
 function $55($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $4_1 = 0;
  $3_1 = global$0 - 16 | 0;
  $4_1 = 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $4_1;
  HEAP32[($3_1 + 8 | 0) >> 2] = $4_1;
  HEAP32[($3_1 + 4 | 0) >> 2] = $4_1;
  HEAP32[$3_1 >> 2] = $4_1;
  HEAP32[$0_1 >> 2] = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  HEAP32[($0_1 + 4 | 0) >> 2] = HEAP32[($3_1 + 8 | 0) >> 2] | 0;
  HEAP32[($0_1 + 8 | 0) >> 2] = HEAP32[($3_1 + 4 | 0) >> 2] | 0;
  HEAP32[($0_1 + 12 | 0) >> 2] = HEAP32[$3_1 >> 2] | 0;
  return;
 }
 
 function $56($0_1) {
  $0_1 = $0_1 | 0;
  return ((HEAP32[($0_1 + 8 | 0) >> 2] | 0) & 256 | 0 | 0) != (0 | 0) & 1 | 0 | 0;
 }
 
 function $57($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, $4_1 = 0, $23_1 = 0, $44_1 = 0, $54_1 = 0, $53_1 = 0, $115_1 = 0, $145_1 = 0, $50_1 = 0;
  $3_1 = global$0 - 32 | 0;
  label$1 : {
   $53_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $53_1;
  }
  $4_1 = 0;
  label$3 : {
   label$4 : {
    if (!((((HEAP32[$0_1 >> 2] | 0 | 0) != ($4_1 | 0) ^ -1 | 0) & 1 | 0) ^ (((HEAP32[($0_1 + 4 | 0) >> 2] | 0 | 0) != ($4_1 | 0) ^ -1 | 0) & 1 | 0) | 0)) {
     break label$4
    }
    HEAP32[($3_1 + 28 | 0) >> 2] = 0;
    break label$3;
   }
   $23_1 = 8;
   HEAP32[(($3_1 + 8 | 0) + $23_1 | 0) >> 2] = HEAP32[($0_1 + $23_1 | 0) >> 2] | 0;
   i64toi32_i32$0 = HEAP32[$0_1 >> 2] | 0;
   i64toi32_i32$1 = HEAP32[($0_1 + 4 | 0) >> 2] | 0;
   $115_1 = i64toi32_i32$0;
   i64toi32_i32$0 = $3_1;
   HEAP32[($3_1 + 8 | 0) >> 2] = $115_1;
   HEAP32[($3_1 + 12 | 0) >> 2] = i64toi32_i32$1;
   HEAP32[($3_1 + 24 | 0) >> 2] = $24(160168 | 0, $3_1 + 8 | 0 | 0) | 0;
   label$5 : {
    if ((HEAP32[($3_1 + 24 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0) {
     break label$5
    }
    HEAP32[($3_1 + 28 | 0) >> 2] = 0;
    break label$3;
   }
   i64toi32_i32$1 = HEAP32[$0_1 >> 2] | 0;
   i64toi32_i32$0 = HEAP32[($0_1 + 4 | 0) >> 2] | 0;
   $145_1 = i64toi32_i32$1;
   i64toi32_i32$1 = (HEAP32[($3_1 + 24 | 0) >> 2] | 0) + 28916 | 0;
   HEAP32[i64toi32_i32$1 >> 2] = $145_1;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
   $44_1 = 8;
   HEAP32[(i64toi32_i32$1 + $44_1 | 0) >> 2] = HEAP32[($0_1 + $44_1 | 0) >> 2] | 0;
   $54(HEAP32[($3_1 + 24 | 0) >> 2] | 0 | 0);
   HEAP32[($3_1 + 28 | 0) >> 2] = HEAP32[($3_1 + 24 | 0) >> 2] | 0;
  }
  $50_1 = HEAP32[($3_1 + 28 | 0) >> 2] | 0;
  label$6 : {
   $54_1 = $3_1 + 32 | 0;
   if ($54_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $54_1;
  }
  return $50_1 | 0;
 }
 
 function $58($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, $21_1 = 0, $28_1 = 0, $41_1 = 0, $56_1 = 0, $55_1 = 0, $105_1 = 0, $27_1 = 0, $142_1 = 0, $40_1 = 0, $173 = 0, $52_1 = 0;
  $3_1 = global$0 - 64 | 0;
  label$1 : {
   $55_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $55_1;
  }
  HEAP32[($3_1 + 56 | 0) >> 2] = $0_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($3_1 + 56 | 0) >> 2] | 0 | 0) == (0 | 0) & 1 | 0)) {
     break label$4
    }
    HEAP32[($3_1 + 60 | 0) >> 2] = 0;
    break label$3;
   }
   label$5 : {
    if (!(HEAP32[((HEAP32[($3_1 + 56 | 0) >> 2] | 0) + 28936 | 0) >> 2] | 0)) {
     break label$5
    }
    HEAP32[($3_1 + 60 | 0) >> 2] = -64;
    break label$3;
   }
   i64toi32_i32$2 = (HEAP32[($3_1 + 56 | 0) >> 2] | 0) + 28916 | 0;
   i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
   i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
   $105_1 = i64toi32_i32$0;
   i64toi32_i32$0 = $3_1 + 40 | 0;
   HEAP32[i64toi32_i32$0 >> 2] = $105_1;
   HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
   $21_1 = 8;
   HEAP32[(i64toi32_i32$0 + $21_1 | 0) >> 2] = HEAP32[(i64toi32_i32$2 + $21_1 | 0) >> 2] | 0;
   $59(HEAP32[($3_1 + 56 | 0) >> 2] | 0 | 0);
   $27_1 = HEAP32[((HEAP32[($3_1 + 56 | 0) >> 2] | 0) + 28968 | 0) >> 2] | 0;
   $28_1 = 8;
   HEAP32[(($3_1 + 8 | 0) + $28_1 | 0) >> 2] = HEAP32[(($3_1 + 40 | 0) + $28_1 | 0) >> 2] | 0;
   i64toi32_i32$2 = $3_1;
   i64toi32_i32$1 = HEAP32[($3_1 + 40 | 0) >> 2] | 0;
   i64toi32_i32$0 = HEAP32[($3_1 + 44 | 0) >> 2] | 0;
   $142_1 = i64toi32_i32$1;
   i64toi32_i32$1 = $3_1;
   HEAP32[($3_1 + 8 | 0) >> 2] = $142_1;
   HEAP32[($3_1 + 12 | 0) >> 2] = i64toi32_i32$0;
   $25($27_1 | 0, $3_1 + 8 | 0 | 0);
   HEAP32[((HEAP32[($3_1 + 56 | 0) >> 2] | 0) + 28968 | 0) >> 2] = 0;
   $40_1 = HEAP32[($3_1 + 56 | 0) >> 2] | 0;
   $41_1 = 8;
   HEAP32[(($3_1 + 24 | 0) + $41_1 | 0) >> 2] = HEAP32[(($3_1 + 40 | 0) + $41_1 | 0) >> 2] | 0;
   i64toi32_i32$2 = $3_1;
   i64toi32_i32$0 = HEAP32[($3_1 + 40 | 0) >> 2] | 0;
   i64toi32_i32$1 = HEAP32[($3_1 + 44 | 0) >> 2] | 0;
   $173 = i64toi32_i32$0;
   i64toi32_i32$0 = $3_1;
   HEAP32[($3_1 + 24 | 0) >> 2] = $173;
   HEAP32[($3_1 + 28 | 0) >> 2] = i64toi32_i32$1;
   $25($40_1 | 0, $3_1 + 24 | 0 | 0);
   HEAP32[($3_1 + 60 | 0) >> 2] = 0;
  }
  $52_1 = HEAP32[($3_1 + 60 | 0) >> 2] | 0;
  label$6 : {
   $56_1 = $3_1 + 64 | 0;
   if ($56_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $56_1;
  }
  return $52_1 | 0;
 }
 
 function $59($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $4_1 = 0, $13_1 = 0, $12_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $12_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $12_1;
  }
  $4_1 = 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $53(HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28944 | 0) >> 2] | 0 | 0) | 0;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28944 | 0) >> 2] = $4_1;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28948 | 0) >> 2] = $4_1;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28960 | 0) >> 2] = $4_1;
  label$3 : {
   $13_1 = $3_1 + 16 | 0;
   if ($13_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $13_1;
  }
  return;
 }
 
 function $60($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $66_1 = 0, $82_1 = 0, $81_1 = 0, $64_1 = 0, $78_1 = 0;
  $5_1 = global$0 - 48 | 0;
  label$1 : {
   $81_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $81_1;
  }
  HEAP32[($5_1 + 40 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 36 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 32 | 0) >> 2] = $2_1;
  HEAP32[($5_1 + 28 | 0) >> 2] = $61(HEAP32[($5_1 + 32 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($5_1 + 36 | 0) >> 2] | 0) >>> 0 < (HEAP32[($5_1 + 28 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($5_1 + 44 | 0) >> 2] = -72;
    break label$3;
   }
   HEAP8[($5_1 + 27 | 0) >> 0] = HEAPU8[((HEAP32[($5_1 + 40 | 0) >> 2] | 0) + ((HEAP32[($5_1 + 28 | 0) >> 2] | 0) - 1 | 0) | 0) >> 0] | 0;
   HEAP32[($5_1 + 20 | 0) >> 2] = ((HEAPU8[($5_1 + 27 | 0) >> 0] | 0) & 255 | 0) & 3 | 0;
   HEAP32[($5_1 + 16 | 0) >> 2] = (((HEAPU8[($5_1 + 27 | 0) >> 0] | 0) & 255 | 0) >> 5 | 0) & 1 | 0;
   HEAP32[($5_1 + 12 | 0) >> 2] = ((HEAPU8[($5_1 + 27 | 0) >> 0] | 0) & 255 | 0) >> 6 | 0;
   $64_1 = (((HEAP32[($5_1 + 28 | 0) >> 2] | 0) + (((HEAP32[($5_1 + 16 | 0) >> 2] | 0 | 0) != (0 | 0) ^ -1 | 0) & 1 | 0) | 0) + (HEAP32[(3872 + ((HEAP32[($5_1 + 20 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) | 0) + (HEAP32[(3888 + ((HEAP32[($5_1 + 12 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) | 0;
   $66_1 = 0;
   label$5 : {
    if (!(HEAP32[($5_1 + 16 | 0) >> 2] | 0)) {
     break label$5
    }
    $66_1 = (HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) != (0 | 0) ^ -1 | 0;
   }
   HEAP32[($5_1 + 44 | 0) >> 2] = $64_1 + ($66_1 & 1 | 0) | 0;
  }
  $78_1 = HEAP32[($5_1 + 44 | 0) >> 2] | 0;
  label$6 : {
   $82_1 = $5_1 + 48 | 0;
   if ($82_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $82_1;
  }
  return $78_1 | 0;
 }
 
 function $61($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($3_1 + 8 | 0) >> 2] = HEAP32[($3_1 + 12 | 0) >> 2] | 0 ? 1 : 5;
  return HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0;
 }
 
 function $62($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var $6_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$2 = 0, i64toi32_i32$5 = 0, i64toi32_i32$4 = 0, i64toi32_i32$3 = 0, $242 = 0, $243 = 0, $10_1 = 0, $70_1 = 0, $262$hi = 0, $142_1 = 0, $247$hi = 0, $248$hi = 0, $43_1 = 0, $250$hi = 0, $251$hi = 0, $44_1 = 0, $252$hi = 0, $253$hi = 0, $254$hi = 0, $169 = 0, $196 = 0, $266$hi = 0, $269 = 0, $269$hi = 0, $241 = 0, $240 = 0, $244 = 0, $245$hi = 0, $141_1 = 0, $649 = 0, $254 = 0, $653$hi = 0, $769 = 0, $794 = 0, $802 = 0, $812 = 0, $818 = 0, $237 = 0;
  $6_1 = global$0 - 96 | 0;
  label$1 : {
   $240 = $6_1;
   if ($6_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $240;
  }
  HEAP32[($6_1 + 88 | 0) >> 2] = $0_1;
  HEAP32[($6_1 + 84 | 0) >> 2] = $1_1;
  HEAP32[($6_1 + 80 | 0) >> 2] = $2_1;
  HEAP32[($6_1 + 76 | 0) >> 2] = $3_1;
  HEAP32[($6_1 + 72 | 0) >> 2] = HEAP32[($6_1 + 84 | 0) >> 2] | 0;
  HEAP32[($6_1 + 68 | 0) >> 2] = $61(HEAP32[($6_1 + 76 | 0) >> 2] | 0 | 0) | 0;
  $10_1 = HEAP32[($6_1 + 88 | 0) >> 2] | 0;
  i64toi32_i32$0 = 0;
  $242 = 0;
  i64toi32_i32$1 = $10_1;
  HEAP32[i64toi32_i32$1 >> 2] = $242;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$1 = i64toi32_i32$1 + 32 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $242;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$1 = $10_1 + 24 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $242;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$1 = $10_1 + 16 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $242;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$1 = $10_1 + 8 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $242;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($6_1 + 80 | 0) >> 2] | 0) >>> 0 < (HEAP32[($6_1 + 68 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($6_1 + 92 | 0) >> 2] = HEAP32[($6_1 + 68 | 0) >> 2] | 0;
    break label$3;
   }
   label$5 : {
    if (!((HEAP32[($6_1 + 84 | 0) >> 2] | 0 | 0) == (0 | 0) & 1 | 0)) {
     break label$5
    }
    HEAP32[($6_1 + 92 | 0) >> 2] = -1;
    break label$3;
   }
   label$6 : {
    if (!((HEAP32[($6_1 + 76 | 0) >> 2] | 0 | 0) != (1 | 0) & 1 | 0)) {
     break label$6
    }
    if (!(($6(HEAP32[($6_1 + 84 | 0) >> 2] | 0 | 0) | 0 | 0) != (-47205080 | 0) & 1 | 0)) {
     break label$6
    }
    label$7 : {
     if (!((($6(HEAP32[($6_1 + 84 | 0) >> 2] | 0 | 0) | 0) & -16 | 0 | 0) == (407710288 | 0) & 1 | 0)) {
      break label$7
     }
     label$8 : {
      if (!((HEAP32[($6_1 + 80 | 0) >> 2] | 0) >>> 0 < 8 >>> 0 & 1 | 0)) {
       break label$8
      }
      HEAP32[($6_1 + 92 | 0) >> 2] = 8;
      break label$3;
     }
     $70_1 = HEAP32[($6_1 + 88 | 0) >> 2] | 0;
     i64toi32_i32$0 = 0;
     $243 = 0;
     i64toi32_i32$1 = $70_1;
     HEAP32[i64toi32_i32$1 >> 2] = $243;
     HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
     i64toi32_i32$1 = i64toi32_i32$1 + 32 | 0;
     HEAP32[i64toi32_i32$1 >> 2] = $243;
     HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
     i64toi32_i32$1 = $70_1 + 24 | 0;
     HEAP32[i64toi32_i32$1 >> 2] = $243;
     HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
     i64toi32_i32$1 = $70_1 + 16 | 0;
     HEAP32[i64toi32_i32$1 >> 2] = $243;
     HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
     i64toi32_i32$1 = $70_1 + 8 | 0;
     HEAP32[i64toi32_i32$1 >> 2] = $243;
     HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
     i64toi32_i32$0 = 0;
     $244 = $6((HEAP32[($6_1 + 84 | 0) >> 2] | 0) + 4 | 0 | 0) | 0;
     i64toi32_i32$1 = HEAP32[($6_1 + 88 | 0) >> 2] | 0;
     HEAP32[i64toi32_i32$1 >> 2] = $244;
     HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
     HEAP32[((HEAP32[($6_1 + 88 | 0) >> 2] | 0) + 20 | 0) >> 2] = 1;
     HEAP32[($6_1 + 92 | 0) >> 2] = 0;
     break label$3;
    }
    HEAP32[($6_1 + 92 | 0) >> 2] = -10;
    break label$3;
   }
   HEAP32[($6_1 + 64 | 0) >> 2] = $60(HEAP32[($6_1 + 84 | 0) >> 2] | 0 | 0, HEAP32[($6_1 + 80 | 0) >> 2] | 0 | 0, HEAP32[($6_1 + 76 | 0) >> 2] | 0 | 0) | 0;
   label$9 : {
    if (!((HEAP32[($6_1 + 80 | 0) >> 2] | 0) >>> 0 < (HEAP32[($6_1 + 64 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$9
    }
    HEAP32[($6_1 + 92 | 0) >> 2] = HEAP32[($6_1 + 64 | 0) >> 2] | 0;
    break label$3;
   }
   i64toi32_i32$0 = -1;
   $245$hi = i64toi32_i32$0;
   i64toi32_i32$0 = 0;
   HEAP32[((HEAP32[($6_1 + 88 | 0) >> 2] | 0) + 24 | 0) >> 2] = HEAP32[($6_1 + 64 | 0) >> 2] | 0;
   HEAP8[($6_1 + 63 | 0) >> 0] = HEAPU8[((HEAP32[($6_1 + 72 | 0) >> 2] | 0) + ((HEAP32[($6_1 + 68 | 0) >> 2] | 0) - 1 | 0) | 0) >> 0] | 0;
   HEAP32[($6_1 + 56 | 0) >> 2] = HEAP32[($6_1 + 68 | 0) >> 2] | 0;
   HEAP32[($6_1 + 52 | 0) >> 2] = ((HEAPU8[($6_1 + 63 | 0) >> 0] | 0) & 255 | 0) & 3 | 0;
   HEAP32[($6_1 + 48 | 0) >> 2] = (((HEAPU8[($6_1 + 63 | 0) >> 0] | 0) & 255 | 0) >> 2 | 0) & 1 | 0;
   HEAP32[($6_1 + 44 | 0) >> 2] = (((HEAPU8[($6_1 + 63 | 0) >> 0] | 0) & 255 | 0) >> 5 | 0) & 1 | 0;
   HEAP32[($6_1 + 40 | 0) >> 2] = ((HEAPU8[($6_1 + 63 | 0) >> 0] | 0) & 255 | 0) >> 6 | 0;
   i64toi32_i32$1 = $6_1;
   HEAP32[($6_1 + 32 | 0) >> 2] = 0;
   HEAP32[($6_1 + 36 | 0) >> 2] = i64toi32_i32$0;
   HEAP32[($6_1 + 28 | 0) >> 2] = 0;
   i64toi32_i32$0 = $245$hi;
   i64toi32_i32$1 = $6_1;
   HEAP32[($6_1 + 16 | 0) >> 2] = -1;
   HEAP32[($6_1 + 20 | 0) >> 2] = i64toi32_i32$0;
   label$10 : {
    if (!(((HEAPU8[($6_1 + 63 | 0) >> 0] | 0) & 255 | 0) & 8 | 0)) {
     break label$10
    }
    HEAP32[($6_1 + 92 | 0) >> 2] = -14;
    break label$3;
   }
   label$11 : {
    if (HEAP32[($6_1 + 44 | 0) >> 2] | 0) {
     break label$11
    }
    $141_1 = HEAP32[($6_1 + 72 | 0) >> 2] | 0;
    $142_1 = HEAP32[($6_1 + 56 | 0) >> 2] | 0;
    HEAP32[($6_1 + 56 | 0) >> 2] = $142_1 + 1 | 0;
    HEAP8[($6_1 + 15 | 0) >> 0] = HEAPU8[($141_1 + $142_1 | 0) >> 0] | 0;
    HEAP32[($6_1 + 8 | 0) >> 2] = (((HEAPU8[($6_1 + 15 | 0) >> 0] | 0) & 255 | 0) >> 3 | 0) + 10 | 0;
    label$12 : {
     if (!((HEAP32[($6_1 + 8 | 0) >> 2] | 0) >>> 0 > 30 >>> 0 & 1 | 0)) {
      break label$12
     }
     HEAP32[($6_1 + 92 | 0) >> 2] = -16;
     break label$3;
    }
    i64toi32_i32$0 = 0;
    $247$hi = i64toi32_i32$0;
    i64toi32_i32$0 = 0;
    $248$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $247$hi;
    i64toi32_i32$0 = $248$hi;
    i64toi32_i32$0 = $247$hi;
    i64toi32_i32$2 = 1;
    i64toi32_i32$1 = $248$hi;
    i64toi32_i32$3 = HEAP32[($6_1 + 8 | 0) >> 2] | 0;
    i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
     i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
     $43_1 = 0;
    } else {
     i64toi32_i32$1 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$4 | 0) | 0;
     $43_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
    }
    i64toi32_i32$2 = $6_1;
    HEAP32[($6_1 + 32 | 0) >> 2] = $43_1;
    HEAP32[($6_1 + 36 | 0) >> 2] = i64toi32_i32$1;
    i64toi32_i32$0 = $6_1;
    i64toi32_i32$1 = HEAP32[($6_1 + 32 | 0) >> 2] | 0;
    i64toi32_i32$2 = HEAP32[($6_1 + 36 | 0) >> 2] | 0;
    $250$hi = i64toi32_i32$2;
    i64toi32_i32$2 = 0;
    $251$hi = i64toi32_i32$2;
    i64toi32_i32$2 = $250$hi;
    i64toi32_i32$2 = $251$hi;
    i64toi32_i32$2 = $250$hi;
    i64toi32_i32$0 = i64toi32_i32$1;
    i64toi32_i32$1 = $251$hi;
    i64toi32_i32$3 = 3;
    i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
     i64toi32_i32$1 = 0;
     $44_1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
    } else {
     i64toi32_i32$1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
     $44_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
    }
    $252$hi = i64toi32_i32$1;
    i64toi32_i32$0 = ((HEAPU8[($6_1 + 15 | 0) >> 0] | 0) & 255 | 0) & 7 | 0;
    i64toi32_i32$1 = i64toi32_i32$0 >> 31 | 0;
    $253$hi = i64toi32_i32$1;
    i64toi32_i32$1 = $252$hi;
    i64toi32_i32$1 = $253$hi;
    $649 = i64toi32_i32$0;
    i64toi32_i32$1 = $252$hi;
    i64toi32_i32$0 = $253$hi;
    i64toi32_i32$0 = __wasm_i64_mul($44_1 | 0, i64toi32_i32$1 | 0, $649 | 0, i64toi32_i32$0 | 0) | 0;
    i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
    $254 = i64toi32_i32$0;
    $254$hi = i64toi32_i32$1;
    i64toi32_i32$2 = $6_1;
    i64toi32_i32$1 = HEAP32[($6_1 + 32 | 0) >> 2] | 0;
    i64toi32_i32$0 = HEAP32[($6_1 + 36 | 0) >> 2] | 0;
    $653$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $254$hi;
    i64toi32_i32$0 = $653$hi;
    i64toi32_i32$2 = i64toi32_i32$1;
    i64toi32_i32$1 = $254$hi;
    i64toi32_i32$3 = $254;
    i64toi32_i32$4 = i64toi32_i32$2 + i64toi32_i32$3 | 0;
    i64toi32_i32$5 = i64toi32_i32$0 + i64toi32_i32$1 | 0;
    if (i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) {
     i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
    }
    i64toi32_i32$2 = $6_1;
    HEAP32[($6_1 + 32 | 0) >> 2] = i64toi32_i32$4;
    HEAP32[($6_1 + 36 | 0) >> 2] = i64toi32_i32$5;
   }
   $169 = HEAP32[($6_1 + 52 | 0) >> 2] | 0;
   label$13 : {
    label$14 : {
     switch ($169 | 0) {
     default:
     case 0:
      break label$13;
     case 1:
      HEAP32[($6_1 + 28 | 0) >> 2] = (HEAPU8[((HEAP32[($6_1 + 72 | 0) >> 2] | 0) + (HEAP32[($6_1 + 56 | 0) >> 2] | 0) | 0) >> 0] | 0) & 255 | 0;
      HEAP32[($6_1 + 56 | 0) >> 2] = (HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 1 | 0;
      break label$13;
     case 2:
      HEAP32[($6_1 + 28 | 0) >> 2] = ($35((HEAP32[($6_1 + 72 | 0) >> 2] | 0) + (HEAP32[($6_1 + 56 | 0) >> 2] | 0) | 0 | 0) | 0) & 65535 | 0;
      HEAP32[($6_1 + 56 | 0) >> 2] = (HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 2 | 0;
      break label$13;
     case 3:
      break label$14;
     };
    }
    HEAP32[($6_1 + 28 | 0) >> 2] = $6((HEAP32[($6_1 + 72 | 0) >> 2] | 0) + (HEAP32[($6_1 + 56 | 0) >> 2] | 0) | 0 | 0) | 0;
    HEAP32[($6_1 + 56 | 0) >> 2] = (HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 4 | 0;
   }
   $196 = HEAP32[($6_1 + 40 | 0) >> 2] | 0;
   label$19 : {
    label$20 : {
     switch ($196 | 0) {
     default:
     case 0:
      label$25 : {
       if (!(HEAP32[($6_1 + 44 | 0) >> 2] | 0)) {
        break label$25
       }
       i64toi32_i32$5 = 0;
       i64toi32_i32$2 = $6_1;
       HEAP32[($6_1 + 16 | 0) >> 2] = (HEAPU8[((HEAP32[($6_1 + 72 | 0) >> 2] | 0) + (HEAP32[($6_1 + 56 | 0) >> 2] | 0) | 0) >> 0] | 0) & 255 | 0;
       HEAP32[($6_1 + 20 | 0) >> 2] = i64toi32_i32$5;
      }
      break label$19;
     case 1:
      i64toi32_i32$2 = (($35((HEAP32[($6_1 + 72 | 0) >> 2] | 0) + (HEAP32[($6_1 + 56 | 0) >> 2] | 0) | 0 | 0) | 0) & 65535 | 0) + 256 | 0;
      i64toi32_i32$5 = i64toi32_i32$2 >> 31 | 0;
      $769 = i64toi32_i32$2;
      i64toi32_i32$2 = $6_1;
      HEAP32[($6_1 + 16 | 0) >> 2] = $769;
      HEAP32[($6_1 + 20 | 0) >> 2] = i64toi32_i32$5;
      break label$19;
     case 2:
      i64toi32_i32$5 = 0;
      i64toi32_i32$2 = $6_1;
      HEAP32[($6_1 + 16 | 0) >> 2] = $6((HEAP32[($6_1 + 72 | 0) >> 2] | 0) + (HEAP32[($6_1 + 56 | 0) >> 2] | 0) | 0 | 0) | 0;
      HEAP32[($6_1 + 20 | 0) >> 2] = i64toi32_i32$5;
      break label$19;
     case 3:
      break label$20;
     };
    }
    i64toi32_i32$5 = $63((HEAP32[($6_1 + 72 | 0) >> 2] | 0) + (HEAP32[($6_1 + 56 | 0) >> 2] | 0) | 0 | 0) | 0;
    i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
    $794 = i64toi32_i32$5;
    i64toi32_i32$5 = $6_1;
    HEAP32[($6_1 + 16 | 0) >> 2] = $794;
    HEAP32[($6_1 + 20 | 0) >> 2] = i64toi32_i32$2;
   }
   label$26 : {
    if (!(HEAP32[($6_1 + 44 | 0) >> 2] | 0)) {
     break label$26
    }
    i64toi32_i32$0 = $6_1;
    i64toi32_i32$2 = HEAP32[($6_1 + 16 | 0) >> 2] | 0;
    i64toi32_i32$5 = HEAP32[($6_1 + 20 | 0) >> 2] | 0;
    $802 = i64toi32_i32$2;
    i64toi32_i32$2 = $6_1;
    HEAP32[($6_1 + 32 | 0) >> 2] = $802;
    HEAP32[($6_1 + 36 | 0) >> 2] = i64toi32_i32$5;
   }
   i64toi32_i32$5 = 0;
   $262$hi = i64toi32_i32$5;
   HEAP32[((HEAP32[($6_1 + 88 | 0) >> 2] | 0) + 20 | 0) >> 2] = 0;
   i64toi32_i32$0 = $6_1;
   i64toi32_i32$5 = HEAP32[($6_1 + 16 | 0) >> 2] | 0;
   i64toi32_i32$2 = HEAP32[($6_1 + 20 | 0) >> 2] | 0;
   $812 = i64toi32_i32$5;
   i64toi32_i32$5 = HEAP32[($6_1 + 88 | 0) >> 2] | 0;
   HEAP32[i64toi32_i32$5 >> 2] = $812;
   HEAP32[(i64toi32_i32$5 + 4 | 0) >> 2] = i64toi32_i32$2;
   i64toi32_i32$0 = $6_1;
   i64toi32_i32$2 = HEAP32[($6_1 + 32 | 0) >> 2] | 0;
   i64toi32_i32$5 = HEAP32[($6_1 + 36 | 0) >> 2] | 0;
   $818 = i64toi32_i32$2;
   i64toi32_i32$2 = HEAP32[($6_1 + 88 | 0) >> 2] | 0;
   HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] = $818;
   HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] = i64toi32_i32$5;
   i64toi32_i32$0 = $6_1;
   i64toi32_i32$5 = HEAP32[($6_1 + 32 | 0) >> 2] | 0;
   i64toi32_i32$2 = HEAP32[($6_1 + 36 | 0) >> 2] | 0;
   $266$hi = i64toi32_i32$2;
   i64toi32_i32$2 = $262$hi;
   i64toi32_i32$2 = $266$hi;
   i64toi32_i32$2 = $262$hi;
   i64toi32_i32$2 = $266$hi;
   i64toi32_i32$0 = i64toi32_i32$5;
   i64toi32_i32$5 = $262$hi;
   i64toi32_i32$3 = 131072;
   label$27 : {
    label$28 : {
     if (!((i64toi32_i32$2 >>> 0 < i64toi32_i32$5 >>> 0 | ((i64toi32_i32$2 | 0) == (i64toi32_i32$5 | 0) & i64toi32_i32$0 >>> 0 < i64toi32_i32$3 >>> 0 | 0) | 0) & 1 | 0)) {
      break label$28
     }
     i64toi32_i32$3 = $6_1;
     i64toi32_i32$0 = HEAP32[($6_1 + 32 | 0) >> 2] | 0;
     i64toi32_i32$2 = HEAP32[($6_1 + 36 | 0) >> 2] | 0;
     $269 = i64toi32_i32$0;
     $269$hi = i64toi32_i32$2;
     break label$27;
    }
    i64toi32_i32$2 = 0;
    $269 = 131072;
    $269$hi = i64toi32_i32$2;
   }
   i64toi32_i32$2 = $269$hi;
   HEAP32[((HEAP32[($6_1 + 88 | 0) >> 2] | 0) + 16 | 0) >> 2] = $269;
   HEAP32[((HEAP32[($6_1 + 88 | 0) >> 2] | 0) + 28 | 0) >> 2] = HEAP32[($6_1 + 28 | 0) >> 2] | 0;
   HEAP32[((HEAP32[($6_1 + 88 | 0) >> 2] | 0) + 32 | 0) >> 2] = HEAP32[($6_1 + 48 | 0) >> 2] | 0;
   HEAP32[($6_1 + 92 | 0) >> 2] = 0;
  }
  $237 = HEAP32[($6_1 + 92 | 0) >> 2] | 0;
  label$29 : {
   $241 = $6_1 + 96 | 0;
   if ($241 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $241;
  }
  return $237 | 0;
 }
 
 function $63($0_1) {
  $0_1 = $0_1 | 0;
  var i64toi32_i32$0 = 0, $3_1 = 0, i64toi32_i32$1 = 0, $10_1 = 0, $9_1 = 0, $34_1 = 0, $42_1 = 0, $14_1 = 0, $14$hi = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $9_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $9_1;
  }
  HEAP32[($3_1 + 4 | 0) >> 2] = $0_1;
  label$3 : {
   label$4 : {
    if (!($7() | 0)) {
     break label$4
    }
    i64toi32_i32$0 = $65(HEAP32[($3_1 + 4 | 0) >> 2] | 0 | 0) | 0;
    i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
    $34_1 = i64toi32_i32$0;
    i64toi32_i32$0 = $3_1;
    HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] = $34_1;
    HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] = i64toi32_i32$1;
    break label$3;
   }
   i64toi32_i32$1 = $65(HEAP32[($3_1 + 4 | 0) >> 2] | 0 | 0) | 0;
   i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
   i64toi32_i32$0 = $66(i64toi32_i32$1 | 0, i64toi32_i32$0 | 0) | 0;
   i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
   $42_1 = i64toi32_i32$0;
   i64toi32_i32$0 = $3_1;
   HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] = $42_1;
   HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] = i64toi32_i32$1;
  }
  i64toi32_i32$1 = HEAP32[($3_1 + 8 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  $14_1 = i64toi32_i32$1;
  $14$hi = i64toi32_i32$0;
  label$5 : {
   $10_1 = $3_1 + 16 | 0;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $10_1;
  }
  i64toi32_i32$0 = $14$hi;
  i64toi32_i32$1 = $14_1;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$0;
  return i64toi32_i32$1 | 0;
 }
 
 function $64($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $2_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $2_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  return (HEAPU8[$2_1 >> 0] | 0 | ((HEAPU8[($2_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0) & 65535 | 0 | 0;
 }
 
 function $65($0_1) {
  $0_1 = $0_1 | 0;
  var $4_1 = 0, $3_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $4_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAPU8[$4_1 >> 0] | 0 | ((HEAPU8[($4_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[($4_1 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[($4_1 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  i64toi32_i32$1 = HEAPU8[($4_1 + 4 | 0) >> 0] | 0 | ((HEAPU8[($4_1 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[($4_1 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[($4_1 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
  return i64toi32_i32$0 | 0;
 }
 
 function $66($0_1, $0$hi) {
  $0_1 = $0_1 | 0;
  $0$hi = $0$hi | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$3 = 0, i64toi32_i32$4 = 0, $4$hi = 0, $4_1 = 0, $5$hi = 0, $7$hi = 0, $12$hi = 0, $16$hi = 0, $5_1 = 0, $51_1 = 0, $6$hi = 0, $7_1 = 0, $52_1 = 0, $8$hi = 0, $9$hi = 0, $11$hi = 0, $12_1 = 0, $53_1 = 0, $13$hi = 0, $14$hi = 0, $15$hi = 0, $16_1 = 0, $54_1 = 0, $17$hi = 0, $18$hi = 0, $21$hi = 0, $55_1 = 0, $22$hi = 0, $23$hi = 0, $24$hi = 0, $56_1 = 0, $25$hi = 0, $26$hi = 0, $28$hi = 0, $57_1 = 0, $29$hi = 0, $58_1 = 0, $30$hi = 0, $31$hi = 0, $32$hi = 0, $6_1 = 0, $53$hi = 0, $11_1 = 0, $15_1 = 0, $68$hi = 0, $71$hi = 0, $21_1 = 0, $24_1 = 0, $86$hi = 0, $28_1 = 0, $29_1 = 0, $99_1 = 0, $101$hi = 0, $104$hi = 0;
  i64toi32_i32$0 = $0$hi;
  i64toi32_i32$1 = global$0 - 16 | 0;
  HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] = $0_1;
  HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$2 = i64toi32_i32$1;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] | 0;
  $4_1 = i64toi32_i32$0;
  $4$hi = i64toi32_i32$1;
  i64toi32_i32$1 = 0;
  $5_1 = 56;
  $5$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $4$hi;
  i64toi32_i32$1 = $5$hi;
  i64toi32_i32$1 = $4$hi;
  i64toi32_i32$2 = i64toi32_i32$0;
  i64toi32_i32$0 = $5$hi;
  i64toi32_i32$3 = $5_1;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$0 = 0;
   $51_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$0 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
   $51_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
  }
  $6_1 = $51_1;
  $6$hi = i64toi32_i32$0;
  i64toi32_i32$0 = 0;
  $7_1 = 40;
  $7$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $4$hi;
  i64toi32_i32$0 = $7$hi;
  i64toi32_i32$0 = $4$hi;
  i64toi32_i32$1 = $4_1;
  i64toi32_i32$2 = $7$hi;
  i64toi32_i32$3 = $7_1;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = 0;
   $52_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$2 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
   $52_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$1 >>> i64toi32_i32$4 | 0) | 0;
  }
  $8$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 0;
  $9$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $8$hi;
  i64toi32_i32$2 = $9$hi;
  i64toi32_i32$2 = $8$hi;
  i64toi32_i32$0 = $52_1;
  i64toi32_i32$1 = $9$hi;
  i64toi32_i32$3 = 65280;
  i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1 | 0;
  $53$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $6$hi;
  i64toi32_i32$1 = $53$hi;
  i64toi32_i32$2 = i64toi32_i32$0 & i64toi32_i32$3 | 0;
  i64toi32_i32$0 = $6$hi;
  i64toi32_i32$3 = $6_1;
  i64toi32_i32$0 = i64toi32_i32$1 | i64toi32_i32$0 | 0;
  $11_1 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
  $11$hi = i64toi32_i32$0;
  i64toi32_i32$0 = 0;
  $12_1 = 24;
  $12$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $4$hi;
  i64toi32_i32$0 = $12$hi;
  i64toi32_i32$0 = $4$hi;
  i64toi32_i32$1 = $4_1;
  i64toi32_i32$2 = $12$hi;
  i64toi32_i32$3 = $12_1;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = 0;
   $53_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$2 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
   $53_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$1 >>> i64toi32_i32$4 | 0) | 0;
  }
  $13$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 0;
  $14$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $13$hi;
  i64toi32_i32$2 = $14$hi;
  i64toi32_i32$2 = $13$hi;
  i64toi32_i32$0 = $53_1;
  i64toi32_i32$1 = $14$hi;
  i64toi32_i32$3 = 16711680;
  i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1 | 0;
  $15_1 = i64toi32_i32$0 & i64toi32_i32$3 | 0;
  $15$hi = i64toi32_i32$1;
  i64toi32_i32$1 = 0;
  $16_1 = 8;
  $16$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $4$hi;
  i64toi32_i32$1 = $16$hi;
  i64toi32_i32$1 = $4$hi;
  i64toi32_i32$2 = $4_1;
  i64toi32_i32$0 = $16$hi;
  i64toi32_i32$3 = $16_1;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$0 = 0;
   $54_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$0 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
   $54_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
  }
  $17$hi = i64toi32_i32$0;
  i64toi32_i32$0 = 0;
  $18$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $17$hi;
  i64toi32_i32$0 = $18$hi;
  i64toi32_i32$0 = $17$hi;
  i64toi32_i32$1 = $54_1;
  i64toi32_i32$2 = $18$hi;
  i64toi32_i32$3 = -16777216;
  i64toi32_i32$2 = i64toi32_i32$0 & i64toi32_i32$2 | 0;
  $68$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $15$hi;
  i64toi32_i32$2 = $68$hi;
  i64toi32_i32$0 = i64toi32_i32$1 & i64toi32_i32$3 | 0;
  i64toi32_i32$1 = $15$hi;
  i64toi32_i32$3 = $15_1;
  i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1 | 0;
  $71$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $11$hi;
  i64toi32_i32$1 = $71$hi;
  i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$3 | 0;
  i64toi32_i32$0 = $11$hi;
  i64toi32_i32$3 = $11_1;
  i64toi32_i32$0 = i64toi32_i32$1 | i64toi32_i32$0 | 0;
  $21_1 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
  $21$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $4$hi;
  i64toi32_i32$0 = $16$hi;
  i64toi32_i32$0 = $4$hi;
  i64toi32_i32$1 = $4_1;
  i64toi32_i32$2 = $16$hi;
  i64toi32_i32$3 = $16_1;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
   $55_1 = 0;
  } else {
   i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$1 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$4 | 0) | 0;
   $55_1 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
  }
  $22$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 255;
  $23$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $22$hi;
  i64toi32_i32$2 = $23$hi;
  i64toi32_i32$2 = $22$hi;
  i64toi32_i32$0 = $55_1;
  i64toi32_i32$1 = $23$hi;
  i64toi32_i32$3 = 0;
  i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1 | 0;
  $24_1 = i64toi32_i32$0 & i64toi32_i32$3 | 0;
  $24$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $4$hi;
  i64toi32_i32$1 = $12$hi;
  i64toi32_i32$1 = $4$hi;
  i64toi32_i32$2 = $4_1;
  i64toi32_i32$0 = $12$hi;
  i64toi32_i32$3 = $12_1;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$0 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
   $56_1 = 0;
  } else {
   i64toi32_i32$0 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
   $56_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
  }
  $25$hi = i64toi32_i32$0;
  i64toi32_i32$0 = 65280;
  $26$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $25$hi;
  i64toi32_i32$0 = $26$hi;
  i64toi32_i32$0 = $25$hi;
  i64toi32_i32$1 = $56_1;
  i64toi32_i32$2 = $26$hi;
  i64toi32_i32$3 = 0;
  i64toi32_i32$2 = i64toi32_i32$0 & i64toi32_i32$2 | 0;
  $86$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $24$hi;
  i64toi32_i32$2 = $86$hi;
  i64toi32_i32$0 = i64toi32_i32$1 & i64toi32_i32$3 | 0;
  i64toi32_i32$1 = $24$hi;
  i64toi32_i32$3 = $24_1;
  i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1 | 0;
  $28_1 = i64toi32_i32$0 | i64toi32_i32$3 | 0;
  $28$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $4$hi;
  i64toi32_i32$1 = $5$hi;
  i64toi32_i32$1 = $4$hi;
  i64toi32_i32$2 = $4_1;
  i64toi32_i32$0 = $5$hi;
  i64toi32_i32$3 = $5_1;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$0 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
   $57_1 = 0;
  } else {
   i64toi32_i32$0 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
   $57_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
  }
  $29_1 = $57_1;
  $29$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $4$hi;
  i64toi32_i32$0 = $7$hi;
  i64toi32_i32$0 = $4$hi;
  i64toi32_i32$1 = $4_1;
  i64toi32_i32$2 = $7$hi;
  i64toi32_i32$3 = $7_1;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
   $58_1 = 0;
  } else {
   i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$1 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$4 | 0) | 0;
   $58_1 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
  }
  $30$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 16711680;
  $31$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $30$hi;
  i64toi32_i32$2 = $31$hi;
  i64toi32_i32$2 = $30$hi;
  i64toi32_i32$0 = $58_1;
  i64toi32_i32$1 = $31$hi;
  i64toi32_i32$3 = 0;
  i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1 | 0;
  $32$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $29$hi;
  i64toi32_i32$1 = $32$hi;
  $99_1 = i64toi32_i32$0 & i64toi32_i32$3 | 0;
  i64toi32_i32$1 = $29$hi;
  i64toi32_i32$2 = $29_1;
  i64toi32_i32$0 = $32$hi;
  i64toi32_i32$3 = $99_1;
  i64toi32_i32$0 = i64toi32_i32$1 | i64toi32_i32$0 | 0;
  $101$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $28$hi;
  i64toi32_i32$0 = $101$hi;
  i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
  i64toi32_i32$2 = $28$hi;
  i64toi32_i32$3 = $28_1;
  i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
  $104$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $21$hi;
  i64toi32_i32$2 = $104$hi;
  i64toi32_i32$0 = i64toi32_i32$1 | i64toi32_i32$3 | 0;
  i64toi32_i32$1 = $21$hi;
  i64toi32_i32$3 = $21_1;
  i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1 | 0;
  i64toi32_i32$0 = i64toi32_i32$0 | i64toi32_i32$3 | 0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
  return i64toi32_i32$0 | 0;
 }
 
 function $67($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $14_1 = 0, $13_1 = 0, $10_1 = 0;
  $5_1 = global$0 - 16 | 0;
  label$1 : {
   $13_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $13_1;
  }
  HEAP32[($5_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 8 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 4 | 0) >> 2] = $2_1;
  $10_1 = $62(HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 8 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 4 | 0) >> 2] | 0 | 0, 0 | 0) | 0;
  label$3 : {
   $14_1 = $5_1 + 16 | 0;
   if ($14_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $14_1;
  }
  return $10_1 | 0;
 }
 
 function $68($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $5_1 = 0, $43_1 = 0, $42_1 = 0, $39_1 = 0;
  $4_1 = global$0 - 32 | 0;
  label$1 : {
   $42_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $42_1;
  }
  $5_1 = 8;
  HEAP32[($4_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($4_1 + 16 | 0) >> 2] = $5_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($4_1 + 20 | 0) >> 2] | 0) >>> 0 < $5_1 >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($4_1 + 28 | 0) >> 2] = -72;
    break label$3;
   }
   HEAP32[($4_1 + 12 | 0) >> 2] = $6((HEAP32[($4_1 + 24 | 0) >> 2] | 0) + 4 | 0 | 0) | 0;
   label$5 : {
    if (!(((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 8 | 0) >>> 0 < (HEAP32[($4_1 + 12 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($4_1 + 28 | 0) >> 2] = -14;
    break label$3;
   }
   HEAP32[($4_1 + 8 | 0) >> 2] = (HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 8 | 0;
   label$6 : {
    if (!((HEAP32[($4_1 + 8 | 0) >> 2] | 0) >>> 0 > (HEAP32[($4_1 + 20 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$6
    }
    HEAP32[($4_1 + 28 | 0) >> 2] = -72;
    break label$3;
   }
   HEAP32[($4_1 + 28 | 0) >> 2] = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
  }
  $39_1 = HEAP32[($4_1 + 28 | 0) >> 2] | 0;
  label$7 : {
   $43_1 = $4_1 + 32 | 0;
   if ($43_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $43_1;
  }
  return $39_1 | 0;
 }
 
 function $69($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $14_1 = 0, $13_1 = 0, $10_1 = 0;
  $4_1 = global$0 - 32 | 0;
  label$1 : {
   $13_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $13_1;
  }
  HEAP32[($4_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 24 | 0) >> 2] = $1_1;
  $70($4_1 + 8 | 0 | 0, HEAP32[($4_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($4_1 + 24 | 0) >> 2] | 0 | 0);
  $10_1 = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
  label$3 : {
   $14_1 = $4_1 + 32 | 0;
   if ($14_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $14_1;
  }
  return $10_1 | 0;
 }
 
 function $70($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$0 = 0, i64toi32_i32$3 = 0, $132$hi = 0, $129_1 = 0, $34_1 = 0, $134$hi = 0, $137_1 = 0, $137$hi = 0, $122_1 = 0, $128_1 = 0, $127_1 = 0, $211 = 0, $221 = 0, $440 = 0, $450 = 0;
  $5_1 = global$0 - 112 | 0;
  label$1 : {
   $127_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $127_1;
  }
  HEAP32[($5_1 + 108 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 104 | 0) >> 2] = $2_1;
  i64toi32_i32$0 = 0;
  $129_1 = 0;
  i64toi32_i32$1 = $5_1 + 88 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $129_1;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$1 = i64toi32_i32$1 + 8 | 0;
  HEAP32[i64toi32_i32$1 >> 2] = $129_1;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($5_1 + 104 | 0) >> 2] | 0) >>> 0 >= 8 >>> 0 & 1 | 0)) {
     break label$4
    }
    if (!((($6(HEAP32[($5_1 + 108 | 0) >> 2] | 0 | 0) | 0) & -16 | 0 | 0) == (407710288 | 0) & 1 | 0)) {
     break label$4
    }
    HEAP32[($5_1 + 88 | 0) >> 2] = $68(HEAP32[($5_1 + 108 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 104 | 0) >> 2] | 0 | 0) | 0;
    i64toi32_i32$2 = $5_1 + 88 | 0;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
    $211 = i64toi32_i32$0;
    i64toi32_i32$0 = $0_1;
    HEAP32[$0_1 >> 2] = $211;
    HEAP32[($0_1 + 4 | 0) >> 2] = i64toi32_i32$1;
    $34_1 = 8;
    i64toi32_i32$2 = i64toi32_i32$2 + $34_1 | 0;
    i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
    i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
    $221 = i64toi32_i32$1;
    i64toi32_i32$1 = $0_1 + $34_1 | 0;
    HEAP32[i64toi32_i32$1 >> 2] = $221;
    HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
    break label$3;
   }
   HEAP32[($5_1 + 84 | 0) >> 2] = HEAP32[($5_1 + 108 | 0) >> 2] | 0;
   HEAP32[($5_1 + 80 | 0) >> 2] = HEAP32[($5_1 + 84 | 0) >> 2] | 0;
   HEAP32[($5_1 + 76 | 0) >> 2] = HEAP32[($5_1 + 104 | 0) >> 2] | 0;
   HEAP32[($5_1 + 72 | 0) >> 2] = 0;
   HEAP32[($5_1 + 28 | 0) >> 2] = $67($5_1 + 32 | 0 | 0, HEAP32[($5_1 + 108 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 104 | 0) >> 2] | 0 | 0) | 0;
   label$5 : {
    if (!($22(HEAP32[($5_1 + 28 | 0) >> 2] | 0 | 0) | 0)) {
     break label$5
    }
    $71($0_1 | 0, HEAP32[($5_1 + 28 | 0) >> 2] | 0 | 0);
    break label$3;
   }
   label$6 : {
    if (!((HEAP32[($5_1 + 28 | 0) >> 2] | 0) >>> 0 > 0 >>> 0 & 1 | 0)) {
     break label$6
    }
    $71($0_1 | 0, -72 | 0);
    break label$3;
   }
   HEAP32[($5_1 + 84 | 0) >> 2] = (HEAP32[($5_1 + 84 | 0) >> 2] | 0) + (HEAP32[($5_1 + 56 | 0) >> 2] | 0) | 0;
   HEAP32[($5_1 + 76 | 0) >> 2] = (HEAP32[($5_1 + 76 | 0) >> 2] | 0) - (HEAP32[($5_1 + 56 | 0) >> 2] | 0) | 0;
   label$7 : while (1) {
    HEAP32[($5_1 + 12 | 0) >> 2] = $72(HEAP32[($5_1 + 84 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 76 | 0) >> 2] | 0 | 0, $5_1 + 16 | 0 | 0) | 0;
    label$8 : {
     if (!($22(HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) | 0)) {
      break label$8
     }
     $71($0_1 | 0, HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0);
     break label$3;
    }
    label$9 : {
     if (!(((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 3 | 0) >>> 0 > (HEAP32[($5_1 + 76 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$9
     }
     $71($0_1 | 0, -72 | 0);
     break label$3;
    }
    HEAP32[($5_1 + 84 | 0) >> 2] = (HEAP32[($5_1 + 84 | 0) >> 2] | 0) + ((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 3 | 0) | 0;
    HEAP32[($5_1 + 76 | 0) >> 2] = (HEAP32[($5_1 + 76 | 0) >> 2] | 0) - ((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 3 | 0) | 0;
    HEAP32[($5_1 + 72 | 0) >> 2] = (HEAP32[($5_1 + 72 | 0) >> 2] | 0) + 1 | 0;
    label$10 : {
     label$11 : {
      if (!(HEAP32[($5_1 + 20 | 0) >> 2] | 0)) {
       break label$11
      }
      break label$10;
     }
     continue label$7;
    }
    break label$7;
   };
   label$12 : {
    if (!(HEAP32[($5_1 + 64 | 0) >> 2] | 0)) {
     break label$12
    }
    label$13 : {
     if (!((HEAP32[($5_1 + 76 | 0) >> 2] | 0) >>> 0 < 4 >>> 0 & 1 | 0)) {
      break label$13
     }
     $71($0_1 | 0, -72 | 0);
     break label$3;
    }
    HEAP32[($5_1 + 84 | 0) >> 2] = (HEAP32[($5_1 + 84 | 0) >> 2] | 0) + 4 | 0;
   }
   i64toi32_i32$0 = -1;
   $132$hi = i64toi32_i32$0;
   HEAP32[($5_1 + 88 | 0) >> 2] = (HEAP32[($5_1 + 84 | 0) >> 2] | 0) - (HEAP32[($5_1 + 80 | 0) >> 2] | 0) | 0;
   i64toi32_i32$2 = $5_1;
   i64toi32_i32$0 = HEAP32[($5_1 + 32 | 0) >> 2] | 0;
   i64toi32_i32$1 = HEAP32[($5_1 + 36 | 0) >> 2] | 0;
   $134$hi = i64toi32_i32$1;
   i64toi32_i32$1 = $132$hi;
   i64toi32_i32$1 = $134$hi;
   i64toi32_i32$1 = $132$hi;
   i64toi32_i32$1 = $134$hi;
   i64toi32_i32$2 = i64toi32_i32$0;
   i64toi32_i32$0 = $132$hi;
   i64toi32_i32$3 = -1;
   label$14 : {
    label$15 : {
     if (!(((i64toi32_i32$2 | 0) != (i64toi32_i32$3 | 0) | (i64toi32_i32$1 | 0) != (i64toi32_i32$0 | 0) | 0) & 1 | 0)) {
      break label$15
     }
     i64toi32_i32$3 = $5_1;
     i64toi32_i32$2 = HEAP32[($5_1 + 32 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[($5_1 + 36 | 0) >> 2] | 0;
     $137_1 = i64toi32_i32$2;
     $137$hi = i64toi32_i32$1;
     break label$14;
    }
    i64toi32_i32$1 = 0;
    $137_1 = Math_imul(HEAP32[($5_1 + 72 | 0) >> 2] | 0, HEAP32[($5_1 + 48 | 0) >> 2] | 0);
    $137$hi = i64toi32_i32$1;
   }
   i64toi32_i32$1 = $137$hi;
   i64toi32_i32$2 = $5_1;
   HEAP32[($5_1 + 96 | 0) >> 2] = $137_1;
   HEAP32[($5_1 + 100 | 0) >> 2] = i64toi32_i32$1;
   i64toi32_i32$3 = $5_1 + 88 | 0;
   i64toi32_i32$1 = HEAP32[i64toi32_i32$3 >> 2] | 0;
   i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 4 | 0) >> 2] | 0;
   $440 = i64toi32_i32$1;
   i64toi32_i32$1 = $0_1;
   HEAP32[i64toi32_i32$1 >> 2] = $440;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$2;
   $122_1 = 8;
   i64toi32_i32$3 = i64toi32_i32$3 + $122_1 | 0;
   i64toi32_i32$2 = HEAP32[i64toi32_i32$3 >> 2] | 0;
   i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 4 | 0) >> 2] | 0;
   $450 = i64toi32_i32$2;
   i64toi32_i32$2 = $0_1 + $122_1 | 0;
   HEAP32[i64toi32_i32$2 >> 2] = $450;
   HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] = i64toi32_i32$1;
  }
  label$16 : {
   $128_1 = $5_1 + 112 | 0;
   if ($128_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $128_1;
  }
  return;
 }
 
 function $71($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, i64toi32_i32$0 = 0;
  $4_1 = global$0 - 16 | 0;
  i64toi32_i32$0 = -1;
  HEAP32[($4_1 + 12 | 0) >> 2] = $1_1;
  HEAP32[$0_1 >> 2] = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  HEAP32[($0_1 + 8 | 0) >> 2] = -2;
  HEAP32[($0_1 + 12 | 0) >> 2] = i64toi32_i32$0;
  return;
 }
 
 function $72($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $54_1 = 0, $53_1 = 0, $50_1 = 0;
  $5_1 = global$0 - 32 | 0;
  label$1 : {
   $53_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $53_1;
  }
  HEAP32[($5_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 16 | 0) >> 2] = $2_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($5_1 + 20 | 0) >> 2] | 0) >>> 0 < 3 >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = -72;
    break label$3;
   }
   HEAP32[($5_1 + 12 | 0) >> 2] = $91(HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0) | 0;
   HEAP32[($5_1 + 8 | 0) >> 2] = (HEAP32[($5_1 + 12 | 0) >> 2] | 0) >>> 3 | 0;
   HEAP32[((HEAP32[($5_1 + 16 | 0) >> 2] | 0) + 4 | 0) >> 2] = (HEAP32[($5_1 + 12 | 0) >> 2] | 0) & 1 | 0;
   HEAP32[(HEAP32[($5_1 + 16 | 0) >> 2] | 0) >> 2] = ((HEAP32[($5_1 + 12 | 0) >> 2] | 0) >>> 1 | 0) & 3 | 0;
   HEAP32[((HEAP32[($5_1 + 16 | 0) >> 2] | 0) + 8 | 0) >> 2] = HEAP32[($5_1 + 8 | 0) >> 2] | 0;
   label$5 : {
    if (!((HEAP32[(HEAP32[($5_1 + 16 | 0) >> 2] | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
     break label$5
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = 1;
    break label$3;
   }
   label$6 : {
    if (!((HEAP32[(HEAP32[($5_1 + 16 | 0) >> 2] | 0) >> 2] | 0 | 0) == (3 | 0) & 1 | 0)) {
     break label$6
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($5_1 + 28 | 0) >> 2] = HEAP32[($5_1 + 8 | 0) >> 2] | 0;
  }
  $50_1 = HEAP32[($5_1 + 28 | 0) >> 2] | 0;
  label$7 : {
   $54_1 = $5_1 + 32 | 0;
   if ($54_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $54_1;
  }
  return $50_1 | 0;
 }
 
 function $73($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0;
  $4_1 = global$0 - 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 8 | 0) >> 2] = $1_1;
  label$1 : {
   if (!((HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0) != (HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28728 | 0) >> 2] | 0 | 0) & 1 | 0)) {
    break label$1
   }
   HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28740 | 0) >> 2] = HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28728 | 0) >> 2] | 0;
   HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28736 | 0) >> 2] = (HEAP32[($4_1 + 8 | 0) >> 2] | 0) + (0 - ((HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28728 | 0) >> 2] | 0) - (HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28732 | 0) >> 2] | 0) | 0) | 0) | 0;
   HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28732 | 0) >> 2] = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
   HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 28728 | 0) >> 2] = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
  }
  return;
 }
 
 function $74($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, $11_1 = 0, $124_1 = 0, $123_1 = 0, $120_1 = 0;
  $10_1 = global$0 - 80 | 0;
  label$1 : {
   $123_1 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $123_1;
  }
  $11_1 = 0;
  HEAP32[($10_1 + 72 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 68 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 64 | 0) >> 2] = $2_1;
  HEAP32[($10_1 + 60 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 56 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 52 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 48 | 0) >> 2] = $6_1;
  HEAP32[($10_1 + 44 | 0) >> 2] = $7_1;
  HEAP32[($10_1 + 40 | 0) >> 2] = HEAP32[($10_1 + 68 | 0) >> 2] | 0;
  HEAP32[($10_1 + 36 | 0) >> 2] = $11_1;
  label$3 : {
   if (!((HEAP32[($10_1 + 44 | 0) >> 2] | 0 | 0) != ($11_1 | 0) & 1 | 0)) {
    break label$3
   }
   HEAP32[($10_1 + 52 | 0) >> 2] = $50(HEAP32[($10_1 + 44 | 0) >> 2] | 0 | 0) | 0;
   HEAP32[($10_1 + 48 | 0) >> 2] = $51(HEAP32[($10_1 + 44 | 0) >> 2] | 0 | 0) | 0;
  }
  label$4 : {
   label$5 : {
    label$6 : while (1) {
     if (!((HEAP32[($10_1 + 56 | 0) >> 2] | 0) >>> 0 >= ($61(HEAP32[((HEAP32[($10_1 + 72 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 | 0) | 0) >>> 0 & 1 | 0)) {
      break label$5
     }
     HEAP32[($10_1 + 32 | 0) >> 2] = $6(HEAP32[($10_1 + 60 | 0) >> 2] | 0 | 0) | 0;
     label$7 : {
      if (!(((HEAP32[($10_1 + 32 | 0) >> 2] | 0) & -16 | 0 | 0) == (407710288 | 0) & 1 | 0)) {
       break label$7
      }
      HEAP32[($10_1 + 28 | 0) >> 2] = $68(HEAP32[($10_1 + 60 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 56 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[($10_1 + 24 | 0) >> 2] = HEAP32[($10_1 + 28 | 0) >> 2] | 0;
      label$8 : {
       if (!($3(HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0) | 0)) {
        break label$8
       }
       HEAP32[($10_1 + 76 | 0) >> 2] = HEAP32[($10_1 + 24 | 0) >> 2] | 0;
       break label$4;
      }
      HEAP32[($10_1 + 60 | 0) >> 2] = (HEAP32[($10_1 + 60 | 0) >> 2] | 0) + (HEAP32[($10_1 + 28 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 56 | 0) >> 2] = (HEAP32[($10_1 + 56 | 0) >> 2] | 0) - (HEAP32[($10_1 + 28 | 0) >> 2] | 0) | 0;
      continue label$6;
     }
     label$9 : {
      label$10 : {
       if (!((HEAP32[($10_1 + 44 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
        break label$10
       }
       HEAP32[($10_1 + 20 | 0) >> 2] = $75(HEAP32[($10_1 + 72 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 44 | 0) >> 2] | 0 | 0) | 0;
       label$11 : {
        if (!($3(HEAP32[($10_1 + 20 | 0) >> 2] | 0 | 0) | 0)) {
         break label$11
        }
        HEAP32[($10_1 + 76 | 0) >> 2] = HEAP32[($10_1 + 20 | 0) >> 2] | 0;
        break label$4;
       }
       break label$9;
      }
      HEAP32[($10_1 + 16 | 0) >> 2] = $76(HEAP32[($10_1 + 72 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 52 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 48 | 0) >> 2] | 0 | 0) | 0;
      label$12 : {
       if (!($3(HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0) | 0)) {
        break label$12
       }
       HEAP32[($10_1 + 76 | 0) >> 2] = HEAP32[($10_1 + 16 | 0) >> 2] | 0;
       break label$4;
      }
     }
     $73(HEAP32[($10_1 + 72 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 68 | 0) >> 2] | 0 | 0);
     HEAP32[($10_1 + 12 | 0) >> 2] = $77(HEAP32[($10_1 + 72 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 68 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 64 | 0) >> 2] | 0 | 0, $10_1 + 60 | 0 | 0, $10_1 + 56 | 0 | 0) | 0;
     label$13 : {
      if (!(($23(HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0) | 0 | 0) == (10 | 0) & 1 | 0)) {
       break label$13
      }
      if (!((HEAP32[($10_1 + 36 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
       break label$13
      }
      HEAP32[($10_1 + 76 | 0) >> 2] = -72;
      break label$4;
     }
     label$14 : {
      if (!($22(HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0) | 0)) {
       break label$14
      }
      HEAP32[($10_1 + 76 | 0) >> 2] = HEAP32[($10_1 + 12 | 0) >> 2] | 0;
      break label$4;
     }
     label$15 : {
      if (!(HEAP32[($10_1 + 12 | 0) >> 2] | 0)) {
       break label$15
      }
      HEAP32[($10_1 + 68 | 0) >> 2] = (HEAP32[($10_1 + 68 | 0) >> 2] | 0) + (HEAP32[($10_1 + 12 | 0) >> 2] | 0) | 0;
     }
     HEAP32[($10_1 + 64 | 0) >> 2] = (HEAP32[($10_1 + 64 | 0) >> 2] | 0) - (HEAP32[($10_1 + 12 | 0) >> 2] | 0) | 0;
     HEAP32[($10_1 + 36 | 0) >> 2] = 1;
     continue label$6;
    };
   }
   label$16 : {
    if (!(HEAP32[($10_1 + 56 | 0) >> 2] | 0)) {
     break label$16
    }
    HEAP32[($10_1 + 76 | 0) >> 2] = -72;
    break label$4;
   }
   HEAP32[($10_1 + 76 | 0) >> 2] = (HEAP32[($10_1 + 68 | 0) >> 2] | 0) - (HEAP32[($10_1 + 40 | 0) >> 2] | 0) | 0;
  }
  $120_1 = HEAP32[($10_1 + 76 | 0) >> 2] | 0;
  label$17 : {
   $124_1 = $10_1 + 80 | 0;
   if ($124_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $124_1;
  }
  return $120_1 | 0;
 }
 
 function $75($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $47_1 = 0, $46_1 = 0, $43_1 = 0;
  $4_1 = global$0 - 32 | 0;
  label$1 : {
   $46_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $46_1;
  }
  HEAP32[($4_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 20 | 0) >> 2] = $1_1;
  label$3 : {
   if (!((HEAP32[($4_1 + 20 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
    break label$3
   }
   HEAP32[($4_1 + 16 | 0) >> 2] = $50(HEAP32[($4_1 + 20 | 0) >> 2] | 0 | 0) | 0;
   HEAP32[($4_1 + 12 | 0) >> 2] = $51(HEAP32[($4_1 + 20 | 0) >> 2] | 0 | 0) | 0;
   HEAP32[($4_1 + 8 | 0) >> 2] = (HEAP32[($4_1 + 16 | 0) >> 2] | 0) + (HEAP32[($4_1 + 12 | 0) >> 2] | 0) | 0;
   HEAP32[((HEAP32[($4_1 + 24 | 0) >> 2] | 0) + 28956 | 0) >> 2] = (HEAP32[((HEAP32[($4_1 + 24 | 0) >> 2] | 0) + 28740 | 0) >> 2] | 0 | 0) != (HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0) & 1 | 0;
  }
  HEAP32[($4_1 + 4 | 0) >> 2] = $106(HEAP32[($4_1 + 24 | 0) >> 2] | 0 | 0) | 0;
  label$4 : {
   label$5 : {
    if (!($3(HEAP32[($4_1 + 4 | 0) >> 2] | 0 | 0) | 0)) {
     break label$5
    }
    HEAP32[($4_1 + 28 | 0) >> 2] = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
    break label$4;
   }
   label$6 : {
    if (!((HEAP32[($4_1 + 20 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
     break label$6
    }
    $52(HEAP32[($4_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($4_1 + 20 | 0) >> 2] | 0 | 0);
   }
   HEAP32[($4_1 + 28 | 0) >> 2] = 0;
  }
  $43_1 = HEAP32[($4_1 + 28 | 0) >> 2] | 0;
  label$7 : {
   $47_1 = $4_1 + 32 | 0;
   if ($47_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $47_1;
  }
  return $43_1 | 0;
 }
 
 function $76($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $30_1 = 0, $29_1 = 0, $26_1 = 0;
  $5_1 = global$0 - 32 | 0;
  label$1 : {
   $29_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $29_1;
  }
  HEAP32[($5_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 16 | 0) >> 2] = $2_1;
  HEAP32[($5_1 + 12 | 0) >> 2] = $106(HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   label$4 : {
    if (!($3(HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) | 0)) {
     break label$4
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = HEAP32[($5_1 + 12 | 0) >> 2] | 0;
    break label$3;
   }
   label$5 : {
    if (!((HEAP32[($5_1 + 20 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
     break label$5
    }
    if (!(HEAP32[($5_1 + 16 | 0) >> 2] | 0)) {
     break label$5
    }
    label$6 : {
     if (!($22($107(HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 16 | 0) >> 2] | 0 | 0) | 0 | 0) | 0)) {
      break label$6
     }
     HEAP32[($5_1 + 28 | 0) >> 2] = -30;
     break label$3;
    }
   }
   HEAP32[($5_1 + 28 | 0) >> 2] = 0;
  }
  $26_1 = HEAP32[($5_1 + 28 | 0) >> 2] | 0;
  label$7 : {
   $30_1 = $5_1 + 32 | 0;
   if ($30_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $30_1;
  }
  return $26_1 | 0;
 }
 
 function $77($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $7_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$3 = 0, i64toi32_i32$0 = 0, $198$hi = 0, $202$hi = 0, $203$hi = 0, $15_1 = 0, $93_1 = 0, $200$hi = 0, $197 = 0, $196 = 0, $202 = 0, $604 = 0, $193 = 0;
  $7_1 = global$0 - 96 | 0;
  label$1 : {
   $196 = $7_1;
   if ($7_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $196;
  }
  HEAP32[($7_1 + 88 | 0) >> 2] = $0_1;
  HEAP32[($7_1 + 84 | 0) >> 2] = $1_1;
  HEAP32[($7_1 + 80 | 0) >> 2] = $2_1;
  HEAP32[($7_1 + 76 | 0) >> 2] = $3_1;
  HEAP32[($7_1 + 72 | 0) >> 2] = $4_1;
  HEAP32[($7_1 + 68 | 0) >> 2] = HEAP32[(HEAP32[($7_1 + 76 | 0) >> 2] | 0) >> 2] | 0;
  HEAP32[($7_1 + 64 | 0) >> 2] = HEAP32[($7_1 + 84 | 0) >> 2] | 0;
  label$3 : {
   label$4 : {
    if (!(HEAP32[($7_1 + 80 | 0) >> 2] | 0)) {
     break label$4
    }
    $15_1 = (HEAP32[($7_1 + 64 | 0) >> 2] | 0) + (HEAP32[($7_1 + 80 | 0) >> 2] | 0) | 0;
    break label$3;
   }
   $15_1 = HEAP32[($7_1 + 64 | 0) >> 2] | 0;
  }
  HEAP32[($7_1 + 60 | 0) >> 2] = $15_1;
  HEAP32[($7_1 + 56 | 0) >> 2] = HEAP32[($7_1 + 64 | 0) >> 2] | 0;
  HEAP32[($7_1 + 52 | 0) >> 2] = HEAP32[(HEAP32[($7_1 + 72 | 0) >> 2] | 0) >> 2] | 0;
  label$5 : {
   label$6 : {
    if (!((HEAP32[($7_1 + 52 | 0) >> 2] | 0) >>> 0 < ((HEAP32[((HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 ? 2 : 6) + 3 | 0) >>> 0 & 1 | 0)) {
     break label$6
    }
    HEAP32[($7_1 + 92 | 0) >> 2] = -72;
    break label$5;
   }
   HEAP32[($7_1 + 48 | 0) >> 2] = $60(HEAP32[($7_1 + 68 | 0) >> 2] | 0 | 0, (HEAP32[((HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 ? 1 : 5) | 0, HEAP32[((HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 | 0) | 0;
   label$7 : {
    if (!($22(HEAP32[($7_1 + 48 | 0) >> 2] | 0 | 0) | 0)) {
     break label$7
    }
    HEAP32[($7_1 + 92 | 0) >> 2] = HEAP32[($7_1 + 48 | 0) >> 2] | 0;
    break label$5;
   }
   label$8 : {
    if (!((HEAP32[($7_1 + 52 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($7_1 + 48 | 0) >> 2] | 0) + 3 | 0) >>> 0 & 1 | 0)) {
     break label$8
    }
    HEAP32[($7_1 + 92 | 0) >> 2] = -72;
    break label$5;
   }
   HEAP32[($7_1 + 44 | 0) >> 2] = $84(HEAP32[($7_1 + 88 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 68 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 48 | 0) >> 2] | 0 | 0) | 0;
   label$9 : {
    if (!($3(HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0) | 0)) {
     break label$9
    }
    HEAP32[($7_1 + 92 | 0) >> 2] = HEAP32[($7_1 + 44 | 0) >> 2] | 0;
    break label$5;
   }
   HEAP32[($7_1 + 68 | 0) >> 2] = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + (HEAP32[($7_1 + 48 | 0) >> 2] | 0) | 0;
   HEAP32[($7_1 + 52 | 0) >> 2] = (HEAP32[($7_1 + 52 | 0) >> 2] | 0) - (HEAP32[($7_1 + 48 | 0) >> 2] | 0) | 0;
   label$10 : while (1) {
    HEAP32[($7_1 + 20 | 0) >> 2] = $72(HEAP32[($7_1 + 68 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0, $7_1 + 24 | 0 | 0) | 0;
    label$11 : {
     if (!($22(HEAP32[($7_1 + 20 | 0) >> 2] | 0 | 0) | 0)) {
      break label$11
     }
     HEAP32[($7_1 + 92 | 0) >> 2] = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
     break label$5;
    }
    HEAP32[($7_1 + 68 | 0) >> 2] = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + 3 | 0;
    HEAP32[($7_1 + 52 | 0) >> 2] = (HEAP32[($7_1 + 52 | 0) >> 2] | 0) - 3 | 0;
    label$12 : {
     if (!((HEAP32[($7_1 + 20 | 0) >> 2] | 0) >>> 0 > (HEAP32[($7_1 + 52 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$12
     }
     HEAP32[($7_1 + 92 | 0) >> 2] = -72;
     break label$5;
    }
    $93_1 = HEAP32[($7_1 + 24 | 0) >> 2] | 0;
    label$13 : {
     label$14 : {
      switch ($93_1 | 0) {
      case 2:
       HEAP32[($7_1 + 40 | 0) >> 2] = $85(HEAP32[($7_1 + 88 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0, (HEAP32[($7_1 + 60 | 0) >> 2] | 0) - (HEAP32[($7_1 + 56 | 0) >> 2] | 0) | 0 | 0, HEAP32[($7_1 + 68 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 20 | 0) >> 2] | 0 | 0, 1 | 0) | 0;
       break label$13;
      case 0:
       HEAP32[($7_1 + 40 | 0) >> 2] = $86(HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0, (HEAP32[($7_1 + 60 | 0) >> 2] | 0) - (HEAP32[($7_1 + 56 | 0) >> 2] | 0) | 0 | 0, HEAP32[($7_1 + 68 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 20 | 0) >> 2] | 0 | 0) | 0;
       break label$13;
      case 1:
       HEAP32[($7_1 + 40 | 0) >> 2] = $87(HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0, (HEAP32[($7_1 + 60 | 0) >> 2] | 0) - (HEAP32[($7_1 + 56 | 0) >> 2] | 0) | 0 | 0, (HEAPU8[(HEAP32[($7_1 + 68 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0 | 0, HEAP32[($7_1 + 32 | 0) >> 2] | 0 | 0) | 0;
       break label$13;
      case 3:
      default:
       break label$14;
      };
     }
     HEAP32[($7_1 + 92 | 0) >> 2] = -20;
     break label$5;
    }
    label$19 : {
     if (!($22(HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) | 0)) {
      break label$19
     }
     HEAP32[($7_1 + 92 | 0) >> 2] = HEAP32[($7_1 + 40 | 0) >> 2] | 0;
     break label$5;
    }
    label$20 : {
     if (!(HEAP32[((HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 28784 | 0) >> 2] | 0)) {
      break label$20
     }
     $88((HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 28816 | 0 | 0, HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) | 0;
    }
    label$21 : {
     if (!(HEAP32[($7_1 + 40 | 0) >> 2] | 0)) {
      break label$21
     }
     HEAP32[($7_1 + 56 | 0) >> 2] = (HEAP32[($7_1 + 56 | 0) >> 2] | 0) + (HEAP32[($7_1 + 40 | 0) >> 2] | 0) | 0;
    }
    HEAP32[($7_1 + 68 | 0) >> 2] = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + (HEAP32[($7_1 + 20 | 0) >> 2] | 0) | 0;
    HEAP32[($7_1 + 52 | 0) >> 2] = (HEAP32[($7_1 + 52 | 0) >> 2] | 0) - (HEAP32[($7_1 + 20 | 0) >> 2] | 0) | 0;
    label$22 : {
     label$23 : {
      if (!(HEAP32[($7_1 + 28 | 0) >> 2] | 0)) {
       break label$23
      }
      break label$22;
     }
     continue label$10;
    }
    break label$10;
   };
   i64toi32_i32$0 = -1;
   $198$hi = i64toi32_i32$0;
   i64toi32_i32$2 = HEAP32[($7_1 + 88 | 0) >> 2] | 0;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 28752 | 0) >> 2] | 0;
   i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 28756 | 0) >> 2] | 0;
   $200$hi = i64toi32_i32$1;
   i64toi32_i32$1 = $198$hi;
   i64toi32_i32$1 = $200$hi;
   i64toi32_i32$1 = $198$hi;
   i64toi32_i32$1 = $200$hi;
   i64toi32_i32$2 = i64toi32_i32$0;
   i64toi32_i32$0 = $198$hi;
   i64toi32_i32$3 = -1;
   label$24 : {
    if (!(((i64toi32_i32$2 | 0) != (i64toi32_i32$3 | 0) | (i64toi32_i32$1 | 0) != (i64toi32_i32$0 | 0) | 0) & 1 | 0)) {
     break label$24
    }
    i64toi32_i32$1 = (HEAP32[($7_1 + 56 | 0) >> 2] | 0) - (HEAP32[($7_1 + 64 | 0) >> 2] | 0) | 0;
    i64toi32_i32$2 = i64toi32_i32$1 >> 31 | 0;
    $202 = i64toi32_i32$1;
    $202$hi = i64toi32_i32$2;
    i64toi32_i32$3 = HEAP32[($7_1 + 88 | 0) >> 2] | 0;
    i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 28752 | 0) >> 2] | 0;
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 28756 | 0) >> 2] | 0;
    $203$hi = i64toi32_i32$1;
    i64toi32_i32$1 = $202$hi;
    i64toi32_i32$1 = $203$hi;
    i64toi32_i32$1 = $202$hi;
    i64toi32_i32$1 = $203$hi;
    $604 = i64toi32_i32$2;
    i64toi32_i32$1 = $202$hi;
    i64toi32_i32$3 = $202;
    i64toi32_i32$2 = $203$hi;
    i64toi32_i32$0 = $604;
    label$25 : {
     if (!(((i64toi32_i32$3 | 0) != (i64toi32_i32$0 | 0) | (i64toi32_i32$1 | 0) != (i64toi32_i32$2 | 0) | 0) & 1 | 0)) {
      break label$25
     }
     HEAP32[($7_1 + 92 | 0) >> 2] = -20;
     break label$5;
    }
   }
   label$26 : {
    if (!(HEAP32[((HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 28784 | 0) >> 2] | 0)) {
     break label$26
    }
    i64toi32_i32$3 = $89((HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 28816 | 0 | 0) | 0;
    i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
    HEAP32[($7_1 + 16 | 0) >> 2] = i64toi32_i32$3;
    label$27 : {
     if (!((HEAP32[($7_1 + 52 | 0) >> 2] | 0) >>> 0 < 4 >>> 0 & 1 | 0)) {
      break label$27
     }
     HEAP32[($7_1 + 92 | 0) >> 2] = -22;
     break label$5;
    }
    HEAP32[($7_1 + 12 | 0) >> 2] = $6(HEAP32[($7_1 + 68 | 0) >> 2] | 0 | 0) | 0;
    label$28 : {
     if (!((HEAP32[($7_1 + 12 | 0) >> 2] | 0 | 0) != (HEAP32[($7_1 + 16 | 0) >> 2] | 0 | 0) & 1 | 0)) {
      break label$28
     }
     HEAP32[($7_1 + 92 | 0) >> 2] = -22;
     break label$5;
    }
    HEAP32[($7_1 + 68 | 0) >> 2] = (HEAP32[($7_1 + 68 | 0) >> 2] | 0) + 4 | 0;
    HEAP32[($7_1 + 52 | 0) >> 2] = (HEAP32[($7_1 + 52 | 0) >> 2] | 0) - 4 | 0;
   }
   HEAP32[(HEAP32[($7_1 + 76 | 0) >> 2] | 0) >> 2] = HEAP32[($7_1 + 68 | 0) >> 2] | 0;
   HEAP32[(HEAP32[($7_1 + 72 | 0) >> 2] | 0) >> 2] = HEAP32[($7_1 + 52 | 0) >> 2] | 0;
   HEAP32[($7_1 + 92 | 0) >> 2] = (HEAP32[($7_1 + 56 | 0) >> 2] | 0) - (HEAP32[($7_1 + 64 | 0) >> 2] | 0) | 0;
  }
  $193 = HEAP32[($7_1 + 92 | 0) >> 2] | 0;
  label$29 : {
   $197 = $7_1 + 96 | 0;
   if ($197 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $197;
  }
  return $193 | 0;
 }
 
 function $78($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $7_1 = 0, $21_1 = 0, $20_1 = 0, $17_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $20_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $20_1;
  }
  HEAP32[($3_1 + 8 | 0) >> 2] = $0_1;
  $7_1 = (HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 28960 | 0) >> 2] | 0) + 1 | 0;
  label$3 : {
   label$4 : {
    switch ($7_1 | 0) {
    default:
    case 1:
     $59(HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0);
     HEAP32[($3_1 + 12 | 0) >> 2] = 0;
     break label$3;
    case 0:
     HEAP32[($3_1 + 12 | 0) >> 2] = HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 28948 | 0) >> 2] | 0;
     break label$3;
    case 2:
     break label$4;
    };
   }
   HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 28960 | 0) >> 2] = 0;
   HEAP32[($3_1 + 12 | 0) >> 2] = HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 28948 | 0) >> 2] | 0;
  }
  $17_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  label$8 : {
   $21_1 = $3_1 + 16 | 0;
   if ($21_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $21_1;
  }
  return $17_1 | 0;
 }
 
 function $79($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $8_1 = 0, $9_1 = 0, $20_1 = 0, $19_1 = 0, $16_1 = 0;
  $8_1 = global$0 - 32 | 0;
  label$1 : {
   $19_1 = $8_1;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $19_1;
  }
  $9_1 = 0;
  HEAP32[($8_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($8_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($8_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($8_1 + 16 | 0) >> 2] = $3_1;
  HEAP32[($8_1 + 12 | 0) >> 2] = $4_1;
  HEAP32[($8_1 + 8 | 0) >> 2] = $5_1;
  $16_1 = $74(HEAP32[($8_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 12 | 0) >> 2] | 0 | 0, $9_1 | 0, $9_1 | 0, HEAP32[($8_1 + 8 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   $20_1 = $8_1 + 32 | 0;
   if ($20_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $20_1;
  }
  return $16_1 | 0;
 }
 
 function $80($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  return HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28744 | 0) >> 2] | 0 | 0;
 }
 
 function $81($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $5_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 8 | 0) >> 2] = $0_1;
  $5_1 = HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 28804 | 0) >> 2] | 0;
  label$1 : {
   label$2 : {
    switch ($5_1 | 0) {
    default:
    case 0:
    case 1:
     HEAP32[($3_1 + 12 | 0) >> 2] = 0;
     break label$1;
    case 2:
     HEAP32[($3_1 + 12 | 0) >> 2] = 1;
     break label$1;
    case 3:
     HEAP32[($3_1 + 12 | 0) >> 2] = 2;
     break label$1;
    case 4:
     HEAP32[($3_1 + 12 | 0) >> 2] = 3;
     break label$1;
    case 5:
     HEAP32[($3_1 + 12 | 0) >> 2] = 4;
     break label$1;
    case 6:
    case 7:
     break label$2;
    };
   }
   HEAP32[($3_1 + 12 | 0) >> 2] = 5;
  }
  return HEAP32[($3_1 + 12 | 0) >> 2] | 0 | 0;
 }
 
 function $82($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $7_1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, i64toi32_i32$3 = 0, i64toi32_i32$5 = 0, i64toi32_i32$0 = 0, $296$hi = 0, $300$hi = 0, $301$hi = 0, $262 = 0, $284 = 0, $22_1 = 0, $135_1 = 0, $144_1 = 0, $165 = 0, $293$hi = 0, $195 = 0, i64toi32_i32$4 = 0, $298$hi = 0, $240 = 0, $292 = 0, $291 = 0, $52_1 = 0, $787$hi = 0, $300 = 0, $879 = 0, $281 = 0, $288 = 0;
  $7_1 = global$0 - 64 | 0;
  label$1 : {
   $291 = $7_1;
   if ($7_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $291;
  }
  HEAP32[($7_1 + 56 | 0) >> 2] = $0_1;
  HEAP32[($7_1 + 52 | 0) >> 2] = $1_1;
  HEAP32[($7_1 + 48 | 0) >> 2] = $2_1;
  HEAP32[($7_1 + 44 | 0) >> 2] = $3_1;
  HEAP32[($7_1 + 40 | 0) >> 2] = $4_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) != ($83(HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) | 0 | 0) & 1 | 0)) {
     break label$4
    }
    HEAP32[($7_1 + 60 | 0) >> 2] = -72;
    break label$3;
   }
   label$5 : {
    if (!(HEAP32[($7_1 + 48 | 0) >> 2] | 0)) {
     break label$5
    }
    $73(HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0);
   }
   $22_1 = HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] | 0;
   label$6 : {
    switch ($22_1 | 0) {
    case 0:
     label$14 : {
      if (HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0) {
       break label$14
      }
      label$15 : {
       if (!((($6(HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0) | 0) & -16 | 0 | 0) == (407710288 | 0) & 1 | 0)) {
        break label$15
       }
       $153((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 160144 | 0 | 0, HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) | 0;
       HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = 8 - (HEAP32[($7_1 + 40 | 0) >> 2] | 0) | 0;
       HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = 6;
       HEAP32[($7_1 + 60 | 0) >> 2] = 0;
       break label$3;
      }
     }
     $52_1 = $60(HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 | 0) | 0;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28904 | 0) >> 2] = $52_1;
     label$16 : {
      if (!($22(HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28904 | 0) >> 2] | 0 | 0) | 0)) {
       break label$16
      }
      HEAP32[($7_1 + 60 | 0) >> 2] = HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28904 | 0) >> 2] | 0;
      break label$3;
     }
     $153((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 160144 | 0 | 0, HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) | 0;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = (HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28904 | 0) >> 2] | 0) - (HEAP32[($7_1 + 40 | 0) >> 2] | 0) | 0;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = 1;
     HEAP32[($7_1 + 60 | 0) >> 2] = 0;
     break label$3;
    case 1:
     $153(((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 160144 | 0) + ((HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28904 | 0) >> 2] | 0) - (HEAP32[($7_1 + 40 | 0) >> 2] | 0) | 0) | 0 | 0, HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) | 0;
     HEAP32[($7_1 + 36 | 0) >> 2] = $84(HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0, (HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 160144 | 0 | 0, HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28904 | 0) >> 2] | 0 | 0) | 0;
     label$17 : {
      if (!($3(HEAP32[($7_1 + 36 | 0) >> 2] | 0 | 0) | 0)) {
       break label$17
      }
      HEAP32[($7_1 + 60 | 0) >> 2] = HEAP32[($7_1 + 36 | 0) >> 2] | 0;
      break label$3;
     }
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = 3;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = 2;
     HEAP32[($7_1 + 60 | 0) >> 2] = 0;
     break label$3;
    case 2:
     HEAP32[($7_1 + 20 | 0) >> 2] = $72(HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0, 3 | 0, $7_1 + 24 | 0 | 0) | 0;
     label$18 : {
      if (!($22(HEAP32[($7_1 + 20 | 0) >> 2] | 0 | 0) | 0)) {
       break label$18
      }
      HEAP32[($7_1 + 60 | 0) >> 2] = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
      break label$3;
     }
     label$19 : {
      if (!((HEAP32[($7_1 + 20 | 0) >> 2] | 0) >>> 0 > (HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28768 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$19
      }
      HEAP32[($7_1 + 60 | 0) >> 2] = -20;
      break label$3;
     }
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28800 | 0) >> 2] = HEAP32[($7_1 + 24 | 0) >> 2] | 0;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28932 | 0) >> 2] = HEAP32[($7_1 + 32 | 0) >> 2] | 0;
     label$20 : {
      if (!(HEAP32[($7_1 + 20 | 0) >> 2] | 0)) {
       break label$20
      }
      HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = HEAP32[($7_1 + 28 | 0) >> 2] | 0 ? 4 : 3;
      HEAP32[($7_1 + 60 | 0) >> 2] = 0;
      break label$3;
     }
     label$21 : {
      label$22 : {
       if (!(HEAP32[($7_1 + 28 | 0) >> 2] | 0)) {
        break label$22
       }
       label$23 : {
        label$24 : {
         if (!(HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28784 | 0) >> 2] | 0)) {
          break label$24
         }
         HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = 4;
         HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = 5;
         break label$23;
        }
        $135_1 = 0;
        HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = $135_1;
        HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = $135_1;
       }
       break label$21;
      }
      HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = 3;
      HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = 2;
     }
     HEAP32[($7_1 + 60 | 0) >> 2] = 0;
     break label$3;
    case 3:
    case 4:
     $144_1 = HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28800 | 0) >> 2] | 0;
     label$25 : {
      label$26 : {
       switch ($144_1 | 0) {
       case 2:
        HEAP32[($7_1 + 16 | 0) >> 2] = $85(HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 48 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0, 1 | 0) | 0;
        HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = 0;
        break label$25;
       case 0:
        HEAP32[($7_1 + 16 | 0) >> 2] = $86(HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 48 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) | 0;
        HEAP32[($7_1 + 12 | 0) >> 2] = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
        label$31 : {
         if (!($3(HEAP32[($7_1 + 12 | 0) >> 2] | 0 | 0) | 0)) {
          break label$31
         }
         HEAP32[($7_1 + 60 | 0) >> 2] = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
         break label$3;
        }
        $165 = HEAP32[($7_1 + 56 | 0) >> 2] | 0;
        HEAP32[($165 + 28744 | 0) >> 2] = (HEAP32[($165 + 28744 | 0) >> 2] | 0) - (HEAP32[($7_1 + 16 | 0) >> 2] | 0) | 0;
        break label$25;
       case 1:
        HEAP32[($7_1 + 16 | 0) >> 2] = $87(HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 48 | 0) >> 2] | 0 | 0, (HEAPU8[(HEAP32[($7_1 + 44 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0 | 0, HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28932 | 0) >> 2] | 0 | 0) | 0;
        HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = 0;
        break label$25;
       case 3:
       default:
        break label$26;
       };
      }
      HEAP32[($7_1 + 60 | 0) >> 2] = -20;
      break label$3;
     }
     HEAP32[($7_1 + 8 | 0) >> 2] = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
     label$32 : {
      if (!($3(HEAP32[($7_1 + 8 | 0) >> 2] | 0 | 0) | 0)) {
       break label$32
      }
      HEAP32[($7_1 + 60 | 0) >> 2] = HEAP32[($7_1 + 8 | 0) >> 2] | 0;
      break label$3;
     }
     label$33 : {
      if (!((HEAP32[($7_1 + 16 | 0) >> 2] | 0) >>> 0 > (HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28768 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$33
      }
      HEAP32[($7_1 + 60 | 0) >> 2] = -20;
      break label$3;
     }
     i64toi32_i32$0 = 0;
     $293$hi = i64toi32_i32$0;
     $195 = HEAP32[($7_1 + 56 | 0) >> 2] | 0;
     i64toi32_i32$2 = $195;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 28792 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 28796 | 0) >> 2] | 0;
     $787$hi = i64toi32_i32$1;
     i64toi32_i32$1 = $293$hi;
     i64toi32_i32$1 = $787$hi;
     i64toi32_i32$2 = i64toi32_i32$0;
     i64toi32_i32$0 = $293$hi;
     i64toi32_i32$3 = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
     i64toi32_i32$4 = i64toi32_i32$2 + i64toi32_i32$3 | 0;
     i64toi32_i32$5 = i64toi32_i32$1 + i64toi32_i32$0 | 0;
     if (i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) {
      i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
     }
     i64toi32_i32$2 = $195;
     HEAP32[(i64toi32_i32$2 + 28792 | 0) >> 2] = i64toi32_i32$4;
     HEAP32[(i64toi32_i32$2 + 28796 | 0) >> 2] = i64toi32_i32$5;
     label$34 : {
      if (!(HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28784 | 0) >> 2] | 0)) {
       break label$34
      }
      $88((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28816 | 0 | 0, HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 16 | 0) >> 2] | 0 | 0) | 0;
     }
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28728 | 0) >> 2] = (HEAP32[($7_1 + 52 | 0) >> 2] | 0) + (HEAP32[($7_1 + 16 | 0) >> 2] | 0) | 0;
     label$35 : {
      if (!((HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] | 0) >>> 0 > 0 >>> 0 & 1 | 0)) {
       break label$35
      }
      HEAP32[($7_1 + 60 | 0) >> 2] = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
      break label$3;
     }
     label$36 : {
      label$37 : {
       if (!((HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] | 0 | 0) == (4 | 0) & 1 | 0)) {
        break label$37
       }
       i64toi32_i32$5 = -1;
       $296$hi = i64toi32_i32$5;
       i64toi32_i32$1 = HEAP32[($7_1 + 56 | 0) >> 2] | 0;
       i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 28752 | 0) >> 2] | 0;
       i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 28756 | 0) >> 2] | 0;
       $298$hi = i64toi32_i32$2;
       i64toi32_i32$2 = $296$hi;
       i64toi32_i32$2 = $298$hi;
       i64toi32_i32$2 = $296$hi;
       i64toi32_i32$2 = $298$hi;
       i64toi32_i32$1 = i64toi32_i32$5;
       i64toi32_i32$5 = $296$hi;
       i64toi32_i32$3 = -1;
       label$38 : {
        if (!(((i64toi32_i32$1 | 0) != (i64toi32_i32$3 | 0) | (i64toi32_i32$2 | 0) != (i64toi32_i32$5 | 0) | 0) & 1 | 0)) {
         break label$38
        }
        i64toi32_i32$3 = HEAP32[($7_1 + 56 | 0) >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 28792 | 0) >> 2] | 0;
        i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 28796 | 0) >> 2] | 0;
        $300 = i64toi32_i32$1;
        $300$hi = i64toi32_i32$2;
        i64toi32_i32$3 = HEAP32[($7_1 + 56 | 0) >> 2] | 0;
        i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 28752 | 0) >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 28756 | 0) >> 2] | 0;
        $301$hi = i64toi32_i32$1;
        i64toi32_i32$1 = $300$hi;
        i64toi32_i32$1 = $301$hi;
        i64toi32_i32$1 = $300$hi;
        i64toi32_i32$1 = $301$hi;
        $879 = i64toi32_i32$2;
        i64toi32_i32$1 = $300$hi;
        i64toi32_i32$3 = $300;
        i64toi32_i32$2 = $301$hi;
        i64toi32_i32$5 = $879;
        if (!(((i64toi32_i32$3 | 0) != (i64toi32_i32$5 | 0) | (i64toi32_i32$1 | 0) != (i64toi32_i32$2 | 0) | 0) & 1 | 0)) {
         break label$38
        }
        HEAP32[($7_1 + 60 | 0) >> 2] = -20;
        break label$3;
       }
       label$39 : {
        label$40 : {
         if (!(HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28784 | 0) >> 2] | 0)) {
          break label$40
         }
         HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = 4;
         HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = 5;
         break label$39;
        }
        $240 = 0;
        HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = $240;
        HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = $240;
       }
       break label$36;
      }
      HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = 2;
      HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = 3;
     }
     HEAP32[($7_1 + 60 | 0) >> 2] = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
     break label$3;
    case 5:
     i64toi32_i32$3 = $89((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28816 | 0 | 0) | 0;
     i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
     HEAP32[($7_1 + 4 | 0) >> 2] = i64toi32_i32$3;
     HEAP32[$7_1 >> 2] = $6(HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0) | 0;
     label$41 : {
      if (!((HEAP32[$7_1 >> 2] | 0 | 0) != (HEAP32[($7_1 + 4 | 0) >> 2] | 0 | 0) & 1 | 0)) {
       break label$41
      }
      HEAP32[($7_1 + 60 | 0) >> 2] = -22;
      break label$3;
     }
     $262 = 0;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = $262;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = $262;
     HEAP32[($7_1 + 60 | 0) >> 2] = $262;
     break label$3;
    case 6:
     $153(((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 160144 | 0) + (8 - (HEAP32[($7_1 + 40 | 0) >> 2] | 0) | 0) | 0 | 0, HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) | 0;
     $281 = $6(((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 160144 | 0) + 4 | 0 | 0) | 0;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = $281;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = 7;
     HEAP32[($7_1 + 60 | 0) >> 2] = 0;
     break label$3;
    case 7:
     $284 = 0;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28744 | 0) >> 2] = $284;
     HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28804 | 0) >> 2] = $284;
     HEAP32[($7_1 + 60 | 0) >> 2] = $284;
     break label$3;
    default:
     break label$6;
    };
   }
   HEAP32[($7_1 + 60 | 0) >> 2] = -1;
  }
  $288 = HEAP32[($7_1 + 60 | 0) >> 2] | 0;
  label$42 : {
   $292 = $7_1 + 64 | 0;
   if ($292 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $292;
  }
  return $288 | 0;
 }
 
 function $83($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $35_1 = 0, $53_1 = 0, $56_1 = 0;
  $4_1 = global$0 - 16 | 0;
  HEAP32[($4_1 + 8 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 4 | 0) >> 2] = $1_1;
  label$1 : {
   label$2 : {
    if ((HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28804 | 0) >> 2] | 0 | 0) == (3 | 0) & 1 | 0) {
     break label$2
    }
    if ((HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28804 | 0) >> 2] | 0 | 0) == (4 | 0) & 1 | 0) {
     break label$2
    }
    HEAP32[($4_1 + 12 | 0) >> 2] = HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28744 | 0) >> 2] | 0;
    break label$1;
   }
   label$3 : {
    if (!(HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28800 | 0) >> 2] | 0)) {
     break label$3
    }
    HEAP32[($4_1 + 12 | 0) >> 2] = HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28744 | 0) >> 2] | 0;
    break label$1;
   }
   label$4 : {
    label$5 : {
     if (!((HEAP32[($4_1 + 4 | 0) >> 2] | 0) >>> 0 > 1 >>> 0 & 1 | 0)) {
      break label$5
     }
     $35_1 = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
     break label$4;
    }
    $35_1 = 1;
   }
   label$6 : {
    label$7 : {
     if (!($35_1 >>> 0 < (HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28744 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$7
     }
     label$8 : {
      label$9 : {
       if (!((HEAP32[($4_1 + 4 | 0) >> 2] | 0) >>> 0 > 1 >>> 0 & 1 | 0)) {
        break label$9
       }
       $53_1 = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
       break label$8;
      }
      $53_1 = 1;
     }
     $56_1 = $53_1;
     break label$6;
    }
    $56_1 = HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28744 | 0) >> 2] | 0;
   }
   HEAP32[($4_1 + 12 | 0) >> 2] = $56_1;
  }
  return HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0;
 }
 
 function $84($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $47_1 = 0, $46_1 = 0, i64toi32_i32$0 = 0, $43_1 = 0;
  $5_1 = global$0 - 32 | 0;
  label$1 : {
   $46_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $46_1;
  }
  HEAP32[($5_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 16 | 0) >> 2] = $2_1;
  HEAP32[($5_1 + 12 | 0) >> 2] = $62((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 28752 | 0 | 0, HEAP32[($5_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   label$4 : {
    if (!($22(HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) | 0)) {
     break label$4
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = HEAP32[($5_1 + 12 | 0) >> 2] | 0;
    break label$3;
   }
   label$5 : {
    if (!((HEAP32[($5_1 + 12 | 0) >> 2] | 0) >>> 0 > 0 >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = -72;
    break label$3;
   }
   label$6 : {
    if (!(HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 28780 | 0) >> 2] | 0)) {
     break label$6
    }
    if (!((HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 28952 | 0) >> 2] | 0 | 0) != (HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 28780 | 0) >> 2] | 0 | 0) & 1 | 0)) {
     break label$6
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = -32;
    break label$3;
   }
   label$7 : {
    if (!(HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 28784 | 0) >> 2] | 0)) {
     break label$7
    }
    i64toi32_i32$0 = 0;
    $90((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 28816 | 0 | 0, 0 | 0, i64toi32_i32$0 | 0) | 0;
   }
   HEAP32[($5_1 + 28 | 0) >> 2] = 0;
  }
  $43_1 = HEAP32[($5_1 + 28 | 0) >> 2] | 0;
  label$8 : {
   $47_1 = $5_1 + 32 | 0;
   if ($47_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $47_1;
  }
  return $43_1 | 0;
 }
 
 function $85($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $8_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$3 = 0, i64toi32_i32$4 = 0, $135$hi = 0, $137$hi = 0, $140$hi = 0, $12_1 = 0, $15_1 = 0, $134$hi = 0, $136$hi = 0, $24_1 = 0, $142$hi = 0, $133_1 = 0, $132_1 = 0, $135_1 = 0, $129_1 = 0;
  $8_1 = global$0 - 64 | 0;
  label$1 : {
   $132_1 = $8_1;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $132_1;
  }
  HEAP32[($8_1 + 56 | 0) >> 2] = $0_1;
  HEAP32[($8_1 + 52 | 0) >> 2] = $1_1;
  HEAP32[($8_1 + 48 | 0) >> 2] = $2_1;
  HEAP32[($8_1 + 44 | 0) >> 2] = $3_1;
  HEAP32[($8_1 + 40 | 0) >> 2] = $4_1;
  HEAP32[($8_1 + 36 | 0) >> 2] = $5_1;
  HEAP32[($8_1 + 32 | 0) >> 2] = HEAP32[($8_1 + 44 | 0) >> 2] | 0;
  $12_1 = 0;
  label$3 : {
   if (!($32() | 0)) {
    break label$3
   }
   $15_1 = 1;
   label$4 : {
    if (!(HEAP32[($8_1 + 36 | 0) >> 2] | 0)) {
     break label$4
    }
    i64toi32_i32$0 = 0;
    $134$hi = i64toi32_i32$0;
    i64toi32_i32$2 = HEAP32[($8_1 + 56 | 0) >> 2] | 0;
    i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 28760 | 0) >> 2] | 0;
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 28764 | 0) >> 2] | 0;
    $135_1 = i64toi32_i32$0;
    $135$hi = i64toi32_i32$1;
    i64toi32_i32$1 = 0;
    $136$hi = i64toi32_i32$1;
    i64toi32_i32$1 = $134$hi;
    i64toi32_i32$1 = $136$hi;
    i64toi32_i32$1 = $134$hi;
    i64toi32_i32$2 = 1;
    i64toi32_i32$0 = $136$hi;
    i64toi32_i32$3 = $32() | 0 ? 25 : 57;
    i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
     i64toi32_i32$0 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
     $24_1 = 0;
    } else {
     i64toi32_i32$0 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
     $24_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
    }
    $137$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $135$hi;
    i64toi32_i32$0 = $137$hi;
    i64toi32_i32$0 = $135$hi;
    i64toi32_i32$0 = $137$hi;
    i64toi32_i32$0 = $135$hi;
    i64toi32_i32$1 = $135_1;
    i64toi32_i32$2 = $137$hi;
    i64toi32_i32$3 = $24_1;
    $15_1 = i64toi32_i32$0 >>> 0 > i64toi32_i32$2 >>> 0 | ((i64toi32_i32$0 | 0) == (i64toi32_i32$2 | 0) & i64toi32_i32$1 >>> 0 > i64toi32_i32$3 >>> 0 | 0) | 0;
   }
   $12_1 = $15_1;
  }
  HEAP32[($8_1 + 28 | 0) >> 2] = $12_1 & 1 | 0;
  label$5 : {
   label$6 : {
    if (!((HEAP32[($8_1 + 40 | 0) >> 2] | 0) >>> 0 >= 131072 >>> 0 & 1 | 0)) {
     break label$6
    }
    HEAP32[($8_1 + 60 | 0) >> 2] = -72;
    break label$5;
   }
   HEAP32[($8_1 + 24 | 0) >> 2] = $92(HEAP32[($8_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 44 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 40 | 0) >> 2] | 0 | 0) | 0;
   label$7 : {
    if (!($22(HEAP32[($8_1 + 24 | 0) >> 2] | 0 | 0) | 0)) {
     break label$7
    }
    HEAP32[($8_1 + 60 | 0) >> 2] = HEAP32[($8_1 + 24 | 0) >> 2] | 0;
    break label$5;
   }
   HEAP32[($8_1 + 32 | 0) >> 2] = (HEAP32[($8_1 + 32 | 0) >> 2] | 0) + (HEAP32[($8_1 + 24 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 40 | 0) >> 2] = (HEAP32[($8_1 + 40 | 0) >> 2] | 0) - (HEAP32[($8_1 + 24 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 20 | 0) >> 2] = HEAP32[((HEAP32[($8_1 + 56 | 0) >> 2] | 0) + 28956 | 0) >> 2] | 0;
   HEAP32[($8_1 + 12 | 0) >> 2] = $93(HEAP32[($8_1 + 56 | 0) >> 2] | 0 | 0, $8_1 + 16 | 0 | 0, HEAP32[($8_1 + 32 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 40 | 0) >> 2] | 0 | 0) | 0;
   label$8 : {
    if (!($22(HEAP32[($8_1 + 12 | 0) >> 2] | 0 | 0) | 0)) {
     break label$8
    }
    HEAP32[($8_1 + 60 | 0) >> 2] = HEAP32[($8_1 + 12 | 0) >> 2] | 0;
    break label$5;
   }
   HEAP32[($8_1 + 32 | 0) >> 2] = (HEAP32[($8_1 + 32 | 0) >> 2] | 0) + (HEAP32[($8_1 + 12 | 0) >> 2] | 0) | 0;
   HEAP32[($8_1 + 40 | 0) >> 2] = (HEAP32[($8_1 + 40 | 0) >> 2] | 0) - (HEAP32[($8_1 + 12 | 0) >> 2] | 0) | 0;
   label$9 : {
    if (!((HEAP32[($8_1 + 52 | 0) >> 2] | 0 | 0) == (0 | 0) & 1 | 0)) {
     break label$9
    }
    if (!((HEAP32[($8_1 + 16 | 0) >> 2] | 0 | 0) > (0 | 0) & 1 | 0)) {
     break label$9
    }
    HEAP32[($8_1 + 60 | 0) >> 2] = -70;
    break label$5;
   }
   label$10 : {
    if (HEAP32[($8_1 + 20 | 0) >> 2] | 0) {
     break label$10
    }
    label$11 : {
     if (!(HEAP32[($8_1 + 36 | 0) >> 2] | 0)) {
      break label$11
     }
     i64toi32_i32$1 = 0;
     $140$hi = i64toi32_i32$1;
     i64toi32_i32$3 = HEAP32[($8_1 + 56 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 28760 | 0) >> 2] | 0;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 28764 | 0) >> 2] | 0;
     $142$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $140$hi;
     i64toi32_i32$0 = $142$hi;
     i64toi32_i32$0 = $140$hi;
     i64toi32_i32$0 = $142$hi;
     i64toi32_i32$3 = i64toi32_i32$1;
     i64toi32_i32$1 = $140$hi;
     i64toi32_i32$2 = 16777216;
     if (!((i64toi32_i32$0 >>> 0 > i64toi32_i32$1 >>> 0 | ((i64toi32_i32$0 | 0) == (i64toi32_i32$1 | 0) & i64toi32_i32$3 >>> 0 > i64toi32_i32$2 >>> 0 | 0) | 0) & 1 | 0)) {
      break label$10
     }
    }
    if (!((HEAP32[($8_1 + 16 | 0) >> 2] | 0 | 0) > (4 | 0) & 1 | 0)) {
     break label$10
    }
    HEAP32[($8_1 + 8 | 0) >> 2] = $94(HEAP32[((HEAP32[($8_1 + 56 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0 | 0) | 0;
    HEAP32[($8_1 + 4 | 0) >> 2] = $29() | 0 ? 7 : 20;
    HEAP32[($8_1 + 20 | 0) >> 2] = (HEAP32[($8_1 + 8 | 0) >> 2] | 0) >>> 0 >= (HEAP32[($8_1 + 4 | 0) >> 2] | 0) >>> 0 & 1 | 0;
   }
   HEAP32[((HEAP32[($8_1 + 56 | 0) >> 2] | 0) + 28956 | 0) >> 2] = 0;
   label$12 : {
    if (!(HEAP32[($8_1 + 20 | 0) >> 2] | 0)) {
     break label$12
    }
    HEAP32[($8_1 + 60 | 0) >> 2] = $95(HEAP32[($8_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 52 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 48 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 32 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 36 | 0) >> 2] | 0 | 0) | 0;
    break label$5;
   }
   HEAP32[($8_1 + 60 | 0) >> 2] = $96(HEAP32[($8_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 52 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 48 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 32 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 40 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($8_1 + 36 | 0) >> 2] | 0 | 0) | 0;
  }
  $129_1 = HEAP32[($8_1 + 60 | 0) >> 2] | 0;
  label$13 : {
   $133_1 = $8_1 + 64 | 0;
   if ($133_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $133_1;
  }
  return $129_1 | 0;
 }
 
 function $86($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var $6_1 = 0, $33_1 = 0, $32_1 = 0, $29_1 = 0;
  $6_1 = global$0 - 32 | 0;
  label$1 : {
   $32_1 = $6_1;
   if ($6_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $32_1;
  }
  HEAP32[($6_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($6_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($6_1 + 16 | 0) >> 2] = $2_1;
  HEAP32[($6_1 + 12 | 0) >> 2] = $3_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($6_1 + 24 | 0) >> 2] | 0 | 0) == (0 | 0) & 1 | 0)) {
     break label$4
    }
    label$5 : {
     if (HEAP32[($6_1 + 12 | 0) >> 2] | 0) {
      break label$5
     }
     HEAP32[($6_1 + 28 | 0) >> 2] = 0;
     break label$3;
    }
    HEAP32[($6_1 + 28 | 0) >> 2] = -74;
    break label$3;
   }
   label$6 : {
    if (!((HEAP32[($6_1 + 12 | 0) >> 2] | 0) >>> 0 > (HEAP32[($6_1 + 20 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$6
    }
    HEAP32[($6_1 + 28 | 0) >> 2] = -70;
    break label$3;
   }
   $153(HEAP32[($6_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($6_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($6_1 + 12 | 0) >> 2] | 0 | 0) | 0;
   HEAP32[($6_1 + 28 | 0) >> 2] = HEAP32[($6_1 + 12 | 0) >> 2] | 0;
  }
  $29_1 = HEAP32[($6_1 + 28 | 0) >> 2] | 0;
  label$7 : {
   $33_1 = $6_1 + 32 | 0;
   if ($33_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $33_1;
  }
  return $29_1 | 0;
 }
 
 function $87($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var $6_1 = 0, $35_1 = 0, $34_1 = 0, $31_1 = 0;
  $6_1 = global$0 - 32 | 0;
  label$1 : {
   $34_1 = $6_1;
   if ($6_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $34_1;
  }
  HEAP32[($6_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($6_1 + 20 | 0) >> 2] = $1_1;
  HEAP8[($6_1 + 19 | 0) >> 0] = $2_1;
  HEAP32[($6_1 + 12 | 0) >> 2] = $3_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($6_1 + 24 | 0) >> 2] | 0 | 0) == (0 | 0) & 1 | 0)) {
     break label$4
    }
    label$5 : {
     if (HEAP32[($6_1 + 12 | 0) >> 2] | 0) {
      break label$5
     }
     HEAP32[($6_1 + 28 | 0) >> 2] = 0;
     break label$3;
    }
    HEAP32[($6_1 + 28 | 0) >> 2] = -74;
    break label$3;
   }
   label$6 : {
    if (!((HEAP32[($6_1 + 12 | 0) >> 2] | 0) >>> 0 > (HEAP32[($6_1 + 20 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$6
    }
    HEAP32[($6_1 + 28 | 0) >> 2] = -70;
    break label$3;
   }
   $154(HEAP32[($6_1 + 24 | 0) >> 2] | 0 | 0, (HEAPU8[($6_1 + 19 | 0) >> 0] | 0) & 255 | 0 | 0, HEAP32[($6_1 + 12 | 0) >> 2] | 0 | 0) | 0;
   HEAP32[($6_1 + 28 | 0) >> 2] = HEAP32[($6_1 + 12 | 0) >> 2] | 0;
  }
  $31_1 = HEAP32[($6_1 + 28 | 0) >> 2] | 0;
  label$7 : {
   $35_1 = $6_1 + 32 | 0;
   if ($35_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $35_1;
  }
  return $31_1 | 0;
 }
 
 function $88($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, i64toi32_i32$5 = 0, i64toi32_i32$4 = 0, i64toi32_i32$0 = 0, i64toi32_i32$3 = 0, $9_1 = 0, $773$hi = 0, $29_1 = 0, $56_1 = 0, $61_1 = 0, $776$hi = 0, $778 = 0, $778$hi = 0, $783 = 0, $783$hi = 0, $104_1 = 0, $787$hi = 0, $789$hi = 0, $791 = 0, $791$hi = 0, $796 = 0, $796$hi = 0, $139_1 = 0, $800$hi = 0, $802$hi = 0, $804 = 0, $804$hi = 0, $809 = 0, $809$hi = 0, $174 = 0, $813$hi = 0, $815$hi = 0, $817 = 0, $817$hi = 0, $822 = 0, $822$hi = 0, $826$hi = 0, $234 = 0, $832$hi = 0, $834 = 0, $834$hi = 0, $839 = 0, $839$hi = 0, $263 = 0, $843$hi = 0, $845$hi = 0, $847 = 0, $847$hi = 0, $852 = 0, $852$hi = 0, $295 = 0, $856$hi = 0, $858$hi = 0, $860 = 0, $860$hi = 0, $865 = 0, $865$hi = 0, $327 = 0, $869$hi = 0, $871$hi = 0, $873 = 0, $873$hi = 0, $878 = 0, $878$hi = 0, $882$hi = 0, $888$hi = 0, $404 = 0, $431 = 0, $436 = 0, $891$hi = 0, $893 = 0, $893$hi = 0, $898 = 0, $898$hi = 0, $479 = 0, $902$hi = 0, $904$hi = 0, $906 = 0, $906$hi = 0, $911 = 0, $911$hi = 0, $514 = 0, $915$hi = 0, $917$hi = 0, $919 = 0, $919$hi = 0, $924 = 0, $924$hi = 0, $549 = 0, $928$hi = 0, $930$hi = 0, $932 = 0, $932$hi = 0, $937 = 0, $937$hi = 0, $941$hi = 0, $609 = 0, $947$hi = 0, $949 = 0, $949$hi = 0, $954 = 0, $954$hi = 0, $638 = 0, $958$hi = 0, $960$hi = 0, $962 = 0, $962$hi = 0, $967 = 0, $967$hi = 0, $670 = 0, $971$hi = 0, $973$hi = 0, $975 = 0, $975$hi = 0, $980 = 0, $980$hi = 0, $702 = 0, $984$hi = 0, $986$hi = 0, $988 = 0, $988$hi = 0, $993 = 0, $993$hi = 0, $997$hi = 0, $772 = 0, $771 = 0, $18_1 = 0, $21_1 = 0, $22_1 = 0, $1076$hi = 0, $776 = 0, $77_1 = 0, $79_1 = 0, $1270 = 0, $1275 = 0, $789 = 0, $112_1 = 0, $114_1 = 0, $1373 = 0, $1378 = 0, $802 = 0, $147_1 = 0, $149_1 = 0, $1476 = 0, $1481 = 0, $815 = 0, $182 = 0, $184 = 0, $1579 = 0, $1584 = 0, $1632 = 0, $1638 = 0, $1644 = 0, $1650 = 0, $832 = 0, $236 = 0, $238 = 0, $1740 = 0, $1743 = 0, $845 = 0, $268 = 0, $270 = 0, $1840 = 0, $1843 = 0, $858 = 0, $300 = 0, $302 = 0, $1940 = 0, $1943 = 0, $871 = 0, $332 = 0, $334 = 0, $2040 = 0, $2043 = 0, $2069 = 0, $2075 = 0, $2081 = 0, $2087 = 0, $393 = 0, $396 = 0, $397 = 0, $2173$hi = 0, $891 = 0, $452 = 0, $454 = 0, $2367 = 0, $2372 = 0, $904 = 0, $487 = 0, $489 = 0, $2470 = 0, $2475 = 0, $917 = 0, $522 = 0, $524 = 0, $2573 = 0, $2578 = 0, $930 = 0, $557 = 0, $559 = 0, $2676 = 0, $2681 = 0, $2729 = 0, $2735 = 0, $2741 = 0, $2747 = 0, $947 = 0, $611 = 0, $613 = 0, $2837 = 0, $2840 = 0, $960 = 0, $643 = 0, $645 = 0, $2937 = 0, $2940 = 0, $973 = 0, $675 = 0, $677 = 0, $3037 = 0, $3040 = 0, $986 = 0, $707 = 0, $709 = 0, $3137 = 0, $3140 = 0, $3166 = 0, $3172 = 0, $3178 = 0, $3184 = 0, $768 = 0;
  $5_1 = global$0 - 672 | 0;
  label$1 : {
   $771 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $771;
  }
  HEAP32[($5_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 16 | 0) >> 2] = $2_1;
  $9_1 = 24;
  HEAP32[($5_1 + 12 | 0) >> 2] = ((HEAPU8[(0 + 3904 | 0) >> 0] | 0) << $9_1 | 0) >> $9_1 | 0;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
     break label$4
    }
    $18_1 = 32;
    $21_1 = HEAP32[($5_1 + 20 | 0) >> 2] | 0;
    $22_1 = HEAP32[($5_1 + 16 | 0) >> 2] | 0;
    HEAP32[($5_1 + 92 | 0) >> 2] = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
    HEAP32[($5_1 + 88 | 0) >> 2] = $21_1;
    HEAP32[($5_1 + 84 | 0) >> 2] = $22_1;
    HEAP32[($5_1 + 80 | 0) >> 2] = 1;
    HEAP32[($5_1 + 76 | 0) >> 2] = HEAP32[($5_1 + 88 | 0) >> 2] | 0;
    HEAP32[($5_1 + 72 | 0) >> 2] = (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + (HEAP32[($5_1 + 84 | 0) >> 2] | 0) | 0;
    i64toi32_i32$0 = 0;
    $773$hi = i64toi32_i32$0;
    $29_1 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
    i64toi32_i32$2 = $29_1;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
    $1076$hi = i64toi32_i32$1;
    i64toi32_i32$1 = $773$hi;
    i64toi32_i32$1 = $1076$hi;
    i64toi32_i32$2 = i64toi32_i32$0;
    i64toi32_i32$0 = $773$hi;
    i64toi32_i32$3 = HEAP32[($5_1 + 84 | 0) >> 2] | 0;
    i64toi32_i32$4 = i64toi32_i32$2 + i64toi32_i32$3 | 0;
    i64toi32_i32$5 = i64toi32_i32$1 + i64toi32_i32$0 | 0;
    if (i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) {
     i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
    }
    i64toi32_i32$2 = $29_1;
    HEAP32[i64toi32_i32$2 >> 2] = i64toi32_i32$4;
    HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] = i64toi32_i32$5;
    label$5 : {
     label$6 : {
      if (!(((HEAP32[((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) + (HEAP32[($5_1 + 84 | 0) >> 2] | 0) | 0) >>> 0 < $18_1 >>> 0 & 1 | 0)) {
       break label$6
      }
      label$7 : {
       if (!((HEAP32[($5_1 + 88 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
        break label$7
       }
       $97(((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 40 | 0) + (HEAP32[((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 88 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 84 | 0) >> 2] | 0 | 0) | 0;
      }
      $56_1 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      HEAP32[($56_1 + 72 | 0) >> 2] = (HEAP32[($56_1 + 72 | 0) >> 2] | 0) + (HEAP32[($5_1 + 84 | 0) >> 2] | 0) | 0;
      HEAP32[($5_1 + 96 | 0) >> 2] = 0;
      break label$5;
     }
     label$8 : {
      if (!(HEAP32[((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0)) {
       break label$8
      }
      $61_1 = 1;
      $97(((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 40 | 0) + (HEAP32[((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 88 | 0) >> 2] | 0 | 0, 32 - (HEAP32[((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) | 0 | 0) | 0;
      i64toi32_i32$1 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] | 0;
      $776 = i64toi32_i32$5;
      $776$hi = i64toi32_i32$2;
      $77_1 = HEAP32[($5_1 + 80 | 0) >> 2] | 0;
      HEAP32[($5_1 + 104 | 0) >> 2] = (HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 40 | 0;
      HEAP32[($5_1 + 100 | 0) >> 2] = $77_1;
      $79_1 = HEAP32[($5_1 + 100 | 0) >> 2] | 0;
      HEAP32[($5_1 + 116 | 0) >> 2] = HEAP32[($5_1 + 104 | 0) >> 2] | 0;
      HEAP32[($5_1 + 112 | 0) >> 2] = $79_1;
      HEAP32[($5_1 + 108 | 0) >> 2] = $61_1;
      label$9 : {
       label$10 : {
        if (!((HEAP32[($5_1 + 108 | 0) >> 2] | 0 | 0) == ($61_1 | 0) & 1 | 0)) {
         break label$10
        }
        label$11 : {
         label$12 : {
          if (!((HEAP32[($5_1 + 112 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$12
          }
          i64toi32_i32$2 = $98(HEAP32[($5_1 + 116 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
          $778 = i64toi32_i32$2;
          $778$hi = i64toi32_i32$5;
          break label$11;
         }
         i64toi32_i32$5 = $98(HEAP32[($5_1 + 116 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
         i64toi32_i32$2 = $99(i64toi32_i32$5 | 0, i64toi32_i32$2 | 0) | 0;
         i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
         $778 = i64toi32_i32$2;
         $778$hi = i64toi32_i32$5;
        }
        i64toi32_i32$5 = $778$hi;
        i64toi32_i32$2 = $5_1;
        HEAP32[($5_1 + 120 | 0) >> 2] = $778;
        HEAP32[($5_1 + 124 | 0) >> 2] = i64toi32_i32$5;
        break label$9;
       }
       label$13 : {
        label$14 : {
         if (!((HEAP32[($5_1 + 112 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$14
         }
         i64toi32_i32$1 = HEAP32[($5_1 + 116 | 0) >> 2] | 0;
         i64toi32_i32$5 = HEAP32[i64toi32_i32$1 >> 2] | 0;
         i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
         $783 = i64toi32_i32$5;
         $783$hi = i64toi32_i32$2;
         break label$13;
        }
        i64toi32_i32$1 = HEAP32[($5_1 + 116 | 0) >> 2] | 0;
        i64toi32_i32$2 = HEAP32[i64toi32_i32$1 >> 2] | 0;
        i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
        i64toi32_i32$5 = $99(i64toi32_i32$2 | 0, i64toi32_i32$5 | 0) | 0;
        i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
        $783 = i64toi32_i32$5;
        $783$hi = i64toi32_i32$2;
       }
       i64toi32_i32$2 = $783$hi;
       i64toi32_i32$5 = $5_1;
       HEAP32[($5_1 + 120 | 0) >> 2] = $783;
       HEAP32[($5_1 + 124 | 0) >> 2] = i64toi32_i32$2;
      }
      $104_1 = 1;
      i64toi32_i32$1 = $5_1;
      i64toi32_i32$2 = HEAP32[($5_1 + 120 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[($5_1 + 124 | 0) >> 2] | 0;
      $787$hi = i64toi32_i32$5;
      i64toi32_i32$5 = $776$hi;
      i64toi32_i32$5 = $787$hi;
      $1270 = i64toi32_i32$2;
      i64toi32_i32$5 = $776$hi;
      i64toi32_i32$2 = $787$hi;
      i64toi32_i32$2 = $100($776 | 0, i64toi32_i32$5 | 0, $1270 | 0, i64toi32_i32$2 | 0) | 0;
      i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
      $1275 = i64toi32_i32$2;
      i64toi32_i32$2 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] = $1275;
      HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] = i64toi32_i32$5;
      i64toi32_i32$1 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 16 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 20 | 0) >> 2] | 0;
      $789 = i64toi32_i32$5;
      $789$hi = i64toi32_i32$2;
      $112_1 = HEAP32[($5_1 + 80 | 0) >> 2] | 0;
      HEAP32[($5_1 + 136 | 0) >> 2] = ((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 40 | 0) + 8 | 0;
      HEAP32[($5_1 + 132 | 0) >> 2] = $112_1;
      $114_1 = HEAP32[($5_1 + 132 | 0) >> 2] | 0;
      HEAP32[($5_1 + 148 | 0) >> 2] = HEAP32[($5_1 + 136 | 0) >> 2] | 0;
      HEAP32[($5_1 + 144 | 0) >> 2] = $114_1;
      HEAP32[($5_1 + 140 | 0) >> 2] = $104_1;
      label$15 : {
       label$16 : {
        if (!((HEAP32[($5_1 + 140 | 0) >> 2] | 0 | 0) == ($104_1 | 0) & 1 | 0)) {
         break label$16
        }
        label$17 : {
         label$18 : {
          if (!((HEAP32[($5_1 + 144 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$18
          }
          i64toi32_i32$2 = $98(HEAP32[($5_1 + 148 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
          $791 = i64toi32_i32$2;
          $791$hi = i64toi32_i32$5;
          break label$17;
         }
         i64toi32_i32$5 = $98(HEAP32[($5_1 + 148 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
         i64toi32_i32$2 = $99(i64toi32_i32$5 | 0, i64toi32_i32$2 | 0) | 0;
         i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
         $791 = i64toi32_i32$2;
         $791$hi = i64toi32_i32$5;
        }
        i64toi32_i32$5 = $791$hi;
        i64toi32_i32$2 = $5_1;
        HEAP32[($5_1 + 152 | 0) >> 2] = $791;
        HEAP32[($5_1 + 156 | 0) >> 2] = i64toi32_i32$5;
        break label$15;
       }
       label$19 : {
        label$20 : {
         if (!((HEAP32[($5_1 + 144 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$20
         }
         i64toi32_i32$1 = HEAP32[($5_1 + 148 | 0) >> 2] | 0;
         i64toi32_i32$5 = HEAP32[i64toi32_i32$1 >> 2] | 0;
         i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
         $796 = i64toi32_i32$5;
         $796$hi = i64toi32_i32$2;
         break label$19;
        }
        i64toi32_i32$1 = HEAP32[($5_1 + 148 | 0) >> 2] | 0;
        i64toi32_i32$2 = HEAP32[i64toi32_i32$1 >> 2] | 0;
        i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
        i64toi32_i32$5 = $99(i64toi32_i32$2 | 0, i64toi32_i32$5 | 0) | 0;
        i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
        $796 = i64toi32_i32$5;
        $796$hi = i64toi32_i32$2;
       }
       i64toi32_i32$2 = $796$hi;
       i64toi32_i32$5 = $5_1;
       HEAP32[($5_1 + 152 | 0) >> 2] = $796;
       HEAP32[($5_1 + 156 | 0) >> 2] = i64toi32_i32$2;
      }
      $139_1 = 1;
      i64toi32_i32$1 = $5_1;
      i64toi32_i32$2 = HEAP32[($5_1 + 152 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[($5_1 + 156 | 0) >> 2] | 0;
      $800$hi = i64toi32_i32$5;
      i64toi32_i32$5 = $789$hi;
      i64toi32_i32$5 = $800$hi;
      $1373 = i64toi32_i32$2;
      i64toi32_i32$5 = $789$hi;
      i64toi32_i32$2 = $800$hi;
      i64toi32_i32$2 = $100($789 | 0, i64toi32_i32$5 | 0, $1373 | 0, i64toi32_i32$2 | 0) | 0;
      i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
      $1378 = i64toi32_i32$2;
      i64toi32_i32$2 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      HEAP32[(i64toi32_i32$2 + 16 | 0) >> 2] = $1378;
      HEAP32[(i64toi32_i32$2 + 20 | 0) >> 2] = i64toi32_i32$5;
      i64toi32_i32$1 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 24 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 28 | 0) >> 2] | 0;
      $802 = i64toi32_i32$5;
      $802$hi = i64toi32_i32$2;
      $147_1 = HEAP32[($5_1 + 80 | 0) >> 2] | 0;
      HEAP32[($5_1 + 168 | 0) >> 2] = ((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 40 | 0) + 16 | 0;
      HEAP32[($5_1 + 164 | 0) >> 2] = $147_1;
      $149_1 = HEAP32[($5_1 + 164 | 0) >> 2] | 0;
      HEAP32[($5_1 + 180 | 0) >> 2] = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
      HEAP32[($5_1 + 176 | 0) >> 2] = $149_1;
      HEAP32[($5_1 + 172 | 0) >> 2] = $139_1;
      label$21 : {
       label$22 : {
        if (!((HEAP32[($5_1 + 172 | 0) >> 2] | 0 | 0) == ($139_1 | 0) & 1 | 0)) {
         break label$22
        }
        label$23 : {
         label$24 : {
          if (!((HEAP32[($5_1 + 176 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$24
          }
          i64toi32_i32$2 = $98(HEAP32[($5_1 + 180 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
          $804 = i64toi32_i32$2;
          $804$hi = i64toi32_i32$5;
          break label$23;
         }
         i64toi32_i32$5 = $98(HEAP32[($5_1 + 180 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
         i64toi32_i32$2 = $99(i64toi32_i32$5 | 0, i64toi32_i32$2 | 0) | 0;
         i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
         $804 = i64toi32_i32$2;
         $804$hi = i64toi32_i32$5;
        }
        i64toi32_i32$5 = $804$hi;
        i64toi32_i32$2 = $5_1;
        HEAP32[($5_1 + 184 | 0) >> 2] = $804;
        HEAP32[($5_1 + 188 | 0) >> 2] = i64toi32_i32$5;
        break label$21;
       }
       label$25 : {
        label$26 : {
         if (!((HEAP32[($5_1 + 176 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$26
         }
         i64toi32_i32$1 = HEAP32[($5_1 + 180 | 0) >> 2] | 0;
         i64toi32_i32$5 = HEAP32[i64toi32_i32$1 >> 2] | 0;
         i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
         $809 = i64toi32_i32$5;
         $809$hi = i64toi32_i32$2;
         break label$25;
        }
        i64toi32_i32$1 = HEAP32[($5_1 + 180 | 0) >> 2] | 0;
        i64toi32_i32$2 = HEAP32[i64toi32_i32$1 >> 2] | 0;
        i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
        i64toi32_i32$5 = $99(i64toi32_i32$2 | 0, i64toi32_i32$5 | 0) | 0;
        i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
        $809 = i64toi32_i32$5;
        $809$hi = i64toi32_i32$2;
       }
       i64toi32_i32$2 = $809$hi;
       i64toi32_i32$5 = $5_1;
       HEAP32[($5_1 + 184 | 0) >> 2] = $809;
       HEAP32[($5_1 + 188 | 0) >> 2] = i64toi32_i32$2;
      }
      $174 = 1;
      i64toi32_i32$1 = $5_1;
      i64toi32_i32$2 = HEAP32[($5_1 + 184 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[($5_1 + 188 | 0) >> 2] | 0;
      $813$hi = i64toi32_i32$5;
      i64toi32_i32$5 = $802$hi;
      i64toi32_i32$5 = $813$hi;
      $1476 = i64toi32_i32$2;
      i64toi32_i32$5 = $802$hi;
      i64toi32_i32$2 = $813$hi;
      i64toi32_i32$2 = $100($802 | 0, i64toi32_i32$5 | 0, $1476 | 0, i64toi32_i32$2 | 0) | 0;
      i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
      $1481 = i64toi32_i32$2;
      i64toi32_i32$2 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      HEAP32[(i64toi32_i32$2 + 24 | 0) >> 2] = $1481;
      HEAP32[(i64toi32_i32$2 + 28 | 0) >> 2] = i64toi32_i32$5;
      i64toi32_i32$1 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 32 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 36 | 0) >> 2] | 0;
      $815 = i64toi32_i32$5;
      $815$hi = i64toi32_i32$2;
      $182 = HEAP32[($5_1 + 80 | 0) >> 2] | 0;
      HEAP32[($5_1 + 200 | 0) >> 2] = ((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 40 | 0) + 24 | 0;
      HEAP32[($5_1 + 196 | 0) >> 2] = $182;
      $184 = HEAP32[($5_1 + 196 | 0) >> 2] | 0;
      HEAP32[($5_1 + 212 | 0) >> 2] = HEAP32[($5_1 + 200 | 0) >> 2] | 0;
      HEAP32[($5_1 + 208 | 0) >> 2] = $184;
      HEAP32[($5_1 + 204 | 0) >> 2] = $174;
      label$27 : {
       label$28 : {
        if (!((HEAP32[($5_1 + 204 | 0) >> 2] | 0 | 0) == ($174 | 0) & 1 | 0)) {
         break label$28
        }
        label$29 : {
         label$30 : {
          if (!((HEAP32[($5_1 + 208 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$30
          }
          i64toi32_i32$2 = $98(HEAP32[($5_1 + 212 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
          $817 = i64toi32_i32$2;
          $817$hi = i64toi32_i32$5;
          break label$29;
         }
         i64toi32_i32$5 = $98(HEAP32[($5_1 + 212 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
         i64toi32_i32$2 = $99(i64toi32_i32$5 | 0, i64toi32_i32$2 | 0) | 0;
         i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
         $817 = i64toi32_i32$2;
         $817$hi = i64toi32_i32$5;
        }
        i64toi32_i32$5 = $817$hi;
        i64toi32_i32$2 = $5_1;
        HEAP32[($5_1 + 216 | 0) >> 2] = $817;
        HEAP32[($5_1 + 220 | 0) >> 2] = i64toi32_i32$5;
        break label$27;
       }
       label$31 : {
        label$32 : {
         if (!((HEAP32[($5_1 + 208 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$32
         }
         i64toi32_i32$1 = HEAP32[($5_1 + 212 | 0) >> 2] | 0;
         i64toi32_i32$5 = HEAP32[i64toi32_i32$1 >> 2] | 0;
         i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
         $822 = i64toi32_i32$5;
         $822$hi = i64toi32_i32$2;
         break label$31;
        }
        i64toi32_i32$1 = HEAP32[($5_1 + 212 | 0) >> 2] | 0;
        i64toi32_i32$2 = HEAP32[i64toi32_i32$1 >> 2] | 0;
        i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
        i64toi32_i32$5 = $99(i64toi32_i32$2 | 0, i64toi32_i32$5 | 0) | 0;
        i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
        $822 = i64toi32_i32$5;
        $822$hi = i64toi32_i32$2;
       }
       i64toi32_i32$2 = $822$hi;
       i64toi32_i32$5 = $5_1;
       HEAP32[($5_1 + 216 | 0) >> 2] = $822;
       HEAP32[($5_1 + 220 | 0) >> 2] = i64toi32_i32$2;
      }
      i64toi32_i32$1 = $5_1;
      i64toi32_i32$2 = HEAP32[($5_1 + 216 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[($5_1 + 220 | 0) >> 2] | 0;
      $826$hi = i64toi32_i32$5;
      i64toi32_i32$5 = $815$hi;
      i64toi32_i32$5 = $826$hi;
      $1579 = i64toi32_i32$2;
      i64toi32_i32$5 = $815$hi;
      i64toi32_i32$2 = $826$hi;
      i64toi32_i32$2 = $100($815 | 0, i64toi32_i32$5 | 0, $1579 | 0, i64toi32_i32$2 | 0) | 0;
      i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
      $1584 = i64toi32_i32$2;
      i64toi32_i32$2 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      HEAP32[(i64toi32_i32$2 + 32 | 0) >> 2] = $1584;
      HEAP32[(i64toi32_i32$2 + 36 | 0) >> 2] = i64toi32_i32$5;
      HEAP32[($5_1 + 76 | 0) >> 2] = (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + (32 - (HEAP32[((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) | 0) | 0;
      HEAP32[((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 72 | 0) >> 2] = 0;
     }
     label$33 : {
      if (!(((HEAP32[($5_1 + 76 | 0) >> 2] | 0) + 32 | 0) >>> 0 <= (HEAP32[($5_1 + 72 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$33
      }
      HEAP32[($5_1 + 68 | 0) >> 2] = (HEAP32[($5_1 + 72 | 0) >> 2] | 0) + -32 | 0;
      i64toi32_i32$1 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] | 0;
      $1632 = i64toi32_i32$5;
      i64toi32_i32$5 = $5_1;
      HEAP32[($5_1 + 56 | 0) >> 2] = $1632;
      HEAP32[($5_1 + 60 | 0) >> 2] = i64toi32_i32$2;
      i64toi32_i32$1 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 16 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 20 | 0) >> 2] | 0;
      $1638 = i64toi32_i32$2;
      i64toi32_i32$2 = $5_1;
      HEAP32[($5_1 + 48 | 0) >> 2] = $1638;
      HEAP32[($5_1 + 52 | 0) >> 2] = i64toi32_i32$5;
      i64toi32_i32$1 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 24 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 28 | 0) >> 2] | 0;
      $1644 = i64toi32_i32$5;
      i64toi32_i32$5 = $5_1;
      HEAP32[($5_1 + 40 | 0) >> 2] = $1644;
      HEAP32[($5_1 + 44 | 0) >> 2] = i64toi32_i32$2;
      i64toi32_i32$1 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 32 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 36 | 0) >> 2] | 0;
      $1650 = i64toi32_i32$2;
      i64toi32_i32$2 = $5_1;
      HEAP32[($5_1 + 32 | 0) >> 2] = $1650;
      HEAP32[($5_1 + 36 | 0) >> 2] = i64toi32_i32$5;
      label$34 : while (1) {
       $234 = 1;
       i64toi32_i32$1 = $5_1;
       i64toi32_i32$5 = HEAP32[($5_1 + 56 | 0) >> 2] | 0;
       i64toi32_i32$2 = HEAP32[($5_1 + 60 | 0) >> 2] | 0;
       $832 = i64toi32_i32$5;
       $832$hi = i64toi32_i32$2;
       $236 = HEAP32[($5_1 + 80 | 0) >> 2] | 0;
       HEAP32[($5_1 + 232 | 0) >> 2] = HEAP32[($5_1 + 76 | 0) >> 2] | 0;
       HEAP32[($5_1 + 228 | 0) >> 2] = $236;
       $238 = HEAP32[($5_1 + 228 | 0) >> 2] | 0;
       HEAP32[($5_1 + 244 | 0) >> 2] = HEAP32[($5_1 + 232 | 0) >> 2] | 0;
       HEAP32[($5_1 + 240 | 0) >> 2] = $238;
       HEAP32[($5_1 + 236 | 0) >> 2] = $234;
       label$35 : {
        label$36 : {
         if (!((HEAP32[($5_1 + 236 | 0) >> 2] | 0 | 0) == ($234 | 0) & 1 | 0)) {
          break label$36
         }
         label$37 : {
          label$38 : {
           if (!((HEAP32[($5_1 + 240 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
            break label$38
           }
           i64toi32_i32$2 = $98(HEAP32[($5_1 + 244 | 0) >> 2] | 0 | 0) | 0;
           i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
           $834 = i64toi32_i32$2;
           $834$hi = i64toi32_i32$5;
           break label$37;
          }
          i64toi32_i32$5 = $98(HEAP32[($5_1 + 244 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
          i64toi32_i32$2 = $99(i64toi32_i32$5 | 0, i64toi32_i32$2 | 0) | 0;
          i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
          $834 = i64toi32_i32$2;
          $834$hi = i64toi32_i32$5;
         }
         i64toi32_i32$5 = $834$hi;
         i64toi32_i32$2 = $5_1;
         HEAP32[($5_1 + 248 | 0) >> 2] = $834;
         HEAP32[($5_1 + 252 | 0) >> 2] = i64toi32_i32$5;
         break label$35;
        }
        label$39 : {
         label$40 : {
          if (!((HEAP32[($5_1 + 240 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$40
          }
          i64toi32_i32$1 = HEAP32[($5_1 + 244 | 0) >> 2] | 0;
          i64toi32_i32$5 = HEAP32[i64toi32_i32$1 >> 2] | 0;
          i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
          $839 = i64toi32_i32$5;
          $839$hi = i64toi32_i32$2;
          break label$39;
         }
         i64toi32_i32$1 = HEAP32[($5_1 + 244 | 0) >> 2] | 0;
         i64toi32_i32$2 = HEAP32[i64toi32_i32$1 >> 2] | 0;
         i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
         i64toi32_i32$5 = $99(i64toi32_i32$2 | 0, i64toi32_i32$5 | 0) | 0;
         i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
         $839 = i64toi32_i32$5;
         $839$hi = i64toi32_i32$2;
        }
        i64toi32_i32$2 = $839$hi;
        i64toi32_i32$5 = $5_1;
        HEAP32[($5_1 + 248 | 0) >> 2] = $839;
        HEAP32[($5_1 + 252 | 0) >> 2] = i64toi32_i32$2;
       }
       $263 = 1;
       i64toi32_i32$1 = $5_1;
       i64toi32_i32$2 = HEAP32[($5_1 + 248 | 0) >> 2] | 0;
       i64toi32_i32$5 = HEAP32[($5_1 + 252 | 0) >> 2] | 0;
       $843$hi = i64toi32_i32$5;
       i64toi32_i32$5 = $832$hi;
       i64toi32_i32$5 = $843$hi;
       $1740 = i64toi32_i32$2;
       i64toi32_i32$5 = $832$hi;
       i64toi32_i32$2 = $843$hi;
       i64toi32_i32$2 = $100($832 | 0, i64toi32_i32$5 | 0, $1740 | 0, i64toi32_i32$2 | 0) | 0;
       i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
       $1743 = i64toi32_i32$2;
       i64toi32_i32$2 = $5_1;
       HEAP32[($5_1 + 56 | 0) >> 2] = $1743;
       HEAP32[($5_1 + 60 | 0) >> 2] = i64toi32_i32$5;
       HEAP32[($5_1 + 76 | 0) >> 2] = (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + 8 | 0;
       i64toi32_i32$1 = $5_1;
       i64toi32_i32$5 = HEAP32[($5_1 + 48 | 0) >> 2] | 0;
       i64toi32_i32$2 = HEAP32[($5_1 + 52 | 0) >> 2] | 0;
       $845 = i64toi32_i32$5;
       $845$hi = i64toi32_i32$2;
       $268 = HEAP32[($5_1 + 80 | 0) >> 2] | 0;
       HEAP32[($5_1 + 264 | 0) >> 2] = HEAP32[($5_1 + 76 | 0) >> 2] | 0;
       HEAP32[($5_1 + 260 | 0) >> 2] = $268;
       $270 = HEAP32[($5_1 + 260 | 0) >> 2] | 0;
       HEAP32[($5_1 + 276 | 0) >> 2] = HEAP32[($5_1 + 264 | 0) >> 2] | 0;
       HEAP32[($5_1 + 272 | 0) >> 2] = $270;
       HEAP32[($5_1 + 268 | 0) >> 2] = $263;
       label$41 : {
        label$42 : {
         if (!((HEAP32[($5_1 + 268 | 0) >> 2] | 0 | 0) == ($263 | 0) & 1 | 0)) {
          break label$42
         }
         label$43 : {
          label$44 : {
           if (!((HEAP32[($5_1 + 272 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
            break label$44
           }
           i64toi32_i32$2 = $98(HEAP32[($5_1 + 276 | 0) >> 2] | 0 | 0) | 0;
           i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
           $847 = i64toi32_i32$2;
           $847$hi = i64toi32_i32$5;
           break label$43;
          }
          i64toi32_i32$5 = $98(HEAP32[($5_1 + 276 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
          i64toi32_i32$2 = $99(i64toi32_i32$5 | 0, i64toi32_i32$2 | 0) | 0;
          i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
          $847 = i64toi32_i32$2;
          $847$hi = i64toi32_i32$5;
         }
         i64toi32_i32$5 = $847$hi;
         i64toi32_i32$2 = $5_1;
         HEAP32[($5_1 + 280 | 0) >> 2] = $847;
         HEAP32[($5_1 + 284 | 0) >> 2] = i64toi32_i32$5;
         break label$41;
        }
        label$45 : {
         label$46 : {
          if (!((HEAP32[($5_1 + 272 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$46
          }
          i64toi32_i32$1 = HEAP32[($5_1 + 276 | 0) >> 2] | 0;
          i64toi32_i32$5 = HEAP32[i64toi32_i32$1 >> 2] | 0;
          i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
          $852 = i64toi32_i32$5;
          $852$hi = i64toi32_i32$2;
          break label$45;
         }
         i64toi32_i32$1 = HEAP32[($5_1 + 276 | 0) >> 2] | 0;
         i64toi32_i32$2 = HEAP32[i64toi32_i32$1 >> 2] | 0;
         i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
         i64toi32_i32$5 = $99(i64toi32_i32$2 | 0, i64toi32_i32$5 | 0) | 0;
         i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
         $852 = i64toi32_i32$5;
         $852$hi = i64toi32_i32$2;
        }
        i64toi32_i32$2 = $852$hi;
        i64toi32_i32$5 = $5_1;
        HEAP32[($5_1 + 280 | 0) >> 2] = $852;
        HEAP32[($5_1 + 284 | 0) >> 2] = i64toi32_i32$2;
       }
       $295 = 1;
       i64toi32_i32$1 = $5_1;
       i64toi32_i32$2 = HEAP32[($5_1 + 280 | 0) >> 2] | 0;
       i64toi32_i32$5 = HEAP32[($5_1 + 284 | 0) >> 2] | 0;
       $856$hi = i64toi32_i32$5;
       i64toi32_i32$5 = $845$hi;
       i64toi32_i32$5 = $856$hi;
       $1840 = i64toi32_i32$2;
       i64toi32_i32$5 = $845$hi;
       i64toi32_i32$2 = $856$hi;
       i64toi32_i32$2 = $100($845 | 0, i64toi32_i32$5 | 0, $1840 | 0, i64toi32_i32$2 | 0) | 0;
       i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
       $1843 = i64toi32_i32$2;
       i64toi32_i32$2 = $5_1;
       HEAP32[($5_1 + 48 | 0) >> 2] = $1843;
       HEAP32[($5_1 + 52 | 0) >> 2] = i64toi32_i32$5;
       HEAP32[($5_1 + 76 | 0) >> 2] = (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + 8 | 0;
       i64toi32_i32$1 = $5_1;
       i64toi32_i32$5 = HEAP32[($5_1 + 40 | 0) >> 2] | 0;
       i64toi32_i32$2 = HEAP32[($5_1 + 44 | 0) >> 2] | 0;
       $858 = i64toi32_i32$5;
       $858$hi = i64toi32_i32$2;
       $300 = HEAP32[($5_1 + 80 | 0) >> 2] | 0;
       HEAP32[($5_1 + 296 | 0) >> 2] = HEAP32[($5_1 + 76 | 0) >> 2] | 0;
       HEAP32[($5_1 + 292 | 0) >> 2] = $300;
       $302 = HEAP32[($5_1 + 292 | 0) >> 2] | 0;
       HEAP32[($5_1 + 308 | 0) >> 2] = HEAP32[($5_1 + 296 | 0) >> 2] | 0;
       HEAP32[($5_1 + 304 | 0) >> 2] = $302;
       HEAP32[($5_1 + 300 | 0) >> 2] = $295;
       label$47 : {
        label$48 : {
         if (!((HEAP32[($5_1 + 300 | 0) >> 2] | 0 | 0) == ($295 | 0) & 1 | 0)) {
          break label$48
         }
         label$49 : {
          label$50 : {
           if (!((HEAP32[($5_1 + 304 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
            break label$50
           }
           i64toi32_i32$2 = $98(HEAP32[($5_1 + 308 | 0) >> 2] | 0 | 0) | 0;
           i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
           $860 = i64toi32_i32$2;
           $860$hi = i64toi32_i32$5;
           break label$49;
          }
          i64toi32_i32$5 = $98(HEAP32[($5_1 + 308 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
          i64toi32_i32$2 = $99(i64toi32_i32$5 | 0, i64toi32_i32$2 | 0) | 0;
          i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
          $860 = i64toi32_i32$2;
          $860$hi = i64toi32_i32$5;
         }
         i64toi32_i32$5 = $860$hi;
         i64toi32_i32$2 = $5_1;
         HEAP32[($5_1 + 312 | 0) >> 2] = $860;
         HEAP32[($5_1 + 316 | 0) >> 2] = i64toi32_i32$5;
         break label$47;
        }
        label$51 : {
         label$52 : {
          if (!((HEAP32[($5_1 + 304 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$52
          }
          i64toi32_i32$1 = HEAP32[($5_1 + 308 | 0) >> 2] | 0;
          i64toi32_i32$5 = HEAP32[i64toi32_i32$1 >> 2] | 0;
          i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
          $865 = i64toi32_i32$5;
          $865$hi = i64toi32_i32$2;
          break label$51;
         }
         i64toi32_i32$1 = HEAP32[($5_1 + 308 | 0) >> 2] | 0;
         i64toi32_i32$2 = HEAP32[i64toi32_i32$1 >> 2] | 0;
         i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
         i64toi32_i32$5 = $99(i64toi32_i32$2 | 0, i64toi32_i32$5 | 0) | 0;
         i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
         $865 = i64toi32_i32$5;
         $865$hi = i64toi32_i32$2;
        }
        i64toi32_i32$2 = $865$hi;
        i64toi32_i32$5 = $5_1;
        HEAP32[($5_1 + 312 | 0) >> 2] = $865;
        HEAP32[($5_1 + 316 | 0) >> 2] = i64toi32_i32$2;
       }
       $327 = 1;
       i64toi32_i32$1 = $5_1;
       i64toi32_i32$2 = HEAP32[($5_1 + 312 | 0) >> 2] | 0;
       i64toi32_i32$5 = HEAP32[($5_1 + 316 | 0) >> 2] | 0;
       $869$hi = i64toi32_i32$5;
       i64toi32_i32$5 = $858$hi;
       i64toi32_i32$5 = $869$hi;
       $1940 = i64toi32_i32$2;
       i64toi32_i32$5 = $858$hi;
       i64toi32_i32$2 = $869$hi;
       i64toi32_i32$2 = $100($858 | 0, i64toi32_i32$5 | 0, $1940 | 0, i64toi32_i32$2 | 0) | 0;
       i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
       $1943 = i64toi32_i32$2;
       i64toi32_i32$2 = $5_1;
       HEAP32[($5_1 + 40 | 0) >> 2] = $1943;
       HEAP32[($5_1 + 44 | 0) >> 2] = i64toi32_i32$5;
       HEAP32[($5_1 + 76 | 0) >> 2] = (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + 8 | 0;
       i64toi32_i32$1 = $5_1;
       i64toi32_i32$5 = HEAP32[($5_1 + 32 | 0) >> 2] | 0;
       i64toi32_i32$2 = HEAP32[($5_1 + 36 | 0) >> 2] | 0;
       $871 = i64toi32_i32$5;
       $871$hi = i64toi32_i32$2;
       $332 = HEAP32[($5_1 + 80 | 0) >> 2] | 0;
       HEAP32[($5_1 + 328 | 0) >> 2] = HEAP32[($5_1 + 76 | 0) >> 2] | 0;
       HEAP32[($5_1 + 324 | 0) >> 2] = $332;
       $334 = HEAP32[($5_1 + 324 | 0) >> 2] | 0;
       HEAP32[($5_1 + 340 | 0) >> 2] = HEAP32[($5_1 + 328 | 0) >> 2] | 0;
       HEAP32[($5_1 + 336 | 0) >> 2] = $334;
       HEAP32[($5_1 + 332 | 0) >> 2] = $327;
       label$53 : {
        label$54 : {
         if (!((HEAP32[($5_1 + 332 | 0) >> 2] | 0 | 0) == ($327 | 0) & 1 | 0)) {
          break label$54
         }
         label$55 : {
          label$56 : {
           if (!((HEAP32[($5_1 + 336 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
            break label$56
           }
           i64toi32_i32$2 = $98(HEAP32[($5_1 + 340 | 0) >> 2] | 0 | 0) | 0;
           i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
           $873 = i64toi32_i32$2;
           $873$hi = i64toi32_i32$5;
           break label$55;
          }
          i64toi32_i32$5 = $98(HEAP32[($5_1 + 340 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
          i64toi32_i32$2 = $99(i64toi32_i32$5 | 0, i64toi32_i32$2 | 0) | 0;
          i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
          $873 = i64toi32_i32$2;
          $873$hi = i64toi32_i32$5;
         }
         i64toi32_i32$5 = $873$hi;
         i64toi32_i32$2 = $5_1;
         HEAP32[($5_1 + 344 | 0) >> 2] = $873;
         HEAP32[($5_1 + 348 | 0) >> 2] = i64toi32_i32$5;
         break label$53;
        }
        label$57 : {
         label$58 : {
          if (!((HEAP32[($5_1 + 336 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$58
          }
          i64toi32_i32$1 = HEAP32[($5_1 + 340 | 0) >> 2] | 0;
          i64toi32_i32$5 = HEAP32[i64toi32_i32$1 >> 2] | 0;
          i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
          $878 = i64toi32_i32$5;
          $878$hi = i64toi32_i32$2;
          break label$57;
         }
         i64toi32_i32$1 = HEAP32[($5_1 + 340 | 0) >> 2] | 0;
         i64toi32_i32$2 = HEAP32[i64toi32_i32$1 >> 2] | 0;
         i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
         i64toi32_i32$5 = $99(i64toi32_i32$2 | 0, i64toi32_i32$5 | 0) | 0;
         i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
         $878 = i64toi32_i32$5;
         $878$hi = i64toi32_i32$2;
        }
        i64toi32_i32$2 = $878$hi;
        i64toi32_i32$5 = $5_1;
        HEAP32[($5_1 + 344 | 0) >> 2] = $878;
        HEAP32[($5_1 + 348 | 0) >> 2] = i64toi32_i32$2;
       }
       i64toi32_i32$1 = $5_1;
       i64toi32_i32$2 = HEAP32[($5_1 + 344 | 0) >> 2] | 0;
       i64toi32_i32$5 = HEAP32[($5_1 + 348 | 0) >> 2] | 0;
       $882$hi = i64toi32_i32$5;
       i64toi32_i32$5 = $871$hi;
       i64toi32_i32$5 = $882$hi;
       $2040 = i64toi32_i32$2;
       i64toi32_i32$5 = $871$hi;
       i64toi32_i32$2 = $882$hi;
       i64toi32_i32$2 = $100($871 | 0, i64toi32_i32$5 | 0, $2040 | 0, i64toi32_i32$2 | 0) | 0;
       i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
       $2043 = i64toi32_i32$2;
       i64toi32_i32$2 = $5_1;
       HEAP32[($5_1 + 32 | 0) >> 2] = $2043;
       HEAP32[($5_1 + 36 | 0) >> 2] = i64toi32_i32$5;
       HEAP32[($5_1 + 76 | 0) >> 2] = (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + 8 | 0;
       if ((HEAP32[($5_1 + 76 | 0) >> 2] | 0) >>> 0 <= (HEAP32[($5_1 + 68 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
        continue label$34
       }
       break label$34;
      };
      i64toi32_i32$1 = $5_1;
      i64toi32_i32$5 = HEAP32[($5_1 + 56 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[($5_1 + 60 | 0) >> 2] | 0;
      $2069 = i64toi32_i32$5;
      i64toi32_i32$5 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      HEAP32[(i64toi32_i32$5 + 8 | 0) >> 2] = $2069;
      HEAP32[(i64toi32_i32$5 + 12 | 0) >> 2] = i64toi32_i32$2;
      i64toi32_i32$1 = $5_1;
      i64toi32_i32$2 = HEAP32[($5_1 + 48 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[($5_1 + 52 | 0) >> 2] | 0;
      $2075 = i64toi32_i32$2;
      i64toi32_i32$2 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      HEAP32[(i64toi32_i32$2 + 16 | 0) >> 2] = $2075;
      HEAP32[(i64toi32_i32$2 + 20 | 0) >> 2] = i64toi32_i32$5;
      i64toi32_i32$1 = $5_1;
      i64toi32_i32$5 = HEAP32[($5_1 + 40 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[($5_1 + 44 | 0) >> 2] | 0;
      $2081 = i64toi32_i32$5;
      i64toi32_i32$5 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      HEAP32[(i64toi32_i32$5 + 24 | 0) >> 2] = $2081;
      HEAP32[(i64toi32_i32$5 + 28 | 0) >> 2] = i64toi32_i32$2;
      i64toi32_i32$1 = $5_1;
      i64toi32_i32$2 = HEAP32[($5_1 + 32 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[($5_1 + 36 | 0) >> 2] | 0;
      $2087 = i64toi32_i32$2;
      i64toi32_i32$2 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
      HEAP32[(i64toi32_i32$2 + 32 | 0) >> 2] = $2087;
      HEAP32[(i64toi32_i32$2 + 36 | 0) >> 2] = i64toi32_i32$5;
     }
     label$59 : {
      if (!((HEAP32[($5_1 + 76 | 0) >> 2] | 0) >>> 0 < (HEAP32[($5_1 + 72 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$59
      }
      $97((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 40 | 0 | 0, HEAP32[($5_1 + 76 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 72 | 0) >> 2] | 0) - (HEAP32[($5_1 + 76 | 0) >> 2] | 0) | 0 | 0) | 0;
      HEAP32[((HEAP32[($5_1 + 92 | 0) >> 2] | 0) + 72 | 0) >> 2] = (HEAP32[($5_1 + 72 | 0) >> 2] | 0) - (HEAP32[($5_1 + 76 | 0) >> 2] | 0) | 0;
     }
     HEAP32[($5_1 + 96 | 0) >> 2] = 0;
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = HEAP32[($5_1 + 96 | 0) >> 2] | 0;
    break label$3;
   }
   $393 = 32;
   $396 = HEAP32[($5_1 + 20 | 0) >> 2] | 0;
   $397 = HEAP32[($5_1 + 16 | 0) >> 2] | 0;
   HEAP32[($5_1 + 412 | 0) >> 2] = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
   HEAP32[($5_1 + 408 | 0) >> 2] = $396;
   HEAP32[($5_1 + 404 | 0) >> 2] = $397;
   HEAP32[($5_1 + 400 | 0) >> 2] = 0;
   HEAP32[($5_1 + 396 | 0) >> 2] = HEAP32[($5_1 + 408 | 0) >> 2] | 0;
   HEAP32[($5_1 + 392 | 0) >> 2] = (HEAP32[($5_1 + 396 | 0) >> 2] | 0) + (HEAP32[($5_1 + 404 | 0) >> 2] | 0) | 0;
   i64toi32_i32$5 = 0;
   $888$hi = i64toi32_i32$5;
   $404 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
   i64toi32_i32$1 = $404;
   i64toi32_i32$5 = HEAP32[i64toi32_i32$1 >> 2] | 0;
   i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
   $2173$hi = i64toi32_i32$2;
   i64toi32_i32$2 = $888$hi;
   i64toi32_i32$2 = $2173$hi;
   i64toi32_i32$1 = i64toi32_i32$5;
   i64toi32_i32$5 = $888$hi;
   i64toi32_i32$3 = HEAP32[($5_1 + 404 | 0) >> 2] | 0;
   i64toi32_i32$0 = i64toi32_i32$1 + i64toi32_i32$3 | 0;
   i64toi32_i32$4 = i64toi32_i32$2 + i64toi32_i32$5 | 0;
   if (i64toi32_i32$0 >>> 0 < i64toi32_i32$3 >>> 0) {
    i64toi32_i32$4 = i64toi32_i32$4 + 1 | 0
   }
   i64toi32_i32$1 = $404;
   HEAP32[i64toi32_i32$1 >> 2] = i64toi32_i32$0;
   HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$4;
   label$60 : {
    label$61 : {
     if (!(((HEAP32[((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) + (HEAP32[($5_1 + 404 | 0) >> 2] | 0) | 0) >>> 0 < $393 >>> 0 & 1 | 0)) {
      break label$61
     }
     label$62 : {
      if (!((HEAP32[($5_1 + 408 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
       break label$62
      }
      $97(((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 40 | 0) + (HEAP32[((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 408 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 404 | 0) >> 2] | 0 | 0) | 0;
     }
     $431 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     HEAP32[($431 + 72 | 0) >> 2] = (HEAP32[($431 + 72 | 0) >> 2] | 0) + (HEAP32[($5_1 + 404 | 0) >> 2] | 0) | 0;
     HEAP32[($5_1 + 416 | 0) >> 2] = 0;
     break label$60;
    }
    label$63 : {
     if (!(HEAP32[((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0)) {
      break label$63
     }
     $436 = 1;
     $97(((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 40 | 0) + (HEAP32[((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 408 | 0) >> 2] | 0 | 0, 32 - (HEAP32[((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) | 0 | 0) | 0;
     i64toi32_i32$2 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] | 0;
     $891 = i64toi32_i32$4;
     $891$hi = i64toi32_i32$1;
     $452 = HEAP32[($5_1 + 400 | 0) >> 2] | 0;
     HEAP32[($5_1 + 424 | 0) >> 2] = (HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 40 | 0;
     HEAP32[($5_1 + 420 | 0) >> 2] = $452;
     $454 = HEAP32[($5_1 + 420 | 0) >> 2] | 0;
     HEAP32[($5_1 + 436 | 0) >> 2] = HEAP32[($5_1 + 424 | 0) >> 2] | 0;
     HEAP32[($5_1 + 432 | 0) >> 2] = $454;
     HEAP32[($5_1 + 428 | 0) >> 2] = $436;
     label$64 : {
      label$65 : {
       if (!((HEAP32[($5_1 + 428 | 0) >> 2] | 0 | 0) == ($436 | 0) & 1 | 0)) {
        break label$65
       }
       label$66 : {
        label$67 : {
         if (!((HEAP32[($5_1 + 432 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$67
         }
         i64toi32_i32$1 = $98(HEAP32[($5_1 + 436 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
         $893 = i64toi32_i32$1;
         $893$hi = i64toi32_i32$4;
         break label$66;
        }
        i64toi32_i32$4 = $98(HEAP32[($5_1 + 436 | 0) >> 2] | 0 | 0) | 0;
        i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
        i64toi32_i32$1 = $99(i64toi32_i32$4 | 0, i64toi32_i32$1 | 0) | 0;
        i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
        $893 = i64toi32_i32$1;
        $893$hi = i64toi32_i32$4;
       }
       i64toi32_i32$4 = $893$hi;
       i64toi32_i32$1 = $5_1;
       HEAP32[($5_1 + 440 | 0) >> 2] = $893;
       HEAP32[($5_1 + 444 | 0) >> 2] = i64toi32_i32$4;
       break label$64;
      }
      label$68 : {
       label$69 : {
        if (!((HEAP32[($5_1 + 432 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
         break label$69
        }
        i64toi32_i32$2 = HEAP32[($5_1 + 436 | 0) >> 2] | 0;
        i64toi32_i32$4 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        $898 = i64toi32_i32$4;
        $898$hi = i64toi32_i32$1;
        break label$68;
       }
       i64toi32_i32$2 = HEAP32[($5_1 + 436 | 0) >> 2] | 0;
       i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
       i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
       i64toi32_i32$4 = $99(i64toi32_i32$1 | 0, i64toi32_i32$4 | 0) | 0;
       i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
       $898 = i64toi32_i32$4;
       $898$hi = i64toi32_i32$1;
      }
      i64toi32_i32$1 = $898$hi;
      i64toi32_i32$4 = $5_1;
      HEAP32[($5_1 + 440 | 0) >> 2] = $898;
      HEAP32[($5_1 + 444 | 0) >> 2] = i64toi32_i32$1;
     }
     $479 = 1;
     i64toi32_i32$2 = $5_1;
     i64toi32_i32$1 = HEAP32[($5_1 + 440 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[($5_1 + 444 | 0) >> 2] | 0;
     $902$hi = i64toi32_i32$4;
     i64toi32_i32$4 = $891$hi;
     i64toi32_i32$4 = $902$hi;
     $2367 = i64toi32_i32$1;
     i64toi32_i32$4 = $891$hi;
     i64toi32_i32$1 = $902$hi;
     i64toi32_i32$1 = $100($891 | 0, i64toi32_i32$4 | 0, $2367 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
     $2372 = i64toi32_i32$1;
     i64toi32_i32$1 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] = $2372;
     HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] = i64toi32_i32$4;
     i64toi32_i32$2 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 16 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 20 | 0) >> 2] | 0;
     $904 = i64toi32_i32$4;
     $904$hi = i64toi32_i32$1;
     $487 = HEAP32[($5_1 + 400 | 0) >> 2] | 0;
     HEAP32[($5_1 + 456 | 0) >> 2] = ((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 40 | 0) + 8 | 0;
     HEAP32[($5_1 + 452 | 0) >> 2] = $487;
     $489 = HEAP32[($5_1 + 452 | 0) >> 2] | 0;
     HEAP32[($5_1 + 468 | 0) >> 2] = HEAP32[($5_1 + 456 | 0) >> 2] | 0;
     HEAP32[($5_1 + 464 | 0) >> 2] = $489;
     HEAP32[($5_1 + 460 | 0) >> 2] = $479;
     label$70 : {
      label$71 : {
       if (!((HEAP32[($5_1 + 460 | 0) >> 2] | 0 | 0) == ($479 | 0) & 1 | 0)) {
        break label$71
       }
       label$72 : {
        label$73 : {
         if (!((HEAP32[($5_1 + 464 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$73
         }
         i64toi32_i32$1 = $98(HEAP32[($5_1 + 468 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
         $906 = i64toi32_i32$1;
         $906$hi = i64toi32_i32$4;
         break label$72;
        }
        i64toi32_i32$4 = $98(HEAP32[($5_1 + 468 | 0) >> 2] | 0 | 0) | 0;
        i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
        i64toi32_i32$1 = $99(i64toi32_i32$4 | 0, i64toi32_i32$1 | 0) | 0;
        i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
        $906 = i64toi32_i32$1;
        $906$hi = i64toi32_i32$4;
       }
       i64toi32_i32$4 = $906$hi;
       i64toi32_i32$1 = $5_1;
       HEAP32[($5_1 + 472 | 0) >> 2] = $906;
       HEAP32[($5_1 + 476 | 0) >> 2] = i64toi32_i32$4;
       break label$70;
      }
      label$74 : {
       label$75 : {
        if (!((HEAP32[($5_1 + 464 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
         break label$75
        }
        i64toi32_i32$2 = HEAP32[($5_1 + 468 | 0) >> 2] | 0;
        i64toi32_i32$4 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        $911 = i64toi32_i32$4;
        $911$hi = i64toi32_i32$1;
        break label$74;
       }
       i64toi32_i32$2 = HEAP32[($5_1 + 468 | 0) >> 2] | 0;
       i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
       i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
       i64toi32_i32$4 = $99(i64toi32_i32$1 | 0, i64toi32_i32$4 | 0) | 0;
       i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
       $911 = i64toi32_i32$4;
       $911$hi = i64toi32_i32$1;
      }
      i64toi32_i32$1 = $911$hi;
      i64toi32_i32$4 = $5_1;
      HEAP32[($5_1 + 472 | 0) >> 2] = $911;
      HEAP32[($5_1 + 476 | 0) >> 2] = i64toi32_i32$1;
     }
     $514 = 1;
     i64toi32_i32$2 = $5_1;
     i64toi32_i32$1 = HEAP32[($5_1 + 472 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[($5_1 + 476 | 0) >> 2] | 0;
     $915$hi = i64toi32_i32$4;
     i64toi32_i32$4 = $904$hi;
     i64toi32_i32$4 = $915$hi;
     $2470 = i64toi32_i32$1;
     i64toi32_i32$4 = $904$hi;
     i64toi32_i32$1 = $915$hi;
     i64toi32_i32$1 = $100($904 | 0, i64toi32_i32$4 | 0, $2470 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
     $2475 = i64toi32_i32$1;
     i64toi32_i32$1 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     HEAP32[(i64toi32_i32$1 + 16 | 0) >> 2] = $2475;
     HEAP32[(i64toi32_i32$1 + 20 | 0) >> 2] = i64toi32_i32$4;
     i64toi32_i32$2 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 24 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 28 | 0) >> 2] | 0;
     $917 = i64toi32_i32$4;
     $917$hi = i64toi32_i32$1;
     $522 = HEAP32[($5_1 + 400 | 0) >> 2] | 0;
     HEAP32[($5_1 + 488 | 0) >> 2] = ((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 40 | 0) + 16 | 0;
     HEAP32[($5_1 + 484 | 0) >> 2] = $522;
     $524 = HEAP32[($5_1 + 484 | 0) >> 2] | 0;
     HEAP32[($5_1 + 500 | 0) >> 2] = HEAP32[($5_1 + 488 | 0) >> 2] | 0;
     HEAP32[($5_1 + 496 | 0) >> 2] = $524;
     HEAP32[($5_1 + 492 | 0) >> 2] = $514;
     label$76 : {
      label$77 : {
       if (!((HEAP32[($5_1 + 492 | 0) >> 2] | 0 | 0) == ($514 | 0) & 1 | 0)) {
        break label$77
       }
       label$78 : {
        label$79 : {
         if (!((HEAP32[($5_1 + 496 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$79
         }
         i64toi32_i32$1 = $98(HEAP32[($5_1 + 500 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
         $919 = i64toi32_i32$1;
         $919$hi = i64toi32_i32$4;
         break label$78;
        }
        i64toi32_i32$4 = $98(HEAP32[($5_1 + 500 | 0) >> 2] | 0 | 0) | 0;
        i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
        i64toi32_i32$1 = $99(i64toi32_i32$4 | 0, i64toi32_i32$1 | 0) | 0;
        i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
        $919 = i64toi32_i32$1;
        $919$hi = i64toi32_i32$4;
       }
       i64toi32_i32$4 = $919$hi;
       i64toi32_i32$1 = $5_1;
       HEAP32[($5_1 + 504 | 0) >> 2] = $919;
       HEAP32[($5_1 + 508 | 0) >> 2] = i64toi32_i32$4;
       break label$76;
      }
      label$80 : {
       label$81 : {
        if (!((HEAP32[($5_1 + 496 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
         break label$81
        }
        i64toi32_i32$2 = HEAP32[($5_1 + 500 | 0) >> 2] | 0;
        i64toi32_i32$4 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        $924 = i64toi32_i32$4;
        $924$hi = i64toi32_i32$1;
        break label$80;
       }
       i64toi32_i32$2 = HEAP32[($5_1 + 500 | 0) >> 2] | 0;
       i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
       i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
       i64toi32_i32$4 = $99(i64toi32_i32$1 | 0, i64toi32_i32$4 | 0) | 0;
       i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
       $924 = i64toi32_i32$4;
       $924$hi = i64toi32_i32$1;
      }
      i64toi32_i32$1 = $924$hi;
      i64toi32_i32$4 = $5_1;
      HEAP32[($5_1 + 504 | 0) >> 2] = $924;
      HEAP32[($5_1 + 508 | 0) >> 2] = i64toi32_i32$1;
     }
     $549 = 1;
     i64toi32_i32$2 = $5_1;
     i64toi32_i32$1 = HEAP32[($5_1 + 504 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[($5_1 + 508 | 0) >> 2] | 0;
     $928$hi = i64toi32_i32$4;
     i64toi32_i32$4 = $917$hi;
     i64toi32_i32$4 = $928$hi;
     $2573 = i64toi32_i32$1;
     i64toi32_i32$4 = $917$hi;
     i64toi32_i32$1 = $928$hi;
     i64toi32_i32$1 = $100($917 | 0, i64toi32_i32$4 | 0, $2573 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
     $2578 = i64toi32_i32$1;
     i64toi32_i32$1 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     HEAP32[(i64toi32_i32$1 + 24 | 0) >> 2] = $2578;
     HEAP32[(i64toi32_i32$1 + 28 | 0) >> 2] = i64toi32_i32$4;
     i64toi32_i32$2 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 32 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 36 | 0) >> 2] | 0;
     $930 = i64toi32_i32$4;
     $930$hi = i64toi32_i32$1;
     $557 = HEAP32[($5_1 + 400 | 0) >> 2] | 0;
     HEAP32[($5_1 + 520 | 0) >> 2] = ((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 40 | 0) + 24 | 0;
     HEAP32[($5_1 + 516 | 0) >> 2] = $557;
     $559 = HEAP32[($5_1 + 516 | 0) >> 2] | 0;
     HEAP32[($5_1 + 532 | 0) >> 2] = HEAP32[($5_1 + 520 | 0) >> 2] | 0;
     HEAP32[($5_1 + 528 | 0) >> 2] = $559;
     HEAP32[($5_1 + 524 | 0) >> 2] = $549;
     label$82 : {
      label$83 : {
       if (!((HEAP32[($5_1 + 524 | 0) >> 2] | 0 | 0) == ($549 | 0) & 1 | 0)) {
        break label$83
       }
       label$84 : {
        label$85 : {
         if (!((HEAP32[($5_1 + 528 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$85
         }
         i64toi32_i32$1 = $98(HEAP32[($5_1 + 532 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
         $932 = i64toi32_i32$1;
         $932$hi = i64toi32_i32$4;
         break label$84;
        }
        i64toi32_i32$4 = $98(HEAP32[($5_1 + 532 | 0) >> 2] | 0 | 0) | 0;
        i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
        i64toi32_i32$1 = $99(i64toi32_i32$4 | 0, i64toi32_i32$1 | 0) | 0;
        i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
        $932 = i64toi32_i32$1;
        $932$hi = i64toi32_i32$4;
       }
       i64toi32_i32$4 = $932$hi;
       i64toi32_i32$1 = $5_1;
       HEAP32[($5_1 + 536 | 0) >> 2] = $932;
       HEAP32[($5_1 + 540 | 0) >> 2] = i64toi32_i32$4;
       break label$82;
      }
      label$86 : {
       label$87 : {
        if (!((HEAP32[($5_1 + 528 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
         break label$87
        }
        i64toi32_i32$2 = HEAP32[($5_1 + 532 | 0) >> 2] | 0;
        i64toi32_i32$4 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        $937 = i64toi32_i32$4;
        $937$hi = i64toi32_i32$1;
        break label$86;
       }
       i64toi32_i32$2 = HEAP32[($5_1 + 532 | 0) >> 2] | 0;
       i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
       i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
       i64toi32_i32$4 = $99(i64toi32_i32$1 | 0, i64toi32_i32$4 | 0) | 0;
       i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
       $937 = i64toi32_i32$4;
       $937$hi = i64toi32_i32$1;
      }
      i64toi32_i32$1 = $937$hi;
      i64toi32_i32$4 = $5_1;
      HEAP32[($5_1 + 536 | 0) >> 2] = $937;
      HEAP32[($5_1 + 540 | 0) >> 2] = i64toi32_i32$1;
     }
     i64toi32_i32$2 = $5_1;
     i64toi32_i32$1 = HEAP32[($5_1 + 536 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[($5_1 + 540 | 0) >> 2] | 0;
     $941$hi = i64toi32_i32$4;
     i64toi32_i32$4 = $930$hi;
     i64toi32_i32$4 = $941$hi;
     $2676 = i64toi32_i32$1;
     i64toi32_i32$4 = $930$hi;
     i64toi32_i32$1 = $941$hi;
     i64toi32_i32$1 = $100($930 | 0, i64toi32_i32$4 | 0, $2676 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
     $2681 = i64toi32_i32$1;
     i64toi32_i32$1 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     HEAP32[(i64toi32_i32$1 + 32 | 0) >> 2] = $2681;
     HEAP32[(i64toi32_i32$1 + 36 | 0) >> 2] = i64toi32_i32$4;
     HEAP32[($5_1 + 396 | 0) >> 2] = (HEAP32[($5_1 + 396 | 0) >> 2] | 0) + (32 - (HEAP32[((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) | 0) | 0;
     HEAP32[((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 72 | 0) >> 2] = 0;
    }
    label$88 : {
     if (!(((HEAP32[($5_1 + 396 | 0) >> 2] | 0) + 32 | 0) >>> 0 <= (HEAP32[($5_1 + 392 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$88
     }
     HEAP32[($5_1 + 388 | 0) >> 2] = (HEAP32[($5_1 + 392 | 0) >> 2] | 0) + -32 | 0;
     i64toi32_i32$2 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] | 0;
     $2729 = i64toi32_i32$4;
     i64toi32_i32$4 = $5_1;
     HEAP32[($5_1 + 376 | 0) >> 2] = $2729;
     HEAP32[($5_1 + 380 | 0) >> 2] = i64toi32_i32$1;
     i64toi32_i32$2 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 16 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 20 | 0) >> 2] | 0;
     $2735 = i64toi32_i32$1;
     i64toi32_i32$1 = $5_1;
     HEAP32[($5_1 + 368 | 0) >> 2] = $2735;
     HEAP32[($5_1 + 372 | 0) >> 2] = i64toi32_i32$4;
     i64toi32_i32$2 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 24 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 28 | 0) >> 2] | 0;
     $2741 = i64toi32_i32$4;
     i64toi32_i32$4 = $5_1;
     HEAP32[($5_1 + 360 | 0) >> 2] = $2741;
     HEAP32[($5_1 + 364 | 0) >> 2] = i64toi32_i32$1;
     i64toi32_i32$2 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 32 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 36 | 0) >> 2] | 0;
     $2747 = i64toi32_i32$1;
     i64toi32_i32$1 = $5_1;
     HEAP32[($5_1 + 352 | 0) >> 2] = $2747;
     HEAP32[($5_1 + 356 | 0) >> 2] = i64toi32_i32$4;
     label$89 : while (1) {
      $609 = 1;
      i64toi32_i32$2 = $5_1;
      i64toi32_i32$4 = HEAP32[($5_1 + 376 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[($5_1 + 380 | 0) >> 2] | 0;
      $947 = i64toi32_i32$4;
      $947$hi = i64toi32_i32$1;
      $611 = HEAP32[($5_1 + 400 | 0) >> 2] | 0;
      HEAP32[($5_1 + 552 | 0) >> 2] = HEAP32[($5_1 + 396 | 0) >> 2] | 0;
      HEAP32[($5_1 + 548 | 0) >> 2] = $611;
      $613 = HEAP32[($5_1 + 548 | 0) >> 2] | 0;
      HEAP32[($5_1 + 564 | 0) >> 2] = HEAP32[($5_1 + 552 | 0) >> 2] | 0;
      HEAP32[($5_1 + 560 | 0) >> 2] = $613;
      HEAP32[($5_1 + 556 | 0) >> 2] = $609;
      label$90 : {
       label$91 : {
        if (!((HEAP32[($5_1 + 556 | 0) >> 2] | 0 | 0) == ($609 | 0) & 1 | 0)) {
         break label$91
        }
        label$92 : {
         label$93 : {
          if (!((HEAP32[($5_1 + 560 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$93
          }
          i64toi32_i32$1 = $98(HEAP32[($5_1 + 564 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
          $949 = i64toi32_i32$1;
          $949$hi = i64toi32_i32$4;
          break label$92;
         }
         i64toi32_i32$4 = $98(HEAP32[($5_1 + 564 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
         i64toi32_i32$1 = $99(i64toi32_i32$4 | 0, i64toi32_i32$1 | 0) | 0;
         i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
         $949 = i64toi32_i32$1;
         $949$hi = i64toi32_i32$4;
        }
        i64toi32_i32$4 = $949$hi;
        i64toi32_i32$1 = $5_1;
        HEAP32[($5_1 + 568 | 0) >> 2] = $949;
        HEAP32[($5_1 + 572 | 0) >> 2] = i64toi32_i32$4;
        break label$90;
       }
       label$94 : {
        label$95 : {
         if (!((HEAP32[($5_1 + 560 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$95
         }
         i64toi32_i32$2 = HEAP32[($5_1 + 564 | 0) >> 2] | 0;
         i64toi32_i32$4 = HEAP32[i64toi32_i32$2 >> 2] | 0;
         i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
         $954 = i64toi32_i32$4;
         $954$hi = i64toi32_i32$1;
         break label$94;
        }
        i64toi32_i32$2 = HEAP32[($5_1 + 564 | 0) >> 2] | 0;
        i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        i64toi32_i32$4 = $99(i64toi32_i32$1 | 0, i64toi32_i32$4 | 0) | 0;
        i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
        $954 = i64toi32_i32$4;
        $954$hi = i64toi32_i32$1;
       }
       i64toi32_i32$1 = $954$hi;
       i64toi32_i32$4 = $5_1;
       HEAP32[($5_1 + 568 | 0) >> 2] = $954;
       HEAP32[($5_1 + 572 | 0) >> 2] = i64toi32_i32$1;
      }
      $638 = 1;
      i64toi32_i32$2 = $5_1;
      i64toi32_i32$1 = HEAP32[($5_1 + 568 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[($5_1 + 572 | 0) >> 2] | 0;
      $958$hi = i64toi32_i32$4;
      i64toi32_i32$4 = $947$hi;
      i64toi32_i32$4 = $958$hi;
      $2837 = i64toi32_i32$1;
      i64toi32_i32$4 = $947$hi;
      i64toi32_i32$1 = $958$hi;
      i64toi32_i32$1 = $100($947 | 0, i64toi32_i32$4 | 0, $2837 | 0, i64toi32_i32$1 | 0) | 0;
      i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
      $2840 = i64toi32_i32$1;
      i64toi32_i32$1 = $5_1;
      HEAP32[($5_1 + 376 | 0) >> 2] = $2840;
      HEAP32[($5_1 + 380 | 0) >> 2] = i64toi32_i32$4;
      HEAP32[($5_1 + 396 | 0) >> 2] = (HEAP32[($5_1 + 396 | 0) >> 2] | 0) + 8 | 0;
      i64toi32_i32$2 = $5_1;
      i64toi32_i32$4 = HEAP32[($5_1 + 368 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[($5_1 + 372 | 0) >> 2] | 0;
      $960 = i64toi32_i32$4;
      $960$hi = i64toi32_i32$1;
      $643 = HEAP32[($5_1 + 400 | 0) >> 2] | 0;
      HEAP32[($5_1 + 584 | 0) >> 2] = HEAP32[($5_1 + 396 | 0) >> 2] | 0;
      HEAP32[($5_1 + 580 | 0) >> 2] = $643;
      $645 = HEAP32[($5_1 + 580 | 0) >> 2] | 0;
      HEAP32[($5_1 + 596 | 0) >> 2] = HEAP32[($5_1 + 584 | 0) >> 2] | 0;
      HEAP32[($5_1 + 592 | 0) >> 2] = $645;
      HEAP32[($5_1 + 588 | 0) >> 2] = $638;
      label$96 : {
       label$97 : {
        if (!((HEAP32[($5_1 + 588 | 0) >> 2] | 0 | 0) == ($638 | 0) & 1 | 0)) {
         break label$97
        }
        label$98 : {
         label$99 : {
          if (!((HEAP32[($5_1 + 592 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$99
          }
          i64toi32_i32$1 = $98(HEAP32[($5_1 + 596 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
          $962 = i64toi32_i32$1;
          $962$hi = i64toi32_i32$4;
          break label$98;
         }
         i64toi32_i32$4 = $98(HEAP32[($5_1 + 596 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
         i64toi32_i32$1 = $99(i64toi32_i32$4 | 0, i64toi32_i32$1 | 0) | 0;
         i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
         $962 = i64toi32_i32$1;
         $962$hi = i64toi32_i32$4;
        }
        i64toi32_i32$4 = $962$hi;
        i64toi32_i32$1 = $5_1;
        HEAP32[($5_1 + 600 | 0) >> 2] = $962;
        HEAP32[($5_1 + 604 | 0) >> 2] = i64toi32_i32$4;
        break label$96;
       }
       label$100 : {
        label$101 : {
         if (!((HEAP32[($5_1 + 592 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$101
         }
         i64toi32_i32$2 = HEAP32[($5_1 + 596 | 0) >> 2] | 0;
         i64toi32_i32$4 = HEAP32[i64toi32_i32$2 >> 2] | 0;
         i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
         $967 = i64toi32_i32$4;
         $967$hi = i64toi32_i32$1;
         break label$100;
        }
        i64toi32_i32$2 = HEAP32[($5_1 + 596 | 0) >> 2] | 0;
        i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        i64toi32_i32$4 = $99(i64toi32_i32$1 | 0, i64toi32_i32$4 | 0) | 0;
        i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
        $967 = i64toi32_i32$4;
        $967$hi = i64toi32_i32$1;
       }
       i64toi32_i32$1 = $967$hi;
       i64toi32_i32$4 = $5_1;
       HEAP32[($5_1 + 600 | 0) >> 2] = $967;
       HEAP32[($5_1 + 604 | 0) >> 2] = i64toi32_i32$1;
      }
      $670 = 1;
      i64toi32_i32$2 = $5_1;
      i64toi32_i32$1 = HEAP32[($5_1 + 600 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[($5_1 + 604 | 0) >> 2] | 0;
      $971$hi = i64toi32_i32$4;
      i64toi32_i32$4 = $960$hi;
      i64toi32_i32$4 = $971$hi;
      $2937 = i64toi32_i32$1;
      i64toi32_i32$4 = $960$hi;
      i64toi32_i32$1 = $971$hi;
      i64toi32_i32$1 = $100($960 | 0, i64toi32_i32$4 | 0, $2937 | 0, i64toi32_i32$1 | 0) | 0;
      i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
      $2940 = i64toi32_i32$1;
      i64toi32_i32$1 = $5_1;
      HEAP32[($5_1 + 368 | 0) >> 2] = $2940;
      HEAP32[($5_1 + 372 | 0) >> 2] = i64toi32_i32$4;
      HEAP32[($5_1 + 396 | 0) >> 2] = (HEAP32[($5_1 + 396 | 0) >> 2] | 0) + 8 | 0;
      i64toi32_i32$2 = $5_1;
      i64toi32_i32$4 = HEAP32[($5_1 + 360 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[($5_1 + 364 | 0) >> 2] | 0;
      $973 = i64toi32_i32$4;
      $973$hi = i64toi32_i32$1;
      $675 = HEAP32[($5_1 + 400 | 0) >> 2] | 0;
      HEAP32[($5_1 + 616 | 0) >> 2] = HEAP32[($5_1 + 396 | 0) >> 2] | 0;
      HEAP32[($5_1 + 612 | 0) >> 2] = $675;
      $677 = HEAP32[($5_1 + 612 | 0) >> 2] | 0;
      HEAP32[($5_1 + 628 | 0) >> 2] = HEAP32[($5_1 + 616 | 0) >> 2] | 0;
      HEAP32[($5_1 + 624 | 0) >> 2] = $677;
      HEAP32[($5_1 + 620 | 0) >> 2] = $670;
      label$102 : {
       label$103 : {
        if (!((HEAP32[($5_1 + 620 | 0) >> 2] | 0 | 0) == ($670 | 0) & 1 | 0)) {
         break label$103
        }
        label$104 : {
         label$105 : {
          if (!((HEAP32[($5_1 + 624 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$105
          }
          i64toi32_i32$1 = $98(HEAP32[($5_1 + 628 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
          $975 = i64toi32_i32$1;
          $975$hi = i64toi32_i32$4;
          break label$104;
         }
         i64toi32_i32$4 = $98(HEAP32[($5_1 + 628 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
         i64toi32_i32$1 = $99(i64toi32_i32$4 | 0, i64toi32_i32$1 | 0) | 0;
         i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
         $975 = i64toi32_i32$1;
         $975$hi = i64toi32_i32$4;
        }
        i64toi32_i32$4 = $975$hi;
        i64toi32_i32$1 = $5_1;
        HEAP32[($5_1 + 632 | 0) >> 2] = $975;
        HEAP32[($5_1 + 636 | 0) >> 2] = i64toi32_i32$4;
        break label$102;
       }
       label$106 : {
        label$107 : {
         if (!((HEAP32[($5_1 + 624 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$107
         }
         i64toi32_i32$2 = HEAP32[($5_1 + 628 | 0) >> 2] | 0;
         i64toi32_i32$4 = HEAP32[i64toi32_i32$2 >> 2] | 0;
         i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
         $980 = i64toi32_i32$4;
         $980$hi = i64toi32_i32$1;
         break label$106;
        }
        i64toi32_i32$2 = HEAP32[($5_1 + 628 | 0) >> 2] | 0;
        i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        i64toi32_i32$4 = $99(i64toi32_i32$1 | 0, i64toi32_i32$4 | 0) | 0;
        i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
        $980 = i64toi32_i32$4;
        $980$hi = i64toi32_i32$1;
       }
       i64toi32_i32$1 = $980$hi;
       i64toi32_i32$4 = $5_1;
       HEAP32[($5_1 + 632 | 0) >> 2] = $980;
       HEAP32[($5_1 + 636 | 0) >> 2] = i64toi32_i32$1;
      }
      $702 = 1;
      i64toi32_i32$2 = $5_1;
      i64toi32_i32$1 = HEAP32[($5_1 + 632 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[($5_1 + 636 | 0) >> 2] | 0;
      $984$hi = i64toi32_i32$4;
      i64toi32_i32$4 = $973$hi;
      i64toi32_i32$4 = $984$hi;
      $3037 = i64toi32_i32$1;
      i64toi32_i32$4 = $973$hi;
      i64toi32_i32$1 = $984$hi;
      i64toi32_i32$1 = $100($973 | 0, i64toi32_i32$4 | 0, $3037 | 0, i64toi32_i32$1 | 0) | 0;
      i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
      $3040 = i64toi32_i32$1;
      i64toi32_i32$1 = $5_1;
      HEAP32[($5_1 + 360 | 0) >> 2] = $3040;
      HEAP32[($5_1 + 364 | 0) >> 2] = i64toi32_i32$4;
      HEAP32[($5_1 + 396 | 0) >> 2] = (HEAP32[($5_1 + 396 | 0) >> 2] | 0) + 8 | 0;
      i64toi32_i32$2 = $5_1;
      i64toi32_i32$4 = HEAP32[($5_1 + 352 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[($5_1 + 356 | 0) >> 2] | 0;
      $986 = i64toi32_i32$4;
      $986$hi = i64toi32_i32$1;
      $707 = HEAP32[($5_1 + 400 | 0) >> 2] | 0;
      HEAP32[($5_1 + 648 | 0) >> 2] = HEAP32[($5_1 + 396 | 0) >> 2] | 0;
      HEAP32[($5_1 + 644 | 0) >> 2] = $707;
      $709 = HEAP32[($5_1 + 644 | 0) >> 2] | 0;
      HEAP32[($5_1 + 660 | 0) >> 2] = HEAP32[($5_1 + 648 | 0) >> 2] | 0;
      HEAP32[($5_1 + 656 | 0) >> 2] = $709;
      HEAP32[($5_1 + 652 | 0) >> 2] = $702;
      label$108 : {
       label$109 : {
        if (!((HEAP32[($5_1 + 652 | 0) >> 2] | 0 | 0) == ($702 | 0) & 1 | 0)) {
         break label$109
        }
        label$110 : {
         label$111 : {
          if (!((HEAP32[($5_1 + 656 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$111
          }
          i64toi32_i32$1 = $98(HEAP32[($5_1 + 660 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
          $988 = i64toi32_i32$1;
          $988$hi = i64toi32_i32$4;
          break label$110;
         }
         i64toi32_i32$4 = $98(HEAP32[($5_1 + 660 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
         i64toi32_i32$1 = $99(i64toi32_i32$4 | 0, i64toi32_i32$1 | 0) | 0;
         i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
         $988 = i64toi32_i32$1;
         $988$hi = i64toi32_i32$4;
        }
        i64toi32_i32$4 = $988$hi;
        i64toi32_i32$1 = $5_1;
        HEAP32[($5_1 + 664 | 0) >> 2] = $988;
        HEAP32[($5_1 + 668 | 0) >> 2] = i64toi32_i32$4;
        break label$108;
       }
       label$112 : {
        label$113 : {
         if (!((HEAP32[($5_1 + 656 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$113
         }
         i64toi32_i32$2 = HEAP32[($5_1 + 660 | 0) >> 2] | 0;
         i64toi32_i32$4 = HEAP32[i64toi32_i32$2 >> 2] | 0;
         i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
         $993 = i64toi32_i32$4;
         $993$hi = i64toi32_i32$1;
         break label$112;
        }
        i64toi32_i32$2 = HEAP32[($5_1 + 660 | 0) >> 2] | 0;
        i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$4 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        i64toi32_i32$4 = $99(i64toi32_i32$1 | 0, i64toi32_i32$4 | 0) | 0;
        i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
        $993 = i64toi32_i32$4;
        $993$hi = i64toi32_i32$1;
       }
       i64toi32_i32$1 = $993$hi;
       i64toi32_i32$4 = $5_1;
       HEAP32[($5_1 + 664 | 0) >> 2] = $993;
       HEAP32[($5_1 + 668 | 0) >> 2] = i64toi32_i32$1;
      }
      i64toi32_i32$2 = $5_1;
      i64toi32_i32$1 = HEAP32[($5_1 + 664 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[($5_1 + 668 | 0) >> 2] | 0;
      $997$hi = i64toi32_i32$4;
      i64toi32_i32$4 = $986$hi;
      i64toi32_i32$4 = $997$hi;
      $3137 = i64toi32_i32$1;
      i64toi32_i32$4 = $986$hi;
      i64toi32_i32$1 = $997$hi;
      i64toi32_i32$1 = $100($986 | 0, i64toi32_i32$4 | 0, $3137 | 0, i64toi32_i32$1 | 0) | 0;
      i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
      $3140 = i64toi32_i32$1;
      i64toi32_i32$1 = $5_1;
      HEAP32[($5_1 + 352 | 0) >> 2] = $3140;
      HEAP32[($5_1 + 356 | 0) >> 2] = i64toi32_i32$4;
      HEAP32[($5_1 + 396 | 0) >> 2] = (HEAP32[($5_1 + 396 | 0) >> 2] | 0) + 8 | 0;
      if ((HEAP32[($5_1 + 396 | 0) >> 2] | 0) >>> 0 <= (HEAP32[($5_1 + 388 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
       continue label$89
      }
      break label$89;
     };
     i64toi32_i32$2 = $5_1;
     i64toi32_i32$4 = HEAP32[($5_1 + 376 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[($5_1 + 380 | 0) >> 2] | 0;
     $3166 = i64toi32_i32$4;
     i64toi32_i32$4 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     HEAP32[(i64toi32_i32$4 + 8 | 0) >> 2] = $3166;
     HEAP32[(i64toi32_i32$4 + 12 | 0) >> 2] = i64toi32_i32$1;
     i64toi32_i32$2 = $5_1;
     i64toi32_i32$1 = HEAP32[($5_1 + 368 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[($5_1 + 372 | 0) >> 2] | 0;
     $3172 = i64toi32_i32$1;
     i64toi32_i32$1 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     HEAP32[(i64toi32_i32$1 + 16 | 0) >> 2] = $3172;
     HEAP32[(i64toi32_i32$1 + 20 | 0) >> 2] = i64toi32_i32$4;
     i64toi32_i32$2 = $5_1;
     i64toi32_i32$4 = HEAP32[($5_1 + 360 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[($5_1 + 364 | 0) >> 2] | 0;
     $3178 = i64toi32_i32$4;
     i64toi32_i32$4 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     HEAP32[(i64toi32_i32$4 + 24 | 0) >> 2] = $3178;
     HEAP32[(i64toi32_i32$4 + 28 | 0) >> 2] = i64toi32_i32$1;
     i64toi32_i32$2 = $5_1;
     i64toi32_i32$1 = HEAP32[($5_1 + 352 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[($5_1 + 356 | 0) >> 2] | 0;
     $3184 = i64toi32_i32$1;
     i64toi32_i32$1 = HEAP32[($5_1 + 412 | 0) >> 2] | 0;
     HEAP32[(i64toi32_i32$1 + 32 | 0) >> 2] = $3184;
     HEAP32[(i64toi32_i32$1 + 36 | 0) >> 2] = i64toi32_i32$4;
    }
    label$114 : {
     if (!((HEAP32[($5_1 + 396 | 0) >> 2] | 0) >>> 0 < (HEAP32[($5_1 + 392 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$114
     }
     $97((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 40 | 0 | 0, HEAP32[($5_1 + 396 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 392 | 0) >> 2] | 0) - (HEAP32[($5_1 + 396 | 0) >> 2] | 0) | 0 | 0) | 0;
     HEAP32[((HEAP32[($5_1 + 412 | 0) >> 2] | 0) + 72 | 0) >> 2] = (HEAP32[($5_1 + 392 | 0) >> 2] | 0) - (HEAP32[($5_1 + 396 | 0) >> 2] | 0) | 0;
    }
    HEAP32[($5_1 + 416 | 0) >> 2] = 0;
   }
   HEAP32[($5_1 + 28 | 0) >> 2] = HEAP32[($5_1 + 416 | 0) >> 2] | 0;
  }
  $768 = HEAP32[($5_1 + 28 | 0) >> 2] | 0;
  label$115 : {
   $772 = $5_1 + 672 | 0;
   if ($772 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $772;
  }
  return $768 | 0;
 }
 
 function $89($0_1) {
  $0_1 = $0_1 | 0;
  var i64toi32_i32$3 = 0, i64toi32_i32$5 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$2 = 0, i64toi32_i32$4 = 0, $3_1 = 0, $278$hi = 0, $414$hi = 0, $7_1 = 0, $280$hi = 0, $286$hi = 0, $287$hi = 0, $327 = 0, $288$hi = 0, $289$hi = 0, $290$hi = 0, $328 = 0, $291$hi = 0, $292$hi = 0, $293$hi = 0, $294$hi = 0, $329 = 0, $295$hi = 0, $296$hi = 0, $297$hi = 0, $330 = 0, $298$hi = 0, $299$hi = 0, $300$hi = 0, $301$hi = 0, $302$hi = 0, $331 = 0, $303$hi = 0, $304$hi = 0, $305$hi = 0, $333 = 0, $306$hi = 0, $307$hi = 0, $308$hi = 0, $309$hi = 0, $310$hi = 0, $334 = 0, $311$hi = 0, $312$hi = 0, $313$hi = 0, $335 = 0, $314$hi = 0, $315$hi = 0, $317$hi = 0, $318$hi = 0, $320$hi = 0, $321$hi = 0, $323$hi = 0, $324$hi = 0, $326$hi = 0, $327$hi = 0, $329$hi = 0, $330$hi = 0, $332$hi = 0, $46_1 = 0, $336 = 0, $336$hi = 0, $341 = 0, $341$hi = 0, $345$hi = 0, $346$hi = 0, $348$hi = 0, $351$hi = 0, $352$hi = 0, $337 = 0, $353$hi = 0, $354$hi = 0, $355$hi = 0, $338 = 0, $356$hi = 0, $357$hi = 0, $358$hi = 0, $359$hi = 0, $360$hi = 0, $87_1 = 0, $107_1 = 0, $121_1 = 0, $362$hi = 0, $363$hi = 0, $364$hi = 0, $367$hi = 0, $368$hi = 0, $339 = 0, $369$hi = 0, $370$hi = 0, $371$hi = 0, $340 = 0, $372$hi = 0, $373$hi = 0, $374$hi = 0, $375$hi = 0, $376$hi = 0, $378$hi = 0, $379$hi = 0, $380$hi = 0, $383$hi = 0, $384$hi = 0, $342 = 0, $385$hi = 0, $386$hi = 0, $387$hi = 0, $343 = 0, $388$hi = 0, $389$hi = 0, $390$hi = 0, $392$hi = 0, $393$hi = 0, $344 = 0, $394$hi = 0, $397$hi = 0, $398$hi = 0, $400$hi = 0, $401$hi = 0, $345 = 0, $402$hi = 0, $405$hi = 0, $406$hi = 0, $408$hi = 0, $409$hi = 0, $346 = 0, $410$hi = 0, $416$hi = 0, $422$hi = 0, $423$hi = 0, $347 = 0, $424$hi = 0, $425$hi = 0, $426$hi = 0, $349 = 0, $427$hi = 0, $428$hi = 0, $429$hi = 0, $430$hi = 0, $350 = 0, $431$hi = 0, $432$hi = 0, $433$hi = 0, $351 = 0, $434$hi = 0, $435$hi = 0, $436$hi = 0, $437$hi = 0, $438$hi = 0, $352 = 0, $439$hi = 0, $440$hi = 0, $441$hi = 0, $354 = 0, $442$hi = 0, $443$hi = 0, $444$hi = 0, $445$hi = 0, $446$hi = 0, $355 = 0, $447$hi = 0, $448$hi = 0, $449$hi = 0, $356 = 0, $450$hi = 0, $451$hi = 0, $453$hi = 0, $454$hi = 0, $456$hi = 0, $457$hi = 0, $459$hi = 0, $460$hi = 0, $462$hi = 0, $463$hi = 0, $465$hi = 0, $466$hi = 0, $468$hi = 0, $175 = 0, $472 = 0, $472$hi = 0, $477 = 0, $477$hi = 0, $481$hi = 0, $482$hi = 0, $484$hi = 0, $487$hi = 0, $488$hi = 0, $357 = 0, $489$hi = 0, $490$hi = 0, $491$hi = 0, $358 = 0, $492$hi = 0, $493$hi = 0, $494$hi = 0, $495$hi = 0, $496$hi = 0, $216 = 0, $236 = 0, $250 = 0, $498$hi = 0, $499$hi = 0, $500$hi = 0, $503$hi = 0, $504$hi = 0, $359 = 0, $505$hi = 0, $506$hi = 0, $507$hi = 0, $360 = 0, $508$hi = 0, $509$hi = 0, $510$hi = 0, $511$hi = 0, $512$hi = 0, $514$hi = 0, $515$hi = 0, $516$hi = 0, $519$hi = 0, $520$hi = 0, $361 = 0, $521$hi = 0, $522$hi = 0, $523$hi = 0, $362 = 0, $524$hi = 0, $525$hi = 0, $526$hi = 0, $528$hi = 0, $529$hi = 0, $363 = 0, $530$hi = 0, $533$hi = 0, $534$hi = 0, $536$hi = 0, $537$hi = 0, $365 = 0, $538$hi = 0, $541$hi = 0, $542$hi = 0, $544$hi = 0, $545$hi = 0, $366 = 0, $546$hi = 0, $277 = 0, $276 = 0, $630 = 0, $636 = 0, $642 = 0, $648 = 0, $288 = 0, $292 = 0, $295 = 0, $676 = 0, $300 = 0, $303 = 0, $692 = 0, $308 = 0, $311 = 0, $708 = 0, $317 = 0, $717 = 0, $720 = 0, $320 = 0, $726 = 0, $729 = 0, $323 = 0, $735 = 0, $738 = 0, $326 = 0, $744 = 0, $747 = 0, $332 = 0, $763$hi = 0, $48_1 = 0, $50_1 = 0, $872 = 0, $875 = 0, $348 = 0, $880$hi = 0, $884 = 0, $353 = 0, $367 = 0, $89_1 = 0, $91_1 = 0, $364 = 0, $1024$hi = 0, $1028 = 0, $369 = 0, $368 = 0, $380 = 0, $1085$hi = 0, $1089 = 0, $385 = 0, $370 = 0, $1107 = 0, $1122$hi = 0, $1126 = 0, $371 = 0, $1133 = 0, $1141$hi = 0, $1145 = 0, $372 = 0, $1152 = 0, $1160$hi = 0, $1164 = 0, $1168 = 0, $1215 = 0, $1221 = 0, $1227 = 0, $1233 = 0, $424 = 0, $428 = 0, $431 = 0, $1261 = 0, $436 = 0, $439 = 0, $1277 = 0, $444 = 0, $447 = 0, $1293 = 0, $453 = 0, $1302 = 0, $1305 = 0, $456 = 0, $1311 = 0, $1314 = 0, $459 = 0, $1320 = 0, $1323 = 0, $462 = 0, $1329 = 0, $1332 = 0, $468 = 0, $1348$hi = 0, $177 = 0, $179 = 0, $1457 = 0, $1460 = 0, $484 = 0, $1465$hi = 0, $1469 = 0, $489 = 0, $373 = 0, $218 = 0, $220 = 0, $500 = 0, $1609$hi = 0, $1613 = 0, $505 = 0, $374 = 0, $516 = 0, $1670$hi = 0, $1674 = 0, $521 = 0, $375 = 0, $1692 = 0, $1707$hi = 0, $1711 = 0, $376 = 0, $1718 = 0, $1726$hi = 0, $1730 = 0, $377 = 0, $1737 = 0, $1745$hi = 0, $1749 = 0, $1753 = 0, $550 = 0, $550$hi = 0;
  $3_1 = global$0 - 256 | 0;
  label$1 : {
   $276 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $276;
  }
  HEAP32[($3_1 + 4 | 0) >> 2] = $0_1;
  $7_1 = 24;
  HEAP32[$3_1 >> 2] = ((HEAPU8[(0 + 3904 | 0) >> 0] | 0) << $7_1 | 0) >> $7_1 | 0;
  label$3 : {
   label$4 : {
    if (!((HEAP32[$3_1 >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
     break label$4
    }
    i64toi32_i32$0 = 0;
    $278$hi = i64toi32_i32$0;
    HEAP32[($3_1 + 80 | 0) >> 2] = HEAP32[($3_1 + 4 | 0) >> 2] | 0;
    HEAP32[($3_1 + 76 | 0) >> 2] = 1;
    HEAP32[($3_1 + 72 | 0) >> 2] = (HEAP32[($3_1 + 80 | 0) >> 2] | 0) + 40 | 0;
    HEAP32[($3_1 + 68 | 0) >> 2] = ((HEAP32[($3_1 + 80 | 0) >> 2] | 0) + 40 | 0) + (HEAP32[((HEAP32[($3_1 + 80 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) | 0;
    i64toi32_i32$2 = HEAP32[($3_1 + 80 | 0) >> 2] | 0;
    i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
    $280$hi = i64toi32_i32$1;
    i64toi32_i32$1 = $278$hi;
    i64toi32_i32$1 = $280$hi;
    i64toi32_i32$1 = $278$hi;
    i64toi32_i32$1 = $280$hi;
    i64toi32_i32$2 = i64toi32_i32$0;
    i64toi32_i32$0 = $278$hi;
    i64toi32_i32$3 = 32;
    label$5 : {
     label$6 : {
      if (!((i64toi32_i32$1 >>> 0 > i64toi32_i32$0 >>> 0 | ((i64toi32_i32$1 | 0) == (i64toi32_i32$0 | 0) & i64toi32_i32$2 >>> 0 >= i64toi32_i32$3 >>> 0 | 0) | 0) & 1 | 0)) {
       break label$6
      }
      i64toi32_i32$3 = HEAP32[($3_1 + 80 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 8 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 12 | 0) >> 2] | 0;
      $630 = i64toi32_i32$2;
      i64toi32_i32$2 = $3_1;
      HEAP32[(i64toi32_i32$2 + 48 | 0) >> 2] = $630;
      HEAP32[(i64toi32_i32$2 + 52 | 0) >> 2] = i64toi32_i32$1;
      i64toi32_i32$3 = HEAP32[(i64toi32_i32$2 + 80 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 16 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 20 | 0) >> 2] | 0;
      $636 = i64toi32_i32$1;
      i64toi32_i32$1 = $3_1;
      HEAP32[(i64toi32_i32$1 + 40 | 0) >> 2] = $636;
      HEAP32[(i64toi32_i32$1 + 44 | 0) >> 2] = i64toi32_i32$2;
      i64toi32_i32$3 = HEAP32[(i64toi32_i32$1 + 80 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 24 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 28 | 0) >> 2] | 0;
      $642 = i64toi32_i32$2;
      i64toi32_i32$2 = $3_1;
      HEAP32[(i64toi32_i32$2 + 32 | 0) >> 2] = $642;
      HEAP32[(i64toi32_i32$2 + 36 | 0) >> 2] = i64toi32_i32$1;
      i64toi32_i32$3 = HEAP32[(i64toi32_i32$2 + 80 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 32 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 36 | 0) >> 2] | 0;
      $648 = i64toi32_i32$1;
      i64toi32_i32$1 = $3_1;
      HEAP32[(i64toi32_i32$1 + 24 | 0) >> 2] = $648;
      HEAP32[(i64toi32_i32$1 + 28 | 0) >> 2] = i64toi32_i32$2;
      i64toi32_i32$3 = i64toi32_i32$1;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 48 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 52 | 0) >> 2] | 0;
      $286$hi = i64toi32_i32$1;
      i64toi32_i32$1 = 0;
      $287$hi = i64toi32_i32$1;
      i64toi32_i32$1 = $286$hi;
      i64toi32_i32$1 = $287$hi;
      i64toi32_i32$1 = $286$hi;
      i64toi32_i32$3 = i64toi32_i32$2;
      i64toi32_i32$2 = $287$hi;
      i64toi32_i32$0 = 1;
      i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$2 = i64toi32_i32$3 << i64toi32_i32$4 | 0;
       $327 = 0;
      } else {
       i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$3 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
       $327 = i64toi32_i32$3 << i64toi32_i32$4 | 0;
      }
      $288 = $327;
      $288$hi = i64toi32_i32$2;
      i64toi32_i32$1 = $3_1;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 48 | 0) >> 2] | 0;
      i64toi32_i32$3 = HEAP32[(i64toi32_i32$1 + 52 | 0) >> 2] | 0;
      $289$hi = i64toi32_i32$3;
      i64toi32_i32$3 = 0;
      $290$hi = i64toi32_i32$3;
      i64toi32_i32$3 = $289$hi;
      i64toi32_i32$3 = $290$hi;
      i64toi32_i32$3 = $289$hi;
      i64toi32_i32$1 = i64toi32_i32$2;
      i64toi32_i32$2 = $290$hi;
      i64toi32_i32$0 = 63;
      i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$2 = 0;
       $328 = i64toi32_i32$3 >>> i64toi32_i32$4 | 0;
      } else {
       i64toi32_i32$2 = i64toi32_i32$3 >>> i64toi32_i32$4 | 0;
       $328 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$3 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$1 >>> i64toi32_i32$4 | 0) | 0;
      }
      $291$hi = i64toi32_i32$2;
      i64toi32_i32$2 = $288$hi;
      i64toi32_i32$2 = $291$hi;
      i64toi32_i32$2 = $288$hi;
      i64toi32_i32$3 = $288;
      i64toi32_i32$1 = $291$hi;
      i64toi32_i32$0 = $328;
      i64toi32_i32$1 = i64toi32_i32$2 | i64toi32_i32$1 | 0;
      $292 = i64toi32_i32$3 | i64toi32_i32$0 | 0;
      $292$hi = i64toi32_i32$1;
      i64toi32_i32$2 = $3_1;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 40 | 0) >> 2] | 0;
      i64toi32_i32$3 = HEAP32[(i64toi32_i32$2 + 44 | 0) >> 2] | 0;
      $293$hi = i64toi32_i32$3;
      i64toi32_i32$3 = 0;
      $294$hi = i64toi32_i32$3;
      i64toi32_i32$3 = $293$hi;
      i64toi32_i32$3 = $294$hi;
      i64toi32_i32$3 = $293$hi;
      i64toi32_i32$2 = i64toi32_i32$1;
      i64toi32_i32$1 = $294$hi;
      i64toi32_i32$0 = 7;
      i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
       $329 = 0;
      } else {
       i64toi32_i32$1 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$3 << i64toi32_i32$4 | 0) | 0;
       $329 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
      }
      $295 = $329;
      $295$hi = i64toi32_i32$1;
      i64toi32_i32$3 = $3_1;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 40 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 44 | 0) >> 2] | 0;
      $296$hi = i64toi32_i32$2;
      i64toi32_i32$2 = 0;
      $297$hi = i64toi32_i32$2;
      i64toi32_i32$2 = $296$hi;
      i64toi32_i32$2 = $297$hi;
      i64toi32_i32$2 = $296$hi;
      i64toi32_i32$3 = i64toi32_i32$1;
      i64toi32_i32$1 = $297$hi;
      i64toi32_i32$0 = 57;
      i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$1 = 0;
       $330 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
      } else {
       i64toi32_i32$1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
       $330 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$3 >>> i64toi32_i32$4 | 0) | 0;
      }
      $298$hi = i64toi32_i32$1;
      i64toi32_i32$1 = $295$hi;
      i64toi32_i32$1 = $298$hi;
      i64toi32_i32$1 = $295$hi;
      i64toi32_i32$2 = $295;
      i64toi32_i32$3 = $298$hi;
      i64toi32_i32$0 = $330;
      i64toi32_i32$3 = i64toi32_i32$1 | i64toi32_i32$3 | 0;
      $299$hi = i64toi32_i32$3;
      i64toi32_i32$3 = $292$hi;
      i64toi32_i32$3 = $299$hi;
      $676 = i64toi32_i32$2 | i64toi32_i32$0 | 0;
      i64toi32_i32$3 = $292$hi;
      i64toi32_i32$1 = $292;
      i64toi32_i32$2 = $299$hi;
      i64toi32_i32$0 = $676;
      i64toi32_i32$4 = i64toi32_i32$1 + i64toi32_i32$0 | 0;
      i64toi32_i32$5 = i64toi32_i32$3 + i64toi32_i32$2 | 0;
      if (i64toi32_i32$4 >>> 0 < i64toi32_i32$0 >>> 0) {
       i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
      }
      $300 = i64toi32_i32$4;
      $300$hi = i64toi32_i32$5;
      i64toi32_i32$3 = $3_1;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$3 + 32 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 36 | 0) >> 2] | 0;
      $301$hi = i64toi32_i32$1;
      i64toi32_i32$1 = 0;
      $302$hi = i64toi32_i32$1;
      i64toi32_i32$1 = $301$hi;
      i64toi32_i32$1 = $302$hi;
      i64toi32_i32$1 = $301$hi;
      i64toi32_i32$3 = i64toi32_i32$5;
      i64toi32_i32$5 = $302$hi;
      i64toi32_i32$0 = 12;
      i64toi32_i32$2 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$5 = i64toi32_i32$3 << i64toi32_i32$2 | 0;
       $331 = 0;
      } else {
       i64toi32_i32$5 = ((1 << i64toi32_i32$2 | 0) - 1 | 0) & (i64toi32_i32$3 >>> (32 - i64toi32_i32$2 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$2 | 0) | 0;
       $331 = i64toi32_i32$3 << i64toi32_i32$2 | 0;
      }
      $303 = $331;
      $303$hi = i64toi32_i32$5;
      i64toi32_i32$1 = $3_1;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 32 | 0) >> 2] | 0;
      i64toi32_i32$3 = HEAP32[(i64toi32_i32$1 + 36 | 0) >> 2] | 0;
      $304$hi = i64toi32_i32$3;
      i64toi32_i32$3 = 0;
      $305$hi = i64toi32_i32$3;
      i64toi32_i32$3 = $304$hi;
      i64toi32_i32$3 = $305$hi;
      i64toi32_i32$3 = $304$hi;
      i64toi32_i32$1 = i64toi32_i32$5;
      i64toi32_i32$5 = $305$hi;
      i64toi32_i32$0 = 52;
      i64toi32_i32$2 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$5 = 0;
       $333 = i64toi32_i32$3 >>> i64toi32_i32$2 | 0;
      } else {
       i64toi32_i32$5 = i64toi32_i32$3 >>> i64toi32_i32$2 | 0;
       $333 = (((1 << i64toi32_i32$2 | 0) - 1 | 0) & i64toi32_i32$3 | 0) << (32 - i64toi32_i32$2 | 0) | 0 | (i64toi32_i32$1 >>> i64toi32_i32$2 | 0) | 0;
      }
      $306$hi = i64toi32_i32$5;
      i64toi32_i32$5 = $303$hi;
      i64toi32_i32$5 = $306$hi;
      i64toi32_i32$5 = $303$hi;
      i64toi32_i32$3 = $303;
      i64toi32_i32$1 = $306$hi;
      i64toi32_i32$0 = $333;
      i64toi32_i32$1 = i64toi32_i32$5 | i64toi32_i32$1 | 0;
      $307$hi = i64toi32_i32$1;
      i64toi32_i32$1 = $300$hi;
      i64toi32_i32$1 = $307$hi;
      $692 = i64toi32_i32$3 | i64toi32_i32$0 | 0;
      i64toi32_i32$1 = $300$hi;
      i64toi32_i32$5 = $300;
      i64toi32_i32$3 = $307$hi;
      i64toi32_i32$0 = $692;
      i64toi32_i32$2 = i64toi32_i32$5 + i64toi32_i32$0 | 0;
      i64toi32_i32$4 = i64toi32_i32$1 + i64toi32_i32$3 | 0;
      if (i64toi32_i32$2 >>> 0 < i64toi32_i32$0 >>> 0) {
       i64toi32_i32$4 = i64toi32_i32$4 + 1 | 0
      }
      $308 = i64toi32_i32$2;
      $308$hi = i64toi32_i32$4;
      i64toi32_i32$1 = $3_1;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$1 + 24 | 0) >> 2] | 0;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 28 | 0) >> 2] | 0;
      $309$hi = i64toi32_i32$5;
      i64toi32_i32$5 = 0;
      $310$hi = i64toi32_i32$5;
      i64toi32_i32$5 = $309$hi;
      i64toi32_i32$5 = $310$hi;
      i64toi32_i32$5 = $309$hi;
      i64toi32_i32$1 = i64toi32_i32$4;
      i64toi32_i32$4 = $310$hi;
      i64toi32_i32$0 = 18;
      i64toi32_i32$3 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$4 = i64toi32_i32$1 << i64toi32_i32$3 | 0;
       $334 = 0;
      } else {
       i64toi32_i32$4 = ((1 << i64toi32_i32$3 | 0) - 1 | 0) & (i64toi32_i32$1 >>> (32 - i64toi32_i32$3 | 0) | 0) | 0 | (i64toi32_i32$5 << i64toi32_i32$3 | 0) | 0;
       $334 = i64toi32_i32$1 << i64toi32_i32$3 | 0;
      }
      $311 = $334;
      $311$hi = i64toi32_i32$4;
      i64toi32_i32$5 = $3_1;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 24 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$5 + 28 | 0) >> 2] | 0;
      $312$hi = i64toi32_i32$1;
      i64toi32_i32$1 = 0;
      $313$hi = i64toi32_i32$1;
      i64toi32_i32$1 = $312$hi;
      i64toi32_i32$1 = $313$hi;
      i64toi32_i32$1 = $312$hi;
      i64toi32_i32$5 = i64toi32_i32$4;
      i64toi32_i32$4 = $313$hi;
      i64toi32_i32$0 = 46;
      i64toi32_i32$3 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$4 = 0;
       $335 = i64toi32_i32$1 >>> i64toi32_i32$3 | 0;
      } else {
       i64toi32_i32$4 = i64toi32_i32$1 >>> i64toi32_i32$3 | 0;
       $335 = (((1 << i64toi32_i32$3 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$3 | 0) | 0 | (i64toi32_i32$5 >>> i64toi32_i32$3 | 0) | 0;
      }
      $314$hi = i64toi32_i32$4;
      i64toi32_i32$4 = $311$hi;
      i64toi32_i32$4 = $314$hi;
      i64toi32_i32$4 = $311$hi;
      i64toi32_i32$1 = $311;
      i64toi32_i32$5 = $314$hi;
      i64toi32_i32$0 = $335;
      i64toi32_i32$5 = i64toi32_i32$4 | i64toi32_i32$5 | 0;
      $315$hi = i64toi32_i32$5;
      i64toi32_i32$5 = $308$hi;
      i64toi32_i32$5 = $315$hi;
      $708 = i64toi32_i32$1 | i64toi32_i32$0 | 0;
      i64toi32_i32$5 = $308$hi;
      i64toi32_i32$4 = $308;
      i64toi32_i32$1 = $315$hi;
      i64toi32_i32$0 = $708;
      i64toi32_i32$3 = i64toi32_i32$4 + i64toi32_i32$0 | 0;
      i64toi32_i32$2 = i64toi32_i32$5 + i64toi32_i32$1 | 0;
      if (i64toi32_i32$3 >>> 0 < i64toi32_i32$0 >>> 0) {
       i64toi32_i32$2 = i64toi32_i32$2 + 1 | 0
      }
      i64toi32_i32$4 = $3_1;
      HEAP32[(i64toi32_i32$4 + 56 | 0) >> 2] = i64toi32_i32$3;
      HEAP32[(i64toi32_i32$4 + 60 | 0) >> 2] = i64toi32_i32$2;
      i64toi32_i32$5 = i64toi32_i32$4;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] | 0;
      $317 = i64toi32_i32$2;
      $317$hi = i64toi32_i32$4;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 48 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 52 | 0) >> 2] | 0;
      $318$hi = i64toi32_i32$2;
      i64toi32_i32$2 = $317$hi;
      i64toi32_i32$2 = $318$hi;
      $717 = i64toi32_i32$4;
      i64toi32_i32$2 = $317$hi;
      i64toi32_i32$4 = $318$hi;
      i64toi32_i32$4 = $101($317 | 0, i64toi32_i32$2 | 0, $717 | 0, i64toi32_i32$4 | 0) | 0;
      i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
      $720 = i64toi32_i32$4;
      i64toi32_i32$4 = i64toi32_i32$5;
      HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] = $720;
      HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] = i64toi32_i32$2;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] | 0;
      $320 = i64toi32_i32$2;
      $320$hi = i64toi32_i32$4;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 40 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 44 | 0) >> 2] | 0;
      $321$hi = i64toi32_i32$2;
      i64toi32_i32$2 = $320$hi;
      i64toi32_i32$2 = $321$hi;
      $726 = i64toi32_i32$4;
      i64toi32_i32$2 = $320$hi;
      i64toi32_i32$4 = $321$hi;
      i64toi32_i32$4 = $101($320 | 0, i64toi32_i32$2 | 0, $726 | 0, i64toi32_i32$4 | 0) | 0;
      i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
      $729 = i64toi32_i32$4;
      i64toi32_i32$4 = i64toi32_i32$5;
      HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] = $729;
      HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] = i64toi32_i32$2;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] | 0;
      $323 = i64toi32_i32$2;
      $323$hi = i64toi32_i32$4;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 32 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 36 | 0) >> 2] | 0;
      $324$hi = i64toi32_i32$2;
      i64toi32_i32$2 = $323$hi;
      i64toi32_i32$2 = $324$hi;
      $735 = i64toi32_i32$4;
      i64toi32_i32$2 = $323$hi;
      i64toi32_i32$4 = $324$hi;
      i64toi32_i32$4 = $101($323 | 0, i64toi32_i32$2 | 0, $735 | 0, i64toi32_i32$4 | 0) | 0;
      i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
      $738 = i64toi32_i32$4;
      i64toi32_i32$4 = i64toi32_i32$5;
      HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] = $738;
      HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] = i64toi32_i32$2;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] | 0;
      $326 = i64toi32_i32$2;
      $326$hi = i64toi32_i32$4;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 24 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 28 | 0) >> 2] | 0;
      $327$hi = i64toi32_i32$2;
      i64toi32_i32$2 = $326$hi;
      i64toi32_i32$2 = $327$hi;
      $744 = i64toi32_i32$4;
      i64toi32_i32$2 = $326$hi;
      i64toi32_i32$4 = $327$hi;
      i64toi32_i32$4 = $101($326 | 0, i64toi32_i32$2 | 0, $744 | 0, i64toi32_i32$4 | 0) | 0;
      i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
      $747 = i64toi32_i32$4;
      i64toi32_i32$4 = i64toi32_i32$5;
      HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] = $747;
      HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] = i64toi32_i32$2;
      break label$5;
     }
     i64toi32_i32$5 = HEAP32[($3_1 + 80 | 0) >> 2] | 0;
     i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 24 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 28 | 0) >> 2] | 0;
     $329$hi = i64toi32_i32$4;
     i64toi32_i32$4 = 668265263;
     $330$hi = i64toi32_i32$4;
     i64toi32_i32$4 = $329$hi;
     i64toi32_i32$4 = $330$hi;
     i64toi32_i32$4 = $329$hi;
     i64toi32_i32$5 = i64toi32_i32$2;
     i64toi32_i32$2 = $330$hi;
     i64toi32_i32$0 = 374761413;
     i64toi32_i32$1 = i64toi32_i32$5 + i64toi32_i32$0 | 0;
     i64toi32_i32$3 = i64toi32_i32$4 + i64toi32_i32$2 | 0;
     if (i64toi32_i32$1 >>> 0 < i64toi32_i32$0 >>> 0) {
      i64toi32_i32$3 = i64toi32_i32$3 + 1 | 0
     }
     i64toi32_i32$5 = $3_1;
     HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] = i64toi32_i32$1;
     HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] = i64toi32_i32$3;
    }
    i64toi32_i32$4 = HEAP32[($3_1 + 80 | 0) >> 2] | 0;
    i64toi32_i32$3 = HEAP32[i64toi32_i32$4 >> 2] | 0;
    i64toi32_i32$5 = HEAP32[(i64toi32_i32$4 + 4 | 0) >> 2] | 0;
    $332 = i64toi32_i32$3;
    $332$hi = i64toi32_i32$5;
    i64toi32_i32$4 = $3_1;
    i64toi32_i32$5 = HEAP32[(i64toi32_i32$4 + 56 | 0) >> 2] | 0;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$4 + 60 | 0) >> 2] | 0;
    $763$hi = i64toi32_i32$3;
    i64toi32_i32$3 = $332$hi;
    i64toi32_i32$3 = $763$hi;
    i64toi32_i32$4 = i64toi32_i32$5;
    i64toi32_i32$5 = $332$hi;
    i64toi32_i32$0 = $332;
    i64toi32_i32$2 = i64toi32_i32$4 + i64toi32_i32$0 | 0;
    i64toi32_i32$1 = i64toi32_i32$3 + i64toi32_i32$5 | 0;
    if (i64toi32_i32$2 >>> 0 < i64toi32_i32$0 >>> 0) {
     i64toi32_i32$1 = i64toi32_i32$1 + 1 | 0
    }
    i64toi32_i32$4 = $3_1;
    HEAP32[(i64toi32_i32$4 + 56 | 0) >> 2] = i64toi32_i32$2;
    HEAP32[(i64toi32_i32$4 + 60 | 0) >> 2] = i64toi32_i32$1;
    label$7 : {
     label$8 : while (1) {
      if (!(((HEAP32[($3_1 + 72 | 0) >> 2] | 0) + 8 | 0) >>> 0 <= (HEAP32[($3_1 + 68 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$7
      }
      $46_1 = 1;
      $48_1 = HEAP32[($3_1 + 76 | 0) >> 2] | 0;
      HEAP32[($3_1 + 88 | 0) >> 2] = HEAP32[($3_1 + 72 | 0) >> 2] | 0;
      HEAP32[($3_1 + 84 | 0) >> 2] = $48_1;
      $50_1 = HEAP32[($3_1 + 84 | 0) >> 2] | 0;
      HEAP32[($3_1 + 100 | 0) >> 2] = HEAP32[($3_1 + 88 | 0) >> 2] | 0;
      HEAP32[($3_1 + 96 | 0) >> 2] = $50_1;
      HEAP32[($3_1 + 92 | 0) >> 2] = $46_1;
      label$9 : {
       label$10 : {
        if (!((HEAP32[($3_1 + 92 | 0) >> 2] | 0 | 0) == ($46_1 | 0) & 1 | 0)) {
         break label$10
        }
        label$11 : {
         label$12 : {
          if (!((HEAP32[($3_1 + 96 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$12
          }
          i64toi32_i32$1 = $98(HEAP32[($3_1 + 100 | 0) >> 2] | 0 | 0) | 0;
          i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
          $336 = i64toi32_i32$1;
          $336$hi = i64toi32_i32$4;
          break label$11;
         }
         i64toi32_i32$4 = $98(HEAP32[($3_1 + 100 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
         i64toi32_i32$1 = $99(i64toi32_i32$4 | 0, i64toi32_i32$1 | 0) | 0;
         i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
         $336 = i64toi32_i32$1;
         $336$hi = i64toi32_i32$4;
        }
        i64toi32_i32$4 = $336$hi;
        i64toi32_i32$1 = $3_1;
        HEAP32[(i64toi32_i32$1 + 104 | 0) >> 2] = $336;
        HEAP32[(i64toi32_i32$1 + 108 | 0) >> 2] = i64toi32_i32$4;
        break label$9;
       }
       label$13 : {
        label$14 : {
         if (!((HEAP32[($3_1 + 96 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$14
         }
         i64toi32_i32$3 = HEAP32[($3_1 + 100 | 0) >> 2] | 0;
         i64toi32_i32$4 = HEAP32[i64toi32_i32$3 >> 2] | 0;
         i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 4 | 0) >> 2] | 0;
         $341 = i64toi32_i32$4;
         $341$hi = i64toi32_i32$1;
         break label$13;
        }
        i64toi32_i32$3 = HEAP32[($3_1 + 100 | 0) >> 2] | 0;
        i64toi32_i32$1 = HEAP32[i64toi32_i32$3 >> 2] | 0;
        i64toi32_i32$4 = HEAP32[(i64toi32_i32$3 + 4 | 0) >> 2] | 0;
        i64toi32_i32$4 = $99(i64toi32_i32$1 | 0, i64toi32_i32$4 | 0) | 0;
        i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
        $341 = i64toi32_i32$4;
        $341$hi = i64toi32_i32$1;
       }
       i64toi32_i32$1 = $341$hi;
       i64toi32_i32$4 = $3_1;
       HEAP32[(i64toi32_i32$4 + 104 | 0) >> 2] = $341;
       HEAP32[(i64toi32_i32$4 + 108 | 0) >> 2] = i64toi32_i32$1;
      }
      i64toi32_i32$1 = 0;
      $345$hi = i64toi32_i32$1;
      i64toi32_i32$3 = $3_1;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 104 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$3 + 108 | 0) >> 2] | 0;
      $346$hi = i64toi32_i32$4;
      i64toi32_i32$4 = $345$hi;
      i64toi32_i32$4 = $346$hi;
      $872 = i64toi32_i32$1;
      i64toi32_i32$4 = $345$hi;
      i64toi32_i32$1 = $346$hi;
      i64toi32_i32$1 = $100(0 | 0, i64toi32_i32$4 | 0, $872 | 0, i64toi32_i32$1 | 0) | 0;
      i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
      $875 = i64toi32_i32$1;
      i64toi32_i32$1 = i64toi32_i32$3;
      HEAP32[(i64toi32_i32$3 + 16 | 0) >> 2] = $875;
      HEAP32[(i64toi32_i32$3 + 20 | 0) >> 2] = i64toi32_i32$4;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$3 + 16 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 20 | 0) >> 2] | 0;
      $348 = i64toi32_i32$4;
      $348$hi = i64toi32_i32$1;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
      $880$hi = i64toi32_i32$4;
      i64toi32_i32$4 = $348$hi;
      i64toi32_i32$4 = $880$hi;
      i64toi32_i32$3 = i64toi32_i32$1;
      i64toi32_i32$1 = $348$hi;
      i64toi32_i32$0 = $348;
      i64toi32_i32$1 = i64toi32_i32$4 ^ i64toi32_i32$1 | 0;
      $884 = i64toi32_i32$3 ^ i64toi32_i32$0 | 0;
      i64toi32_i32$3 = $3_1;
      HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] = $884;
      HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] = i64toi32_i32$1;
      i64toi32_i32$4 = i64toi32_i32$3;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
      i64toi32_i32$3 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
      $351$hi = i64toi32_i32$3;
      i64toi32_i32$3 = 0;
      $352$hi = i64toi32_i32$3;
      i64toi32_i32$3 = $351$hi;
      i64toi32_i32$3 = $352$hi;
      i64toi32_i32$3 = $351$hi;
      i64toi32_i32$4 = i64toi32_i32$1;
      i64toi32_i32$1 = $352$hi;
      i64toi32_i32$0 = 27;
      i64toi32_i32$5 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$1 = i64toi32_i32$4 << i64toi32_i32$5 | 0;
       $337 = 0;
      } else {
       i64toi32_i32$1 = ((1 << i64toi32_i32$5 | 0) - 1 | 0) & (i64toi32_i32$4 >>> (32 - i64toi32_i32$5 | 0) | 0) | 0 | (i64toi32_i32$3 << i64toi32_i32$5 | 0) | 0;
       $337 = i64toi32_i32$4 << i64toi32_i32$5 | 0;
      }
      $353 = $337;
      $353$hi = i64toi32_i32$1;
      i64toi32_i32$3 = $3_1;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
      i64toi32_i32$4 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
      $354$hi = i64toi32_i32$4;
      i64toi32_i32$4 = 0;
      $355$hi = i64toi32_i32$4;
      i64toi32_i32$4 = $354$hi;
      i64toi32_i32$4 = $355$hi;
      i64toi32_i32$4 = $354$hi;
      i64toi32_i32$3 = i64toi32_i32$1;
      i64toi32_i32$1 = $355$hi;
      i64toi32_i32$0 = 37;
      i64toi32_i32$5 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$1 = 0;
       $338 = i64toi32_i32$4 >>> i64toi32_i32$5 | 0;
      } else {
       i64toi32_i32$1 = i64toi32_i32$4 >>> i64toi32_i32$5 | 0;
       $338 = (((1 << i64toi32_i32$5 | 0) - 1 | 0) & i64toi32_i32$4 | 0) << (32 - i64toi32_i32$5 | 0) | 0 | (i64toi32_i32$3 >>> i64toi32_i32$5 | 0) | 0;
      }
      $356$hi = i64toi32_i32$1;
      i64toi32_i32$1 = $353$hi;
      i64toi32_i32$1 = $356$hi;
      i64toi32_i32$1 = $353$hi;
      i64toi32_i32$4 = $353;
      i64toi32_i32$3 = $356$hi;
      i64toi32_i32$0 = $338;
      i64toi32_i32$3 = i64toi32_i32$1 | i64toi32_i32$3 | 0;
      $357$hi = i64toi32_i32$3;
      i64toi32_i32$3 = -1640531535;
      $358$hi = i64toi32_i32$3;
      i64toi32_i32$3 = $357$hi;
      i64toi32_i32$3 = $358$hi;
      i64toi32_i32$3 = $357$hi;
      $367 = i64toi32_i32$4 | i64toi32_i32$0 | 0;
      i64toi32_i32$4 = $358$hi;
      i64toi32_i32$4 = __wasm_i64_mul($367 | 0, i64toi32_i32$3 | 0, -2048144761 | 0, i64toi32_i32$4 | 0) | 0;
      i64toi32_i32$3 = i64toi32_i32$HIGH_BITS;
      $359$hi = i64toi32_i32$3;
      i64toi32_i32$3 = -2048144777;
      $360$hi = i64toi32_i32$3;
      i64toi32_i32$3 = $359$hi;
      i64toi32_i32$3 = $360$hi;
      i64toi32_i32$3 = $359$hi;
      i64toi32_i32$1 = i64toi32_i32$4;
      i64toi32_i32$4 = $360$hi;
      i64toi32_i32$0 = -1028477341;
      i64toi32_i32$5 = i64toi32_i32$1 + i64toi32_i32$0 | 0;
      i64toi32_i32$2 = i64toi32_i32$3 + i64toi32_i32$4 | 0;
      if (i64toi32_i32$5 >>> 0 < i64toi32_i32$0 >>> 0) {
       i64toi32_i32$2 = i64toi32_i32$2 + 1 | 0
      }
      i64toi32_i32$1 = $3_1;
      HEAP32[(i64toi32_i32$1 + 56 | 0) >> 2] = i64toi32_i32$5;
      HEAP32[(i64toi32_i32$1 + 60 | 0) >> 2] = i64toi32_i32$2;
      HEAP32[(i64toi32_i32$1 + 72 | 0) >> 2] = (HEAP32[(i64toi32_i32$1 + 72 | 0) >> 2] | 0) + 8 | 0;
      continue label$8;
     };
    }
    label$15 : {
     if (!(((HEAP32[($3_1 + 72 | 0) >> 2] | 0) + 4 | 0) >>> 0 <= (HEAP32[($3_1 + 68 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$15
     }
     $87_1 = 1;
     $89_1 = HEAP32[($3_1 + 76 | 0) >> 2] | 0;
     HEAP32[($3_1 + 116 | 0) >> 2] = HEAP32[($3_1 + 72 | 0) >> 2] | 0;
     HEAP32[($3_1 + 112 | 0) >> 2] = $89_1;
     $91_1 = HEAP32[($3_1 + 112 | 0) >> 2] | 0;
     HEAP32[($3_1 + 128 | 0) >> 2] = HEAP32[($3_1 + 116 | 0) >> 2] | 0;
     HEAP32[($3_1 + 124 | 0) >> 2] = $91_1;
     HEAP32[($3_1 + 120 | 0) >> 2] = $87_1;
     label$16 : {
      label$17 : {
       if (!((HEAP32[($3_1 + 120 | 0) >> 2] | 0 | 0) == ($87_1 | 0) & 1 | 0)) {
        break label$17
       }
       label$18 : {
        label$19 : {
         if (!((HEAP32[($3_1 + 124 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$19
         }
         $107_1 = $102(HEAP32[($3_1 + 128 | 0) >> 2] | 0 | 0) | 0;
         break label$18;
        }
        $107_1 = $103($102(HEAP32[($3_1 + 128 | 0) >> 2] | 0 | 0) | 0 | 0) | 0;
       }
       HEAP32[($3_1 + 132 | 0) >> 2] = $107_1;
       break label$16;
      }
      label$20 : {
       label$21 : {
        if (!((HEAP32[($3_1 + 124 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
         break label$21
        }
        $121_1 = HEAP32[(HEAP32[($3_1 + 128 | 0) >> 2] | 0) >> 2] | 0;
        break label$20;
       }
       $121_1 = $103(HEAP32[(HEAP32[($3_1 + 128 | 0) >> 2] | 0) >> 2] | 0 | 0) | 0;
      }
      HEAP32[($3_1 + 132 | 0) >> 2] = $121_1;
     }
     i64toi32_i32$2 = 0;
     $362$hi = i64toi32_i32$2;
     i64toi32_i32$2 = -1640531535;
     $363$hi = i64toi32_i32$2;
     i64toi32_i32$2 = $362$hi;
     i64toi32_i32$2 = $363$hi;
     i64toi32_i32$2 = $362$hi;
     i64toi32_i32$1 = $363$hi;
     i64toi32_i32$1 = __wasm_i64_mul(HEAP32[($3_1 + 132 | 0) >> 2] | 0 | 0, i64toi32_i32$2 | 0, -2048144761 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
     $364 = i64toi32_i32$1;
     $364$hi = i64toi32_i32$2;
     i64toi32_i32$3 = $3_1;
     i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
     $1024$hi = i64toi32_i32$1;
     i64toi32_i32$1 = $364$hi;
     i64toi32_i32$1 = $1024$hi;
     i64toi32_i32$3 = i64toi32_i32$2;
     i64toi32_i32$2 = $364$hi;
     i64toi32_i32$0 = $364;
     i64toi32_i32$2 = i64toi32_i32$1 ^ i64toi32_i32$2 | 0;
     $1028 = i64toi32_i32$3 ^ i64toi32_i32$0 | 0;
     i64toi32_i32$3 = $3_1;
     HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] = $1028;
     HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] = i64toi32_i32$2;
     i64toi32_i32$1 = i64toi32_i32$3;
     i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
     $367$hi = i64toi32_i32$3;
     i64toi32_i32$3 = 0;
     $368$hi = i64toi32_i32$3;
     i64toi32_i32$3 = $367$hi;
     i64toi32_i32$3 = $368$hi;
     i64toi32_i32$3 = $367$hi;
     i64toi32_i32$1 = i64toi32_i32$2;
     i64toi32_i32$2 = $368$hi;
     i64toi32_i32$0 = 23;
     i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
      i64toi32_i32$2 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
      $339 = 0;
     } else {
      i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$1 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$3 << i64toi32_i32$4 | 0) | 0;
      $339 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
     }
     $369 = $339;
     $369$hi = i64toi32_i32$2;
     i64toi32_i32$3 = $3_1;
     i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
     $370$hi = i64toi32_i32$1;
     i64toi32_i32$1 = 0;
     $371$hi = i64toi32_i32$1;
     i64toi32_i32$1 = $370$hi;
     i64toi32_i32$1 = $371$hi;
     i64toi32_i32$1 = $370$hi;
     i64toi32_i32$3 = i64toi32_i32$2;
     i64toi32_i32$2 = $371$hi;
     i64toi32_i32$0 = 41;
     i64toi32_i32$4 = i64toi32_i32$0 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
      i64toi32_i32$2 = 0;
      $340 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
     } else {
      i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
      $340 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$3 >>> i64toi32_i32$4 | 0) | 0;
     }
     $372$hi = i64toi32_i32$2;
     i64toi32_i32$2 = $369$hi;
     i64toi32_i32$2 = $372$hi;
     i64toi32_i32$2 = $369$hi;
     i64toi32_i32$1 = $369;
     i64toi32_i32$3 = $372$hi;
     i64toi32_i32$0 = $340;
     i64toi32_i32$3 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
     $373$hi = i64toi32_i32$3;
     i64toi32_i32$3 = -1028477379;
     $374$hi = i64toi32_i32$3;
     i64toi32_i32$3 = $373$hi;
     i64toi32_i32$3 = $374$hi;
     i64toi32_i32$3 = $373$hi;
     $368 = i64toi32_i32$1 | i64toi32_i32$0 | 0;
     i64toi32_i32$1 = $374$hi;
     i64toi32_i32$1 = __wasm_i64_mul($368 | 0, i64toi32_i32$3 | 0, 668265295 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$3 = i64toi32_i32$HIGH_BITS;
     $375$hi = i64toi32_i32$3;
     i64toi32_i32$3 = 374761393;
     $376$hi = i64toi32_i32$3;
     i64toi32_i32$3 = $375$hi;
     i64toi32_i32$3 = $376$hi;
     i64toi32_i32$3 = $375$hi;
     i64toi32_i32$2 = i64toi32_i32$1;
     i64toi32_i32$1 = $376$hi;
     i64toi32_i32$0 = -1640531463;
     i64toi32_i32$4 = i64toi32_i32$2 + i64toi32_i32$0 | 0;
     i64toi32_i32$5 = i64toi32_i32$3 + i64toi32_i32$1 | 0;
     if (i64toi32_i32$4 >>> 0 < i64toi32_i32$0 >>> 0) {
      i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
     }
     i64toi32_i32$2 = $3_1;
     HEAP32[(i64toi32_i32$2 + 56 | 0) >> 2] = i64toi32_i32$4;
     HEAP32[(i64toi32_i32$2 + 60 | 0) >> 2] = i64toi32_i32$5;
     HEAP32[(i64toi32_i32$2 + 72 | 0) >> 2] = (HEAP32[(i64toi32_i32$2 + 72 | 0) >> 2] | 0) + 4 | 0;
    }
    label$22 : {
     label$23 : while (1) {
      if (!((HEAP32[($3_1 + 72 | 0) >> 2] | 0) >>> 0 < (HEAP32[($3_1 + 68 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$22
      }
      i64toi32_i32$5 = 0;
      $378$hi = i64toi32_i32$5;
      i64toi32_i32$5 = 668265263;
      $379$hi = i64toi32_i32$5;
      i64toi32_i32$5 = $378$hi;
      i64toi32_i32$5 = $379$hi;
      i64toi32_i32$5 = $378$hi;
      i64toi32_i32$2 = $379$hi;
      i64toi32_i32$2 = __wasm_i64_mul((HEAPU8[(HEAP32[($3_1 + 72 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0 | 0, i64toi32_i32$5 | 0, 374761413 | 0, i64toi32_i32$2 | 0) | 0;
      i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
      $380 = i64toi32_i32$2;
      $380$hi = i64toi32_i32$5;
      i64toi32_i32$3 = $3_1;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
      $1085$hi = i64toi32_i32$2;
      i64toi32_i32$2 = $380$hi;
      i64toi32_i32$2 = $1085$hi;
      i64toi32_i32$3 = i64toi32_i32$5;
      i64toi32_i32$5 = $380$hi;
      i64toi32_i32$0 = $380;
      i64toi32_i32$5 = i64toi32_i32$2 ^ i64toi32_i32$5 | 0;
      $1089 = i64toi32_i32$3 ^ i64toi32_i32$0 | 0;
      i64toi32_i32$3 = $3_1;
      HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] = $1089;
      HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] = i64toi32_i32$5;
      i64toi32_i32$2 = i64toi32_i32$3;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
      i64toi32_i32$3 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
      $383$hi = i64toi32_i32$3;
      i64toi32_i32$3 = 0;
      $384$hi = i64toi32_i32$3;
      i64toi32_i32$3 = $383$hi;
      i64toi32_i32$3 = $384$hi;
      i64toi32_i32$3 = $383$hi;
      i64toi32_i32$2 = i64toi32_i32$5;
      i64toi32_i32$5 = $384$hi;
      i64toi32_i32$0 = 11;
      i64toi32_i32$1 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$5 = i64toi32_i32$2 << i64toi32_i32$1 | 0;
       $342 = 0;
      } else {
       i64toi32_i32$5 = ((1 << i64toi32_i32$1 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$1 | 0) | 0) | 0 | (i64toi32_i32$3 << i64toi32_i32$1 | 0) | 0;
       $342 = i64toi32_i32$2 << i64toi32_i32$1 | 0;
      }
      $385 = $342;
      $385$hi = i64toi32_i32$5;
      i64toi32_i32$3 = $3_1;
      i64toi32_i32$5 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
      i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
      $386$hi = i64toi32_i32$2;
      i64toi32_i32$2 = 0;
      $387$hi = i64toi32_i32$2;
      i64toi32_i32$2 = $386$hi;
      i64toi32_i32$2 = $387$hi;
      i64toi32_i32$2 = $386$hi;
      i64toi32_i32$3 = i64toi32_i32$5;
      i64toi32_i32$5 = $387$hi;
      i64toi32_i32$0 = 53;
      i64toi32_i32$1 = i64toi32_i32$0 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
       i64toi32_i32$5 = 0;
       $343 = i64toi32_i32$2 >>> i64toi32_i32$1 | 0;
      } else {
       i64toi32_i32$5 = i64toi32_i32$2 >>> i64toi32_i32$1 | 0;
       $343 = (((1 << i64toi32_i32$1 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$1 | 0) | 0 | (i64toi32_i32$3 >>> i64toi32_i32$1 | 0) | 0;
      }
      $388$hi = i64toi32_i32$5;
      i64toi32_i32$5 = $385$hi;
      i64toi32_i32$5 = $388$hi;
      i64toi32_i32$5 = $385$hi;
      i64toi32_i32$2 = $385;
      i64toi32_i32$3 = $388$hi;
      i64toi32_i32$0 = $343;
      i64toi32_i32$3 = i64toi32_i32$5 | i64toi32_i32$3 | 0;
      $389$hi = i64toi32_i32$3;
      i64toi32_i32$3 = -1640531535;
      $390$hi = i64toi32_i32$3;
      i64toi32_i32$3 = $389$hi;
      i64toi32_i32$3 = $390$hi;
      i64toi32_i32$3 = $389$hi;
      $370 = i64toi32_i32$2 | i64toi32_i32$0 | 0;
      i64toi32_i32$2 = $390$hi;
      i64toi32_i32$2 = __wasm_i64_mul($370 | 0, i64toi32_i32$3 | 0, -2048144761 | 0, i64toi32_i32$2 | 0) | 0;
      i64toi32_i32$3 = i64toi32_i32$HIGH_BITS;
      $1107 = i64toi32_i32$2;
      i64toi32_i32$2 = $3_1;
      HEAP32[(i64toi32_i32$2 + 56 | 0) >> 2] = $1107;
      HEAP32[(i64toi32_i32$2 + 60 | 0) >> 2] = i64toi32_i32$3;
      HEAP32[(i64toi32_i32$2 + 72 | 0) >> 2] = (HEAP32[(i64toi32_i32$2 + 72 | 0) >> 2] | 0) + 1 | 0;
      continue label$23;
     };
    }
    i64toi32_i32$5 = $3_1;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] | 0;
    i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] | 0;
    $392$hi = i64toi32_i32$2;
    i64toi32_i32$2 = 0;
    $393$hi = i64toi32_i32$2;
    i64toi32_i32$2 = $392$hi;
    i64toi32_i32$2 = $393$hi;
    i64toi32_i32$2 = $392$hi;
    i64toi32_i32$5 = i64toi32_i32$3;
    i64toi32_i32$3 = $393$hi;
    i64toi32_i32$0 = 33;
    i64toi32_i32$1 = i64toi32_i32$0 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
     i64toi32_i32$3 = 0;
     $344 = i64toi32_i32$2 >>> i64toi32_i32$1 | 0;
    } else {
     i64toi32_i32$3 = i64toi32_i32$2 >>> i64toi32_i32$1 | 0;
     $344 = (((1 << i64toi32_i32$1 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$1 | 0) | 0 | (i64toi32_i32$5 >>> i64toi32_i32$1 | 0) | 0;
    }
    $394$hi = i64toi32_i32$3;
    i64toi32_i32$2 = $3_1;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$2 + 56 | 0) >> 2] | 0;
    i64toi32_i32$5 = HEAP32[(i64toi32_i32$2 + 60 | 0) >> 2] | 0;
    $1122$hi = i64toi32_i32$5;
    i64toi32_i32$5 = $394$hi;
    i64toi32_i32$5 = $1122$hi;
    i64toi32_i32$2 = i64toi32_i32$3;
    i64toi32_i32$3 = $394$hi;
    i64toi32_i32$0 = $344;
    i64toi32_i32$3 = i64toi32_i32$5 ^ i64toi32_i32$3 | 0;
    $1126 = i64toi32_i32$2 ^ i64toi32_i32$0 | 0;
    i64toi32_i32$2 = $3_1;
    HEAP32[(i64toi32_i32$2 + 56 | 0) >> 2] = $1126;
    HEAP32[(i64toi32_i32$2 + 60 | 0) >> 2] = i64toi32_i32$3;
    i64toi32_i32$5 = i64toi32_i32$2;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] | 0;
    i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] | 0;
    $397$hi = i64toi32_i32$2;
    i64toi32_i32$2 = -1028477379;
    $398$hi = i64toi32_i32$2;
    i64toi32_i32$2 = $397$hi;
    i64toi32_i32$2 = $398$hi;
    i64toi32_i32$2 = $397$hi;
    $371 = i64toi32_i32$3;
    i64toi32_i32$3 = $398$hi;
    i64toi32_i32$3 = __wasm_i64_mul($371 | 0, i64toi32_i32$2 | 0, 668265295 | 0, i64toi32_i32$3 | 0) | 0;
    i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
    $1133 = i64toi32_i32$3;
    i64toi32_i32$3 = i64toi32_i32$5;
    HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] = $1133;
    HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] = i64toi32_i32$2;
    i64toi32_i32$5 = i64toi32_i32$3;
    i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
    $400$hi = i64toi32_i32$3;
    i64toi32_i32$3 = 0;
    $401$hi = i64toi32_i32$3;
    i64toi32_i32$3 = $400$hi;
    i64toi32_i32$3 = $401$hi;
    i64toi32_i32$3 = $400$hi;
    i64toi32_i32$5 = i64toi32_i32$2;
    i64toi32_i32$2 = $401$hi;
    i64toi32_i32$0 = 29;
    i64toi32_i32$1 = i64toi32_i32$0 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
     i64toi32_i32$2 = 0;
     $345 = i64toi32_i32$3 >>> i64toi32_i32$1 | 0;
    } else {
     i64toi32_i32$2 = i64toi32_i32$3 >>> i64toi32_i32$1 | 0;
     $345 = (((1 << i64toi32_i32$1 | 0) - 1 | 0) & i64toi32_i32$3 | 0) << (32 - i64toi32_i32$1 | 0) | 0 | (i64toi32_i32$5 >>> i64toi32_i32$1 | 0) | 0;
    }
    $402$hi = i64toi32_i32$2;
    i64toi32_i32$3 = $3_1;
    i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
    i64toi32_i32$5 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
    $1141$hi = i64toi32_i32$5;
    i64toi32_i32$5 = $402$hi;
    i64toi32_i32$5 = $1141$hi;
    i64toi32_i32$3 = i64toi32_i32$2;
    i64toi32_i32$2 = $402$hi;
    i64toi32_i32$0 = $345;
    i64toi32_i32$2 = i64toi32_i32$5 ^ i64toi32_i32$2 | 0;
    $1145 = i64toi32_i32$3 ^ i64toi32_i32$0 | 0;
    i64toi32_i32$3 = $3_1;
    HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] = $1145;
    HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] = i64toi32_i32$2;
    i64toi32_i32$5 = i64toi32_i32$3;
    i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 56 | 0) >> 2] | 0;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$3 + 60 | 0) >> 2] | 0;
    $405$hi = i64toi32_i32$3;
    i64toi32_i32$3 = 374761393;
    $406$hi = i64toi32_i32$3;
    i64toi32_i32$3 = $405$hi;
    i64toi32_i32$3 = $406$hi;
    i64toi32_i32$3 = $405$hi;
    $372 = i64toi32_i32$2;
    i64toi32_i32$2 = $406$hi;
    i64toi32_i32$2 = __wasm_i64_mul($372 | 0, i64toi32_i32$3 | 0, -1640531463 | 0, i64toi32_i32$2 | 0) | 0;
    i64toi32_i32$3 = i64toi32_i32$HIGH_BITS;
    $1152 = i64toi32_i32$2;
    i64toi32_i32$2 = i64toi32_i32$5;
    HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] = $1152;
    HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] = i64toi32_i32$3;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] | 0;
    i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] | 0;
    $408$hi = i64toi32_i32$2;
    i64toi32_i32$2 = 0;
    $409$hi = i64toi32_i32$2;
    i64toi32_i32$2 = $408$hi;
    i64toi32_i32$2 = $409$hi;
    i64toi32_i32$2 = $408$hi;
    i64toi32_i32$5 = i64toi32_i32$3;
    i64toi32_i32$3 = $409$hi;
    i64toi32_i32$0 = 32;
    i64toi32_i32$1 = i64toi32_i32$0 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$0 & 63 | 0) >>> 0) {
     i64toi32_i32$3 = 0;
     $346 = i64toi32_i32$2 >>> i64toi32_i32$1 | 0;
    } else {
     i64toi32_i32$3 = i64toi32_i32$2 >>> i64toi32_i32$1 | 0;
     $346 = (((1 << i64toi32_i32$1 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$1 | 0) | 0 | (i64toi32_i32$5 >>> i64toi32_i32$1 | 0) | 0;
    }
    $410$hi = i64toi32_i32$3;
    i64toi32_i32$2 = $3_1;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$2 + 56 | 0) >> 2] | 0;
    i64toi32_i32$5 = HEAP32[(i64toi32_i32$2 + 60 | 0) >> 2] | 0;
    $1160$hi = i64toi32_i32$5;
    i64toi32_i32$5 = $410$hi;
    i64toi32_i32$5 = $1160$hi;
    i64toi32_i32$2 = i64toi32_i32$3;
    i64toi32_i32$3 = $410$hi;
    i64toi32_i32$0 = $346;
    i64toi32_i32$3 = i64toi32_i32$5 ^ i64toi32_i32$3 | 0;
    $1164 = i64toi32_i32$2 ^ i64toi32_i32$0 | 0;
    i64toi32_i32$2 = $3_1;
    HEAP32[(i64toi32_i32$2 + 56 | 0) >> 2] = $1164;
    HEAP32[(i64toi32_i32$2 + 60 | 0) >> 2] = i64toi32_i32$3;
    i64toi32_i32$5 = i64toi32_i32$2;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$5 + 56 | 0) >> 2] | 0;
    i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 60 | 0) >> 2] | 0;
    $1168 = i64toi32_i32$3;
    i64toi32_i32$3 = i64toi32_i32$5;
    HEAP32[(i64toi32_i32$3 + 8 | 0) >> 2] = $1168;
    HEAP32[(i64toi32_i32$3 + 12 | 0) >> 2] = i64toi32_i32$2;
    break label$3;
   }
   i64toi32_i32$2 = 0;
   $414$hi = i64toi32_i32$2;
   HEAP32[($3_1 + 200 | 0) >> 2] = HEAP32[($3_1 + 4 | 0) >> 2] | 0;
   HEAP32[($3_1 + 196 | 0) >> 2] = 0;
   HEAP32[($3_1 + 192 | 0) >> 2] = (HEAP32[($3_1 + 200 | 0) >> 2] | 0) + 40 | 0;
   HEAP32[($3_1 + 188 | 0) >> 2] = ((HEAP32[($3_1 + 200 | 0) >> 2] | 0) + 40 | 0) + (HEAP32[((HEAP32[($3_1 + 200 | 0) >> 2] | 0) + 72 | 0) >> 2] | 0) | 0;
   i64toi32_i32$5 = HEAP32[($3_1 + 200 | 0) >> 2] | 0;
   i64toi32_i32$2 = HEAP32[i64toi32_i32$5 >> 2] | 0;
   i64toi32_i32$3 = HEAP32[(i64toi32_i32$5 + 4 | 0) >> 2] | 0;
   $416$hi = i64toi32_i32$3;
   i64toi32_i32$3 = $414$hi;
   i64toi32_i32$3 = $416$hi;
   i64toi32_i32$3 = $414$hi;
   i64toi32_i32$3 = $416$hi;
   i64toi32_i32$5 = i64toi32_i32$2;
   i64toi32_i32$2 = $414$hi;
   i64toi32_i32$0 = 32;
   label$24 : {
    label$25 : {
     if (!((i64toi32_i32$3 >>> 0 > i64toi32_i32$2 >>> 0 | ((i64toi32_i32$3 | 0) == (i64toi32_i32$2 | 0) & i64toi32_i32$5 >>> 0 >= i64toi32_i32$0 >>> 0 | 0) | 0) & 1 | 0)) {
      break label$25
     }
     i64toi32_i32$0 = HEAP32[($3_1 + 200 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] | 0;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] | 0;
     $1215 = i64toi32_i32$5;
     i64toi32_i32$5 = $3_1;
     HEAP32[(i64toi32_i32$5 + 168 | 0) >> 2] = $1215;
     HEAP32[(i64toi32_i32$5 + 172 | 0) >> 2] = i64toi32_i32$3;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$5 + 200 | 0) >> 2] | 0;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 16 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 20 | 0) >> 2] | 0;
     $1221 = i64toi32_i32$3;
     i64toi32_i32$3 = $3_1;
     HEAP32[(i64toi32_i32$3 + 160 | 0) >> 2] = $1221;
     HEAP32[(i64toi32_i32$3 + 164 | 0) >> 2] = i64toi32_i32$5;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 200 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 24 | 0) >> 2] | 0;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 28 | 0) >> 2] | 0;
     $1227 = i64toi32_i32$5;
     i64toi32_i32$5 = $3_1;
     HEAP32[(i64toi32_i32$5 + 152 | 0) >> 2] = $1227;
     HEAP32[(i64toi32_i32$5 + 156 | 0) >> 2] = i64toi32_i32$3;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$5 + 200 | 0) >> 2] | 0;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 32 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 36 | 0) >> 2] | 0;
     $1233 = i64toi32_i32$3;
     i64toi32_i32$3 = $3_1;
     HEAP32[(i64toi32_i32$3 + 144 | 0) >> 2] = $1233;
     HEAP32[(i64toi32_i32$3 + 148 | 0) >> 2] = i64toi32_i32$5;
     i64toi32_i32$0 = i64toi32_i32$3;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$3 + 168 | 0) >> 2] | 0;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$3 + 172 | 0) >> 2] | 0;
     $422$hi = i64toi32_i32$3;
     i64toi32_i32$3 = 0;
     $423$hi = i64toi32_i32$3;
     i64toi32_i32$3 = $422$hi;
     i64toi32_i32$3 = $423$hi;
     i64toi32_i32$3 = $422$hi;
     i64toi32_i32$0 = i64toi32_i32$5;
     i64toi32_i32$5 = $423$hi;
     i64toi32_i32$2 = 1;
     i64toi32_i32$1 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$5 = i64toi32_i32$0 << i64toi32_i32$1 | 0;
      $347 = 0;
     } else {
      i64toi32_i32$5 = ((1 << i64toi32_i32$1 | 0) - 1 | 0) & (i64toi32_i32$0 >>> (32 - i64toi32_i32$1 | 0) | 0) | 0 | (i64toi32_i32$3 << i64toi32_i32$1 | 0) | 0;
      $347 = i64toi32_i32$0 << i64toi32_i32$1 | 0;
     }
     $424 = $347;
     $424$hi = i64toi32_i32$5;
     i64toi32_i32$3 = $3_1;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$3 + 168 | 0) >> 2] | 0;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 172 | 0) >> 2] | 0;
     $425$hi = i64toi32_i32$0;
     i64toi32_i32$0 = 0;
     $426$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $425$hi;
     i64toi32_i32$0 = $426$hi;
     i64toi32_i32$0 = $425$hi;
     i64toi32_i32$3 = i64toi32_i32$5;
     i64toi32_i32$5 = $426$hi;
     i64toi32_i32$2 = 63;
     i64toi32_i32$1 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$5 = 0;
      $349 = i64toi32_i32$0 >>> i64toi32_i32$1 | 0;
     } else {
      i64toi32_i32$5 = i64toi32_i32$0 >>> i64toi32_i32$1 | 0;
      $349 = (((1 << i64toi32_i32$1 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$1 | 0) | 0 | (i64toi32_i32$3 >>> i64toi32_i32$1 | 0) | 0;
     }
     $427$hi = i64toi32_i32$5;
     i64toi32_i32$5 = $424$hi;
     i64toi32_i32$5 = $427$hi;
     i64toi32_i32$5 = $424$hi;
     i64toi32_i32$0 = $424;
     i64toi32_i32$3 = $427$hi;
     i64toi32_i32$2 = $349;
     i64toi32_i32$3 = i64toi32_i32$5 | i64toi32_i32$3 | 0;
     $428 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
     $428$hi = i64toi32_i32$3;
     i64toi32_i32$5 = $3_1;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$5 + 160 | 0) >> 2] | 0;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$5 + 164 | 0) >> 2] | 0;
     $429$hi = i64toi32_i32$0;
     i64toi32_i32$0 = 0;
     $430$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $429$hi;
     i64toi32_i32$0 = $430$hi;
     i64toi32_i32$0 = $429$hi;
     i64toi32_i32$5 = i64toi32_i32$3;
     i64toi32_i32$3 = $430$hi;
     i64toi32_i32$2 = 7;
     i64toi32_i32$1 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$3 = i64toi32_i32$5 << i64toi32_i32$1 | 0;
      $350 = 0;
     } else {
      i64toi32_i32$3 = ((1 << i64toi32_i32$1 | 0) - 1 | 0) & (i64toi32_i32$5 >>> (32 - i64toi32_i32$1 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$1 | 0) | 0;
      $350 = i64toi32_i32$5 << i64toi32_i32$1 | 0;
     }
     $431 = $350;
     $431$hi = i64toi32_i32$3;
     i64toi32_i32$0 = $3_1;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 160 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 164 | 0) >> 2] | 0;
     $432$hi = i64toi32_i32$5;
     i64toi32_i32$5 = 0;
     $433$hi = i64toi32_i32$5;
     i64toi32_i32$5 = $432$hi;
     i64toi32_i32$5 = $433$hi;
     i64toi32_i32$5 = $432$hi;
     i64toi32_i32$0 = i64toi32_i32$3;
     i64toi32_i32$3 = $433$hi;
     i64toi32_i32$2 = 57;
     i64toi32_i32$1 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$3 = 0;
      $351 = i64toi32_i32$5 >>> i64toi32_i32$1 | 0;
     } else {
      i64toi32_i32$3 = i64toi32_i32$5 >>> i64toi32_i32$1 | 0;
      $351 = (((1 << i64toi32_i32$1 | 0) - 1 | 0) & i64toi32_i32$5 | 0) << (32 - i64toi32_i32$1 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$1 | 0) | 0;
     }
     $434$hi = i64toi32_i32$3;
     i64toi32_i32$3 = $431$hi;
     i64toi32_i32$3 = $434$hi;
     i64toi32_i32$3 = $431$hi;
     i64toi32_i32$5 = $431;
     i64toi32_i32$0 = $434$hi;
     i64toi32_i32$2 = $351;
     i64toi32_i32$0 = i64toi32_i32$3 | i64toi32_i32$0 | 0;
     $435$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $428$hi;
     i64toi32_i32$0 = $435$hi;
     $1261 = i64toi32_i32$5 | i64toi32_i32$2 | 0;
     i64toi32_i32$0 = $428$hi;
     i64toi32_i32$3 = $428;
     i64toi32_i32$5 = $435$hi;
     i64toi32_i32$2 = $1261;
     i64toi32_i32$1 = i64toi32_i32$3 + i64toi32_i32$2 | 0;
     i64toi32_i32$4 = i64toi32_i32$0 + i64toi32_i32$5 | 0;
     if (i64toi32_i32$1 >>> 0 < i64toi32_i32$2 >>> 0) {
      i64toi32_i32$4 = i64toi32_i32$4 + 1 | 0
     }
     $436 = i64toi32_i32$1;
     $436$hi = i64toi32_i32$4;
     i64toi32_i32$0 = $3_1;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$0 + 152 | 0) >> 2] | 0;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 156 | 0) >> 2] | 0;
     $437$hi = i64toi32_i32$3;
     i64toi32_i32$3 = 0;
     $438$hi = i64toi32_i32$3;
     i64toi32_i32$3 = $437$hi;
     i64toi32_i32$3 = $438$hi;
     i64toi32_i32$3 = $437$hi;
     i64toi32_i32$0 = i64toi32_i32$4;
     i64toi32_i32$4 = $438$hi;
     i64toi32_i32$2 = 12;
     i64toi32_i32$5 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$4 = i64toi32_i32$0 << i64toi32_i32$5 | 0;
      $352 = 0;
     } else {
      i64toi32_i32$4 = ((1 << i64toi32_i32$5 | 0) - 1 | 0) & (i64toi32_i32$0 >>> (32 - i64toi32_i32$5 | 0) | 0) | 0 | (i64toi32_i32$3 << i64toi32_i32$5 | 0) | 0;
      $352 = i64toi32_i32$0 << i64toi32_i32$5 | 0;
     }
     $439 = $352;
     $439$hi = i64toi32_i32$4;
     i64toi32_i32$3 = $3_1;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$3 + 152 | 0) >> 2] | 0;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 156 | 0) >> 2] | 0;
     $440$hi = i64toi32_i32$0;
     i64toi32_i32$0 = 0;
     $441$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $440$hi;
     i64toi32_i32$0 = $441$hi;
     i64toi32_i32$0 = $440$hi;
     i64toi32_i32$3 = i64toi32_i32$4;
     i64toi32_i32$4 = $441$hi;
     i64toi32_i32$2 = 52;
     i64toi32_i32$5 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$4 = 0;
      $354 = i64toi32_i32$0 >>> i64toi32_i32$5 | 0;
     } else {
      i64toi32_i32$4 = i64toi32_i32$0 >>> i64toi32_i32$5 | 0;
      $354 = (((1 << i64toi32_i32$5 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$5 | 0) | 0 | (i64toi32_i32$3 >>> i64toi32_i32$5 | 0) | 0;
     }
     $442$hi = i64toi32_i32$4;
     i64toi32_i32$4 = $439$hi;
     i64toi32_i32$4 = $442$hi;
     i64toi32_i32$4 = $439$hi;
     i64toi32_i32$0 = $439;
     i64toi32_i32$3 = $442$hi;
     i64toi32_i32$2 = $354;
     i64toi32_i32$3 = i64toi32_i32$4 | i64toi32_i32$3 | 0;
     $443$hi = i64toi32_i32$3;
     i64toi32_i32$3 = $436$hi;
     i64toi32_i32$3 = $443$hi;
     $1277 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
     i64toi32_i32$3 = $436$hi;
     i64toi32_i32$4 = $436;
     i64toi32_i32$0 = $443$hi;
     i64toi32_i32$2 = $1277;
     i64toi32_i32$5 = i64toi32_i32$4 + i64toi32_i32$2 | 0;
     i64toi32_i32$1 = i64toi32_i32$3 + i64toi32_i32$0 | 0;
     if (i64toi32_i32$5 >>> 0 < i64toi32_i32$2 >>> 0) {
      i64toi32_i32$1 = i64toi32_i32$1 + 1 | 0
     }
     $444 = i64toi32_i32$5;
     $444$hi = i64toi32_i32$1;
     i64toi32_i32$3 = $3_1;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 144 | 0) >> 2] | 0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$3 + 148 | 0) >> 2] | 0;
     $445$hi = i64toi32_i32$4;
     i64toi32_i32$4 = 0;
     $446$hi = i64toi32_i32$4;
     i64toi32_i32$4 = $445$hi;
     i64toi32_i32$4 = $446$hi;
     i64toi32_i32$4 = $445$hi;
     i64toi32_i32$3 = i64toi32_i32$1;
     i64toi32_i32$1 = $446$hi;
     i64toi32_i32$2 = 18;
     i64toi32_i32$0 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$1 = i64toi32_i32$3 << i64toi32_i32$0 | 0;
      $355 = 0;
     } else {
      i64toi32_i32$1 = ((1 << i64toi32_i32$0 | 0) - 1 | 0) & (i64toi32_i32$3 >>> (32 - i64toi32_i32$0 | 0) | 0) | 0 | (i64toi32_i32$4 << i64toi32_i32$0 | 0) | 0;
      $355 = i64toi32_i32$3 << i64toi32_i32$0 | 0;
     }
     $447 = $355;
     $447$hi = i64toi32_i32$1;
     i64toi32_i32$4 = $3_1;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$4 + 144 | 0) >> 2] | 0;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$4 + 148 | 0) >> 2] | 0;
     $448$hi = i64toi32_i32$3;
     i64toi32_i32$3 = 0;
     $449$hi = i64toi32_i32$3;
     i64toi32_i32$3 = $448$hi;
     i64toi32_i32$3 = $449$hi;
     i64toi32_i32$3 = $448$hi;
     i64toi32_i32$4 = i64toi32_i32$1;
     i64toi32_i32$1 = $449$hi;
     i64toi32_i32$2 = 46;
     i64toi32_i32$0 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$1 = 0;
      $356 = i64toi32_i32$3 >>> i64toi32_i32$0 | 0;
     } else {
      i64toi32_i32$1 = i64toi32_i32$3 >>> i64toi32_i32$0 | 0;
      $356 = (((1 << i64toi32_i32$0 | 0) - 1 | 0) & i64toi32_i32$3 | 0) << (32 - i64toi32_i32$0 | 0) | 0 | (i64toi32_i32$4 >>> i64toi32_i32$0 | 0) | 0;
     }
     $450$hi = i64toi32_i32$1;
     i64toi32_i32$1 = $447$hi;
     i64toi32_i32$1 = $450$hi;
     i64toi32_i32$1 = $447$hi;
     i64toi32_i32$3 = $447;
     i64toi32_i32$4 = $450$hi;
     i64toi32_i32$2 = $356;
     i64toi32_i32$4 = i64toi32_i32$1 | i64toi32_i32$4 | 0;
     $451$hi = i64toi32_i32$4;
     i64toi32_i32$4 = $444$hi;
     i64toi32_i32$4 = $451$hi;
     $1293 = i64toi32_i32$3 | i64toi32_i32$2 | 0;
     i64toi32_i32$4 = $444$hi;
     i64toi32_i32$1 = $444;
     i64toi32_i32$3 = $451$hi;
     i64toi32_i32$2 = $1293;
     i64toi32_i32$0 = i64toi32_i32$1 + i64toi32_i32$2 | 0;
     i64toi32_i32$5 = i64toi32_i32$4 + i64toi32_i32$3 | 0;
     if (i64toi32_i32$0 >>> 0 < i64toi32_i32$2 >>> 0) {
      i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
     }
     i64toi32_i32$1 = $3_1;
     HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] = i64toi32_i32$0;
     HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] = i64toi32_i32$5;
     i64toi32_i32$4 = i64toi32_i32$1;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] | 0;
     $453 = i64toi32_i32$5;
     $453$hi = i64toi32_i32$1;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$4 + 168 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$4 + 172 | 0) >> 2] | 0;
     $454$hi = i64toi32_i32$5;
     i64toi32_i32$5 = $453$hi;
     i64toi32_i32$5 = $454$hi;
     $1302 = i64toi32_i32$1;
     i64toi32_i32$5 = $453$hi;
     i64toi32_i32$1 = $454$hi;
     i64toi32_i32$1 = $101($453 | 0, i64toi32_i32$5 | 0, $1302 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
     $1305 = i64toi32_i32$1;
     i64toi32_i32$1 = i64toi32_i32$4;
     HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] = $1305;
     HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] = i64toi32_i32$5;
     i64toi32_i32$4 = i64toi32_i32$1;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] | 0;
     $456 = i64toi32_i32$5;
     $456$hi = i64toi32_i32$1;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$4 + 160 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$4 + 164 | 0) >> 2] | 0;
     $457$hi = i64toi32_i32$5;
     i64toi32_i32$5 = $456$hi;
     i64toi32_i32$5 = $457$hi;
     $1311 = i64toi32_i32$1;
     i64toi32_i32$5 = $456$hi;
     i64toi32_i32$1 = $457$hi;
     i64toi32_i32$1 = $101($456 | 0, i64toi32_i32$5 | 0, $1311 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
     $1314 = i64toi32_i32$1;
     i64toi32_i32$1 = i64toi32_i32$4;
     HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] = $1314;
     HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] = i64toi32_i32$5;
     i64toi32_i32$4 = i64toi32_i32$1;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] | 0;
     $459 = i64toi32_i32$5;
     $459$hi = i64toi32_i32$1;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$4 + 152 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$4 + 156 | 0) >> 2] | 0;
     $460$hi = i64toi32_i32$5;
     i64toi32_i32$5 = $459$hi;
     i64toi32_i32$5 = $460$hi;
     $1320 = i64toi32_i32$1;
     i64toi32_i32$5 = $459$hi;
     i64toi32_i32$1 = $460$hi;
     i64toi32_i32$1 = $101($459 | 0, i64toi32_i32$5 | 0, $1320 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
     $1323 = i64toi32_i32$1;
     i64toi32_i32$1 = i64toi32_i32$4;
     HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] = $1323;
     HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] = i64toi32_i32$5;
     i64toi32_i32$4 = i64toi32_i32$1;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] | 0;
     $462 = i64toi32_i32$5;
     $462$hi = i64toi32_i32$1;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$4 + 144 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$4 + 148 | 0) >> 2] | 0;
     $463$hi = i64toi32_i32$5;
     i64toi32_i32$5 = $462$hi;
     i64toi32_i32$5 = $463$hi;
     $1329 = i64toi32_i32$1;
     i64toi32_i32$5 = $462$hi;
     i64toi32_i32$1 = $463$hi;
     i64toi32_i32$1 = $101($462 | 0, i64toi32_i32$5 | 0, $1329 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
     $1332 = i64toi32_i32$1;
     i64toi32_i32$1 = i64toi32_i32$4;
     HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] = $1332;
     HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] = i64toi32_i32$5;
     break label$24;
    }
    i64toi32_i32$4 = HEAP32[($3_1 + 200 | 0) >> 2] | 0;
    i64toi32_i32$5 = HEAP32[(i64toi32_i32$4 + 24 | 0) >> 2] | 0;
    i64toi32_i32$1 = HEAP32[(i64toi32_i32$4 + 28 | 0) >> 2] | 0;
    $465$hi = i64toi32_i32$1;
    i64toi32_i32$1 = 668265263;
    $466$hi = i64toi32_i32$1;
    i64toi32_i32$1 = $465$hi;
    i64toi32_i32$1 = $466$hi;
    i64toi32_i32$1 = $465$hi;
    i64toi32_i32$4 = i64toi32_i32$5;
    i64toi32_i32$5 = $466$hi;
    i64toi32_i32$2 = 374761413;
    i64toi32_i32$3 = i64toi32_i32$4 + i64toi32_i32$2 | 0;
    i64toi32_i32$0 = i64toi32_i32$1 + i64toi32_i32$5 | 0;
    if (i64toi32_i32$3 >>> 0 < i64toi32_i32$2 >>> 0) {
     i64toi32_i32$0 = i64toi32_i32$0 + 1 | 0
    }
    i64toi32_i32$4 = $3_1;
    HEAP32[(i64toi32_i32$4 + 176 | 0) >> 2] = i64toi32_i32$3;
    HEAP32[(i64toi32_i32$4 + 180 | 0) >> 2] = i64toi32_i32$0;
   }
   i64toi32_i32$1 = HEAP32[($3_1 + 200 | 0) >> 2] | 0;
   i64toi32_i32$0 = HEAP32[i64toi32_i32$1 >> 2] | 0;
   i64toi32_i32$4 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
   $468 = i64toi32_i32$0;
   $468$hi = i64toi32_i32$4;
   i64toi32_i32$1 = $3_1;
   i64toi32_i32$4 = HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] | 0;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] | 0;
   $1348$hi = i64toi32_i32$0;
   i64toi32_i32$0 = $468$hi;
   i64toi32_i32$0 = $1348$hi;
   i64toi32_i32$1 = i64toi32_i32$4;
   i64toi32_i32$4 = $468$hi;
   i64toi32_i32$2 = $468;
   i64toi32_i32$5 = i64toi32_i32$1 + i64toi32_i32$2 | 0;
   i64toi32_i32$3 = i64toi32_i32$0 + i64toi32_i32$4 | 0;
   if (i64toi32_i32$5 >>> 0 < i64toi32_i32$2 >>> 0) {
    i64toi32_i32$3 = i64toi32_i32$3 + 1 | 0
   }
   i64toi32_i32$1 = $3_1;
   HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] = i64toi32_i32$5;
   HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] = i64toi32_i32$3;
   label$26 : {
    label$27 : while (1) {
     if (!(((HEAP32[($3_1 + 192 | 0) >> 2] | 0) + 8 | 0) >>> 0 <= (HEAP32[($3_1 + 188 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$26
     }
     $175 = 1;
     $177 = HEAP32[($3_1 + 196 | 0) >> 2] | 0;
     HEAP32[($3_1 + 208 | 0) >> 2] = HEAP32[($3_1 + 192 | 0) >> 2] | 0;
     HEAP32[($3_1 + 204 | 0) >> 2] = $177;
     $179 = HEAP32[($3_1 + 204 | 0) >> 2] | 0;
     HEAP32[($3_1 + 220 | 0) >> 2] = HEAP32[($3_1 + 208 | 0) >> 2] | 0;
     HEAP32[($3_1 + 216 | 0) >> 2] = $179;
     HEAP32[($3_1 + 212 | 0) >> 2] = $175;
     label$28 : {
      label$29 : {
       if (!((HEAP32[($3_1 + 212 | 0) >> 2] | 0 | 0) == ($175 | 0) & 1 | 0)) {
        break label$29
       }
       label$30 : {
        label$31 : {
         if (!((HEAP32[($3_1 + 216 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$31
         }
         i64toi32_i32$3 = $98(HEAP32[($3_1 + 220 | 0) >> 2] | 0 | 0) | 0;
         i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
         $472 = i64toi32_i32$3;
         $472$hi = i64toi32_i32$1;
         break label$30;
        }
        i64toi32_i32$1 = $98(HEAP32[($3_1 + 220 | 0) >> 2] | 0 | 0) | 0;
        i64toi32_i32$3 = i64toi32_i32$HIGH_BITS;
        i64toi32_i32$3 = $99(i64toi32_i32$1 | 0, i64toi32_i32$3 | 0) | 0;
        i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
        $472 = i64toi32_i32$3;
        $472$hi = i64toi32_i32$1;
       }
       i64toi32_i32$1 = $472$hi;
       i64toi32_i32$3 = $3_1;
       HEAP32[(i64toi32_i32$3 + 224 | 0) >> 2] = $472;
       HEAP32[(i64toi32_i32$3 + 228 | 0) >> 2] = i64toi32_i32$1;
       break label$28;
      }
      label$32 : {
       label$33 : {
        if (!((HEAP32[($3_1 + 216 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
         break label$33
        }
        i64toi32_i32$0 = HEAP32[($3_1 + 220 | 0) >> 2] | 0;
        i64toi32_i32$1 = HEAP32[i64toi32_i32$0 >> 2] | 0;
        i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] | 0;
        $477 = i64toi32_i32$1;
        $477$hi = i64toi32_i32$3;
        break label$32;
       }
       i64toi32_i32$0 = HEAP32[($3_1 + 220 | 0) >> 2] | 0;
       i64toi32_i32$3 = HEAP32[i64toi32_i32$0 >> 2] | 0;
       i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] | 0;
       i64toi32_i32$1 = $99(i64toi32_i32$3 | 0, i64toi32_i32$1 | 0) | 0;
       i64toi32_i32$3 = i64toi32_i32$HIGH_BITS;
       $477 = i64toi32_i32$1;
       $477$hi = i64toi32_i32$3;
      }
      i64toi32_i32$3 = $477$hi;
      i64toi32_i32$1 = $3_1;
      HEAP32[(i64toi32_i32$1 + 224 | 0) >> 2] = $477;
      HEAP32[(i64toi32_i32$1 + 228 | 0) >> 2] = i64toi32_i32$3;
     }
     i64toi32_i32$3 = 0;
     $481$hi = i64toi32_i32$3;
     i64toi32_i32$0 = $3_1;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 224 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 228 | 0) >> 2] | 0;
     $482$hi = i64toi32_i32$1;
     i64toi32_i32$1 = $481$hi;
     i64toi32_i32$1 = $482$hi;
     $1457 = i64toi32_i32$3;
     i64toi32_i32$1 = $481$hi;
     i64toi32_i32$3 = $482$hi;
     i64toi32_i32$3 = $100(0 | 0, i64toi32_i32$1 | 0, $1457 | 0, i64toi32_i32$3 | 0) | 0;
     i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
     $1460 = i64toi32_i32$3;
     i64toi32_i32$3 = i64toi32_i32$0;
     HEAP32[(i64toi32_i32$3 + 136 | 0) >> 2] = $1460;
     HEAP32[(i64toi32_i32$3 + 140 | 0) >> 2] = i64toi32_i32$1;
     i64toi32_i32$0 = i64toi32_i32$3;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 136 | 0) >> 2] | 0;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$3 + 140 | 0) >> 2] | 0;
     $484 = i64toi32_i32$1;
     $484$hi = i64toi32_i32$3;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] | 0;
     $1465$hi = i64toi32_i32$1;
     i64toi32_i32$1 = $484$hi;
     i64toi32_i32$1 = $1465$hi;
     i64toi32_i32$0 = i64toi32_i32$3;
     i64toi32_i32$3 = $484$hi;
     i64toi32_i32$2 = $484;
     i64toi32_i32$3 = i64toi32_i32$1 ^ i64toi32_i32$3 | 0;
     $1469 = i64toi32_i32$0 ^ i64toi32_i32$2 | 0;
     i64toi32_i32$0 = $3_1;
     HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] = $1469;
     HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] = i64toi32_i32$3;
     i64toi32_i32$1 = i64toi32_i32$0;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$1 + 176 | 0) >> 2] | 0;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 180 | 0) >> 2] | 0;
     $487$hi = i64toi32_i32$0;
     i64toi32_i32$0 = 0;
     $488$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $487$hi;
     i64toi32_i32$0 = $488$hi;
     i64toi32_i32$0 = $487$hi;
     i64toi32_i32$1 = i64toi32_i32$3;
     i64toi32_i32$3 = $488$hi;
     i64toi32_i32$2 = 27;
     i64toi32_i32$4 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$3 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
      $357 = 0;
     } else {
      i64toi32_i32$3 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$1 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$4 | 0) | 0;
      $357 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
     }
     $489 = $357;
     $489$hi = i64toi32_i32$3;
     i64toi32_i32$0 = $3_1;
     i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] | 0;
     $490$hi = i64toi32_i32$1;
     i64toi32_i32$1 = 0;
     $491$hi = i64toi32_i32$1;
     i64toi32_i32$1 = $490$hi;
     i64toi32_i32$1 = $491$hi;
     i64toi32_i32$1 = $490$hi;
     i64toi32_i32$0 = i64toi32_i32$3;
     i64toi32_i32$3 = $491$hi;
     i64toi32_i32$2 = 37;
     i64toi32_i32$4 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$3 = 0;
      $358 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
     } else {
      i64toi32_i32$3 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
      $358 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
     }
     $492$hi = i64toi32_i32$3;
     i64toi32_i32$3 = $489$hi;
     i64toi32_i32$3 = $492$hi;
     i64toi32_i32$3 = $489$hi;
     i64toi32_i32$1 = $489;
     i64toi32_i32$0 = $492$hi;
     i64toi32_i32$2 = $358;
     i64toi32_i32$0 = i64toi32_i32$3 | i64toi32_i32$0 | 0;
     $493$hi = i64toi32_i32$0;
     i64toi32_i32$0 = -1640531535;
     $494$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $493$hi;
     i64toi32_i32$0 = $494$hi;
     i64toi32_i32$0 = $493$hi;
     $373 = i64toi32_i32$1 | i64toi32_i32$2 | 0;
     i64toi32_i32$1 = $494$hi;
     i64toi32_i32$1 = __wasm_i64_mul($373 | 0, i64toi32_i32$0 | 0, -2048144761 | 0, i64toi32_i32$1 | 0) | 0;
     i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
     $495$hi = i64toi32_i32$0;
     i64toi32_i32$0 = -2048144777;
     $496$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $495$hi;
     i64toi32_i32$0 = $496$hi;
     i64toi32_i32$0 = $495$hi;
     i64toi32_i32$3 = i64toi32_i32$1;
     i64toi32_i32$1 = $496$hi;
     i64toi32_i32$2 = -1028477341;
     i64toi32_i32$4 = i64toi32_i32$3 + i64toi32_i32$2 | 0;
     i64toi32_i32$5 = i64toi32_i32$0 + i64toi32_i32$1 | 0;
     if (i64toi32_i32$4 >>> 0 < i64toi32_i32$2 >>> 0) {
      i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
     }
     i64toi32_i32$3 = $3_1;
     HEAP32[(i64toi32_i32$3 + 176 | 0) >> 2] = i64toi32_i32$4;
     HEAP32[(i64toi32_i32$3 + 180 | 0) >> 2] = i64toi32_i32$5;
     HEAP32[(i64toi32_i32$3 + 192 | 0) >> 2] = (HEAP32[(i64toi32_i32$3 + 192 | 0) >> 2] | 0) + 8 | 0;
     continue label$27;
    };
   }
   label$34 : {
    if (!(((HEAP32[($3_1 + 192 | 0) >> 2] | 0) + 4 | 0) >>> 0 <= (HEAP32[($3_1 + 188 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$34
    }
    $216 = 1;
    $218 = HEAP32[($3_1 + 196 | 0) >> 2] | 0;
    HEAP32[($3_1 + 236 | 0) >> 2] = HEAP32[($3_1 + 192 | 0) >> 2] | 0;
    HEAP32[($3_1 + 232 | 0) >> 2] = $218;
    $220 = HEAP32[($3_1 + 232 | 0) >> 2] | 0;
    HEAP32[($3_1 + 248 | 0) >> 2] = HEAP32[($3_1 + 236 | 0) >> 2] | 0;
    HEAP32[($3_1 + 244 | 0) >> 2] = $220;
    HEAP32[($3_1 + 240 | 0) >> 2] = $216;
    label$35 : {
     label$36 : {
      if (!((HEAP32[($3_1 + 240 | 0) >> 2] | 0 | 0) == ($216 | 0) & 1 | 0)) {
       break label$36
      }
      label$37 : {
       label$38 : {
        if (!((HEAP32[($3_1 + 244 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
         break label$38
        }
        $236 = $102(HEAP32[($3_1 + 248 | 0) >> 2] | 0 | 0) | 0;
        break label$37;
       }
       $236 = $103($102(HEAP32[($3_1 + 248 | 0) >> 2] | 0 | 0) | 0 | 0) | 0;
      }
      HEAP32[($3_1 + 252 | 0) >> 2] = $236;
      break label$35;
     }
     label$39 : {
      label$40 : {
       if (!((HEAP32[($3_1 + 244 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
        break label$40
       }
       $250 = HEAP32[(HEAP32[($3_1 + 248 | 0) >> 2] | 0) >> 2] | 0;
       break label$39;
      }
      $250 = $103(HEAP32[(HEAP32[($3_1 + 248 | 0) >> 2] | 0) >> 2] | 0 | 0) | 0;
     }
     HEAP32[($3_1 + 252 | 0) >> 2] = $250;
    }
    i64toi32_i32$5 = 0;
    $498$hi = i64toi32_i32$5;
    i64toi32_i32$5 = -1640531535;
    $499$hi = i64toi32_i32$5;
    i64toi32_i32$5 = $498$hi;
    i64toi32_i32$5 = $499$hi;
    i64toi32_i32$5 = $498$hi;
    i64toi32_i32$3 = $499$hi;
    i64toi32_i32$3 = __wasm_i64_mul(HEAP32[($3_1 + 252 | 0) >> 2] | 0 | 0, i64toi32_i32$5 | 0, -2048144761 | 0, i64toi32_i32$3 | 0) | 0;
    i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
    $500 = i64toi32_i32$3;
    $500$hi = i64toi32_i32$5;
    i64toi32_i32$0 = $3_1;
    i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] | 0;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] | 0;
    $1609$hi = i64toi32_i32$3;
    i64toi32_i32$3 = $500$hi;
    i64toi32_i32$3 = $1609$hi;
    i64toi32_i32$0 = i64toi32_i32$5;
    i64toi32_i32$5 = $500$hi;
    i64toi32_i32$2 = $500;
    i64toi32_i32$5 = i64toi32_i32$3 ^ i64toi32_i32$5 | 0;
    $1613 = i64toi32_i32$0 ^ i64toi32_i32$2 | 0;
    i64toi32_i32$0 = $3_1;
    HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] = $1613;
    HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] = i64toi32_i32$5;
    i64toi32_i32$3 = i64toi32_i32$0;
    i64toi32_i32$5 = HEAP32[(i64toi32_i32$3 + 176 | 0) >> 2] | 0;
    i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 180 | 0) >> 2] | 0;
    $503$hi = i64toi32_i32$0;
    i64toi32_i32$0 = 0;
    $504$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $503$hi;
    i64toi32_i32$0 = $504$hi;
    i64toi32_i32$0 = $503$hi;
    i64toi32_i32$3 = i64toi32_i32$5;
    i64toi32_i32$5 = $504$hi;
    i64toi32_i32$2 = 23;
    i64toi32_i32$1 = i64toi32_i32$2 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
     i64toi32_i32$5 = i64toi32_i32$3 << i64toi32_i32$1 | 0;
     $359 = 0;
    } else {
     i64toi32_i32$5 = ((1 << i64toi32_i32$1 | 0) - 1 | 0) & (i64toi32_i32$3 >>> (32 - i64toi32_i32$1 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$1 | 0) | 0;
     $359 = i64toi32_i32$3 << i64toi32_i32$1 | 0;
    }
    $505 = $359;
    $505$hi = i64toi32_i32$5;
    i64toi32_i32$0 = $3_1;
    i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] | 0;
    i64toi32_i32$3 = HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] | 0;
    $506$hi = i64toi32_i32$3;
    i64toi32_i32$3 = 0;
    $507$hi = i64toi32_i32$3;
    i64toi32_i32$3 = $506$hi;
    i64toi32_i32$3 = $507$hi;
    i64toi32_i32$3 = $506$hi;
    i64toi32_i32$0 = i64toi32_i32$5;
    i64toi32_i32$5 = $507$hi;
    i64toi32_i32$2 = 41;
    i64toi32_i32$1 = i64toi32_i32$2 & 31 | 0;
    if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
     i64toi32_i32$5 = 0;
     $360 = i64toi32_i32$3 >>> i64toi32_i32$1 | 0;
    } else {
     i64toi32_i32$5 = i64toi32_i32$3 >>> i64toi32_i32$1 | 0;
     $360 = (((1 << i64toi32_i32$1 | 0) - 1 | 0) & i64toi32_i32$3 | 0) << (32 - i64toi32_i32$1 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$1 | 0) | 0;
    }
    $508$hi = i64toi32_i32$5;
    i64toi32_i32$5 = $505$hi;
    i64toi32_i32$5 = $508$hi;
    i64toi32_i32$5 = $505$hi;
    i64toi32_i32$3 = $505;
    i64toi32_i32$0 = $508$hi;
    i64toi32_i32$2 = $360;
    i64toi32_i32$0 = i64toi32_i32$5 | i64toi32_i32$0 | 0;
    $509$hi = i64toi32_i32$0;
    i64toi32_i32$0 = -1028477379;
    $510$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $509$hi;
    i64toi32_i32$0 = $510$hi;
    i64toi32_i32$0 = $509$hi;
    $374 = i64toi32_i32$3 | i64toi32_i32$2 | 0;
    i64toi32_i32$3 = $510$hi;
    i64toi32_i32$3 = __wasm_i64_mul($374 | 0, i64toi32_i32$0 | 0, 668265295 | 0, i64toi32_i32$3 | 0) | 0;
    i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
    $511$hi = i64toi32_i32$0;
    i64toi32_i32$0 = 374761393;
    $512$hi = i64toi32_i32$0;
    i64toi32_i32$0 = $511$hi;
    i64toi32_i32$0 = $512$hi;
    i64toi32_i32$0 = $511$hi;
    i64toi32_i32$5 = i64toi32_i32$3;
    i64toi32_i32$3 = $512$hi;
    i64toi32_i32$2 = -1640531463;
    i64toi32_i32$1 = i64toi32_i32$5 + i64toi32_i32$2 | 0;
    i64toi32_i32$4 = i64toi32_i32$0 + i64toi32_i32$3 | 0;
    if (i64toi32_i32$1 >>> 0 < i64toi32_i32$2 >>> 0) {
     i64toi32_i32$4 = i64toi32_i32$4 + 1 | 0
    }
    i64toi32_i32$5 = $3_1;
    HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] = i64toi32_i32$1;
    HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] = i64toi32_i32$4;
    HEAP32[(i64toi32_i32$5 + 192 | 0) >> 2] = (HEAP32[(i64toi32_i32$5 + 192 | 0) >> 2] | 0) + 4 | 0;
   }
   label$41 : {
    label$42 : while (1) {
     if (!((HEAP32[($3_1 + 192 | 0) >> 2] | 0) >>> 0 < (HEAP32[($3_1 + 188 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$41
     }
     i64toi32_i32$4 = 0;
     $514$hi = i64toi32_i32$4;
     i64toi32_i32$4 = 668265263;
     $515$hi = i64toi32_i32$4;
     i64toi32_i32$4 = $514$hi;
     i64toi32_i32$4 = $515$hi;
     i64toi32_i32$4 = $514$hi;
     i64toi32_i32$5 = $515$hi;
     i64toi32_i32$5 = __wasm_i64_mul((HEAPU8[(HEAP32[($3_1 + 192 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0 | 0, i64toi32_i32$4 | 0, 374761413 | 0, i64toi32_i32$5 | 0) | 0;
     i64toi32_i32$4 = i64toi32_i32$HIGH_BITS;
     $516 = i64toi32_i32$5;
     $516$hi = i64toi32_i32$4;
     i64toi32_i32$0 = $3_1;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] | 0;
     $1670$hi = i64toi32_i32$5;
     i64toi32_i32$5 = $516$hi;
     i64toi32_i32$5 = $1670$hi;
     i64toi32_i32$0 = i64toi32_i32$4;
     i64toi32_i32$4 = $516$hi;
     i64toi32_i32$2 = $516;
     i64toi32_i32$4 = i64toi32_i32$5 ^ i64toi32_i32$4 | 0;
     $1674 = i64toi32_i32$0 ^ i64toi32_i32$2 | 0;
     i64toi32_i32$0 = $3_1;
     HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] = $1674;
     HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] = i64toi32_i32$4;
     i64toi32_i32$5 = i64toi32_i32$0;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] | 0;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] | 0;
     $519$hi = i64toi32_i32$0;
     i64toi32_i32$0 = 0;
     $520$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $519$hi;
     i64toi32_i32$0 = $520$hi;
     i64toi32_i32$0 = $519$hi;
     i64toi32_i32$5 = i64toi32_i32$4;
     i64toi32_i32$4 = $520$hi;
     i64toi32_i32$2 = 11;
     i64toi32_i32$3 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$4 = i64toi32_i32$5 << i64toi32_i32$3 | 0;
      $361 = 0;
     } else {
      i64toi32_i32$4 = ((1 << i64toi32_i32$3 | 0) - 1 | 0) & (i64toi32_i32$5 >>> (32 - i64toi32_i32$3 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$3 | 0) | 0;
      $361 = i64toi32_i32$5 << i64toi32_i32$3 | 0;
     }
     $521 = $361;
     $521$hi = i64toi32_i32$4;
     i64toi32_i32$0 = $3_1;
     i64toi32_i32$4 = HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] | 0;
     i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] | 0;
     $522$hi = i64toi32_i32$5;
     i64toi32_i32$5 = 0;
     $523$hi = i64toi32_i32$5;
     i64toi32_i32$5 = $522$hi;
     i64toi32_i32$5 = $523$hi;
     i64toi32_i32$5 = $522$hi;
     i64toi32_i32$0 = i64toi32_i32$4;
     i64toi32_i32$4 = $523$hi;
     i64toi32_i32$2 = 53;
     i64toi32_i32$3 = i64toi32_i32$2 & 31 | 0;
     if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
      i64toi32_i32$4 = 0;
      $362 = i64toi32_i32$5 >>> i64toi32_i32$3 | 0;
     } else {
      i64toi32_i32$4 = i64toi32_i32$5 >>> i64toi32_i32$3 | 0;
      $362 = (((1 << i64toi32_i32$3 | 0) - 1 | 0) & i64toi32_i32$5 | 0) << (32 - i64toi32_i32$3 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$3 | 0) | 0;
     }
     $524$hi = i64toi32_i32$4;
     i64toi32_i32$4 = $521$hi;
     i64toi32_i32$4 = $524$hi;
     i64toi32_i32$4 = $521$hi;
     i64toi32_i32$5 = $521;
     i64toi32_i32$0 = $524$hi;
     i64toi32_i32$2 = $362;
     i64toi32_i32$0 = i64toi32_i32$4 | i64toi32_i32$0 | 0;
     $525$hi = i64toi32_i32$0;
     i64toi32_i32$0 = -1640531535;
     $526$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $525$hi;
     i64toi32_i32$0 = $526$hi;
     i64toi32_i32$0 = $525$hi;
     $375 = i64toi32_i32$5 | i64toi32_i32$2 | 0;
     i64toi32_i32$5 = $526$hi;
     i64toi32_i32$5 = __wasm_i64_mul($375 | 0, i64toi32_i32$0 | 0, -2048144761 | 0, i64toi32_i32$5 | 0) | 0;
     i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
     $1692 = i64toi32_i32$5;
     i64toi32_i32$5 = $3_1;
     HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] = $1692;
     HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] = i64toi32_i32$0;
     HEAP32[(i64toi32_i32$5 + 192 | 0) >> 2] = (HEAP32[(i64toi32_i32$5 + 192 | 0) >> 2] | 0) + 1 | 0;
     continue label$42;
    };
   }
   i64toi32_i32$4 = $3_1;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$4 + 176 | 0) >> 2] | 0;
   i64toi32_i32$5 = HEAP32[(i64toi32_i32$4 + 180 | 0) >> 2] | 0;
   $528$hi = i64toi32_i32$5;
   i64toi32_i32$5 = 0;
   $529$hi = i64toi32_i32$5;
   i64toi32_i32$5 = $528$hi;
   i64toi32_i32$5 = $529$hi;
   i64toi32_i32$5 = $528$hi;
   i64toi32_i32$4 = i64toi32_i32$0;
   i64toi32_i32$0 = $529$hi;
   i64toi32_i32$2 = 33;
   i64toi32_i32$3 = i64toi32_i32$2 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
    i64toi32_i32$0 = 0;
    $363 = i64toi32_i32$5 >>> i64toi32_i32$3 | 0;
   } else {
    i64toi32_i32$0 = i64toi32_i32$5 >>> i64toi32_i32$3 | 0;
    $363 = (((1 << i64toi32_i32$3 | 0) - 1 | 0) & i64toi32_i32$5 | 0) << (32 - i64toi32_i32$3 | 0) | 0 | (i64toi32_i32$4 >>> i64toi32_i32$3 | 0) | 0;
   }
   $530$hi = i64toi32_i32$0;
   i64toi32_i32$5 = $3_1;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] | 0;
   i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] | 0;
   $1707$hi = i64toi32_i32$4;
   i64toi32_i32$4 = $530$hi;
   i64toi32_i32$4 = $1707$hi;
   i64toi32_i32$5 = i64toi32_i32$0;
   i64toi32_i32$0 = $530$hi;
   i64toi32_i32$2 = $363;
   i64toi32_i32$0 = i64toi32_i32$4 ^ i64toi32_i32$0 | 0;
   $1711 = i64toi32_i32$5 ^ i64toi32_i32$2 | 0;
   i64toi32_i32$5 = $3_1;
   HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] = $1711;
   HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$4 = i64toi32_i32$5;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] | 0;
   i64toi32_i32$5 = HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] | 0;
   $533$hi = i64toi32_i32$5;
   i64toi32_i32$5 = -1028477379;
   $534$hi = i64toi32_i32$5;
   i64toi32_i32$5 = $533$hi;
   i64toi32_i32$5 = $534$hi;
   i64toi32_i32$5 = $533$hi;
   $376 = i64toi32_i32$0;
   i64toi32_i32$0 = $534$hi;
   i64toi32_i32$0 = __wasm_i64_mul($376 | 0, i64toi32_i32$5 | 0, 668265295 | 0, i64toi32_i32$0 | 0) | 0;
   i64toi32_i32$5 = i64toi32_i32$HIGH_BITS;
   $1718 = i64toi32_i32$0;
   i64toi32_i32$0 = i64toi32_i32$4;
   HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] = $1718;
   HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] = i64toi32_i32$5;
   i64toi32_i32$4 = i64toi32_i32$0;
   i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] | 0;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] | 0;
   $536$hi = i64toi32_i32$0;
   i64toi32_i32$0 = 0;
   $537$hi = i64toi32_i32$0;
   i64toi32_i32$0 = $536$hi;
   i64toi32_i32$0 = $537$hi;
   i64toi32_i32$0 = $536$hi;
   i64toi32_i32$4 = i64toi32_i32$5;
   i64toi32_i32$5 = $537$hi;
   i64toi32_i32$2 = 29;
   i64toi32_i32$3 = i64toi32_i32$2 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
    i64toi32_i32$5 = 0;
    $365 = i64toi32_i32$0 >>> i64toi32_i32$3 | 0;
   } else {
    i64toi32_i32$5 = i64toi32_i32$0 >>> i64toi32_i32$3 | 0;
    $365 = (((1 << i64toi32_i32$3 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$3 | 0) | 0 | (i64toi32_i32$4 >>> i64toi32_i32$3 | 0) | 0;
   }
   $538$hi = i64toi32_i32$5;
   i64toi32_i32$0 = $3_1;
   i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] | 0;
   i64toi32_i32$4 = HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] | 0;
   $1726$hi = i64toi32_i32$4;
   i64toi32_i32$4 = $538$hi;
   i64toi32_i32$4 = $1726$hi;
   i64toi32_i32$0 = i64toi32_i32$5;
   i64toi32_i32$5 = $538$hi;
   i64toi32_i32$2 = $365;
   i64toi32_i32$5 = i64toi32_i32$4 ^ i64toi32_i32$5 | 0;
   $1730 = i64toi32_i32$0 ^ i64toi32_i32$2 | 0;
   i64toi32_i32$0 = $3_1;
   HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] = $1730;
   HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] = i64toi32_i32$5;
   i64toi32_i32$4 = i64toi32_i32$0;
   i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 176 | 0) >> 2] | 0;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$0 + 180 | 0) >> 2] | 0;
   $541$hi = i64toi32_i32$0;
   i64toi32_i32$0 = 374761393;
   $542$hi = i64toi32_i32$0;
   i64toi32_i32$0 = $541$hi;
   i64toi32_i32$0 = $542$hi;
   i64toi32_i32$0 = $541$hi;
   $377 = i64toi32_i32$5;
   i64toi32_i32$5 = $542$hi;
   i64toi32_i32$5 = __wasm_i64_mul($377 | 0, i64toi32_i32$0 | 0, -1640531463 | 0, i64toi32_i32$5 | 0) | 0;
   i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
   $1737 = i64toi32_i32$5;
   i64toi32_i32$5 = i64toi32_i32$4;
   HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] = $1737;
   HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$4 = i64toi32_i32$5;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] | 0;
   i64toi32_i32$5 = HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] | 0;
   $544$hi = i64toi32_i32$5;
   i64toi32_i32$5 = 0;
   $545$hi = i64toi32_i32$5;
   i64toi32_i32$5 = $544$hi;
   i64toi32_i32$5 = $545$hi;
   i64toi32_i32$5 = $544$hi;
   i64toi32_i32$4 = i64toi32_i32$0;
   i64toi32_i32$0 = $545$hi;
   i64toi32_i32$2 = 32;
   i64toi32_i32$3 = i64toi32_i32$2 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$2 & 63 | 0) >>> 0) {
    i64toi32_i32$0 = 0;
    $366 = i64toi32_i32$5 >>> i64toi32_i32$3 | 0;
   } else {
    i64toi32_i32$0 = i64toi32_i32$5 >>> i64toi32_i32$3 | 0;
    $366 = (((1 << i64toi32_i32$3 | 0) - 1 | 0) & i64toi32_i32$5 | 0) << (32 - i64toi32_i32$3 | 0) | 0 | (i64toi32_i32$4 >>> i64toi32_i32$3 | 0) | 0;
   }
   $546$hi = i64toi32_i32$0;
   i64toi32_i32$5 = $3_1;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] | 0;
   i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] | 0;
   $1745$hi = i64toi32_i32$4;
   i64toi32_i32$4 = $546$hi;
   i64toi32_i32$4 = $1745$hi;
   i64toi32_i32$5 = i64toi32_i32$0;
   i64toi32_i32$0 = $546$hi;
   i64toi32_i32$2 = $366;
   i64toi32_i32$0 = i64toi32_i32$4 ^ i64toi32_i32$0 | 0;
   $1749 = i64toi32_i32$5 ^ i64toi32_i32$2 | 0;
   i64toi32_i32$5 = $3_1;
   HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] = $1749;
   HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] = i64toi32_i32$0;
   i64toi32_i32$4 = i64toi32_i32$5;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$5 + 176 | 0) >> 2] | 0;
   i64toi32_i32$5 = HEAP32[(i64toi32_i32$5 + 180 | 0) >> 2] | 0;
   $1753 = i64toi32_i32$0;
   i64toi32_i32$0 = i64toi32_i32$4;
   HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] = $1753;
   HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] = i64toi32_i32$5;
  }
  i64toi32_i32$4 = $3_1;
  i64toi32_i32$5 = HEAP32[(i64toi32_i32$4 + 8 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$4 + 12 | 0) >> 2] | 0;
  $550 = i64toi32_i32$5;
  $550$hi = i64toi32_i32$0;
  label$43 : {
   $277 = i64toi32_i32$4 + 256 | 0;
   if ($277 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $277;
  }
  i64toi32_i32$0 = $550$hi;
  i64toi32_i32$5 = $550;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$0;
  return i64toi32_i32$5 | 0;
 }
 
 function $90($0_1, $1_1, $1$hi) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $1$hi = $1$hi | 0;
  var i64toi32_i32$1 = 0, i64toi32_i32$5 = 0, i64toi32_i32$0 = 0, i64toi32_i32$4 = 0, i64toi32_i32$2 = 0, i64toi32_i32$3 = 0, $4_1 = 0, $8_1 = 0, $17$hi = 0, $18$hi = 0, $19$hi = 0, $20$hi = 0, $22$hi = 0, $23$hi = 0, $25$hi = 0, $26$hi = 0, $28$hi = 0, $29$hi = 0, $16_1 = 0, $15_1 = 0, $5_1 = 0;
  $4_1 = global$0 - 112 | 0;
  label$1 : {
   $15_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $15_1;
  }
  $5_1 = 0;
  $8_1 = $4_1 + 8 | 0;
  HEAP32[($4_1 + 108 | 0) >> 2] = $0_1;
  i64toi32_i32$0 = $1$hi;
  i64toi32_i32$1 = $4_1;
  HEAP32[(i64toi32_i32$1 + 96 | 0) >> 2] = $1_1;
  HEAP32[(i64toi32_i32$1 + 100 | 0) >> 2] = i64toi32_i32$0;
  $154($8_1 | 0, 0 | 0, 80 | 0) | 0;
  i64toi32_i32$2 = i64toi32_i32$1;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 96 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 100 | 0) >> 2] | 0;
  $17$hi = i64toi32_i32$1;
  i64toi32_i32$1 = -1640531535;
  $18$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $17$hi;
  i64toi32_i32$1 = $18$hi;
  i64toi32_i32$1 = $17$hi;
  i64toi32_i32$2 = i64toi32_i32$0;
  i64toi32_i32$0 = $18$hi;
  i64toi32_i32$3 = -2048144761;
  i64toi32_i32$4 = i64toi32_i32$2 + i64toi32_i32$3 | 0;
  i64toi32_i32$5 = i64toi32_i32$1 + i64toi32_i32$0 | 0;
  if (i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) {
   i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
  }
  $19$hi = i64toi32_i32$5;
  i64toi32_i32$5 = -1028477379;
  $20$hi = i64toi32_i32$5;
  i64toi32_i32$5 = $19$hi;
  i64toi32_i32$5 = $20$hi;
  i64toi32_i32$5 = $19$hi;
  i64toi32_i32$1 = i64toi32_i32$4;
  i64toi32_i32$2 = $20$hi;
  i64toi32_i32$3 = 668265295;
  i64toi32_i32$0 = i64toi32_i32$1 + i64toi32_i32$3 | 0;
  i64toi32_i32$4 = i64toi32_i32$5 + i64toi32_i32$2 | 0;
  if (i64toi32_i32$0 >>> 0 < i64toi32_i32$3 >>> 0) {
   i64toi32_i32$4 = i64toi32_i32$4 + 1 | 0
  }
  i64toi32_i32$1 = $4_1;
  HEAP32[(i64toi32_i32$1 + 16 | 0) >> 2] = i64toi32_i32$0;
  HEAP32[(i64toi32_i32$1 + 20 | 0) >> 2] = i64toi32_i32$4;
  i64toi32_i32$5 = i64toi32_i32$1;
  i64toi32_i32$4 = HEAP32[(i64toi32_i32$1 + 96 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 100 | 0) >> 2] | 0;
  $22$hi = i64toi32_i32$1;
  i64toi32_i32$1 = -1028477379;
  $23$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $22$hi;
  i64toi32_i32$1 = $23$hi;
  i64toi32_i32$1 = $22$hi;
  i64toi32_i32$5 = i64toi32_i32$4;
  i64toi32_i32$4 = $23$hi;
  i64toi32_i32$3 = 668265295;
  i64toi32_i32$2 = i64toi32_i32$5 + i64toi32_i32$3 | 0;
  i64toi32_i32$0 = i64toi32_i32$1 + i64toi32_i32$4 | 0;
  if (i64toi32_i32$2 >>> 0 < i64toi32_i32$3 >>> 0) {
   i64toi32_i32$0 = i64toi32_i32$0 + 1 | 0
  }
  i64toi32_i32$5 = $4_1;
  HEAP32[(i64toi32_i32$5 + 24 | 0) >> 2] = i64toi32_i32$2;
  HEAP32[(i64toi32_i32$5 + 28 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$1 = i64toi32_i32$5;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 96 | 0) >> 2] | 0;
  i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 100 | 0) >> 2] | 0;
  $25$hi = i64toi32_i32$5;
  i64toi32_i32$5 = 0;
  $26$hi = i64toi32_i32$5;
  i64toi32_i32$5 = $25$hi;
  i64toi32_i32$5 = $26$hi;
  i64toi32_i32$5 = $25$hi;
  i64toi32_i32$1 = i64toi32_i32$0;
  i64toi32_i32$0 = $26$hi;
  i64toi32_i32$3 = 0;
  i64toi32_i32$4 = i64toi32_i32$1 + i64toi32_i32$3 | 0;
  i64toi32_i32$2 = i64toi32_i32$5 + i64toi32_i32$0 | 0;
  if (i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) {
   i64toi32_i32$2 = i64toi32_i32$2 + 1 | 0
  }
  i64toi32_i32$1 = $4_1;
  HEAP32[(i64toi32_i32$1 + 32 | 0) >> 2] = i64toi32_i32$4;
  HEAP32[(i64toi32_i32$1 + 36 | 0) >> 2] = i64toi32_i32$2;
  i64toi32_i32$5 = i64toi32_i32$1;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 96 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 100 | 0) >> 2] | 0;
  $28$hi = i64toi32_i32$1;
  i64toi32_i32$1 = -1640531535;
  $29$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $28$hi;
  i64toi32_i32$1 = $29$hi;
  i64toi32_i32$1 = $28$hi;
  i64toi32_i32$5 = i64toi32_i32$2;
  i64toi32_i32$2 = $29$hi;
  i64toi32_i32$3 = -2048144761;
  i64toi32_i32$0 = i64toi32_i32$5 - i64toi32_i32$3 | 0;
  i64toi32_i32$4 = (i64toi32_i32$5 >>> 0 < i64toi32_i32$3 >>> 0) + i64toi32_i32$2 | 0;
  i64toi32_i32$4 = i64toi32_i32$1 - i64toi32_i32$4 | 0;
  i64toi32_i32$5 = $4_1;
  HEAP32[(i64toi32_i32$5 + 40 | 0) >> 2] = i64toi32_i32$0;
  HEAP32[(i64toi32_i32$5 + 44 | 0) >> 2] = i64toi32_i32$4;
  $153(HEAP32[(i64toi32_i32$5 + 108 | 0) >> 2] | 0 | 0, $8_1 | 0, 88 | 0) | 0;
  label$3 : {
   $16_1 = i64toi32_i32$5 + 112 | 0;
   if ($16_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $16_1;
  }
  return $5_1 | 0;
 }
 
 function $91($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $18_1 = 0, $17_1 = 0, $14_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $17_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $17_1;
  }
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $14_1 = (($35(HEAP32[($3_1 + 12 | 0) >> 2] | 0 | 0) | 0) & 65535 | 0) + (((HEAPU8[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 2 | 0) >> 0] | 0) & 255 | 0) << 16 | 0) | 0;
  label$3 : {
   $18_1 = $3_1 + 16 | 0;
   if ($18_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $18_1;
  }
  return $14_1 | 0;
 }
 
 function $92($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, $396 = 0, $397 = 0, $233 = 0, $308 = 0, $17_1 = 0, $19_1 = 0, $36_1 = 0, $40_1 = 0, $247 = 0, $249 = 0, $331 = 0, $333 = 0, $395 = 0, $394 = 0, $391 = 0;
  $5_1 = global$0 - 96 | 0;
  label$1 : {
   $394 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $394;
  }
  HEAP32[($5_1 + 88 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 84 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 80 | 0) >> 2] = $2_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($5_1 + 80 | 0) >> 2] | 0) >>> 0 < 3 >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($5_1 + 92 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($5_1 + 76 | 0) >> 2] = HEAP32[($5_1 + 84 | 0) >> 2] | 0;
   $17_1 = 3;
   HEAP32[($5_1 + 72 | 0) >> 2] = (HEAPU8[(HEAP32[($5_1 + 76 | 0) >> 2] | 0) >> 0] | 0) & $17_1 | 0;
   $19_1 = HEAP32[($5_1 + 72 | 0) >> 2] | 0;
   label$5 : {
    switch ($19_1 | 0) {
    case 3:
     label$10 : {
      if (HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28808 | 0) >> 2] | 0) {
       break label$10
      }
      HEAP32[($5_1 + 92 | 0) >> 2] = -30;
      break label$3;
     }
    case 2:
     label$11 : {
      if (!((HEAP32[($5_1 + 80 | 0) >> 2] | 0) >>> 0 < 5 >>> 0 & 1 | 0)) {
       break label$11
      }
      HEAP32[($5_1 + 92 | 0) >> 2] = -20;
      break label$3;
     }
     HEAP32[($5_1 + 56 | 0) >> 2] = 0;
     $36_1 = 3;
     HEAP32[($5_1 + 52 | 0) >> 2] = ((HEAPU8[(HEAP32[($5_1 + 76 | 0) >> 2] | 0) >> 0] | 0) >>> 2 | 0) & $36_1 | 0;
     HEAP32[($5_1 + 48 | 0) >> 2] = $6(HEAP32[($5_1 + 76 | 0) >> 2] | 0 | 0) | 0;
     $40_1 = HEAP32[($5_1 + 52 | 0) >> 2] | 0;
     label$12 : {
      label$13 : {
       switch ($40_1 | 0) {
       case 0:
       case 1:
       default:
        HEAP32[($5_1 + 56 | 0) >> 2] = ((HEAP32[($5_1 + 52 | 0) >> 2] | 0 | 0) != (0 | 0) ^ -1 | 0) & 1 | 0;
        HEAP32[($5_1 + 68 | 0) >> 2] = 3;
        HEAP32[($5_1 + 64 | 0) >> 2] = ((HEAP32[($5_1 + 48 | 0) >> 2] | 0) >>> 4 | 0) & 1023 | 0;
        HEAP32[($5_1 + 60 | 0) >> 2] = ((HEAP32[($5_1 + 48 | 0) >> 2] | 0) >>> 14 | 0) & 1023 | 0;
        break label$12;
       case 2:
        HEAP32[($5_1 + 68 | 0) >> 2] = 4;
        HEAP32[($5_1 + 64 | 0) >> 2] = ((HEAP32[($5_1 + 48 | 0) >> 2] | 0) >>> 4 | 0) & 16383 | 0;
        HEAP32[($5_1 + 60 | 0) >> 2] = (HEAP32[($5_1 + 48 | 0) >> 2] | 0) >>> 18 | 0;
        break label$12;
       case 3:
        break label$13;
       };
      }
      HEAP32[($5_1 + 68 | 0) >> 2] = 5;
      HEAP32[($5_1 + 64 | 0) >> 2] = ((HEAP32[($5_1 + 48 | 0) >> 2] | 0) >>> 4 | 0) & 262143 | 0;
      HEAP32[($5_1 + 60 | 0) >> 2] = ((HEAP32[($5_1 + 48 | 0) >> 2] | 0) >>> 22 | 0) + (((HEAPU8[((HEAP32[($5_1 + 76 | 0) >> 2] | 0) + 4 | 0) >> 0] | 0) & 255 | 0) << 10 | 0) | 0;
     }
     label$17 : {
      if (!((HEAP32[($5_1 + 64 | 0) >> 2] | 0) >>> 0 > 131072 >>> 0 & 1 | 0)) {
       break label$17
      }
      HEAP32[($5_1 + 92 | 0) >> 2] = -20;
      break label$3;
     }
     label$18 : {
      if (!(((HEAP32[($5_1 + 60 | 0) >> 2] | 0) + (HEAP32[($5_1 + 68 | 0) >> 2] | 0) | 0) >>> 0 > (HEAP32[($5_1 + 80 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$18
      }
      HEAP32[($5_1 + 92 | 0) >> 2] = -20;
      break label$3;
     }
     label$19 : {
      if (!(HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28956 | 0) >> 2] | 0)) {
       break label$19
      }
      if (!((HEAP32[($5_1 + 64 | 0) >> 2] | 0) >>> 0 > 768 >>> 0 & 1 | 0)) {
       break label$19
      }
      HEAP32[($5_1 + 40 | 0) >> 2] = HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 12 | 0) >> 2] | 0;
      HEAP32[($5_1 + 36 | 0) >> 2] = 16388;
      HEAP32[($5_1 + 32 | 0) >> 2] = 0;
      label$20 : {
       label$21 : while (1) {
        if (!((HEAP32[($5_1 + 32 | 0) >> 2] | 0) >>> 0 < 16388 >>> 0 & 1 | 0)) {
         break label$20
        }
        (HEAP32[($5_1 + 40 | 0) >> 2] | 0) + (HEAP32[($5_1 + 32 | 0) >> 2] | 0) | 0;
        HEAP32[($5_1 + 32 | 0) >> 2] = (HEAP32[($5_1 + 32 | 0) >> 2] | 0) + 64 | 0;
        continue label$21;
       };
      }
     }
     label$22 : {
      label$23 : {
       if (!((HEAP32[($5_1 + 72 | 0) >> 2] | 0 | 0) == (3 | 0) & 1 | 0)) {
        break label$23
       }
       label$24 : {
        label$25 : {
         if (!(HEAP32[($5_1 + 56 | 0) >> 2] | 0)) {
          break label$25
         }
         HEAP32[($5_1 + 44 | 0) >> 2] = $46((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0 | 0, HEAP32[($5_1 + 64 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + (HEAP32[($5_1 + 68 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 60 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 12 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28940 | 0) >> 2] | 0 | 0) | 0;
         break label$24;
        }
        HEAP32[($5_1 + 44 | 0) >> 2] = $48((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0 | 0, HEAP32[($5_1 + 64 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + (HEAP32[($5_1 + 68 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 60 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 12 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28940 | 0) >> 2] | 0 | 0) | 0;
       }
       break label$22;
      }
      label$26 : {
       label$27 : {
        if (!(HEAP32[($5_1 + 56 | 0) >> 2] | 0)) {
         break label$27
        }
        HEAP32[($5_1 + 44 | 0) >> 2] = $47(((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 16 | 0) + 10264 | 0 | 0, (HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0 | 0, HEAP32[($5_1 + 64 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + (HEAP32[($5_1 + 68 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 60 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 26680 | 0 | 0, 2048 | 0, HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28940 | 0) >> 2] | 0 | 0) | 0;
        break label$26;
       }
       HEAP32[($5_1 + 44 | 0) >> 2] = $49(((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 16 | 0) + 10264 | 0 | 0, (HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0 | 0, HEAP32[($5_1 + 64 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + (HEAP32[($5_1 + 68 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 60 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 26680 | 0 | 0, 2048 | 0, HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28940 | 0) >> 2] | 0 | 0) | 0;
      }
     }
     label$28 : {
      if (!($3(HEAP32[($5_1 + 44 | 0) >> 2] | 0 | 0) | 0)) {
       break label$28
      }
      HEAP32[($5_1 + 92 | 0) >> 2] = -20;
      break label$3;
     }
     HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28912 | 0) >> 2] = (HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0;
     HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28928 | 0) >> 2] = HEAP32[($5_1 + 64 | 0) >> 2] | 0;
     HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28808 | 0) >> 2] = 1;
     label$29 : {
      if (!((HEAP32[($5_1 + 72 | 0) >> 2] | 0 | 0) == (2 | 0) & 1 | 0)) {
       break label$29
      }
      HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 12 | 0) >> 2] = ((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 16 | 0) + 10264 | 0;
     }
     $233 = ((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0) + (HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28928 | 0) >> 2] | 0) | 0;
     i64toi32_i32$0 = 0;
     $396 = 0;
     i64toi32_i32$1 = $233;
     HEAP8[i64toi32_i32$1 >> 0] = $396;
     HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $396 >>> 8 | 0;
     HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $396 >>> 16 | 0;
     HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $396 >>> 24 | 0;
     HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
     HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
     HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
     HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
     i64toi32_i32$1 = i64toi32_i32$1 + 24 | 0;
     HEAP8[i64toi32_i32$1 >> 0] = $396;
     HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $396 >>> 8 | 0;
     HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $396 >>> 16 | 0;
     HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $396 >>> 24 | 0;
     HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
     HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
     HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
     HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
     i64toi32_i32$1 = $233 + 16 | 0;
     HEAP8[i64toi32_i32$1 >> 0] = $396;
     HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $396 >>> 8 | 0;
     HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $396 >>> 16 | 0;
     HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $396 >>> 24 | 0;
     HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
     HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
     HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
     HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
     i64toi32_i32$1 = $233 + 8 | 0;
     HEAP8[i64toi32_i32$1 >> 0] = $396;
     HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $396 >>> 8 | 0;
     HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $396 >>> 16 | 0;
     HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $396 >>> 24 | 0;
     HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
     HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
     HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
     HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
     HEAP32[($5_1 + 92 | 0) >> 2] = (HEAP32[($5_1 + 60 | 0) >> 2] | 0) + (HEAP32[($5_1 + 68 | 0) >> 2] | 0) | 0;
     break label$3;
    case 0:
     $247 = 3;
     HEAP32[($5_1 + 20 | 0) >> 2] = ((HEAPU8[(HEAP32[($5_1 + 76 | 0) >> 2] | 0) >> 0] | 0) >>> 2 | 0) & $247 | 0;
     $249 = HEAP32[($5_1 + 20 | 0) >> 2] | 0;
     label$30 : {
      label$31 : {
       switch ($249 | 0) {
       case 0:
       case 2:
       default:
        HEAP32[($5_1 + 24 | 0) >> 2] = 1;
        HEAP32[($5_1 + 28 | 0) >> 2] = ((HEAPU8[(HEAP32[($5_1 + 76 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0) >> 3 | 0;
        break label$30;
       case 1:
        HEAP32[($5_1 + 24 | 0) >> 2] = 2;
        HEAP32[($5_1 + 28 | 0) >> 2] = (($35(HEAP32[($5_1 + 76 | 0) >> 2] | 0 | 0) | 0) & 65535 | 0) >> 4 | 0;
        break label$30;
       case 3:
        break label$31;
       };
      }
      HEAP32[($5_1 + 24 | 0) >> 2] = 3;
      HEAP32[($5_1 + 28 | 0) >> 2] = ($91(HEAP32[($5_1 + 76 | 0) >> 2] | 0 | 0) | 0) >>> 4 | 0;
     }
     label$35 : {
      if (!((((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + (HEAP32[($5_1 + 28 | 0) >> 2] | 0) | 0) + 32 | 0) >>> 0 > (HEAP32[($5_1 + 80 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$35
      }
      label$36 : {
       if (!(((HEAP32[($5_1 + 28 | 0) >> 2] | 0) + (HEAP32[($5_1 + 24 | 0) >> 2] | 0) | 0) >>> 0 > (HEAP32[($5_1 + 80 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
        break label$36
       }
       HEAP32[($5_1 + 92 | 0) >> 2] = -20;
       break label$3;
      }
      $153((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0 | 0, (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + (HEAP32[($5_1 + 24 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 28 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28912 | 0) >> 2] = (HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0;
      HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28928 | 0) >> 2] = HEAP32[($5_1 + 28 | 0) >> 2] | 0;
      $308 = ((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0) + (HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28928 | 0) >> 2] | 0) | 0;
      i64toi32_i32$0 = 0;
      $397 = 0;
      i64toi32_i32$1 = $308;
      HEAP8[i64toi32_i32$1 >> 0] = $397;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $397 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $397 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $397 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      i64toi32_i32$1 = i64toi32_i32$1 + 24 | 0;
      HEAP8[i64toi32_i32$1 >> 0] = $397;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $397 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $397 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $397 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      i64toi32_i32$1 = $308 + 16 | 0;
      HEAP8[i64toi32_i32$1 >> 0] = $397;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $397 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $397 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $397 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      i64toi32_i32$1 = $308 + 8 | 0;
      HEAP8[i64toi32_i32$1 >> 0] = $397;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $397 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $397 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $397 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      HEAP32[($5_1 + 92 | 0) >> 2] = (HEAP32[($5_1 + 24 | 0) >> 2] | 0) + (HEAP32[($5_1 + 28 | 0) >> 2] | 0) | 0;
      break label$3;
     }
     HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28912 | 0) >> 2] = (HEAP32[($5_1 + 76 | 0) >> 2] | 0) + (HEAP32[($5_1 + 24 | 0) >> 2] | 0) | 0;
     HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28928 | 0) >> 2] = HEAP32[($5_1 + 28 | 0) >> 2] | 0;
     HEAP32[($5_1 + 92 | 0) >> 2] = (HEAP32[($5_1 + 24 | 0) >> 2] | 0) + (HEAP32[($5_1 + 28 | 0) >> 2] | 0) | 0;
     break label$3;
    case 1:
     $331 = 3;
     HEAP32[($5_1 + 16 | 0) >> 2] = ((HEAPU8[(HEAP32[($5_1 + 76 | 0) >> 2] | 0) >> 0] | 0) >>> 2 | 0) & $331 | 0;
     $333 = HEAP32[($5_1 + 16 | 0) >> 2] | 0;
     label$37 : {
      label$38 : {
       switch ($333 | 0) {
       case 0:
       case 2:
       default:
        HEAP32[($5_1 + 8 | 0) >> 2] = 1;
        HEAP32[($5_1 + 12 | 0) >> 2] = ((HEAPU8[(HEAP32[($5_1 + 76 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0) >> 3 | 0;
        break label$37;
       case 1:
        HEAP32[($5_1 + 8 | 0) >> 2] = 2;
        HEAP32[($5_1 + 12 | 0) >> 2] = (($35(HEAP32[($5_1 + 76 | 0) >> 2] | 0 | 0) | 0) & 65535 | 0) >> 4 | 0;
        break label$37;
       case 3:
        break label$38;
       };
      }
      HEAP32[($5_1 + 8 | 0) >> 2] = 3;
      HEAP32[($5_1 + 12 | 0) >> 2] = ($91(HEAP32[($5_1 + 76 | 0) >> 2] | 0 | 0) | 0) >>> 4 | 0;
      label$42 : {
       if (!((HEAP32[($5_1 + 80 | 0) >> 2] | 0) >>> 0 < 4 >>> 0 & 1 | 0)) {
        break label$42
       }
       HEAP32[($5_1 + 92 | 0) >> 2] = -20;
       break label$3;
      }
     }
     label$43 : {
      if (!((HEAP32[($5_1 + 12 | 0) >> 2] | 0) >>> 0 > 131072 >>> 0 & 1 | 0)) {
       break label$43
      }
      HEAP32[($5_1 + 92 | 0) >> 2] = -20;
      break label$3;
     }
     $154((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0 | 0, (HEAPU8[((HEAP32[($5_1 + 76 | 0) >> 2] | 0) + (HEAP32[($5_1 + 8 | 0) >> 2] | 0) | 0) >> 0] | 0) & 255 | 0 | 0, (HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 32 | 0 | 0) | 0;
     HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28912 | 0) >> 2] = (HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 29040 | 0;
     HEAP32[((HEAP32[($5_1 + 88 | 0) >> 2] | 0) + 28928 | 0) >> 2] = HEAP32[($5_1 + 12 | 0) >> 2] | 0;
     HEAP32[($5_1 + 92 | 0) >> 2] = (HEAP32[($5_1 + 8 | 0) >> 2] | 0) + 1 | 0;
     break label$3;
    default:
     break label$5;
    };
   }
   HEAP32[($5_1 + 92 | 0) >> 2] = -20;
  }
  $391 = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
  label$44 : {
   $395 = $5_1 + 96 | 0;
   if ($395 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $395;
  }
  return $391 | 0;
 }
 
 function $93($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var $6_1 = 0, $20_1 = 0, $84_1 = 0, $221 = 0, $220 = 0, $83_1 = 0, $217 = 0;
  $6_1 = global$0 - 64 | 0;
  label$1 : {
   $220 = $6_1;
   if ($6_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $220;
  }
  HEAP32[($6_1 + 56 | 0) >> 2] = $0_1;
  HEAP32[($6_1 + 52 | 0) >> 2] = $1_1;
  HEAP32[($6_1 + 48 | 0) >> 2] = $2_1;
  HEAP32[($6_1 + 44 | 0) >> 2] = $3_1;
  HEAP32[($6_1 + 40 | 0) >> 2] = HEAP32[($6_1 + 48 | 0) >> 2] | 0;
  HEAP32[($6_1 + 36 | 0) >> 2] = (HEAP32[($6_1 + 40 | 0) >> 2] | 0) + (HEAP32[($6_1 + 44 | 0) >> 2] | 0) | 0;
  HEAP32[($6_1 + 32 | 0) >> 2] = HEAP32[($6_1 + 40 | 0) >> 2] | 0;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($6_1 + 44 | 0) >> 2] | 0) >>> 0 < 1 >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($6_1 + 60 | 0) >> 2] = -72;
    break label$3;
   }
   $20_1 = HEAP32[($6_1 + 32 | 0) >> 2] | 0;
   HEAP32[($6_1 + 32 | 0) >> 2] = $20_1 + 1 | 0;
   HEAP32[($6_1 + 28 | 0) >> 2] = (HEAPU8[$20_1 >> 0] | 0) & 255 | 0;
   label$5 : {
    if (HEAP32[($6_1 + 28 | 0) >> 2] | 0) {
     break label$5
    }
    HEAP32[(HEAP32[($6_1 + 52 | 0) >> 2] | 0) >> 2] = 0;
    label$6 : {
     if (!((HEAP32[($6_1 + 44 | 0) >> 2] | 0 | 0) != (1 | 0) & 1 | 0)) {
      break label$6
     }
     HEAP32[($6_1 + 60 | 0) >> 2] = -72;
     break label$3;
    }
    HEAP32[($6_1 + 60 | 0) >> 2] = 1;
    break label$3;
   }
   label$7 : {
    if (!((HEAP32[($6_1 + 28 | 0) >> 2] | 0 | 0) > (127 | 0) & 1 | 0)) {
     break label$7
    }
    label$8 : {
     label$9 : {
      if (!((HEAP32[($6_1 + 28 | 0) >> 2] | 0 | 0) == (255 | 0) & 1 | 0)) {
       break label$9
      }
      label$10 : {
       if (!(((HEAP32[($6_1 + 32 | 0) >> 2] | 0) + 2 | 0) >>> 0 > (HEAP32[($6_1 + 36 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
        break label$10
       }
       HEAP32[($6_1 + 60 | 0) >> 2] = -72;
       break label$3;
      }
      HEAP32[($6_1 + 28 | 0) >> 2] = (($35(HEAP32[($6_1 + 32 | 0) >> 2] | 0 | 0) | 0) & 65535 | 0) + 32512 | 0;
      HEAP32[($6_1 + 32 | 0) >> 2] = (HEAP32[($6_1 + 32 | 0) >> 2] | 0) + 2 | 0;
      break label$8;
     }
     label$11 : {
      if (!((HEAP32[($6_1 + 32 | 0) >> 2] | 0) >>> 0 >= (HEAP32[($6_1 + 36 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$11
      }
      HEAP32[($6_1 + 60 | 0) >> 2] = -72;
      break label$3;
     }
     $83_1 = ((HEAP32[($6_1 + 28 | 0) >> 2] | 0) - 128 | 0) << 8 | 0;
     $84_1 = HEAP32[($6_1 + 32 | 0) >> 2] | 0;
     HEAP32[($6_1 + 32 | 0) >> 2] = $84_1 + 1 | 0;
     HEAP32[($6_1 + 28 | 0) >> 2] = $83_1 + ((HEAPU8[$84_1 >> 0] | 0) & 255 | 0) | 0;
    }
   }
   HEAP32[(HEAP32[($6_1 + 52 | 0) >> 2] | 0) >> 2] = HEAP32[($6_1 + 28 | 0) >> 2] | 0;
   label$12 : {
    if (!(((HEAP32[($6_1 + 32 | 0) >> 2] | 0) + 1 | 0) >>> 0 > (HEAP32[($6_1 + 36 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$12
    }
    HEAP32[($6_1 + 60 | 0) >> 2] = -72;
    break label$3;
   }
   HEAP32[($6_1 + 24 | 0) >> 2] = ((HEAPU8[(HEAP32[($6_1 + 32 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0) >> 6 | 0;
   HEAP32[($6_1 + 20 | 0) >> 2] = (((HEAPU8[(HEAP32[($6_1 + 32 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0) >> 4 | 0) & 3 | 0;
   HEAP32[($6_1 + 16 | 0) >> 2] = (((HEAPU8[(HEAP32[($6_1 + 32 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0) >> 2 | 0) & 3 | 0;
   HEAP32[($6_1 + 32 | 0) >> 2] = (HEAP32[($6_1 + 32 | 0) >> 2] | 0) + 1 | 0;
   HEAP32[($6_1 + 12 | 0) >> 2] = $128((HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 16 | 0 | 0, HEAP32[($6_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($6_1 + 24 | 0) >> 2] | 0 | 0, 35 | 0, 9 | 0, HEAP32[($6_1 + 32 | 0) >> 2] | 0 | 0, (HEAP32[($6_1 + 36 | 0) >> 2] | 0) - (HEAP32[($6_1 + 32 | 0) >> 2] | 0) | 0 | 0, 2112 | 0, 2256 | 0, 2416 | 0, HEAP32[((HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 28812 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 28956 | 0) >> 2] | 0 | 0, HEAP32[($6_1 + 28 | 0) >> 2] | 0 | 0) | 0;
   label$13 : {
    if (!($22(HEAP32[($6_1 + 12 | 0) >> 2] | 0 | 0) | 0)) {
     break label$13
    }
    HEAP32[($6_1 + 60 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($6_1 + 32 | 0) >> 2] = (HEAP32[($6_1 + 32 | 0) >> 2] | 0) + (HEAP32[($6_1 + 12 | 0) >> 2] | 0) | 0;
   HEAP32[($6_1 + 8 | 0) >> 2] = $128(((HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 16 | 0) + 4104 | 0 | 0, (HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 8 | 0 | 0, HEAP32[($6_1 + 20 | 0) >> 2] | 0 | 0, 31 | 0, 8 | 0, HEAP32[($6_1 + 32 | 0) >> 2] | 0 | 0, (HEAP32[($6_1 + 36 | 0) >> 2] | 0) - (HEAP32[($6_1 + 32 | 0) >> 2] | 0) | 0 | 0, 1408 | 0, 1536 | 0, 2944 | 0, HEAP32[((HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 28812 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 28956 | 0) >> 2] | 0 | 0, HEAP32[($6_1 + 28 | 0) >> 2] | 0 | 0) | 0;
   label$14 : {
    if (!($22(HEAP32[($6_1 + 8 | 0) >> 2] | 0 | 0) | 0)) {
     break label$14
    }
    HEAP32[($6_1 + 60 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($6_1 + 32 | 0) >> 2] = (HEAP32[($6_1 + 32 | 0) >> 2] | 0) + (HEAP32[($6_1 + 8 | 0) >> 2] | 0) | 0;
   HEAP32[($6_1 + 4 | 0) >> 2] = $128(((HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 16 | 0) + 6160 | 0 | 0, (HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 4 | 0 | 0, HEAP32[($6_1 + 16 | 0) >> 2] | 0 | 0, 52 | 0, 9 | 0, HEAP32[($6_1 + 32 | 0) >> 2] | 0 | 0, (HEAP32[($6_1 + 36 | 0) >> 2] | 0) - (HEAP32[($6_1 + 32 | 0) >> 2] | 0) | 0 | 0, 1664 | 0, 1888 | 0, 3216 | 0, HEAP32[((HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 28812 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($6_1 + 56 | 0) >> 2] | 0) + 28956 | 0) >> 2] | 0 | 0, HEAP32[($6_1 + 28 | 0) >> 2] | 0 | 0) | 0;
   label$15 : {
    if (!($22(HEAP32[($6_1 + 4 | 0) >> 2] | 0 | 0) | 0)) {
     break label$15
    }
    HEAP32[($6_1 + 60 | 0) >> 2] = -20;
    break label$3;
   }
   HEAP32[($6_1 + 32 | 0) >> 2] = (HEAP32[($6_1 + 32 | 0) >> 2] | 0) + (HEAP32[($6_1 + 4 | 0) >> 2] | 0) | 0;
   HEAP32[($6_1 + 60 | 0) >> 2] = (HEAP32[($6_1 + 32 | 0) >> 2] | 0) - (HEAP32[($6_1 + 40 | 0) >> 2] | 0) | 0;
  }
  $217 = HEAP32[($6_1 + 60 | 0) >> 2] | 0;
  label$16 : {
   $221 = $6_1 + 64 | 0;
   if ($221 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $221;
  }
  return $217 | 0;
 }
 
 function $94($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $4_1 = 0;
  $3_1 = global$0 - 32 | 0;
  $4_1 = 0;
  HEAP32[($3_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($3_1 + 24 | 0) >> 2] = HEAP32[($3_1 + 28 | 0) >> 2] | 0;
  HEAP32[($3_1 + 20 | 0) >> 2] = HEAP32[((HEAP32[($3_1 + 24 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0;
  HEAP32[($3_1 + 16 | 0) >> 2] = (HEAP32[($3_1 + 28 | 0) >> 2] | 0) + 8 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = 1 << (HEAP32[($3_1 + 20 | 0) >> 2] | 0) | 0;
  HEAP32[($3_1 + 4 | 0) >> 2] = $4_1;
  HEAP32[($3_1 + 8 | 0) >> 2] = $4_1;
  label$1 : {
   label$2 : while (1) {
    if (!((HEAP32[($3_1 + 8 | 0) >> 2] | 0) >>> 0 < (HEAP32[($3_1 + 12 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$1
    }
    label$3 : {
     if (!(((HEAPU8[(((HEAP32[($3_1 + 16 | 0) >> 2] | 0) + ((HEAP32[($3_1 + 8 | 0) >> 2] | 0) << 3 | 0) | 0) + 2 | 0) >> 0] | 0) & 255 | 0 | 0) > (22 | 0) & 1 | 0)) {
      break label$3
     }
     HEAP32[($3_1 + 4 | 0) >> 2] = (HEAP32[($3_1 + 4 | 0) >> 2] | 0) + 1 | 0;
    }
    HEAP32[($3_1 + 8 | 0) >> 2] = (HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 1 | 0;
    continue label$2;
   };
  }
  HEAP32[($3_1 + 4 | 0) >> 2] = (HEAP32[($3_1 + 4 | 0) >> 2] | 0) << (8 - (HEAP32[($3_1 + 20 | 0) >> 2] | 0) | 0) | 0;
  return HEAP32[($3_1 + 4 | 0) >> 2] | 0 | 0;
 }
 
 function $95($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, $23_1 = 0, $22_1 = 0, $19_1 = 0;
  $10_1 = global$0 - 32 | 0;
  label$1 : {
   $22_1 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $22_1;
  }
  HEAP32[($10_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($10_1 + 16 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 12 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 8 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 4 | 0) >> 2] = $6_1;
  HEAP32[$10_1 >> 2] = $7_1;
  $19_1 = $130(HEAP32[($10_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 8 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 4 | 0) >> 2] | 0 | 0, HEAP32[$10_1 >> 2] | 0 | 0) | 0;
  label$3 : {
   $23_1 = $10_1 + 32 | 0;
   if ($23_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $23_1;
  }
  return $19_1 | 0;
 }
 
 function $96($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, $23_1 = 0, $22_1 = 0, $19_1 = 0;
  $10_1 = global$0 - 32 | 0;
  label$1 : {
   $22_1 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $22_1;
  }
  HEAP32[($10_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($10_1 + 16 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 12 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 8 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 4 | 0) >> 2] = $6_1;
  HEAP32[$10_1 >> 2] = $7_1;
  $19_1 = $131(HEAP32[($10_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 8 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 4 | 0) >> 2] | 0 | 0, HEAP32[$10_1 >> 2] | 0 | 0) | 0;
  label$3 : {
   $23_1 = $10_1 + 32 | 0;
   if ($23_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $23_1;
  }
  return $19_1 | 0;
 }
 
 function $97($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $6_1 = 0, $12_1 = 0, $11_1 = 0;
  $5_1 = global$0 - 16 | 0;
  label$1 : {
   $11_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $11_1;
  }
  HEAP32[($5_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 8 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 4 | 0) >> 2] = $2_1;
  $6_1 = HEAP32[($5_1 + 12 | 0) >> 2] | 0;
  $153($6_1 | 0, HEAP32[($5_1 + 8 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 4 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   $12_1 = $5_1 + 16 | 0;
   if ($12_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $12_1;
  }
  return $6_1 | 0;
 }
 
 function $98($0_1) {
  $0_1 = $0_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, $6_1 = 0, $3_1 = 0, $20_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  i64toi32_i32$2 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  i64toi32_i32$1 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  $20_1 = i64toi32_i32$0;
  i64toi32_i32$0 = $3_1;
  $6_1 = $20_1;
  HEAP8[i64toi32_i32$0 >> 0] = $6_1;
  HEAP8[(i64toi32_i32$0 + 1 | 0) >> 0] = $6_1 >>> 8 | 0;
  HEAP8[(i64toi32_i32$0 + 2 | 0) >> 0] = $6_1 >>> 16 | 0;
  HEAP8[(i64toi32_i32$0 + 3 | 0) >> 0] = $6_1 >>> 24 | 0;
  HEAP8[(i64toi32_i32$0 + 4 | 0) >> 0] = i64toi32_i32$1;
  HEAP8[(i64toi32_i32$0 + 5 | 0) >> 0] = i64toi32_i32$1 >>> 8 | 0;
  HEAP8[(i64toi32_i32$0 + 6 | 0) >> 0] = i64toi32_i32$1 >>> 16 | 0;
  HEAP8[(i64toi32_i32$0 + 7 | 0) >> 0] = i64toi32_i32$1 >>> 24 | 0;
  i64toi32_i32$2 = i64toi32_i32$0;
  i64toi32_i32$1 = HEAP32[i64toi32_i32$0 >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] | 0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$0;
  return i64toi32_i32$1 | 0;
 }
 
 function $99($0_1, $0$hi) {
  $0_1 = $0_1 | 0;
  $0$hi = $0$hi | 0;
  var i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$0 = 0, i64toi32_i32$3 = 0, i64toi32_i32$4 = 0, $3_1 = 0, $4$hi = 0, $5$hi = 0, $68_1 = 0, $6$hi = 0, $7$hi = 0, $8$hi = 0, $9$hi = 0, $10$hi = 0, $69_1 = 0, $11$hi = 0, $12$hi = 0, $13$hi = 0, $14$hi = 0, $15$hi = 0, $16$hi = 0, $70_1 = 0, $17$hi = 0, $18$hi = 0, $19$hi = 0, $20$hi = 0, $21$hi = 0, $22$hi = 0, $71_1 = 0, $23$hi = 0, $24$hi = 0, $25$hi = 0, $26$hi = 0, $27$hi = 0, $28$hi = 0, $72_1 = 0, $29$hi = 0, $30$hi = 0, $31$hi = 0, $32$hi = 0, $33$hi = 0, $34$hi = 0, $73_1 = 0, $35$hi = 0, $36$hi = 0, $37$hi = 0, $38$hi = 0, $39$hi = 0, $40$hi = 0, $75_1 = 0, $41$hi = 0, $42$hi = 0, $43$hi = 0, $44$hi = 0, $45$hi = 0, $46$hi = 0, $76_1 = 0, $47$hi = 0, $48$hi = 0, $49$hi = 0, $8_1 = 0, $74_1 = 0, $14_1 = 0, $85_1 = 0, $20_1 = 0, $96_1 = 0, $26_1 = 0, $107_1 = 0, $32_1 = 0, $118_1 = 0, $38_1 = 0, $129_1 = 0, $44_1 = 0, $140_1 = 0;
  $3_1 = global$0 - 16 | 0;
  i64toi32_i32$0 = $0$hi;
  i64toi32_i32$1 = $3_1;
  HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] = $0_1;
  HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$2 = i64toi32_i32$1;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] | 0;
  $4$hi = i64toi32_i32$1;
  i64toi32_i32$1 = 0;
  $5$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $4$hi;
  i64toi32_i32$1 = $5$hi;
  i64toi32_i32$1 = $4$hi;
  i64toi32_i32$2 = i64toi32_i32$0;
  i64toi32_i32$0 = $5$hi;
  i64toi32_i32$3 = 56;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$0 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
   $68_1 = 0;
  } else {
   i64toi32_i32$0 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
   $68_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
  }
  $6$hi = i64toi32_i32$0;
  i64toi32_i32$0 = -16777216;
  $7$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $6$hi;
  i64toi32_i32$0 = $7$hi;
  i64toi32_i32$0 = $6$hi;
  i64toi32_i32$1 = $68_1;
  i64toi32_i32$2 = $7$hi;
  i64toi32_i32$3 = 0;
  i64toi32_i32$2 = i64toi32_i32$0 & i64toi32_i32$2 | 0;
  $8_1 = i64toi32_i32$1 & i64toi32_i32$3 | 0;
  $8$hi = i64toi32_i32$2;
  i64toi32_i32$0 = $3_1;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] | 0;
  $9$hi = i64toi32_i32$1;
  i64toi32_i32$1 = 0;
  $10$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $9$hi;
  i64toi32_i32$1 = $10$hi;
  i64toi32_i32$1 = $9$hi;
  i64toi32_i32$0 = i64toi32_i32$2;
  i64toi32_i32$2 = $10$hi;
  i64toi32_i32$3 = 40;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
   $69_1 = 0;
  } else {
   i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$0 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
   $69_1 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
  }
  $11$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 16711680;
  $12$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $11$hi;
  i64toi32_i32$2 = $12$hi;
  i64toi32_i32$2 = $11$hi;
  i64toi32_i32$1 = $69_1;
  i64toi32_i32$0 = $12$hi;
  i64toi32_i32$3 = 0;
  i64toi32_i32$0 = i64toi32_i32$2 & i64toi32_i32$0 | 0;
  $13$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $8$hi;
  i64toi32_i32$0 = $13$hi;
  $74_1 = i64toi32_i32$1 & i64toi32_i32$3 | 0;
  i64toi32_i32$0 = $8$hi;
  i64toi32_i32$2 = $8_1;
  i64toi32_i32$1 = $13$hi;
  i64toi32_i32$3 = $74_1;
  i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1 | 0;
  $14_1 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
  $14$hi = i64toi32_i32$1;
  i64toi32_i32$0 = $3_1;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] | 0;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] | 0;
  $15$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 0;
  $16$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $15$hi;
  i64toi32_i32$2 = $16$hi;
  i64toi32_i32$2 = $15$hi;
  i64toi32_i32$0 = i64toi32_i32$1;
  i64toi32_i32$1 = $16$hi;
  i64toi32_i32$3 = 24;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$1 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
   $70_1 = 0;
  } else {
   i64toi32_i32$1 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$0 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$2 << i64toi32_i32$4 | 0) | 0;
   $70_1 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
  }
  $17$hi = i64toi32_i32$1;
  i64toi32_i32$1 = 65280;
  $18$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $17$hi;
  i64toi32_i32$1 = $18$hi;
  i64toi32_i32$1 = $17$hi;
  i64toi32_i32$2 = $70_1;
  i64toi32_i32$0 = $18$hi;
  i64toi32_i32$3 = 0;
  i64toi32_i32$0 = i64toi32_i32$1 & i64toi32_i32$0 | 0;
  $19$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $14$hi;
  i64toi32_i32$0 = $19$hi;
  $85_1 = i64toi32_i32$2 & i64toi32_i32$3 | 0;
  i64toi32_i32$0 = $14$hi;
  i64toi32_i32$1 = $14_1;
  i64toi32_i32$2 = $19$hi;
  i64toi32_i32$3 = $85_1;
  i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
  $20_1 = i64toi32_i32$1 | i64toi32_i32$3 | 0;
  $20$hi = i64toi32_i32$2;
  i64toi32_i32$0 = $3_1;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] | 0;
  $21$hi = i64toi32_i32$1;
  i64toi32_i32$1 = 0;
  $22$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $21$hi;
  i64toi32_i32$1 = $22$hi;
  i64toi32_i32$1 = $21$hi;
  i64toi32_i32$0 = i64toi32_i32$2;
  i64toi32_i32$2 = $22$hi;
  i64toi32_i32$3 = 8;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
   $71_1 = 0;
  } else {
   i64toi32_i32$2 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$0 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
   $71_1 = i64toi32_i32$0 << i64toi32_i32$4 | 0;
  }
  $23$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 255;
  $24$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $23$hi;
  i64toi32_i32$2 = $24$hi;
  i64toi32_i32$2 = $23$hi;
  i64toi32_i32$1 = $71_1;
  i64toi32_i32$0 = $24$hi;
  i64toi32_i32$3 = 0;
  i64toi32_i32$0 = i64toi32_i32$2 & i64toi32_i32$0 | 0;
  $25$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $20$hi;
  i64toi32_i32$0 = $25$hi;
  $96_1 = i64toi32_i32$1 & i64toi32_i32$3 | 0;
  i64toi32_i32$0 = $20$hi;
  i64toi32_i32$2 = $20_1;
  i64toi32_i32$1 = $25$hi;
  i64toi32_i32$3 = $96_1;
  i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1 | 0;
  $26_1 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
  $26$hi = i64toi32_i32$1;
  i64toi32_i32$0 = $3_1;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] | 0;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] | 0;
  $27$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 0;
  $28$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $27$hi;
  i64toi32_i32$2 = $28$hi;
  i64toi32_i32$2 = $27$hi;
  i64toi32_i32$0 = i64toi32_i32$1;
  i64toi32_i32$1 = $28$hi;
  i64toi32_i32$3 = 8;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$1 = 0;
   $72_1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
   $72_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
  }
  $29$hi = i64toi32_i32$1;
  i64toi32_i32$1 = 0;
  $30$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $29$hi;
  i64toi32_i32$1 = $30$hi;
  i64toi32_i32$1 = $29$hi;
  i64toi32_i32$2 = $72_1;
  i64toi32_i32$0 = $30$hi;
  i64toi32_i32$3 = -16777216;
  i64toi32_i32$0 = i64toi32_i32$1 & i64toi32_i32$0 | 0;
  $31$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $26$hi;
  i64toi32_i32$0 = $31$hi;
  $107_1 = i64toi32_i32$2 & i64toi32_i32$3 | 0;
  i64toi32_i32$0 = $26$hi;
  i64toi32_i32$1 = $26_1;
  i64toi32_i32$2 = $31$hi;
  i64toi32_i32$3 = $107_1;
  i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
  $32_1 = i64toi32_i32$1 | i64toi32_i32$3 | 0;
  $32$hi = i64toi32_i32$2;
  i64toi32_i32$0 = $3_1;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] | 0;
  $33$hi = i64toi32_i32$1;
  i64toi32_i32$1 = 0;
  $34$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $33$hi;
  i64toi32_i32$1 = $34$hi;
  i64toi32_i32$1 = $33$hi;
  i64toi32_i32$0 = i64toi32_i32$2;
  i64toi32_i32$2 = $34$hi;
  i64toi32_i32$3 = 24;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = 0;
   $73_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
   $73_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
  }
  $35$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 0;
  $36$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $35$hi;
  i64toi32_i32$2 = $36$hi;
  i64toi32_i32$2 = $35$hi;
  i64toi32_i32$1 = $73_1;
  i64toi32_i32$0 = $36$hi;
  i64toi32_i32$3 = 16711680;
  i64toi32_i32$0 = i64toi32_i32$2 & i64toi32_i32$0 | 0;
  $37$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $32$hi;
  i64toi32_i32$0 = $37$hi;
  $118_1 = i64toi32_i32$1 & i64toi32_i32$3 | 0;
  i64toi32_i32$0 = $32$hi;
  i64toi32_i32$2 = $32_1;
  i64toi32_i32$1 = $37$hi;
  i64toi32_i32$3 = $118_1;
  i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1 | 0;
  $38_1 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
  $38$hi = i64toi32_i32$1;
  i64toi32_i32$0 = $3_1;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] | 0;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] | 0;
  $39$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 0;
  $40$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $39$hi;
  i64toi32_i32$2 = $40$hi;
  i64toi32_i32$2 = $39$hi;
  i64toi32_i32$0 = i64toi32_i32$1;
  i64toi32_i32$1 = $40$hi;
  i64toi32_i32$3 = 40;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$1 = 0;
   $75_1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
   $75_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
  }
  $41$hi = i64toi32_i32$1;
  i64toi32_i32$1 = 0;
  $42$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $41$hi;
  i64toi32_i32$1 = $42$hi;
  i64toi32_i32$1 = $41$hi;
  i64toi32_i32$2 = $75_1;
  i64toi32_i32$0 = $42$hi;
  i64toi32_i32$3 = 65280;
  i64toi32_i32$0 = i64toi32_i32$1 & i64toi32_i32$0 | 0;
  $43$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $38$hi;
  i64toi32_i32$0 = $43$hi;
  $129_1 = i64toi32_i32$2 & i64toi32_i32$3 | 0;
  i64toi32_i32$0 = $38$hi;
  i64toi32_i32$1 = $38_1;
  i64toi32_i32$2 = $43$hi;
  i64toi32_i32$3 = $129_1;
  i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
  $44_1 = i64toi32_i32$1 | i64toi32_i32$3 | 0;
  $44$hi = i64toi32_i32$2;
  i64toi32_i32$0 = $3_1;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] | 0;
  $45$hi = i64toi32_i32$1;
  i64toi32_i32$1 = 0;
  $46$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $45$hi;
  i64toi32_i32$1 = $46$hi;
  i64toi32_i32$1 = $45$hi;
  i64toi32_i32$0 = i64toi32_i32$2;
  i64toi32_i32$2 = $46$hi;
  i64toi32_i32$3 = 56;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = 0;
   $76_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
   $76_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
  }
  $47$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 0;
  $48$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $47$hi;
  i64toi32_i32$2 = $48$hi;
  i64toi32_i32$2 = $47$hi;
  i64toi32_i32$1 = $76_1;
  i64toi32_i32$0 = $48$hi;
  i64toi32_i32$3 = 255;
  i64toi32_i32$0 = i64toi32_i32$2 & i64toi32_i32$0 | 0;
  $49$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $44$hi;
  i64toi32_i32$0 = $49$hi;
  $140_1 = i64toi32_i32$1 & i64toi32_i32$3 | 0;
  i64toi32_i32$0 = $44$hi;
  i64toi32_i32$2 = $44_1;
  i64toi32_i32$1 = $49$hi;
  i64toi32_i32$3 = $140_1;
  i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1 | 0;
  i64toi32_i32$2 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
  return i64toi32_i32$2 | 0;
 }
 
 function $100($0_1, $0$hi, $1_1, $1$hi) {
  $0_1 = $0_1 | 0;
  $0$hi = $0$hi | 0;
  $1_1 = $1_1 | 0;
  $1$hi = $1$hi | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, i64toi32_i32$5 = 0, i64toi32_i32$3 = 0, $4_1 = 0, $5$hi = 0, $6$hi = 0, $7$hi = 0, i64toi32_i32$4 = 0, $10$hi = 0, $11$hi = 0, $27_1 = 0, $12$hi = 0, $13$hi = 0, $14$hi = 0, $28_1 = 0, $15$hi = 0, $17$hi = 0, $18$hi = 0, $29_1 = 0, $7_1 = 0, $36$hi = 0, $12_1 = 0, $55_1 = 0, $30_1 = 0, $62_1 = 0;
  $4_1 = global$0 - 16 | 0;
  i64toi32_i32$0 = $0$hi;
  i64toi32_i32$1 = $4_1;
  HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] = $0_1;
  HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$0 = $1$hi;
  HEAP32[i64toi32_i32$1 >> 2] = $1_1;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$2 = i64toi32_i32$1;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $5$hi = i64toi32_i32$1;
  i64toi32_i32$1 = -1028477379;
  $6$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $5$hi;
  i64toi32_i32$1 = $6$hi;
  i64toi32_i32$1 = $5$hi;
  $29_1 = i64toi32_i32$0;
  i64toi32_i32$0 = $6$hi;
  i64toi32_i32$0 = __wasm_i64_mul($29_1 | 0, i64toi32_i32$1 | 0, 668265295 | 0, i64toi32_i32$0 | 0) | 0;
  i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
  $7_1 = i64toi32_i32$0;
  $7$hi = i64toi32_i32$1;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] | 0;
  $36$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $7$hi;
  i64toi32_i32$0 = $36$hi;
  i64toi32_i32$2 = i64toi32_i32$1;
  i64toi32_i32$1 = $7$hi;
  i64toi32_i32$3 = $7_1;
  i64toi32_i32$4 = i64toi32_i32$2 + i64toi32_i32$3 | 0;
  i64toi32_i32$5 = i64toi32_i32$0 + i64toi32_i32$1 | 0;
  if (i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) {
   i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
  }
  i64toi32_i32$2 = $4_1;
  HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] = i64toi32_i32$4;
  HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] = i64toi32_i32$5;
  i64toi32_i32$0 = i64toi32_i32$2;
  i64toi32_i32$5 = HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] | 0;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] | 0;
  $10$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 0;
  $11$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $10$hi;
  i64toi32_i32$2 = $11$hi;
  i64toi32_i32$2 = $10$hi;
  i64toi32_i32$0 = i64toi32_i32$5;
  i64toi32_i32$5 = $11$hi;
  i64toi32_i32$3 = 31;
  i64toi32_i32$1 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$5 = i64toi32_i32$0 << i64toi32_i32$1 | 0;
   $27_1 = 0;
  } else {
   i64toi32_i32$5 = ((1 << i64toi32_i32$1 | 0) - 1 | 0) & (i64toi32_i32$0 >>> (32 - i64toi32_i32$1 | 0) | 0) | 0 | (i64toi32_i32$2 << i64toi32_i32$1 | 0) | 0;
   $27_1 = i64toi32_i32$0 << i64toi32_i32$1 | 0;
  }
  $12_1 = $27_1;
  $12$hi = i64toi32_i32$5;
  i64toi32_i32$2 = $4_1;
  i64toi32_i32$5 = HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] | 0;
  $13$hi = i64toi32_i32$0;
  i64toi32_i32$0 = 0;
  $14$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $13$hi;
  i64toi32_i32$0 = $14$hi;
  i64toi32_i32$0 = $13$hi;
  i64toi32_i32$2 = i64toi32_i32$5;
  i64toi32_i32$5 = $14$hi;
  i64toi32_i32$3 = 33;
  i64toi32_i32$1 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$5 = 0;
   $28_1 = i64toi32_i32$0 >>> i64toi32_i32$1 | 0;
  } else {
   i64toi32_i32$5 = i64toi32_i32$0 >>> i64toi32_i32$1 | 0;
   $28_1 = (((1 << i64toi32_i32$1 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$1 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$1 | 0) | 0;
  }
  $15$hi = i64toi32_i32$5;
  i64toi32_i32$5 = $12$hi;
  i64toi32_i32$5 = $15$hi;
  i64toi32_i32$5 = $12$hi;
  i64toi32_i32$0 = $12_1;
  i64toi32_i32$2 = $15$hi;
  i64toi32_i32$3 = $28_1;
  i64toi32_i32$2 = i64toi32_i32$5 | i64toi32_i32$2 | 0;
  $55_1 = i64toi32_i32$0 | i64toi32_i32$3 | 0;
  i64toi32_i32$0 = $4_1;
  HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] = $55_1;
  HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] = i64toi32_i32$2;
  i64toi32_i32$5 = i64toi32_i32$0;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$0 + 8 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$0 + 12 | 0) >> 2] | 0;
  $17$hi = i64toi32_i32$0;
  i64toi32_i32$0 = -1640531535;
  $18$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $17$hi;
  i64toi32_i32$0 = $18$hi;
  i64toi32_i32$0 = $17$hi;
  $30_1 = i64toi32_i32$2;
  i64toi32_i32$2 = $18$hi;
  i64toi32_i32$2 = __wasm_i64_mul($30_1 | 0, i64toi32_i32$0 | 0, -2048144761 | 0, i64toi32_i32$2 | 0) | 0;
  i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
  $62_1 = i64toi32_i32$2;
  i64toi32_i32$2 = i64toi32_i32$5;
  HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] = $62_1;
  HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$5 = i64toi32_i32$2;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] | 0;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] | 0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$2;
  return i64toi32_i32$0 | 0;
 }
 
 function $101($0_1, $0$hi, $1_1, $1$hi) {
  $0_1 = $0_1 | 0;
  $0$hi = $0$hi | 0;
  $1_1 = $1_1 | 0;
  $1$hi = $1$hi | 0;
  var i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$0 = 0, i64toi32_i32$5 = 0, $4_1 = 0, i64toi32_i32$3 = 0, $9$hi = 0, $10$hi = 0, $12$hi = 0, $15$hi = 0, $16$hi = 0, $17$hi = 0, $18$hi = 0, i64toi32_i32$4 = 0, $8_1 = 0, $7_1 = 0, $37_1 = 0, $40_1 = 0, $12_1 = 0, $45$hi = 0, $49_1 = 0, $27_1 = 0, $20_1 = 0, $20$hi = 0;
  $4_1 = global$0 - 16 | 0;
  label$1 : {
   $7_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $7_1;
  }
  i64toi32_i32$0 = 0;
  $9$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $0$hi;
  i64toi32_i32$1 = $4_1;
  HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] = $0_1;
  HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$0 = $1$hi;
  HEAP32[i64toi32_i32$1 >> 2] = $1_1;
  HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$2 = i64toi32_i32$1;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$1 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] | 0;
  $10$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $9$hi;
  i64toi32_i32$1 = $10$hi;
  $37_1 = i64toi32_i32$0;
  i64toi32_i32$1 = $9$hi;
  i64toi32_i32$0 = $10$hi;
  i64toi32_i32$0 = $100(0 | 0, i64toi32_i32$1 | 0, $37_1 | 0, i64toi32_i32$0 | 0) | 0;
  i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
  $40_1 = i64toi32_i32$0;
  i64toi32_i32$0 = i64toi32_i32$2;
  HEAP32[i64toi32_i32$2 >> 2] = $40_1;
  HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] = i64toi32_i32$1;
  i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $12_1 = i64toi32_i32$1;
  $12$hi = i64toi32_i32$0;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] | 0;
  $45$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $12$hi;
  i64toi32_i32$1 = $45$hi;
  i64toi32_i32$2 = i64toi32_i32$0;
  i64toi32_i32$0 = $12$hi;
  i64toi32_i32$3 = $12_1;
  i64toi32_i32$0 = i64toi32_i32$1 ^ i64toi32_i32$0 | 0;
  $49_1 = i64toi32_i32$2 ^ i64toi32_i32$3 | 0;
  i64toi32_i32$2 = $4_1;
  HEAP32[(i64toi32_i32$2 + 8 | 0) >> 2] = $49_1;
  HEAP32[(i64toi32_i32$2 + 12 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$1 = i64toi32_i32$2;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] | 0;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] | 0;
  $15$hi = i64toi32_i32$2;
  i64toi32_i32$2 = -1640531535;
  $16$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $15$hi;
  i64toi32_i32$2 = $16$hi;
  i64toi32_i32$2 = $15$hi;
  $27_1 = i64toi32_i32$0;
  i64toi32_i32$0 = $16$hi;
  i64toi32_i32$0 = __wasm_i64_mul($27_1 | 0, i64toi32_i32$2 | 0, -2048144761 | 0, i64toi32_i32$0 | 0) | 0;
  i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
  $17$hi = i64toi32_i32$2;
  i64toi32_i32$2 = -2048144777;
  $18$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $17$hi;
  i64toi32_i32$2 = $18$hi;
  i64toi32_i32$2 = $17$hi;
  i64toi32_i32$1 = i64toi32_i32$0;
  i64toi32_i32$0 = $18$hi;
  i64toi32_i32$3 = -1028477341;
  i64toi32_i32$4 = i64toi32_i32$1 + i64toi32_i32$3 | 0;
  i64toi32_i32$5 = i64toi32_i32$2 + i64toi32_i32$0 | 0;
  if (i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) {
   i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
  }
  i64toi32_i32$1 = $4_1;
  HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] = i64toi32_i32$4;
  HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] = i64toi32_i32$5;
  i64toi32_i32$2 = i64toi32_i32$1;
  i64toi32_i32$5 = HEAP32[(i64toi32_i32$1 + 8 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 12 | 0) >> 2] | 0;
  $20_1 = i64toi32_i32$5;
  $20$hi = i64toi32_i32$1;
  label$3 : {
   $8_1 = i64toi32_i32$2 + 16 | 0;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $8_1;
  }
  i64toi32_i32$1 = $20$hi;
  i64toi32_i32$5 = $20_1;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
  return i64toi32_i32$5 | 0;
 }
 
 function $102($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $2_1 = 0, $4_1 = 0, $5_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $2_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  $4_1 = $3_1 + 8 | 0;
  $5_1 = HEAPU8[$2_1 >> 0] | 0 | ((HEAPU8[($2_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[($2_1 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[($2_1 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  HEAP8[$4_1 >> 0] = $5_1;
  HEAP8[($4_1 + 1 | 0) >> 0] = $5_1 >>> 8 | 0;
  HEAP8[($4_1 + 2 | 0) >> 0] = $5_1 >>> 16 | 0;
  HEAP8[($4_1 + 3 | 0) >> 0] = $5_1 >>> 24 | 0;
  return HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0;
 }
 
 function $103($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  return ((HEAP32[($3_1 + 12 | 0) >> 2] | 0) << 24 | 0) & -16777216 | 0 | (((HEAP32[($3_1 + 12 | 0) >> 2] | 0) << 8 | 0) & 16711680 | 0) | 0 | (((HEAP32[($3_1 + 12 | 0) >> 2] | 0) >>> 8 | 0) & 65280 | 0) | 0 | (((HEAP32[($3_1 + 12 | 0) >> 2] | 0) >>> 24 | 0) & 255 | 0) | 0 | 0;
 }
 
 function $104($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $18_1 = 0, $232 = 0, $231 = 0, $228 = 0;
  $5_1 = global$0 - 368 | 0;
  label$1 : {
   $231 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $231;
  }
  HEAP32[($5_1 + 360 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 356 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 352 | 0) >> 2] = $2_1;
  HEAP32[($5_1 + 348 | 0) >> 2] = HEAP32[($5_1 + 356 | 0) >> 2] | 0;
  HEAP32[($5_1 + 344 | 0) >> 2] = (HEAP32[($5_1 + 348 | 0) >> 2] | 0) + (HEAP32[($5_1 + 352 | 0) >> 2] | 0) | 0;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($5_1 + 352 | 0) >> 2] | 0) >>> 0 <= 8 >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   $18_1 = 10264;
   HEAP32[($5_1 + 348 | 0) >> 2] = (HEAP32[($5_1 + 348 | 0) >> 2] | 0) + 8 | 0;
   HEAP32[($5_1 + 340 | 0) >> 2] = HEAP32[($5_1 + 360 | 0) >> 2] | 0;
   HEAP32[($5_1 + 336 | 0) >> 2] = $18_1;
   HEAP32[($5_1 + 332 | 0) >> 2] = $38((HEAP32[($5_1 + 360 | 0) >> 2] | 0) + 10264 | 0 | 0, HEAP32[($5_1 + 348 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 344 | 0) >> 2] | 0) - (HEAP32[($5_1 + 348 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 340 | 0) >> 2] | 0 | 0, $18_1 | 0) | 0;
   label$5 : {
    if (!($3(HEAP32[($5_1 + 332 | 0) >> 2] | 0 | 0) | 0)) {
     break label$5
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   HEAP32[($5_1 + 348 | 0) >> 2] = (HEAP32[($5_1 + 348 | 0) >> 2] | 0) + (HEAP32[($5_1 + 332 | 0) >> 2] | 0) | 0;
   HEAP32[($5_1 + 252 | 0) >> 2] = 31;
   HEAP32[($5_1 + 244 | 0) >> 2] = $5($5_1 + 256 | 0 | 0, $5_1 + 252 | 0 | 0, $5_1 + 248 | 0 | 0, HEAP32[($5_1 + 348 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 344 | 0) >> 2] | 0) - (HEAP32[($5_1 + 348 | 0) >> 2] | 0) | 0 | 0) | 0;
   label$6 : {
    if (!($3(HEAP32[($5_1 + 244 | 0) >> 2] | 0 | 0) | 0)) {
     break label$6
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   label$7 : {
    if (!((HEAP32[($5_1 + 252 | 0) >> 2] | 0) >>> 0 > 31 >>> 0 & 1 | 0)) {
     break label$7
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   label$8 : {
    if (!((HEAP32[($5_1 + 248 | 0) >> 2] | 0) >>> 0 > 8 >>> 0 & 1 | 0)) {
     break label$8
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   $105((HEAP32[($5_1 + 360 | 0) >> 2] | 0) + 4104 | 0 | 0, $5_1 + 256 | 0 | 0, HEAP32[($5_1 + 252 | 0) >> 2] | 0 | 0, 1408 | 0, 1536 | 0, HEAP32[($5_1 + 248 | 0) >> 2] | 0 | 0);
   HEAP32[($5_1 + 348 | 0) >> 2] = (HEAP32[($5_1 + 348 | 0) >> 2] | 0) + (HEAP32[($5_1 + 244 | 0) >> 2] | 0) | 0;
   HEAP32[($5_1 + 124 | 0) >> 2] = 52;
   HEAP32[($5_1 + 116 | 0) >> 2] = $5($5_1 + 128 | 0 | 0, $5_1 + 124 | 0 | 0, $5_1 + 120 | 0 | 0, HEAP32[($5_1 + 348 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 344 | 0) >> 2] | 0) - (HEAP32[($5_1 + 348 | 0) >> 2] | 0) | 0 | 0) | 0;
   label$9 : {
    if (!($3(HEAP32[($5_1 + 116 | 0) >> 2] | 0 | 0) | 0)) {
     break label$9
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   label$10 : {
    if (!((HEAP32[($5_1 + 124 | 0) >> 2] | 0) >>> 0 > 52 >>> 0 & 1 | 0)) {
     break label$10
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   label$11 : {
    if (!((HEAP32[($5_1 + 120 | 0) >> 2] | 0) >>> 0 > 9 >>> 0 & 1 | 0)) {
     break label$11
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   $105((HEAP32[($5_1 + 360 | 0) >> 2] | 0) + 6160 | 0 | 0, $5_1 + 128 | 0 | 0, HEAP32[($5_1 + 124 | 0) >> 2] | 0 | 0, 1664 | 0, 1888 | 0, HEAP32[($5_1 + 120 | 0) >> 2] | 0 | 0);
   HEAP32[($5_1 + 348 | 0) >> 2] = (HEAP32[($5_1 + 348 | 0) >> 2] | 0) + (HEAP32[($5_1 + 116 | 0) >> 2] | 0) | 0;
   HEAP32[($5_1 + 28 | 0) >> 2] = 35;
   HEAP32[($5_1 + 20 | 0) >> 2] = $5($5_1 + 32 | 0 | 0, $5_1 + 28 | 0 | 0, $5_1 + 24 | 0 | 0, HEAP32[($5_1 + 348 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 344 | 0) >> 2] | 0) - (HEAP32[($5_1 + 348 | 0) >> 2] | 0) | 0 | 0) | 0;
   label$12 : {
    if (!($3(HEAP32[($5_1 + 20 | 0) >> 2] | 0 | 0) | 0)) {
     break label$12
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   label$13 : {
    if (!((HEAP32[($5_1 + 28 | 0) >> 2] | 0) >>> 0 > 35 >>> 0 & 1 | 0)) {
     break label$13
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   label$14 : {
    if (!((HEAP32[($5_1 + 24 | 0) >> 2] | 0) >>> 0 > 9 >>> 0 & 1 | 0)) {
     break label$14
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   $105(HEAP32[($5_1 + 360 | 0) >> 2] | 0 | 0, $5_1 + 32 | 0 | 0, HEAP32[($5_1 + 28 | 0) >> 2] | 0 | 0, 2112 | 0, 2256 | 0, HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0);
   HEAP32[($5_1 + 348 | 0) >> 2] = (HEAP32[($5_1 + 348 | 0) >> 2] | 0) + (HEAP32[($5_1 + 20 | 0) >> 2] | 0) | 0;
   label$15 : {
    if (!(((HEAP32[($5_1 + 348 | 0) >> 2] | 0) + 12 | 0) >>> 0 > (HEAP32[($5_1 + 344 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$15
    }
    HEAP32[($5_1 + 364 | 0) >> 2] = -30;
    break label$3;
   }
   HEAP32[($5_1 + 12 | 0) >> 2] = (HEAP32[($5_1 + 344 | 0) >> 2] | 0) - ((HEAP32[($5_1 + 348 | 0) >> 2] | 0) + 12 | 0) | 0;
   HEAP32[($5_1 + 16 | 0) >> 2] = 0;
   label$16 : {
    label$17 : while (1) {
     if (!((HEAP32[($5_1 + 16 | 0) >> 2] | 0 | 0) < (3 | 0) & 1 | 0)) {
      break label$16
     }
     HEAP32[($5_1 + 8 | 0) >> 2] = $6(HEAP32[($5_1 + 348 | 0) >> 2] | 0 | 0) | 0;
     HEAP32[($5_1 + 348 | 0) >> 2] = (HEAP32[($5_1 + 348 | 0) >> 2] | 0) + 4 | 0;
     label$18 : {
      label$19 : {
       if (!(HEAP32[($5_1 + 8 | 0) >> 2] | 0)) {
        break label$19
       }
       if (!((HEAP32[($5_1 + 8 | 0) >> 2] | 0) >>> 0 > (HEAP32[($5_1 + 12 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
        break label$18
       }
      }
      HEAP32[($5_1 + 364 | 0) >> 2] = -30;
      break label$3;
     }
     HEAP32[(((HEAP32[($5_1 + 360 | 0) >> 2] | 0) + 26652 | 0) + ((HEAP32[($5_1 + 16 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] = HEAP32[($5_1 + 8 | 0) >> 2] | 0;
     HEAP32[($5_1 + 16 | 0) >> 2] = (HEAP32[($5_1 + 16 | 0) >> 2] | 0) + 1 | 0;
     continue label$17;
    };
   }
   HEAP32[($5_1 + 364 | 0) >> 2] = (HEAP32[($5_1 + 348 | 0) >> 2] | 0) - (HEAP32[($5_1 + 356 | 0) >> 2] | 0) | 0;
  }
  $228 = HEAP32[($5_1 + 364 | 0) >> 2] | 0;
  label$20 : {
   $232 = $5_1 + 368 | 0;
   if ($232 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $232;
  }
  return $228 | 0;
 }
 
 function $105($0_1, $1_1, $2_1, $3_1, $4_1, $5_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  var $8_1 = 0, i64toi32_i32$0 = 0, $10_1 = 0, $41_1 = 0, $55_1 = 0, $71_1 = 0, $75_1 = 0, $100_1 = 0, i64toi32_i32$2 = 0, $132_1 = 0, $184 = 0, $188 = 0, $189 = 0, $247 = 0, $246 = 0, $53_1 = 0, $54_1 = 0, i64toi32_i32$1 = 0, $471 = 0, $196 = 0;
  $8_1 = global$0 - 208 | 0;
  label$1 : {
   $246 = $8_1;
   if ($8_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $246;
  }
  $10_1 = 1;
  HEAP32[($8_1 + 204 | 0) >> 2] = $0_1;
  HEAP32[($8_1 + 200 | 0) >> 2] = $1_1;
  HEAP32[($8_1 + 196 | 0) >> 2] = $2_1;
  HEAP32[($8_1 + 192 | 0) >> 2] = $3_1;
  HEAP32[($8_1 + 188 | 0) >> 2] = $4_1;
  HEAP32[($8_1 + 184 | 0) >> 2] = $5_1;
  HEAP32[($8_1 + 180 | 0) >> 2] = (HEAP32[($8_1 + 204 | 0) >> 2] | 0) + 8 | 0;
  HEAP32[($8_1 + 60 | 0) >> 2] = (HEAP32[($8_1 + 196 | 0) >> 2] | 0) + 1 | 0;
  HEAP32[($8_1 + 56 | 0) >> 2] = $10_1 << (HEAP32[($8_1 + 184 | 0) >> 2] | 0) | 0;
  HEAP32[($8_1 + 52 | 0) >> 2] = (HEAP32[($8_1 + 56 | 0) >> 2] | 0) - 1 | 0;
  HEAP32[($8_1 + 44 | 0) >> 2] = HEAP32[($8_1 + 184 | 0) >> 2] | 0;
  HEAP32[($8_1 + 40 | 0) >> 2] = $10_1;
  HEAP16[($8_1 + 38 | 0) >> 1] = $10_1 << ((HEAP32[($8_1 + 184 | 0) >> 2] | 0) - 1 | 0) | 0;
  HEAP32[($8_1 + 32 | 0) >> 2] = 0;
  label$3 : {
   label$4 : while (1) {
    if (!((HEAP32[($8_1 + 32 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 60 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$3
    }
    $41_1 = 16;
    label$5 : {
     label$6 : {
      if (!((((HEAPU16[((HEAP32[($8_1 + 200 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 32 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] | 0) << $41_1 | 0) >> $41_1 | 0 | 0) == (-1 | 0) & 1 | 0)) {
       break label$6
      }
      $53_1 = HEAP32[($8_1 + 32 | 0) >> 2] | 0;
      $54_1 = HEAP32[($8_1 + 180 | 0) >> 2] | 0;
      $55_1 = HEAP32[($8_1 + 52 | 0) >> 2] | 0;
      HEAP32[($8_1 + 52 | 0) >> 2] = $55_1 + -1 | 0;
      HEAP32[(($54_1 + ($55_1 << 3 | 0) | 0) + 4 | 0) >> 2] = $53_1;
      HEAP16[(($8_1 + 64 | 0) + ((HEAP32[($8_1 + 32 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] = 1;
      break label$5;
     }
     $71_1 = 16;
     $75_1 = 16;
     label$7 : {
      if (!((((HEAPU16[((HEAP32[($8_1 + 200 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 32 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] | 0) << $71_1 | 0) >> $71_1 | 0 | 0) >= (((HEAPU16[($8_1 + 38 | 0) >> 1] | 0) << $75_1 | 0) >> $75_1 | 0 | 0) & 1 | 0)) {
       break label$7
      }
      HEAP32[($8_1 + 40 | 0) >> 2] = 0;
     }
     HEAP16[(($8_1 + 64 | 0) + ((HEAP32[($8_1 + 32 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] = HEAPU16[((HEAP32[($8_1 + 200 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 32 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] | 0;
    }
    HEAP32[($8_1 + 32 | 0) >> 2] = (HEAP32[($8_1 + 32 | 0) >> 2] | 0) + 1 | 0;
    continue label$4;
   };
  }
  $100_1 = 0;
  i64toi32_i32$2 = $8_1 + 40 | 0;
  i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
  $471 = i64toi32_i32$0;
  i64toi32_i32$0 = HEAP32[($8_1 + 204 | 0) >> 2] | 0;
  HEAP32[i64toi32_i32$0 >> 2] = $471;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
  HEAP32[($8_1 + 28 | 0) >> 2] = (HEAP32[($8_1 + 56 | 0) >> 2] | 0) - 1 | 0;
  HEAP32[($8_1 + 24 | 0) >> 2] = (((HEAP32[($8_1 + 56 | 0) >> 2] | 0) >>> 1 | 0) + ((HEAP32[($8_1 + 56 | 0) >> 2] | 0) >>> 3 | 0) | 0) + 3 | 0;
  HEAP32[($8_1 + 16 | 0) >> 2] = $100_1;
  HEAP32[($8_1 + 20 | 0) >> 2] = $100_1;
  label$8 : {
   label$9 : while (1) {
    if (!((HEAP32[($8_1 + 20 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 60 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$8
    }
    HEAP32[($8_1 + 12 | 0) >> 2] = 0;
    label$10 : {
     label$11 : while (1) {
      $132_1 = 16;
      if (!((HEAP32[($8_1 + 12 | 0) >> 2] | 0 | 0) < (((HEAPU16[((HEAP32[($8_1 + 200 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 20 | 0) >> 2] | 0) << 1 | 0) | 0) >> 1] | 0) << $132_1 | 0) >> $132_1 | 0 | 0) & 1 | 0)) {
       break label$10
      }
      HEAP32[(((HEAP32[($8_1 + 180 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 16 | 0) >> 2] | 0) << 3 | 0) | 0) + 4 | 0) >> 2] = HEAP32[($8_1 + 20 | 0) >> 2] | 0;
      HEAP32[($8_1 + 16 | 0) >> 2] = ((HEAP32[($8_1 + 16 | 0) >> 2] | 0) + (HEAP32[($8_1 + 24 | 0) >> 2] | 0) | 0) & (HEAP32[($8_1 + 28 | 0) >> 2] | 0) | 0;
      label$12 : {
       label$13 : while (1) {
        if (!((HEAP32[($8_1 + 16 | 0) >> 2] | 0) >>> 0 > (HEAP32[($8_1 + 52 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
         break label$12
        }
        HEAP32[($8_1 + 16 | 0) >> 2] = ((HEAP32[($8_1 + 16 | 0) >> 2] | 0) + (HEAP32[($8_1 + 24 | 0) >> 2] | 0) | 0) & (HEAP32[($8_1 + 28 | 0) >> 2] | 0) | 0;
        continue label$13;
       };
      }
      HEAP32[($8_1 + 12 | 0) >> 2] = (HEAP32[($8_1 + 12 | 0) >> 2] | 0) + 1 | 0;
      continue label$11;
     };
    }
    HEAP32[($8_1 + 20 | 0) >> 2] = (HEAP32[($8_1 + 20 | 0) >> 2] | 0) + 1 | 0;
    continue label$9;
   };
  }
  HEAP32[($8_1 + 8 | 0) >> 2] = 0;
  label$14 : {
   label$15 : while (1) {
    if (!((HEAP32[($8_1 + 8 | 0) >> 2] | 0) >>> 0 < (HEAP32[($8_1 + 56 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$14
    }
    HEAP32[($8_1 + 4 | 0) >> 2] = HEAP32[(((HEAP32[($8_1 + 180 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 8 | 0) >> 2] | 0) << 3 | 0) | 0) + 4 | 0) >> 2] | 0;
    $184 = 1;
    $188 = ($8_1 + 64 | 0) + ((HEAP32[($8_1 + 4 | 0) >> 2] | 0) << $184 | 0) | 0;
    $189 = HEAPU16[$188 >> 1] | 0;
    HEAP16[$188 >> 1] = $189 + $184 | 0;
    HEAP32[$8_1 >> 2] = $189 & 65535 | 0;
    $196 = (HEAP32[($8_1 + 184 | 0) >> 2] | 0) - ($12(HEAP32[$8_1 >> 2] | 0 | 0) | 0) | 0;
    HEAP8[(((HEAP32[($8_1 + 180 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 8 | 0) >> 2] | 0) << 3 | 0) | 0) + 3 | 0) >> 0] = $196;
    HEAP16[((HEAP32[($8_1 + 180 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 8 | 0) >> 2] | 0) << 3 | 0) | 0) >> 1] = ((HEAP32[$8_1 >> 2] | 0) << ((HEAPU8[(((HEAP32[($8_1 + 180 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 8 | 0) >> 2] | 0) << 3 | 0) | 0) + 3 | 0) >> 0] | 0) & 255 | 0) | 0) - (HEAP32[($8_1 + 56 | 0) >> 2] | 0) | 0;
    HEAP8[(((HEAP32[($8_1 + 180 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 8 | 0) >> 2] | 0) << 3 | 0) | 0) + 2 | 0) >> 0] = HEAP32[((HEAP32[($8_1 + 188 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 4 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
    HEAP32[(((HEAP32[($8_1 + 180 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 8 | 0) >> 2] | 0) << 3 | 0) | 0) + 4 | 0) >> 2] = HEAP32[((HEAP32[($8_1 + 192 | 0) >> 2] | 0) + ((HEAP32[($8_1 + 4 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
    HEAP32[($8_1 + 8 | 0) >> 2] = (HEAP32[($8_1 + 8 | 0) >> 2] | 0) + 1 | 0;
    continue label$15;
   };
  }
  label$16 : {
   $247 = $8_1 + 208 | 0;
   if ($247 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $247;
  }
  return;
 }
 
 function $106($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $4_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, $29_1 = 0, $26_1 = 0, $56_1 = 0, $55_1 = 0, $9_1 = 0, $142_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $55_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $55_1;
  }
  $4_1 = 0;
  i64toi32_i32$0 = 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $9_1 = $61(HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 | 0) | 0;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28744 | 0) >> 2] = $9_1;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28804 | 0) >> 2] = $4_1;
  i64toi32_i32$1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  HEAP32[(i64toi32_i32$1 + 28792 | 0) >> 2] = 0;
  HEAP32[(i64toi32_i32$1 + 28796 | 0) >> 2] = i64toi32_i32$0;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28728 | 0) >> 2] = $4_1;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28732 | 0) >> 2] = $4_1;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28736 | 0) >> 2] = $4_1;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28740 | 0) >> 2] = $4_1;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 10280 | 0) >> 2] = 201326604;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28812 | 0) >> 2] = $4_1;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28808 | 0) >> 2] = $4_1;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28952 | 0) >> 2] = $4_1;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28800 | 0) >> 2] = 3;
  $26_1 = ((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 16 | 0) + 26652 | 0;
  $29_1 = 0;
  HEAP32[($26_1 + 8 | 0) >> 2] = HEAP32[($29_1 + 2408 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAP32[($29_1 + 2400 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[($29_1 + 2404 | 0) >> 2] | 0;
  $142_1 = i64toi32_i32$0;
  i64toi32_i32$0 = $26_1;
  HEAP32[i64toi32_i32$0 >> 2] = $142_1;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
  HEAP32[(HEAP32[($3_1 + 12 | 0) >> 2] | 0) >> 2] = (HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 16 | 0;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 4 | 0) >> 2] = ((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 16 | 0) + 6160 | 0;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 8 | 0) >> 2] = ((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 16 | 0) + 4104 | 0;
  HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 12 | 0) >> 2] = ((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 16 | 0) + 10264 | 0;
  label$3 : {
   $56_1 = $3_1 + 16 | 0;
   if ($56_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $56_1;
  }
  return $4_1 | 0;
 }
 
 function $107($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $44_1 = 0, $61_1 = 0, $60_1 = 0, $33_1 = 0, $57_1 = 0;
  $5_1 = global$0 - 32 | 0;
  label$1 : {
   $60_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $60_1;
  }
  HEAP32[($5_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 16 | 0) >> 2] = $2_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($5_1 + 16 | 0) >> 2] | 0) >>> 0 < 8 >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = $108(HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 16 | 0) >> 2] | 0 | 0) | 0;
    break label$3;
   }
   HEAP32[($5_1 + 12 | 0) >> 2] = $6(HEAP32[($5_1 + 20 | 0) >> 2] | 0 | 0) | 0;
   label$5 : {
    if (!((HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0) != (-332356553 | 0) & 1 | 0)) {
     break label$5
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = $108(HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 16 | 0) >> 2] | 0 | 0) | 0;
    break label$3;
   }
   $33_1 = $6((HEAP32[($5_1 + 20 | 0) >> 2] | 0) + 4 | 0 | 0) | 0;
   HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 28952 | 0) >> 2] = $33_1;
   HEAP32[($5_1 + 8 | 0) >> 2] = $104((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 16 | 0 | 0, HEAP32[($5_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 16 | 0) >> 2] | 0 | 0) | 0;
   label$6 : {
    if (!($22(HEAP32[($5_1 + 8 | 0) >> 2] | 0 | 0) | 0)) {
     break label$6
    }
    HEAP32[($5_1 + 28 | 0) >> 2] = -30;
    break label$3;
   }
   $44_1 = 1;
   HEAP32[($5_1 + 20 | 0) >> 2] = (HEAP32[($5_1 + 20 | 0) >> 2] | 0) + (HEAP32[($5_1 + 8 | 0) >> 2] | 0) | 0;
   HEAP32[($5_1 + 16 | 0) >> 2] = (HEAP32[($5_1 + 16 | 0) >> 2] | 0) - (HEAP32[($5_1 + 8 | 0) >> 2] | 0) | 0;
   HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 28812 | 0) >> 2] = $44_1;
   HEAP32[((HEAP32[($5_1 + 24 | 0) >> 2] | 0) + 28808 | 0) >> 2] = $44_1;
   HEAP32[($5_1 + 28 | 0) >> 2] = $108(HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 16 | 0) >> 2] | 0 | 0) | 0;
  }
  $57_1 = HEAP32[($5_1 + 28 | 0) >> 2] | 0;
  label$7 : {
   $61_1 = $5_1 + 32 | 0;
   if ($61_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $61_1;
  }
  return $57_1 | 0;
 }
 
 function $108($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $6_1 = 0;
  $5_1 = global$0 - 16 | 0;
  $6_1 = 0;
  HEAP32[($5_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 8 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 4 | 0) >> 2] = $2_1;
  HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 28740 | 0) >> 2] = HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 28728 | 0) >> 2] | 0;
  HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 28736 | 0) >> 2] = (HEAP32[($5_1 + 8 | 0) >> 2] | 0) + ($6_1 - ((HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 28728 | 0) >> 2] | 0) - (HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 28732 | 0) >> 2] | 0) | 0) | 0) | 0;
  HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 28732 | 0) >> 2] = HEAP32[($5_1 + 8 | 0) >> 2] | 0;
  HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 28728 | 0) >> 2] = (HEAP32[($5_1 + 8 | 0) >> 2] | 0) + (HEAP32[($5_1 + 4 | 0) >> 2] | 0) | 0;
  return $6_1 | 0;
 }
 
 function $109() {
  var $2_1 = 0, $10_1 = 0, $9_1 = 0, i64toi32_i32$0 = 0, $6_1 = 0;
  $2_1 = global$0 - 16 | 0;
  label$1 : {
   $9_1 = $2_1;
   if ($2_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $9_1;
  }
  HEAP32[($2_1 + 8 | 0) >> 2] = 0;
  i64toi32_i32$0 = 0;
  HEAP32[$2_1 >> 2] = 0;
  HEAP32[($2_1 + 4 | 0) >> 2] = i64toi32_i32$0;
  $6_1 = $110($2_1 | 0) | 0;
  label$3 : {
   $10_1 = $2_1 + 16 | 0;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $10_1;
  }
  return $6_1 | 0;
 }
 
 function $110($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $4_1 = 0, $12_1 = 0, $11_1 = 0, i64toi32_i32$1 = 0, $8_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $11_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $11_1;
  }
  $4_1 = 8;
  HEAP32[($3_1 + $4_1 | 0) >> 2] = HEAP32[($0_1 + $4_1 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[($0_1 + 4 | 0) >> 2] | 0;
  HEAP32[$3_1 >> 2] = HEAP32[$0_1 >> 2] | 0;
  HEAP32[($3_1 + 4 | 0) >> 2] = i64toi32_i32$1;
  $8_1 = $57($3_1 | 0) | 0;
  label$3 : {
   $12_1 = $3_1 + 16 | 0;
   if ($12_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $12_1;
  }
  return $8_1 | 0;
 }
 
 function $111($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $9_1 = 0, $8_1 = 0, $5_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $8_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $8_1;
  }
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $5_1 = $58(HEAP32[($3_1 + 12 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   $9_1 = $3_1 + 16 | 0;
   if ($9_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $9_1;
  }
  return $5_1 | 0;
 }
 
 function $112() {
  return 131075 | 0;
 }
 
 function $113() {
  return 131072 | 0;
 }
 
 function $114($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $19_1 = 0, $49_1 = 0, $48_1 = 0, $45_1 = 0;
  $4_1 = global$0 - 16 | 0;
  label$1 : {
   $48_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $48_1;
  }
  HEAP32[($4_1 + 8 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 4 | 0) >> 2] = $1_1;
  label$3 : {
   label$4 : {
    if ((HEAP32[($4_1 + 4 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0) {
     break label$4
    }
    if (!((HEAP32[($4_1 + 4 | 0) >> 2] | 0 | 0) == (3 | 0) & 1 | 0)) {
     break label$3
    }
   }
   $19_1 = 0;
   HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28964 | 0) >> 2] = $19_1;
   HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 29020 | 0) >> 2] = $19_1;
  }
  label$5 : {
   label$6 : {
    label$7 : {
     if ((HEAP32[($4_1 + 4 | 0) >> 2] | 0 | 0) == (2 | 0) & 1 | 0) {
      break label$7
     }
     if (!((HEAP32[($4_1 + 4 | 0) >> 2] | 0 | 0) == (3 | 0) & 1 | 0)) {
      break label$6
     }
    }
    label$8 : {
     if (!(HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28964 | 0) >> 2] | 0)) {
      break label$8
     }
     HEAP32[($4_1 + 12 | 0) >> 2] = -60;
     break label$5;
    }
    $59(HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0);
    HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28908 | 0) >> 2] = 0;
    HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28980 | 0) >> 2] = 134217729;
   }
   HEAP32[($4_1 + 12 | 0) >> 2] = 0;
  }
  $45_1 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  label$9 : {
   $49_1 = $4_1 + 16 | 0;
   if ($49_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $49_1;
  }
  return $45_1 | 0;
 }
 
 function $115($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $10_1 = 0, $9_1 = 0, $6_1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $9_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $9_1;
  }
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  $6_1 = $116(HEAP32[($3_1 + 12 | 0) >> 2] | 0 | 0, 0 | 0) | 0;
  label$3 : {
   $10_1 = $3_1 + 16 | 0;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $10_1;
  }
  return $6_1 | 0;
 }
 
 function $116($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $24_1 = 0, $23_1 = 0, $20_1 = 0;
  $4_1 = global$0 - 32 | 0;
  label$1 : {
   $23_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $23_1;
  }
  HEAP32[($4_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 20 | 0) >> 2] = $1_1;
  HEAP32[($4_1 + 16 | 0) >> 2] = $114(HEAP32[($4_1 + 24 | 0) >> 2] | 0 | 0, 1 | 0) | 0;
  label$3 : {
   label$4 : {
    if (!($3(HEAP32[($4_1 + 16 | 0) >> 2] | 0 | 0) | 0)) {
     break label$4
    }
    HEAP32[($4_1 + 28 | 0) >> 2] = HEAP32[($4_1 + 16 | 0) >> 2] | 0;
    break label$3;
   }
   HEAP32[($4_1 + 12 | 0) >> 2] = $117(HEAP32[($4_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[($4_1 + 20 | 0) >> 2] | 0 | 0) | 0;
   label$5 : {
    if (!($3(HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0) | 0)) {
     break label$5
    }
    HEAP32[($4_1 + 28 | 0) >> 2] = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
    break label$3;
   }
   HEAP32[($4_1 + 28 | 0) >> 2] = $61(HEAP32[((HEAP32[($4_1 + 24 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 | 0) | 0;
  }
  $20_1 = HEAP32[($4_1 + 28 | 0) >> 2] | 0;
  label$6 : {
   $24_1 = $4_1 + 32 | 0;
   if ($24_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $24_1;
  }
  return $20_1 | 0;
 }
 
 function $117($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $25_1 = 0, $24_1 = 0, $21_1 = 0;
  $4_1 = global$0 - 16 | 0;
  label$1 : {
   $24_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $24_1;
  }
  HEAP32[($4_1 + 8 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 4 | 0) >> 2] = $1_1;
  label$3 : {
   label$4 : {
    if (!(HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28964 | 0) >> 2] | 0)) {
     break label$4
    }
    HEAP32[($4_1 + 12 | 0) >> 2] = -60;
    break label$3;
   }
   $59(HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0);
   label$5 : {
    if (!((HEAP32[($4_1 + 4 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
     break label$5
    }
    HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28948 | 0) >> 2] = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
    HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 28960 | 0) >> 2] = -1;
   }
   HEAP32[($4_1 + 12 | 0) >> 2] = 0;
  }
  $21_1 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  label$6 : {
   $25_1 = $4_1 + 16 | 0;
   if ($25_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $25_1;
  }
  return $21_1 | 0;
 }
 
 function $118($0_1, $0$hi, $1_1, $1$hi) {
  $0_1 = $0_1 | 0;
  $0$hi = $0$hi | 0;
  $1_1 = $1_1 | 0;
  $1$hi = $1$hi | 0;
  var i64toi32_i32$4 = 0, i64toi32_i32$5 = 0, $4_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$2 = 0, i64toi32_i32$3 = 0, $23$hi = 0, $36$hi = 0, $37$hi = 0, $45$hi = 0, $46$hi = 0, $25$hi = 0, $28_1 = 0, $28$hi = 0, $31$hi = 0, $32$hi = 0, $33$hi = 0, $34$hi = 0, $41_1 = 0, $41$hi = 0, $36_1 = 0, $100_1 = 0, $132_1 = 0;
  $4_1 = global$0 - 64 | 0;
  i64toi32_i32$0 = 0;
  $23$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $0$hi;
  i64toi32_i32$1 = $4_1;
  HEAP32[(i64toi32_i32$1 + 48 | 0) >> 2] = $0_1;
  HEAP32[(i64toi32_i32$1 + 52 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$0 = $1$hi;
  HEAP32[(i64toi32_i32$1 + 40 | 0) >> 2] = $1_1;
  HEAP32[(i64toi32_i32$1 + 44 | 0) >> 2] = i64toi32_i32$0;
  i64toi32_i32$2 = i64toi32_i32$1;
  i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 48 | 0) >> 2] | 0;
  i64toi32_i32$1 = HEAP32[(i64toi32_i32$1 + 52 | 0) >> 2] | 0;
  $25$hi = i64toi32_i32$1;
  i64toi32_i32$1 = $23$hi;
  i64toi32_i32$1 = $25$hi;
  i64toi32_i32$1 = $23$hi;
  i64toi32_i32$1 = $25$hi;
  i64toi32_i32$2 = i64toi32_i32$0;
  i64toi32_i32$0 = $23$hi;
  i64toi32_i32$3 = 131072;
  label$1 : {
   label$2 : {
    if (!((i64toi32_i32$1 >>> 0 < i64toi32_i32$0 >>> 0 | ((i64toi32_i32$1 | 0) == (i64toi32_i32$0 | 0) & i64toi32_i32$2 >>> 0 < i64toi32_i32$3 >>> 0 | 0) | 0) & 1 | 0)) {
     break label$2
    }
    i64toi32_i32$3 = $4_1;
    i64toi32_i32$2 = HEAP32[($4_1 + 48 | 0) >> 2] | 0;
    i64toi32_i32$1 = HEAP32[($4_1 + 52 | 0) >> 2] | 0;
    $28_1 = i64toi32_i32$2;
    $28$hi = i64toi32_i32$1;
    break label$1;
   }
   i64toi32_i32$1 = 0;
   $28_1 = 131072;
   $28$hi = i64toi32_i32$1;
  }
  i64toi32_i32$1 = $28$hi;
  HEAP32[($4_1 + 36 | 0) >> 2] = $28_1;
  i64toi32_i32$3 = $4_1;
  i64toi32_i32$1 = HEAP32[($4_1 + 48 | 0) >> 2] | 0;
  i64toi32_i32$2 = HEAP32[($4_1 + 52 | 0) >> 2] | 0;
  $31$hi = i64toi32_i32$2;
  i64toi32_i32$2 = 0;
  $32$hi = i64toi32_i32$2;
  i64toi32_i32$2 = $31$hi;
  i64toi32_i32$2 = $32$hi;
  i64toi32_i32$2 = $31$hi;
  i64toi32_i32$3 = i64toi32_i32$1;
  i64toi32_i32$1 = $32$hi;
  i64toi32_i32$0 = HEAP32[($4_1 + 36 | 0) >> 2] | 0;
  i64toi32_i32$4 = i64toi32_i32$3 + i64toi32_i32$0 | 0;
  i64toi32_i32$5 = i64toi32_i32$2 + i64toi32_i32$1 | 0;
  if (i64toi32_i32$4 >>> 0 < i64toi32_i32$0 >>> 0) {
   i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
  }
  $33$hi = i64toi32_i32$5;
  i64toi32_i32$5 = 0;
  $34$hi = i64toi32_i32$5;
  i64toi32_i32$5 = $33$hi;
  i64toi32_i32$5 = $34$hi;
  i64toi32_i32$5 = $33$hi;
  i64toi32_i32$2 = i64toi32_i32$4;
  i64toi32_i32$3 = $34$hi;
  i64toi32_i32$0 = 64;
  i64toi32_i32$1 = i64toi32_i32$4 + i64toi32_i32$0 | 0;
  i64toi32_i32$4 = i64toi32_i32$5 + i64toi32_i32$3 | 0;
  if (i64toi32_i32$1 >>> 0 < i64toi32_i32$0 >>> 0) {
   i64toi32_i32$4 = i64toi32_i32$4 + 1 | 0
  }
  i64toi32_i32$2 = $4_1;
  HEAP32[($4_1 + 24 | 0) >> 2] = i64toi32_i32$1;
  HEAP32[($4_1 + 28 | 0) >> 2] = i64toi32_i32$4;
  i64toi32_i32$5 = $4_1;
  i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 40 | 0) >> 2] | 0;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 44 | 0) >> 2] | 0;
  $36_1 = i64toi32_i32$4;
  $36$hi = i64toi32_i32$2;
  i64toi32_i32$2 = HEAP32[(i64toi32_i32$5 + 24 | 0) >> 2] | 0;
  i64toi32_i32$4 = HEAP32[(i64toi32_i32$5 + 28 | 0) >> 2] | 0;
  $37$hi = i64toi32_i32$4;
  i64toi32_i32$4 = $36$hi;
  i64toi32_i32$4 = $37$hi;
  i64toi32_i32$4 = $36$hi;
  i64toi32_i32$4 = $37$hi;
  $100_1 = i64toi32_i32$2;
  i64toi32_i32$4 = $36$hi;
  i64toi32_i32$5 = $36_1;
  i64toi32_i32$2 = $37$hi;
  i64toi32_i32$0 = $100_1;
  label$3 : {
   label$4 : {
    if (!((i64toi32_i32$4 >>> 0 < i64toi32_i32$2 >>> 0 | ((i64toi32_i32$4 | 0) == (i64toi32_i32$2 | 0) & i64toi32_i32$5 >>> 0 < i64toi32_i32$0 >>> 0 | 0) | 0) & 1 | 0)) {
     break label$4
    }
    i64toi32_i32$0 = $4_1;
    i64toi32_i32$5 = HEAP32[($4_1 + 40 | 0) >> 2] | 0;
    i64toi32_i32$4 = HEAP32[($4_1 + 44 | 0) >> 2] | 0;
    $41_1 = i64toi32_i32$5;
    $41$hi = i64toi32_i32$4;
    break label$3;
   }
   i64toi32_i32$0 = $4_1;
   i64toi32_i32$4 = HEAP32[($4_1 + 24 | 0) >> 2] | 0;
   i64toi32_i32$5 = HEAP32[($4_1 + 28 | 0) >> 2] | 0;
   $41_1 = i64toi32_i32$4;
   $41$hi = i64toi32_i32$5;
  }
  i64toi32_i32$5 = $41$hi;
  i64toi32_i32$4 = $4_1;
  HEAP32[(i64toi32_i32$4 + 16 | 0) >> 2] = $41_1;
  HEAP32[(i64toi32_i32$4 + 20 | 0) >> 2] = i64toi32_i32$5;
  i64toi32_i32$0 = i64toi32_i32$4;
  i64toi32_i32$5 = HEAP32[(i64toi32_i32$4 + 16 | 0) >> 2] | 0;
  i64toi32_i32$4 = HEAP32[(i64toi32_i32$4 + 20 | 0) >> 2] | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = i64toi32_i32$5;
  i64toi32_i32$4 = 0;
  $45$hi = i64toi32_i32$4;
  i64toi32_i32$0 = $4_1;
  i64toi32_i32$4 = HEAP32[($4_1 + 16 | 0) >> 2] | 0;
  i64toi32_i32$5 = HEAP32[($4_1 + 20 | 0) >> 2] | 0;
  $46$hi = i64toi32_i32$5;
  i64toi32_i32$5 = $45$hi;
  i64toi32_i32$5 = $46$hi;
  i64toi32_i32$5 = $45$hi;
  i64toi32_i32$5 = $46$hi;
  $132_1 = i64toi32_i32$4;
  i64toi32_i32$5 = $45$hi;
  i64toi32_i32$0 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  i64toi32_i32$4 = $46$hi;
  i64toi32_i32$2 = $132_1;
  label$5 : {
   label$6 : {
    if (!(((i64toi32_i32$0 | 0) != (i64toi32_i32$2 | 0) | (i64toi32_i32$5 | 0) != (i64toi32_i32$4 | 0) | 0) & 1 | 0)) {
     break label$6
    }
    HEAP32[($4_1 + 60 | 0) >> 2] = -16;
    break label$5;
   }
   HEAP32[($4_1 + 60 | 0) >> 2] = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  }
  return HEAP32[($4_1 + 60 | 0) >> 2] | 0 | 0;
 }
 
 function $119($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$3 = 0, $79_1 = 0, $733$hi = 0, $737$hi = 0, $738$hi = 0, $231 = 0, $741$hi = 0, $745$hi = 0, $746$hi = 0, $749$hi = 0, $757$hi = 0, $758$hi = 0, $765$hi = 0, $766$hi = 0, $14_1 = 0, $23_1 = 0, $35_1 = 0, $44_1 = 0, $77_1 = 0, $92_1 = 0, $141_1 = 0, $163 = 0, $735$hi = 0, $743$hi = 0, $751$hi = 0, $754 = 0, $754$hi = 0, $335 = 0, $761$hi = 0, $762$hi = 0, $343 = 0, $358 = 0, $392 = 0, $393 = 0, $397 = 0, $403 = 0, $404 = 0, $441 = 0, $495 = 0, $527 = 0, $572 = 0, $603 = 0, $622 = 0, $641 = 0, $696 = 0, $704 = 0, $731 = 0, $730 = 0, $1004 = 0, $1264 = 0, $1429 = 0, $294 = 0, $761 = 0, $1617 = 0, $389 = 0, $1738 = 0, $400 = 0, $1772 = 0, $412 = 0, $2211 = 0, $2291 = 0, $719 = 0, $727 = 0;
  $5_1 = global$0 - 176 | 0;
  label$1 : {
   $730 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $730;
  }
  HEAP32[($5_1 + 168 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 164 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 160 | 0) >> 2] = $2_1;
  HEAP32[($5_1 + 156 | 0) >> 2] = HEAP32[(HEAP32[($5_1 + 160 | 0) >> 2] | 0) >> 2] | 0;
  label$3 : {
   label$4 : {
    if (!(HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0)) {
     break label$4
    }
    $14_1 = (HEAP32[($5_1 + 156 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0) | 0;
    break label$3;
   }
   $14_1 = HEAP32[($5_1 + 156 | 0) >> 2] | 0;
  }
  HEAP32[($5_1 + 152 | 0) >> 2] = $14_1;
  label$5 : {
   label$6 : {
    if (!(HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0)) {
     break label$6
    }
    $23_1 = (HEAP32[($5_1 + 156 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) | 0;
    break label$5;
   }
   $23_1 = HEAP32[($5_1 + 156 | 0) >> 2] | 0;
  }
  HEAP32[($5_1 + 148 | 0) >> 2] = $23_1;
  HEAP32[($5_1 + 144 | 0) >> 2] = HEAP32[($5_1 + 152 | 0) >> 2] | 0;
  HEAP32[($5_1 + 140 | 0) >> 2] = HEAP32[(HEAP32[($5_1 + 164 | 0) >> 2] | 0) >> 2] | 0;
  label$7 : {
   label$8 : {
    if (!(HEAP32[((HEAP32[($5_1 + 164 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0)) {
     break label$8
    }
    $35_1 = (HEAP32[($5_1 + 140 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($5_1 + 164 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0) | 0;
    break label$7;
   }
   $35_1 = HEAP32[($5_1 + 140 | 0) >> 2] | 0;
  }
  HEAP32[($5_1 + 136 | 0) >> 2] = $35_1;
  label$9 : {
   label$10 : {
    if (!(HEAP32[((HEAP32[($5_1 + 164 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0)) {
     break label$10
    }
    $44_1 = (HEAP32[($5_1 + 140 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($5_1 + 164 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) | 0;
    break label$9;
   }
   $44_1 = HEAP32[($5_1 + 140 | 0) >> 2] | 0;
  }
  HEAP32[($5_1 + 132 | 0) >> 2] = $44_1;
  HEAP32[($5_1 + 128 | 0) >> 2] = HEAP32[($5_1 + 136 | 0) >> 2] | 0;
  HEAP32[($5_1 + 124 | 0) >> 2] = 1;
  label$11 : {
   label$12 : {
    if (!((HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0) >>> 0 > (HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$12
    }
    HEAP32[($5_1 + 172 | 0) >> 2] = -72;
    break label$11;
   }
   label$13 : {
    if (!((HEAP32[((HEAP32[($5_1 + 164 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0) >>> 0 > (HEAP32[((HEAP32[($5_1 + 164 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$13
    }
    HEAP32[($5_1 + 172 | 0) >> 2] = -70;
    break label$11;
   }
   HEAP32[($5_1 + 120 | 0) >> 2] = $120(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 164 | 0) >> 2] | 0 | 0) | 0;
   label$14 : {
    if (!($3(HEAP32[($5_1 + 120 | 0) >> 2] | 0 | 0) | 0)) {
     break label$14
    }
    HEAP32[($5_1 + 172 | 0) >> 2] = HEAP32[($5_1 + 120 | 0) >> 2] | 0;
    break label$11;
   }
   label$15 : {
    label$16 : while (1) {
     if (!(HEAP32[($5_1 + 124 | 0) >> 2] | 0)) {
      break label$15
     }
     $77_1 = HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28964 | 0) >> 2] | 0;
     label$17 : {
      label$18 : {
       switch ($77_1 | 0) {
       case 0:
        $79_1 = 0;
        HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28964 | 0) >> 2] = 1;
        HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28996 | 0) >> 2] = $79_1;
        HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28992 | 0) >> 2] = $79_1;
        HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28976 | 0) >> 2] = $79_1;
        HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29e3 | 0) >> 2] = $79_1;
        HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29012 | 0) >> 2] = $79_1;
        HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29016 | 0) >> 2] = $79_1;
        i64toi32_i32$2 = HEAP32[($5_1 + 164 | 0) >> 2] | 0;
        i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        $1004 = i64toi32_i32$0;
        i64toi32_i32$0 = (HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29028 | 0;
        HEAP32[i64toi32_i32$0 >> 2] = $1004;
        HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
        $92_1 = 8;
        HEAP32[(i64toi32_i32$0 + $92_1 | 0) >> 2] = HEAP32[(i64toi32_i32$2 + $92_1 | 0) >> 2] | 0;
       case 1:
        HEAP32[($5_1 + 116 | 0) >> 2] = $62((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28752 | 0 | 0, (HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 160144 | 0 | 0, HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29e3 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 | 0) | 0;
        label$24 : {
         if (!($22(HEAP32[($5_1 + 116 | 0) >> 2] | 0 | 0) | 0)) {
          break label$24
         }
         HEAP32[($5_1 + 172 | 0) >> 2] = HEAP32[($5_1 + 116 | 0) >> 2] | 0;
         break label$11;
        }
        label$25 : {
         if (!(HEAP32[($5_1 + 116 | 0) >> 2] | 0)) {
          break label$25
         }
         HEAP32[($5_1 + 112 | 0) >> 2] = (HEAP32[($5_1 + 116 | 0) >> 2] | 0) - (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29e3 | 0) >> 2] | 0) | 0;
         HEAP32[($5_1 + 108 | 0) >> 2] = (HEAP32[($5_1 + 148 | 0) >> 2] | 0) - (HEAP32[($5_1 + 144 | 0) >> 2] | 0) | 0;
         label$26 : {
          if (!((HEAP32[($5_1 + 112 | 0) >> 2] | 0) >>> 0 > (HEAP32[($5_1 + 108 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
           break label$26
          }
          label$27 : {
           if (!((HEAP32[($5_1 + 108 | 0) >> 2] | 0) >>> 0 > 0 >>> 0 & 1 | 0)) {
            break label$27
           }
           $153(((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 160144 | 0) + (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29e3 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 144 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 108 | 0) >> 2] | 0 | 0) | 0;
           $141_1 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
           HEAP32[($141_1 + 29e3 | 0) >> 2] = (HEAP32[($141_1 + 29e3 | 0) >> 2] | 0) + (HEAP32[($5_1 + 108 | 0) >> 2] | 0) | 0;
          }
          HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 8 | 0) >> 2] = HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0;
          label$28 : {
           label$29 : {
            if (!((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 ? 2 : 6) >>> 0 > (HEAP32[($5_1 + 116 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
             break label$29
            }
            $163 = HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28908 | 0) >> 2] | 0 ? 2 : 6;
            break label$28;
           }
           $163 = HEAP32[($5_1 + 116 | 0) >> 2] | 0;
          }
          HEAP32[($5_1 + 172 | 0) >> 2] = ($163 - (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29e3 | 0) >> 2] | 0) | 0) + 3 | 0;
          break label$11;
         }
         $153(((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 160144 | 0) + (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29e3 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 144 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 112 | 0) >> 2] | 0 | 0) | 0;
         HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29e3 | 0) >> 2] = HEAP32[($5_1 + 116 | 0) >> 2] | 0;
         HEAP32[($5_1 + 144 | 0) >> 2] = (HEAP32[($5_1 + 144 | 0) >> 2] | 0) + (HEAP32[($5_1 + 112 | 0) >> 2] | 0) | 0;
         break label$17;
        }
        i64toi32_i32$1 = -1;
        $733$hi = i64toi32_i32$1;
        i64toi32_i32$2 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 28752 | 0) >> 2] | 0;
        i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 28756 | 0) >> 2] | 0;
        $735$hi = i64toi32_i32$0;
        i64toi32_i32$0 = $733$hi;
        i64toi32_i32$0 = $735$hi;
        i64toi32_i32$0 = $733$hi;
        i64toi32_i32$0 = $735$hi;
        i64toi32_i32$2 = i64toi32_i32$1;
        i64toi32_i32$1 = $733$hi;
        i64toi32_i32$3 = -1;
        label$30 : {
         if (!(((i64toi32_i32$2 | 0) != (i64toi32_i32$3 | 0) | (i64toi32_i32$0 | 0) != (i64toi32_i32$1 | 0) | 0) & 1 | 0)) {
          break label$30
         }
         if (!((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28772 | 0) >> 2] | 0 | 0) != (1 | 0) & 1 | 0)) {
          break label$30
         }
         i64toi32_i32$2 = 0;
         $737$hi = i64toi32_i32$2;
         i64toi32_i32$3 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
         i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 28752 | 0) >> 2] | 0;
         i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 28756 | 0) >> 2] | 0;
         $738$hi = i64toi32_i32$0;
         i64toi32_i32$0 = $737$hi;
         i64toi32_i32$0 = $738$hi;
         i64toi32_i32$0 = $737$hi;
         i64toi32_i32$0 = $738$hi;
         $1264 = i64toi32_i32$2;
         i64toi32_i32$0 = $737$hi;
         i64toi32_i32$3 = (HEAP32[($5_1 + 132 | 0) >> 2] | 0) - (HEAP32[($5_1 + 128 | 0) >> 2] | 0) | 0;
         i64toi32_i32$2 = $738$hi;
         i64toi32_i32$1 = $1264;
         if (!((i64toi32_i32$0 >>> 0 > i64toi32_i32$2 >>> 0 | ((i64toi32_i32$0 | 0) == (i64toi32_i32$2 | 0) & i64toi32_i32$3 >>> 0 >= i64toi32_i32$1 >>> 0 | 0) | 0) & 1 | 0)) {
          break label$30
         }
         HEAP32[($5_1 + 104 | 0) >> 2] = $69(HEAP32[($5_1 + 152 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 148 | 0) >> 2] | 0) - (HEAP32[($5_1 + 152 | 0) >> 2] | 0) | 0 | 0) | 0;
         label$31 : {
          if (!((HEAP32[($5_1 + 104 | 0) >> 2] | 0) >>> 0 <= ((HEAP32[($5_1 + 148 | 0) >> 2] | 0) - (HEAP32[($5_1 + 152 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
           break label$31
          }
          HEAP32[($5_1 + 100 | 0) >> 2] = $79(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 128 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 132 | 0) >> 2] | 0) - (HEAP32[($5_1 + 128 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 152 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 104 | 0) >> 2] | 0 | 0, $78(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0) | 0 | 0) | 0;
          label$32 : {
           if (!($22(HEAP32[($5_1 + 100 | 0) >> 2] | 0 | 0) | 0)) {
            break label$32
           }
           HEAP32[($5_1 + 172 | 0) >> 2] = HEAP32[($5_1 + 100 | 0) >> 2] | 0;
           break label$11;
          }
          $231 = 0;
          HEAP32[($5_1 + 144 | 0) >> 2] = (HEAP32[($5_1 + 152 | 0) >> 2] | 0) + (HEAP32[($5_1 + 104 | 0) >> 2] | 0) | 0;
          HEAP32[($5_1 + 128 | 0) >> 2] = (HEAP32[($5_1 + 128 | 0) >> 2] | 0) + (HEAP32[($5_1 + 100 | 0) >> 2] | 0) | 0;
          HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28744 | 0) >> 2] = $231;
          HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28964 | 0) >> 2] = $231;
          HEAP32[($5_1 + 124 | 0) >> 2] = $231;
          break label$17;
         }
        }
        label$33 : {
         if (!((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29024 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
          break label$33
         }
         if (!((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28772 | 0) >> 2] | 0 | 0) != (1 | 0) & 1 | 0)) {
          break label$33
         }
         i64toi32_i32$3 = -1;
         $741$hi = i64toi32_i32$3;
         i64toi32_i32$1 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
         i64toi32_i32$3 = HEAP32[(i64toi32_i32$1 + 28752 | 0) >> 2] | 0;
         i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 28756 | 0) >> 2] | 0;
         $743$hi = i64toi32_i32$0;
         i64toi32_i32$0 = $741$hi;
         i64toi32_i32$0 = $743$hi;
         i64toi32_i32$0 = $741$hi;
         i64toi32_i32$0 = $743$hi;
         i64toi32_i32$1 = i64toi32_i32$3;
         i64toi32_i32$3 = $741$hi;
         i64toi32_i32$2 = -1;
         if (!(((i64toi32_i32$1 | 0) != (i64toi32_i32$2 | 0) | (i64toi32_i32$0 | 0) != (i64toi32_i32$3 | 0) | 0) & 1 | 0)) {
          break label$33
         }
         i64toi32_i32$1 = 0;
         $745$hi = i64toi32_i32$1;
         i64toi32_i32$2 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
         i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 28752 | 0) >> 2] | 0;
         i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 28756 | 0) >> 2] | 0;
         $746$hi = i64toi32_i32$0;
         i64toi32_i32$0 = $745$hi;
         i64toi32_i32$0 = $746$hi;
         i64toi32_i32$0 = $745$hi;
         i64toi32_i32$0 = $746$hi;
         $1429 = i64toi32_i32$1;
         i64toi32_i32$0 = $745$hi;
         i64toi32_i32$2 = (HEAP32[($5_1 + 132 | 0) >> 2] | 0) - (HEAP32[($5_1 + 128 | 0) >> 2] | 0) | 0;
         i64toi32_i32$1 = $746$hi;
         i64toi32_i32$3 = $1429;
         if (!((i64toi32_i32$0 >>> 0 < i64toi32_i32$1 >>> 0 | ((i64toi32_i32$0 | 0) == (i64toi32_i32$1 | 0) & i64toi32_i32$2 >>> 0 < i64toi32_i32$3 >>> 0 | 0) | 0) & 1 | 0)) {
          break label$33
         }
         HEAP32[($5_1 + 172 | 0) >> 2] = -70;
         break label$11;
        }
        HEAP32[($5_1 + 96 | 0) >> 2] = $75(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0, $78(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0) | 0 | 0) | 0;
        label$34 : {
         if (!($3(HEAP32[($5_1 + 96 | 0) >> 2] | 0 | 0) | 0)) {
          break label$34
         }
         HEAP32[($5_1 + 172 | 0) >> 2] = HEAP32[($5_1 + 96 | 0) >> 2] | 0;
         break label$11;
        }
        label$35 : {
         label$36 : {
          if (!((($6((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 160144 | 0 | 0) | 0) & -16 | 0 | 0) == (407710288 | 0) & 1 | 0)) {
           break label$36
          }
          $294 = $6(((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 160144 | 0) + 4 | 0 | 0) | 0;
          HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28744 | 0) >> 2] = $294;
          HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28804 | 0) >> 2] = 7;
          break label$35;
         }
         HEAP32[($5_1 + 92 | 0) >> 2] = $84(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 160144 | 0 | 0, HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29e3 | 0) >> 2] | 0 | 0) | 0;
         label$37 : {
          if (!($3(HEAP32[($5_1 + 92 | 0) >> 2] | 0 | 0) | 0)) {
           break label$37
          }
          HEAP32[($5_1 + 172 | 0) >> 2] = HEAP32[($5_1 + 92 | 0) >> 2] | 0;
          break label$11;
         }
         HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28744 | 0) >> 2] = 3;
         HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28804 | 0) >> 2] = 2;
        }
        i64toi32_i32$2 = 0;
        $749$hi = i64toi32_i32$2;
        i64toi32_i32$3 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
        i64toi32_i32$2 = HEAP32[(i64toi32_i32$3 + 28760 | 0) >> 2] | 0;
        i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 28764 | 0) >> 2] | 0;
        $751$hi = i64toi32_i32$0;
        i64toi32_i32$0 = $749$hi;
        i64toi32_i32$0 = $751$hi;
        i64toi32_i32$0 = $749$hi;
        i64toi32_i32$0 = $751$hi;
        i64toi32_i32$3 = i64toi32_i32$2;
        i64toi32_i32$2 = $749$hi;
        i64toi32_i32$1 = 1024;
        label$38 : {
         label$39 : {
          if (!((i64toi32_i32$0 >>> 0 > i64toi32_i32$2 >>> 0 | ((i64toi32_i32$0 | 0) == (i64toi32_i32$2 | 0) & i64toi32_i32$3 >>> 0 > i64toi32_i32$1 >>> 0 | 0) | 0) & 1 | 0)) {
           break label$39
          }
          i64toi32_i32$1 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
          i64toi32_i32$3 = HEAP32[(i64toi32_i32$1 + 28760 | 0) >> 2] | 0;
          i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 28764 | 0) >> 2] | 0;
          $754 = i64toi32_i32$3;
          $754$hi = i64toi32_i32$0;
          break label$38;
         }
         i64toi32_i32$0 = 0;
         $754 = 1024;
         $754$hi = i64toi32_i32$0;
        }
        i64toi32_i32$0 = $754$hi;
        i64toi32_i32$3 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
        HEAP32[(i64toi32_i32$3 + 28760 | 0) >> 2] = $754;
        HEAP32[(i64toi32_i32$3 + 28764 | 0) >> 2] = i64toi32_i32$0;
        i64toi32_i32$1 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
        i64toi32_i32$0 = HEAP32[(i64toi32_i32$1 + 28760 | 0) >> 2] | 0;
        i64toi32_i32$3 = HEAP32[(i64toi32_i32$1 + 28764 | 0) >> 2] | 0;
        $757$hi = i64toi32_i32$3;
        i64toi32_i32$3 = 0;
        $758$hi = i64toi32_i32$3;
        i64toi32_i32$3 = $757$hi;
        i64toi32_i32$3 = $758$hi;
        i64toi32_i32$3 = $757$hi;
        i64toi32_i32$3 = $758$hi;
        i64toi32_i32$3 = $757$hi;
        i64toi32_i32$1 = i64toi32_i32$0;
        i64toi32_i32$0 = $758$hi;
        i64toi32_i32$2 = HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28980 | 0) >> 2] | 0;
        label$40 : {
         if (!((i64toi32_i32$3 >>> 0 > i64toi32_i32$0 >>> 0 | ((i64toi32_i32$3 | 0) == (i64toi32_i32$0 | 0) & i64toi32_i32$1 >>> 0 > i64toi32_i32$2 >>> 0 | 0) | 0) & 1 | 0)) {
          break label$40
         }
         HEAP32[($5_1 + 172 | 0) >> 2] = -16;
         break label$11;
        }
        label$41 : {
         label$42 : {
          if (!((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28768 | 0) >> 2] | 0) >>> 0 > 4 >>> 0 & 1 | 0)) {
           break label$42
          }
          $335 = HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28768 | 0) >> 2] | 0;
          break label$41;
         }
         $335 = 4;
        }
        HEAP32[($5_1 + 88 | 0) >> 2] = $335;
        label$43 : {
         label$44 : {
          if (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29024 | 0) >> 2] | 0) {
           break label$44
          }
          i64toi32_i32$2 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
          i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 28760 | 0) >> 2] | 0;
          i64toi32_i32$3 = HEAP32[(i64toi32_i32$2 + 28764 | 0) >> 2] | 0;
          $761 = i64toi32_i32$1;
          $761$hi = i64toi32_i32$3;
          i64toi32_i32$2 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
          i64toi32_i32$3 = HEAP32[(i64toi32_i32$2 + 28752 | 0) >> 2] | 0;
          i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 28756 | 0) >> 2] | 0;
          $762$hi = i64toi32_i32$1;
          i64toi32_i32$1 = $761$hi;
          i64toi32_i32$1 = $762$hi;
          $1617 = i64toi32_i32$3;
          i64toi32_i32$1 = $761$hi;
          i64toi32_i32$3 = $762$hi;
          $343 = $118($761 | 0, i64toi32_i32$1 | 0, $1617 | 0, i64toi32_i32$3 | 0) | 0;
          break label$43;
         }
         $343 = 0;
        }
        HEAP32[($5_1 + 84 | 0) >> 2] = $343;
        $121(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 88 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 84 | 0) >> 2] | 0 | 0);
        $358 = 1;
        label$45 : {
         if ((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28972 | 0) >> 2] | 0) >>> 0 < (HEAP32[($5_1 + 88 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
          break label$45
         }
         $358 = (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28988 | 0) >> 2] | 0) >>> 0 < (HEAP32[($5_1 + 84 | 0) >> 2] | 0) >>> 0;
        }
        HEAP32[($5_1 + 80 | 0) >> 2] = $358 & 1 | 0;
        HEAP32[($5_1 + 76 | 0) >> 2] = $122(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0) | 0;
        label$46 : {
         label$47 : {
          if (HEAP32[($5_1 + 80 | 0) >> 2] | 0) {
           break label$47
          }
          if (!(HEAP32[($5_1 + 76 | 0) >> 2] | 0)) {
           break label$46
          }
         }
         HEAP32[($5_1 + 72 | 0) >> 2] = (HEAP32[($5_1 + 88 | 0) >> 2] | 0) + (HEAP32[($5_1 + 84 | 0) >> 2] | 0) | 0;
         label$48 : {
          label$49 : {
           if (!(HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28936 | 0) >> 2] | 0)) {
            break label$49
           }
           label$50 : {
            if (!((HEAP32[($5_1 + 72 | 0) >> 2] | 0) >>> 0 > ((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28936 | 0) >> 2] | 0) - 160168 | 0) >>> 0 & 1 | 0)) {
             break label$50
            }
            HEAP32[($5_1 + 172 | 0) >> 2] = -64;
            break label$11;
           }
           break label$48;
          }
          $389 = HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28968 | 0) >> 2] | 0;
          $392 = (HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28916 | 0;
          $393 = 8;
          HEAP32[($5_1 + $393 | 0) >> 2] = HEAP32[($392 + $393 | 0) >> 2] | 0;
          i64toi32_i32$2 = $392;
          i64toi32_i32$3 = HEAP32[i64toi32_i32$2 >> 2] | 0;
          i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
          $1738 = i64toi32_i32$3;
          i64toi32_i32$3 = $5_1;
          HEAP32[$5_1 >> 2] = $1738;
          HEAP32[($5_1 + 4 | 0) >> 2] = i64toi32_i32$1;
          $25($389 | 0, $5_1 | 0);
          $397 = 0;
          HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28972 | 0) >> 2] = $397;
          HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28988 | 0) >> 2] = $397;
          $400 = HEAP32[($5_1 + 72 | 0) >> 2] | 0;
          $403 = (HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28916 | 0;
          $404 = 8;
          HEAP32[(($5_1 + 16 | 0) + $404 | 0) >> 2] = HEAP32[($403 + $404 | 0) >> 2] | 0;
          i64toi32_i32$2 = $403;
          i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
          i64toi32_i32$3 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
          $1772 = i64toi32_i32$1;
          i64toi32_i32$1 = $5_1;
          HEAP32[($5_1 + 16 | 0) >> 2] = $1772;
          HEAP32[($5_1 + 20 | 0) >> 2] = i64toi32_i32$3;
          $412 = $24($400 | 0, $5_1 + 16 | 0 | 0) | 0;
          HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28968 | 0) >> 2] = $412;
          label$51 : {
           if (!((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28968 | 0) >> 2] | 0 | 0) == (0 | 0) & 1 | 0)) {
            break label$51
           }
           HEAP32[($5_1 + 172 | 0) >> 2] = -64;
           break label$11;
          }
         }
         HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28972 | 0) >> 2] = HEAP32[($5_1 + 88 | 0) >> 2] | 0;
         HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28984 | 0) >> 2] = (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28968 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28972 | 0) >> 2] | 0) | 0;
         HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28988 | 0) >> 2] = HEAP32[($5_1 + 84 | 0) >> 2] | 0;
        }
        HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28964 | 0) >> 2] = 2;
       case 2:
        HEAP32[($5_1 + 68 | 0) >> 2] = $83(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 148 | 0) >> 2] | 0) - (HEAP32[($5_1 + 144 | 0) >> 2] | 0) | 0 | 0) | 0;
        label$52 : {
         if (HEAP32[($5_1 + 68 | 0) >> 2] | 0) {
          break label$52
         }
         $441 = 0;
         HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28964 | 0) >> 2] = $441;
         HEAP32[($5_1 + 124 | 0) >> 2] = $441;
         break label$17;
        }
        label$53 : {
         if (!(((HEAP32[($5_1 + 148 | 0) >> 2] | 0) - (HEAP32[($5_1 + 144 | 0) >> 2] | 0) | 0) >>> 0 >= (HEAP32[($5_1 + 68 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
          break label$53
         }
         HEAP32[($5_1 + 64 | 0) >> 2] = $123(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0, $5_1 + 128 | 0 | 0, HEAP32[($5_1 + 132 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 144 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 68 | 0) >> 2] | 0 | 0) | 0;
         label$54 : {
          if (!($3(HEAP32[($5_1 + 64 | 0) >> 2] | 0 | 0) | 0)) {
           break label$54
          }
          HEAP32[($5_1 + 172 | 0) >> 2] = HEAP32[($5_1 + 64 | 0) >> 2] | 0;
          break label$11;
         }
         HEAP32[($5_1 + 144 | 0) >> 2] = (HEAP32[($5_1 + 144 | 0) >> 2] | 0) + (HEAP32[($5_1 + 68 | 0) >> 2] | 0) | 0;
         break label$17;
        }
        label$55 : {
         if (!((HEAP32[($5_1 + 144 | 0) >> 2] | 0 | 0) == (HEAP32[($5_1 + 148 | 0) >> 2] | 0 | 0) & 1 | 0)) {
          break label$55
         }
         HEAP32[($5_1 + 124 | 0) >> 2] = 0;
         break label$17;
        }
        HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28964 | 0) >> 2] = 3;
       case 3:
        HEAP32[($5_1 + 60 | 0) >> 2] = $80(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0) | 0;
        HEAP32[($5_1 + 56 | 0) >> 2] = (HEAP32[($5_1 + 60 | 0) >> 2] | 0) - (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28976 | 0) >> 2] | 0) | 0;
        HEAP32[($5_1 + 52 | 0) >> 2] = $124(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0) | 0;
        label$56 : {
         label$57 : {
          if (!(HEAP32[($5_1 + 52 | 0) >> 2] | 0)) {
           break label$57
          }
          label$58 : {
           label$59 : {
            if (!((HEAP32[($5_1 + 56 | 0) >> 2] | 0) >>> 0 < ((HEAP32[($5_1 + 148 | 0) >> 2] | 0) - (HEAP32[($5_1 + 144 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
             break label$59
            }
            $495 = HEAP32[($5_1 + 56 | 0) >> 2] | 0;
            break label$58;
           }
           $495 = (HEAP32[($5_1 + 148 | 0) >> 2] | 0) - (HEAP32[($5_1 + 144 | 0) >> 2] | 0) | 0;
          }
          HEAP32[($5_1 + 48 | 0) >> 2] = $495;
          break label$56;
         }
         label$60 : {
          if (!((HEAP32[($5_1 + 56 | 0) >> 2] | 0) >>> 0 > ((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28972 | 0) >> 2] | 0) - (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28976 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
           break label$60
          }
          HEAP32[($5_1 + 172 | 0) >> 2] = -20;
          break label$11;
         }
         HEAP32[($5_1 + 48 | 0) >> 2] = $125((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28968 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28976 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 144 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 148 | 0) >> 2] | 0) - (HEAP32[($5_1 + 144 | 0) >> 2] | 0) | 0 | 0) | 0;
        }
        HEAP32[($5_1 + 144 | 0) >> 2] = (HEAP32[($5_1 + 144 | 0) >> 2] | 0) + (HEAP32[($5_1 + 48 | 0) >> 2] | 0) | 0;
        $527 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
        HEAP32[($527 + 28976 | 0) >> 2] = (HEAP32[($527 + 28976 | 0) >> 2] | 0) + (HEAP32[($5_1 + 48 | 0) >> 2] | 0) | 0;
        label$61 : {
         if (!((HEAP32[($5_1 + 48 | 0) >> 2] | 0) >>> 0 < (HEAP32[($5_1 + 56 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
          break label$61
         }
         HEAP32[($5_1 + 124 | 0) >> 2] = 0;
         break label$17;
        }
        HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28976 | 0) >> 2] = 0;
        HEAP32[($5_1 + 44 | 0) >> 2] = $123(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0, $5_1 + 128 | 0 | 0, HEAP32[($5_1 + 132 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28968 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 60 | 0) >> 2] | 0 | 0) | 0;
        label$62 : {
         if (!($3(HEAP32[($5_1 + 44 | 0) >> 2] | 0 | 0) | 0)) {
          break label$62
         }
         HEAP32[($5_1 + 172 | 0) >> 2] = HEAP32[($5_1 + 44 | 0) >> 2] | 0;
         break label$11;
        }
        break label$17;
       case 4:
        HEAP32[($5_1 + 40 | 0) >> 2] = (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28996 | 0) >> 2] | 0) - (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28992 | 0) >> 2] | 0) | 0;
        HEAP32[($5_1 + 36 | 0) >> 2] = $125(HEAP32[($5_1 + 128 | 0) >> 2] | 0 | 0, (HEAP32[($5_1 + 132 | 0) >> 2] | 0) - (HEAP32[($5_1 + 128 | 0) >> 2] | 0) | 0 | 0, (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28984 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28992 | 0) >> 2] | 0) | 0 | 0, HEAP32[($5_1 + 40 | 0) >> 2] | 0 | 0) | 0;
        HEAP32[($5_1 + 128 | 0) >> 2] = (HEAP32[($5_1 + 128 | 0) >> 2] | 0) + (HEAP32[($5_1 + 36 | 0) >> 2] | 0) | 0;
        $572 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
        HEAP32[($572 + 28992 | 0) >> 2] = (HEAP32[($572 + 28992 | 0) >> 2] | 0) + (HEAP32[($5_1 + 36 | 0) >> 2] | 0) | 0;
        label$63 : {
         if (!((HEAP32[($5_1 + 36 | 0) >> 2] | 0 | 0) == (HEAP32[($5_1 + 40 | 0) >> 2] | 0 | 0) & 1 | 0)) {
          break label$63
         }
         HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28964 | 0) >> 2] = 2;
         i64toi32_i32$3 = 0;
         $765$hi = i64toi32_i32$3;
         i64toi32_i32$2 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
         i64toi32_i32$3 = HEAP32[(i64toi32_i32$2 + 28752 | 0) >> 2] | 0;
         i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 28756 | 0) >> 2] | 0;
         $766$hi = i64toi32_i32$1;
         i64toi32_i32$1 = $765$hi;
         i64toi32_i32$1 = $766$hi;
         i64toi32_i32$1 = $765$hi;
         i64toi32_i32$1 = $766$hi;
         $2211 = i64toi32_i32$3;
         i64toi32_i32$1 = $765$hi;
         i64toi32_i32$2 = HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28988 | 0) >> 2] | 0;
         i64toi32_i32$3 = $766$hi;
         i64toi32_i32$0 = $2211;
         label$64 : {
          if (!((i64toi32_i32$1 >>> 0 < i64toi32_i32$3 >>> 0 | ((i64toi32_i32$1 | 0) == (i64toi32_i32$3 | 0) & i64toi32_i32$2 >>> 0 < i64toi32_i32$0 >>> 0 | 0) | 0) & 1 | 0)) {
           break label$64
          }
          if (!(((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28992 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28768 | 0) >> 2] | 0) | 0) >>> 0 > (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28988 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
           break label$64
          }
          $603 = 0;
          HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28996 | 0) >> 2] = $603;
          HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28992 | 0) >> 2] = $603;
         }
         break label$17;
        }
        HEAP32[($5_1 + 124 | 0) >> 2] = 0;
        break label$17;
       default:
        break label$18;
       };
      }
      HEAP32[($5_1 + 172 | 0) >> 2] = -1;
      break label$11;
     }
     continue label$16;
    };
   }
   HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 8 | 0) >> 2] = (HEAP32[($5_1 + 144 | 0) >> 2] | 0) - (HEAP32[(HEAP32[($5_1 + 160 | 0) >> 2] | 0) >> 2] | 0) | 0;
   HEAP32[((HEAP32[($5_1 + 164 | 0) >> 2] | 0) + 8 | 0) >> 2] = (HEAP32[($5_1 + 128 | 0) >> 2] | 0) - (HEAP32[(HEAP32[($5_1 + 164 | 0) >> 2] | 0) >> 2] | 0) | 0;
   i64toi32_i32$0 = HEAP32[($5_1 + 164 | 0) >> 2] | 0;
   i64toi32_i32$2 = HEAP32[i64toi32_i32$0 >> 2] | 0;
   i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] | 0;
   $2291 = i64toi32_i32$2;
   i64toi32_i32$2 = (HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29028 | 0;
   HEAP32[i64toi32_i32$2 >> 2] = $2291;
   HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] = i64toi32_i32$1;
   $622 = 8;
   HEAP32[(i64toi32_i32$2 + $622 | 0) >> 2] = HEAP32[(i64toi32_i32$0 + $622 | 0) >> 2] | 0;
   label$65 : {
    label$66 : {
     if (!((HEAP32[($5_1 + 144 | 0) >> 2] | 0 | 0) == (HEAP32[($5_1 + 152 | 0) >> 2] | 0 | 0) & 1 | 0)) {
      break label$66
     }
     if (!((HEAP32[($5_1 + 128 | 0) >> 2] | 0 | 0) == (HEAP32[($5_1 + 136 | 0) >> 2] | 0 | 0) & 1 | 0)) {
      break label$66
     }
     $641 = HEAP32[($5_1 + 168 | 0) >> 2] | 0;
     HEAP32[($641 + 29020 | 0) >> 2] = (HEAP32[($641 + 29020 | 0) >> 2] | 0) + 1 | 0;
     label$67 : {
      if (!((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29020 | 0) >> 2] | 0 | 0) >= (16 | 0) & 1 | 0)) {
       break label$67
      }
      label$68 : {
       if (!((HEAP32[($5_1 + 128 | 0) >> 2] | 0 | 0) == (HEAP32[($5_1 + 132 | 0) >> 2] | 0 | 0) & 1 | 0)) {
        break label$68
       }
       HEAP32[($5_1 + 172 | 0) >> 2] = -70;
       break label$11;
      }
      label$69 : {
       if (!((HEAP32[($5_1 + 144 | 0) >> 2] | 0 | 0) == (HEAP32[($5_1 + 148 | 0) >> 2] | 0 | 0) & 1 | 0)) {
        break label$69
       }
       HEAP32[($5_1 + 172 | 0) >> 2] = -72;
       break label$11;
      }
     }
     break label$65;
    }
    HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29020 | 0) >> 2] = 0;
   }
   HEAP32[($5_1 + 32 | 0) >> 2] = $80(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0) | 0;
   label$70 : {
    if (HEAP32[($5_1 + 32 | 0) >> 2] | 0) {
     break label$70
    }
    label$71 : {
     if (!((HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28996 | 0) >> 2] | 0 | 0) == (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28992 | 0) >> 2] | 0 | 0) & 1 | 0)) {
      break label$71
     }
     label$72 : {
      if (!(HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29016 | 0) >> 2] | 0)) {
       break label$72
      }
      label$73 : {
       if (!((HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0) >>> 0 >= (HEAP32[((HEAP32[($5_1 + 160 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
        break label$73
       }
       HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28964 | 0) >> 2] = 2;
       HEAP32[($5_1 + 172 | 0) >> 2] = 1;
       break label$11;
      }
      $696 = HEAP32[($5_1 + 160 | 0) >> 2] | 0;
      HEAP32[($696 + 8 | 0) >> 2] = (HEAP32[($696 + 8 | 0) >> 2] | 0) + 1 | 0;
     }
     HEAP32[($5_1 + 172 | 0) >> 2] = 0;
     break label$11;
    }
    label$74 : {
     if (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29016 | 0) >> 2] | 0) {
      break label$74
     }
     $704 = HEAP32[($5_1 + 160 | 0) >> 2] | 0;
     HEAP32[($704 + 8 | 0) >> 2] = (HEAP32[($704 + 8 | 0) >> 2] | 0) + -1 | 0;
     HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 29016 | 0) >> 2] = 1;
    }
    HEAP32[($5_1 + 172 | 0) >> 2] = 1;
    break label$11;
   }
   $719 = Math_imul(($81(HEAP32[($5_1 + 168 | 0) >> 2] | 0 | 0) | 0 | 0) == (2 | 0) & 1 | 0, 3);
   HEAP32[($5_1 + 32 | 0) >> 2] = (HEAP32[($5_1 + 32 | 0) >> 2] | 0) + $719 | 0;
   HEAP32[($5_1 + 32 | 0) >> 2] = (HEAP32[($5_1 + 32 | 0) >> 2] | 0) - (HEAP32[((HEAP32[($5_1 + 168 | 0) >> 2] | 0) + 28976 | 0) >> 2] | 0) | 0;
   HEAP32[($5_1 + 172 | 0) >> 2] = HEAP32[($5_1 + 32 | 0) >> 2] | 0;
  }
  $727 = HEAP32[($5_1 + 172 | 0) >> 2] | 0;
  label$75 : {
   $731 = $5_1 + 176 | 0;
   if ($731 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $731;
  }
  return $727 | 0;
 }
 
 function $120($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, i64toi32_i32$0 = 0, $11_1 = 0, $12_1 = 0, i64toi32_i32$1 = 0, $75_1 = 0;
  $4_1 = global$0 - 32 | 0;
  HEAP32[($4_1 + 24 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 20 | 0) >> 2] = $1_1;
  $11_1 = (HEAP32[($4_1 + 24 | 0) >> 2] | 0) + 29028 | 0;
  i64toi32_i32$0 = HEAP32[$11_1 >> 2] | 0;
  i64toi32_i32$1 = HEAP32[($11_1 + 4 | 0) >> 2] | 0;
  $75_1 = i64toi32_i32$0;
  i64toi32_i32$0 = $4_1 + 8 | 0;
  HEAP32[i64toi32_i32$0 >> 2] = $75_1;
  HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
  $12_1 = 8;
  HEAP32[(i64toi32_i32$0 + $12_1 | 0) >> 2] = HEAP32[($11_1 + $12_1 | 0) >> 2] | 0;
  label$1 : {
   label$2 : {
    if (!((HEAP32[((HEAP32[($4_1 + 24 | 0) >> 2] | 0) + 29024 | 0) >> 2] | 0 | 0) != (1 | 0) & 1 | 0)) {
     break label$2
    }
    HEAP32[($4_1 + 28 | 0) >> 2] = 0;
    break label$1;
   }
   label$3 : {
    if (HEAP32[((HEAP32[($4_1 + 24 | 0) >> 2] | 0) + 28964 | 0) >> 2] | 0) {
     break label$3
    }
    HEAP32[($4_1 + 28 | 0) >> 2] = 0;
    break label$1;
   }
   label$4 : {
    if (!((HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0) == (HEAP32[(HEAP32[($4_1 + 20 | 0) >> 2] | 0) >> 2] | 0 | 0) & 1 | 0)) {
     break label$4
    }
    if (!((HEAP32[($4_1 + 16 | 0) >> 2] | 0 | 0) == (HEAP32[((HEAP32[($4_1 + 20 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0 | 0) & 1 | 0)) {
     break label$4
    }
    if (!((HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0) == (HEAP32[((HEAP32[($4_1 + 20 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0 | 0) & 1 | 0)) {
     break label$4
    }
    HEAP32[($4_1 + 28 | 0) >> 2] = 0;
    break label$1;
   }
   HEAP32[($4_1 + 28 | 0) >> 2] = -104;
  }
  return HEAP32[($4_1 + 28 | 0) >> 2] | 0 | 0;
 }
 
 function $121($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $10_1 = 0, $19_1 = 0, $18_1 = 0;
  $5_1 = global$0 - 16 | 0;
  label$1 : {
   $18_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $18_1;
  }
  HEAP32[($5_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 8 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 4 | 0) >> 2] = $2_1;
  label$3 : {
   label$4 : {
    if (!($126(HEAP32[($5_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 8 | 0) >> 2] | 0 | 0, HEAP32[($5_1 + 4 | 0) >> 2] | 0 | 0) | 0)) {
     break label$4
    }
    $10_1 = HEAP32[($5_1 + 12 | 0) >> 2] | 0;
    HEAP32[($10_1 + 160164 | 0) >> 2] = (HEAP32[($10_1 + 160164 | 0) >> 2] | 0) + 1 | 0;
    break label$3;
   }
   HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 160164 | 0) >> 2] = 0;
  }
  label$5 : {
   $19_1 = $5_1 + 16 | 0;
   if ($19_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $19_1;
  }
  return;
 }
 
 function $122($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  return (HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 160164 | 0) >> 2] | 0) >>> 0 >= 128 >>> 0 & 1 | 0 | 0;
 }
 
 function $123($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $7_1 = 0, $14_1 = 0, $48_1 = 0, $67_1 = 0, $76_1 = 0, $75_1 = 0, $72_1 = 0;
  $7_1 = global$0 - 64 | 0;
  label$1 : {
   $75_1 = $7_1;
   if ($7_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $75_1;
  }
  HEAP32[($7_1 + 56 | 0) >> 2] = $0_1;
  HEAP32[($7_1 + 52 | 0) >> 2] = $1_1;
  HEAP32[($7_1 + 48 | 0) >> 2] = $2_1;
  HEAP32[($7_1 + 44 | 0) >> 2] = $3_1;
  HEAP32[($7_1 + 40 | 0) >> 2] = $4_1;
  HEAP32[($7_1 + 36 | 0) >> 2] = $124(HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   label$4 : {
    label$5 : {
     if (HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 29024 | 0) >> 2] | 0) {
      break label$5
     }
     label$6 : {
      label$7 : {
       if (!(HEAP32[($7_1 + 36 | 0) >> 2] | 0)) {
        break label$7
       }
       $14_1 = 0;
       break label$6;
      }
      $14_1 = (HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28988 | 0) >> 2] | 0) - (HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28992 | 0) >> 2] | 0) | 0;
     }
     HEAP32[($7_1 + 32 | 0) >> 2] = $14_1;
     HEAP32[($7_1 + 28 | 0) >> 2] = $82(HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0, (HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28984 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28992 | 0) >> 2] | 0) | 0 | 0, HEAP32[($7_1 + 32 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) | 0;
     HEAP32[($7_1 + 24 | 0) >> 2] = HEAP32[($7_1 + 28 | 0) >> 2] | 0;
     label$8 : {
      if (!($3(HEAP32[($7_1 + 24 | 0) >> 2] | 0 | 0) | 0)) {
       break label$8
      }
      HEAP32[($7_1 + 60 | 0) >> 2] = HEAP32[($7_1 + 24 | 0) >> 2] | 0;
      break label$3;
     }
     label$9 : {
      label$10 : {
       if (HEAP32[($7_1 + 28 | 0) >> 2] | 0) {
        break label$10
       }
       if (HEAP32[($7_1 + 36 | 0) >> 2] | 0) {
        break label$10
       }
       HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28964 | 0) >> 2] = 2;
       break label$9;
      }
      HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28996 | 0) >> 2] = (HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28992 | 0) >> 2] | 0) + (HEAP32[($7_1 + 28 | 0) >> 2] | 0) | 0;
      HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28964 | 0) >> 2] = 4;
     }
     break label$4;
    }
    label$11 : {
     label$12 : {
      if (!(HEAP32[($7_1 + 36 | 0) >> 2] | 0)) {
       break label$12
      }
      $48_1 = 0;
      break label$11;
     }
     $48_1 = (HEAP32[($7_1 + 48 | 0) >> 2] | 0) - (HEAP32[(HEAP32[($7_1 + 52 | 0) >> 2] | 0) >> 2] | 0) | 0;
    }
    HEAP32[($7_1 + 20 | 0) >> 2] = $48_1;
    HEAP32[($7_1 + 16 | 0) >> 2] = $82(HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[(HEAP32[($7_1 + 52 | 0) >> 2] | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 44 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 40 | 0) >> 2] | 0 | 0) | 0;
    HEAP32[($7_1 + 12 | 0) >> 2] = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
    label$13 : {
     if (!($3(HEAP32[($7_1 + 12 | 0) >> 2] | 0 | 0) | 0)) {
      break label$13
     }
     HEAP32[($7_1 + 60 | 0) >> 2] = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
     break label$3;
    }
    $67_1 = HEAP32[($7_1 + 52 | 0) >> 2] | 0;
    HEAP32[$67_1 >> 2] = (HEAP32[$67_1 >> 2] | 0) + (HEAP32[($7_1 + 16 | 0) >> 2] | 0) | 0;
    HEAP32[((HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 28964 | 0) >> 2] = 2;
   }
   HEAP32[($7_1 + 60 | 0) >> 2] = 0;
  }
  $72_1 = HEAP32[($7_1 + 60 | 0) >> 2] | 0;
  label$14 : {
   $76_1 = $7_1 + 64 | 0;
   if ($76_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $76_1;
  }
  return $72_1 | 0;
 }
 
 function $124($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0;
  $3_1 = global$0 - 16 | 0;
  HEAP32[($3_1 + 12 | 0) >> 2] = $0_1;
  return (HEAP32[((HEAP32[($3_1 + 12 | 0) >> 2] | 0) + 28804 | 0) >> 2] | 0 | 0) == (7 | 0) & 1 | 0 | 0;
 }
 
 function $125($0_1, $1_1, $2_1, $3_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  var $6_1 = 0, $15_1 = 0, $32_1 = 0, $31_1 = 0, $28_1 = 0;
  $6_1 = global$0 - 32 | 0;
  label$1 : {
   $31_1 = $6_1;
   if ($6_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $31_1;
  }
  HEAP32[($6_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($6_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($6_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($6_1 + 16 | 0) >> 2] = $3_1;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($6_1 + 24 | 0) >> 2] | 0) >>> 0 < (HEAP32[($6_1 + 16 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$4
    }
    $15_1 = HEAP32[($6_1 + 24 | 0) >> 2] | 0;
    break label$3;
   }
   $15_1 = HEAP32[($6_1 + 16 | 0) >> 2] | 0;
  }
  HEAP32[($6_1 + 12 | 0) >> 2] = $15_1;
  label$5 : {
   if (!((HEAP32[($6_1 + 12 | 0) >> 2] | 0) >>> 0 > 0 >>> 0 & 1 | 0)) {
    break label$5
   }
   $153(HEAP32[($6_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($6_1 + 20 | 0) >> 2] | 0 | 0, HEAP32[($6_1 + 12 | 0) >> 2] | 0 | 0) | 0;
  }
  $28_1 = HEAP32[($6_1 + 12 | 0) >> 2] | 0;
  label$6 : {
   $32_1 = $6_1 + 32 | 0;
   if ($32_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $32_1;
  }
  return $28_1 | 0;
 }
 
 function $126($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0;
  $5_1 = global$0 - 16 | 0;
  HEAP32[($5_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 8 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 4 | 0) >> 2] = $2_1;
  return ((HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 28972 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 28988 | 0) >> 2] | 0) | 0) >>> 0 >= Math_imul((HEAP32[($5_1 + 8 | 0) >> 2] | 0) + (HEAP32[($5_1 + 4 | 0) >> 2] | 0) | 0, 3) >>> 0 & 1 | 0 | 0;
 }
 
 function $127($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  var $9_1 = 0, $34_1 = 0, $33_1 = 0, $30_1 = 0;
  $9_1 = global$0 - 64 | 0;
  label$1 : {
   $33_1 = $9_1;
   if ($9_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $33_1;
  }
  HEAP32[($9_1 + 60 | 0) >> 2] = $0_1;
  HEAP32[($9_1 + 56 | 0) >> 2] = $1_1;
  HEAP32[($9_1 + 52 | 0) >> 2] = $2_1;
  HEAP32[($9_1 + 48 | 0) >> 2] = $3_1;
  HEAP32[($9_1 + 44 | 0) >> 2] = $4_1;
  HEAP32[($9_1 + 40 | 0) >> 2] = $5_1;
  HEAP32[($9_1 + 36 | 0) >> 2] = $6_1;
  HEAP32[($9_1 + 24 | 0) >> 2] = HEAP32[($9_1 + 56 | 0) >> 2] | 0;
  HEAP32[($9_1 + 28 | 0) >> 2] = HEAP32[($9_1 + 52 | 0) >> 2] | 0;
  HEAP32[($9_1 + 32 | 0) >> 2] = HEAP32[(HEAP32[($9_1 + 48 | 0) >> 2] | 0) >> 2] | 0;
  HEAP32[($9_1 + 8 | 0) >> 2] = HEAP32[($9_1 + 44 | 0) >> 2] | 0;
  HEAP32[($9_1 + 12 | 0) >> 2] = HEAP32[($9_1 + 40 | 0) >> 2] | 0;
  HEAP32[($9_1 + 16 | 0) >> 2] = HEAP32[(HEAP32[($9_1 + 36 | 0) >> 2] | 0) >> 2] | 0;
  HEAP32[($9_1 + 4 | 0) >> 2] = $119(HEAP32[($9_1 + 60 | 0) >> 2] | 0 | 0, $9_1 + 24 | 0 | 0, $9_1 + 8 | 0 | 0) | 0;
  HEAP32[(HEAP32[($9_1 + 48 | 0) >> 2] | 0) >> 2] = HEAP32[($9_1 + 32 | 0) >> 2] | 0;
  HEAP32[(HEAP32[($9_1 + 36 | 0) >> 2] | 0) >> 2] = HEAP32[($9_1 + 16 | 0) >> 2] | 0;
  $30_1 = HEAP32[($9_1 + 4 | 0) >> 2] | 0;
  label$3 : {
   $34_1 = $9_1 + 64 | 0;
   if ($34_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $34_1;
  }
  return $30_1 | 0;
 }
 
 function $128($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1, $8_1, $9_1, $10_1, $11_1, $12_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  $8_1 = $8_1 | 0;
  $9_1 = $9_1 | 0;
  $10_1 = $10_1 | 0;
  $11_1 = $11_1 | 0;
  $12_1 = $12_1 | 0;
  var $15_1 = 0, $16_1 = 0, $130_1 = 0, $129_1 = 0, $126_1 = 0;
  $15_1 = global$0 - 224 | 0;
  label$1 : {
   $129_1 = $15_1;
   if ($15_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $129_1;
  }
  HEAP32[($15_1 + 216 | 0) >> 2] = $0_1;
  HEAP32[($15_1 + 212 | 0) >> 2] = $1_1;
  HEAP32[($15_1 + 208 | 0) >> 2] = $2_1;
  HEAP32[($15_1 + 204 | 0) >> 2] = $3_1;
  HEAP32[($15_1 + 200 | 0) >> 2] = $4_1;
  HEAP32[($15_1 + 196 | 0) >> 2] = $5_1;
  HEAP32[($15_1 + 192 | 0) >> 2] = $6_1;
  HEAP32[($15_1 + 188 | 0) >> 2] = $7_1;
  HEAP32[($15_1 + 184 | 0) >> 2] = $8_1;
  HEAP32[($15_1 + 180 | 0) >> 2] = $9_1;
  HEAP32[($15_1 + 176 | 0) >> 2] = $10_1;
  HEAP32[($15_1 + 172 | 0) >> 2] = $11_1;
  HEAP32[($15_1 + 168 | 0) >> 2] = $12_1;
  $16_1 = HEAP32[($15_1 + 208 | 0) >> 2] | 0;
  label$3 : {
   label$4 : {
    switch ($16_1 | 0) {
    case 1:
     label$9 : {
      if (HEAP32[($15_1 + 192 | 0) >> 2] | 0) {
       break label$9
      }
      HEAP32[($15_1 + 220 | 0) >> 2] = -72;
      break label$3;
     }
     label$10 : {
      if (!(((HEAPU8[(HEAP32[($15_1 + 196 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0) >>> 0 > (HEAP32[($15_1 + 204 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$10
      }
      HEAP32[($15_1 + 220 | 0) >> 2] = -20;
      break label$3;
     }
     HEAP32[($15_1 + 164 | 0) >> 2] = (HEAPU8[(HEAP32[($15_1 + 196 | 0) >> 2] | 0) >> 0] | 0) & 255 | 0;
     HEAP32[($15_1 + 160 | 0) >> 2] = HEAP32[((HEAP32[($15_1 + 188 | 0) >> 2] | 0) + ((HEAP32[($15_1 + 164 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
     HEAP32[($15_1 + 156 | 0) >> 2] = HEAP32[((HEAP32[($15_1 + 184 | 0) >> 2] | 0) + ((HEAP32[($15_1 + 164 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
     $129(HEAP32[($15_1 + 216 | 0) >> 2] | 0 | 0, HEAP32[($15_1 + 160 | 0) >> 2] | 0 | 0, HEAP32[($15_1 + 156 | 0) >> 2] | 0 | 0);
     HEAP32[(HEAP32[($15_1 + 212 | 0) >> 2] | 0) >> 2] = HEAP32[($15_1 + 216 | 0) >> 2] | 0;
     HEAP32[($15_1 + 220 | 0) >> 2] = 1;
     break label$3;
    case 0:
     HEAP32[(HEAP32[($15_1 + 212 | 0) >> 2] | 0) >> 2] = HEAP32[($15_1 + 180 | 0) >> 2] | 0;
     HEAP32[($15_1 + 220 | 0) >> 2] = 0;
     break label$3;
    case 3:
     label$11 : {
      if (HEAP32[($15_1 + 176 | 0) >> 2] | 0) {
       break label$11
      }
      HEAP32[($15_1 + 220 | 0) >> 2] = -20;
      break label$3;
     }
     label$12 : {
      if (!(HEAP32[($15_1 + 172 | 0) >> 2] | 0)) {
       break label$12
      }
      if (!((HEAP32[($15_1 + 168 | 0) >> 2] | 0 | 0) > (24 | 0) & 1 | 0)) {
       break label$12
      }
      HEAP32[($15_1 + 152 | 0) >> 2] = HEAP32[(HEAP32[($15_1 + 212 | 0) >> 2] | 0) >> 2] | 0;
      HEAP32[($15_1 + 148 | 0) >> 2] = ((1 << (HEAP32[($15_1 + 200 | 0) >> 2] | 0) | 0) + 1 | 0) << 3 | 0;
      HEAP32[($15_1 + 144 | 0) >> 2] = HEAP32[($15_1 + 152 | 0) >> 2] | 0;
      HEAP32[($15_1 + 140 | 0) >> 2] = HEAP32[($15_1 + 148 | 0) >> 2] | 0;
      HEAP32[($15_1 + 136 | 0) >> 2] = 0;
      label$13 : {
       label$14 : while (1) {
        if (!((HEAP32[($15_1 + 136 | 0) >> 2] | 0) >>> 0 < (HEAP32[($15_1 + 140 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
         break label$13
        }
        (HEAP32[($15_1 + 144 | 0) >> 2] | 0) + (HEAP32[($15_1 + 136 | 0) >> 2] | 0) | 0;
        HEAP32[($15_1 + 136 | 0) >> 2] = (HEAP32[($15_1 + 136 | 0) >> 2] | 0) + 64 | 0;
        continue label$14;
       };
      }
     }
     HEAP32[($15_1 + 220 | 0) >> 2] = 0;
     break label$3;
    case 2:
     HEAP32[($15_1 + 12 | 0) >> 2] = $5($15_1 + 16 | 0 | 0, $15_1 + 204 | 0 | 0, $15_1 + 132 | 0 | 0, HEAP32[($15_1 + 196 | 0) >> 2] | 0 | 0, HEAP32[($15_1 + 192 | 0) >> 2] | 0 | 0) | 0;
     label$15 : {
      if (!($3(HEAP32[($15_1 + 12 | 0) >> 2] | 0 | 0) | 0)) {
       break label$15
      }
      HEAP32[($15_1 + 220 | 0) >> 2] = -20;
      break label$3;
     }
     label$16 : {
      if (!((HEAP32[($15_1 + 132 | 0) >> 2] | 0) >>> 0 > (HEAP32[($15_1 + 200 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$16
      }
      HEAP32[($15_1 + 220 | 0) >> 2] = -20;
      break label$3;
     }
     $105(HEAP32[($15_1 + 216 | 0) >> 2] | 0 | 0, $15_1 + 16 | 0 | 0, HEAP32[($15_1 + 204 | 0) >> 2] | 0 | 0, HEAP32[($15_1 + 188 | 0) >> 2] | 0 | 0, HEAP32[($15_1 + 184 | 0) >> 2] | 0 | 0, HEAP32[($15_1 + 132 | 0) >> 2] | 0 | 0);
     HEAP32[(HEAP32[($15_1 + 212 | 0) >> 2] | 0) >> 2] = HEAP32[($15_1 + 216 | 0) >> 2] | 0;
     HEAP32[($15_1 + 220 | 0) >> 2] = HEAP32[($15_1 + 12 | 0) >> 2] | 0;
     break label$3;
    default:
     break label$4;
    };
   }
   HEAP32[($15_1 + 220 | 0) >> 2] = -1;
  }
  $126_1 = HEAP32[($15_1 + 220 | 0) >> 2] | 0;
  label$17 : {
   $130_1 = $15_1 + 224 | 0;
   if ($130_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $130_1;
  }
  return $126_1 | 0;
 }
 
 function $129($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $8_1 = 0;
  $5_1 = global$0 - 32 | 0;
  $8_1 = 0;
  HEAP32[($5_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($5_1 + 16 | 0) >> 2] = HEAP32[($5_1 + 28 | 0) >> 2] | 0;
  HEAP32[($5_1 + 12 | 0) >> 2] = HEAP32[($5_1 + 16 | 0) >> 2] | 0;
  HEAP32[($5_1 + 8 | 0) >> 2] = (HEAP32[($5_1 + 28 | 0) >> 2] | 0) + 8 | 0;
  HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 4 | 0) >> 2] = $8_1;
  HEAP32[(HEAP32[($5_1 + 12 | 0) >> 2] | 0) >> 2] = $8_1;
  HEAP8[((HEAP32[($5_1 + 8 | 0) >> 2] | 0) + 3 | 0) >> 0] = 0;
  HEAP16[(HEAP32[($5_1 + 8 | 0) >> 2] | 0) >> 1] = 0;
  HEAP8[((HEAP32[($5_1 + 8 | 0) >> 2] | 0) + 2 | 0) >> 0] = HEAP32[($5_1 + 20 | 0) >> 2] | 0;
  HEAP32[((HEAP32[($5_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] = HEAP32[($5_1 + 24 | 0) >> 2] | 0;
  return;
 }
 
 function $130($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, $102_1 = 0, $147_1 = 0, $148_1 = 0, $149_1 = 0, $150_1 = 0, $151_1 = 0, $152_1 = 0, $153_1 = 0, $156_1 = 0, $157_1 = 0, $158_1 = 0, $502 = 0, $1013 = 0, $1479 = 0, $49_1 = 0, $126_1 = 0, $135_1 = 0, $154_1 = 0, $231 = 0, $319 = 0, $353 = 0, $438 = 0, $528 = 0, $569 = 0, $578 = 0, $667 = 0, $755 = 0, $789 = 0, $874 = 0, $943 = 0, $983 = 0, $1024 = 0, $1045 = 0, $1288 = 0, $1298 = 0, $1307 = 0, $1311 = 0, $1321 = 0, $1398 = 0, $1399 = 0, $1433 = 0, $1449 = 0, $1490 = 0, $1511 = 0, $1758 = 0, $1768 = 0, $1777 = 0, $1781 = 0, $1791 = 0, $1922 = 0, $1921 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, $18_1 = 0, $155_1 = 0, $2314 = 0, $2332 = 0, $2350 = 0, $216 = 0, $253 = 0, $370 = 0, $413 = 0, $468 = 0, $469 = 0, $2989 = 0, $484 = 0, $485 = 0, $3034 = 0, $514 = 0, $515 = 0, $3102 = 0, $3140 = 0, $3150 = 0, $591 = 0, $3284 = 0, $3302 = 0, $3320 = 0, $652 = 0, $689 = 0, $806 = 0, $849 = 0, $904 = 0, $905 = 0, $3959 = 0, $920 = 0, $921 = 0, $4004 = 0, $955 = 0, $956 = 0, $4076 = 0, $969 = 0, $970 = 0, $979 = 0, $980 = 0, $981 = 0, $982 = 0, $4140 = 0, $4150 = 0, $1038 = 0, $1039 = 0, $1040 = 0, $1041 = 0, $1042 = 0, $1043 = 0, $1044 = 0, $4306 = 0, $4310 = 0, $1069 = 0, $1072 = 0, $1187 = 0, $1188 = 0, $1248 = 0, $1323 = 0, $1326 = 0, $5126 = 0, $5136 = 0, $1437 = 0, $1438 = 0, $1445 = 0, $1446 = 0, $1447 = 0, $1448 = 0, $5230 = 0, $5240 = 0, $1504 = 0, $1505 = 0, $1506 = 0, $1507 = 0, $1508 = 0, $1509 = 0, $1510 = 0, $5399 = 0, $5403 = 0, $1539 = 0, $1542 = 0, $1657 = 0, $1658 = 0, $1718 = 0, $1793 = 0, $1796 = 0, $1918 = 0;
  $10_1 = global$0 - 1040 | 0;
  label$1 : {
   $1921 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $1921;
  }
  HEAP32[($10_1 + 60 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 56 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 52 | 0) >> 2] = $2_1;
  HEAP32[($10_1 + 48 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 44 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 40 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 36 | 0) >> 2] = $6_1;
  HEAP32[($10_1 + 32 | 0) >> 2] = $7_1;
  $12_1 = HEAP32[($10_1 + 56 | 0) >> 2] | 0;
  $13_1 = HEAP32[($10_1 + 52 | 0) >> 2] | 0;
  $14_1 = HEAP32[($10_1 + 48 | 0) >> 2] | 0;
  $15_1 = HEAP32[($10_1 + 44 | 0) >> 2] | 0;
  $16_1 = HEAP32[($10_1 + 40 | 0) >> 2] | 0;
  $17_1 = HEAP32[($10_1 + 36 | 0) >> 2] | 0;
  $18_1 = HEAP32[($10_1 + 32 | 0) >> 2] | 0;
  HEAP32[($10_1 + 332 | 0) >> 2] = HEAP32[($10_1 + 60 | 0) >> 2] | 0;
  HEAP32[($10_1 + 328 | 0) >> 2] = $12_1;
  HEAP32[($10_1 + 324 | 0) >> 2] = $13_1;
  HEAP32[($10_1 + 320 | 0) >> 2] = $14_1;
  HEAP32[($10_1 + 316 | 0) >> 2] = $15_1;
  HEAP32[($10_1 + 312 | 0) >> 2] = $16_1;
  HEAP32[($10_1 + 308 | 0) >> 2] = $17_1;
  HEAP32[($10_1 + 304 | 0) >> 2] = $18_1;
  HEAP32[($10_1 + 300 | 0) >> 2] = HEAP32[($10_1 + 320 | 0) >> 2] | 0;
  HEAP32[($10_1 + 296 | 0) >> 2] = (HEAP32[($10_1 + 300 | 0) >> 2] | 0) + (HEAP32[($10_1 + 316 | 0) >> 2] | 0) | 0;
  HEAP32[($10_1 + 292 | 0) >> 2] = HEAP32[($10_1 + 328 | 0) >> 2] | 0;
  HEAP32[($10_1 + 288 | 0) >> 2] = (HEAP32[($10_1 + 292 | 0) >> 2] | 0) + (HEAP32[($10_1 + 324 | 0) >> 2] | 0) | 0;
  HEAP32[($10_1 + 284 | 0) >> 2] = HEAP32[($10_1 + 292 | 0) >> 2] | 0;
  HEAP32[($10_1 + 280 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 332 | 0) >> 2] | 0) + 28912 | 0) >> 2] | 0;
  HEAP32[($10_1 + 276 | 0) >> 2] = (HEAP32[($10_1 + 280 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($10_1 + 332 | 0) >> 2] | 0) + 28928 | 0) >> 2] | 0) | 0;
  HEAP32[($10_1 + 272 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 332 | 0) >> 2] | 0) + 28732 | 0) >> 2] | 0;
  HEAP32[($10_1 + 268 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 332 | 0) >> 2] | 0) + 28736 | 0) >> 2] | 0;
  HEAP32[($10_1 + 264 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 332 | 0) >> 2] | 0) + 28740 | 0) >> 2] | 0;
  label$3 : {
   label$4 : {
    if (!(HEAP32[($10_1 + 312 | 0) >> 2] | 0)) {
     break label$4
    }
    label$5 : {
     label$6 : {
      if (!((HEAP32[($10_1 + 312 | 0) >> 2] | 0 | 0) < (4 | 0) & 1 | 0)) {
       break label$6
      }
      $49_1 = HEAP32[($10_1 + 312 | 0) >> 2] | 0;
      break label$5;
     }
     $49_1 = 4;
    }
    HEAP32[($10_1 + 188 | 0) >> 2] = $49_1;
    HEAP32[((HEAP32[($10_1 + 332 | 0) >> 2] | 0) + 28812 | 0) >> 2] = 1;
    HEAP32[($10_1 + 112 | 0) >> 2] = 0;
    label$7 : {
     label$8 : while (1) {
      if (!((HEAP32[($10_1 + 112 | 0) >> 2] | 0 | 0) < (3 | 0) & 1 | 0)) {
       break label$7
      }
      HEAP32[((($10_1 + 120 | 0) + 44 | 0) + ((HEAP32[($10_1 + 112 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] = HEAP32[((((HEAP32[($10_1 + 332 | 0) >> 2] | 0) + 16 | 0) + 26652 | 0) + ((HEAP32[($10_1 + 112 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
      HEAP32[($10_1 + 112 | 0) >> 2] = (HEAP32[($10_1 + 112 | 0) >> 2] | 0) + 1 | 0;
      continue label$8;
     };
    }
    HEAP32[($10_1 + 176 | 0) >> 2] = HEAP32[($10_1 + 272 | 0) >> 2] | 0;
    HEAP32[($10_1 + 184 | 0) >> 2] = (HEAP32[($10_1 + 284 | 0) >> 2] | 0) - (HEAP32[($10_1 + 272 | 0) >> 2] | 0) | 0;
    HEAP32[($10_1 + 180 | 0) >> 2] = HEAP32[($10_1 + 264 | 0) >> 2] | 0;
    label$9 : {
     if (!($3($15($10_1 + 120 | 0 | 0, HEAP32[($10_1 + 300 | 0) >> 2] | 0 | 0, (HEAP32[($10_1 + 296 | 0) >> 2] | 0) - (HEAP32[($10_1 + 300 | 0) >> 2] | 0) | 0 | 0) | 0 | 0) | 0)) {
      break label$9
     }
     HEAP32[($10_1 + 336 | 0) >> 2] = -20;
     break label$3;
    }
    $102_1 = $10_1 + 120 | 0;
    $138($102_1 + 20 | 0 | 0, $102_1 | 0, HEAP32[(HEAP32[($10_1 + 332 | 0) >> 2] | 0) >> 2] | 0 | 0);
    $138($102_1 + 28 | 0 | 0, $102_1 | 0, HEAP32[((HEAP32[($10_1 + 332 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0 | 0);
    $138($102_1 + 36 | 0 | 0, $102_1 | 0, HEAP32[((HEAP32[($10_1 + 332 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0 | 0);
    HEAP32[($10_1 + 116 | 0) >> 2] = 0;
    label$10 : while (1) {
     $126_1 = 0;
     label$11 : {
      if (!(($17($10_1 + 120 | 0 | 0) | 0) >>> 0 <= 2 >>> 0 & 1 | 0)) {
       break label$11
      }
      $126_1 = (HEAP32[($10_1 + 116 | 0) >> 2] | 0 | 0) < (HEAP32[($10_1 + 188 | 0) >> 2] | 0 | 0);
     }
     label$12 : {
      if (!($126_1 & 1 | 0)) {
       break label$12
      }
      $135_1 = 1;
      $154_1 = ($10_1 + 192 | 0) + ((HEAP32[($10_1 + 116 | 0) >> 2] | 0) << 4 | 0) | 0;
      $155_1 = HEAP32[($10_1 + 308 | 0) >> 2] | 0;
      HEAP32[($10_1 + 420 | 0) >> 2] = $10_1 + 120 | 0;
      HEAP32[($10_1 + 416 | 0) >> 2] = $155_1;
      HEAP32[($10_1 + 412 | 0) >> 2] = $135_1;
      i64toi32_i32$2 = (HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 24 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 20 | 0) >> 2] | 0) << 3 | 0) | 0;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $2314 = i64toi32_i32$0;
      i64toi32_i32$0 = $10_1 + 400 | 0;
      HEAP32[i64toi32_i32$0 >> 2] = $2314;
      HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
      i64toi32_i32$2 = (HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 40 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 36 | 0) >> 2] | 0) << 3 | 0) | 0;
      i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $2332 = i64toi32_i32$1;
      i64toi32_i32$1 = $10_1 + 392 | 0;
      HEAP32[i64toi32_i32$1 >> 2] = $2332;
      HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
      i64toi32_i32$2 = (HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 32 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 28 | 0) >> 2] | 0) << 3 | 0) | 0;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $2350 = i64toi32_i32$0;
      i64toi32_i32$0 = $10_1 + 384 | 0;
      HEAP32[i64toi32_i32$0 >> 2] = $2350;
      HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
      HEAP32[($10_1 + 380 | 0) >> 2] = HEAP32[($10_1 + 404 | 0) >> 2] | 0;
      HEAP32[($10_1 + 376 | 0) >> 2] = HEAP32[($10_1 + 396 | 0) >> 2] | 0;
      HEAP32[($10_1 + 372 | 0) >> 2] = HEAP32[($10_1 + 388 | 0) >> 2] | 0;
      HEAP8[($10_1 + 371 | 0) >> 0] = HEAPU8[($10_1 + 402 | 0) >> 0] | 0;
      HEAP8[($10_1 + 370 | 0) >> 0] = HEAPU8[($10_1 + 394 | 0) >> 0] | 0;
      HEAP8[($10_1 + 369 | 0) >> 0] = HEAPU8[($10_1 + 386 | 0) >> 0] | 0;
      HEAP8[($10_1 + 368 | 0) >> 0] = (((HEAPU8[($10_1 + 371 | 0) >> 0] | 0) & 255 | 0) + ((HEAPU8[($10_1 + 370 | 0) >> 0] | 0) & 255 | 0) | 0) + ((HEAPU8[($10_1 + 369 | 0) >> 0] | 0) & 255 | 0) | 0;
      label$13 : {
       label$14 : {
        if (!(((HEAPU8[($10_1 + 369 | 0) >> 0] | 0) & 255 | 0 | 0) > ($135_1 | 0) & 1 | 0)) {
         break label$14
        }
        label$15 : {
         label$16 : {
          if (!($32() | 0)) {
           break label$16
          }
          if (!(HEAP32[($10_1 + 416 | 0) >> 2] | 0)) {
           break label$16
          }
          if (!(((HEAPU8[($10_1 + 369 | 0) >> 0] | 0) & 255 | 0 | 0) >= (25 | 0) & 1 | 0)) {
           break label$16
          }
          $216 = (HEAPU8[($10_1 + 369 | 0) >> 0] | 0) & 255 | 0;
          label$17 : {
           label$18 : {
            if (!(((HEAPU8[($10_1 + 369 | 0) >> 0] | 0) & 255 | 0) >>> 0 < (32 - (HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
             break label$18
            }
            $231 = (HEAPU8[($10_1 + 369 | 0) >> 0] | 0) & 255 | 0;
            break label$17;
           }
           $231 = 32 - (HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) | 0;
          }
          HEAP32[($10_1 + 360 | 0) >> 2] = $216 - $231 | 0;
          HEAP32[($10_1 + 364 | 0) >> 2] = (HEAP32[($10_1 + 372 | 0) >> 2] | 0) + (($134(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0, ((HEAPU8[($10_1 + 369 | 0) >> 0] | 0) & 255 | 0) - (HEAP32[($10_1 + 360 | 0) >> 2] | 0) | 0 | 0) | 0) << (HEAP32[($10_1 + 360 | 0) >> 2] | 0) | 0) | 0;
          $17(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0) | 0;
          label$19 : {
           if (!(HEAP32[($10_1 + 360 | 0) >> 2] | 0)) {
            break label$19
           }
           $253 = $134(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 360 | 0) >> 2] | 0 | 0) | 0;
           HEAP32[($10_1 + 364 | 0) >> 2] = (HEAP32[($10_1 + 364 | 0) >> 2] | 0) + $253 | 0;
          }
          break label$15;
         }
         HEAP32[($10_1 + 364 | 0) >> 2] = (HEAP32[($10_1 + 372 | 0) >> 2] | 0) + ($134(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0, (HEAPU8[($10_1 + 369 | 0) >> 0] | 0) & 255 | 0 | 0) | 0) | 0;
         label$20 : {
          if (!($32() | 0)) {
           break label$20
          }
          $17(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0) | 0;
         }
        }
        HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 52 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 48 | 0) >> 2] | 0;
        HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 48 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
        HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 44 | 0) >> 2] = HEAP32[($10_1 + 364 | 0) >> 2] | 0;
        break label$13;
       }
       HEAP32[($10_1 + 356 | 0) >> 2] = (HEAP32[($10_1 + 380 | 0) >> 2] | 0 | 0) == (0 | 0) & 1 | 0;
       label$21 : {
        label$22 : {
         if ((HEAPU8[($10_1 + 369 | 0) >> 0] | 0) & 255 | 0) {
          break label$22
         }
         label$23 : {
          label$24 : {
           if (!(((HEAP32[($10_1 + 356 | 0) >> 2] | 0 | 0) != (0 | 0) ^ -1 | 0) & 1 | 0)) {
            break label$24
           }
           HEAP32[($10_1 + 364 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
           break label$23;
          }
          HEAP32[($10_1 + 364 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 48 | 0) >> 2] | 0;
          HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 48 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
          HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 44 | 0) >> 2] = HEAP32[($10_1 + 364 | 0) >> 2] | 0;
         }
         break label$21;
        }
        HEAP32[($10_1 + 364 | 0) >> 2] = ((HEAP32[($10_1 + 372 | 0) >> 2] | 0) + (HEAP32[($10_1 + 356 | 0) >> 2] | 0) | 0) + ($134(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0, 1 | 0) | 0) | 0;
        label$25 : {
         label$26 : {
          if (!((HEAP32[($10_1 + 364 | 0) >> 2] | 0 | 0) == (3 | 0) & 1 | 0)) {
           break label$26
          }
          $319 = (HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0) - 1 | 0;
          break label$25;
         }
         $319 = HEAP32[(((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 44 | 0) + ((HEAP32[($10_1 + 364 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
        }
        HEAP32[($10_1 + 352 | 0) >> 2] = $319;
        HEAP32[($10_1 + 352 | 0) >> 2] = (HEAP32[($10_1 + 352 | 0) >> 2] | 0) + (((HEAP32[($10_1 + 352 | 0) >> 2] | 0 | 0) != (0 | 0) ^ -1 | 0) & 1 | 0) | 0;
        label$27 : {
         if (!((HEAP32[($10_1 + 364 | 0) >> 2] | 0 | 0) != (1 | 0) & 1 | 0)) {
          break label$27
         }
         HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 52 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 48 | 0) >> 2] | 0;
        }
        HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 48 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
        $353 = HEAP32[($10_1 + 352 | 0) >> 2] | 0;
        HEAP32[($10_1 + 364 | 0) >> 2] = $353;
        HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 44 | 0) >> 2] = $353;
       }
      }
      HEAP32[($10_1 + 104 | 0) >> 2] = HEAP32[($10_1 + 364 | 0) >> 2] | 0;
      HEAP32[($10_1 + 100 | 0) >> 2] = HEAP32[($10_1 + 376 | 0) >> 2] | 0;
      label$28 : {
       if (!(((HEAPU8[($10_1 + 370 | 0) >> 0] | 0) & 255 | 0 | 0) > (0 | 0) & 1 | 0)) {
        break label$28
       }
       $370 = $134(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0, (HEAPU8[($10_1 + 370 | 0) >> 0] | 0) & 255 | 0 | 0) | 0;
       HEAP32[($10_1 + 100 | 0) >> 2] = (HEAP32[($10_1 + 100 | 0) >> 2] | 0) + $370 | 0;
      }
      label$29 : {
       if (!($32() | 0)) {
        break label$29
       }
       if (!((((HEAPU8[($10_1 + 370 | 0) >> 0] | 0) & 255 | 0) + ((HEAPU8[($10_1 + 371 | 0) >> 0] | 0) & 255 | 0) | 0 | 0) >= (20 | 0) & 1 | 0)) {
        break label$29
       }
       $17(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0) | 0;
      }
      label$30 : {
       if (!($29() | 0)) {
        break label$30
       }
       if (!(((HEAPU8[($10_1 + 368 | 0) >> 0] | 0) & 255 | 0 | 0) >= (31 | 0) & 1 | 0)) {
        break label$30
       }
       $17(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0) | 0;
      }
      HEAP32[($10_1 + 96 | 0) >> 2] = HEAP32[($10_1 + 380 | 0) >> 2] | 0;
      label$31 : {
       if (!(((HEAPU8[($10_1 + 371 | 0) >> 0] | 0) & 255 | 0 | 0) > (0 | 0) & 1 | 0)) {
        break label$31
       }
       $413 = $134(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0, (HEAPU8[($10_1 + 371 | 0) >> 0] | 0) & 255 | 0 | 0) | 0;
       HEAP32[($10_1 + 96 | 0) >> 2] = (HEAP32[($10_1 + 96 | 0) >> 2] | 0) + $413 | 0;
      }
      label$32 : {
       if (!($32() | 0)) {
        break label$32
       }
       $17(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0) | 0;
      }
      label$33 : {
       if (!((HEAP32[($10_1 + 412 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
        break label$33
       }
       HEAP32[($10_1 + 348 | 0) >> 2] = (HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 64 | 0) >> 2] | 0) + (HEAP32[($10_1 + 96 | 0) >> 2] | 0) | 0;
       label$34 : {
        label$35 : {
         if (!((HEAP32[($10_1 + 104 | 0) >> 2] | 0) >>> 0 > (HEAP32[($10_1 + 348 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
          break label$35
         }
         $438 = HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 60 | 0) >> 2] | 0;
         break label$34;
        }
        $438 = HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 56 | 0) >> 2] | 0;
       }
       HEAP32[($10_1 + 344 | 0) >> 2] = $438;
       HEAP32[($10_1 + 108 | 0) >> 2] = ((HEAP32[($10_1 + 344 | 0) >> 2] | 0) + (HEAP32[($10_1 + 348 | 0) >> 2] | 0) | 0) + (0 - (HEAP32[($10_1 + 104 | 0) >> 2] | 0) | 0) | 0;
       HEAP32[((HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 64 | 0) >> 2] = (HEAP32[($10_1 + 348 | 0) >> 2] | 0) + (HEAP32[($10_1 + 100 | 0) >> 2] | 0) | 0;
      }
      HEAP32[($10_1 + 340 | 0) >> 2] = 0;
      $468 = (HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 20 | 0;
      $469 = HEAP32[($10_1 + 420 | 0) >> 2] | 0;
      i64toi32_i32$2 = $10_1 + 400 | 0;
      i64toi32_i32$1 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$0 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $2989 = i64toi32_i32$1;
      i64toi32_i32$1 = $10_1 + 424 | 0;
      $147_1 = $2989;
      HEAP8[i64toi32_i32$1 >> 0] = $147_1;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $147_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $147_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $147_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      HEAP32[($10_1 + 444 | 0) >> 2] = $468;
      HEAP32[($10_1 + 440 | 0) >> 2] = $469;
      HEAP32[($10_1 + 436 | 0) >> 2] = (HEAPU8[($10_1 + 427 | 0) >> 0] | 0) & 255 | 0;
      HEAP32[($10_1 + 432 | 0) >> 2] = $133(HEAP32[($10_1 + 440 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 436 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[(HEAP32[($10_1 + 444 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($10_1 + 424 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($10_1 + 432 | 0) >> 2] | 0) | 0;
      $484 = (HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 36 | 0;
      $485 = HEAP32[($10_1 + 420 | 0) >> 2] | 0;
      i64toi32_i32$2 = $10_1 + 392 | 0;
      i64toi32_i32$0 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$1 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $3034 = i64toi32_i32$0;
      i64toi32_i32$0 = $10_1 + 448 | 0;
      $148_1 = $3034;
      HEAP8[i64toi32_i32$0 >> 0] = $148_1;
      HEAP8[(i64toi32_i32$0 + 1 | 0) >> 0] = $148_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 2 | 0) >> 0] = $148_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 3 | 0) >> 0] = $148_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$0 + 4 | 0) >> 0] = i64toi32_i32$1;
      HEAP8[(i64toi32_i32$0 + 5 | 0) >> 0] = i64toi32_i32$1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 6 | 0) >> 0] = i64toi32_i32$1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 7 | 0) >> 0] = i64toi32_i32$1 >>> 24 | 0;
      HEAP32[($10_1 + 468 | 0) >> 2] = $484;
      HEAP32[($10_1 + 464 | 0) >> 2] = $485;
      HEAP32[($10_1 + 460 | 0) >> 2] = (HEAPU8[($10_1 + 451 | 0) >> 0] | 0) & 255 | 0;
      HEAP32[($10_1 + 456 | 0) >> 2] = $133(HEAP32[($10_1 + 464 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 460 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[(HEAP32[($10_1 + 468 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($10_1 + 448 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($10_1 + 456 | 0) >> 2] | 0) | 0;
      label$36 : {
       if (!($32() | 0)) {
        break label$36
       }
       $17(HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0) | 0;
      }
      $502 = $10_1 + 192 | 0;
      $514 = (HEAP32[($10_1 + 420 | 0) >> 2] | 0) + 28 | 0;
      $515 = HEAP32[($10_1 + 420 | 0) >> 2] | 0;
      i64toi32_i32$2 = $10_1 + 384 | 0;
      i64toi32_i32$1 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$0 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $3102 = i64toi32_i32$1;
      i64toi32_i32$1 = $10_1 + 472 | 0;
      $149_1 = $3102;
      HEAP8[i64toi32_i32$1 >> 0] = $149_1;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $149_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $149_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $149_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      HEAP32[($10_1 + 496 | 0) >> 2] = $514;
      HEAP32[($10_1 + 492 | 0) >> 2] = $515;
      HEAP32[($10_1 + 488 | 0) >> 2] = (HEAPU8[($10_1 + 475 | 0) >> 0] | 0) & 255 | 0;
      HEAP32[($10_1 + 484 | 0) >> 2] = $133(HEAP32[($10_1 + 492 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 488 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[(HEAP32[($10_1 + 496 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($10_1 + 472 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($10_1 + 484 | 0) >> 2] | 0) | 0;
      i64toi32_i32$2 = $10_1 + 96 | 0;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $3140 = i64toi32_i32$0;
      i64toi32_i32$0 = $154_1;
      HEAP32[i64toi32_i32$0 >> 2] = $3140;
      HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
      $528 = 8;
      i64toi32_i32$2 = i64toi32_i32$2 + $528 | 0;
      i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $3150 = i64toi32_i32$1;
      i64toi32_i32$1 = $154_1 + $528 | 0;
      HEAP32[i64toi32_i32$1 >> 2] = $3150;
      HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
      HEAP32[(($502 + ((HEAP32[($10_1 + 116 | 0) >> 2] | 0) << 4 | 0) | 0) + 12 | 0) >> 2] | 0;
      (HEAP32[(($502 + ((HEAP32[($10_1 + 116 | 0) >> 2] | 0) << 4 | 0) | 0) + 12 | 0) >> 2] | 0) + (HEAP32[(($502 + ((HEAP32[($10_1 + 116 | 0) >> 2] | 0) << 4 | 0) | 0) + 4 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 116 | 0) >> 2] = (HEAP32[($10_1 + 116 | 0) >> 2] | 0) + 1 | 0;
      continue label$10;
     }
     break label$10;
    };
    label$37 : {
     if (!((HEAP32[($10_1 + 116 | 0) >> 2] | 0 | 0) < (HEAP32[($10_1 + 188 | 0) >> 2] | 0 | 0) & 1 | 0)) {
      break label$37
     }
     HEAP32[($10_1 + 336 | 0) >> 2] = -20;
     break label$3;
    }
    label$38 : while (1) {
     $569 = 0;
     label$39 : {
      if (!(($17($10_1 + 120 | 0 | 0) | 0) >>> 0 <= 2 >>> 0 & 1 | 0)) {
       break label$39
      }
      $569 = (HEAP32[($10_1 + 116 | 0) >> 2] | 0 | 0) < (HEAP32[($10_1 + 312 | 0) >> 2] | 0 | 0);
     }
     label$40 : {
      if (!($569 & 1 | 0)) {
       break label$40
      }
      $578 = 1;
      $591 = HEAP32[($10_1 + 308 | 0) >> 2] | 0;
      HEAP32[($10_1 + 580 | 0) >> 2] = $10_1 + 120 | 0;
      HEAP32[($10_1 + 576 | 0) >> 2] = $591;
      HEAP32[($10_1 + 572 | 0) >> 2] = $578;
      i64toi32_i32$2 = (HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 24 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 20 | 0) >> 2] | 0) << 3 | 0) | 0;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $3284 = i64toi32_i32$0;
      i64toi32_i32$0 = $10_1 + 560 | 0;
      HEAP32[i64toi32_i32$0 >> 2] = $3284;
      HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
      i64toi32_i32$2 = (HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 40 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 36 | 0) >> 2] | 0) << 3 | 0) | 0;
      i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $3302 = i64toi32_i32$1;
      i64toi32_i32$1 = $10_1 + 552 | 0;
      HEAP32[i64toi32_i32$1 >> 2] = $3302;
      HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
      i64toi32_i32$2 = (HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 32 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 28 | 0) >> 2] | 0) << 3 | 0) | 0;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $3320 = i64toi32_i32$0;
      i64toi32_i32$0 = $10_1 + 544 | 0;
      HEAP32[i64toi32_i32$0 >> 2] = $3320;
      HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
      HEAP32[($10_1 + 540 | 0) >> 2] = HEAP32[($10_1 + 564 | 0) >> 2] | 0;
      HEAP32[($10_1 + 536 | 0) >> 2] = HEAP32[($10_1 + 556 | 0) >> 2] | 0;
      HEAP32[($10_1 + 532 | 0) >> 2] = HEAP32[($10_1 + 548 | 0) >> 2] | 0;
      HEAP8[($10_1 + 531 | 0) >> 0] = HEAPU8[($10_1 + 562 | 0) >> 0] | 0;
      HEAP8[($10_1 + 530 | 0) >> 0] = HEAPU8[($10_1 + 554 | 0) >> 0] | 0;
      HEAP8[($10_1 + 529 | 0) >> 0] = HEAPU8[($10_1 + 546 | 0) >> 0] | 0;
      HEAP8[($10_1 + 528 | 0) >> 0] = (((HEAPU8[($10_1 + 531 | 0) >> 0] | 0) & 255 | 0) + ((HEAPU8[($10_1 + 530 | 0) >> 0] | 0) & 255 | 0) | 0) + ((HEAPU8[($10_1 + 529 | 0) >> 0] | 0) & 255 | 0) | 0;
      label$41 : {
       label$42 : {
        if (!(((HEAPU8[($10_1 + 529 | 0) >> 0] | 0) & 255 | 0 | 0) > ($578 | 0) & 1 | 0)) {
         break label$42
        }
        label$43 : {
         label$44 : {
          if (!($32() | 0)) {
           break label$44
          }
          if (!(HEAP32[($10_1 + 576 | 0) >> 2] | 0)) {
           break label$44
          }
          if (!(((HEAPU8[($10_1 + 529 | 0) >> 0] | 0) & 255 | 0 | 0) >= (25 | 0) & 1 | 0)) {
           break label$44
          }
          $652 = (HEAPU8[($10_1 + 529 | 0) >> 0] | 0) & 255 | 0;
          label$45 : {
           label$46 : {
            if (!(((HEAPU8[($10_1 + 529 | 0) >> 0] | 0) & 255 | 0) >>> 0 < (32 - (HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
             break label$46
            }
            $667 = (HEAPU8[($10_1 + 529 | 0) >> 0] | 0) & 255 | 0;
            break label$45;
           }
           $667 = 32 - (HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) | 0;
          }
          HEAP32[($10_1 + 520 | 0) >> 2] = $652 - $667 | 0;
          HEAP32[($10_1 + 524 | 0) >> 2] = (HEAP32[($10_1 + 532 | 0) >> 2] | 0) + (($134(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0, ((HEAPU8[($10_1 + 529 | 0) >> 0] | 0) & 255 | 0) - (HEAP32[($10_1 + 520 | 0) >> 2] | 0) | 0 | 0) | 0) << (HEAP32[($10_1 + 520 | 0) >> 2] | 0) | 0) | 0;
          $17(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0) | 0;
          label$47 : {
           if (!(HEAP32[($10_1 + 520 | 0) >> 2] | 0)) {
            break label$47
           }
           $689 = $134(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 520 | 0) >> 2] | 0 | 0) | 0;
           HEAP32[($10_1 + 524 | 0) >> 2] = (HEAP32[($10_1 + 524 | 0) >> 2] | 0) + $689 | 0;
          }
          break label$43;
         }
         HEAP32[($10_1 + 524 | 0) >> 2] = (HEAP32[($10_1 + 532 | 0) >> 2] | 0) + ($134(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0, (HEAPU8[($10_1 + 529 | 0) >> 0] | 0) & 255 | 0 | 0) | 0) | 0;
         label$48 : {
          if (!($32() | 0)) {
           break label$48
          }
          $17(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0) | 0;
         }
        }
        HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 52 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 48 | 0) >> 2] | 0;
        HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 48 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
        HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 44 | 0) >> 2] = HEAP32[($10_1 + 524 | 0) >> 2] | 0;
        break label$41;
       }
       HEAP32[($10_1 + 516 | 0) >> 2] = (HEAP32[($10_1 + 540 | 0) >> 2] | 0 | 0) == (0 | 0) & 1 | 0;
       label$49 : {
        label$50 : {
         if ((HEAPU8[($10_1 + 529 | 0) >> 0] | 0) & 255 | 0) {
          break label$50
         }
         label$51 : {
          label$52 : {
           if (!(((HEAP32[($10_1 + 516 | 0) >> 2] | 0 | 0) != (0 | 0) ^ -1 | 0) & 1 | 0)) {
            break label$52
           }
           HEAP32[($10_1 + 524 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
           break label$51;
          }
          HEAP32[($10_1 + 524 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 48 | 0) >> 2] | 0;
          HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 48 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
          HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 44 | 0) >> 2] = HEAP32[($10_1 + 524 | 0) >> 2] | 0;
         }
         break label$49;
        }
        HEAP32[($10_1 + 524 | 0) >> 2] = ((HEAP32[($10_1 + 532 | 0) >> 2] | 0) + (HEAP32[($10_1 + 516 | 0) >> 2] | 0) | 0) + ($134(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0, 1 | 0) | 0) | 0;
        label$53 : {
         label$54 : {
          if (!((HEAP32[($10_1 + 524 | 0) >> 2] | 0 | 0) == (3 | 0) & 1 | 0)) {
           break label$54
          }
          $755 = (HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0) - 1 | 0;
          break label$53;
         }
         $755 = HEAP32[(((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 44 | 0) + ((HEAP32[($10_1 + 524 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
        }
        HEAP32[($10_1 + 512 | 0) >> 2] = $755;
        HEAP32[($10_1 + 512 | 0) >> 2] = (HEAP32[($10_1 + 512 | 0) >> 2] | 0) + (((HEAP32[($10_1 + 512 | 0) >> 2] | 0 | 0) != (0 | 0) ^ -1 | 0) & 1 | 0) | 0;
        label$55 : {
         if (!((HEAP32[($10_1 + 524 | 0) >> 2] | 0 | 0) != (1 | 0) & 1 | 0)) {
          break label$55
         }
         HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 52 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 48 | 0) >> 2] | 0;
        }
        HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 48 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
        $789 = HEAP32[($10_1 + 512 | 0) >> 2] | 0;
        HEAP32[($10_1 + 524 | 0) >> 2] = $789;
        HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 44 | 0) >> 2] = $789;
       }
      }
      HEAP32[($10_1 + 88 | 0) >> 2] = HEAP32[($10_1 + 524 | 0) >> 2] | 0;
      HEAP32[($10_1 + 84 | 0) >> 2] = HEAP32[($10_1 + 536 | 0) >> 2] | 0;
      label$56 : {
       if (!(((HEAPU8[($10_1 + 530 | 0) >> 0] | 0) & 255 | 0 | 0) > (0 | 0) & 1 | 0)) {
        break label$56
       }
       $806 = $134(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0, (HEAPU8[($10_1 + 530 | 0) >> 0] | 0) & 255 | 0 | 0) | 0;
       HEAP32[($10_1 + 84 | 0) >> 2] = (HEAP32[($10_1 + 84 | 0) >> 2] | 0) + $806 | 0;
      }
      label$57 : {
       if (!($32() | 0)) {
        break label$57
       }
       if (!((((HEAPU8[($10_1 + 530 | 0) >> 0] | 0) & 255 | 0) + ((HEAPU8[($10_1 + 531 | 0) >> 0] | 0) & 255 | 0) | 0 | 0) >= (20 | 0) & 1 | 0)) {
        break label$57
       }
       $17(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0) | 0;
      }
      label$58 : {
       if (!($29() | 0)) {
        break label$58
       }
       if (!(((HEAPU8[($10_1 + 528 | 0) >> 0] | 0) & 255 | 0 | 0) >= (31 | 0) & 1 | 0)) {
        break label$58
       }
       $17(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0) | 0;
      }
      HEAP32[($10_1 + 80 | 0) >> 2] = HEAP32[($10_1 + 540 | 0) >> 2] | 0;
      label$59 : {
       if (!(((HEAPU8[($10_1 + 531 | 0) >> 0] | 0) & 255 | 0 | 0) > (0 | 0) & 1 | 0)) {
        break label$59
       }
       $849 = $134(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0, (HEAPU8[($10_1 + 531 | 0) >> 0] | 0) & 255 | 0 | 0) | 0;
       HEAP32[($10_1 + 80 | 0) >> 2] = (HEAP32[($10_1 + 80 | 0) >> 2] | 0) + $849 | 0;
      }
      label$60 : {
       if (!($32() | 0)) {
        break label$60
       }
       $17(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0) | 0;
      }
      label$61 : {
       if (!((HEAP32[($10_1 + 572 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
        break label$61
       }
       HEAP32[($10_1 + 508 | 0) >> 2] = (HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 64 | 0) >> 2] | 0) + (HEAP32[($10_1 + 80 | 0) >> 2] | 0) | 0;
       label$62 : {
        label$63 : {
         if (!((HEAP32[($10_1 + 88 | 0) >> 2] | 0) >>> 0 > (HEAP32[($10_1 + 508 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
          break label$63
         }
         $874 = HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 60 | 0) >> 2] | 0;
         break label$62;
        }
        $874 = HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 56 | 0) >> 2] | 0;
       }
       HEAP32[($10_1 + 504 | 0) >> 2] = $874;
       HEAP32[($10_1 + 92 | 0) >> 2] = ((HEAP32[($10_1 + 504 | 0) >> 2] | 0) + (HEAP32[($10_1 + 508 | 0) >> 2] | 0) | 0) + (0 - (HEAP32[($10_1 + 88 | 0) >> 2] | 0) | 0) | 0;
       HEAP32[((HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 64 | 0) >> 2] = (HEAP32[($10_1 + 508 | 0) >> 2] | 0) + (HEAP32[($10_1 + 84 | 0) >> 2] | 0) | 0;
      }
      HEAP32[($10_1 + 500 | 0) >> 2] = 0;
      $904 = (HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 20 | 0;
      $905 = HEAP32[($10_1 + 580 | 0) >> 2] | 0;
      i64toi32_i32$2 = $10_1 + 560 | 0;
      i64toi32_i32$1 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$0 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $3959 = i64toi32_i32$1;
      i64toi32_i32$1 = $10_1 + 584 | 0;
      $150_1 = $3959;
      HEAP8[i64toi32_i32$1 >> 0] = $150_1;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $150_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $150_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $150_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      HEAP32[($10_1 + 604 | 0) >> 2] = $904;
      HEAP32[($10_1 + 600 | 0) >> 2] = $905;
      HEAP32[($10_1 + 596 | 0) >> 2] = (HEAPU8[($10_1 + 587 | 0) >> 0] | 0) & 255 | 0;
      HEAP32[($10_1 + 592 | 0) >> 2] = $133(HEAP32[($10_1 + 600 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 596 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[(HEAP32[($10_1 + 604 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($10_1 + 584 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($10_1 + 592 | 0) >> 2] | 0) | 0;
      $920 = (HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 36 | 0;
      $921 = HEAP32[($10_1 + 580 | 0) >> 2] | 0;
      i64toi32_i32$2 = $10_1 + 552 | 0;
      i64toi32_i32$0 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$1 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $4004 = i64toi32_i32$0;
      i64toi32_i32$0 = $10_1 + 608 | 0;
      $151_1 = $4004;
      HEAP8[i64toi32_i32$0 >> 0] = $151_1;
      HEAP8[(i64toi32_i32$0 + 1 | 0) >> 0] = $151_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 2 | 0) >> 0] = $151_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 3 | 0) >> 0] = $151_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$0 + 4 | 0) >> 0] = i64toi32_i32$1;
      HEAP8[(i64toi32_i32$0 + 5 | 0) >> 0] = i64toi32_i32$1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 6 | 0) >> 0] = i64toi32_i32$1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 7 | 0) >> 0] = i64toi32_i32$1 >>> 24 | 0;
      HEAP32[($10_1 + 628 | 0) >> 2] = $920;
      HEAP32[($10_1 + 624 | 0) >> 2] = $921;
      HEAP32[($10_1 + 620 | 0) >> 2] = (HEAPU8[($10_1 + 611 | 0) >> 0] | 0) & 255 | 0;
      HEAP32[($10_1 + 616 | 0) >> 2] = $133(HEAP32[($10_1 + 624 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 620 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[(HEAP32[($10_1 + 628 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($10_1 + 608 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($10_1 + 616 | 0) >> 2] | 0) | 0;
      label$64 : {
       if (!($32() | 0)) {
        break label$64
       }
       $17(HEAP32[($10_1 + 580 | 0) >> 2] | 0 | 0) | 0;
      }
      $943 = $10_1 + 656 | 0;
      $955 = (HEAP32[($10_1 + 580 | 0) >> 2] | 0) + 28 | 0;
      $956 = HEAP32[($10_1 + 580 | 0) >> 2] | 0;
      i64toi32_i32$2 = $10_1 + 544 | 0;
      i64toi32_i32$1 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$0 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $4076 = i64toi32_i32$1;
      i64toi32_i32$1 = $10_1 + 632 | 0;
      $152_1 = $4076;
      HEAP8[i64toi32_i32$1 >> 0] = $152_1;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $152_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $152_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $152_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      HEAP32[($10_1 + 652 | 0) >> 2] = $955;
      HEAP32[($10_1 + 648 | 0) >> 2] = $956;
      HEAP32[($10_1 + 644 | 0) >> 2] = (HEAPU8[($10_1 + 635 | 0) >> 0] | 0) & 255 | 0;
      HEAP32[($10_1 + 640 | 0) >> 2] = $133(HEAP32[($10_1 + 648 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 644 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[(HEAP32[($10_1 + 652 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($10_1 + 632 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($10_1 + 640 | 0) >> 2] | 0) | 0;
      $969 = HEAP32[($10_1 + 284 | 0) >> 2] | 0;
      $970 = HEAP32[($10_1 + 288 | 0) >> 2] | 0;
      $979 = HEAP32[($10_1 + 276 | 0) >> 2] | 0;
      $980 = HEAP32[($10_1 + 272 | 0) >> 2] | 0;
      $981 = HEAP32[($10_1 + 268 | 0) >> 2] | 0;
      $982 = HEAP32[($10_1 + 264 | 0) >> 2] | 0;
      i64toi32_i32$2 = ($10_1 + 192 | 0) + ((((HEAP32[($10_1 + 116 | 0) >> 2] | 0) - 4 | 0) & 3 | 0) << 4 | 0) | 0;
      i64toi32_i32$0 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$1 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $4140 = i64toi32_i32$0;
      i64toi32_i32$0 = $943;
      $153_1 = $4140;
      HEAP8[i64toi32_i32$0 >> 0] = $153_1;
      HEAP8[(i64toi32_i32$0 + 1 | 0) >> 0] = $153_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 2 | 0) >> 0] = $153_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 3 | 0) >> 0] = $153_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$0 + 4 | 0) >> 0] = i64toi32_i32$1;
      HEAP8[(i64toi32_i32$0 + 5 | 0) >> 0] = i64toi32_i32$1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 6 | 0) >> 0] = i64toi32_i32$1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 7 | 0) >> 0] = i64toi32_i32$1 >>> 24 | 0;
      $983 = 8;
      i64toi32_i32$2 = i64toi32_i32$2 + $983 | 0;
      i64toi32_i32$1 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$0 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $4150 = i64toi32_i32$1;
      i64toi32_i32$1 = $943 + $983 | 0;
      $156_1 = $4150;
      HEAP8[i64toi32_i32$1 >> 0] = $156_1;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $156_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $156_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $156_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      HEAP32[($10_1 + 728 | 0) >> 2] = $969;
      HEAP32[($10_1 + 724 | 0) >> 2] = $970;
      HEAP32[($10_1 + 720 | 0) >> 2] = $10_1 + 280 | 0;
      HEAP32[($10_1 + 716 | 0) >> 2] = $979;
      HEAP32[($10_1 + 712 | 0) >> 2] = $980;
      HEAP32[($10_1 + 708 | 0) >> 2] = $981;
      HEAP32[($10_1 + 704 | 0) >> 2] = $982;
      HEAP32[($10_1 + 700 | 0) >> 2] = (HEAP32[($10_1 + 728 | 0) >> 2] | 0) + (HEAP32[($10_1 + 656 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 696 | 0) >> 2] = (HEAP32[($10_1 + 656 | 0) >> 2] | 0) + (HEAP32[($10_1 + 660 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 692 | 0) >> 2] = (HEAP32[($10_1 + 728 | 0) >> 2] | 0) + (HEAP32[($10_1 + 696 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 688 | 0) >> 2] = (HEAP32[($10_1 + 724 | 0) >> 2] | 0) + -32 | 0;
      HEAP32[($10_1 + 684 | 0) >> 2] = (HEAP32[(HEAP32[($10_1 + 720 | 0) >> 2] | 0) >> 2] | 0) + (HEAP32[($10_1 + 656 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 680 | 0) >> 2] = (HEAP32[($10_1 + 700 | 0) >> 2] | 0) + (0 - (HEAP32[($10_1 + 664 | 0) >> 2] | 0) | 0) | 0;
      $1013 = 1;
      label$65 : {
       if ((HEAP32[($10_1 + 684 | 0) >> 2] | 0) >>> 0 > (HEAP32[($10_1 + 716 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
        break label$65
       }
       $1013 = 1;
       if ((HEAP32[($10_1 + 692 | 0) >> 2] | 0) >>> 0 > (HEAP32[($10_1 + 688 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
        break label$65
       }
       $1024 = 0;
       label$66 : {
        if (!($32() | 0)) {
         break label$66
        }
        $1024 = ((HEAP32[($10_1 + 724 | 0) >> 2] | 0) - (HEAP32[($10_1 + 728 | 0) >> 2] | 0) | 0) >>> 0 < ((HEAP32[($10_1 + 696 | 0) >> 2] | 0) + 32 | 0) >>> 0;
       }
       $1013 = $1024;
      }
      label$67 : {
       label$68 : {
        if (!($1013 & 1 | 0)) {
         break label$68
        }
        $1038 = HEAP32[($10_1 + 728 | 0) >> 2] | 0;
        $1039 = HEAP32[($10_1 + 724 | 0) >> 2] | 0;
        $1040 = HEAP32[($10_1 + 720 | 0) >> 2] | 0;
        $1041 = HEAP32[($10_1 + 716 | 0) >> 2] | 0;
        $1042 = HEAP32[($10_1 + 712 | 0) >> 2] | 0;
        $1043 = HEAP32[($10_1 + 708 | 0) >> 2] | 0;
        $1044 = HEAP32[($10_1 + 704 | 0) >> 2] | 0;
        $1045 = 8;
        i64toi32_i32$2 = ($10_1 + 656 | 0) + $1045 | 0;
        i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        $4306 = i64toi32_i32$0;
        i64toi32_i32$0 = $10_1 + $1045 | 0;
        HEAP32[i64toi32_i32$0 >> 2] = $4306;
        HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
        i64toi32_i32$2 = $10_1;
        i64toi32_i32$1 = HEAP32[($10_1 + 656 | 0) >> 2] | 0;
        i64toi32_i32$0 = HEAP32[($10_1 + 660 | 0) >> 2] | 0;
        $4310 = i64toi32_i32$1;
        i64toi32_i32$1 = $10_1;
        HEAP32[$10_1 >> 2] = $4310;
        HEAP32[($10_1 + 4 | 0) >> 2] = i64toi32_i32$0;
        HEAP32[($10_1 + 732 | 0) >> 2] = $139($1038 | 0, $1039 | 0, $10_1 | 0, $1040 | 0, $1041 | 0, $1042 | 0, $1043 | 0, $1044 | 0) | 0;
        break label$67;
       }
       $140(HEAP32[($10_1 + 728 | 0) >> 2] | 0 | 0, HEAP32[(HEAP32[($10_1 + 720 | 0) >> 2] | 0) >> 2] | 0 | 0);
       label$69 : {
        if (!((HEAP32[($10_1 + 656 | 0) >> 2] | 0) >>> 0 > 16 >>> 0 & 1 | 0)) {
         break label$69
        }
        $1069 = (HEAP32[(HEAP32[($10_1 + 720 | 0) >> 2] | 0) >> 2] | 0) + 16 | 0;
        $1072 = (HEAP32[($10_1 + 656 | 0) >> 2] | 0) - 16 | 0;
        HEAP32[($10_1 + 764 | 0) >> 2] = (HEAP32[($10_1 + 728 | 0) >> 2] | 0) + 16 | 0;
        HEAP32[($10_1 + 760 | 0) >> 2] = $1069;
        HEAP32[($10_1 + 756 | 0) >> 2] = $1072;
        HEAP32[($10_1 + 752 | 0) >> 2] = 0;
        HEAP32[($10_1 + 748 | 0) >> 2] = (HEAP32[($10_1 + 764 | 0) >> 2] | 0) - (HEAP32[($10_1 + 760 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 744 | 0) >> 2] = HEAP32[($10_1 + 760 | 0) >> 2] | 0;
        HEAP32[($10_1 + 740 | 0) >> 2] = HEAP32[($10_1 + 764 | 0) >> 2] | 0;
        HEAP32[($10_1 + 736 | 0) >> 2] = (HEAP32[($10_1 + 740 | 0) >> 2] | 0) + (HEAP32[($10_1 + 756 | 0) >> 2] | 0) | 0;
        label$70 : {
         label$71 : {
          if (!((HEAP32[($10_1 + 752 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$71
          }
          if (!((HEAP32[($10_1 + 748 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
           break label$71
          }
          label$72 : while (1) {
           $141(HEAP32[($10_1 + 740 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 744 | 0) >> 2] | 0 | 0);
           HEAP32[($10_1 + 740 | 0) >> 2] = (HEAP32[($10_1 + 740 | 0) >> 2] | 0) + 8 | 0;
           HEAP32[($10_1 + 744 | 0) >> 2] = (HEAP32[($10_1 + 744 | 0) >> 2] | 0) + 8 | 0;
           if ((HEAP32[($10_1 + 740 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 736 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
            continue label$72
           }
           break label$72;
          };
          break label$70;
         }
         label$73 : while (1) {
          $140(HEAP32[($10_1 + 740 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 744 | 0) >> 2] | 0 | 0);
          HEAP32[($10_1 + 740 | 0) >> 2] = (HEAP32[($10_1 + 740 | 0) >> 2] | 0) + 16 | 0;
          HEAP32[($10_1 + 744 | 0) >> 2] = (HEAP32[($10_1 + 744 | 0) >> 2] | 0) + 16 | 0;
          if ((HEAP32[($10_1 + 740 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 736 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
           continue label$73
          }
          break label$73;
         };
        }
       }
       HEAP32[($10_1 + 728 | 0) >> 2] = HEAP32[($10_1 + 700 | 0) >> 2] | 0;
       HEAP32[(HEAP32[($10_1 + 720 | 0) >> 2] | 0) >> 2] = HEAP32[($10_1 + 684 | 0) >> 2] | 0;
       label$74 : {
        if (!((HEAP32[($10_1 + 664 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 700 | 0) >> 2] | 0) - (HEAP32[($10_1 + 712 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
         break label$74
        }
        label$75 : {
         if (!((HEAP32[($10_1 + 664 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 700 | 0) >> 2] | 0) - (HEAP32[($10_1 + 708 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
          break label$75
         }
         HEAP32[($10_1 + 732 | 0) >> 2] = -20;
         break label$67;
        }
        HEAP32[($10_1 + 680 | 0) >> 2] = (HEAP32[($10_1 + 704 | 0) >> 2] | 0) + ((HEAP32[($10_1 + 680 | 0) >> 2] | 0) - (HEAP32[($10_1 + 712 | 0) >> 2] | 0) | 0) | 0;
        label$76 : {
         if (!(((HEAP32[($10_1 + 680 | 0) >> 2] | 0) + (HEAP32[($10_1 + 660 | 0) >> 2] | 0) | 0) >>> 0 <= (HEAP32[($10_1 + 704 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
          break label$76
         }
         $155(HEAP32[($10_1 + 700 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 680 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 660 | 0) >> 2] | 0 | 0) | 0;
         HEAP32[($10_1 + 732 | 0) >> 2] = HEAP32[($10_1 + 696 | 0) >> 2] | 0;
         break label$67;
        }
        HEAP32[($10_1 + 676 | 0) >> 2] = (HEAP32[($10_1 + 704 | 0) >> 2] | 0) - (HEAP32[($10_1 + 680 | 0) >> 2] | 0) | 0;
        $155(HEAP32[($10_1 + 700 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 680 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 676 | 0) >> 2] | 0 | 0) | 0;
        HEAP32[($10_1 + 728 | 0) >> 2] = (HEAP32[($10_1 + 700 | 0) >> 2] | 0) + (HEAP32[($10_1 + 676 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 660 | 0) >> 2] = (HEAP32[($10_1 + 660 | 0) >> 2] | 0) - (HEAP32[($10_1 + 676 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 680 | 0) >> 2] = HEAP32[($10_1 + 712 | 0) >> 2] | 0;
       }
       label$77 : {
        if (!((HEAP32[($10_1 + 664 | 0) >> 2] | 0) >>> 0 >= 16 >>> 0 & 1 | 0)) {
         break label$77
        }
        $1187 = HEAP32[($10_1 + 680 | 0) >> 2] | 0;
        $1188 = HEAP32[($10_1 + 660 | 0) >> 2] | 0;
        HEAP32[($10_1 + 796 | 0) >> 2] = HEAP32[($10_1 + 728 | 0) >> 2] | 0;
        HEAP32[($10_1 + 792 | 0) >> 2] = $1187;
        HEAP32[($10_1 + 788 | 0) >> 2] = $1188;
        HEAP32[($10_1 + 784 | 0) >> 2] = 0;
        HEAP32[($10_1 + 780 | 0) >> 2] = (HEAP32[($10_1 + 796 | 0) >> 2] | 0) - (HEAP32[($10_1 + 792 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 776 | 0) >> 2] = HEAP32[($10_1 + 792 | 0) >> 2] | 0;
        HEAP32[($10_1 + 772 | 0) >> 2] = HEAP32[($10_1 + 796 | 0) >> 2] | 0;
        HEAP32[($10_1 + 768 | 0) >> 2] = (HEAP32[($10_1 + 772 | 0) >> 2] | 0) + (HEAP32[($10_1 + 788 | 0) >> 2] | 0) | 0;
        label$78 : {
         label$79 : {
          if (!((HEAP32[($10_1 + 784 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$79
          }
          if (!((HEAP32[($10_1 + 780 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
           break label$79
          }
          label$80 : while (1) {
           $141(HEAP32[($10_1 + 772 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 776 | 0) >> 2] | 0 | 0);
           HEAP32[($10_1 + 772 | 0) >> 2] = (HEAP32[($10_1 + 772 | 0) >> 2] | 0) + 8 | 0;
           HEAP32[($10_1 + 776 | 0) >> 2] = (HEAP32[($10_1 + 776 | 0) >> 2] | 0) + 8 | 0;
           if ((HEAP32[($10_1 + 772 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 768 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
            continue label$80
           }
           break label$80;
          };
          break label$78;
         }
         label$81 : while (1) {
          $140(HEAP32[($10_1 + 772 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 776 | 0) >> 2] | 0 | 0);
          HEAP32[($10_1 + 772 | 0) >> 2] = (HEAP32[($10_1 + 772 | 0) >> 2] | 0) + 16 | 0;
          HEAP32[($10_1 + 776 | 0) >> 2] = (HEAP32[($10_1 + 776 | 0) >> 2] | 0) + 16 | 0;
          if ((HEAP32[($10_1 + 772 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 768 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
           continue label$81
          }
          break label$81;
         };
        }
        HEAP32[($10_1 + 732 | 0) >> 2] = HEAP32[($10_1 + 696 | 0) >> 2] | 0;
        break label$67;
       }
       $1248 = HEAP32[($10_1 + 664 | 0) >> 2] | 0;
       HEAP32[($10_1 + 812 | 0) >> 2] = $10_1 + 728 | 0;
       HEAP32[($10_1 + 808 | 0) >> 2] = $10_1 + 680 | 0;
       HEAP32[($10_1 + 804 | 0) >> 2] = $1248;
       label$82 : {
        label$83 : {
         if (!((HEAP32[($10_1 + 804 | 0) >> 2] | 0) >>> 0 < 8 >>> 0 & 1 | 0)) {
          break label$83
         }
         HEAP32[($10_1 + 800 | 0) >> 2] = HEAP32[(3952 + ((HEAP32[($10_1 + 804 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
         HEAP8[(HEAP32[(HEAP32[($10_1 + 812 | 0) >> 2] | 0) >> 2] | 0) >> 0] = HEAPU8[(HEAP32[(HEAP32[($10_1 + 808 | 0) >> 2] | 0) >> 2] | 0) >> 0] | 0;
         HEAP8[((HEAP32[(HEAP32[($10_1 + 812 | 0) >> 2] | 0) >> 2] | 0) + 1 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($10_1 + 808 | 0) >> 2] | 0) >> 2] | 0) + 1 | 0) >> 0] | 0;
         HEAP8[((HEAP32[(HEAP32[($10_1 + 812 | 0) >> 2] | 0) >> 2] | 0) + 2 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($10_1 + 808 | 0) >> 2] | 0) >> 2] | 0) + 2 | 0) >> 0] | 0;
         HEAP8[((HEAP32[(HEAP32[($10_1 + 812 | 0) >> 2] | 0) >> 2] | 0) + 3 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($10_1 + 808 | 0) >> 2] | 0) >> 2] | 0) + 3 | 0) >> 0] | 0;
         $1288 = HEAP32[($10_1 + 808 | 0) >> 2] | 0;
         HEAP32[$1288 >> 2] = (HEAP32[$1288 >> 2] | 0) + (HEAP32[(3920 + ((HEAP32[($10_1 + 804 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) | 0;
         $142((HEAP32[(HEAP32[($10_1 + 812 | 0) >> 2] | 0) >> 2] | 0) + 4 | 0 | 0, HEAP32[(HEAP32[($10_1 + 808 | 0) >> 2] | 0) >> 2] | 0 | 0);
         $1298 = HEAP32[($10_1 + 808 | 0) >> 2] | 0;
         HEAP32[$1298 >> 2] = (HEAP32[$1298 >> 2] | 0) + (0 - (HEAP32[($10_1 + 800 | 0) >> 2] | 0) | 0) | 0;
         break label$82;
        }
        $141(HEAP32[(HEAP32[($10_1 + 812 | 0) >> 2] | 0) >> 2] | 0 | 0, HEAP32[(HEAP32[($10_1 + 808 | 0) >> 2] | 0) >> 2] | 0 | 0);
       }
       $1307 = HEAP32[($10_1 + 808 | 0) >> 2] | 0;
       HEAP32[$1307 >> 2] = (HEAP32[$1307 >> 2] | 0) + 8 | 0;
       $1311 = HEAP32[($10_1 + 812 | 0) >> 2] | 0;
       HEAP32[$1311 >> 2] = (HEAP32[$1311 >> 2] | 0) + 8 | 0;
       label$84 : {
        if (!((HEAP32[($10_1 + 660 | 0) >> 2] | 0) >>> 0 > 8 >>> 0 & 1 | 0)) {
         break label$84
        }
        $1321 = 1;
        $1323 = HEAP32[($10_1 + 680 | 0) >> 2] | 0;
        $1326 = (HEAP32[($10_1 + 660 | 0) >> 2] | 0) - 8 | 0;
        HEAP32[($10_1 + 844 | 0) >> 2] = HEAP32[($10_1 + 728 | 0) >> 2] | 0;
        HEAP32[($10_1 + 840 | 0) >> 2] = $1323;
        HEAP32[($10_1 + 836 | 0) >> 2] = $1326;
        HEAP32[($10_1 + 832 | 0) >> 2] = $1321;
        HEAP32[($10_1 + 828 | 0) >> 2] = (HEAP32[($10_1 + 844 | 0) >> 2] | 0) - (HEAP32[($10_1 + 840 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 824 | 0) >> 2] = HEAP32[($10_1 + 840 | 0) >> 2] | 0;
        HEAP32[($10_1 + 820 | 0) >> 2] = HEAP32[($10_1 + 844 | 0) >> 2] | 0;
        HEAP32[($10_1 + 816 | 0) >> 2] = (HEAP32[($10_1 + 820 | 0) >> 2] | 0) + (HEAP32[($10_1 + 836 | 0) >> 2] | 0) | 0;
        label$85 : {
         label$86 : {
          if (!((HEAP32[($10_1 + 832 | 0) >> 2] | 0 | 0) == ($1321 | 0) & 1 | 0)) {
           break label$86
          }
          if (!((HEAP32[($10_1 + 828 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
           break label$86
          }
          label$87 : while (1) {
           $141(HEAP32[($10_1 + 820 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 824 | 0) >> 2] | 0 | 0);
           HEAP32[($10_1 + 820 | 0) >> 2] = (HEAP32[($10_1 + 820 | 0) >> 2] | 0) + 8 | 0;
           HEAP32[($10_1 + 824 | 0) >> 2] = (HEAP32[($10_1 + 824 | 0) >> 2] | 0) + 8 | 0;
           if ((HEAP32[($10_1 + 820 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 816 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
            continue label$87
           }
           break label$87;
          };
          break label$85;
         }
         label$88 : while (1) {
          $140(HEAP32[($10_1 + 820 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 824 | 0) >> 2] | 0 | 0);
          HEAP32[($10_1 + 820 | 0) >> 2] = (HEAP32[($10_1 + 820 | 0) >> 2] | 0) + 16 | 0;
          HEAP32[($10_1 + 824 | 0) >> 2] = (HEAP32[($10_1 + 824 | 0) >> 2] | 0) + 16 | 0;
          if ((HEAP32[($10_1 + 820 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 816 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
           continue label$88
          }
          break label$88;
         };
        }
       }
       HEAP32[($10_1 + 732 | 0) >> 2] = HEAP32[($10_1 + 696 | 0) >> 2] | 0;
      }
      HEAP32[($10_1 + 76 | 0) >> 2] = HEAP32[($10_1 + 732 | 0) >> 2] | 0;
      label$89 : {
       if (!($22(HEAP32[($10_1 + 76 | 0) >> 2] | 0 | 0) | 0)) {
        break label$89
       }
       HEAP32[($10_1 + 336 | 0) >> 2] = HEAP32[($10_1 + 76 | 0) >> 2] | 0;
       break label$3;
      }
      HEAP32[($10_1 + 92 | 0) >> 2] | 0;
      (HEAP32[($10_1 + 92 | 0) >> 2] | 0) + (HEAP32[($10_1 + 84 | 0) >> 2] | 0) | 0;
      $1398 = ($10_1 + 192 | 0) + (((HEAP32[($10_1 + 116 | 0) >> 2] | 0) & 3 | 0) << 4 | 0) | 0;
      i64toi32_i32$2 = $10_1 + 80 | 0;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $5126 = i64toi32_i32$0;
      i64toi32_i32$0 = $1398;
      HEAP32[i64toi32_i32$0 >> 2] = $5126;
      HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
      $1399 = 8;
      i64toi32_i32$2 = i64toi32_i32$2 + $1399 | 0;
      i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $5136 = i64toi32_i32$1;
      i64toi32_i32$1 = $1398 + $1399 | 0;
      HEAP32[i64toi32_i32$1 >> 2] = $5136;
      HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
      HEAP32[($10_1 + 284 | 0) >> 2] = (HEAP32[($10_1 + 284 | 0) >> 2] | 0) + (HEAP32[($10_1 + 76 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 116 | 0) >> 2] = (HEAP32[($10_1 + 116 | 0) >> 2] | 0) + 1 | 0;
      continue label$38;
     }
     break label$38;
    };
    label$90 : {
     if (!((HEAP32[($10_1 + 116 | 0) >> 2] | 0 | 0) < (HEAP32[($10_1 + 312 | 0) >> 2] | 0 | 0) & 1 | 0)) {
      break label$90
     }
     HEAP32[($10_1 + 336 | 0) >> 2] = -20;
     break label$3;
    }
    HEAP32[($10_1 + 116 | 0) >> 2] = (HEAP32[($10_1 + 116 | 0) >> 2] | 0) - (HEAP32[($10_1 + 188 | 0) >> 2] | 0) | 0;
    label$91 : {
     label$92 : while (1) {
      if (!((HEAP32[($10_1 + 116 | 0) >> 2] | 0 | 0) < (HEAP32[($10_1 + 312 | 0) >> 2] | 0 | 0) & 1 | 0)) {
       break label$91
      }
      $1433 = $10_1 + 848 | 0;
      $1437 = HEAP32[($10_1 + 284 | 0) >> 2] | 0;
      $1438 = HEAP32[($10_1 + 288 | 0) >> 2] | 0;
      $1445 = HEAP32[($10_1 + 276 | 0) >> 2] | 0;
      $1446 = HEAP32[($10_1 + 272 | 0) >> 2] | 0;
      $1447 = HEAP32[($10_1 + 268 | 0) >> 2] | 0;
      $1448 = HEAP32[($10_1 + 264 | 0) >> 2] | 0;
      i64toi32_i32$2 = ($10_1 + 192 | 0) + (((HEAP32[($10_1 + 116 | 0) >> 2] | 0) & 3 | 0) << 4 | 0) | 0;
      i64toi32_i32$0 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$1 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $5230 = i64toi32_i32$0;
      i64toi32_i32$0 = $1433;
      $157_1 = $5230;
      HEAP8[i64toi32_i32$0 >> 0] = $157_1;
      HEAP8[(i64toi32_i32$0 + 1 | 0) >> 0] = $157_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 2 | 0) >> 0] = $157_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 3 | 0) >> 0] = $157_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$0 + 4 | 0) >> 0] = i64toi32_i32$1;
      HEAP8[(i64toi32_i32$0 + 5 | 0) >> 0] = i64toi32_i32$1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 6 | 0) >> 0] = i64toi32_i32$1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 7 | 0) >> 0] = i64toi32_i32$1 >>> 24 | 0;
      $1449 = 8;
      i64toi32_i32$2 = i64toi32_i32$2 + $1449 | 0;
      i64toi32_i32$1 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$0 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $5240 = i64toi32_i32$1;
      i64toi32_i32$1 = $1433 + $1449 | 0;
      $158_1 = $5240;
      HEAP8[i64toi32_i32$1 >> 0] = $158_1;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $158_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $158_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $158_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      HEAP32[($10_1 + 920 | 0) >> 2] = $1437;
      HEAP32[($10_1 + 916 | 0) >> 2] = $1438;
      HEAP32[($10_1 + 912 | 0) >> 2] = $10_1 + 280 | 0;
      HEAP32[($10_1 + 908 | 0) >> 2] = $1445;
      HEAP32[($10_1 + 904 | 0) >> 2] = $1446;
      HEAP32[($10_1 + 900 | 0) >> 2] = $1447;
      HEAP32[($10_1 + 896 | 0) >> 2] = $1448;
      HEAP32[($10_1 + 892 | 0) >> 2] = (HEAP32[($10_1 + 920 | 0) >> 2] | 0) + (HEAP32[($10_1 + 848 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 888 | 0) >> 2] = (HEAP32[($10_1 + 848 | 0) >> 2] | 0) + (HEAP32[($10_1 + 852 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 884 | 0) >> 2] = (HEAP32[($10_1 + 920 | 0) >> 2] | 0) + (HEAP32[($10_1 + 888 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 880 | 0) >> 2] = (HEAP32[($10_1 + 916 | 0) >> 2] | 0) + -32 | 0;
      HEAP32[($10_1 + 876 | 0) >> 2] = (HEAP32[(HEAP32[($10_1 + 912 | 0) >> 2] | 0) >> 2] | 0) + (HEAP32[($10_1 + 848 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 872 | 0) >> 2] = (HEAP32[($10_1 + 892 | 0) >> 2] | 0) + (0 - (HEAP32[($10_1 + 856 | 0) >> 2] | 0) | 0) | 0;
      $1479 = 1;
      label$93 : {
       if ((HEAP32[($10_1 + 876 | 0) >> 2] | 0) >>> 0 > (HEAP32[($10_1 + 908 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
        break label$93
       }
       $1479 = 1;
       if ((HEAP32[($10_1 + 884 | 0) >> 2] | 0) >>> 0 > (HEAP32[($10_1 + 880 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
        break label$93
       }
       $1490 = 0;
       label$94 : {
        if (!($32() | 0)) {
         break label$94
        }
        $1490 = ((HEAP32[($10_1 + 916 | 0) >> 2] | 0) - (HEAP32[($10_1 + 920 | 0) >> 2] | 0) | 0) >>> 0 < ((HEAP32[($10_1 + 888 | 0) >> 2] | 0) + 32 | 0) >>> 0;
       }
       $1479 = $1490;
      }
      label$95 : {
       label$96 : {
        if (!($1479 & 1 | 0)) {
         break label$96
        }
        $1504 = HEAP32[($10_1 + 920 | 0) >> 2] | 0;
        $1505 = HEAP32[($10_1 + 916 | 0) >> 2] | 0;
        $1506 = HEAP32[($10_1 + 912 | 0) >> 2] | 0;
        $1507 = HEAP32[($10_1 + 908 | 0) >> 2] | 0;
        $1508 = HEAP32[($10_1 + 904 | 0) >> 2] | 0;
        $1509 = HEAP32[($10_1 + 900 | 0) >> 2] | 0;
        $1510 = HEAP32[($10_1 + 896 | 0) >> 2] | 0;
        $1511 = 8;
        i64toi32_i32$2 = ($10_1 + 848 | 0) + $1511 | 0;
        i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        $5399 = i64toi32_i32$0;
        i64toi32_i32$0 = ($10_1 + 16 | 0) + $1511 | 0;
        HEAP32[i64toi32_i32$0 >> 2] = $5399;
        HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
        i64toi32_i32$2 = $10_1;
        i64toi32_i32$1 = HEAP32[($10_1 + 848 | 0) >> 2] | 0;
        i64toi32_i32$0 = HEAP32[($10_1 + 852 | 0) >> 2] | 0;
        $5403 = i64toi32_i32$1;
        i64toi32_i32$1 = $10_1;
        HEAP32[($10_1 + 16 | 0) >> 2] = $5403;
        HEAP32[($10_1 + 20 | 0) >> 2] = i64toi32_i32$0;
        HEAP32[($10_1 + 924 | 0) >> 2] = $139($1504 | 0, $1505 | 0, $10_1 + 16 | 0 | 0, $1506 | 0, $1507 | 0, $1508 | 0, $1509 | 0, $1510 | 0) | 0;
        break label$95;
       }
       $140(HEAP32[($10_1 + 920 | 0) >> 2] | 0 | 0, HEAP32[(HEAP32[($10_1 + 912 | 0) >> 2] | 0) >> 2] | 0 | 0);
       label$97 : {
        if (!((HEAP32[($10_1 + 848 | 0) >> 2] | 0) >>> 0 > 16 >>> 0 & 1 | 0)) {
         break label$97
        }
        $1539 = (HEAP32[(HEAP32[($10_1 + 912 | 0) >> 2] | 0) >> 2] | 0) + 16 | 0;
        $1542 = (HEAP32[($10_1 + 848 | 0) >> 2] | 0) - 16 | 0;
        HEAP32[($10_1 + 956 | 0) >> 2] = (HEAP32[($10_1 + 920 | 0) >> 2] | 0) + 16 | 0;
        HEAP32[($10_1 + 952 | 0) >> 2] = $1539;
        HEAP32[($10_1 + 948 | 0) >> 2] = $1542;
        HEAP32[($10_1 + 944 | 0) >> 2] = 0;
        HEAP32[($10_1 + 940 | 0) >> 2] = (HEAP32[($10_1 + 956 | 0) >> 2] | 0) - (HEAP32[($10_1 + 952 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 936 | 0) >> 2] = HEAP32[($10_1 + 952 | 0) >> 2] | 0;
        HEAP32[($10_1 + 932 | 0) >> 2] = HEAP32[($10_1 + 956 | 0) >> 2] | 0;
        HEAP32[($10_1 + 928 | 0) >> 2] = (HEAP32[($10_1 + 932 | 0) >> 2] | 0) + (HEAP32[($10_1 + 948 | 0) >> 2] | 0) | 0;
        label$98 : {
         label$99 : {
          if (!((HEAP32[($10_1 + 944 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$99
          }
          if (!((HEAP32[($10_1 + 940 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
           break label$99
          }
          label$100 : while (1) {
           $141(HEAP32[($10_1 + 932 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 936 | 0) >> 2] | 0 | 0);
           HEAP32[($10_1 + 932 | 0) >> 2] = (HEAP32[($10_1 + 932 | 0) >> 2] | 0) + 8 | 0;
           HEAP32[($10_1 + 936 | 0) >> 2] = (HEAP32[($10_1 + 936 | 0) >> 2] | 0) + 8 | 0;
           if ((HEAP32[($10_1 + 932 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 928 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
            continue label$100
           }
           break label$100;
          };
          break label$98;
         }
         label$101 : while (1) {
          $140(HEAP32[($10_1 + 932 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 936 | 0) >> 2] | 0 | 0);
          HEAP32[($10_1 + 932 | 0) >> 2] = (HEAP32[($10_1 + 932 | 0) >> 2] | 0) + 16 | 0;
          HEAP32[($10_1 + 936 | 0) >> 2] = (HEAP32[($10_1 + 936 | 0) >> 2] | 0) + 16 | 0;
          if ((HEAP32[($10_1 + 932 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 928 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
           continue label$101
          }
          break label$101;
         };
        }
       }
       HEAP32[($10_1 + 920 | 0) >> 2] = HEAP32[($10_1 + 892 | 0) >> 2] | 0;
       HEAP32[(HEAP32[($10_1 + 912 | 0) >> 2] | 0) >> 2] = HEAP32[($10_1 + 876 | 0) >> 2] | 0;
       label$102 : {
        if (!((HEAP32[($10_1 + 856 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 892 | 0) >> 2] | 0) - (HEAP32[($10_1 + 904 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
         break label$102
        }
        label$103 : {
         if (!((HEAP32[($10_1 + 856 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 892 | 0) >> 2] | 0) - (HEAP32[($10_1 + 900 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
          break label$103
         }
         HEAP32[($10_1 + 924 | 0) >> 2] = -20;
         break label$95;
        }
        HEAP32[($10_1 + 872 | 0) >> 2] = (HEAP32[($10_1 + 896 | 0) >> 2] | 0) + ((HEAP32[($10_1 + 872 | 0) >> 2] | 0) - (HEAP32[($10_1 + 904 | 0) >> 2] | 0) | 0) | 0;
        label$104 : {
         if (!(((HEAP32[($10_1 + 872 | 0) >> 2] | 0) + (HEAP32[($10_1 + 852 | 0) >> 2] | 0) | 0) >>> 0 <= (HEAP32[($10_1 + 896 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
          break label$104
         }
         $155(HEAP32[($10_1 + 892 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 872 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 852 | 0) >> 2] | 0 | 0) | 0;
         HEAP32[($10_1 + 924 | 0) >> 2] = HEAP32[($10_1 + 888 | 0) >> 2] | 0;
         break label$95;
        }
        HEAP32[($10_1 + 868 | 0) >> 2] = (HEAP32[($10_1 + 896 | 0) >> 2] | 0) - (HEAP32[($10_1 + 872 | 0) >> 2] | 0) | 0;
        $155(HEAP32[($10_1 + 892 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 872 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 868 | 0) >> 2] | 0 | 0) | 0;
        HEAP32[($10_1 + 920 | 0) >> 2] = (HEAP32[($10_1 + 892 | 0) >> 2] | 0) + (HEAP32[($10_1 + 868 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 852 | 0) >> 2] = (HEAP32[($10_1 + 852 | 0) >> 2] | 0) - (HEAP32[($10_1 + 868 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 872 | 0) >> 2] = HEAP32[($10_1 + 904 | 0) >> 2] | 0;
       }
       label$105 : {
        if (!((HEAP32[($10_1 + 856 | 0) >> 2] | 0) >>> 0 >= 16 >>> 0 & 1 | 0)) {
         break label$105
        }
        $1657 = HEAP32[($10_1 + 872 | 0) >> 2] | 0;
        $1658 = HEAP32[($10_1 + 852 | 0) >> 2] | 0;
        HEAP32[($10_1 + 988 | 0) >> 2] = HEAP32[($10_1 + 920 | 0) >> 2] | 0;
        HEAP32[($10_1 + 984 | 0) >> 2] = $1657;
        HEAP32[($10_1 + 980 | 0) >> 2] = $1658;
        HEAP32[($10_1 + 976 | 0) >> 2] = 0;
        HEAP32[($10_1 + 972 | 0) >> 2] = (HEAP32[($10_1 + 988 | 0) >> 2] | 0) - (HEAP32[($10_1 + 984 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 968 | 0) >> 2] = HEAP32[($10_1 + 984 | 0) >> 2] | 0;
        HEAP32[($10_1 + 964 | 0) >> 2] = HEAP32[($10_1 + 988 | 0) >> 2] | 0;
        HEAP32[($10_1 + 960 | 0) >> 2] = (HEAP32[($10_1 + 964 | 0) >> 2] | 0) + (HEAP32[($10_1 + 980 | 0) >> 2] | 0) | 0;
        label$106 : {
         label$107 : {
          if (!((HEAP32[($10_1 + 976 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$107
          }
          if (!((HEAP32[($10_1 + 972 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
           break label$107
          }
          label$108 : while (1) {
           $141(HEAP32[($10_1 + 964 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 968 | 0) >> 2] | 0 | 0);
           HEAP32[($10_1 + 964 | 0) >> 2] = (HEAP32[($10_1 + 964 | 0) >> 2] | 0) + 8 | 0;
           HEAP32[($10_1 + 968 | 0) >> 2] = (HEAP32[($10_1 + 968 | 0) >> 2] | 0) + 8 | 0;
           if ((HEAP32[($10_1 + 964 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 960 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
            continue label$108
           }
           break label$108;
          };
          break label$106;
         }
         label$109 : while (1) {
          $140(HEAP32[($10_1 + 964 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 968 | 0) >> 2] | 0 | 0);
          HEAP32[($10_1 + 964 | 0) >> 2] = (HEAP32[($10_1 + 964 | 0) >> 2] | 0) + 16 | 0;
          HEAP32[($10_1 + 968 | 0) >> 2] = (HEAP32[($10_1 + 968 | 0) >> 2] | 0) + 16 | 0;
          if ((HEAP32[($10_1 + 964 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 960 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
           continue label$109
          }
          break label$109;
         };
        }
        HEAP32[($10_1 + 924 | 0) >> 2] = HEAP32[($10_1 + 888 | 0) >> 2] | 0;
        break label$95;
       }
       $1718 = HEAP32[($10_1 + 856 | 0) >> 2] | 0;
       HEAP32[($10_1 + 1004 | 0) >> 2] = $10_1 + 920 | 0;
       HEAP32[($10_1 + 1e3 | 0) >> 2] = $10_1 + 872 | 0;
       HEAP32[($10_1 + 996 | 0) >> 2] = $1718;
       label$110 : {
        label$111 : {
         if (!((HEAP32[($10_1 + 996 | 0) >> 2] | 0) >>> 0 < 8 >>> 0 & 1 | 0)) {
          break label$111
         }
         HEAP32[($10_1 + 992 | 0) >> 2] = HEAP32[(3952 + ((HEAP32[($10_1 + 996 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
         HEAP8[(HEAP32[(HEAP32[($10_1 + 1004 | 0) >> 2] | 0) >> 2] | 0) >> 0] = HEAPU8[(HEAP32[(HEAP32[($10_1 + 1e3 | 0) >> 2] | 0) >> 2] | 0) >> 0] | 0;
         HEAP8[((HEAP32[(HEAP32[($10_1 + 1004 | 0) >> 2] | 0) >> 2] | 0) + 1 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($10_1 + 1e3 | 0) >> 2] | 0) >> 2] | 0) + 1 | 0) >> 0] | 0;
         HEAP8[((HEAP32[(HEAP32[($10_1 + 1004 | 0) >> 2] | 0) >> 2] | 0) + 2 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($10_1 + 1e3 | 0) >> 2] | 0) >> 2] | 0) + 2 | 0) >> 0] | 0;
         HEAP8[((HEAP32[(HEAP32[($10_1 + 1004 | 0) >> 2] | 0) >> 2] | 0) + 3 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($10_1 + 1e3 | 0) >> 2] | 0) >> 2] | 0) + 3 | 0) >> 0] | 0;
         $1758 = HEAP32[($10_1 + 1e3 | 0) >> 2] | 0;
         HEAP32[$1758 >> 2] = (HEAP32[$1758 >> 2] | 0) + (HEAP32[(3920 + ((HEAP32[($10_1 + 996 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) | 0;
         $142((HEAP32[(HEAP32[($10_1 + 1004 | 0) >> 2] | 0) >> 2] | 0) + 4 | 0 | 0, HEAP32[(HEAP32[($10_1 + 1e3 | 0) >> 2] | 0) >> 2] | 0 | 0);
         $1768 = HEAP32[($10_1 + 1e3 | 0) >> 2] | 0;
         HEAP32[$1768 >> 2] = (HEAP32[$1768 >> 2] | 0) + (0 - (HEAP32[($10_1 + 992 | 0) >> 2] | 0) | 0) | 0;
         break label$110;
        }
        $141(HEAP32[(HEAP32[($10_1 + 1004 | 0) >> 2] | 0) >> 2] | 0 | 0, HEAP32[(HEAP32[($10_1 + 1e3 | 0) >> 2] | 0) >> 2] | 0 | 0);
       }
       $1777 = HEAP32[($10_1 + 1e3 | 0) >> 2] | 0;
       HEAP32[$1777 >> 2] = (HEAP32[$1777 >> 2] | 0) + 8 | 0;
       $1781 = HEAP32[($10_1 + 1004 | 0) >> 2] | 0;
       HEAP32[$1781 >> 2] = (HEAP32[$1781 >> 2] | 0) + 8 | 0;
       label$112 : {
        if (!((HEAP32[($10_1 + 852 | 0) >> 2] | 0) >>> 0 > 8 >>> 0 & 1 | 0)) {
         break label$112
        }
        $1791 = 1;
        $1793 = HEAP32[($10_1 + 872 | 0) >> 2] | 0;
        $1796 = (HEAP32[($10_1 + 852 | 0) >> 2] | 0) - 8 | 0;
        HEAP32[($10_1 + 1036 | 0) >> 2] = HEAP32[($10_1 + 920 | 0) >> 2] | 0;
        HEAP32[($10_1 + 1032 | 0) >> 2] = $1793;
        HEAP32[($10_1 + 1028 | 0) >> 2] = $1796;
        HEAP32[($10_1 + 1024 | 0) >> 2] = $1791;
        HEAP32[($10_1 + 1020 | 0) >> 2] = (HEAP32[($10_1 + 1036 | 0) >> 2] | 0) - (HEAP32[($10_1 + 1032 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 1016 | 0) >> 2] = HEAP32[($10_1 + 1032 | 0) >> 2] | 0;
        HEAP32[($10_1 + 1012 | 0) >> 2] = HEAP32[($10_1 + 1036 | 0) >> 2] | 0;
        HEAP32[($10_1 + 1008 | 0) >> 2] = (HEAP32[($10_1 + 1012 | 0) >> 2] | 0) + (HEAP32[($10_1 + 1028 | 0) >> 2] | 0) | 0;
        label$113 : {
         label$114 : {
          if (!((HEAP32[($10_1 + 1024 | 0) >> 2] | 0 | 0) == ($1791 | 0) & 1 | 0)) {
           break label$114
          }
          if (!((HEAP32[($10_1 + 1020 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
           break label$114
          }
          label$115 : while (1) {
           $141(HEAP32[($10_1 + 1012 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 1016 | 0) >> 2] | 0 | 0);
           HEAP32[($10_1 + 1012 | 0) >> 2] = (HEAP32[($10_1 + 1012 | 0) >> 2] | 0) + 8 | 0;
           HEAP32[($10_1 + 1016 | 0) >> 2] = (HEAP32[($10_1 + 1016 | 0) >> 2] | 0) + 8 | 0;
           if ((HEAP32[($10_1 + 1012 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 1008 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
            continue label$115
           }
           break label$115;
          };
          break label$113;
         }
         label$116 : while (1) {
          $140(HEAP32[($10_1 + 1012 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 1016 | 0) >> 2] | 0 | 0);
          HEAP32[($10_1 + 1012 | 0) >> 2] = (HEAP32[($10_1 + 1012 | 0) >> 2] | 0) + 16 | 0;
          HEAP32[($10_1 + 1016 | 0) >> 2] = (HEAP32[($10_1 + 1016 | 0) >> 2] | 0) + 16 | 0;
          if ((HEAP32[($10_1 + 1012 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 1008 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
           continue label$116
          }
          break label$116;
         };
        }
       }
       HEAP32[($10_1 + 924 | 0) >> 2] = HEAP32[($10_1 + 888 | 0) >> 2] | 0;
      }
      HEAP32[($10_1 + 72 | 0) >> 2] = HEAP32[($10_1 + 924 | 0) >> 2] | 0;
      label$117 : {
       if (!($22(HEAP32[($10_1 + 72 | 0) >> 2] | 0 | 0) | 0)) {
        break label$117
       }
       HEAP32[($10_1 + 336 | 0) >> 2] = HEAP32[($10_1 + 72 | 0) >> 2] | 0;
       break label$3;
      }
      HEAP32[($10_1 + 284 | 0) >> 2] = (HEAP32[($10_1 + 284 | 0) >> 2] | 0) + (HEAP32[($10_1 + 72 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 116 | 0) >> 2] = (HEAP32[($10_1 + 116 | 0) >> 2] | 0) + 1 | 0;
      continue label$92;
     };
    }
    HEAP32[($10_1 + 68 | 0) >> 2] = 0;
    label$118 : {
     label$119 : while (1) {
      if (!((HEAP32[($10_1 + 68 | 0) >> 2] | 0) >>> 0 < 3 >>> 0 & 1 | 0)) {
       break label$118
      }
      HEAP32[((((HEAP32[($10_1 + 332 | 0) >> 2] | 0) + 16 | 0) + 26652 | 0) + ((HEAP32[($10_1 + 68 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] = HEAP32[((($10_1 + 120 | 0) + 44 | 0) + ((HEAP32[($10_1 + 68 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
      HEAP32[($10_1 + 68 | 0) >> 2] = (HEAP32[($10_1 + 68 | 0) >> 2] | 0) + 1 | 0;
      continue label$119;
     };
    }
   }
   HEAP32[($10_1 + 64 | 0) >> 2] = (HEAP32[($10_1 + 276 | 0) >> 2] | 0) - (HEAP32[($10_1 + 280 | 0) >> 2] | 0) | 0;
   label$120 : {
    if (!((HEAP32[($10_1 + 64 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 288 | 0) >> 2] | 0) - (HEAP32[($10_1 + 284 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
     break label$120
    }
    HEAP32[($10_1 + 336 | 0) >> 2] = -70;
    break label$3;
   }
   label$121 : {
    if (!((HEAP32[($10_1 + 284 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
     break label$121
    }
    $153(HEAP32[($10_1 + 284 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 280 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 64 | 0) >> 2] | 0 | 0) | 0;
    HEAP32[($10_1 + 284 | 0) >> 2] = (HEAP32[($10_1 + 284 | 0) >> 2] | 0) + (HEAP32[($10_1 + 64 | 0) >> 2] | 0) | 0;
   }
   HEAP32[($10_1 + 336 | 0) >> 2] = (HEAP32[($10_1 + 284 | 0) >> 2] | 0) - (HEAP32[($10_1 + 292 | 0) >> 2] | 0) | 0;
  }
  $1918 = HEAP32[($10_1 + 336 | 0) >> 2] | 0;
  label$122 : {
   $1922 = $10_1 + 1040 | 0;
   if ($1922 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $1922;
  }
  return $1918 | 0;
 }
 
 function $131($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, $85_1 = 0, $80_1 = 0, $81_1 = 0, $82_1 = 0, $83_1 = 0, $84_1 = 0, $526 = 0, $41_1 = 0, $188 = 0, $276 = 0, $310 = 0, $395 = 0, $467 = 0, $496 = 0, $537 = 0, $558 = 0, $805 = 0, $815 = 0, $824 = 0, $828 = 0, $838 = 0, $909 = 0, $996 = 0, $995 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, $18_1 = 0, $112_1 = 0, $1293 = 0, $1311 = 0, $1329 = 0, $173 = 0, $210 = 0, $327 = 0, $370 = 0, $425 = 0, $426 = 0, $1968 = 0, $441 = 0, $442 = 0, $2013 = 0, $476 = 0, $477 = 0, $2085 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $2135 = 0, $2145 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $2304 = 0, $2308 = 0, $586 = 0, $589 = 0, $704 = 0, $705 = 0, $765 = 0, $840 = 0, $843 = 0, $992 = 0;
  $10_1 = global$0 - 592 | 0;
  label$1 : {
   $995 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $995;
  }
  HEAP32[($10_1 + 56 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 52 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 48 | 0) >> 2] = $2_1;
  HEAP32[($10_1 + 44 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 40 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 36 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 32 | 0) >> 2] = $6_1;
  HEAP32[($10_1 + 28 | 0) >> 2] = $7_1;
  $12_1 = HEAP32[($10_1 + 52 | 0) >> 2] | 0;
  $13_1 = HEAP32[($10_1 + 48 | 0) >> 2] | 0;
  $14_1 = HEAP32[($10_1 + 44 | 0) >> 2] | 0;
  $15_1 = HEAP32[($10_1 + 40 | 0) >> 2] | 0;
  $16_1 = HEAP32[($10_1 + 36 | 0) >> 2] | 0;
  $17_1 = HEAP32[($10_1 + 32 | 0) >> 2] | 0;
  $18_1 = HEAP32[($10_1 + 28 | 0) >> 2] | 0;
  HEAP32[($10_1 + 236 | 0) >> 2] = HEAP32[($10_1 + 56 | 0) >> 2] | 0;
  HEAP32[($10_1 + 232 | 0) >> 2] = $12_1;
  HEAP32[($10_1 + 228 | 0) >> 2] = $13_1;
  HEAP32[($10_1 + 224 | 0) >> 2] = $14_1;
  HEAP32[($10_1 + 220 | 0) >> 2] = $15_1;
  HEAP32[($10_1 + 216 | 0) >> 2] = $16_1;
  HEAP32[($10_1 + 212 | 0) >> 2] = $17_1;
  HEAP32[($10_1 + 208 | 0) >> 2] = $18_1;
  HEAP32[($10_1 + 204 | 0) >> 2] = HEAP32[($10_1 + 224 | 0) >> 2] | 0;
  HEAP32[($10_1 + 200 | 0) >> 2] = (HEAP32[($10_1 + 204 | 0) >> 2] | 0) + (HEAP32[($10_1 + 220 | 0) >> 2] | 0) | 0;
  HEAP32[($10_1 + 196 | 0) >> 2] = HEAP32[($10_1 + 232 | 0) >> 2] | 0;
  HEAP32[($10_1 + 192 | 0) >> 2] = (HEAP32[($10_1 + 196 | 0) >> 2] | 0) + (HEAP32[($10_1 + 228 | 0) >> 2] | 0) | 0;
  HEAP32[($10_1 + 188 | 0) >> 2] = HEAP32[($10_1 + 196 | 0) >> 2] | 0;
  HEAP32[($10_1 + 184 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 236 | 0) >> 2] | 0) + 28912 | 0) >> 2] | 0;
  HEAP32[($10_1 + 180 | 0) >> 2] = (HEAP32[($10_1 + 184 | 0) >> 2] | 0) + (HEAP32[((HEAP32[($10_1 + 236 | 0) >> 2] | 0) + 28928 | 0) >> 2] | 0) | 0;
  HEAP32[($10_1 + 176 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 236 | 0) >> 2] | 0) + 28732 | 0) >> 2] | 0;
  HEAP32[($10_1 + 172 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 236 | 0) >> 2] | 0) + 28736 | 0) >> 2] | 0;
  HEAP32[($10_1 + 168 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 236 | 0) >> 2] | 0) + 28740 | 0) >> 2] | 0;
  label$3 : {
   label$4 : {
    if (!(HEAP32[($10_1 + 216 | 0) >> 2] | 0)) {
     break label$4
    }
    $41_1 = 0;
    HEAP32[($10_1 + 92 | 0) >> 2] = $41_1;
    HEAP32[((HEAP32[($10_1 + 236 | 0) >> 2] | 0) + 28812 | 0) >> 2] = 1;
    HEAP32[($10_1 + 88 | 0) >> 2] = $41_1;
    label$5 : {
     label$6 : while (1) {
      if (!((HEAP32[($10_1 + 88 | 0) >> 2] | 0) >>> 0 < 3 >>> 0 & 1 | 0)) {
       break label$5
      }
      HEAP32[((($10_1 + 96 | 0) + 44 | 0) + ((HEAP32[($10_1 + 88 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] = HEAP32[((((HEAP32[($10_1 + 236 | 0) >> 2] | 0) + 16 | 0) + 26652 | 0) + ((HEAP32[($10_1 + 88 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
      HEAP32[($10_1 + 88 | 0) >> 2] = (HEAP32[($10_1 + 88 | 0) >> 2] | 0) + 1 | 0;
      continue label$6;
     };
    }
    label$7 : {
     if (!($3($15($10_1 + 96 | 0 | 0, HEAP32[($10_1 + 204 | 0) >> 2] | 0 | 0, (HEAP32[($10_1 + 200 | 0) >> 2] | 0) - (HEAP32[($10_1 + 204 | 0) >> 2] | 0) | 0 | 0) | 0 | 0) | 0)) {
      break label$7
     }
     HEAP32[($10_1 + 240 | 0) >> 2] = -20;
     break label$3;
    }
    $85_1 = $10_1 + 96 | 0;
    $138($85_1 + 20 | 0 | 0, $85_1 | 0, HEAP32[(HEAP32[($10_1 + 236 | 0) >> 2] | 0) >> 2] | 0 | 0);
    $138($85_1 + 28 | 0 | 0, $85_1 | 0, HEAP32[((HEAP32[($10_1 + 236 | 0) >> 2] | 0) + 8 | 0) >> 2] | 0 | 0);
    $138($85_1 + 36 | 0 | 0, $85_1 | 0, HEAP32[((HEAP32[($10_1 + 236 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0 | 0);
    label$8 : {
     label$9 : while (1) {
      $112_1 = HEAP32[($10_1 + 212 | 0) >> 2] | 0;
      HEAP32[($10_1 + 324 | 0) >> 2] = $10_1 + 96 | 0;
      HEAP32[($10_1 + 320 | 0) >> 2] = $112_1;
      HEAP32[($10_1 + 316 | 0) >> 2] = 0;
      i64toi32_i32$2 = (HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 24 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 20 | 0) >> 2] | 0) << 3 | 0) | 0;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $1293 = i64toi32_i32$0;
      i64toi32_i32$0 = $10_1 + 304 | 0;
      HEAP32[i64toi32_i32$0 >> 2] = $1293;
      HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
      i64toi32_i32$2 = (HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 40 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 36 | 0) >> 2] | 0) << 3 | 0) | 0;
      i64toi32_i32$1 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $1311 = i64toi32_i32$1;
      i64toi32_i32$1 = $10_1 + 296 | 0;
      HEAP32[i64toi32_i32$1 >> 2] = $1311;
      HEAP32[(i64toi32_i32$1 + 4 | 0) >> 2] = i64toi32_i32$0;
      i64toi32_i32$2 = (HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 32 | 0) >> 2] | 0) + ((HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 28 | 0) >> 2] | 0) << 3 | 0) | 0;
      i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
      $1329 = i64toi32_i32$0;
      i64toi32_i32$0 = $10_1 + 288 | 0;
      HEAP32[i64toi32_i32$0 >> 2] = $1329;
      HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
      HEAP32[($10_1 + 284 | 0) >> 2] = HEAP32[($10_1 + 308 | 0) >> 2] | 0;
      HEAP32[($10_1 + 280 | 0) >> 2] = HEAP32[($10_1 + 300 | 0) >> 2] | 0;
      HEAP32[($10_1 + 276 | 0) >> 2] = HEAP32[($10_1 + 292 | 0) >> 2] | 0;
      HEAP8[($10_1 + 275 | 0) >> 0] = HEAPU8[($10_1 + 306 | 0) >> 0] | 0;
      HEAP8[($10_1 + 274 | 0) >> 0] = HEAPU8[($10_1 + 298 | 0) >> 0] | 0;
      HEAP8[($10_1 + 273 | 0) >> 0] = HEAPU8[($10_1 + 290 | 0) >> 0] | 0;
      HEAP8[($10_1 + 272 | 0) >> 0] = (((HEAPU8[($10_1 + 275 | 0) >> 0] | 0) & 255 | 0) + ((HEAPU8[($10_1 + 274 | 0) >> 0] | 0) & 255 | 0) | 0) + ((HEAPU8[($10_1 + 273 | 0) >> 0] | 0) & 255 | 0) | 0;
      label$10 : {
       label$11 : {
        if (!(((HEAPU8[($10_1 + 273 | 0) >> 0] | 0) & 255 | 0 | 0) > (1 | 0) & 1 | 0)) {
         break label$11
        }
        label$12 : {
         label$13 : {
          if (!($32() | 0)) {
           break label$13
          }
          if (!(HEAP32[($10_1 + 320 | 0) >> 2] | 0)) {
           break label$13
          }
          if (!(((HEAPU8[($10_1 + 273 | 0) >> 0] | 0) & 255 | 0 | 0) >= (25 | 0) & 1 | 0)) {
           break label$13
          }
          $173 = (HEAPU8[($10_1 + 273 | 0) >> 0] | 0) & 255 | 0;
          label$14 : {
           label$15 : {
            if (!(((HEAPU8[($10_1 + 273 | 0) >> 0] | 0) & 255 | 0) >>> 0 < (32 - (HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
             break label$15
            }
            $188 = (HEAPU8[($10_1 + 273 | 0) >> 0] | 0) & 255 | 0;
            break label$14;
           }
           $188 = 32 - (HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) | 0;
          }
          HEAP32[($10_1 + 264 | 0) >> 2] = $173 - $188 | 0;
          HEAP32[($10_1 + 268 | 0) >> 2] = (HEAP32[($10_1 + 276 | 0) >> 2] | 0) + (($134(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0, ((HEAPU8[($10_1 + 273 | 0) >> 0] | 0) & 255 | 0) - (HEAP32[($10_1 + 264 | 0) >> 2] | 0) | 0 | 0) | 0) << (HEAP32[($10_1 + 264 | 0) >> 2] | 0) | 0) | 0;
          $17(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0) | 0;
          label$16 : {
           if (!(HEAP32[($10_1 + 264 | 0) >> 2] | 0)) {
            break label$16
           }
           $210 = $134(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 264 | 0) >> 2] | 0 | 0) | 0;
           HEAP32[($10_1 + 268 | 0) >> 2] = (HEAP32[($10_1 + 268 | 0) >> 2] | 0) + $210 | 0;
          }
          break label$12;
         }
         HEAP32[($10_1 + 268 | 0) >> 2] = (HEAP32[($10_1 + 276 | 0) >> 2] | 0) + ($134(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0, (HEAPU8[($10_1 + 273 | 0) >> 0] | 0) & 255 | 0 | 0) | 0) | 0;
         label$17 : {
          if (!($32() | 0)) {
           break label$17
          }
          $17(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0) | 0;
         }
        }
        HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 52 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 48 | 0) >> 2] | 0;
        HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 48 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
        HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 44 | 0) >> 2] = HEAP32[($10_1 + 268 | 0) >> 2] | 0;
        break label$10;
       }
       HEAP32[($10_1 + 260 | 0) >> 2] = (HEAP32[($10_1 + 284 | 0) >> 2] | 0 | 0) == (0 | 0) & 1 | 0;
       label$18 : {
        label$19 : {
         if ((HEAPU8[($10_1 + 273 | 0) >> 0] | 0) & 255 | 0) {
          break label$19
         }
         label$20 : {
          label$21 : {
           if (!(((HEAP32[($10_1 + 260 | 0) >> 2] | 0 | 0) != (0 | 0) ^ -1 | 0) & 1 | 0)) {
            break label$21
           }
           HEAP32[($10_1 + 268 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
           break label$20;
          }
          HEAP32[($10_1 + 268 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 48 | 0) >> 2] | 0;
          HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 48 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
          HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 44 | 0) >> 2] = HEAP32[($10_1 + 268 | 0) >> 2] | 0;
         }
         break label$18;
        }
        HEAP32[($10_1 + 268 | 0) >> 2] = ((HEAP32[($10_1 + 276 | 0) >> 2] | 0) + (HEAP32[($10_1 + 260 | 0) >> 2] | 0) | 0) + ($134(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0, 1 | 0) | 0) | 0;
        label$22 : {
         label$23 : {
          if (!((HEAP32[($10_1 + 268 | 0) >> 2] | 0 | 0) == (3 | 0) & 1 | 0)) {
           break label$23
          }
          $276 = (HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0) - 1 | 0;
          break label$22;
         }
         $276 = HEAP32[(((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 44 | 0) + ((HEAP32[($10_1 + 268 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
        }
        HEAP32[($10_1 + 256 | 0) >> 2] = $276;
        HEAP32[($10_1 + 256 | 0) >> 2] = (HEAP32[($10_1 + 256 | 0) >> 2] | 0) + (((HEAP32[($10_1 + 256 | 0) >> 2] | 0 | 0) != (0 | 0) ^ -1 | 0) & 1 | 0) | 0;
        label$24 : {
         if (!((HEAP32[($10_1 + 268 | 0) >> 2] | 0 | 0) != (1 | 0) & 1 | 0)) {
          break label$24
         }
         HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 52 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 48 | 0) >> 2] | 0;
        }
        HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 48 | 0) >> 2] = HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 44 | 0) >> 2] | 0;
        $310 = HEAP32[($10_1 + 256 | 0) >> 2] | 0;
        HEAP32[($10_1 + 268 | 0) >> 2] = $310;
        HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 44 | 0) >> 2] = $310;
       }
      }
      HEAP32[($10_1 + 80 | 0) >> 2] = HEAP32[($10_1 + 268 | 0) >> 2] | 0;
      HEAP32[($10_1 + 76 | 0) >> 2] = HEAP32[($10_1 + 280 | 0) >> 2] | 0;
      label$25 : {
       if (!(((HEAPU8[($10_1 + 274 | 0) >> 0] | 0) & 255 | 0 | 0) > (0 | 0) & 1 | 0)) {
        break label$25
       }
       $327 = $134(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0, (HEAPU8[($10_1 + 274 | 0) >> 0] | 0) & 255 | 0 | 0) | 0;
       HEAP32[($10_1 + 76 | 0) >> 2] = (HEAP32[($10_1 + 76 | 0) >> 2] | 0) + $327 | 0;
      }
      label$26 : {
       if (!($32() | 0)) {
        break label$26
       }
       if (!((((HEAPU8[($10_1 + 274 | 0) >> 0] | 0) & 255 | 0) + ((HEAPU8[($10_1 + 275 | 0) >> 0] | 0) & 255 | 0) | 0 | 0) >= (20 | 0) & 1 | 0)) {
        break label$26
       }
       $17(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0) | 0;
      }
      label$27 : {
       if (!($29() | 0)) {
        break label$27
       }
       if (!(((HEAPU8[($10_1 + 272 | 0) >> 0] | 0) & 255 | 0 | 0) >= (31 | 0) & 1 | 0)) {
        break label$27
       }
       $17(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0) | 0;
      }
      HEAP32[($10_1 + 72 | 0) >> 2] = HEAP32[($10_1 + 284 | 0) >> 2] | 0;
      label$28 : {
       if (!(((HEAPU8[($10_1 + 275 | 0) >> 0] | 0) & 255 | 0 | 0) > (0 | 0) & 1 | 0)) {
        break label$28
       }
       $370 = $134(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0, (HEAPU8[($10_1 + 275 | 0) >> 0] | 0) & 255 | 0 | 0) | 0;
       HEAP32[($10_1 + 72 | 0) >> 2] = (HEAP32[($10_1 + 72 | 0) >> 2] | 0) + $370 | 0;
      }
      label$29 : {
       if (!($32() | 0)) {
        break label$29
       }
       $17(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0) | 0;
      }
      label$30 : {
       if (!((HEAP32[($10_1 + 316 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
        break label$30
       }
       HEAP32[($10_1 + 252 | 0) >> 2] = (HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 64 | 0) >> 2] | 0) + (HEAP32[($10_1 + 72 | 0) >> 2] | 0) | 0;
       label$31 : {
        label$32 : {
         if (!((HEAP32[($10_1 + 80 | 0) >> 2] | 0) >>> 0 > (HEAP32[($10_1 + 252 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
          break label$32
         }
         $395 = HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 60 | 0) >> 2] | 0;
         break label$31;
        }
        $395 = HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 56 | 0) >> 2] | 0;
       }
       HEAP32[($10_1 + 248 | 0) >> 2] = $395;
       HEAP32[($10_1 + 84 | 0) >> 2] = ((HEAP32[($10_1 + 248 | 0) >> 2] | 0) + (HEAP32[($10_1 + 252 | 0) >> 2] | 0) | 0) + (0 - (HEAP32[($10_1 + 80 | 0) >> 2] | 0) | 0) | 0;
       HEAP32[((HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 64 | 0) >> 2] = (HEAP32[($10_1 + 252 | 0) >> 2] | 0) + (HEAP32[($10_1 + 76 | 0) >> 2] | 0) | 0;
      }
      HEAP32[($10_1 + 244 | 0) >> 2] = 0;
      $425 = (HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 20 | 0;
      $426 = HEAP32[($10_1 + 324 | 0) >> 2] | 0;
      i64toi32_i32$2 = $10_1 + 304 | 0;
      i64toi32_i32$1 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$0 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $1968 = i64toi32_i32$1;
      i64toi32_i32$1 = $10_1 + 328 | 0;
      $80_1 = $1968;
      HEAP8[i64toi32_i32$1 >> 0] = $80_1;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $80_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $80_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $80_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      HEAP32[($10_1 + 348 | 0) >> 2] = $425;
      HEAP32[($10_1 + 344 | 0) >> 2] = $426;
      HEAP32[($10_1 + 340 | 0) >> 2] = (HEAPU8[($10_1 + 331 | 0) >> 0] | 0) & 255 | 0;
      HEAP32[($10_1 + 336 | 0) >> 2] = $133(HEAP32[($10_1 + 344 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 340 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[(HEAP32[($10_1 + 348 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($10_1 + 328 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($10_1 + 336 | 0) >> 2] | 0) | 0;
      $441 = (HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 36 | 0;
      $442 = HEAP32[($10_1 + 324 | 0) >> 2] | 0;
      i64toi32_i32$2 = $10_1 + 296 | 0;
      i64toi32_i32$0 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$1 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $2013 = i64toi32_i32$0;
      i64toi32_i32$0 = $10_1 + 352 | 0;
      $81_1 = $2013;
      HEAP8[i64toi32_i32$0 >> 0] = $81_1;
      HEAP8[(i64toi32_i32$0 + 1 | 0) >> 0] = $81_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 2 | 0) >> 0] = $81_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 3 | 0) >> 0] = $81_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$0 + 4 | 0) >> 0] = i64toi32_i32$1;
      HEAP8[(i64toi32_i32$0 + 5 | 0) >> 0] = i64toi32_i32$1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 6 | 0) >> 0] = i64toi32_i32$1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 7 | 0) >> 0] = i64toi32_i32$1 >>> 24 | 0;
      HEAP32[($10_1 + 372 | 0) >> 2] = $441;
      HEAP32[($10_1 + 368 | 0) >> 2] = $442;
      HEAP32[($10_1 + 364 | 0) >> 2] = (HEAPU8[($10_1 + 355 | 0) >> 0] | 0) & 255 | 0;
      HEAP32[($10_1 + 360 | 0) >> 2] = $133(HEAP32[($10_1 + 368 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 364 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[(HEAP32[($10_1 + 372 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($10_1 + 352 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($10_1 + 360 | 0) >> 2] | 0) | 0;
      label$33 : {
       if (!($32() | 0)) {
        break label$33
       }
       $17(HEAP32[($10_1 + 324 | 0) >> 2] | 0 | 0) | 0;
      }
      $467 = $10_1 + 400 | 0;
      $476 = (HEAP32[($10_1 + 324 | 0) >> 2] | 0) + 28 | 0;
      $477 = HEAP32[($10_1 + 324 | 0) >> 2] | 0;
      i64toi32_i32$2 = $10_1 + 288 | 0;
      i64toi32_i32$1 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$0 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $2085 = i64toi32_i32$1;
      i64toi32_i32$1 = $10_1 + 376 | 0;
      $82_1 = $2085;
      HEAP8[i64toi32_i32$1 >> 0] = $82_1;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $82_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $82_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $82_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      HEAP32[($10_1 + 396 | 0) >> 2] = $476;
      HEAP32[($10_1 + 392 | 0) >> 2] = $477;
      HEAP32[($10_1 + 388 | 0) >> 2] = (HEAPU8[($10_1 + 379 | 0) >> 0] | 0) & 255 | 0;
      HEAP32[($10_1 + 384 | 0) >> 2] = $133(HEAP32[($10_1 + 392 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 388 | 0) >> 2] | 0 | 0) | 0;
      HEAP32[(HEAP32[($10_1 + 396 | 0) >> 2] | 0) >> 2] = ((HEAPU16[($10_1 + 376 | 0) >> 1] | 0) & 65535 | 0) + (HEAP32[($10_1 + 384 | 0) >> 2] | 0) | 0;
      $490 = HEAP32[($10_1 + 188 | 0) >> 2] | 0;
      $491 = HEAP32[($10_1 + 192 | 0) >> 2] | 0;
      $492 = HEAP32[($10_1 + 180 | 0) >> 2] | 0;
      $493 = HEAP32[($10_1 + 176 | 0) >> 2] | 0;
      $494 = HEAP32[($10_1 + 172 | 0) >> 2] | 0;
      $495 = HEAP32[($10_1 + 168 | 0) >> 2] | 0;
      i64toi32_i32$2 = $10_1 + 72 | 0;
      i64toi32_i32$0 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$1 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $2135 = i64toi32_i32$0;
      i64toi32_i32$0 = $467;
      $83_1 = $2135;
      HEAP8[i64toi32_i32$0 >> 0] = $83_1;
      HEAP8[(i64toi32_i32$0 + 1 | 0) >> 0] = $83_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 2 | 0) >> 0] = $83_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 3 | 0) >> 0] = $83_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$0 + 4 | 0) >> 0] = i64toi32_i32$1;
      HEAP8[(i64toi32_i32$0 + 5 | 0) >> 0] = i64toi32_i32$1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$0 + 6 | 0) >> 0] = i64toi32_i32$1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$0 + 7 | 0) >> 0] = i64toi32_i32$1 >>> 24 | 0;
      $496 = 8;
      i64toi32_i32$2 = i64toi32_i32$2 + $496 | 0;
      i64toi32_i32$1 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      i64toi32_i32$0 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
      $2145 = i64toi32_i32$1;
      i64toi32_i32$1 = $467 + $496 | 0;
      $84_1 = $2145;
      HEAP8[i64toi32_i32$1 >> 0] = $84_1;
      HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $84_1 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $84_1 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $84_1 >>> 24 | 0;
      HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
      HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
      HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
      HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
      HEAP32[($10_1 + 472 | 0) >> 2] = $490;
      HEAP32[($10_1 + 468 | 0) >> 2] = $491;
      HEAP32[($10_1 + 464 | 0) >> 2] = $10_1 + 184 | 0;
      HEAP32[($10_1 + 460 | 0) >> 2] = $492;
      HEAP32[($10_1 + 456 | 0) >> 2] = $493;
      HEAP32[($10_1 + 452 | 0) >> 2] = $494;
      HEAP32[($10_1 + 448 | 0) >> 2] = $495;
      HEAP32[($10_1 + 444 | 0) >> 2] = (HEAP32[($10_1 + 472 | 0) >> 2] | 0) + (HEAP32[($10_1 + 400 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 440 | 0) >> 2] = (HEAP32[($10_1 + 400 | 0) >> 2] | 0) + (HEAP32[($10_1 + 404 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 436 | 0) >> 2] = (HEAP32[($10_1 + 472 | 0) >> 2] | 0) + (HEAP32[($10_1 + 440 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 432 | 0) >> 2] = (HEAP32[($10_1 + 468 | 0) >> 2] | 0) + -32 | 0;
      HEAP32[($10_1 + 428 | 0) >> 2] = (HEAP32[(HEAP32[($10_1 + 464 | 0) >> 2] | 0) >> 2] | 0) + (HEAP32[($10_1 + 400 | 0) >> 2] | 0) | 0;
      HEAP32[($10_1 + 424 | 0) >> 2] = (HEAP32[($10_1 + 444 | 0) >> 2] | 0) + (0 - (HEAP32[($10_1 + 408 | 0) >> 2] | 0) | 0) | 0;
      $526 = 1;
      label$34 : {
       if ((HEAP32[($10_1 + 428 | 0) >> 2] | 0) >>> 0 > (HEAP32[($10_1 + 460 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
        break label$34
       }
       $526 = 1;
       if ((HEAP32[($10_1 + 436 | 0) >> 2] | 0) >>> 0 > (HEAP32[($10_1 + 432 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
        break label$34
       }
       $537 = 0;
       label$35 : {
        if (!($32() | 0)) {
         break label$35
        }
        $537 = ((HEAP32[($10_1 + 468 | 0) >> 2] | 0) - (HEAP32[($10_1 + 472 | 0) >> 2] | 0) | 0) >>> 0 < ((HEAP32[($10_1 + 440 | 0) >> 2] | 0) + 32 | 0) >>> 0;
       }
       $526 = $537;
      }
      label$36 : {
       label$37 : {
        if (!($526 & 1 | 0)) {
         break label$37
        }
        $551 = HEAP32[($10_1 + 472 | 0) >> 2] | 0;
        $552 = HEAP32[($10_1 + 468 | 0) >> 2] | 0;
        $553 = HEAP32[($10_1 + 464 | 0) >> 2] | 0;
        $554 = HEAP32[($10_1 + 460 | 0) >> 2] | 0;
        $555 = HEAP32[($10_1 + 456 | 0) >> 2] | 0;
        $556 = HEAP32[($10_1 + 452 | 0) >> 2] | 0;
        $557 = HEAP32[($10_1 + 448 | 0) >> 2] | 0;
        $558 = 8;
        i64toi32_i32$2 = ($10_1 + 400 | 0) + $558 | 0;
        i64toi32_i32$0 = HEAP32[i64toi32_i32$2 >> 2] | 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 4 | 0) >> 2] | 0;
        $2304 = i64toi32_i32$0;
        i64toi32_i32$0 = ($10_1 + 8 | 0) + $558 | 0;
        HEAP32[i64toi32_i32$0 >> 2] = $2304;
        HEAP32[(i64toi32_i32$0 + 4 | 0) >> 2] = i64toi32_i32$1;
        i64toi32_i32$2 = $10_1;
        i64toi32_i32$1 = HEAP32[($10_1 + 400 | 0) >> 2] | 0;
        i64toi32_i32$0 = HEAP32[($10_1 + 404 | 0) >> 2] | 0;
        $2308 = i64toi32_i32$1;
        i64toi32_i32$1 = $10_1;
        HEAP32[($10_1 + 8 | 0) >> 2] = $2308;
        HEAP32[($10_1 + 12 | 0) >> 2] = i64toi32_i32$0;
        HEAP32[($10_1 + 476 | 0) >> 2] = $139($551 | 0, $552 | 0, $10_1 + 8 | 0 | 0, $553 | 0, $554 | 0, $555 | 0, $556 | 0, $557 | 0) | 0;
        break label$36;
       }
       $140(HEAP32[($10_1 + 472 | 0) >> 2] | 0 | 0, HEAP32[(HEAP32[($10_1 + 464 | 0) >> 2] | 0) >> 2] | 0 | 0);
       label$38 : {
        if (!((HEAP32[($10_1 + 400 | 0) >> 2] | 0) >>> 0 > 16 >>> 0 & 1 | 0)) {
         break label$38
        }
        $586 = (HEAP32[(HEAP32[($10_1 + 464 | 0) >> 2] | 0) >> 2] | 0) + 16 | 0;
        $589 = (HEAP32[($10_1 + 400 | 0) >> 2] | 0) - 16 | 0;
        HEAP32[($10_1 + 508 | 0) >> 2] = (HEAP32[($10_1 + 472 | 0) >> 2] | 0) + 16 | 0;
        HEAP32[($10_1 + 504 | 0) >> 2] = $586;
        HEAP32[($10_1 + 500 | 0) >> 2] = $589;
        HEAP32[($10_1 + 496 | 0) >> 2] = 0;
        HEAP32[($10_1 + 492 | 0) >> 2] = (HEAP32[($10_1 + 508 | 0) >> 2] | 0) - (HEAP32[($10_1 + 504 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 488 | 0) >> 2] = HEAP32[($10_1 + 504 | 0) >> 2] | 0;
        HEAP32[($10_1 + 484 | 0) >> 2] = HEAP32[($10_1 + 508 | 0) >> 2] | 0;
        HEAP32[($10_1 + 480 | 0) >> 2] = (HEAP32[($10_1 + 484 | 0) >> 2] | 0) + (HEAP32[($10_1 + 500 | 0) >> 2] | 0) | 0;
        label$39 : {
         label$40 : {
          if (!((HEAP32[($10_1 + 496 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$40
          }
          if (!((HEAP32[($10_1 + 492 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
           break label$40
          }
          label$41 : while (1) {
           $141(HEAP32[($10_1 + 484 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 488 | 0) >> 2] | 0 | 0);
           HEAP32[($10_1 + 484 | 0) >> 2] = (HEAP32[($10_1 + 484 | 0) >> 2] | 0) + 8 | 0;
           HEAP32[($10_1 + 488 | 0) >> 2] = (HEAP32[($10_1 + 488 | 0) >> 2] | 0) + 8 | 0;
           if ((HEAP32[($10_1 + 484 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 480 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
            continue label$41
           }
           break label$41;
          };
          break label$39;
         }
         label$42 : while (1) {
          $140(HEAP32[($10_1 + 484 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 488 | 0) >> 2] | 0 | 0);
          HEAP32[($10_1 + 484 | 0) >> 2] = (HEAP32[($10_1 + 484 | 0) >> 2] | 0) + 16 | 0;
          HEAP32[($10_1 + 488 | 0) >> 2] = (HEAP32[($10_1 + 488 | 0) >> 2] | 0) + 16 | 0;
          if ((HEAP32[($10_1 + 484 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 480 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
           continue label$42
          }
          break label$42;
         };
        }
       }
       HEAP32[($10_1 + 472 | 0) >> 2] = HEAP32[($10_1 + 444 | 0) >> 2] | 0;
       HEAP32[(HEAP32[($10_1 + 464 | 0) >> 2] | 0) >> 2] = HEAP32[($10_1 + 428 | 0) >> 2] | 0;
       label$43 : {
        if (!((HEAP32[($10_1 + 408 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 444 | 0) >> 2] | 0) - (HEAP32[($10_1 + 456 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
         break label$43
        }
        label$44 : {
         if (!((HEAP32[($10_1 + 408 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 444 | 0) >> 2] | 0) - (HEAP32[($10_1 + 452 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
          break label$44
         }
         HEAP32[($10_1 + 476 | 0) >> 2] = -20;
         break label$36;
        }
        HEAP32[($10_1 + 424 | 0) >> 2] = (HEAP32[($10_1 + 448 | 0) >> 2] | 0) + ((HEAP32[($10_1 + 424 | 0) >> 2] | 0) - (HEAP32[($10_1 + 456 | 0) >> 2] | 0) | 0) | 0;
        label$45 : {
         if (!(((HEAP32[($10_1 + 424 | 0) >> 2] | 0) + (HEAP32[($10_1 + 404 | 0) >> 2] | 0) | 0) >>> 0 <= (HEAP32[($10_1 + 448 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
          break label$45
         }
         $155(HEAP32[($10_1 + 444 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 424 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 404 | 0) >> 2] | 0 | 0) | 0;
         HEAP32[($10_1 + 476 | 0) >> 2] = HEAP32[($10_1 + 440 | 0) >> 2] | 0;
         break label$36;
        }
        HEAP32[($10_1 + 420 | 0) >> 2] = (HEAP32[($10_1 + 448 | 0) >> 2] | 0) - (HEAP32[($10_1 + 424 | 0) >> 2] | 0) | 0;
        $155(HEAP32[($10_1 + 444 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 424 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 420 | 0) >> 2] | 0 | 0) | 0;
        HEAP32[($10_1 + 472 | 0) >> 2] = (HEAP32[($10_1 + 444 | 0) >> 2] | 0) + (HEAP32[($10_1 + 420 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 404 | 0) >> 2] = (HEAP32[($10_1 + 404 | 0) >> 2] | 0) - (HEAP32[($10_1 + 420 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 424 | 0) >> 2] = HEAP32[($10_1 + 456 | 0) >> 2] | 0;
       }
       label$46 : {
        if (!((HEAP32[($10_1 + 408 | 0) >> 2] | 0) >>> 0 >= 16 >>> 0 & 1 | 0)) {
         break label$46
        }
        $704 = HEAP32[($10_1 + 424 | 0) >> 2] | 0;
        $705 = HEAP32[($10_1 + 404 | 0) >> 2] | 0;
        HEAP32[($10_1 + 540 | 0) >> 2] = HEAP32[($10_1 + 472 | 0) >> 2] | 0;
        HEAP32[($10_1 + 536 | 0) >> 2] = $704;
        HEAP32[($10_1 + 532 | 0) >> 2] = $705;
        HEAP32[($10_1 + 528 | 0) >> 2] = 0;
        HEAP32[($10_1 + 524 | 0) >> 2] = (HEAP32[($10_1 + 540 | 0) >> 2] | 0) - (HEAP32[($10_1 + 536 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 520 | 0) >> 2] = HEAP32[($10_1 + 536 | 0) >> 2] | 0;
        HEAP32[($10_1 + 516 | 0) >> 2] = HEAP32[($10_1 + 540 | 0) >> 2] | 0;
        HEAP32[($10_1 + 512 | 0) >> 2] = (HEAP32[($10_1 + 516 | 0) >> 2] | 0) + (HEAP32[($10_1 + 532 | 0) >> 2] | 0) | 0;
        label$47 : {
         label$48 : {
          if (!((HEAP32[($10_1 + 528 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
           break label$48
          }
          if (!((HEAP32[($10_1 + 524 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
           break label$48
          }
          label$49 : while (1) {
           $141(HEAP32[($10_1 + 516 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 520 | 0) >> 2] | 0 | 0);
           HEAP32[($10_1 + 516 | 0) >> 2] = (HEAP32[($10_1 + 516 | 0) >> 2] | 0) + 8 | 0;
           HEAP32[($10_1 + 520 | 0) >> 2] = (HEAP32[($10_1 + 520 | 0) >> 2] | 0) + 8 | 0;
           if ((HEAP32[($10_1 + 516 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 512 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
            continue label$49
           }
           break label$49;
          };
          break label$47;
         }
         label$50 : while (1) {
          $140(HEAP32[($10_1 + 516 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 520 | 0) >> 2] | 0 | 0);
          HEAP32[($10_1 + 516 | 0) >> 2] = (HEAP32[($10_1 + 516 | 0) >> 2] | 0) + 16 | 0;
          HEAP32[($10_1 + 520 | 0) >> 2] = (HEAP32[($10_1 + 520 | 0) >> 2] | 0) + 16 | 0;
          if ((HEAP32[($10_1 + 516 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 512 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
           continue label$50
          }
          break label$50;
         };
        }
        HEAP32[($10_1 + 476 | 0) >> 2] = HEAP32[($10_1 + 440 | 0) >> 2] | 0;
        break label$36;
       }
       $765 = HEAP32[($10_1 + 408 | 0) >> 2] | 0;
       HEAP32[($10_1 + 556 | 0) >> 2] = $10_1 + 472 | 0;
       HEAP32[($10_1 + 552 | 0) >> 2] = $10_1 + 424 | 0;
       HEAP32[($10_1 + 548 | 0) >> 2] = $765;
       label$51 : {
        label$52 : {
         if (!((HEAP32[($10_1 + 548 | 0) >> 2] | 0) >>> 0 < 8 >>> 0 & 1 | 0)) {
          break label$52
         }
         HEAP32[($10_1 + 544 | 0) >> 2] = HEAP32[(3952 + ((HEAP32[($10_1 + 548 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
         HEAP8[(HEAP32[(HEAP32[($10_1 + 556 | 0) >> 2] | 0) >> 2] | 0) >> 0] = HEAPU8[(HEAP32[(HEAP32[($10_1 + 552 | 0) >> 2] | 0) >> 2] | 0) >> 0] | 0;
         HEAP8[((HEAP32[(HEAP32[($10_1 + 556 | 0) >> 2] | 0) >> 2] | 0) + 1 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($10_1 + 552 | 0) >> 2] | 0) >> 2] | 0) + 1 | 0) >> 0] | 0;
         HEAP8[((HEAP32[(HEAP32[($10_1 + 556 | 0) >> 2] | 0) >> 2] | 0) + 2 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($10_1 + 552 | 0) >> 2] | 0) >> 2] | 0) + 2 | 0) >> 0] | 0;
         HEAP8[((HEAP32[(HEAP32[($10_1 + 556 | 0) >> 2] | 0) >> 2] | 0) + 3 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($10_1 + 552 | 0) >> 2] | 0) >> 2] | 0) + 3 | 0) >> 0] | 0;
         $805 = HEAP32[($10_1 + 552 | 0) >> 2] | 0;
         HEAP32[$805 >> 2] = (HEAP32[$805 >> 2] | 0) + (HEAP32[(3920 + ((HEAP32[($10_1 + 548 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) | 0;
         $142((HEAP32[(HEAP32[($10_1 + 556 | 0) >> 2] | 0) >> 2] | 0) + 4 | 0 | 0, HEAP32[(HEAP32[($10_1 + 552 | 0) >> 2] | 0) >> 2] | 0 | 0);
         $815 = HEAP32[($10_1 + 552 | 0) >> 2] | 0;
         HEAP32[$815 >> 2] = (HEAP32[$815 >> 2] | 0) + (0 - (HEAP32[($10_1 + 544 | 0) >> 2] | 0) | 0) | 0;
         break label$51;
        }
        $141(HEAP32[(HEAP32[($10_1 + 556 | 0) >> 2] | 0) >> 2] | 0 | 0, HEAP32[(HEAP32[($10_1 + 552 | 0) >> 2] | 0) >> 2] | 0 | 0);
       }
       $824 = HEAP32[($10_1 + 552 | 0) >> 2] | 0;
       HEAP32[$824 >> 2] = (HEAP32[$824 >> 2] | 0) + 8 | 0;
       $828 = HEAP32[($10_1 + 556 | 0) >> 2] | 0;
       HEAP32[$828 >> 2] = (HEAP32[$828 >> 2] | 0) + 8 | 0;
       label$53 : {
        if (!((HEAP32[($10_1 + 404 | 0) >> 2] | 0) >>> 0 > 8 >>> 0 & 1 | 0)) {
         break label$53
        }
        $838 = 1;
        $840 = HEAP32[($10_1 + 424 | 0) >> 2] | 0;
        $843 = (HEAP32[($10_1 + 404 | 0) >> 2] | 0) - 8 | 0;
        HEAP32[($10_1 + 588 | 0) >> 2] = HEAP32[($10_1 + 472 | 0) >> 2] | 0;
        HEAP32[($10_1 + 584 | 0) >> 2] = $840;
        HEAP32[($10_1 + 580 | 0) >> 2] = $843;
        HEAP32[($10_1 + 576 | 0) >> 2] = $838;
        HEAP32[($10_1 + 572 | 0) >> 2] = (HEAP32[($10_1 + 588 | 0) >> 2] | 0) - (HEAP32[($10_1 + 584 | 0) >> 2] | 0) | 0;
        HEAP32[($10_1 + 568 | 0) >> 2] = HEAP32[($10_1 + 584 | 0) >> 2] | 0;
        HEAP32[($10_1 + 564 | 0) >> 2] = HEAP32[($10_1 + 588 | 0) >> 2] | 0;
        HEAP32[($10_1 + 560 | 0) >> 2] = (HEAP32[($10_1 + 564 | 0) >> 2] | 0) + (HEAP32[($10_1 + 580 | 0) >> 2] | 0) | 0;
        label$54 : {
         label$55 : {
          if (!((HEAP32[($10_1 + 576 | 0) >> 2] | 0 | 0) == ($838 | 0) & 1 | 0)) {
           break label$55
          }
          if (!((HEAP32[($10_1 + 572 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
           break label$55
          }
          label$56 : while (1) {
           $141(HEAP32[($10_1 + 564 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 568 | 0) >> 2] | 0 | 0);
           HEAP32[($10_1 + 564 | 0) >> 2] = (HEAP32[($10_1 + 564 | 0) >> 2] | 0) + 8 | 0;
           HEAP32[($10_1 + 568 | 0) >> 2] = (HEAP32[($10_1 + 568 | 0) >> 2] | 0) + 8 | 0;
           if ((HEAP32[($10_1 + 564 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 560 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
            continue label$56
           }
           break label$56;
          };
          break label$54;
         }
         label$57 : while (1) {
          $140(HEAP32[($10_1 + 564 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 568 | 0) >> 2] | 0 | 0);
          HEAP32[($10_1 + 564 | 0) >> 2] = (HEAP32[($10_1 + 564 | 0) >> 2] | 0) + 16 | 0;
          HEAP32[($10_1 + 568 | 0) >> 2] = (HEAP32[($10_1 + 568 | 0) >> 2] | 0) + 16 | 0;
          if ((HEAP32[($10_1 + 564 | 0) >> 2] | 0) >>> 0 < (HEAP32[($10_1 + 560 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
           continue label$57
          }
          break label$57;
         };
        }
       }
       HEAP32[($10_1 + 476 | 0) >> 2] = HEAP32[($10_1 + 440 | 0) >> 2] | 0;
      }
      HEAP32[($10_1 + 68 | 0) >> 2] = HEAP32[($10_1 + 476 | 0) >> 2] | 0;
      $17($10_1 + 96 | 0 | 0) | 0;
      label$58 : {
       label$59 : {
        if (!($22(HEAP32[($10_1 + 68 | 0) >> 2] | 0 | 0) | 0)) {
         break label$59
        }
        HEAP32[($10_1 + 92 | 0) >> 2] = HEAP32[($10_1 + 68 | 0) >> 2] | 0;
        break label$58;
       }
       HEAP32[($10_1 + 188 | 0) >> 2] = (HEAP32[($10_1 + 188 | 0) >> 2] | 0) + (HEAP32[($10_1 + 68 | 0) >> 2] | 0) | 0;
      }
      $909 = (HEAP32[($10_1 + 216 | 0) >> 2] | 0) + -1 | 0;
      HEAP32[($10_1 + 216 | 0) >> 2] = $909;
      label$60 : {
       label$61 : {
        if (!((($909 | 0) != (0 | 0) ^ -1 | 0) & 1 | 0)) {
         break label$61
        }
        if ($22(HEAP32[($10_1 + 92 | 0) >> 2] | 0 | 0) | 0) {
         break label$60
        }
        break label$8;
       }
       continue label$9;
      }
      break label$9;
     };
     HEAP32[($10_1 + 240 | 0) >> 2] = HEAP32[($10_1 + 92 | 0) >> 2] | 0;
     break label$3;
    }
    label$62 : {
     if (!(HEAP32[($10_1 + 216 | 0) >> 2] | 0)) {
      break label$62
     }
     HEAP32[($10_1 + 240 | 0) >> 2] = -20;
     break label$3;
    }
    label$63 : {
     if (!(($17($10_1 + 96 | 0 | 0) | 0) >>> 0 < 2 >>> 0 & 1 | 0)) {
      break label$63
     }
     HEAP32[($10_1 + 240 | 0) >> 2] = -20;
     break label$3;
    }
    HEAP32[($10_1 + 64 | 0) >> 2] = 0;
    label$64 : {
     label$65 : while (1) {
      if (!((HEAP32[($10_1 + 64 | 0) >> 2] | 0) >>> 0 < 3 >>> 0 & 1 | 0)) {
       break label$64
      }
      HEAP32[((((HEAP32[($10_1 + 236 | 0) >> 2] | 0) + 16 | 0) + 26652 | 0) + ((HEAP32[($10_1 + 64 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] = HEAP32[((($10_1 + 96 | 0) + 44 | 0) + ((HEAP32[($10_1 + 64 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
      HEAP32[($10_1 + 64 | 0) >> 2] = (HEAP32[($10_1 + 64 | 0) >> 2] | 0) + 1 | 0;
      continue label$65;
     };
    }
   }
   HEAP32[($10_1 + 60 | 0) >> 2] = (HEAP32[($10_1 + 180 | 0) >> 2] | 0) - (HEAP32[($10_1 + 184 | 0) >> 2] | 0) | 0;
   label$66 : {
    if (!((HEAP32[($10_1 + 60 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 192 | 0) >> 2] | 0) - (HEAP32[($10_1 + 188 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
     break label$66
    }
    HEAP32[($10_1 + 240 | 0) >> 2] = -70;
    break label$3;
   }
   label$67 : {
    if (!((HEAP32[($10_1 + 188 | 0) >> 2] | 0 | 0) != (0 | 0) & 1 | 0)) {
     break label$67
    }
    $153(HEAP32[($10_1 + 188 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 184 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 60 | 0) >> 2] | 0 | 0) | 0;
    HEAP32[($10_1 + 188 | 0) >> 2] = (HEAP32[($10_1 + 188 | 0) >> 2] | 0) + (HEAP32[($10_1 + 60 | 0) >> 2] | 0) | 0;
   }
   HEAP32[($10_1 + 240 | 0) >> 2] = (HEAP32[($10_1 + 188 | 0) >> 2] | 0) - (HEAP32[($10_1 + 196 | 0) >> 2] | 0) | 0;
  }
  $992 = HEAP32[($10_1 + 240 | 0) >> 2] | 0;
  label$68 : {
   $996 = $10_1 + 592 | 0;
   if ($996 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $996;
  }
  return $992 | 0;
 }
 
 function $132($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $13_1 = 0, $12_1 = 0, i64toi32_i32$0 = 0, $9_1 = 0, i64toi32_i32$1 = 0;
  $3_1 = global$0 - 16 | 0;
  label$1 : {
   $12_1 = $3_1;
   if ($3_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $12_1;
  }
  HEAP32[($3_1 + 8 | 0) >> 2] = $0_1;
  label$3 : {
   label$4 : {
    if (!($32() | 0)) {
     break label$4
    }
    HEAP32[($3_1 + 12 | 0) >> 2] = $6(HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) | 0;
    break label$3;
   }
   i64toi32_i32$0 = $63(HEAP32[($3_1 + 8 | 0) >> 2] | 0 | 0) | 0;
   i64toi32_i32$1 = i64toi32_i32$HIGH_BITS;
   HEAP32[($3_1 + 12 | 0) >> 2] = i64toi32_i32$0;
  }
  $9_1 = HEAP32[($3_1 + 12 | 0) >> 2] | 0;
  label$5 : {
   $13_1 = $3_1 + 16 | 0;
   if ($13_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $13_1;
  }
  return $9_1 | 0;
 }
 
 function $133($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $14_1 = 0, $13_1 = 0, $10_1 = 0;
  $4_1 = global$0 - 16 | 0;
  label$1 : {
   $13_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $13_1;
  }
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 8 | 0) >> 2] = $1_1;
  HEAP32[($4_1 + 4 | 0) >> 2] = $135(HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0) | 0;
  $31(HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0);
  $10_1 = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
  label$3 : {
   $14_1 = $4_1 + 16 | 0;
   if ($14_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $14_1;
  }
  return $10_1 | 0;
 }
 
 function $134($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $14_1 = 0, $13_1 = 0, $10_1 = 0;
  $4_1 = global$0 - 16 | 0;
  label$1 : {
   $13_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $13_1;
  }
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 8 | 0) >> 2] = $1_1;
  HEAP32[($4_1 + 4 | 0) >> 2] = $30(HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0) | 0;
  $31(HEAP32[($4_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0);
  $10_1 = HEAP32[($4_1 + 4 | 0) >> 2] | 0;
  label$3 : {
   $14_1 = $4_1 + 16 | 0;
   if ($14_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $14_1;
  }
  return $10_1 | 0;
 }
 
 function $135($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $18_1 = 0, $17_1 = 0, $14_1 = 0;
  $4_1 = global$0 - 16 | 0;
  label$1 : {
   $17_1 = $4_1;
   if ($4_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $17_1;
  }
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 8 | 0) >> 2] = $1_1;
  $14_1 = $136(HEAP32[(HEAP32[($4_1 + 12 | 0) >> 2] | 0) >> 2] | 0 | 0, (32 - (HEAP32[((HEAP32[($4_1 + 12 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0) | 0) - (HEAP32[($4_1 + 8 | 0) >> 2] | 0) | 0 | 0, HEAP32[($4_1 + 8 | 0) >> 2] | 0 | 0) | 0;
  label$3 : {
   $18_1 = $4_1 + 16 | 0;
   if ($18_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $18_1;
  }
  return $14_1 | 0;
 }
 
 function $136($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0;
  $5_1 = global$0 - 16 | 0;
  HEAP32[($5_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 8 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 4 | 0) >> 2] = $2_1;
  HEAP32[$5_1 >> 2] = 31;
  return ((HEAP32[($5_1 + 12 | 0) >> 2] | 0) >>> ((HEAP32[($5_1 + 8 | 0) >> 2] | 0) & 31 | 0) | 0) & (HEAP32[(3744 + ((HEAP32[($5_1 + 4 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) | 0 | 0;
 }
 
 function $137($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $3_1 = 0, $5_1 = 0;
  $4_1 = global$0 - 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP16[($4_1 + 10 | 0) >> 1] = $1_1;
  $3_1 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  $5_1 = HEAPU16[($4_1 + 10 | 0) >> 1] | 0;
  HEAP8[$3_1 >> 0] = $5_1;
  HEAP8[($3_1 + 1 | 0) >> 0] = $5_1 >>> 8 | 0;
  return;
 }
 
 function $138($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $5_1 = 0, $21_1 = 0, $20_1 = 0, $11_1 = 0;
  $5_1 = global$0 - 32 | 0;
  label$1 : {
   $20_1 = $5_1;
   if ($5_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $20_1;
  }
  HEAP32[($5_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($5_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($5_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($5_1 + 16 | 0) >> 2] = HEAP32[($5_1 + 20 | 0) >> 2] | 0;
  HEAP32[($5_1 + 12 | 0) >> 2] = HEAP32[($5_1 + 16 | 0) >> 2] | 0;
  $11_1 = $133(HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0, HEAP32[((HEAP32[($5_1 + 12 | 0) >> 2] | 0) + 4 | 0) >> 2] | 0 | 0) | 0;
  HEAP32[(HEAP32[($5_1 + 28 | 0) >> 2] | 0) >> 2] = $11_1;
  $17(HEAP32[($5_1 + 24 | 0) >> 2] | 0 | 0) | 0;
  HEAP32[((HEAP32[($5_1 + 28 | 0) >> 2] | 0) + 4 | 0) >> 2] = (HEAP32[($5_1 + 20 | 0) >> 2] | 0) + 8 | 0;
  label$3 : {
   $21_1 = $5_1 + 32 | 0;
   if ($21_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $21_1;
  }
  return;
 }
 
 function $139($0_1, $1_1, $2_1, $3_1, $4_1, $5_1, $6_1, $7_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  $7_1 = $7_1 | 0;
  var $10_1 = 0, $121_1 = 0, $120_1 = 0, $117_1 = 0;
  $10_1 = global$0 - 64 | 0;
  label$1 : {
   $120_1 = $10_1;
   if ($10_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $120_1;
  }
  HEAP32[($10_1 + 56 | 0) >> 2] = $0_1;
  HEAP32[($10_1 + 52 | 0) >> 2] = $1_1;
  HEAP32[($10_1 + 48 | 0) >> 2] = $3_1;
  HEAP32[($10_1 + 44 | 0) >> 2] = $4_1;
  HEAP32[($10_1 + 40 | 0) >> 2] = $5_1;
  HEAP32[($10_1 + 36 | 0) >> 2] = $6_1;
  HEAP32[($10_1 + 32 | 0) >> 2] = $7_1;
  HEAP32[($10_1 + 28 | 0) >> 2] = (HEAP32[($10_1 + 56 | 0) >> 2] | 0) + (HEAP32[$2_1 >> 2] | 0) | 0;
  HEAP32[($10_1 + 24 | 0) >> 2] = (HEAP32[$2_1 >> 2] | 0) + (HEAP32[($2_1 + 4 | 0) >> 2] | 0) | 0;
  HEAP32[($10_1 + 20 | 0) >> 2] = (HEAP32[(HEAP32[($10_1 + 48 | 0) >> 2] | 0) >> 2] | 0) + (HEAP32[$2_1 >> 2] | 0) | 0;
  HEAP32[($10_1 + 16 | 0) >> 2] = (HEAP32[($10_1 + 28 | 0) >> 2] | 0) + (0 - (HEAP32[($2_1 + 8 | 0) >> 2] | 0) | 0) | 0;
  HEAP32[($10_1 + 12 | 0) >> 2] = (HEAP32[($10_1 + 52 | 0) >> 2] | 0) + -32 | 0;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($10_1 + 24 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 52 | 0) >> 2] | 0) - (HEAP32[($10_1 + 56 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
     break label$4
    }
    HEAP32[($10_1 + 60 | 0) >> 2] = -70;
    break label$3;
   }
   label$5 : {
    if (!((HEAP32[$2_1 >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 44 | 0) >> 2] | 0) - (HEAP32[(HEAP32[($10_1 + 48 | 0) >> 2] | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
     break label$5
    }
    HEAP32[($10_1 + 60 | 0) >> 2] = -20;
    break label$3;
   }
   $143(HEAP32[($10_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[(HEAP32[($10_1 + 48 | 0) >> 2] | 0) >> 2] | 0 | 0, HEAP32[$2_1 >> 2] | 0 | 0, 0 | 0);
   HEAP32[($10_1 + 56 | 0) >> 2] = HEAP32[($10_1 + 28 | 0) >> 2] | 0;
   HEAP32[(HEAP32[($10_1 + 48 | 0) >> 2] | 0) >> 2] = HEAP32[($10_1 + 20 | 0) >> 2] | 0;
   label$6 : {
    if (!((HEAP32[($2_1 + 8 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 28 | 0) >> 2] | 0) - (HEAP32[($10_1 + 40 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
     break label$6
    }
    label$7 : {
     if (!((HEAP32[($2_1 + 8 | 0) >> 2] | 0) >>> 0 > ((HEAP32[($10_1 + 28 | 0) >> 2] | 0) - (HEAP32[($10_1 + 36 | 0) >> 2] | 0) | 0) >>> 0 & 1 | 0)) {
      break label$7
     }
     HEAP32[($10_1 + 60 | 0) >> 2] = -20;
     break label$3;
    }
    HEAP32[($10_1 + 16 | 0) >> 2] = (HEAP32[($10_1 + 32 | 0) >> 2] | 0) + (0 - ((HEAP32[($10_1 + 40 | 0) >> 2] | 0) - (HEAP32[($10_1 + 16 | 0) >> 2] | 0) | 0) | 0) | 0;
    label$8 : {
     if (!(((HEAP32[($10_1 + 16 | 0) >> 2] | 0) + (HEAP32[($2_1 + 4 | 0) >> 2] | 0) | 0) >>> 0 <= (HEAP32[($10_1 + 32 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
      break label$8
     }
     $155(HEAP32[($10_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($2_1 + 4 | 0) >> 2] | 0 | 0) | 0;
     HEAP32[($10_1 + 60 | 0) >> 2] = HEAP32[($10_1 + 24 | 0) >> 2] | 0;
     break label$3;
    }
    HEAP32[($10_1 + 8 | 0) >> 2] = (HEAP32[($10_1 + 32 | 0) >> 2] | 0) - (HEAP32[($10_1 + 16 | 0) >> 2] | 0) | 0;
    $155(HEAP32[($10_1 + 28 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 8 | 0) >> 2] | 0 | 0) | 0;
    HEAP32[($10_1 + 56 | 0) >> 2] = (HEAP32[($10_1 + 28 | 0) >> 2] | 0) + (HEAP32[($10_1 + 8 | 0) >> 2] | 0) | 0;
    HEAP32[($2_1 + 4 | 0) >> 2] = (HEAP32[($2_1 + 4 | 0) >> 2] | 0) - (HEAP32[($10_1 + 8 | 0) >> 2] | 0) | 0;
    HEAP32[($10_1 + 16 | 0) >> 2] = HEAP32[($10_1 + 40 | 0) >> 2] | 0;
   }
   $143(HEAP32[($10_1 + 56 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 12 | 0) >> 2] | 0 | 0, HEAP32[($10_1 + 16 | 0) >> 2] | 0 | 0, HEAP32[($2_1 + 4 | 0) >> 2] | 0 | 0, 1 | 0);
   HEAP32[($10_1 + 60 | 0) >> 2] = HEAP32[($10_1 + 24 | 0) >> 2] | 0;
  }
  $117_1 = HEAP32[($10_1 + 60 | 0) >> 2] | 0;
  label$9 : {
   $121_1 = $10_1 + 64 | 0;
   if ($121_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $121_1;
  }
  return $117_1 | 0;
 }
 
 function $140($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var i64toi32_i32$2 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, $4_1 = 0, $10_1 = 0, $11_1 = 0, $5_1 = 0, $7_1 = 0, $27_1 = 0, $37_1 = 0;
  $4_1 = global$0 - 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 8 | 0) >> 2] = $1_1;
  $5_1 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  i64toi32_i32$2 = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  i64toi32_i32$1 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  $27_1 = i64toi32_i32$0;
  i64toi32_i32$0 = $5_1;
  $10_1 = $27_1;
  HEAP8[i64toi32_i32$0 >> 0] = $10_1;
  HEAP8[(i64toi32_i32$0 + 1 | 0) >> 0] = $10_1 >>> 8 | 0;
  HEAP8[(i64toi32_i32$0 + 2 | 0) >> 0] = $10_1 >>> 16 | 0;
  HEAP8[(i64toi32_i32$0 + 3 | 0) >> 0] = $10_1 >>> 24 | 0;
  HEAP8[(i64toi32_i32$0 + 4 | 0) >> 0] = i64toi32_i32$1;
  HEAP8[(i64toi32_i32$0 + 5 | 0) >> 0] = i64toi32_i32$1 >>> 8 | 0;
  HEAP8[(i64toi32_i32$0 + 6 | 0) >> 0] = i64toi32_i32$1 >>> 16 | 0;
  HEAP8[(i64toi32_i32$0 + 7 | 0) >> 0] = i64toi32_i32$1 >>> 24 | 0;
  $7_1 = 8;
  i64toi32_i32$2 = i64toi32_i32$2 + $7_1 | 0;
  i64toi32_i32$1 = HEAPU8[i64toi32_i32$2 >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  i64toi32_i32$0 = HEAPU8[(i64toi32_i32$2 + 4 | 0) >> 0] | 0 | ((HEAPU8[(i64toi32_i32$2 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[(i64toi32_i32$2 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[(i64toi32_i32$2 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  $37_1 = i64toi32_i32$1;
  i64toi32_i32$1 = $5_1 + $7_1 | 0;
  $11_1 = $37_1;
  HEAP8[i64toi32_i32$1 >> 0] = $11_1;
  HEAP8[(i64toi32_i32$1 + 1 | 0) >> 0] = $11_1 >>> 8 | 0;
  HEAP8[(i64toi32_i32$1 + 2 | 0) >> 0] = $11_1 >>> 16 | 0;
  HEAP8[(i64toi32_i32$1 + 3 | 0) >> 0] = $11_1 >>> 24 | 0;
  HEAP8[(i64toi32_i32$1 + 4 | 0) >> 0] = i64toi32_i32$0;
  HEAP8[(i64toi32_i32$1 + 5 | 0) >> 0] = i64toi32_i32$0 >>> 8 | 0;
  HEAP8[(i64toi32_i32$1 + 6 | 0) >> 0] = i64toi32_i32$0 >>> 16 | 0;
  HEAP8[(i64toi32_i32$1 + 7 | 0) >> 0] = i64toi32_i32$0 >>> 24 | 0;
  return;
 }
 
 function $141($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $6_1 = 0, $7_1 = 0, $4_1 = 0, i64toi32_i32$1 = 0, $8_1 = 0, i64toi32_i32$0 = 0, $23_1 = 0;
  $4_1 = global$0 - 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 8 | 0) >> 2] = $1_1;
  $6_1 = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
  i64toi32_i32$0 = HEAPU8[$6_1 >> 0] | 0 | ((HEAPU8[($6_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[($6_1 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[($6_1 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  i64toi32_i32$1 = HEAPU8[($6_1 + 4 | 0) >> 0] | 0 | ((HEAPU8[($6_1 + 5 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[($6_1 + 6 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[($6_1 + 7 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  $23_1 = i64toi32_i32$0;
  i64toi32_i32$0 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  $7_1 = i64toi32_i32$0;
  $8_1 = $23_1;
  HEAP8[$7_1 >> 0] = $8_1;
  HEAP8[($7_1 + 1 | 0) >> 0] = $8_1 >>> 8 | 0;
  HEAP8[($7_1 + 2 | 0) >> 0] = $8_1 >>> 16 | 0;
  HEAP8[($7_1 + 3 | 0) >> 0] = $8_1 >>> 24 | 0;
  HEAP8[($7_1 + 4 | 0) >> 0] = i64toi32_i32$1;
  HEAP8[($7_1 + 5 | 0) >> 0] = i64toi32_i32$1 >>> 8 | 0;
  HEAP8[($7_1 + 6 | 0) >> 0] = i64toi32_i32$1 >>> 16 | 0;
  HEAP8[($7_1 + 7 | 0) >> 0] = i64toi32_i32$1 >>> 24 | 0;
  return;
 }
 
 function $142($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var $4_1 = 0, $3_1 = 0, $5_1 = 0, $6_1 = 0;
  $4_1 = global$0 - 16 | 0;
  HEAP32[($4_1 + 12 | 0) >> 2] = $0_1;
  HEAP32[($4_1 + 8 | 0) >> 2] = $1_1;
  $3_1 = HEAP32[($4_1 + 8 | 0) >> 2] | 0;
  $5_1 = HEAP32[($4_1 + 12 | 0) >> 2] | 0;
  $6_1 = HEAPU8[$3_1 >> 0] | 0 | ((HEAPU8[($3_1 + 1 | 0) >> 0] | 0) << 8 | 0) | 0 | ((HEAPU8[($3_1 + 2 | 0) >> 0] | 0) << 16 | 0 | ((HEAPU8[($3_1 + 3 | 0) >> 0] | 0) << 24 | 0) | 0) | 0;
  HEAP8[$5_1 >> 0] = $6_1;
  HEAP8[($5_1 + 1 | 0) >> 0] = $6_1 >>> 8 | 0;
  HEAP8[($5_1 + 2 | 0) >> 0] = $6_1 >>> 16 | 0;
  HEAP8[($5_1 + 3 | 0) >> 0] = $6_1 >>> 24 | 0;
  return;
 }
 
 function $143($0_1, $1_1, $2_1, $3_1, $4_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4_1 = $4_1 | 0;
  var $7_1 = 0, $28_1 = 0, $32_1 = 0, $89_1 = 0, $99_1 = 0, $107_1 = 0, $111_1 = 0, $256 = 0, $260 = 0, $266 = 0, $265 = 0, $31_1 = 0, $49_1 = 0, $124_1 = 0, $125_1 = 0, $126_1 = 0, $187 = 0, $190 = 0, $191 = 0, $259 = 0;
  $7_1 = global$0 - 112 | 0;
  label$1 : {
   $265 = $7_1;
   if ($7_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $265;
  }
  HEAP32[($7_1 + 28 | 0) >> 2] = $0_1;
  HEAP32[($7_1 + 24 | 0) >> 2] = $1_1;
  HEAP32[($7_1 + 20 | 0) >> 2] = $2_1;
  HEAP32[($7_1 + 16 | 0) >> 2] = $3_1;
  HEAP32[($7_1 + 12 | 0) >> 2] = $4_1;
  HEAP32[($7_1 + 8 | 0) >> 2] = (HEAP32[($7_1 + 28 | 0) >> 2] | 0) - (HEAP32[($7_1 + 20 | 0) >> 2] | 0) | 0;
  HEAP32[($7_1 + 4 | 0) >> 2] = (HEAP32[($7_1 + 28 | 0) >> 2] | 0) + (HEAP32[($7_1 + 16 | 0) >> 2] | 0) | 0;
  label$3 : {
   label$4 : {
    if (!((HEAP32[($7_1 + 16 | 0) >> 2] | 0 | 0) < (8 | 0) & 1 | 0)) {
     break label$4
    }
    label$5 : {
     label$6 : while (1) {
      if (!((HEAP32[($7_1 + 28 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 4 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
       break label$5
      }
      $28_1 = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
      HEAP32[($7_1 + 20 | 0) >> 2] = $28_1 + 1 | 0;
      $31_1 = HEAPU8[$28_1 >> 0] | 0;
      $32_1 = HEAP32[($7_1 + 28 | 0) >> 2] | 0;
      HEAP32[($7_1 + 28 | 0) >> 2] = $32_1 + 1 | 0;
      HEAP8[$32_1 >> 0] = $31_1;
      continue label$6;
     };
    }
    break label$3;
   }
   label$7 : {
    if (!((HEAP32[($7_1 + 12 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
     break label$7
    }
    $49_1 = HEAP32[($7_1 + 8 | 0) >> 2] | 0;
    HEAP32[($7_1 + 44 | 0) >> 2] = $7_1 + 28 | 0;
    HEAP32[($7_1 + 40 | 0) >> 2] = $7_1 + 20 | 0;
    HEAP32[($7_1 + 36 | 0) >> 2] = $49_1;
    label$8 : {
     label$9 : {
      if (!((HEAP32[($7_1 + 36 | 0) >> 2] | 0) >>> 0 < 8 >>> 0 & 1 | 0)) {
       break label$9
      }
      HEAP32[($7_1 + 32 | 0) >> 2] = HEAP32[(3952 + ((HEAP32[($7_1 + 36 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0;
      HEAP8[(HEAP32[(HEAP32[($7_1 + 44 | 0) >> 2] | 0) >> 2] | 0) >> 0] = HEAPU8[(HEAP32[(HEAP32[($7_1 + 40 | 0) >> 2] | 0) >> 2] | 0) >> 0] | 0;
      HEAP8[((HEAP32[(HEAP32[($7_1 + 44 | 0) >> 2] | 0) >> 2] | 0) + 1 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($7_1 + 40 | 0) >> 2] | 0) >> 2] | 0) + 1 | 0) >> 0] | 0;
      HEAP8[((HEAP32[(HEAP32[($7_1 + 44 | 0) >> 2] | 0) >> 2] | 0) + 2 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($7_1 + 40 | 0) >> 2] | 0) >> 2] | 0) + 2 | 0) >> 0] | 0;
      HEAP8[((HEAP32[(HEAP32[($7_1 + 44 | 0) >> 2] | 0) >> 2] | 0) + 3 | 0) >> 0] = HEAPU8[((HEAP32[(HEAP32[($7_1 + 40 | 0) >> 2] | 0) >> 2] | 0) + 3 | 0) >> 0] | 0;
      $89_1 = HEAP32[($7_1 + 40 | 0) >> 2] | 0;
      HEAP32[$89_1 >> 2] = (HEAP32[$89_1 >> 2] | 0) + (HEAP32[(3920 + ((HEAP32[($7_1 + 36 | 0) >> 2] | 0) << 2 | 0) | 0) >> 2] | 0) | 0;
      $142((HEAP32[(HEAP32[($7_1 + 44 | 0) >> 2] | 0) >> 2] | 0) + 4 | 0 | 0, HEAP32[(HEAP32[($7_1 + 40 | 0) >> 2] | 0) >> 2] | 0 | 0);
      $99_1 = HEAP32[($7_1 + 40 | 0) >> 2] | 0;
      HEAP32[$99_1 >> 2] = (HEAP32[$99_1 >> 2] | 0) + (0 - (HEAP32[($7_1 + 32 | 0) >> 2] | 0) | 0) | 0;
      break label$8;
     }
     $141(HEAP32[(HEAP32[($7_1 + 44 | 0) >> 2] | 0) >> 2] | 0 | 0, HEAP32[(HEAP32[($7_1 + 40 | 0) >> 2] | 0) >> 2] | 0 | 0);
    }
    $107_1 = HEAP32[($7_1 + 40 | 0) >> 2] | 0;
    HEAP32[$107_1 >> 2] = (HEAP32[$107_1 >> 2] | 0) + 8 | 0;
    $111_1 = HEAP32[($7_1 + 44 | 0) >> 2] | 0;
    HEAP32[$111_1 >> 2] = (HEAP32[$111_1 >> 2] | 0) + 8 | 0;
   }
   label$10 : {
    if (!((HEAP32[($7_1 + 4 | 0) >> 2] | 0) >>> 0 <= (HEAP32[($7_1 + 24 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$10
    }
    $124_1 = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
    $125_1 = HEAP32[($7_1 + 16 | 0) >> 2] | 0;
    $126_1 = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
    HEAP32[($7_1 + 76 | 0) >> 2] = HEAP32[($7_1 + 28 | 0) >> 2] | 0;
    HEAP32[($7_1 + 72 | 0) >> 2] = $124_1;
    HEAP32[($7_1 + 68 | 0) >> 2] = $125_1;
    HEAP32[($7_1 + 64 | 0) >> 2] = $126_1;
    HEAP32[($7_1 + 60 | 0) >> 2] = (HEAP32[($7_1 + 76 | 0) >> 2] | 0) - (HEAP32[($7_1 + 72 | 0) >> 2] | 0) | 0;
    HEAP32[($7_1 + 56 | 0) >> 2] = HEAP32[($7_1 + 72 | 0) >> 2] | 0;
    HEAP32[($7_1 + 52 | 0) >> 2] = HEAP32[($7_1 + 76 | 0) >> 2] | 0;
    HEAP32[($7_1 + 48 | 0) >> 2] = (HEAP32[($7_1 + 52 | 0) >> 2] | 0) + (HEAP32[($7_1 + 68 | 0) >> 2] | 0) | 0;
    label$11 : {
     label$12 : {
      if (!((HEAP32[($7_1 + 64 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
       break label$12
      }
      if (!((HEAP32[($7_1 + 60 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
       break label$12
      }
      label$13 : while (1) {
       $141(HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0);
       HEAP32[($7_1 + 52 | 0) >> 2] = (HEAP32[($7_1 + 52 | 0) >> 2] | 0) + 8 | 0;
       HEAP32[($7_1 + 56 | 0) >> 2] = (HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 8 | 0;
       if ((HEAP32[($7_1 + 52 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 48 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
        continue label$13
       }
       break label$13;
      };
      break label$11;
     }
     label$14 : while (1) {
      $140(HEAP32[($7_1 + 52 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 56 | 0) >> 2] | 0 | 0);
      HEAP32[($7_1 + 52 | 0) >> 2] = (HEAP32[($7_1 + 52 | 0) >> 2] | 0) + 16 | 0;
      HEAP32[($7_1 + 56 | 0) >> 2] = (HEAP32[($7_1 + 56 | 0) >> 2] | 0) + 16 | 0;
      if ((HEAP32[($7_1 + 52 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 48 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
       continue label$14
      }
      break label$14;
     };
    }
    break label$3;
   }
   label$15 : {
    if (!((HEAP32[($7_1 + 28 | 0) >> 2] | 0) >>> 0 <= (HEAP32[($7_1 + 24 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$15
    }
    $187 = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
    $190 = (HEAP32[($7_1 + 24 | 0) >> 2] | 0) - (HEAP32[($7_1 + 28 | 0) >> 2] | 0) | 0;
    $191 = HEAP32[($7_1 + 12 | 0) >> 2] | 0;
    HEAP32[($7_1 + 108 | 0) >> 2] = HEAP32[($7_1 + 28 | 0) >> 2] | 0;
    HEAP32[($7_1 + 104 | 0) >> 2] = $187;
    HEAP32[($7_1 + 100 | 0) >> 2] = $190;
    HEAP32[($7_1 + 96 | 0) >> 2] = $191;
    HEAP32[($7_1 + 92 | 0) >> 2] = (HEAP32[($7_1 + 108 | 0) >> 2] | 0) - (HEAP32[($7_1 + 104 | 0) >> 2] | 0) | 0;
    HEAP32[($7_1 + 88 | 0) >> 2] = HEAP32[($7_1 + 104 | 0) >> 2] | 0;
    HEAP32[($7_1 + 84 | 0) >> 2] = HEAP32[($7_1 + 108 | 0) >> 2] | 0;
    HEAP32[($7_1 + 80 | 0) >> 2] = (HEAP32[($7_1 + 84 | 0) >> 2] | 0) + (HEAP32[($7_1 + 100 | 0) >> 2] | 0) | 0;
    label$16 : {
     label$17 : {
      if (!((HEAP32[($7_1 + 96 | 0) >> 2] | 0 | 0) == (1 | 0) & 1 | 0)) {
       break label$17
      }
      if (!((HEAP32[($7_1 + 92 | 0) >> 2] | 0 | 0) < (16 | 0) & 1 | 0)) {
       break label$17
      }
      label$18 : while (1) {
       $141(HEAP32[($7_1 + 84 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 88 | 0) >> 2] | 0 | 0);
       HEAP32[($7_1 + 84 | 0) >> 2] = (HEAP32[($7_1 + 84 | 0) >> 2] | 0) + 8 | 0;
       HEAP32[($7_1 + 88 | 0) >> 2] = (HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 8 | 0;
       if ((HEAP32[($7_1 + 84 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 80 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
        continue label$18
       }
       break label$18;
      };
      break label$16;
     }
     label$19 : while (1) {
      $140(HEAP32[($7_1 + 84 | 0) >> 2] | 0 | 0, HEAP32[($7_1 + 88 | 0) >> 2] | 0 | 0);
      HEAP32[($7_1 + 84 | 0) >> 2] = (HEAP32[($7_1 + 84 | 0) >> 2] | 0) + 16 | 0;
      HEAP32[($7_1 + 88 | 0) >> 2] = (HEAP32[($7_1 + 88 | 0) >> 2] | 0) + 16 | 0;
      if ((HEAP32[($7_1 + 84 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 80 | 0) >> 2] | 0) >>> 0 & 1 | 0) {
       continue label$19
      }
      break label$19;
     };
    }
    HEAP32[($7_1 + 20 | 0) >> 2] = (HEAP32[($7_1 + 20 | 0) >> 2] | 0) + ((HEAP32[($7_1 + 24 | 0) >> 2] | 0) - (HEAP32[($7_1 + 28 | 0) >> 2] | 0) | 0) | 0;
    HEAP32[($7_1 + 28 | 0) >> 2] = HEAP32[($7_1 + 24 | 0) >> 2] | 0;
   }
   label$20 : while (1) {
    if (!((HEAP32[($7_1 + 28 | 0) >> 2] | 0) >>> 0 < (HEAP32[($7_1 + 4 | 0) >> 2] | 0) >>> 0 & 1 | 0)) {
     break label$3
    }
    $256 = HEAP32[($7_1 + 20 | 0) >> 2] | 0;
    HEAP32[($7_1 + 20 | 0) >> 2] = $256 + 1 | 0;
    $259 = HEAPU8[$256 >> 0] | 0;
    $260 = HEAP32[($7_1 + 28 | 0) >> 2] | 0;
    HEAP32[($7_1 + 28 | 0) >> 2] = $260 + 1 | 0;
    HEAP8[$260 >> 0] = $259;
    continue label$20;
   };
  }
  label$21 : {
   $266 = $7_1 + 112 | 0;
   if ($266 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $266;
  }
  return;
 }
 
 function $144() {
  var $0_1 = 0, $1_1 = 0, $2_1 = 0;
  $0_1 = 0;
  label$1 : while (1) {
   $1_1 = $0_1 << 4 | 0;
   $2_1 = $1_1 + 3984 | 0;
   HEAP32[($1_1 + 3988 | 0) >> 2] = $2_1;
   HEAP32[($1_1 + 3992 | 0) >> 2] = $2_1;
   $0_1 = $0_1 + 1 | 0;
   if (($0_1 | 0) != (64 | 0)) {
    continue label$1
   }
   break label$1;
  };
  $145(48 | 0) | 0;
 }
 
 function $145($0_1) {
  $0_1 = $0_1 | 0;
  var $4_1 = 0, $2_1 = 0, $1_1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$4 = 0, $3_1 = 0, $5_1 = 0, $6_1 = 0, $16_1 = 0, $187 = 0, $187$hi = 0, $189$hi = 0, $190$hi = 0, $191 = 0;
  label$1 : {
   $1_1 = $152($0_1 | 0) | 0;
   if (($1_1 | 0) < (1 | 0)) {
    break label$1
   }
   $2_1 = 16;
   $3_1 = $1_1 + $0_1 | 0;
   $4_1 = $3_1 + -16 | 0;
   HEAP32[($4_1 + 12 | 0) >> 2] = 16;
   HEAP32[$4_1 >> 2] = 16;
   label$2 : {
    label$3 : {
     label$4 : {
      $0_1 = HEAP32[(0 + 5008 | 0) >> 2] | 0;
      if (!$0_1) {
       break label$4
      }
      if (($1_1 | 0) != (HEAP32[($0_1 + 8 | 0) >> 2] | 0 | 0)) {
       break label$4
      }
      $2_1 = HEAP32[($1_1 + -4 | 0) >> 2] | 0;
      $5_1 = $1_1 - (($2_1 >> 31 | 0) ^ $2_1 | 0) | 0;
      $6_1 = HEAP32[($5_1 + -4 | 0) >> 2] | 0;
      HEAP32[($0_1 + 8 | 0) >> 2] = $3_1;
      $2_1 = -16;
      $0_1 = $5_1 - ($6_1 ^ ($6_1 >> 31 | 0) | 0) | 0;
      if ((HEAP32[(($0_1 + (HEAP32[$0_1 >> 2] | 0) | 0) + -4 | 0) >> 2] | 0 | 0) > (-1 | 0)) {
       break label$3
      }
      $2_1 = HEAP32[($0_1 + 4 | 0) >> 2] | 0;
      HEAP32[($2_1 + 8 | 0) >> 2] = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
      HEAP32[((HEAP32[($0_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] = $2_1;
      $4_1 = $4_1 - $0_1 | 0;
      HEAP32[$0_1 >> 2] = $4_1;
      HEAP32[((($4_1 & -4 | 0) + $0_1 | 0) + -4 | 0) >> 2] = $4_1 ^ -1 | 0;
      label$5 : {
       label$6 : {
        $4_1 = (HEAP32[$0_1 >> 2] | 0) + -8 | 0;
        if ($4_1 >>> 0 > 127 >>> 0) {
         break label$6
        }
        $4_1 = ($4_1 >>> 3 | 0) + -1 | 0;
        break label$5;
       }
       $2_1 = Math_clz32($4_1);
       label$7 : {
        if ($4_1 >>> 0 > 4095 >>> 0) {
         break label$7
        }
        $4_1 = ((($4_1 >>> (29 - $2_1 | 0) | 0) ^ 4 | 0) - ($2_1 << 2 | 0) | 0) + 110 | 0;
        break label$5;
       }
       $4_1 = ((($4_1 >>> (30 - $2_1 | 0) | 0) ^ 2 | 0) - ($2_1 << 1 | 0) | 0) + 71 | 0;
       $4_1 = $4_1 >>> 0 < 63 >>> 0 ? $4_1 : 63;
      }
      $2_1 = $4_1 << 4 | 0;
      HEAP32[($0_1 + 4 | 0) >> 2] = $2_1 + 3984 | 0;
      $2_1 = $2_1 + 3992 | 0;
      HEAP32[($0_1 + 8 | 0) >> 2] = HEAP32[$2_1 >> 2] | 0;
      break label$2;
     }
     HEAP32[($1_1 + 12 | 0) >> 2] = 16;
     HEAP32[$1_1 >> 2] = 16;
     HEAP32[($1_1 + 8 | 0) >> 2] = $3_1;
     HEAP32[($1_1 + 4 | 0) >> 2] = $0_1;
     HEAP32[(0 + 5008 | 0) >> 2] = $1_1;
    }
    $0_1 = $1_1 + $2_1 | 0;
    $4_1 = $4_1 - $0_1 | 0;
    HEAP32[$0_1 >> 2] = $4_1;
    HEAP32[((($4_1 & -4 | 0) + $0_1 | 0) + -4 | 0) >> 2] = $4_1 ^ -1 | 0;
    label$8 : {
     label$9 : {
      $4_1 = (HEAP32[$0_1 >> 2] | 0) + -8 | 0;
      if ($4_1 >>> 0 > 127 >>> 0) {
       break label$9
      }
      $4_1 = ($4_1 >>> 3 | 0) + -1 | 0;
      break label$8;
     }
     $2_1 = Math_clz32($4_1);
     label$10 : {
      if ($4_1 >>> 0 > 4095 >>> 0) {
       break label$10
      }
      $4_1 = ((($4_1 >>> (29 - $2_1 | 0) | 0) ^ 4 | 0) - ($2_1 << 2 | 0) | 0) + 110 | 0;
      break label$8;
     }
     $4_1 = ((($4_1 >>> (30 - $2_1 | 0) | 0) ^ 2 | 0) - ($2_1 << 1 | 0) | 0) + 71 | 0;
     $4_1 = $4_1 >>> 0 < 63 >>> 0 ? $4_1 : 63;
    }
    $2_1 = $4_1 << 4 | 0;
    HEAP32[($0_1 + 4 | 0) >> 2] = $2_1 + 3984 | 0;
    $2_1 = $2_1 + 3992 | 0;
    HEAP32[($0_1 + 8 | 0) >> 2] = HEAP32[$2_1 >> 2] | 0;
   }
   HEAP32[$2_1 >> 2] = $0_1;
   HEAP32[((HEAP32[($0_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] = $0_1;
   i64toi32_i32$2 = 0;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 5016 | 0) >> 2] | 0;
   i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 5020 | 0) >> 2] | 0;
   $187 = i64toi32_i32$0;
   $187$hi = i64toi32_i32$1;
   i64toi32_i32$1 = 0;
   $189$hi = i64toi32_i32$1;
   i64toi32_i32$1 = 0;
   i64toi32_i32$2 = 1;
   i64toi32_i32$0 = $189$hi;
   i64toi32_i32$4 = $4_1 & 31 | 0;
   if (32 >>> 0 <= ($4_1 & 63 | 0) >>> 0) {
    i64toi32_i32$0 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
    $16_1 = 0;
   } else {
    i64toi32_i32$0 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
    $16_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
   }
   $190$hi = i64toi32_i32$0;
   i64toi32_i32$0 = $187$hi;
   i64toi32_i32$1 = $187;
   i64toi32_i32$2 = $190$hi;
   i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
   $191 = i64toi32_i32$1 | $16_1 | 0;
   i64toi32_i32$1 = 0;
   HEAP32[(i64toi32_i32$1 + 5016 | 0) >> 2] = $191;
   HEAP32[(i64toi32_i32$1 + 5020 | 0) >> 2] = i64toi32_i32$2;
  }
  return ($1_1 | 0) > (0 | 0) | 0;
 }
 
 function $146($0_1, $1_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, i64toi32_i32$2 = 0, $2_1 = 0, $3_1 = 0, i64toi32_i32$3 = 0, i64toi32_i32$4 = 0, $4_1 = 0, $6_1 = 0, $8_1 = 0, $8$hi = 0, $7$hi = 0, $7_1 = 0, $23_1 = 0, $24_1 = 0, $5_1 = 0, $25_1 = 0, $26_1 = 0, $58$hi = 0, $110_1 = 0, $110$hi = 0, $112$hi = 0, $113_1 = 0, $113$hi = 0, $114_1 = 0;
  label$1 : {
   label$2 : {
    label$3 : while (1) {
     if ($0_1 & ($0_1 + -1 | 0) | 0) {
      break label$2
     }
     $2_1 = $0_1 >>> 0 > 8 >>> 0;
     label$4 : {
      label$5 : {
       $1_1 = $1_1 >>> 0 > 8 >>> 0 ? ($1_1 + 3 | 0) & -4 | 0 : 8;
       if ($1_1 >>> 0 > 127 >>> 0) {
        break label$5
       }
       $3_1 = ($1_1 >>> 3 | 0) + -1 | 0;
       break label$4;
      }
      $3_1 = Math_clz32($1_1);
      label$6 : {
       if ($1_1 >>> 0 > 4095 >>> 0) {
        break label$6
       }
       $3_1 = ((($1_1 >>> (29 - $3_1 | 0) | 0) ^ 4 | 0) - ($3_1 << 2 | 0) | 0) + 110 | 0;
       break label$4;
      }
      $3_1 = ((($1_1 >>> (30 - $3_1 | 0) | 0) ^ 2 | 0) - ($3_1 << 1 | 0) | 0) + 71 | 0;
      $3_1 = $3_1 >>> 0 < 63 >>> 0 ? $3_1 : 63;
     }
     $0_1 = $2_1 ? $0_1 : 8;
     label$7 : {
      i64toi32_i32$2 = 0;
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 5016 | 0) >> 2] | 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 5020 | 0) >> 2] | 0;
      $7_1 = i64toi32_i32$0;
      $7$hi = i64toi32_i32$1;
      i64toi32_i32$1 = 0;
      $58$hi = i64toi32_i32$1;
      i64toi32_i32$1 = $7$hi;
      i64toi32_i32$2 = i64toi32_i32$0;
      i64toi32_i32$0 = $58$hi;
      i64toi32_i32$3 = $3_1;
      i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
      if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
       i64toi32_i32$0 = 0;
       $23_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
      } else {
       i64toi32_i32$0 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
       $23_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
      }
      $8_1 = $23_1;
      $8$hi = i64toi32_i32$0;
      if (!($8_1 | i64toi32_i32$0 | 0)) {
       break label$7
      }
      label$8 : while (1) {
       i64toi32_i32$0 = $8$hi;
       i64toi32_i32$0 = __wasm_ctz_i64($8_1 | 0, i64toi32_i32$0 | 0) | 0;
       i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
       $7_1 = i64toi32_i32$0;
       $7$hi = i64toi32_i32$2;
       i64toi32_i32$2 = $8$hi;
       i64toi32_i32$1 = $8_1;
       i64toi32_i32$0 = $7$hi;
       i64toi32_i32$3 = $7_1;
       i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
       if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
        i64toi32_i32$0 = 0;
        $24_1 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
       } else {
        i64toi32_i32$0 = i64toi32_i32$2 >>> i64toi32_i32$4 | 0;
        $24_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$2 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$1 >>> i64toi32_i32$4 | 0) | 0;
       }
       $8_1 = $24_1;
       $8$hi = i64toi32_i32$0;
       label$9 : {
        label$10 : {
         i64toi32_i32$0 = $7$hi;
         $3_1 = $3_1 + $7_1 | 0;
         $4_1 = $3_1 << 4 | 0;
         $2_1 = HEAP32[($4_1 + 3992 | 0) >> 2] | 0;
         $5_1 = $4_1 + 3984 | 0;
         if (($2_1 | 0) == ($5_1 | 0)) {
          break label$10
         }
         $6_1 = $147($2_1 | 0, $0_1 | 0, $1_1 | 0) | 0;
         if ($6_1) {
          break label$1
         }
         $6_1 = HEAP32[($2_1 + 4 | 0) >> 2] | 0;
         HEAP32[($6_1 + 8 | 0) >> 2] = HEAP32[($2_1 + 8 | 0) >> 2] | 0;
         HEAP32[((HEAP32[($2_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] = $6_1;
         HEAP32[($2_1 + 8 | 0) >> 2] = $5_1;
         $4_1 = $4_1 + 3988 | 0;
         HEAP32[($2_1 + 4 | 0) >> 2] = HEAP32[$4_1 >> 2] | 0;
         HEAP32[$4_1 >> 2] = $2_1;
         HEAP32[((HEAP32[($2_1 + 4 | 0) >> 2] | 0) + 8 | 0) >> 2] = $2_1;
         i64toi32_i32$0 = $8$hi;
         i64toi32_i32$2 = $8_1;
         i64toi32_i32$1 = 0;
         i64toi32_i32$3 = 1;
         i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
         if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
          i64toi32_i32$1 = 0;
          $25_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
         } else {
          i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
          $25_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
         }
         $8_1 = $25_1;
         $8$hi = i64toi32_i32$1;
         $3_1 = $3_1 + 1 | 0;
         break label$9;
        }
        i64toi32_i32$0 = 0;
        i64toi32_i32$1 = HEAP32[(i64toi32_i32$0 + 5016 | 0) >> 2] | 0;
        i64toi32_i32$2 = HEAP32[(i64toi32_i32$0 + 5020 | 0) >> 2] | 0;
        $110_1 = i64toi32_i32$1;
        $110$hi = i64toi32_i32$2;
        i64toi32_i32$2 = 0;
        $112$hi = i64toi32_i32$2;
        i64toi32_i32$2 = -1;
        i64toi32_i32$1 = $112$hi;
        i64toi32_i32$1 = __wasm_rotl_i64(-2 | 0, i64toi32_i32$2 | 0, $3_1 | 0, i64toi32_i32$1 | 0) | 0;
        i64toi32_i32$2 = i64toi32_i32$HIGH_BITS;
        $113_1 = i64toi32_i32$1;
        $113$hi = i64toi32_i32$2;
        i64toi32_i32$2 = $110$hi;
        i64toi32_i32$0 = $110_1;
        i64toi32_i32$1 = $113$hi;
        i64toi32_i32$3 = $113_1;
        i64toi32_i32$1 = i64toi32_i32$2 & i64toi32_i32$1 | 0;
        $114_1 = i64toi32_i32$0 & i64toi32_i32$3 | 0;
        i64toi32_i32$0 = 0;
        HEAP32[(i64toi32_i32$0 + 5016 | 0) >> 2] = $114_1;
        HEAP32[(i64toi32_i32$0 + 5020 | 0) >> 2] = i64toi32_i32$1;
        i64toi32_i32$1 = $8$hi;
        i64toi32_i32$2 = $8_1;
        i64toi32_i32$0 = 0;
        i64toi32_i32$3 = 1;
        i64toi32_i32$0 = i64toi32_i32$1 ^ i64toi32_i32$0 | 0;
        $8_1 = i64toi32_i32$2 ^ i64toi32_i32$3 | 0;
        $8$hi = i64toi32_i32$0;
       }
       i64toi32_i32$0 = $8$hi;
       i64toi32_i32$1 = $8_1;
       i64toi32_i32$2 = 0;
       i64toi32_i32$3 = 0;
       if ((i64toi32_i32$1 | 0) != (i64toi32_i32$3 | 0) | (i64toi32_i32$0 | 0) != (i64toi32_i32$2 | 0) | 0) {
        continue label$8
       }
       break label$8;
      };
      i64toi32_i32$3 = 0;
      i64toi32_i32$1 = HEAP32[(i64toi32_i32$3 + 5016 | 0) >> 2] | 0;
      i64toi32_i32$0 = HEAP32[(i64toi32_i32$3 + 5020 | 0) >> 2] | 0;
      $7_1 = i64toi32_i32$1;
      $7$hi = i64toi32_i32$0;
     }
     i64toi32_i32$0 = $7$hi;
     i64toi32_i32$1 = $7_1;
     i64toi32_i32$2 = Math_clz32(i64toi32_i32$0);
     i64toi32_i32$3 = 0;
     if ((i64toi32_i32$2 | 0) == (32 | 0)) {
      $26_1 = Math_clz32(i64toi32_i32$1) + 32 | 0
     } else {
      $26_1 = i64toi32_i32$2
     }
     $2_1 = (63 - $26_1 | 0) << 4 | 0;
     $4_1 = $2_1 + 3984 | 0;
     $2_1 = HEAP32[($2_1 + 3992 | 0) >> 2] | 0;
     label$11 : {
      i64toi32_i32$3 = $7$hi;
      i64toi32_i32$1 = $7_1;
      i64toi32_i32$0 = 0;
      i64toi32_i32$2 = 1073741824;
      if (i64toi32_i32$3 >>> 0 < i64toi32_i32$0 >>> 0 | ((i64toi32_i32$3 | 0) == (i64toi32_i32$0 | 0) & i64toi32_i32$1 >>> 0 < i64toi32_i32$2 >>> 0 | 0) | 0) {
       break label$11
      }
      $3_1 = 99;
      if (($2_1 | 0) == ($4_1 | 0)) {
       break label$11
      }
      label$12 : while (1) {
       if (!$3_1) {
        break label$11
       }
       $6_1 = $147($2_1 | 0, $0_1 | 0, $1_1 | 0) | 0;
       if ($6_1) {
        break label$1
       }
       $3_1 = $3_1 + -1 | 0;
       $2_1 = HEAP32[($2_1 + 8 | 0) >> 2] | 0;
       if (($2_1 | 0) != ($4_1 | 0)) {
        continue label$12
       }
       break label$12;
      };
      $2_1 = $4_1;
     }
     if ($145($1_1 + 48 | 0 | 0) | 0) {
      continue label$3
     }
     break label$3;
    };
    if (($2_1 | 0) == ($4_1 | 0)) {
     break label$2
    }
    label$13 : while (1) {
     $6_1 = $147($2_1 | 0, $0_1 | 0, $1_1 | 0) | 0;
     if ($6_1) {
      break label$1
     }
     $2_1 = HEAP32[($2_1 + 8 | 0) >> 2] | 0;
     if (($2_1 | 0) != ($4_1 | 0)) {
      continue label$13
     }
     break label$13;
    };
   }
   $6_1 = 0;
  }
  return $6_1 | 0;
 }
 
 function $147($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $3_1 = 0, $4_1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, $5_1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$4 = 0, $15_1 = 0, $139_1 = 0, $139$hi = 0, $141$hi = 0, $142$hi = 0, $143_1 = 0;
  $3_1 = 0;
  label$1 : {
   $4_1 = $0_1 + 4 | 0;
   $5_1 = (($1_1 + $4_1 | 0) + -1 | 0) & (0 - $1_1 | 0) | 0;
   $1_1 = HEAP32[$0_1 >> 2] | 0;
   if (($5_1 + $2_1 | 0) >>> 0 > (($0_1 + $1_1 | 0) + -4 | 0) >>> 0) {
    break label$1
   }
   $3_1 = HEAP32[($0_1 + 4 | 0) >> 2] | 0;
   HEAP32[($3_1 + 8 | 0) >> 2] = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
   HEAP32[((HEAP32[($0_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] = $3_1;
   label$2 : {
    if (($4_1 | 0) == ($5_1 | 0)) {
     break label$2
    }
    $3_1 = HEAP32[($0_1 + -4 | 0) >> 2] | 0;
    $3_1 = $0_1 - (($3_1 >> 31 | 0) ^ $3_1 | 0) | 0;
    $4_1 = $5_1 - $4_1 | 0;
    $5_1 = (HEAP32[$3_1 >> 2] | 0) + $4_1 | 0;
    HEAP32[$3_1 >> 2] = $5_1;
    HEAP32[((($5_1 & -4 | 0) + $3_1 | 0) + -4 | 0) >> 2] = $5_1;
    $0_1 = $0_1 + $4_1 | 0;
    $1_1 = $1_1 - $4_1 | 0;
    HEAP32[$0_1 >> 2] = $1_1;
   }
   label$3 : {
    label$4 : {
     if (($2_1 + 24 | 0) >>> 0 > $1_1 >>> 0) {
      break label$4
     }
     $3_1 = ($0_1 + $2_1 | 0) + 8 | 0;
     $1_1 = $1_1 - $2_1 | 0;
     $4_1 = $1_1 + -8 | 0;
     HEAP32[$3_1 >> 2] = $4_1;
     HEAP32[((($4_1 & -4 | 0) + $3_1 | 0) + -4 | 0) >> 2] = 7 - $1_1 | 0;
     label$5 : {
      label$6 : {
       $1_1 = (HEAP32[$3_1 >> 2] | 0) + -8 | 0;
       if ($1_1 >>> 0 > 127 >>> 0) {
        break label$6
       }
       $1_1 = ($1_1 >>> 3 | 0) + -1 | 0;
       break label$5;
      }
      $4_1 = Math_clz32($1_1);
      label$7 : {
       if ($1_1 >>> 0 > 4095 >>> 0) {
        break label$7
       }
       $1_1 = ((($1_1 >>> (29 - $4_1 | 0) | 0) ^ 4 | 0) - ($4_1 << 2 | 0) | 0) + 110 | 0;
       break label$5;
      }
      $1_1 = ((($1_1 >>> (30 - $4_1 | 0) | 0) ^ 2 | 0) - ($4_1 << 1 | 0) | 0) + 71 | 0;
      $1_1 = $1_1 >>> 0 < 63 >>> 0 ? $1_1 : 63;
     }
     $4_1 = $1_1 << 4 | 0;
     HEAP32[($3_1 + 4 | 0) >> 2] = $4_1 + 3984 | 0;
     $4_1 = $4_1 + 3992 | 0;
     HEAP32[($3_1 + 8 | 0) >> 2] = HEAP32[$4_1 >> 2] | 0;
     HEAP32[$4_1 >> 2] = $3_1;
     HEAP32[((HEAP32[($3_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] = $3_1;
     i64toi32_i32$2 = 0;
     i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 5016 | 0) >> 2] | 0;
     i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 5020 | 0) >> 2] | 0;
     $139_1 = i64toi32_i32$0;
     $139$hi = i64toi32_i32$1;
     i64toi32_i32$1 = 0;
     $141$hi = i64toi32_i32$1;
     i64toi32_i32$1 = 0;
     i64toi32_i32$2 = 1;
     i64toi32_i32$0 = $141$hi;
     i64toi32_i32$4 = $1_1 & 31 | 0;
     if (32 >>> 0 <= ($1_1 & 63 | 0) >>> 0) {
      i64toi32_i32$0 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
      $15_1 = 0;
     } else {
      i64toi32_i32$0 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
      $15_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
     }
     $142$hi = i64toi32_i32$0;
     i64toi32_i32$0 = $139$hi;
     i64toi32_i32$1 = $139_1;
     i64toi32_i32$2 = $142$hi;
     i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
     $143_1 = i64toi32_i32$1 | $15_1 | 0;
     i64toi32_i32$1 = 0;
     HEAP32[(i64toi32_i32$1 + 5016 | 0) >> 2] = $143_1;
     HEAP32[(i64toi32_i32$1 + 5020 | 0) >> 2] = i64toi32_i32$2;
     $2_1 = $2_1 + 8 | 0;
     HEAP32[$0_1 >> 2] = $2_1;
     HEAP32[((($2_1 & -4 | 0) + $0_1 | 0) + -4 | 0) >> 2] = $2_1;
     break label$3;
    }
    HEAP32[(($0_1 + $1_1 | 0) + -4 | 0) >> 2] = $1_1;
   }
   $3_1 = $0_1 + 4 | 0;
  }
  return $3_1 | 0;
 }
 
 function $148($0_1) {
  $0_1 = $0_1 | 0;
  return $146(8 | 0, $0_1 | 0) | 0 | 0;
 }
 
 function $149($0_1) {
  $0_1 = $0_1 | 0;
  var $3_1 = 0, $4_1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, $1_1 = 0, i64toi32_i32$0 = 0, $2_1 = 0, i64toi32_i32$4 = 0, $5_1 = 0, $15_1 = 0, $120_1 = 0, $120$hi = 0, $122$hi = 0, $123$hi = 0, $124_1 = 0;
  label$1 : {
   if (!$0_1) {
    break label$1
   }
   $1_1 = $0_1 + -4 | 0;
   $2_1 = HEAP32[$1_1 >> 2] | 0;
   $3_1 = $2_1;
   $4_1 = $1_1;
   label$2 : {
    $0_1 = HEAP32[($0_1 + -8 | 0) >> 2] | 0;
    if (($0_1 | 0) > (-1 | 0)) {
     break label$2
    }
    $4_1 = $0_1 + $1_1 | 0;
    $3_1 = HEAP32[($4_1 + 5 | 0) >> 2] | 0;
    $5_1 = $4_1 + 9 | 0;
    HEAP32[($3_1 + 8 | 0) >> 2] = HEAP32[$5_1 >> 2] | 0;
    HEAP32[((HEAP32[$5_1 >> 2] | 0) + 4 | 0) >> 2] = $3_1;
    $3_1 = $2_1 + ($0_1 ^ -1 | 0) | 0;
    $4_1 = $4_1 + 1 | 0;
   }
   label$3 : {
    $0_1 = $1_1 + $2_1 | 0;
    $1_1 = HEAP32[$0_1 >> 2] | 0;
    if (($1_1 | 0) == (HEAP32[(($0_1 + $1_1 | 0) + -4 | 0) >> 2] | 0 | 0)) {
     break label$3
    }
    $2_1 = HEAP32[($0_1 + 4 | 0) >> 2] | 0;
    HEAP32[($2_1 + 8 | 0) >> 2] = HEAP32[($0_1 + 8 | 0) >> 2] | 0;
    HEAP32[((HEAP32[($0_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] = $2_1;
    $3_1 = $1_1 + $3_1 | 0;
   }
   HEAP32[$4_1 >> 2] = $3_1;
   HEAP32[((($3_1 & -4 | 0) + $4_1 | 0) + -4 | 0) >> 2] = $3_1 ^ -1 | 0;
   label$4 : {
    label$5 : {
     $3_1 = (HEAP32[$4_1 >> 2] | 0) + -8 | 0;
     if ($3_1 >>> 0 > 127 >>> 0) {
      break label$5
     }
     $3_1 = ($3_1 >>> 3 | 0) + -1 | 0;
     break label$4;
    }
    $0_1 = Math_clz32($3_1);
    label$6 : {
     if ($3_1 >>> 0 > 4095 >>> 0) {
      break label$6
     }
     $3_1 = ((($3_1 >>> (29 - $0_1 | 0) | 0) ^ 4 | 0) - ($0_1 << 2 | 0) | 0) + 110 | 0;
     break label$4;
    }
    $3_1 = ((($3_1 >>> (30 - $0_1 | 0) | 0) ^ 2 | 0) - ($0_1 << 1 | 0) | 0) + 71 | 0;
    $3_1 = $3_1 >>> 0 < 63 >>> 0 ? $3_1 : 63;
   }
   $0_1 = $3_1 << 4 | 0;
   HEAP32[($4_1 + 4 | 0) >> 2] = $0_1 + 3984 | 0;
   $0_1 = $0_1 + 3992 | 0;
   HEAP32[($4_1 + 8 | 0) >> 2] = HEAP32[$0_1 >> 2] | 0;
   HEAP32[$0_1 >> 2] = $4_1;
   HEAP32[((HEAP32[($4_1 + 8 | 0) >> 2] | 0) + 4 | 0) >> 2] = $4_1;
   i64toi32_i32$2 = 0;
   i64toi32_i32$0 = HEAP32[(i64toi32_i32$2 + 5016 | 0) >> 2] | 0;
   i64toi32_i32$1 = HEAP32[(i64toi32_i32$2 + 5020 | 0) >> 2] | 0;
   $120_1 = i64toi32_i32$0;
   $120$hi = i64toi32_i32$1;
   i64toi32_i32$1 = 0;
   $122$hi = i64toi32_i32$1;
   i64toi32_i32$1 = 0;
   i64toi32_i32$2 = 1;
   i64toi32_i32$0 = $122$hi;
   i64toi32_i32$4 = $3_1 & 31 | 0;
   if (32 >>> 0 <= ($3_1 & 63 | 0) >>> 0) {
    i64toi32_i32$0 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
    $15_1 = 0;
   } else {
    i64toi32_i32$0 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$1 << i64toi32_i32$4 | 0) | 0;
    $15_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
   }
   $123$hi = i64toi32_i32$0;
   i64toi32_i32$0 = $120$hi;
   i64toi32_i32$1 = $120_1;
   i64toi32_i32$2 = $123$hi;
   i64toi32_i32$2 = i64toi32_i32$0 | i64toi32_i32$2 | 0;
   $124_1 = i64toi32_i32$1 | $15_1 | 0;
   i64toi32_i32$1 = 0;
   HEAP32[(i64toi32_i32$1 + 5016 | 0) >> 2] = $124_1;
   HEAP32[(i64toi32_i32$1 + 5020 | 0) >> 2] = i64toi32_i32$2;
  }
 }
 
 function $150($0_1) {
  $0_1 = $0_1 | 0;
  $149($0_1 | 0);
 }
 
 function $151() {
  return 5024 | 0;
 }
 
 function $152($0_1) {
  $0_1 = $0_1 | 0;
  var $2_1 = 0, $1_1 = 0, $3_1 = 0;
  $1_1 = $0() | 0;
  $2_1 = HEAP32[$1_1 >> 2] | 0;
  $3_1 = ($0_1 + 3 | 0) & -4 | 0;
  $0_1 = $2_1 + $3_1 | 0;
  label$1 : {
   label$2 : {
    if (($3_1 | 0) < (1 | 0)) {
     break label$2
    }
    if ($0_1 >>> 0 <= $2_1 >>> 0) {
     break label$1
    }
   }
   label$3 : {
    if ($0_1 >>> 0 <= (__wasm_memory_size() << 16 | 0) >>> 0) {
     break label$3
    }
    if (!(fimport$0($0_1 | 0) | 0)) {
     break label$1
    }
   }
   HEAP32[$1_1 >> 2] = $0_1;
   return $2_1 | 0;
  }
  HEAP32[($151() | 0) >> 2] = 48;
  return -1 | 0;
 }
 
 function $153($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $4_1 = 0, $3_1 = 0, $5_1 = 0;
  label$1 : {
   if ($2_1 >>> 0 < 512 >>> 0) {
    break label$1
   }
   fimport$1($0_1 | 0, $1_1 | 0, $2_1 | 0) | 0;
   return $0_1 | 0;
  }
  $3_1 = $0_1 + $2_1 | 0;
  label$2 : {
   label$3 : {
    if (($1_1 ^ $0_1 | 0) & 3 | 0) {
     break label$3
    }
    label$4 : {
     label$5 : {
      if (($2_1 | 0) >= (1 | 0)) {
       break label$5
      }
      $2_1 = $0_1;
      break label$4;
     }
     label$6 : {
      if ($0_1 & 3 | 0) {
       break label$6
      }
      $2_1 = $0_1;
      break label$4;
     }
     $2_1 = $0_1;
     label$7 : while (1) {
      HEAP8[$2_1 >> 0] = HEAPU8[$1_1 >> 0] | 0;
      $1_1 = $1_1 + 1 | 0;
      $2_1 = $2_1 + 1 | 0;
      if ($2_1 >>> 0 >= $3_1 >>> 0) {
       break label$4
      }
      if ($2_1 & 3 | 0) {
       continue label$7
      }
      break label$7;
     };
    }
    label$8 : {
     $4_1 = $3_1 & -4 | 0;
     if ($4_1 >>> 0 < 64 >>> 0) {
      break label$8
     }
     $5_1 = $4_1 + -64 | 0;
     if ($2_1 >>> 0 > $5_1 >>> 0) {
      break label$8
     }
     label$9 : while (1) {
      HEAP32[$2_1 >> 2] = HEAP32[$1_1 >> 2] | 0;
      HEAP32[($2_1 + 4 | 0) >> 2] = HEAP32[($1_1 + 4 | 0) >> 2] | 0;
      HEAP32[($2_1 + 8 | 0) >> 2] = HEAP32[($1_1 + 8 | 0) >> 2] | 0;
      HEAP32[($2_1 + 12 | 0) >> 2] = HEAP32[($1_1 + 12 | 0) >> 2] | 0;
      HEAP32[($2_1 + 16 | 0) >> 2] = HEAP32[($1_1 + 16 | 0) >> 2] | 0;
      HEAP32[($2_1 + 20 | 0) >> 2] = HEAP32[($1_1 + 20 | 0) >> 2] | 0;
      HEAP32[($2_1 + 24 | 0) >> 2] = HEAP32[($1_1 + 24 | 0) >> 2] | 0;
      HEAP32[($2_1 + 28 | 0) >> 2] = HEAP32[($1_1 + 28 | 0) >> 2] | 0;
      HEAP32[($2_1 + 32 | 0) >> 2] = HEAP32[($1_1 + 32 | 0) >> 2] | 0;
      HEAP32[($2_1 + 36 | 0) >> 2] = HEAP32[($1_1 + 36 | 0) >> 2] | 0;
      HEAP32[($2_1 + 40 | 0) >> 2] = HEAP32[($1_1 + 40 | 0) >> 2] | 0;
      HEAP32[($2_1 + 44 | 0) >> 2] = HEAP32[($1_1 + 44 | 0) >> 2] | 0;
      HEAP32[($2_1 + 48 | 0) >> 2] = HEAP32[($1_1 + 48 | 0) >> 2] | 0;
      HEAP32[($2_1 + 52 | 0) >> 2] = HEAP32[($1_1 + 52 | 0) >> 2] | 0;
      HEAP32[($2_1 + 56 | 0) >> 2] = HEAP32[($1_1 + 56 | 0) >> 2] | 0;
      HEAP32[($2_1 + 60 | 0) >> 2] = HEAP32[($1_1 + 60 | 0) >> 2] | 0;
      $1_1 = $1_1 + 64 | 0;
      $2_1 = $2_1 + 64 | 0;
      if ($2_1 >>> 0 <= $5_1 >>> 0) {
       continue label$9
      }
      break label$9;
     };
    }
    if ($2_1 >>> 0 >= $4_1 >>> 0) {
     break label$2
    }
    label$10 : while (1) {
     HEAP32[$2_1 >> 2] = HEAP32[$1_1 >> 2] | 0;
     $1_1 = $1_1 + 4 | 0;
     $2_1 = $2_1 + 4 | 0;
     if ($2_1 >>> 0 < $4_1 >>> 0) {
      continue label$10
     }
     break label$2;
    };
   }
   label$11 : {
    if ($3_1 >>> 0 >= 4 >>> 0) {
     break label$11
    }
    $2_1 = $0_1;
    break label$2;
   }
   label$12 : {
    $4_1 = $3_1 + -4 | 0;
    if ($4_1 >>> 0 >= $0_1 >>> 0) {
     break label$12
    }
    $2_1 = $0_1;
    break label$2;
   }
   $2_1 = $0_1;
   label$13 : while (1) {
    HEAP8[$2_1 >> 0] = HEAPU8[$1_1 >> 0] | 0;
    HEAP8[($2_1 + 1 | 0) >> 0] = HEAPU8[($1_1 + 1 | 0) >> 0] | 0;
    HEAP8[($2_1 + 2 | 0) >> 0] = HEAPU8[($1_1 + 2 | 0) >> 0] | 0;
    HEAP8[($2_1 + 3 | 0) >> 0] = HEAPU8[($1_1 + 3 | 0) >> 0] | 0;
    $1_1 = $1_1 + 4 | 0;
    $2_1 = $2_1 + 4 | 0;
    if ($2_1 >>> 0 <= $4_1 >>> 0) {
     continue label$13
    }
    break label$13;
   };
  }
  label$14 : {
   if ($2_1 >>> 0 >= $3_1 >>> 0) {
    break label$14
   }
   label$15 : while (1) {
    HEAP8[$2_1 >> 0] = HEAPU8[$1_1 >> 0] | 0;
    $1_1 = $1_1 + 1 | 0;
    $2_1 = $2_1 + 1 | 0;
    if (($2_1 | 0) != ($3_1 | 0)) {
     continue label$15
    }
    break label$15;
   };
  }
  return $0_1 | 0;
 }
 
 function $154($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $3_1 = 0, i64toi32_i32$2 = 0, i64toi32_i32$0 = 0, $4_1 = 0, $6_1 = 0, i64toi32_i32$1 = 0, i64toi32_i32$4 = 0, $6$hi = 0, i64toi32_i32$3 = 0, $5_1 = 0, $14_1 = 0, $104$hi = 0;
  label$1 : {
   if (!$2_1) {
    break label$1
   }
   $3_1 = $2_1 + $0_1 | 0;
   HEAP8[($3_1 + -1 | 0) >> 0] = $1_1;
   HEAP8[$0_1 >> 0] = $1_1;
   if ($2_1 >>> 0 < 3 >>> 0) {
    break label$1
   }
   HEAP8[($3_1 + -2 | 0) >> 0] = $1_1;
   HEAP8[($0_1 + 1 | 0) >> 0] = $1_1;
   HEAP8[($3_1 + -3 | 0) >> 0] = $1_1;
   HEAP8[($0_1 + 2 | 0) >> 0] = $1_1;
   if ($2_1 >>> 0 < 7 >>> 0) {
    break label$1
   }
   HEAP8[($3_1 + -4 | 0) >> 0] = $1_1;
   HEAP8[($0_1 + 3 | 0) >> 0] = $1_1;
   if ($2_1 >>> 0 < 9 >>> 0) {
    break label$1
   }
   $4_1 = (0 - $0_1 | 0) & 3 | 0;
   $3_1 = $0_1 + $4_1 | 0;
   $1_1 = Math_imul($1_1 & 255 | 0, 16843009);
   HEAP32[$3_1 >> 2] = $1_1;
   $4_1 = ($2_1 - $4_1 | 0) & -4 | 0;
   $2_1 = $3_1 + $4_1 | 0;
   HEAP32[($2_1 + -4 | 0) >> 2] = $1_1;
   if ($4_1 >>> 0 < 9 >>> 0) {
    break label$1
   }
   HEAP32[($3_1 + 8 | 0) >> 2] = $1_1;
   HEAP32[($3_1 + 4 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -8 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -12 | 0) >> 2] = $1_1;
   if ($4_1 >>> 0 < 25 >>> 0) {
    break label$1
   }
   HEAP32[($3_1 + 24 | 0) >> 2] = $1_1;
   HEAP32[($3_1 + 20 | 0) >> 2] = $1_1;
   HEAP32[($3_1 + 16 | 0) >> 2] = $1_1;
   HEAP32[($3_1 + 12 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -16 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -20 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -24 | 0) >> 2] = $1_1;
   HEAP32[($2_1 + -28 | 0) >> 2] = $1_1;
   $5_1 = $3_1 & 4 | 0 | 24 | 0;
   $2_1 = $4_1 - $5_1 | 0;
   if ($2_1 >>> 0 < 32 >>> 0) {
    break label$1
   }
   i64toi32_i32$0 = 0;
   $6_1 = $1_1;
   $6$hi = i64toi32_i32$0;
   i64toi32_i32$2 = $1_1;
   i64toi32_i32$1 = 0;
   i64toi32_i32$3 = 32;
   i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
   if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
    i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
    $14_1 = 0;
   } else {
    i64toi32_i32$1 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$4 | 0) | 0;
    $14_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
   }
   $104$hi = i64toi32_i32$1;
   i64toi32_i32$1 = $6$hi;
   i64toi32_i32$1 = $104$hi;
   i64toi32_i32$0 = $14_1;
   i64toi32_i32$2 = $6$hi;
   i64toi32_i32$3 = $6_1;
   i64toi32_i32$2 = i64toi32_i32$1 | i64toi32_i32$2 | 0;
   $6_1 = i64toi32_i32$0 | $6_1 | 0;
   $6$hi = i64toi32_i32$2;
   $1_1 = $3_1 + $5_1 | 0;
   label$2 : while (1) {
    i64toi32_i32$2 = $6$hi;
    i64toi32_i32$0 = $1_1;
    HEAP32[($1_1 + 24 | 0) >> 2] = $6_1;
    HEAP32[($1_1 + 28 | 0) >> 2] = i64toi32_i32$2;
    i64toi32_i32$0 = $1_1;
    HEAP32[($1_1 + 16 | 0) >> 2] = $6_1;
    HEAP32[($1_1 + 20 | 0) >> 2] = i64toi32_i32$2;
    i64toi32_i32$0 = $1_1;
    HEAP32[($1_1 + 8 | 0) >> 2] = $6_1;
    HEAP32[($1_1 + 12 | 0) >> 2] = i64toi32_i32$2;
    i64toi32_i32$0 = $1_1;
    HEAP32[$1_1 >> 2] = $6_1;
    HEAP32[($1_1 + 4 | 0) >> 2] = i64toi32_i32$2;
    $1_1 = $1_1 + 32 | 0;
    $2_1 = $2_1 + -32 | 0;
    if ($2_1 >>> 0 > 31 >>> 0) {
     continue label$2
    }
    break label$2;
   };
  }
  return $0_1 | 0;
 }
 
 function $155($0_1, $1_1, $2_1) {
  $0_1 = $0_1 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $3_1 = 0;
  label$1 : {
   if (($0_1 | 0) == ($1_1 | 0)) {
    break label$1
   }
   label$2 : {
    if ((($1_1 - $0_1 | 0) - $2_1 | 0) >>> 0 > (0 - ($2_1 << 1 | 0) | 0) >>> 0) {
     break label$2
    }
    return $153($0_1 | 0, $1_1 | 0, $2_1 | 0) | 0 | 0;
   }
   $3_1 = ($1_1 ^ $0_1 | 0) & 3 | 0;
   label$3 : {
    label$4 : {
     label$5 : {
      if ($0_1 >>> 0 >= $1_1 >>> 0) {
       break label$5
      }
      label$6 : {
       if (!$3_1) {
        break label$6
       }
       $3_1 = $0_1;
       break label$3;
      }
      label$7 : {
       if ($0_1 & 3 | 0) {
        break label$7
       }
       $3_1 = $0_1;
       break label$4;
      }
      $3_1 = $0_1;
      label$8 : while (1) {
       if (!$2_1) {
        break label$1
       }
       HEAP8[$3_1 >> 0] = HEAPU8[$1_1 >> 0] | 0;
       $1_1 = $1_1 + 1 | 0;
       $2_1 = $2_1 + -1 | 0;
       $3_1 = $3_1 + 1 | 0;
       if (!($3_1 & 3 | 0)) {
        break label$4
       }
       continue label$8;
      };
     }
     label$9 : {
      if ($3_1) {
       break label$9
      }
      label$10 : {
       if (!(($0_1 + $2_1 | 0) & 3 | 0)) {
        break label$10
       }
       label$11 : while (1) {
        if (!$2_1) {
         break label$1
        }
        $2_1 = $2_1 + -1 | 0;
        $3_1 = $0_1 + $2_1 | 0;
        HEAP8[$3_1 >> 0] = HEAPU8[($1_1 + $2_1 | 0) >> 0] | 0;
        if ($3_1 & 3 | 0) {
         continue label$11
        }
        break label$11;
       };
      }
      if ($2_1 >>> 0 <= 3 >>> 0) {
       break label$9
      }
      label$12 : while (1) {
       $2_1 = $2_1 + -4 | 0;
       HEAP32[($0_1 + $2_1 | 0) >> 2] = HEAP32[($1_1 + $2_1 | 0) >> 2] | 0;
       if ($2_1 >>> 0 > 3 >>> 0) {
        continue label$12
       }
       break label$12;
      };
     }
     if (!$2_1) {
      break label$1
     }
     label$13 : while (1) {
      $2_1 = $2_1 + -1 | 0;
      HEAP8[($0_1 + $2_1 | 0) >> 0] = HEAPU8[($1_1 + $2_1 | 0) >> 0] | 0;
      if ($2_1) {
       continue label$13
      }
      break label$1;
     };
    }
    if ($2_1 >>> 0 <= 3 >>> 0) {
     break label$3
    }
    label$14 : while (1) {
     HEAP32[$3_1 >> 2] = HEAP32[$1_1 >> 2] | 0;
     $1_1 = $1_1 + 4 | 0;
     $3_1 = $3_1 + 4 | 0;
     $2_1 = $2_1 + -4 | 0;
     if ($2_1 >>> 0 > 3 >>> 0) {
      continue label$14
     }
     break label$14;
    };
   }
   if (!$2_1) {
    break label$1
   }
   label$15 : while (1) {
    HEAP8[$3_1 >> 0] = HEAPU8[$1_1 >> 0] | 0;
    $3_1 = $3_1 + 1 | 0;
    $1_1 = $1_1 + 1 | 0;
    $2_1 = $2_1 + -1 | 0;
    if ($2_1) {
     continue label$15
    }
    break label$15;
   };
  }
  return $0_1 | 0;
 }
 
 function $156() {
  return global$0 | 0;
 }
 
 function $157($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0;
  $1_1 = $0_1;
  if ($1_1 >>> 0 < global$2 >>> 0) {
   fimport$2()
  }
  global$0 = $1_1;
 }
 
 function $158($0_1) {
  $0_1 = $0_1 | 0;
  var $1_1 = 0, $3_1 = 0;
  label$1 : {
   $1_1 = (global$0 - $0_1 | 0) & -16 | 0;
   $3_1 = $1_1;
   if ($1_1 >>> 0 < global$2 >>> 0) {
    fimport$2()
   }
   global$0 = $3_1;
  }
  return $1_1 | 0;
 }
 
 function $159($0_1) {
  $0_1 = $0_1 | 0;
  global$2 = $0_1;
 }
 
 function $160($0_1) {
  $0_1 = $0_1 | 0;
  return abort() | 0;
 }
 
 function _ZN17compiler_builtins3int3mul3Mul3mul17h070e9a1c69faec5bE(var$0, var$0$hi, var$1, var$1$hi) {
  var$0 = var$0 | 0;
  var$0$hi = var$0$hi | 0;
  var$1 = var$1 | 0;
  var$1$hi = var$1$hi | 0;
  var i64toi32_i32$4 = 0, i64toi32_i32$0 = 0, i64toi32_i32$1 = 0, var$2 = 0, i64toi32_i32$2 = 0, i64toi32_i32$3 = 0, var$3 = 0, var$4 = 0, var$5 = 0, $21_1 = 0, $22_1 = 0, var$6 = 0, $24_1 = 0, $17_1 = 0, $18_1 = 0, $23_1 = 0, $29_1 = 0, $45_1 = 0, $56$hi = 0, $62$hi = 0;
  i64toi32_i32$0 = var$1$hi;
  var$2 = var$1;
  var$4 = var$2 >>> 16 | 0;
  i64toi32_i32$0 = var$0$hi;
  var$3 = var$0;
  var$5 = var$3 >>> 16 | 0;
  $17_1 = Math_imul(var$4, var$5);
  $18_1 = var$2;
  i64toi32_i32$2 = var$3;
  i64toi32_i32$1 = 0;
  i64toi32_i32$3 = 32;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$1 = 0;
   $21_1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$1 = i64toi32_i32$0 >>> i64toi32_i32$4 | 0;
   $21_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$0 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$2 >>> i64toi32_i32$4 | 0) | 0;
  }
  $23_1 = $17_1 + Math_imul($18_1, $21_1) | 0;
  i64toi32_i32$1 = var$1$hi;
  i64toi32_i32$0 = var$1;
  i64toi32_i32$2 = 0;
  i64toi32_i32$3 = 32;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = 0;
   $22_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
   $22_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
  }
  $29_1 = $23_1 + Math_imul($22_1, var$3) | 0;
  var$2 = var$2 & 65535 | 0;
  var$3 = var$3 & 65535 | 0;
  var$6 = Math_imul(var$2, var$3);
  var$2 = (var$6 >>> 16 | 0) + Math_imul(var$2, var$5) | 0;
  $45_1 = $29_1 + (var$2 >>> 16 | 0) | 0;
  var$2 = (var$2 & 65535 | 0) + Math_imul(var$4, var$3) | 0;
  i64toi32_i32$2 = 0;
  i64toi32_i32$1 = $45_1 + (var$2 >>> 16 | 0) | 0;
  i64toi32_i32$0 = 0;
  i64toi32_i32$3 = 32;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$0 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
   $24_1 = 0;
  } else {
   i64toi32_i32$0 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$1 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$2 << i64toi32_i32$4 | 0) | 0;
   $24_1 = i64toi32_i32$1 << i64toi32_i32$4 | 0;
  }
  $56$hi = i64toi32_i32$0;
  i64toi32_i32$0 = 0;
  $62$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $56$hi;
  i64toi32_i32$2 = $24_1;
  i64toi32_i32$1 = $62$hi;
  i64toi32_i32$3 = var$2 << 16 | 0 | (var$6 & 65535 | 0) | 0;
  i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1 | 0;
  i64toi32_i32$2 = i64toi32_i32$2 | i64toi32_i32$3 | 0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
  return i64toi32_i32$2 | 0;
 }
 
 function __wasm_ctz_i64(var$0, var$0$hi) {
  var$0 = var$0 | 0;
  var$0$hi = var$0$hi | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$3 = 0, i64toi32_i32$5 = 0, i64toi32_i32$4 = 0, i64toi32_i32$2 = 0, i64toi32_i32$1 = 0, $10_1 = 0, $5$hi = 0, $8$hi = 0;
  i64toi32_i32$0 = var$0$hi;
  if (!!(var$0 | i64toi32_i32$0 | 0)) {
   i64toi32_i32$0 = var$0$hi;
   i64toi32_i32$2 = var$0;
   i64toi32_i32$1 = -1;
   i64toi32_i32$3 = -1;
   i64toi32_i32$4 = i64toi32_i32$2 + i64toi32_i32$3 | 0;
   i64toi32_i32$5 = i64toi32_i32$0 + i64toi32_i32$1 | 0;
   if (i64toi32_i32$4 >>> 0 < i64toi32_i32$3 >>> 0) {
    i64toi32_i32$5 = i64toi32_i32$5 + 1 | 0
   }
   $5$hi = i64toi32_i32$5;
   i64toi32_i32$5 = var$0$hi;
   i64toi32_i32$5 = $5$hi;
   i64toi32_i32$0 = i64toi32_i32$4;
   i64toi32_i32$2 = var$0$hi;
   i64toi32_i32$3 = var$0;
   i64toi32_i32$2 = i64toi32_i32$5 ^ i64toi32_i32$2 | 0;
   i64toi32_i32$0 = i64toi32_i32$0 ^ i64toi32_i32$3 | 0;
   i64toi32_i32$3 = Math_clz32(i64toi32_i32$2);
   i64toi32_i32$5 = 0;
   if ((i64toi32_i32$3 | 0) == (32 | 0)) {
    $10_1 = Math_clz32(i64toi32_i32$0) + 32 | 0
   } else {
    $10_1 = i64toi32_i32$3
   }
   $8$hi = i64toi32_i32$5;
   i64toi32_i32$5 = 0;
   i64toi32_i32$0 = 63;
   i64toi32_i32$2 = $8$hi;
   i64toi32_i32$3 = $10_1;
   i64toi32_i32$1 = i64toi32_i32$0 - i64toi32_i32$3 | 0;
   i64toi32_i32$4 = (i64toi32_i32$0 >>> 0 < i64toi32_i32$3 >>> 0) + i64toi32_i32$2 | 0;
   i64toi32_i32$4 = i64toi32_i32$5 - i64toi32_i32$4 | 0;
   i64toi32_i32$0 = i64toi32_i32$1;
   i64toi32_i32$HIGH_BITS = i64toi32_i32$4;
   return i64toi32_i32$0 | 0;
  }
  i64toi32_i32$0 = 0;
  i64toi32_i32$4 = 64;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$0;
  return i64toi32_i32$4 | 0;
 }
 
 function __wasm_i64_mul(var$0, var$0$hi, var$1, var$1$hi) {
  var$0 = var$0 | 0;
  var$0$hi = var$0$hi | 0;
  var$1 = var$1 | 0;
  var$1$hi = var$1$hi | 0;
  var i64toi32_i32$0 = 0, i64toi32_i32$1 = 0;
  i64toi32_i32$0 = var$0$hi;
  i64toi32_i32$0 = var$1$hi;
  i64toi32_i32$0 = var$0$hi;
  i64toi32_i32$1 = var$1$hi;
  i64toi32_i32$1 = _ZN17compiler_builtins3int3mul3Mul3mul17h070e9a1c69faec5bE(var$0 | 0, i64toi32_i32$0 | 0, var$1 | 0, i64toi32_i32$1 | 0) | 0;
  i64toi32_i32$0 = i64toi32_i32$HIGH_BITS;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$0;
  return i64toi32_i32$1 | 0;
 }
 
 function __wasm_rotl_i64(var$0, var$0$hi, var$1, var$1$hi) {
  var$0 = var$0 | 0;
  var$0$hi = var$0$hi | 0;
  var$1 = var$1 | 0;
  var$1$hi = var$1$hi | 0;
  var i64toi32_i32$1 = 0, i64toi32_i32$0 = 0, i64toi32_i32$2 = 0, i64toi32_i32$3 = 0, i64toi32_i32$5 = 0, i64toi32_i32$4 = 0, var$2$hi = 0, var$2 = 0, $19_1 = 0, $20_1 = 0, $21_1 = 0, $22_1 = 0, $6$hi = 0, $8$hi = 0, $10_1 = 0, $10$hi = 0, $15$hi = 0, $17$hi = 0, $19$hi = 0;
  i64toi32_i32$0 = var$1$hi;
  i64toi32_i32$2 = var$1;
  i64toi32_i32$1 = 0;
  i64toi32_i32$3 = 63;
  i64toi32_i32$1 = i64toi32_i32$0 & i64toi32_i32$1 | 0;
  var$2 = i64toi32_i32$2 & i64toi32_i32$3 | 0;
  var$2$hi = i64toi32_i32$1;
  i64toi32_i32$1 = -1;
  i64toi32_i32$0 = -1;
  i64toi32_i32$2 = var$2$hi;
  i64toi32_i32$3 = var$2;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$2 = 0;
   $19_1 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
  } else {
   i64toi32_i32$2 = i64toi32_i32$1 >>> i64toi32_i32$4 | 0;
   $19_1 = (((1 << i64toi32_i32$4 | 0) - 1 | 0) & i64toi32_i32$1 | 0) << (32 - i64toi32_i32$4 | 0) | 0 | (i64toi32_i32$0 >>> i64toi32_i32$4 | 0) | 0;
  }
  $6$hi = i64toi32_i32$2;
  i64toi32_i32$2 = var$0$hi;
  i64toi32_i32$2 = $6$hi;
  i64toi32_i32$1 = $19_1;
  i64toi32_i32$0 = var$0$hi;
  i64toi32_i32$3 = var$0;
  i64toi32_i32$0 = i64toi32_i32$2 & i64toi32_i32$0 | 0;
  $8$hi = i64toi32_i32$0;
  i64toi32_i32$0 = var$2$hi;
  i64toi32_i32$0 = $8$hi;
  i64toi32_i32$2 = i64toi32_i32$1 & i64toi32_i32$3 | 0;
  i64toi32_i32$1 = var$2$hi;
  i64toi32_i32$3 = var$2;
  i64toi32_i32$4 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
   $20_1 = 0;
  } else {
   i64toi32_i32$1 = ((1 << i64toi32_i32$4 | 0) - 1 | 0) & (i64toi32_i32$2 >>> (32 - i64toi32_i32$4 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$4 | 0) | 0;
   $20_1 = i64toi32_i32$2 << i64toi32_i32$4 | 0;
  }
  $10_1 = $20_1;
  $10$hi = i64toi32_i32$1;
  i64toi32_i32$1 = var$1$hi;
  i64toi32_i32$1 = 0;
  i64toi32_i32$0 = 0;
  i64toi32_i32$2 = var$1$hi;
  i64toi32_i32$3 = var$1;
  i64toi32_i32$4 = i64toi32_i32$0 - i64toi32_i32$3 | 0;
  i64toi32_i32$5 = (i64toi32_i32$0 >>> 0 < i64toi32_i32$3 >>> 0) + i64toi32_i32$2 | 0;
  i64toi32_i32$5 = i64toi32_i32$1 - i64toi32_i32$5 | 0;
  i64toi32_i32$1 = i64toi32_i32$4;
  i64toi32_i32$0 = 0;
  i64toi32_i32$3 = 63;
  i64toi32_i32$0 = i64toi32_i32$5 & i64toi32_i32$0 | 0;
  var$1 = i64toi32_i32$1 & i64toi32_i32$3 | 0;
  var$1$hi = i64toi32_i32$0;
  i64toi32_i32$0 = -1;
  i64toi32_i32$5 = -1;
  i64toi32_i32$1 = var$1$hi;
  i64toi32_i32$3 = var$1;
  i64toi32_i32$2 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$1 = i64toi32_i32$5 << i64toi32_i32$2 | 0;
   $21_1 = 0;
  } else {
   i64toi32_i32$1 = ((1 << i64toi32_i32$2 | 0) - 1 | 0) & (i64toi32_i32$5 >>> (32 - i64toi32_i32$2 | 0) | 0) | 0 | (i64toi32_i32$0 << i64toi32_i32$2 | 0) | 0;
   $21_1 = i64toi32_i32$5 << i64toi32_i32$2 | 0;
  }
  $15$hi = i64toi32_i32$1;
  i64toi32_i32$1 = var$0$hi;
  i64toi32_i32$1 = $15$hi;
  i64toi32_i32$0 = $21_1;
  i64toi32_i32$5 = var$0$hi;
  i64toi32_i32$3 = var$0;
  i64toi32_i32$5 = i64toi32_i32$1 & i64toi32_i32$5 | 0;
  $17$hi = i64toi32_i32$5;
  i64toi32_i32$5 = var$1$hi;
  i64toi32_i32$5 = $17$hi;
  i64toi32_i32$1 = i64toi32_i32$0 & i64toi32_i32$3 | 0;
  i64toi32_i32$0 = var$1$hi;
  i64toi32_i32$3 = var$1;
  i64toi32_i32$2 = i64toi32_i32$3 & 31 | 0;
  if (32 >>> 0 <= (i64toi32_i32$3 & 63 | 0) >>> 0) {
   i64toi32_i32$0 = 0;
   $22_1 = i64toi32_i32$5 >>> i64toi32_i32$2 | 0;
  } else {
   i64toi32_i32$0 = i64toi32_i32$5 >>> i64toi32_i32$2 | 0;
   $22_1 = (((1 << i64toi32_i32$2 | 0) - 1 | 0) & i64toi32_i32$5 | 0) << (32 - i64toi32_i32$2 | 0) | 0 | (i64toi32_i32$1 >>> i64toi32_i32$2 | 0) | 0;
  }
  $19$hi = i64toi32_i32$0;
  i64toi32_i32$0 = $10$hi;
  i64toi32_i32$5 = $10_1;
  i64toi32_i32$1 = $19$hi;
  i64toi32_i32$3 = $22_1;
  i64toi32_i32$1 = i64toi32_i32$0 | i64toi32_i32$1 | 0;
  i64toi32_i32$5 = i64toi32_i32$5 | i64toi32_i32$3 | 0;
  i64toi32_i32$HIGH_BITS = i64toi32_i32$1;
  return i64toi32_i32$5 | 0;
 }
 
 // EMSCRIPTEN_END_FUNCS
;
 function __wasm_memory_size() {
  return buffer.byteLength / 65536 | 0;
 }
 
 return {
  "__wasm_call_ctors": $1, 
  "malloc": $148, 
  "free": $150, 
  "ZSTD_getInBuffer": $20, 
  "ZSTD_getOutBuffer": $21, 
  "ZSTD_isError": $22, 
  "ZSTD_createDStream": $109, 
  "ZSTD_freeDStream": $111, 
  "ZSTD_DStreamInSize": $112, 
  "ZSTD_DStreamOutSize": $113, 
  "ZSTD_initDStream": $115, 
  "ZSTD_decompressStream": $119, 
  "ZSTD_decompressStream_simpleArgs": $127, 
  "__errno_location": $151, 
  "stackSave": $156, 
  "stackRestore": $157, 
  "stackAlloc": $158, 
  "__set_stack_limit": $159, 
  "__growWasmMemory": $160
 };
}

var bufferView = new Uint8Array(wasmMemory.buffer);
for (var base64ReverseLookup = new Uint8Array(123/*'z'+1*/), i = 25; i >= 0; --i) {
    base64ReverseLookup[48+i] = 52+i; // '0-9'
    base64ReverseLookup[65+i] = i; // 'A-Z'
    base64ReverseLookup[97+i] = 26+i; // 'a-z'
  }
  base64ReverseLookup[43] = 62; // '+'
  base64ReverseLookup[47] = 63; // '/'
  /** @noinline Inlining this function would mean expanding the base64 string 4x times in the source code, which Closure seems to be happy to do. */
  function base64DecodeToExistingUint8Array(uint8Array, offset, b64) {
    var b1, b2, i = 0, j = offset, bLength = b64.length, end = offset + (bLength*3>>2) - (b64[bLength-2] == '=') - (b64[bLength-1] == '=');
    for (; i < bLength; i += 4) {
      b1 = base64ReverseLookup[b64.charCodeAt(i+1)];
      b2 = base64ReverseLookup[b64.charCodeAt(i+2)];
      uint8Array[j++] = base64ReverseLookup[b64.charCodeAt(i)] << 2 | b1 >> 4;
      if (j < end) uint8Array[j++] = b1 << 4 | b2 >> 2;
      if (j < end) uint8Array[j++] = b2 << 6 | base64ReverseLookup[b64.charCodeAt(i+3)];
    } 
  }
  base64DecodeToExistingUint8Array(bufferView, 1024, "AAAAAAAAAAABAAAAAQAAAAIAAAACAAAAAAAAAAAAAAABAAAAAQAAAAIAAAACAAAAJgAAAIIAAAAhBQAASgAAAGcIAAAmAAAAwAEAAIAAAABJBQAASgAAAL4IAAApAAAALAIAAIAAAABJBQAASgAAAL4IAAAvAAAAygIAAIAAAACKBQAASgAAAIQJAAA1AAAAcwMAAIAAAACdBQAASgAAAKAJAAA9AAAAgQMAAIAAAADrBQAASwAAAD4KAABEAAAAngMAAIAAAABNBgAASwAAAKoKAABLAAAAswMAAIAAAADBBgAATQAAAB8NAABNAAAAUwQAAIAAAAAjCAAAUQAAAKYPAABUAAAAmQQAAIAAAABLCQAAVwAAALESAABYAAAA2gQAAIAAAABvCQAAXQAAACMUAABUAAAARQUAAIAAAABUCgAAagAAAIwUAABqAAAArwUAAIAAAAB2CQAAfAAAAE4QAAB8AAAA0gIAAIAAAABjBwAAkQAAAJAHAACSAAAAAAAAAAEAAAABAAAABQAAAA0AAAAdAAAAPQAAAH0AAAD9AAAA/QEAAP0DAAD9BwAA/Q8AAP0fAAD9PwAA/X8AAP3/AAD9/wEA/f8DAP3/BwD9/w8A/f8fAP3/PwD9/38A/f//AP3//wH9//8D/f//B/3//w/9//8f/f//P/3//38AAAAAAQAAAAIAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAsAAAAMAAAADQAAAA4AAAAPAAAAEAAAABEAAAASAAAAEwAAABQAAAAVAAAAFgAAABcAAAAYAAAAGQAAABoAAAAbAAAAHAAAAB0AAAAeAAAAHwAAAAMAAAAEAAAABQAAAAYAAAAHAAAACAAAAAkAAAAKAAAACwAAAAwAAAANAAAADgAAAA8AAAAQAAAAEQAAABIAAAATAAAAFAAAABUAAAAWAAAAFwAAABgAAAAZAAAAGgAAABsAAAAcAAAAHQAAAB4AAAAfAAAAIAAAACEAAAAiAAAAIwAAACUAAAAnAAAAKQAAACsAAAAvAAAAMwAAADsAAABDAAAAUwAAAGMAAACDAAAAAwEAAAMCAAADBAAAAwgAAAMQAAADIAAAA0AAAAOAAAADAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAADAAAAAwAAAAQAAAAEAAAABQAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAADwAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAsAAAAMAAAADQAAAA4AAAAPAAAAEAAAABIAAAAUAAAAFgAAABgAAAAcAAAAIAAAACgAAAAwAAAAQAAAAIAAAAAAAQAAAAIAAAAEAAAACAAAABAAAAAgAAAAQAAAAIAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAwAAAAMAAAAEAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAADwAAABAAAAABAAAABAAAAAgAAAAAAAAAAQABAQYAAAAAAAAEAAAAABAAAAQAAAAAIAAABQEAAAAAAAAFAwAAAAAAAAUEAAAAAAAABQYAAAAAAAAFBwAAAAAAAAUJAAAAAAAABQoAAAAAAAAFDAAAAAAAAAYOAAAAAAABBRAAAAAAAAEFFAAAAAAAAQUWAAAAAAACBRwAAAAAAAMFIAAAAAAABAUwAAAAIAAGBUAAAAAAAAcFgAAAAAAACAYAAQAAAAAKBgAEAAAAAAwGABAAACAAAAQAAAAAAAAABAEAAAAAAAAFAgAAACAAAAUEAAAAAAAABQUAAAAgAAAFBwAAAAAAAAUIAAAAIAAABQoAAAAAAAAFCwAAAAAAAAYNAAAAIAABBRAAAAAAAAEFEgAAACAAAQUWAAAAAAACBRgAAAAgAAMFIAAAAAAAAwUoAAAAAAAGBEAAAAAQAAYEQAAAACAABwWAAAAAAAAJBgACAAAAAAsGAAgAADAAAAQAAAAAEAAABAEAAAAgAAAFAgAAACAAAAUDAAAAIAAABQUAAAAgAAAFBgAAACAAAAUIAAAAIAAABQkAAAAgAAAFCwAAACAAAAUMAAAAAAAABg8AAAAgAAEFEgAAACAAAQUUAAAAIAACBRgAAAAgAAIFHAAAACAAAwUoAAAAIAAEBTAAAAAAABAGAAABAAAADwYAgAAAAAAOBgBAAAAAAA0GACAAAAAAAAAAAAAAAQABAQUAAAAAAAAFAAAAAAAABgQ9AAAAAAAJBf0BAAAAAA8F/X8AAAAAFQX9/x8AAAADBQUAAAAAAAcEfQAAAAAADAX9DwAAAAASBf3/AwAAABcF/f9/AAAABQUdAAAAAAAIBP0AAAAAAA4F/T8AAAAAFAX9/w8AAAACBQEAAAAQAAcEfQAAAAAACwX9BwAAAAARBf3/AQAAABYF/f8/AAAABAUNAAAAEAAIBP0AAAAAAA0F/R8AAAAAEwX9/wcAAAABBQEAAAAQAAYEPQAAAAAACgX9AwAAAAAQBf3/AAAAABwF/f//DwAAGwX9//8HAAAaBf3//wMAABkF/f//AQAAGAX9//8AAAAAAAAAAAABAAEBBgAAAAAAAAYDAAAAAAAABAQAAAAgAAAFBQAAAAAAAAUGAAAAAAAABQgAAAAAAAAFCQAAAAAAAAULAAAAAAAABg0AAAAAAAAGEAAAAAAAAAYTAAAAAAAABhYAAAAAAAAGGQAAAAAAAAYcAAAAAAAABh8AAAAAAAAGIgAAAAAAAQYlAAAAAAABBikAAAAAAAIGLwAAAAAAAwY7AAAAAAAEBlMAAAAAAAcGgwAAAAAACQYDAgAAEAAABAQAAAAAAAAEBQAAACAAAAUGAAAAAAAABQcAAAAgAAAFCQAAAAAAAAUKAAAAAAAABgwAAAAAAAAGDwAAAAAAAAYSAAAAAAAABhUAAAAAAAAGGAAAAAAAAAYbAAAAAAAABh4AAAAAAAAGIQAAAAAAAQYjAAAAAAABBicAAAAAAAIGKwAAAAAAAwYzAAAAAAAEBkMAAAAAAAUGYwAAAAAACAYDAQAAIAAABAQAAAAwAAAEBAAAABAAAAQFAAAAIAAABQcAAAAgAAAFCAAAACAAAAUKAAAAIAAABQsAAAAAAAAGDgAAAAAAAAYRAAAAAAAABhQAAAAAAAAGFwAAAAAAAAYaAAAAAAAABh0AAAAAAAAGIAAAAAAAEAYDAAEAAAAPBgOAAAAAAA4GA0AAAAAADQYDIAAAAAAMBgMQAAAAAAsGAwgAAAAACgYDBAAAAQAAAAAAAAAAAAAAAQAAAAMAAAAHAAAADwAAAB8AAAA/AAAAfwAAAP8AAAD/AQAA/wMAAP8HAAD/DwAA/x8AAP8/AAD/fwAA//8AAP//AQD//wMA//8HAP//DwD//x8A//8/AP//fwD///8A////Af///wP///8H////D////x////8/////fwAAAAABAAAAAgAAAAQAAAAAAAAAAgAAAAQAAAAIAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAgAAAAEAAAAEAAAABAAAAAQAAAAEAAAACAAAAAgAAAAIAAAABwAAAAgAAAAJAAAACgAAAAsAAAA=");
base64DecodeToExistingUint8Array(bufferView, 3984, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
return asmFunc({
    'Int8Array': Int8Array,
    'Int16Array': Int16Array,
    'Int32Array': Int32Array,
    'Uint8Array': Uint8Array,
    'Uint16Array': Uint16Array,
    'Uint32Array': Uint32Array,
    'Float32Array': Float32Array,
    'Float64Array': Float64Array,
    'NaN': NaN,
    'Infinity': Infinity,
    'Math': Math
  },
  asmLibraryArg,
  wasmMemory.buffer
)

}
)(asmLibraryArg, wasmMemory, wasmTable);
  },

  instantiate: /** @suppress{checkTypes} */ function(binary, info) {
    return {
      then: function(ok) {
        var module = new WebAssembly.Module(binary);
        ok({
          'instance': new WebAssembly.Instance(module)
        });
        // Emulate a simple WebAssembly.instantiate(..).then(()=>{}).catch(()=>{}) syntax.
        return { catch: function() {} };
      }
    };
  },

  RuntimeError: Error
};

// We don't need to actually download a wasm binary, mark it as present but empty.
wasmBinary = [];



if (typeof WebAssembly !== 'object') {
  abort('no native wasm support detected');
}




// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @param {number} ptr
    @param {number} value
    @param {string} type
    @param {number|boolean=} noSafe */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @param {number} ptr
    @param {string} type
    @param {number|boolean=} noSafe */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}






// Wasm globals

var wasmMemory;

// In fastcomp asm.js, we don't need a wasm Table at all.
// In the wasm backend, we polyfill the WebAssembly object,
// so this creates a (non-native-wasm) table for us.
var wasmTable = new WebAssembly.Table({
  'initial': 1,
  'maximum': 1 + 0,
  'element': 'anyfunc'
});


//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
/** @param {string|null=} returnType
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} opts */
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== 'array', 'Return type should not be "array".');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);

  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

/** @param {string=} returnType
    @param {Array=} argTypes
    @param {Object=} opts */
function cwrap(ident, returnType, argTypes, opts) {
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_DYNAMIC = 2; // Cannot be freed except through sbrk
var ALLOC_NONE = 3; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc,
    stackAlloc,
    dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}




// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = heap[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = heap[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = heap[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!');
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | (u >> 6);
      heap[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | (u >> 12);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u >= 0x200000) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).');
      heap[outIdx++] = 0xF0 | (u >> 18);
      heap[outIdx++] = 0x80 | ((u >> 12) & 63);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}





// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
  assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2;
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0 || i == maxBytesToRead / 2) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr, maxBytesToRead) {
  assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
  var i = 0;

  var str = '';
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0) break;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
  return str;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated
    @param {boolean=} dontAddNull */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
  HEAP8.set(array, buffer);
}

/** @param {boolean=} dontAddNull */
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}



// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module['HEAP8'] = HEAP8 = new Int8Array(buf);
  Module['HEAP16'] = HEAP16 = new Int16Array(buf);
  Module['HEAP32'] = HEAP32 = new Int32Array(buf);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
}

var STATIC_BASE = 1024,
    STACK_BASE = 5248080,
    STACKTOP = STACK_BASE,
    STACK_MAX = 5200,
    DYNAMIC_BASE = 5248080,
    DYNAMICTOP_PTR = 5040;

assert(STACK_BASE % 16 === 0, 'stack must start aligned');
assert(DYNAMIC_BASE % 16 === 0, 'heap must start aligned');


var TOTAL_STACK = 5242880;
if (Module['TOTAL_STACK']) assert(TOTAL_STACK === Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime')

var INITIAL_INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 139919360;if (!Object.getOwnPropertyDescriptor(Module, 'INITIAL_MEMORY')) Object.defineProperty(Module, 'INITIAL_MEMORY', { configurable: true, get: function() { abort('Module.INITIAL_MEMORY has been replaced with plain INITIAL_INITIAL_MEMORY (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)') } });

assert(INITIAL_INITIAL_MEMORY >= TOTAL_STACK, 'INITIAL_MEMORY should be larger than TOTAL_STACK, was ' + INITIAL_INITIAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined,
       'JS engine does not provide full typed array support');








// In non-standalone/normal mode, we create the memory here.



// Create the main memory. (Note: this isn't used in STANDALONE_WASM mode since the wasm
// memory is created in the wasm, not in JS.)

  if (Module['wasmMemory']) {
    wasmMemory = Module['wasmMemory'];
  } else
  {
    wasmMemory = new WebAssembly.Memory({
      'initial': INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE
      ,
      'maximum': INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE
    });
  }


if (wasmMemory) {
  buffer = wasmMemory.buffer;
}

// If the user provides an incorrect length, just use that length instead rather than providing the user to
// specifically provide the memory length with Module['INITIAL_MEMORY'].
INITIAL_INITIAL_MEMORY = buffer.byteLength;
assert(INITIAL_INITIAL_MEMORY % WASM_PAGE_SIZE === 0);
updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;






// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  assert((STACK_MAX & 3) == 0);
  // The stack grows downwards
  HEAPU32[(STACK_MAX >> 2)+1] = 0x2135467;
  HEAPU32[(STACK_MAX >> 2)+2] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  // We don't do this with ASan because ASan does its own checks for this.
  HEAP32[0] = 0x63736d65; /* 'emsc' */
}

function checkStackCookie() {
  var cookie1 = HEAPU32[(STACK_MAX >> 2)+1];
  var cookie2 = HEAPU32[(STACK_MAX >> 2)+2];
  if (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x' + cookie2.toString(16) + ' ' + cookie1.toString(16));
  }
  // Also test the global address 0 for integrity.
  // We don't do this with ASan because ASan does its own checks for this.
  if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
}





// Endianness check (note: assumes compiler arch was little-endian)
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';
})();

function abortFnPtrError(ptr, sig) {
	abort("Invalid function pointer " + ptr + " called with signature '" + sig + "'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this). Build with ASSERTIONS=2 for more info.");
}



function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback(Module); // Pass the module as the first argument.
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  checkStackCookie();
  assert(!runtimeInitialized);
  runtimeInitialized = true;
  
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

/** @param {number|boolean=} ignore */
function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
/** @param {number|boolean=} ignore */
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}




// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
// || MIN_NODE_VERSION < 0.12
// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math.imul || Math.imul(0xffffffff, 5) !== -5) Math.imul = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround
if (!Math.fround) {
  var froundBuffer = new Float32Array(1);
  Math.fround = function(x) { froundBuffer[0] = x; return froundBuffer[0] };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
if (!Math.clz32) Math.clz32 = function(x) {
  var n = 32;
  var y = x >> 16; if (y) { n -= 16; x = y; }
  y = x >> 8; if (y) { n -= 8; x = y; }
  y = x >> 4; if (y) { n -= 4; x = y; }
  y = x >> 2; if (y) { n -= 2; x = y; }
  y = x >> 1; if (y) return n - 2;
  return n - x;
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc
if (!Math.trunc) Math.trunc = function(x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x);
};

assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;



// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err('dependency: ' + dep);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

/** @param {string|number=} what */
function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what += '';
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  var output = 'abort(' + what + ') at ' + stackTrace();
  what = output;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  var e = new WebAssembly.RuntimeError(what);

  readyPromiseReject(e);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}


var memoryInitializer = null;







// show errors on likely calls to FS when it was not included
var FS = {
  error: function() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
  },
  init: function() { FS.error() },
  createDataFile: function() { FS.error() },
  createPreloadedFile: function() { FS.error() },
  createLazyFile: function() { FS.error() },
  open: function() { FS.error() },
  mkdev: function() { FS.error() },
  registerDevice: function() { FS.error() },
  analyzePath: function() { FS.error() },
  loadFilesFromDB: function() { FS.error() },

  ErrnoError: function ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;





function hasPrefix(str, prefix) {
  return String.prototype.startsWith ?
      str.startsWith(prefix) :
      str.indexOf(prefix) === 0;
}

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return hasPrefix(filename, dataURIPrefix);
}

var fileURIPrefix = "file://";

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
  return hasPrefix(filename, fileURIPrefix);
}



function createExportWrapper(name, fixedasm) {
  return function() {
    var displayName = name;
    var asm = fixedasm;
    if (!fixedasm) {
      asm = Module['asm'];
    }
    assert(runtimeInitialized, 'native function `' + displayName + '` called before runtime initialization');
    assert(!runtimeExited, 'native function `' + displayName + '` called after runtime exit (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    if (!asm[name]) {
      assert(asm[name], 'exported native function `' + displayName + '` not found');
    }
    return asm[name].apply(null, arguments);
  };
}

var wasmBinaryFile = 'zstdec.wasm';
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
  try {
    if (wasmBinary) {
      return new Uint8Array(wasmBinary);
    }

    var binary = tryParseAsDataURI(wasmBinaryFile);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(wasmBinaryFile);
    } else {
      throw "both async and sync fetching of the wasm failed";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // If we don't have the binary yet, and have the Fetch api, use that;
  // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function'
      // Let's not use fetch to get objects over file:// as it's most likely Cordova which doesn't support fetch for file://
      && !isFileURI(wasmBinaryFile)
      ) {
    return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
      if (!response['ok']) {
        throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
      }
      return response['arrayBuffer']();
    }).catch(function () {
      return getBinary();
    });
  }
  // Otherwise, getBinary should be able to get it synchronously
  return new Promise(function(resolve, reject) {
    resolve(getBinary());
  });
}



// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module['asm'] = exports;
    removeRunDependency('wasm-instantiate');
  }
  // we can't run yet (except in a pthread, where we have a custom sync instantiator)
  addRunDependency('wasm-instantiate');


  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(output['instance']);
  }


  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);


      abort(reason);
    });
  }

  // Prefer streaming instantiation if available.
  function instantiateAsync() {
    if (!wasmBinary &&
        typeof WebAssembly.instantiateStreaming === 'function' &&
        !isDataURI(wasmBinaryFile) &&
        // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
        !isFileURI(wasmBinaryFile) &&
        typeof fetch === 'function') {
      fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function (response) {
        var result = WebAssembly.instantiateStreaming(response, info);
        return result.then(receiveInstantiatedSource, function(reason) {
            // We expect the most common failure cause to be a bad MIME type for the binary,
            // in which case falling back to ArrayBuffer instantiation should work.
            err('wasm streaming compile failed: ' + reason);
            err('falling back to ArrayBuffer instantiation');
            return instantiateArrayBuffer(receiveInstantiatedSource);
          });
      });
    } else {
      return instantiateArrayBuffer(receiveInstantiatedSource);
    }
  }
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  instantiateAsync();
  return {}; // no exports yet; we'll fill them in later
}


// Globals used by JS i64 conversions
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  
};




// STATICTOP = STATIC_BASE + 4176;
/* global initializers */  __ATINIT__.push({ func: function() { ___wasm_call_ctors() } });




/* no memory initializer */
// {{PRE_LIBRARY}}


  function abortStackOverflow(allocSize) {
      abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (STACK_MAX - stackSave() + allocSize) + ' bytes available!');
    }

  function demangle(func) {
      warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
      return func;
    }

  function demangleAll(text) {
      var regex =
        /\b_Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }

  function jsStackTrace() {
      var err = new Error();
      if (!err.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error();
        } catch(e) {
          err = e;
        }
        if (!err.stack) {
          return '(no stack trace available)';
        }
      }
      return err.stack.toString();
    }

  function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }

  function ___handle_stack_overflow() {
      abort('stack overflow')
    }

  function _emscripten_get_sbrk_ptr() {
      return 5040;
    }

  var _emscripten_memcpy_big= Uint8Array.prototype.copyWithin
    ? function(dest, src, num) { HEAPU8.copyWithin(dest, src, src + num); }
    : function(dest, src, num) { HEAPU8.set(HEAPU8.subarray(src, src+num), dest); }
  ;

  
  function _emscripten_get_heap_size() {
      return HEAPU8.length;
    }
  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s INITIAL_MEMORY=X  with X higher than the current value ' + HEAP8.length + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
    }function _emscripten_resize_heap(requestedSize) {
      requestedSize = requestedSize >>> 0;
      abortOnCannotGrowMemory(requestedSize);
    }
var ASSERTIONS = true;



/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {string} input The string to decode.
 */
var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
    var buf;
    try {
      // TODO: Update Node.js externs, Closure does not recognize the following Buffer.from()
      /**@suppress{checkTypes}*/
      buf = Buffer.from(s, 'base64');
    } catch (_) {
      buf = new Buffer(s, 'base64');
    }
    return new Uint8Array(buf['buffer'], buf['byteOffset'], buf['byteLength']);
  }

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}


var asmGlobalArg = {};
var asmLibraryArg = { "__handle_stack_overflow": ___handle_stack_overflow, "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_resize_heap": _emscripten_resize_heap, "getTempRet0": getTempRet0, "memory": wasmMemory, "setTempRet0": setTempRet0, "table": wasmTable };
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors");

/** @type {function(...*):?} */
var _malloc = Module["_malloc"] = createExportWrapper("malloc");

/** @type {function(...*):?} */
var _free = Module["_free"] = createExportWrapper("free");

/** @type {function(...*):?} */
var _ZSTD_getInBuffer = Module["_ZSTD_getInBuffer"] = createExportWrapper("ZSTD_getInBuffer");

/** @type {function(...*):?} */
var _ZSTD_getOutBuffer = Module["_ZSTD_getOutBuffer"] = createExportWrapper("ZSTD_getOutBuffer");

/** @type {function(...*):?} */
var _ZSTD_isError = Module["_ZSTD_isError"] = createExportWrapper("ZSTD_isError");

/** @type {function(...*):?} */
var _ZSTD_createDStream = Module["_ZSTD_createDStream"] = createExportWrapper("ZSTD_createDStream");

/** @type {function(...*):?} */
var _ZSTD_freeDStream = Module["_ZSTD_freeDStream"] = createExportWrapper("ZSTD_freeDStream");

/** @type {function(...*):?} */
var _ZSTD_DStreamInSize = Module["_ZSTD_DStreamInSize"] = createExportWrapper("ZSTD_DStreamInSize");

/** @type {function(...*):?} */
var _ZSTD_DStreamOutSize = Module["_ZSTD_DStreamOutSize"] = createExportWrapper("ZSTD_DStreamOutSize");

/** @type {function(...*):?} */
var _ZSTD_initDStream = Module["_ZSTD_initDStream"] = createExportWrapper("ZSTD_initDStream");

/** @type {function(...*):?} */
var _ZSTD_decompressStream = Module["_ZSTD_decompressStream"] = createExportWrapper("ZSTD_decompressStream");

/** @type {function(...*):?} */
var _ZSTD_decompressStream_simpleArgs = Module["_ZSTD_decompressStream_simpleArgs"] = createExportWrapper("ZSTD_decompressStream_simpleArgs");

/** @type {function(...*):?} */
var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location");

/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = createExportWrapper("stackSave");

/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore");

/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc");

/** @type {function(...*):?} */
var ___set_stack_limit = Module["___set_stack_limit"] = createExportWrapper("__set_stack_limit");

/** @type {function(...*):?} */
var __growWasmMemory = Module["__growWasmMemory"] = createExportWrapper("__growWasmMemory");





// === Auto-generated postamble setup entry stuff ===


if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString")) Module["intArrayFromString"] = function() { abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString")) Module["intArrayToString"] = function() { abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ccall")) Module["ccall"] = function() { abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
Module["cwrap"] = cwrap;
Module["setValue"] = setValue;
Module["getValue"] = getValue;
if (!Object.getOwnPropertyDescriptor(Module, "allocate")) Module["allocate"] = function() { abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getMemory")) Module["getMemory"] = function() { abort("'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString")) Module["UTF8ArrayToString"] = function() { abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString")) Module["UTF8ToString"] = function() { abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array")) Module["stringToUTF8Array"] = function() { abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8")) Module["stringToUTF8"] = function() { abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8")) Module["lengthBytesUTF8"] = function() { abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun")) Module["addOnPreRun"] = function() { abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnInit")) Module["addOnInit"] = function() { abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreMain")) Module["addOnPreMain"] = function() { abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnExit")) Module["addOnExit"] = function() { abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun")) Module["addOnPostRun"] = function() { abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory")) Module["writeStringToMemory"] = function() { abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory")) Module["writeArrayToMemory"] = function() { abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory")) Module["writeAsciiToMemory"] = function() { abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addRunDependency")) Module["addRunDependency"] = function() { abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "removeRunDependency")) Module["removeRunDependency"] = function() { abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder")) Module["FS_createFolder"] = function() { abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPath")) Module["FS_createPath"] = function() { abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDataFile")) Module["FS_createDataFile"] = function() { abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPreloadedFile")) Module["FS_createPreloadedFile"] = function() { abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLazyFile")) Module["FS_createLazyFile"] = function() { abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink")) Module["FS_createLink"] = function() { abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDevice")) Module["FS_createDevice"] = function() { abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_unlink")) Module["FS_unlink"] = function() { abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "dynamicAlloc")) Module["dynamicAlloc"] = function() { abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "loadDynamicLibrary")) Module["loadDynamicLibrary"] = function() { abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "loadWebAssemblyModule")) Module["loadWebAssemblyModule"] = function() { abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getLEB")) Module["getLEB"] = function() { abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables")) Module["getFunctionTables"] = function() { abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables")) Module["alignFunctionTables"] = function() { abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions")) Module["registerFunctions"] = function() { abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addFunction")) Module["addFunction"] = function() { abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "removeFunction")) Module["removeFunction"] = function() { abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint")) Module["prettyPrint"] = function() { abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "makeBigInt")) Module["makeBigInt"] = function() { abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting")) Module["getCompilerSetting"] = function() { abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "print")) Module["print"] = function() { abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "printErr")) Module["printErr"] = function() { abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0")) Module["getTempRet0"] = function() { abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0")) Module["setTempRet0"] = function() { abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "callMain")) Module["callMain"] = function() { abort("'callMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "abort")) Module["abort"] = function() { abort("'abort' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToNewUTF8")) Module["stringToNewUTF8"] = function() { abort("'stringToNewUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "abortOnCannotGrowMemory")) Module["abortOnCannotGrowMemory"] = function() { abort("'abortOnCannotGrowMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emscripten_realloc_buffer")) Module["emscripten_realloc_buffer"] = function() { abort("'emscripten_realloc_buffer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ENV")) Module["ENV"] = function() { abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_CODES")) Module["ERRNO_CODES"] = function() { abort("'ERRNO_CODES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_MESSAGES")) Module["ERRNO_MESSAGES"] = function() { abort("'ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setErrNo")) Module["setErrNo"] = function() { abort("'setErrNo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "DNS")) Module["DNS"] = function() { abort("'DNS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GAI_ERRNO_MESSAGES")) Module["GAI_ERRNO_MESSAGES"] = function() { abort("'GAI_ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "Protocols")) Module["Protocols"] = function() { abort("'Protocols' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "Sockets")) Module["Sockets"] = function() { abort("'Sockets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UNWIND_CACHE")) Module["UNWIND_CACHE"] = function() { abort("'UNWIND_CACHE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgs")) Module["readAsmConstArgs"] = function() { abort("'readAsmConstArgs' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "jstoi_q")) Module["jstoi_q"] = function() { abort("'jstoi_q' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "jstoi_s")) Module["jstoi_s"] = function() { abort("'jstoi_s' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "listenOnce")) Module["listenOnce"] = function() { abort("'listenOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "autoResumeAudioContext")) Module["autoResumeAudioContext"] = function() { abort("'autoResumeAudioContext' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "abortStackOverflow")) Module["abortStackOverflow"] = function() { abort("'abortStackOverflow' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "reallyNegative")) Module["reallyNegative"] = function() { abort("'reallyNegative' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "formatString")) Module["formatString"] = function() { abort("'formatString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "PATH")) Module["PATH"] = function() { abort("'PATH' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "PATH_FS")) Module["PATH_FS"] = function() { abort("'PATH_FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SYSCALLS")) Module["SYSCALLS"] = function() { abort("'SYSCALLS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "syscallMmap2")) Module["syscallMmap2"] = function() { abort("'syscallMmap2' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "syscallMunmap")) Module["syscallMunmap"] = function() { abort("'syscallMunmap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "flush_NO_FILESYSTEM")) Module["flush_NO_FILESYSTEM"] = function() { abort("'flush_NO_FILESYSTEM' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "JSEvents")) Module["JSEvents"] = function() { abort("'JSEvents' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "specialHTMLTargets")) Module["specialHTMLTargets"] = function() { abort("'specialHTMLTargets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "demangle")) Module["demangle"] = function() { abort("'demangle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "demangleAll")) Module["demangleAll"] = function() { abort("'demangleAll' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "jsStackTrace")) Module["jsStackTrace"] = function() { abort("'jsStackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getEnvStrings")) Module["getEnvStrings"] = function() { abort("'getEnvStrings' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "checkWasiClock")) Module["checkWasiClock"] = function() { abort("'checkWasiClock' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64")) Module["writeI53ToI64"] = function() { abort("'writeI53ToI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Clamped")) Module["writeI53ToI64Clamped"] = function() { abort("'writeI53ToI64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Signaling")) Module["writeI53ToI64Signaling"] = function() { abort("'writeI53ToI64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Clamped")) Module["writeI53ToU64Clamped"] = function() { abort("'writeI53ToU64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Signaling")) Module["writeI53ToU64Signaling"] = function() { abort("'writeI53ToU64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "readI53FromI64")) Module["readI53FromI64"] = function() { abort("'readI53FromI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "readI53FromU64")) Module["readI53FromU64"] = function() { abort("'readI53FromU64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "convertI32PairToI53")) Module["convertI32PairToI53"] = function() { abort("'convertI32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "convertU32PairToI53")) Module["convertU32PairToI53"] = function() { abort("'convertU32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "Browser")) Module["Browser"] = function() { abort("'Browser' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GL")) Module["GL"] = function() { abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGet")) Module["emscriptenWebGLGet"] = function() { abort("'emscriptenWebGLGet' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetTexPixelData")) Module["emscriptenWebGLGetTexPixelData"] = function() { abort("'emscriptenWebGLGetTexPixelData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetUniform")) Module["emscriptenWebGLGetUniform"] = function() { abort("'emscriptenWebGLGetUniform' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetVertexAttrib")) Module["emscriptenWebGLGetVertexAttrib"] = function() { abort("'emscriptenWebGLGetVertexAttrib' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeGLArray")) Module["writeGLArray"] = function() { abort("'writeGLArray' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "AL")) Module["AL"] = function() { abort("'AL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_unicode")) Module["SDL_unicode"] = function() { abort("'SDL_unicode' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_ttfContext")) Module["SDL_ttfContext"] = function() { abort("'SDL_ttfContext' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_audio")) Module["SDL_audio"] = function() { abort("'SDL_audio' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SDL")) Module["SDL"] = function() { abort("'SDL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_gfx")) Module["SDL_gfx"] = function() { abort("'SDL_gfx' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GLUT")) Module["GLUT"] = function() { abort("'GLUT' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "EGL")) Module["EGL"] = function() { abort("'EGL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GLFW_Window")) Module["GLFW_Window"] = function() { abort("'GLFW_Window' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GLFW")) Module["GLFW"] = function() { abort("'GLFW' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "GLEW")) Module["GLEW"] = function() { abort("'GLEW' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "IDBStore")) Module["IDBStore"] = function() { abort("'IDBStore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "runAndAbortIfError")) Module["runAndAbortIfError"] = function() { abort("'runAndAbortIfError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "warnOnce")) Module["warnOnce"] = function() { abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackSave")) Module["stackSave"] = function() { abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackRestore")) Module["stackRestore"] = function() { abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc")) Module["stackAlloc"] = function() { abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString")) Module["AsciiToString"] = function() { abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii")) Module["stringToAscii"] = function() { abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString")) Module["UTF16ToString"] = function() { abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16")) Module["stringToUTF16"] = function() { abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16")) Module["lengthBytesUTF16"] = function() { abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString")) Module["UTF32ToString"] = function() { abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32")) Module["stringToUTF32"] = function() { abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32")) Module["lengthBytesUTF32"] = function() { abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8")) Module["allocateUTF8"] = function() { abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack")) Module["allocateUTF8OnStack"] = function() { abort("'allocateUTF8OnStack' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
Module["writeStackCookie"] = writeStackCookie;
Module["checkStackCookie"] = checkStackCookie;
if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromBase64")) Module["intArrayFromBase64"] = function() { abort("'intArrayFromBase64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "tryParseAsDataURI")) Module["tryParseAsDataURI"] = function() { abort("'tryParseAsDataURI' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL")) Object.defineProperty(Module, "ALLOC_NORMAL", { configurable: true, get: function() { abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK")) Object.defineProperty(Module, "ALLOC_STACK", { configurable: true, get: function() { abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_DYNAMIC")) Object.defineProperty(Module, "ALLOC_DYNAMIC", { configurable: true, get: function() { abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NONE")) Object.defineProperty(Module, "ALLOC_NONE", { configurable: true, get: function() { abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });



var calledRun;

/**
 * @constructor
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

var calledMain = false;


dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};





/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }

  writeStackCookie();

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    preMain();

    readyPromiseResolve(Module);
    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}
Module['run'] = run;

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var print = out;
  var printErr = err;
  var has = false;
  out = err = function(x) {
    has = true;
  }
  try { // it doesn't matter if it fails
    var flush = null;
    if (flush) flush();
  } catch(e) {}
  out = print;
  err = printErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -s FORCE_FILESYSTEM=1)');
  }
}

/** @param {boolean|number=} implicit */
function exit(status, implicit) {
  checkUnflushedContent();

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && noExitRuntime && status === 0) {
    return;
  }

  if (noExitRuntime) {
    // if exit() was called, we may warn the user if the runtime isn't actually being shut down
    if (!implicit) {
      var msg = 'program exited (with status: ' + status + '), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)';
      readyPromiseReject(msg);
      err(msg);
    }
  } else {

    ABORT = true;
    EXITSTATUS = status;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  quit_(status, new ExitStatus(status));
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}


  noExitRuntime = true;

run();






// {{MODULE_ADDITIONS}}





  return ZD.ready
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
      module.exports = ZD;
    else if (typeof define === 'function' && define['amd'])
      define([], function() { return ZD; });
    else if (typeof exports === 'object')
      exports["ZD"] = ZD;
    