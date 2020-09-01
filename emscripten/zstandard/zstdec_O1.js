
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
if (Module['arguments']) arguments_ = Module['arguments'];
if (Module['thisProgram']) thisProgram = Module['thisProgram'];
if (Module['quit']) quit_ = Module['quit'];

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message





// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;

function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
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
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
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


var wasmBinary;if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
var noExitRuntime;if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];




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
      var ret = __growWasmMemory(amount);
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
 var global$0 = 5248944;
 var global$1 = 5892;
 var i64toi32_i32$HIGH_BITS = 0;
 // EMSCRIPTEN_START_FUNCS
;
 function $1() {
  $136();
 }
 
 function $2($0) {
  $0 = $0 | 0;
  return $3($0) | 0;
 }
 
 function $3($0) {
  return $0 >>> 0 > 4294967176;
 }
 
 function $5($0) {
  return $3($0) ? 0 - $0 | 0 : 0;
 }
 
 function $6($0) {
  var $1_1 = 0;
  $1_1 = 1047;
  label$1 : {
   switch ($0 | 0) {
   case 1:
    return 1065;
   case 10:
    return 1081;
   case 12:
    return 1106;
   case 14:
    return 1128;
   case 16:
    return 1156;
   case 20:
    return 1200;
   case 22:
    return 1225;
   case 40:
    return 1262;
   case 42:
    return 1284;
   case 62:
    return 1310;
   case 64:
    return 1339;
   case 66:
    return 1376;
   case 60:
    return 1413;
   case 44:
    return 1466;
   case 46:
    return 1514;
   case 48:
    return 1555;
   case 30:
    return 1593;
   case 32:
    return 1617;
   case 34:
    return 1637;
   case 70:
    return 1684;
   case 72:
    return 1716;
   case 74:
    return 1738;
   case 100:
    return 1775;
   case 102:
    return 1800;
   case 104:
    return 1843;
   default:
    $1_1 = 1024;
    break;
   case 0:
    break label$1;
   };
  }
  return $1_1;
 }
 
 function $7($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, wasm2js_i32$0 = 0, wasm2js_i32$1 = 0, wasm2js_i32$2 = 0;
  $12_1 = global$0 - 16 | 0;
  global$0 = $12_1;
  label$1 : {
   if ($4 >>> 0 <= 3) {
    HEAP32[$12_1 + 12 >> 2] = 0;
    $145($12_1 + 12 | 0, $3_1, $4);
    $0 = $7($0, $1_1, $2_1, $12_1 + 12 | 0, 4);
    $8 = (wasm2js_i32$0 = $3($0) ? $0 : -20, wasm2js_i32$1 = $0, wasm2js_i32$2 = $0 >>> 0 > $4 >>> 0, wasm2js_i32$2 ? wasm2js_i32$0 : wasm2js_i32$1);
    break label$1;
   }
   $15_1 = $146($0, 0, (HEAP32[$1_1 >> 2] << 1) + 2 | 0);
   $5_1 = $9($3_1);
   $0 = $5_1 & 15;
   $8 = -44;
   if ($0 >>> 0 > 10) {
    break label$1
   }
   HEAP32[$2_1 >> 2] = $0 + 5;
   $2_1 = $3_1 + $4 | 0;
   $13_1 = $2_1 + -4 | 0;
   $16_1 = $2_1 + -7 | 0;
   $17_1 = $2_1 + -5 | 0;
   $2_1 = 4;
   $4 = $5_1 >>> 4 | 0;
   $14_1 = $0 + 6 | 0;
   $10_1 = 32 << $0;
   $11_1 = $10_1 | 1;
   $9_1 = HEAP32[$1_1 >> 2];
   $6_1 = $3_1;
   $5_1 = 0;
   while (1) {
    label$4 : {
     if (!$7_1) {
      $0 = $5_1;
      break label$4;
     }
     $0 = $5_1;
     if (($4 & 65535) == 65535) {
      while (1) {
       $0 = $0 + 24 | 0;
       label$8 : {
        if ($6_1 >>> 0 < $17_1 >>> 0) {
         $6_1 = $6_1 + 2 | 0;
         $4 = $9($6_1) >>> $2_1 | 0;
         break label$8;
        }
        $2_1 = $2_1 + 16 | 0;
        $4 = $4 >>> 16 | 0;
       }
       if (($4 & 65535) == 65535) {
        continue
       }
       break;
      }
     }
     $7_1 = $4 & 3;
     if (($7_1 | 0) == 3) {
      while (1) {
       $2_1 = $2_1 + 2 | 0;
       $0 = $0 + 3 | 0;
       $4 = $4 >>> 2 | 0;
       $7_1 = $4 & 3;
       if (($7_1 | 0) == 3) {
        continue
       }
       break;
      }
     }
     $2_1 = $2_1 + 2 | 0;
     $7_1 = $0 + $7_1 | 0;
     $9_1 = $7_1 >>> 0 > $9_1 >>> 0;
     label$12 : {
      if ($9_1) {
       $0 = $5_1;
       break label$12;
      }
      label$14 : {
       if ($5_1 >>> 0 >= $7_1 >>> 0) {
        $0 = $5_1;
        break label$14;
       }
       $146(($5_1 << 1) + $15_1 | 0, 0, $7_1 - $5_1 << 1);
       $0 = $5_1;
       while (1) {
        $0 = $0 + 1 | 0;
        if (($7_1 | 0) != ($0 | 0)) {
         continue
        }
        break;
       };
      }
      if (!(($2_1 >> 3) + $6_1 >>> 0 > $13_1 >>> 0 ? $6_1 >>> 0 > $16_1 >>> 0 : 0)) {
       $6_1 = ($2_1 >> 3) + $6_1 | 0;
       $2_1 = $2_1 & 7;
       $4 = $9($6_1) >>> $2_1 | 0;
       break label$12;
      }
      $4 = $4 >>> 2 | 0;
     }
     if (!$9_1) {
      break label$4
     }
     $8 = -48;
     break label$1;
    }
    $7_1 = $10_1 + -1 & $4;
    $5_1 = ($10_1 << 1) + -1 | 0;
    $9_1 = $5_1 - $11_1 | 0;
    $8 = $14_1 + -1 | 0;
    label$18 : {
     if ($7_1 >>> 0 < $9_1 >>> 0) {
      break label$18
     }
     $4 = $4 & $5_1;
     $7_1 = $4 - (($4 | 0) < ($10_1 | 0) ? 0 : $9_1) | 0;
     $8 = $14_1;
    }
    $4 = $8;
    $5_1 = $7_1 + -1 | 0;
    HEAP16[($0 << 1) + $15_1 >> 1] = $5_1;
    $11_1 = $11_1 - (($7_1 | 0) < 1 ? 1 - $7_1 | 0 : $5_1) | 0;
    if (($11_1 | 0) < ($10_1 | 0)) {
     while (1) {
      $14_1 = $14_1 + -1 | 0;
      $10_1 = $10_1 >> 1;
      if (($11_1 | 0) < ($10_1 | 0)) {
       continue
      }
      break;
     }
    }
    $4 = $2_1 + $4 | 0;
    label$21 : {
     if (!(($4 >> 3) + $6_1 >>> 0 > $13_1 >>> 0 ? $6_1 >>> 0 > $16_1 >>> 0 : 0)) {
      $2_1 = $4 & 7;
      $6_1 = ($4 >> 3) + $6_1 | 0;
      break label$21;
     }
     $2_1 = $4 + ($6_1 - $13_1 << 3) | 0;
     $6_1 = $13_1;
    }
    $4 = $9($6_1);
    if (($11_1 | 0) >= 2) {
     $7_1 = !$5_1;
     $4 = $4 >>> ($2_1 & 31) | 0;
     $5_1 = $0 + 1 | 0;
     $9_1 = HEAP32[$1_1 >> 2];
     if ($5_1 >>> 0 <= $9_1 >>> 0) {
      continue
     }
    }
    break;
   };
   $8 = -20;
   if (($11_1 | 0) != 1 | ($2_1 | 0) > 32) {
    break label$1
   }
   HEAP32[$1_1 >> 2] = $0;
   $8 = (($2_1 + 7 >> 3) + $6_1 | 0) - $3_1 | 0;
  }
  $0 = $8;
  global$0 = $12_1 + 16 | 0;
  return $0;
 }
 
 function $9($0) {
  return HEAPU8[$0 | 0] | HEAPU8[$0 + 1 | 0] << 8 | (HEAPU8[$0 + 2 | 0] << 16 | HEAPU8[$0 + 3 | 0] << 24);
 }
 
 function $10($0, $1_1, $2_1, $3_1, $4, $5_1) {
  var $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0;
  $12_1 = global$0 - 272 | 0;
  global$0 = $12_1;
  $7_1 = -72;
  label$1 : {
   if (!$5_1) {
    break label$1
   }
   $6_1 = HEAP8[$4 | 0];
   $9_1 = $6_1 & 255;
   label$2 : {
    label$3 : {
     if (($6_1 | 0) <= -1) {
      $8 = $9_1 + -126 >>> 1 | 0;
      if ($8 >>> 0 >= $5_1 >>> 0) {
       break label$1
      }
      $7_1 = -20;
      $6_1 = $9_1 + -127 | 0;
      if ($6_1 >>> 0 >= 256) {
       break label$1
      }
      if (!$6_1) {
       break label$3
      }
      $4 = $4 + 1 | 0;
      $5_1 = 0;
      while (1) {
       $7_1 = $4 + ($5_1 >>> 1 | 0) | 0;
       HEAP8[$0 + $5_1 | 0] = HEAPU8[$7_1 | 0] >>> 4;
       HEAP8[($5_1 | 1) + $0 | 0] = HEAPU8[$7_1 | 0] & 15;
       $5_1 = $5_1 + 2 | 0;
       if ($5_1 >>> 0 < $6_1 >>> 0) {
        continue
       }
       break;
      };
      break label$3;
     }
     label$6 : {
      if ($9_1 >>> 0 >= $5_1 >>> 0) {
       $5_1 = 0;
       $4 = -72;
       break label$6;
      }
      $6_1 = $11($0, $4 + 1 | 0, $9_1, $12_1);
      $5_1 = !$3($6_1);
      $4 = $6_1;
     }
     $7_1 = $4;
     if (!$5_1) {
      break label$1
     }
     break label$2;
    }
    $9_1 = $8;
   }
   $4 = $1_1;
   HEAP32[$4 >> 2] = 0;
   HEAP32[$4 + 4 >> 2] = 0;
   $5_1 = 0;
   HEAP32[$4 + 48 >> 2] = 0;
   HEAP32[$4 + 40 >> 2] = 0;
   HEAP32[$4 + 44 >> 2] = 0;
   HEAP32[$4 + 32 >> 2] = 0;
   HEAP32[$4 + 36 >> 2] = 0;
   HEAP32[$4 + 24 >> 2] = 0;
   HEAP32[$4 + 28 >> 2] = 0;
   HEAP32[$4 + 16 >> 2] = 0;
   HEAP32[$4 + 20 >> 2] = 0;
   HEAP32[$4 + 8 >> 2] = 0;
   HEAP32[$4 + 12 >> 2] = 0;
   $10_1 = ($6_1 | 0) != 0;
   label$8 : {
    if (!$6_1) {
     break label$8
    }
    $11_1 = HEAPU8[$0 | 0];
    if ($11_1 >>> 0 > 11) {
     $7_1 = -20;
     break label$8;
    }
    $8 = $0;
    $4 = 0;
    label$10 : {
     while (1) {
      $10_1 = ($11_1 << 2) + $1_1 | 0;
      HEAP32[$10_1 >> 2] = HEAP32[$10_1 >> 2] + 1;
      $5_1 = $5_1 + 1 | 0;
      $10_1 = $5_1 >>> 0 < $6_1 >>> 0;
      $4 = (1 << HEAPU8[$8 | 0] >> 1) + $4 | 0;
      if (($5_1 | 0) == ($6_1 | 0)) {
       break label$10
      }
      $8 = $0 + $5_1 | 0;
      $11_1 = HEAPU8[$8 | 0];
      if ($11_1 >>> 0 <= 11) {
       continue
      }
      break;
     };
     $5_1 = $4;
     $7_1 = -20;
     break label$8;
    }
    $5_1 = $4;
   }
   if ($10_1) {
    break label$1
   }
   if (!$5_1) {
    $7_1 = -20;
    break label$1;
   }
   $4 = 0;
   $8 = $12($5_1) + 1 | 0;
   label$13 : {
    if ($8 >>> 0 > 12) {
     $7_1 = -20;
     break label$13;
    }
    HEAP32[$3_1 >> 2] = $8;
    $3_1 = (1 << $8) - $5_1 | 0;
    $8 = $12($3_1);
    $5_1 = 1 << $8;
    $4 = ($3_1 | 0) == ($5_1 | 0);
    if (($3_1 | 0) != ($5_1 | 0)) {
     $7_1 = -20;
     break label$13;
    }
    $3_1 = $0 + $6_1 | 0;
    $0 = $8 + 1 | 0;
    HEAP8[$3_1 | 0] = $0;
    $0 = ($0 << 2) + $1_1 | 0;
    HEAP32[$0 >> 2] = HEAP32[$0 >> 2] + 1;
   }
   if (!$4) {
    break label$1
   }
   $7_1 = -20;
   $0 = HEAP32[$1_1 + 4 >> 2];
   if ($0 >>> 0 < 2 | $0 & 1) {
    break label$1
   }
   HEAP32[$2_1 >> 2] = $6_1 + 1;
   $7_1 = $9_1 + 1 | 0;
  }
  global$0 = $12_1 + 272 | 0;
  return $7_1;
 }
 
 function $11($0, $1_1, $2_1, $3_1) {
  var $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0;
  $4 = global$0 - 528 | 0;
  global$0 = $4;
  HEAP32[$4 + 8 >> 2] = 255;
  $6_1 = $7($4 + 16 | 0, $4 + 8 | 0, $4 + 12 | 0, $1_1, $2_1);
  label$1 : {
   if ($3($6_1)) {
    $5_1 = $6_1;
    break label$1;
   }
   $5_1 = -44;
   $7_1 = HEAP32[$4 + 12 >> 2];
   if ($7_1 >>> 0 > 6) {
    break label$1
   }
   $5_1 = $13($3_1, $4 + 16 | 0, HEAP32[$4 + 8 >> 2], $7_1);
   if ($3($5_1)) {
    break label$1
   }
   $5_1 = $14($0, $1_1 + $6_1 | 0, $2_1 - $6_1 | 0, $3_1);
  }
  global$0 = $4 + 528 | 0;
  return $5_1;
 }
 
 function $12($0) {
  return Math_clz32($0) ^ 31;
 }
 
 function $13($0, $1_1, $2_1, $3_1) {
  var $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0;
  $9_1 = global$0 - 512 | 0;
  global$0 = $9_1;
  $5_1 = -46;
  label$1 : {
   if ($2_1 >>> 0 > 255) {
    break label$1
   }
   $5_1 = -44;
   if ($3_1 >>> 0 > 12) {
    break label$1
   }
   $11_1 = $0 + 4 | 0;
   $8 = 1 << $3_1;
   $12_1 = $8 + -1 | 0;
   $10_1 = $2_1 + 1 | 0;
   label$2 : {
    if (!$10_1) {
     $5_1 = 1;
     $6_1 = $12_1;
     break label$2;
    }
    $14_1 = 65536 << $3_1 + -1 >> 16;
    $6_1 = $12_1;
    $5_1 = 1;
    while (1) {
     $13_1 = $4 << 1;
     $7_1 = HEAPU16[$13_1 + $1_1 >> 1];
     label$5 : {
      if (($7_1 | 0) == 65535) {
       HEAP8[(($6_1 << 2) + $11_1 | 0) + 2 | 0] = $4;
       $6_1 = $6_1 + -1 | 0;
       $7_1 = 1;
       break label$5;
      }
      $5_1 = ($14_1 | 0) > $7_1 << 16 >> 16 ? $5_1 : 0;
     }
     HEAP16[$9_1 + $13_1 >> 1] = $7_1;
     $7_1 = ($2_1 | 0) != ($4 | 0);
     $4 = $4 + 1 | 0;
     if ($7_1) {
      continue
     }
     break;
    };
   }
   HEAP16[$0 + 2 >> 1] = $5_1;
   HEAP16[$0 >> 1] = $3_1;
   label$7 : {
    if (!$10_1) {
     $4 = 0;
     break label$7;
    }
    $7_1 = (($8 >>> 3) + ($8 >>> 1) | 0) + 3 | 0;
    $4 = 0;
    $5_1 = 0;
    while (1) {
     $0 = ($5_1 << 1) + $1_1 | 0;
     if (HEAP16[$0 >> 1] >= 1) {
      $0 = HEAP16[$0 >> 1];
      $10_1 = ($0 | 0) > 1 ? $0 : 1;
      $0 = 0;
      while (1) {
       HEAP8[(($4 << 2) + $11_1 | 0) + 2 | 0] = $5_1;
       while (1) {
        $4 = $12_1 & $4 + $7_1;
        if ($4 >>> 0 > $6_1 >>> 0) {
         continue
        }
        break;
       };
       $0 = $0 + 1 | 0;
       if (($10_1 | 0) != ($0 | 0)) {
        continue
       }
       break;
      };
     }
     $0 = ($2_1 | 0) != ($5_1 | 0);
     $5_1 = $5_1 + 1 | 0;
     if ($0) {
      continue
     }
     break;
    };
   }
   $5_1 = -1;
   if ($4) {
    break label$1
   }
   $2_1 = $8 >>> 0 > 1 ? $8 : 1;
   $5_1 = 0;
   $4 = 0;
   while (1) {
    $1_1 = ($4 << 2) + $11_1 | 0;
    $6_1 = (HEAPU8[$1_1 + 2 | 0] << 1) + $9_1 | 0;
    $0 = HEAPU16[$6_1 >> 1];
    HEAP16[$6_1 >> 1] = $0 + 1;
    $6_1 = $3_1 - $12($0) | 0;
    HEAP8[$1_1 + 3 | 0] = $6_1;
    HEAP16[$1_1 >> 1] = ($0 << ($6_1 & 255)) - $8;
    $4 = $4 + 1 | 0;
    if (($2_1 | 0) != ($4 | 0)) {
     continue
    }
    break;
   };
  }
  global$0 = $9_1 + 512 | 0;
  return $5_1;
 }
 
 function $14($0, $1_1, $2_1, $3_1) {
  var $4 = 0, $5_1 = 0, $6_1 = 0;
  $4 = global$0 - 48 | 0;
  global$0 = $4;
  $6_1 = $0 + 255 | 0;
  $5_1 = $6_1 + -3 | 0;
  label$1 : {
   if (HEAPU16[$3_1 + 2 >> 1]) {
    $1_1 = $15($4 + 24 | 0, $1_1, $2_1);
    if ($3($1_1)) {
     break label$1
    }
    $16($4 + 16 | 0, $4 + 24 | 0, $3_1);
    $16($4 + 8 | 0, $4 + 24 | 0, $3_1);
    $3_1 = $0;
    label$3 : {
     if ($17($4 + 24 | 0) | $5_1 >>> 0 <= $3_1 >>> 0) {
      break label$3
     }
     while (1) {
      HEAP8[$3_1 | 0] = $18($4 + 16 | 0, $4 + 24 | 0);
      HEAP8[$3_1 + 1 | 0] = $18($4 + 8 | 0, $4 + 24 | 0);
      if ($17($4 + 24 | 0)) {
       $3_1 = $3_1 + 2 | 0;
       break label$3;
      }
      HEAP8[$3_1 + 2 | 0] = $18($4 + 16 | 0, $4 + 24 | 0);
      HEAP8[$3_1 + 3 | 0] = $18($4 + 8 | 0, $4 + 24 | 0);
      $1_1 = $17($4 + 24 | 0);
      $3_1 = $3_1 + 4 | 0;
      if ($3_1 >>> 0 >= $5_1 >>> 0) {
       break label$3
      }
      if (!$1_1) {
       continue
      }
      break;
     };
    }
    $5_1 = $6_1 + -2 | 0;
    label$6 : {
     while (1) {
      $1_1 = -70;
      $2_1 = $3_1;
      if ($3_1 >>> 0 > $5_1 >>> 0) {
       break label$1
      }
      HEAP8[$2_1 | 0] = $18($4 + 16 | 0, $4 + 24 | 0);
      $3_1 = $2_1 + 1 | 0;
      if (($17($4 + 24 | 0) | 0) == 3) {
       $1_1 = 2;
       $5_1 = $4 + 8 | 0;
       break label$6;
      }
      if ($3_1 >>> 0 > $5_1 >>> 0) {
       break label$1
      }
      HEAP8[$2_1 + 1 | 0] = $18($4 + 8 | 0, $4 + 24 | 0);
      $3_1 = $2_1 + 2 | 0;
      $1_1 = 3;
      if (($17($4 + 24 | 0) | 0) != 3) {
       continue
      }
      break;
     };
     $5_1 = $4 + 16 | 0;
    }
    HEAP8[$3_1 | 0] = $18($5_1, $4 + 24 | 0);
    $1_1 = ($1_1 + $2_1 | 0) - $0 | 0;
    break label$1;
   }
   $1_1 = $15($4 + 24 | 0, $1_1, $2_1);
   if ($3($1_1)) {
    break label$1
   }
   $16($4 + 16 | 0, $4 + 24 | 0, $3_1);
   $16($4 + 8 | 0, $4 + 24 | 0, $3_1);
   $3_1 = $0;
   label$9 : {
    if ($17($4 + 24 | 0) | $5_1 >>> 0 <= $3_1 >>> 0) {
     break label$9
    }
    while (1) {
     HEAP8[$3_1 | 0] = $19($4 + 16 | 0, $4 + 24 | 0);
     HEAP8[$3_1 + 1 | 0] = $19($4 + 8 | 0, $4 + 24 | 0);
     if ($17($4 + 24 | 0)) {
      $3_1 = $3_1 + 2 | 0;
      break label$9;
     }
     HEAP8[$3_1 + 2 | 0] = $19($4 + 16 | 0, $4 + 24 | 0);
     HEAP8[$3_1 + 3 | 0] = $19($4 + 8 | 0, $4 + 24 | 0);
     $1_1 = $17($4 + 24 | 0);
     $3_1 = $3_1 + 4 | 0;
     if ($3_1 >>> 0 >= $5_1 >>> 0) {
      break label$9
     }
     if (!$1_1) {
      continue
     }
     break;
    };
   }
   $5_1 = $6_1 + -2 | 0;
   label$12 : {
    while (1) {
     $1_1 = -70;
     $2_1 = $3_1;
     if ($3_1 >>> 0 > $5_1 >>> 0) {
      break label$1
     }
     HEAP8[$2_1 | 0] = $19($4 + 16 | 0, $4 + 24 | 0);
     $3_1 = $2_1 + 1 | 0;
     if (($17($4 + 24 | 0) | 0) == 3) {
      $1_1 = 2;
      $5_1 = $4 + 8 | 0;
      break label$12;
     }
     if ($3_1 >>> 0 > $5_1 >>> 0) {
      break label$1
     }
     HEAP8[$2_1 + 1 | 0] = $19($4 + 8 | 0, $4 + 24 | 0);
     $3_1 = $2_1 + 2 | 0;
     $1_1 = 3;
     if (($17($4 + 24 | 0) | 0) != 3) {
      continue
     }
     break;
    };
    $5_1 = $4 + 16 | 0;
   }
   HEAP8[$3_1 | 0] = $19($5_1, $4 + 24 | 0);
   $1_1 = ($1_1 + $2_1 | 0) - $0 | 0;
  }
  global$0 = $4 + 48 | 0;
  return $1_1;
 }
 
 function $15($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0;
  if (!$2_1) {
   HEAP32[$0 >> 2] = 0;
   HEAP32[$0 + 4 >> 2] = 0;
   HEAP32[$0 + 16 >> 2] = 0;
   HEAP32[$0 + 8 >> 2] = 0;
   HEAP32[$0 + 12 >> 2] = 0;
   return -72;
  }
  HEAP32[$0 + 12 >> 2] = $1_1;
  $3_1 = $1_1 + 4 | 0;
  HEAP32[$0 + 16 >> 2] = $3_1;
  label$2 : {
   if ($2_1 >>> 0 >= 4) {
    $1_1 = $1_1 + $2_1 | 0;
    $3_1 = $1_1 + -4 | 0;
    HEAP32[$0 + 8 >> 2] = $3_1;
    HEAP32[$0 >> 2] = $9($3_1);
    $1_1 = HEAPU8[$1_1 + -1 | 0];
    if (!$1_1) {
     break label$2
    }
    HEAP32[$0 + 4 >> 2] = 8 - $12($1_1);
    return $2_1;
   }
   $4 = HEAP32[$0 + 12 >> 2];
   HEAP32[$0 + 8 >> 2] = $4;
   $4 = HEAPU8[$4 | 0];
   HEAP32[$0 >> 2] = $4;
   label$4 : {
    switch ($2_1 + -2 | 0) {
    case 5:
     HEAP32[$0 >> 2] = $4 | HEAPU8[$1_1 + 6 | 0] << 16;
    case 4:
     HEAP32[$0 >> 2] = HEAP32[$0 >> 2] + (HEAPU8[$1_1 + 5 | 0] << 8);
    case 3:
     HEAP32[$0 >> 2] = HEAP32[$0 >> 2] + HEAPU8[$3_1 | 0];
    case 2:
     HEAP32[$0 >> 2] = HEAP32[$0 >> 2] + (HEAPU8[$1_1 + 3 | 0] << 24);
    case 1:
     HEAP32[$0 >> 2] = HEAP32[$0 >> 2] + (HEAPU8[$1_1 + 2 | 0] << 16);
    case 0:
     HEAP32[$0 >> 2] = HEAP32[$0 >> 2] + (HEAPU8[$1_1 + 1 | 0] << 8);
     break;
    default:
     break label$4;
    };
   }
   $4 = $0;
   $1_1 = HEAPU8[($1_1 + $2_1 | 0) + -1 | 0];
   $3_1 = 0;
   label$11 : {
    if (!$1_1) {
     break label$11
    }
    $3_1 = 8 - $12($1_1) | 0;
   }
   HEAP32[$4 + 4 >> 2] = $3_1;
   if (!$1_1) {
    return -20
   }
   HEAP32[$0 + 4 >> 2] = ($3_1 - ($2_1 << 3) | 0) + 32;
   return $2_1;
  }
  HEAP32[$0 + 4 >> 2] = 0;
  return -1;
 }
 
 function $16($0, $1_1, $2_1) {
  HEAP32[$0 >> 2] = $125($1_1, HEAPU16[$2_1 >> 1]);
  $17($1_1);
  HEAP32[$0 + 4 >> 2] = $2_1 + 4;
 }
 
 function $17($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0;
  $4 = 3;
  $3_1 = HEAP32[$0 + 4 >> 2];
  if ($3_1 >>> 0 <= 32) {
   $1_1 = HEAP32[$0 + 8 >> 2];
   if ($1_1 >>> 0 >= HEAPU32[$0 + 16 >> 2]) {
    return $33($0)
   }
   $2_1 = HEAP32[$0 + 12 >> 2];
   if (($2_1 | 0) == ($1_1 | 0)) {
    return $3_1 >>> 0 < 32 ? 1 : 2
   }
   $5_1 = $3_1 >>> 3 | 0;
   $4 = $1_1 - $5_1 >>> 0 < $2_1 >>> 0;
   $6_1 = $1_1;
   $1_1 = $4 ? $1_1 - $2_1 | 0 : $5_1;
   $2_1 = $6_1 - $1_1 | 0;
   HEAP32[$0 + 8 >> 2] = $2_1;
   HEAP32[$0 + 4 >> 2] = $3_1 - ($1_1 << 3);
   HEAP32[$0 >> 2] = $9($2_1);
  }
  return $4;
 }
 
 function $18($0, $1_1) {
  var $2_1 = 0, $3_1 = 0;
  $2_1 = HEAP32[$0 + 4 >> 2] + (HEAP32[$0 >> 2] << 2) | 0;
  $3_1 = HEAPU8[$2_1 + 2 | 0];
  HEAP32[$0 >> 2] = HEAPU16[$2_1 >> 1] + $126($1_1, HEAPU8[$2_1 + 3 | 0]);
  return $3_1;
 }
 
 function $19($0, $1_1) {
  var $2_1 = 0, $3_1 = 0;
  $2_1 = HEAP32[$0 + 4 >> 2] + (HEAP32[$0 >> 2] << 2) | 0;
  $3_1 = HEAPU8[$2_1 + 2 | 0];
  HEAP32[$0 >> 2] = HEAPU16[$2_1 >> 1] + $125($1_1, HEAPU8[$2_1 + 3 | 0]);
  return $3_1;
 }
 
 function $20($0) {
  $0 = $0 | 0;
  return $0 | 0;
 }
 
 function $21($0) {
  $0 = $0 | 0;
  return $6($5($0)) | 0;
 }
 
 function $23($0, $1_1) {
  var $2_1 = 0;
  $2_1 = HEAP32[$1_1 >> 2];
  if ($2_1) {
   return FUNCTION_TABLE[$2_1](HEAP32[$1_1 + 8 >> 2], $0) | 0
  }
  return $138($0);
 }
 
 function $24($0, $1_1) {
  var $2_1 = 0;
  if ($0) {
   $2_1 = HEAP32[$1_1 + 4 >> 2];
   if ($2_1) {
    FUNCTION_TABLE[$2_1](HEAP32[$1_1 + 8 >> 2], $0);
    return;
   }
   $141($0);
  }
 }
 
 function $25($0, $1_1, $2_1, $3_1) {
  var $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0;
  $6_1 = global$0 - 16 | 0;
  global$0 = $6_1;
  HEAP32[$6_1 + 12 >> 2] = 0;
  HEAP32[$6_1 + 8 >> 2] = 0;
  $4 = -44;
  $10_1 = $3_1 - -64 | 0;
  $1_1 = $10($10_1, $3_1, $6_1 + 8 | 0, $6_1 + 12 | 0, $1_1, $2_1);
  label$1 : {
   label$2 : {
    if ($3($1_1)) {
     break label$2
    }
    $26($6_1 + 4 | 0, $0);
    $5_1 = 1;
    $2_1 = HEAP32[$6_1 + 12 >> 2];
    if ($2_1 >>> 0 > HEAPU8[$6_1 + 4 | 0] + 1 >>> 0) {
     break label$1
    }
    $4 = 0;
    HEAP8[$6_1 + 5 | 0] = 0;
    HEAP8[$6_1 + 6 | 0] = $2_1;
    HEAP32[$0 >> 2] = HEAP32[$6_1 + 4 >> 2];
    if ($2_1 + 1 >>> 0 >= 2) {
     while (1) {
      $7_1 = ($5_1 << 2) + $3_1 | 0;
      $9_1 = HEAP32[$7_1 >> 2];
      HEAP32[$7_1 >> 2] = $4;
      $4 = ($9_1 << $5_1 + -1) + $4 | 0;
      $7_1 = ($2_1 | 0) != ($5_1 | 0);
      $5_1 = $5_1 + 1 | 0;
      if ($7_1) {
       continue
      }
      break;
     }
    }
    $11_1 = HEAP32[$6_1 + 8 >> 2];
    if (!$11_1) {
     break label$2
    }
    $9_1 = $0 + 4 | 0;
    $12_1 = $2_1 + 1 | 0;
    $4 = 0;
    while (1) {
     $5_1 = HEAPU8[$4 + $10_1 | 0];
     $0 = ($5_1 << 2) + $3_1 | 0;
     $7_1 = $0;
     $2_1 = HEAP32[$0 >> 2];
     $0 = 1 << $5_1 >> 1;
     $8 = $2_1 + $0 | 0;
     HEAP32[$7_1 >> 2] = $8;
     $7_1 = $12_1 - $5_1 | 0;
     label$6 : {
      if ($0 >>> 0 >= 4) {
       if ($2_1 >>> 0 >= $8 >>> 0) {
        break label$6
       }
       while (1) {
        $0 = $9_1 + ($2_1 << 1) | 0;
        HEAP8[$0 + 1 | 0] = $7_1;
        HEAP8[$0 | 0] = $4;
        HEAP8[$0 + 3 | 0] = $7_1;
        HEAP8[$0 + 2 | 0] = $4;
        HEAP8[$0 + 5 | 0] = $7_1;
        HEAP8[$0 + 4 | 0] = $4;
        HEAP8[$0 + 7 | 0] = $7_1;
        HEAP8[$0 + 6 | 0] = $4;
        $2_1 = $2_1 + 4 | 0;
        if ($2_1 >>> 0 < $8 >>> 0) {
         continue
        }
        break;
       };
       break label$6;
      }
      $5_1 = 0;
      if (!$0) {
       break label$6
      }
      while (1) {
       $8 = $9_1 + ($2_1 + $5_1 << 1) | 0;
       HEAP8[$8 + 1 | 0] = $7_1;
       HEAP8[$8 | 0] = $4;
       $5_1 = $5_1 + 1 | 0;
       if (($0 | 0) != ($5_1 | 0)) {
        continue
       }
       break;
      };
     }
     $4 = $4 + 1 | 0;
     if (($11_1 | 0) != ($4 | 0)) {
      continue
     }
     break;
    };
   }
   $4 = $1_1;
  }
  global$0 = $6_1 + 16 | 0;
  return $4;
 }
 
 function $26($0, $1_1) {
  $1_1 = HEAP32[$1_1 >> 2];
  HEAP8[$0 | 0] = $1_1;
  HEAP8[$0 + 1 | 0] = $1_1 >>> 8;
  HEAP8[$0 + 2 | 0] = $1_1 >>> 16;
  HEAP8[$0 + 3 | 0] = $1_1 >>> 24;
 }
 
 function $27($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0;
  $5_1 = global$0 - 32 | 0;
  global$0 = $5_1;
  $26($5_1, $4);
  $7_1 = HEAPU8[$5_1 + 2 | 0];
  $2_1 = $15($5_1 + 8 | 0, $2_1, $3_1);
  if (!$3($2_1)) {
   $2_1 = $4 + 4 | 0;
   $3_1 = $0 + $1_1 | 0;
   $6_1 = $3_1 + -3 | 0;
   label$2 : {
    if ($17($5_1 + 8 | 0) | $6_1 >>> 0 <= $0 >>> 0) {
     break label$2
    }
    while (1) {
     $4 = $2_1 + ($28($5_1 + 8 | 0, $7_1) << 1) | 0;
     $8 = HEAPU8[$4 | 0];
     $29($5_1 + 8 | 0, HEAPU8[$4 + 1 | 0]);
     HEAP8[$0 | 0] = $8;
     $4 = $2_1 + ($28($5_1 + 8 | 0, $7_1) << 1) | 0;
     $8 = HEAPU8[$4 | 0];
     $29($5_1 + 8 | 0, HEAPU8[$4 + 1 | 0]);
     HEAP8[$0 + 1 | 0] = $8;
     $4 = $17($5_1 + 8 | 0);
     $0 = $0 + 2 | 0;
     if ($0 >>> 0 >= $6_1 >>> 0) {
      break label$2
     }
     if (!$4) {
      continue
     }
     break;
    };
   }
   label$4 : {
    if ($17($5_1 + 8 | 0) | $0 >>> 0 >= $3_1 >>> 0) {
     break label$4
    }
    while (1) {
     $4 = $2_1 + ($28($5_1 + 8 | 0, $7_1) << 1) | 0;
     $6_1 = HEAPU8[$4 | 0];
     $29($5_1 + 8 | 0, HEAPU8[$4 + 1 | 0]);
     HEAP8[$0 | 0] = $6_1;
     $4 = $17($5_1 + 8 | 0);
     $0 = $0 + 1 | 0;
     if ($0 >>> 0 >= $3_1 >>> 0) {
      break label$4
     }
     if (!$4) {
      continue
     }
     break;
    };
   }
   if ($0 >>> 0 < $3_1 >>> 0) {
    while (1) {
     $4 = $2_1 + ($28($5_1 + 8 | 0, $7_1) << 1) | 0;
     $6_1 = HEAPU8[$4 | 0];
     $29($5_1 + 8 | 0, HEAPU8[$4 + 1 | 0]);
     HEAP8[$0 | 0] = $6_1;
     $0 = $0 + 1 | 0;
     if (($3_1 | 0) != ($0 | 0)) {
      continue
     }
     break;
    }
   }
   $2_1 = $30($5_1 + 8 | 0) ? $1_1 : -20;
  }
  global$0 = $5_1 + 32 | 0;
  return $2_1;
 }
 
 function $28($0, $1_1) {
  return HEAP32[$0 >> 2] << (HEAP32[$0 + 4 >> 2] & 31) >>> (0 - $1_1 & 31) | 0;
 }
 
 function $29($0, $1_1) {
  HEAP32[$0 + 4 >> 2] = HEAP32[$0 + 4 >> 2] + $1_1;
 }
 
 function $30($0) {
  return HEAP32[$0 + 8 >> 2] == HEAP32[$0 + 12 >> 2] ? HEAP32[$0 + 4 >> 2] == 32 : 0;
 }
 
 function $31($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0;
  $5_1 = global$0 - 112 | 0;
  global$0 = $5_1;
  $6_1 = -20;
  label$1 : {
   if ($3_1 >>> 0 < 10) {
    break label$1
   }
   $10_1 = $61($2_1);
   $11_1 = $61($2_1 + 2 | 0);
   $15_1 = $61($2_1 + 4 | 0);
   $26($5_1 + 8 | 0, $4);
   $7_1 = ($15_1 + ($10_1 + $11_1 | 0) | 0) + 6 | 0;
   if ($3_1 >>> 0 < $7_1 >>> 0) {
    break label$1
   }
   $9_1 = HEAPU8[$5_1 + 10 | 0];
   $14_1 = $2_1 + 6 | 0;
   $2_1 = $15($5_1 + 88 | 0, $14_1, $10_1);
   if ($3($2_1)) {
    $6_1 = $2_1;
    break label$1;
   }
   $14_1 = $10_1 + $14_1 | 0;
   $16_1 = $15($5_1 - -64 | 0, $14_1, $11_1);
   $10_1 = $3($16_1);
   $2_1 = $10_1 ? $16_1 : $2_1;
   if ($10_1) {
    $6_1 = $2_1;
    break label$1;
   }
   $11_1 = $11_1 + $14_1 | 0;
   $14_1 = $15($5_1 + 40 | 0, $11_1, $15_1);
   $10_1 = $3($14_1);
   $2_1 = $10_1 ? $14_1 : $2_1;
   if ($10_1) {
    $6_1 = $2_1;
    break label$1;
   }
   $3_1 = $15($5_1 + 16 | 0, $11_1 + $15_1 | 0, $3_1 - $7_1 | 0);
   $10_1 = $3($3_1);
   if ($10_1) {
    $6_1 = $10_1 ? $3_1 : $2_1;
    break label$1;
   }
   $7_1 = $4 + 4 | 0;
   $2_1 = $1_1 + 3 >>> 2 | 0;
   $11_1 = $2_1 + $0 | 0;
   $15_1 = $11_1 + $2_1 | 0;
   $10_1 = $15_1 + $2_1 | 0;
   $14_1 = $0 + $1_1 | 0;
   $16_1 = $14_1 + -3 | 0;
   label$6 : {
    if ($10_1 >>> 0 >= $16_1 >>> 0) {
     $8 = $10_1 >>> 0 < $16_1 >>> 0;
     $2_1 = $10_1;
     $3_1 = $15_1;
     $4 = $11_1;
     break label$6;
    }
    $13_1 = 1;
    $4 = $11_1;
    $3_1 = $15_1;
    $2_1 = $10_1;
    while (1) {
     $8 = $7_1 + ($28($5_1 + 88 | 0, $9_1) << 1) | 0;
     $12_1 = HEAPU8[$8 | 0];
     $29($5_1 + 88 | 0, HEAPU8[$8 + 1 | 0]);
     HEAP8[$0 | 0] = $12_1;
     $8 = $7_1 + ($28($5_1 - -64 | 0, $9_1) << 1) | 0;
     $12_1 = HEAPU8[$8 | 0];
     $29($5_1 - -64 | 0, HEAPU8[$8 + 1 | 0]);
     HEAP8[$4 | 0] = $12_1;
     $8 = $7_1 + ($28($5_1 + 40 | 0, $9_1) << 1) | 0;
     $12_1 = HEAPU8[$8 | 0];
     $29($5_1 + 40 | 0, HEAPU8[$8 + 1 | 0]);
     HEAP8[$3_1 | 0] = $12_1;
     $8 = $7_1 + ($28($5_1 + 16 | 0, $9_1) << 1) | 0;
     $12_1 = HEAPU8[$8 | 0];
     $29($5_1 + 16 | 0, HEAPU8[$8 + 1 | 0]);
     HEAP8[$2_1 | 0] = $12_1;
     $8 = $7_1 + ($28($5_1 + 88 | 0, $9_1) << 1) | 0;
     $12_1 = HEAPU8[$8 | 0];
     $29($5_1 + 88 | 0, HEAPU8[$8 + 1 | 0]);
     HEAP8[$0 + 1 | 0] = $12_1;
     $8 = $7_1 + ($28($5_1 - -64 | 0, $9_1) << 1) | 0;
     $12_1 = HEAPU8[$8 | 0];
     $29($5_1 - -64 | 0, HEAPU8[$8 + 1 | 0]);
     HEAP8[$4 + 1 | 0] = $12_1;
     $8 = $7_1 + ($28($5_1 + 40 | 0, $9_1) << 1) | 0;
     $12_1 = HEAPU8[$8 | 0];
     $29($5_1 + 40 | 0, HEAPU8[$8 + 1 | 0]);
     HEAP8[$3_1 + 1 | 0] = $12_1;
     $8 = $7_1 + ($28($5_1 + 16 | 0, $9_1) << 1) | 0;
     $12_1 = HEAPU8[$8 | 0];
     $29($5_1 + 16 | 0, HEAPU8[$8 + 1 | 0]);
     HEAP8[$2_1 + 1 | 0] = $12_1;
     $3_1 = $3_1 + 2 | 0;
     $4 = $4 + 2 | 0;
     $0 = $0 + 2 | 0;
     $2_1 = $2_1 + 2 | 0;
     $8 = $2_1 >>> 0 < $16_1 >>> 0;
     $13_1 = !$33($5_1 + 88 | 0) & $13_1 & !$33($5_1 - -64 | 0) & !$33($5_1 + 40 | 0) & !$33($5_1 + 16 | 0);
     if ($8 & $13_1) {
      continue
     }
     break;
    };
   }
   if ($3_1 >>> 0 > $10_1 >>> 0 | $4 >>> 0 > $15_1 >>> 0 | $0 >>> 0 > $11_1 >>> 0) {
    break label$1
   }
   $6_1 = $11_1 + -3 | 0;
   label$9 : {
    if ($17($5_1 + 88 | 0) | $6_1 >>> 0 <= $0 >>> 0) {
     break label$9
    }
    while (1) {
     $13_1 = $7_1 + ($28($5_1 + 88 | 0, $9_1) << 1) | 0;
     $12_1 = HEAPU8[$13_1 | 0];
     $29($5_1 + 88 | 0, HEAPU8[$13_1 + 1 | 0]);
     HEAP8[$0 | 0] = $12_1;
     $13_1 = $7_1 + ($28($5_1 + 88 | 0, $9_1) << 1) | 0;
     $12_1 = HEAPU8[$13_1 | 0];
     $29($5_1 + 88 | 0, HEAPU8[$13_1 + 1 | 0]);
     HEAP8[$0 + 1 | 0] = $12_1;
     $13_1 = $17($5_1 + 88 | 0);
     $0 = $0 + 2 | 0;
     if ($0 >>> 0 >= $6_1 >>> 0) {
      break label$9
     }
     if (!$13_1) {
      continue
     }
     break;
    };
   }
   label$11 : {
    if ($17($5_1 + 88 | 0) | $0 >>> 0 >= $11_1 >>> 0) {
     break label$11
    }
    while (1) {
     $6_1 = $7_1 + ($28($5_1 + 88 | 0, $9_1) << 1) | 0;
     $13_1 = HEAPU8[$6_1 | 0];
     $29($5_1 + 88 | 0, HEAPU8[$6_1 + 1 | 0]);
     HEAP8[$0 | 0] = $13_1;
     $6_1 = $17($5_1 + 88 | 0);
     $0 = $0 + 1 | 0;
     if ($0 >>> 0 >= $11_1 >>> 0) {
      break label$11
     }
     if (!$6_1) {
      continue
     }
     break;
    };
   }
   if ($0 >>> 0 < $11_1 >>> 0) {
    while (1) {
     $6_1 = $7_1 + ($28($5_1 + 88 | 0, $9_1) << 1) | 0;
     $13_1 = HEAPU8[$6_1 | 0];
     $29($5_1 + 88 | 0, HEAPU8[$6_1 + 1 | 0]);
     HEAP8[$0 | 0] = $13_1;
     $0 = $0 + 1 | 0;
     if (($11_1 | 0) != ($0 | 0)) {
      continue
     }
     break;
    }
   }
   $0 = $15_1 + -3 | 0;
   label$15 : {
    if ($17($5_1 - -64 | 0) | $0 >>> 0 <= $4 >>> 0) {
     break label$15
    }
    while (1) {
     $6_1 = $7_1 + ($28($5_1 - -64 | 0, $9_1) << 1) | 0;
     $11_1 = HEAPU8[$6_1 | 0];
     $29($5_1 - -64 | 0, HEAPU8[$6_1 + 1 | 0]);
     HEAP8[$4 | 0] = $11_1;
     $6_1 = $7_1 + ($28($5_1 - -64 | 0, $9_1) << 1) | 0;
     $11_1 = HEAPU8[$6_1 | 0];
     $29($5_1 - -64 | 0, HEAPU8[$6_1 + 1 | 0]);
     HEAP8[$4 + 1 | 0] = $11_1;
     $6_1 = $17($5_1 - -64 | 0);
     $4 = $4 + 2 | 0;
     if ($4 >>> 0 >= $0 >>> 0) {
      break label$15
     }
     if (!$6_1) {
      continue
     }
     break;
    };
   }
   label$17 : {
    if ($17($5_1 - -64 | 0) | $4 >>> 0 >= $15_1 >>> 0) {
     break label$17
    }
    while (1) {
     $0 = $7_1 + ($28($5_1 - -64 | 0, $9_1) << 1) | 0;
     $6_1 = HEAPU8[$0 | 0];
     $29($5_1 - -64 | 0, HEAPU8[$0 + 1 | 0]);
     HEAP8[$4 | 0] = $6_1;
     $0 = $17($5_1 - -64 | 0);
     $4 = $4 + 1 | 0;
     if ($4 >>> 0 >= $15_1 >>> 0) {
      break label$17
     }
     if (!$0) {
      continue
     }
     break;
    };
   }
   if ($4 >>> 0 < $15_1 >>> 0) {
    while (1) {
     $0 = $7_1 + ($28($5_1 - -64 | 0, $9_1) << 1) | 0;
     $6_1 = HEAPU8[$0 | 0];
     $29($5_1 - -64 | 0, HEAPU8[$0 + 1 | 0]);
     HEAP8[$4 | 0] = $6_1;
     $4 = $4 + 1 | 0;
     if (($15_1 | 0) != ($4 | 0)) {
      continue
     }
     break;
    }
   }
   $0 = $10_1 + -3 | 0;
   label$21 : {
    if ($17($5_1 + 40 | 0) | $0 >>> 0 <= $3_1 >>> 0) {
     break label$21
    }
    while (1) {
     $4 = $7_1 + ($28($5_1 + 40 | 0, $9_1) << 1) | 0;
     $6_1 = HEAPU8[$4 | 0];
     $29($5_1 + 40 | 0, HEAPU8[$4 + 1 | 0]);
     HEAP8[$3_1 | 0] = $6_1;
     $4 = $7_1 + ($28($5_1 + 40 | 0, $9_1) << 1) | 0;
     $6_1 = HEAPU8[$4 | 0];
     $29($5_1 + 40 | 0, HEAPU8[$4 + 1 | 0]);
     HEAP8[$3_1 + 1 | 0] = $6_1;
     $4 = $17($5_1 + 40 | 0);
     $3_1 = $3_1 + 2 | 0;
     if ($3_1 >>> 0 >= $0 >>> 0) {
      break label$21
     }
     if (!$4) {
      continue
     }
     break;
    };
   }
   label$23 : {
    if ($17($5_1 + 40 | 0) | $3_1 >>> 0 >= $10_1 >>> 0) {
     break label$23
    }
    while (1) {
     $0 = $7_1 + ($28($5_1 + 40 | 0, $9_1) << 1) | 0;
     $4 = HEAPU8[$0 | 0];
     $29($5_1 + 40 | 0, HEAPU8[$0 + 1 | 0]);
     HEAP8[$3_1 | 0] = $4;
     $0 = $17($5_1 + 40 | 0);
     $3_1 = $3_1 + 1 | 0;
     if ($3_1 >>> 0 >= $10_1 >>> 0) {
      break label$23
     }
     if (!$0) {
      continue
     }
     break;
    };
   }
   if ($3_1 >>> 0 < $10_1 >>> 0) {
    while (1) {
     $0 = $7_1 + ($28($5_1 + 40 | 0, $9_1) << 1) | 0;
     $4 = HEAPU8[$0 | 0];
     $29($5_1 + 40 | 0, HEAPU8[$0 + 1 | 0]);
     HEAP8[$3_1 | 0] = $4;
     $3_1 = $3_1 + 1 | 0;
     if (($10_1 | 0) != ($3_1 | 0)) {
      continue
     }
     break;
    }
   }
   label$27 : {
    if (!(!$17($5_1 + 16 | 0) & $8)) {
     break label$27
    }
    while (1) {
     $0 = $7_1 + ($28($5_1 + 16 | 0, $9_1) << 1) | 0;
     $3_1 = HEAPU8[$0 | 0];
     $29($5_1 + 16 | 0, HEAPU8[$0 + 1 | 0]);
     HEAP8[$2_1 | 0] = $3_1;
     $0 = $7_1 + ($28($5_1 + 16 | 0, $9_1) << 1) | 0;
     $3_1 = HEAPU8[$0 | 0];
     $29($5_1 + 16 | 0, HEAPU8[$0 + 1 | 0]);
     HEAP8[$2_1 + 1 | 0] = $3_1;
     $0 = $17($5_1 + 16 | 0);
     $2_1 = $2_1 + 2 | 0;
     if ($2_1 >>> 0 >= $16_1 >>> 0) {
      break label$27
     }
     if (!$0) {
      continue
     }
     break;
    };
   }
   label$29 : {
    if ($17($5_1 + 16 | 0) | $2_1 >>> 0 >= $14_1 >>> 0) {
     break label$29
    }
    while (1) {
     $0 = $7_1 + ($28($5_1 + 16 | 0, $9_1) << 1) | 0;
     $3_1 = HEAPU8[$0 | 0];
     $29($5_1 + 16 | 0, HEAPU8[$0 + 1 | 0]);
     HEAP8[$2_1 | 0] = $3_1;
     $0 = $17($5_1 + 16 | 0);
     $2_1 = $2_1 + 1 | 0;
     if ($2_1 >>> 0 >= $14_1 >>> 0) {
      break label$29
     }
     if (!$0) {
      continue
     }
     break;
    };
   }
   if ($2_1 >>> 0 < $14_1 >>> 0) {
    while (1) {
     $0 = $7_1 + ($28($5_1 + 16 | 0, $9_1) << 1) | 0;
     $3_1 = HEAPU8[$0 | 0];
     $29($5_1 + 16 | 0, HEAPU8[$0 + 1 | 0]);
     HEAP8[$2_1 | 0] = $3_1;
     $2_1 = $2_1 + 1 | 0;
     if (($14_1 | 0) != ($2_1 | 0)) {
      continue
     }
     break;
    }
   }
   $6_1 = $30($5_1 + 88 | 0) & $30($5_1 - -64 | 0) & $30($5_1 + 40 | 0) & $30($5_1 + 16 | 0) ? $1_1 : -20;
  }
  global$0 = $5_1 + 112 | 0;
  return $6_1;
 }
 
 function $33($0) {
  var $1_1 = 0, $2_1 = 0;
  $1_1 = HEAP32[$0 + 8 >> 2];
  if ($1_1 >>> 0 < HEAPU32[$0 + 16 >> 2]) {
   return 3
  }
  $2_1 = HEAP32[$0 + 4 >> 2];
  HEAP32[$0 + 4 >> 2] = $2_1 & 7;
  $1_1 = $1_1 - ($2_1 >>> 3 | 0) | 0;
  HEAP32[$0 + 8 >> 2] = $1_1;
  HEAP32[$0 >> 2] = $9($1_1);
  return 0;
 }
 
 function $34($0, $1_1, $2_1, $3_1, $4, $5_1) {
  $5_1 = $25($0, $3_1, $4, $5_1);
  if ($3($5_1)) {
   return $5_1
  }
  if ($5_1 >>> 0 < $4 >>> 0) {
   $0 = $31($1_1, $2_1, $3_1 + $5_1 | 0, $4 - $5_1 | 0, $0)
  } else {
   $0 = -72
  }
  return $0;
 }
 
 function $35($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, $18_1 = 0, $19_1 = 0;
  $7_1 = global$0 - 16 | 0;
  global$0 = $7_1;
  $26($7_1 + 4 | 0, $0);
  $5_1 = -44;
  label$1 : {
   if ($4 >>> 0 < 1500) {
    break label$1
   }
   $10_1 = HEAPU8[$7_1 + 4 | 0];
   $8 = $146($3_1 + 624 | 0, 0, 108);
   if ($10_1 >>> 0 > 12) {
    break label$1
   }
   $9_1 = $3_1 + 1244 | 0;
   $14_1 = $10($9_1, $8, $7_1 + 8 | 0, $7_1 + 12 | 0, $1_1, $2_1);
   if (!$3($14_1)) {
    $4 = HEAP32[$7_1 + 12 >> 2];
    if ($4 >>> 0 > $10_1 >>> 0) {
     break label$1
    }
    $15_1 = $3_1 + 732 | 0;
    $18_1 = $3_1 + 676 | 0;
    $19_1 = $0 + 4 | 0;
    $1_1 = $3_1 + 680 | 0;
    $5_1 = $4;
    while (1) {
     $2_1 = $5_1;
     $5_1 = $5_1 + -1 | 0;
     if (!HEAP32[$8 + ($2_1 << 2) >> 2]) {
      continue
     }
     break;
    };
    $5_1 = 1;
    $11_1 = $2_1 + 1 | 0;
    if ($11_1 >>> 0 >= 2) {
     while (1) {
      $6_1 = $5_1 << 2;
      $12_1 = HEAP32[$6_1 + $8 >> 2];
      HEAP32[$1_1 + $6_1 >> 2] = $13_1;
      $13_1 = $13_1 + $12_1 | 0;
      $6_1 = ($2_1 | 0) != ($5_1 | 0);
      $5_1 = $5_1 + 1 | 0;
      if ($6_1) {
       continue
      }
      break;
     }
    }
    HEAP32[$1_1 >> 2] = $13_1;
    if (HEAP32[$7_1 + 8 >> 2]) {
     $5_1 = HEAP32[$7_1 + 8 >> 2];
     $12_1 = $5_1 >>> 0 > 1 ? $5_1 : 1;
     $5_1 = 0;
     while (1) {
      $16_1 = HEAPU8[$5_1 + $9_1 | 0];
      $17_1 = $1_1 + ($16_1 << 2) | 0;
      $6_1 = HEAP32[$17_1 >> 2];
      HEAP32[$17_1 >> 2] = $6_1 + 1;
      $6_1 = ($6_1 << 1) + $15_1 | 0;
      HEAP8[$6_1 + 1 | 0] = $16_1;
      HEAP8[$6_1 | 0] = $5_1;
      $5_1 = $5_1 + 1 | 0;
      if (($12_1 | 0) != ($5_1 | 0)) {
       continue
      }
      break;
     };
    }
    $1_1 = 0;
    HEAP32[$3_1 + 680 >> 2] = 0;
    if ($11_1 >>> 0 >= 2) {
     $6_1 = ($4 ^ -1) + $10_1 | 0;
     $5_1 = 1;
     while (1) {
      $9_1 = $5_1 << 2;
      $12_1 = HEAP32[$9_1 + $8 >> 2];
      HEAP32[$3_1 + $9_1 >> 2] = $1_1;
      $1_1 = ($12_1 << $5_1 + $6_1) + $1_1 | 0;
      $9_1 = ($2_1 | 0) != ($5_1 | 0);
      $5_1 = $5_1 + 1 | 0;
      if ($9_1) {
       continue
      }
      break;
     };
    }
    $8 = $4 + 1 | 0;
    $4 = $8 - $2_1 | 0;
    $1_1 = ($10_1 - $4 | 0) + 1 | 0;
    if ($4 >>> 0 < $1_1 >>> 0) {
     $11_1 = $11_1 >>> 0 < 2;
     while (1) {
      $5_1 = 1;
      if (!$11_1) {
       while (1) {
        $6_1 = $5_1 << 2;
        HEAP32[$6_1 + (Math_imul($4, 52) + $3_1 | 0) >> 2] = HEAP32[$3_1 + $6_1 >> 2] >>> $4;
        $6_1 = ($2_1 | 0) != ($5_1 | 0);
        $5_1 = $5_1 + 1 | 0;
        if ($6_1) {
         continue
        }
        break;
       }
      }
      $4 = $4 + 1 | 0;
      if ($4 >>> 0 < $1_1 >>> 0) {
       continue
      }
      break;
     };
    }
    $36($19_1, $10_1, $15_1, $13_1, $18_1, $3_1, $2_1, $8);
    HEAP8[$7_1 + 5 | 0] = 1;
    HEAP8[$7_1 + 6 | 0] = $10_1;
    HEAP32[$0 >> 2] = HEAP32[$7_1 + 4 >> 2];
   }
   $5_1 = $14_1;
  }
  global$0 = $7_1 + 16 | 0;
  return $5_1;
 }
 
 function $36($0, $1_1, $2_1, $3_1, $4, $5_1, $6_1, $7_1) {
  var $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, $18_1 = 0;
  $9_1 = global$0 - 80 | 0;
  global$0 = $9_1;
  HEAP32[$9_1 - -64 >> 2] = HEAP32[$5_1 + 48 >> 2];
  $8 = $5_1;
  $10_1 = HEAP32[$8 + 44 >> 2];
  HEAP32[$9_1 + 56 >> 2] = HEAP32[$8 + 40 >> 2];
  HEAP32[$9_1 + 60 >> 2] = $10_1;
  $10_1 = HEAP32[$8 + 36 >> 2];
  HEAP32[$9_1 + 48 >> 2] = HEAP32[$8 + 32 >> 2];
  HEAP32[$9_1 + 52 >> 2] = $10_1;
  $10_1 = HEAP32[$8 + 28 >> 2];
  HEAP32[$9_1 + 40 >> 2] = HEAP32[$8 + 24 >> 2];
  HEAP32[$9_1 + 44 >> 2] = $10_1;
  $10_1 = HEAP32[$8 + 20 >> 2];
  HEAP32[$9_1 + 32 >> 2] = HEAP32[$8 + 16 >> 2];
  HEAP32[$9_1 + 36 >> 2] = $10_1;
  $10_1 = HEAP32[$8 + 4 >> 2];
  HEAP32[$9_1 + 16 >> 2] = HEAP32[$8 >> 2];
  HEAP32[$9_1 + 20 >> 2] = $10_1;
  $10_1 = HEAP32[$8 + 12 >> 2];
  HEAP32[$9_1 + 24 >> 2] = HEAP32[$8 + 8 >> 2];
  HEAP32[$9_1 + 28 >> 2] = $10_1;
  if ($3_1) {
   $17_1 = $7_1 - $6_1 | 0;
   $18_1 = $7_1 - $1_1 | 0;
   $10_1 = 0;
   while (1) {
    $8 = ($10_1 << 1) + $2_1 | 0;
    $11_1 = HEAPU8[$8 + 1 | 0];
    $6_1 = $7_1 - $11_1 | 0;
    $12_1 = $1_1 - $6_1 | 0;
    $14_1 = 1 << $12_1;
    $13_1 = HEAPU8[$8 | 0];
    $15_1 = ($9_1 + 16 | 0) + ($11_1 << 2) | 0;
    $8 = HEAP32[$15_1 >> 2];
    label$3 : {
     if ($12_1 >>> 0 >= $17_1 >>> 0) {
      $11_1 = $6_1 + $18_1 | 0;
      $16_1 = ($11_1 | 0) > 1 ? $11_1 : 1;
      $11_1 = HEAP32[($16_1 << 2) + $4 >> 2];
      $37(($8 << 2) + $0 | 0, $12_1, $6_1, Math_imul($6_1, 52) + $5_1 | 0, $16_1, ($11_1 << 1) + $2_1 | 0, $3_1 - $11_1 | 0, $7_1, $13_1);
      break label$3;
     }
     $38($9_1 + 12 | 0, $13_1);
     HEAP8[$9_1 + 15 | 0] = 1;
     HEAP8[$9_1 + 14 | 0] = $6_1;
     $13_1 = $8 + $14_1 | 0;
     if ($8 >>> 0 >= $13_1 >>> 0) {
      break label$3
     }
     $12_1 = HEAP32[$9_1 + 12 >> 2];
     $6_1 = $8;
     while (1) {
      $11_1 = ($6_1 << 2) + $0 | 0;
      HEAP16[$11_1 >> 1] = $12_1;
      HEAP16[$11_1 + 2 >> 1] = $12_1 >>> 16;
      $6_1 = $6_1 + 1 | 0;
      if (($13_1 | 0) != ($6_1 | 0)) {
       continue
      }
      break;
     };
    }
    HEAP32[$15_1 >> 2] = $8 + $14_1;
    $10_1 = $10_1 + 1 | 0;
    if (($10_1 | 0) != ($3_1 | 0)) {
     continue
    }
    break;
   };
  }
  global$0 = $9_1 + 80 | 0;
 }
 
 function $37($0, $1_1, $2_1, $3_1, $4, $5_1, $6_1, $7_1, $8) {
  var $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0;
  $9_1 = global$0 + -64 | 0;
  global$0 = $9_1;
  HEAP32[$9_1 + 48 >> 2] = HEAP32[$3_1 + 48 >> 2];
  $10_1 = HEAP32[$3_1 + 44 >> 2];
  HEAP32[$9_1 + 40 >> 2] = HEAP32[$3_1 + 40 >> 2];
  HEAP32[$9_1 + 44 >> 2] = $10_1;
  $10_1 = HEAP32[$3_1 + 36 >> 2];
  HEAP32[$9_1 + 32 >> 2] = HEAP32[$3_1 + 32 >> 2];
  HEAP32[$9_1 + 36 >> 2] = $10_1;
  $10_1 = HEAP32[$3_1 + 28 >> 2];
  HEAP32[$9_1 + 24 >> 2] = HEAP32[$3_1 + 24 >> 2];
  HEAP32[$9_1 + 28 >> 2] = $10_1;
  $10_1 = HEAP32[$3_1 + 20 >> 2];
  HEAP32[$9_1 + 16 >> 2] = HEAP32[$3_1 + 16 >> 2];
  HEAP32[$9_1 + 20 >> 2] = $10_1;
  $10_1 = HEAP32[$3_1 + 12 >> 2];
  HEAP32[$9_1 + 8 >> 2] = HEAP32[$3_1 + 8 >> 2];
  HEAP32[$9_1 + 12 >> 2] = $10_1;
  $10_1 = HEAP32[$3_1 + 4 >> 2];
  HEAP32[$9_1 >> 2] = HEAP32[$3_1 >> 2];
  HEAP32[$9_1 + 4 >> 2] = $10_1;
  label$1 : {
   if (($4 | 0) < 2) {
    break label$1
   }
   $4 = HEAP32[($4 << 2) + $9_1 >> 2];
   $38($9_1 + 60 | 0, $8);
   HEAP8[$9_1 + 63 | 0] = 1;
   HEAP8[$9_1 + 62 | 0] = $2_1;
   if (!$4) {
    break label$1
   }
   $3_1 = 0;
   $10_1 = HEAP32[$9_1 + 60 >> 2];
   while (1) {
    $11_1 = ($3_1 << 2) + $0 | 0;
    HEAP16[$11_1 >> 1] = $10_1;
    HEAP16[$11_1 + 2 >> 1] = $10_1 >>> 16;
    $3_1 = $3_1 + 1 | 0;
    if (($4 | 0) != ($3_1 | 0)) {
     continue
    }
    break;
   };
  }
  if ($6_1) {
   $4 = 0;
   while (1) {
    $10_1 = ($4 << 1) + $5_1 | 0;
    $11_1 = HEAPU8[$10_1 + 1 | 0];
    $12_1 = ($11_1 << 2) + $9_1 | 0;
    $3_1 = HEAP32[$12_1 >> 2];
    $38($9_1 + 60 | 0, (HEAPU8[$10_1 | 0] << 8) + $8 & 65535);
    HEAP8[$9_1 + 63 | 0] = 2;
    $10_1 = $7_1 - $11_1 | 0;
    HEAP8[$9_1 + 62 | 0] = $10_1 + $2_1;
    $10_1 = (1 << $1_1 - $10_1) + $3_1 | 0;
    $11_1 = HEAP32[$9_1 + 60 >> 2];
    while (1) {
     $13_1 = ($3_1 << 2) + $0 | 0;
     HEAP16[$13_1 >> 1] = $11_1;
     HEAP16[$13_1 + 2 >> 1] = $11_1 >>> 16;
     $3_1 = $3_1 + 1 | 0;
     if ($3_1 >>> 0 < $10_1 >>> 0) {
      continue
     }
     break;
    };
    HEAP32[$12_1 >> 2] = $10_1;
    $4 = $4 + 1 | 0;
    if (($4 | 0) != ($6_1 | 0)) {
     continue
    }
    break;
   };
  }
  global$0 = $9_1 - -64 | 0;
 }
 
 function $38($0, $1_1) {
  HEAP8[$0 | 0] = $1_1;
  HEAP8[$0 + 1 | 0] = $1_1 >>> 8;
 }
 
 function $39($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0;
  $5_1 = global$0 - 32 | 0;
  global$0 = $5_1;
  $2_1 = $15($5_1 + 8 | 0, $2_1, $3_1);
  if (!$3($2_1)) {
   $26($5_1, $4);
   $2_1 = $4 + 4 | 0;
   $3_1 = HEAPU8[$5_1 + 2 | 0];
   $8 = $0 + $1_1 | 0;
   $7_1 = $8 + -3 | 0;
   label$2 : {
    if ($17($5_1 + 8 | 0) | $7_1 >>> 0 <= $0 >>> 0) {
     break label$2
    }
    while (1) {
     $4 = $2_1 + ($28($5_1 + 8 | 0, $3_1) << 2) | 0;
     $6_1 = HEAPU16[$4 >> 1];
     HEAP8[$0 | 0] = $6_1;
     HEAP8[$0 + 1 | 0] = $6_1 >>> 8;
     $29($5_1 + 8 | 0, HEAPU8[$4 + 2 | 0]);
     $0 = HEAPU8[$4 + 3 | 0] + $0 | 0;
     $4 = $2_1 + ($28($5_1 + 8 | 0, $3_1) << 2) | 0;
     $6_1 = HEAPU16[$4 >> 1];
     HEAP8[$0 | 0] = $6_1;
     HEAP8[$0 + 1 | 0] = $6_1 >>> 8;
     $29($5_1 + 8 | 0, HEAPU8[$4 + 2 | 0]);
     $0 = $0 + HEAPU8[$4 + 3 | 0] | 0;
     if ($17($5_1 + 8 | 0)) {
      break label$2
     }
     if ($0 >>> 0 < $7_1 >>> 0) {
      continue
     }
     break;
    };
   }
   $4 = $8 + -2 | 0;
   label$4 : {
    if ($17($5_1 + 8 | 0) | $0 >>> 0 > $4 >>> 0) {
     break label$4
    }
    while (1) {
     $7_1 = $2_1 + ($28($5_1 + 8 | 0, $3_1) << 2) | 0;
     $6_1 = HEAPU16[$7_1 >> 1];
     HEAP8[$0 | 0] = $6_1;
     HEAP8[$0 + 1 | 0] = $6_1 >>> 8;
     $29($5_1 + 8 | 0, HEAPU8[$7_1 + 2 | 0]);
     $0 = HEAPU8[$7_1 + 3 | 0] + $0 | 0;
     if ($17($5_1 + 8 | 0)) {
      break label$4
     }
     if ($0 >>> 0 <= $4 >>> 0) {
      continue
     }
     break;
    };
   }
   if ($0 >>> 0 <= $4 >>> 0) {
    while (1) {
     $7_1 = $2_1 + ($28($5_1 + 8 | 0, $3_1) << 2) | 0;
     $6_1 = HEAPU16[$7_1 >> 1];
     HEAP8[$0 | 0] = $6_1;
     HEAP8[$0 + 1 | 0] = $6_1 >>> 8;
     $29($5_1 + 8 | 0, HEAPU8[$7_1 + 2 | 0]);
     $0 = HEAPU8[$7_1 + 3 | 0] + $0 | 0;
     if ($0 >>> 0 <= $4 >>> 0) {
      continue
     }
     break;
    }
   }
   label$8 : {
    if ($0 >>> 0 >= $8 >>> 0) {
     break label$8
    }
    $4 = $0;
    $3_1 = $28($5_1 + 8 | 0, $3_1);
    $0 = $2_1 + ($3_1 << 2) | 0;
    HEAP8[$4 | 0] = HEAPU8[$0 | 0];
    if (HEAPU8[$0 + 3 | 0] == 1) {
     $29($5_1 + 8 | 0, HEAPU8[$0 + 2 | 0]);
     break label$8;
    }
    if (HEAPU32[$5_1 + 12 >> 2] > 31) {
     break label$8
    }
    $29($5_1 + 8 | 0, HEAPU8[($2_1 + ($3_1 << 2) | 0) + 2 | 0]);
    if (HEAPU32[$5_1 + 12 >> 2] < 33) {
     break label$8
    }
    HEAP32[$5_1 + 12 >> 2] = 32;
   }
   $2_1 = $30($5_1 + 8 | 0) ? $1_1 : -20;
  }
  global$0 = $5_1 + 32 | 0;
  return $2_1;
 }
 
 function $40($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, $18_1 = 0;
  $5_1 = global$0 - 112 | 0;
  global$0 = $5_1;
  $6_1 = -20;
  label$1 : {
   if ($3_1 >>> 0 < 10) {
    break label$1
   }
   $13_1 = $61($2_1);
   $9_1 = $61($2_1 + 2 | 0);
   $15_1 = $61($2_1 + 4 | 0);
   $26($5_1 + 8 | 0, $4);
   $7_1 = ($15_1 + ($9_1 + $13_1 | 0) | 0) + 6 | 0;
   if ($3_1 >>> 0 < $7_1 >>> 0) {
    break label$1
   }
   $10_1 = HEAPU8[$5_1 + 10 | 0];
   $14_1 = $2_1 + 6 | 0;
   $2_1 = $15($5_1 + 88 | 0, $14_1, $13_1);
   if ($3($2_1)) {
    $6_1 = $2_1;
    break label$1;
   }
   $14_1 = $13_1 + $14_1 | 0;
   $18_1 = $15($5_1 - -64 | 0, $14_1, $9_1);
   $13_1 = $3($18_1);
   $2_1 = $13_1 ? $18_1 : $2_1;
   if ($13_1) {
    $6_1 = $2_1;
    break label$1;
   }
   $9_1 = $9_1 + $14_1 | 0;
   $14_1 = $15($5_1 + 40 | 0, $9_1, $15_1);
   $13_1 = $3($14_1);
   $2_1 = $13_1 ? $14_1 : $2_1;
   if ($13_1) {
    $6_1 = $2_1;
    break label$1;
   }
   $3_1 = $15($5_1 + 16 | 0, $9_1 + $15_1 | 0, $3_1 - $7_1 | 0);
   $13_1 = $3($3_1);
   if ($13_1) {
    $6_1 = $13_1 ? $3_1 : $2_1;
    break label$1;
   }
   $7_1 = $4 + 4 | 0;
   $2_1 = $1_1 + 3 >>> 2 | 0;
   $9_1 = $2_1 + $0 | 0;
   $15_1 = $9_1 + $2_1 | 0;
   $13_1 = $15_1 + $2_1 | 0;
   $18_1 = $0 + $1_1 | 0;
   $14_1 = $18_1 + -3 | 0;
   label$6 : {
    if ($13_1 >>> 0 >= $14_1 >>> 0) {
     $8 = $13_1 >>> 0 < $14_1 >>> 0;
     $3_1 = $13_1;
     $4 = $15_1;
     $2_1 = $9_1;
     break label$6;
    }
    $2_1 = $9_1;
    $4 = $15_1;
    $3_1 = $13_1;
    while (1) {
     $8 = $7_1 + ($28($5_1 + 88 | 0, $10_1) << 2) | 0;
     $12_1 = HEAPU16[$8 >> 1];
     HEAP8[$0 | 0] = $12_1;
     HEAP8[$0 + 1 | 0] = $12_1 >>> 8;
     $29($5_1 + 88 | 0, HEAPU8[$8 + 2 | 0]);
     $12_1 = HEAPU8[$8 + 3 | 0];
     $8 = $7_1 + ($28($5_1 - -64 | 0, $10_1) << 2) | 0;
     $11_1 = HEAPU16[$8 >> 1];
     HEAP8[$2_1 | 0] = $11_1;
     HEAP8[$2_1 + 1 | 0] = $11_1 >>> 8;
     $29($5_1 - -64 | 0, HEAPU8[$8 + 2 | 0]);
     $11_1 = HEAPU8[$8 + 3 | 0];
     $8 = $7_1 + ($28($5_1 + 40 | 0, $10_1) << 2) | 0;
     $16_1 = HEAPU16[$8 >> 1];
     HEAP8[$4 | 0] = $16_1;
     HEAP8[$4 + 1 | 0] = $16_1 >>> 8;
     $29($5_1 + 40 | 0, HEAPU8[$8 + 2 | 0]);
     $16_1 = HEAPU8[$8 + 3 | 0];
     $8 = $7_1 + ($28($5_1 + 16 | 0, $10_1) << 2) | 0;
     $17_1 = HEAPU16[$8 >> 1];
     HEAP8[$3_1 | 0] = $17_1;
     HEAP8[$3_1 + 1 | 0] = $17_1 >>> 8;
     $29($5_1 + 16 | 0, HEAPU8[$8 + 2 | 0]);
     $17_1 = HEAPU8[$8 + 3 | 0];
     $0 = $0 + $12_1 | 0;
     $8 = $7_1 + ($28($5_1 + 88 | 0, $10_1) << 2) | 0;
     $12_1 = HEAPU16[$8 >> 1];
     HEAP8[$0 | 0] = $12_1;
     HEAP8[$0 + 1 | 0] = $12_1 >>> 8;
     $29($5_1 + 88 | 0, HEAPU8[$8 + 2 | 0]);
     $12_1 = HEAPU8[$8 + 3 | 0];
     $2_1 = $2_1 + $11_1 | 0;
     $8 = $7_1 + ($28($5_1 - -64 | 0, $10_1) << 2) | 0;
     $11_1 = HEAPU16[$8 >> 1];
     HEAP8[$2_1 | 0] = $11_1;
     HEAP8[$2_1 + 1 | 0] = $11_1 >>> 8;
     $29($5_1 - -64 | 0, HEAPU8[$8 + 2 | 0]);
     $11_1 = HEAPU8[$8 + 3 | 0];
     $4 = $4 + $16_1 | 0;
     $8 = $7_1 + ($28($5_1 + 40 | 0, $10_1) << 2) | 0;
     $16_1 = HEAPU16[$8 >> 1];
     HEAP8[$4 | 0] = $16_1;
     HEAP8[$4 + 1 | 0] = $16_1 >>> 8;
     $29($5_1 + 40 | 0, HEAPU8[$8 + 2 | 0]);
     $16_1 = HEAPU8[$8 + 3 | 0];
     $3_1 = $3_1 + $17_1 | 0;
     $8 = $7_1 + ($28($5_1 + 16 | 0, $10_1) << 2) | 0;
     $17_1 = HEAPU16[$8 >> 1];
     HEAP8[$3_1 | 0] = $17_1;
     HEAP8[$3_1 + 1 | 0] = $17_1 >>> 8;
     $29($5_1 + 16 | 0, HEAPU8[$8 + 2 | 0]);
     $0 = $0 + $12_1 | 0;
     $2_1 = $2_1 + $11_1 | 0;
     $4 = $4 + $16_1 | 0;
     $3_1 = $3_1 + HEAPU8[$8 + 3 | 0] | 0;
     $8 = $3_1 >>> 0 < $14_1 >>> 0;
     $12_1 = $33($5_1 + 88 | 0);
     $11_1 = $33($5_1 - -64 | 0);
     $16_1 = $33($5_1 + 40 | 0);
     $17_1 = $33($5_1 + 16 | 0);
     if ($3_1 >>> 0 >= $14_1 >>> 0) {
      break label$6
     }
     if (!($17_1 | ($16_1 | ($12_1 | $11_1)))) {
      continue
     }
     break;
    };
   }
   if ($4 >>> 0 > $13_1 >>> 0 | $2_1 >>> 0 > $15_1 >>> 0 | $0 >>> 0 > $9_1 >>> 0) {
    break label$1
   }
   $12_1 = $9_1 + -3 | 0;
   label$9 : {
    if ($17($5_1 + 88 | 0) | $12_1 >>> 0 <= $0 >>> 0) {
     break label$9
    }
    while (1) {
     $6_1 = $7_1 + ($28($5_1 + 88 | 0, $10_1) << 2) | 0;
     $11_1 = HEAPU16[$6_1 >> 1];
     HEAP8[$0 | 0] = $11_1;
     HEAP8[$0 + 1 | 0] = $11_1 >>> 8;
     $29($5_1 + 88 | 0, HEAPU8[$6_1 + 2 | 0]);
     $0 = HEAPU8[$6_1 + 3 | 0] + $0 | 0;
     $6_1 = $7_1 + ($28($5_1 + 88 | 0, $10_1) << 2) | 0;
     $11_1 = HEAPU16[$6_1 >> 1];
     HEAP8[$0 | 0] = $11_1;
     HEAP8[$0 + 1 | 0] = $11_1 >>> 8;
     $29($5_1 + 88 | 0, HEAPU8[$6_1 + 2 | 0]);
     $0 = $0 + HEAPU8[$6_1 + 3 | 0] | 0;
     if ($17($5_1 + 88 | 0)) {
      break label$9
     }
     if ($0 >>> 0 < $12_1 >>> 0) {
      continue
     }
     break;
    };
   }
   $6_1 = $9_1 + -2 | 0;
   label$11 : {
    if ($17($5_1 + 88 | 0) | $0 >>> 0 > $6_1 >>> 0) {
     break label$11
    }
    while (1) {
     $12_1 = $7_1 + ($28($5_1 + 88 | 0, $10_1) << 2) | 0;
     $11_1 = HEAPU16[$12_1 >> 1];
     HEAP8[$0 | 0] = $11_1;
     HEAP8[$0 + 1 | 0] = $11_1 >>> 8;
     $29($5_1 + 88 | 0, HEAPU8[$12_1 + 2 | 0]);
     $0 = HEAPU8[$12_1 + 3 | 0] + $0 | 0;
     if ($17($5_1 + 88 | 0)) {
      break label$11
     }
     if ($0 >>> 0 <= $6_1 >>> 0) {
      continue
     }
     break;
    };
   }
   if ($0 >>> 0 <= $6_1 >>> 0) {
    while (1) {
     $12_1 = $7_1 + ($28($5_1 + 88 | 0, $10_1) << 2) | 0;
     $11_1 = HEAPU16[$12_1 >> 1];
     HEAP8[$0 | 0] = $11_1;
     HEAP8[$0 + 1 | 0] = $11_1 >>> 8;
     $29($5_1 + 88 | 0, HEAPU8[$12_1 + 2 | 0]);
     $0 = HEAPU8[$12_1 + 3 | 0] + $0 | 0;
     if ($0 >>> 0 <= $6_1 >>> 0) {
      continue
     }
     break;
    }
   }
   label$15 : {
    if ($0 >>> 0 >= $9_1 >>> 0) {
     break label$15
    }
    $9_1 = $0;
    $6_1 = $28($5_1 + 88 | 0, $10_1);
    $0 = $7_1 + ($6_1 << 2) | 0;
    HEAP8[$9_1 | 0] = HEAPU8[$0 | 0];
    if (HEAPU8[$0 + 3 | 0] == 1) {
     $29($5_1 + 88 | 0, HEAPU8[$0 + 2 | 0]);
     break label$15;
    }
    if (HEAPU32[$5_1 + 92 >> 2] > 31) {
     break label$15
    }
    $29($5_1 + 88 | 0, HEAPU8[($7_1 + ($6_1 << 2) | 0) + 2 | 0]);
    if (HEAPU32[$5_1 + 92 >> 2] < 33) {
     break label$15
    }
    HEAP32[$5_1 + 92 >> 2] = 32;
   }
   $6_1 = $15_1 + -3 | 0;
   label$17 : {
    if ($17($5_1 - -64 | 0) | $6_1 >>> 0 <= $2_1 >>> 0) {
     break label$17
    }
    while (1) {
     $0 = $7_1 + ($28($5_1 - -64 | 0, $10_1) << 2) | 0;
     $9_1 = HEAPU16[$0 >> 1];
     HEAP8[$2_1 | 0] = $9_1;
     HEAP8[$2_1 + 1 | 0] = $9_1 >>> 8;
     $29($5_1 - -64 | 0, HEAPU8[$0 + 2 | 0]);
     $0 = HEAPU8[$0 + 3 | 0] + $2_1 | 0;
     $2_1 = $7_1 + ($28($5_1 - -64 | 0, $10_1) << 2) | 0;
     $9_1 = HEAPU16[$2_1 >> 1];
     HEAP8[$0 | 0] = $9_1;
     HEAP8[$0 + 1 | 0] = $9_1 >>> 8;
     $29($5_1 - -64 | 0, HEAPU8[$2_1 + 2 | 0]);
     $2_1 = $0 + HEAPU8[$2_1 + 3 | 0] | 0;
     if ($17($5_1 - -64 | 0)) {
      break label$17
     }
     if ($2_1 >>> 0 < $6_1 >>> 0) {
      continue
     }
     break;
    };
   }
   $0 = $15_1 + -2 | 0;
   label$19 : {
    if ($17($5_1 - -64 | 0) | $2_1 >>> 0 > $0 >>> 0) {
     break label$19
    }
    while (1) {
     $6_1 = $7_1 + ($28($5_1 - -64 | 0, $10_1) << 2) | 0;
     $9_1 = HEAPU16[$6_1 >> 1];
     HEAP8[$2_1 | 0] = $9_1;
     HEAP8[$2_1 + 1 | 0] = $9_1 >>> 8;
     $29($5_1 - -64 | 0, HEAPU8[$6_1 + 2 | 0]);
     $2_1 = HEAPU8[$6_1 + 3 | 0] + $2_1 | 0;
     if ($17($5_1 - -64 | 0)) {
      break label$19
     }
     if ($2_1 >>> 0 <= $0 >>> 0) {
      continue
     }
     break;
    };
   }
   if ($2_1 >>> 0 <= $0 >>> 0) {
    while (1) {
     $6_1 = $7_1 + ($28($5_1 - -64 | 0, $10_1) << 2) | 0;
     $9_1 = HEAPU16[$6_1 >> 1];
     HEAP8[$2_1 | 0] = $9_1;
     HEAP8[$2_1 + 1 | 0] = $9_1 >>> 8;
     $29($5_1 - -64 | 0, HEAPU8[$6_1 + 2 | 0]);
     $2_1 = HEAPU8[$6_1 + 3 | 0] + $2_1 | 0;
     if ($2_1 >>> 0 <= $0 >>> 0) {
      continue
     }
     break;
    }
   }
   label$23 : {
    if ($2_1 >>> 0 >= $15_1 >>> 0) {
     break label$23
    }
    $6_1 = $2_1;
    $2_1 = $28($5_1 - -64 | 0, $10_1);
    $0 = $7_1 + ($2_1 << 2) | 0;
    HEAP8[$6_1 | 0] = HEAPU8[$0 | 0];
    if (HEAPU8[$0 + 3 | 0] == 1) {
     $29($5_1 - -64 | 0, HEAPU8[$0 + 2 | 0]);
     break label$23;
    }
    if (HEAPU32[$5_1 + 68 >> 2] > 31) {
     break label$23
    }
    $29($5_1 - -64 | 0, HEAPU8[($7_1 + ($2_1 << 2) | 0) + 2 | 0]);
    if (HEAPU32[$5_1 + 68 >> 2] < 33) {
     break label$23
    }
    HEAP32[$5_1 + 68 >> 2] = 32;
   }
   $6_1 = $13_1 + -3 | 0;
   label$25 : {
    if ($17($5_1 + 40 | 0) | $6_1 >>> 0 <= $4 >>> 0) {
     break label$25
    }
    while (1) {
     $0 = $7_1 + ($28($5_1 + 40 | 0, $10_1) << 2) | 0;
     $2_1 = HEAPU16[$0 >> 1];
     HEAP8[$4 | 0] = $2_1;
     HEAP8[$4 + 1 | 0] = $2_1 >>> 8;
     $29($5_1 + 40 | 0, HEAPU8[$0 + 2 | 0]);
     $0 = HEAPU8[$0 + 3 | 0] + $4 | 0;
     $2_1 = $7_1 + ($28($5_1 + 40 | 0, $10_1) << 2) | 0;
     $4 = HEAPU16[$2_1 >> 1];
     HEAP8[$0 | 0] = $4;
     HEAP8[$0 + 1 | 0] = $4 >>> 8;
     $29($5_1 + 40 | 0, HEAPU8[$2_1 + 2 | 0]);
     $4 = $0 + HEAPU8[$2_1 + 3 | 0] | 0;
     if ($17($5_1 + 40 | 0)) {
      break label$25
     }
     if ($4 >>> 0 < $6_1 >>> 0) {
      continue
     }
     break;
    };
   }
   $0 = $13_1 + -2 | 0;
   label$27 : {
    if ($17($5_1 + 40 | 0) | $4 >>> 0 > $0 >>> 0) {
     break label$27
    }
    while (1) {
     $2_1 = $7_1 + ($28($5_1 + 40 | 0, $10_1) << 2) | 0;
     $6_1 = HEAPU16[$2_1 >> 1];
     HEAP8[$4 | 0] = $6_1;
     HEAP8[$4 + 1 | 0] = $6_1 >>> 8;
     $29($5_1 + 40 | 0, HEAPU8[$2_1 + 2 | 0]);
     $4 = HEAPU8[$2_1 + 3 | 0] + $4 | 0;
     if ($17($5_1 + 40 | 0)) {
      break label$27
     }
     if ($4 >>> 0 <= $0 >>> 0) {
      continue
     }
     break;
    };
   }
   if ($4 >>> 0 <= $0 >>> 0) {
    while (1) {
     $2_1 = $7_1 + ($28($5_1 + 40 | 0, $10_1) << 2) | 0;
     $6_1 = HEAPU16[$2_1 >> 1];
     HEAP8[$4 | 0] = $6_1;
     HEAP8[$4 + 1 | 0] = $6_1 >>> 8;
     $29($5_1 + 40 | 0, HEAPU8[$2_1 + 2 | 0]);
     $4 = HEAPU8[$2_1 + 3 | 0] + $4 | 0;
     if ($4 >>> 0 <= $0 >>> 0) {
      continue
     }
     break;
    }
   }
   label$31 : {
    if ($4 >>> 0 >= $13_1 >>> 0) {
     break label$31
    }
    $2_1 = $28($5_1 + 40 | 0, $10_1);
    $0 = $7_1 + ($2_1 << 2) | 0;
    HEAP8[$4 | 0] = HEAPU8[$0 | 0];
    if (HEAPU8[$0 + 3 | 0] == 1) {
     $29($5_1 + 40 | 0, HEAPU8[$0 + 2 | 0]);
     break label$31;
    }
    if (HEAPU32[$5_1 + 44 >> 2] > 31) {
     break label$31
    }
    $29($5_1 + 40 | 0, HEAPU8[($7_1 + ($2_1 << 2) | 0) + 2 | 0]);
    if (HEAPU32[$5_1 + 44 >> 2] < 33) {
     break label$31
    }
    HEAP32[$5_1 + 44 >> 2] = 32;
   }
   label$33 : {
    if (!(!$17($5_1 + 16 | 0) & $8)) {
     break label$33
    }
    while (1) {
     $0 = $7_1 + ($28($5_1 + 16 | 0, $10_1) << 2) | 0;
     $2_1 = HEAPU16[$0 >> 1];
     HEAP8[$3_1 | 0] = $2_1;
     HEAP8[$3_1 + 1 | 0] = $2_1 >>> 8;
     $29($5_1 + 16 | 0, HEAPU8[$0 + 2 | 0]);
     $0 = HEAPU8[$0 + 3 | 0] + $3_1 | 0;
     $2_1 = $7_1 + ($28($5_1 + 16 | 0, $10_1) << 2) | 0;
     $3_1 = HEAPU16[$2_1 >> 1];
     HEAP8[$0 | 0] = $3_1;
     HEAP8[$0 + 1 | 0] = $3_1 >>> 8;
     $29($5_1 + 16 | 0, HEAPU8[$2_1 + 2 | 0]);
     $3_1 = $0 + HEAPU8[$2_1 + 3 | 0] | 0;
     if ($17($5_1 + 16 | 0)) {
      break label$33
     }
     if ($3_1 >>> 0 < $14_1 >>> 0) {
      continue
     }
     break;
    };
   }
   $0 = $18_1 + -2 | 0;
   label$35 : {
    if ($17($5_1 + 16 | 0) | $3_1 >>> 0 > $0 >>> 0) {
     break label$35
    }
    while (1) {
     $2_1 = $7_1 + ($28($5_1 + 16 | 0, $10_1) << 2) | 0;
     $4 = HEAPU16[$2_1 >> 1];
     HEAP8[$3_1 | 0] = $4;
     HEAP8[$3_1 + 1 | 0] = $4 >>> 8;
     $29($5_1 + 16 | 0, HEAPU8[$2_1 + 2 | 0]);
     $3_1 = HEAPU8[$2_1 + 3 | 0] + $3_1 | 0;
     if ($17($5_1 + 16 | 0)) {
      break label$35
     }
     if ($3_1 >>> 0 <= $0 >>> 0) {
      continue
     }
     break;
    };
   }
   if ($3_1 >>> 0 <= $0 >>> 0) {
    while (1) {
     $2_1 = $7_1 + ($28($5_1 + 16 | 0, $10_1) << 2) | 0;
     $4 = HEAPU16[$2_1 >> 1];
     HEAP8[$3_1 | 0] = $4;
     HEAP8[$3_1 + 1 | 0] = $4 >>> 8;
     $29($5_1 + 16 | 0, HEAPU8[$2_1 + 2 | 0]);
     $3_1 = HEAPU8[$2_1 + 3 | 0] + $3_1 | 0;
     if ($3_1 >>> 0 <= $0 >>> 0) {
      continue
     }
     break;
    }
   }
   label$39 : {
    if ($3_1 >>> 0 >= $18_1 >>> 0) {
     break label$39
    }
    $2_1 = $28($5_1 + 16 | 0, $10_1);
    $0 = $7_1 + ($2_1 << 2) | 0;
    HEAP8[$3_1 | 0] = HEAPU8[$0 | 0];
    if (HEAPU8[$0 + 3 | 0] == 1) {
     $29($5_1 + 16 | 0, HEAPU8[$0 + 2 | 0]);
     break label$39;
    }
    if (HEAPU32[$5_1 + 20 >> 2] > 31) {
     break label$39
    }
    $29($5_1 + 16 | 0, HEAPU8[($7_1 + ($2_1 << 2) | 0) + 2 | 0]);
    if (HEAPU32[$5_1 + 20 >> 2] < 33) {
     break label$39
    }
    HEAP32[$5_1 + 20 >> 2] = 32;
   }
   $6_1 = $30($5_1 + 88 | 0) & $30($5_1 - -64 | 0) & $30($5_1 + 40 | 0) & $30($5_1 + 16 | 0) ? $1_1 : -20;
  }
  global$0 = $5_1 + 112 | 0;
  return $6_1;
 }
 
 function $41($0, $1_1, $2_1, $3_1, $4, $5_1) {
  $5_1 = $35($0, $3_1, $4, $5_1, 2048);
  if ($3($5_1)) {
   return $5_1
  }
  if ($5_1 >>> 0 < $4 >>> 0) {
   $0 = $40($1_1, $2_1, $3_1 + $5_1 | 0, $4 - $5_1 | 0, $0)
  } else {
   $0 = -72
  }
  return $0;
 }
 
 function $42($0, $1_1) {
  var $2_1 = 0;
  $2_1 = 15;
  $1_1 = Math_imul($1_1 >>> 0 < $0 >>> 0 ? ($1_1 << 4 >>> 0) / ($0 >>> 0) | 0 : $2_1, 24);
  $0 = $0 >>> 8 | 0;
  $2_1 = Math_imul(HEAP32[$1_1 + 1884 >> 2], $0) + HEAP32[$1_1 + 1880 >> 2] | 0;
  return ($2_1 >>> 3 | 0) + $2_1 >>> 0 < HEAP32[$1_1 + 1872 >> 2] + Math_imul($0, HEAP32[$1_1 + 1876 >> 2]) >>> 0;
 }
 
 function $43($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0;
  $5_1 = global$0 - 16 | 0;
  global$0 = $5_1;
  $26($5_1 + 8 | 0, $4);
  label$1 : {
   if (HEAPU8[$5_1 + 9 | 0]) {
    $0 = $39($0, $1_1, $2_1, $3_1, $4);
    break label$1;
   }
   $0 = $27($0, $1_1, $2_1, $3_1, $4);
  }
  global$0 = $5_1 + 16 | 0;
  return $0;
 }
 
 function $44($0, $1_1, $2_1, $3_1, $4, $5_1) {
  $5_1 = $25($0, $3_1, $4, $5_1);
  if ($3($5_1)) {
   return $5_1
  }
  if ($5_1 >>> 0 < $4 >>> 0) {
   $0 = $27($1_1, $2_1, $3_1 + $5_1 | 0, $4 - $5_1 | 0, $0)
  } else {
   $0 = -72
  }
  return $0;
 }
 
 function $45($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0;
  $5_1 = global$0 - 16 | 0;
  global$0 = $5_1;
  $26($5_1 + 8 | 0, $4);
  label$1 : {
   if (HEAPU8[$5_1 + 9 | 0]) {
    $0 = $40($0, $1_1, $2_1, $3_1, $4);
    break label$1;
   }
   $0 = $31($0, $1_1, $2_1, $3_1, $4);
  }
  global$0 = $5_1 + 16 | 0;
  return $0;
 }
 
 function $46($0, $1_1, $2_1, $3_1, $4, $5_1) {
  if (!$2_1) {
   return -70
  }
  if (!$4) {
   return -20
  }
  if ($42($2_1, $4)) {
   return $41($0, $1_1, $2_1, $3_1, $4, $5_1)
  }
  return $34($0, $1_1, $2_1, $3_1, $4, $5_1);
 }
 
 function $49($0, $1_1) {
  var $2_1 = 0;
  HEAP32[$0 + 28952 >> 2] = HEAP32[$1_1 + 26676 >> 2];
  $2_1 = HEAP32[$1_1 + 4 >> 2];
  HEAP32[$0 + 28736 >> 2] = $2_1;
  HEAP32[$0 + 28732 >> 2] = $2_1;
  $2_1 = HEAP32[$1_1 + 4 >> 2] + HEAP32[$1_1 + 8 >> 2] | 0;
  HEAP32[$0 + 28728 >> 2] = $2_1;
  HEAP32[$0 + 28740 >> 2] = $2_1;
  if (HEAP32[$1_1 + 26680 >> 2]) {
   HEAP32[$0 + 28808 >> 2] = 1;
   HEAP32[$0 + 28812 >> 2] = 1;
   HEAP32[$0 + 12 >> 2] = $1_1 + 10276;
   HEAP32[$0 + 8 >> 2] = $1_1 + 4116;
   HEAP32[$0 + 4 >> 2] = $1_1 + 6172;
   HEAP32[$0 >> 2] = $1_1 + 12;
   HEAP32[$0 + 26668 >> 2] = HEAP32[$1_1 + 26664 >> 2];
   HEAP32[$0 + 26672 >> 2] = HEAP32[$1_1 + 26668 >> 2];
   HEAP32[$0 + 26676 >> 2] = HEAP32[$1_1 + 26672 >> 2];
   return;
  }
  HEAP32[$0 + 28808 >> 2] = 0;
  HEAP32[$0 + 28812 >> 2] = 0;
 }
 
 function $50($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0, $4 = 0;
  $1_1 = global$0 - 48 | 0;
  global$0 = $1_1;
  if ($0) {
   $2_1 = $1_1 + 40 | 0;
   $3_1 = $0 + 26692 | 0;
   HEAP32[$2_1 >> 2] = HEAP32[$3_1 >> 2];
   $4 = HEAP32[$0 + 26688 >> 2];
   HEAP32[$1_1 + 32 >> 2] = HEAP32[$0 + 26684 >> 2];
   HEAP32[$1_1 + 36 >> 2] = $4;
   $4 = HEAP32[$0 >> 2];
   HEAP32[$1_1 + 24 >> 2] = HEAP32[$3_1 >> 2];
   $3_1 = HEAP32[$0 + 26688 >> 2];
   HEAP32[$1_1 + 16 >> 2] = HEAP32[$0 + 26684 >> 2];
   HEAP32[$1_1 + 20 >> 2] = $3_1;
   $24($4, $1_1 + 16 | 0);
   HEAP32[$1_1 + 8 >> 2] = HEAP32[$2_1 >> 2];
   $2_1 = HEAP32[$1_1 + 36 >> 2];
   HEAP32[$1_1 >> 2] = HEAP32[$1_1 + 32 >> 2];
   HEAP32[$1_1 + 4 >> 2] = $2_1;
   $24($0, $1_1);
  }
  global$0 = $1_1 + 48 | 0;
 }
 
 function $51($0) {
  var $1_1 = 0, $2_1 = 0;
  $2_1 = global$0 - 32 | 0;
  global$0 = $2_1;
  HEAP32[$0 + 28980 >> 2] = 134217729;
  HEAP32[$0 + 28936 >> 2] = 0;
  HEAP32[$0 + 28908 >> 2] = 0;
  HEAP32[$0 + 28944 >> 2] = 0;
  HEAP32[$0 + 28948 >> 2] = 0;
  HEAP32[$0 + 160164 >> 2] = 0;
  HEAP32[$0 + 29020 >> 2] = 0;
  HEAP32[$0 + 29004 >> 2] = 0;
  HEAP32[$0 + 29008 >> 2] = 0;
  HEAP32[$0 + 28988 >> 2] = 0;
  HEAP32[$0 + 28740 >> 2] = 0;
  HEAP32[$0 + 28956 >> 2] = 0;
  HEAP32[$0 + 28960 >> 2] = 0;
  $1_1 = $0 + 28964 | 0;
  HEAP32[$1_1 >> 2] = 0;
  HEAP32[$1_1 + 4 >> 2] = 0;
  HEAP32[$0 + 28972 >> 2] = 0;
  $1_1 = $2_1 + 16 | 0;
  HEAP32[$1_1 >> 2] = 0;
  HEAP32[$1_1 + 4 >> 2] = 0;
  HEAP32[$1_1 + 8 >> 2] = 0;
  HEAP32[$1_1 + 12 >> 2] = 0;
  $1_1 = HEAP32[$2_1 + 28 >> 2];
  HEAP32[$2_1 + 8 >> 2] = HEAP32[$2_1 + 24 >> 2];
  HEAP32[$2_1 + 12 >> 2] = $1_1;
  $1_1 = HEAP32[$2_1 + 20 >> 2];
  HEAP32[$2_1 >> 2] = HEAP32[$2_1 + 16 >> 2];
  HEAP32[$2_1 + 4 >> 2] = $1_1;
  $1_1 = HEAP32[$2_1 + 8 >> 2] >>> 8 & 1;
  HEAP32[$0 + 29024 >> 2] = 0;
  HEAP32[$0 + 28940 >> 2] = $1_1;
  global$0 = $2_1 + 32 | 0;
 }
 
 function $54($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0, $4 = 0;
  $2_1 = global$0 - 16 | 0;
  global$0 = $2_1;
  label$1 : {
   if (!HEAP32[$0 >> 2] ^ !HEAP32[$0 + 4 >> 2]) {
    break label$1
   }
   $4 = $0 + 8 | 0;
   HEAP32[$2_1 + 8 >> 2] = HEAP32[$4 >> 2];
   $1_1 = HEAP32[$0 + 4 >> 2];
   HEAP32[$2_1 >> 2] = HEAP32[$0 >> 2];
   HEAP32[$2_1 + 4 >> 2] = $1_1;
   $1_1 = $23(160168, $2_1);
   if (!$1_1) {
    break label$1
   }
   $3_1 = HEAP32[$0 + 4 >> 2];
   HEAP32[$1_1 + 28916 >> 2] = HEAP32[$0 >> 2];
   HEAP32[$1_1 + 28920 >> 2] = $3_1;
   HEAP32[$1_1 + 28924 >> 2] = HEAP32[$4 >> 2];
   $51($1_1);
   $3_1 = $1_1;
  }
  global$0 = $2_1 + 16 | 0;
  return $3_1;
 }
 
 function $55($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0, $4 = 0;
  $1_1 = global$0 - 48 | 0;
  global$0 = $1_1;
  $2_1 = 0;
  label$1 : {
   if (!$0) {
    break label$1
   }
   $2_1 = -64;
   if (HEAP32[$0 + 28936 >> 2]) {
    break label$1
   }
   $2_1 = $1_1 + 40 | 0;
   HEAP32[$2_1 >> 2] = HEAP32[$0 + 28924 >> 2];
   $3_1 = HEAP32[$0 + 28920 >> 2];
   HEAP32[$1_1 + 32 >> 2] = HEAP32[$0 + 28916 >> 2];
   HEAP32[$1_1 + 36 >> 2] = $3_1;
   $56($0);
   $3_1 = HEAP32[$0 + 28968 >> 2];
   HEAP32[$1_1 + 24 >> 2] = HEAP32[$2_1 >> 2];
   $4 = HEAP32[$1_1 + 36 >> 2];
   HEAP32[$1_1 + 16 >> 2] = HEAP32[$1_1 + 32 >> 2];
   HEAP32[$1_1 + 20 >> 2] = $4;
   $24($3_1, $1_1 + 16 | 0);
   HEAP32[$0 + 28968 >> 2] = 0;
   HEAP32[$1_1 + 8 >> 2] = HEAP32[$2_1 >> 2];
   $2_1 = HEAP32[$1_1 + 36 >> 2];
   HEAP32[$1_1 >> 2] = HEAP32[$1_1 + 32 >> 2];
   HEAP32[$1_1 + 4 >> 2] = $2_1;
   $24($0, $1_1);
   $2_1 = 0;
  }
  global$0 = $1_1 + 48 | 0;
  return $2_1;
 }
 
 function $56($0) {
  $50(HEAP32[$0 + 28944 >> 2]);
  HEAP32[$0 + 28960 >> 2] = 0;
  HEAP32[$0 + 28944 >> 2] = 0;
  HEAP32[$0 + 28948 >> 2] = 0;
 }
 
 function $57($0, $1_1, $2_1) {
  $2_1 = $58($2_1);
  if ($2_1 >>> 0 <= $1_1 >>> 0) {
   $0 = HEAPU8[($0 + $2_1 | 0) + -1 | 0];
   $1_1 = $0 >>> 6 | 0;
   $2_1 = HEAP32[($1_1 << 2) + 4736 >> 2] + ($2_1 + HEAP32[(($0 & 3) << 2) + 4720 >> 2] | 0) | 0;
   $0 = ($0 & 32) >>> 5 | 0;
   $0 = ($2_1 + ($0 ^ 1) | 0) + ($0 & !$1_1) | 0;
  } else {
   $0 = -72
  }
  return $0;
 }
 
 function $58($0) {
  return $0 ? 1 : 5;
 }
 
 function $59($0, $1_1, $2_1, $3_1) {
  var $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0;
  HEAP32[$0 + 32 >> 2] = 0;
  HEAP32[$0 + 36 >> 2] = 0;
  HEAP32[$0 + 24 >> 2] = 0;
  HEAP32[$0 + 28 >> 2] = 0;
  HEAP32[$0 + 16 >> 2] = 0;
  HEAP32[$0 + 20 >> 2] = 0;
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 + 12 >> 2] = 0;
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
  $4 = $58($3_1);
  if ($4 >>> 0 > $2_1 >>> 0) {
   return $4
  }
  if (!$1_1) {
   return -1
  }
  label$3 : {
   label$4 : {
    if (($3_1 | 0) == 1) {
     break label$4
    }
    $5_1 = $9($1_1);
    if (($5_1 | 0) == -47205080) {
     break label$4
    }
    $3_1 = -10;
    if (($5_1 & -16) != 407710288) {
     break label$3
    }
    $3_1 = 8;
    if ($2_1 >>> 0 < 8) {
     break label$3
    }
    HEAP32[$0 >> 2] = 0;
    HEAP32[$0 + 4 >> 2] = 0;
    HEAP32[$0 + 32 >> 2] = 0;
    HEAP32[$0 + 36 >> 2] = 0;
    HEAP32[$0 + 24 >> 2] = 0;
    HEAP32[$0 + 28 >> 2] = 0;
    HEAP32[$0 + 16 >> 2] = 0;
    HEAP32[$0 + 20 >> 2] = 0;
    HEAP32[$0 + 8 >> 2] = 0;
    HEAP32[$0 + 12 >> 2] = 0;
    $1_1 = $9($1_1 + 4 | 0);
    HEAP32[$0 + 20 >> 2] = 1;
    HEAP32[$0 >> 2] = $1_1;
    HEAP32[$0 + 4 >> 2] = 0;
    return 0;
   }
   $6_1 = $57($1_1, $2_1, $3_1);
   if ($6_1 >>> 0 > $2_1 >>> 0) {
    return $6_1
   }
   HEAP32[$0 + 24 >> 2] = $6_1;
   $3_1 = -14;
   $2_1 = $1_1 + $4 | 0;
   $5_1 = HEAPU8[$2_1 + -1 | 0];
   if ($5_1 & 8) {
    break label$3
   }
   $8 = $5_1 & 32;
   if (!$8) {
    $2_1 = HEAPU8[$2_1 | 0];
    $10_1 = $2_1 >>> 0 > 167;
    $3_1 = -16;
    label$7 : {
     if ($10_1) {
      break label$7
     }
     $9_1 = $2_1 & 7;
     $3_1 = ($2_1 >>> 3 | 0) + 10 | 0;
     $2_1 = $3_1 & 31;
     if (32 <= ($3_1 & 63) >>> 0) {
      $3_1 = 1 << $2_1;
      $7_1 = 0;
     } else {
      $3_1 = (1 << $2_1) - 1 & 1 >>> 32 - $2_1;
      $7_1 = 1 << $2_1;
     }
     $2_1 = __wasm_i64_mul($9_1, 0, ($3_1 & 7) << 29 | $7_1 >>> 3, $3_1 >>> 3 | 0) + $7_1 | 0;
     $3_1 = $3_1 + i64toi32_i32$HIGH_BITS | 0;
     $9_1 = $2_1 >>> 0 < $7_1 >>> 0 ? $3_1 + 1 | 0 : $3_1;
     $7_1 = $2_1;
     $3_1 = $6_1;
    }
    if ($10_1) {
     break label$3
    }
    $4 = $4 + 1 | 0;
   }
   $2_1 = $5_1 >>> 6 | 0;
   $6_1 = $5_1 >>> 2 | 0;
   $3_1 = 0;
   label$9 : {
    label$10 : {
     switch (($5_1 & 3) + -1 | 0) {
     case 0:
      $3_1 = HEAPU8[$1_1 + $4 | 0];
      $4 = $4 + 1 | 0;
      break label$9;
     case 1:
      $3_1 = $61($1_1 + $4 | 0);
      $4 = $4 + 2 | 0;
      break label$9;
     case 2:
      break label$10;
     default:
      break label$9;
     };
    }
    $3_1 = $9($1_1 + $4 | 0);
    $4 = $4 + 4 | 0;
   }
   $6_1 = $6_1 & 1;
   label$13 : {
    label$14 : {
     switch ($2_1 + -1 | 0) {
     default:
      $5_1 = -1;
      $2_1 = -1;
      if (!$8) {
       break label$13
      }
      $5_1 = HEAPU8[$1_1 + $4 | 0];
      $2_1 = 0;
      break label$13;
     case 0:
      $2_1 = 0;
      $5_1 = $61($1_1 + $4 | 0) + 256 | 0;
      if ($5_1 >>> 0 < 256) {
       $2_1 = 1
      }
      break label$13;
     case 1:
      $5_1 = $9($1_1 + $4 | 0);
      $2_1 = 0;
      break label$13;
     case 2:
      break label$14;
     };
    }
    $5_1 = $62($1_1 + $4 | 0);
    $2_1 = i64toi32_i32$HIGH_BITS;
   }
   HEAP32[$0 + 32 >> 2] = $6_1;
   HEAP32[$0 + 28 >> 2] = $3_1;
   HEAP32[$0 >> 2] = $5_1;
   HEAP32[$0 + 4 >> 2] = $2_1;
   $3_1 = 0;
   HEAP32[$0 + 20 >> 2] = 0;
   $1_1 = $8 ? $5_1 : $7_1;
   HEAP32[$0 + 8 >> 2] = $1_1;
   $2_1 = $8 ? $2_1 : $9_1;
   HEAP32[$0 + 12 >> 2] = $2_1;
   HEAP32[$0 + 16 >> 2] = !$2_1 & $1_1 >>> 0 < 131072 | $2_1 >>> 0 < 0 ? $1_1 : 131072;
  }
  return $3_1;
 }
 
 function $61($0) {
  return HEAPU8[$0 | 0] | HEAPU8[$0 + 1 | 0] << 8;
 }
 
 function $62($0) {
  i64toi32_i32$HIGH_BITS = HEAPU8[$0 + 4 | 0] | HEAPU8[$0 + 5 | 0] << 8 | (HEAPU8[$0 + 6 | 0] << 16 | HEAPU8[$0 + 7 | 0] << 24);
  return HEAPU8[$0 | 0] | HEAPU8[$0 + 1 | 0] << 8 | (HEAPU8[$0 + 2 | 0] << 16 | HEAPU8[$0 + 3 | 0] << 24);
 }
 
 function $64($0, $1_1) {
  var $2_1 = 0;
  $2_1 = -72;
  label$1 : {
   if ($1_1 >>> 0 < 8) {
    break label$1
   }
   $0 = $9($0 + 4 | 0);
   $2_1 = -14;
   if ($0 >>> 0 > 4294967287) {
    break label$1
   }
   $0 = $0 + 8 | 0;
   $2_1 = $0 >>> 0 > $1_1 >>> 0 ? -72 : $0;
  }
  return $2_1;
 }
 
 function $65($0, $1_1) {
  var $2_1 = 0;
  $2_1 = global$0 - 16 | 0;
  global$0 = $2_1;
  $66($2_1, $0, $1_1);
  global$0 = $2_1 + 16 | 0;
  return HEAP32[$2_1 >> 2];
 }
 
 function $66($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0;
  $5_1 = global$0 + -64 | 0;
  global$0 = $5_1;
  label$1 : {
   label$2 : {
    if ($2_1 >>> 0 < 8) {
     break label$2
    }
    if (($9($1_1) & -16) != 407710288) {
     break label$2
    }
    $1_1 = $64($1_1, $2_1);
    HEAP32[$0 + 8 >> 2] = 0;
    HEAP32[$0 + 12 >> 2] = 0;
    HEAP32[$0 + 4 >> 2] = 0;
    HEAP32[$0 >> 2] = $1_1;
    break label$1;
   }
   $4 = $59($5_1 + 24 | 0, $1_1, $2_1, 0);
   if ($3($4)) {
    $67($0, $4);
    break label$1;
   }
   if ($4) {
    $67($0, -72);
    break label$1;
   }
   $3_1 = $2_1;
   $2_1 = HEAP32[$5_1 + 48 >> 2];
   $4 = $3_1 - $2_1 | 0;
   $2_1 = $1_1 + $2_1 | 0;
   while (1) {
    $3_1 = $68($2_1, $4, $5_1 + 8 | 0);
    label$6 : {
     if ($3($3_1)) {
      $67($0, $3_1);
      $3_1 = 1;
      break label$6;
     }
     $3_1 = $3_1 + 3 | 0;
     if ($4 >>> 0 < $3_1 >>> 0) {
      $67($0, -72);
      $3_1 = 1;
      break label$6;
     }
     $6_1 = $6_1 + 1 | 0;
     $4 = $4 - $3_1 | 0;
     $2_1 = $2_1 + $3_1 | 0;
     $3_1 = HEAP32[$5_1 + 12 >> 2] ? 3 : 0;
    }
    if (!$3_1) {
     continue
    }
    break;
   };
   if (($3_1 | 0) != 3) {
    break label$1
   }
   if (HEAP32[$5_1 + 56 >> 2]) {
    if ($4 >>> 0 <= 3) {
     $67($0, -72);
     break label$1;
    }
    $2_1 = $2_1 + 4 | 0;
   }
   $7_1 = HEAP32[$5_1 + 40 >> 2];
   $4 = HEAP32[$5_1 + 24 >> 2];
   $3_1 = HEAP32[$5_1 + 28 >> 2];
   HEAP32[$0 + 4 >> 2] = 0;
   HEAP32[$0 >> 2] = $2_1 - $1_1;
   $1_1 = ($4 | 0) == -1 & ($3_1 | 0) == -1;
   HEAP32[$0 + 8 >> 2] = $1_1 ? Math_imul($6_1, $7_1) : $4;
   HEAP32[$0 + 12 >> 2] = $1_1 ? 0 : $3_1;
  }
  global$0 = $5_1 - -64 | 0;
 }
 
 function $67($0, $1_1) {
  HEAP32[$0 + 8 >> 2] = -2;
  HEAP32[$0 + 12 >> 2] = -1;
  HEAP32[$0 >> 2] = $1_1;
 }
 
 function $68($0, $1_1, $2_1) {
  var $3_1 = 0;
  $3_1 = -72;
  label$1 : {
   if ($1_1 >>> 0 < 3) {
    break label$1
   }
   $1_1 = $87($0);
   $0 = $1_1 >>> 3 | 0;
   HEAP32[$2_1 + 8 >> 2] = $0;
   HEAP32[$2_1 + 4 >> 2] = $1_1 & 1;
   $3_1 = $1_1 >>> 1 & 3;
   HEAP32[$2_1 >> 2] = $3_1;
   label$2 : {
    switch ($3_1 + -1 | 0) {
    case 2:
     return -20;
    case 0:
     break label$1;
    default:
     break label$2;
    };
   }
   $3_1 = $0;
  }
  return $3_1;
 }
 
 function $69($0, $1_1) {
  var $2_1 = 0, $3_1 = 0;
  $2_1 = HEAP32[$0 + 28728 >> 2];
  if (($2_1 | 0) != ($1_1 | 0)) {
   HEAP32[$0 + 28740 >> 2] = $2_1;
   $2_1 = HEAP32[$0 + 28728 >> 2];
   HEAP32[$0 + 28728 >> 2] = $1_1;
   $3_1 = HEAP32[$0 + 28732 >> 2];
   HEAP32[$0 + 28732 >> 2] = $1_1;
   HEAP32[$0 + 28736 >> 2] = ($3_1 - $2_1 | 0) + $1_1;
  }
 }
 
 function $70($0, $1_1, $2_1, $3_1, $4, $5_1) {
  var $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0;
  $6_1 = global$0 - 16 | 0;
  global$0 = $6_1;
  HEAP32[$6_1 + 8 >> 2] = $4;
  HEAP32[$6_1 + 12 >> 2] = $3_1;
  if ($5_1) {
   $12_1 = HEAP32[$5_1 + 8 >> 2];
   $13_1 = HEAP32[$5_1 + 4 >> 2];
  }
  $9_1 = $1_1;
  label$2 : {
   label$3 : {
    while (1) {
     $14_1 = $58(HEAP32[$0 + 28908 >> 2]);
     $3_1 = HEAP32[$6_1 + 12 >> 2];
     $4 = HEAP32[$6_1 + 8 >> 2];
     label$5 : {
      while (1) {
       if ($4 >>> 0 < $14_1 >>> 0) {
        break label$5
       }
       $10_1 = 0;
       label$7 : {
        if (($9($3_1) & -16) != 407710288) {
         break label$7
        }
        $8 = $64($3_1, $4);
        $11_1 = $3($8);
        $7_1 = $11_1 ? $8 : $7_1;
        $10_1 = 1;
        if ($11_1) {
         break label$7
        }
        $4 = $4 - $8 | 0;
        $3_1 = $3_1 + $8 | 0;
        $10_1 = 2;
       }
       $8 = $10_1;
       if (($8 | 0) == 2) {
        continue
       }
       break;
      };
      if ($8) {
       break label$3
      }
      HEAP32[$6_1 + 12 >> 2] = $3_1;
      HEAP32[$6_1 + 8 >> 2] = $4;
      label$8 : {
       if ($5_1) {
        $71($0, $5_1);
        $3_1 = $3(0);
        $7_1 = $3_1 ? 0 : $7_1;
        if (!$3_1) {
         break label$8
        }
        break label$2;
       }
       $4 = $72($0, $13_1, $12_1);
       $3_1 = $3($4);
       $7_1 = $3_1 ? $4 : $7_1;
       if ($3_1) {
        break label$2
       }
      }
      $69($0, $9_1);
      $3_1 = 0;
      $4 = $73($0, $9_1, $2_1, $6_1 + 12 | 0, $6_1 + 8 | 0);
      label$10 : {
       if (($5($4) | 0) == 10 & $15_1) {
        $7_1 = -72;
        break label$10;
       }
       if ($3($4)) {
        $7_1 = $4;
        break label$10;
       }
       $2_1 = $2_1 - $4 | 0;
       $9_1 = $4 + $9_1 | 0;
       $3_1 = 1;
      }
      $15_1 = 1;
      if ($3_1) {
       continue
      }
      break label$2;
     }
     break;
    };
    HEAP32[$6_1 + 12 >> 2] = $3_1;
    HEAP32[$6_1 + 8 >> 2] = $4;
    $7_1 = -72;
    if ($4) {
     break label$2
    }
    $7_1 = $9_1 - $1_1 | 0;
    break label$2;
   }
   HEAP32[$6_1 + 12 >> 2] = $3_1;
   HEAP32[$6_1 + 8 >> 2] = $4;
  }
  global$0 = $6_1 + 16 | 0;
  return $7_1;
 }
 
 function $71($0, $1_1) {
  if ($1_1) {
   HEAP32[$0 + 28956 >> 2] = HEAP32[$0 + 28740 >> 2] != (HEAP32[$1_1 + 4 >> 2] + HEAP32[$1_1 + 8 >> 2] | 0)
  }
  $98($0);
  if (!($3(0) | !$1_1)) {
   $49($0, $1_1)
  }
 }
 
 function $72($0, $1_1, $2_1) {
  var $3_1 = 0;
  $98($0);
  $3_1 = 0;
  label$1 : {
   if ($3(0)) {
    break label$1
   }
   if (!(!$1_1 | !$2_1)) {
    $3_1 = -30;
    if ($3($99($0, $1_1, $2_1))) {
     break label$1
    }
   }
   $3_1 = 0;
  }
  return $3_1;
 }
 
 function $73($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0;
  $11_1 = global$0 - 16 | 0;
  global$0 = $11_1;
  $6_1 = -72;
  $8 = HEAP32[$4 >> 2];
  $5_1 = HEAP32[$0 + 28908 >> 2];
  label$1 : {
   if ($8 >>> 0 < ($5_1 ? 5 : 9) >>> 0) {
    break label$1
   }
   $7_1 = HEAP32[$3_1 >> 2];
   $6_1 = $57($7_1, $5_1 ? 1 : 5, $5_1);
   label$2 : {
    if ($3($6_1)) {
     $5_1 = $6_1;
     break label$2;
    }
    $5_1 = -72;
    if ($8 >>> 0 < $6_1 + 3 >>> 0) {
     break label$2
    }
    $5_1 = $80($0, $7_1, $6_1);
    if ($3($5_1)) {
     break label$2
    }
    $8 = $8 - $6_1 | 0;
    $7_1 = $6_1 + $7_1 | 0;
    $9_1 = 1;
   }
   if (!$9_1) {
    $6_1 = $5_1;
    break label$1;
   }
   $12_1 = $1_1 + $2_1 | 0;
   $13_1 = $0 + 28816 | 0;
   $9_1 = $1_1;
   while (1) {
    $6_1 = $5_1;
    $10_1 = $68($7_1, $8, $11_1);
    label$6 : {
     if ($3($10_1)) {
      $2_1 = 1;
      $5_1 = $10_1;
      break label$6;
     }
     $7_1 = $7_1 + 3 | 0;
     $5_1 = -72;
     $8 = $8 + -3 | 0;
     if ($8 >>> 0 < $10_1 >>> 0) {
      $2_1 = 1;
      break label$6;
     }
     $5_1 = -20;
     $2_1 = 1;
     label$9 : {
      label$10 : {
       switch (HEAP32[$11_1 >> 2]) {
       case 2:
        $5_1 = $81($0, $9_1, $12_1 - $9_1 | 0, $7_1, $10_1);
        break label$9;
       case 0:
        $5_1 = $82($9_1, $12_1 - $9_1 | 0, $7_1, $10_1);
        break label$9;
       case 1:
        break label$10;
       default:
        break label$6;
       };
      }
      $5_1 = $83($9_1, $12_1 - $9_1 | 0, HEAPU8[$7_1 | 0], HEAP32[$11_1 + 8 >> 2]);
     }
     if ($3($5_1)) {
      break label$6
     }
     if (HEAP32[$0 + 28784 >> 2]) {
      $84($13_1, $9_1, $5_1)
     }
     $2_1 = HEAP32[$11_1 + 4 >> 2] ? 5 : 0;
     $8 = $8 - $10_1 | 0;
     $7_1 = $7_1 + $10_1 | 0;
     $9_1 = $5_1 + $9_1 | 0;
     $5_1 = $6_1;
    }
    if (!$2_1) {
     continue
    }
    break;
   };
   if (($2_1 | 0) != 5) {
    $6_1 = $5_1;
    break label$1;
   }
   $2_1 = HEAP32[$0 + 28752 >> 2];
   $10_1 = HEAP32[$0 + 28756 >> 2];
   if (($2_1 | 0) != -1 | ($10_1 | 0) != -1) {
    $6_1 = -20;
    $12_1 = $9_1 - $1_1 | 0;
    if (($2_1 | 0) != ($12_1 | 0) | $12_1 >> 31 != ($10_1 | 0)) {
     break label$1
    }
   }
   if (HEAP32[$0 + 28784 >> 2]) {
    $6_1 = -22;
    $2_1 = 0;
    label$18 : {
     if ($8 >>> 0 < 4) {
      break label$18
     }
     $0 = $85($0 + 28816 | 0);
     if (($9($7_1) | 0) != ($0 | 0)) {
      break label$18
     }
     $8 = $8 + -4 | 0;
     $7_1 = $7_1 + 4 | 0;
     $2_1 = 1;
     $6_1 = $5_1;
    }
    if (!$2_1) {
     break label$1
    }
   }
   HEAP32[$3_1 >> 2] = $7_1;
   HEAP32[$4 >> 2] = $8;
   $6_1 = $9_1 - $1_1 | 0;
  }
  global$0 = $11_1 + 16 | 0;
  return $6_1;
 }
 
 function $74($0) {
  label$1 : {
   switch (HEAP32[$0 + 28960 >> 2] + 1 | 0) {
   default:
    $56($0);
    return 0;
   case 2:
    HEAP32[$0 + 28960 >> 2] = 0;
    break;
   case 0:
    break label$1;
   };
  }
  return HEAP32[$0 + 28948 >> 2];
 }
 
 function $77($0) {
  $0 = HEAP32[$0 + 28804 >> 2] + -2 | 0;
  if ($0 >>> 0 <= 5) {
   return HEAP32[($0 << 2) + 4816 >> 2]
  }
  return 0;
 }
 
 function $78($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0, $6_1 = 0;
  $6_1 = global$0 - 16 | 0;
  global$0 = $6_1;
  $5_1 = -72;
  label$1 : {
   if (($79($0, $4) | 0) != ($4 | 0)) {
    break label$1
   }
   if ($2_1) {
    $69($0, $1_1)
   }
   $5_1 = -1;
   label$3 : {
    label$4 : {
     label$5 : {
      switch (HEAP32[$0 + 28804 >> 2]) {
      case 0:
       label$10 : {
        $1_1 = HEAP32[$0 + 28908 >> 2];
        if ($1_1) {
         break label$10
        }
        if (($9($3_1) & -16) != 407710288) {
         break label$10
        }
        $145($0 + 160144 | 0, $3_1, $4);
        HEAP32[$0 + 28804 >> 2] = 6;
        HEAP32[$0 + 28744 >> 2] = 8 - $4;
        $5_1 = 0;
        break label$1;
       }
       $5_1 = $57($3_1, $4, $1_1);
       HEAP32[$0 + 28904 >> 2] = $5_1;
       if ($3($5_1)) {
        break label$1
       }
       $145($0 + 160144 | 0, $3_1, $4);
       HEAP32[$0 + 28804 >> 2] = 1;
       HEAP32[$0 + 28744 >> 2] = $5_1 - $4;
       $5_1 = 0;
       break label$1;
      case 1:
       $1_1 = $0 + 160144 | 0;
       $145($1_1 + (HEAP32[$0 + 28904 >> 2] - $4 | 0) | 0, $3_1, $4);
       $5_1 = $80($0, $1_1, HEAP32[$0 + 28904 >> 2]);
       if ($3($5_1)) {
        break label$1
       }
       HEAP32[$0 + 28804 >> 2] = 2;
       HEAP32[$0 + 28744 >> 2] = 3;
       $5_1 = 0;
       break label$1;
      case 2:
       $1_1 = $68($3_1, 3, $6_1);
       if ($3($1_1)) {
        $5_1 = $1_1;
        break label$1;
       }
       $5_1 = -20;
       if ($1_1 >>> 0 > HEAPU32[$0 + 28768 >> 2]) {
        break label$1
       }
       HEAP32[$0 + 28744 >> 2] = $1_1;
       HEAP32[$0 + 28800 >> 2] = HEAP32[$6_1 >> 2];
       HEAP32[$0 + 28932 >> 2] = HEAP32[$6_1 + 8 >> 2];
       $2_1 = HEAP32[$6_1 + 4 >> 2];
       if ($1_1) {
        HEAP32[$0 + 28804 >> 2] = $2_1 ? 4 : 3;
        $5_1 = 0;
        break label$1;
       }
       if ($2_1) {
        if (!HEAP32[$0 + 28784 >> 2]) {
         break label$4
        }
        HEAP32[$0 + 28804 >> 2] = 5;
        HEAP32[$0 + 28744 >> 2] = 4;
        $5_1 = 0;
        break label$1;
       }
       HEAP32[$0 + 28804 >> 2] = 2;
       HEAP32[$0 + 28744 >> 2] = 3;
       $5_1 = 0;
       break label$1;
      case 3:
      case 4:
       $5_1 = -20;
       label$14 : {
        label$15 : {
         switch (HEAP32[$0 + 28800 >> 2]) {
         case 2:
          $4 = $81($0, $1_1, $2_1, $3_1, $4);
          HEAP32[$0 + 28744 >> 2] = 0;
          break label$14;
         case 0:
          $4 = $82($1_1, $2_1, $3_1, $4);
          if ($3($4)) {
           $5_1 = $4;
           break label$1;
          }
          HEAP32[$0 + 28744 >> 2] = HEAP32[$0 + 28744 >> 2] - $4;
          break label$14;
         case 1:
          break label$15;
         default:
          break label$1;
         };
        }
        $4 = $83($1_1, $2_1, HEAPU8[$3_1 | 0], HEAP32[$0 + 28932 >> 2]);
        HEAP32[$0 + 28744 >> 2] = 0;
       }
       if ($3($4)) {
        $5_1 = $4;
        break label$1;
       }
       if ($4 >>> 0 > HEAPU32[$0 + 28768 >> 2]) {
        break label$1
       }
       $3_1 = HEAP32[$0 + 28796 >> 2];
       $2_1 = $4 + HEAP32[$0 + 28792 >> 2] | 0;
       if ($2_1 >>> 0 < $4 >>> 0) {
        $3_1 = $3_1 + 1 | 0
       }
       HEAP32[$0 + 28792 >> 2] = $2_1;
       HEAP32[$0 + 28796 >> 2] = $3_1;
       if (HEAP32[$0 + 28784 >> 2]) {
        $84($0 + 28816 | 0, $1_1, $4)
       }
       HEAP32[$0 + 28728 >> 2] = $1_1 + $4;
       if (HEAP32[$0 + 28744 >> 2]) {
        $5_1 = $4;
        break label$1;
       }
       if (HEAP32[$0 + 28804 >> 2] == 4) {
        $1_1 = HEAP32[$0 + 28756 >> 2];
        $3_1 = HEAP32[$0 + 28752 >> 2];
        if (($3_1 | 0) != HEAP32[$0 + 28792 >> 2] | ($1_1 | 0) != HEAP32[$0 + 28796 >> 2] ? ($3_1 | 0) != -1 | ($1_1 | 0) != -1 : 0) {
         break label$1
        }
        if (HEAP32[$0 + 28784 >> 2]) {
         HEAP32[$0 + 28804 >> 2] = 5;
         HEAP32[$0 + 28744 >> 2] = 4;
         $5_1 = $4;
         break label$1;
        }
        HEAP32[$0 + 28804 >> 2] = 0;
        HEAP32[$0 + 28744 >> 2] = 0;
        $5_1 = $4;
        break label$1;
       }
       HEAP32[$0 + 28744 >> 2] = 3;
       HEAP32[$0 + 28804 >> 2] = 2;
       $5_1 = $4;
       break label$1;
      case 6:
       break label$3;
      case 7:
       break label$4;
      case 5:
       break label$5;
      default:
       break label$1;
      };
     }
     $1_1 = $85($0 + 28816 | 0);
     $5_1 = -22;
     if (($9($3_1) | 0) != ($1_1 | 0)) {
      break label$1
     }
    }
    $5_1 = 0;
    HEAP32[$0 + 28804 >> 2] = 0;
    HEAP32[$0 + 28744 >> 2] = 0;
    break label$1;
   }
   $145(($0 - $4 | 0) + 160152 | 0, $3_1, $4);
   $1_1 = $9($0 + 160148 | 0);
   HEAP32[$0 + 28804 >> 2] = 7;
   HEAP32[$0 + 28744 >> 2] = $1_1;
   $5_1 = 0;
  }
  global$0 = $6_1 + 16 | 0;
  return $5_1;
 }
 
 function $79($0, $1_1) {
  if (HEAP32[$0 + 28804 >> 2] + -3 >>> 0 >= 2) {
   return HEAP32[$0 + 28744 >> 2]
  }
  if (HEAP32[$0 + 28800 >> 2]) {
   return HEAP32[$0 + 28744 >> 2]
  }
  $1_1 = $1_1 >>> 0 > 1 ? $1_1 : 1;
  $0 = HEAP32[$0 + 28744 >> 2];
  return $1_1 >>> 0 < $0 >>> 0 ? $1_1 : $0;
 }
 
 function $80($0, $1_1, $2_1) {
  $1_1 = $59($0 + 28752 | 0, $1_1, $2_1, HEAP32[$0 + 28908 >> 2]);
  if ($3($1_1)) {
   return $1_1
  }
  $2_1 = -72;
  label$2 : {
   if ($1_1) {
    break label$2
   }
   $1_1 = HEAP32[$0 + 28780 >> 2];
   if ($1_1) {
    $2_1 = -32;
    if (($1_1 | 0) != HEAP32[$0 + 28952 >> 2]) {
     break label$2
    }
   }
   $2_1 = 0;
   if (!HEAP32[$0 + 28784 >> 2]) {
    break label$2
   }
   $86($0 + 28816 | 0);
  }
  return $2_1;
 }
 
 function $81($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0;
  $8 = global$0 - 16 | 0;
  global$0 = $8;
  $5_1 = $0 + 28760 | 0;
  $6_1 = HEAP32[$5_1 + 4 >> 2];
  $9_1 = !$6_1 & HEAPU32[$5_1 >> 2] > 33554432 | $6_1 >>> 0 > 0;
  $5_1 = -72;
  label$3 : {
   if ($4 >>> 0 > 131071) {
    break label$3
   }
   $5_1 = $88($0, $3_1, $4);
   $7_1 = $3($5_1);
   if ($7_1) {
    break label$3
   }
   $6_1 = HEAP32[$0 + 28956 >> 2];
   $10_1 = $7_1 ? $3_1 : $3_1 + $5_1 | 0;
   $7_1 = $4 - ($7_1 ? 0 : $5_1) | 0;
   $3_1 = $89($0, $8 + 12 | 0, $10_1, $7_1);
   if ($3($3_1)) {
    $5_1 = $3_1;
    break label$3;
   }
   $4 = HEAP32[$8 + 12 >> 2];
   if (!$1_1) {
    $5_1 = -70;
    if (($4 | 0) > 0) {
     break label$3
    }
   }
   label$6 : {
    if ($6_1) {
     break label$6
    }
    $6_1 = 0;
    if (($4 | 0) < 5) {
     break label$6
    }
    $5_1 = $0 + 28760 | 0;
    $11_1 = HEAP32[$5_1 + 4 >> 2];
    if (!(!$11_1 & HEAPU32[$5_1 >> 2] > 16777216 | $11_1 >>> 0 > 0)) {
     break label$6
    }
    $6_1 = $90(HEAP32[$0 + 8 >> 2]) >>> 0 > 19;
   }
   $5_1 = $7_1 - $3_1 | 0;
   $3_1 = $3_1 + $10_1 | 0;
   HEAP32[$0 + 28956 >> 2] = 0;
   if ($6_1) {
    $5_1 = $122($0, $1_1, $2_1, $3_1, $5_1, $4, $9_1);
    break label$3;
   }
   $5_1 = $123($0, $1_1, $2_1, $3_1, $5_1, $4, $9_1);
  }
  global$0 = $8 + 16 | 0;
  return $5_1;
 }
 
 function $82($0, $1_1, $2_1, $3_1) {
  if (!$0) {
   return $3_1 ? -74 : 0
  }
  if ($3_1 >>> 0 <= $1_1 >>> 0) {
   $145($0, $2_1, $3_1)
  } else {
   $3_1 = -70
  }
  return $3_1;
 }
 
 function $83($0, $1_1, $2_1, $3_1) {
  if (!$0) {
   return $3_1 ? -74 : 0
  }
  if ($3_1 >>> 0 <= $1_1 >>> 0) {
   $146($0, $2_1, $3_1)
  } else {
   $3_1 = -70
  }
  return $3_1;
 }
 
 function $84($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0;
  $4 = HEAP32[$0 + 4 >> 2];
  $5_1 = HEAP32[$0 >> 2] + $2_1 | 0;
  if ($5_1 >>> 0 < $2_1 >>> 0) {
   $4 = $4 + 1 | 0
  }
  HEAP32[$0 >> 2] = $5_1;
  HEAP32[$0 + 4 >> 2] = $4;
  $3_1 = HEAP32[$0 + 72 >> 2];
  label$1 : {
   label$2 : {
    if ($3_1 + $2_1 >>> 0 <= 31) {
     if ($1_1) {
      $93(($0 + $3_1 | 0) + 40 | 0, $1_1, $2_1)
     }
     $1_1 = HEAP32[$0 + 72 >> 2] + $2_1 | 0;
     break label$2;
    }
    $6_1 = $1_1 + $2_1 | 0;
    if ($3_1) {
     $2_1 = $0 + 40 | 0;
     $93($2_1 + $3_1 | 0, $1_1, 32 - $3_1 | 0);
     HEAP32[$0 + 8 >> 2] = $94(HEAP32[$0 + 8 >> 2], HEAP32[$0 + 12 >> 2], $62($2_1), i64toi32_i32$HIGH_BITS);
     HEAP32[$0 + 12 >> 2] = i64toi32_i32$HIGH_BITS;
     HEAP32[$0 + 16 >> 2] = $94(HEAP32[$0 + 16 >> 2], HEAP32[$0 + 20 >> 2], $62($0 + 48 | 0), i64toi32_i32$HIGH_BITS);
     HEAP32[$0 + 20 >> 2] = i64toi32_i32$HIGH_BITS;
     HEAP32[$0 + 24 >> 2] = $94(HEAP32[$0 + 24 >> 2], HEAP32[$0 + 28 >> 2], $62($0 + 56 | 0), i64toi32_i32$HIGH_BITS);
     HEAP32[$0 + 28 >> 2] = i64toi32_i32$HIGH_BITS;
     HEAP32[$0 + 32 >> 2] = $94(HEAP32[$0 + 32 >> 2], HEAP32[$0 + 36 >> 2], $62($0 - -64 | 0), i64toi32_i32$HIGH_BITS);
     HEAP32[$0 + 36 >> 2] = i64toi32_i32$HIGH_BITS;
     $2_1 = HEAP32[$0 + 72 >> 2];
     HEAP32[$0 + 72 >> 2] = 0;
     $1_1 = ($1_1 - $2_1 | 0) + 32 | 0;
    }
    label$5 : {
     if ($1_1 + 32 >>> 0 > $6_1 >>> 0) {
      $2_1 = $1_1;
      break label$5;
     }
     $12_1 = $6_1 + -32 | 0;
     $3_1 = HEAP32[$0 + 32 >> 2];
     $4 = HEAP32[$0 + 36 >> 2];
     $5_1 = HEAP32[$0 + 24 >> 2];
     $7_1 = HEAP32[$0 + 28 >> 2];
     $8 = HEAP32[$0 + 16 >> 2];
     $9_1 = HEAP32[$0 + 20 >> 2];
     $10_1 = HEAP32[$0 + 8 >> 2];
     $11_1 = HEAP32[$0 + 12 >> 2];
     while (1) {
      $10_1 = $94($10_1, $11_1, $62($1_1), i64toi32_i32$HIGH_BITS);
      $11_1 = i64toi32_i32$HIGH_BITS;
      $8 = $94($8, $9_1, $62($1_1 + 8 | 0), i64toi32_i32$HIGH_BITS);
      $9_1 = i64toi32_i32$HIGH_BITS;
      $5_1 = $94($5_1, $7_1, $62($1_1 + 16 | 0), i64toi32_i32$HIGH_BITS);
      $7_1 = i64toi32_i32$HIGH_BITS;
      $3_1 = $94($3_1, $4, $62($1_1 + 24 | 0), i64toi32_i32$HIGH_BITS);
      $4 = i64toi32_i32$HIGH_BITS;
      $2_1 = $1_1 + 32 | 0;
      $1_1 = $2_1;
      if ($1_1 >>> 0 <= $12_1 >>> 0) {
       continue
      }
      break;
     };
     HEAP32[$0 + 32 >> 2] = $3_1;
     HEAP32[$0 + 36 >> 2] = $4;
     HEAP32[$0 + 24 >> 2] = $5_1;
     HEAP32[$0 + 28 >> 2] = $7_1;
     HEAP32[$0 + 16 >> 2] = $8;
     HEAP32[$0 + 20 >> 2] = $9_1;
     HEAP32[$0 + 8 >> 2] = $10_1;
     HEAP32[$0 + 12 >> 2] = $11_1;
    }
    if ($2_1 >>> 0 >= $6_1 >>> 0) {
     break label$1
    }
    $1_1 = $6_1 - $2_1 | 0;
    $93($0 + 40 | 0, $2_1, $1_1);
   }
   HEAP32[$0 + 72 >> 2] = $1_1;
  }
 }
 
 function $85($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0;
  $3_1 = $0 + 40 | 0;
  $10_1 = HEAP32[$0 + 72 >> 2];
  $8 = $3_1 + $10_1 | 0;
  $1_1 = HEAP32[$0 + 4 >> 2];
  $5_1 = $1_1;
  $4 = HEAP32[$0 >> 2];
  label$1 : {
   if (!$1_1 & $4 >>> 0 >= 32 | $1_1 >>> 0 > 0) {
    $11_1 = HEAP32[$0 + 16 >> 2];
    $12_1 = HEAP32[$0 + 20 >> 2];
    $1_1 = __wasm_rotl_i64($11_1, $12_1, 7);
    $9_1 = i64toi32_i32$HIGH_BITS;
    $2_1 = HEAP32[$0 + 12 >> 2];
    $16_1 = $2_1;
    $13_1 = HEAP32[$0 + 8 >> 2];
    $6_1 = __wasm_rotl_i64($13_1, $2_1, 1);
    $2_1 = $6_1 + $1_1 | 0;
    $1_1 = i64toi32_i32$HIGH_BITS + $9_1 | 0;
    $1_1 = $2_1 >>> 0 < $6_1 >>> 0 ? $1_1 + 1 | 0 : $1_1;
    $9_1 = HEAP32[$0 + 24 >> 2];
    $6_1 = HEAP32[$0 + 28 >> 2];
    $7_1 = __wasm_rotl_i64($9_1, $6_1, 12);
    $2_1 = $7_1 + $2_1 | 0;
    $1_1 = i64toi32_i32$HIGH_BITS + $1_1 | 0;
    $1_1 = $2_1 >>> 0 < $7_1 >>> 0 ? $1_1 + 1 | 0 : $1_1;
    $7_1 = HEAP32[$0 + 32 >> 2];
    $14_1 = HEAP32[$0 + 36 >> 2];
    $15_1 = __wasm_rotl_i64($7_1, $14_1, 18);
    $2_1 = $15_1 + $2_1 | 0;
    $1_1 = i64toi32_i32$HIGH_BITS + $1_1 | 0;
    $2_1 = $95($95($95($95($2_1, $2_1 >>> 0 < $15_1 >>> 0 ? $1_1 + 1 | 0 : $1_1, $13_1, $16_1), i64toi32_i32$HIGH_BITS, $11_1, $12_1), i64toi32_i32$HIGH_BITS, $9_1, $6_1), i64toi32_i32$HIGH_BITS, $7_1, $14_1);
    $1_1 = i64toi32_i32$HIGH_BITS;
    break label$1;
   }
   $1_1 = HEAP32[$0 + 28 >> 2] + 668265263 | 0;
   $2_1 = HEAP32[$0 + 24 >> 2] + 374761413 | 0;
   if ($2_1 >>> 0 < 374761413) {
    $1_1 = $1_1 + 1 | 0
   }
  }
  $1_1 = $1_1 + $5_1 | 0;
  $5_1 = $2_1 + $4 | 0;
  if ($5_1 >>> 0 < $2_1 >>> 0) {
   $1_1 = $1_1 + 1 | 0
  }
  $4 = $5_1;
  $5_1 = $0 + 48 | 0;
  label$3 : {
   if ($8 >>> 0 < $5_1 >>> 0) {
    $2_1 = $3_1;
    break label$3;
   }
   while (1) {
    $2_1 = __wasm_i64_mul(__wasm_rotl_i64($94(0, 0, $62($3_1), i64toi32_i32$HIGH_BITS) ^ $4, $1_1 ^ i64toi32_i32$HIGH_BITS, 27), i64toi32_i32$HIGH_BITS, -2048144761, -1640531535) + -1028477341 | 0;
    $1_1 = i64toi32_i32$HIGH_BITS + -2048144777 | 0;
    $1_1 = $2_1 >>> 0 < 3266489955 ? $1_1 + 1 | 0 : $1_1;
    $4 = $2_1;
    $2_1 = $5_1;
    $3_1 = $2_1;
    $5_1 = $2_1 + 8 | 0;
    if ($5_1 >>> 0 <= $8 >>> 0) {
     continue
    }
    break;
   };
  }
  $3_1 = $2_1 + 4 | 0;
  label$6 : {
   if ($3_1 >>> 0 > $8 >>> 0) {
    $3_1 = $2_1;
    break label$6;
   }
   $2_1 = __wasm_i64_mul(__wasm_rotl_i64(__wasm_i64_mul($9($2_1), 0, -2048144761, -1640531535) ^ $4, $1_1 ^ i64toi32_i32$HIGH_BITS, 23), i64toi32_i32$HIGH_BITS, 668265295, -1028477379) + -1640531463 | 0;
   $1_1 = i64toi32_i32$HIGH_BITS + 374761393 | 0;
   $1_1 = $2_1 >>> 0 < 2654435833 ? $1_1 + 1 | 0 : $1_1;
   $4 = $2_1;
  }
  if ($3_1 >>> 0 < $8 >>> 0) {
   $0 = ($0 + $10_1 | 0) + 40 | 0;
   while (1) {
    $4 = __wasm_i64_mul(__wasm_rotl_i64(__wasm_i64_mul(HEAPU8[$3_1 | 0], 0, 374761413, 668265263) ^ $4, $1_1 ^ i64toi32_i32$HIGH_BITS, 11), i64toi32_i32$HIGH_BITS, -2048144761, -1640531535);
    $1_1 = i64toi32_i32$HIGH_BITS;
    $3_1 = $3_1 + 1 | 0;
    if (($0 | 0) != ($3_1 | 0)) {
     continue
    }
    break;
   };
  }
  $0 = __wasm_i64_mul($4 ^ $1_1 >>> 1, $1_1, 668265295, -1028477379);
  $3_1 = i64toi32_i32$HIGH_BITS;
  $0 = __wasm_i64_mul($0 ^ (($3_1 & 536870911) << 3 | $0 >>> 29), $3_1 ^ $3_1 >>> 29, -1640531463, 374761393);
  $2_1 = i64toi32_i32$HIGH_BITS;
  i64toi32_i32$HIGH_BITS = $2_1;
  return $0 ^ $2_1;
 }
 
 function $86($0) {
  var $1_1 = 0;
  HEAP32[$0 + 40 >> 2] = 0;
  HEAP32[$0 + 44 >> 2] = 0;
  HEAP32[$0 + 32 >> 2] = 2048144761;
  HEAP32[$0 + 36 >> 2] = 1640531534;
  HEAP32[$0 + 24 >> 2] = 0;
  HEAP32[$0 + 28 >> 2] = 0;
  HEAP32[$0 + 16 >> 2] = 668265295;
  HEAP32[$0 + 20 >> 2] = -1028477379;
  HEAP32[$0 + 8 >> 2] = -1379879466;
  HEAP32[$0 + 12 >> 2] = 1625958382;
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
  HEAP32[$0 + 48 >> 2] = 0;
  HEAP32[$0 + 52 >> 2] = 0;
  HEAP32[$0 + 56 >> 2] = 0;
  HEAP32[$0 + 60 >> 2] = 0;
  $1_1 = $0 - -64 | 0;
  HEAP32[$1_1 >> 2] = 0;
  HEAP32[$1_1 + 4 >> 2] = 0;
  HEAP32[$0 + 72 >> 2] = 0;
  HEAP32[$0 + 76 >> 2] = 0;
 }
 
 function $87($0) {
  return HEAPU8[$0 + 2 | 0] << 16 | $61($0);
 }
 
 function $88($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0;
  $9_1 = -20;
  label$1 : {
   if ($2_1 >>> 0 < 3) {
    break label$1
   }
   label$2 : {
    label$3 : {
     label$4 : {
      label$5 : {
       $4 = HEAPU8[$1_1 | 0];
       $8 = $4 & 3;
       switch ($8 - 1 | 0) {
       case 0:
        break label$2;
       case 1:
        break label$4;
       case 2:
        break label$5;
       default:
        break label$3;
       };
      }
      if (HEAP32[$0 + 28808 >> 2]) {
       break label$4
      }
      return -30;
     }
     if ($2_1 >>> 0 < 5) {
      break label$1
     }
     $5_1 = 3;
     $3_1 = $9($1_1);
     label$6 : {
      label$7 : {
       label$8 : {
        label$9 : {
         label$10 : {
          $6_1 = $4 >>> 2 & 3;
          switch ($6_1 + -2 | 0) {
          case 1:
           break label$8;
          case 0:
           break label$9;
          default:
           break label$10;
          };
         }
         $4 = $3_1 >>> 14 & 1023;
         $3_1 = $3_1 >>> 4 & 1023;
         $6_1 = !$6_1;
         break label$6;
        }
        $4 = $3_1 >>> 18 | 0;
        $5_1 = 4;
        $3_1 = $3_1 >>> 4 & 16383;
        break label$7;
       }
       $4 = HEAPU8[$1_1 + 4 | 0] << 10 | $3_1 >>> 22;
       $5_1 = 5;
       $3_1 = $3_1 >>> 4 & 262143;
      }
      $6_1 = 0;
     }
     if ($3_1 >>> 0 > 131072) {
      break label$1
     }
     $10_1 = $4 + $5_1 | 0;
     if ($10_1 >>> 0 > $2_1 >>> 0) {
      break label$1
     }
     if (!(!HEAP32[$0 + 28956 >> 2] | $3_1 >>> 0 < 769)) {
      $2_1 = 0;
      while (1) {
       $7_1 = $2_1 >>> 0 < 16324;
       $2_1 = $2_1 - -64 | 0;
       if ($7_1) {
        continue
       }
       break;
      };
     }
     label$13 : {
      if (($8 | 0) == 3) {
       $1_1 = $1_1 + $5_1 | 0;
       $2_1 = $0 + 29040 | 0;
       $5_1 = HEAP32[$0 + 12 >> 2];
       if ($6_1) {
        $1_1 = $43($2_1, $3_1, $1_1, $4, $5_1);
        break label$13;
       }
       $1_1 = $45($2_1, $3_1, $1_1, $4, $5_1);
       break label$13;
      }
      $2_1 = $0 + 26680 | 0;
      $1_1 = $1_1 + $5_1 | 0;
      $5_1 = $0 + 29040 | 0;
      $7_1 = $0 + 10280 | 0;
      if ($6_1) {
       $1_1 = $44($7_1, $5_1, $3_1, $1_1, $4, $2_1);
       break label$13;
      }
      $1_1 = $46($7_1, $5_1, $3_1, $1_1, $4, $2_1);
     }
     if ($3($1_1)) {
      break label$1
     }
     HEAP32[$0 + 28928 >> 2] = $3_1;
     HEAP32[$0 + 28808 >> 2] = 1;
     HEAP32[$0 + 28912 >> 2] = $0 + 29040;
     if (($8 | 0) == 2) {
      HEAP32[$0 + 12 >> 2] = $0 + 10280
     }
     $1_1 = $0 + $3_1 | 0;
     $0 = $1_1 + 29064 | 0;
     HEAP8[$0 | 0] = 0;
     HEAP8[$0 + 1 | 0] = 0;
     HEAP8[$0 + 2 | 0] = 0;
     HEAP8[$0 + 3 | 0] = 0;
     HEAP8[$0 + 4 | 0] = 0;
     HEAP8[$0 + 5 | 0] = 0;
     HEAP8[$0 + 6 | 0] = 0;
     HEAP8[$0 + 7 | 0] = 0;
     $0 = $1_1 + 29056 | 0;
     HEAP8[$0 | 0] = 0;
     HEAP8[$0 + 1 | 0] = 0;
     HEAP8[$0 + 2 | 0] = 0;
     HEAP8[$0 + 3 | 0] = 0;
     HEAP8[$0 + 4 | 0] = 0;
     HEAP8[$0 + 5 | 0] = 0;
     HEAP8[$0 + 6 | 0] = 0;
     HEAP8[$0 + 7 | 0] = 0;
     $0 = $1_1 + 29048 | 0;
     HEAP8[$0 | 0] = 0;
     HEAP8[$0 + 1 | 0] = 0;
     HEAP8[$0 + 2 | 0] = 0;
     HEAP8[$0 + 3 | 0] = 0;
     HEAP8[$0 + 4 | 0] = 0;
     HEAP8[$0 + 5 | 0] = 0;
     HEAP8[$0 + 6 | 0] = 0;
     HEAP8[$0 + 7 | 0] = 0;
     $0 = $1_1 + 29040 | 0;
     HEAP8[$0 | 0] = 0;
     HEAP8[$0 + 1 | 0] = 0;
     HEAP8[$0 + 2 | 0] = 0;
     HEAP8[$0 + 3 | 0] = 0;
     HEAP8[$0 + 4 | 0] = 0;
     HEAP8[$0 + 5 | 0] = 0;
     HEAP8[$0 + 6 | 0] = 0;
     HEAP8[$0 + 7 | 0] = 0;
     return $10_1;
    }
    $3_1 = 2;
    label$18 : {
     label$19 : {
      switch (($4 >>> 2 & 3) + -1 | 0) {
      default:
       $3_1 = 1;
       $4 = $4 >>> 3 | 0;
       break label$18;
      case 0:
       $4 = $61($1_1) >>> 4 | 0;
       break label$18;
      case 2:
       break label$19;
      };
     }
     $3_1 = 3;
     $4 = $87($1_1) >>> 4 | 0;
    }
    $5_1 = $3_1 + $4 | 0;
    if ($5_1 + 32 >>> 0 > $2_1 >>> 0) {
     if ($5_1 >>> 0 > $2_1 >>> 0) {
      break label$1
     }
     $1_1 = $145($0 + 29040 | 0, $1_1 + $3_1 | 0, $4);
     HEAP32[$0 + 28928 >> 2] = $4;
     HEAP32[$0 + 28912 >> 2] = $1_1;
     $0 = $1_1 + $4 | 0;
     HEAP8[$0 + 24 | 0] = 0;
     HEAP8[$0 + 25 | 0] = 0;
     HEAP8[$0 + 26 | 0] = 0;
     HEAP8[$0 + 27 | 0] = 0;
     HEAP8[$0 + 28 | 0] = 0;
     HEAP8[$0 + 29 | 0] = 0;
     HEAP8[$0 + 30 | 0] = 0;
     HEAP8[$0 + 31 | 0] = 0;
     HEAP8[$0 + 16 | 0] = 0;
     HEAP8[$0 + 17 | 0] = 0;
     HEAP8[$0 + 18 | 0] = 0;
     HEAP8[$0 + 19 | 0] = 0;
     HEAP8[$0 + 20 | 0] = 0;
     HEAP8[$0 + 21 | 0] = 0;
     HEAP8[$0 + 22 | 0] = 0;
     HEAP8[$0 + 23 | 0] = 0;
     HEAP8[$0 + 8 | 0] = 0;
     HEAP8[$0 + 9 | 0] = 0;
     HEAP8[$0 + 10 | 0] = 0;
     HEAP8[$0 + 11 | 0] = 0;
     HEAP8[$0 + 12 | 0] = 0;
     HEAP8[$0 + 13 | 0] = 0;
     HEAP8[$0 + 14 | 0] = 0;
     HEAP8[$0 + 15 | 0] = 0;
     HEAP8[$0 | 0] = 0;
     HEAP8[$0 + 1 | 0] = 0;
     HEAP8[$0 + 2 | 0] = 0;
     HEAP8[$0 + 3 | 0] = 0;
     HEAP8[$0 + 4 | 0] = 0;
     HEAP8[$0 + 5 | 0] = 0;
     HEAP8[$0 + 6 | 0] = 0;
     HEAP8[$0 + 7 | 0] = 0;
     return $5_1;
    }
    HEAP32[$0 + 28928 >> 2] = $4;
    HEAP32[$0 + 28912 >> 2] = $1_1 + $3_1;
    return $5_1;
   }
   $3_1 = 2;
   label$23 : {
    label$24 : {
     switch (($4 >>> 2 & 3) + -1 | 0) {
     default:
      $3_1 = 1;
      $2_1 = $4 >>> 3 | 0;
      break label$23;
     case 0:
      $2_1 = $61($1_1) >>> 4 | 0;
      break label$23;
     case 2:
      break label$24;
     };
    }
    $4 = $87($1_1);
    if ($2_1 >>> 0 < 4) {
     break label$1
    }
    $3_1 = 3;
    $2_1 = $4 >>> 4 | 0;
   }
   if ($2_1 >>> 0 > 131072) {
    break label$1
   }
   $1_1 = $146($0 + 29040 | 0, HEAPU8[$1_1 + $3_1 | 0], $2_1 + 32 | 0);
   HEAP32[$0 + 28928 >> 2] = $2_1;
   HEAP32[$0 + 28912 >> 2] = $1_1;
   $9_1 = $3_1 + 1 | 0;
  }
  return $9_1;
 }
 
 function $89($0, $1_1, $2_1, $3_1) {
  var $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0;
  $6_1 = -72;
  label$1 : {
   if (!$3_1) {
    break label$1
   }
   $5_1 = HEAPU8[$2_1 | 0];
   if (!$5_1) {
    HEAP32[$1_1 >> 2] = 0;
    return ($3_1 | 0) == 1 ? 1 : -72;
   }
   $7_1 = $2_1 + 1 | 0;
   $4 = $5_1 << 24 >> 24;
   $8 = $7_1;
   label$3 : {
    if (($4 | 0) > -1) {
     break label$3
    }
    if (($4 | 0) == -1) {
     if (($3_1 | 0) < 3) {
      break label$1
     }
     $5_1 = $61($7_1) + 32512 | 0;
     $8 = $2_1 + 3 | 0;
     break label$3;
    }
    if (($3_1 | 0) < 2) {
     break label$1
    }
    $5_1 = (HEAPU8[$2_1 + 1 | 0] | $5_1 << 8) + -32768 | 0;
    $8 = $2_1 + 2 | 0;
   }
   $4 = $8;
   HEAP32[$1_1 >> 2] = $5_1;
   $1_1 = $4 + 1 | 0;
   $7_1 = $2_1 + $3_1 | 0;
   if ($1_1 >>> 0 > $7_1 >>> 0) {
    break label$1
   }
   $6_1 = HEAPU8[$4 | 0];
   $3_1 = $120($0 + 16 | 0, $0, $6_1 >>> 6 | 0, 35, 9, $1_1, $7_1 - $1_1 | 0, 2960, 3104, 3264, HEAP32[$0 + 28812 >> 2], HEAP32[$0 + 28956 >> 2], $5_1);
   $4 = $3($3_1);
   $3_1 = $4 ? $1_1 : $1_1 + $3_1 | 0;
   $1_1 = 0;
   label$5 : {
    if ($4) {
     break label$5
    }
    $8 = $120($0 + 4120 | 0, $0 + 8 | 0, $6_1 >>> 4 & 3, 31, 8, $3_1, $7_1 - $3_1 | 0, 2256, 2384, 3792, HEAP32[$0 + 28812 >> 2], HEAP32[$0 + 28956 >> 2], $5_1);
    $4 = $3($8);
    $3_1 = $4 ? $3_1 : $3_1 + $8 | 0;
    if ($4) {
     break label$5
    }
    $1_1 = $120($0 + 6176 | 0, $0 + 4 | 0, $6_1 >>> 2 & 3, 52, 9, $3_1, $7_1 - $3_1 | 0, 2512, 2736, 4064, HEAP32[$0 + 28812 >> 2], HEAP32[$0 + 28956 >> 2], $5_1);
    $0 = $3($1_1);
    $3_1 = $0 ? $3_1 : $1_1 + $3_1 | 0;
    $1_1 = !$0;
   }
   $6_1 = -20;
   if (!$1_1) {
    break label$1
   }
   $6_1 = $3_1 - $2_1 | 0;
  }
  return $6_1;
 }
 
 function $90($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0;
  $3_1 = $0 + 8 | 0;
  $1_1 = HEAP32[$0 + 4 >> 2];
  $0 = 0;
  while (1) {
   $2_1 = (HEAPU8[(($0 << 3) + $3_1 | 0) + 2 | 0] > 22) + $2_1 | 0;
   $0 = $0 + 1 | 0;
   if (!($0 >>> $1_1)) {
    continue
   }
   break;
  };
  return $2_1 << 8 - $1_1;
 }
 
 function $93($0, $1_1, $2_1) {
  $145($0, $1_1, $2_1);
 }
 
 function $94($0, $1_1, $2_1, $3_1) {
  $2_1 = __wasm_i64_mul($2_1, $3_1, 668265295, -1028477379) + $0 | 0;
  $1_1 = $1_1 + i64toi32_i32$HIGH_BITS | 0;
  $0 = __wasm_i64_mul(__wasm_rotl_i64($2_1, $2_1 >>> 0 < $0 >>> 0 ? $1_1 + 1 | 0 : $1_1, 31), i64toi32_i32$HIGH_BITS, -2048144761, -1640531535);
  return $0;
 }
 
 function $95($0, $1_1, $2_1, $3_1) {
  $1_1 = __wasm_i64_mul($94(0, 0, $2_1, $3_1) ^ $0, $1_1 ^ i64toi32_i32$HIGH_BITS, -2048144761, -1640531535) + -1028477341 | 0;
  $0 = i64toi32_i32$HIGH_BITS + -2048144777 | 0;
  $0 = $1_1 >>> 0 < 3266489955 ? $0 + 1 | 0 : $0;
  i64toi32_i32$HIGH_BITS = $0;
  return $1_1;
 }
 
 function $96($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0;
  $3_1 = global$0 - 128 | 0;
  global$0 = $3_1;
  $9_1 = -30;
  label$1 : {
   if ($2_1 >>> 0 < 9) {
    break label$1
   }
   $5_1 = $1_1 + 8 | 0;
   $4 = $35($0 + 10264 | 0, $5_1, $2_1 + -8 | 0, $0, 10264);
   $6_1 = $3($4);
   if ($6_1) {
    break label$1
   }
   HEAP32[$3_1 + 124 >> 2] = 31;
   $4 = $6_1 ? $5_1 : $4 + $5_1 | 0;
   $2_1 = $1_1 + $2_1 | 0;
   $5_1 = $7($3_1, $3_1 + 124 | 0, $3_1 + 120 | 0, $4, $2_1 - $4 | 0);
   label$2 : {
    if ($3($5_1)) {
     break label$2
    }
    $6_1 = HEAP32[$3_1 + 124 >> 2];
    if ($6_1 >>> 0 > 31) {
     break label$2
    }
    $8 = HEAP32[$3_1 + 120 >> 2];
    if ($8 >>> 0 > 8) {
     break label$2
    }
    $97($0 + 4104 | 0, $3_1, $6_1, 2256, 2384, $8);
    $4 = $4 + $5_1 | 0;
    $7_1 = 1;
   }
   if (!$7_1) {
    break label$1
   }
   HEAP32[$3_1 + 124 >> 2] = 52;
   $5_1 = 0;
   $7_1 = $7($3_1, $3_1 + 124 | 0, $3_1 + 120 | 0, $4, $2_1 - $4 | 0);
   label$3 : {
    if ($3($7_1)) {
     break label$3
    }
    $6_1 = HEAP32[$3_1 + 124 >> 2];
    if ($6_1 >>> 0 > 52) {
     break label$3
    }
    $8 = HEAP32[$3_1 + 120 >> 2];
    if ($8 >>> 0 > 9) {
     break label$3
    }
    $97($0 + 6160 | 0, $3_1, $6_1, 2512, 2736, $8);
    $4 = $4 + $7_1 | 0;
    $5_1 = 1;
   }
   if (!$5_1) {
    break label$1
   }
   HEAP32[$3_1 + 124 >> 2] = 35;
   $5_1 = 0;
   $7_1 = $7($3_1, $3_1 + 124 | 0, $3_1 + 120 | 0, $4, $2_1 - $4 | 0);
   label$4 : {
    if ($3($7_1)) {
     break label$4
    }
    $6_1 = HEAP32[$3_1 + 124 >> 2];
    if ($6_1 >>> 0 > 35) {
     break label$4
    }
    $8 = HEAP32[$3_1 + 120 >> 2];
    if ($8 >>> 0 > 9) {
     break label$4
    }
    $97($0, $3_1, $6_1, 2960, 3104, $8);
    $4 = $4 + $7_1 | 0;
    $5_1 = 1;
   }
   if (!$5_1) {
    break label$1
   }
   $7_1 = $4 + 12 | 0;
   if ($7_1 >>> 0 > $2_1 >>> 0) {
    break label$1
   }
   $5_1 = $4 + 4 | 0;
   $6_1 = 1;
   label$5 : {
    label$6 : {
     $4 = $9($4);
     $8 = $2_1 - $7_1 | 0;
     if ($4 + -1 >>> 0 >= $8 >>> 0) {
      break label$6
     }
     $2_1 = 0;
     while (1) {
      HEAP32[(($2_1 << 2) + $0 | 0) + 26652 >> 2] = $4;
      $6_1 = $2_1 >>> 0 < 2;
      $2_1 = $2_1 + 1 | 0;
      if (($2_1 | 0) == 3) {
       break label$6
      }
      $4 = $9($5_1);
      $7_1 = $5_1 + 4 | 0;
      $5_1 = $7_1;
      if ($4 + -1 >>> 0 < $8 >>> 0) {
       continue
      }
      break;
     };
     break label$5;
    }
    $7_1 = $5_1;
   }
   if ($6_1) {
    break label$1
   }
   $9_1 = $7_1 - $1_1 | 0;
  }
  global$0 = $3_1 + 128 | 0;
  return $9_1;
 }
 
 function $97($0, $1_1, $2_1, $3_1, $4, $5_1) {
  var $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0;
  $12_1 = global$0 - 112 | 0;
  global$0 = $12_1;
  $14_1 = $0 + 8 | 0;
  $6_1 = 1;
  $10_1 = 1 << $5_1;
  $11_1 = $10_1 + -1 | 0;
  $7_1 = $11_1;
  $13_1 = $2_1 + 1 | 0;
  if ($13_1 >>> 0 >= $2_1 >>> 0) {
   $16_1 = 65536 << $5_1 + -1 >> 16;
   $7_1 = $11_1;
   while (1) {
    $15_1 = $8 << 1;
    $9_1 = HEAPU16[$15_1 + $1_1 >> 1];
    label$3 : {
     if (($9_1 | 0) == 65535) {
      HEAP32[(($7_1 << 3) + $14_1 | 0) + 4 >> 2] = $8;
      $7_1 = $7_1 + -1 | 0;
      $9_1 = 1;
      break label$3;
     }
     $6_1 = ($16_1 | 0) > $9_1 << 16 >> 16 ? $6_1 : 0;
    }
    HEAP16[$12_1 + $15_1 >> 1] = $9_1;
    $9_1 = ($2_1 | 0) != ($8 | 0);
    $8 = $8 + 1 | 0;
    if ($9_1) {
     continue
    }
    break;
   };
  }
  HEAP32[$0 + 4 >> 2] = $5_1;
  HEAP32[$0 >> 2] = $6_1;
  if ($13_1) {
   $9_1 = (($10_1 >>> 3) + ($10_1 >>> 1) | 0) + 3 | 0;
   $8 = 0;
   $6_1 = 0;
   while (1) {
    $0 = ($6_1 << 1) + $1_1 | 0;
    if (HEAP16[$0 >> 1] >= 1) {
     $0 = HEAP16[$0 >> 1];
     $13_1 = ($0 | 0) > 1 ? $0 : 1;
     $0 = 0;
     while (1) {
      HEAP32[(($8 << 3) + $14_1 | 0) + 4 >> 2] = $6_1;
      while (1) {
       $8 = $11_1 & $8 + $9_1;
       if ($8 >>> 0 > $7_1 >>> 0) {
        continue
       }
       break;
      };
      $0 = $0 + 1 | 0;
      if (($13_1 | 0) != ($0 | 0)) {
       continue
      }
      break;
     };
    }
    $0 = ($2_1 | 0) == ($6_1 | 0);
    $6_1 = $6_1 + 1 | 0;
    if (!$0) {
     continue
    }
    break;
   };
  }
  $2_1 = $10_1 >>> 0 > 1 ? $10_1 : 1;
  $7_1 = 0;
  while (1) {
   $0 = ($7_1 << 3) + $14_1 | 0;
   $11_1 = HEAP32[$0 + 4 >> 2];
   $6_1 = ($11_1 << 1) + $12_1 | 0;
   $1_1 = HEAPU16[$6_1 >> 1];
   HEAP16[$6_1 >> 1] = $1_1 + 1;
   $6_1 = $5_1 - $12($1_1) | 0;
   HEAP8[$0 + 3 | 0] = $6_1;
   HEAP16[$0 >> 1] = ($1_1 << ($6_1 & 255)) - $10_1;
   $1_1 = $11_1 << 2;
   HEAP8[$0 + 2 | 0] = HEAP32[$1_1 + $4 >> 2];
   HEAP32[$0 + 4 >> 2] = HEAP32[$1_1 + $3_1 >> 2];
   $7_1 = $7_1 + 1 | 0;
   if (($2_1 | 0) != ($7_1 | 0)) {
    continue
   }
   break;
  };
  global$0 = $12_1 + 112 | 0;
 }
 
 function $98($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0;
  HEAP32[$0 + 28744 >> 2] = $58(HEAP32[$0 + 28908 >> 2]);
  HEAP32[$0 + 28792 >> 2] = 0;
  HEAP32[$0 + 28796 >> 2] = 0;
  HEAP32[$0 + 28728 >> 2] = 0;
  HEAP32[$0 + 28732 >> 2] = 0;
  $1_1 = $0 + 28736 | 0;
  HEAP32[$1_1 >> 2] = 0;
  HEAP32[$1_1 + 4 >> 2] = 0;
  $1_1 = $0 + 10280 | 0;
  HEAP32[$1_1 >> 2] = 201326604;
  HEAP32[$0 + 28952 >> 2] = 0;
  HEAP32[$0 + 28808 >> 2] = 0;
  HEAP32[$0 + 28812 >> 2] = 0;
  HEAP32[$0 + 28800 >> 2] = 3;
  HEAP32[$0 + 28804 >> 2] = 0;
  $3_1 = HEAP32[813];
  $2_1 = $0 + 26668 | 0;
  HEAP32[$2_1 >> 2] = HEAP32[812];
  HEAP32[$2_1 + 4 >> 2] = $3_1;
  HEAP32[$0 + 26676 >> 2] = HEAP32[814];
  HEAP32[$0 + 12 >> 2] = $1_1;
  HEAP32[$0 + 8 >> 2] = $0 + 4120;
  HEAP32[$0 + 4 >> 2] = $0 + 6176;
  HEAP32[$0 >> 2] = $0 + 16;
 }
 
 function $99($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0;
  label$1 : {
   if ($2_1 >>> 0 <= 7) {
    break label$1
   }
   if (($9($1_1) | 0) != -332356553) {
    break label$1
   }
   HEAP32[$0 + 28952 >> 2] = $9($1_1 + 4 | 0);
   $3_1 = $96($0 + 16 | 0, $1_1, $2_1);
   $4 = $3($3_1);
   if ($4) {
    return $4 ? -30 : 0
   }
   HEAP32[$0 + 28808 >> 2] = 1;
   HEAP32[$0 + 28812 >> 2] = 1;
   $100($0, $1_1 + $3_1 | 0, $2_1 - $3_1 | 0);
   return 0;
  }
  $100($0, $1_1, $2_1);
  return 0;
 }
 
 function $100($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0;
  $3_1 = HEAP32[$0 + 28728 >> 2];
  HEAP32[$0 + 28740 >> 2] = $3_1;
  $4 = HEAP32[$0 + 28732 >> 2];
  HEAP32[$0 + 28732 >> 2] = $1_1;
  HEAP32[$0 + 28728 >> 2] = $1_1 + $2_1;
  HEAP32[$0 + 28736 >> 2] = ($4 - $3_1 | 0) + $1_1;
 }
 
 function $101() {
  var $0 = 0, $1_1 = 0;
  $0 = global$0 - 16 | 0;
  global$0 = $0;
  HEAP32[$0 + 8 >> 2] = 0;
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
  $1_1 = $102($0);
  global$0 = $0 + 16 | 0;
  return $1_1 | 0;
 }
 
 function $102($0) {
  var $1_1 = 0, $2_1 = 0;
  $1_1 = global$0 - 16 | 0;
  global$0 = $1_1;
  HEAP32[$1_1 + 8 >> 2] = HEAP32[$0 + 8 >> 2];
  $2_1 = HEAP32[$0 + 4 >> 2];
  HEAP32[$1_1 >> 2] = HEAP32[$0 >> 2];
  HEAP32[$1_1 + 4 >> 2] = $2_1;
  $0 = $54($1_1);
  global$0 = $1_1 + 16 | 0;
  return $0;
 }
 
 function $103($0) {
  $0 = $0 | 0;
  return $55($0) | 0;
 }
 
 function $104() {
  return 131075;
 }
 
 function $105() {
  return 131072;
 }
 
 function $107($0) {
  $0 = $0 | 0;
  return $108($0) | 0;
 }
 
 function $108($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0;
  HEAP32[$0 + 29020 >> 2] = 0;
  HEAP32[$0 + 28964 >> 2] = 0;
  if (!$3(0)) {
   $1_1 = $0;
   if (HEAP32[$0 + 28964 >> 2]) {
    $1_1 = -60
   } else {
    $56($1_1);
    $1_1 = 0;
   }
   $2_1 = $3($1_1);
   if ($2_1) {
    return $2_1 ? $1_1 : $3_1
   }
   $3_1 = $58(HEAP32[$0 + 28908 >> 2]);
  }
  return $3_1;
 }
 
 function $110($0, $1_1, $2_1, $3_1) {
  var $4 = 0, $5_1 = 0;
  $4 = $0;
  $0 = !$1_1 & $0 >>> 0 < 131072 | $1_1 >>> 0 < 0;
  $5_1 = $0 ? $4 : 131072;
  $4 = $4 + $5_1 | 0;
  $0 = ($0 ? $1_1 : 0) + $1_1 | 0;
  $0 = $4 >>> 0 < $5_1 >>> 0 ? $0 + 1 | 0 : $0;
  $1_1 = $4;
  $4 = $1_1 - -64 | 0;
  $0 = $0 - (($1_1 >>> 0 < 4294967232) + -1 | 0) | 0;
  $1_1 = ($3_1 | 0) == ($0 | 0) & $4 >>> 0 > $2_1 >>> 0 | $0 >>> 0 > $3_1 >>> 0;
  $2_1 = $1_1 ? $2_1 : $4;
  $0 = $1_1 ? $3_1 : $0;
  return ($0 | 0) == 1 & $2_1 >>> 0 < 0 | $0 >>> 0 < 1 ? $2_1 : -16;
 }
 
 function $111($0, $1_1, $2_1) {
  $0 = $0 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  var $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, $18_1 = 0, $19_1 = 0, $20_1 = 0, $21_1 = 0, $22 = 0, $23_1 = 0;
  $9_1 = global$0 - 32 | 0;
  global$0 = $9_1;
  $8 = HEAP32[$2_1 + 8 >> 2];
  $4 = HEAP32[$2_1 + 4 >> 2];
  $7_1 = HEAP32[$2_1 >> 2];
  $11_1 = HEAP32[$1_1 + 4 >> 2];
  $16_1 = HEAP32[$1_1 >> 2];
  $6_1 = HEAP32[$1_1 + 8 >> 2];
  $19_1 = $16_1 + $6_1 | 0;
  HEAP32[$9_1 + 28 >> 2] = $19_1;
  $3_1 = -72;
  label$1 : {
   if ($8 >>> 0 > $4 >>> 0) {
    break label$1
   }
   if ($6_1 >>> 0 > $11_1 >>> 0) {
    $3_1 = -70;
    break label$1;
   }
   $6_1 = $112($0, $1_1);
   if ($3($6_1)) {
    $3_1 = $6_1;
    break label$1;
   }
   $12_1 = $11_1 + $16_1 | 0;
   $16_1 = $0 + 28916 | 0;
   $21_1 = $0 + 160148 | 0;
   $13_1 = $4 + $7_1 | 0;
   $11_1 = $7_1 + $8 | 0;
   $20_1 = $13_1 - $11_1 | 0;
   $18_1 = $0 + 160144 | 0;
   $14_1 = $0 + 28752 | 0;
   $22 = $0 + 29028 | 0;
   $8 = $11_1;
   while (1) {
    $3_1 = -1;
    $7_1 = 1;
    $4 = 1;
    label$5 : {
     label$6 : {
      label$7 : {
       label$8 : {
        label$9 : {
         switch (HEAP32[$0 + 28964 >> 2]) {
         case 0:
          HEAP32[$0 + 28964 >> 2] = 1;
          HEAP32[$0 + 28992 >> 2] = 0;
          HEAP32[$0 + 28996 >> 2] = 0;
          HEAP32[$0 + 29012 >> 2] = 0;
          HEAP32[$0 + 29016 >> 2] = 0;
          HEAP32[$0 + 29e3 >> 2] = 0;
          HEAP32[$0 + 28976 >> 2] = 0;
          $4 = HEAP32[$1_1 + 4 >> 2];
          $3_1 = $22;
          HEAP32[$3_1 >> 2] = HEAP32[$1_1 >> 2];
          HEAP32[$3_1 + 4 >> 2] = $4;
          HEAP32[$3_1 + 8 >> 2] = HEAP32[$1_1 + 8 >> 2];
         case 1:
          $3_1 = $59($14_1, $18_1, HEAP32[$0 + 29e3 >> 2], HEAP32[$0 + 28908 >> 2]);
          label$12 : {
           if ($3($3_1)) {
            $6_1 = $3_1;
            $4 = 1;
            break label$12;
           }
           $4 = 0;
           if (!$3_1) {
            break label$12
           }
           $5_1 = HEAP32[$0 + 29e3 >> 2];
           $10_1 = $3_1 - $5_1 | 0;
           $4 = $13_1 - $8 | 0;
           if ($10_1 >>> 0 > $4 >>> 0) {
            if ($4) {
             $145(($0 + $5_1 | 0) + 160144 | 0, $8, $4);
             HEAP32[$0 + 29e3 >> 2] = $4 + HEAP32[$0 + 29e3 >> 2];
            }
            HEAP32[$2_1 + 8 >> 2] = HEAP32[$2_1 + 4 >> 2];
            $6_1 = HEAP32[$0 + 28908 >> 2] ? 2 : 6;
            $6_1 = (($6_1 >>> 0 > $3_1 >>> 0 ? $6_1 : $3_1) - HEAP32[$0 + 29e3 >> 2] | 0) + 3 | 0;
            $4 = 1;
            break label$12;
           }
           $145(($0 + $5_1 | 0) + 160144 | 0, $8, $10_1);
           HEAP32[$0 + 29e3 >> 2] = $3_1;
           $8 = $8 + $10_1 | 0;
           $4 = 6;
          }
          $3_1 = $6_1;
          label$16 : {
           switch ($4 | 0) {
           case 0:
            break label$16;
           case 6:
            break label$5;
           default:
            break label$1;
           };
          }
          $4 = HEAP32[$14_1 >> 2];
          $3_1 = HEAP32[$14_1 + 4 >> 2];
          if (($4 | 0) == -1 & ($3_1 | 0) == -1 | (!$3_1 & $4 >>> 0 > $12_1 - HEAP32[$9_1 + 28 >> 2] >>> 0 | $3_1 >>> 0 > 0 | HEAP32[$0 + 28772 >> 2] == 1)) {
           break label$8
          }
          $7_1 = $65($11_1, $20_1);
          label$18 : {
           if ($7_1 >>> 0 > $20_1 >>> 0) {
            $4 = 0;
            $7_1 = 1;
            break label$18;
           }
           $4 = 1;
           $5_1 = HEAP32[$9_1 + 28 >> 2];
           $3_1 = $70($0, $5_1, $12_1 - $5_1 | 0, $11_1, $7_1, $74($0));
           if ($3($3_1)) {
            $6_1 = $3_1;
            $7_1 = 1;
            break label$18;
           }
           HEAP32[$9_1 + 28 >> 2] = $3_1 + $5_1;
           HEAP32[$0 + 28964 >> 2] = 0;
           HEAP32[$0 + 28744 >> 2] = 0;
           $8 = $7_1 + $11_1 | 0;
           $4 = 6;
           $7_1 = 0;
          }
          $3_1 = $6_1;
          switch ($4 | 0) {
          case 6:
           break label$5;
          case 0:
           break label$8;
          default:
           break label$1;
          };
         case 3:
          break label$6;
         case 2:
          break label$7;
         case 4:
          break label$9;
         default:
          break label$1;
         };
        }
        $3_1 = HEAP32[$0 + 28992 >> 2];
        $4 = HEAP32[$0 + 28996 >> 2] - $3_1 | 0;
        $7_1 = HEAP32[$9_1 + 28 >> 2];
        $3_1 = $113($7_1, $12_1 - $7_1 | 0, $3_1 + HEAP32[$0 + 28984 >> 2] | 0, $4);
        HEAP32[$9_1 + 28 >> 2] = $3_1 + $7_1;
        $7_1 = $3_1 + HEAP32[$0 + 28992 >> 2] | 0;
        HEAP32[$0 + 28992 >> 2] = $7_1;
        label$21 : {
         if (($3_1 | 0) != ($4 | 0)) {
          break label$21
         }
         HEAP32[$0 + 28964 >> 2] = 2;
         $5_1 = HEAP32[$0 + 28756 >> 2];
         $10_1 = HEAP32[$0 + 28988 >> 2];
         if (!$5_1 & HEAPU32[$0 + 28752 >> 2] <= $10_1 >>> 0 | $5_1 >>> 0 < 0 | $7_1 + HEAP32[$0 + 28768 >> 2] >>> 0 <= $10_1 >>> 0) {
          break label$21
         }
         HEAP32[$0 + 28992 >> 2] = 0;
         HEAP32[$0 + 28996 >> 2] = 0;
        }
        $7_1 = ($3_1 | 0) == ($4 | 0);
        break label$5;
       }
       label$22 : {
        if (HEAP32[$0 + 28772 >> 2] == 1 | HEAP32[$0 + 29024 >> 2] != 1) {
         break label$22
        }
        $4 = HEAP32[$14_1 >> 2];
        $3_1 = HEAP32[$14_1 + 4 >> 2];
        if (($4 | 0) == -1 & ($3_1 | 0) == -1 | (!$3_1 & $4 >>> 0 <= $12_1 - HEAP32[$9_1 + 28 >> 2] >>> 0 | $3_1 >>> 0 < 0)) {
         break label$22
        }
        $3_1 = -70;
        break label$1;
       }
       $71($0, $74($0));
       $3_1 = $3(0);
       $6_1 = $3_1 ? 0 : $6_1;
       if ($3_1) {
        $3_1 = $6_1;
        break label$1;
       }
       label$24 : {
        if (($9($18_1) & -16) == 407710288) {
         $3_1 = $9($21_1);
         HEAP32[$0 + 28804 >> 2] = 7;
         HEAP32[$0 + 28744 >> 2] = $3_1;
         break label$24;
        }
        $4 = $80($0, $18_1, HEAP32[$0 + 29e3 >> 2]);
        $3_1 = $3($4);
        $6_1 = $3_1 ? $4 : $6_1;
        if ($3_1) {
         $3_1 = $6_1;
         break label$1;
        }
        HEAP32[$0 + 28804 >> 2] = 2;
        HEAP32[$0 + 28744 >> 2] = 3;
       }
       $3_1 = HEAP32[$0 + 28760 >> 2];
       $4 = HEAP32[$0 + 28764 >> 2];
       $5_1 = !$4 & $3_1 >>> 0 > 1024 | $4 >>> 0 > 0;
       $3_1 = $5_1 ? $3_1 : 1024;
       $4 = $5_1 ? $4 : 0;
       $5_1 = $4;
       HEAP32[$0 + 28760 >> 2] = $3_1;
       HEAP32[$0 + 28764 >> 2] = $4;
       if (!$4 & $3_1 >>> 0 > HEAPU32[$0 + 28980 >> 2] | $4 >>> 0 > 0) {
        $3_1 = -16;
        break label$1;
       }
       $4 = 0;
       $15_1 = $0;
       $10_1 = HEAP32[$0 + 28768 >> 2];
       $10_1 = $10_1 >>> 0 > 4 ? $10_1 : 4;
       $17_1 = $10_1;
       if (!HEAP32[$0 + 29024 >> 2]) {
        $4 = $110($3_1, $5_1, HEAP32[$14_1 >> 2], HEAP32[$14_1 + 4 >> 2])
       }
       $114($15_1, $17_1, $4);
       label$30 : {
        if (!(HEAPU32[$0 + 160164 >> 2] > 127 ? 0 : !(HEAPU32[$0 + 28972 >> 2] >= $10_1 >>> 0 ? HEAPU32[$0 + 28988 >> 2] < $4 >>> 0 : 1))) {
         $17_1 = $4 + $10_1 | 0;
         label$34 : {
          label$35 : {
           $3_1 = HEAP32[$0 + 28936 >> 2];
           if ($3_1) {
            if ($17_1 >>> 0 <= $3_1 + -160168 >>> 0) {
             break label$35
            }
            $6_1 = -64;
            $5_1 = 0;
            break label$34;
           }
           $5_1 = HEAP32[$0 + 28968 >> 2];
           $15_1 = $16_1 + 8 | 0;
           HEAP32[$9_1 + 24 >> 2] = HEAP32[$15_1 >> 2];
           $3_1 = $16_1;
           $23_1 = HEAP32[$3_1 + 4 >> 2];
           HEAP32[$9_1 + 16 >> 2] = HEAP32[$3_1 >> 2];
           HEAP32[$9_1 + 20 >> 2] = $23_1;
           $24($5_1, $9_1 + 16 | 0);
           $5_1 = 0;
           HEAP32[$0 + 28988 >> 2] = 0;
           HEAP32[$0 + 28972 >> 2] = 0;
           HEAP32[$9_1 + 8 >> 2] = HEAP32[$15_1 >> 2];
           $15_1 = HEAP32[$3_1 + 4 >> 2];
           HEAP32[$9_1 >> 2] = HEAP32[$3_1 >> 2];
           HEAP32[$9_1 + 4 >> 2] = $15_1;
           $3_1 = $23($17_1, $9_1);
           HEAP32[$0 + 28968 >> 2] = $3_1;
           if ($3_1) {
            break label$35
           }
           $6_1 = -64;
           break label$34;
          }
          HEAP32[$0 + 28972 >> 2] = $10_1;
          HEAP32[$0 + 28988 >> 2] = $4;
          HEAP32[$0 + 28984 >> 2] = $10_1 + HEAP32[$0 + 28968 >> 2];
          $5_1 = 1;
         }
         $3_1 = 0;
         if (!$5_1) {
          break label$30
         }
        }
        $3_1 = 1;
       }
       if (!$3_1) {
        $3_1 = $6_1;
        break label$1;
       }
       HEAP32[$0 + 28964 >> 2] = 2;
      }
      $4 = $13_1 - $8 | 0;
      $3_1 = $79($0, $4);
      label$38 : {
       if (!$3_1) {
        $7_1 = 0;
        HEAP32[$0 + 28964 >> 2] = 0;
        $5_1 = 6;
        break label$38;
       }
       $5_1 = 0;
       if ($4 >>> 0 < $3_1 >>> 0) {
        break label$38
       }
       $5_1 = $116($0, $9_1 + 28 | 0, $12_1, $8, $3_1);
       $4 = $3($5_1);
       $6_1 = $4 ? $5_1 : $6_1;
       $8 = $4 ? $8 : $3_1 + $8 | 0;
       $5_1 = $4 ? 1 : 6;
      }
      $4 = $5_1;
      $3_1 = $6_1;
      label$40 : {
       switch ($4 | 0) {
       case 0:
        break label$40;
       case 6:
        break label$5;
       default:
        break label$1;
       };
      }
      if (($8 | 0) == ($13_1 | 0)) {
       $7_1 = 0;
       break label$5;
      }
      HEAP32[$0 + 28964 >> 2] = 3;
      $4 = $7_1;
     }
     $10_1 = HEAP32[$0 + 28744 >> 2];
     $5_1 = HEAP32[$0 + 28976 >> 2];
     $7_1 = $10_1 - $5_1 | 0;
     $3_1 = $0;
     label$42 : {
      label$43 : {
       label$44 : {
        if ($117($0)) {
         $5_1 = $13_1 - $8 | 0;
         $5_1 = $7_1 >>> 0 < $5_1 >>> 0 ? $7_1 : $5_1;
         break label$44;
        }
        if ($7_1 >>> 0 > HEAP32[$0 + 28972 >> 2] - $5_1 >>> 0) {
         $5_1 = 0;
         $6_1 = -20;
         break label$43;
        }
        $5_1 = $113($5_1 + HEAP32[$0 + 28968 >> 2] | 0, $7_1, $8, $13_1 - $8 | 0);
       }
       HEAP32[$3_1 + 28976 >> 2] = $5_1 + HEAP32[$0 + 28976 >> 2];
       $8 = $5_1 + $8 | 0;
       if ($5_1 >>> 0 < $7_1 >>> 0) {
        $5_1 = 1;
        $4 = 0;
        break label$42;
       }
       HEAP32[$0 + 28976 >> 2] = 0;
       $3_1 = $116($0, $9_1 + 28 | 0, $12_1, HEAP32[$0 + 28968 >> 2], $10_1);
       $7_1 = $3($3_1);
       $5_1 = !$7_1;
       $6_1 = $7_1 ? $3_1 : $6_1;
      }
     }
     $7_1 = $4;
     $3_1 = $6_1;
     if (!$5_1) {
      break label$1
     }
    }
    if ($7_1) {
     continue
    }
    break;
   };
   HEAP32[$2_1 + 8 >> 2] = $8 - HEAP32[$2_1 >> 2];
   $6_1 = HEAP32[$9_1 + 28 >> 2] - HEAP32[$1_1 >> 2] | 0;
   HEAP32[$1_1 + 8 >> 2] = $6_1;
   HEAP32[$0 + 29036 >> 2] = $6_1;
   $6_1 = HEAP32[$1_1 + 4 >> 2];
   HEAP32[$0 + 29028 >> 2] = HEAP32[$1_1 >> 2];
   HEAP32[$0 + 29032 >> 2] = $6_1;
   label$48 : {
    label$49 : {
     if (($8 | 0) != ($11_1 | 0)) {
      break label$49
     }
     $1_1 = HEAP32[$9_1 + 28 >> 2];
     if (($1_1 | 0) != ($19_1 | 0)) {
      break label$49
     }
     $6_1 = HEAP32[$0 + 29020 >> 2];
     HEAP32[$0 + 29020 >> 2] = $6_1 + 1;
     if (($6_1 | 0) < 15) {
      break label$48
     }
     $3_1 = -70;
     if (($1_1 | 0) == ($12_1 | 0)) {
      break label$1
     }
     $3_1 = -72;
     if (($8 | 0) != ($13_1 | 0)) {
      break label$48
     }
     break label$1;
    }
    HEAP32[$0 + 29020 >> 2] = 0;
   }
   $1_1 = HEAP32[$0 + 28744 >> 2];
   if (!$1_1) {
    $1_1 = HEAP32[$0 + 29016 >> 2];
    if (HEAP32[$0 + 28996 >> 2] == HEAP32[$0 + 28992 >> 2]) {
     $3_1 = 0;
     if (!$1_1) {
      break label$1
     }
     $1_1 = HEAP32[$2_1 + 8 >> 2];
     if ($1_1 >>> 0 >= HEAPU32[$2_1 + 4 >> 2]) {
      HEAP32[$0 + 28964 >> 2] = 2;
      $3_1 = 1;
      break label$1;
     }
     HEAP32[$2_1 + 8 >> 2] = $1_1 + 1;
     break label$1;
    }
    $3_1 = 1;
    if ($1_1) {
     break label$1
    }
    HEAP32[$2_1 + 8 >> 2] = HEAP32[$2_1 + 8 >> 2] + -1;
    HEAP32[$0 + 29016 >> 2] = 1;
    break label$1;
   }
   $3_1 = ($1_1 - HEAP32[$0 + 28976 >> 2] | 0) + (($77($0) | 0) == 2 ? 3 : 0) | 0;
  }
  global$0 = $9_1 + 32 | 0;
  return $3_1 | 0;
 }
 
 function $112($0, $1_1) {
  var $2_1 = 0;
  if (!(!HEAP32[$0 + 28964 >> 2] | HEAP32[$0 + 29024 >> 2] != 1 | (HEAP32[$0 + 29032 >> 2] == HEAP32[$1_1 + 4 >> 2] ? !(HEAP32[$0 + 29028 >> 2] != HEAP32[$1_1 >> 2] | HEAP32[$0 + 29036 >> 2] != HEAP32[$1_1 + 8 >> 2]) : 0))) {
   $2_1 = -104
  }
  return $2_1;
 }
 
 function $113($0, $1_1, $2_1, $3_1) {
  $1_1 = $1_1 >>> 0 < $3_1 >>> 0 ? $1_1 : $3_1;
  if ($1_1) {
   $145($0, $2_1, $1_1)
  }
  return $1_1;
 }
 
 function $114($0, $1_1, $2_1) {
  if (HEAP32[$0 + 28988 >> 2] + HEAP32[$0 + 28972 >> 2] >>> 0 < Math_imul($1_1 + $2_1 | 0, 3) >>> 0) {
   HEAP32[$0 + 160164 >> 2] = 0;
   return;
  }
  HEAP32[$0 + 160164 >> 2] = HEAP32[$0 + 160164 >> 2] + 1;
 }
 
 function $116($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0;
  $5_1 = $117($0);
  label$1 : {
   label$2 : {
    if (!HEAP32[$0 + 29024 >> 2]) {
     $3_1 = $78($0, HEAP32[$0 + 28984 >> 2] + HEAP32[$0 + 28992 >> 2] | 0, $5_1 ? 0 : HEAP32[$0 + 28988 >> 2] - HEAP32[$0 + 28992 >> 2] | 0, $3_1, $4);
     if ($3($3_1)) {
      break label$1
     }
     if (!($3_1 | $5_1)) {
      HEAP32[$0 + 28964 >> 2] = 2;
      break label$2;
     }
     HEAP32[$0 + 28964 >> 2] = 4;
     HEAP32[$0 + 28996 >> 2] = HEAP32[$0 + 28992 >> 2] + $3_1;
     break label$2;
    }
    $3_1 = $78($0, HEAP32[$1_1 >> 2], $5_1 ? 0 : $2_1 - HEAP32[$1_1 >> 2] | 0, $3_1, $4);
    if ($3($3_1)) {
     break label$1
    }
    HEAP32[$1_1 >> 2] = HEAP32[$1_1 >> 2] + $3_1;
    HEAP32[$0 + 28964 >> 2] = 2;
   }
   $3_1 = 0;
  }
  return $3_1;
 }
 
 function $117($0) {
  return HEAP32[$0 + 28804 >> 2] == 7;
 }
 
 function $119($0, $1_1, $2_1, $3_1, $4, $5_1, $6_1) {
  $0 = $0 | 0;
  $1_1 = $1_1 | 0;
  $2_1 = $2_1 | 0;
  $3_1 = $3_1 | 0;
  $4 = $4 | 0;
  $5_1 = $5_1 | 0;
  $6_1 = $6_1 | 0;
  var $7_1 = 0;
  $7_1 = global$0 - 32 | 0;
  global$0 = $7_1;
  HEAP32[$7_1 + 20 >> 2] = $2_1;
  HEAP32[$7_1 + 16 >> 2] = $1_1;
  HEAP32[$7_1 + 24 >> 2] = HEAP32[$3_1 >> 2];
  HEAP32[$7_1 + 4 >> 2] = $5_1;
  HEAP32[$7_1 >> 2] = $4;
  HEAP32[$7_1 + 8 >> 2] = HEAP32[$6_1 >> 2];
  $0 = $111($0, $7_1 + 16 | 0, $7_1);
  HEAP32[$3_1 >> 2] = HEAP32[$7_1 + 24 >> 2];
  HEAP32[$6_1 >> 2] = HEAP32[$7_1 + 8 >> 2];
  global$0 = $7_1 + 32 | 0;
  return $0 | 0;
 }
 
 function $120($0, $1_1, $2_1, $3_1, $4, $5_1, $6_1, $7_1, $8, $9_1, $10_1, $11_1, $12_1) {
  var $13_1 = 0, $14_1 = 0;
  $13_1 = global$0 - 128 | 0;
  global$0 = $13_1;
  HEAP32[$13_1 + 124 >> 2] = $3_1;
  $14_1 = -1;
  label$1 : {
   label$2 : {
    switch ($2_1 | 0) {
    case 1:
     if (!$6_1) {
      $14_1 = -72;
      break label$1;
     }
     $14_1 = -20;
     $2_1 = HEAPU8[$5_1 | 0];
     if ($2_1 >>> 0 > $3_1 >>> 0) {
      break label$1
     }
     $2_1 = $2_1 << 2;
     $121($0, HEAP32[$2_1 + $7_1 >> 2], HEAP32[$2_1 + $8 >> 2]);
     HEAP32[$1_1 >> 2] = $0;
     $14_1 = 1;
     break label$1;
    case 0:
     HEAP32[$1_1 >> 2] = $9_1;
     $14_1 = 0;
     break label$1;
    case 3:
     if (!$10_1) {
      $14_1 = -20;
      break label$1;
     }
     $14_1 = 0;
     if (!$11_1 | ($12_1 | 0) < 25) {
      break label$1
     }
     $0 = (8 << $4) + 8 | 0;
     if (!$0) {
      break label$1
     }
     $3_1 = 0;
     while (1) {
      $3_1 = $3_1 - -64 | 0;
      if ($3_1 >>> 0 < $0 >>> 0) {
       continue
      }
      break;
     };
     break label$1;
    case 2:
     break label$2;
    default:
     break label$1;
    };
   }
   $14_1 = -20;
   $2_1 = $7($13_1, $13_1 + 124 | 0, $13_1 + 120 | 0, $5_1, $6_1);
   if ($3($2_1)) {
    break label$1
   }
   $3_1 = HEAP32[$13_1 + 120 >> 2];
   if ($3_1 >>> 0 > $4 >>> 0) {
    break label$1
   }
   $97($0, $13_1, HEAP32[$13_1 + 124 >> 2], $7_1, $8, $3_1);
   HEAP32[$1_1 >> 2] = $0;
   $14_1 = $2_1;
  }
  global$0 = $13_1 + 128 | 0;
  return $14_1;
 }
 
 function $121($0, $1_1, $2_1) {
  HEAP32[$0 >> 2] = 0;
  HEAP32[$0 + 4 >> 2] = 0;
  HEAP16[$0 + 8 >> 1] = 0;
  HEAP8[$0 + 11 | 0] = 0;
  HEAP32[$0 + 12 >> 2] = $1_1;
  HEAP8[$0 + 10 | 0] = $2_1;
 }
 
 function $122($0, $1_1, $2_1, $3_1, $4, $5_1, $6_1) {
  var $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, $18_1 = 0, $19_1 = 0, $20_1 = 0, $21_1 = 0, $22 = 0, $23_1 = 0, $24_1 = 0, $25_1 = 0, $26_1 = 0, $27_1 = 0, $28_1 = 0, $29_1 = 0, $30_1 = 0, $31_1 = 0;
  $7_1 = global$0 - 208 | 0;
  global$0 = $7_1;
  $19_1 = $1_1 + $2_1 | 0;
  $2_1 = HEAP32[$0 + 28912 >> 2];
  HEAP32[$7_1 + 188 >> 2] = $2_1;
  $22 = $2_1 + HEAP32[$0 + 28928 >> 2] | 0;
  label$1 : {
   label$2 : {
    if (!$5_1) {
     $3_1 = $1_1;
     break label$2;
    }
    $20_1 = HEAP32[$0 + 28740 >> 2];
    $23_1 = HEAP32[$0 + 28736 >> 2];
    $17_1 = HEAP32[$0 + 28732 >> 2];
    HEAP32[$0 + 28812 >> 2] = 1;
    HEAP32[$7_1 + 92 >> 2] = HEAP32[$0 + 26676 >> 2];
    $24_1 = $0 + 26668 | 0;
    $2_1 = $24_1;
    $13_1 = HEAP32[$2_1 + 4 >> 2];
    HEAP32[$7_1 + 84 >> 2] = HEAP32[$2_1 >> 2];
    HEAP32[$7_1 + 88 >> 2] = $13_1;
    HEAP32[$7_1 + 100 >> 2] = $20_1;
    HEAP32[$7_1 + 96 >> 2] = $17_1;
    HEAP32[$7_1 + 104 >> 2] = $1_1 - $17_1;
    $13_1 = -20;
    label$4 : {
     if ($3($15($7_1 + 40 | 0, $3_1, $4))) {
      $3_1 = $1_1;
      break label$4;
     }
     $25_1 = ($5_1 | 0) < 4 ? $5_1 : 4;
     $130($7_1 + 60 | 0, $7_1 + 40 | 0, HEAP32[$0 >> 2]);
     $130($7_1 + 68 | 0, $7_1 + 40 | 0, HEAP32[$0 + 8 >> 2]);
     $130($7_1 + 76 | 0, $7_1 + 40 | 0, HEAP32[$0 + 4 >> 2]);
     $2_1 = ($5_1 | 0) > 0;
     $0 = $17($7_1 + 40 | 0);
     label$6 : {
      if (($5_1 | 0) < 1) {
       $4 = 0;
       break label$6;
      }
      $4 = 0;
      if ($0 >>> 0 > 2) {
       break label$6
      }
      $10_1 = $7_1 + 96 | 0;
      $14_1 = $7_1 + 100 | 0;
      while (1) {
       $0 = HEAP32[$7_1 + 64 >> 2] + (HEAP32[$7_1 + 60 >> 2] << 3) | 0;
       $13_1 = HEAP32[$0 + 4 >> 2];
       $9_1 = HEAP32[$0 >> 2];
       $0 = HEAP32[$7_1 + 80 >> 2] + (HEAP32[$7_1 + 76 >> 2] << 3) | 0;
       $3_1 = HEAP32[$0 + 4 >> 2];
       $18_1 = HEAP32[$0 >> 2];
       $12_1 = (($3_1 & 65535) << 16 | $18_1 >>> 16) & 255;
       $0 = HEAP32[$7_1 + 72 >> 2] + (HEAP32[$7_1 + 68 >> 2] << 3) | 0;
       $8 = HEAP32[$0 + 4 >> 2];
       $11_1 = $8;
       $2_1 = $13_1;
       $15_1 = HEAP32[$0 >> 2];
       $0 = (($8 & 65535) << 16 | $15_1 >>> 16) & 255;
       label$9 : {
        if ($0 >>> 0 >= 2) {
         label$11 : {
          if (!(!$6_1 | $0 >>> 0 < 25)) {
           $16_1 = $0;
           $8 = 32 - HEAP32[$7_1 + 44 >> 2] | 0;
           $0 = $8 >>> 0 > $0 >>> 0 ? $0 : $8;
           $8 = $16_1 - $0 | 0;
           $0 = $11_1 + ($126($7_1 + 40 | 0, $0) << $8) | 0;
           $17($7_1 + 40 | 0);
           if (!$8) {
            break label$11
           }
           $0 = $126($7_1 + 40 | 0, $8) + $0 | 0;
           break label$11;
          }
          $0 = $126($7_1 + 40 | 0, $0) + $11_1 | 0;
          $17($7_1 + 40 | 0);
         }
         $11_1 = HEAP32[$7_1 + 88 >> 2];
         $8 = HEAP32[$7_1 + 84 >> 2];
         HEAP32[$7_1 + 84 >> 2] = $0;
         HEAP32[$7_1 + 88 >> 2] = $8;
         HEAP32[$7_1 + 92 >> 2] = $11_1;
         break label$9;
        }
        label$13 : {
         if (!$0) {
          if ($2_1) {
           $0 = HEAP32[$7_1 + 84 >> 2];
           break label$9;
          }
          $0 = HEAP32[$7_1 + 88 >> 2];
          break label$13;
         }
         $11_1 = $126($7_1 + 40 | 0, 1) + ($11_1 + !$2_1 | 0) | 0;
         label$16 : {
          if (($11_1 | 0) == 3) {
           $0 = HEAP32[$7_1 + 84 >> 2] + -1 | 0;
           break label$16;
          }
          $0 = HEAP32[(($11_1 << 2) + $7_1 | 0) + 84 >> 2];
         }
         $0 = !$0 + $0 | 0;
         if (($11_1 | 0) != 1) {
          HEAP32[$7_1 + 92 >> 2] = HEAP32[$7_1 + 88 >> 2]
         }
        }
        HEAP32[$7_1 + 88 >> 2] = HEAP32[$7_1 + 84 >> 2];
        HEAP32[$7_1 + 84 >> 2] = $0;
       }
       if ($12_1) {
        $3_1 = $126($7_1 + 40 | 0, $12_1) + $3_1 | 0
       }
       $13_1 = (($13_1 & 65535) << 16 | $9_1 >>> 16) & 255;
       if ($12_1 + $13_1 >>> 0 >= 20) {
        $17($7_1 + 40 | 0)
       }
       if ($13_1) {
        $2_1 = $126($7_1 + 40 | 0, $13_1) + $2_1 | 0
       }
       $17($7_1 + 40 | 0);
       $13_1 = HEAP32[$7_1 + 104 >> 2] + $2_1 | 0;
       HEAP32[$7_1 + 104 >> 2] = $13_1 + $3_1;
       $12_1 = HEAP32[($0 >>> 0 > $13_1 >>> 0 ? $14_1 : $10_1) >> 2];
       HEAP32[$7_1 + 60 >> 2] = $125($7_1 + 40 | 0, $9_1 >>> 24 | 0) + ($9_1 & 65535);
       HEAP32[$7_1 + 76 >> 2] = $125($7_1 + 40 | 0, $18_1 >>> 24 | 0) + ($18_1 & 65535);
       $17($7_1 + 40 | 0);
       $11_1 = $125($7_1 + 40 | 0, $15_1 >>> 24 | 0);
       $9_1 = ($7_1 + 112 | 0) + ($4 << 4) | 0;
       HEAP32[$9_1 + 12 >> 2] = ($12_1 + $13_1 | 0) - $0;
       HEAP32[$9_1 + 8 >> 2] = $0;
       HEAP32[$9_1 + 4 >> 2] = $3_1;
       HEAP32[$9_1 >> 2] = $2_1;
       HEAP32[$7_1 + 68 >> 2] = $11_1 + ($15_1 & 65535);
       $4 = $4 + 1 | 0;
       $2_1 = ($4 | 0) < ($25_1 | 0);
       $0 = $17($7_1 + 40 | 0);
       if (($4 | 0) >= ($25_1 | 0)) {
        break label$6
       }
       if ($0 >>> 0 < 3) {
        continue
       }
       break;
      };
     }
     if ($2_1) {
      $3_1 = $1_1;
      $13_1 = -20;
      break label$4;
     }
     $2_1 = ($4 | 0) < ($5_1 | 0);
     label$23 : {
      label$24 : {
       if (!($17($7_1 + 40 | 0) >>> 0 > 2 | ($4 | 0) >= ($5_1 | 0))) {
        $26_1 = $19_1 + -32 | 0;
        $27_1 = $7_1 + 96 | 0;
        $28_1 = $7_1 + 100 | 0;
        $18_1 = $7_1 + 200 | 0;
        $3_1 = $1_1;
        while (1) {
         $2_1 = HEAP32[$7_1 + 64 >> 2] + (HEAP32[$7_1 + 60 >> 2] << 3) | 0;
         $0 = HEAP32[$2_1 + 4 >> 2];
         $12_1 = HEAP32[$2_1 >> 2];
         $2_1 = HEAP32[$7_1 + 80 >> 2] + (HEAP32[$7_1 + 76 >> 2] << 3) | 0;
         $11_1 = HEAP32[$2_1 + 4 >> 2];
         $10_1 = HEAP32[$2_1 >> 2];
         $15_1 = (($11_1 & 65535) << 16 | $10_1 >>> 16) & 255;
         $2_1 = HEAP32[$7_1 + 72 >> 2] + (HEAP32[$7_1 + 68 >> 2] << 3) | 0;
         $14_1 = HEAP32[$2_1 + 4 >> 2];
         $8 = $14_1;
         $9_1 = $0;
         $14_1 = HEAP32[$2_1 >> 2];
         $2_1 = (($8 & 65535) << 16 | $14_1 >>> 16) & 255;
         label$27 : {
          if ($2_1 >>> 0 >= 2) {
           label$29 : {
            if (!(!$6_1 | $2_1 >>> 0 < 25)) {
             $16_1 = 32 - HEAP32[$7_1 + 44 >> 2] | 0;
             $16_1 = $16_1 >>> 0 > $2_1 >>> 0 ? $2_1 : $16_1;
             $2_1 = $2_1 - $16_1 | 0;
             $8 = $8 + ($126($7_1 + 40 | 0, $16_1) << $2_1) | 0;
             $17($7_1 + 40 | 0);
             if (!$2_1) {
              break label$29
             }
             $8 = $126($7_1 + 40 | 0, $2_1) + $8 | 0;
             break label$29;
            }
            $8 = $126($7_1 + 40 | 0, $2_1) + $8 | 0;
            $17($7_1 + 40 | 0);
           }
           $2_1 = HEAP32[$7_1 + 88 >> 2];
           $16_1 = HEAP32[$7_1 + 84 >> 2];
           HEAP32[$7_1 + 84 >> 2] = $8;
           HEAP32[$7_1 + 88 >> 2] = $16_1;
           HEAP32[$7_1 + 92 >> 2] = $2_1;
           break label$27;
          }
          label$31 : {
           if (!$2_1) {
            if ($9_1) {
             $8 = HEAP32[$7_1 + 84 >> 2];
             break label$27;
            }
            $8 = HEAP32[$7_1 + 88 >> 2];
            break label$31;
           }
           $2_1 = $126($7_1 + 40 | 0, 1) + ($8 + !$9_1 | 0) | 0;
           label$34 : {
            if (($2_1 | 0) == 3) {
             $8 = HEAP32[$7_1 + 84 >> 2] + -1 | 0;
             break label$34;
            }
            $8 = HEAP32[(($2_1 << 2) + $7_1 | 0) + 84 >> 2];
           }
           $8 = !$8 + $8 | 0;
           if (($2_1 | 0) != 1) {
            HEAP32[$7_1 + 92 >> 2] = HEAP32[$7_1 + 88 >> 2]
           }
          }
          HEAP32[$7_1 + 88 >> 2] = HEAP32[$7_1 + 84 >> 2];
          HEAP32[$7_1 + 84 >> 2] = $8;
         }
         if ($15_1) {
          $11_1 = $126($7_1 + 40 | 0, $15_1) + $11_1 | 0
         }
         $0 = (($0 & 65535) << 16 | $12_1 >>> 16) & 255;
         if ($15_1 + $0 >>> 0 >= 20) {
          $17($7_1 + 40 | 0)
         }
         if ($0) {
          $9_1 = $126($7_1 + 40 | 0, $0) + $9_1 | 0
         }
         $17($7_1 + 40 | 0);
         $16_1 = HEAP32[$7_1 + 104 >> 2] + $9_1 | 0;
         HEAP32[$7_1 + 104 >> 2] = $16_1 + $11_1;
         $29_1 = HEAP32[($8 >>> 0 > $16_1 >>> 0 ? $28_1 : $27_1) >> 2];
         HEAP32[$7_1 + 60 >> 2] = $125($7_1 + 40 | 0, $12_1 >>> 24 | 0) + ($12_1 & 65535);
         HEAP32[$7_1 + 76 >> 2] = $125($7_1 + 40 | 0, $10_1 >>> 24 | 0) + ($10_1 & 65535);
         $17($7_1 + 40 | 0);
         HEAP32[$7_1 + 68 >> 2] = $125($7_1 + 40 | 0, $14_1 >>> 24 | 0) + ($14_1 & 65535);
         $15_1 = ($7_1 + 112 | 0) + (($4 & 3) << 4) | 0;
         $0 = $15_1;
         $2_1 = HEAP32[$0 + 12 >> 2];
         $14_1 = HEAP32[$0 + 8 >> 2];
         HEAP32[$18_1 >> 2] = $14_1;
         HEAP32[$18_1 + 4 >> 2] = $2_1;
         $2_1 = HEAP32[$0 + 4 >> 2];
         $0 = HEAP32[$0 >> 2];
         HEAP32[$7_1 + 192 >> 2] = $0;
         HEAP32[$7_1 + 196 >> 2] = $2_1;
         label$40 : {
          label$41 : {
           $2_1 = HEAP32[$7_1 + 188 >> 2];
           $21_1 = $0 + $2_1 | 0;
           label$42 : {
            if ($21_1 >>> 0 > $22 >>> 0) {
             break label$42
            }
            $12_1 = $0 + HEAP32[$7_1 + 196 >> 2] | 0;
            if ($12_1 + $3_1 >>> 0 > $26_1 >>> 0) {
             break label$42
            }
            if ($19_1 - $3_1 >>> 0 >= $12_1 + 32 >>> 0) {
             break label$41
            }
           }
           $0 = HEAP32[$18_1 + 4 >> 2];
           HEAP32[$7_1 + 32 >> 2] = HEAP32[$18_1 >> 2];
           HEAP32[$7_1 + 36 >> 2] = $0;
           $0 = HEAP32[$7_1 + 196 >> 2];
           HEAP32[$7_1 + 24 >> 2] = HEAP32[$7_1 + 192 >> 2];
           HEAP32[$7_1 + 28 >> 2] = $0;
           $12_1 = $131($3_1, $19_1, $7_1 + 24 | 0, $7_1 + 188 | 0, $22, $17_1, $23_1, $20_1);
           break label$40;
          }
          $0 = $0 + $3_1 | 0;
          $132($3_1, $2_1);
          $2_1 = HEAP32[$7_1 + 192 >> 2];
          if ($2_1 >>> 0 >= 17) {
           $30_1 = $2_1 + $3_1 | 0;
           $2_1 = $3_1 + 16 | 0;
           $10_1 = HEAP32[$7_1 + 188 >> 2];
           while (1) {
            $10_1 = $10_1 + 16 | 0;
            $132($2_1, $10_1);
            $2_1 = $2_1 + 16 | 0;
            if ($2_1 >>> 0 < $30_1 >>> 0) {
             continue
            }
            break;
           };
          }
          $2_1 = $0 - $14_1 | 0;
          HEAP32[$7_1 + 188 >> 2] = $21_1;
          $10_1 = HEAP32[$7_1 + 200 >> 2];
          if ($10_1 >>> 0 > $0 - $17_1 >>> 0) {
           if ($10_1 >>> 0 > $0 - $23_1 >>> 0) {
            $12_1 = -20;
            break label$40;
           }
           $14_1 = $2_1 - $17_1 | 0;
           $2_1 = $14_1 + $20_1 | 0;
           $21_1 = HEAP32[$7_1 + 196 >> 2];
           if ($2_1 + $21_1 >>> 0 <= $20_1 >>> 0) {
            $147($0, $2_1, $21_1);
            break label$40;
           }
           $0 = $147($0, $2_1, 0 - $14_1 | 0);
           HEAP32[$7_1 + 196 >> 2] = $14_1 + $21_1;
           $2_1 = $17_1;
           $0 = $0 - $14_1 | 0;
          }
          if ($10_1 >>> 0 >= 16) {
           $10_1 = HEAP32[$7_1 + 196 >> 2] + $0 | 0;
           while (1) {
            $132($0, $2_1);
            $2_1 = $2_1 + 16 | 0;
            $0 = $0 + 16 | 0;
            if ($0 >>> 0 < $10_1 >>> 0) {
             continue
            }
            break;
           };
           break label$40;
          }
          label$50 : {
           if ($10_1 >>> 0 <= 7) {
            HEAP8[$0 | 0] = HEAPU8[$2_1 | 0];
            HEAP8[$0 + 1 | 0] = HEAPU8[$2_1 + 1 | 0];
            HEAP8[$0 + 2 | 0] = HEAPU8[$2_1 + 2 | 0];
            HEAP8[$0 + 3 | 0] = HEAPU8[$2_1 + 3 | 0];
            $14_1 = $2_1;
            $2_1 = $10_1 << 2;
            $10_1 = $14_1 + HEAP32[$2_1 + 4752 >> 2] | 0;
            $133($0 + 4 | 0, $10_1);
            $2_1 = $10_1 - HEAP32[$2_1 + 4784 >> 2] | 0;
            break label$50;
           }
           $134($0, $2_1);
          }
          $10_1 = HEAP32[$7_1 + 196 >> 2];
          if ($10_1 >>> 0 < 9) {
           break label$40
          }
          $10_1 = $0 + $10_1 | 0;
          $0 = $0 + 8 | 0;
          $2_1 = $2_1 + 8 | 0;
          if (($0 - $2_1 | 0) <= 15) {
           while (1) {
            $134($0, $2_1);
            $2_1 = $2_1 + 8 | 0;
            $0 = $0 + 8 | 0;
            if ($0 >>> 0 < $10_1 >>> 0) {
             continue
            }
            break label$40;
           }
          }
          while (1) {
           $132($0, $2_1);
           $2_1 = $2_1 + 16 | 0;
           $0 = $0 + 16 | 0;
           if ($0 >>> 0 < $10_1 >>> 0) {
            continue
           }
           break;
          };
         }
         $0 = $3($12_1);
         label$55 : {
          if ($0) {
           $13_1 = $12_1;
           break label$55;
          }
          HEAP32[$15_1 >> 2] = $9_1;
          HEAP32[$15_1 + 12 >> 2] = ($16_1 + $29_1 | 0) - $8;
          HEAP32[$15_1 + 8 >> 2] = $8;
          HEAP32[$15_1 + 4 >> 2] = $11_1;
          $3_1 = $3_1 + $12_1 | 0;
         }
         if ($0) {
          break label$23
         }
         $4 = $4 + 1 | 0;
         $2_1 = ($4 | 0) < ($5_1 | 0);
         $0 = $17($7_1 + 40 | 0);
         if (($4 | 0) >= ($5_1 | 0)) {
          break label$24
         }
         if ($0 >>> 0 < 3) {
          continue
         }
         break;
        };
        break label$24;
       }
       $3_1 = $1_1;
      }
      if ($2_1) {
       $13_1 = -20;
       break label$4;
      }
      $12_1 = $4 - $25_1 | 0;
      if (($12_1 | 0) < ($5_1 | 0)) {
       $18_1 = $19_1 + -32 | 0;
       $6_1 = $7_1 + 200 | 0;
       while (1) {
        $0 = ($7_1 + 112 | 0) + (($12_1 & 3) << 4) | 0;
        $9_1 = HEAP32[$0 + 8 >> 2];
        $2_1 = HEAP32[$0 + 12 >> 2];
        HEAP32[$6_1 >> 2] = $9_1;
        HEAP32[$6_1 + 4 >> 2] = $2_1;
        $2_1 = HEAP32[$0 + 4 >> 2];
        $0 = HEAP32[$0 >> 2];
        HEAP32[$7_1 + 192 >> 2] = $0;
        HEAP32[$7_1 + 196 >> 2] = $2_1;
        label$60 : {
         label$61 : {
          $2_1 = HEAP32[$7_1 + 188 >> 2];
          $11_1 = $0 + $2_1 | 0;
          label$62 : {
           if ($11_1 >>> 0 > $22 >>> 0) {
            break label$62
           }
           $4 = $0 + HEAP32[$7_1 + 196 >> 2] | 0;
           if ($3_1 + $4 >>> 0 > $18_1 >>> 0) {
            break label$62
           }
           if ($19_1 - $3_1 >>> 0 >= $4 + 32 >>> 0) {
            break label$61
           }
          }
          $0 = HEAP32[$6_1 + 4 >> 2];
          HEAP32[$7_1 + 16 >> 2] = HEAP32[$6_1 >> 2];
          HEAP32[$7_1 + 20 >> 2] = $0;
          $0 = HEAP32[$7_1 + 196 >> 2];
          HEAP32[$7_1 + 8 >> 2] = HEAP32[$7_1 + 192 >> 2];
          HEAP32[$7_1 + 12 >> 2] = $0;
          $4 = $131($3_1, $19_1, $7_1 + 8 | 0, $7_1 + 188 | 0, $22, $17_1, $23_1, $20_1);
          break label$60;
         }
         $0 = $0 + $3_1 | 0;
         $132($3_1, $2_1);
         $2_1 = HEAP32[$7_1 + 192 >> 2];
         if ($2_1 >>> 0 >= 17) {
          $15_1 = $2_1 + $3_1 | 0;
          $2_1 = $3_1 + 16 | 0;
          $8 = HEAP32[$7_1 + 188 >> 2];
          while (1) {
           $8 = $8 + 16 | 0;
           $132($2_1, $8);
           $2_1 = $2_1 + 16 | 0;
           if ($2_1 >>> 0 < $15_1 >>> 0) {
            continue
           }
           break;
          };
         }
         $2_1 = $0 - $9_1 | 0;
         HEAP32[$7_1 + 188 >> 2] = $11_1;
         $9_1 = HEAP32[$7_1 + 200 >> 2];
         if ($9_1 >>> 0 > $0 - $17_1 >>> 0) {
          if ($9_1 >>> 0 > $0 - $23_1 >>> 0) {
           $4 = -20;
           break label$60;
          }
          $11_1 = $2_1 - $17_1 | 0;
          $2_1 = $11_1 + $20_1 | 0;
          $8 = HEAP32[$7_1 + 196 >> 2];
          if ($2_1 + $8 >>> 0 <= $20_1 >>> 0) {
           $147($0, $2_1, $8);
           break label$60;
          }
          $0 = $147($0, $2_1, 0 - $11_1 | 0);
          HEAP32[$7_1 + 196 >> 2] = $8 + $11_1;
          $2_1 = $17_1;
          $0 = $0 - $11_1 | 0;
         }
         if ($9_1 >>> 0 >= 16) {
          $9_1 = HEAP32[$7_1 + 196 >> 2] + $0 | 0;
          while (1) {
           $132($0, $2_1);
           $2_1 = $2_1 + 16 | 0;
           $0 = $0 + 16 | 0;
           if ($0 >>> 0 < $9_1 >>> 0) {
            continue
           }
           break;
          };
          break label$60;
         }
         label$70 : {
          if ($9_1 >>> 0 <= 7) {
           HEAP8[$0 | 0] = HEAPU8[$2_1 | 0];
           HEAP8[$0 + 1 | 0] = HEAPU8[$2_1 + 1 | 0];
           HEAP8[$0 + 2 | 0] = HEAPU8[$2_1 + 2 | 0];
           HEAP8[$0 + 3 | 0] = HEAPU8[$2_1 + 3 | 0];
           $8 = $2_1;
           $2_1 = $9_1 << 2;
           $9_1 = $8 + HEAP32[$2_1 + 4752 >> 2] | 0;
           $133($0 + 4 | 0, $9_1);
           $2_1 = $9_1 - HEAP32[$2_1 + 4784 >> 2] | 0;
           break label$70;
          }
          $134($0, $2_1);
         }
         $9_1 = HEAP32[$7_1 + 196 >> 2];
         if ($9_1 >>> 0 < 9) {
          break label$60
         }
         $9_1 = $0 + $9_1 | 0;
         $0 = $0 + 8 | 0;
         $2_1 = $2_1 + 8 | 0;
         if (($0 - $2_1 | 0) <= 15) {
          while (1) {
           $134($0, $2_1);
           $2_1 = $2_1 + 8 | 0;
           $0 = $0 + 8 | 0;
           if ($0 >>> 0 < $9_1 >>> 0) {
            continue
           }
           break label$60;
          }
         }
         while (1) {
          $132($0, $2_1);
          $2_1 = $2_1 + 16 | 0;
          $0 = $0 + 16 | 0;
          if ($0 >>> 0 < $9_1 >>> 0) {
           continue
          }
          break;
         };
        }
        $0 = $3($4);
        $13_1 = $0 ? $4 : $13_1;
        $3_1 = $0 ? $3_1 : $3_1 + $4 | 0;
        if ($0) {
         break label$23
        }
        $12_1 = $12_1 + 1 | 0;
        if (($12_1 | 0) != ($5_1 | 0)) {
         continue
        }
        break;
       };
      }
      $0 = $7_1 + 84 | 0;
      $2_1 = HEAP32[$0 + 4 >> 2];
      HEAP32[$24_1 >> 2] = HEAP32[$0 >> 2];
      HEAP32[$24_1 + 4 >> 2] = $2_1;
      HEAP32[$24_1 + 8 >> 2] = HEAP32[$0 + 8 >> 2];
      $31_1 = 1;
     }
    }
    if (!$31_1) {
     break label$1
    }
   }
   $2_1 = HEAP32[$7_1 + 188 >> 2];
   $0 = $22 - $2_1 | 0;
   $4 = $0 >>> 0 > $19_1 - $3_1 >>> 0;
   label$75 : {
    if ($4) {
     $13_1 = -70;
     break label$75;
    }
    if (!$3_1) {
     $3_1 = 0;
     break label$75;
    }
    $3_1 = $145($3_1, $2_1, $0) + $0 | 0;
   }
   if ($4) {
    break label$1
   }
   $13_1 = $3_1 - $1_1 | 0;
  }
  global$0 = $7_1 + 208 | 0;
  return $13_1;
 }
 
 function $123($0, $1_1, $2_1, $3_1, $4, $5_1, $6_1) {
  var $7_1 = 0, $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0, $15_1 = 0, $16_1 = 0, $17_1 = 0, $18_1 = 0, $19_1 = 0, $20_1 = 0, $21_1 = 0, $22 = 0, $23_1 = 0;
  $7_1 = global$0 - 112 | 0;
  global$0 = $7_1;
  $13_1 = $1_1 + $2_1 | 0;
  $2_1 = HEAP32[$0 + 28912 >> 2];
  HEAP32[$7_1 + 92 >> 2] = $2_1;
  $16_1 = $2_1 + HEAP32[$0 + 28928 >> 2] | 0;
  label$1 : {
   label$2 : {
    if (!$5_1) {
     $4 = $1_1;
     break label$2;
    }
    $17_1 = HEAP32[$0 + 28740 >> 2];
    $22 = HEAP32[$0 + 28736 >> 2];
    $14_1 = HEAP32[$0 + 28732 >> 2];
    HEAP32[$0 + 28812 >> 2] = 1;
    HEAP32[$7_1 + 76 >> 2] = HEAP32[$0 + 26676 >> 2];
    $15_1 = $0 + 26668 | 0;
    $12_1 = $15_1;
    $2_1 = HEAP32[$12_1 + 4 >> 2];
    HEAP32[$7_1 + 68 >> 2] = HEAP32[$12_1 >> 2];
    HEAP32[$7_1 + 72 >> 2] = $2_1;
    label$4 : {
     if ($3($15($7_1 + 24 | 0, $3_1, $4))) {
      $0 = -20;
      $2_1 = 0;
      $4 = $1_1;
      break label$4;
     }
     $12_1 = $7_1 + 68 | 0;
     $130($7_1 + 44 | 0, $7_1 + 24 | 0, HEAP32[$0 >> 2]);
     $130($7_1 + 52 | 0, $7_1 + 24 | 0, HEAP32[$0 + 8 >> 2]);
     $130($7_1 + 60 | 0, $7_1 + 24 | 0, HEAP32[$0 + 4 >> 2]);
     $23_1 = $13_1 + -32 | 0;
     $4 = $1_1;
     while (1) {
      $2_1 = HEAP32[$7_1 + 48 >> 2] + (HEAP32[$7_1 + 44 >> 2] << 3) | 0;
      $0 = HEAP32[$2_1 + 4 >> 2];
      $18_1 = HEAP32[$2_1 >> 2];
      $19_1 = (($0 & 65535) << 16 | $18_1 >>> 16) & 255;
      $3_1 = HEAP32[$7_1 + 64 >> 2] + (HEAP32[$7_1 + 60 >> 2] << 3) | 0;
      $2_1 = HEAP32[$3_1 + 4 >> 2];
      $10_1 = HEAP32[$3_1 >> 2];
      $20_1 = (($2_1 & 65535) << 16 | $10_1 >>> 16) & 255;
      $8 = HEAP32[$7_1 + 56 >> 2] + (HEAP32[$7_1 + 52 >> 2] << 3) | 0;
      $3_1 = HEAP32[$8 + 4 >> 2];
      $9_1 = $3_1;
      $11_1 = HEAP32[$8 >> 2];
      $8 = (($3_1 & 65535) << 16 | $11_1 >>> 16) & 255;
      label$7 : {
       if ($8 >>> 0 >= 2) {
        label$9 : {
         if (!(!$6_1 | $8 >>> 0 < 25)) {
          $3_1 = 32 - HEAP32[$7_1 + 28 >> 2] | 0;
          $3_1 = $3_1 >>> 0 > $8 >>> 0 ? $8 : $3_1;
          $8 = $8 - $3_1 | 0;
          $3_1 = $9_1 + ($126($7_1 + 24 | 0, $3_1) << $8) | 0;
          $17($7_1 + 24 | 0);
          if (!$8) {
           break label$9
          }
          $3_1 = $126($7_1 + 24 | 0, $8) + $3_1 | 0;
          break label$9;
         }
         $3_1 = $126($7_1 + 24 | 0, $8) + $9_1 | 0;
         $17($7_1 + 24 | 0);
        }
        $9_1 = HEAP32[$7_1 + 72 >> 2];
        $8 = HEAP32[$7_1 + 68 >> 2];
        HEAP32[$7_1 + 68 >> 2] = $3_1;
        HEAP32[$7_1 + 72 >> 2] = $8;
        HEAP32[$7_1 + 76 >> 2] = $9_1;
        break label$7;
       }
       label$11 : {
        if (!$8) {
         if ($0) {
          $3_1 = HEAP32[$7_1 + 68 >> 2];
          break label$7;
         }
         $3_1 = HEAP32[$7_1 + 72 >> 2];
         break label$11;
        }
        $8 = $126($7_1 + 24 | 0, 1) + ($9_1 + !$0 | 0) | 0;
        label$14 : {
         if (($8 | 0) == 3) {
          $3_1 = HEAP32[$7_1 + 68 >> 2] + -1 | 0;
          break label$14;
         }
         $3_1 = HEAP32[(($8 << 2) + $7_1 | 0) + 68 >> 2];
        }
        $3_1 = !$3_1 + $3_1 | 0;
        if (($8 | 0) != 1) {
         HEAP32[$7_1 + 76 >> 2] = HEAP32[$7_1 + 72 >> 2]
        }
       }
       HEAP32[$7_1 + 72 >> 2] = HEAP32[$7_1 + 68 >> 2];
       HEAP32[$7_1 + 68 >> 2] = $3_1;
      }
      if ($20_1) {
       $2_1 = $126($7_1 + 24 | 0, $20_1) + $2_1 | 0
      }
      if ($19_1 + $20_1 >>> 0 >= 20) {
       $17($7_1 + 24 | 0)
      }
      if ($19_1) {
       $0 = $126($7_1 + 24 | 0, $19_1) + $0 | 0
      }
      $17($7_1 + 24 | 0);
      HEAP32[$7_1 + 44 >> 2] = $125($7_1 + 24 | 0, $18_1 >>> 24 | 0) + ($18_1 & 65535);
      HEAP32[$7_1 + 60 >> 2] = $125($7_1 + 24 | 0, $10_1 >>> 24 | 0) + ($10_1 & 65535);
      $17($7_1 + 24 | 0);
      HEAP32[$7_1 + 52 >> 2] = $125($7_1 + 24 | 0, $11_1 >>> 24 | 0) + ($11_1 & 65535);
      HEAP32[$7_1 + 96 >> 2] = $0;
      $8 = HEAP32[$7_1 + 92 >> 2];
      HEAP32[$7_1 + 104 >> 2] = $3_1;
      HEAP32[$7_1 + 100 >> 2] = $2_1;
      label$20 : {
       label$21 : {
        $10_1 = $0 + $2_1 | 0;
        label$22 : {
         if ($10_1 + $4 >>> 0 > $23_1 >>> 0) {
          break label$22
         }
         $9_1 = $0 + $8 | 0;
         if ($9_1 >>> 0 > $16_1 >>> 0) {
          break label$22
         }
         if ($13_1 - $4 >>> 0 >= $10_1 + 32 >>> 0) {
          break label$21
         }
        }
        $0 = HEAP32[$7_1 + 108 >> 2];
        HEAP32[$7_1 + 16 >> 2] = HEAP32[$7_1 + 104 >> 2];
        HEAP32[$7_1 + 20 >> 2] = $0;
        $0 = HEAP32[$7_1 + 100 >> 2];
        HEAP32[$7_1 + 8 >> 2] = HEAP32[$7_1 + 96 >> 2];
        HEAP32[$7_1 + 12 >> 2] = $0;
        $10_1 = $131($4, $13_1, $7_1 + 8 | 0, $7_1 + 92 | 0, $16_1, $14_1, $22, $17_1);
        break label$20;
       }
       $0 = $0 + $4 | 0;
       $132($4, $8);
       $2_1 = HEAP32[$7_1 + 96 >> 2];
       if ($2_1 >>> 0 >= 17) {
        $8 = $2_1 + $4 | 0;
        $2_1 = $4 + 16 | 0;
        $11_1 = HEAP32[$7_1 + 92 >> 2];
        while (1) {
         $11_1 = $11_1 + 16 | 0;
         $132($2_1, $11_1);
         $2_1 = $2_1 + 16 | 0;
         if ($2_1 >>> 0 < $8 >>> 0) {
          continue
         }
         break;
        };
       }
       $2_1 = $0 - $3_1 | 0;
       HEAP32[$7_1 + 92 >> 2] = $9_1;
       $9_1 = HEAP32[$7_1 + 104 >> 2];
       if ($9_1 >>> 0 > $0 - $14_1 >>> 0) {
        if ($9_1 >>> 0 > $0 - $22 >>> 0) {
         $10_1 = -20;
         break label$20;
        }
        $8 = $2_1 - $14_1 | 0;
        $3_1 = $8 + $17_1 | 0;
        $2_1 = HEAP32[$7_1 + 100 >> 2];
        if ($3_1 + $2_1 >>> 0 <= $17_1 >>> 0) {
         $147($0, $3_1, $2_1);
         break label$20;
        }
        $0 = $147($0, $3_1, 0 - $8 | 0);
        HEAP32[$7_1 + 100 >> 2] = $2_1 + $8;
        $2_1 = $14_1;
        $0 = $0 - $8 | 0;
       }
       if ($9_1 >>> 0 >= 16) {
        $3_1 = HEAP32[$7_1 + 100 >> 2] + $0 | 0;
        while (1) {
         $132($0, $2_1);
         $2_1 = $2_1 + 16 | 0;
         $0 = $0 + 16 | 0;
         if ($0 >>> 0 < $3_1 >>> 0) {
          continue
         }
         break;
        };
        break label$20;
       }
       label$30 : {
        if ($9_1 >>> 0 <= 7) {
         HEAP8[$0 | 0] = HEAPU8[$2_1 | 0];
         HEAP8[$0 + 1 | 0] = HEAPU8[$2_1 + 1 | 0];
         HEAP8[$0 + 2 | 0] = HEAPU8[$2_1 + 2 | 0];
         HEAP8[$0 + 3 | 0] = HEAPU8[$2_1 + 3 | 0];
         $3_1 = $9_1 << 2;
         $2_1 = $2_1 + HEAP32[$3_1 + 4752 >> 2] | 0;
         $133($0 + 4 | 0, $2_1);
         $2_1 = $2_1 - HEAP32[$3_1 + 4784 >> 2] | 0;
         break label$30;
        }
        $134($0, $2_1);
       }
       $3_1 = HEAP32[$7_1 + 100 >> 2];
       if ($3_1 >>> 0 < 9) {
        break label$20
       }
       $3_1 = $0 + $3_1 | 0;
       $0 = $0 + 8 | 0;
       $2_1 = $2_1 + 8 | 0;
       if (($0 - $2_1 | 0) <= 15) {
        while (1) {
         $134($0, $2_1);
         $2_1 = $2_1 + 8 | 0;
         $0 = $0 + 8 | 0;
         if ($0 >>> 0 < $3_1 >>> 0) {
          continue
         }
         break label$20;
        }
       }
       while (1) {
        $132($0, $2_1);
        $2_1 = $2_1 + 16 | 0;
        $0 = $0 + 16 | 0;
        if ($0 >>> 0 < $3_1 >>> 0) {
         continue
        }
        break;
       };
      }
      $17($7_1 + 24 | 0);
      $0 = $3($10_1);
      $21_1 = $0 ? $10_1 : $21_1;
      $4 = $0 ? $4 : $4 + $10_1 | 0;
      $5_1 = $5_1 + -1 | 0;
      if ($5_1) {
       continue
      }
      break;
     };
     $0 = -20;
     $2_1 = 0;
     $3_1 = $3($21_1);
     if ($3_1) {
      $0 = $3_1 ? $21_1 : -20;
      break label$4;
     }
     if ($17($7_1 + 24 | 0) >>> 0 < 2) {
      break label$4
     }
     $2_1 = HEAP32[$12_1 + 4 >> 2];
     HEAP32[$15_1 >> 2] = HEAP32[$12_1 >> 2];
     HEAP32[$15_1 + 4 >> 2] = $2_1;
     HEAP32[$15_1 + 8 >> 2] = HEAP32[$12_1 + 8 >> 2];
     $2_1 = 1;
    }
    if (!$2_1) {
     break label$1
    }
   }
   $3_1 = HEAP32[$7_1 + 92 >> 2];
   $5_1 = $16_1 - $3_1 | 0;
   $2_1 = $5_1 >>> 0 > $13_1 - $4 >>> 0;
   label$36 : {
    if ($2_1) {
     $0 = -70;
     break label$36;
    }
    if (!$4) {
     $4 = 0;
     break label$36;
    }
    $4 = $145($4, $3_1, $5_1) + $5_1 | 0;
   }
   if ($2_1) {
    break label$1
   }
   $0 = $4 - $1_1 | 0;
  }
  global$0 = $7_1 + 112 | 0;
  return $0;
 }
 
 function $125($0, $1_1) {
  var $2_1 = 0;
  $2_1 = HEAP32[($1_1 << 2) + 4592 >> 2] & HEAP32[$0 >> 2] >>> (32 - (HEAP32[$0 + 4 >> 2] + $1_1 | 0) & 31);
  $29($0, $1_1);
  return $2_1;
 }
 
 function $126($0, $1_1) {
  var $2_1 = 0;
  $2_1 = $28($0, $1_1);
  $29($0, $1_1);
  return $2_1;
 }
 
 function $130($0, $1_1, $2_1) {
  HEAP32[$0 >> 2] = $125($1_1, HEAP32[$2_1 + 4 >> 2]);
  $17($1_1);
  HEAP32[$0 + 4 >> 2] = $2_1 + 8;
 }
 
 function $131($0, $1_1, $2_1, $3_1, $4, $5_1, $6_1, $7_1) {
  var $8 = 0, $9_1 = 0, $10_1 = 0, $11_1 = 0, $12_1 = 0, $13_1 = 0, $14_1 = 0;
  $10_1 = -70;
  $8 = HEAP32[$2_1 >> 2];
  $9_1 = HEAP32[$2_1 + 4 >> 2];
  $13_1 = $8 + $9_1 | 0;
  label$1 : {
   if ($13_1 >>> 0 > $1_1 - $0 >>> 0) {
    break label$1
   }
   $10_1 = -20;
   $11_1 = HEAP32[$3_1 >> 2];
   if ($8 >>> 0 > $4 - $11_1 >>> 0) {
    break label$1
   }
   $4 = $0 + $8 | 0;
   $12_1 = HEAP32[$2_1 + 8 >> 2];
   $14_1 = $4 - $12_1 | 0;
   $1_1 = $1_1 + -32 | 0;
   $135($0, $1_1, $11_1, $8, 0);
   HEAP32[$3_1 >> 2] = $8 + $11_1;
   label$2 : {
    label$3 : {
     if ($12_1 >>> 0 <= $4 - $5_1 >>> 0) {
      $5_1 = $14_1;
      break label$3;
     }
     if ($12_1 >>> 0 > $4 - $6_1 >>> 0) {
      break label$1
     }
     $3_1 = $14_1 - $5_1 | 0;
     $0 = $3_1 + $7_1 | 0;
     if ($0 + $9_1 >>> 0 <= $7_1 >>> 0) {
      $147($4, $0, $9_1);
      break label$2;
     }
     $0 = $147($4, $0, 0 - $3_1 | 0);
     HEAP32[$2_1 + 4 >> 2] = $3_1 + $9_1;
     $4 = $0 - $3_1 | 0;
    }
    $135($4, $1_1, $5_1, HEAP32[$2_1 + 4 >> 2], 1);
   }
   $10_1 = $13_1;
  }
  return $10_1;
 }
 
 function $132($0, $1_1) {
  var $2_1 = 0, $3_1 = 0;
  $2_1 = HEAPU8[$1_1 + 4 | 0] | HEAPU8[$1_1 + 5 | 0] << 8 | (HEAPU8[$1_1 + 6 | 0] << 16 | HEAPU8[$1_1 + 7 | 0] << 24);
  $3_1 = HEAPU8[$1_1 | 0] | HEAPU8[$1_1 + 1 | 0] << 8 | (HEAPU8[$1_1 + 2 | 0] << 16 | HEAPU8[$1_1 + 3 | 0] << 24);
  HEAP8[$0 | 0] = $3_1;
  HEAP8[$0 + 1 | 0] = $3_1 >>> 8;
  HEAP8[$0 + 2 | 0] = $3_1 >>> 16;
  HEAP8[$0 + 3 | 0] = $3_1 >>> 24;
  HEAP8[$0 + 4 | 0] = $2_1;
  HEAP8[$0 + 5 | 0] = $2_1 >>> 8;
  HEAP8[$0 + 6 | 0] = $2_1 >>> 16;
  HEAP8[$0 + 7 | 0] = $2_1 >>> 24;
  $2_1 = HEAPU8[$1_1 + 12 | 0] | HEAPU8[$1_1 + 13 | 0] << 8 | (HEAPU8[$1_1 + 14 | 0] << 16 | HEAPU8[$1_1 + 15 | 0] << 24);
  $1_1 = HEAPU8[$1_1 + 8 | 0] | HEAPU8[$1_1 + 9 | 0] << 8 | (HEAPU8[$1_1 + 10 | 0] << 16 | HEAPU8[$1_1 + 11 | 0] << 24);
  HEAP8[$0 + 8 | 0] = $1_1;
  HEAP8[$0 + 9 | 0] = $1_1 >>> 8;
  HEAP8[$0 + 10 | 0] = $1_1 >>> 16;
  HEAP8[$0 + 11 | 0] = $1_1 >>> 24;
  HEAP8[$0 + 12 | 0] = $2_1;
  HEAP8[$0 + 13 | 0] = $2_1 >>> 8;
  HEAP8[$0 + 14 | 0] = $2_1 >>> 16;
  HEAP8[$0 + 15 | 0] = $2_1 >>> 24;
 }
 
 function $133($0, $1_1) {
  $1_1 = HEAPU8[$1_1 | 0] | HEAPU8[$1_1 + 1 | 0] << 8 | (HEAPU8[$1_1 + 2 | 0] << 16 | HEAPU8[$1_1 + 3 | 0] << 24);
  HEAP8[$0 | 0] = $1_1;
  HEAP8[$0 + 1 | 0] = $1_1 >>> 8;
  HEAP8[$0 + 2 | 0] = $1_1 >>> 16;
  HEAP8[$0 + 3 | 0] = $1_1 >>> 24;
 }
 
 function $134($0, $1_1) {
  var $2_1 = 0;
  $2_1 = HEAPU8[$1_1 | 0] | HEAPU8[$1_1 + 1 | 0] << 8 | (HEAPU8[$1_1 + 2 | 0] << 16 | HEAPU8[$1_1 + 3 | 0] << 24);
  $1_1 = HEAPU8[$1_1 + 4 | 0] | HEAPU8[$1_1 + 5 | 0] << 8 | (HEAPU8[$1_1 + 6 | 0] << 16 | HEAPU8[$1_1 + 7 | 0] << 24);
  HEAP8[$0 | 0] = $2_1;
  HEAP8[$0 + 1 | 0] = $2_1 >>> 8;
  HEAP8[$0 + 2 | 0] = $2_1 >>> 16;
  HEAP8[$0 + 3 | 0] = $2_1 >>> 24;
  HEAP8[$0 + 4 | 0] = $1_1;
  HEAP8[$0 + 5 | 0] = $1_1 >>> 8;
  HEAP8[$0 + 6 | 0] = $1_1 >>> 16;
  HEAP8[$0 + 7 | 0] = $1_1 >>> 24;
 }
 
 function $135($0, $1_1, $2_1, $3_1, $4) {
  var $5_1 = 0, $6_1 = 0, $7_1 = 0;
  $6_1 = $0 + $3_1 | 0;
  label$1 : {
   if (($3_1 | 0) <= 7) {
    if (($3_1 | 0) < 1) {
     break label$1
    }
    while (1) {
     HEAP8[$0 | 0] = HEAPU8[$2_1 | 0];
     $2_1 = $2_1 + 1 | 0;
     $0 = $0 + 1 | 0;
     if ($0 >>> 0 < $6_1 >>> 0) {
      continue
     }
     break;
    };
    break label$1;
   }
   if (($4 | 0) == 1) {
    $5_1 = $0 - $2_1 | 0;
    label$5 : {
     if ($5_1 >>> 0 <= 7) {
      HEAP8[$0 | 0] = HEAPU8[$2_1 | 0];
      HEAP8[$0 + 1 | 0] = HEAPU8[$2_1 + 1 | 0];
      HEAP8[$0 + 2 | 0] = HEAPU8[$2_1 + 2 | 0];
      HEAP8[$0 + 3 | 0] = HEAPU8[$2_1 + 3 | 0];
      $7_1 = $2_1;
      $2_1 = $5_1 << 2;
      $5_1 = $7_1 + HEAP32[$2_1 + 4752 >> 2] | 0;
      $133($0 + 4 | 0, $5_1);
      $2_1 = $5_1 - HEAP32[$2_1 + 4784 >> 2] | 0;
      break label$5;
     }
     $134($0, $2_1);
    }
    $2_1 = $2_1 + 8 | 0;
    $0 = $0 + 8 | 0;
   }
   if ($6_1 >>> 0 <= $1_1 >>> 0) {
    $1_1 = $0 + $3_1 | 0;
    if (!(($4 | 0) != 1 | ($0 - $2_1 | 0) > 15)) {
     while (1) {
      $134($0, $2_1);
      $2_1 = $2_1 + 8 | 0;
      $0 = $0 + 8 | 0;
      if ($0 >>> 0 < $1_1 >>> 0) {
       continue
      }
      break;
     };
     break label$1;
    }
    while (1) {
     $132($0, $2_1);
     $2_1 = $2_1 + 16 | 0;
     $0 = $0 + 16 | 0;
     if ($0 >>> 0 < $1_1 >>> 0) {
      continue
     }
     break;
    };
    break label$1;
   }
   label$11 : {
    if ($0 >>> 0 > $1_1 >>> 0) {
     $1_1 = $0;
     break label$11;
    }
    label$13 : {
     if (!(($4 | 0) != 1 | ($0 - $2_1 | 0) > 15)) {
      $3_1 = $0;
      $4 = $2_1;
      while (1) {
       $134($3_1, $4);
       $4 = $4 + 8 | 0;
       $3_1 = $3_1 + 8 | 0;
       if ($3_1 >>> 0 < $1_1 >>> 0) {
        continue
       }
       break;
      };
      break label$13;
     }
     $3_1 = $0;
     $4 = $2_1;
     while (1) {
      $132($3_1, $4);
      $4 = $4 + 16 | 0;
      $3_1 = $3_1 + 16 | 0;
      if ($3_1 >>> 0 < $1_1 >>> 0) {
       continue
      }
      break;
     };
    }
    $2_1 = ($1_1 - $0 | 0) + $2_1 | 0;
   }
   if ($6_1 >>> 0 <= $1_1 >>> 0) {
    break label$1
   }
   while (1) {
    HEAP8[$1_1 | 0] = HEAPU8[$2_1 | 0];
    $2_1 = $2_1 + 1 | 0;
    $1_1 = $1_1 + 1 | 0;
    if (($6_1 | 0) != ($1_1 | 0)) {
     continue
    }
    break;
   };
  }
 }
 
 function $136() {
  var $0 = 0, $1_1 = 0, $2_1 = 0;
  while (1) {
   $1_1 = $0 << 4;
   $2_1 = $1_1 + 4848 | 0;
   HEAP32[$1_1 + 4852 >> 2] = $2_1;
   HEAP32[$1_1 + 4856 >> 2] = $2_1;
   $0 = $0 + 1 | 0;
   if (($0 | 0) != 64) {
    continue
   }
   break;
  };
  $137(48);
 }
 
 function $137($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0;
  $3_1 = $144($0);
  if (($3_1 | 0) >= 1) {
   $2_1 = 16;
   $4 = $0 + $3_1 | 0;
   $1_1 = $4 + -16 | 0;
   HEAP32[$1_1 + 12 >> 2] = 16;
   HEAP32[$1_1 >> 2] = 16;
   $0 = HEAP32[1468];
   label$2 : {
    label$3 : {
     if (!(!$0 | HEAP32[$0 + 8 >> 2] != ($3_1 | 0))) {
      $2_1 = HEAP32[$3_1 + -4 >> 2];
      $6_1 = $3_1 - ($2_1 >> 31 ^ $2_1) | 0;
      $5_1 = HEAP32[$6_1 + -4 >> 2];
      HEAP32[$0 + 8 >> 2] = $4;
      $2_1 = -16;
      $0 = $6_1 - ($5_1 >> 31 ^ $5_1) | 0;
      if (HEAP32[($0 + HEAP32[$0 >> 2] | 0) + -4 >> 2] > -1) {
       break label$3
      }
      $2_1 = HEAP32[$0 + 4 >> 2];
      HEAP32[$2_1 + 8 >> 2] = HEAP32[$0 + 8 >> 2];
      HEAP32[HEAP32[$0 + 8 >> 2] + 4 >> 2] = $2_1;
      $1_1 = $1_1 - $0 | 0;
      HEAP32[$0 >> 2] = $1_1;
      break label$2;
     }
     HEAP32[$3_1 + 12 >> 2] = 16;
     HEAP32[$3_1 >> 2] = 16;
     HEAP32[$3_1 + 8 >> 2] = $4;
     HEAP32[$3_1 + 4 >> 2] = $0;
     HEAP32[1468] = $3_1;
    }
    $0 = $2_1 + $3_1 | 0;
    $1_1 = $1_1 - $0 | 0;
    HEAP32[$0 >> 2] = $1_1;
   }
   HEAP32[(($1_1 & -4) + $0 | 0) + -4 >> 2] = $1_1 ^ -1;
   $6_1 = $0;
   $4 = HEAP32[$0 >> 2] + -8 | 0;
   label$5 : {
    if ($4 >>> 0 <= 127) {
     $1_1 = ($4 >>> 3 | 0) + -1 | 0;
     break label$5;
    }
    $5_1 = Math_clz32($4);
    $1_1 = (($4 >>> 29 - $5_1 ^ 4) - ($5_1 << 2) | 0) + 110 | 0;
    if ($4 >>> 0 <= 4095) {
     break label$5
    }
    $1_1 = (($4 >>> 30 - $5_1 ^ 2) - ($5_1 << 1) | 0) + 71 | 0;
    $1_1 = $1_1 >>> 0 < 63 ? $1_1 : 63;
   }
   $2_1 = $1_1 << 4;
   HEAP32[$6_1 + 4 >> 2] = $2_1 + 4848;
   $2_1 = $2_1 + 4856 | 0;
   HEAP32[$0 + 8 >> 2] = HEAP32[$2_1 >> 2];
   HEAP32[$2_1 >> 2] = $0;
   HEAP32[HEAP32[$0 + 8 >> 2] + 4 >> 2] = $0;
   $2_1 = HEAP32[1471];
   $0 = $1_1 & 31;
   if (32 <= ($1_1 & 63) >>> 0) {
    $1_1 = 1 << $0;
    $0 = 0;
   } else {
    $1_1 = (1 << $0) - 1 & 1 >>> 32 - $0;
    $0 = 1 << $0;
   }
   HEAP32[1470] = $0 | HEAP32[1470];
   HEAP32[1471] = $1_1 | $2_1;
  }
  return ($3_1 | 0) > 0;
 }
 
 function $138($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0;
  $7_1 = 8;
  label$1 : {
   label$2 : {
    while (1) {
     if ($7_1 + -1 & $7_1) {
      break label$2
     }
     $7_1 = $7_1 >>> 0 > 8 ? $7_1 : 8;
     $2_1 = HEAP32[1471];
     $6_1 = $2_1;
     $5_1 = HEAP32[1470];
     $8 = $5_1;
     $0 = $0 >>> 0 > 8 ? $0 + 3 & -4 : 8;
     label$4 : {
      if ($0 >>> 0 <= 127) {
       $4 = ($0 >>> 3 | 0) + -1 | 0;
       break label$4;
      }
      $1_1 = Math_clz32($0);
      $4 = (($0 >>> 29 - $1_1 ^ 4) - ($1_1 << 2) | 0) + 110 | 0;
      if ($0 >>> 0 <= 4095) {
       break label$4
      }
      $1_1 = (($0 >>> 30 - $1_1 ^ 2) - ($1_1 << 1) | 0) + 71 | 0;
      $4 = $1_1 >>> 0 < 63 ? $1_1 : 63;
     }
     $3_1 = $4;
     $1_1 = $3_1 & 31;
     if (32 <= ($3_1 & 63) >>> 0) {
      $3_1 = 0;
      $2_1 = $2_1 >>> $1_1 | 0;
     } else {
      $3_1 = $2_1 >>> $1_1 | 0;
      $2_1 = ((1 << $1_1) - 1 & $2_1) << 32 - $1_1 | $8 >>> $1_1;
     }
     $1_1 = $3_1;
     if ($2_1 | $1_1) {
      while (1) {
       $6_1 = $2_1;
       $5_1 = __wasm_ctz_i64($2_1, $1_1);
       $3_1 = $5_1;
       $2_1 = $3_1 & 31;
       if (32 <= ($3_1 & 63) >>> 0) {
        $3_1 = 0;
        $6_1 = $1_1 >>> $2_1 | 0;
       } else {
        $3_1 = $1_1 >>> $2_1 | 0;
        $6_1 = ((1 << $2_1) - 1 & $1_1) << 32 - $2_1 | $6_1 >>> $2_1;
       }
       $1_1 = $3_1;
       $4 = $4 + $5_1 | 0;
       $5_1 = $4 << 4;
       $3_1 = HEAP32[$5_1 + 4856 >> 2];
       $8 = $5_1 + 4848 | 0;
       label$8 : {
        if (($3_1 | 0) != ($8 | 0)) {
         $2_1 = $139($3_1, $7_1, $0);
         if ($2_1) {
          break label$1
         }
         $2_1 = HEAP32[$3_1 + 4 >> 2];
         HEAP32[$2_1 + 8 >> 2] = HEAP32[$3_1 + 8 >> 2];
         HEAP32[HEAP32[$3_1 + 8 >> 2] + 4 >> 2] = $2_1;
         HEAP32[$3_1 + 8 >> 2] = $8;
         $2_1 = $5_1 + 4852 | 0;
         HEAP32[$3_1 + 4 >> 2] = HEAP32[$2_1 >> 2];
         HEAP32[$2_1 >> 2] = $3_1;
         HEAP32[HEAP32[$3_1 + 4 >> 2] + 8 >> 2] = $3_1;
         $4 = $4 + 1 | 0;
         $2_1 = ($1_1 & 1) << 31 | $6_1 >>> 1;
         $1_1 = $1_1 >>> 1 | 0;
         break label$8;
        }
        $3_1 = HEAP32[1471];
        HEAP32[1470] = HEAP32[1470] & __wasm_rotl_i64(-2, -1, $4);
        HEAP32[1471] = i64toi32_i32$HIGH_BITS & $3_1;
        $2_1 = $6_1 ^ 1;
       }
       if ($1_1 | $2_1) {
        continue
       }
       break;
      };
      $5_1 = HEAP32[1470];
      $6_1 = HEAP32[1471];
     }
     $1_1 = Math_clz32($6_1);
     $1_1 = 63 - (($1_1 | 0) == 32 ? Math_clz32($5_1) + 32 | 0 : $1_1) << 4;
     $3_1 = $1_1 + 4848 | 0;
     $1_1 = HEAP32[$1_1 + 4856 >> 2];
     label$10 : {
      if (!$6_1 & $5_1 >>> 0 < 1073741824 | $6_1 >>> 0 < 0) {
       break label$10
      }
      $4 = 99;
      if (($1_1 | 0) == ($3_1 | 0)) {
       break label$10
      }
      while (1) {
       if (!$4) {
        break label$10
       }
       $2_1 = $139($1_1, $7_1, $0);
       if ($2_1) {
        break label$1
       }
       $4 = $4 + -1 | 0;
       $1_1 = HEAP32[$1_1 + 8 >> 2];
       if (($3_1 | 0) != ($1_1 | 0)) {
        continue
       }
       break;
      };
      $1_1 = $3_1;
     }
     if ($137($0 + 48 | 0)) {
      continue
     }
     break;
    };
    if (($1_1 | 0) == ($3_1 | 0)) {
     break label$2
    }
    while (1) {
     $2_1 = $139($1_1, $7_1, $0);
     if ($2_1) {
      break label$1
     }
     $1_1 = HEAP32[$1_1 + 8 >> 2];
     if (($3_1 | 0) != ($1_1 | 0)) {
      continue
     }
     break;
    };
   }
   $2_1 = 0;
  }
  return $2_1;
 }
 
 function $139($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0;
  $4 = $0 + 4 | 0;
  $3_1 = ($4 + $1_1 | 0) + -1 & 0 - $1_1;
  $1_1 = HEAP32[$0 >> 2];
  if ($3_1 + $2_1 >>> 0 <= ($1_1 + $0 | 0) + -4 >>> 0) {
   $5_1 = HEAP32[$0 + 4 >> 2];
   HEAP32[$5_1 + 8 >> 2] = HEAP32[$0 + 8 >> 2];
   HEAP32[HEAP32[$0 + 8 >> 2] + 4 >> 2] = $5_1;
   if (($4 | 0) != ($3_1 | 0)) {
    $3_1 = $3_1 - $4 | 0;
    $5_1 = HEAP32[$0 + -4 >> 2];
    $5_1 = $0 - ($5_1 >> 31 ^ $5_1) | 0;
    $4 = $3_1 + HEAP32[$5_1 >> 2] | 0;
    HEAP32[$5_1 >> 2] = $4;
    HEAP32[($5_1 + ($4 & -4) | 0) + -4 >> 2] = $4;
    $0 = $0 + $3_1 | 0;
    $1_1 = $1_1 - $3_1 | 0;
    HEAP32[$0 >> 2] = $1_1;
   }
   label$3 : {
    if ($2_1 + 24 >>> 0 <= $1_1 >>> 0) {
     $4 = ($0 + $2_1 | 0) + 8 | 0;
     $1_1 = $1_1 - $2_1 | 0;
     $3_1 = $1_1 + -8 | 0;
     HEAP32[$4 >> 2] = $3_1;
     HEAP32[($4 + ($3_1 & -4) | 0) + -4 >> 2] = 7 - $1_1;
     $6_1 = $4;
     $5_1 = HEAP32[$4 >> 2] + -8 | 0;
     label$5 : {
      if ($5_1 >>> 0 <= 127) {
       $3_1 = ($5_1 >>> 3 | 0) + -1 | 0;
       break label$5;
      }
      $1_1 = Math_clz32($5_1);
      $3_1 = (($5_1 >>> 29 - $1_1 ^ 4) - ($1_1 << 2) | 0) + 110 | 0;
      if ($5_1 >>> 0 <= 4095) {
       break label$5
      }
      $1_1 = (($5_1 >>> 30 - $1_1 ^ 2) - ($1_1 << 1) | 0) + 71 | 0;
      $3_1 = $1_1 >>> 0 < 63 ? $1_1 : 63;
     }
     $1_1 = $3_1;
     $3_1 = $1_1 << 4;
     HEAP32[$6_1 + 4 >> 2] = $3_1 + 4848;
     $3_1 = $3_1 + 4856 | 0;
     HEAP32[$4 + 8 >> 2] = HEAP32[$3_1 >> 2];
     HEAP32[$3_1 >> 2] = $4;
     HEAP32[HEAP32[$4 + 8 >> 2] + 4 >> 2] = $4;
     $3_1 = HEAP32[1471];
     $4 = $1_1 & 31;
     if (32 <= ($1_1 & 63) >>> 0) {
      $1_1 = 1 << $4;
      $6_1 = 0;
     } else {
      $1_1 = (1 << $4) - 1 & 1 >>> 32 - $4;
      $6_1 = 1 << $4;
     }
     HEAP32[1470] = $6_1 | HEAP32[1470];
     HEAP32[1471] = $1_1 | $3_1;
     $1_1 = $2_1 + 8 | 0;
     HEAP32[$0 >> 2] = $1_1;
     HEAP32[(($1_1 & -4) + $0 | 0) + -4 >> 2] = $1_1;
     break label$3;
    }
    HEAP32[($0 + $1_1 | 0) + -4 >> 2] = $1_1;
   }
   $0 = $0 + 4 | 0;
  } else {
   $0 = 0
  }
  return $0;
 }
 
 function $140($0) {
  $0 = $0 | 0;
  return $138($0) | 0;
 }
 
 function $141($0) {
  var $1_1 = 0, $2_1 = 0, $3_1 = 0, $4 = 0, $5_1 = 0;
  if ($0) {
   $2_1 = $0 + -4 | 0;
   $4 = HEAP32[$2_1 >> 2];
   $3_1 = $4;
   $1_1 = $2_1;
   $0 = HEAP32[$0 + -8 >> 2];
   if (($0 | 0) <= -1) {
    $1_1 = $0 + $2_1 | 0;
    $3_1 = HEAP32[$1_1 + 5 >> 2];
    $5_1 = $1_1 + 9 | 0;
    HEAP32[$3_1 + 8 >> 2] = HEAP32[$5_1 >> 2];
    HEAP32[HEAP32[$5_1 >> 2] + 4 >> 2] = $3_1;
    $3_1 = $4 + ($0 ^ -1) | 0;
    $1_1 = $1_1 + 1 | 0;
   }
   $0 = $2_1 + $4 | 0;
   $2_1 = HEAP32[$0 >> 2];
   if (($2_1 | 0) != HEAP32[($0 + $2_1 | 0) + -4 >> 2]) {
    $4 = HEAP32[$0 + 4 >> 2];
    HEAP32[$4 + 8 >> 2] = HEAP32[$0 + 8 >> 2];
    HEAP32[HEAP32[$0 + 8 >> 2] + 4 >> 2] = $4;
    $3_1 = $3_1 + $2_1 | 0;
   }
   HEAP32[$1_1 >> 2] = $3_1;
   HEAP32[(($3_1 & -4) + $1_1 | 0) + -4 >> 2] = $3_1 ^ -1;
   $5_1 = $1_1;
   $3_1 = HEAP32[$1_1 >> 2] + -8 | 0;
   label$4 : {
    if ($3_1 >>> 0 <= 127) {
     $0 = ($3_1 >>> 3 | 0) + -1 | 0;
     break label$4;
    }
    $4 = Math_clz32($3_1);
    $0 = (($3_1 >>> 29 - $4 ^ 4) - ($4 << 2) | 0) + 110 | 0;
    if ($3_1 >>> 0 <= 4095) {
     break label$4
    }
    $0 = (($3_1 >>> 30 - $4 ^ 2) - ($4 << 1) | 0) + 71 | 0;
    $0 = $0 >>> 0 < 63 ? $0 : 63;
   }
   $2_1 = $0 << 4;
   HEAP32[$5_1 + 4 >> 2] = $2_1 + 4848;
   $2_1 = $2_1 + 4856 | 0;
   HEAP32[$1_1 + 8 >> 2] = HEAP32[$2_1 >> 2];
   HEAP32[$2_1 >> 2] = $1_1;
   HEAP32[HEAP32[$1_1 + 8 >> 2] + 4 >> 2] = $1_1;
   $2_1 = HEAP32[1471];
   $1_1 = $0 & 31;
   if (32 <= ($0 & 63) >>> 0) {
    $0 = 1 << $1_1;
    $1_1 = 0;
   } else {
    $0 = (1 << $1_1) - 1 & 1 >>> 32 - $1_1;
    $1_1 = 1 << $1_1;
   }
   HEAP32[1470] = $1_1 | HEAP32[1470];
   HEAP32[1471] = $0 | $2_1;
  }
 }
 
 function $142($0) {
  $0 = $0 | 0;
  $141($0);
 }
 
 function $143() {
  return 5888;
 }
 
 function $144($0) {
  var $1_1 = 0, $2_1 = 0;
  $1_1 = HEAP32[1476];
  $2_1 = $0 + 3 & -4;
  $0 = $1_1 + $2_1 | 0;
  label$1 : {
   if ($0 >>> 0 <= $1_1 >>> 0 ? ($2_1 | 0) >= 1 : 0) {
    break label$1
   }
   if ($0 >>> 0 > __wasm_memory_size() << 16 >>> 0) {
    if (!fimport$0($0 | 0)) {
     break label$1
    }
   }
   HEAP32[1476] = $0;
   return $1_1;
  }
  HEAP32[1472] = 48;
  return -1;
 }
 
 function $145($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0, $5_1 = 0;
  if ($2_1 >>> 0 >= 512) {
   fimport$1($0 | 0, $1_1 | 0, $2_1 | 0) | 0;
   return $0;
  }
  $4 = $0 + $2_1 | 0;
  label$2 : {
   if (!(($0 ^ $1_1) & 3)) {
    label$4 : {
     if (($2_1 | 0) < 1) {
      $2_1 = $0;
      break label$4;
     }
     if (!($0 & 3)) {
      $2_1 = $0;
      break label$4;
     }
     $2_1 = $0;
     while (1) {
      HEAP8[$2_1 | 0] = HEAPU8[$1_1 | 0];
      $1_1 = $1_1 + 1 | 0;
      $2_1 = $2_1 + 1 | 0;
      if ($2_1 >>> 0 >= $4 >>> 0) {
       break label$4
      }
      if ($2_1 & 3) {
       continue
      }
      break;
     };
    }
    $3_1 = $4 & -4;
    label$8 : {
     if ($3_1 >>> 0 < 64) {
      break label$8
     }
     $5_1 = $3_1 + -64 | 0;
     if ($2_1 >>> 0 > $5_1 >>> 0) {
      break label$8
     }
     while (1) {
      HEAP32[$2_1 >> 2] = HEAP32[$1_1 >> 2];
      HEAP32[$2_1 + 4 >> 2] = HEAP32[$1_1 + 4 >> 2];
      HEAP32[$2_1 + 8 >> 2] = HEAP32[$1_1 + 8 >> 2];
      HEAP32[$2_1 + 12 >> 2] = HEAP32[$1_1 + 12 >> 2];
      HEAP32[$2_1 + 16 >> 2] = HEAP32[$1_1 + 16 >> 2];
      HEAP32[$2_1 + 20 >> 2] = HEAP32[$1_1 + 20 >> 2];
      HEAP32[$2_1 + 24 >> 2] = HEAP32[$1_1 + 24 >> 2];
      HEAP32[$2_1 + 28 >> 2] = HEAP32[$1_1 + 28 >> 2];
      HEAP32[$2_1 + 32 >> 2] = HEAP32[$1_1 + 32 >> 2];
      HEAP32[$2_1 + 36 >> 2] = HEAP32[$1_1 + 36 >> 2];
      HEAP32[$2_1 + 40 >> 2] = HEAP32[$1_1 + 40 >> 2];
      HEAP32[$2_1 + 44 >> 2] = HEAP32[$1_1 + 44 >> 2];
      HEAP32[$2_1 + 48 >> 2] = HEAP32[$1_1 + 48 >> 2];
      HEAP32[$2_1 + 52 >> 2] = HEAP32[$1_1 + 52 >> 2];
      HEAP32[$2_1 + 56 >> 2] = HEAP32[$1_1 + 56 >> 2];
      HEAP32[$2_1 + 60 >> 2] = HEAP32[$1_1 + 60 >> 2];
      $1_1 = $1_1 - -64 | 0;
      $2_1 = $2_1 - -64 | 0;
      if ($2_1 >>> 0 <= $5_1 >>> 0) {
       continue
      }
      break;
     };
    }
    if ($2_1 >>> 0 >= $3_1 >>> 0) {
     break label$2
    }
    while (1) {
     HEAP32[$2_1 >> 2] = HEAP32[$1_1 >> 2];
     $1_1 = $1_1 + 4 | 0;
     $2_1 = $2_1 + 4 | 0;
     if ($2_1 >>> 0 < $3_1 >>> 0) {
      continue
     }
     break;
    };
    break label$2;
   }
   if ($4 >>> 0 < 4) {
    $2_1 = $0;
    break label$2;
   }
   $3_1 = $4 + -4 | 0;
   if ($3_1 >>> 0 < $0 >>> 0) {
    $2_1 = $0;
    break label$2;
   }
   $2_1 = $0;
   while (1) {
    HEAP8[$2_1 | 0] = HEAPU8[$1_1 | 0];
    HEAP8[$2_1 + 1 | 0] = HEAPU8[$1_1 + 1 | 0];
    HEAP8[$2_1 + 2 | 0] = HEAPU8[$1_1 + 2 | 0];
    HEAP8[$2_1 + 3 | 0] = HEAPU8[$1_1 + 3 | 0];
    $1_1 = $1_1 + 4 | 0;
    $2_1 = $2_1 + 4 | 0;
    if ($2_1 >>> 0 <= $3_1 >>> 0) {
     continue
    }
    break;
   };
  }
  if ($2_1 >>> 0 < $4 >>> 0) {
   while (1) {
    HEAP8[$2_1 | 0] = HEAPU8[$1_1 | 0];
    $1_1 = $1_1 + 1 | 0;
    $2_1 = $2_1 + 1 | 0;
    if (($4 | 0) != ($2_1 | 0)) {
     continue
    }
    break;
   }
  }
  return $0;
 }
 
 function $146($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0;
  label$1 : {
   if (!$2_1) {
    break label$1
   }
   $3_1 = $0 + $2_1 | 0;
   HEAP8[$3_1 + -1 | 0] = $1_1;
   HEAP8[$0 | 0] = $1_1;
   if ($2_1 >>> 0 < 3) {
    break label$1
   }
   HEAP8[$3_1 + -2 | 0] = $1_1;
   HEAP8[$0 + 1 | 0] = $1_1;
   HEAP8[$3_1 + -3 | 0] = $1_1;
   HEAP8[$0 + 2 | 0] = $1_1;
   if ($2_1 >>> 0 < 7) {
    break label$1
   }
   HEAP8[$3_1 + -4 | 0] = $1_1;
   HEAP8[$0 + 3 | 0] = $1_1;
   if ($2_1 >>> 0 < 9) {
    break label$1
   }
   $3_1 = 0 - $0 & 3;
   $4 = $3_1 + $0 | 0;
   $1_1 = Math_imul($1_1 & 255, 16843009);
   HEAP32[$4 >> 2] = $1_1;
   $2_1 = $2_1 - $3_1 & -4;
   $3_1 = $2_1 + $4 | 0;
   HEAP32[$3_1 + -4 >> 2] = $1_1;
   if ($2_1 >>> 0 < 9) {
    break label$1
   }
   HEAP32[$4 + 8 >> 2] = $1_1;
   HEAP32[$4 + 4 >> 2] = $1_1;
   HEAP32[$3_1 + -8 >> 2] = $1_1;
   HEAP32[$3_1 + -12 >> 2] = $1_1;
   if ($2_1 >>> 0 < 25) {
    break label$1
   }
   HEAP32[$4 + 24 >> 2] = $1_1;
   HEAP32[$4 + 20 >> 2] = $1_1;
   HEAP32[$4 + 16 >> 2] = $1_1;
   HEAP32[$4 + 12 >> 2] = $1_1;
   HEAP32[$3_1 + -16 >> 2] = $1_1;
   HEAP32[$3_1 + -20 >> 2] = $1_1;
   HEAP32[$3_1 + -24 >> 2] = $1_1;
   HEAP32[$3_1 + -28 >> 2] = $1_1;
   $6_1 = $4 & 4 | 24;
   $2_1 = $2_1 - $6_1 | 0;
   if ($2_1 >>> 0 < 32) {
    break label$1
   }
   $3_1 = $1_1;
   $5_1 = $1_1;
   $1_1 = $4 + $6_1 | 0;
   while (1) {
    HEAP32[$1_1 + 24 >> 2] = $5_1;
    HEAP32[$1_1 + 28 >> 2] = $3_1;
    HEAP32[$1_1 + 16 >> 2] = $5_1;
    HEAP32[$1_1 + 20 >> 2] = $3_1;
    HEAP32[$1_1 + 8 >> 2] = $5_1;
    HEAP32[$1_1 + 12 >> 2] = $3_1;
    HEAP32[$1_1 >> 2] = $5_1;
    HEAP32[$1_1 + 4 >> 2] = $3_1;
    $1_1 = $1_1 + 32 | 0;
    $2_1 = $2_1 + -32 | 0;
    if ($2_1 >>> 0 > 31) {
     continue
    }
    break;
   };
  }
  return $0;
 }
 
 function $147($0, $1_1, $2_1) {
  var $3_1 = 0;
  label$1 : {
   if (($0 | 0) == ($1_1 | 0)) {
    break label$1
   }
   if (($1_1 - $0 | 0) - $2_1 >>> 0 <= 0 - ($2_1 << 1) >>> 0) {
    return $145($0, $1_1, $2_1)
   }
   $3_1 = ($0 ^ $1_1) & 3;
   label$3 : {
    label$4 : {
     if ($0 >>> 0 < $1_1 >>> 0) {
      if ($3_1) {
       $3_1 = $0;
       break label$3;
      }
      if (!($0 & 3)) {
       $3_1 = $0;
       break label$4;
      }
      $3_1 = $0;
      while (1) {
       if (!$2_1) {
        break label$1
       }
       HEAP8[$3_1 | 0] = HEAPU8[$1_1 | 0];
       $1_1 = $1_1 + 1 | 0;
       $2_1 = $2_1 + -1 | 0;
       $3_1 = $3_1 + 1 | 0;
       if ($3_1 & 3) {
        continue
       }
       break;
      };
      break label$4;
     }
     label$9 : {
      if ($3_1) {
       break label$9
      }
      if ($0 + $2_1 & 3) {
       while (1) {
        if (!$2_1) {
         break label$1
        }
        $2_1 = $2_1 + -1 | 0;
        $3_1 = $2_1 + $0 | 0;
        HEAP8[$3_1 | 0] = HEAPU8[$1_1 + $2_1 | 0];
        if ($3_1 & 3) {
         continue
        }
        break;
       }
      }
      if ($2_1 >>> 0 <= 3) {
       break label$9
      }
      while (1) {
       $2_1 = $2_1 + -4 | 0;
       HEAP32[$2_1 + $0 >> 2] = HEAP32[$1_1 + $2_1 >> 2];
       if ($2_1 >>> 0 > 3) {
        continue
       }
       break;
      };
     }
     if (!$2_1) {
      break label$1
     }
     while (1) {
      $2_1 = $2_1 + -1 | 0;
      HEAP8[$2_1 + $0 | 0] = HEAPU8[$1_1 + $2_1 | 0];
      if ($2_1) {
       continue
      }
      break;
     };
     break label$1;
    }
    if ($2_1 >>> 0 <= 3) {
     break label$3
    }
    while (1) {
     HEAP32[$3_1 >> 2] = HEAP32[$1_1 >> 2];
     $1_1 = $1_1 + 4 | 0;
     $3_1 = $3_1 + 4 | 0;
     $2_1 = $2_1 + -4 | 0;
     if ($2_1 >>> 0 > 3) {
      continue
     }
     break;
    };
   }
   if (!$2_1) {
    break label$1
   }
   while (1) {
    HEAP8[$3_1 | 0] = HEAPU8[$1_1 | 0];
    $3_1 = $3_1 + 1 | 0;
    $1_1 = $1_1 + 1 | 0;
    $2_1 = $2_1 + -1 | 0;
    if ($2_1) {
     continue
    }
    break;
   };
  }
  return $0;
 }
 
 function $148() {
  return global$0 | 0;
 }
 
 function $149($0) {
  $0 = $0 | 0;
  global$0 = $0;
 }
 
 function $150($0) {
  $0 = $0 | 0;
  $0 = global$0 - $0 & -16;
  global$0 = $0;
  return $0 | 0;
 }
 
 function $151($0) {
  $0 = $0 | 0;
  return abort() | 0;
 }
 
 function _ZN17compiler_builtins3int3mul3Mul3mul17h070e9a1c69faec5bE($0, $1_1, $2_1, $3_1) {
  var $4 = 0, $5_1 = 0, $6_1 = 0, $7_1 = 0, $8 = 0, $9_1 = 0;
  $4 = $2_1 >>> 16 | 0;
  $5_1 = $0 >>> 16 | 0;
  $9_1 = Math_imul($4, $5_1);
  $6_1 = $2_1 & 65535;
  $7_1 = $0 & 65535;
  $8 = Math_imul($6_1, $7_1);
  $5_1 = ($8 >>> 16 | 0) + Math_imul($5_1, $6_1) | 0;
  $4 = ($5_1 & 65535) + Math_imul($4, $7_1) | 0;
  $0 = (Math_imul($1_1, $2_1) + $9_1 | 0) + Math_imul($0, $3_1) + ($5_1 >>> 16) + ($4 >>> 16) | 0;
  $1_1 = $8 & 65535 | $4 << 16;
  i64toi32_i32$HIGH_BITS = $0;
  return $1_1;
 }
 
 function __wasm_ctz_i64($0, $1_1) {
  var $2_1 = 0, $3_1 = 0;
  if ($0 | $1_1) {
   $3_1 = $1_1 + -1 | 0;
   $2_1 = $0 + -1 | 0;
   if (($2_1 | 0) != -1) {
    $3_1 = $3_1 + 1 | 0
   }
   $2_1 = Math_clz32($0 ^ $2_1) + 32 | 0;
   $0 = Math_clz32($1_1 ^ $3_1);
   $0 = ($0 | 0) == 32 ? $2_1 : $0;
   $1_1 = 63 - $0 | 0;
   i64toi32_i32$HIGH_BITS = 0 - (63 < $0 >>> 0) | 0;
   return $1_1;
  }
  i64toi32_i32$HIGH_BITS = 0;
  return 64;
 }
 
 function __wasm_i64_mul($0, $1_1, $2_1, $3_1) {
  $0 = _ZN17compiler_builtins3int3mul3Mul3mul17h070e9a1c69faec5bE($0, $1_1, $2_1, $3_1);
  return $0;
 }
 
 function __wasm_rotl_i64($0, $1_1, $2_1) {
  var $3_1 = 0, $4 = 0, $5_1 = 0, $6_1 = 0;
  $6_1 = $2_1 & 63;
  $5_1 = $6_1;
  $3_1 = $5_1 & 31;
  if (32 <= $5_1 >>> 0) {
   $3_1 = -1 >>> $3_1 | 0
  } else {
   $4 = -1 >>> $3_1 | 0;
   $3_1 = (1 << $3_1) - 1 << 32 - $3_1 | -1 >>> $3_1;
  }
  $5_1 = $3_1 & $0;
  $3_1 = $1_1 & $4;
  $4 = $6_1 & 31;
  if (32 <= $6_1 >>> 0) {
   $3_1 = $5_1 << $4;
   $6_1 = 0;
  } else {
   $3_1 = (1 << $4) - 1 & $5_1 >>> 32 - $4 | $3_1 << $4;
   $6_1 = $5_1 << $4;
  }
  $5_1 = $3_1;
  $4 = 0 - $2_1 & 63;
  $3_1 = $4;
  $2_1 = $3_1 & 31;
  if (32 <= $3_1 >>> 0) {
   $3_1 = -1 << $2_1;
   $2_1 = 0;
  } else {
   $3_1 = (1 << $2_1) - 1 & -1 >>> 32 - $2_1 | -1 << $2_1;
   $2_1 = -1 << $2_1;
  }
  $0 = $2_1 & $0;
  $3_1 = $1_1 & $3_1;
  $1_1 = $4 & 31;
  if (32 <= $4 >>> 0) {
   $2_1 = 0;
   $0 = $3_1 >>> $1_1 | 0;
  } else {
   $2_1 = $3_1 >>> $1_1 | 0;
   $0 = ((1 << $1_1) - 1 & $3_1) << 32 - $1_1 | $0 >>> $1_1;
  }
  $0 = $0 | $6_1;
  i64toi32_i32$HIGH_BITS = $2_1 | $5_1;
  return $0;
 }
 
 // EMSCRIPTEN_END_FUNCS
;
 function __wasm_memory_size() {
  return buffer.byteLength / 65536 | 0;
 }
 
 return {
  "__wasm_call_ctors": $1, 
  "malloc": $140, 
  "free": $142, 
  "ZSTD_getInBuffer": $20, 
  "ZSTD_getOutBuffer": $20, 
  "ZSTD_isError": $2, 
  "ZSTD_getErrorName": $21, 
  "ZSTD_createDStream": $101, 
  "ZSTD_freeDStream": $103, 
  "ZSTD_DStreamInSize": $104, 
  "ZSTD_DStreamOutSize": $105, 
  "ZSTD_initDStream": $107, 
  "ZSTD_decompressStream": $111, 
  "ZSTD_decompressStream_simpleArgs": $119, 
  "__errno_location": $143, 
  "stackSave": $148, 
  "stackRestore": $149, 
  "stackAlloc": $150, 
  "__growWasmMemory": $151
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
  base64DecodeToExistingUint8Array(bufferView, 1024, "VW5zcGVjaWZpZWQgZXJyb3IgY29kZQBObyBlcnJvciBkZXRlY3RlZABFcnJvciAoZ2VuZXJpYykAVW5rbm93biBmcmFtZSBkZXNjcmlwdG9yAFZlcnNpb24gbm90IHN1cHBvcnRlZABVbnN1cHBvcnRlZCBmcmFtZSBwYXJhbWV0ZXIARnJhbWUgcmVxdWlyZXMgdG9vIG11Y2ggbWVtb3J5IGZvciBkZWNvZGluZwBDb3JydXB0ZWQgYmxvY2sgZGV0ZWN0ZWQAUmVzdG9yZWQgZGF0YSBkb2Vzbid0IG1hdGNoIGNoZWNrc3VtAFVuc3VwcG9ydGVkIHBhcmFtZXRlcgBQYXJhbWV0ZXIgaXMgb3V0IG9mIGJvdW5kAENvbnRleHQgc2hvdWxkIGJlIGluaXQgZmlyc3QAQWxsb2NhdGlvbiBlcnJvciA6IG5vdCBlbm91Z2ggbWVtb3J5AHdvcmtTcGFjZSBidWZmZXIgaXMgbm90IGxhcmdlIGVub3VnaABPcGVyYXRpb24gbm90IGF1dGhvcml6ZWQgYXQgY3VycmVudCBwcm9jZXNzaW5nIHN0YWdlAHRhYmxlTG9nIHJlcXVpcmVzIHRvbyBtdWNoIG1lbW9yeSA6IHVuc3VwcG9ydGVkAFVuc3VwcG9ydGVkIG1heCBTeW1ib2wgVmFsdWUgOiB0b28gbGFyZ2UAU3BlY2lmaWVkIG1heFN5bWJvbFZhbHVlIGlzIHRvbyBzbWFsbABEaWN0aW9uYXJ5IGlzIGNvcnJ1cHRlZABEaWN0aW9uYXJ5IG1pc21hdGNoAENhbm5vdCBjcmVhdGUgRGljdGlvbmFyeSBmcm9tIHByb3ZpZGVkIHNhbXBsZXMARGVzdGluYXRpb24gYnVmZmVyIGlzIHRvbyBzbWFsbABTcmMgc2l6ZSBpcyBpbmNvcnJlY3QAT3BlcmF0aW9uIG9uIE5VTEwgZGVzdGluYXRpb24gYnVmZmVyAEZyYW1lIGluZGV4IGlzIHRvbyBsYXJnZQBBbiBJL08gZXJyb3Igb2NjdXJyZWQgd2hlbiByZWFkaW5nL3NlZWtpbmcARGVzdGluYXRpb24gYnVmZmVyIGlzIHdyb25n");
base64DecodeToExistingUint8Array(bufferView, 1880, "AQAAAAEAAAACAAAAAg==");
base64DecodeToExistingUint8Array(bufferView, 1904, "AQAAAAEAAAACAAAAAgAAACYAAACCAAAAIQUAAEoAAABnCAAAJgAAAMABAACAAAAASQUAAEoAAAC+CAAAKQAAACwCAACAAAAASQUAAEoAAAC+CAAALwAAAMoCAACAAAAAigUAAEoAAACECQAANQAAAHMDAACAAAAAnQUAAEoAAACgCQAAPQAAAIEDAACAAAAA6wUAAEsAAAA+CgAARAAAAJ4DAACAAAAATQYAAEsAAACqCgAASwAAALMDAACAAAAAwQYAAE0AAAAfDQAATQAAAFMEAACAAAAAIwgAAFEAAACmDwAAVAAAAJkEAACAAAAASwkAAFcAAACxEgAAWAAAANoEAACAAAAAbwkAAF0AAAAjFAAAVAAAAEUFAACAAAAAVAoAAGoAAACMFAAAagAAAK8FAACAAAAAdgkAAHwAAABOEAAAfAAAANICAACAAAAAYwcAAJEAAACQBwAAkgAAAAAAAAABAAAAAQAAAAUAAAANAAAAHQAAAD0AAAB9AAAA/QAAAP0BAAD9AwAA/QcAAP0PAAD9HwAA/T8AAP1/AAD9/wAA/f8BAP3/AwD9/wcA/f8PAP3/HwD9/z8A/f9/AP3//wD9//8B/f//A/3//wf9//8P/f//H/3//z/9//9/AAAAAAEAAAACAAAAAwAAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAADwAAABAAAAARAAAAEgAAABMAAAAUAAAAFQAAABYAAAAXAAAAGAAAABkAAAAaAAAAGwAAABwAAAAdAAAAHgAAAB8AAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAsAAAAMAAAADQAAAA4AAAAPAAAAEAAAABEAAAASAAAAEwAAABQAAAAVAAAAFgAAABcAAAAYAAAAGQAAABoAAAAbAAAAHAAAAB0AAAAeAAAAHwAAACAAAAAhAAAAIgAAACMAAAAlAAAAJwAAACkAAAArAAAALwAAADMAAAA7AAAAQwAAAFMAAABjAAAAgwAAAAMBAAADAgAAAwQAAAMIAAADEAAAAyAAAANAAAADgAAAAwAB");
base64DecodeToExistingUint8Array(bufferView, 2864, "AQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAwAAAAMAAAAEAAAABAAAAAUAAAAHAAAACAAAAAkAAAAKAAAACwAAAAwAAAANAAAADgAAAA8AAAAQ");
base64DecodeToExistingUint8Array(bufferView, 2964, "AQAAAAIAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAsAAAAMAAAADQAAAA4AAAAPAAAAEAAAABIAAAAUAAAAFgAAABgAAAAcAAAAIAAAACgAAAAwAAAAQAAAAIAAAAAAAQAAAAIAAAAEAAAACAAAABAAAAAgAAAAQAAAAIAAAAAAAQ==");
base64DecodeToExistingUint8Array(bufferView, 3168, "AQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAwAAAAMAAAAEAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAADwAAABAAAAABAAAABAAAAAgAAAAAAAAAAQABAQYAAAAAAAAEAAAAABAAAAQAAAAAIAAABQEAAAAAAAAFAwAAAAAAAAUEAAAAAAAABQYAAAAAAAAFBwAAAAAAAAUJAAAAAAAABQoAAAAAAAAFDAAAAAAAAAYOAAAAAAABBRAAAAAAAAEFFAAAAAAAAQUWAAAAAAACBRwAAAAAAAMFIAAAAAAABAUwAAAAIAAGBUAAAAAAAAcFgAAAAAAACAYAAQAAAAAKBgAEAAAAAAwGABAAACAAAAQAAAAAAAAABAEAAAAAAAAFAgAAACAAAAUEAAAAAAAABQUAAAAgAAAFBwAAAAAAAAUIAAAAIAAABQoAAAAAAAAFCwAAAAAAAAYNAAAAIAABBRAAAAAAAAEFEgAAACAAAQUWAAAAAAACBRgAAAAgAAMFIAAAAAAAAwUoAAAAAAAGBEAAAAAQAAYEQAAAACAABwWAAAAAAAAJBgACAAAAAAsGAAgAADAAAAQAAAAAEAAABAEAAAAgAAAFAgAAACAAAAUDAAAAIAAABQUAAAAgAAAFBgAAACAAAAUIAAAAIAAABQkAAAAgAAAFCwAAACAAAAUMAAAAAAAABg8AAAAgAAEFEgAAACAAAQUUAAAAIAACBRgAAAAgAAIFHAAAACAAAwUoAAAAIAAEBTAAAAAAABAGAAABAAAADwYAgAAAAAAOBgBAAAAAAA0GACA=");
base64DecodeToExistingUint8Array(bufferView, 3792, "AQABAQUAAAAAAAAFAAAAAAAABgQ9AAAAAAAJBf0BAAAAAA8F/X8AAAAAFQX9/x8AAAADBQUAAAAAAAcEfQAAAAAADAX9DwAAAAASBf3/AwAAABcF/f9/AAAABQUdAAAAAAAIBP0AAAAAAA4F/T8AAAAAFAX9/w8AAAACBQEAAAAQAAcEfQAAAAAACwX9BwAAAAARBf3/AQAAABYF/f8/AAAABAUNAAAAEAAIBP0AAAAAAA0F/R8AAAAAEwX9/wcAAAABBQEAAAAQAAYEPQAAAAAACgX9AwAAAAAQBf3/AAAAABwF/f//DwAAGwX9//8HAAAaBf3//wMAABkF/f//AQAAGAX9//8=");
base64DecodeToExistingUint8Array(bufferView, 4064, "AQABAQYAAAAAAAAGAwAAAAAAAAQEAAAAIAAABQUAAAAAAAAFBgAAAAAAAAUIAAAAAAAABQkAAAAAAAAFCwAAAAAAAAYNAAAAAAAABhAAAAAAAAAGEwAAAAAAAAYWAAAAAAAABhkAAAAAAAAGHAAAAAAAAAYfAAAAAAAABiIAAAAAAAEGJQAAAAAAAQYpAAAAAAACBi8AAAAAAAMGOwAAAAAABAZTAAAAAAAHBoMAAAAAAAkGAwIAABAAAAQEAAAAAAAABAUAAAAgAAAFBgAAAAAAAAUHAAAAIAAABQkAAAAAAAAFCgAAAAAAAAYMAAAAAAAABg8AAAAAAAAGEgAAAAAAAAYVAAAAAAAABhgAAAAAAAAGGwAAAAAAAAYeAAAAAAAABiEAAAAAAAEGIwAAAAAAAQYnAAAAAAACBisAAAAAAAMGMwAAAAAABAZDAAAAAAAFBmMAAAAAAAgGAwEAACAAAAQEAAAAMAAABAQAAAAQAAAEBQAAACAAAAUHAAAAIAAABQgAAAAgAAAFCgAAACAAAAULAAAAAAAABg4AAAAAAAAGEQAAAAAAAAYUAAAAAAAABhcAAAAAAAAGGgAAAAAAAAYdAAAAAAAABiAAAAAAABAGAwABAAAADwYDgAAAAAAOBgNAAAAAAA0GAyAAAAAADAYDEAAAAAALBgMIAAAAAAoGAwQ=");
base64DecodeToExistingUint8Array(bufferView, 4596, "AQAAAAMAAAAHAAAADwAAAB8AAAA/AAAAfwAAAP8AAAD/AQAA/wMAAP8HAAD/DwAA/x8AAP8/AAD/fwAA//8AAP//AQD//wMA//8HAP//DwD//x8A//8/AP//fwD///8A////Af///wP///8H////D////x////8/////fwAAAAABAAAAAgAAAAQAAAAAAAAAAgAAAAQAAAAIAAAAAAAAAAEAAAACAAAAAQAAAAQAAAAEAAAABAAAAAQAAAAIAAAACAAAAAgAAAAHAAAACAAAAAkAAAAKAAAACwAAAAEAAAACAAAAAwAAAAQAAAAFAAAABQ==");
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
  argTypes = argTypes || [];
  // When the function takes numbers and returns a number, we can just return
  // the original function
  var numericArgs = argTypes.every(function(type){ return type === 'number'});
  var numericRet = returnType !== 'string';
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  }
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
  HEAP8.set(array, buffer);
}

/** @param {boolean=} dontAddNull */
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
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
    STACK_BASE = 5248944,
    STACKTOP = STACK_BASE,
    STACK_MAX = 6064,
    DYNAMIC_BASE = 5248944,
    DYNAMICTOP_PTR = 5904;



var TOTAL_STACK = 5242880;

var INITIAL_INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 140247040;









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
updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;














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
  runtimeInitialized = true;
  
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  runtimeExited = true;
}

function postRun() {

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

function getUniqueRunDependency(id) {
  return id;
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
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

  what = 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';

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


  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
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




// STATICTOP = STATIC_BASE + 5040;
/* global initializers */  __ATINIT__.push({ func: function() { ___wasm_call_ctors() } });




/* no memory initializer */
// {{PRE_LIBRARY}}


  function demangle(func) {
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

  function _emscripten_get_sbrk_ptr() {
      return 5904;
    }

  var _emscripten_memcpy_big= Uint8Array.prototype.copyWithin
    ? function(dest, src, num) { HEAPU8.copyWithin(dest, src, src + num); }
    : function(dest, src, num) { HEAPU8.set(HEAPU8.subarray(src, src+num), dest); }
  ;

  
  function _emscripten_get_heap_size() {
      return HEAPU8.length;
    }
  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('OOM');
    }function _emscripten_resize_heap(requestedSize) {
      requestedSize = requestedSize >>> 0;
      abortOnCannotGrowMemory(requestedSize);
    }
var ASSERTIONS = false;



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
var asmLibraryArg = { "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_resize_heap": _emscripten_resize_heap, "getTempRet0": getTempRet0, "memory": wasmMemory, "setTempRet0": setTempRet0, "table": wasmTable };
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
  return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["__wasm_call_ctors"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _malloc = Module["_malloc"] = function() {
  return (_malloc = Module["_malloc"] = Module["asm"]["malloc"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _free = Module["_free"] = function() {
  return (_free = Module["_free"] = Module["asm"]["free"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_getInBuffer = Module["_ZSTD_getInBuffer"] = function() {
  return (_ZSTD_getInBuffer = Module["_ZSTD_getInBuffer"] = Module["asm"]["ZSTD_getInBuffer"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_getOutBuffer = Module["_ZSTD_getOutBuffer"] = function() {
  return (_ZSTD_getOutBuffer = Module["_ZSTD_getOutBuffer"] = Module["asm"]["ZSTD_getOutBuffer"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_isError = Module["_ZSTD_isError"] = function() {
  return (_ZSTD_isError = Module["_ZSTD_isError"] = Module["asm"]["ZSTD_isError"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_getErrorName = Module["_ZSTD_getErrorName"] = function() {
  return (_ZSTD_getErrorName = Module["_ZSTD_getErrorName"] = Module["asm"]["ZSTD_getErrorName"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_createDStream = Module["_ZSTD_createDStream"] = function() {
  return (_ZSTD_createDStream = Module["_ZSTD_createDStream"] = Module["asm"]["ZSTD_createDStream"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_freeDStream = Module["_ZSTD_freeDStream"] = function() {
  return (_ZSTD_freeDStream = Module["_ZSTD_freeDStream"] = Module["asm"]["ZSTD_freeDStream"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_DStreamInSize = Module["_ZSTD_DStreamInSize"] = function() {
  return (_ZSTD_DStreamInSize = Module["_ZSTD_DStreamInSize"] = Module["asm"]["ZSTD_DStreamInSize"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_DStreamOutSize = Module["_ZSTD_DStreamOutSize"] = function() {
  return (_ZSTD_DStreamOutSize = Module["_ZSTD_DStreamOutSize"] = Module["asm"]["ZSTD_DStreamOutSize"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_initDStream = Module["_ZSTD_initDStream"] = function() {
  return (_ZSTD_initDStream = Module["_ZSTD_initDStream"] = Module["asm"]["ZSTD_initDStream"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_decompressStream = Module["_ZSTD_decompressStream"] = function() {
  return (_ZSTD_decompressStream = Module["_ZSTD_decompressStream"] = Module["asm"]["ZSTD_decompressStream"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _ZSTD_decompressStream_simpleArgs = Module["_ZSTD_decompressStream_simpleArgs"] = function() {
  return (_ZSTD_decompressStream_simpleArgs = Module["_ZSTD_decompressStream_simpleArgs"] = Module["asm"]["ZSTD_decompressStream_simpleArgs"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var ___errno_location = Module["___errno_location"] = function() {
  return (___errno_location = Module["___errno_location"] = Module["asm"]["__errno_location"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = function() {
  return (stackSave = Module["stackSave"] = Module["asm"]["stackSave"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = function() {
  return (stackRestore = Module["stackRestore"] = Module["asm"]["stackRestore"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = function() {
  return (stackAlloc = Module["stackAlloc"] = Module["asm"]["stackAlloc"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var __growWasmMemory = Module["__growWasmMemory"] = function() {
  return (__growWasmMemory = Module["__growWasmMemory"] = Module["asm"]["__growWasmMemory"]).apply(null, arguments);
};





// === Auto-generated postamble setup entry stuff ===





Module["cwrap"] = cwrap;
Module["setValue"] = setValue;
Module["getValue"] = getValue;



































































































































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
}
Module['run'] = run;


/** @param {boolean|number=} implicit */
function exit(status, implicit) {

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && noExitRuntime && status === 0) {
    return;
  }

  if (noExitRuntime) {
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
    