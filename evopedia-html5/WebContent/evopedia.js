
var file=document.getElementById('files').files[0];

var storage = navigator.getDeviceStorage('music');
//alert(storage);

if (!storage) {
	//alert("no device storage available");
	document.getElementById('openLocalFiles').style.visibility="visible";
	document.getElementById('files').addEventListener('change', handleFileSelect, false);
	document.getElementById('files').addEventListener('load', handleFileSelect, false);
}
else {
	var filerequest = storage.get('wikipedia_small_2010-08-14/wikipedia_00.dat');
	//alert(filerequest);
	filerequest.onsuccess = function() {
		file = filerequest.result;
		//alert(file);
		//readArticleFromHtmlForm(file);
	};
	filerequest.onerror = function() {
		alert("error reading file");
	};
}

function readArticleFromHtmlForm(file) {
	if (file) {
		var blockstart = document.getElementById('blockstart').value;
		var blockoffset = document.getElementById('blockoffset').value;
		var length = document.getElementById('length').value;
		readArticleFromOffset(file, blockstart, blockoffset, length);
	}
	else {
		alert("File not set");
	}
}

function readArticleFromOffset(file, blockstart, blockoffset, length) {

	var reader = new FileReader();
	reader.onerror = errorHandler;
	reader.onabort = function(e) {
		alert('File read cancelled');
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
	var blob = file.slice(blockstart);

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

function handleFileSelect(evt) {
	file = evt.target.files[0];
}
