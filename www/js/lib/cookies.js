'use strict';
define([], function() {
/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path])
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

var storeType = testStorageSupport();

// Tests for cookie or localStorage support
function testStorageSupport() {
  var type = 'cookie';
  document.cookie = 'kiwixCookie=working;expires=Fri, 31 Dec 9999 23:59:59 GMT';
  var kiwixCookie = /kiwixCookie=working/i.test(document.cookie);
  if (kiwixCookie) {
    document.cookie = 'kiwixCookie=broken;expires=Fri, 31 Dec 9999 23:59:59 GMT';
    kiwixCookie = !/kiwixCookie=working/i.test(document.cookie);
  }
  document.cookie = 'kiwixCookie=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  // Test for localStorage support
  var localStorageTest = false;
  try {
    localStorageTest = 'localStorage' in window && window['localStorage'] !== null;
    localStorage.setItem('kiwixStorage', '');
    localStorage.removeItem('kiwixStorage');
  } catch (e) {
    localStorageTest = false;
    console.log('LocalStorage is not supported!');
  }
  if (localStorageTest) type = 'local_storage';
  console.log('Storage test: type: ' + type);
  return type;
}

var docCookies = {
  getItem: function (sKey) {
    if (storeType === 'cookie') {
    return unescape(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    } else {
      return localStorage.getItem(sKey);
    }
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (storeType === 'cookie') {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toGMTString();
          break;
      }
    }
    document.cookie = escape(sKey) + "=" + escape(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    } else {
      localStorage.setItem(sKey, sValue);
    }
    return true;
  },
  removeItem: function (sKey, sPath) {
    if (storeType === 'cookie') {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sPath ? "; path=" + sPath : "");
    } else {
      localStorage.removeItem(sKey);
    } 
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = unescape(aKeys[nIdx]); }
    return aKeys;
  }
};

  return {
    getItem: docCookies.getItem,
    setItem: docCookies.setItem,
    removeItem: docCookies.removeItem,
    hasItem: docCookies.hasItem,
    keys: docCookies.keys
  };
});