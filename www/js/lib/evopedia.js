define(function(require) {
	
	// Module dependencies
	var remove_diacritics = require('remove_diacritics');
	var bzip2 = require('bzip2');
	
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
	 * This function is recursively called after each asynchronous read,
	 * so that to find the closest index in titleFile to the given prefix
	 * When found, call the callbackFunction with the index
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
					// Enf of file reached
					hi = mid;
				}
				else {
					var normalizedTitle = remove_diacritics.normalizeString(utf8ByteArrayToString(byteArray,startIndex,newLineIndex));
					//alert("normalizedTitle = " + normalizedTitle + "lo = "+lo+" hi="+hi);
					//alert("normalizedPrefix = " + normalizedPrefix);
					if (normalizedTitle.localeCompare(normalizedPrefix) < 0) {
						lo = mid;
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
			// Look for the index of the next NewLine
			var newLineIndex=0;	
			while (newLineIndex<byteArray.length && byteArray[newLineIndex]!=10) {
				newLineIndex++;
			}
			var i = newLineIndex;
			var titleNumber = -1;
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
				
				// Skip the titles that do not start with the prefix
				// TODO use a normalizer to compare the strings
				// TODO see why we need to skip the first title
				//if (title && title.getReadableName().toLowerCase().indexOf(prefix.toLowerCase())==0) {
				if (titleNumber>=0) {
					titleList[titleNumber] = title;
				}
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
		var normalizedPrefix = remove_diacritics.normalizeString(prefix).replace(" ","_");
		this.recursivePrefixSearch(reader, normalizedPrefix, 0, titleFileSize, function(titleOffset) {
			currentLocalArchiveInstance.getTitlesStartingAtOffset(titleOffset, 50, callbackFunction);
		});
	};
	
	/**
	 * Read an article from the title instance, and call the callbackFunction with the article HTML String
	 * @param title
	 * @param callbackFunction
	 */
	LocalArchive.prototype.readArticle = function(title, callbackFunction) {
		var dataFile = null;

		var prefixedFileNumber = "";
		if (title.fileNr<10) {
			prefixedFileNumber = "0" + title.fileNr;
		}
		else {
			prefixedFileNumber = title.fileNr;
		}
		var expectedFileName = "wikipedia_"+prefixedFileNumber+".dat";

		// Find the good dump file
		for (var i=0; i<this.dataFiles.length; i++) {
			var fileName = this.dataFiles[i].name;
			// Check if the fileName ends with the expected file name (in case of DeviceStorage usage, the fileName is prefixed by the directory)
			if (fileName.match(expectedFileName+"$") == expectedFileName) {
				dataFile = this.dataFiles[i];
			}
		}
		if (!dataFile) {
			throw "File number " + title.fileNr + " not found";
		}
		else {
			var reader = new FileReader();
			reader.onerror = errorHandler;
			reader.onabort = function(e) {
				alert('Data file read cancelled');
			};
			reader.onload = function(e) {
				var compressedArticles = e.target.result;
				//var htmlArticle = ArchUtils.bz2.decode(compressedArticles);
				// TODO : should be improved by uncompressing the content chunk by chunk,
				// until the length is reached, instead of uncompressing everything
				var htmlArticles = bzip2.simple(bzip2.array(new Uint8Array(compressedArticles)));
				// Start reading at offset, and keep length characters
				var htmlArticle = htmlArticles.substring(title.blockOffset,title.blockOffset + title.articleLength);
				// Keep only length characters
				htmlArticle = htmlArticle.substring(0,title.articleLength);
				// Decode UTF-8 encoding
				htmlArticle = decodeURIComponent(escape(htmlArticle));

				callbackFunction (htmlArticle);
			};

			// TODO : should be improved by reading the file chunks by chunks until the article is found,
			// instead of reading the whole file starting at blockstart
			var blob = dataFile.slice(title.blockStart);

			// Read in the image file as a binary string.
			reader.readAsArrayBuffer(blob);
		}

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

			var redirectedTitle = title;
			redirectedTitle.fileNr = byteArray[2];
			redirectedTitle.blockStart = readIntegerFrom4Bytes(byteArray,3);
			redirectedTitle.blockOffset = readIntegerFrom4Bytes(byteArray,7);
			redirectedTitle.articleLength = readIntegerFrom4Bytes(byteArray,11);

			callbackFunction(redirectedTitle);
		};
		// Read only the 16 necessary bytes, starting at title.blockStart
		var blob = titleFile.slice(title.blockStart,title.blockStart+16);
		// Read in the file as a binary string
		reader.readAsArrayBuffer(blob);
	};
	
	
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
			title.fileNr = idParts[2];
			title.titleOffset = idParts[3];
			title.name = idParts[4];
			title.blockStart = idParts[5];
			title.blockOffset = idParts[6];
			title.articleLength = idParts[7];
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