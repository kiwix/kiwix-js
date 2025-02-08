const { createInstrumenter } = require('istanbul-lib-instrument');
const { resolve } = require('path');
const { readFileSync } = require('fs');

const instrumenter = createInstrumenter({
    esModules: true,
    produceSourceMap: true
});

// Add hook to instrument files from www/js/lib
const oldRequire = require.extensions['.js'];
require.extensions['.js'] = function (module, filename) {
    if (filename.includes('/www/js/lib/')) {
        const content = readFileSync(filename, 'utf8');
        const instrumentedCode = instrumenter.instrumentSync(
            content,
            filename,
            { source: content }
        );
        module._compile(instrumentedCode, filename);
    } else {
        oldRequire(module, filename);
    }
};

module.exports = {};
