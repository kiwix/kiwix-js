/**
 * app.js : User Interface implementation
 * This file handles the interaction between the application and the user
 * 
 * Copyright 2013-2014 Mossroy and contributors
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

// This uses require.js to structure javascript:
// http://requirejs.org/docs/api.html#define

define(function(require) {
    
    var $ = require('jquery');

    // Evopedia javascript dependencies
    var evopediaTitle = require('title');
    var evopediaArchive = require('archive');
    var util = require('util');
    var cookies = require('cookies');
    var geometry = require('geometry');
    var osabstraction = require('osabstraction');
    
    // Maximum number of titles to display in a search
    var MAX_SEARCH_RESULT_SIZE = 50;

    // Maximum distance (in degrees) where to search for articles around me
    // In fact, we use a square around the user, not a circle
    // This square has a length of twice the value of this constant
    // One degree is ~111 km at the equator
    var DEFAULT_MAX_DISTANCE_ARTICLES_NEARBY = 0.01;

    var localArchive = null;
    
    // This max distance has a default value, but the user can make it change
    var maxDistanceArticlesNearbySearch = DEFAULT_MAX_DISTANCE_ARTICLES_NEARBY;
    
    var currentCoordinates = null;
    
    // Define behavior of HTML elements
    $('#searchTitles').on('click', function(e) {
        pushBrowserHistoryState(null, $('#prefix').val());
        searchTitlesFromPrefix($('#prefix').val());
        $("#welcomeText").hide();
        $("#readingArticle").hide();
        $('#geolocationProgress').hide();
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
    });
    $('#formTitleSearch').on('submit', function(e) {
        document.getElementById("searchTitles").click();
        return false;
    });
    $('#prefix').on('keyup', function(e) {
        if (localArchive !== null && localArchive._titleFile !== null) {
            onKeyUpPrefix(e);
            $('#geolocationProgress').hide();
        }
    });
    $("#btnArticlesNearby").on("click", function(e) {
        if (localArchive._coordinateFiles !== null && localArchive._coordinateFiles.length > 0) {
            $('#prefix').val("");
            searchTitlesNearby();
            $("#welcomeText").hide();
            $("#readingArticle").hide();
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
        }
        else {
            alert("There is no coordinate file in this archive. This feature is only available on archives that have coordinate files (coordinates_xx.idx)");
        }
    });
    $("#btnEnlargeMaxDistance").on("click", function(e) {
        maxDistanceArticlesNearbySearch = maxDistanceArticlesNearbySearch * 2 ;
        searchTitlesNearbyGivenCoordinates(currentCoordinates.y, currentCoordinates.x, maxDistanceArticlesNearbySearch);
        $("#welcomeText").hide();
        $("#readingArticle").hide();
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
    });
    $("#btnReduceMaxDistance").on("click", function(e) {
        maxDistanceArticlesNearbySearch = maxDistanceArticlesNearbySearch / 2 ;
        searchTitlesNearbyGivenCoordinates(currentCoordinates.y, currentCoordinates.x, maxDistanceArticlesNearbySearch);
        $("#welcomeText").hide();
        $("#readingArticle").hide();
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
    });
    $("#btnRandomArticle").on("click", function(e) {
        $('#prefix').val("");
        goToRandomArticle();
        $("#welcomeText").hide();
        $('#titleList').hide();
        $('#titleListHeaderMessage').hide();
        $('#suggestEnlargeMaxDistance').hide();
        $('#suggestReduceMaxDistance').hide();
        $("#readingArticle").hide();
        $('#geolocationProgress').hide();
        $('#searchingForTitles').hide();
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
    });
    
    $('#btnRescanDeviceStorage').on("click", function(e) {
        searchForArchivesInStorage();
    });
    // Bottom bar :
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
        $("#welcomeText").show();
        $('#titleList').show();
        $('#titleListHeaderMessage').show();
        $('#articleContent').show();
        // Give the focus to the search field, and clean up the page contents
        $("#prefix").val("");
        $('#prefix').focus();
        $("#titleList").empty();
        $('#titleListHeaderMessage').empty();
        $('#suggestEnlargeMaxDistance').hide();
        $('#suggestReduceMaxDistance').hide();
        $("#readingArticle").hide();
        $('#geolocationProgress').hide();
        $("#articleContent").empty();
        $('#searchingForTitles').hide();
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
        $("#welcomeText").hide();
        $('#titleList').hide();
        $('#titleListHeaderMessage').hide();
        $('#suggestEnlargeMaxDistance').hide();
        $('#suggestReduceMaxDistance').hide();
        $("#readingArticle").hide();
        $('#geolocationProgress').hide();
        $('#articleContent').hide();
        $('#searchingForTitles').hide();
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
        $("#welcomeText").hide();
        $('#titleList').hide();
        $('#titleListHeaderMessage').hide();
        $('#suggestEnlargeMaxDistance').hide();
        $('#suggestReduceMaxDistance').hide();
        $("#readingArticle").hide();
        $('#geolocationProgress').hide();
        $('#articleContent').hide();
        $('#searchingForTitles').hide();
        return false;
    });
    
    // Detect if DeviceStorage is available
    var storages = [];
    function searchForArchivesInPreferencesOrStorage() {
        // First see if the list of archives is stored in the cookie
        var listOfArchivesFromCookie = cookies.getItem("listOfArchives");
        if (listOfArchivesFromCookie !== null && listOfArchivesFromCookie !== undefined && listOfArchivesFromCookie !== "") {
            var directories = listOfArchivesFromCookie.split('|');
            populateDropDownListOfArchives(directories);
        }
        else {
            searchForArchivesInStorage();
        }
    }
    function searchForArchivesInStorage() {
        // If DeviceStorage is available, we look for archives in it
        $("#btnConfigure").click();
        $('#scanningForArchives').show();
        evopediaArchive.LocalArchive.scanForArchives(storages, populateDropDownListOfArchives);
    }

    if ($.isFunction(navigator.getDeviceStorages)) {
        // The method getDeviceStorages is available (FxOS>=1.1)
        storages = $.map(navigator.getDeviceStorages("sdcard"), function(s) {
            return new osabstraction.StorageFirefoxOS(s);
        });
    } else if ($.isFunction(window.requestFileSystem)) {
        // The requestFileSystem is available (Cordova)
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {
            storages[0] = new osabstraction.StoragePhoneGap(fs);
            searchForArchivesInPreferencesOrStorage();
        });
    }

    if (storages !== null && storages.length > 0) {
        // Make a fake first access to device storage, in order to ask the user for confirmation if necessary.
        // This way, it is only done once at this moment, instead of being done several times in callbacks
        // After that, we can start looking for archives
        storages[0].get("fake-file-to-read").always(searchForArchivesInPreferencesOrStorage);
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
            var titleSearch = event.state.titleSearch;
            var latitude = event.state.latitude;
            var longitude = event.state.longitude;
            var maxDistance = event.state.maxDistance;
            
            $('#prefix').val("");
            $("#welcomeText").hide();
            $("#readingArticle").hide();
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
            $('#searchingForTitles').hide();
            $('#configuration').hide();
            $('#titleList').hide();
            $('#titleListHeaderMessage').hide();
            $('#suggestEnlargeMaxDistance').hide();
            $('#suggestReduceMaxDistance').hide();
            $('#articleContent').empty();
            
            if (titleName && !(""===titleName)) {
                goToArticle(titleName);
            }
            else if (titleSearch && !(""===titleSearch)) {
                $('#prefix').val(titleSearch);
                searchTitlesFromPrefix($('#prefix').val());
            }
            else if (latitude && !(""===latitude)) {
                maxDistanceArticlesNearbySearch = maxDistance;
                searchTitlesNearbyGivenCoordinates(latitude, longitude, maxDistance);
            }
        }
    };
    
    /**
     * Looks for titles located around the given coordinates, with give maximum distance
     * @param {type} latitude
     * @param {type} longitude
     * @param {type} maxDistance
     */
    function searchTitlesNearbyGivenCoordinates(latitude, longitude, maxDistance) {
        var rectangle = new geometry.rect(
                longitude - maxDistance,
                latitude - maxDistance,
                maxDistance * 2,
                maxDistance * 2);

        localArchive.getTitlesInCoords(rectangle, MAX_SEARCH_RESULT_SIZE, populateListOfTitles);
    }
    
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
            if (archiveDirectory === "/") {
                alert("It looks like you have put some archive files at the root of your sdcard. Please move them in a subdirectory");
            }
            else {
                comboArchiveList.options[i] = new Option(archiveDirectory, archiveDirectory);
            }
        }
        // Store the list of archives in a cookie, to avoid rescanning at each start
        cookies.setItem("listOfArchives", archiveDirectories.join('|'), Infinity);
        
        $('#archiveList').on('change', setLocalArchiveFromArchiveList);
        if (comboArchiveList.options.length > 0) {
            var lastSelectedArchive = cookies.getItem("lastSelectedArchive");
            if (lastSelectedArchive !== null && lastSelectedArchive !== undefined && lastSelectedArchive !== "") {
                // Attempt to select the corresponding item in the list, if it exists
                if ($("#archiveList option[value='"+lastSelectedArchive+"']").length > 0) {
                    $("#archiveList").val(lastSelectedArchive);
                }
            }
            // Set the localArchive as the last selected (or the first one if it has never been selected)
            setLocalArchiveFromArchiveList();
        }
        else {
            alert("Welcome to Evopedia! This application needs a wikipedia archive in your SD-card. Please download one and put it on the SD-card (see About section). Also check that your device is not connected to a computer through USB device storage (which locks the SD-card content)");
            $("#btnAbout").click();
        }
    }

    /**
     * Sets the localArchive from the selected archive in the drop-down list
     */
    function setLocalArchiveFromArchiveList() {
        var archiveDirectory = $('#archiveList').val();
        localArchive = new evopediaArchive.LocalArchive();
        localArchive.initializeFromDeviceStorage(storages, archiveDirectory);
        cookies.setItem("lastSelectedArchive", archiveDirectory, Infinity);
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
        if (localArchive !== null && localArchive._titleFile !== null) {
            localArchive.findTitlesWithPrefix(prefix.trim(), MAX_SEARCH_RESULT_SIZE, populateListOfTitles);
        } else {
            $('#searchingForTitles').hide();
            // We have to remove the focus from the search field,
            // so that the keyboard does not stay above the message
            $("#searchTitles").focus();
            alert("Archive not set : please select an archive");
            $("#btnConfigure").click();
        }
    }

  
    /**
     * Display the list of titles with the given array of titles
     * @param {type} titleArray
     * @param maxTitles
     * @param isNearbySearchSuggestions : it set to true, allow suggestions to
     *  reduce or enlarge the distance where to look for articles nearby
     */
    function populateListOfTitles(titleArray, maxTitles, isNearbySearchSuggestions) {
        var currentLatitude;
        var currentLongitude;
        if (currentCoordinates) {
            currentLatitude = currentCoordinates.y;
            currentLongitude = currentCoordinates.x;
        }
        
        var titleListHeaderMessageDiv = $('#titleListHeaderMessage');
        var nbTitles = 0;
        if (titleArray) {
            nbTitles = titleArray.length;
        }

        var message;
        if (maxTitles >= 0 && nbTitles >= maxTitles) {
            message = maxTitles + " first titles below (refine your search).";
        }
        else {
            message = nbTitles + " titles found.";
        }
        if (nbTitles === 0) {
            message = "No titles found.";
        }
              
        titleListHeaderMessageDiv.html(message);
        
        // In case of nearby search, and too few or too many results,
        // suggest the user to change the max Distance
        if (isNearbySearchSuggestions && nbTitles <= maxTitles * 0.8) {
            $('#suggestEnlargeMaxDistance').show();
        }
        if (isNearbySearchSuggestions && maxTitles >=0 && nbTitles >= maxTitles) {
            $('#suggestReduceMaxDistance').show();
        }

        var titleListDiv = $('#titleList');
        var titleListDivHtml = "";
        for (var i = 0; i < titleArray.length; i++) {
            var title = titleArray[i];
            
            var distanceFromHereHtml = "";
            if (title._geolocation && currentCoordinates) {
                // If we know the current position and the title position, we display the distance and cardinal direction
                var distanceKm = (currentCoordinates.distance(title._geolocation) * 6371 * Math.PI / 180).toFixed(1);
                var cardinalDirection = currentCoordinates.bearing(title._geolocation);
                distanceFromHereHtml = " (" + distanceKm + " km " + cardinalDirection + ")";
            }
            
            titleListDivHtml += "<a href='#' titleid='" + title.toStringId()
                    + "' class='list-group-item'>" + title.getReadableName()
                    + distanceFromHereHtml 
                    + "</a>";
        }
        titleListDiv.html(titleListDivHtml);
        $("#titleList a").on("click",handleTitleClick);
        $('#searchingForTitles').hide();
        $('#geolocationProgress').hide();
        $('#titleList').show();
        $('#titleListHeaderMessage').show();
    }
    
    
    /**
     * Checks if the small archive is in use
     * If it is, display a warning message about the hyperlinks not working
     */
    function checkSmallArchive() {
        if (localArchive.language === "small" && !cookies.hasItem("warnedSmallArchive")) {
            // The user selected the "small" archive, which is quite incomplete
            // So let's display a warning to the user
            
            // If the focus is on the search field, we have to move it,
            // else the keyboard hides the message
            if ($("#prefix").is(":focus")) {
                $("searchTitles").focus();
            }
            alert("You selected the 'small' archive. This archive is OK for testing, but be aware that very few hyperlinks in the articles will work because it's only a very small subset of the English dump.");
            // We will not display this warning again for one day
            cookies.setItem("warnedSmallArchive", true, 86400);
        }
    }
    
    
    /**
     * Handles the click on a title
     * @param {type} event
     * @returns {undefined}
     */
    function handleTitleClick(event) {
        // If we use the small archive, a warning should be displayed to the user
        checkSmallArchive();
        
        var titleId = event.target.getAttribute("titleId");
        $("#titleList").empty();
        $('#titleListHeaderMessage').empty();
        $('#suggestEnlargeMaxDistance').hide();
        $('#suggestReduceMaxDistance').hide();
        findTitleFromTitleIdAndLaunchArticleRead(titleId);
        var title = evopediaTitle.Title.parseTitleId(localArchive, titleId);
        pushBrowserHistoryState(title._name);
        $("#prefix").val("");
        return false;
    }


    /**
     * Creates an instance of title from given titleId (including resolving redirects),
     * and call the function to read the corresponding article
     * @param {type} titleId
     */
    function findTitleFromTitleIdAndLaunchArticleRead(titleId) {
        if (localArchive._dataFiles && localArchive._dataFiles.length > 0) {
            var title = evopediaTitle.Title.parseTitleId(localArchive, titleId);
            $("#articleName").html(title._name);
            $("#readingArticle").show();
            $("#articleContent").html("");
            if (title._fileNr === 255) {
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
        if (title._fileNr === 255) {
            localArchive.resolveRedirect(title, readArticle);
        }
        else {
            localArchive.readArticle(title, displayArticleInForm);
        }
    }

    /**
     * Display the the given HTML article in the web page,
     * and convert links to javascript calls
     * NB : in some error cases, the given title can be null, and the htmlArticle contains the error message
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
            if (url === null || url === undefined) {
                return;
            }
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
     * Changes the URL of the browser page, so that the user might go back to it
     * 
     * @param {type} titleName
     * @param {type} titleSearch
     * @param {type} latitude
     * @param {type} longitude
     * @param {type} maxDistance
     * @returns {undefined}
     */
    function pushBrowserHistoryState(titleName, titleSearch, latitude, longitude, maxDistance) {
        var stateObj = {};
        var urlParameters;
        var stateLabel;
        if (titleName && !(""===titleName)) {
            stateObj.titleName = titleName;
            urlParameters = "?title=" + titleName;
            stateLabel = "Wikipedia Article : " + titleName;
        }
        else if (titleSearch && !(""===titleSearch)) {
            stateObj.titleSearch = titleSearch;
            urlParameters = "?titleSearch=" + titleSearch;
            stateLabel = "Wikipedia search : " + titleSearch;
        }
        else if (latitude) {
            stateObj.latitude = latitude;
            stateObj.longitude = longitude;
            stateObj.maxDistance = maxDistance;
            urlParameters = "?latitude=" + latitude
                + "&longitude=" + longitude;
                + "&maxDistance=" + maxDistance;
            stateLabel = "Wikipedia nearby search around lat=" + latitude +" ,long=" + longitude;
        }
        else {
            return;
        }
        window.history.pushState(stateObj, stateLabel, urlParameters);
    }


    /**
     * Replace article content with the one of the given title
     * @param {type} titleName
     * @returns {undefined}
     */
    function goToArticle(titleName) {
        localArchive.getTitleByName(titleName, function(title) {
            if (title === null || title === undefined) {
                $("#readingArticle").hide();
                alert("Article with title " + titleName + " not found in the archive");
            }
            else {
                $("#articleName").html(titleName);
                $("#readingArticle").show();
                $("#articleContent").html("");
                readArticle(title);
            }
        });
    }
    
    /**
     * Looks for titles located around where the device is geolocated
     */
    function searchTitlesNearby() {
        $('#searchingForTitles').show();
        $('#configuration').hide();
        $('#titleList').hide();
        $('#titleListHeaderMessage').hide();
        $('#suggestEnlargeMaxDistance').hide();
        $('#suggestReduceMaxDistance').hide();
        $('#articleContent').empty();
        if (localArchive !== null && localArchive._titleFile !== null) {
            if (navigator.geolocation) {
                var geo_options = {
                    enableHighAccuracy: false,
                    maximumAge: 600000, // 10 minutes
                    timeout: Infinity 
                };

                function geo_success(pos) {
                    var crd = pos.coords;

                    if ($('#geolocationProgress').is(":visible")) {
                        $('#geolocationProgress').prop("step","SearchInTitleIndex");
                        $('#geolocationProgress').html("Found your location : lat:" + crd.latitude.toFixed(7) + ", long:" + crd.longitude.toFixed(7)
                                + "<br/>Now looking for articles around this location...");
                        
                        currentCoordinates = new geometry.point(crd.longitude, crd.latitude);
                        
                        pushBrowserHistoryState(null, null, crd.latitude, crd.longitude, maxDistanceArticlesNearbySearch);

                        searchTitlesNearbyGivenCoordinates(crd.latitude, crd.longitude, maxDistanceArticlesNearbySearch);
                    }
                    else {
                        // If the geolocationProgress div is not visible, it's because it has been canceled
                        // So we simply ignore the result
                    }
                };

                function geo_error(err) {
                    if ($('#geolocationProgress').is(":visible")) {
                        alert("Unable to geolocate your device : " + err.code + " : " + err.message);
                        $('#geolocationProgress').hide();
                        $('#searchingForTitles').hide();
                    }
                    else {
                        // If the geolocationProgress div is not visible, it's because it has been canceled
                        // So we simply ignore the result
                    }
                };

                $('#geolocationProgress').html("Trying to find your location...");
                // This property helps the code to know in which step we currently are
                $('#geolocationProgress').prop("step","Geolocate");
                $('#geolocationProgress').show();
                navigator.geolocation.getCurrentPosition(geo_success, geo_error, geo_options);
                
                // Give some feedback to the user of the geolocation takes some time
                setTimeout(function(){
                    if ($('#geolocationProgress').is(":visible") && $('#geolocationProgress').prop("step") === "Geolocate") {
                        $('#geolocationProgress').html("Still trying to find your location... Depending on your device, this might take some time");
                        setTimeout(function(){
                            if ($('#geolocationProgress').is(":visible") && $('#geolocationProgress').prop("step") === "Geolocate") {
                                $('#geolocationProgress').html("Still trying to find your location... On some devices, there might be a prompt for confirmation on the screen. Please confirm to allow geolocation of your device.");
                                setTimeout(function() {
                                    if ($('#geolocationProgress').is(":visible") && $('#geolocationProgress').prop("step") === "Geolocate") {
                                        $('#geolocationProgress').html("Still trying to find your location... If you don't want to wait, you might try to type the name of a famous location around you.");
                                    }
                                }, 10000);
                            }
                        },10000);
                    }
                },5000);
            }
            else {
                alert("Geolocation is not supported (or disabled) on your device, or on your browser");
                $('#searchingForTitles').hide();
            }

        } else {
            $('#searchingForTitles').hide();
            // We have to remove the focus from the search field,
            // so that the keyboard does not stay above the message
            $("#searchTitles").focus();
            alert("Archive not set : please select an archive");
            $("#btnConfigure").click();
        }
    }

    function goToRandomArticle() {
        localArchive.getRandomTitle(function(title) {
            if (title === null || title === undefined) {
                alert("Error finding random article.");
            }
            else {
                $("#articleName").html(title._name);
                pushBrowserHistoryState(title._name);
                $("#readingArticle").show();
                $("#articleContent").html("");
                readArticle(title);
            }
        });
    }

});
