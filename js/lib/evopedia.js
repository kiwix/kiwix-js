define(function(require) {

    // Module dependencies
    var normalize_string = require('normalize_string');
    var bzip2 = require('bzip2');
    var utf8 = require('utf8');

    // Size of chunks read in the dump files : 128 KB
    var CHUNK_SIZE = 131072;

    /**
     * Read an integer encoded in 4 bytes
     */
    function readIntegerFrom4Bytes(byteArray, firstIndex) {
        return byteArray[firstIndex] + byteArray[firstIndex + 1] * 256 + byteArray[firstIndex + 2] * 65536 + byteArray[firstIndex + 3] * 16777216;
    }

    /**
     * Read an integer encoded in 2 bytes
     */
    function readIntegerFrom2Bytes(byteArray, firstIndex) {
        return byteArray[firstIndex] + byteArray[firstIndex + 1] * 256;
    }

    /**
     * Convert a Uint8Array to a lowercase hex string.
     */
    function uint8ArrayToHex(byteArray) {
        var s = '';
        var hexDigits = '0123456789abcdef';
        for (var i = 0; i < byteArray.length; i++) {
            var v = byteArray[i];
            s += hexDigits[(v & 0xff) >> 4];
            s += hexDigits[v & 0xf];
        }
        return s;
    }

    /**
     * Convert a Uint8Array to base64.
     */
    function uint8ArrayToBase64(byteArray) {
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var bits, h1, h2, h3, h4, i = 0;
        var enc = "";

        for (i = 0; i < byteArray.length; ) {
            bits = byteArray[i++] << 16;
            bits |= byteArray[i++] << 8;
            bits |= byteArray[i++];

            h1 = bits >> 18 & 0x3f;
            h2 = bits >> 12 & 0x3f;
            h3 = bits >> 6 & 0x3f;
            h4 = bits & 0x3f;

            enc += b64[h1] + b64[h2] + b64[h3] + b64[h4];
        }

        var r = byteArray.length % 3;

        return (r > 0 ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    }


    /**
     * LocalArchive class : defines a wikipedia dump on the filesystem
     * It's still minimal for now. TODO : complete implementation to handle maths and coordinates
     */
    function LocalArchive() {
        this.dataFiles = new Array();
        this.titleFile = null;
        this.mathIndexFile = null;
        this.mathDataFile = null;
        this.date = null;
        this.language = null;
    };


    /**
     * Read the title File in the given directory, and assign it to the
     * current LocalArchive
     * 
     * @param storage
     * @param directory
     */
    LocalArchive.prototype.readTitleFileFromStorage = function(storage, directory) {
        var currentLocalArchiveInstance = this;
        var filerequest = storage.get(directory + '/titles.idx');
        filerequest.onsuccess = function() {
            currentLocalArchiveInstance.titleFile = filerequest.result;
        };
        filerequest.onerror = function(event) {
            alert("error reading title file in directory " + directory + " : " + event.target.error.name);
        };
    };

    /**
     * Read the data Files in the given directory (starting at given index), and
     * assign them to the current LocalArchive
     * 
     * @param storage
     * @param directory
     * @param index
     */
    LocalArchive.prototype.readDataFilesFromStorage = function(storage, directory, index) {
        var currentLocalArchiveInstance = this;

        var prefixedFileNumber = "";
        if (index < 10) {
            prefixedFileNumber = "0" + index;
        } else {
            prefixedFileNumber = index;
        }
        var filerequest = storage.get(directory + '/wikipedia_' + prefixedFileNumber
                + '.dat');
        filerequest.onsuccess = function() {
            currentLocalArchiveInstance.dataFiles[index] = filerequest.result;
            currentLocalArchiveInstance.readDataFilesFromStorage(storage, directory,
                    index + 1);
        };
        filerequest.onerror = function(event) {
            // TODO there must be a better to way to detect a FileNotFound
            if (event.target.error.name != "NotFoundError") {
                alert("error reading data file " + index + " in directory "
                        + directory + " : " + event.target.error.name);
            }
        };
    };
    
    /**
     * Read the metadata.txt file in the given directory, and store its content
     * in the current instance
     * 
     * @param storage
     * @param directory
     */
    LocalArchive.prototype.readMetadataFileFromStorage = function(storage, directory) {
        var currentLocalArchiveInstance = this;

        var filerequest = storage.get(directory + '/metadata.txt');
        filerequest.onsuccess = function() {
            var metadataFile = filerequest.result;
            currentLocalArchiveInstance.readMetadataFile(metadataFile);
        };
        filerequest.onerror = function(event) {
            alert("error reading metadata.txt file in directory "
                        + directory + " : " + event.target.error.name);
        };
    };
    
    /**
     * Read the metadata file, in order to populate its values in the current
     * instance
     * @param {File} file metadata.txt file
     */
    LocalArchive.prototype.readMetadataFile = function(file) {
        var currentLocalArchiveInstance = this;
        var reader = new FileReader();
        reader.onload = function(e) {
            var metadata = e.target.result;
            currentLocalArchiveInstance.language = /\nlanguage ?\= ?([^ \n]+)/.exec(metadata)[1];
            currentLocalArchiveInstance.date = /\ndate ?\= ?([^ \n]+)/.exec(metadata)[1];
        };
        reader.readAsText(file);
    };

    /**
     * Read the math files (math.idx and math.dat) in the given directory, and assign it to the
     * current LocalArchive
     * 
     * @param storage
     * @param directory
     */
    LocalArchive.prototype.readMathFilesFromStorage = function(storage, directory) {
        var currentLocalArchiveInstance = this;
        var filerequest1 = storage.get(directory + '/math.idx');
        filerequest1.onsuccess = function() {
            currentLocalArchiveInstance.mathIndexFile = filerequest1.result;
        };
        filerequest1.onerror = function(event) {
            alert("error reading math index file in directory " + directory + " : " + event.target.error.name);
        };
        var filerequest2 = storage.get(directory + '/math.dat');
        filerequest2.onsuccess = function() {
            currentLocalArchiveInstance.mathDataFile = filerequest2.result;
        };
        filerequest2.onerror = function(event) {
            alert("error reading math data file in directory " + directory + " : " + event.target.error.name);
        };
    };

    /**
     * This function is recursively called after each asynchronous read, so that
     * to find the closest index in titleFile to the given prefix When found,
     * call the callbackFunction with the index
     * 
     * @param reader
     * @param normalizedPrefix
     * @param lo
     * @param hi
     * @param callbackFunction
     */
    LocalArchive.prototype.recursivePrefixSearch = function(reader, normalizedPrefix, lo, hi, callbackFunction) {
        if (lo < hi - 1) {
            var mid = Math.floor((lo + hi) / 2);
            // TODO : improve the way we read this file : 128 bytes is arbitrary and might be too small
            var blob = this.titleFile.slice(mid, mid + 128);
            var currentLocalArchiveInstance = this;
            reader.onload = function(e) {
                var binaryTitleFile = e.target.result;
                var byteArray = new Uint8Array(binaryTitleFile);
                // Look for the index of the next NewLine
                var newLineIndex = 0;
                while (newLineIndex < byteArray.length && byteArray[newLineIndex] !== 10) {
                    newLineIndex++;
                }
                var startIndex = 0;
                if (mid > 0) {
                    startIndex = newLineIndex + 16;
                    newLineIndex = startIndex;
                    // Look for the index of the next NewLine	
                    while (newLineIndex < byteArray.length && byteArray[newLineIndex] !== 10) {
                        newLineIndex++;
                    }
                }
                if (newLineIndex === startIndex) {
                    // End of file reached
                    hi = mid;
                }
                else {
                    var normalizedTitle =
                            normalize_string.normalizeString(utf8.parse(byteArray.subarray(startIndex,
                            newLineIndex)));
                    if (normalizedTitle < normalizedPrefix) {
                        lo = mid + newLineIndex - 1;
                    }
                    else {
                        hi = mid;
                    }
                }
                currentLocalArchiveInstance.recursivePrefixSearch(reader, normalizedPrefix, lo, hi, callbackFunction);
            };
            // Read the file as a binary string
            reader.readAsArrayBuffer(blob);
        }
        else {
            if (lo > 0) {
                // Let lo point to the start of an entry
                lo++;
                lo++;
            }
            // We found the closest title at index lo
            callbackFunction(lo);
        }
    };

    /**
     * Look for a title in the title file at the given offset, and call the callbackFunction with this Title
     * @param titleOffset
     * @param callbackFunction
     */
    LocalArchive.prototype.getTitleAtOffset = function(titleOffset, callbackFunction) {
        this.getTitlesStartingAtOffset(titleOffset, 1, callbackFunction);
    };

    /**
     * Read the titles in the title file starting at the given offset (maximum titleCount), and call the callbackFunction with this list of Title instances
     * @param titleOffset
     * @param titleCount maximum number of titles to retrieve
     * @param callbackFunction
     */
    LocalArchive.prototype.getTitlesStartingAtOffset = function(titleOffset, titleCount, callbackFunction) {
        var reader = new FileReader();
        reader.onerror = errorHandler;
        reader.onabort = function(e) {
            alert('Title file read cancelled');
        };

        var currentLocalArchiveInstance = this;
        reader.onload = function(e) {
            var binaryTitleFile = e.target.result;
            var byteArray = new Uint8Array(binaryTitleFile);
            var i = 0;
            var newLineIndex = 0;
            var titleNumber = 0;
            var titleList = new Array();
            while (i < byteArray.length && titleNumber < titleCount) {
                // Look for the index of the next NewLine
                newLineIndex += 15;
                while (newLineIndex < byteArray.length && byteArray[newLineIndex] != 10) {
                    newLineIndex++;
                }

                // Copy the encodedTitle in a new Array
                var encodedTitle = new Uint8Array(newLineIndex - i);
                for (var j = 0; j < newLineIndex - i; j++) {
                    encodedTitle[j] = byteArray[i + j];
                }

                var title = Title.parseTitle(encodedTitle, currentLocalArchiveInstance, i);

                titleList[titleNumber] = title;
                titleNumber++;
                i = newLineIndex + 1;
            }
            callbackFunction(titleList);
        };
        // 300 bytes is arbitrary : we actually do not really know how long the titles will be
        // But mediawiki titles seem to be limited to ~200 bytes, so 300 should be more than enough
        var blob = this.titleFile.slice(titleOffset, titleOffset + titleCount * 300);
        // Read in the file as a binary string
        reader.readAsArrayBuffer(blob);
    };

    /**
     * Look for a title by its name, and call the callbackFunction with this Title
     * @param titleName
     * @param callbackFunction
     */
    LocalArchive.prototype.getTitleByName = function(titleName, callbackFunction) {
        var titleFileSize = this.titleFile.size;
        var reader = new FileReader();
        reader.onerror = errorHandler;
        reader.onabort = function(e) {
            alert('Title file read cancelled');
        };
        var currentLocalArchiveInstance = this;
        var normalizedTitleName = normalize_string.normalizeString(titleName);
        this.recursivePrefixSearch(reader, normalizedTitleName, 0, titleFileSize, function(titleOffset) {
            currentLocalArchiveInstance.getTitleAtOffset(titleOffset, callbackFunction);
        });
    };

    /**
     * Get a random title, and call the callbackFunction with this Title
     * @param callbackFunction
     */
    LocalArchive.prototype.getRandomTitle = function(callbackFunction) {
        // TODO to be implemented
    };

    /**
     * Find the 50 titles that start with the given prefix, and call the callbackFunction with this list of Titles
     * @param prefix
     * @param callbackFunction
     */
    LocalArchive.prototype.findTitlesWithPrefix = function(prefix, callbackFunction) {
        var titleFileSize = this.titleFile.size;
        if (prefix) {
            prefix = normalize_string.normalizeString(prefix);
        }

        var reader = new FileReader();
        reader.onerror = errorHandler;
        reader.onabort = function(e) {
            alert('Title file read cancelled');
        };
        var currentLocalArchiveInstance = this;
        var normalizedPrefix = normalize_string.normalizeString(prefix);
        this.recursivePrefixSearch(reader, normalizedPrefix, 0, titleFileSize, function(titleOffset) {
            currentLocalArchiveInstance.getTitlesStartingAtOffset(titleOffset, 50, function(titleList) {
                // Keep only the titles with names starting with the prefix
                var i = 0;
                for (i = 0; i < titleList.length; i++) {
                    var titleName = titleList[i].name;
                    var normalizedTitleName = normalize_string.normalizeString(titleName);
                    if (normalizedTitleName.length < normalizedPrefix.length || normalizedTitleName.substring(0, normalizedPrefix.length) != normalizedPrefix) {
                        break;
                    }
                }
                callbackFunction(titleList.slice(0, i));
            });
        });
    };


    /**
     * Read an article from the title instance, and call the
     * callbackFunction with the article HTML String
     * 
     * @param title
     * @param callbackFunction
     */
    LocalArchive.prototype.readArticle = function(title, callbackFunction) {
        var dataFile = null;

        var prefixedFileNumber = "";
        if (title.fileNr < 10) {
            prefixedFileNumber = "0" + title.fileNr;
        } else {
            prefixedFileNumber = title.fileNr;
        }
        var expectedFileName = "wikipedia_" + prefixedFileNumber + ".dat";

        // Find the good dump file
        for (var i = 0; i < this.dataFiles.length; i++) {
            var fileName = this.dataFiles[i].name;
            // Check if the fileName ends with the expected file name (in case
            // of DeviceStorage usage, the fileName is prefixed by the
            // directory)
            if (fileName.match(expectedFileName + "$") == expectedFileName) {
                dataFile = this.dataFiles[i];
            }
        }
        if (!dataFile) {
            throw "File number " + title.fileNr + " not found";
        } else {
            var reader = new FileReader();
            // Read the article in the dataFile, starting with a chunk of CHUNK_SIZE 
            this.readArticleChunk(title, dataFile, reader, CHUNK_SIZE, callbackFunction);
        }

    };

    /**
     * Read a chunk of the dataFile (of the given length) to try to read the
     * given article.
     * If the bzip2 algorithm works and articleLength of the article is reached,
     * call the callbackFunction with the article HTML String.
     * Else, recursively call this function with readLength + CHUNK_SIZE
     * 
     * @param title
     * @param dataFile
     * @param reader
     * @param readLength
     * @param callbackFunction
     */
    LocalArchive.prototype.readArticleChunk = function(title, dataFile, reader,
            readLength, callbackFunction) {
        var currentLocalArchiveInstance = this;
        reader.onerror = errorHandler;
        reader.onabort = function(e) {
            alert('Data file read cancelled');
        };
        reader.onload = function(e) {
            try {
                var compressedArticles = e.target.result;
                var htmlArticles;
                try {
                    //var startTime = new Date();
                    htmlArticles = bzip2.simple(bzip2.array(new Uint8Array(
                            compressedArticles)));
                    //var endTime = new Date();
                    //console.log("Time elapsed in bzip2 decompression of article " + title.name + " : " + (endTime - startTime) + " ms");
                } catch (e) {
                    // TODO : there must be a better way to differentiate real exceptions
                    // and exceptions due to the fact that the article is too long to fit in the chunk
                    if (e != "No magic number found") {
                        currentLocalArchiveInstance.readArticleChunk(title, dataFile, reader, readLength + CHUNK_SIZE,
                                callbackFunction);
                        return;
                    }
                    else {
                        throw e;
                    }
                }
                // Start reading at offset, and keep length characters
                var htmlArticle = htmlArticles.substring(title.blockOffset,
                        title.blockOffset + title.articleLength);
                if (htmlArticle.length >= title.articleLength) {
                    // Keep only length characters
                    htmlArticle = htmlArticle.substring(0, title.articleLength);
                    // Decode UTF-8 encoding
                    htmlArticle = decodeURIComponent(escape(htmlArticle));
                    callbackFunction(title, htmlArticle);
                } else {
                    // TODO : throw exception if we reach the end of the file
                    currentLocalArchiveInstance.readArticleChunk(title, dataFile, reader, readLength + CHUNK_SIZE,
                            callbackFunction);
                }
            }
            catch (e) {
                callbackFunction("Error : " + e);
            }
        };
        var blob = dataFile.slice(title.blockStart, title.blockStart
                + readLength);

        // Read in the image file as a binary string.
        reader.readAsArrayBuffer(blob);
    };

    /**
     * Load the math image specified by the hex string and call the
     * callbackFunction with a base64 encoding of its data.
     * 
     * @param hexString
     * @param callbackFunction
     */
    LocalArchive.prototype.loadMathImage = function(hexString, callbackFunction) {
        var entrySize = 16 + 4 + 4;
        var lo = 0;
        var hi = this.mathIndexFile.size / entrySize;

        var mathDataFile = this.mathDataFile;

        this.findMathDataPosition(hexString, lo, hi, function(pos, length) {
            var reader = new FileReader();
            reader.onerror = errorHandler;
            reader.onabort = function(e) {
                alert('Math image file read cancelled');
            };
            var blob = mathDataFile.slice(pos, pos + length);
            reader.onload = function(e) {
                var byteArray = new Uint8Array(e.target.result);
                callbackFunction(uint8ArrayToBase64(byteArray));
            };
            reader.readAsArrayBuffer(blob);
        });
    }

    /**
     * Recursive algorithm to find the position of the Math image in the data file
     */
    LocalArchive.prototype.findMathDataPosition = function(hexString, lo, hi, callbackFunction) {
        var entrySize = 16 + 4 + 4;
        if (lo >= hi) {
            /* TODO error - not found */
            return;
        }
        var reader = new FileReader();
        reader.onerror = errorHandler;
        reader.onabort = function(e) {
            alert('Math image file read cancelled');
        };
        var mid = Math.floor((lo + hi) / 2);
        var blob = this.mathIndexFile.slice(mid * entrySize, (mid + 1) * entrySize);
        var currentLocalArchiveInstance = this;
        reader.onload = function(e) {
            var byteArray = new Uint8Array(e.target.result);
            var hash = uint8ArrayToHex(byteArray.subarray(0, 16));
            if (hash == hexString) {
                var pos = readIntegerFrom4Bytes(byteArray, 16);
                var length = readIntegerFrom4Bytes(byteArray, 16 + 4);
                callbackFunction(pos, length);
                return;
            } else if (hexString < hash) {
                hi = mid;
            } else {
                lo = mid + 1;
            }

            currentLocalArchiveInstance.findMathDataPosition(hexString, lo, hi, callbackFunction);
        };
        // Read the file as a binary string
        reader.readAsArrayBuffer(blob);
    };


    /**
     * Resolve the redirect of the given title instance, and call the callbackFunction with the redirected Title instance
     * @param title
     * @param callbackFunction
     */
    LocalArchive.prototype.resolveRedirect = function(title, callbackFunction) {
        var reader = new FileReader();
        reader.onerror = errorHandler;
        reader.onabort = function(e) {
            alert('Title file read cancelled');
        };
        reader.onload = function(e) {
            var binaryTitleFile = e.target.result;
            var byteArray = new Uint8Array(binaryTitleFile);

            if (byteArray.length == 0) {
                throw "Unable to find redirected article : offset " + title.blockStart + " not found in title file";
            }

            var redirectedTitle = title;
            redirectedTitle.fileNr = byteArray[2];
            redirectedTitle.blockStart = readIntegerFrom4Bytes(byteArray, 3);
            redirectedTitle.blockOffset = readIntegerFrom4Bytes(byteArray, 7);
            redirectedTitle.articleLength = readIntegerFrom4Bytes(byteArray, 11);

            callbackFunction(redirectedTitle);
        };
        // Read only the 16 necessary bytes, starting at title.blockStart
        var blob = this.titleFile.slice(title.blockStart, title.blockStart + 16);
        // Read in the file as a binary string
        reader.readAsArrayBuffer(blob);
    };

    /**
     *  Scans the DeviceStorage for archives
     * 
     * @param storage DeviceStorage instance
     * @param callbackFunction Function to call with the list of directories where archives are found
     */
    LocalArchive.scanForArchives = function(storage, callbackFunction) {
        var directories = [];
        var cursor = storage.enumerate();
        cursor.onerror = function() {
            alert("Error scanning directory sd-card : " + cursor.error);
        }
        cursor.onsuccess = function() {
            if (cursor.result) {
                var file = cursor.result;
                var fileName = file.name;

                // We look for files "titles.idx"
                if (!endsWith(fileName, "titles.idx")) {
                    cursor.continue();
                    return;
                }

                // We want to return the directory where titles.idx is stored
                var directory = fileName.substring(0, fileName.lastIndexOf('/'));
                directories.push(directory);
                cursor.continue();
            }
            else {
                callbackFunction(directories);
            }
        };
    };

    /**
     * Utility function : return true if the given string ends with the suffix
     * @param str
     * @param suffix
     * @returns {Boolean}
     */
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }


    /**
     * Title class : defines the title of an article and some methods to manipulate it
     */
    function Title() {
        this.name = null;
        this.fileNr = null;
        this.blockStart = null;
        this.blockOffset = null;
        this.articleLength = null;
        this.archive = null;
        this.titleOffset = null;
        this.titleEntryLength = null;
    }
    ;

    Title.prototype.getReadableName = function() {
        return this.name.replace("_", " ");
    };


    /**
     * Creates a Title instance from an encoded title line from a title file
     */
    Title.parseTitle = function(encodedTitle, archive, titleOffset) {
        if (archive == null) {
            throw "archive cannot be null";
        }
        if (titleOffset < 0) {
            throw "titleOffset cannot be negative (was " + titleOffset + ")";
        }
        var t = new Title();
        t.archive = archive;
        t.titleOffset = titleOffset;

        if (encodedTitle == null || encodedTitle.length < 15)
            return null;

        if (encodedTitle[encodedTitle.length - 1] == '\n') {
            t.titleEntryLength = encodedTitle.length;
        } else {
            t.titleEntryLength = encodedTitle.length + 1;
        }

        var escapedEncodedTitle = new Uint8Array(encodedTitle);
        var escapes = readIntegerFrom2Bytes(encodedTitle, 0);
        if ((escapes & (1 << 14)) != 0)
            escapes |= '\n';
        for (var i = 0; i < 13; i++) {
            if ((escapes & (1 << i)) != 0)
                escapedEncodedTitle[i + 2] = 10; // Corresponds to \n
        }

        t.fileNr = escapedEncodedTitle[2];
        t.blockStart = readIntegerFrom4Bytes(escapedEncodedTitle, 3);
        t.blockOffset = readIntegerFrom4Bytes(escapedEncodedTitle, 7);
        t.articleLength = readIntegerFrom4Bytes(escapedEncodedTitle, 11);

        t.name = Title.parseNameOnly(escapedEncodedTitle);

        return t;
    };

    /*
     * Retrieves the name of an article from an encoded title line
     */
    Title.parseNameOnly = function(encodedTitle) {
        var len = encodedTitle.length;
        if (len < 15) {
            return null;
        }
        if (len > 15 && encodedTitle[len - 1] == '\n') {
            len--;
        }
        return utf8.parse(encodedTitle.subarray(15, len));
    };

    /**
     * Creates a title instance from a serialized id
     */
    Title.parseTitleId = function(localArchive, titleId) {
        var title = new Title();
        var idParts = titleId.split("|");
        title.archive = localArchive;
        title.fileNr = parseInt(idParts[2], 10);
        title.titleOffset = parseInt(idParts[3], 10);
        title.name = idParts[4];
        title.blockStart = parseInt(idParts[5], 10);
        title.blockOffset = parseInt(idParts[6], 10);
        title.articleLength = parseInt(idParts[7], 10);
        return title;
    };


    /**
     * Serialize the title with its values
     * @returns {String}
     */
    Title.prototype.toStringId = function() {
        return this.archive.language + "|" + this.archive.date + "|" + this.fileNr + "|"
                + this.titleOffset + "|" + this.name + "|" + this.blockStart + "|" + this.blockOffset + "|" + this.articleLength;
    };

    /**
     * Serialize the title in a readable way
     */
    Title.prototype.toString = function() {
        return "title.id = " + this.toStringId() + "title.name = " + this.name + " title.fileNr = " + this.fileNr + " title.blockStart = " + this.blockStart + " title.blockOffset = " + this.blockOffset + " title.articleLength = " + this.articleLength;
    };

    /**
     * ErrorHandler for FileReader
     */
    function errorHandler(evt) {
        switch (evt.target.error.code) {
            case evt.target.error.NOT_FOUND_ERR:
                alert('File Not Found!');
                break;
            case evt.target.error.NOT_READABLE_ERR:
                alert('File is not readable');
                break;
            case evt.target.error.ABORT_ERR:
                break; // noop
            default:
                alert('An error occurred reading this file.');
        }
        ;
    }

    /**
     * Functions and classes exposed by this module
     */
    return {
        LocalArchive: LocalArchive,
        Title: Title,
        endsWith : endsWith
    };
});
