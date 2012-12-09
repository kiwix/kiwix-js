
var dataFile=document.getElementById('dataFile').files[0];
var titleFile=document.getElementById('titleFile').files[0];

var storage = navigator.getDeviceStorage('music');
//alert(storage);

if (!storage) {
	//alert("no device storage available");
	document.getElementById('openLocalFiles').style.visibility="visible";
	document.getElementById('dataFile').addEventListener('change', handleDataFileSelect, false);
	document.getElementById('titleFile').addEventListener('change', handleTitleFileSelect, false);
}
else {
	var filerequest = storage.get('wikipedia_small_2010-08-14/wikipedia_00.dat');
	//alert(filerequest);
	filerequest.onsuccess = function() {
		dataFile = filerequest.result;
		//alert(dataFile);
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
	document.getElementById("blockstart").value=offsets[1];
	document.getElementById("blockoffset").value=offsets[2];
	document.getElementById("length").value=offsets[3];
}

function readIntegerFrom4Bytes(byteArray,firstIndex) {
	return byteArray[firstIndex] + byteArray[firstIndex+1]*256 + byteArray[firstIndex+2]*65536 + byteArray[firstIndex+3]*16777216; 
}

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
				/*
				var buf = new ArrayBuffer();
				var bufView = new Uint16Array(buf);
			    var j=0;
				while (byteArray[newLineIndex]!=128) {
					bufView[j] = byteArray[newLineIndex];
					j++
					newLineIndex++;
				}
				title = String.fromCharCode(bufView);
				*/
				while (newLineIndex<byteArray.length && byteArray[newLineIndex]!=128) {
					newLineIndex++;
				}
				for (var j=i+15;j<newLineIndex;j++) {
					title += String.fromCharCode(byteArray[j]);
				}
				
				comboTitleList.options[titleNumber] = new Option (title, filenumber+"|"+blockstart+"|"+blockoffset+"|"+length);
				titleNumber++;
				i=newLineIndex-1;
			}
		};
		
		var blob = titleFile;

		// Read in the image file as a binary string.
		reader.readAsArrayBuffer(blob);
	}
	else {
		alert('Title file not set');
	}
}

function readArticleFromHtmlForm(dataFile) {
	if (dataFile) {
		var blockstart = document.getElementById('blockstart').value;
		var blockoffset = document.getElementById('blockoffset').value;
		var length = document.getElementById('length').value;
		readArticleFromOffset(dataFile, blockstart, blockoffset, length);
	}
	else {
		alert("Data file not set");
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
		var htmlArticle = htmlArticles.substring(blockoffset,length);
		// Decode UTF-8 encoding
		htmlArticle = decodeURIComponent(escape(htmlArticle));

		document.getElementById('articleContent').innerHTML = htmlArticle;
		// For testing purpose
		document.getElementById('rawArticleContent').innerHTML = htmlArticle.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
	dataFile = evt.target.files[0];
}

function handleTitleFileSelect(evt) {
	titleFile = evt.target.files[0];
}
