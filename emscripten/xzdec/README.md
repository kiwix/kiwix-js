# Source code and compilations of zstandard decompression library

This folder shows how to compile the public-domain XZ decoder to make a webassembly binary and an asm JavaScript version.

The source code can be compiled with Emscripten by setting up the Emscripten SDK and running the Linux script `./compile.sh` in this directory. This will produce `xzddec.js`. Further optimization and minification of this file may be possible by adjusting the commandline options in `compile.sh`.

You may be able to compile easily using docker. Look in the `/scripts` directory for helper scripts for your platform.

If you need these builds to support ES6 modules (i.e. `import` and `export` module syntax), you can add `-s EXPORT_ES6=1` to the compile commands in `compile.sh`.