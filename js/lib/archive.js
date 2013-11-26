/**
 * archive.js : Class for a local Evopedia archive, with the algorithms to read it
 * This file handles finding a title in an archive, reading an article in an archive etc
 * 
 * Copyright 2013 Mossroy
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
define(function(require) {
    
    // Module dependencies
    var normalize_string = require('normalize_string');
    var utf8 = require('utf8');
    var evopediaTitle = require('title');
    var util = require('util');
    var geometry = require('geometry');
    
    // Declare the webworker that can uncompress with bzip2 algorithm
    var webworkerBzip2 = new Worker("js/lib/webworker_bzip2.js");
    
    // Size of chunks read in the dump files : 128 KB
    var CHUNK_SIZE = 131072;
    // The maximum number of titles that can have the same name after normalizing
    // This is used by the algorithm that searches for a specific article by its name
    var MAX_TITLES_WITH_SAME_NORMALIZED_NAME = 30;
    // Maximum length of a title
    // 300 bytes is arbitrary : we actually do not really know how long the titles will be
    // But mediawiki titles seem to be limited to ~200 bytes, so 300 should be more than enough
    var MAX_TITLE_LENGTH = 300;
    // A rectangle representing all the earth globe
    var GLOBE_RECTANGLE = new geometry.rect(-181, -90, 361, 181);
    
    /**
     * LocalArchive class : defines a wikipedia dump on the filesystem
     */
    function LocalArchive() {
        this.dataFiles = new Array();
        this.coordinateFiles = new Array();
        this.titleFile = null;
        this.mathIndexFile = null;
        this.mathDataFile = null;
        this.date = null;
        this.language = null;
        this.titleSearchFile = null;
    };


    /**
     * Read the title Files in the given directory, and assign them to the
     * current LocalArchive
     * 
     * @param storage
     * @param directory
     */
    LocalArchive.prototype.readTitleFilesFromStorage = function(storage, directory) {
        var currentLocalArchiveInstance = this;
        var filerequest = storage.get(directory + 'titles.idx');
        filerequest.onsuccess = function() {
            currentLocalArchiveInstance.titleFile = filerequest.result;
        };
        filerequest.onerror = function(event) {
            alert("Error reading title file in directory " + directory + " : " + event.target.error.name);
        };
        var filerequestSearch = storage.get(directory + 'titles_search.idx');
        filerequestSearch.onsuccess = function() {
            currentLocalArchiveInstance.titleSearchFile = filerequest.result;
        };
        filerequest.onerror = function(event) {
            // Do nothing : this file is not mandatory in an archive
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
        var filerequest = storage.get(directory + 'wikipedia_' + prefixedFileNumber
                + '.dat');
        filerequest.onsuccess = function() {
            currentLocalArchiveInstance.dataFiles[index] = filerequest.result;
            currentLocalArchiveInstance.readDataFilesFromStorage(storage, directory,
                    index + 1);
        };
        filerequest.onerror = function(event) {
            // TODO there must be a better to way to detect a FileNotFound
            if (event.target.error.name != "NotFoundError") {
                alert("Error reading data file " + index + " in directory "
                        + directory + " : " + event.target.error.name);
            }
        };
    };
    
    /**
     * Read the coordinate Files in the given directory (starting at given index), and
     * assign them to the current LocalArchive
     * 
     * @param storage
     * @param directory
     * @param index
     */
    LocalArchive.prototype.readCoordinateFilesFromStorage = function(storage, directory, index) {
        var currentLocalArchiveInstance = this;

        var prefixedFileNumber = "";
        if (index < 10) {
            prefixedFileNumber = "0" + index;
        } else {
            prefixedFileNumber = index;
        }
        var filerequest = storage.get(directory + 'coordinates_' + prefixedFileNumber
                + '.idx');
        filerequest.onsuccess = function() {
            currentLocalArchiveInstance.coordinateFiles[index - 1] = filerequest.result;
            currentLocalArchiveInstance.readCoordinateFilesFromStorage(storage, directory,
                    index + 1);
        };
        filerequest.onerror = function(event) {
            // TODO there must be a better to way to detect a FileNotFound
            if (event.target.error.name != "NotFoundError") {
                alert("Error reading coordinates file " + index + " in directory "
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

        var filerequest = storage.get(directory + 'metadata.txt');
        filerequest.onsuccess = function() {
            var metadataFile = filerequest.result;
            currentLocalArchiveInstance.readMetadataFile(metadataFile);
        };
        filerequest.onerror = function(event) {
            alert("Error reading metadata.txt file in directory "
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
     * Initialize the localArchive from given archive files
     * @param {type} archiveFiles
     */
    LocalArchive.prototype.initializeFromArchiveFiles = function(archiveFiles) {
        var dataFileRegex = /^wikipedia_(\d\d).dat$/;
        var coordinateFileRegex = /^coordinates_(\d\d).idx$/;
        this.dataFiles = new Array();
        this.coordinateFiles = new Array();
        for (var i=0; i<archiveFiles.length; i++) {
            var file = archiveFiles[i];
            if (file) {
                if (file.name === "metadata.txt") {
                    this.readMetadataFile(file);
                }
                else if (file.name === "titles.idx") {
                    this.titleFile = file;
                }
                else if (file.name === "titles_search.idx") {
                    this.titleSearchFile = file;
                }
                else if (file.name === "math.idx") {
                    this.mathIndexFile = file;
                }
                else if (file.name === "math.dat") {
                    this.mathDataFile = file;
                }
                else {
                    var coordinateFileNr = coordinateFileRegex.exec(file.name);
                    if (coordinateFileNr && coordinateFileNr.length > 0) {
                        var intFileNr = 1 * coordinateFileNr[1];
                        this.coordinateFiles[intFileNr - 1] = file;
                    }
                    else {
                        var dataFileNr = dataFileRegex.exec(file.name);
                        if (dataFileNr && dataFileNr.length > 0) {
                            var intFileNr = 1 * dataFileNr[1];
                            this.dataFiles[intFileNr] = file;
                        }
                    }
                }
            }
        }
        
    };
    
    /**
     * Initialize the localArchive from given directory, using DeviceStorage
     * @param {type} storages List of DeviceStorages available
     * @param {type} archiveDirectory
     */
    LocalArchive.prototype.initializeFromDeviceStorage = function(storages, archiveDirectory) {
        // First, we have to find which DeviceStorage has been selected by the user
        // It is the prefix of the archive directory
        var storageNameRegex = /^\/([^\/]+)\//;
        var regexResults = storageNameRegex.exec(archiveDirectory);
        var selectedStorage = null;
        if (regexResults && regexResults.length>0) {
            var selectedStorageName = regexResults[1];
            for (var i=0; i<storages.length; i++) {
                var storage = storages[i];
                if (selectedStorageName === storage.storageName) {
                    // We found the selected storage
                    selectedStorage = storage;
                }
            }
            if (selectedStorage === null) {
                alert("Unable to find which device storage corresponds to directory " + archiveDirectory);
            }
        }
        else {
            // This happens with FxOS 1.0
            // In this case, we use the first storage of the list
            // (there should be only one)
            if (storages.length === 1) {
                selectedStorage = storages[0];
            }
            else {
                alert("Something weird happened with the DeviceStorage API : found a directory without prefix : "
                    + archiveDirectory + ", but there were " + storages.length
                    + " storages found with getDeviceStorages instead of 1");
            }
        }
        this.readTitleFilesFromStorage(selectedStorage, archiveDirectory);
        this.readDataFilesFromStorage(selectedStorage, archiveDirectory, 0);
        this.readMathFilesFromStorage(selectedStorage, archiveDirectory);
        this.readMetadataFileFromStorage(selectedStorage, archiveDirectory);
        this.readCoordinateFilesFromStorage(selectedStorage, archiveDirectory, 0);
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
        var filerequest1 = storage.get(directory + 'math.idx');
        filerequest1.onsuccess = function() {
            currentLocalArchiveInstance.mathIndexFile = filerequest1.result;
        };
        filerequest1.onerror = function(event) {
            alert("Error reading math index file in directory " + directory + " : " + event.target.error.name);
        };
        var filerequest2 = storage.get(directory + 'math.dat');
        filerequest2.onsuccess = function() {
            currentLocalArchiveInstance.mathDataFile = filerequest2.result;
        };
        filerequest2.onerror = function(event) {
            alert("Error reading math data file in directory " + directory + " : " + event.target.error.name);
        };
    };

    /**
     * This function is recursively called after each asynchronous read, so that
     * to find the closest index in titleFile to the given prefix
     * When found, call the callbackFunction with the index
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
            var blob = this.titleFile.slice(mid, mid + MAX_TITLE_LENGTH);
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

                var title = evopediaTitle.Title.parseTitle(encodedTitle, currentLocalArchiveInstance, i);

                titleList[titleNumber] = title;
                titleNumber++;
                i = newLineIndex + 1;
            }
            callbackFunction(titleList);
        };
        var blob = this.titleFile.slice(titleOffset, titleOffset + titleCount * MAX_TITLE_LENGTH);
        // Read in the file as a binary string
        reader.readAsArrayBuffer(blob);
    };

    /**
     * Look for a title by its name, and call the callbackFunction with this Title
     * If the title is not found, the callbackFunction is called with parameter null
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
            currentLocalArchiveInstance.getTitlesStartingAtOffset(titleOffset, MAX_TITLES_WITH_SAME_NORMALIZED_NAME, function(titleList) {
                if (titleList !== null && titleList.length>0) {
                    for (var i=0; i<titleList.length; i++) {
                        var title = titleList[i];
                        if (title.name === titleName) {
                            // The title has been found
                            callbackFunction(title);
                            return;
                        }
                    }
                }
                // The title has not been found
                callbackFunction(null);
            });
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
     * Find titles that start with the given prefix, and call the callbackFunction with this list of Titles
     * @param prefix
     * @param maxSize Maximum number of titles to read
     * @param callbackFunction
     */
    LocalArchive.prototype.findTitlesWithPrefix = function(prefix, maxSize, callbackFunction) {
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
            currentLocalArchiveInstance.getTitlesStartingAtOffset(titleOffset, maxSize, function(titleList) {
                // Keep only the titles with names starting with the prefix
                var i = 0;
                for (i = 0; i < titleList.length; i++) {
                    var titleName = titleList[i].name;
                    var normalizedTitleName = normalize_string.normalizeString(titleName);
                    if (normalizedTitleName.length < normalizedPrefix.length || normalizedTitleName.substring(0, normalizedPrefix.length) !== normalizedPrefix) {
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
            // TODO can probably be replaced by some error handler at window level
            alert("Oops : some files seem to be missing in your archive. Please report this problem to us by email (see About section), with the names of the archive and article, and the following info : "
                + "File number " + title.fileNr + " not found");
            throw new Error("File number " + title.fileNr + " not found");
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
                webworkerBzip2.onerror = function(event){
                    // TODO can probably be replaced by some error handler at window level
                    alert("An unexpected error occured during bzip2 decompression. Please report it to us by email or through Github (see About section), with the names of the archive and article, and the following info : message="
                            + event.message + " filename=" + event.filename + " line number=" + event.lineno );
                    throw new Error("Error during bzip2 decompression : " + event.message + " (" + event.filename + ":" + event.lineno + ")");
                };
                webworkerBzip2.onmessage = function(event){
                    switch (event.data.cmd){
                        case "result":
                            var htmlArticles = event.data.msg;
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
                            break;
                        case "recurse":
                            currentLocalArchiveInstance.readArticleChunk(title, dataFile, reader, readLength + CHUNK_SIZE, callbackFunction);
                            break;
                        case "debug":
                            console.log(event.data.msg);
                            break;
                        case "error":
                            // TODO can probably be replaced by some error handler at window level
                            alert("An unexpected error occured during bzip2 decompression. Please report it to us by email or through Github (see About section), with the names of the archive and article, and the following info : message="
                            + event.data.msg );
                            throw new Error("Error during bzip2 decompression : " + event.data.msg);
                            break;
                    }
                };
                webworkerBzip2.postMessage({cmd : 'uncompress', msg : compressedArticles});
                
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
                callbackFunction(util.uint8ArrayToBase64(byteArray));
            };
            reader.readAsArrayBuffer(blob);
        });
    };


    /**
     * Recursive algorithm to find the position of the Math image in the data file
     * @param {type} hexString
     * @param {type} lo
     * @param {type} hi
     * @param {type} callbackFunction
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
            var hash = util.uint8ArrayToHex(byteArray.subarray(0, 16));
            if (hash == hexString) {
                var pos = util.readIntegerFrom4Bytes(byteArray, 16);
                var length = util.readIntegerFrom4Bytes(byteArray, 16 + 4);
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

            if (byteArray.length === 0) {
                // TODO can probably be replaced by some error handler at window level
                alert("Oops : there seems to be something wrong in your archive. Please report it to us by email or through Github (see About section), with the names of the archive and article and the following info : "
                    + "Unable to find redirected article for title " + title.name + " : offset " + title.blockStart + " not found in title file");
                throw new Error("Unable to find redirected article for title " + title.name + " : offset " + title.blockStart + " not found in title file");
            }

            var redirectedTitle = title;
            redirectedTitle.fileNr = 1 * byteArray[2];
            redirectedTitle.blockStart = util.readIntegerFrom4Bytes(byteArray, 3);
            redirectedTitle.blockOffset = util.readIntegerFrom4Bytes(byteArray, 7);
            redirectedTitle.articleLength = util.readIntegerFrom4Bytes(byteArray, 11);

            callbackFunction(redirectedTitle);
        };
        // Read only the 16 necessary bytes, starting at title.blockStart
        var blob = this.titleFile.slice(title.blockStart, title.blockStart + 16);
        // Read in the file as a binary string
        reader.readAsArrayBuffer(blob);
    };
    
    /**
     * Finds titles that are located inside the given rectangle
     * This is the main function, that has to be called from the application
     * 
     * @param {type} rect Rectangle where to look for titles
     * @param {type} maxTitles Maximum number of titles to find
     * @param callbackFunction Function to call with the list of titles found
     */
    LocalArchive.prototype.getTitlesInCoords = function(rect, maxTitles, callbackFunction) {
        var normalizedRectangle = rect.normalized();
        var i = 0;
        LocalArchive.getTitlesInCoordsInt(this, i, 0, normalizedRectangle, GLOBE_RECTANGLE, maxTitles, new Array(), callbackFunction, LocalArchive.callbackGetTitlesInCoordsInt);
    };
    
    /**
     * Callback function called by getTitlesInCoordsInt (or by itself), in order
     * to loop through every coordinate file, and search titles nearby in each
     * of them.
     * When all the coordinate files are searched, or when enough titles are
     * found, another function is called to convert the title positions found
     * into Title instances (asynchronously)
     * 
     * @param {type} localArchive
     * @param {type} titlePositionsFound
     * @param {type} i : index of the coordinate file
     * @param {type} maxTitles
     * @param {type} normalizedRectangle
     * @param {type} callbackFunction
     */
    LocalArchive.callbackGetTitlesInCoordsInt = function(localArchive, titlePositionsFound, i, maxTitles, normalizedRectangle, callbackFunction) {
        i++;
        if (titlePositionsFound.length < maxTitles && i < localArchive.coordinateFiles.length) {
            LocalArchive.getTitlesInCoordsInt(localArchive, i, 0, normalizedRectangle, GLOBE_RECTANGLE, maxTitles, titlePositionsFound, callbackFunction, LocalArchive.callbackGetTitlesInCoordsInt);
        }
        else {
            // Search is over : now let's convert the title positions into Title instances
            if (titlePositionsFound && titlePositionsFound.length > 0) {
                // TODO find out why there are duplicates, and why the maxTitles is not respected
                // The statement below removes duplicates and limits its size
                // (not correctly because based on indexes of the original array, instead of target array)
                // This should be removed when the cause is found
                var filteredTitlePositions = titlePositionsFound.filter(function (e, i, arr) {
                    return arr.lastIndexOf(e) === i && i<=maxTitles;
                });
                LocalArchive.readTitlesFromTitleCoordsInTitleFile(localArchive, filteredTitlePositions, 0, new Array(), callbackFunction);
            }
            else {
                callbackFunction(titlePositionsFound);
            }
        }
    };

    /**
     * This function reads a list of title positions, and converts it into a list or Title instances.
     * It handles index i, then recursively calls itself for index i+1
     * When all the list is processed, the callbackFunction is called with the Title list
     * 
     * @param {type} localArchive
     * @param {type} titlePositionsFound
     * @param {type} i
     * @param {type} titlesFound
     * @param {type} callbackFunction
     */
    LocalArchive.readTitlesFromTitleCoordsInTitleFile = function (localArchive, titlePositionsFound, i, titlesFound, callbackFunction) {
        var titleOffset = titlePositionsFound[i];
        localArchive.getTitlesStartingAtOffset(titleOffset, 1, function(titleList) {
            if (titleList && titleList.length === 1) {
                titlesFound.push(titleList[0]);
                i++;
                if (i<titlePositionsFound.length) {
                    LocalArchive.readTitlesFromTitleCoordsInTitleFile(localArchive, titlePositionsFound, i, titlesFound, callbackFunction);
                }
                else {
                    callbackFunction(titlesFound);
                }
            }
            else {
                alert("No title could be found at offset " + titleOffset);
            }
        });
    };
    
    /**
     * Reads 8 bytes in given byteArray, starting at startIndex, and convert
     * these 8 bytes into latitude and longitude (each uses 4 bytes, little endian)
     * @param {type} byteArray
     * @param {type} startIndex
     * @returns {_L23.geometry.point}
     */
    readCoordinates = function(byteArray, startIndex) {
      var lat = util.readFloatFrom4Bytes(byteArray, startIndex, true);
      var long = util.readFloatFrom4Bytes(byteArray, startIndex + 4, true);
      var point = new geometry.point(long, lat);
      return point;
    };
    
    /**
     * Searches in a coordinate file some titles in a target rectangle.
     * This function recursively calls itself, in order to browse all the quadtree
     * @param {type} localArchive
     * @param {type} coordinateFileIndex
     * @param {type} coordFilePos
     * @param {type} targetRect
     * @param {type} thisRect
     * @param {type} maxTitles
     * @param {type} titlePositionsFound
     * @param {type} callbackFunction
     * @param {type} callbackGetTitlesInCoordsInt
     */
    LocalArchive.getTitlesInCoordsInt = function(localArchive, coordinateFileIndex, coordFilePos, targetRect, thisRect, maxTitles, titlePositionsFound, callbackFunction, callbackGetTitlesInCoordsInt) {
        var reader = new FileReader();
        reader.onerror = errorHandler;
        reader.onabort = function(e) {
            alert('Coordinate file read cancelled');
        };

        reader.onload = function(e) {
            var binaryTitleFile = e.target.result;
            var byteArray = new Uint8Array(binaryTitleFile);
            // Compute selector
            var selector = util.readIntegerFrom2Bytes(byteArray, 0);
            
            // 0xFFFF = 65535 in decimal
            if (selector === 65535) {
                // This is an innernode : let's browse it subdivisions
                var center = readCoordinates(byteArray, 2);
                var lensw = util.readIntegerFrom4Bytes(byteArray, 10);
                var lense = util.readIntegerFrom4Bytes(byteArray, 14);
                var lennw = util.readIntegerFrom4Bytes(byteArray, 18);
                // Compute the 4 positions in coordinate file
                var pos0 = coordFilePos + 22;
                var pos1 = pos0 + lensw;
                var pos2 = pos1 + lense;
                var pos3 = pos2 + lennw;
                // Compute the 4 rectangles around
                var rectSW = new geometry.rect(thisRect.origin(), center);
                var rectSE = (new geometry.rect(thisRect.topRight(), center)).normalized();
                var rectNW = (new geometry.rect(thisRect.bottomLeft(), center)).normalized();
                var rectNE = (new geometry.rect(thisRect.corner(), center)).normalized();
                // Recursively call this function for each rectangle around
                if (targetRect.intersect(rectSW)) {
                    LocalArchive.getTitlesInCoordsInt(localArchive, coordinateFileIndex, pos0, targetRect, rectSW, maxTitles, titlePositionsFound, callbackFunction, callbackGetTitlesInCoordsInt);
                }
                if (targetRect.intersect(rectSE)) {
                    LocalArchive.getTitlesInCoordsInt(localArchive, coordinateFileIndex, pos1, targetRect, rectSE, maxTitles, titlePositionsFound, callbackFunction, callbackGetTitlesInCoordsInt);
                }
                if (targetRect.intersect(rectNW)) {
                    LocalArchive.getTitlesInCoordsInt(localArchive, coordinateFileIndex, pos2, targetRect, rectNW, maxTitles, titlePositionsFound, callbackFunction, callbackGetTitlesInCoordsInt);
                }
                if (targetRect.intersect(rectNE)) {
                    LocalArchive.getTitlesInCoordsInt(localArchive, coordinateFileIndex, pos3, targetRect, rectNE, maxTitles, titlePositionsFound, callbackFunction, callbackGetTitlesInCoordsInt);
                }
            }
            else {
                // This is a leaf node : let's see if its articles are in the
                // target rectangle
                for (var i = 0; i < selector; i ++) {
                    var indexInByteArray = 2 + i * 12;
                    
                    var articleCoordinates = readCoordinates(byteArray, indexInByteArray);
                    // Read position (in title file) of title
                    var title_pos = util.readIntegerFrom4Bytes(byteArray, indexInByteArray + 8);
                    if (!targetRect.containsPoint(articleCoordinates)) {
                        continue;
                    }
                    // We currently do not use the article coordinates
                    // so it's no use putting it in the result list : we only put
                    // the position in title list
                    titlePositionsFound.push(title_pos);
                    if (maxTitles >= 0 && titlePositionsFound.length >= maxTitles) {
                        callbackGetTitlesInCoordsInt(localArchive, titlePositionsFound, coordinateFileIndex, maxTitles, targetRect, callbackFunction);
                        return;
                    }
                }
                callbackGetTitlesInCoordsInt(localArchive, titlePositionsFound, coordinateFileIndex, maxTitles, targetRect, callbackFunction);
            }

        };
        // Read 22 bytes in the coordinate files, at coordFilePos index, in order to read the selector and the coordinates
        // 2 + 4 + 4 + 3 * 4 = 22
        // As there can be up to 65535 different coordinates, we have to read 22*65535 bytes = 1.44MB
        // TODO : This should be improved by reading the file in 2 steps :
        // - first read the selector
        // - then read the coordinates (reading only the exact necessary bytes)
        var blob = localArchive.coordinateFiles[coordinateFileIndex].slice(coordFilePos, coordFilePos + 22*65535);
        
        // Read in the file as a binary string
        reader.readAsArrayBuffer(blob);
    };

    /**
     *  Scans the DeviceStorage for archives
     * 
     * @param storages List of DeviceStorage instances
     * @param callbackFunction Function to call with the list of directories where archives are found
     */
    LocalArchive.scanForArchives = function(storages, callbackFunction) {
        var directories = [];
        var cursor = util.enumerateAll(storages);
        cursor.onerror = function() {
            alert("Error scanning your SD card : " + cursor.error
                    +". If you're using the Firefox OS Simulator, please put the archives in a 'fake-sdcard' directory inside your Firefox profile (ex : ~/.mozilla/firefox/xxxx.default/extensions/r2d2b2g@mozilla.org/profile/fake-sdcard/wikipedia_small_2010-08-14)");
            callbackFunction(null);
        };
        cursor.onsuccess = function() {
            if (cursor.result) {
                var file = cursor.result;
                var fileName = file.name;

                // We look for files "titles.idx"
                if (!util.endsWith(fileName, "titles.idx")) {
                    cursor.continue();
                    return;
                }
                
                // Handle the case of archive files at the root of the sd-card
                // (without a subdirectory)
                var directory = "/";
                
                if (fileName.lastIndexOf('/')!==-1) {
                    // We want to return the directory where titles.idx is stored
                    // We also keep the trailing slash
                    directory = fileName.substring(0, fileName.lastIndexOf('/') + 1);
                }
                
                directories.push(directory);
                cursor.continue();
            }
            else {
                callbackFunction(directories);
            }
        };
    };
    
    /**
     * ErrorHandler for FileReader
     * @param {type} evt
     * @returns {undefined}
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
        };
    }

    
    /**
     * Functions and classes exposed by this module
     */
    return {
        LocalArchive: LocalArchive
    };
});
