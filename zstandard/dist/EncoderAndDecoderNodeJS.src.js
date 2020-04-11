(function(global){
  "use strict";
  // In this NodeJS version, Buffers are supported and used as fallback in versions that do not support Typed Arrays
  var log = Math.log;
  var LN2 = Math.LN2;
  var clz32 = Math.clz32 || function(x) {return 31 - log(x >>> 0) / LN2 | 0};
  var fromCharCode = String["fromCharCode"];
  var Object_prototype_toString = ({})["toString"];
  
  var NativeSharedArrayBuffer = global["SharedArrayBuffer"];
  var sharedArrayBufferString = NativeSharedArrayBuffer ? Object_prototype_toString.call(NativeSharedArrayBuffer) : "";
  var NativeUint8Array = global["Uint8Array"];
  var arrayBufferPrototypeString = NativeUint8Array ? Object_prototype_toString.call(ArrayBuffer.prototype) : "";
  var NativeBuffer = global["Buffer"];
  try {
    if (!NativeBuffer && global["require"]) NativeBuffer=global["require"]("Buffer");
    var NativeBufferPrototype = NativeBuffer.prototype;
  	var globalBufferPrototypeString = NativeBuffer ? Object_prototype_toString.call(NativeBufferPrototype) : "";
  } catch(e){}
  var usingTypedArrays = !!NativeUint8Array && !NativeBuffer;
  
  // NativeBufferHasArrayBuffer is true if there is no global.Buffer or if native global.Buffer instances have a Buffer property for the internal ArrayBuffer
  var NativeBufferHasArrayBuffer = !NativeBuffer || (!!NativeUint8Array && NativeUint8Array.prototype.isPrototypeOf(NativeBufferPrototype));
  
  if (usingTypedArrays || NativeBuffer) {
    function decoderReplacer(encoded){
      var codePoint = encoded.charCodeAt(0) << 24;
      var leadingOnes = clz32(~codePoint)|0;
      var endPos = 0, stringLen = encoded.length|0;
      var result = "";
      if (leadingOnes < 5 && stringLen >= leadingOnes) {
        codePoint = (codePoint<<leadingOnes)>>>(24+leadingOnes);
        for (endPos = 1; endPos < leadingOnes; endPos=endPos+1|0)
          codePoint = (codePoint<<6) | (encoded.charCodeAt(endPos)&0x3f/*0b00111111*/);
        if (codePoint <= 0xFFFF) { // BMP code point
          result += fromCharCode(codePoint);
        } else if (codePoint <= 0x10FFFF) {
          // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          codePoint = codePoint - 0x10000|0;
          result += fromCharCode(
            (codePoint >> 10) + 0xD800|0,  // highSurrogate
            (codePoint & 0x3ff) + 0xDC00|0 // lowSurrogate
          );
        } else endPos = 0; // to fill it in with INVALIDs
      }
      for (; endPos < stringLen; endPos=endPos+1|0) result += "\ufffd"; // replacement character
      return result;
    }
    /** @constructor */
    function TextDecoder(){}
    function decode(inputArrayOrBuffer){
      var buffer = (inputArrayOrBuffer && inputArrayOrBuffer.buffer) || inputArrayOrBuffer;
      var asString = Object_prototype_toString.call(buffer);
      if (asString !== arrayBufferPrototypeString && asString !== globalBufferPrototypeString && asString !== sharedArrayBufferString && asString !== "[object ArrayBuffer]" && inputArrayOrBuffer !== undefined)
        throw TypeError("Failed to execute 'decode' on 'TextDecoder': The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
      var inputAs8 = NativeBufferHasArrayBuffer ? new NativeUint8Array(buffer) : buffer || [];
      var resultingString = "";
      var index=0,len=inputAs8.length|0;
      for (; index<len; index=index+32768|0)
        resultingString += fromCharCode.apply(0, inputAs8[NativeBufferHasArrayBuffer ? "subarray" : "slice"](index,index+32768|0));

      return resultingString.replace(/[\xc0-\xff][\x80-\xbf]*/g, decoderReplacer);
    }
    TextDecoder.prototype["decode"] = decode;
    //////////////////////////////////////////////////////////////////////////////////////
    function encoderReplacer(nonAsciiChars){
      // make the UTF string into a binary UTF-8 encoded string
      var point = nonAsciiChars.charCodeAt(0)|0;
      if (point >= 0xD800 && point <= 0xDBFF) {
        var nextcode = nonAsciiChars.charCodeAt(1)|0;
        if (nextcode !== nextcode) // NaN because string is 1 code point long
          return fromCharCode(0xef/*11101111*/, 0xbf/*10111111*/, 0xbd/*10111101*/);
        // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        if (nextcode >= 0xDC00 && nextcode <= 0xDFFF) {
          point = ((point - 0xD800)<<10) + nextcode - 0xDC00 + 0x10000|0;
          if (point > 0xffff)
            return fromCharCode(
              (0x1e/*0b11110*/<<3) | (point>>>18),
              (0x2/*0b10*/<<6) | ((point>>>12)&0x3f/*0b00111111*/),
              (0x2/*0b10*/<<6) | ((point>>>6)&0x3f/*0b00111111*/),
              (0x2/*0b10*/<<6) | (point&0x3f/*0b00111111*/)
            );
        } else return fromCharCode(0xef, 0xbf, 0xbd);
      }
      if (point <= 0x007f) return nonAsciiChars;
      else if (point <= 0x07ff) {
        return fromCharCode((0x6<<5)|(point>>>6), (0x2<<6)|(point&0x3f));
      } else return fromCharCode(
        (0xe/*0b1110*/<<4) | (point>>>12),
        (0x2/*0b10*/<<6) | ((point>>>6)&0x3f/*0b00111111*/),
        (0x2/*0b10*/<<6) | (point&0x3f/*0b00111111*/)
      );
    }
    /** @constructor */
    function TextEncoder(){}
    function encode(inputString){
      // 0xc0 => 0b11000000; 0xff => 0b11111111; 0xc0-0xff => 0b11xxxxxx
      // 0x80 => 0b10000000; 0xbf => 0b10111111; 0x80-0xbf => 0b10xxxxxx
      var encodedString = inputString === void 0 ?  "" : ("" + inputString).replace(/[\x80-\uD7ff\uDC00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]?/g, encoderReplacer);
      var len=encodedString.length|0, result = usingTypedArrays ? new NativeUint8Array(len) : NativeBuffer["allocUnsafe"] ? NativeBuffer["allocUnsafe"](len) : new NativeBuffer(len);
      var i=0;
      for (; i<len; i=i+1|0)
        result[i] = encodedString.charCodeAt(i)|0;
      return result;
    }
    TextEncoder.prototype["encode"] = encode;
    
	function bindMethod(inst, name, _) {
		_ = inst[name];
		return function() {
			_.apply(inst, arguments);
		};
	}

	var GlobalTextEncoder = global["TextEncoder"];
	var GlobalTextDecoder = global["TextDecoder"];
    
    function factory(obj) {
        obj["TextEncoder"] = GlobalTextEncoder || TextEncoder;
        obj["TextDecoder"] = GlobalTextDecoder || TextDecoder;
        if (obj !== global) {
        	obj["encode"] = GlobalTextEncoder ? bindMethod(new GlobalTextEncoder, "encode") : encode;
        	obj["decode"] = GlobalTextDecoder ? bindMethod(new GlobalTextDecoder, "decode") : decode;
        }
        return obj;
    }
	
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(module["exports"]) :
		typeof define == typeof factory && define["amd"] ? define(function(){
		    return factory({});
		}) :
		factory(global);
  }
})(typeof global == "" + void 0 ? typeof self == "" + void 0 ? this || {} : self : global);