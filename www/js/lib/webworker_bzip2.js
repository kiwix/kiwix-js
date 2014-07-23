/**
 * webworker_bzip2.js : WebWorker implementation, in order to run bzip2 decompression in the background
 * 
 * Copyright 2013-2014 Mossroy and contributors
 * License GPL v3:
 * 
 * This file is part of Evopedia.
 * 
 * Evopedia is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Evopedia is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Evopedia (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */
'use strict';
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
                            var uncompressedString = bzip2.simple(bzip2.array(compressedByteArray));
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
