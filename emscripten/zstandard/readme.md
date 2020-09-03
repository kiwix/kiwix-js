# Source code and compilations of zstandard decompression library

The file `zstddeclib.c` is the single-file source code for the zstandard decompressor (compressor is not included).
It has been combined by following the instructions at https://github.com/facebook/zstd/tree/dev/contrib/single_file_libs. It can be used as the source file of an Emscripten webassembly or asm compilation.

The source code can be compiled with Emscripten by setting up the Emscripten SDK and running the Linux script `./compile.sh` in this directory. This will produce `zstdec.js`. Further optimization and minification of this file may be possible by adjusting the commandline options in `compile.sh`.

For a fuller Emscripten distribution of the full zstandard library for `node.js`, see https://github.com/yoshihitoh/zstd-codec/tree/develop/js/example.