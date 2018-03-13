Module["asm"] =  (/** @suppress {uselessCode} */ function(global, env, buffer) {
'almost asm';


  var Int8View = global.Int8Array;
  var HEAP8 = new Int8View(buffer);
  var Int16View = global.Int16Array;
  var HEAP16 = new Int16View(buffer);
  var Int32View = global.Int32Array;
  var HEAP32 = new Int32View(buffer);
  var Uint8View = global.Uint8Array;
  var HEAPU8 = new Uint8View(buffer);
  var Uint16View = global.Uint16Array;
  var HEAPU16 = new Uint16View(buffer);
  var Uint32View = global.Uint32Array;
  var HEAPU32 = new Uint32View(buffer);
  var Float32View = global.Float32Array;
  var HEAPF32 = new Float32View(buffer);
  var Float64View = global.Float64Array;
  var HEAPF64 = new Float64View(buffer);
  var byteLength = global.byteLength;

  var DYNAMICTOP_PTR=env.DYNAMICTOP_PTR|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntS = 0, tempValue = 0, tempDouble = 0.0;
  var tempRet0 = 0;

  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_max=global.Math.max;
  var Math_clz32=global.Math.clz32;
  var Math_fround=global.Math.fround;
  var abort=env.abort;
  var assert=env.assert;
  var enlargeMemory=env.enlargeMemory;
  var getTotalMemory=env.getTotalMemory;
  var abortOnCannotGrowMemory=env.abortOnCannotGrowMemory;
  var ___setErrNo=env.___setErrNo;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var tempFloat = Math_fround(0);
  const f0 = Math_fround(0);

function _emscripten_replace_memory(newBuffer) {
  if ((byteLength(newBuffer) & 0xffffff || byteLength(newBuffer) <= 0xffffff) || byteLength(newBuffer) > 0x80000000) return false;
  HEAP8 = new Int8View(newBuffer);
  HEAP16 = new Int16View(newBuffer);
  HEAP32 = new Int32View(newBuffer);
  HEAPU8 = new Uint8View(newBuffer);
  HEAPU16 = new Uint16View(newBuffer);
  HEAPU32 = new Uint32View(newBuffer);
  HEAPF32 = new Float32View(newBuffer);
  HEAPF64 = new Float64View(newBuffer);
  buffer = newBuffer;
  return true;
}

// EMSCRIPTEN_START_FUNCS

function _malloc(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i66 = 0, i67 = 0, i68 = 0, i69 = 0, i70 = 0, i71 = 0, i72 = 0, i73 = 0, i74 = 0, i75 = 0, i76 = 0, i77 = 0, i78 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i2;
 do if (i1 >>> 0 < 245) {
  i4 = i1 >>> 0 < 11 ? 16 : i1 + 11 & -8;
  i5 = i4 >>> 3;
  i6 = HEAP32[1029] | 0;
  i7 = i6 >>> i5;
  if (i7 & 3 | 0) {
   i8 = (i7 & 1 ^ 1) + i5 | 0;
   i9 = 4156 + (i8 << 1 << 2) | 0;
   i10 = i9 + 8 | 0;
   i11 = HEAP32[i10 >> 2] | 0;
   i12 = i11 + 8 | 0;
   i13 = HEAP32[i12 >> 2] | 0;
   if ((i13 | 0) == (i9 | 0)) HEAP32[1029] = i6 & ~(1 << i8); else {
    HEAP32[i13 + 12 >> 2] = i9;
    HEAP32[i10 >> 2] = i13;
   }
   i13 = i8 << 3;
   HEAP32[i11 + 4 >> 2] = i13 | 3;
   i8 = i11 + i13 + 4 | 0;
   HEAP32[i8 >> 2] = HEAP32[i8 >> 2] | 1;
   i14 = i12;
   STACKTOP = i2;
   return i14 | 0;
  }
  i12 = HEAP32[1031] | 0;
  if (i4 >>> 0 > i12 >>> 0) {
   if (i7 | 0) {
    i8 = 2 << i5;
    i13 = i7 << i5 & (i8 | 0 - i8);
    i8 = (i13 & 0 - i13) + -1 | 0;
    i13 = i8 >>> 12 & 16;
    i5 = i8 >>> i13;
    i8 = i5 >>> 5 & 8;
    i7 = i5 >>> i8;
    i5 = i7 >>> 2 & 4;
    i11 = i7 >>> i5;
    i7 = i11 >>> 1 & 2;
    i10 = i11 >>> i7;
    i11 = i10 >>> 1 & 1;
    i9 = (i8 | i13 | i5 | i7 | i11) + (i10 >>> i11) | 0;
    i11 = 4156 + (i9 << 1 << 2) | 0;
    i10 = i11 + 8 | 0;
    i7 = HEAP32[i10 >> 2] | 0;
    i5 = i7 + 8 | 0;
    i13 = HEAP32[i5 >> 2] | 0;
    if ((i13 | 0) == (i11 | 0)) {
     i8 = i6 & ~(1 << i9);
     HEAP32[1029] = i8;
     i15 = i8;
    } else {
     HEAP32[i13 + 12 >> 2] = i11;
     HEAP32[i10 >> 2] = i13;
     i15 = i6;
    }
    i13 = i9 << 3;
    i9 = i13 - i4 | 0;
    HEAP32[i7 + 4 >> 2] = i4 | 3;
    i10 = i7 + i4 | 0;
    HEAP32[i10 + 4 >> 2] = i9 | 1;
    HEAP32[i7 + i13 >> 2] = i9;
    if (i12 | 0) {
     i13 = HEAP32[1034] | 0;
     i7 = i12 >>> 3;
     i11 = 4156 + (i7 << 1 << 2) | 0;
     i8 = 1 << i7;
     if (!(i15 & i8)) {
      HEAP32[1029] = i15 | i8;
      i16 = i11;
      i17 = i11 + 8 | 0;
     } else {
      i8 = i11 + 8 | 0;
      i16 = HEAP32[i8 >> 2] | 0;
      i17 = i8;
     }
     HEAP32[i17 >> 2] = i13;
     HEAP32[i16 + 12 >> 2] = i13;
     HEAP32[i13 + 8 >> 2] = i16;
     HEAP32[i13 + 12 >> 2] = i11;
    }
    HEAP32[1031] = i9;
    HEAP32[1034] = i10;
    i14 = i5;
    STACKTOP = i2;
    return i14 | 0;
   }
   i5 = HEAP32[1030] | 0;
   if (!i5) i18 = i4; else {
    i10 = (i5 & 0 - i5) + -1 | 0;
    i9 = i10 >>> 12 & 16;
    i11 = i10 >>> i9;
    i10 = i11 >>> 5 & 8;
    i13 = i11 >>> i10;
    i11 = i13 >>> 2 & 4;
    i8 = i13 >>> i11;
    i13 = i8 >>> 1 & 2;
    i7 = i8 >>> i13;
    i8 = i7 >>> 1 & 1;
    i19 = HEAP32[4420 + ((i10 | i9 | i11 | i13 | i8) + (i7 >>> i8) << 2) >> 2] | 0;
    i8 = (HEAP32[i19 + 4 >> 2] & -8) - i4 | 0;
    i7 = HEAP32[i19 + 16 + (((HEAP32[i19 + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0;
    if (!i7) {
     i20 = i19;
     i21 = i8;
    } else {
     i13 = i19;
     i19 = i8;
     i8 = i7;
     while (1) {
      i7 = (HEAP32[i8 + 4 >> 2] & -8) - i4 | 0;
      i11 = i7 >>> 0 < i19 >>> 0;
      i9 = i11 ? i7 : i19;
      i7 = i11 ? i8 : i13;
      i8 = HEAP32[i8 + 16 + (((HEAP32[i8 + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0;
      if (!i8) {
       i20 = i7;
       i21 = i9;
       break;
      } else {
       i13 = i7;
       i19 = i9;
      }
     }
    }
    i19 = i20 + i4 | 0;
    if (i19 >>> 0 > i20 >>> 0) {
     i13 = HEAP32[i20 + 24 >> 2] | 0;
     i8 = HEAP32[i20 + 12 >> 2] | 0;
     do if ((i8 | 0) == (i20 | 0)) {
      i9 = i20 + 20 | 0;
      i7 = HEAP32[i9 >> 2] | 0;
      if (!i7) {
       i11 = i20 + 16 | 0;
       i10 = HEAP32[i11 >> 2] | 0;
       if (!i10) {
        i22 = 0;
        break;
       } else {
        i23 = i10;
        i24 = i11;
       }
      } else {
       i23 = i7;
       i24 = i9;
      }
      while (1) {
       i9 = i23 + 20 | 0;
       i7 = HEAP32[i9 >> 2] | 0;
       if (i7 | 0) {
        i23 = i7;
        i24 = i9;
        continue;
       }
       i9 = i23 + 16 | 0;
       i7 = HEAP32[i9 >> 2] | 0;
       if (!i7) break; else {
        i23 = i7;
        i24 = i9;
       }
      }
      HEAP32[i24 >> 2] = 0;
      i22 = i23;
     } else {
      i9 = HEAP32[i20 + 8 >> 2] | 0;
      HEAP32[i9 + 12 >> 2] = i8;
      HEAP32[i8 + 8 >> 2] = i9;
      i22 = i8;
     } while (0);
     do if (i13 | 0) {
      i8 = HEAP32[i20 + 28 >> 2] | 0;
      i9 = 4420 + (i8 << 2) | 0;
      if ((i20 | 0) == (HEAP32[i9 >> 2] | 0)) {
       HEAP32[i9 >> 2] = i22;
       if (!i22) {
        HEAP32[1030] = i5 & ~(1 << i8);
        break;
       }
      } else {
       HEAP32[i13 + 16 + (((HEAP32[i13 + 16 >> 2] | 0) != (i20 | 0) & 1) << 2) >> 2] = i22;
       if (!i22) break;
      }
      HEAP32[i22 + 24 >> 2] = i13;
      i8 = HEAP32[i20 + 16 >> 2] | 0;
      if (i8 | 0) {
       HEAP32[i22 + 16 >> 2] = i8;
       HEAP32[i8 + 24 >> 2] = i22;
      }
      i8 = HEAP32[i20 + 20 >> 2] | 0;
      if (i8 | 0) {
       HEAP32[i22 + 20 >> 2] = i8;
       HEAP32[i8 + 24 >> 2] = i22;
      }
     } while (0);
     if (i21 >>> 0 < 16) {
      i13 = i21 + i4 | 0;
      HEAP32[i20 + 4 >> 2] = i13 | 3;
      i5 = i20 + i13 + 4 | 0;
      HEAP32[i5 >> 2] = HEAP32[i5 >> 2] | 1;
     } else {
      HEAP32[i20 + 4 >> 2] = i4 | 3;
      HEAP32[i19 + 4 >> 2] = i21 | 1;
      HEAP32[i19 + i21 >> 2] = i21;
      if (i12 | 0) {
       i5 = HEAP32[1034] | 0;
       i13 = i12 >>> 3;
       i8 = 4156 + (i13 << 1 << 2) | 0;
       i9 = 1 << i13;
       if (!(i6 & i9)) {
        HEAP32[1029] = i6 | i9;
        i25 = i8;
        i26 = i8 + 8 | 0;
       } else {
        i9 = i8 + 8 | 0;
        i25 = HEAP32[i9 >> 2] | 0;
        i26 = i9;
       }
       HEAP32[i26 >> 2] = i5;
       HEAP32[i25 + 12 >> 2] = i5;
       HEAP32[i5 + 8 >> 2] = i25;
       HEAP32[i5 + 12 >> 2] = i8;
      }
      HEAP32[1031] = i21;
      HEAP32[1034] = i19;
     }
     i14 = i20 + 8 | 0;
     STACKTOP = i2;
     return i14 | 0;
    } else i18 = i4;
   }
  } else i18 = i4;
 } else if (i1 >>> 0 > 4294967231) i18 = -1; else {
  i8 = i1 + 11 | 0;
  i5 = i8 & -8;
  i9 = HEAP32[1030] | 0;
  if (!i9) i18 = i5; else {
   i13 = 0 - i5 | 0;
   i7 = i8 >>> 8;
   if (!i7) i27 = 0; else if (i5 >>> 0 > 16777215) i27 = 31; else {
    i8 = (i7 + 1048320 | 0) >>> 16 & 8;
    i11 = i7 << i8;
    i7 = (i11 + 520192 | 0) >>> 16 & 4;
    i10 = i11 << i7;
    i11 = (i10 + 245760 | 0) >>> 16 & 2;
    i28 = 14 - (i7 | i8 | i11) + (i10 << i11 >>> 15) | 0;
    i27 = i5 >>> (i28 + 7 | 0) & 1 | i28 << 1;
   }
   i28 = HEAP32[4420 + (i27 << 2) >> 2] | 0;
   L74 : do if (!i28) {
    i29 = 0;
    i30 = 0;
    i31 = i13;
    i32 = 57;
   } else {
    i11 = 0;
    i10 = i13;
    i8 = i28;
    i7 = i5 << ((i27 | 0) == 31 ? 0 : 25 - (i27 >>> 1) | 0);
    i33 = 0;
    while (1) {
     i34 = (HEAP32[i8 + 4 >> 2] & -8) - i5 | 0;
     if (i34 >>> 0 < i10 >>> 0) if (!i34) {
      i35 = 0;
      i36 = i8;
      i37 = i8;
      i32 = 61;
      break L74;
     } else {
      i38 = i8;
      i39 = i34;
     } else {
      i38 = i11;
      i39 = i10;
     }
     i34 = HEAP32[i8 + 20 >> 2] | 0;
     i8 = HEAP32[i8 + 16 + (i7 >>> 31 << 2) >> 2] | 0;
     i40 = (i34 | 0) == 0 | (i34 | 0) == (i8 | 0) ? i33 : i34;
     i34 = (i8 | 0) == 0;
     if (i34) {
      i29 = i40;
      i30 = i38;
      i31 = i39;
      i32 = 57;
      break;
     } else {
      i11 = i38;
      i10 = i39;
      i7 = i7 << ((i34 ^ 1) & 1);
      i33 = i40;
     }
    }
   } while (0);
   if ((i32 | 0) == 57) {
    if ((i29 | 0) == 0 & (i30 | 0) == 0) {
     i28 = 2 << i27;
     i13 = i9 & (i28 | 0 - i28);
     if (!i13) {
      i18 = i5;
      break;
     }
     i28 = (i13 & 0 - i13) + -1 | 0;
     i13 = i28 >>> 12 & 16;
     i4 = i28 >>> i13;
     i28 = i4 >>> 5 & 8;
     i19 = i4 >>> i28;
     i4 = i19 >>> 2 & 4;
     i6 = i19 >>> i4;
     i19 = i6 >>> 1 & 2;
     i12 = i6 >>> i19;
     i6 = i12 >>> 1 & 1;
     i41 = 0;
     i42 = HEAP32[4420 + ((i28 | i13 | i4 | i19 | i6) + (i12 >>> i6) << 2) >> 2] | 0;
    } else {
     i41 = i30;
     i42 = i29;
    }
    if (!i42) {
     i43 = i41;
     i44 = i31;
    } else {
     i35 = i31;
     i36 = i42;
     i37 = i41;
     i32 = 61;
    }
   }
   if ((i32 | 0) == 61) while (1) {
    i32 = 0;
    i6 = (HEAP32[i36 + 4 >> 2] & -8) - i5 | 0;
    i12 = i6 >>> 0 < i35 >>> 0;
    i19 = i12 ? i6 : i35;
    i6 = i12 ? i36 : i37;
    i36 = HEAP32[i36 + 16 + (((HEAP32[i36 + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0;
    if (!i36) {
     i43 = i6;
     i44 = i19;
     break;
    } else {
     i35 = i19;
     i37 = i6;
     i32 = 61;
    }
   }
   if (!i43) i18 = i5; else if (i44 >>> 0 < ((HEAP32[1031] | 0) - i5 | 0) >>> 0) {
    i6 = i43 + i5 | 0;
    if (i6 >>> 0 <= i43 >>> 0) {
     i14 = 0;
     STACKTOP = i2;
     return i14 | 0;
    }
    i19 = HEAP32[i43 + 24 >> 2] | 0;
    i12 = HEAP32[i43 + 12 >> 2] | 0;
    do if ((i12 | 0) == (i43 | 0)) {
     i4 = i43 + 20 | 0;
     i13 = HEAP32[i4 >> 2] | 0;
     if (!i13) {
      i28 = i43 + 16 | 0;
      i33 = HEAP32[i28 >> 2] | 0;
      if (!i33) {
       i45 = 0;
       break;
      } else {
       i46 = i33;
       i47 = i28;
      }
     } else {
      i46 = i13;
      i47 = i4;
     }
     while (1) {
      i4 = i46 + 20 | 0;
      i13 = HEAP32[i4 >> 2] | 0;
      if (i13 | 0) {
       i46 = i13;
       i47 = i4;
       continue;
      }
      i4 = i46 + 16 | 0;
      i13 = HEAP32[i4 >> 2] | 0;
      if (!i13) break; else {
       i46 = i13;
       i47 = i4;
      }
     }
     HEAP32[i47 >> 2] = 0;
     i45 = i46;
    } else {
     i4 = HEAP32[i43 + 8 >> 2] | 0;
     HEAP32[i4 + 12 >> 2] = i12;
     HEAP32[i12 + 8 >> 2] = i4;
     i45 = i12;
    } while (0);
    do if (!i19) i48 = i9; else {
     i12 = HEAP32[i43 + 28 >> 2] | 0;
     i4 = 4420 + (i12 << 2) | 0;
     if ((i43 | 0) == (HEAP32[i4 >> 2] | 0)) {
      HEAP32[i4 >> 2] = i45;
      if (!i45) {
       i4 = i9 & ~(1 << i12);
       HEAP32[1030] = i4;
       i48 = i4;
       break;
      }
     } else {
      HEAP32[i19 + 16 + (((HEAP32[i19 + 16 >> 2] | 0) != (i43 | 0) & 1) << 2) >> 2] = i45;
      if (!i45) {
       i48 = i9;
       break;
      }
     }
     HEAP32[i45 + 24 >> 2] = i19;
     i4 = HEAP32[i43 + 16 >> 2] | 0;
     if (i4 | 0) {
      HEAP32[i45 + 16 >> 2] = i4;
      HEAP32[i4 + 24 >> 2] = i45;
     }
     i4 = HEAP32[i43 + 20 >> 2] | 0;
     if (!i4) i48 = i9; else {
      HEAP32[i45 + 20 >> 2] = i4;
      HEAP32[i4 + 24 >> 2] = i45;
      i48 = i9;
     }
    } while (0);
    do if (i44 >>> 0 < 16) {
     i9 = i44 + i5 | 0;
     HEAP32[i43 + 4 >> 2] = i9 | 3;
     i19 = i43 + i9 + 4 | 0;
     HEAP32[i19 >> 2] = HEAP32[i19 >> 2] | 1;
    } else {
     HEAP32[i43 + 4 >> 2] = i5 | 3;
     HEAP32[i6 + 4 >> 2] = i44 | 1;
     HEAP32[i6 + i44 >> 2] = i44;
     i19 = i44 >>> 3;
     if (i44 >>> 0 < 256) {
      i9 = 4156 + (i19 << 1 << 2) | 0;
      i4 = HEAP32[1029] | 0;
      i12 = 1 << i19;
      if (!(i4 & i12)) {
       HEAP32[1029] = i4 | i12;
       i49 = i9;
       i50 = i9 + 8 | 0;
      } else {
       i12 = i9 + 8 | 0;
       i49 = HEAP32[i12 >> 2] | 0;
       i50 = i12;
      }
      HEAP32[i50 >> 2] = i6;
      HEAP32[i49 + 12 >> 2] = i6;
      HEAP32[i6 + 8 >> 2] = i49;
      HEAP32[i6 + 12 >> 2] = i9;
      break;
     }
     i9 = i44 >>> 8;
     if (!i9) i51 = 0; else if (i44 >>> 0 > 16777215) i51 = 31; else {
      i12 = (i9 + 1048320 | 0) >>> 16 & 8;
      i4 = i9 << i12;
      i9 = (i4 + 520192 | 0) >>> 16 & 4;
      i19 = i4 << i9;
      i4 = (i19 + 245760 | 0) >>> 16 & 2;
      i13 = 14 - (i9 | i12 | i4) + (i19 << i4 >>> 15) | 0;
      i51 = i44 >>> (i13 + 7 | 0) & 1 | i13 << 1;
     }
     i13 = 4420 + (i51 << 2) | 0;
     HEAP32[i6 + 28 >> 2] = i51;
     i4 = i6 + 16 | 0;
     HEAP32[i4 + 4 >> 2] = 0;
     HEAP32[i4 >> 2] = 0;
     i4 = 1 << i51;
     if (!(i48 & i4)) {
      HEAP32[1030] = i48 | i4;
      HEAP32[i13 >> 2] = i6;
      HEAP32[i6 + 24 >> 2] = i13;
      HEAP32[i6 + 12 >> 2] = i6;
      HEAP32[i6 + 8 >> 2] = i6;
      break;
     }
     i4 = i44 << ((i51 | 0) == 31 ? 0 : 25 - (i51 >>> 1) | 0);
     i19 = HEAP32[i13 >> 2] | 0;
     while (1) {
      if ((HEAP32[i19 + 4 >> 2] & -8 | 0) == (i44 | 0)) {
       i32 = 97;
       break;
      }
      i52 = i19 + 16 + (i4 >>> 31 << 2) | 0;
      i13 = HEAP32[i52 >> 2] | 0;
      if (!i13) {
       i32 = 96;
       break;
      } else {
       i4 = i4 << 1;
       i19 = i13;
      }
     }
     if ((i32 | 0) == 96) {
      HEAP32[i52 >> 2] = i6;
      HEAP32[i6 + 24 >> 2] = i19;
      HEAP32[i6 + 12 >> 2] = i6;
      HEAP32[i6 + 8 >> 2] = i6;
      break;
     } else if ((i32 | 0) == 97) {
      i4 = i19 + 8 | 0;
      i13 = HEAP32[i4 >> 2] | 0;
      HEAP32[i13 + 12 >> 2] = i6;
      HEAP32[i4 >> 2] = i6;
      HEAP32[i6 + 8 >> 2] = i13;
      HEAP32[i6 + 12 >> 2] = i19;
      HEAP32[i6 + 24 >> 2] = 0;
      break;
     }
    } while (0);
    i14 = i43 + 8 | 0;
    STACKTOP = i2;
    return i14 | 0;
   } else i18 = i5;
  }
 } while (0);
 i43 = HEAP32[1031] | 0;
 if (i43 >>> 0 >= i18 >>> 0) {
  i52 = i43 - i18 | 0;
  i44 = HEAP32[1034] | 0;
  if (i52 >>> 0 > 15) {
   i51 = i44 + i18 | 0;
   HEAP32[1034] = i51;
   HEAP32[1031] = i52;
   HEAP32[i51 + 4 >> 2] = i52 | 1;
   HEAP32[i44 + i43 >> 2] = i52;
   HEAP32[i44 + 4 >> 2] = i18 | 3;
  } else {
   HEAP32[1031] = 0;
   HEAP32[1034] = 0;
   HEAP32[i44 + 4 >> 2] = i43 | 3;
   i52 = i44 + i43 + 4 | 0;
   HEAP32[i52 >> 2] = HEAP32[i52 >> 2] | 1;
  }
  i14 = i44 + 8 | 0;
  STACKTOP = i2;
  return i14 | 0;
 }
 i44 = HEAP32[1032] | 0;
 if (i44 >>> 0 > i18 >>> 0) {
  i52 = i44 - i18 | 0;
  HEAP32[1032] = i52;
  i43 = HEAP32[1035] | 0;
  i51 = i43 + i18 | 0;
  HEAP32[1035] = i51;
  HEAP32[i51 + 4 >> 2] = i52 | 1;
  HEAP32[i43 + 4 >> 2] = i18 | 3;
  i14 = i43 + 8 | 0;
  STACKTOP = i2;
  return i14 | 0;
 }
 if (!(HEAP32[1147] | 0)) {
  HEAP32[1149] = 4096;
  HEAP32[1148] = 4096;
  HEAP32[1150] = -1;
  HEAP32[1151] = -1;
  HEAP32[1152] = 0;
  HEAP32[1140] = 0;
  HEAP32[1147] = i3 & -16 ^ 1431655768;
  i53 = 4096;
 } else i53 = HEAP32[1149] | 0;
 i3 = i18 + 48 | 0;
 i43 = i18 + 47 | 0;
 i52 = i53 + i43 | 0;
 i51 = 0 - i53 | 0;
 i53 = i52 & i51;
 if (i53 >>> 0 <= i18 >>> 0) {
  i14 = 0;
  STACKTOP = i2;
  return i14 | 0;
 }
 i48 = HEAP32[1139] | 0;
 if (i48 | 0) {
  i49 = HEAP32[1137] | 0;
  i50 = i49 + i53 | 0;
  if (i50 >>> 0 <= i49 >>> 0 | i50 >>> 0 > i48 >>> 0) {
   i14 = 0;
   STACKTOP = i2;
   return i14 | 0;
  }
 }
 L167 : do if (!(HEAP32[1140] & 4)) {
  i48 = HEAP32[1035] | 0;
  L169 : do if (!i48) i32 = 118; else {
   i50 = 4564;
   while (1) {
    i49 = HEAP32[i50 >> 2] | 0;
    if (i49 >>> 0 <= i48 >>> 0) {
     i54 = i50 + 4 | 0;
     if ((i49 + (HEAP32[i54 >> 2] | 0) | 0) >>> 0 > i48 >>> 0) break;
    }
    i49 = HEAP32[i50 + 8 >> 2] | 0;
    if (!i49) {
     i32 = 118;
     break L169;
    } else i50 = i49;
   }
   i19 = i52 - i44 & i51;
   if (i19 >>> 0 < 2147483647) {
    i49 = _sbrk(i19 | 0) | 0;
    if ((i49 | 0) == ((HEAP32[i50 >> 2] | 0) + (HEAP32[i54 >> 2] | 0) | 0)) if ((i49 | 0) == (-1 | 0)) i55 = i19; else {
     i56 = i19;
     i57 = i49;
     i32 = 135;
     break L167;
    } else {
     i58 = i49;
     i59 = i19;
     i32 = 126;
    }
   } else i55 = 0;
  } while (0);
  do if ((i32 | 0) == 118) {
   i48 = _sbrk(0) | 0;
   if ((i48 | 0) == (-1 | 0)) i55 = 0; else {
    i5 = i48;
    i19 = HEAP32[1148] | 0;
    i49 = i19 + -1 | 0;
    i45 = ((i49 & i5 | 0) == 0 ? 0 : (i49 + i5 & 0 - i19) - i5 | 0) + i53 | 0;
    i5 = HEAP32[1137] | 0;
    i19 = i45 + i5 | 0;
    if (i45 >>> 0 > i18 >>> 0 & i45 >>> 0 < 2147483647) {
     i49 = HEAP32[1139] | 0;
     if (i49 | 0) if (i19 >>> 0 <= i5 >>> 0 | i19 >>> 0 > i49 >>> 0) {
      i55 = 0;
      break;
     }
     i49 = _sbrk(i45 | 0) | 0;
     if ((i49 | 0) == (i48 | 0)) {
      i56 = i45;
      i57 = i48;
      i32 = 135;
      break L167;
     } else {
      i58 = i49;
      i59 = i45;
      i32 = 126;
     }
    } else i55 = 0;
   }
  } while (0);
  do if ((i32 | 0) == 126) {
   i45 = 0 - i59 | 0;
   if (!(i3 >>> 0 > i59 >>> 0 & (i59 >>> 0 < 2147483647 & (i58 | 0) != (-1 | 0)))) if ((i58 | 0) == (-1 | 0)) {
    i55 = 0;
    break;
   } else {
    i56 = i59;
    i57 = i58;
    i32 = 135;
    break L167;
   }
   i49 = HEAP32[1149] | 0;
   i48 = i43 - i59 + i49 & 0 - i49;
   if (i48 >>> 0 >= 2147483647) {
    i56 = i59;
    i57 = i58;
    i32 = 135;
    break L167;
   }
   if ((_sbrk(i48 | 0) | 0) == (-1 | 0)) {
    _sbrk(i45 | 0) | 0;
    i55 = 0;
    break;
   } else {
    i56 = i48 + i59 | 0;
    i57 = i58;
    i32 = 135;
    break L167;
   }
  } while (0);
  HEAP32[1140] = HEAP32[1140] | 4;
  i60 = i55;
  i32 = 133;
 } else {
  i60 = 0;
  i32 = 133;
 } while (0);
 if ((i32 | 0) == 133) if (i53 >>> 0 < 2147483647) {
  i55 = _sbrk(i53 | 0) | 0;
  i53 = _sbrk(0) | 0;
  i58 = i53 - i55 | 0;
  i59 = i58 >>> 0 > (i18 + 40 | 0) >>> 0;
  if (!((i55 | 0) == (-1 | 0) | i59 ^ 1 | i55 >>> 0 < i53 >>> 0 & ((i55 | 0) != (-1 | 0) & (i53 | 0) != (-1 | 0)) ^ 1)) {
   i56 = i59 ? i58 : i60;
   i57 = i55;
   i32 = 135;
  }
 }
 if ((i32 | 0) == 135) {
  i55 = (HEAP32[1137] | 0) + i56 | 0;
  HEAP32[1137] = i55;
  if (i55 >>> 0 > (HEAP32[1138] | 0) >>> 0) HEAP32[1138] = i55;
  i55 = HEAP32[1035] | 0;
  do if (!i55) {
   i60 = HEAP32[1033] | 0;
   if ((i60 | 0) == 0 | i57 >>> 0 < i60 >>> 0) HEAP32[1033] = i57;
   HEAP32[1141] = i57;
   HEAP32[1142] = i56;
   HEAP32[1144] = 0;
   HEAP32[1038] = HEAP32[1147];
   HEAP32[1037] = -1;
   HEAP32[1042] = 4156;
   HEAP32[1041] = 4156;
   HEAP32[1044] = 4164;
   HEAP32[1043] = 4164;
   HEAP32[1046] = 4172;
   HEAP32[1045] = 4172;
   HEAP32[1048] = 4180;
   HEAP32[1047] = 4180;
   HEAP32[1050] = 4188;
   HEAP32[1049] = 4188;
   HEAP32[1052] = 4196;
   HEAP32[1051] = 4196;
   HEAP32[1054] = 4204;
   HEAP32[1053] = 4204;
   HEAP32[1056] = 4212;
   HEAP32[1055] = 4212;
   HEAP32[1058] = 4220;
   HEAP32[1057] = 4220;
   HEAP32[1060] = 4228;
   HEAP32[1059] = 4228;
   HEAP32[1062] = 4236;
   HEAP32[1061] = 4236;
   HEAP32[1064] = 4244;
   HEAP32[1063] = 4244;
   HEAP32[1066] = 4252;
   HEAP32[1065] = 4252;
   HEAP32[1068] = 4260;
   HEAP32[1067] = 4260;
   HEAP32[1070] = 4268;
   HEAP32[1069] = 4268;
   HEAP32[1072] = 4276;
   HEAP32[1071] = 4276;
   HEAP32[1074] = 4284;
   HEAP32[1073] = 4284;
   HEAP32[1076] = 4292;
   HEAP32[1075] = 4292;
   HEAP32[1078] = 4300;
   HEAP32[1077] = 4300;
   HEAP32[1080] = 4308;
   HEAP32[1079] = 4308;
   HEAP32[1082] = 4316;
   HEAP32[1081] = 4316;
   HEAP32[1084] = 4324;
   HEAP32[1083] = 4324;
   HEAP32[1086] = 4332;
   HEAP32[1085] = 4332;
   HEAP32[1088] = 4340;
   HEAP32[1087] = 4340;
   HEAP32[1090] = 4348;
   HEAP32[1089] = 4348;
   HEAP32[1092] = 4356;
   HEAP32[1091] = 4356;
   HEAP32[1094] = 4364;
   HEAP32[1093] = 4364;
   HEAP32[1096] = 4372;
   HEAP32[1095] = 4372;
   HEAP32[1098] = 4380;
   HEAP32[1097] = 4380;
   HEAP32[1100] = 4388;
   HEAP32[1099] = 4388;
   HEAP32[1102] = 4396;
   HEAP32[1101] = 4396;
   HEAP32[1104] = 4404;
   HEAP32[1103] = 4404;
   i60 = i56 + -40 | 0;
   i58 = i57 + 8 | 0;
   i59 = (i58 & 7 | 0) == 0 ? 0 : 0 - i58 & 7;
   i58 = i57 + i59 | 0;
   i53 = i60 - i59 | 0;
   HEAP32[1035] = i58;
   HEAP32[1032] = i53;
   HEAP32[i58 + 4 >> 2] = i53 | 1;
   HEAP32[i57 + i60 + 4 >> 2] = 40;
   HEAP32[1036] = HEAP32[1151];
  } else {
   i60 = 4564;
   while (1) {
    i61 = HEAP32[i60 >> 2] | 0;
    i62 = i60 + 4 | 0;
    i63 = HEAP32[i62 >> 2] | 0;
    if ((i57 | 0) == (i61 + i63 | 0)) {
     i32 = 143;
     break;
    }
    i53 = HEAP32[i60 + 8 >> 2] | 0;
    if (!i53) break; else i60 = i53;
   }
   if ((i32 | 0) == 143) if (!(HEAP32[i60 + 12 >> 2] & 8)) if (i57 >>> 0 > i55 >>> 0 & i61 >>> 0 <= i55 >>> 0) {
    HEAP32[i62 >> 2] = i63 + i56;
    i53 = (HEAP32[1032] | 0) + i56 | 0;
    i58 = i55 + 8 | 0;
    i59 = (i58 & 7 | 0) == 0 ? 0 : 0 - i58 & 7;
    i58 = i55 + i59 | 0;
    i43 = i53 - i59 | 0;
    HEAP32[1035] = i58;
    HEAP32[1032] = i43;
    HEAP32[i58 + 4 >> 2] = i43 | 1;
    HEAP32[i55 + i53 + 4 >> 2] = 40;
    HEAP32[1036] = HEAP32[1151];
    break;
   }
   if (i57 >>> 0 < (HEAP32[1033] | 0) >>> 0) HEAP32[1033] = i57;
   i53 = i57 + i56 | 0;
   i43 = 4564;
   while (1) {
    if ((HEAP32[i43 >> 2] | 0) == (i53 | 0)) {
     i32 = 151;
     break;
    }
    i58 = HEAP32[i43 + 8 >> 2] | 0;
    if (!i58) {
     i64 = 4564;
     break;
    } else i43 = i58;
   }
   if ((i32 | 0) == 151) if (!(HEAP32[i43 + 12 >> 2] & 8)) {
    HEAP32[i43 >> 2] = i57;
    i60 = i43 + 4 | 0;
    HEAP32[i60 >> 2] = (HEAP32[i60 >> 2] | 0) + i56;
    i60 = i57 + 8 | 0;
    i58 = i57 + ((i60 & 7 | 0) == 0 ? 0 : 0 - i60 & 7) | 0;
    i60 = i53 + 8 | 0;
    i59 = i53 + ((i60 & 7 | 0) == 0 ? 0 : 0 - i60 & 7) | 0;
    i60 = i58 + i18 | 0;
    i3 = i59 - i58 - i18 | 0;
    HEAP32[i58 + 4 >> 2] = i18 | 3;
    do if ((i55 | 0) == (i59 | 0)) {
     i54 = (HEAP32[1032] | 0) + i3 | 0;
     HEAP32[1032] = i54;
     HEAP32[1035] = i60;
     HEAP32[i60 + 4 >> 2] = i54 | 1;
    } else {
     if ((HEAP32[1034] | 0) == (i59 | 0)) {
      i54 = (HEAP32[1031] | 0) + i3 | 0;
      HEAP32[1031] = i54;
      HEAP32[1034] = i60;
      HEAP32[i60 + 4 >> 2] = i54 | 1;
      HEAP32[i60 + i54 >> 2] = i54;
      break;
     }
     i54 = HEAP32[i59 + 4 >> 2] | 0;
     if ((i54 & 3 | 0) == 1) {
      i51 = i54 & -8;
      i44 = i54 >>> 3;
      L234 : do if (i54 >>> 0 < 256) {
       i52 = HEAP32[i59 + 8 >> 2] | 0;
       i48 = HEAP32[i59 + 12 >> 2] | 0;
       if ((i48 | 0) == (i52 | 0)) {
        HEAP32[1029] = HEAP32[1029] & ~(1 << i44);
        break;
       } else {
        HEAP32[i52 + 12 >> 2] = i48;
        HEAP32[i48 + 8 >> 2] = i52;
        break;
       }
      } else {
       i52 = HEAP32[i59 + 24 >> 2] | 0;
       i48 = HEAP32[i59 + 12 >> 2] | 0;
       do if ((i48 | 0) == (i59 | 0)) {
        i45 = i59 + 16 | 0;
        i49 = i45 + 4 | 0;
        i19 = HEAP32[i49 >> 2] | 0;
        if (!i19) {
         i5 = HEAP32[i45 >> 2] | 0;
         if (!i5) {
          i65 = 0;
          break;
         } else {
          i66 = i5;
          i67 = i45;
         }
        } else {
         i66 = i19;
         i67 = i49;
        }
        while (1) {
         i49 = i66 + 20 | 0;
         i19 = HEAP32[i49 >> 2] | 0;
         if (i19 | 0) {
          i66 = i19;
          i67 = i49;
          continue;
         }
         i49 = i66 + 16 | 0;
         i19 = HEAP32[i49 >> 2] | 0;
         if (!i19) break; else {
          i66 = i19;
          i67 = i49;
         }
        }
        HEAP32[i67 >> 2] = 0;
        i65 = i66;
       } else {
        i49 = HEAP32[i59 + 8 >> 2] | 0;
        HEAP32[i49 + 12 >> 2] = i48;
        HEAP32[i48 + 8 >> 2] = i49;
        i65 = i48;
       } while (0);
       if (!i52) break;
       i48 = HEAP32[i59 + 28 >> 2] | 0;
       i49 = 4420 + (i48 << 2) | 0;
       do if ((HEAP32[i49 >> 2] | 0) == (i59 | 0)) {
        HEAP32[i49 >> 2] = i65;
        if (i65 | 0) break;
        HEAP32[1030] = HEAP32[1030] & ~(1 << i48);
        break L234;
       } else {
        HEAP32[i52 + 16 + (((HEAP32[i52 + 16 >> 2] | 0) != (i59 | 0) & 1) << 2) >> 2] = i65;
        if (!i65) break L234;
       } while (0);
       HEAP32[i65 + 24 >> 2] = i52;
       i48 = i59 + 16 | 0;
       i49 = HEAP32[i48 >> 2] | 0;
       if (i49 | 0) {
        HEAP32[i65 + 16 >> 2] = i49;
        HEAP32[i49 + 24 >> 2] = i65;
       }
       i49 = HEAP32[i48 + 4 >> 2] | 0;
       if (!i49) break;
       HEAP32[i65 + 20 >> 2] = i49;
       HEAP32[i49 + 24 >> 2] = i65;
      } while (0);
      i68 = i59 + i51 | 0;
      i69 = i51 + i3 | 0;
     } else {
      i68 = i59;
      i69 = i3;
     }
     i44 = i68 + 4 | 0;
     HEAP32[i44 >> 2] = HEAP32[i44 >> 2] & -2;
     HEAP32[i60 + 4 >> 2] = i69 | 1;
     HEAP32[i60 + i69 >> 2] = i69;
     i44 = i69 >>> 3;
     if (i69 >>> 0 < 256) {
      i54 = 4156 + (i44 << 1 << 2) | 0;
      i50 = HEAP32[1029] | 0;
      i49 = 1 << i44;
      if (!(i50 & i49)) {
       HEAP32[1029] = i50 | i49;
       i70 = i54;
       i71 = i54 + 8 | 0;
      } else {
       i49 = i54 + 8 | 0;
       i70 = HEAP32[i49 >> 2] | 0;
       i71 = i49;
      }
      HEAP32[i71 >> 2] = i60;
      HEAP32[i70 + 12 >> 2] = i60;
      HEAP32[i60 + 8 >> 2] = i70;
      HEAP32[i60 + 12 >> 2] = i54;
      break;
     }
     i54 = i69 >>> 8;
     do if (!i54) i72 = 0; else {
      if (i69 >>> 0 > 16777215) {
       i72 = 31;
       break;
      }
      i49 = (i54 + 1048320 | 0) >>> 16 & 8;
      i50 = i54 << i49;
      i44 = (i50 + 520192 | 0) >>> 16 & 4;
      i48 = i50 << i44;
      i50 = (i48 + 245760 | 0) >>> 16 & 2;
      i19 = 14 - (i44 | i49 | i50) + (i48 << i50 >>> 15) | 0;
      i72 = i69 >>> (i19 + 7 | 0) & 1 | i19 << 1;
     } while (0);
     i54 = 4420 + (i72 << 2) | 0;
     HEAP32[i60 + 28 >> 2] = i72;
     i51 = i60 + 16 | 0;
     HEAP32[i51 + 4 >> 2] = 0;
     HEAP32[i51 >> 2] = 0;
     i51 = HEAP32[1030] | 0;
     i19 = 1 << i72;
     if (!(i51 & i19)) {
      HEAP32[1030] = i51 | i19;
      HEAP32[i54 >> 2] = i60;
      HEAP32[i60 + 24 >> 2] = i54;
      HEAP32[i60 + 12 >> 2] = i60;
      HEAP32[i60 + 8 >> 2] = i60;
      break;
     }
     i19 = i69 << ((i72 | 0) == 31 ? 0 : 25 - (i72 >>> 1) | 0);
     i51 = HEAP32[i54 >> 2] | 0;
     while (1) {
      if ((HEAP32[i51 + 4 >> 2] & -8 | 0) == (i69 | 0)) {
       i32 = 192;
       break;
      }
      i73 = i51 + 16 + (i19 >>> 31 << 2) | 0;
      i54 = HEAP32[i73 >> 2] | 0;
      if (!i54) {
       i32 = 191;
       break;
      } else {
       i19 = i19 << 1;
       i51 = i54;
      }
     }
     if ((i32 | 0) == 191) {
      HEAP32[i73 >> 2] = i60;
      HEAP32[i60 + 24 >> 2] = i51;
      HEAP32[i60 + 12 >> 2] = i60;
      HEAP32[i60 + 8 >> 2] = i60;
      break;
     } else if ((i32 | 0) == 192) {
      i19 = i51 + 8 | 0;
      i54 = HEAP32[i19 >> 2] | 0;
      HEAP32[i54 + 12 >> 2] = i60;
      HEAP32[i19 >> 2] = i60;
      HEAP32[i60 + 8 >> 2] = i54;
      HEAP32[i60 + 12 >> 2] = i51;
      HEAP32[i60 + 24 >> 2] = 0;
      break;
     }
    } while (0);
    i14 = i58 + 8 | 0;
    STACKTOP = i2;
    return i14 | 0;
   } else i64 = 4564;
   while (1) {
    i60 = HEAP32[i64 >> 2] | 0;
    if (i60 >>> 0 <= i55 >>> 0) {
     i74 = i60 + (HEAP32[i64 + 4 >> 2] | 0) | 0;
     if (i74 >>> 0 > i55 >>> 0) break;
    }
    i64 = HEAP32[i64 + 8 >> 2] | 0;
   }
   i58 = i74 + -47 | 0;
   i60 = i58 + 8 | 0;
   i3 = i58 + ((i60 & 7 | 0) == 0 ? 0 : 0 - i60 & 7) | 0;
   i60 = i55 + 16 | 0;
   i58 = i3 >>> 0 < i60 >>> 0 ? i55 : i3;
   i3 = i58 + 8 | 0;
   i59 = i56 + -40 | 0;
   i53 = i57 + 8 | 0;
   i43 = (i53 & 7 | 0) == 0 ? 0 : 0 - i53 & 7;
   i53 = i57 + i43 | 0;
   i54 = i59 - i43 | 0;
   HEAP32[1035] = i53;
   HEAP32[1032] = i54;
   HEAP32[i53 + 4 >> 2] = i54 | 1;
   HEAP32[i57 + i59 + 4 >> 2] = 40;
   HEAP32[1036] = HEAP32[1151];
   i59 = i58 + 4 | 0;
   HEAP32[i59 >> 2] = 27;
   HEAP32[i3 >> 2] = HEAP32[1141];
   HEAP32[i3 + 4 >> 2] = HEAP32[1142];
   HEAP32[i3 + 8 >> 2] = HEAP32[1143];
   HEAP32[i3 + 12 >> 2] = HEAP32[1144];
   HEAP32[1141] = i57;
   HEAP32[1142] = i56;
   HEAP32[1144] = 0;
   HEAP32[1143] = i3;
   i3 = i58 + 24 | 0;
   do {
    i54 = i3;
    i3 = i3 + 4 | 0;
    HEAP32[i3 >> 2] = 7;
   } while ((i54 + 8 | 0) >>> 0 < i74 >>> 0);
   if ((i58 | 0) != (i55 | 0)) {
    i3 = i58 - i55 | 0;
    HEAP32[i59 >> 2] = HEAP32[i59 >> 2] & -2;
    HEAP32[i55 + 4 >> 2] = i3 | 1;
    HEAP32[i58 >> 2] = i3;
    i54 = i3 >>> 3;
    if (i3 >>> 0 < 256) {
     i53 = 4156 + (i54 << 1 << 2) | 0;
     i43 = HEAP32[1029] | 0;
     i19 = 1 << i54;
     if (!(i43 & i19)) {
      HEAP32[1029] = i43 | i19;
      i75 = i53;
      i76 = i53 + 8 | 0;
     } else {
      i19 = i53 + 8 | 0;
      i75 = HEAP32[i19 >> 2] | 0;
      i76 = i19;
     }
     HEAP32[i76 >> 2] = i55;
     HEAP32[i75 + 12 >> 2] = i55;
     HEAP32[i55 + 8 >> 2] = i75;
     HEAP32[i55 + 12 >> 2] = i53;
     break;
    }
    i53 = i3 >>> 8;
    if (!i53) i77 = 0; else if (i3 >>> 0 > 16777215) i77 = 31; else {
     i19 = (i53 + 1048320 | 0) >>> 16 & 8;
     i43 = i53 << i19;
     i53 = (i43 + 520192 | 0) >>> 16 & 4;
     i54 = i43 << i53;
     i43 = (i54 + 245760 | 0) >>> 16 & 2;
     i50 = 14 - (i53 | i19 | i43) + (i54 << i43 >>> 15) | 0;
     i77 = i3 >>> (i50 + 7 | 0) & 1 | i50 << 1;
    }
    i50 = 4420 + (i77 << 2) | 0;
    HEAP32[i55 + 28 >> 2] = i77;
    HEAP32[i55 + 20 >> 2] = 0;
    HEAP32[i60 >> 2] = 0;
    i43 = HEAP32[1030] | 0;
    i54 = 1 << i77;
    if (!(i43 & i54)) {
     HEAP32[1030] = i43 | i54;
     HEAP32[i50 >> 2] = i55;
     HEAP32[i55 + 24 >> 2] = i50;
     HEAP32[i55 + 12 >> 2] = i55;
     HEAP32[i55 + 8 >> 2] = i55;
     break;
    }
    i54 = i3 << ((i77 | 0) == 31 ? 0 : 25 - (i77 >>> 1) | 0);
    i43 = HEAP32[i50 >> 2] | 0;
    while (1) {
     if ((HEAP32[i43 + 4 >> 2] & -8 | 0) == (i3 | 0)) {
      i32 = 213;
      break;
     }
     i78 = i43 + 16 + (i54 >>> 31 << 2) | 0;
     i50 = HEAP32[i78 >> 2] | 0;
     if (!i50) {
      i32 = 212;
      break;
     } else {
      i54 = i54 << 1;
      i43 = i50;
     }
    }
    if ((i32 | 0) == 212) {
     HEAP32[i78 >> 2] = i55;
     HEAP32[i55 + 24 >> 2] = i43;
     HEAP32[i55 + 12 >> 2] = i55;
     HEAP32[i55 + 8 >> 2] = i55;
     break;
    } else if ((i32 | 0) == 213) {
     i54 = i43 + 8 | 0;
     i3 = HEAP32[i54 >> 2] | 0;
     HEAP32[i3 + 12 >> 2] = i55;
     HEAP32[i54 >> 2] = i55;
     HEAP32[i55 + 8 >> 2] = i3;
     HEAP32[i55 + 12 >> 2] = i43;
     HEAP32[i55 + 24 >> 2] = 0;
     break;
    }
   }
  } while (0);
  i55 = HEAP32[1032] | 0;
  if (i55 >>> 0 > i18 >>> 0) {
   i32 = i55 - i18 | 0;
   HEAP32[1032] = i32;
   i55 = HEAP32[1035] | 0;
   i78 = i55 + i18 | 0;
   HEAP32[1035] = i78;
   HEAP32[i78 + 4 >> 2] = i32 | 1;
   HEAP32[i55 + 4 >> 2] = i18 | 3;
   i14 = i55 + 8 | 0;
   STACKTOP = i2;
   return i14 | 0;
  }
 }
 i55 = ___errno_location() | 0;
 HEAP32[i55 >> 2] = 12;
 i14 = 0;
 STACKTOP = i2;
 return i14 | 0;
}

function _xz_dec_run(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i66 = 0, i67 = 0, i68 = 0, i69 = 0, i70 = 0, i71 = 0, i72 = 0, i73 = 0, i74 = 0, i75 = 0, i76 = 0, i77 = 0, i78 = 0, i79 = 0, i80 = 0, i81 = 0, i82 = 0, i83 = 0, i84 = 0, i85 = 0, i86 = 0, i87 = 0, i88 = 0, i89 = 0, i90 = 0, i91 = 0, i92 = 0, i93 = 0, i94 = 0;
 i3 = i1 + 36 | 0;
 if (!(HEAP32[i3 >> 2] | 0)) {
  HEAP32[i1 >> 2] = 0;
  HEAP8[i1 + 40 >> 0] = 0;
  i4 = i1 + 4 | 0;
  HEAP32[i4 >> 2] = 0;
  i5 = i1 + 24 | 0;
  i6 = i5;
  HEAP32[i6 >> 2] = 0;
  HEAP32[i6 + 4 >> 2] = 0;
  i6 = i1 + 172 | 0;
  i7 = i1 + 72 | 0;
  i8 = i7 + 100 | 0;
  do {
   HEAP32[i7 >> 2] = 0;
   i7 = i7 + 4 | 0;
  } while ((i7 | 0) < (i8 | 0));
  HEAP32[i6 >> 2] = 12;
  i9 = 0;
  i10 = i6;
  i11 = i4;
  i12 = i5;
 } else {
  i9 = HEAP32[i1 >> 2] | 0;
  i10 = i1 + 172 | 0;
  i11 = i1 + 4 | 0;
  i12 = i1 + 24 | 0;
 }
 i5 = i2 + 4 | 0;
 i4 = HEAP32[i5 >> 2] | 0;
 i6 = i2 + 16 | 0;
 i7 = HEAP32[i6 >> 2] | 0;
 i8 = i1 + 16 | 0;
 HEAP32[i8 >> 2] = i4;
 i13 = i2 + 8 | 0;
 i14 = i1 + 168 | 0;
 i15 = i1 + 176 | 0;
 i16 = i1 + 182 | 0;
 i17 = i1 + 183 | 0;
 i18 = i1 + 32 | 0;
 i19 = i1 + 64 | 0;
 i20 = i1 + 177 | 0;
 i21 = i1 + 48 | 0;
 i22 = i1 + 8 | 0;
 i23 = i1 + 56 | 0;
 i24 = i1 + 1200 | 0;
 i25 = i1 + 72 | 0;
 i26 = i1 + 20 | 0;
 i27 = i1 + 80 | 0;
 i28 = i1 + 96 | 0;
 i29 = i1 + 104 | 0;
 i30 = i1 + 112 | 0;
 i31 = i1 + 88 | 0;
 i32 = i2 + 12 | 0;
 i33 = i9;
 L5 : while (1) {
  switch (i33 | 0) {
  case 6:
   {
    i34 = 75;
    break L5;
    break;
   }
  case 7:
   {
    i34 = 90;
    break L5;
    break;
   }
  case 8:
   {
    i34 = 97;
    break L5;
    break;
   }
  case 9:
   {
    i34 = 102;
    break L5;
    break;
   }
  case 0:
   {
    i9 = HEAP32[i5 >> 2] | 0;
    i35 = (HEAP32[i13 >> 2] | 0) - i9 | 0;
    i36 = HEAP32[i14 >> 2] | 0;
    i37 = (HEAP32[i10 >> 2] | 0) - i36 | 0;
    i38 = i35 >>> 0 < i37 >>> 0 ? i35 : i37;
    _memcpy(i1 + 176 + i36 | 0, (HEAP32[i2 >> 2] | 0) + i9 | 0, i38 | 0) | 0;
    HEAP32[i5 >> 2] = (HEAP32[i5 >> 2] | 0) + i38;
    i9 = (HEAP32[i14 >> 2] | 0) + i38 | 0;
    i38 = (i9 | 0) == (HEAP32[i10 >> 2] | 0);
    HEAP32[i14 >> 2] = i38 ? 0 : i9;
    if (!i38) {
     i39 = 0;
     break L5;
    }
    HEAP32[i1 >> 2] = 1;
    if (_memcmp(i15, 1024, 6) | 0) {
     i39 = 5;
     break L5;
    }
    if (HEAP8[i16 >> 0] | 0) {
     i39 = 6;
     break L5;
    }
    i38 = HEAP8[i17 >> 0] | 0;
    HEAP32[i18 >> 2] = i38 & 255;
    switch (i38 << 24 >> 24) {
    case 0:
    case 1:
    case 4:
     {
      i34 = 11;
      break;
     }
    default:
     {
      i39 = 6;
      break L5;
     }
    }
    break;
   }
  case 1:
   {
    i34 = 11;
    break;
   }
  case 2:
   {
    i40 = HEAP32[i13 >> 2] | 0;
    i41 = HEAP32[i14 >> 2] | 0;
    i42 = HEAP32[i10 >> 2] | 0;
    i43 = HEAP32[i2 >> 2] | 0;
    i34 = 15;
    break;
   }
  case 3:
   {
    i34 = 43;
    break;
   }
  case 4:
   {
    i34 = 58;
    break;
   }
  case 5:
   {
    i34 = 64;
    break;
   }
  default:
   {
    i34 = 121;
    break L5;
   }
  }
  do if ((i34 | 0) == 11) {
   i34 = 0;
   i38 = HEAP32[i5 >> 2] | 0;
   i9 = HEAP32[i13 >> 2] | 0;
   if ((i38 | 0) == (i9 | 0)) {
    i39 = 0;
    break L5;
   }
   i36 = HEAP32[i2 >> 2] | 0;
   i37 = HEAP8[i36 + i38 >> 0] | 0;
   if (!(i37 << 24 >> 24)) {
    HEAP32[i5 >> 2] = i38 + 1;
    HEAP32[i8 >> 2] = i38;
    i44 = 6;
    break;
   } else {
    i38 = ((i37 & 255) << 2) + 4 | 0;
    HEAP32[i19 >> 2] = i38;
    HEAP32[i10 >> 2] = i38;
    HEAP32[i14 >> 2] = 0;
    HEAP32[i1 >> 2] = 2;
    i40 = i9;
    i41 = 0;
    i42 = i38;
    i43 = i36;
    i34 = 15;
    break;
   }
  } while (0);
  if ((i34 | 0) == 15) {
   i34 = 0;
   i36 = HEAP32[i5 >> 2] | 0;
   i38 = i40 - i36 | 0;
   i9 = i42 - i41 | 0;
   i37 = i38 >>> 0 < i9 >>> 0 ? i38 : i9;
   _memcpy(i1 + 176 + i41 | 0, i43 + i36 | 0, i37 | 0) | 0;
   HEAP32[i5 >> 2] = i37 + (HEAP32[i5 >> 2] | 0);
   i36 = (HEAP32[i14 >> 2] | 0) + i37 | 0;
   i37 = (i36 | 0) == (HEAP32[i10 >> 2] | 0);
   HEAP32[i14 >> 2] = i37 ? 0 : i36;
   if (!i37) {
    i39 = 0;
    break;
   }
   i37 = i36 + -4 | 0;
   HEAP32[i10 >> 2] = i37;
   i36 = _xz_crc32(i15, i37, 0) | 0;
   i37 = HEAP32[i10 >> 2] | 0;
   i9 = i1 + 176 + i37 | 0;
   if ((i36 | 0) != (HEAPU8[i9 + 1 >> 0] << 8 | HEAPU8[i9 >> 0] | HEAPU8[i9 + 2 >> 0] << 16 | HEAPU8[i9 + 3 >> 0] << 24 | 0)) {
    i39 = 7;
    break;
   }
   HEAP32[i14 >> 2] = 2;
   i9 = HEAP8[i20 >> 0] | 0;
   i36 = i9 & 255;
   if (i36 & 63 | 0) {
    i39 = 6;
    break;
   }
   if (!(i36 & 64)) {
    i45 = -1;
    i46 = -1;
    i47 = 2;
   } else {
    i36 = HEAP32[i11 >> 2] | 0;
    if (!i36) {
     i38 = i22;
     HEAP32[i38 >> 2] = 0;
     HEAP32[i38 + 4 >> 2] = 0;
     i48 = 2;
     i49 = 0;
    } else {
     i48 = 2;
     i49 = i36;
    }
    while (1) {
     if (i48 >>> 0 >= i37 >>> 0) {
      i39 = 7;
      break L5;
     }
     i50 = HEAP8[i1 + 176 + i48 >> 0] | 0;
     i48 = i48 + 1 | 0;
     HEAP32[i14 >> 2] = i48;
     i36 = i50 & 255;
     i38 = _bitshift64Shl(i36 & 127 | 0, 0, i49 | 0) | 0;
     i35 = i22;
     i51 = i38 | HEAP32[i35 >> 2];
     i52 = tempRet0 | HEAP32[i35 + 4 >> 2];
     i35 = i22;
     HEAP32[i35 >> 2] = i51;
     HEAP32[i35 + 4 >> 2] = i52;
     if (!(i36 & 128)) break;
     i36 = i49 + 7 | 0;
     HEAP32[i11 >> 2] = i36;
     if ((i36 | 0) == 63) {
      i39 = 7;
      break L5;
     } else i49 = i36;
    }
    if (!((i49 | 0) == 0 | i50 << 24 >> 24 != 0)) {
     i39 = 7;
     break;
    }
    HEAP32[i11 >> 2] = 0;
    i45 = i51;
    i46 = i52;
    i47 = i48;
   }
   i36 = i21;
   HEAP32[i36 >> 2] = i45;
   HEAP32[i36 + 4 >> 2] = i46;
   if (i9 << 24 >> 24 < 0) {
    i36 = HEAP32[i11 >> 2] | 0;
    if (!i36) {
     i35 = i22;
     HEAP32[i35 >> 2] = 0;
     HEAP32[i35 + 4 >> 2] = 0;
     i53 = i47;
     i54 = 0;
    } else {
     i53 = i47;
     i54 = i36;
    }
    while (1) {
     if (i53 >>> 0 >= i37 >>> 0) {
      i39 = 7;
      break L5;
     }
     i55 = HEAP8[i1 + 176 + i53 >> 0] | 0;
     i53 = i53 + 1 | 0;
     HEAP32[i14 >> 2] = i53;
     i36 = i55 & 255;
     i35 = _bitshift64Shl(i36 & 127 | 0, 0, i54 | 0) | 0;
     i38 = i22;
     i56 = i35 | HEAP32[i38 >> 2];
     i57 = tempRet0 | HEAP32[i38 + 4 >> 2];
     i38 = i22;
     HEAP32[i38 >> 2] = i56;
     HEAP32[i38 + 4 >> 2] = i57;
     if (!(i36 & 128)) break;
     i36 = i54 + 7 | 0;
     HEAP32[i11 >> 2] = i36;
     if ((i36 | 0) == 63) {
      i39 = 7;
      break L5;
     } else i54 = i36;
    }
    if (!((i54 | 0) == 0 | i55 << 24 >> 24 != 0)) {
     i39 = 7;
     break;
    }
    HEAP32[i11 >> 2] = 0;
    i58 = i56;
    i59 = i57;
    i60 = i53;
   } else {
    i58 = -1;
    i59 = -1;
    i60 = i47;
   }
   i9 = i23;
   HEAP32[i9 >> 2] = i58;
   HEAP32[i9 + 4 >> 2] = i59;
   if ((i37 - i60 | 0) >>> 0 < 2) {
    i39 = 7;
    break;
   }
   i9 = i60 + 1 | 0;
   HEAP32[i14 >> 2] = i9;
   if ((HEAP8[i1 + 176 + i60 >> 0] | 0) != 33) {
    i39 = 6;
    break;
   }
   i36 = i60 + 2 | 0;
   HEAP32[i14 >> 2] = i36;
   if ((HEAP8[i1 + 176 + i9 >> 0] | 0) != 1) {
    i39 = 6;
    break;
   }
   if ((i37 | 0) == (i36 | 0)) {
    i39 = 7;
    break;
   }
   i9 = HEAP32[i24 >> 2] | 0;
   HEAP32[i14 >> 2] = i60 + 3;
   i38 = _xz_dec_lzma2_reset(i9, HEAP8[i1 + 176 + i36 >> 0] | 0) | 0;
   if (i38 | 0) {
    i39 = i38;
    break;
   }
   i38 = HEAP32[i10 >> 2] | 0;
   i36 = HEAP32[i14 >> 2] | 0;
   while (1) {
    if (i36 >>> 0 >= i38 >>> 0) break;
    i9 = i36;
    i36 = i36 + 1 | 0;
    HEAP32[i14 >> 2] = i36;
    if (HEAP8[i1 + 176 + i9 >> 0] | 0) {
     i39 = 6;
     break L5;
    }
   }
   HEAP32[i14 >> 2] = 0;
   HEAP32[i25 >> 2] = 0;
   HEAP32[i25 + 4 >> 2] = 0;
   HEAP32[i25 + 8 >> 2] = 0;
   HEAP32[i25 + 12 >> 2] = 0;
   HEAP32[i1 >> 2] = 3;
   i34 = 43;
  }
  if ((i34 | 0) == 43) {
   i34 = 0;
   HEAP32[i8 >> 2] = HEAP32[i5 >> 2];
   HEAP32[i26 >> 2] = HEAP32[i6 >> 2];
   i36 = _xz_dec_lzma2_run(HEAP32[i24 >> 2] | 0, i2) | 0;
   i38 = i25;
   i37 = _i64Add(HEAP32[i38 >> 2] | 0, HEAP32[i38 + 4 >> 2] | 0, (HEAP32[i5 >> 2] | 0) - (HEAP32[i8 >> 2] | 0) | 0, 0) | 0;
   i38 = tempRet0;
   i9 = i25;
   HEAP32[i9 >> 2] = i37;
   HEAP32[i9 + 4 >> 2] = i38;
   i9 = HEAP32[i26 >> 2] | 0;
   i35 = (HEAP32[i6 >> 2] | 0) - i9 | 0;
   i61 = i27;
   i62 = _i64Add(HEAP32[i61 >> 2] | 0, HEAP32[i61 + 4 >> 2] | 0, i35 | 0, 0) | 0;
   i61 = tempRet0;
   i63 = i27;
   HEAP32[i63 >> 2] = i62;
   HEAP32[i63 + 4 >> 2] = i61;
   i63 = i21;
   i64 = HEAP32[i63 + 4 >> 2] | 0;
   if (i38 >>> 0 > i64 >>> 0 | ((i38 | 0) == (i64 | 0) ? i37 >>> 0 > (HEAP32[i63 >> 2] | 0) >>> 0 : 0)) {
    i39 = 7;
    break;
   }
   i63 = i23;
   i37 = HEAP32[i63 + 4 >> 2] | 0;
   if (i61 >>> 0 > i37 >>> 0 | ((i61 | 0) == (i37 | 0) ? i62 >>> 0 > (HEAP32[i63 >> 2] | 0) >>> 0 : 0)) {
    i39 = 7;
    break;
   }
   switch (HEAP32[i18 >> 2] | 0) {
   case 1:
    {
     i65 = _xz_crc32((HEAP32[i32 >> 2] | 0) + i9 | 0, i35, HEAP32[i12 >> 2] | 0) | 0;
     i66 = 0;
     i34 = 48;
     break;
    }
   case 4:
    {
     i63 = i12;
     i65 = _xz_crc64((HEAP32[i32 >> 2] | 0) + i9 | 0, i35, HEAP32[i63 >> 2] | 0, HEAP32[i63 + 4 >> 2] | 0) | 0;
     i66 = tempRet0;
     i34 = 48;
     break;
    }
   default:
    {}
   }
   if ((i34 | 0) == 48) {
    i34 = 0;
    i63 = i12;
    HEAP32[i63 >> 2] = i65;
    HEAP32[i63 + 4 >> 2] = i66;
   }
   if ((i36 | 0) != 1) {
    i39 = i36;
    break;
   }
   i36 = i21;
   i63 = HEAP32[i36 >> 2] | 0;
   i35 = HEAP32[i36 + 4 >> 2] | 0;
   if (!((i63 | 0) == -1 & (i35 | 0) == -1)) {
    i36 = i25;
    if (!((i63 | 0) == (HEAP32[i36 >> 2] | 0) ? (i35 | 0) == (HEAP32[i36 + 4 >> 2] | 0) : 0)) {
     i39 = 7;
     break;
    }
   }
   i36 = i23;
   i35 = HEAP32[i36 >> 2] | 0;
   i63 = HEAP32[i36 + 4 >> 2] | 0;
   if (!((i35 | 0) == -1 & (i63 | 0) == -1)) {
    i36 = i27;
    if (!((i35 | 0) == (HEAP32[i36 >> 2] | 0) ? (i63 | 0) == (HEAP32[i36 + 4 >> 2] | 0) : 0)) {
     i39 = 7;
     break;
    }
   }
   i36 = i25;
   i63 = _i64Add(HEAP32[i36 >> 2] | 0, HEAP32[i36 + 4 >> 2] | 0, HEAP32[i19 >> 2] | 0, 0) | 0;
   i36 = i28;
   i35 = _i64Add(i63 | 0, tempRet0 | 0, HEAP32[i36 >> 2] | 0, HEAP32[i36 + 4 >> 2] | 0) | 0;
   i36 = tempRet0;
   i63 = i28;
   HEAP32[i63 >> 2] = i35;
   HEAP32[i63 + 4 >> 2] = i36;
   switch (HEAP32[i18 >> 2] | 0) {
   case 1:
    {
     i67 = 4;
     i68 = 0;
     i34 = 56;
     break;
    }
   case 4:
    {
     i67 = 8;
     i68 = 0;
     i34 = 56;
     break;
    }
   default:
    {}
   }
   if ((i34 | 0) == 56) {
    i34 = 0;
    i63 = _i64Add(i67 | 0, i68 | 0, i35 | 0, i36 | 0) | 0;
    i36 = i28;
    HEAP32[i36 >> 2] = i63;
    HEAP32[i36 + 4 >> 2] = tempRet0;
   }
   i36 = i27;
   i63 = i29;
   i35 = _i64Add(HEAP32[i63 >> 2] | 0, HEAP32[i63 + 4 >> 2] | 0, HEAP32[i36 >> 2] | 0, HEAP32[i36 + 4 >> 2] | 0) | 0;
   i36 = i29;
   HEAP32[i36 >> 2] = i35;
   HEAP32[i36 + 4 >> 2] = tempRet0;
   i36 = _xz_crc32(i28, 24, HEAP32[i30 >> 2] | 0) | 0;
   HEAP32[i30 >> 2] = i36;
   i36 = i31;
   i35 = _i64Add(HEAP32[i36 >> 2] | 0, HEAP32[i36 + 4 >> 2] | 0, 1, 0) | 0;
   i36 = i31;
   HEAP32[i36 >> 2] = i35;
   HEAP32[i36 + 4 >> 2] = tempRet0;
   HEAP32[i1 >> 2] = 4;
   i34 = 58;
  }
  if ((i34 | 0) == 58) {
   i34 = 0;
   i36 = i25;
   i35 = HEAP32[i36 >> 2] | 0;
   if (!((i35 & 3 | 0) == 0 & 0 == 0)) {
    i63 = HEAP32[i13 >> 2] | 0;
    i9 = HEAP32[i5 >> 2] | 0;
    i62 = i35;
    i35 = HEAP32[i36 + 4 >> 2] | 0;
    do {
     if ((i9 | 0) == (i63 | 0)) {
      i39 = 0;
      break L5;
     }
     i36 = HEAP32[i2 >> 2] | 0;
     i37 = i9;
     i9 = i9 + 1 | 0;
     HEAP32[i5 >> 2] = i9;
     if (HEAP8[i36 + i37 >> 0] | 0) {
      i39 = 7;
      break L5;
     }
     i62 = _i64Add(i62 | 0, i35 | 0, 1, 0) | 0;
     i35 = tempRet0;
     i37 = i25;
     HEAP32[i37 >> 2] = i62;
     HEAP32[i37 + 4 >> 2] = i35;
    } while (!((i62 & 3 | 0) == 0 & 0 == 0));
   }
   HEAP32[i1 >> 2] = 5;
   i34 = 64;
  }
  L86 : do if ((i34 | 0) == 64) {
   i34 = 0;
   switch (HEAP32[i18 >> 2] | 0) {
   case 1:
    {
     i62 = HEAP32[i13 >> 2] | 0;
     i35 = HEAP32[i5 >> 2] | 0;
     do {
      if ((i35 | 0) == (i62 | 0)) {
       i39 = 0;
       break L5;
      }
      i9 = i12;
      i63 = HEAP32[i11 >> 2] | 0;
      i37 = _bitshift64Lshr(HEAP32[i9 >> 2] | 0, HEAP32[i9 + 4 >> 2] | 0, i63 | 0) | 0;
      i9 = HEAP32[i2 >> 2] | 0;
      i36 = i35;
      i35 = i35 + 1 | 0;
      HEAP32[i5 >> 2] = i35;
      if ((HEAP8[i9 + i36 >> 0] | 0) != (i37 & 255) << 24 >> 24) {
       i39 = 7;
       break L5;
      }
      i37 = i63 + 8 | 0;
      HEAP32[i11 >> 2] = i37;
     } while (i37 >>> 0 < 32);
     i35 = i12;
     HEAP32[i35 >> 2] = 0;
     HEAP32[i35 + 4 >> 2] = 0;
     HEAP32[i11 >> 2] = 0;
     i44 = 1;
     break L86;
     break;
    }
   case 4:
    {
     i35 = HEAP32[i13 >> 2] | 0;
     i62 = HEAP32[i5 >> 2] | 0;
     do {
      if ((i62 | 0) == (i35 | 0)) {
       i39 = 0;
       break L5;
      }
      i37 = i12;
      i63 = HEAP32[i11 >> 2] | 0;
      i36 = _bitshift64Lshr(HEAP32[i37 >> 2] | 0, HEAP32[i37 + 4 >> 2] | 0, i63 | 0) | 0;
      i37 = HEAP32[i2 >> 2] | 0;
      i9 = i62;
      i62 = i62 + 1 | 0;
      HEAP32[i5 >> 2] = i62;
      if ((HEAP8[i37 + i9 >> 0] | 0) != (i36 & 255) << 24 >> 24) {
       i39 = 7;
       break L5;
      }
      i36 = i63 + 8 | 0;
      HEAP32[i11 >> 2] = i36;
     } while (i36 >>> 0 < 64);
     i62 = i12;
     HEAP32[i62 >> 2] = 0;
     HEAP32[i62 + 4 >> 2] = 0;
     HEAP32[i11 >> 2] = 0;
     i44 = 1;
     break L86;
     break;
    }
   default:
    {
     i44 = 1;
     break L86;
    }
   }
  } while (0);
  HEAP32[i1 >> 2] = i44;
  i33 = i44;
 }
 L102 : do if ((i34 | 0) == 75) {
  i44 = i1 + 120 | 0;
  i33 = i1 + 136 | 0;
  i25 = i1 + 144 | 0;
  i30 = i1 + 144 | 0;
  i29 = i1 + 152 | 0;
  i27 = i1 + 160 | 0;
  L106 : while (1) {
   i69 = HEAP32[i2 >> 2] | 0;
   i68 = HEAP32[i13 >> 2] | 0;
   if (!(HEAP32[i11 >> 2] | 0)) {
    i67 = i22;
    HEAP32[i67 >> 2] = 0;
    HEAP32[i67 + 4 >> 2] = 0;
   }
   while (1) {
    i67 = HEAP32[i5 >> 2] | 0;
    if (i67 >>> 0 >= i68 >>> 0) {
     i70 = 0;
     i71 = i67;
     i34 = 82;
     break L106;
    }
    i72 = HEAP8[i69 + i67 >> 0] | 0;
    i73 = i67 + 1 | 0;
    HEAP32[i5 >> 2] = i73;
    i67 = i72 & 255;
    i74 = HEAP32[i11 >> 2] | 0;
    i19 = _bitshift64Shl(i67 & 127 | 0, 0, i74 | 0) | 0;
    i23 = i22;
    i75 = i19 | HEAP32[i23 >> 2];
    i76 = tempRet0 | HEAP32[i23 + 4 >> 2];
    i23 = i22;
    HEAP32[i23 >> 2] = i75;
    HEAP32[i23 + 4 >> 2] = i76;
    if (!(i67 & 128)) break;
    i67 = i74 + 7 | 0;
    HEAP32[i11 >> 2] = i67;
    if ((i67 | 0) == 63) {
     i70 = 7;
     i71 = i73;
     i34 = 82;
     break L106;
    }
   }
   if (!(i72 << 24 >> 24 != 0 | (i74 | 0) == 0)) {
    i70 = 7;
    i71 = i73;
    i34 = 82;
    break;
   }
   HEAP32[i11 >> 2] = 0;
   switch (HEAP32[i44 >> 2] | 0) {
   case 0:
    {
     i68 = i33;
     HEAP32[i68 >> 2] = i75;
     HEAP32[i68 + 4 >> 2] = i76;
     i68 = i31;
     if ((i75 | 0) == (HEAP32[i68 >> 2] | 0) ? (i76 | 0) == (HEAP32[i68 + 4 >> 2] | 0) : 0) {
      i77 = 1;
      i34 = 87;
     } else {
      i39 = 7;
      break L102;
     }
     break;
    }
   case 1:
    {
     i78 = 2;
     i79 = i25;
     i80 = i75;
     i81 = i76;
     i34 = 86;
     break;
    }
   case 2:
    {
     i68 = i29;
     i67 = _i64Add(HEAP32[i68 >> 2] | 0, HEAP32[i68 + 4 >> 2] | 0, i75 | 0, i76 | 0) | 0;
     i68 = i29;
     HEAP32[i68 >> 2] = i67;
     HEAP32[i68 + 4 >> 2] = tempRet0;
     i68 = _xz_crc32(i30, 24, HEAP32[i27 >> 2] | 0) | 0;
     HEAP32[i27 >> 2] = i68;
     i78 = 1;
     i79 = i33;
     i80 = -1;
     i81 = -1;
     i34 = 86;
     break;
    }
   default:
    {}
   }
   if ((i34 | 0) == 86) {
    i34 = 0;
    i68 = i79;
    i67 = _i64Add(HEAP32[i68 >> 2] | 0, HEAP32[i68 + 4 >> 2] | 0, i80 | 0, i81 | 0) | 0;
    i68 = i79;
    HEAP32[i68 >> 2] = i67;
    HEAP32[i68 + 4 >> 2] = tempRet0;
    i77 = i78;
    i34 = 87;
   }
   if ((i34 | 0) == 87) {
    i34 = 0;
    HEAP32[i44 >> 2] = i77;
   }
   i68 = i33;
   if ((HEAP32[i68 >> 2] | 0) == 0 & (HEAP32[i68 + 4 >> 2] | 0) == 0) {
    i34 = 89;
    break;
   }
  }
  if ((i34 | 0) == 82) {
   i33 = HEAP32[i8 >> 2] | 0;
   i44 = i71 - i33 | 0;
   i27 = i1 + 128 | 0;
   i30 = i27;
   i29 = _i64Add(HEAP32[i30 >> 2] | 0, HEAP32[i30 + 4 >> 2] | 0, i44 | 0, 0) | 0;
   i30 = i27;
   HEAP32[i30 >> 2] = i29;
   HEAP32[i30 + 4 >> 2] = tempRet0;
   i30 = _xz_crc32(i69 + i33 | 0, i44, HEAP32[i12 >> 2] | 0) | 0;
   i44 = i12;
   HEAP32[i44 >> 2] = i30;
   HEAP32[i44 + 4 >> 2] = 0;
   i39 = i70;
   break;
  } else if ((i34 | 0) == 89) {
   HEAP32[i1 >> 2] = 7;
   i34 = 90;
   break;
  }
 } else if ((i34 | 0) == 102) {
  i82 = HEAP32[i5 >> 2] | 0;
  i83 = HEAP32[i13 >> 2] | 0;
  i84 = HEAP32[i10 >> 2] | 0;
  i85 = HEAP32[i2 >> 2] | 0;
  i34 = 103;
 } else if ((i34 | 0) == 121) while (1) {
  i34 = 0;
  i34 = 121;
 } while (0);
 L128 : do if ((i34 | 0) == 90) {
  i70 = i1 + 128 | 0;
  i69 = i70;
  i71 = HEAP32[i69 >> 2] | 0;
  i77 = HEAP32[i69 + 4 >> 2] | 0;
  i69 = HEAP32[i8 >> 2] | 0;
  i78 = HEAP32[i5 >> 2] | 0;
  while (1) {
   i86 = i78 - i69 | 0;
   i87 = _i64Add(i71 | 0, i77 | 0, i86 | 0, 0) | 0;
   i88 = tempRet0;
   if ((i87 & 3 | 0) == 0 & 0 == 0) break;
   i89 = HEAP32[i2 >> 2] | 0;
   if ((i78 | 0) == (HEAP32[i13 >> 2] | 0)) {
    i34 = 93;
    break;
   }
   i79 = i78;
   i78 = i78 + 1 | 0;
   HEAP32[i5 >> 2] = i78;
   if (HEAP8[i89 + i79 >> 0] | 0) {
    i39 = 7;
    break L128;
   }
  }
  if ((i34 | 0) == 93) {
   i78 = i70;
   HEAP32[i78 >> 2] = i87;
   HEAP32[i78 + 4 >> 2] = i88;
   i78 = _xz_crc32(i89 + i69 | 0, i86, HEAP32[i12 >> 2] | 0) | 0;
   i77 = i12;
   HEAP32[i77 >> 2] = i78;
   HEAP32[i77 + 4 >> 2] = 0;
   i39 = 0;
   break;
  }
  i77 = HEAP32[i2 >> 2] | 0;
  i78 = i70;
  HEAP32[i78 >> 2] = i87;
  HEAP32[i78 + 4 >> 2] = i88;
  i78 = _xz_crc32(i77 + i69 | 0, i86, HEAP32[i12 >> 2] | 0) | 0;
  i77 = i12;
  HEAP32[i77 >> 2] = i78;
  HEAP32[i77 + 4 >> 2] = 0;
  if (!(_memcmp(i28, i1 + 144 | 0, 24) | 0)) {
   HEAP32[i1 >> 2] = 8;
   i34 = 97;
  } else i39 = 7;
 } while (0);
 L138 : do if ((i34 | 0) == 97) {
  i28 = HEAP32[i13 >> 2] | 0;
  i86 = HEAP32[i5 >> 2] | 0;
  do {
   if ((i86 | 0) == (i28 | 0)) {
    i39 = 0;
    break L138;
   }
   i88 = i12;
   i87 = HEAP32[i11 >> 2] | 0;
   i89 = _bitshift64Lshr(HEAP32[i88 >> 2] | 0, HEAP32[i88 + 4 >> 2] | 0, i87 | 0) | 0;
   i90 = HEAP32[i2 >> 2] | 0;
   i88 = i86;
   i86 = i86 + 1 | 0;
   HEAP32[i5 >> 2] = i86;
   if ((HEAP8[i90 + i88 >> 0] | 0) != (i89 & 255) << 24 >> 24) {
    i39 = 7;
    break L138;
   }
   i89 = i87 + 8 | 0;
   HEAP32[i11 >> 2] = i89;
  } while (i89 >>> 0 < 32);
  i69 = i12;
  HEAP32[i69 >> 2] = 0;
  HEAP32[i69 + 4 >> 2] = 0;
  HEAP32[i11 >> 2] = 0;
  HEAP32[i10 >> 2] = 12;
  HEAP32[i1 >> 2] = 9;
  i82 = i86;
  i83 = i28;
  i84 = 12;
  i85 = i90;
  i34 = 103;
 } while (0);
 if ((i34 | 0) == 103) {
  i34 = i83 - i82 | 0;
  i83 = HEAP32[i14 >> 2] | 0;
  i90 = i84 - i83 | 0;
  i84 = i34 >>> 0 < i90 >>> 0 ? i34 : i90;
  _memcpy(i1 + 176 + i83 | 0, i85 + i82 | 0, i84 | 0) | 0;
  HEAP32[i5 >> 2] = i84 + (HEAP32[i5 >> 2] | 0);
  i82 = (HEAP32[i14 >> 2] | 0) + i84 | 0;
  i84 = (i82 | 0) == (HEAP32[i10 >> 2] | 0);
  HEAP32[i14 >> 2] = i84 ? 0 : i82;
  if (i84) if (!(_memcmp(i1 + 186 | 0, 1030, 2) | 0)) {
   i84 = i1 + 180 | 0;
   i82 = _xz_crc32(i84, 6, 0) | 0;
   if ((i82 | 0) == (HEAPU8[i20 >> 0] << 8 | HEAPU8[i15 >> 0] | HEAPU8[i1 + 178 >> 0] << 16 | HEAPU8[i1 + 179 >> 0] << 24 | 0)) {
    i15 = i1 + 128 | 0;
    i20 = _bitshift64Lshr(HEAP32[i15 >> 2] | 0, HEAP32[i15 + 4 >> 2] | 0, 2) | 0;
    if ((tempRet0 | 0) == 0 ? (i20 | 0) == (HEAPU8[i1 + 181 >> 0] << 8 | HEAPU8[i84 >> 0] | HEAPU8[i16 >> 0] << 16 | HEAPU8[i17 >> 0] << 24 | 0) : 0) if (!(HEAP8[i1 + 184 >> 0] | 0)) i39 = (HEAP32[i18 >> 2] | 0) == (HEAPU8[i1 + 185 >> 0] | 0) ? 1 : 7; else i39 = 7; else i39 = 7;
   } else i39 = 7;
  } else i39 = 7; else i39 = 0;
 }
 i18 = (i39 | 0) == 0;
 if (!(HEAP32[i3 >> 2] | 0)) {
  if (i18) i91 = (HEAP32[i5 >> 2] | 0) == (HEAP32[i13 >> 2] | 0) ? 7 : 8; else if ((i39 | 0) == 1) {
   i92 = 1;
   return i92 | 0;
  } else i91 = i39;
  HEAP32[i5 >> 2] = i4;
  HEAP32[i6 >> 2] = i7;
  i92 = i91;
  return i92 | 0;
 } else {
  if (i18) if ((i4 | 0) == (HEAP32[i5 >> 2] | 0)) if ((i7 | 0) == (HEAP32[i6 >> 2] | 0)) {
   i93 = (HEAP8[i1 + 40 >> 0] | 0) == 0 ? 0 : 8;
   i94 = 1;
  } else {
   i93 = 0;
   i94 = 0;
  } else {
   i93 = 0;
   i94 = 0;
  } else {
   i93 = i39;
   i94 = 0;
  }
  HEAP8[i1 + 40 >> 0] = i94;
  i92 = i93;
  return i92 | 0;
 }
 return 0;
}

function _lzma_main(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i66 = 0, i67 = 0, i68 = 0, i69 = 0, i70 = 0, i71 = 0, i72 = 0, i73 = 0, i74 = 0, i75 = 0, i76 = 0, i77 = 0, i78 = 0, i79 = 0, i80 = 0, i81 = 0, i82 = 0, i83 = 0, i84 = 0, i85 = 0, i86 = 0, i87 = 0, i88 = 0, i89 = 0, i90 = 0, i91 = 0, i92 = 0, i93 = 0, i94 = 0, i95 = 0, i96 = 0, i97 = 0, i98 = 0, i99 = 0, i100 = 0, i101 = 0, i102 = 0, i103 = 0, i104 = 0, i105 = 0, i106 = 0, i107 = 0, i108 = 0, i109 = 0;
 i2 = i1 + 24 | 0;
 i3 = i1 + 32 | 0;
 i4 = HEAP32[i3 >> 2] | 0;
 i5 = i1 + 40 | 0;
 i6 = HEAP32[i5 >> 2] | 0;
 if (i6 >>> 0 > i4 >>> 0) {
  i7 = i1 + 104 | 0;
  i8 = HEAP32[i7 >> 2] | 0;
  if (!i8) i9 = i4; else {
   i10 = HEAP32[i1 + 84 >> 2] | 0;
   i11 = i1 + 36 | 0;
   if ((HEAP32[i11 >> 2] | 0) >>> 0 > i10 >>> 0) if ((HEAP32[i1 + 48 >> 2] | 0) >>> 0 > i10 >>> 0) {
    i12 = i6 - i4 | 0;
    i6 = i12 >>> 0 < i8 >>> 0 ? i12 : i8;
    HEAP32[i7 >> 2] = i8 - i6;
    i8 = i4 - i10 + -1 | 0;
    i7 = i1 + 44 | 0;
    if (i4 >>> 0 > i10 >>> 0) i13 = i8; else i13 = (HEAP32[i7 >> 2] | 0) + i8 | 0;
    i8 = HEAP32[i2 >> 2] | 0;
    i10 = HEAP8[i8 + i13 >> 0] | 0;
    HEAP32[i3 >> 2] = i4 + 1;
    HEAP8[i8 + i4 >> 0] = i10;
    i10 = i6 + -1 | 0;
    if (i10 | 0) {
     i6 = i13;
     i13 = i10;
     do {
      i10 = i6 + 1 | 0;
      i6 = (i10 | 0) == (HEAP32[i7 >> 2] | 0) ? 0 : i10;
      i10 = HEAP32[i3 >> 2] | 0;
      i8 = HEAP32[i2 >> 2] | 0;
      i12 = HEAP8[i8 + i6 >> 0] | 0;
      HEAP32[i3 >> 2] = i10 + 1;
      HEAP8[i8 + i10 >> 0] = i12;
      i13 = i13 + -1 | 0;
     } while ((i13 | 0) != 0);
    }
    i13 = HEAP32[i3 >> 2] | 0;
    if ((HEAP32[i11 >> 2] | 0) >>> 0 < i13 >>> 0) {
     HEAP32[i11 >> 2] = i13;
     i9 = i13;
    } else i9 = i13;
   } else i9 = i4; else i9 = i4;
  }
 } else i9 = i4;
 L15 : do if (i9 >>> 0 < (HEAP32[i5 >> 2] | 0) >>> 0) {
  i4 = i1 + 16 | 0;
  i13 = i1 + 20 | 0;
  i11 = i1 + 116 | 0;
  i6 = i1 + 100 | 0;
  i7 = i1 + 4 | 0;
  i12 = i1 + 12 | 0;
  i10 = i1 + 44 | 0;
  i8 = i1 + 36 | 0;
  i14 = i1 + 108 | 0;
  i15 = i1 + 112 | 0;
  i16 = i1 + 24 | 0;
  i17 = i1 + 84 | 0;
  i18 = i1 + 92 | 0;
  i19 = i1 + 96 | 0;
  i20 = i1 + 88 | 0;
  i21 = i1 + 1756 | 0;
  i22 = i1 + 104 | 0;
  i23 = i1 + 1726 | 0;
  i24 = i1 + 48 | 0;
  i25 = i1 + 2784 | 0;
  i26 = i9;
  while (1) {
   i27 = HEAP32[i4 >> 2] | 0;
   if (i27 >>> 0 > (HEAP32[i13 >> 2] | 0) >>> 0) {
    i28 = i1;
    break L15;
   }
   i29 = HEAP32[i11 >> 2] & i26;
   i30 = i1 + 120 + (HEAP32[i6 >> 2] << 5) + (i29 << 1) | 0;
   i31 = HEAP32[i1 >> 2] | 0;
   if (i31 >>> 0 < 16777216) {
    i32 = i31 << 8;
    HEAP32[i1 >> 2] = i32;
    i33 = HEAP32[i7 >> 2] << 8;
    i34 = HEAP32[i12 >> 2] | 0;
    HEAP32[i4 >> 2] = i27 + 1;
    i35 = i33 | (HEAPU8[i34 + i27 >> 0] | 0);
    HEAP32[i7 >> 2] = i35;
    i36 = i32;
    i37 = i35;
   } else {
    i36 = i31;
    i37 = HEAP32[i7 >> 2] | 0;
   }
   i31 = HEAPU16[i30 >> 1] | 0;
   i35 = Math_imul(i36 >>> 11, i31) | 0;
   if (i37 >>> 0 < i35 >>> 0) {
    HEAP32[i1 >> 2] = i35;
    HEAP16[i30 >> 1] = ((2048 - i31 | 0) >>> 5) + i31;
    i32 = HEAP32[i3 >> 2] | 0;
    i27 = i32 + -1 | 0;
    if (!i32) i38 = (HEAP32[i10 >> 2] | 0) + i27 | 0; else i38 = i27;
    i27 = (HEAP32[i8 >> 2] | 0) == 0;
    if (i27) i39 = 0; else i39 = HEAPU8[(HEAP32[i16 >> 2] | 0) + i38 >> 0] | 0;
    i34 = HEAP32[i14 >> 2] | 0;
    i33 = ((HEAP32[i15 >> 2] & i32) << i34) + (i39 >>> (8 - i34 | 0)) | 0;
    if ((HEAP32[i6 >> 2] | 0) >>> 0 < 7) {
     i34 = 1;
     i40 = HEAP32[i1 >> 2] | 0;
     while (1) {
      i41 = i1 + 3812 + (i33 * 1536 | 0) + (i34 << 1) | 0;
      if (i40 >>> 0 < 16777216) {
       i42 = i40 << 8;
       HEAP32[i1 >> 2] = i42;
       i43 = HEAP32[i7 >> 2] << 8;
       i44 = HEAP32[i12 >> 2] | 0;
       i45 = HEAP32[i4 >> 2] | 0;
       HEAP32[i4 >> 2] = i45 + 1;
       i46 = i43 | (HEAPU8[i44 + i45 >> 0] | 0);
       HEAP32[i7 >> 2] = i46;
       i47 = i42;
       i48 = i46;
      } else {
       i47 = i40;
       i48 = HEAP32[i7 >> 2] | 0;
      }
      i46 = HEAPU16[i41 >> 1] | 0;
      i42 = Math_imul(i47 >>> 11, i46) | 0;
      if (i48 >>> 0 < i42 >>> 0) {
       HEAP32[i1 >> 2] = i42;
       i49 = 0;
       i50 = i42;
       i51 = (2048 - i46 >> 5) + i46 | 0;
      } else {
       i45 = i47 - i42 | 0;
       HEAP32[i1 >> 2] = i45;
       HEAP32[i7 >> 2] = i48 - i42;
       i49 = 1;
       i50 = i45;
       i51 = i46 - (i46 >>> 5) | 0;
      }
      HEAP16[i41 >> 1] = i51;
      i41 = i49 | i34 << 1;
      if (i41 >>> 0 < 256) {
       i34 = i41;
       i40 = i50;
      } else {
       i52 = i41;
       break;
      }
     }
    } else {
     i40 = HEAP32[i17 >> 2] | 0;
     i34 = i32 - i40 + -1 | 0;
     if (i32 >>> 0 > i40 >>> 0) i53 = i34; else i53 = (HEAP32[i10 >> 2] | 0) + i34 | 0;
     if (i27) {
      i54 = 1;
      i55 = 256;
      i56 = 0;
     } else {
      i54 = 1;
      i55 = 256;
      i56 = HEAPU8[(HEAP32[i16 >> 2] | 0) + i53 >> 0] | 0;
     }
     while (1) {
      i56 = i56 << 1;
      i34 = i56 & i55;
      i40 = i1 + 3812 + (i33 * 1536 | 0) + (i34 + i55 + i54 << 1) | 0;
      i41 = HEAP32[i1 >> 2] | 0;
      if (i41 >>> 0 < 16777216) {
       i46 = i41 << 8;
       HEAP32[i1 >> 2] = i46;
       i45 = HEAP32[i7 >> 2] << 8;
       i42 = HEAP32[i12 >> 2] | 0;
       i44 = HEAP32[i4 >> 2] | 0;
       HEAP32[i4 >> 2] = i44 + 1;
       i43 = i45 | (HEAPU8[i42 + i44 >> 0] | 0);
       HEAP32[i7 >> 2] = i43;
       i57 = i46;
       i58 = i43;
      } else {
       i57 = i41;
       i58 = HEAP32[i7 >> 2] | 0;
      }
      i41 = HEAPU16[i40 >> 1] | 0;
      i43 = Math_imul(i57 >>> 11, i41) | 0;
      if (i58 >>> 0 < i43 >>> 0) {
       HEAP32[i1 >> 2] = i43;
       i59 = 1;
       i60 = (2048 - i41 >> 5) + i41 | 0;
      } else {
       HEAP32[i1 >> 2] = i57 - i43;
       HEAP32[i7 >> 2] = i58 - i43;
       i59 = 0;
       i60 = i41 - (i41 >>> 5) | 0;
      }
      HEAP16[i40 >> 1] = i60;
      i40 = i54 << 1 | (i59 ^ 1) & 1;
      if (i40 >>> 0 >= 256) {
       i52 = i40;
       break;
      } else {
       i54 = i40;
       i55 = (i59 ? i55 : 0) ^ i34;
      }
     }
    }
    i33 = HEAP32[i16 >> 2] | 0;
    i27 = HEAP32[i3 >> 2] | 0;
    HEAP32[i3 >> 2] = i27 + 1;
    HEAP8[i33 + i27 >> 0] = i52;
    i27 = HEAP32[i3 >> 2] | 0;
    if ((HEAP32[i8 >> 2] | 0) >>> 0 < i27 >>> 0) HEAP32[i8 >> 2] = i27;
    i33 = HEAP32[i6 >> 2] | 0;
    HEAP32[i6 >> 2] = i33 >>> 0 < 4 ? 0 : i33 - (i33 >>> 0 < 10 ? 3 : 6) | 0;
    i61 = i27;
   } else {
    HEAP32[i1 >> 2] = i36 - i35;
    HEAP32[i7 >> 2] = i37 - i35;
    HEAP16[i30 >> 1] = i31 - (i31 >>> 5);
    i27 = i1 + 504 + (HEAP32[i6 >> 2] << 1) | 0;
    i33 = HEAP32[i1 >> 2] | 0;
    if (i33 >>> 0 < 16777216) {
     i32 = i33 << 8;
     HEAP32[i1 >> 2] = i32;
     i34 = HEAP32[i7 >> 2] << 8;
     i40 = HEAP32[i12 >> 2] | 0;
     i41 = HEAP32[i4 >> 2] | 0;
     HEAP32[i4 >> 2] = i41 + 1;
     i43 = i34 | (HEAPU8[i40 + i41 >> 0] | 0);
     HEAP32[i7 >> 2] = i43;
     i62 = i32;
     i63 = i43;
    } else {
     i62 = i33;
     i63 = HEAP32[i7 >> 2] | 0;
    }
    i33 = HEAPU16[i27 >> 1] | 0;
    i43 = Math_imul(i62 >>> 11, i33) | 0;
    L69 : do if (i63 >>> 0 < i43 >>> 0) {
     HEAP32[i1 >> 2] = i43;
     HEAP16[i27 >> 1] = ((2048 - i33 | 0) >>> 5) + i33;
     HEAP32[i6 >> 2] = (HEAP32[i6 >> 2] | 0) >>> 0 < 7 ? 7 : 10;
     HEAP32[i19 >> 2] = HEAP32[i18 >> 2];
     HEAP32[i18 >> 2] = HEAP32[i20 >> 2];
     HEAP32[i20 >> 2] = HEAP32[i17 >> 2];
     _lzma_len(i1, i21, i29);
     i32 = HEAP32[i22 >> 2] | 0;
     i41 = i32 >>> 0 < 6 ? i32 + -2 | 0 : 3;
     i32 = 1;
     i40 = HEAP32[i1 >> 2] | 0;
     while (1) {
      i34 = i1 + 984 + (i41 << 7) + (i32 << 1) | 0;
      if (i40 >>> 0 < 16777216) {
       i46 = i40 << 8;
       HEAP32[i1 >> 2] = i46;
       i44 = HEAP32[i7 >> 2] << 8;
       i42 = HEAP32[i12 >> 2] | 0;
       i45 = HEAP32[i4 >> 2] | 0;
       HEAP32[i4 >> 2] = i45 + 1;
       i64 = i44 | (HEAPU8[i42 + i45 >> 0] | 0);
       HEAP32[i7 >> 2] = i64;
       i65 = i46;
       i66 = i64;
      } else {
       i65 = i40;
       i66 = HEAP32[i7 >> 2] | 0;
      }
      i64 = HEAPU16[i34 >> 1] | 0;
      i46 = Math_imul(i65 >>> 11, i64) | 0;
      if (i66 >>> 0 < i46 >>> 0) {
       HEAP32[i1 >> 2] = i46;
       i67 = 0;
       i68 = i46;
       i69 = (2048 - i64 >> 5) + i64 | 0;
      } else {
       i45 = i65 - i46 | 0;
       HEAP32[i1 >> 2] = i45;
       HEAP32[i7 >> 2] = i66 - i46;
       i67 = 1;
       i68 = i45;
       i69 = i64 - (i64 >>> 5) | 0;
      }
      HEAP16[i34 >> 1] = i69;
      i32 = i67 | i32 << 1;
      if (i32 >>> 0 >= 64) break; else i40 = i68;
     }
     i40 = i32 + -64 | 0;
     if (i40 >>> 0 < 4) {
      HEAP32[i17 >> 2] = i40;
      break;
     }
     i41 = i40 >>> 1;
     i34 = i41 + -1 | 0;
     i64 = i40 & 1 | 2;
     HEAP32[i17 >> 2] = i64;
     if (i40 >>> 0 < 14) {
      i40 = i64 << i34;
      HEAP32[i17 >> 2] = i40;
      i45 = i1 + 1496 + (i40 << 1) + (64 - i32 << 1) + -2 | 0;
      i40 = 0;
      i46 = 1;
      while (1) {
       i42 = i45 + (i46 << 1) | 0;
       i44 = HEAP32[i1 >> 2] | 0;
       if (i44 >>> 0 < 16777216) {
        i70 = i44 << 8;
        HEAP32[i1 >> 2] = i70;
        i71 = HEAP32[i7 >> 2] << 8;
        i72 = HEAP32[i12 >> 2] | 0;
        i73 = HEAP32[i4 >> 2] | 0;
        HEAP32[i4 >> 2] = i73 + 1;
        i74 = i71 | (HEAPU8[i72 + i73 >> 0] | 0);
        HEAP32[i7 >> 2] = i74;
        i75 = i70;
        i76 = i74;
       } else {
        i75 = i44;
        i76 = HEAP32[i7 >> 2] | 0;
       }
       i44 = HEAPU16[i42 >> 1] | 0;
       i74 = Math_imul(i75 >>> 11, i44) | 0;
       if (i76 >>> 0 < i74 >>> 0) {
        HEAP32[i1 >> 2] = i74;
        HEAP16[i42 >> 1] = ((2048 - i44 | 0) >>> 5) + i44;
        i77 = i46 << 1;
       } else {
        HEAP32[i1 >> 2] = i75 - i74;
        HEAP32[i7 >> 2] = i76 - i74;
        HEAP16[i42 >> 1] = i44 - (i44 >>> 5);
        HEAP32[i17 >> 2] = (HEAP32[i17 >> 2] | 0) + (1 << i40);
        i77 = i46 << 1 | 1;
       }
       i40 = i40 + 1 | 0;
       if (i40 >>> 0 >= i34 >>> 0) break L69; else i46 = i77;
      }
     }
     i46 = i41 + -5 | 0;
     i34 = HEAP32[i1 >> 2] | 0;
     i40 = i64;
     do {
      if (i34 >>> 0 < 16777216) {
       i45 = i34 << 8;
       HEAP32[i1 >> 2] = i45;
       i32 = HEAP32[i7 >> 2] << 8;
       i44 = HEAP32[i12 >> 2] | 0;
       i42 = HEAP32[i4 >> 2] | 0;
       HEAP32[i4 >> 2] = i42 + 1;
       i74 = i32 | (HEAPU8[i44 + i42 >> 0] | 0);
       HEAP32[i7 >> 2] = i74;
       i78 = i45;
       i79 = i74;
      } else {
       i78 = i34;
       i79 = HEAP32[i7 >> 2] | 0;
      }
      i34 = i78 >>> 1;
      HEAP32[i1 >> 2] = i34;
      i74 = i79 - i34 | 0;
      i45 = i74 >> 31;
      i80 = (i45 & i34) + i74 | 0;
      HEAP32[i7 >> 2] = i80;
      i40 = (i40 << 1 | 1) + i45 | 0;
      HEAP32[i17 >> 2] = i40;
      i46 = i46 + -1 | 0;
     } while ((i46 | 0) != 0);
     i46 = i40 << 4;
     HEAP32[i17 >> 2] = i46;
     if (i78 >>> 0 < 33554432) {
      i64 = i34 << 8;
      HEAP32[i1 >> 2] = i64;
      i41 = HEAP32[i12 >> 2] | 0;
      i45 = HEAP32[i4 >> 2] | 0;
      HEAP32[i4 >> 2] = i45 + 1;
      i74 = i80 << 8 | (HEAPU8[i41 + i45 >> 0] | 0);
      HEAP32[i7 >> 2] = i74;
      i81 = i64;
      i82 = i74;
     } else {
      i81 = i34;
      i82 = i80;
     }
     i74 = HEAPU16[i23 >> 1] | 0;
     i64 = Math_imul(i81 >>> 11, i74) | 0;
     if (i82 >>> 0 < i64 >>> 0) {
      HEAP32[i1 >> 2] = i64;
      HEAP16[i23 >> 1] = ((2048 - i74 | 0) >>> 5) + i74;
      i83 = 2;
      i84 = i64;
      i85 = i82;
      i86 = i46;
     } else {
      i45 = i81 - i64 | 0;
      HEAP32[i1 >> 2] = i45;
      i41 = i82 - i64 | 0;
      HEAP32[i7 >> 2] = i41;
      HEAP16[i23 >> 1] = i74 - (i74 >>> 5);
      i74 = i46 | 1;
      HEAP32[i17 >> 2] = i74;
      i83 = 3;
      i84 = i45;
      i85 = i41;
      i86 = i74;
     }
     i74 = i1 + 1724 + (i83 << 1) | 0;
     if (i84 >>> 0 < 16777216) {
      i41 = i84 << 8;
      HEAP32[i1 >> 2] = i41;
      i45 = HEAP32[i12 >> 2] | 0;
      i46 = HEAP32[i4 >> 2] | 0;
      HEAP32[i4 >> 2] = i46 + 1;
      i64 = i85 << 8 | (HEAPU8[i45 + i46 >> 0] | 0);
      HEAP32[i7 >> 2] = i64;
      i87 = i41;
      i88 = i64;
     } else {
      i87 = i84;
      i88 = i85;
     }
     i64 = HEAPU16[i74 >> 1] | 0;
     i41 = Math_imul(i87 >>> 11, i64) | 0;
     if (i88 >>> 0 < i41 >>> 0) {
      HEAP32[i1 >> 2] = i41;
      HEAP16[i74 >> 1] = ((2048 - i64 | 0) >>> 5) + i64;
      i89 = i83 << 1;
      i90 = i41;
      i91 = i88;
     } else {
      i46 = i87 - i41 | 0;
      HEAP32[i1 >> 2] = i46;
      i45 = i88 - i41 | 0;
      HEAP32[i7 >> 2] = i45;
      HEAP16[i74 >> 1] = i64 - (i64 >>> 5);
      HEAP32[i17 >> 2] = i86 + 2;
      i89 = i83 << 1 | 1;
      i90 = i46;
      i91 = i45;
     }
     i45 = i1 + 1724 + (i89 << 1) | 0;
     if (i90 >>> 0 < 16777216) {
      i46 = i90 << 8;
      HEAP32[i1 >> 2] = i46;
      i64 = HEAP32[i12 >> 2] | 0;
      i74 = HEAP32[i4 >> 2] | 0;
      HEAP32[i4 >> 2] = i74 + 1;
      i41 = i91 << 8 | (HEAPU8[i64 + i74 >> 0] | 0);
      HEAP32[i7 >> 2] = i41;
      i92 = i46;
      i93 = i41;
     } else {
      i92 = i90;
      i93 = i91;
     }
     i41 = HEAPU16[i45 >> 1] | 0;
     i46 = Math_imul(i92 >>> 11, i41) | 0;
     if (i93 >>> 0 < i46 >>> 0) {
      HEAP32[i1 >> 2] = i46;
      HEAP16[i45 >> 1] = ((2048 - i41 | 0) >>> 5) + i41;
      i94 = i89 << 1;
     } else {
      HEAP32[i1 >> 2] = i92 - i46;
      HEAP32[i7 >> 2] = i93 - i46;
      HEAP16[i45 >> 1] = i41 - (i41 >>> 5);
      HEAP32[i17 >> 2] = (HEAP32[i17 >> 2] | 0) + 4;
      i94 = i89 << 1 | 1;
     }
     i41 = i1 + 1724 + (i94 << 1) | 0;
     i45 = HEAP32[i1 >> 2] | 0;
     if (i45 >>> 0 < 16777216) {
      i46 = i45 << 8;
      HEAP32[i1 >> 2] = i46;
      i74 = HEAP32[i7 >> 2] << 8;
      i64 = HEAP32[i12 >> 2] | 0;
      i42 = HEAP32[i4 >> 2] | 0;
      HEAP32[i4 >> 2] = i42 + 1;
      i44 = i74 | (HEAPU8[i64 + i42 >> 0] | 0);
      HEAP32[i7 >> 2] = i44;
      i95 = i46;
      i96 = i44;
     } else {
      i95 = i45;
      i96 = HEAP32[i7 >> 2] | 0;
     }
     i45 = HEAPU16[i41 >> 1] | 0;
     i44 = Math_imul(i95 >>> 11, i45) | 0;
     if (i96 >>> 0 < i44 >>> 0) {
      HEAP32[i1 >> 2] = i44;
      HEAP16[i41 >> 1] = ((2048 - i45 | 0) >>> 5) + i45;
      break;
     } else {
      HEAP32[i1 >> 2] = i95 - i44;
      HEAP32[i7 >> 2] = i96 - i44;
      HEAP16[i41 >> 1] = i45 - (i45 >>> 5);
      HEAP32[i17 >> 2] = (HEAP32[i17 >> 2] | 0) + 8;
      break;
     }
    } else {
     HEAP32[i1 >> 2] = i62 - i43;
     HEAP32[i7 >> 2] = i63 - i43;
     HEAP16[i27 >> 1] = i33 - (i33 >>> 5);
     i45 = i1 + 528 + (HEAP32[i6 >> 2] << 1) | 0;
     i41 = HEAP32[i1 >> 2] | 0;
     if (i41 >>> 0 < 16777216) {
      i44 = i41 << 8;
      HEAP32[i1 >> 2] = i44;
      i46 = HEAP32[i7 >> 2] << 8;
      i42 = HEAP32[i12 >> 2] | 0;
      i64 = HEAP32[i4 >> 2] | 0;
      HEAP32[i4 >> 2] = i64 + 1;
      i74 = i46 | (HEAPU8[i42 + i64 >> 0] | 0);
      HEAP32[i7 >> 2] = i74;
      i97 = i44;
      i98 = i74;
     } else {
      i97 = i41;
      i98 = HEAP32[i7 >> 2] | 0;
     }
     i41 = HEAPU16[i45 >> 1] | 0;
     i74 = Math_imul(i97 >>> 11, i41) | 0;
     do if (i98 >>> 0 < i74 >>> 0) {
      HEAP32[i1 >> 2] = i74;
      HEAP16[i45 >> 1] = ((2048 - i41 | 0) >>> 5) + i41;
      i44 = i1 + 600 + (HEAP32[i6 >> 2] << 5) + (i29 << 1) | 0;
      i64 = HEAP32[i1 >> 2] | 0;
      if (i64 >>> 0 < 16777216) {
       i42 = i64 << 8;
       HEAP32[i1 >> 2] = i42;
       i46 = HEAP32[i7 >> 2] << 8;
       i32 = HEAP32[i12 >> 2] | 0;
       i70 = HEAP32[i4 >> 2] | 0;
       HEAP32[i4 >> 2] = i70 + 1;
       i73 = i46 | (HEAPU8[i32 + i70 >> 0] | 0);
       HEAP32[i7 >> 2] = i73;
       i99 = i42;
       i100 = i73;
      } else {
       i99 = i64;
       i100 = HEAP32[i7 >> 2] | 0;
      }
      i64 = HEAPU16[i44 >> 1] | 0;
      i73 = Math_imul(i99 >>> 11, i64) | 0;
      if (i100 >>> 0 < i73 >>> 0) {
       HEAP32[i1 >> 2] = i73;
       HEAP16[i44 >> 1] = ((2048 - i64 | 0) >>> 5) + i64;
       HEAP32[i6 >> 2] = (HEAP32[i6 >> 2] | 0) >>> 0 < 7 ? 9 : 11;
       HEAP32[i22 >> 2] = 1;
       break L69;
      } else {
       HEAP32[i1 >> 2] = i99 - i73;
       HEAP32[i7 >> 2] = i100 - i73;
       HEAP16[i44 >> 1] = i64 - (i64 >>> 5);
       break;
      }
     } else {
      HEAP32[i1 >> 2] = i97 - i74;
      HEAP32[i7 >> 2] = i98 - i74;
      HEAP16[i45 >> 1] = i41 - (i41 >>> 5);
      i64 = i1 + 552 + (HEAP32[i6 >> 2] << 1) | 0;
      i44 = HEAP32[i1 >> 2] | 0;
      if (i44 >>> 0 < 16777216) {
       i73 = i44 << 8;
       HEAP32[i1 >> 2] = i73;
       i42 = HEAP32[i7 >> 2] << 8;
       i70 = HEAP32[i12 >> 2] | 0;
       i32 = HEAP32[i4 >> 2] | 0;
       HEAP32[i4 >> 2] = i32 + 1;
       i46 = i42 | (HEAPU8[i70 + i32 >> 0] | 0);
       HEAP32[i7 >> 2] = i46;
       i101 = i73;
       i102 = i46;
      } else {
       i101 = i44;
       i102 = HEAP32[i7 >> 2] | 0;
      }
      i44 = HEAPU16[i64 >> 1] | 0;
      i46 = Math_imul(i101 >>> 11, i44) | 0;
      if (i102 >>> 0 < i46 >>> 0) {
       HEAP32[i1 >> 2] = i46;
       HEAP16[i64 >> 1] = ((2048 - i44 | 0) >>> 5) + i44;
       i103 = HEAP32[i20 >> 2] | 0;
      } else {
       HEAP32[i1 >> 2] = i101 - i46;
       HEAP32[i7 >> 2] = i102 - i46;
       HEAP16[i64 >> 1] = i44 - (i44 >>> 5);
       i44 = i1 + 576 + (HEAP32[i6 >> 2] << 1) | 0;
       i64 = HEAP32[i1 >> 2] | 0;
       if (i64 >>> 0 < 16777216) {
        i46 = i64 << 8;
        HEAP32[i1 >> 2] = i46;
        i73 = HEAP32[i7 >> 2] << 8;
        i32 = HEAP32[i12 >> 2] | 0;
        i70 = HEAP32[i4 >> 2] | 0;
        HEAP32[i4 >> 2] = i70 + 1;
        i42 = i73 | (HEAPU8[i32 + i70 >> 0] | 0);
        HEAP32[i7 >> 2] = i42;
        i104 = i46;
        i105 = i42;
       } else {
        i104 = i64;
        i105 = HEAP32[i7 >> 2] | 0;
       }
       i64 = HEAPU16[i44 >> 1] | 0;
       i42 = Math_imul(i104 >>> 11, i64) | 0;
       if (i105 >>> 0 < i42 >>> 0) {
        HEAP32[i1 >> 2] = i42;
        HEAP16[i44 >> 1] = ((2048 - i64 | 0) >>> 5) + i64;
        i106 = HEAP32[i18 >> 2] | 0;
       } else {
        HEAP32[i1 >> 2] = i104 - i42;
        HEAP32[i7 >> 2] = i105 - i42;
        HEAP16[i44 >> 1] = i64 - (i64 >>> 5);
        i64 = HEAP32[i19 >> 2] | 0;
        HEAP32[i19 >> 2] = HEAP32[i18 >> 2];
        i106 = i64;
       }
       HEAP32[i18 >> 2] = HEAP32[i20 >> 2];
       i103 = i106;
      }
      HEAP32[i20 >> 2] = HEAP32[i17 >> 2];
      HEAP32[i17 >> 2] = i103;
     } while (0);
     HEAP32[i6 >> 2] = (HEAP32[i6 >> 2] | 0) >>> 0 < 7 ? 8 : 11;
     _lzma_len(i1, i25, i29);
    } while (0);
    i29 = HEAP32[i17 >> 2] | 0;
    if ((HEAP32[i8 >> 2] | 0) >>> 0 <= i29 >>> 0) {
     i107 = 0;
     i108 = 130;
     break;
    }
    if ((HEAP32[i24 >> 2] | 0) >>> 0 <= i29 >>> 0) {
     i107 = 0;
     i108 = 130;
     break;
    }
    i33 = HEAP32[i3 >> 2] | 0;
    i27 = (HEAP32[i5 >> 2] | 0) - i33 | 0;
    i43 = HEAP32[i22 >> 2] | 0;
    i31 = i27 >>> 0 < i43 >>> 0 ? i27 : i43;
    HEAP32[i22 >> 2] = i43 - i31;
    i43 = i33 - i29 + -1 | 0;
    if (i33 >>> 0 > i29 >>> 0) i109 = i43; else i109 = (HEAP32[i10 >> 2] | 0) + i43 | 0;
    i43 = HEAP32[i2 >> 2] | 0;
    i29 = HEAP8[i43 + i109 >> 0] | 0;
    HEAP32[i3 >> 2] = i33 + 1;
    HEAP8[i43 + i33 >> 0] = i29;
    i29 = i31 + -1 | 0;
    if (i29 | 0) {
     i31 = i109;
     i33 = i29;
     do {
      i29 = i31 + 1 | 0;
      i31 = (i29 | 0) == (HEAP32[i10 >> 2] | 0) ? 0 : i29;
      i29 = HEAP32[i3 >> 2] | 0;
      i43 = HEAP32[i2 >> 2] | 0;
      i27 = HEAP8[i43 + i31 >> 0] | 0;
      HEAP32[i3 >> 2] = i29 + 1;
      HEAP8[i43 + i29 >> 0] = i27;
      i33 = i33 + -1 | 0;
     } while ((i33 | 0) != 0);
    }
    i33 = HEAP32[i3 >> 2] | 0;
    if ((HEAP32[i8 >> 2] | 0) >>> 0 < i33 >>> 0) {
     HEAP32[i8 >> 2] = i33;
     i61 = i33;
    } else i61 = i33;
   }
   if (i61 >>> 0 < (HEAP32[i5 >> 2] | 0) >>> 0) i26 = i61; else {
    i28 = i1;
    break L15;
   }
  }
  if ((i108 | 0) == 130) return i107 | 0;
 } else i28 = i1; while (0);
 i108 = HEAP32[i28 >> 2] | 0;
 if (i108 >>> 0 >= 16777216) {
  i107 = 1;
  return i107 | 0;
 }
 HEAP32[i28 >> 2] = i108 << 8;
 i108 = i1 + 4 | 0;
 i28 = HEAP32[i108 >> 2] << 8;
 i61 = HEAP32[i1 + 12 >> 2] | 0;
 i5 = i1 + 16 | 0;
 i1 = HEAP32[i5 >> 2] | 0;
 HEAP32[i5 >> 2] = i1 + 1;
 HEAP32[i108 >> 2] = i28 | (HEAPU8[i61 + i1 >> 0] | 0);
 i107 = 1;
 return i107 | 0;
}

function _xz_dec_lzma2_run(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i66 = 0;
 i3 = i2 + 4 | 0;
 i4 = i2 + 8 | 0;
 i5 = i1 + 64 | 0;
 i6 = i1 + 81 | 0;
 i7 = i1 + 80 | 0;
 i8 = i1 + 60 | 0;
 i9 = i2 + 12 | 0;
 i10 = i2 + 16 | 0;
 i11 = i1 + 24 | 0;
 i12 = i2 + 20 | 0;
 i13 = i1 + 44 | 0;
 i14 = i1 + 28 | 0;
 i15 = i1 + 72 | 0;
 i16 = i1 + 68 | 0;
 i17 = i1 + 84 | 0;
 i18 = i1 + 4 | 0;
 i19 = i1 + 8 | 0;
 i20 = i1 + 76 | 0;
 i21 = i1 + 116 | 0;
 i22 = i1 + 112 | 0;
 i23 = i1 + 108 | 0;
 i24 = i1 + 32 | 0;
 i25 = i1 + 40 | 0;
 i26 = i1 + 28388 | 0;
 i27 = i1 + 28392 | 0;
 i28 = i1 + 20 | 0;
 i29 = i1 + 12 | 0;
 i30 = i1 + 16 | 0;
 i31 = i1 + 104 | 0;
 i32 = i1 + 36 | 0;
 L1 : while (1) {
  i33 = HEAP32[i3 >> 2] | 0;
  i34 = HEAP32[i4 >> 2] | 0;
  i35 = HEAP32[i5 >> 2] | 0;
  L3 : do if (i33 >>> 0 < i34 >>> 0) {
   switch (i35 | 0) {
   case 7:
    {
     i36 = 5;
     break L3;
     break;
    }
   case 0:
    {
     i37 = HEAP32[i2 >> 2] | 0;
     HEAP32[i3 >> 2] = i33 + 1;
     i38 = HEAP8[i37 + i33 >> 0] | 0;
     i37 = i38 & 255;
     if (!(i38 << 24 >> 24)) {
      i39 = 1;
      i36 = 86;
      break L1;
     }
     if ((i38 & 255) > 223 | i38 << 24 >> 24 == 1) {
      HEAP8[i6 >> 0] = 1;
      HEAP8[i7 >> 0] = 0;
      if (!(HEAP32[i8 >> 2] | 0)) {
       i40 = HEAP32[i10 >> 2] | 0;
       HEAP32[i11 >> 2] = (HEAP32[i9 >> 2] | 0) + i40;
       HEAP32[i13 >> 2] = (HEAP32[i12 >> 2] | 0) - i40;
      };
      HEAP32[i14 >> 2] = 0;
      HEAP32[i14 + 4 >> 2] = 0;
      HEAP32[i14 + 8 >> 2] = 0;
      HEAP32[i14 + 12 >> 2] = 0;
     } else if (HEAP8[i7 >> 0] | 0) {
      i39 = 7;
      i36 = 86;
      break L1;
     }
     if (i38 << 24 >> 24 >= 0) {
      if ((i38 & 255) > 2) {
       i39 = 7;
       i36 = 86;
       break L1;
      }
      HEAP32[i5 >> 2] = 3;
      HEAP32[i16 >> 2] = 8;
      continue L1;
     }
     HEAP32[i15 >> 2] = i37 << 16 & 2031616;
     HEAP32[i5 >> 2] = 1;
     if ((i38 & 255) > 191) {
      HEAP8[i6 >> 0] = 0;
      HEAP32[i16 >> 2] = 5;
      continue L1;
     }
     if (HEAP8[i6 >> 0] | 0) {
      i39 = 7;
      i36 = 86;
      break L1;
     }
     HEAP32[i16 >> 2] = 6;
     if ((i38 & 255) <= 159) continue L1;
     HEAP32[i17 >> 2] = 0;
     HEAP32[i17 + 4 >> 2] = 0;
     HEAP32[i17 + 8 >> 2] = 0;
     HEAP32[i17 + 12 >> 2] = 0;
     HEAP32[i17 + 16 >> 2] = 0;
     i38 = 0;
     do {
      HEAP16[i1 + 120 + (i38 << 1) >> 1] = 1024;
      i38 = i38 + 1 | 0;
     } while ((i38 | 0) != 14134);
     HEAP32[i1 >> 2] = -1;
     HEAP32[i18 >> 2] = 0;
     HEAP32[i19 >> 2] = 5;
     continue L1;
     break;
    }
   case 1:
    {
     i38 = HEAP32[i2 >> 2] | 0;
     HEAP32[i3 >> 2] = i33 + 1;
     HEAP32[i15 >> 2] = (HEAPU8[i38 + i33 >> 0] << 8) + (HEAP32[i15 >> 2] | 0);
     HEAP32[i5 >> 2] = 2;
     continue L1;
     break;
    }
   case 2:
    {
     i38 = HEAP32[i2 >> 2] | 0;
     HEAP32[i3 >> 2] = i33 + 1;
     HEAP32[i15 >> 2] = (HEAPU8[i38 + i33 >> 0] | 0) + 1 + (HEAP32[i15 >> 2] | 0);
     HEAP32[i5 >> 2] = 3;
     continue L1;
     break;
    }
   case 3:
    {
     i38 = HEAP32[i2 >> 2] | 0;
     HEAP32[i3 >> 2] = i33 + 1;
     HEAP32[i20 >> 2] = HEAPU8[i38 + i33 >> 0] << 8;
     HEAP32[i5 >> 2] = 4;
     continue L1;
     break;
    }
   case 4:
    {
     i38 = HEAP32[i2 >> 2] | 0;
     HEAP32[i3 >> 2] = i33 + 1;
     HEAP32[i20 >> 2] = (HEAPU8[i38 + i33 >> 0] | 0) + 1 + (HEAP32[i20 >> 2] | 0);
     HEAP32[i5 >> 2] = HEAP32[i16 >> 2];
     continue L1;
     break;
    }
   case 5:
    {
     i38 = HEAP32[i2 >> 2] | 0;
     HEAP32[i3 >> 2] = i33 + 1;
     i37 = HEAP8[i38 + i33 >> 0] | 0;
     if ((i37 & 255) > 224) {
      i39 = 7;
      i36 = 86;
      break L1;
     }
     if ((i37 & 255) > 44) {
      i38 = i37 + -45 << 24 >> 24;
      i40 = (i38 & 255) / 45 | 0;
      i41 = (i40 * 211 | 0) + i38 << 24 >> 24;
      i42 = i40 + 1 & 255;
     } else {
      i41 = i37;
      i42 = 0;
     }
     HEAP32[i21 >> 2] = (1 << i42) + -1;
     HEAP32[i22 >> 2] = 0;
     i37 = i41 & 255;
     if ((i41 & 255) > 8) {
      i40 = i37;
      i38 = 0;
      do {
       i43 = i40 + 247 | 0;
       i38 = i38 + 1 | 0;
       i40 = i43 & 255;
      } while ((i43 & 255) > 8);
      HEAP32[i22 >> 2] = i38;
      i44 = i40;
      i45 = i38;
     } else {
      i44 = i37;
      i45 = 0;
     }
     HEAP32[i23 >> 2] = i44;
     if ((i44 + i45 | 0) >>> 0 > 4) {
      i39 = 7;
      i36 = 86;
      break L1;
     }
     HEAP32[i22 >> 2] = (1 << i45) + -1;
     HEAP32[i17 >> 2] = 0;
     HEAP32[i17 + 4 >> 2] = 0;
     HEAP32[i17 + 8 >> 2] = 0;
     HEAP32[i17 + 12 >> 2] = 0;
     HEAP32[i17 + 16 >> 2] = 0;
     i43 = 0;
     do {
      HEAP16[i1 + 120 + (i43 << 1) >> 1] = 1024;
      i43 = i43 + 1 | 0;
     } while ((i43 | 0) != 14134);
     HEAP32[i1 >> 2] = -1;
     HEAP32[i18 >> 2] = 0;
     HEAP32[i19 >> 2] = 5;
     HEAP32[i5 >> 2] = 6;
     break;
    }
   case 6:
    break;
   case 8:
    {
     i43 = HEAP32[i20 >> 2] | 0;
     L46 : do if (i43 | 0) {
      if (i34 >>> 0 > i33 >>> 0) {
       i46 = i43;
       i47 = i33;
       i48 = i34;
      } else {
       i39 = 0;
       i36 = 86;
       break L1;
      }
      while (1) {
       i37 = HEAP32[i10 >> 2] | 0;
       i38 = HEAP32[i12 >> 2] | 0;
       if (i38 >>> 0 <= i37 >>> 0) {
        i39 = 0;
        i36 = 86;
        break L1;
       }
       i40 = (i48 - i47 | 0) >>> 0 < (i38 - i37 | 0) >>> 0;
       i37 = (i40 ? i48 : i38) - (HEAP32[(i40 ? i3 : i10) >> 2] | 0) | 0;
       i40 = HEAP32[i24 >> 2] | 0;
       i38 = (HEAP32[i13 >> 2] | 0) - i40 | 0;
       i49 = i37 >>> 0 > i38 >>> 0 ? i38 : i37;
       i37 = i49 >>> 0 > i46 >>> 0 ? i46 : i49;
       HEAP32[i20 >> 2] = i46 - i37;
       _memcpy((HEAP32[i11 >> 2] | 0) + i40 | 0, (HEAP32[i2 >> 2] | 0) + (HEAP32[i3 >> 2] | 0) | 0, i37 | 0) | 0;
       i40 = (HEAP32[i24 >> 2] | 0) + i37 | 0;
       HEAP32[i24 >> 2] = i40;
       if ((HEAP32[i32 >> 2] | 0) >>> 0 < i40 >>> 0) HEAP32[i32 >> 2] = i40;
       if (!(HEAP32[i8 >> 2] | 0)) i50 = i40; else {
        if ((i40 | 0) == (HEAP32[i13 >> 2] | 0)) HEAP32[i24 >> 2] = 0;
        _memcpy((HEAP32[i9 >> 2] | 0) + (HEAP32[i10 >> 2] | 0) | 0, (HEAP32[i2 >> 2] | 0) + (HEAP32[i3 >> 2] | 0) | 0, i37 | 0) | 0;
        i50 = HEAP32[i24 >> 2] | 0;
       }
       HEAP32[i14 >> 2] = i50;
       HEAP32[i10 >> 2] = (HEAP32[i10 >> 2] | 0) + i37;
       i47 = (HEAP32[i3 >> 2] | 0) + i37 | 0;
       HEAP32[i3 >> 2] = i47;
       i46 = HEAP32[i20 >> 2] | 0;
       if (!i46) break L46;
       i48 = HEAP32[i4 >> 2] | 0;
       if (i48 >>> 0 <= i47 >>> 0) {
        i39 = 0;
        i36 = 86;
        break L1;
       }
      }
     } while (0);
     HEAP32[i5 >> 2] = 0;
     continue L1;
     break;
    }
   default:
    continue L1;
   }
   i43 = HEAP32[i20 >> 2] | 0;
   if (i43 >>> 0 < 5) {
    i39 = 7;
    i36 = 86;
    break L1;
   }
   i37 = HEAP32[i19 >> 2] | 0;
   if (!i37) {
    i51 = HEAP32[i4 >> 2] | 0;
    i52 = HEAP32[i3 >> 2] | 0;
    i53 = i43;
   } else {
    i43 = HEAP32[i4 >> 2] | 0;
    i40 = HEAP32[i3 >> 2] | 0;
    i49 = i37;
    do {
     if ((i40 | 0) == (i43 | 0)) {
      i39 = 0;
      i36 = 86;
      break L1;
     }
     i37 = HEAP32[i18 >> 2] << 8;
     i38 = HEAP32[i2 >> 2] | 0;
     i54 = i40;
     i40 = i40 + 1 | 0;
     HEAP32[i3 >> 2] = i40;
     HEAP32[i18 >> 2] = i37 | HEAPU8[i38 + i54 >> 0];
     i49 = i49 + -1 | 0;
     HEAP32[i19 >> 2] = i49;
    } while ((i49 | 0) != 0);
    i51 = i43;
    i52 = i40;
    i53 = HEAP32[i20 >> 2] | 0;
   }
   i49 = i53 + -5 | 0;
   HEAP32[i20 >> 2] = i49;
   HEAP32[i5 >> 2] = 7;
   i55 = i52;
   i56 = i51;
   i57 = i49;
  } else if ((i35 | 0) == 7) i36 = 5; else {
   i39 = 0;
   i36 = 86;
   break L1;
  } while (0);
  if ((i36 | 0) == 5) {
   i36 = 0;
   i55 = i33;
   i56 = i34;
   i57 = HEAP32[i20 >> 2] | 0;
  }
  i35 = (HEAP32[i12 >> 2] | 0) - (HEAP32[i10 >> 2] | 0) | 0;
  i49 = HEAP32[i15 >> 2] | 0;
  i54 = i35 >>> 0 < i49 >>> 0 ? i35 : i49;
  i49 = HEAP32[i13 >> 2] | 0;
  i35 = HEAP32[i24 >> 2] | 0;
  HEAP32[i25 >> 2] = (i49 - i35 | 0) >>> 0 > i54 >>> 0 ? i35 + i54 | 0 : i49;
  i49 = i56 - i55 | 0;
  i54 = HEAP32[i26 >> 2] | 0;
  if (!i54) if (!i57) {
   i58 = 0;
   i36 = 46;
  } else {
   i59 = i55;
   i60 = i56;
   i61 = i57;
   i36 = 56;
  } else {
   i58 = i57;
   i36 = 46;
  }
  L78 : do if ((i36 | 0) == 46) {
   i36 = 0;
   i35 = 42 - i54 | 0;
   i38 = i58 - i54 | 0;
   i37 = i35 >>> 0 > i38 >>> 0 ? i38 : i35;
   i35 = i37 >>> 0 > i49 >>> 0 ? i49 : i37;
   _memcpy(i1 + 28392 + i54 | 0, (HEAP32[i2 >> 2] | 0) + i55 | 0, i35 | 0) | 0;
   i37 = HEAP32[i26 >> 2] | 0;
   i38 = i35 + i37 | 0;
   do if ((i38 | 0) == (HEAP32[i20 >> 2] | 0)) {
    _memset(i1 + 28392 + i37 + i35 | 0, 0, 63 - i37 - i35 | 0) | 0;
    i62 = (HEAP32[i26 >> 2] | 0) + i35 | 0;
   } else if (i38 >>> 0 < 21) {
    HEAP32[i26 >> 2] = i38;
    HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + i35;
    break L78;
   } else {
    i62 = i38 + -21 | 0;
    break;
   } while (0);
   HEAP32[i28 >> 2] = i62;
   HEAP32[i29 >> 2] = i27;
   HEAP32[i30 >> 2] = 0;
   if (!(_lzma_main(i1) | 0)) {
    i39 = 7;
    i36 = 86;
    break L1;
   }
   i38 = HEAP32[i30 >> 2] | 0;
   i37 = HEAP32[i26 >> 2] | 0;
   if (i38 >>> 0 > (i37 + i35 | 0) >>> 0) {
    i39 = 7;
    i36 = 86;
    break L1;
   }
   i40 = (HEAP32[i20 >> 2] | 0) - i38 | 0;
   HEAP32[i20 >> 2] = i40;
   if (i37 >>> 0 > i38 >>> 0) {
    i43 = i37 - i38 | 0;
    HEAP32[i26 >> 2] = i43;
    _memmove(i27 | 0, i1 + 28392 + i38 | 0, i43 | 0) | 0;
    break;
   } else {
    i43 = (HEAP32[i3 >> 2] | 0) + (i38 - i37) | 0;
    HEAP32[i3 >> 2] = i43;
    HEAP32[i26 >> 2] = 0;
    i59 = i43;
    i60 = HEAP32[i4 >> 2] | 0;
    i61 = i40;
    i36 = 56;
    break;
   }
  } while (0);
  if ((i36 | 0) == 56) {
   i36 = 0;
   i54 = i60 - i59 | 0;
   if (i54 >>> 0 > 20) {
    HEAP32[i29 >> 2] = HEAP32[i2 >> 2];
    HEAP32[i30 >> 2] = i59;
    i49 = i54 >>> 0 < (i61 + 21 | 0) >>> 0;
    HEAP32[i28 >> 2] = (HEAP32[(i49 ? i4 : i3) >> 2] | 0) + (i49 ? -21 : i61);
    if (!(_lzma_main(i1) | 0)) {
     i39 = 7;
     i36 = 86;
     break;
    }
    i49 = HEAP32[i30 >> 2] | 0;
    i54 = i49 - (HEAP32[i3 >> 2] | 0) | 0;
    i34 = HEAP32[i20 >> 2] | 0;
    if (i34 >>> 0 < i54 >>> 0) {
     i39 = 7;
     i36 = 86;
     break;
    }
    i33 = i34 - i54 | 0;
    HEAP32[i20 >> 2] = i33;
    HEAP32[i3 >> 2] = i49;
    i63 = i49;
    i64 = HEAP32[i4 >> 2] | 0;
    i65 = i33;
   } else {
    i63 = i59;
    i64 = i60;
    i65 = i61;
   }
   i33 = i64 - i63 | 0;
   if (i33 >>> 0 < 21) {
    i49 = i33 >>> 0 > i65 >>> 0 ? i65 : i33;
    _memcpy(i27 | 0, (HEAP32[i2 >> 2] | 0) + i63 | 0, i49 | 0) | 0;
    HEAP32[i26 >> 2] = i49;
    HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + i49;
   }
  }
  i49 = HEAP32[i24 >> 2] | 0;
  i33 = HEAP32[i14 >> 2] | 0;
  i54 = i49 - i33 | 0;
  if (!(HEAP32[i8 >> 2] | 0)) i66 = i49; else {
   if ((i49 | 0) == (HEAP32[i13 >> 2] | 0)) HEAP32[i24 >> 2] = 0;
   _memcpy((HEAP32[i9 >> 2] | 0) + (HEAP32[i10 >> 2] | 0) | 0, (HEAP32[i11 >> 2] | 0) + i33 | 0, i54 | 0) | 0;
   i66 = HEAP32[i24 >> 2] | 0;
  }
  HEAP32[i14 >> 2] = i66;
  i33 = (HEAP32[i10 >> 2] | 0) + i54 | 0;
  HEAP32[i10 >> 2] = i33;
  i49 = (HEAP32[i15 >> 2] | 0) - i54 | 0;
  HEAP32[i15 >> 2] = i49;
  if (i49 | 0) {
   if ((i33 | 0) == (HEAP32[i12 >> 2] | 0)) {
    i39 = 0;
    i36 = 86;
    break;
   }
   if ((HEAP32[i3 >> 2] | 0) != (HEAP32[i4 >> 2] | 0)) continue;
   if ((HEAP32[i26 >> 2] | 0) >>> 0 < (HEAP32[i20 >> 2] | 0) >>> 0) {
    i39 = 0;
    i36 = 86;
    break;
   } else continue;
  }
  if (HEAP32[i20 >> 2] | 0) {
   i39 = 7;
   i36 = 86;
   break;
  }
  if (HEAP32[i31 >> 2] | 0) {
   i39 = 7;
   i36 = 86;
   break;
  }
  if (HEAP32[i18 >> 2] | 0) {
   i39 = 7;
   i36 = 86;
   break;
  }
  HEAP32[i1 >> 2] = -1;
  HEAP32[i18 >> 2] = 0;
  HEAP32[i19 >> 2] = 5;
  HEAP32[i5 >> 2] = 0;
 }
 if ((i36 | 0) == 86) return i39 | 0;
 return 0;
}

function _free(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0;
 if (!i1) return;
 i2 = i1 + -8 | 0;
 i3 = HEAP32[1033] | 0;
 i4 = HEAP32[i1 + -4 >> 2] | 0;
 i1 = i4 & -8;
 i5 = i2 + i1 | 0;
 do if (!(i4 & 1)) {
  i6 = HEAP32[i2 >> 2] | 0;
  if (!(i4 & 3)) return;
  i7 = i2 + (0 - i6) | 0;
  i8 = i6 + i1 | 0;
  if (i7 >>> 0 < i3 >>> 0) return;
  if ((HEAP32[1034] | 0) == (i7 | 0)) {
   i9 = i5 + 4 | 0;
   i10 = HEAP32[i9 >> 2] | 0;
   if ((i10 & 3 | 0) != 3) {
    i11 = i7;
    i12 = i8;
    i13 = i7;
    break;
   }
   HEAP32[1031] = i8;
   HEAP32[i9 >> 2] = i10 & -2;
   HEAP32[i7 + 4 >> 2] = i8 | 1;
   HEAP32[i7 + i8 >> 2] = i8;
   return;
  }
  i10 = i6 >>> 3;
  if (i6 >>> 0 < 256) {
   i6 = HEAP32[i7 + 8 >> 2] | 0;
   i9 = HEAP32[i7 + 12 >> 2] | 0;
   if ((i9 | 0) == (i6 | 0)) {
    HEAP32[1029] = HEAP32[1029] & ~(1 << i10);
    i11 = i7;
    i12 = i8;
    i13 = i7;
    break;
   } else {
    HEAP32[i6 + 12 >> 2] = i9;
    HEAP32[i9 + 8 >> 2] = i6;
    i11 = i7;
    i12 = i8;
    i13 = i7;
    break;
   }
  }
  i6 = HEAP32[i7 + 24 >> 2] | 0;
  i9 = HEAP32[i7 + 12 >> 2] | 0;
  do if ((i9 | 0) == (i7 | 0)) {
   i10 = i7 + 16 | 0;
   i14 = i10 + 4 | 0;
   i15 = HEAP32[i14 >> 2] | 0;
   if (!i15) {
    i16 = HEAP32[i10 >> 2] | 0;
    if (!i16) {
     i17 = 0;
     break;
    } else {
     i18 = i16;
     i19 = i10;
    }
   } else {
    i18 = i15;
    i19 = i14;
   }
   while (1) {
    i14 = i18 + 20 | 0;
    i15 = HEAP32[i14 >> 2] | 0;
    if (i15 | 0) {
     i18 = i15;
     i19 = i14;
     continue;
    }
    i14 = i18 + 16 | 0;
    i15 = HEAP32[i14 >> 2] | 0;
    if (!i15) break; else {
     i18 = i15;
     i19 = i14;
    }
   }
   HEAP32[i19 >> 2] = 0;
   i17 = i18;
  } else {
   i14 = HEAP32[i7 + 8 >> 2] | 0;
   HEAP32[i14 + 12 >> 2] = i9;
   HEAP32[i9 + 8 >> 2] = i14;
   i17 = i9;
  } while (0);
  if (!i6) {
   i11 = i7;
   i12 = i8;
   i13 = i7;
  } else {
   i9 = HEAP32[i7 + 28 >> 2] | 0;
   i14 = 4420 + (i9 << 2) | 0;
   if ((HEAP32[i14 >> 2] | 0) == (i7 | 0)) {
    HEAP32[i14 >> 2] = i17;
    if (!i17) {
     HEAP32[1030] = HEAP32[1030] & ~(1 << i9);
     i11 = i7;
     i12 = i8;
     i13 = i7;
     break;
    }
   } else {
    HEAP32[i6 + 16 + (((HEAP32[i6 + 16 >> 2] | 0) != (i7 | 0) & 1) << 2) >> 2] = i17;
    if (!i17) {
     i11 = i7;
     i12 = i8;
     i13 = i7;
     break;
    }
   }
   HEAP32[i17 + 24 >> 2] = i6;
   i9 = i7 + 16 | 0;
   i14 = HEAP32[i9 >> 2] | 0;
   if (i14 | 0) {
    HEAP32[i17 + 16 >> 2] = i14;
    HEAP32[i14 + 24 >> 2] = i17;
   }
   i14 = HEAP32[i9 + 4 >> 2] | 0;
   if (!i14) {
    i11 = i7;
    i12 = i8;
    i13 = i7;
   } else {
    HEAP32[i17 + 20 >> 2] = i14;
    HEAP32[i14 + 24 >> 2] = i17;
    i11 = i7;
    i12 = i8;
    i13 = i7;
   }
  }
 } else {
  i11 = i2;
  i12 = i1;
  i13 = i2;
 } while (0);
 if (i13 >>> 0 >= i5 >>> 0) return;
 i2 = i5 + 4 | 0;
 i1 = HEAP32[i2 >> 2] | 0;
 if (!(i1 & 1)) return;
 if (!(i1 & 2)) {
  if ((HEAP32[1035] | 0) == (i5 | 0)) {
   i17 = (HEAP32[1032] | 0) + i12 | 0;
   HEAP32[1032] = i17;
   HEAP32[1035] = i11;
   HEAP32[i11 + 4 >> 2] = i17 | 1;
   if ((i11 | 0) != (HEAP32[1034] | 0)) return;
   HEAP32[1034] = 0;
   HEAP32[1031] = 0;
   return;
  }
  if ((HEAP32[1034] | 0) == (i5 | 0)) {
   i17 = (HEAP32[1031] | 0) + i12 | 0;
   HEAP32[1031] = i17;
   HEAP32[1034] = i13;
   HEAP32[i11 + 4 >> 2] = i17 | 1;
   HEAP32[i13 + i17 >> 2] = i17;
   return;
  }
  i17 = (i1 & -8) + i12 | 0;
  i18 = i1 >>> 3;
  do if (i1 >>> 0 < 256) {
   i19 = HEAP32[i5 + 8 >> 2] | 0;
   i3 = HEAP32[i5 + 12 >> 2] | 0;
   if ((i3 | 0) == (i19 | 0)) {
    HEAP32[1029] = HEAP32[1029] & ~(1 << i18);
    break;
   } else {
    HEAP32[i19 + 12 >> 2] = i3;
    HEAP32[i3 + 8 >> 2] = i19;
    break;
   }
  } else {
   i19 = HEAP32[i5 + 24 >> 2] | 0;
   i3 = HEAP32[i5 + 12 >> 2] | 0;
   do if ((i3 | 0) == (i5 | 0)) {
    i4 = i5 + 16 | 0;
    i14 = i4 + 4 | 0;
    i9 = HEAP32[i14 >> 2] | 0;
    if (!i9) {
     i15 = HEAP32[i4 >> 2] | 0;
     if (!i15) {
      i20 = 0;
      break;
     } else {
      i21 = i15;
      i22 = i4;
     }
    } else {
     i21 = i9;
     i22 = i14;
    }
    while (1) {
     i14 = i21 + 20 | 0;
     i9 = HEAP32[i14 >> 2] | 0;
     if (i9 | 0) {
      i21 = i9;
      i22 = i14;
      continue;
     }
     i14 = i21 + 16 | 0;
     i9 = HEAP32[i14 >> 2] | 0;
     if (!i9) break; else {
      i21 = i9;
      i22 = i14;
     }
    }
    HEAP32[i22 >> 2] = 0;
    i20 = i21;
   } else {
    i14 = HEAP32[i5 + 8 >> 2] | 0;
    HEAP32[i14 + 12 >> 2] = i3;
    HEAP32[i3 + 8 >> 2] = i14;
    i20 = i3;
   } while (0);
   if (i19 | 0) {
    i3 = HEAP32[i5 + 28 >> 2] | 0;
    i7 = 4420 + (i3 << 2) | 0;
    if ((HEAP32[i7 >> 2] | 0) == (i5 | 0)) {
     HEAP32[i7 >> 2] = i20;
     if (!i20) {
      HEAP32[1030] = HEAP32[1030] & ~(1 << i3);
      break;
     }
    } else {
     HEAP32[i19 + 16 + (((HEAP32[i19 + 16 >> 2] | 0) != (i5 | 0) & 1) << 2) >> 2] = i20;
     if (!i20) break;
    }
    HEAP32[i20 + 24 >> 2] = i19;
    i3 = i5 + 16 | 0;
    i7 = HEAP32[i3 >> 2] | 0;
    if (i7 | 0) {
     HEAP32[i20 + 16 >> 2] = i7;
     HEAP32[i7 + 24 >> 2] = i20;
    }
    i7 = HEAP32[i3 + 4 >> 2] | 0;
    if (i7 | 0) {
     HEAP32[i20 + 20 >> 2] = i7;
     HEAP32[i7 + 24 >> 2] = i20;
    }
   }
  } while (0);
  HEAP32[i11 + 4 >> 2] = i17 | 1;
  HEAP32[i13 + i17 >> 2] = i17;
  if ((i11 | 0) == (HEAP32[1034] | 0)) {
   HEAP32[1031] = i17;
   return;
  } else i23 = i17;
 } else {
  HEAP32[i2 >> 2] = i1 & -2;
  HEAP32[i11 + 4 >> 2] = i12 | 1;
  HEAP32[i13 + i12 >> 2] = i12;
  i23 = i12;
 }
 i12 = i23 >>> 3;
 if (i23 >>> 0 < 256) {
  i13 = 4156 + (i12 << 1 << 2) | 0;
  i1 = HEAP32[1029] | 0;
  i2 = 1 << i12;
  if (!(i1 & i2)) {
   HEAP32[1029] = i1 | i2;
   i24 = i13;
   i25 = i13 + 8 | 0;
  } else {
   i2 = i13 + 8 | 0;
   i24 = HEAP32[i2 >> 2] | 0;
   i25 = i2;
  }
  HEAP32[i25 >> 2] = i11;
  HEAP32[i24 + 12 >> 2] = i11;
  HEAP32[i11 + 8 >> 2] = i24;
  HEAP32[i11 + 12 >> 2] = i13;
  return;
 }
 i13 = i23 >>> 8;
 if (!i13) i26 = 0; else if (i23 >>> 0 > 16777215) i26 = 31; else {
  i24 = (i13 + 1048320 | 0) >>> 16 & 8;
  i25 = i13 << i24;
  i13 = (i25 + 520192 | 0) >>> 16 & 4;
  i2 = i25 << i13;
  i25 = (i2 + 245760 | 0) >>> 16 & 2;
  i1 = 14 - (i13 | i24 | i25) + (i2 << i25 >>> 15) | 0;
  i26 = i23 >>> (i1 + 7 | 0) & 1 | i1 << 1;
 }
 i1 = 4420 + (i26 << 2) | 0;
 HEAP32[i11 + 28 >> 2] = i26;
 HEAP32[i11 + 20 >> 2] = 0;
 HEAP32[i11 + 16 >> 2] = 0;
 i25 = HEAP32[1030] | 0;
 i2 = 1 << i26;
 do if (!(i25 & i2)) {
  HEAP32[1030] = i25 | i2;
  HEAP32[i1 >> 2] = i11;
  HEAP32[i11 + 24 >> 2] = i1;
  HEAP32[i11 + 12 >> 2] = i11;
  HEAP32[i11 + 8 >> 2] = i11;
 } else {
  i24 = i23 << ((i26 | 0) == 31 ? 0 : 25 - (i26 >>> 1) | 0);
  i13 = HEAP32[i1 >> 2] | 0;
  while (1) {
   if ((HEAP32[i13 + 4 >> 2] & -8 | 0) == (i23 | 0)) {
    i27 = 73;
    break;
   }
   i28 = i13 + 16 + (i24 >>> 31 << 2) | 0;
   i12 = HEAP32[i28 >> 2] | 0;
   if (!i12) {
    i27 = 72;
    break;
   } else {
    i24 = i24 << 1;
    i13 = i12;
   }
  }
  if ((i27 | 0) == 72) {
   HEAP32[i28 >> 2] = i11;
   HEAP32[i11 + 24 >> 2] = i13;
   HEAP32[i11 + 12 >> 2] = i11;
   HEAP32[i11 + 8 >> 2] = i11;
   break;
  } else if ((i27 | 0) == 73) {
   i24 = i13 + 8 | 0;
   i19 = HEAP32[i24 >> 2] | 0;
   HEAP32[i19 + 12 >> 2] = i11;
   HEAP32[i24 >> 2] = i11;
   HEAP32[i11 + 8 >> 2] = i19;
   HEAP32[i11 + 12 >> 2] = i13;
   HEAP32[i11 + 24 >> 2] = 0;
   break;
  }
 } while (0);
 i11 = (HEAP32[1037] | 0) + -1 | 0;
 HEAP32[1037] = i11;
 if (!i11) i29 = 4572; else return;
 while (1) {
  i11 = HEAP32[i29 >> 2] | 0;
  if (!i11) break; else i29 = i11 + 8 | 0;
 }
 HEAP32[1037] = -1;
 return;
}

function _lzma_len(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0;
 i4 = HEAP32[i1 >> 2] | 0;
 if (i4 >>> 0 < 16777216) {
  i5 = i4 << 8;
  HEAP32[i1 >> 2] = i5;
  i6 = i1 + 4 | 0;
  i7 = HEAP32[i6 >> 2] << 8;
  i8 = HEAP32[i1 + 12 >> 2] | 0;
  i9 = i1 + 16 | 0;
  i10 = HEAP32[i9 >> 2] | 0;
  HEAP32[i9 >> 2] = i10 + 1;
  i9 = i7 | (HEAPU8[i8 + i10 >> 0] | 0);
  HEAP32[i6 >> 2] = i9;
  i11 = i6;
  i12 = i5;
  i13 = i9;
 } else {
  i9 = i1 + 4 | 0;
  i11 = i9;
  i12 = i4;
  i13 = HEAP32[i9 >> 2] | 0;
 }
 i9 = HEAPU16[i2 >> 1] | 0;
 i4 = Math_imul(i12 >>> 11, i9) | 0;
 do if (i13 >>> 0 < i4 >>> 0) {
  HEAP32[i1 >> 2] = i4;
  HEAP16[i2 >> 1] = ((2048 - i9 | 0) >>> 5) + i9;
  i14 = 8;
  i15 = i2 + 4 + (i3 << 4) | 0;
  i16 = i13;
  i17 = i4;
  i18 = 2;
 } else {
  i5 = i12 - i4 | 0;
  HEAP32[i1 >> 2] = i5;
  i6 = i13 - i4 | 0;
  HEAP32[i11 >> 2] = i6;
  HEAP16[i2 >> 1] = i9 - (i9 >>> 5);
  i10 = i2 + 2 | 0;
  if (i5 >>> 0 < 16777216) {
   i8 = i5 << 8;
   HEAP32[i1 >> 2] = i8;
   i7 = i1 + 4 | 0;
   i19 = HEAP32[i1 + 12 >> 2] | 0;
   i20 = i1 + 16 | 0;
   i21 = HEAP32[i20 >> 2] | 0;
   HEAP32[i20 >> 2] = i21 + 1;
   i20 = i6 << 8 | (HEAPU8[i19 + i21 >> 0] | 0);
   HEAP32[i7 >> 2] = i20;
   i22 = i7;
   i23 = i8;
   i24 = i20;
  } else {
   i22 = i1 + 4 | 0;
   i23 = i5;
   i24 = i6;
  }
  i6 = HEAPU16[i10 >> 1] | 0;
  i5 = Math_imul(i23 >>> 11, i6) | 0;
  if (i24 >>> 0 < i5 >>> 0) {
   HEAP32[i1 >> 2] = i5;
   HEAP16[i10 >> 1] = ((2048 - i6 | 0) >>> 5) + i6;
   i14 = 8;
   i15 = i2 + 260 + (i3 << 4) | 0;
   i16 = i24;
   i17 = i5;
   i18 = 10;
   break;
  } else {
   i20 = i23 - i5 | 0;
   HEAP32[i1 >> 2] = i20;
   i8 = i24 - i5 | 0;
   HEAP32[i22 >> 2] = i8;
   HEAP16[i10 >> 1] = i6 - (i6 >>> 5);
   i14 = 256;
   i15 = i2 + 516 | 0;
   i16 = i8;
   i17 = i20;
   i18 = 18;
   break;
  }
 } while (0);
 i2 = i1 + 104 | 0;
 HEAP32[i2 >> 2] = i18;
 i22 = i1 + 4 | 0;
 i24 = i1 + 12 | 0;
 i23 = i1 + 16 | 0;
 i3 = 1;
 i9 = i17;
 i17 = i16;
 while (1) {
  i16 = i15 + (i3 << 1) | 0;
  if (i9 >>> 0 < 16777216) {
   i11 = i9 << 8;
   HEAP32[i1 >> 2] = i11;
   i4 = HEAP32[i24 >> 2] | 0;
   i13 = HEAP32[i23 >> 2] | 0;
   HEAP32[i23 >> 2] = i13 + 1;
   i12 = i17 << 8 | (HEAPU8[i4 + i13 >> 0] | 0);
   HEAP32[i22 >> 2] = i12;
   i25 = i11;
   i26 = i12;
  } else {
   i25 = i9;
   i26 = i17;
  }
  i12 = HEAPU16[i16 >> 1] | 0;
  i11 = Math_imul(i25 >>> 11, i12) | 0;
  if (i26 >>> 0 < i11 >>> 0) {
   HEAP32[i1 >> 2] = i11;
   i27 = 0;
   i28 = i26;
   i29 = i11;
   i30 = (2048 - i12 >> 5) + i12 | 0;
  } else {
   i13 = i25 - i11 | 0;
   HEAP32[i1 >> 2] = i13;
   i4 = i26 - i11 | 0;
   HEAP32[i22 >> 2] = i4;
   i27 = 1;
   i28 = i4;
   i29 = i13;
   i30 = i12 - (i12 >>> 5) | 0;
  }
  HEAP16[i16 >> 1] = i30;
  i3 = i27 | i3 << 1;
  if (i3 >>> 0 >= i14 >>> 0) break; else {
   i9 = i29;
   i17 = i28;
  }
 }
 HEAP32[i2 >> 2] = i3 - i14 + i18;
 return;
}

function _memcpy(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, i6 = 0;
 if ((i3 | 0) >= 8192) return _emscripten_memcpy_big(i1 | 0, i2 | 0, i3 | 0) | 0;
 i4 = i1 | 0;
 i5 = i1 + i3 | 0;
 if ((i1 & 3) == (i2 & 3)) {
  while (i1 & 3) {
   if (!i3) return i4 | 0;
   HEAP8[i1 >> 0] = HEAP8[i2 >> 0] | 0;
   i1 = i1 + 1 | 0;
   i2 = i2 + 1 | 0;
   i3 = i3 - 1 | 0;
  }
  i6 = i5 & -4 | 0;
  i3 = i6 - 64 | 0;
  while ((i1 | 0) <= (i3 | 0)) {
   HEAP32[i1 >> 2] = HEAP32[i2 >> 2];
   HEAP32[i1 + 4 >> 2] = HEAP32[i2 + 4 >> 2];
   HEAP32[i1 + 8 >> 2] = HEAP32[i2 + 8 >> 2];
   HEAP32[i1 + 12 >> 2] = HEAP32[i2 + 12 >> 2];
   HEAP32[i1 + 16 >> 2] = HEAP32[i2 + 16 >> 2];
   HEAP32[i1 + 20 >> 2] = HEAP32[i2 + 20 >> 2];
   HEAP32[i1 + 24 >> 2] = HEAP32[i2 + 24 >> 2];
   HEAP32[i1 + 28 >> 2] = HEAP32[i2 + 28 >> 2];
   HEAP32[i1 + 32 >> 2] = HEAP32[i2 + 32 >> 2];
   HEAP32[i1 + 36 >> 2] = HEAP32[i2 + 36 >> 2];
   HEAP32[i1 + 40 >> 2] = HEAP32[i2 + 40 >> 2];
   HEAP32[i1 + 44 >> 2] = HEAP32[i2 + 44 >> 2];
   HEAP32[i1 + 48 >> 2] = HEAP32[i2 + 48 >> 2];
   HEAP32[i1 + 52 >> 2] = HEAP32[i2 + 52 >> 2];
   HEAP32[i1 + 56 >> 2] = HEAP32[i2 + 56 >> 2];
   HEAP32[i1 + 60 >> 2] = HEAP32[i2 + 60 >> 2];
   i1 = i1 + 64 | 0;
   i2 = i2 + 64 | 0;
  }
  while ((i1 | 0) < (i6 | 0)) {
   HEAP32[i1 >> 2] = HEAP32[i2 >> 2];
   i1 = i1 + 4 | 0;
   i2 = i2 + 4 | 0;
  }
 } else {
  i6 = i5 - 4 | 0;
  while ((i1 | 0) < (i6 | 0)) {
   HEAP8[i1 >> 0] = HEAP8[i2 >> 0] | 0;
   HEAP8[i1 + 1 >> 0] = HEAP8[i2 + 1 >> 0] | 0;
   HEAP8[i1 + 2 >> 0] = HEAP8[i2 + 2 >> 0] | 0;
   HEAP8[i1 + 3 >> 0] = HEAP8[i2 + 3 >> 0] | 0;
   i1 = i1 + 4 | 0;
   i2 = i2 + 4 | 0;
  }
 }
 while ((i1 | 0) < (i5 | 0)) {
  HEAP8[i1 >> 0] = HEAP8[i2 >> 0] | 0;
  i1 = i1 + 1 | 0;
  i2 = i2 + 1 | 0;
 }
 return i4 | 0;
}

function _xz_crc64_init() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0;
 i1 = 0;
 do {
  i2 = _bitshift64Lshr(i1 | 0, 0, 1) | 0;
  i3 = tempRet0;
  i4 = _i64Subtract(0, 0, i1 & 1 | 0, 0) | 0;
  i5 = _bitshift64Lshr(i4 & -679014590 ^ i2 | 0, tempRet0 & -915646571 ^ i3 | 0, 1) | 0;
  i3 = tempRet0;
  i4 = _i64Subtract(0, 0, i2 & 1 | 0, 0) | 0;
  i2 = _bitshift64Lshr(i4 & -679014590 ^ i5 | 0, tempRet0 & -915646571 ^ i3 | 0, 1) | 0;
  i3 = tempRet0;
  i4 = _i64Subtract(0, 0, i5 & 1 | 0, 0) | 0;
  i5 = _bitshift64Lshr(i4 & -679014590 ^ i2 | 0, tempRet0 & -915646571 ^ i3 | 0, 1) | 0;
  i3 = tempRet0;
  i4 = _i64Subtract(0, 0, i2 & 1 | 0, 0) | 0;
  i2 = _bitshift64Lshr(i4 & -679014590 ^ i5 | 0, tempRet0 & -915646571 ^ i3 | 0, 1) | 0;
  i3 = tempRet0;
  i4 = _i64Subtract(0, 0, i5 & 1 | 0, 0) | 0;
  i5 = _bitshift64Lshr(i4 & -679014590 ^ i2 | 0, tempRet0 & -915646571 ^ i3 | 0, 1) | 0;
  i3 = tempRet0;
  i4 = _i64Subtract(0, 0, i2 & 1 | 0, 0) | 0;
  i2 = _bitshift64Lshr(i4 & -679014590 ^ i5 | 0, tempRet0 & -915646571 ^ i3 | 0, 1) | 0;
  i3 = tempRet0;
  i4 = _i64Subtract(0, 0, i5 & 1 | 0, 0) | 0;
  i5 = _bitshift64Lshr(i4 & -679014590 ^ i2 | 0, tempRet0 & -915646571 ^ i3 | 0, 1) | 0;
  i3 = tempRet0;
  i4 = _i64Subtract(0, 0, i2 & 1 | 0, 0) | 0;
  i2 = 1040 + (i1 << 3) | 0;
  HEAP32[i2 >> 2] = i4 & -679014590 ^ i5;
  HEAP32[i2 + 4 >> 2] = tempRet0 & -915646571 ^ i3;
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) != 256);
 return;
}

function _memset(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0;
 i4 = i1 + i3 | 0;
 i2 = i2 & 255;
 if ((i3 | 0) >= 67) {
  while (i1 & 3) {
   HEAP8[i1 >> 0] = i2;
   i1 = i1 + 1 | 0;
  }
  i5 = i4 & -4 | 0;
  i6 = i5 - 64 | 0;
  i7 = i2 | i2 << 8 | i2 << 16 | i2 << 24;
  while ((i1 | 0) <= (i6 | 0)) {
   HEAP32[i1 >> 2] = i7;
   HEAP32[i1 + 4 >> 2] = i7;
   HEAP32[i1 + 8 >> 2] = i7;
   HEAP32[i1 + 12 >> 2] = i7;
   HEAP32[i1 + 16 >> 2] = i7;
   HEAP32[i1 + 20 >> 2] = i7;
   HEAP32[i1 + 24 >> 2] = i7;
   HEAP32[i1 + 28 >> 2] = i7;
   HEAP32[i1 + 32 >> 2] = i7;
   HEAP32[i1 + 36 >> 2] = i7;
   HEAP32[i1 + 40 >> 2] = i7;
   HEAP32[i1 + 44 >> 2] = i7;
   HEAP32[i1 + 48 >> 2] = i7;
   HEAP32[i1 + 52 >> 2] = i7;
   HEAP32[i1 + 56 >> 2] = i7;
   HEAP32[i1 + 60 >> 2] = i7;
   i1 = i1 + 64 | 0;
  }
  while ((i1 | 0) < (i5 | 0)) {
   HEAP32[i1 >> 2] = i7;
   i1 = i1 + 4 | 0;
  }
 }
 while ((i1 | 0) < (i4 | 0)) {
  HEAP8[i1 >> 0] = i2;
  i1 = i1 + 1 | 0;
 }
 return i4 - i3 | 0;
}

function _xz_dec_lzma2_reset(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i3 = i2 & 255;
 if ((i2 & 255) > 39) {
  i4 = 6;
  return i4 | 0;
 }
 i2 = i1 + 48 | 0;
 i5 = (i3 & 1 | 2) << (i3 >>> 1) + 11;
 HEAP32[i2 >> 2] = i5;
 i3 = HEAP32[i1 + 60 >> 2] | 0;
 if (i3 | 0) {
  if (i5 >>> 0 > (HEAP32[i1 + 52 >> 2] | 0) >>> 0) {
   i4 = 4;
   return i4 | 0;
  }
  HEAP32[i1 + 44 >> 2] = i5;
  if ((i3 | 0) == 2) {
   i3 = i1 + 56 | 0;
   if ((HEAP32[i3 >> 2] | 0) >>> 0 < i5 >>> 0) {
    i5 = i1 + 24 | 0;
    _free(HEAP32[i5 >> 2] | 0);
    i6 = _malloc(HEAP32[i2 >> 2] | 0) | 0;
    HEAP32[i5 >> 2] = i6;
    if (!i6) {
     HEAP32[i3 >> 2] = 0;
     i4 = 3;
     return i4 | 0;
    }
   }
  }
 }
 HEAP32[i1 + 104 >> 2] = 0;
 HEAP32[i1 + 64 >> 2] = 0;
 HEAP8[i1 + 80 >> 0] = 1;
 HEAP32[i1 + 28388 >> 2] = 0;
 i4 = 0;
 return i4 | 0;
}

function _xz_crc64(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0;
 i5 = ~i3;
 i3 = ~i4;
 if (!i2) {
  i6 = i5;
  i7 = i3;
  i8 = ~i6;
  i9 = ~i7;
  tempRet0 = i9;
  return i8 | 0;
 } else {
  i10 = i2;
  i11 = i1;
  i12 = i5;
  i13 = i3;
 }
 while (1) {
  i3 = 1040 + ((i12 & 255 ^ (HEAPU8[i11 >> 0] | 0)) << 3) | 0;
  i5 = HEAP32[i3 >> 2] | 0;
  i1 = HEAP32[i3 + 4 >> 2] | 0;
  i3 = _bitshift64Lshr(i12 | 0, i13 | 0, 8) | 0;
  i2 = i5 ^ i3;
  i3 = i1 ^ tempRet0;
  i10 = i10 + -1 | 0;
  if (!i10) {
   i6 = i2;
   i7 = i3;
   break;
  } else {
   i11 = i11 + 1 | 0;
   i12 = i2;
   i13 = i3;
  }
 }
 i8 = ~i6;
 i9 = ~i7;
 tempRet0 = i9;
 return i8 | 0;
}

function _xz_dec_init(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0;
 i3 = _malloc(1208) | 0;
 if (!i3) {
  i4 = 0;
  return i4 | 0;
 }
 HEAP32[i3 + 36 >> 2] = i1;
 i5 = _xz_dec_lzma2_create(i1, i2) | 0;
 HEAP32[i3 + 1200 >> 2] = i5;
 if (!i5) {
  _free(i3);
  i4 = 0;
  return i4 | 0;
 } else {
  HEAP32[i3 >> 2] = 0;
  HEAP8[i3 + 40 >> 0] = 0;
  HEAP32[i3 + 4 >> 2] = 0;
  i5 = i3 + 24 | 0;
  HEAP32[i5 >> 2] = 0;
  HEAP32[i5 + 4 >> 2] = 0;
  i5 = i3 + 172 | 0;
  i2 = i3 + 72 | 0;
  i1 = i2 + 100 | 0;
  do {
   HEAP32[i2 >> 2] = 0;
   i2 = i2 + 4 | 0;
  } while ((i2 | 0) < (i1 | 0));
  HEAP32[i5 >> 2] = 12;
  i4 = i3;
  return i4 | 0;
 }
 return 0;
}

function _xz_dec_lzma2_create(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i3 = _malloc(28456) | 0;
 L1 : do if (!i3) i4 = 0; else {
  i5 = i3 + 24 | 0;
  HEAP32[i3 + 60 >> 2] = i1;
  HEAP32[i3 + 52 >> 2] = i2;
  switch (i1 | 0) {
  case 1:
   break;
  case 2:
   {
    HEAP32[i5 >> 2] = 0;
    HEAP32[i3 + 56 >> 2] = 0;
    i4 = i3;
    break L1;
    break;
   }
  default:
   {
    i4 = i3;
    break L1;
   }
  }
  i6 = _malloc(i2) | 0;
  HEAP32[i5 >> 2] = i6;
  if (!i6) {
   _free(i3);
   i4 = 0;
  } else i4 = i3;
 } while (0);
 return i4 | 0;
}

function _xz_crc32_init() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0;
 i1 = 0;
 do {
  i2 = i1 >>> 1;
  i3 = (0 - (i1 & 1) & -306674912 ^ i2) >>> 1;
  i4 = (0 - (i2 & 1) & -306674912 ^ i3) >>> 1;
  i2 = (0 - (i3 & 1) & -306674912 ^ i4) >>> 1;
  i3 = (0 - (i4 & 1) & -306674912 ^ i2) >>> 1;
  i4 = (0 - (i2 & 1) & -306674912 ^ i3) >>> 1;
  i2 = (0 - (i3 & 1) & -306674912 ^ i4) >>> 1;
  HEAP32[3088 + (i1 << 2) >> 2] = 0 - (i2 & 1) & -306674912 ^ (0 - (i4 & 1) & -306674912 ^ i2) >>> 1;
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) != 256);
 return;
}

function _memcmp(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 L1 : do if (!i3) i4 = 0; else {
  i5 = i1;
  i6 = i3;
  i7 = i2;
  while (1) {
   i8 = HEAP8[i5 >> 0] | 0;
   i9 = HEAP8[i7 >> 0] | 0;
   if (i8 << 24 >> 24 != i9 << 24 >> 24) break;
   i6 = i6 + -1 | 0;
   if (!i6) {
    i4 = 0;
    break L1;
   } else {
    i5 = i5 + 1 | 0;
    i7 = i7 + 1 | 0;
   }
  }
  i4 = (i8 & 255) - (i9 & 255) | 0;
 } while (0);
 return i4 | 0;
}

function _init_decompression(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 if (!(HEAP32[1028] | 0)) {
  _xz_crc32_init();
  _xz_crc64_init();
  HEAP32[1028] = 1;
 }
 i2 = _malloc(28) | 0;
 i3 = _xz_dec_init(2, 104857600) | 0;
 HEAP32[i2 >> 2] = i3;
 i3 = _malloc(i1) | 0;
 HEAP32[i2 + 4 >> 2] = i3;
 HEAP32[i2 + 8 >> 2] = 0;
 HEAP32[i2 + 12 >> 2] = 0;
 i3 = _malloc(i1) | 0;
 HEAP32[i2 + 16 >> 2] = i3;
 HEAP32[i2 + 20 >> 2] = 0;
 HEAP32[i2 + 24 >> 2] = i1;
 return i2 | 0;
}

function _xz_crc32(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 i4 = ~i3;
 if (!i2) {
  i5 = i4;
  i6 = ~i5;
  return i6 | 0;
 } else {
  i7 = i4;
  i8 = i2;
  i9 = i1;
 }
 while (1) {
  i1 = HEAP32[3088 + ((i7 & 255 ^ (HEAPU8[i9 >> 0] | 0)) << 2) >> 2] ^ i7 >>> 8;
  i8 = i8 + -1 | 0;
  if (!i8) {
   i5 = i1;
   break;
  } else {
   i7 = i1;
   i9 = i9 + 1 | 0;
  }
 }
 i6 = ~i5;
 return i6 | 0;
}

function _sbrk(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i1 = i1 + 15 & -16 | 0;
 i2 = HEAP32[DYNAMICTOP_PTR >> 2] | 0;
 i3 = i2 + i1 | 0;
 if ((i1 | 0) > 0 & (i3 | 0) < (i2 | 0) | (i3 | 0) < 0) {
  abortOnCannotGrowMemory() | 0;
  ___setErrNo(12);
  return -1;
 }
 HEAP32[DYNAMICTOP_PTR >> 2] = i3;
 if ((i3 | 0) > (getTotalMemory() | 0)) if (!(enlargeMemory() | 0)) {
  HEAP32[DYNAMICTOP_PTR >> 2] = i2;
  ___setErrNo(12);
  return -1;
 }
 return i2 | 0;
}

function _memmove(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0;
 if ((i2 | 0) < (i1 | 0) & (i1 | 0) < (i2 + i3 | 0)) {
  i4 = i1;
  i2 = i2 + i3 | 0;
  i1 = i1 + i3 | 0;
  while ((i3 | 0) > 0) {
   i1 = i1 - 1 | 0;
   i2 = i2 - 1 | 0;
   i3 = i3 - 1 | 0;
   HEAP8[i1 >> 0] = HEAP8[i2 >> 0] | 0;
  }
  i1 = i4;
 } else _memcpy(i1, i2, i3) | 0;
 return i1 | 0;
}

function runPostSets() {}
function _bitshift64Lshr(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 if ((i3 | 0) < 32) {
  tempRet0 = i2 >>> i3;
  return i1 >>> i3 | (i2 & (1 << i3) - 1) << 32 - i3;
 }
 tempRet0 = 0;
 return i2 >>> i3 - 32 | 0;
}

function _bitshift64Shl(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 if ((i3 | 0) < 32) {
  tempRet0 = i2 << i3 | (i1 & (1 << i3) - 1 << 32 - i3) >>> 32 - i3;
  return i1 << i3;
 }
 tempRet0 = i1 << i3 - 32;
 return 0;
}

function _i64Subtract(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0;
 i5 = i2 - i4 >>> 0;
 i5 = i2 - i4 - (i3 >>> 0 > i1 >>> 0 | 0) >>> 0;
 return (tempRet0 = i5, i1 - i3 >>> 0 | 0) | 0;
}

function _i64Add(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0;
 i5 = i1 + i3 >>> 0;
 return (tempRet0 = i2 + i4 + (i5 >>> 0 < i1 >>> 0 | 0) >>> 0, i5 | 0) | 0;
}

function _xz_dec_lzma2_end(i1) {
 i1 = i1 | 0;
 if (!(HEAP32[i1 + 60 >> 2] | 0)) {
  _free(i1);
  return;
 }
 _free(HEAP32[i1 + 24 >> 2] | 0);
 _free(i1);
 return;
}

function _release(i1) {
 i1 = i1 | 0;
 _xz_dec_end(HEAP32[i1 >> 2] | 0);
 _free(HEAP32[i1 + 4 >> 2] | 0);
 _free(HEAP32[i1 + 16 >> 2] | 0);
 _free(i1);
 return;
}
function stackAlloc(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + i1 | 0;
 STACKTOP = STACKTOP + 15 & -16;
 return i2 | 0;
}

function _xz_dec_end(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 _xz_dec_lzma2_end(HEAP32[i1 + 1200 >> 2] | 0);
 _free(i1);
 return;
}

function _set_new_input(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 HEAP32[i1 + 8 >> 2] = 0;
 HEAP32[i1 + 12 >> 2] = i2;
 return;
}

function _input_empty(i1) {
 i1 = i1 | 0;
 return (HEAP32[i1 + 8 >> 2] | 0) >>> 0 >= (HEAP32[i1 + 12 >> 2] | 0) >>> 0 | 0;
}

function _init() {
 if (HEAP32[1028] | 0) return;
 _xz_crc32_init();
 _xz_crc64_init();
 HEAP32[1028] = 1;
 return;
}

function setThrew(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 if (!__THREW__) {
  __THREW__ = i1;
  threwValue = i2;
 }
}

function establishStackSpace(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 STACKTOP = i1;
 STACK_MAX = i2;
}

function _decompress(i1) {
 i1 = i1 | 0;
 return _xz_dec_run(HEAP32[i1 >> 2] | 0, i1 + 4 | 0) | 0;
}

function _out_buffer_cleared(i1) {
 i1 = i1 | 0;
 HEAP32[i1 + 20 >> 2] = 0;
 return;
}

function _get_out_buffer(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 16 >> 2] | 0;
}

function _get_in_buffer(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 4 >> 2] | 0;
}

function _get_out_pos(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 20 >> 2] | 0;
}

function stackRestore(i1) {
 i1 = i1 | 0;
 STACKTOP = i1;
}

function setTempRet0(i1) {
 i1 = i1 | 0;
 tempRet0 = i1;
}

function getTempRet0() {
 return tempRet0 | 0;
}

function stackSave() {
 return STACKTOP | 0;
}

function ___errno_location() {
 return 4612;
}

// EMSCRIPTEN_END_FUNCS


  return { ___errno_location: ___errno_location, _bitshift64Lshr: _bitshift64Lshr, _bitshift64Shl: _bitshift64Shl, _decompress: _decompress, _emscripten_replace_memory: _emscripten_replace_memory, _free: _free, _get_in_buffer: _get_in_buffer, _get_out_buffer: _get_out_buffer, _get_out_pos: _get_out_pos, _i64Add: _i64Add, _i64Subtract: _i64Subtract, _init: _init, _init_decompression: _init_decompression, _input_empty: _input_empty, _malloc: _malloc, _memcpy: _memcpy, _memmove: _memmove, _memset: _memset, _out_buffer_cleared: _out_buffer_cleared, _release: _release, _sbrk: _sbrk, _set_new_input: _set_new_input, establishStackSpace: establishStackSpace, getTempRet0: getTempRet0, runPostSets: runPostSets, setTempRet0: setTempRet0, setThrew: setThrew, stackAlloc: stackAlloc, stackRestore: stackRestore, stackSave: stackSave };
})
;