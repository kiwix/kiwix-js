/*
Port of Evopedia (offline wikipedia reader) in HTML5/Javascript, with Firefox OS as the primary target
The original application is at http://www.evopedia.info/
It uses wikipedia dumps located at http://dumpathome.evopedia.info/dumps/finished

Author : Mossroy - mossroy@free.fr

License:

    This program is free software; you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by the
    Free Software Foundation; either version 3 of the License, or (at your
    option) any later version.

    This program is distributed in the hope that it will be useful, but
    WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
    General Public License for more details.

    You should have received a copy of the GNU General Public
    License along with this program; if not, see
    <http://www.gnu.org/licenses/>.

 */

var dataFiles=document.getElementById('dataFiles').files;
var titleFile=document.getElementById('titleFile').files[0];

if (!navigator.getDeviceStorage || !navigator.getDeviceStorage('music')) {
	document.getElementById('openLocalFiles').style.display="block";
	document.getElementById('dataFiles').addEventListener('change', handleDataFileSelect, false);
	document.getElementById('titleFile').addEventListener('change', handleTitleFileSelect, false);
}
else {
	var storage = navigator.getDeviceStorage('music');
	var filerequest = storage.get('wikipedia_small_2010-08-14/wikipedia_00.dat');
	filerequest.onsuccess = function() {
		dataFiles = [ filerequest.result ];
		filerequest = storage.get('wikipedia_small_2010-08-14/titles.idx');
		filerequest.onsuccess = function() {
			titleFile = filerequest.result;
		};
		filerequest.onerror = function() {
			alert("error reading title file");
		};
	};
	filerequest.onerror = function() {
		alert("error reading data file");
	};
}

var debugOn = false;

/**
 * Print the given string inside the debug zone
 * @param string
 */
function debug(string) {
	if (debugOn) {
		document.getElementById("debugTextarea").value+=string+"\n";
	}
}

/**
 * Switch debug mode On/Off
 */
function switchDebugOnOff() {
	if (debugOn == true) {
		debugOn = false;
		document.getElementById("debugZone").style.display="none";
	}
	else {
		debugOn = true;
		document.getElementById("debugZone").style.display="block";
	}
}

/**
 * Set the Offsets HTML fields from the selected title
 */
function updateOffsetsFromTitle(selectValue) {
	var offsets=selectValue.split(/\|/);
	document.getElementById("filenumber").value=offsets[0];
	document.getElementById("blockstart").value=offsets[1];
	document.getElementById("blockoffset").value=offsets[2];
	document.getElementById("length").value=offsets[3];
	if (offsets[0]==255) {
		// It's a redirect : find out the real offsets (asynchronous read)
		readRedirectOffsets(titleFile,offsets[1]);
	}
	else {
		document.getElementById('redirectfilenumber').value = "";
		document.getElementById('redirectblockstart').value = "";
		document.getElementById('redirectblockoffset').value = "";
		document.getElementById('redirectlength').value = "";
	}
}

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
};

/**
 * This function is recursively called after each asynchronous read,
 * so that to find the closest index in titleFile to the given prefix
 */
function recursivePrefixSearch(titleFile, reader, prefix, lo, hi) {
	if (lo < hi-1 ) {
		var mid = Math.round((lo+hi)/2);
		// TODO : improve the way we read this file : 256 bytes is arbitrary and might be too small
		var blob = titleFile.slice(mid,mid+256);
		reader.onload = function(e) {
			var binaryTitleFile = e.target.result;
			var byteArray = new Uint8Array(binaryTitleFile);
			// Look for the index of the next NewLine
			var newLineIndex=0;	
			while (newLineIndex<byteArray.length && byteArray[newLineIndex]!=128) {
				newLineIndex++;
			}
			var i = newLineIndex-1;
			newLineIndex = i+15;
			// Look for the index of the next NewLine	
			while (newLineIndex<byteArray.length && byteArray[newLineIndex]!=128) {
				newLineIndex++;
			}
			var title = utf8ByteArrayToString(byteArray,i+15,newLineIndex);
			debug("title found : "+title);
			if (title.localeCompare(prefix)<0) {
				lo = mid;
			}
			else {
				hi = mid;
			}
			recursivePrefixSearch(titleFile, reader, prefix, lo, hi);
		};
		debug("Reading the file from "+mid+" to "+(mid+256)+" because lo="+lo+" and hi="+hi);			
		// Read the file as a binary string
		reader.readAsArrayBuffer(blob);		
	}
	else {
		// We found the closest title
		debug ("Found the closest title near index "+lo);
		readTitlesBeginningAtIndexStartingWithPrefix(titleFile,prefix,lo);
	}
}

/**
 * Search the index for titles that start with the given prefix
 * (implemented with a binary search inside the index file)
 */
function searchTitlesFromPrefix(titleFile, prefix) {
	if (titleFile) {
		var titleFileSize = titleFile.size;
		prefix = normalizeString(prefix);

		var reader = new FileReader();
		reader.onerror = errorHandler;
		reader.onabort = function(e) {
			alert('Title file read cancelled');
		};
		recursivePrefixSearch(titleFile, reader, prefix, 0, titleFileSize);
	}
	else {
		alert ("Title file not set");
	}
}

/**
 * Read the real offsets when a redirect was found, based on the redirectIndex provided
 * The file read is asynchronous, and populates the html form as soon as the offsets are found
 * @param titleFile
 * @param redirectIndex
 */
function readRedirectOffsets(titleFile,redirectIndex) {
	var reader = new FileReader();
	reader.onerror = errorHandler;
	reader.onabort = function(e) {
		alert('Title file read cancelled');
	};
	reader.onload = function(e) {
		var binaryTitleFile = e.target.result;
		var byteArray = new Uint8Array(binaryTitleFile);
		var filenumber = byteArray[2];

		var blockstart = readIntegerFrom4Bytes(byteArray,3);
		var blockoffset = readIntegerFrom4Bytes(byteArray,7);
		var length = readIntegerFrom4Bytes(byteArray,11);

		document.getElementById('redirectfilenumber').value = filenumber;
		document.getElementById('redirectblockstart').value = blockstart;
		document.getElementById('redirectblockoffset').value = blockoffset;
		document.getElementById('redirectlength').value = length;
	};
	// Read only the 16 necessary bytes
	var blob = titleFile.slice(redirectIndex,redirectIndex+16);
	// Read in the file as a binary string
	reader.readAsArrayBuffer(blob);
}

/**
 * Read the titles following the given index in the title file, until one of the following conditions is reached :
 * - the title does not start with the prefix anymore
 * - we already read the maximum number of titles
 * and populate the dropdown list
 */
function readTitlesBeginningAtIndexStartingWithPrefix(titleFile,prefix,startIndex) {
	var reader = new FileReader();
	reader.onerror = errorHandler;
	reader.onabort = function(e) {
		alert('Title file read cancelled');
	};
	reader.onload = function(e) {
		var binaryTitleFile = e.target.result;
		var byteArray = new Uint8Array(binaryTitleFile);
		// Look for the index of the next NewLine
		var newLineIndex=0;	
		while (newLineIndex<byteArray.length && byteArray[newLineIndex]!=128) {
			newLineIndex++;
		}
		var i = newLineIndex;
		var titleNumber=-1;
		var comboTitleList = document.getElementById('titleList');
		while (i<byteArray.length && titleNumber<50) {
			var filenumber = 0;
			var blockstart = 0;
			var blockoffset = 0;
			var length = 0;
			var title = "";

			// TODO : interpret escape area
			var escape1 = byteArray[i];
			var escape2 = byteArray[i+1];
			filenumber = byteArray[i+2];

			blockstart = readIntegerFrom4Bytes(byteArray,i+3);
			blockoffset = readIntegerFrom4Bytes(byteArray,i+7);
			length = readIntegerFrom4Bytes(byteArray,i+11);
			var newLineIndex = i+15;

			// Look for the index of the next NewLine	
			while (newLineIndex<byteArray.length && byteArray[newLineIndex]!=128) {
				newLineIndex++;
			}
			title = utf8ByteArrayToString(byteArray,i+15,newLineIndex);
			// Skip the first title
			if (titleNumber>=0 && title) {
				debug("Found title : escape1="+escape1+" escape2="+escape2+" filenumber="+filenumber+" blockstart="+blockstart+" blockoffset="+blockoffset+" length="+length+" title="+title);
				// TODO : check if the title starts with prefix, and return if it does not
				comboTitleList.options[titleNumber] = new Option (title, filenumber+"|"+blockstart+"|"+blockoffset+"|"+length);
			}
			titleNumber++;
			i=newLineIndex-1;
		}
		// Run onchange on the combo, so that to read the value of the selected item (first one)
		comboTitleList.onchange();
	};
	var blob = titleFile.slice(startIndex);
	// Read in the file as a binary string
	reader.readAsArrayBuffer(blob);
}


/**
 * Decompress and read an article in dump files
 */
function readArticleFromHtmlForm(dataFiles) {
	document.getElementById("articleContent").innerHTML="Loading article from dump...";
	if (dataFiles && dataFiles.length>0) {
		var filenumber = document.getElementById('filenumber').value;
		var blockstart = document.getElementById('blockstart').value;
		var blockoffset = document.getElementById('blockoffset').value;
		var length = document.getElementById('length').value;
		if (filenumber==255) {
			// It's a redirect : use redirected offsets
			filenumber = document.getElementById('redirectfilenumber').value;
			blockstart = document.getElementById('redirectblockstart').value;
			blockoffset = document.getElementById('redirectblockoffset').value;
			length = document.getElementById('redirectlength').value;
			if (!filenumber || filenumber=="") {
				// TODO : better handle this case
				alert("Redirect offsets not read yet");
			}
		}
		var dataFile = null;
		// Find the good dump file
		for (var i=0; i<dataFiles.length; i++) {
			var fileName = dataFiles[i].name;
			var prefixedFileNumber = "";
			if (filenumber<10) {
				prefixedFileNumber = "0"+filenumber;
			}
			else {
				prefixedFileNumber = filenumber;
			}
			var expectedFileName = "wikipedia_"+prefixedFileNumber+".dat";
			if (expectedFileName == fileName) {
				dataFile = dataFiles[i];
			}
		}
		if (!dataFile) {
			alert("File number " + filenumber + " not found");
			document.getElementById("articleContent").innerHTML="";
		}
		else {
			readArticleFromOffset(dataFile, blockstart, blockoffset, length);
		}
	}
	else {
		alert("Data files not set");
	}
}

/**
 * Read an article in a dump file, based on given offsets
 */
function readArticleFromOffset(dataFile, blockstart, blockoffset, length) {

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
		var htmlArticle = htmlArticles.substring(blockoffset,blockoffset+length);
		// Keep only length characters
		htmlArticle = htmlArticle.substring(0,length);
		// Decode UTF-8 encoding
		htmlArticle = decodeURIComponent(escape(htmlArticle));

		document.getElementById('articleContent').innerHTML = htmlArticle;
	};

	// TODO : should be improved by reading the file chunks by chunks until the article is found,
	// instead of reading the whole file starting at blockstart
	var blob = dataFile.slice(blockstart);

	// Read in the image file as a binary string.
	reader.readAsArrayBuffer(blob);
}

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

function handleDataFileSelect(evt) {
	dataFiles = evt.target.files;
}

function handleTitleFileSelect(evt) {
	titleFile = evt.target.files[0];
}

/**
 * Handle Enter key in the prefix input zone
 */
function onKeyUpPrefix(evt) {
	if (evt.keyCode == 13) {
		document.getElementById("searchTitles").click();
	}
}
