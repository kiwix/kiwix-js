
var XZ = (function () {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  
  return (
function(XZ) {
  XZ = XZ || {};


var a;a||(a=typeof XZ !== 'undefined' ? XZ : {});var e,f;a.ready=new Promise(function(b,c){e=b;f=c});var h={},k;for(k in a)a.hasOwnProperty(k)&&(h[k]=a[k]);var m="";"undefined"!==typeof document&&document.currentScript&&(m=document.currentScript.src);_scriptDir&&(m=_scriptDir);0!==m.indexOf("blob:")?m=m.substr(0,m.lastIndexOf("/")+1):m="";var n=a.printErr||console.warn.bind(console);for(k in h)h.hasOwnProperty(k)&&(a[k]=h[k]);h=null;var p;a.wasmBinary&&(p=a.wasmBinary);
var noExitRuntime=a.noExitRuntime||!0;"object"!==typeof WebAssembly&&q("no native wasm support detected");var r,t=!1,u,v,w=[],x=[],z=[];function A(){var b=a.preRun.shift();w.unshift(b)}var B=0,C=null,D=null;a.preloadedImages={};a.preloadedAudios={};function q(b){if(a.onAbort)a.onAbort(b);n(b);t=!0;b=new WebAssembly.RuntimeError("abort("+b+"). Build with -s ASSERTIONS=1 for more info.");f(b);throw b;}function E(){return F.startsWith("data:application/octet-stream;base64,")}var F;F="xzdec-wasm.wasm";
if(!E()){var G=F;F=a.locateFile?a.locateFile(G,m):m+G}function H(){var b=F;try{if(b==F&&p)return new Uint8Array(p);throw"both async and sync fetching of the wasm failed";}catch(c){q(c)}}function I(){return p||"function"!==typeof fetch?Promise.resolve().then(function(){return H()}):fetch(F,{credentials:"same-origin"}).then(function(b){if(!b.ok)throw"failed to load wasm binary file at '"+F+"'";return b.arrayBuffer()}).catch(function(){return H()})}
function J(b){for(;0<b.length;){var c=b.shift();if("function"==typeof c)c(a);else{var g=c.u;"number"===typeof g?void 0===c.s?v.get(g)():v.get(g)(c.s):g(void 0===c.s?null:c.s)}}}var K={a:function(b,c,g){u.copyWithin(b,c,c+g)},b:function(){q("OOM")}};
(function(){function b(d){a.asm=d.exports;r=a.asm.c;d=r.buffer;a.HEAP8=new Int8Array(d);a.HEAP16=new Int16Array(d);a.HEAP32=new Int32Array(d);a.HEAPU8=u=new Uint8Array(d);a.HEAPU16=new Uint16Array(d);a.HEAPU32=new Uint32Array(d);a.HEAPF32=new Float32Array(d);a.HEAPF64=new Float64Array(d);v=a.asm.o;x.unshift(a.asm.d);B--;a.monitorRunDependencies&&a.monitorRunDependencies(B);0==B&&(null!==C&&(clearInterval(C),C=null),D&&(d=D,D=null,d()))}function c(d){b(d.instance)}function g(d){return I().then(function(l){return WebAssembly.instantiate(l,
y)}).then(d,function(l){n("failed to asynchronously prepare wasm: "+l);q(l)})}var y={a:K};B++;a.monitorRunDependencies&&a.monitorRunDependencies(B);if(a.instantiateWasm)try{return a.instantiateWasm(y,b)}catch(d){return n("Module.instantiateWasm callback failed with error: "+d),!1}(function(){return p||"function"!==typeof WebAssembly.instantiateStreaming||E()||"function"!==typeof fetch?g(c):fetch(F,{credentials:"same-origin"}).then(function(d){return WebAssembly.instantiateStreaming(d,y).then(c,function(l){n("wasm streaming compile failed: "+
l);n("falling back to ArrayBuffer instantiation");return g(c)})})})().catch(f);return{}})();a.___wasm_call_ctors=function(){return(a.___wasm_call_ctors=a.asm.d).apply(null,arguments)};a._init=function(){return(a._init=a.asm.e).apply(null,arguments)};a._init_decompression=function(){return(a._init_decompression=a.asm.f).apply(null,arguments)};a._input_empty=function(){return(a._input_empty=a.asm.g).apply(null,arguments)};a._get_in_buffer=function(){return(a._get_in_buffer=a.asm.h).apply(null,arguments)};
a._set_new_input=function(){return(a._set_new_input=a.asm.i).apply(null,arguments)};a._decompress=function(){return(a._decompress=a.asm.j).apply(null,arguments)};a._get_out_pos=function(){return(a._get_out_pos=a.asm.k).apply(null,arguments)};a._get_out_buffer=function(){return(a._get_out_buffer=a.asm.l).apply(null,arguments)};a._out_buffer_cleared=function(){return(a._out_buffer_cleared=a.asm.m).apply(null,arguments)};a._release=function(){return(a._release=a.asm.n).apply(null,arguments)};var L;
D=function M(){L||N();L||(D=M)};
function N(){function b(){if(!L&&(L=!0,a.calledRun=!0,!t)){J(x);e(a);if(a.onRuntimeInitialized)a.onRuntimeInitialized();if(a.postRun)for("function"==typeof a.postRun&&(a.postRun=[a.postRun]);a.postRun.length;){var c=a.postRun.shift();z.unshift(c)}J(z)}}if(!(0<B)){if(a.preRun)for("function"==typeof a.preRun&&(a.preRun=[a.preRun]);a.preRun.length;)A();J(w);0<B||(a.setStatus?(a.setStatus("Running..."),setTimeout(function(){setTimeout(function(){a.setStatus("")},1);b()},1)):b())}}a.run=N;
if(a.preInit)for("function"==typeof a.preInit&&(a.preInit=[a.preInit]);0<a.preInit.length;)a.preInit.pop()();N();


  return XZ.ready
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
  module.exports = XZ;
else if (typeof define === 'function' && define['amd'])
  define([], function() { return XZ; });
else if (typeof exports === 'object')
  exports["XZ"] = XZ;
