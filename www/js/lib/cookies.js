'use strict';
define([], function() {
/*\
|*|
|*|  :: settingsStore.js ::
|*|
|*|  A reader/writer framework for cookies or localStorage with full unicode support.
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

// Tests for localStorage or cookie support
function testStorageSupport() {
  // DEV: In FF extensions, cookies are blocked since at least FF 68.6 but possibly since FF 55 [kiwix-js #612]
  var type = 'none';
  // First test for localStorage API support
  var localStorageTest;
  try {
    localStorageTest = 'localStorage' in window && window['localStorage'] !== null;
    // DEV: Above test returns true in IE11 running from file:// protocol, but attempting to write a key to
    // localStorage causes an exception; so to test fully, we must now attempt to write and remove a test key
    if (localStorageTest) {
      localStorage.setItem('tempKiwixStorageTest', '');
      localStorage.removeItem('tempKiwixStorageTest');
    }
  } catch (e) {
    localStorageTest = false;
  }
  // Now test for document.cookie API support
  document.cookie = 'tempKiwixCookieTest=working;expires=Fri, 31 Dec 9999 23:59:59 GMT';
  var kiwixCookieTest = /tempKiwixCookieTest=working/.test(document.cookie);
  // Remove test value by expiring the key
  document.cookie = 'tempKiwixCookieTest=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  if (kiwixCookieTest) type = 'cookie';
  // Prefer localStorage if supported due to some platforms removing cookies once the session ends in some contexts
  if (localStorageTest) type = 'local_storage';
  // Update API panel with API name
  var settingsStoreStatusDiv = document.getElementById('settingsStoreStatus');
  var apiName = type === 'cookie' ? 'Cookie' : type === 'local_storage' ? 'Local Storage' : 'None';
  settingsStoreStatusDiv.innerHTML = 'Settings Storage API in use: ' + apiName;
  settingsStoreStatusDiv.classList.remove('apiAvailable', 'apiUnavailable');
  settingsStoreStatusDiv.classList.add(type === 'none' ? 'apiUnavailable' : 'apiAvailable');
  // To simplify code below, this function returns either 'local_storage' or 'cookie', but does not return 'none'
  // This is because setting a cookie key does not cause an exception even if it is not stored (e.g. in an Extension)
  return type;
}

var settingsStore = {
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
    if (storeType === 'cookie') {
      return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    } else {
      return localStorage.getItem(sKey) === null ? false : true;
    }
  }
};

  return {
    getItem: settingsStore.getItem,
    setItem: settingsStore.setItem,
    removeItem: settingsStore.removeItem,
    hasItem: settingsStore.hasItem
  };
});