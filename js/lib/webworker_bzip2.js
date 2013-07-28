/**
 * WebWorker implementation, in order to run bzip2 decompression in the background
 */
importScripts('./require.js');

require({
    baseUrl: "./"
},
["bzip2"],
        function(bzip2) {
            self.addEventListener('message', function(e) {
                var data = e.data;
                switch (data.cmd) {
                    case 'init':
                        break;
                    case 'uncompress':
                        var compressedByteArray = data.msg;
                        var startTime = new Date();
                        try {
                            var uncompressedString = bzip2.simple(bzip2.array(new Uint8Array(compressedByteArray)));
                            self.postMessage({cmd: 'result', msg: uncompressedString});
                            var endTime = new Date();
                            self.postMessage({cmd: 'debug', msg: "webworker uncompress complete : took " + (endTime - startTime) + " ms"});
                        } catch (e) {
                            // TODO : there must be a better way to differentiate real exceptions
                            // and exceptions due to the fact that the article is too long to fit in the chunk
                            if (e != "No magic number found") {
                                self.postMessage({cmd: 'recurse'});
                            }
                            else {
                                self.postMessage({cmd: 'error', msg: e});
                            }
                        }
                        break;
                    default:
                        self.postMessage({cmd: 'error', msg: 'Unknown command: ' + data.msg});
                }
            }, false);
        }
);
