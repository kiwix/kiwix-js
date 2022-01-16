
var ZD = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  
  return (
function(ZD) {
  ZD = ZD || {};


var a;a||(a=typeof ZD !== 'undefined' ? ZD : {});var q,r;a.ready=new Promise(function(b,c){q=b;r=c});var t={},w;for(w in a)a.hasOwnProperty(w)&&(t[w]=a[w]);var x="";"undefined"!==typeof document&&document.currentScript&&(x=document.currentScript.src);_scriptDir&&(x=_scriptDir);0!==x.indexOf("blob:")?x=x.substr(0,x.lastIndexOf("/")+1):x="";var y=a.printErr||console.warn.bind(console);for(w in t)t.hasOwnProperty(w)&&(a[w]=t[w]);t=null;var z;a.wasmBinary&&(z=a.wasmBinary);
var noExitRuntime=a.noExitRuntime||!0;"object"!==typeof WebAssembly&&A("no native wasm support detected");var B,C=!1;function D(b){var c=a["_"+b];c||A("Assertion failed: Cannot call unknown function "+(b+", make sure it is exported"));return c}
function aa(b,c,g,n){var e={string:function(d){var m=0;if(null!==d&&void 0!==d&&0!==d){var l=(d.length<<2)+1;m=E(l);var h=m,f=F;if(0<l){l=h+l-1;for(var u=0;u<d.length;++u){var k=d.charCodeAt(u);if(55296<=k&&57343>=k){var ba=d.charCodeAt(++u);k=65536+((k&1023)<<10)|ba&1023}if(127>=k){if(h>=l)break;f[h++]=k}else{if(2047>=k){if(h+1>=l)break;f[h++]=192|k>>6}else{if(65535>=k){if(h+2>=l)break;f[h++]=224|k>>12}else{if(h+3>=l)break;f[h++]=240|k>>18;f[h++]=128|k>>12&63}f[h++]=128|k>>6&63}f[h++]=128|k&63}}f[h]=
0}}return m},array:function(d){var m=E(d.length);H.set(d,m);return m}},p=D(b),G=[];b=0;if(n)for(var v=0;v<n.length;v++){var Q=e[g[v]];Q?(0===b&&(b=I()),G[v]=Q(n[v])):G[v]=n[v]}g=p.apply(null,G);g=function(d){if("string"===c)if(d){for(var m=F,l=d+NaN,h=d;m[h]&&!(h>=l);)++h;if(16<h-d&&m.subarray&&J)d=J.decode(m.subarray(d,h));else{for(l="";d<h;){var f=m[d++];if(f&128){var u=m[d++]&63;if(192==(f&224))l+=String.fromCharCode((f&31)<<6|u);else{var k=m[d++]&63;f=224==(f&240)?(f&15)<<12|u<<6|k:(f&7)<<18|
u<<12|k<<6|m[d++]&63;65536>f?l+=String.fromCharCode(f):(f-=65536,l+=String.fromCharCode(55296|f>>10,56320|f&1023))}}else l+=String.fromCharCode(f)}d=l}}else d="";else d="boolean"===c?!!d:d;return d}(g);0!==b&&K(b);return g}var J="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0,H,F,L,M=[],N=[],O=[];function ca(){var b=a.preRun.shift();M.unshift(b)}var P=0,R=null,S=null;a.preloadedImages={};a.preloadedAudios={};
function A(b){if(a.onAbort)a.onAbort(b);y(b);C=!0;b=new WebAssembly.RuntimeError("abort("+b+"). Build with -s ASSERTIONS=1 for more info.");r(b);throw b;}function T(){return U.startsWith("data:application/octet-stream;base64,")}var U;U="zstddec-wasm.wasm";if(!T()){var V=U;U=a.locateFile?a.locateFile(V,x):x+V}function W(){var b=U;try{if(b==U&&z)return new Uint8Array(z);throw"both async and sync fetching of the wasm failed";}catch(c){A(c)}}
function da(){return z||"function"!==typeof fetch?Promise.resolve().then(function(){return W()}):fetch(U,{credentials:"same-origin"}).then(function(b){if(!b.ok)throw"failed to load wasm binary file at '"+U+"'";return b.arrayBuffer()}).catch(function(){return W()})}function X(b){for(;0<b.length;){var c=b.shift();if("function"==typeof c)c(a);else{var g=c.u;"number"===typeof g?void 0===c.s?L.get(g)():L.get(g)(c.s):g(void 0===c.s?null:c.s)}}}var ea={a:function(b,c,g){F.copyWithin(b,c,c+g)},b:function(){A("OOM")}};
(function(){function b(e){a.asm=e.exports;B=a.asm.c;e=B.buffer;a.HEAP8=H=new Int8Array(e);a.HEAP16=new Int16Array(e);a.HEAP32=new Int32Array(e);a.HEAPU8=F=new Uint8Array(e);a.HEAPU16=new Uint16Array(e);a.HEAPU32=new Uint32Array(e);a.HEAPF32=new Float32Array(e);a.HEAPF64=new Float64Array(e);L=a.asm.o;N.unshift(a.asm.d);P--;a.monitorRunDependencies&&a.monitorRunDependencies(P);0==P&&(null!==R&&(clearInterval(R),R=null),S&&(e=S,S=null,e()))}function c(e){b(e.instance)}function g(e){return da().then(function(p){return WebAssembly.instantiate(p,
n)}).then(e,function(p){y("failed to asynchronously prepare wasm: "+p);A(p)})}var n={a:ea};P++;a.monitorRunDependencies&&a.monitorRunDependencies(P);if(a.instantiateWasm)try{return a.instantiateWasm(n,b)}catch(e){return y("Module.instantiateWasm callback failed with error: "+e),!1}(function(){return z||"function"!==typeof WebAssembly.instantiateStreaming||T()||"function"!==typeof fetch?g(c):fetch(U,{credentials:"same-origin"}).then(function(e){return WebAssembly.instantiateStreaming(e,n).then(c,function(p){y("wasm streaming compile failed: "+
p);y("falling back to ArrayBuffer instantiation");return g(c)})})})().catch(r);return{}})();a.___wasm_call_ctors=function(){return(a.___wasm_call_ctors=a.asm.d).apply(null,arguments)};a._malloc=function(){return(a._malloc=a.asm.e).apply(null,arguments)};a._free=function(){return(a._free=a.asm.f).apply(null,arguments)};a._ZSTD_isError=function(){return(a._ZSTD_isError=a.asm.g).apply(null,arguments)};a._ZSTD_getErrorName=function(){return(a._ZSTD_getErrorName=a.asm.h).apply(null,arguments)};
a._ZSTD_createDStream=function(){return(a._ZSTD_createDStream=a.asm.i).apply(null,arguments)};a._ZSTD_freeDStream=function(){return(a._ZSTD_freeDStream=a.asm.j).apply(null,arguments)};a._ZSTD_DStreamInSize=function(){return(a._ZSTD_DStreamInSize=a.asm.k).apply(null,arguments)};a._ZSTD_DStreamOutSize=function(){return(a._ZSTD_DStreamOutSize=a.asm.l).apply(null,arguments)};a._ZSTD_initDStream=function(){return(a._ZSTD_initDStream=a.asm.m).apply(null,arguments)};
a._ZSTD_decompressStream=function(){return(a._ZSTD_decompressStream=a.asm.n).apply(null,arguments)};var I=a.stackSave=function(){return(I=a.stackSave=a.asm.p).apply(null,arguments)},K=a.stackRestore=function(){return(K=a.stackRestore=a.asm.q).apply(null,arguments)},E=a.stackAlloc=function(){return(E=a.stackAlloc=a.asm.r).apply(null,arguments)};a.cwrap=function(b,c,g,n){g=g||[];var e=g.every(function(p){return"number"===p});return"string"!==c&&e&&!n?D(b):function(){return aa(b,c,g,arguments)}};var Y;
S=function fa(){Y||Z();Y||(S=fa)};
function Z(){function b(){if(!Y&&(Y=!0,a.calledRun=!0,!C)){X(N);q(a);if(a.onRuntimeInitialized)a.onRuntimeInitialized();if(a.postRun)for("function"==typeof a.postRun&&(a.postRun=[a.postRun]);a.postRun.length;){var c=a.postRun.shift();O.unshift(c)}X(O)}}if(!(0<P)){if(a.preRun)for("function"==typeof a.preRun&&(a.preRun=[a.preRun]);a.preRun.length;)ca();X(M);0<P||(a.setStatus?(a.setStatus("Running..."),setTimeout(function(){setTimeout(function(){a.setStatus("")},1);b()},1)):b())}}a.run=Z;
if(a.preInit)for("function"==typeof a.preInit&&(a.preInit=[a.preInit]);0<a.preInit.length;)a.preInit.pop()();Z();


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
