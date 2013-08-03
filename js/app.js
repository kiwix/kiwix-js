
// This uses require.js to structure javascript:
// http://requirejs.org/docs/api.html#define

define(function(require) {

    var $ = require('jquery');

    // Evopedia javascript dependencies
    var evopediaTitle = require('title');
    var evopediaArchive = require('archive');
    var util = require('util');


    var localArchive = null;

    // Define behavior of HTML elements
    $('#searchTitles').on('click', function(e) {
        searchTitlesFromPrefix($('#prefix').val());
    });
    $('#formTitleSearch').on('submit', function(e) {
        document.getElementById("searchTitles").click();
        return false;
    });
    $('#prefix').on('keyup', function(e) {
        onKeyUpPrefix(e);
    });
    // Bottome bar :
    $('#btnBack').on('click', function(e) {
        history.back();
        return false;
    });
    $('#btnForward').on('click', function(e) {
        history.forward();
        return false;
    });
    $('#btnHomeBottom').on('click', function(e) {
        $('#btnHome').click();
        return false;
    });
    // Top menu :
    $('#btnHome').on('click', function(e) {
        // Highlight the selected section in the navbar
        $('#liHomeNav').attr("class","active");
        $('#liConfigureNav').attr("class","");
        $('#liAboutNav').attr("class","");
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
        // Show the selected content in the page
        $('#about').hide();
        $('#configuration').hide();
        $('#formTitleSearch').show();
        $('#titleList').show();
        $('#articleContent').show();
        // Give the focus to the search field, and clean up the page contents
        $("#prefix").val("");
        $('#prefix').focus();
        $("#titleList").html("");
        $("#articleContent").html("");
        return false;
    });
    $('#btnConfigure').on('click', function(e) {
        // Highlight the selected section in the navbar
        $('#liHomeNav').attr("class","");
        $('#liConfigureNav').attr("class","active");
        $('#liAboutNav').attr("class","");
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
        // Show the selected content in the page
        $('#about').hide();
        $('#configuration').show();
        $('#formTitleSearch').hide();
        $('#titleList').hide();
        $('#articleContent').hide();
        return false;
    });
    $('#btnAbout').on('click', function(e) {
        // Highlight the selected section in the navbar
        $('#liHomeNav').attr("class","");
        $('#liConfigureNav').attr("class","");
        $('#liAboutNav').attr("class","active");
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
        // Show the selected content in the page
        $('#about').show();
        $('#configuration').hide();
        $('#formTitleSearch').hide();
        $('#titleList').hide();
        $('#articleContent').hide();
        return false;
    });
    

    // Detect if DeviceStorage is available
    var storage = null;
    if ($.isFunction(navigator.getDeviceStorage)) {
        storage = navigator.getDeviceStorage('sdcard');
    }

    if (storage !== null) {
        // If DeviceStorage is available, we look for archives in it
        $("#btnConfigure").click();
        $('#scanningForArchives').show();
        evopediaArchive.LocalArchive.scanForArchives(storage, populateDropDownListOfArchives);
    }
    else {
        // If DeviceStorage is not available, we display the file select components
        displayFileSelect();
        if (document.getElementById('archiveFiles').files && document.getElementById('archiveFiles').files.length>0) {
            // Archive files are already selected, 
            setLocalArchiveFromFileSelect();
        }
        else {
            $("#btnConfigure").click();
        }
    }
    

    // Display the article when the user goes back in the browser history
    window.onpopstate = function(event) {
        if (event.state) {
            var titleName = event.state.titleName;
            goToArticle(titleName);
        }
    };
    
    /**
     * Populate the drop-down list of titles with the given list
     * @param {type} archiveDirectories
     */
    function populateDropDownListOfArchives(archiveDirectories) {
        $('#scanningForArchives').hide();
        $('#chooseArchiveFromLocalStorage').show();
        var comboArchiveList = document.getElementById('archiveList');
        comboArchiveList.options.length = 0;
        for (var i = 0; i < archiveDirectories.length; i++) {
            var archiveDirectory = archiveDirectories[i];
            comboArchiveList.options[i] = new Option(archiveDirectory, archiveDirectory);
        }
        $('#archiveList').on('change', setLocalArchiveFromArchiveList);
        if (archiveDirectories.length > 0) {
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
        localArchive = new evopediaArchive.LocalArchive();
        localArchive.initializeFromDeviceStorage(storage, archiveDirectory);
        // The archive is set : go back to home page to start searching
        $("#btnHome").click();
    }

    /**
     * Displays the zone to select files from the archive
     */
    function displayFileSelect() {
        $('#openLocalFiles').show();
        $('#archiveFiles').on('change', setLocalArchiveFromFileSelect);
    }

    /**
     * Sets the localArchive from the File selects populated by user
     */
    function setLocalArchiveFromFileSelect() {
        localArchive = new evopediaArchive.LocalArchive();
        localArchive.initializeFromArchiveFiles(document.getElementById('archiveFiles').files);
        // The archive is set : go back to home page to start searching
        $("#btnHome").click();
    }

    /**
     * Handle key input in the prefix input zone
     * @param {type} evt
     * @returns {undefined}
     */
    function onKeyUpPrefix(evt) {
        // Use a timeout, so that very quick typing does not cause a lot of overhead
        // It is also necessary for the words suggestions to work inside Firefox OS
        if(window.timeoutKeyUpPrefix) {
            window.clearTimeout(window.timeoutKeyUpPrefix);
        }
        window.timeoutKeyUpPrefix = window.setTimeout(function() {
            var prefix = $("#prefix").val();
            if (prefix && prefix.length>0) {
                $('#searchTitles').click();
            }
        }
        ,500);
    }


    /**
     * Search the index for titles that start with the given prefix (implemented
     * with a binary search inside the index file)
     * @param {type} prefix
     */
    function searchTitlesFromPrefix(prefix) {
        $('#searchingForTitles').show();
        $('#configuration').hide();
        $('#articleContent').empty();
        if (localArchive.titleFile) {
            localArchive.findTitlesWithPrefix(prefix.trim(), populateListOfTitles);
        } else {
            alert("Title file not set");
        }
    }

  
    /**
     * Display the list of titles with the given array of titles
     * @param {type} titleArray
     */
    function populateListOfTitles(titleArray) {
        var titleListUl = $('#titleList');
        // Remove previous results
        titleListUl.empty();
        for (var i = 0; i < titleArray.length; i++) {
            var title = titleArray[i];
            var titleLi = document.createElement('li');
            var titleA = document.createElement('a');
            titleA.setAttribute("titleId", title.toStringId());
            titleA.setAttribute("href", "#");
            $(titleA).append(title.name);
            $(titleA).on("click",handleTitleClick);
            $(titleLi).append(titleA);
            titleListUl.append(titleLi);
        }
        $('#searchingForTitles').hide();
    }
    
    
    /**
     * Handles the click on a title
     * @param {type} event
     * @returns {undefined}
     */
    function handleTitleClick(event) {
        var titleId = event.target.getAttribute("titleId");
        $("#titleList").empty();
        findTitleFromTitleIdAndLaunchArticleRead(titleId);
        var title = evopediaTitle.Title.parseTitleId(localArchive, titleId);
        pushBrowserHistoryState(title.name);
        $("#prefix").val("");
        return false;
    }


    /**
     * Creates an instance of title from given titleId (including resolving redirects),
     * and call the function to read the corresponding article
     * @param {type} titleId
     */
    function findTitleFromTitleIdAndLaunchArticleRead(titleId) {
        if (localArchive.dataFiles && localArchive.dataFiles.length > 0) {
            var title = evopediaTitle.Title.parseTitleId(localArchive, titleId);
            $("#articleName").html(title.name);
            $("#readingArticle").show();
            $("#articleContent").html("");
            if (title.fileNr === 255) {
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
     * @param {type} title
     */
    function readArticle(title) {
        if ($.isArray(title)) {
            title = title[0];
            if (title.fileNr === 255) {
                localArchive.resolveRedirect(title, readArticle);
                return;
            }
        }
            localArchive.readArticle(title, displayArticleInForm);
        }

    /**
     * Display the the given HTML article in the web page,
     * and convert links to javascript calls
     * @param {type} title
     * @param {type} htmlArticle
     */
    function displayArticleInForm(title, htmlArticle) {
        $("#readingArticle").hide();

        // Display the article inside the web page.		
        $('#articleContent').html(htmlArticle);

        // Compile the regular expressions needed to modify links
        var regexOtherLanguage = /^\.?\/?\.\.\/([^\/]+)\/(.*)/;
        var regexImageLink = /^.?\/?[^:]+:(.*)/;
        
        // Convert links into javascript calls
        $('#articleContent').find('a').each(function() {
            // Store current link's url
            var url = $(this).attr("href");
            var lowerCaseUrl = url.toLowerCase();
            var cssClass = $(this).attr("class");

            if (cssClass === "new") {
                // It's a link to a missing article : display a message
                $(this).on('click', function(e) {
                    alert("Missing article in Wikipedia");
                    return false;
                });
            }
            else if (url.slice(0, 1) === "#") {
                // It's an anchor link : do nothing
            }
            else if (url.substring(0, 4) === "http") {
                // It's an external link : open in a new tab
                $(this).attr("target", "_blank");
            }
            else if (url.match(regexOtherLanguage)) {
                // It's a link to another language : change the URL to the online version of wikipedia
                // The regular expression extracts $1 as the language, and $2 as the title name
                var onlineWikipediaUrl = url.replace(regexOtherLanguage, "https://$1.wikipedia.org/wiki/$2");
                $(this).attr("href", onlineWikipediaUrl);
                // Open in a new tab
                $(this).attr("target", "_blank");
            }
            else if (url.match(regexImageLink)
                && (util.endsWith(lowerCaseUrl, ".png")
                    || util.endsWith(lowerCaseUrl, ".svg")
                    || util.endsWith(lowerCaseUrl, ".jpg")
                    || util.endsWith(lowerCaseUrl, ".jpeg"))) {
                // It's a link to a file of wikipedia : change the URL to the online version and open in a new tab
                var onlineWikipediaUrl = url.replace(regexImageLink, "https://"+localArchive.language+".wikipedia.org/wiki/File:$1");
                $(this).attr("href", onlineWikipediaUrl);
                $(this).attr("target", "_blank");
            }
            else {
                // It's a link to another article : add an onclick event to go to this article
                // instead of following the link
                if (url.length>=2 && url.substring(0, 2) === "./") {
                    url = url.substring(2);
                }
                $(this).on('click', function(e) {
                    var titleName = decodeURIComponent(url);
                    pushBrowserHistoryState(titleName);
                    goToArticle(titleName);
                    return false;
                });
            }
        });

        // Load math images
        $('#articleContent').find('img').each(function() {
            var image = $(this);
            var m = image.attr("src").match(/^\/math.*\/([0-9a-f]{32})\.png$/);
            if (m) {
                localArchive.loadMathImage(m[1], function(data) {
                    image.attr("src", 'data:image/png;base64,' + data);
                });
            }
        });
    }

    /**
     * Changes the URL of the browser page
     * @param {type} titleName
     */
    function pushBrowserHistoryState(titleName) {
        if (titleName) {
            var stateObj = {titleName: titleName};
            window.history.pushState(stateObj, "Wikipedia Article : " + titleName, "?title=" + titleName);
        }
    }


    /**
     * Replace article content with the one of the given title
     * @param {type} titleName
     * @returns {undefined}
     */
    function goToArticle(titleName) {
        $("#articleName").html(titleName);
        $("#readingArticle").show();
        $("#articleContent").html("");
        localArchive.getTitleByName(titleName, readArticle);
    }

});
