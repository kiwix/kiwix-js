
var ZD = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return (
function(ZD) {
  ZD = ZD || {};


var b;
b || (b = typeof ZD !== 'undefined' ? ZD : {});
var Promise = function() {
  function a() {
  }
  function c(d, f) {
    return function() {
      d.apply(f, arguments);
    };
  }
  function e(d) {
    if (!(this instanceof e)) {
      throw new TypeError("Promises must be constructed via new");
    }
    if ("function" !== typeof d) {
      throw new TypeError("not a function");
    }
    this.a = 0;
    this.h = !1;
    this.b = void 0;
    this.c = [];
    J(d, this);
  }
  function l(d, f) {
    for (; 3 === d.a;) {
      d = d.b;
    }
    0 === d.a ? d.c.push(f) : (d.h = !0, e.i(function() {
      var g = 1 === d.a ? f.m : f.o;
      if (null === g) {
        (1 === d.a ? m : p)(f.g, d.b);
      } else {
        try {
          var h = g(d.b);
        } catch (k) {
          p(f.g, k);
          return;
        }
        m(f.g, h);
      }
    }));
  }
  function m(d, f) {
    try {
      if (f === d) {
        throw new TypeError("A promise cannot be resolved with itself.");
      }
      if (f && ("object" === typeof f || "function" === typeof f)) {
        var g = f.then;
        if (f instanceof e) {
          d.a = 3;
          d.b = f;
          u(d);
          return;
        }
        if ("function" === typeof g) {
          J(c(g, f), d);
          return;
        }
      }
      d.a = 1;
      d.b = f;
      u(d);
    } catch (h) {
      p(d, h);
    }
  }
  function p(d, f) {
    d.a = 2;
    d.b = f;
    u(d);
  }
  function u(d) {
    2 === d.a && 0 === d.c.length && e.i(function() {
      d.h || e.j(d.b);
    });
    for (var f = 0, g = d.c.length; f < g; f++) {
      l(d, d.c[f]);
    }
    d.c = null;
  }
  function r(d, f, g) {
    this.m = "function" === typeof d ? d : null;
    this.o = "function" === typeof f ? f : null;
    this.g = g;
  }
  function J(d, f) {
    var g = !1;
    try {
      d(function(h) {
        g || (g = !0, m(f, h));
      }, function(h) {
        g || (g = !0, p(f, h));
      });
    } catch (h) {
      g || (g = !0, p(f, h));
    }
  }
  e.prototype["catch"] = function(d) {
    return this.then(null, d);
  };
  e.prototype.then = function(d, f) {
    var g = new this.constructor(a);
    l(this, new r(d, f, g));
    return g;
  };
  e.all = function(d) {
    return new e(function(f, g) {
      function h(Q, C) {
        try {
          if (C && ("object" === typeof C || "function" === typeof C)) {
            var ja = C.then;
            if ("function" === typeof ja) {
              ja.call(C, function(X) {
                h(Q, X);
              }, g);
              return;
            }
          }
          k[Q] = C;
          0 === --v && f(k);
        } catch (X) {
          g(X);
        }
      }
      if (!Array.isArray(d)) {
        return g(new TypeError("Promise.all accepts an array"));
      }
      var k = Array.prototype.slice.call(d);
      if (0 === k.length) {
        return f([]);
      }
      for (var v = k.length, n = 0; n < k.length; n++) {
        h(n, k[n]);
      }
    });
  };
  e.resolve = function(d) {
    return d && "object" === typeof d && d.constructor === e ? d : new e(function(f) {
      f(d);
    });
  };
  e.reject = function(d) {
    return new e(function(f, g) {
      g(d);
    });
  };
  e.race = function(d) {
    return new e(function(f, g) {
      if (!Array.isArray(d)) {
        return g(new TypeError("Promise.race accepts an array"));
      }
      for (var h = 0, k = d.length; h < k; h++) {
        e.resolve(d[h]).then(f, g);
      }
    });
  };
  e.i = "function" === typeof setImmediate && function(d) {
    setImmediate(d);
  } || function(d) {
    setTimeout(d, 0);
  };
  e.j = function(d) {
    "undefined" !== typeof console && console && console.warn("Possible Unhandled Promise Rejection:", d);
  };
  return e;
}(), aa, ba;
b.ready = new Promise(function(a, c) {
  aa = a;
  ba = c;
});
var q = {}, t;
for (t in b) {
  b.hasOwnProperty(t) && (q[t] = b[t]);
}
var w = !1, x = !1, y = !1, ca = !1;
w = "object" === typeof window;
x = "function" === typeof importScripts;
y = "object" === typeof process && "object" === typeof process.versions && "string" === typeof process.versions.node;
ca = !w && !y && !x;
var z = "", A, B, D, E;
if (y) {
  z = x ? require("path").dirname(z) + "/" : __dirname + "/", A = function(a, c) {
    var e = F(a);
    if (e) {
      return c ? e : e.toString();
    }
    D || (D = require("fs"));
    E || (E = require("path"));
    a = E.normalize(a);
    return D.readFileSync(a, c ? null : "utf8");
  }, B = function(a) {
    a = A(a, !0);
    a.buffer || (a = new Uint8Array(a));
    assert(a.buffer);
    return a;
  }, 1 < process.argv.length && process.argv[1].replace(/\\/g, "/"), process.argv.slice(2), process.on("uncaughtException", function(a) {
    throw a;
  }), process.on("unhandledRejection", G), b.inspect = function() {
    return "[Emscripten Module object]";
  };
} else {
  if (ca) {
    "undefined" != typeof read && (A = function(a) {
      var c = F(a);
      return c ? da(c) : read(a);
    }), B = function(a) {
      var c;
      if (c = F(a)) {
        return c;
      }
      if ("function" === typeof readbuffer) {
        return new Uint8Array(readbuffer(a));
      }
      c = read(a, "binary");
      assert("object" === typeof c);
      return c;
    }, "undefined" !== typeof print && ("undefined" === typeof console && (console = {}), console.log = print, console.warn = console.error = "undefined" !== typeof printErr ? printErr : print);
  } else {
    if (w || x) {
      x ? z = self.location.href : document.currentScript && (z = document.currentScript.src), _scriptDir && (z = _scriptDir), 0 !== z.indexOf("blob:") ? z = z.substr(0, z.lastIndexOf("/") + 1) : z = "", A = function(a) {
        try {
          var c = new XMLHttpRequest;
          c.open("GET", a, !1);
          c.send(null);
          return c.responseText;
        } catch (e) {
          if (a = F(a)) {
            return da(a);
          }
          throw e;
        }
      }, x && (B = function(a) {
        try {
          var c = new XMLHttpRequest;
          c.open("GET", a, !1);
          c.responseType = "arraybuffer";
          c.send(null);
          return new Uint8Array(c.response);
        } catch (e) {
          if (a = F(a)) {
            return a;
          }
          throw e;
        }
      });
    }
  }
}
b.print || console.log.bind(console);
var H = b.printErr || console.warn.bind(console);
for (t in q) {
  q.hasOwnProperty(t) && (b[t] = q[t]);
}
q = null;
var ea = 0, I;
b.wasmBinary && (I = b.wasmBinary);
var noExitRuntime;
b.noExitRuntime && (noExitRuntime = b.noExitRuntime);
function fa() {
  this.buffer = new ArrayBuffer(ha / 65536 * 65536);
  this.grow = function(a) {
    return ia(a);
  };
}
function ka() {
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
)(la, K, ma);
}
function na() {
  return {then:function(a) {
    a({instance:new ka});
  }};
}
var oa = Error, WebAssembly = {};
I = [];
"object" !== typeof WebAssembly && G("no native wasm support detected");
var K, ma = new function(a) {
  var c = Array(a.initial);
  c.grow = function() {
    1 <= c.length && G("Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH.");
    c.push(null);
  };
  c.set = function(e, l) {
    c[e] = l;
  };
  c.get = function(e) {
    return c[e];
  };
  return c;
}({initial:1, maximum:1, element:"anyfunc"}), pa = !1;
function assert(a, c) {
  a || G("Assertion failed: " + c);
}
function qa(a) {
  var c = b["_" + a];
  assert(c, "Cannot call unknown function " + a + ", make sure it is exported");
  return c;
}
function ra(a, c, e, l) {
  var m = {string:function(d) {
    var f = 0;
    if (null !== d && void 0 !== d && 0 !== d) {
      var g = (d.length << 2) + 1;
      f = sa(g);
      var h = f, k = L;
      if (0 < g) {
        g = h + g - 1;
        for (var v = 0; v < d.length; ++v) {
          var n = d.charCodeAt(v);
          if (55296 <= n && 57343 >= n) {
            var Q = d.charCodeAt(++v);
            n = 65536 + ((n & 1023) << 10) | Q & 1023;
          }
          if (127 >= n) {
            if (h >= g) {
              break;
            }
            k[h++] = n;
          } else {
            if (2047 >= n) {
              if (h + 1 >= g) {
                break;
              }
              k[h++] = 192 | n >> 6;
            } else {
              if (65535 >= n) {
                if (h + 2 >= g) {
                  break;
                }
                k[h++] = 224 | n >> 12;
              } else {
                if (h + 3 >= g) {
                  break;
                }
                k[h++] = 240 | n >> 18;
                k[h++] = 128 | n >> 12 & 63;
              }
              k[h++] = 128 | n >> 6 & 63;
            }
            k[h++] = 128 | n & 63;
          }
        }
        k[h] = 0;
      }
    }
    return f;
  }, array:function(d) {
    var f = sa(d.length);
    M.set(d, f);
    return f;
  }}, p = qa(a), u = [];
  a = 0;
  if (l) {
    for (var r = 0; r < l.length; r++) {
      var J = m[e[r]];
      J ? (0 === a && (a = ta()), u[r] = J(l[r])) : u[r] = l[r];
    }
  }
  e = p.apply(null, u);
  e = function(d) {
    if ("string" === c) {
      if (d) {
        for (var f = L, g = d + NaN, h = d; f[h] && !(h >= g);) {
          ++h;
        }
        if (16 < h - d && f.subarray && ua) {
          d = ua.decode(f.subarray(d, h));
        } else {
          for (g = ""; d < h;) {
            var k = f[d++];
            if (k & 128) {
              var v = f[d++] & 63;
              if (192 == (k & 224)) {
                g += String.fromCharCode((k & 31) << 6 | v);
              } else {
                var n = f[d++] & 63;
                k = 224 == (k & 240) ? (k & 15) << 12 | v << 6 | n : (k & 7) << 18 | v << 12 | n << 6 | f[d++] & 63;
                65536 > k ? g += String.fromCharCode(k) : (k -= 65536, g += String.fromCharCode(55296 | k >> 10, 56320 | k & 1023));
              }
            } else {
              g += String.fromCharCode(k);
            }
          }
          d = g;
        }
      } else {
        d = "";
      }
    } else {
      d = "boolean" === c ? !!d : d;
    }
    return d;
  }(e);
  0 !== a && va(a);
  return e;
}
var ua = "undefined" !== typeof TextDecoder ? new TextDecoder("utf8") : void 0;
"undefined" !== typeof TextDecoder && new TextDecoder("utf-16le");
var N, M, L, wa, O, xa, ya, ha = b.INITIAL_MEMORY || 140247040;
b.wasmMemory ? K = b.wasmMemory : K = new fa;
K && (N = K.buffer);
ha = N.byteLength;
var P = N;
N = P;
b.HEAP8 = M = new Int8Array(P);
b.HEAP16 = wa = new Int16Array(P);
b.HEAP32 = O = new Int32Array(P);
b.HEAPU8 = L = new Uint8Array(P);
b.HEAPU16 = new Uint16Array(P);
b.HEAPU32 = new Uint32Array(P);
b.HEAPF32 = xa = new Float32Array(P);
b.HEAPF64 = ya = new Float64Array(P);
O[1476] = 5248944;
function R(a) {
  for (; 0 < a.length;) {
    var c = a.shift();
    if ("function" == typeof c) {
      c(b);
    } else {
      var e = c.l;
      "number" === typeof e ? void 0 === c.f ? b.dynCall_v(e) : b.dynCall_vi(e, c.f) : e(void 0 === c.f ? null : c.f);
    }
  }
}
var za = [], Aa = [], Ba = [], Ca = [];
function Da() {
  var a = b.preRun.shift();
  za.unshift(a);
}
Math.imul && -5 === Math.imul(4294967295, 5) || (Math.imul = function(a, c) {
  var e = a & 65535, l = c & 65535;
  return e * l + ((a >>> 16) * l + e * (c >>> 16) << 16) | 0;
});
if (!Math.fround) {
  var Ea = new Float32Array(1);
  Math.fround = function(a) {
    Ea[0] = a;
    return Ea[0];
  };
}
Math.clz32 || (Math.clz32 = function(a) {
  var c = 32, e = a >> 16;
  e && (c -= 16, a = e);
  if (e = a >> 8) {
    c -= 8, a = e;
  }
  if (e = a >> 4) {
    c -= 4, a = e;
  }
  if (e = a >> 2) {
    c -= 2, a = e;
  }
  return a >> 1 ? c - 2 : c - a;
});
Math.trunc || (Math.trunc = function(a) {
  return 0 > a ? Math.ceil(a) : Math.floor(a);
});
var Fa = Math.abs, Ga = Math.ceil, Ha = Math.floor, Ia = Math.min, S = 0, Ja = null, T = null;
b.preloadedImages = {};
b.preloadedAudios = {};
function G(a) {
  if (b.onAbort) {
    b.onAbort(a);
  }
  H(a);
  pa = !0;
  a = new oa("abort(" + a + "). Build with -s ASSERTIONS=1 for more info.");
  ba(a);
  throw a;
}
function U(a, c) {
  return String.prototype.startsWith ? a.startsWith(c) : 0 === a.indexOf(c);
}
var V = "data:application/octet-stream;base64,", W = "zstdec.wasm";
if (!U(W, V)) {
  var Ka = W;
  W = b.locateFile ? b.locateFile(Ka, z) : z + Ka;
}
function La() {
  try {
    if (I) {
      return new Uint8Array(I);
    }
    var a = F(W);
    if (a) {
      return a;
    }
    if (B) {
      return B(W);
    }
    throw "both async and sync fetching of the wasm failed";
  } catch (c) {
    G(c);
  }
}
function Ma() {
  return I || !w && !x || "function" !== typeof fetch || U(W, "file://") ? new Promise(function(a) {
    a(La());
  }) : fetch(W, {credentials:"same-origin"}).then(function(a) {
    if (!a.ok) {
      throw "failed to load wasm binary file at '" + W + "'";
    }
    return a.arrayBuffer();
  }).catch(function() {
    return La();
  });
}
var Y, Na;
Aa.push({l:function() {
  Oa();
}});
var Pa = !1;
function da(a) {
  for (var c = [], e = 0; e < a.length; e++) {
    var l = a[e];
    255 < l && (Pa && assert(!1, "Character code " + l + " (" + String.fromCharCode(l) + ")  at offset " + e + " not in 0x00-0xFF."), l &= 255);
    c.push(String.fromCharCode(l));
  }
  return c.join("");
}
var Qa = "function" === typeof atob ? atob : function(a) {
  var c = "", e = 0;
  a = a.replace(/[^A-Za-z0-9\+\/=]/g, "");
  do {
    var l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(e++));
    var m = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(e++));
    var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(e++));
    var u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(e++));
    l = l << 2 | m >> 4;
    m = (m & 15) << 4 | p >> 2;
    var r = (p & 3) << 6 | u;
    c += String.fromCharCode(l);
    64 !== p && (c += String.fromCharCode(m));
    64 !== u && (c += String.fromCharCode(r));
  } while (e < a.length);
  return c;
};
function F(a) {
  if (U(a, V)) {
    a = a.slice(V.length);
    if ("boolean" === typeof y && y) {
      try {
        var c = Buffer.from(a, "base64");
      } catch (p) {
        c = new Buffer(a, "base64");
      }
      var e = new Uint8Array(c.buffer, c.byteOffset, c.byteLength);
    } else {
      try {
        var l = Qa(a), m = new Uint8Array(l.length);
        for (c = 0; c < l.length; ++c) {
          m[c] = l.charCodeAt(c);
        }
        e = m;
      } catch (p) {
        throw Error("Converting base64 string to bytes failed.");
      }
    }
    return e;
  }
}
var la = {emscripten_get_sbrk_ptr:function() {
  return 5904;
}, emscripten_memcpy_big:Uint8Array.prototype.copyWithin ? function(a, c, e) {
  L.copyWithin(a, c, c + e);
} : function(a, c, e) {
  L.set(L.subarray(c, c + e), a);
}, emscripten_resize_heap:function() {
  G("OOM");
}, getTempRet0:function() {
  return ea;
}, memory:K, setTempRet0:function(a) {
  ea = a;
}, table:ma};
(function() {
  function a(m) {
    b.asm = m.exports;
    S--;
    b.monitorRunDependencies && b.monitorRunDependencies(S);
    0 == S && (null !== Ja && (clearInterval(Ja), Ja = null), T && (m = T, T = null, m()));
  }
  function c(m) {
    a(m.instance);
  }
  function e(m) {
    return Ma().then(function() {
      return na();
    }).then(m, function(p) {
      H("failed to asynchronously prepare wasm: " + p);
      G(p);
    });
  }
  var l = {env:la, wasi_snapshot_preview1:la};
  S++;
  b.monitorRunDependencies && b.monitorRunDependencies(S);
  if (b.instantiateWasm) {
    try {
      return b.instantiateWasm(l, a);
    } catch (m) {
      return H("Module.instantiateWasm callback failed with error: " + m), !1;
    }
  }
  (function() {
    if (I || "function" !== typeof WebAssembly.instantiateStreaming || U(W, V) || U(W, "file://") || "function" !== typeof fetch) {
      return e(c);
    }
    fetch(W, {credentials:"same-origin"}).then(function(m) {
      return WebAssembly.instantiateStreaming(m, l).then(c, function(p) {
        H("wasm streaming compile failed: " + p);
        H("falling back to ArrayBuffer instantiation");
        return e(c);
      });
    });
  })();
  return {};
})();
var Oa = b.___wasm_call_ctors = function() {
  return (Oa = b.___wasm_call_ctors = b.asm.__wasm_call_ctors).apply(null, arguments);
};
b._malloc = function() {
  return (b._malloc = b.asm.malloc).apply(null, arguments);
};
b._free = function() {
  return (b._free = b.asm.free).apply(null, arguments);
};
b._ZSTD_getInBuffer = function() {
  return (b._ZSTD_getInBuffer = b.asm.ZSTD_getInBuffer).apply(null, arguments);
};
b._ZSTD_getOutBuffer = function() {
  return (b._ZSTD_getOutBuffer = b.asm.ZSTD_getOutBuffer).apply(null, arguments);
};
b._ZSTD_isError = function() {
  return (b._ZSTD_isError = b.asm.ZSTD_isError).apply(null, arguments);
};
b._ZSTD_getErrorName = function() {
  return (b._ZSTD_getErrorName = b.asm.ZSTD_getErrorName).apply(null, arguments);
};
b._ZSTD_createDStream = function() {
  return (b._ZSTD_createDStream = b.asm.ZSTD_createDStream).apply(null, arguments);
};
b._ZSTD_freeDStream = function() {
  return (b._ZSTD_freeDStream = b.asm.ZSTD_freeDStream).apply(null, arguments);
};
b._ZSTD_DStreamInSize = function() {
  return (b._ZSTD_DStreamInSize = b.asm.ZSTD_DStreamInSize).apply(null, arguments);
};
b._ZSTD_DStreamOutSize = function() {
  return (b._ZSTD_DStreamOutSize = b.asm.ZSTD_DStreamOutSize).apply(null, arguments);
};
b._ZSTD_initDStream = function() {
  return (b._ZSTD_initDStream = b.asm.ZSTD_initDStream).apply(null, arguments);
};
b._ZSTD_decompressStream = function() {
  return (b._ZSTD_decompressStream = b.asm.ZSTD_decompressStream).apply(null, arguments);
};
b._ZSTD_decompressStream_simpleArgs = function() {
  return (b._ZSTD_decompressStream_simpleArgs = b.asm.ZSTD_decompressStream_simpleArgs).apply(null, arguments);
};
b.___errno_location = function() {
  return (b.___errno_location = b.asm.__errno_location).apply(null, arguments);
};
var ta = b.stackSave = function() {
  return (ta = b.stackSave = b.asm.stackSave).apply(null, arguments);
}, va = b.stackRestore = function() {
  return (va = b.stackRestore = b.asm.stackRestore).apply(null, arguments);
}, sa = b.stackAlloc = function() {
  return (sa = b.stackAlloc = b.asm.stackAlloc).apply(null, arguments);
}, ia = b.__growWasmMemory = function() {
  return (ia = b.__growWasmMemory = b.asm.__growWasmMemory).apply(null, arguments);
};
b.cwrap = function(a, c, e, l) {
  e = e || [];
  var m = e.every(function(p) {
    return "number" === p;
  });
  return "string" !== c && m && !l ? qa(a) : function() {
    return ra(a, c, e, arguments);
  };
};
b.setValue = function(a, c, e) {
  e = e || "i8";
  "*" === e.charAt(e.length - 1) && (e = "i32");
  switch(e) {
    case "i1":
      M[a >> 0] = c;
      break;
    case "i8":
      M[a >> 0] = c;
      break;
    case "i16":
      wa[a >> 1] = c;
      break;
    case "i32":
      O[a >> 2] = c;
      break;
    case "i64":
      Na = [c >>> 0, (Y = c, 1.0 <= +Fa(Y) ? 0.0 < Y ? (Ia(+Ha(Y / 4294967296.0), 4294967295.0) | 0) >>> 0 : ~~+Ga((Y - +(~~Y >>> 0)) / 4294967296.0) >>> 0 : 0)];
      O[a >> 2] = Na[0];
      O[a + 4 >> 2] = Na[1];
      break;
    case "float":
      xa[a >> 2] = c;
      break;
    case "double":
      ya[a >> 3] = c;
      break;
    default:
      G("invalid type for setValue: " + e);
  }
};
b.getValue = function(a, c) {
  c = c || "i8";
  "*" === c.charAt(c.length - 1) && (c = "i32");
  switch(c) {
    case "i1":
      return M[a >> 0];
    case "i8":
      return M[a >> 0];
    case "i16":
      return wa[a >> 1];
    case "i32":
      return O[a >> 2];
    case "i64":
      return O[a >> 2];
    case "float":
      return xa[a >> 2];
    case "double":
      return ya[a >> 3];
    default:
      G("invalid type for getValue: " + c);
  }
  return null;
};
var Z;
T = function Ra() {
  Z || Sa();
  Z || (T = Ra);
};
function Sa() {
  function a() {
    if (!Z && (Z = !0, b.calledRun = !0, !pa)) {
      R(Aa);
      R(Ba);
      aa(b);
      if (b.onRuntimeInitialized) {
        b.onRuntimeInitialized();
      }
      if (b.postRun) {
        for ("function" == typeof b.postRun && (b.postRun = [b.postRun]); b.postRun.length;) {
          var c = b.postRun.shift();
          Ca.unshift(c);
        }
      }
      R(Ca);
    }
  }
  if (!(0 < S)) {
    if (b.preRun) {
      for ("function" == typeof b.preRun && (b.preRun = [b.preRun]); b.preRun.length;) {
        Da();
      }
    }
    R(za);
    0 < S || (b.setStatus ? (b.setStatus("Running..."), setTimeout(function() {
      setTimeout(function() {
        b.setStatus("");
      }, 1);
      a();
    }, 1)) : a());
  }
}
b.run = Sa;
if (b.preInit) {
  for ("function" == typeof b.preInit && (b.preInit = [b.preInit]); 0 < b.preInit.length;) {
    b.preInit.pop()();
  }
}
noExitRuntime = !0;
Sa();



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
    