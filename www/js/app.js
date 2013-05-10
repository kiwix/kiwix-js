
// This uses require.js to structure javascript:
// http://requirejs.org/docs/api.html#define

define(function(require) {
    // Zepto provides nice js and DOM methods (very similar to jQuery,
    // and a lot smaller):
    // http://zeptojs.com/
    var $ = require('zepto');

    // Need to verify receipts? This library is included by default.
    // https://github.com/mozilla/receiptverifier
    require('receiptverifier');

    // Want to install the app locally? This library hooks up the
    // installation button. See <button class="install-btn"> in
    // index.html
    require('./install-button');

    // Evopedia javascript dependencies
    var evopedia = require('evopedia');


    var localArchive = null;

    // Define behavior of HTML elements
    $('#searchTitles').on('click', function(e) {
    	searchTitlesFromPrefix($('#prefix').val());
    });
    $('#toggleDebug').on('click', function(e) {
    	switchDebugOnOff();
    });
    $('#readData').on('click', function(e) {
    	findTitleFromTitleIdAndLaunchArticleRead($('#titleList').val());
    });
    $('#prefix').on('keyup', function(e) {
    	onKeyUpPrefix(e);
    });


    // Detect if DeviceStorage is available
    var storage = null;
    if ($.isFunction(navigator.getDeviceStorage)) {
    	storage = navigator.getDeviceStorage('sdcard');
    }
    
    if (storage != null) {
    	var directory = 'wikipedia_small_2010-08-14';
    	//var directory = 'evopedia/wikipedia_fr_2012-02-03';
    	localArchive = new evopedia.LocalArchive();
    	localArchive.readTitleFile(storage, directory);
    	localArchive.readDataFiles(storage, directory, 0);
    }
    else {
    	displayFileSelect();
    	setLocalArchiveFromFileSelect();
    }

    /**
	 * Displays the zone to select files from the dump
	 */
	function displayFileSelect() {
		$('#openLocalFiles').show();
		$('#dataFiles').on('change', setLocalArchiveFromFileSelect);
		$('#titleFile').on('change', setLocalArchiveFromFileSelect);
	}

	var debugOn = false;

	/**
	 * Print the given string inside the debug zone
	 * 
	 * @param string
	 */
	function debug(string) {
		if (debugOn) {
			document.getElementById("debugTextarea").value += string + "\n";
		}
	}

	/**
	 * Switch debug mode On/Off
	 */
	function switchDebugOnOff() {
		if (debugOn == true) {
			debugOn = false;
			$('#debugZone').hide();
		} else {
			debugOn = true;
			$('#debugZone').show();
		}
	}

	function setLocalArchiveFromFileSelect() {
		dataFiles=document.getElementById('dataFiles').files;
		titleFile=document.getElementById('titleFile').files[0];
		localArchive = new evopedia.LocalArchive();
		localArchive.dataFiles = dataFiles;
		localArchive.titleFile = titleFile;
	}

	/**
	 * Handle Enter key in the prefix input zone
	 */
	function onKeyUpPrefix(evt) {
		if (evt.keyCode == 13) {
			document.getElementById("searchTitles").click();
		}
	}


	
	/**
	 * Search the index for titles that start with the given prefix (implemented
	 * with a binary search inside the index file)
	 */
	function searchTitlesFromPrefix(prefix) {
		if (localArchive.titleFile) {
			localArchive.findTitlesWithPrefix(prefix, populateDropDownListOfTitles);
		} else {
			alert("Title file not set");
		}
	}

	/**
	 * Populate the drop-down list of titles with the given list
	 */
	function populateDropDownListOfTitles(titleList) {
		var comboTitleList = document.getElementById('titleList');
		// Remove previous results
		comboTitleList.options.length = 0;
		for (var i=0; i<titleList.length; i++) {
			var title = titleList[i];
			comboTitleList.options[i] = new Option (title.name, title.toStringId());
		}
	}


	/**
	 * Creates an instance of title from given titleId (including resolving redirects),
	 * and call the function to read the corresponding article
	 */
	function findTitleFromTitleIdAndLaunchArticleRead(titleId) {
		$("#articleContent").html("Loading article from dump...");
		if (localArchive.dataFiles && localArchive.dataFiles.length>0) {
			var title = evopedia.Title.parseTitleId(localArchive,titleId);
			if (title.fileNr == 255) {
				localArchive.resolveRedirect(title, readArticle);
			}
			else {
				readArticle(title);
			}
		}
		else {
			alert("Data files not set");
		}
	}

	/**
	 * Read the article corresponding to the given title
	 */
	function readArticle(title) {
		if ($.isArray(title)) {
			title = title[0];
			if (title.fileNr == 255) {
				localArchive.resolveRedirect(title, readArticle);
			}
		}
		else {
			localArchive.readArticle(title, displayArticleInForm);
		}
	}

	/**
	 * Display the the given HTML article in the web page,
	 * and convert links to javascript calls
	 */
	function displayArticleInForm(htmlArticle) {
		// Display the article inside the web page.		
		$('#articleContent').html(htmlArticle);
		
		// Convert links into javascript calls
		$('#articleContent').find('a').each(function(){
			// Store current link's url
			var url = $(this).attr("href");
			
			if(url.slice(0, 1) == "#") {
				// It's an anchor link : do nothing
			}
			else if (url.substring(0,4) === "http") {
				// It's an external link : do nothing
			}
			else {
				// It's a link to another article : add an onclick event to go to this article
				// instead of following the link
				$(this).on('click', function(e) {
					goToArticle($(this).attr("href"));
					return false;
				});
			}
		});
	}


	/**
	 * Replace article content with the one of the given title
	 */
	function goToArticle(title) {
		$("#articleContent").html("Loading article from dump...");
		localArchive.getTitleByName(title, readArticle);
	}

});

