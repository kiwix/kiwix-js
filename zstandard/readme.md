# Source code and compilations of zstandard decompression library

The file `zstddeclib.c` is the single-file source code for the zstandard decompressor (compressor is not included).
It has been combined by following the instructions at https://github.com/facebook/zstd/tree/dev/contrib/single_file_libs. It can be used as the source file of an Emscripten webassembly or asm compilation.

The directory `dist` contains a working browser demo of the `node.js` compilation of the full zstandard library with Emscripten. It has been compiled for html by following the instructions at https://github.com/yoshihitoh/zstd-codec/tree/develop/js/example.

NB These are two separate projects. The node compilation is quite heavy becasue it has all the node packages that allow node projects to run in a browser context. None of this is needed in principle to compile `zstddeclib.c` with Emscripten.