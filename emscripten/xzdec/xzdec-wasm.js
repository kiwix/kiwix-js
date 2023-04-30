
var XZ = (() => {
  var _scriptDir = import.meta.url;
  
  return (
function(XZ = {})  {

var a;a||(a=typeof XZ !== 'undefined' ? XZ : {});var f,g;a.ready=new Promise((b,c)=>{f=b;g=c});var h=Object.assign({},a),k="";"undefined"!=typeof document&&document.currentScript&&(k=document.currentScript.src);_scriptDir&&(k=_scriptDir);0!==k.indexOf("blob:")?k=k.substr(0,k.replace(/[?#].*/,"").lastIndexOf("/")+1):k="";var l=a.printErr||console.warn.bind(console);Object.assign(a,h);h=null;var m;a.wasmBinary&&(m=a.wasmBinary);var noExitRuntime=a.noExitRuntime||!0;
"object"!=typeof WebAssembly&&n("no native wasm support detected");var p,q=!1,r,t=[],u=[],v=[];function w(){var b=a.preRun.shift();t.unshift(b)}var x=0,y=null,z=null;function n(b){if(a.onAbort)a.onAbort(b);b="Aborted("+b+")";l(b);q=!0;b=new WebAssembly.RuntimeError(b+". Build with -sASSERTIONS for more info.");g(b);throw b;}function A(b){return b.startsWith("data:application/octet-stream;base64,")}var B;
if(a.locateFile){if(B="xzdec-wasm.wasm",!A(B)){var C=B;B=a.locateFile?a.locateFile(C,k):k+C}}else B=(new URL("xzdec-wasm.wasm",import.meta.url)).href;function D(b){try{if(b==B&&m)return new Uint8Array(m);throw"both async and sync fetching of the wasm failed";}catch(c){n(c)}}
function E(b){return m||"function"!=typeof fetch?Promise.resolve().then(()=>D(b)):fetch(b,{credentials:"same-origin"}).then(c=>{if(!c.ok)throw"failed to load wasm binary file at '"+b+"'";return c.arrayBuffer()}).catch(()=>D(b))}function F(b,c,e){return E(b).then(d=>WebAssembly.instantiate(d,c)).then(d=>d).then(e,d=>{l("failed to asynchronously prepare wasm: "+d);n(d)})}
function G(b,c){var e=B;return m||"function"!=typeof WebAssembly.instantiateStreaming||A(e)||"function"!=typeof fetch?F(e,b,c):fetch(e,{credentials:"same-origin"}).then(d=>WebAssembly.instantiateStreaming(d,b).then(c,function(K){l("wasm streaming compile failed: "+K);l("falling back to ArrayBuffer instantiation");return F(e,b,c)}))}function H(b){for(;0<b.length;)b.shift()(a)}var I={b:function(b,c,e){r.copyWithin(b,c,c+e)},a:function(){n("OOM")}};
(function(){function b(e){e=e.exports;a.asm=e;p=a.asm.c;var d=p.buffer;a.HEAP8=new Int8Array(d);a.HEAP16=new Int16Array(d);a.HEAP32=new Int32Array(d);a.HEAPU8=r=new Uint8Array(d);a.HEAPU16=new Uint16Array(d);a.HEAPU32=new Uint32Array(d);a.HEAPF32=new Float32Array(d);a.HEAPF64=new Float64Array(d);u.unshift(a.asm.d);x--;a.monitorRunDependencies&&a.monitorRunDependencies(x);0==x&&(null!==y&&(clearInterval(y),y=null),z&&(d=z,z=null,d()));return e}var c={a:I};x++;a.monitorRunDependencies&&a.monitorRunDependencies(x);
if(a.instantiateWasm)try{return a.instantiateWasm(c,b)}catch(e){l("Module.instantiateWasm callback failed with error: "+e),g(e)}G(c,function(e){b(e.instance)}).catch(g);return{}})();a._init=function(){return(a._init=a.asm.e).apply(null,arguments)};a._init_decompression=function(){return(a._init_decompression=a.asm.f).apply(null,arguments)};a._input_empty=function(){return(a._input_empty=a.asm.g).apply(null,arguments)};a._get_in_buffer=function(){return(a._get_in_buffer=a.asm.h).apply(null,arguments)};
a._set_new_input=function(){return(a._set_new_input=a.asm.i).apply(null,arguments)};a._decompress=function(){return(a._decompress=a.asm.j).apply(null,arguments)};a._get_out_pos=function(){return(a._get_out_pos=a.asm.k).apply(null,arguments)};a._get_out_buffer=function(){return(a._get_out_buffer=a.asm.l).apply(null,arguments)};a._out_buffer_cleared=function(){return(a._out_buffer_cleared=a.asm.m).apply(null,arguments)};a._release=function(){return(a._release=a.asm.n).apply(null,arguments)};var J;
z=function L(){J||M();J||(z=L)};
function M(){function b(){if(!J&&(J=!0,a.calledRun=!0,!q)){H(u);f(a);if(a.onRuntimeInitialized)a.onRuntimeInitialized();if(a.postRun)for("function"==typeof a.postRun&&(a.postRun=[a.postRun]);a.postRun.length;){var c=a.postRun.shift();v.unshift(c)}H(v)}}if(!(0<x)){if(a.preRun)for("function"==typeof a.preRun&&(a.preRun=[a.preRun]);a.preRun.length;)w();H(t);0<x||(a.setStatus?(a.setStatus("Running..."),setTimeout(function(){setTimeout(function(){a.setStatus("")},1);b()},1)):b())}}
if(a.preInit)for("function"==typeof a.preInit&&(a.preInit=[a.preInit]);0<a.preInit.length;)a.preInit.pop()();M();


  return XZ.ready
}

);
})();
export default XZ;