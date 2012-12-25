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

var storage = navigator.getDeviceStorage('music');
//alert(storage);

if (!storage) {
	//alert("no device storage available");
	document.getElementById('openLocalFiles').style.visibility="visible";
	document.getElementById('dataFiles').addEventListener('change', handleDataFileSelect, false);
	document.getElementById('titleFile').addEventListener('change', handleTitleFileSelect, false);
}
else {
	var filerequest = storage.get('wikipedia_small_2010-08-14/wikipedia_00.dat');
	//alert(filerequest);
	filerequest.onsuccess = function() {
		dataFiles[0] = filerequest.result;
		//alert(dataFiles);
		filerequest = storage.get('wikipedia_small_2010-08-14/titles.idx');
		filerequest.onsuccess = function() {
			titleFile = filerequest.result;
			//alert(titleFile);
			//readArticleFromHtmlForm(file);
		};
		filerequest.onerror = function() {
			alert("error reading title file");
		};
	};
	filerequest.onerror = function() {
		alert("error reading data file");
	};
}

function updateOffsetsFromTitle(selectValue) {
	var offsets=selectValue.split(/\|/);
	document.getElementById("filenumber").value=offsets[0];
	document.getElementById("blockstart").value=offsets[1];
	document.getElementById("blockoffset").value=offsets[2];
	document.getElementById("length").value=offsets[3];
}

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

function readAllTitlesFromIndex(titleFile) {
	if (titleFile) {
		var reader = new FileReader();
		reader.onerror = errorHandler;
		reader.onabort = function(e) {
			alert('Title file read cancelled');
		};
		reader.onload = function(e) {
			var binaryTitleFile = e.target.result;
			var byteArray = new Uint8Array(binaryTitleFile);
			
			var i = 0;
			var titleNumber=0;
			var comboTitleList = document.getElementById('titleList');

			while (i<byteArray.length) {
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
	
				while (newLineIndex<byteArray.length && byteArray[newLineIndex]!=128) {
					newLineIndex++;
				}

				title = utf8ByteArrayToString(byteArray,i+15,newLineIndex);

				if (title) {
					comboTitleList.options[titleNumber] = new Option (title, filenumber+"|"+blockstart+"|"+blockoffset+"|"+length);
				}
				titleNumber++;
				i=newLineIndex-1;
			}
		};
		
		var blob = titleFile;

		// Read in the image file as a binary string
		reader.readAsArrayBuffer(blob);
	}
	else {
		alert('Title file not set');
	}
}

function readArticleFromHtmlForm(dataFiles) {
	if (dataFiles && dataFiles.length>0) {
		var filenumber = document.getElementById('filenumber').value;
		var blockstart = document.getElementById('blockstart').value;
		var blockoffset = document.getElementById('blockoffset').value;
		var length = document.getElementById('length').value;
		var dataFile;
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
			if (filenumber==255) {
				// TODO : handle redirects (filenumber==255)
				alert("Redirects not implemented yet");
			}
			else {
				alert("File number " + filenumber + " not found");
			}
		}		
		readArticleFromOffset(dataFile, blockstart, blockoffset, length);
	}
	else {
		alert("Data files not set");
	}
}

function readArticleFromOffset(dataFile, blockstart, blockoffset, length) {

	var reader = new FileReader();
	reader.onerror = errorHandler;
	reader.onabort = function(e) {
		alert('Data file read cancelled');
	};
	reader.onload = function(e) {
		var compressedArticles = e.target.result;
		//var htmlArticle = compressedArticles;
		//alert(typeof compressedArticles);
		//var htmlArticle = ArchUtils.bz2.decode(compressedArticles);
		// TODO : should be improved by uncompressing the content chunk by chunk,
		// until the length is reached, instead of uncompressing everything
		var htmlArticles = bzip2.simple(bzip2.array(new Uint8Array(compressedArticles)));
		// Start reading at offset, and keep 2*length bytes (maximum size in bytes for length characters)
		var htmlArticle = htmlArticles.substring(blockoffset,blockoffset+length);
		
		// Keep only length characters
		htmlArticle = htmlArticle.substring(0,length);
		// Decode UTF-8 encoding
		htmlArticle = decodeURIComponent(escape(htmlArticle));

		document.getElementById('articleContent').innerHTML = htmlArticle;
		// For testing purpose
		//document.getElementById('rawArticleContent').innerHTML = htmlArticle.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
		//document.getElementById('rawArticleContent').value = decodeURIComponent(escape(htmlArticles));
	};

	//var blob = file;
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
