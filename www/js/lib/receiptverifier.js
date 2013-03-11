/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function (exports) {

if (! exports.receipts) {
  exports.receipts = {};
}

var noNewObject = (function () { return this; })();

if (typeof atob === 'undefined' && typeof Buffer !== 'undefined') {
  atob = function (s) {
    return new Buffer(s, 'base64').toString('utf8');
  };
}

var Verifier = function (options) {
  if (this === noNewObject) {
    throw 'You forgot new';
  }
  options = options || {};
  for (var i in options) {
    if (options.hasOwnProperty(i) && this._validConstructorArguments.indexOf(i) == -1) {
      throw 'Illegal option to Verifier({}): ' + i;
    }
  }
  this.app = undefined;
  this.products = [];
  this.receiptErrors = {};
  this.receiptVerifications = {};
  this._cacheStorage = options.cacheStorage || (typeof localStorage !== 'undefined' ? localStorage : undefined);
  this.cacheTimeout = options.cacheTimeout || this.defaultCacheTimeout;
  this.state = new this.states.VerificationIncomplete('.verify() has not been called');
  this.requestTimeout = options.requestTimeout || this.defaultRequestTimeout;
  this.refundWindow = options.refundWindow || this.defaultRefundWindow;
  this.installs_allowed_from = options.installs_allowed_from || undefined;
  this.onlog = options.onlog;
  if (options.logLevel) {
    if (typeof options.logLevel == "string") {
      this.logLevel = this.levels[options.logLevel];
    } else {
      this.logLevel = options.logLevel;
    }
  }
};

function _extend(obj, attrs) {
  if (attrs) {
    for (var i in attrs) {
      if (attrs.hasOwnProperty(i)) {
        obj[i] = attrs[i];
      }
    }
  }
};

function _forceForEach(obj, callback) {
  // Workaround for: https://bugzilla.mozilla.org/show_bug.cgi?id=769830
  if (obj.forEach) {
    obj.forEach(callback);
    return;
  }
  // Otherwise we treat it as an object with keys that need to be iterated over
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      callback(obj[i]);
    }
  }
}

function _forceIndexOf(obj, value) {
  // Workaround for: https://bugzilla.mozilla.org/show_bug.cgi?id=769830
  if (obj.indexOf) {
    return obj.indexOf(value);
  }
  for (var i in obj) {
    if (obj[i] == value) {
      return i;
    }
  }
  return -1;
}

Verifier.State = function (name, superclass) {
  if (name === undefined) {
    return this;
  }
  var NewState = function (detail, attrs) {
    if (this === noNewObject) {
      throw 'You forgot new';
    }
    this.detail = detail;
    _extend(this, attrs);
  };
  if (superclass === undefined) {
    superclass = Verifier.State;
  }
  NewState.prototype = new superclass();
  NewState.className = name;
  NewState.prototype.name = name;
  return NewState;
};

Verifier.State.prototype.toString = function () {
  var s = '[' + this.name;
  if (this.detail) {
    s += ' ' + this.detail;
  }
  for (var i in this) {
    if (this.hasOwnProperty(i) && i != 'detail') {
      if (typeof this[i] == "object" && this[i] && this[i].toSource) {
        var repr = this[i].toSource();
      } else {
        var repr = JSON.stringify(this[i]);
      }
      s += ' ' + i + ': ' + repr;
    }
  }
  s += ']';
  return s;
};

Verifier.states = {};
Verifier.states.VerificationIncomplete = Verifier.State("VerificationIncomplete");
Verifier.states.NeedsInstall = Verifier.State("NeedsInstall");
Verifier.states.MozAppsNotSupported = Verifier.State("MozAppsNotSupported");
Verifier.states.NetworkError = Verifier.State("NetworkError");
Verifier.states.NotInstalled = Verifier.State("NotInstalled", Verifier.states.NeedsInstall);
Verifier.states.NoReceipts = Verifier.State("NoReceipts", Verifier.states.NeedsInstall);
Verifier.states.NoValidReceipts = Verifier.State("NoValidReceipts");
Verifier.states.OK = Verifier.State("OK");
Verifier.states.OKCache = Verifier.State("OKCache", Verifier.states.OK);
Verifier.states.OKStaleCache = Verifier.State("OKStaleCache", Verifier.states.OKCache);
Verifier.states.InternalError = Verifier.State("InternalError");
Verifier.states.MozAppsError = Verifier.State("MozAppsError", Verifier.states.InternalError);
Verifier.states.VerifierError = Verifier.State("VerifierError", Verifier.states.InternalError);
Verifier.states.ServerError = Verifier.State("ServerError", Verifier.states.NetworkError);

Verifier.states.toString = function () {
  var items = [];
  for (var i in this) {
    if (this.hasOwnProperty(i) && i != 'toString' && i != 'detail') {
      items.push(i);
    }
  }
  items.sort();
  return '{' + items.join(', ') + '}';
};

Verifier.errors = {};
Verifier.errors.ReceiptFormatError = Verifier.State("ReceiptFormatError");
Verifier.errors.ReceiptParseError = Verifier.State("ReceiptParseError", Verifier.errors.ReceiptFormatError);
Verifier.errors.InvalidFromStore = Verifier.State("InvalidFromStore");
Verifier.errors.Refunded = Verifier.State("Refunded");
Verifier.errors.RequestTimeout = Verifier.State("RequestTimeout", Verifier.states.ServerError);
Verifier.errors.ServerStatusError = Verifier.State("ServerStatusError", Verifier.states.ServerError);
Verifier.errors.InvalidServerResponse = Verifier.State("InvalidServerResponse", Verifier.states.ServerError);
Verifier.errors.InvalidReceiptIssuer = Verifier.State("InvalidReceiptIssuer");
Verifier.errors.ConnectionError = Verifier.State("ConnectionError", Verifier.states.NetworkError);
Verifier.errors.ReceiptExpired = Verifier.State("ReceiptExpired");

Verifier.errors.toString = Verifier.states.toString;

Verifier.prototype = {

  _validConstructorArguments: [
    'cacheStorage', 'cacheTimeout', 'requestTimeout',
    'refundWindow', 'installs_allowed_from', 'onlog',
    'logLevel'
  ],

  defaultCacheTimeout: 1000 * 60 * 60 * 24, // One day
  defaultRequestTimeout: 30000, // 30 seconds
  defaultRefundWindow: 1000 * 60 * 40, // 40 minutes

  toString: function () {
    var self = this;
    var s = '[Verifier state: ' + this.state;
    if (this.products.length) {
      s += ' products: ' + this.products.map(function (i) {return i.url;}).join(', ');
    }
    this.iterReceiptErrors(function (receipt, error) {
      if (error == self.state) {
        // Sometimes a receipt error is promoted to the state
        s += ' Error(' + receipt.substr(0, 4) + '...' + receipt.substr(receipt.length-4) + '): [error is state]';
      } else {
        s += ' Error(' + receipt.substr(0, 4) + '...' + receipt.substr(receipt.length-4) + '): ' + error;
      }
    });
    if (this.app) {
      s += ' installed app: ' + this.app.manifestURL;
    }
    s += ']';
    return s;
  },

  iterReceiptErrors: function (callback) {
    for (var i in this.receiptErrors) {
      if (this.receiptErrors.hasOwnProperty(i)) {
        var result = callback(i, this.receiptErrors[i]);
        if (result === false) {
          break;
        }
      }
    }
  },

  verify: function (onVerified) {
    var self = this;
    this.state = new this.states.VerificationIncomplete(".verify() has not completed");
    if (! navigator.mozApps) {
      this.state = new this.states.MozAppsNotSupported("navigator.mozApps does not exist");
      onVerified(self);
      return;
    }
    var result = navigator.mozApps.getSelf();
    result.onsuccess = function () {
      try {
        self.app = this.result || null;
        if (! this.result) {
          self.state = new self.states.NotInstalled('The app is not installed');
          onVerified(self);
          return;
        }
        self.log(self.levels.INFO, "Got application: " + this.result.manifestURL);
        self.verifyReceipts(this.result, onVerified);
      } catch (e) {
        self.state = new self.states.VerifierError("Exception: " + e, {exception: e});
        onVerified(self);
      }
    };
    result.onerror = function () {
      self.state = new self.errors.MozAppsError("Error calling mozApps.getSelf: " + (this.error && this.error.name), {mozAppsError: this.error});
      self.log(self.levels.ERROR, "Got mozApps Error: " + (this.error && this.error.name));
      onVerified(self);
    };
  },

  verifyReceipts: function (app, onVerified) {
    if ((! app.receipts) || (! app.receipts.length)) {
      if (app.receipts === undefined) {
        this.log(self.levels.ERROR,
          "The .receipts property of the app object is undefined (app: "
          + JSON.stringify(app) + ")");
      }
      this.state = new this.states.NoReceipts("No receipts were found or installed");
      return;
    }
    if (this.installs_allowed_from === undefined) {
      this.installs_allowed_from = app.manifest.installs_allowed_from;
      this.log(this.levels.INFO, "Using installs_allowed_from value from manifest: " + JSON.stringify(this.installs_allowed_from));
    }
    var pending = app.receipts.length;
    var self = this;
    _forceForEach(app.receipts, function (receipt) {
      self.log(self.levels.DEBUG, "Checking receipt " + receipt.substr(0, 4));
      var result = self._checkCache(receipt, false);
      if (result) {
        self.log(self.levels.INFO, "Got receipt (" + receipt.substr(0, 4) + ") status from cache: " + JSON.stringify(result));
        self._addReceiptError(receipt, new self.states.OKCache());
        self._addReceiptVerification(receipt, result);
        pending--;
        if (! pending) {
          self._finishVerification(onVerified);
        }
        return;
      }
      try {
        self._verifyOneReceipt(app, receipt, function () {
          pending--;
          if (! pending) {
            self._finishVerification(onVerified);
          }
        });
      } catch (e) {
        self.log(self.levels.ERROR, "Got error in _verifyOneReceipt: " + e);
        self._addReceiptError(receipt, new self.states.VerifierError("Exception in _verifyOneReceipt: " + e, {exception: e}));
        // FIXME: potentially the callback could be called successfully, and exception still fire
        pending--;
        if (! pending) {
          self._finishVerification(onVerified);
        }
      }
    });
  },

  _finishVerification: function (onVerified) {
    try {
      this.log(this.levels.DEBUG, "Finished all receipt verification");
      if (this.state instanceof(this.states.VerificationIncomplete)) {
        this.log(this.levels.DEBUG, "No serious errors during verification");
        if (! this.products.length) {
          this.state = new this.states.NoValidReceipts("No receipts passed verification");
        } else {
          this.state = new this.states.OK();
        }
      }
      onVerified(this);
    } catch (e) {
      this.log(this.levels.ERROR, "Fatal error in _finishVerification: " + e);
      this.state = new this.states.VerifierError("Exception: " + e, {exception: e});
      onVerified(this);
    }
  },

  _verifyOneReceipt: function (app, receipt, callback) {
    try {
      var parsed = this.parseReceipt(receipt);
    } catch (e) {
      this._addReceiptError(receipt, new this.errors.ReceiptParseError("Error decoding JSON: " + e, {exception: e}));
      callback();
      return;
    }
    var iss = parsed.iss;
    if (! iss) {
      this._addReceiptError(receipt, new this.errors.ReceiptFormatError("No (or empty) iss field"), {parsed: parsed});
      callback();
      return;
    }
    // FIXME: somewhat crude checking, case-sensitive:
    if (this.installs_allowed_from && _forceIndexOf(this.installs_allowed_from, iss) == -1 && _forceIndexOf(this.installs_allowed_from, "*") == -1) {
      this._addReceiptError(receipt, new this.errors.InvalidReceiptIssuer("Issuer (iss) of receipt is not a valid installer: " + iss, {iss: iss, installs_allowed_from: this.installs_allowed_from}));
      callback();
      return;
    }
    var verify = parsed.verify;
    if (! verify) {
      this._addReceiptError(receipt, new this.errors.ReceiptFormatError("No (or empty) verify field"), {parsed: parsed});
      callback();
      return;
    }
    // Node.js
    if (typeof XMLHttpRequest === 'undefined') {
      XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
    }
    var req = new XMLHttpRequest();
    var self = this;
    var timeout = null;
    this.log(this.levels.INFO, "POSTing to " + verify);
    req.open("POST", verify);
    req.onreadystatechange = function () {
      if (req.readyState != 4) {
        return;
      }
      self.log(self.levels.INFO, "Request to " + verify + " completed with status: " + req.status);
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (req.status === 0) {
        self._addReceiptError(
          receipt,
          new self.errors.ConnectionError("Server could not be contacted", {request: req, url: verify}));
        callback();
        return;
      }
      if (req.status == 404) {
        self._addReceiptError(
          receipt,
          new self.errors.ServerStatusError("Server responded with 404 to " + verify,
                                            {request: req, status: req.status, url: verify}));
        callback();
        return;
      }
      if (req.status != 200) {
        self._addReceiptError(
          receipt,
          new self.errors.ServerStatusError("Server responded with non-200 status: " + req.status,
          {request: req, status: req.status, url: verify}));
        callback();
        return;
      }
      try {
        var result = JSON.parse(req.responseText);
      } catch (e) {
        self._addReceiptError(receipt, new self.errors.InvalidServerResponse("Invalid JSON from server", {request: req, text: req.responseText}));
        callback();
        return;
      }
      if (typeof result != "object" || result === null) {
        self._addReceiptError(receipt, new self.errors.InvalidServerResponse("Server did not respond with a JSON object (" + JSON.stringify(result) + ")", {request: req, text: req.responseText}));
        callback();
        return;
      }
      self.log(self.levels.INFO, "Receipt (" + receipt.substr(0, 4) + "...) completed with result: " + JSON.stringify(result));
      if (result.status == "ok" || result.status == "pending") {
        // FIXME: should represent pending better:
        self._addReceiptVerification(receipt, result);
        if (result.status == "ok") {
          // FIXME: maybe pending should be saved too, in case of future network error
          self._saveResults(receipt, parsed, result);
        }
        callback();
        return;
      }
      if (result.status == "refunded") {
        self._addReceiptError(receipt, new self.errors.Refunded("Application payment was refunded", {result: result}));
        callback();
        return;
      }
      if (result.status == "expired") {
        self._addReceiptError(receipt, new self.errors.ReceiptExpired("Receipt expired", {result: result}));
        // FIXME: sometimes an error, sometimes not?  Accumulate separately?
        self._addReceiptVerification(receipt, result);
        callback();
        return;
      }
      if (result.status == "invalid") {
        self._addReceiptError(receipt, new self.errors.InvalidFromStore("The store reports the receipt is invalid", {result: result}));
        callback();
        return;
      }
      self._addReceiptError(receipt, new self.errors.InvalidServerResponse("Store replied with unknown status: " + result.status, {result: result}));
      callback();
    };
    req.send(receipt);
    if (this.requestTimeout) {
      timeout = setTimeout(function () {
        req.abort();
        self.log(self.levels.ERROR, "Request to " + verify + " timed out");
        self._addReceiptError(
          receipt,
          new self.errors.RequestTimeout(
            "The request timed out after " + self.requestTimeout + " milliseconds",
            {request: req, url: verify})
        );
        callback();
      }, this.requestTimeout);
    }
  },

  _addReceiptError: function (receipt, error) {
    this.receiptErrors[receipt] = error;
    if (error instanceof this.states.NetworkError) {
      var result = this._checkCache(receipt, true);
      if (result) {
        this.log("Got stale receipt (" + receipt.substr(0, 4) + ") status from cache: " + JSON.stringify(result));
        this._addReceiptVerification(receipt, result);
        this._addReceiptError(receipt, new this.states.OKStaleCache("Used a stale cache because of network error: " + error));
        return;
      }
    }
    if (error instanceof this.states.NetworkError) {
      if (this.state instanceof this.states.VerificationIncomplete) {
        this.state = error;
      }
    } else if (error instanceof this.states.OK) {
      // A soft error
      if (this.state instanceof this.states.OK || this.state instanceof this.states.VerificationIncomplete) {
        this.state = error;
      }
    }
  },

  _addReceiptVerification: function (receipt, result) {
    this.receiptVerifications[receipt] = result;
    this.products.push(this.parseReceipt(receipt).product);
  },

  _checkCache: function (receipt, networkFailure) {
    // FIXME: this should distinguish between getting a cached value when it's helpful
    // and when it's needed (due to network error)
    if (! this._cacheStorage) {
      return null;
    }
    var key = this._makeKey(receipt);
    var value = this._cacheStorage.getItem(key);
    if (! value) {
      return null;
    }
    try {
      value = JSON.parse(value);
    } catch (e) {
      this._cacheStorage.removeItem(key);
      return null;
    }
    var result = value.result;
    if (! networkFailure) {
      if (Date.now() - value.created > this.cacheTimeout) {
        this.log(this.levels.INFO, "Not using cache value because it is expired");
        return null;
      }
      if (result.status == "pending") {
        // If it was pending we should check again
        return null;
      }
      var parsed = this.parseReceipt(receipt);
      if (parsed.iat && this.refundWindow &&
          value.created - parsed.iat < this.refundWindow &&
          Date.now() - parsed.iat > this.refundWindow) {
        // The receipt was last checked during the refund window, and
        // the refund window has passed, so we should check the
        // receipt again
        return null;
      }
      return result;
    } else {
      // If there was a network failure we should offer whatever value
      // we have cached
      return result;
    }
  },

  _saveResults: function (receipt, parsedReceipt, result) {
    if (! this._cacheStorage) {
      return;
    }
    var key = this._makeKey(receipt);
    var value = {created: Date.now(), result: result};
    this._cacheStorage.setItem(key, JSON.stringify(value));
  },

  clearCache: function () {
    if (! this._cacheStorage) {
      return;
    }
    var bad = [];
    for (var i=0; i<this._cacheStorage.length; i++) {
      var key = this._cacheStorage.key(i);
      if (key.substr(0, 16) == "receiptverifier.") {
        bad.push(key);
      }
    }
    for (i=0; i<bad.length; i++) {
      this._cacheStorage.removeItem(bad[i]);
    }
  },

  _makeKey: function (receipt) {
    return 'receiptverifier.' + receipt;
  },

  parseReceipt: function (receipt) {
    if (receipt.indexOf('.') == -1) {
      throw 'Not valid JWT';
    }
    var majorParts = receipt.split('~');
    var dataParts = majorParts[1].split('.');
    var body = dataParts[1];
    body = this.base64urldecode(body);
    body = JSON.parse(body);
    return body;
  },

  base64urldecode: function (s) {
    s = s.replace(/-/g, '+'); // 62nd char of encoding
    s = s.replace(/_/g, '/'); // 63rd char of encoding
    switch (s.length % 4) { // Pad with trailing '='s
      case 0: break; // No pad chars in this case
      case 1: s += "==="; break;
      case 2: s += "=="; break;
      case 3: s += "="; break;
      default: throw "Illegal base64url string!";
    }
    return atob(s);
  },

  base64urlencode: function (s) {
    s = btoa(s);
    s = s.replace(/\+/g, '-');
    s = s.replace(/\//g, '_');
    s = s.replace(/[\n=]/g, '');
    return s;
  },

  levels: {
    "DEBUG": 10,
    "INFO": 20,
    "NOTIFY": 30,
    "WARN": 40,
    "ERROR": 50
  },

  logLevel: 2,

  log: function (level, message) {
    if ((! this.onlog) || level < this.logLevel) {
      return;
    }
    this.onlog(level, message);
  }

};

Verifier.consoleLogger = function (level, message) {
  if (! console) {
    return;
  }
  if (level <= this.levels.DEBUG && console.debug) {
    console.debug(message);
  } else if (level <= this.levels.INFO && console.info) {
    console.info(message);
  } else if (level <= this.levels.NOTIFY && console.log) {
    console.log(message);
  } else if (level <= this.levels.WARN && console.warn) {
    console.warn(message);
  } else if (console.error) {
    console.error(message);
  } else {
    console.log(message);
  }
};

Verifier.prototype.levels.toString = function () {
  var levels = [];
  for (var i in this) {
    if (this.hasOwnProperty(i) && i != 'toString') {
      levels.push(i);
    }
  }
  var self = this;
  levels.sort(function (a, b) {
    return self[a] < self[b] ? 1 : -1;
  });
  return '{' + levels.join(', ') + '}';
};

Verifier.prototype.states = Verifier.states;
Verifier.prototype.errors = Verifier.errors;
Verifier.prototype.consoleLogger = Verifier.consoleLogger;
Verifier.levels = Verifier.prototype.levels;

exports.receipts.Verifier = Verifier;

exports.receipts.verify = function verify(callback, options) {
  var verifier = new Verifier(options);
  verifier.verify(callback);
};

// embedded https://github.com/potch/mu.js
var $ = (function(win, doc, undefined) {

    function pico(sel) {
        var ret,
            p,
            forEach = Array.prototype.forEach;

        ret = sel.nodeType ? [sel] : doc.querySelectorAll(sel);

        ret.each = function(fn) {
            forEach.call(ret, function(item) {
                fn.call(item);
            });
            return ret;
        };


        ret.on = function(type, handler) {
            ret.each(function() {
                on(this, type, handler)
            });
            return ret;
        };


        ret.css = function(o) {
            if (typeof o == 'object') {
                for (p in o) {
                    ret.each(function() {
                        this.style[p] = o[p];
                    });
                }
                return ret;
            }
            return win.getComputedStyle(ret[0]).getPropertyValue(o);
        };


        ret.attr = function(o) {
            if (typeof o == 'object') {
                for (p in o) {
                    ret.each(function() {
                        this.setAttribute(p, o[p]);
                    });
                }
                return ret;
            }
            return ret[0].getAttribute(o);
        };


        return ret;
    };

    var on = pico.on = function(el, type, handler) {
        el.addEventListener(type, function(e) {
            handler.call(e.target, e);
        }, false);
    };

    return pico;
})(typeof window !== 'undefined' ? window : global, typeof document !== 'undefined' ? document : undefined);


function Prompter(options) {
  if (this === window || (typeof mozmarket != 'undefined' && this == mozmarket.receipts)) {
    return new Prompter(options);
  }
  options = options || {};
  this.overlay = null;
  for (var i in options) {
    if (options.hasOwnProperty(i) && i != 'verifier'
        && i != 'templates' && i != 'verify' && i != 'verifierOptions') {
      if (this[i] === undefined) {
        throw 'Unknown option: ' + i;
      }
      this[i] = options[i];
    }
  }
  if (options.templates) {
    var old = this.templates;
    this.templates = {};
    for (var i in old) {
      this.templates[i] = old[i];
    }
    for (var i in options.templates) {
      if (options.templates.hasOwnProperty(i)) {
        this.templates[i] = options.templates[i];
      }
    }
  }
  if (! this.storeURL) {
    throw 'You must provide a storeURL option';
  }
  if (! this.supportHTML) {
    throw 'You must provide a supportHTML option';
  }
  if (options.verifier) {
    this.respond(options.verifier);
  }
  if (options.verify) {
    var verifier = new Verifier(options.verifierOptions);
    var self = this;
    verifier.verify(function () {
      self.respond(verifier);
    });
  }
};

Prompter.prototype = {

  storeURL: null,
  allowNoInstall: false,
  // FIXME: should be required (or self install):
  ignoreInternalError: false,
  fatalInternalError: false,
  // Maybe required?
  supportHTML: null,

  templates: {
    fatalInternalError: 'We have encountered a error that keeps us from continuing.  Please contact support: <%= supportHTML %>',
    internalError: 'We have encountered an error.  You may close this dialog to continue, but please also contact support: <%= supportHTML %>',
    storeInstall: 'Please visit the <a href="<%= quote(storeURL) %>">store page</a> to install the application.',
    refunded: 'You purchased this app, but then got a refund.  If you still want to use the application, you must <a href="<%= quote(storeURL) %>">purchase the application again</a>.',
    invalidReceiptIssuer: 'You purchased this application from <%= error.iss %> which is not a store we have a relationship with.  Please either <a href="<%= quote(storeURL) %>">re-purchase the application</a> or contact support: <%= supportHTML %>',
    invalidFromStore: 'The store reports that your purchase receipt is invalid.  Please <a href="<%= quote(storeURL) %>">visit the store to reinstall the application</a>.',
    receiptFormatError: 'Your purchase receipt is malformed.  Please <a href="<%= quote(storeURL) %>">visit the store to reinstall the application</a>.',
    genericError: 'An error has occurred.  <a href="<%= quote(storeURL) %>">Reinstalling the application</a> may fix this problem.  If not please contact support: <%= supportHTML %>',
    mozAppsNotSupported: 'This browser or device does not support the Marketplace Apps system.'
  },

  respond: function (verifier) {
    this.verifier = verifier;
    if (verifier.state instanceof verifier.states.VerificationIncomplete) {
      if (window.console && console.log) {
        console.log('Prompter called with verifier', verifier, 'before verification complete');
        if (console.trace) {
          console.track();
        }
      }
      throw 'Prompter called before verification complete';
    }
    if (verifier.state instanceof verifier.states.OK ||
        verifier.state instanceof verifier.states.NetworkError) {
      return;
    }
    if (verifier.state instanceof verifier.states.MozAppsNotSupported) {
      this.handleMozAppsNotSupported(verifier);
      return;
    }
    if (verifier.state instanceof verifier.states.InternalError) {
      if (this.ignoreInternalError) {
        return;
      }
      this.handleInternalError(verifier);
      return;
    }
    // FIXME: we need an option for rejecting a stale cache here
    if (verifier.state instanceof verifier.states.NeedsInstall) {
      this.handleInstall(verifier);
      return;
    }
    if (verifier.state instanceof verifier.states.NoValidReceipts) {
      var bestReason = null;
      verifier.iterReceiptErrors(function (receipt, error) {
        if (bestReason === null) {
          bestReason = error;
        } else if (bestReason instanceof verifier.states.NetworkError) {
          bestReason = error;
        }
      });
      this.handleReceiptError(verifier, bestReason);
      return;
    }
    if (window.console && console.log) {
      console.log('Unexpected state: ' + verifier.state);
    }
    throw 'Unexpected state in verifier: ' + verifier.state;
  },

  handleMozAppsNotSupported: function (verifier) {
    var blocking = ! this.allowNoInstall;
    this.display(this.render(this.templates.mozAppsNotSupported), blocking);
  },

  handleInternalError: function (verifier) {
    if (this.fatalInternalError) {
      this.display(this.render(this.templates.fatalInternalError), true);
    } else {
      this.display(this.render(this.templates.internalError), false);
    }
  },

  handleInstall: function (verifier) {
    var blocking = ! this.allowNoInstall;
    if (this.allowNoInstall && verifier.state instanceof verifier.states.NoReceipts) {
      // In this case, we don't care at all - they installed the app for free
      return;
    }
    var template = this.templates.storeInstall;
    var message = this.render(template);
    this.display(message, blocking);
  },

  handleReceiptError: function (verifier, error) {
    this.error = error;
    if (error instanceof verifier.errors.Refunded) {
      var template = this.templates.refunded;
    } else if (error instanceof verifier.errors.InvalidReceiptIssuer) {
      var template = this.templates.invalidReceiptIssuer;
    } else if (error instanceof verifier.errors.InvalidFromStore) {
      var template = this.templates.invalidFromStore;
    } else if (error instanceof verifier.errors.ReceiptFormatError) {
      var template = this.templates.receiptFormatError;
    } else {
      var template = this.templates.genericError;
    }
    var message = this.render(template);
    this.display(message, ! this.allowNoInstall);
  },

  // UI related functions:


  overlayId: 'moz-receiptverifier-overlay',

  // FIXME: you can still scroll the background
  // FIXME: the message box is slightly transparent
  // FIXME: excessive box-shadow?
  // FIXME: the X in the close button is off-center
  generalStyle:
  '#OVERLAYID-message,#OVERLAYID-message *,#OVERLAYID-message a:hover,#OVERLAYID-message a:visited,#OVERLAYID-message a:active {\n' +
  '  bottom:auto;clear:none;cursor:default;font-family:Helvetica,Arial,sans-serif;font-size:medium;font-style:normal;font-weight:normal;' +
  '  height:auto;left:auto;letter-spacing:normal;line-height:1.4;max-height:none;max-width:none;min-height:0;min-width:0;overflow:visible;' +
  '  right:auto;text-align:left;text-decoration:none;text-indent:0;text-transform:none;top:auto;visibility:visible;white-space:normal;' +
  '  width:auto;z-index:auto;\n' +
  '}\n' +
  '#OVERLAYID-message a {color: #00f;}\n' +
  '#OVERLAYID-message a:visited {color:#a0f;}\n' +
  '#OVERLAYID-message a:hover {text-decoration:underline;}\n' +
  '#OVERLAYID {\n' +
  '  position:fixed;top:0;left:0;z-index:9999;background:#000;opacity:0.85;width:100%;height:100%;\n' +
  '}\n' +
  '#OVERLAYID-message {\n' +
  '  z-index:1000;position:fixed;top:100px;left:50%;margin-left:-200px;width:400px;padding:0.75em 1em 0.75em 1em;' +
  '  border:3px solid #ccc;background:#fff;opacity:1.0;color:#000;border-radius:1em;\n' +
  '}\n' +
  '#OVERLAYID-close {\n' +
  '  display:block;position:fixed;top:91px;left:50%;margin-left:227px;z-index:1001;height:0;width:18px;padding:18px 0 0 0;' +
  '  overflow:hidden;background:#000 none;border:2px solid #fff;border-radius:18px;' +
  '  box-shadow:0 0 6px #000,1.6px 1.6px 1.6px rgba(0,0,0,0.3),-1.6px 1.6px 1.6px rgba(0,0,0,0.3),1.6px -1.6px 1.6px rgba(0,0,0,0.3),-1.6px -1.6px 1.6px rgba(0,0,0,0.3);' +
  '  color:#fff;cursor:pointer;user-select:none;\n' +
  '}\n' +
  '#OVERLAYID-close-text {\n' +
  '  display:block;text-align:center;width:18px;top:0px;left:0px;position:absolute;font-size:18px;line-height:18px;\n' +
  '}\n',

  createOverlay: function (blocking) {
    this.removeOverlay();
    this.addStyle();
    this.blocking = blocking;
    this.overlay = $(document.createElement('div'));
    this.overlay.attr({
      id: this.overlayId
    });
    this.message = $(document.createElement('div'));
    this.message.attr({
      id: this.overlayId + '-message'
    });
    this.overlay[0].appendChild(this.message[0]);
    if (! blocking) {
      this.close = $(document.createElement('div'));
      this.close.attr({
        id: this.overlayId + '-close'
      });
      var inner = $(document.createElement('div'));
      inner.attr({
        id: this.overlayId + '-close-text'
      });
      inner[0].appendChild(document.createTextNode('\xd7'));
      this.close[0].appendChild(inner[0]);
      this.overlay[0].appendChild(this.close[0]);
    }
    $('body').css({'z-index': '-1'})[0].appendChild(this.overlay[0]);
    var self = this;
    function tryCancel() {
      if (self.blocking) {
        self.flash();
      } else {
        self.removeOverlay();
      }
    }
    this.overlay.on('click', function (ev) {
      var target = ev.target;
      while (target) {
        if (self.message && target == self.message[0]) {
          return;
        }
        if (self.overlay && target == self.overlay[0]) {
          break;
        }
        target = target.parentNode;
      }
      tryCancel();
    });
    if (this.close) {
      this.close.on('click', function () {
        tryCancel();
      });
    }
    $(document).on('keypress', function (ev) {
      if (ev.keyCode == 27) {
        tryCancel();
      }
    });
  },

  // FIXME: for some reason this doesn't flash properly, but will if
  // you change tabs?
  flash: function () {
    if (! this.message) {
      return;
    }
    this.message.css({border: '3px solid #f00'});
    var self = this;
    setTimeout(function () {
      if (self.message) {
        self.message.css({border: '3px solid #ccc'});
      }
    }, 2000);
  },

  removeOverlay: function () {
    var existing = $('#' + this.overlayId)[0];
    if (existing) {
      existing.parentNode.removeChild(existing);
    }
    this.overlay = null;
    this.message = null;
    this.close = null;
  },

  addStyle: function () {
    var id = this.overlayId + '-style';
    var existing = $('#' + id);
    if (existing[0]) {
      return;
    }
    var el = document.createElement('style');
    el.id = id;
    el.setAttribute('type', 'text/css');
    var style = this.generalStyle;
    style = style.replace(/OVERLAYID/g, this.overlayId);
    el.appendChild(document.createTextNode(style));
    document.head.appendChild(el);
  },

  display: function (htmlMessage, blocking) {
    if (! this.message) {
      // FIXME: closeable might be lost
      this.createOverlay(blocking);
    }
    this.message[0].innerHTML = htmlMessage;
  },

  quote: function (text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&gt;').replace(/"/g, '&quot;');
  },

  _templateCache: {},

  render: function (template, data) {
    // From http://ejohn.org/blog/javascript-micro-templating/
    data = data || this;
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    if (this._templateCache[template]) {
      var fn = this._templateCache[template];
    } else {
      var fn =
        // Generate a reusable function that will serve as a template
        // generator (and which will be cached).
        new Function("obj",
          "var p=[],print=function(){p.push.apply(p,arguments);};" +

          // Introduce the data as local variables using with(){}
          "with(obj){p.push('" +

          // Convert the template into pure JavaScript
          template
            .replace(/[\r\t\n]/g, " ")
            .split("<%").join("\t")
            .replace(/((^|%>)[^\t]*)'/g, "$1\r")
            .replace(/\t=(.*?)%>/g, "',$1,'")
            .split("\t").join("');")
            .split("%>").join("p.push('")
            .split("\r").join("\\'")
        + "');}return p.join('');");
      this._templateCache[template] = fn;
    }
    return fn(data);
  }

};

exports.receipts.Prompter = Prompter;

})(typeof exports == "undefined" ? (this.mozmarket ? this.mozmarket : this.mozmarket = {}) : exports);
