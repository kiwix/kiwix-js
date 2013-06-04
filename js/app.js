
// This uses require.js to structure javascript:
// http://requirejs.org/docs/api.html#define

define(function(require) {
    // Zepto provides nice js and DOM methods (very similar to jQuery,
    // and a lot smaller):
    // http://zeptojs.com/
    var $ = require('zepto');

    // Evopedia javascript dependencies
    var evopedia = require('evopedia');


    var localArchive = null;

    // Define behavior of HTML elements
    $('#about').hide();
    $('#showHideAbout').on('click', function(e) {
    	$('#about').toggle();
    });
    $('#searchTitles').on('click', function(e) {
    	searchTitlesFromPrefix($('#prefix').val());
    });
    $('#readData').on('click', function(e) {
    	var titleId = $('#titleList').val();
    	findTitleFromTitleIdAndLaunchArticleRead(titleId);
    	var title = evopedia.Title.parseTitleId(localArchive,titleId); 
    	pushBrowserHistoryState(title.name);
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
    	// If DeviceStorage is available, we look for archives in it
    	$('#scanningForArchives').show();
    	evopedia.LocalArchive.scanForArchives(storage,populateDropDownListOfArchives);
    }
    else {
    	// If DeviceStorage is not available, we display the file select components
    	displayFileSelect();
    	setLocalArchiveFromFileSelect();
    }
    
    // Display the article when the user goes back in the browser history
    window.onpopstate = function(event) {
    	var titleName = event.state.titleName;
    	goToArticle(titleName);
    };
    
	/**
	 * Populate the drop-down list of titles with the given list
	 */
	function populateDropDownListOfArchives(archiveDirectories) {
		$('#scanningForArchives').hide();
		$('#chooseArchiveFromLocalStorage').show();
		var comboArchiveList = document.getElementById('archiveList');
		comboArchiveList.options.length = 0;
		for (var i=0; i<archiveDirectories.length; i++) {
			var archiveDirectory = archiveDirectories[i];
			comboArchiveList.options[i] = new Option (archiveDirectory, archiveDirectory);
		}
		$('#archiveList').on('change', setLocalArchiveFromArchiveList);
		if (archiveDirectories.length>0) {
			// Set the localArchive from the first result
			setLocalArchiveFromArchiveList();
		}
		else {
			alert("No Evopedia archive found in your sdcard. Please see 'About' for more info");
		} 
	}
    
    /**
     * Sets the localArchive from the selected archive in the drop-down list
     */
    function setLocalArchiveFromArchiveList() {
    	var archiveDirectory = $('#archiveList').val();
    	localArchive = new evopedia.LocalArchive();
    	localArchive.readTitleFile(storage, archiveDirectory);
    	localArchive.readDataFiles(storage, archiveDirectory, 0);
    }

    /**
	 * Displays the zone to select files from the dump
	 */
	function displayFileSelect() {
		$('#openLocalFiles').show();
		$('#dataFiles').on('change', setLocalArchiveFromFileSelect);
		$('#titleFile').on('change', setLocalArchiveFromFileSelect);
	}

	/**
	 * Sets the localArchive from the File selects populated by user
	 */
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
			localArchive.findTitlesWithPrefix(prefix.trim(), populateDropDownListOfTitles);
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
		if (localArchive.dataFiles && localArchive.dataFiles.length>0) {
			var title = evopedia.Title.parseTitleId(localArchive,titleId);
			$("#articleContent").html("Loading from dump article " + title.name + " ...");
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
				return;
			}
		}
		localArchive.readArticle(title, displayArticleInForm);
	}

	/**
	 * Display the the given HTML article in the web page,
	 * and convert links to javascript calls
	 */
	function displayArticleInForm(title, htmlArticle) {
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
			else if (url.substring(0,2) === ".." || url.substring(0,4) === "./..") {
				// It's a link to another language : TODO redirect to the online article?
			}
			else {
				// It's a link to another article : add an onclick event to go to this article
				// instead of following the link
				$(this).on('click', function(e) {
					var titleName = decodeURIComponent($(this).attr("href"));
					pushBrowserHistoryState(titleName);
					goToArticle(titleName);
					return false;
				});
			}
		});
	}
	
	/**
	 * Changes the URL of the browser page
	 */
	function pushBrowserHistoryState(titleName) {
		if (titleName) {
			var stateObj = { titleName: titleName};
			window.history.pushState(stateObj,"Wikipedia Article : " + titleName,"#" + titleName);
		}
	}


	/**
	 * Replace article content with the one of the given title
	 */
	function goToArticle(titleName) {
		$("#articleContent").html("Loading from dump article " + titleName + " ...");
		localArchive.getTitleByName(titleName, readArticle);
	}

});
