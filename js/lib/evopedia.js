define(function(require) {
	
	// Module dependencies
	var remove_diacritics = require('remove_diacritics');
	var bzip2 = require('bzip2');
	
	// Size of chunks read in the dump files : 128 KB
	const CHUNK_SIZE = 131072; 
	
	/**
	 * Read an integer encoded in 4 bytes
	 */
	function readIntegerFrom4Bytes(byteArray,firstIndex) {
		return byteArray[firstIndex] + byteArray[firstIndex+1]*256 + byteArray[firstIndex+2]*65536 + byteArray[firstIndex+3]*16777216; 
	}
	
	/**
	 * Converts a UTF-8 byte array to JavaScript's 16-bit Unicode.
	 * @param {Array.<number>} bytes UTF-8 byte array.
	 * @return {string} 16-bit Unicode string.
	 * Copied from http://closure-library.googlecode.com/svn/docs/closure_goog_crypt.js.source.html (Apache License 2.0)
	 */
	function utf8ByteArrayToString(bytes,startIndex,endIndex) {
		var out = [], pos = startIndex, c = 0;
		while (pos < bytes.length && pos < endIndex) {
			var c1 = bytes[pos++];
			if (c1 < 128) {
				out[c++] = String.fromCharCode(c1);
			} else if (c1 > 191 && c1 < 224) {
				var c2 = bytes[pos++];
				out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
			} else {
				var c2 = bytes[pos++];
				var c3 = bytes[pos++];
				out[c++] = String.fromCharCode(
						(c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
			}
		}
		return out.join('');
	}
	
	/**
	 * LocalArchive class : defines a wikipedia dump on the filesystem
	 * It's still minimal for now. TODO : complete implementation to handle maths and coordinates
	 */
	function LocalArchive() {
		this.dataFiles = new Array();
		this.titleFile = null;
		// TODO to be replaced by the real archive attributes
		this.date = "2013-03-14";
		this.language = "zz";
	};
	

	/**
	 * Read the title File in the given directory, and assign it to the
	 * current LocalArchive
	 * 
	 * @param storage
	 * @param directory
	 */
	LocalArchive.prototype.readTitleFile = function(storage, directory) {
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
	LocalArchive.prototype.readDataFiles = function(storage, directory, index) {
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
			currentLocalArchiveInstance.readDataFiles(storage, directory,
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
		if (lo < hi-1 ) {
			var mid = Math.round((lo+hi)/2);
			// TODO : improve the way we read this file : 128 bytes is arbitrary and might be too small
			var blob = this.titleFile.slice(mid,mid+128);
			var currentLocalArchiveInstance = this;
			reader.onload = function(e) {
				var binaryTitleFile = e.target.result;
				var byteArray = new Uint8Array(binaryTitleFile);
				// Look for the index of the next NewLine
				var newLineIndex = 0;	
				while (newLineIndex<byteArray.length && byteArray[newLineIndex]!=10) {
					newLineIndex++;
				}
				var startIndex = 0;
				if (mid >0 ){
					startIndex = newLineIndex + 16;
					newLineIndex = startIndex;
					// Look for the index of the next NewLine	
					while (newLineIndex<byteArray.length && byteArray[newLineIndex]!=10) {
						newLineIndex++;
					}					
				}
				if (newLineIndex == startIndex) {
					// End of file reached
					hi = mid;
				}
				else {
					var normalizedTitle = remove_diacritics.normalizeString(utf8ByteArrayToString(byteArray,startIndex,newLineIndex));
					if (normalizedTitle < normalizedPrefix) {
						lo = mid + newLineIndex -1;
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
                lo++;lo++;
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
			while (i<byteArray.length && titleNumber<titleCount) {
				// Look for the index of the next NewLine
				newLineIndex+=15;
				while (newLineIndex<byteArray.length && byteArray[newLineIndex]!=10) {
					newLineIndex++;
				}
				
				// Copy the encodedTitle in a new Array
				var encodedTitle = new Uint8Array(newLineIndex-i);
				for (var j = 0; j < newLineIndex-i; j++) {
					encodedTitle[j] = byteArray[i+j];
				}

				var title = Title.parseTitle(encodedTitle, currentLocalArchiveInstance, i);
				
				titleList[titleNumber] = title;
				titleNumber++;
				i=newLineIndex+1;
			}
			callbackFunction(titleList);
		};
		var blob = this.titleFile.slice(titleOffset);
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
		var normalizedTitleName = remove_diacritics.normalizeString(titleName);
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
			prefix = remove_diacritics.normalizeString(prefix);
		}

		var reader = new FileReader();
		reader.onerror = errorHandler;
		reader.onabort = function(e) {
			alert('Title file read cancelled');
		};
		var currentLocalArchiveInstance = this;
		var normalizedPrefix = remove_diacritics.normalizeString(prefix);
		this.recursivePrefixSearch(reader, normalizedPrefix, 0, titleFileSize, function(titleOffset) {
			currentLocalArchiveInstance.getTitlesStartingAtOffset(titleOffset, 50, function(titleList){
				// Keep only the titles with names starting with the prefix
				var i = 0;
				for (i=0; i<titleList.length;i++) {
					var titleName = titleList[i].name;
					var normalizedTitleName = remove_diacritics.normalizeString(titleName);
					if (normalizedTitleName.length<normalizedPrefix.length || normalizedTitleName.substring(0,normalizedPrefix.length)!=normalizedPrefix) {
						break;
					}
				}
				callbackFunction(titleList.slice(0,i));
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
		for ( var i = 0; i < this.dataFiles.length; i++) {
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
					htmlArticles = bzip2.simple(bzip2.array(new Uint8Array(
							compressedArticles)));
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
			
			if (byteArray.length==0) {
				throw "Unable to find redirected article : offset "+title.blockStart+" not found in title file";
			}

			var redirectedTitle = title;
			redirectedTitle.fileNr = byteArray[2];
			redirectedTitle.blockStart = readIntegerFrom4Bytes(byteArray,3);
			redirectedTitle.blockOffset = readIntegerFrom4Bytes(byteArray,7);
			redirectedTitle.articleLength = readIntegerFrom4Bytes(byteArray,11);

			callbackFunction(redirectedTitle);
		};
		// Read only the 16 necessary bytes, starting at title.blockStart
		var blob = this.titleFile.slice(title.blockStart,title.blockStart+16);
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
				if (!endsWith(fileName,"titles.idx")) {
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
	};
	
	Title.prototype.getReadableName = function() {
		return this.name.replace("_"," ");
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

		// TODO : handle escapes
		/*
		int escapes = LittleEndianReader.readUInt16(encodedTitle, 0);
		byte[] positionData = new byte[13];
		System.arraycopy(encodedTitle, 2, positionData, 0, 13);

		if ((escapes & (1 << 14)) != 0)
		    escapes |= '\n';

		for (int i = 0; i < 13; i ++) {
		    if ((escapes & (1 << i)) != 0)
		        positionData[i] = '\n';
		}
		 */

		t.fileNr = encodedTitle[2];
		t.blockStart = readIntegerFrom4Bytes(encodedTitle, 3);
		t.blockOffset = readIntegerFrom4Bytes(encodedTitle, 7);
		t.articleLength = readIntegerFrom4Bytes(encodedTitle, 11);

		t.name = Title.parseNameOnly(encodedTitle);

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
		return utf8ByteArrayToString(encodedTitle, 15, len);
	};
	
	/**
	 * Creates a title instance from a serialized id
	 */
	Title.parseTitleId = function(localArchive, titleId) {
			var title = new Title();
			var idParts = titleId.split("|");
			title.archive = localArchive;
			title.fileNr = parseInt(idParts[2],10);
			title.titleOffset = parseInt(idParts[3],10);
			title.name = idParts[4];
			title.blockStart = parseInt(idParts[5],10);
			title.blockOffset = parseInt(idParts[6],10);
			title.articleLength = parseInt(idParts[7],10);
			return title;
	};
	
	
	/**
	 * Serialize the title with its values
	 * @returns {String}
	 */
	Title.prototype.toStringId = function(){
		return this.archive.language + "|" + this.archive.date + "|" + this.fileNr + "|"
			+ this.titleOffset + "|" + this.name + "|" + this.blockStart + "|" + this.blockOffset + "|" + this.articleLength ;
	};
	
	/**
	 * Serialize the title in a readable way
	 */
	Title.prototype.toString = function(){
		return "title.id = " + this.toStringId() + "title.name = " + this.name + " title.fileNr = " + this.fileNr + " title.blockStart = " + this.blockStart + " title.blockOffset = " + this.blockOffset + " title.articleLength = " + this.articleLength;
	};
	
	/**
	 * ErrorHandler for FileReader
	 */
	function errorHandler(evt) {
		switch(evt.target.error.code) {
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
    	readIntegerFrom4Bytes: readIntegerFrom4Bytes,
        utf8ByteArrayToString : utf8ByteArrayToString,
    	LocalArchive : LocalArchive,
    	Title : Title
    };
});
