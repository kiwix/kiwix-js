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

'use strict';

// This uses require.js to structure javascript:
// http://requirejs.org/docs/api.html#define

define(['jquery', 'abstractBackend', 'util', 'uiUtil', 'cookies','geometry','osabstraction'],
 function($, backend, util, uiUtil, cookies, geometry, osabstraction) {
     
    // Disable any eval() call in jQuery : it's disabled by CSP in any packaged application
    // It happens on some wiktionary archives, because there is some javascript inside the html article
    // Cf http://forum.jquery.com/topic/jquery-ajax-disable-script-eval
    jQuery.globalEval = function(code) {
        // jQuery believes the javascript has been executed, but we did nothing
        // In any case, that would have been blocked by CSP for package applications
        console.log("jQuery tried to run some javascript with eval(), which is not allowed in packaged applications");
    };
    
    /**
     * Maximum number of titles to display in a search
     * @type Integer
     */
    var MAX_SEARCH_RESULT_SIZE = 50;

    /**
     * Maximum distance (in degrees) where to search for articles around me
     * In fact, we use a square around the user, not a circle
     * This square has a length of twice the value of this constant
     * One degree is ~111 km at the equator
     * @type Float
     */
    var DEFAULT_MAX_DISTANCE_ARTICLES_NEARBY = 0.01;

    /**
     * @type LocalArchive|ZIMArchive
     */
    var selectedArchive = null;
    
    /**
     * This max distance has a default value, but the user can make it change
     * @type Number
     */
    var maxDistanceArticlesNearbySearch = DEFAULT_MAX_DISTANCE_ARTICLES_NEARBY;
    
    /**
     * @type point
     */
    var currentCoordinates = null;
    
    /**
     * Resize the IFrame height, so that it fills the whole available height in the window
     */
    function resizeIFrame() {
        var height = $(window).outerHeight()
                - $("#top").outerHeight(true)
                - $("#titleListWithHeader").outerHeight(true)
                // TODO : this 5 should be dynamically computed, and not hard-coded
                - 5;
        $(".articleIFrame").css("height", height + "px");
    }
    $(document).ready(resizeIFrame);
    $(window).resize(resizeIFrame);
    
    // Define behavior of HTML elements
    $('#searchTitles').on('click', function(e) {
        pushBrowserHistoryState(null, $('#prefix').val());
        searchTitlesFromPrefix($('#prefix').val());
        $("#welcomeText").hide();
        $("#readingArticle").hide();
        $("#articleContent").hide();
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
        if (selectedArchive !== null && selectedArchive.isReady()) {
            onKeyUpPrefix(e);
            $('#geolocationProgress').hide();
        }
    });
    $("#btnArticlesNearby").on("click", function(e) {
        if (selectedArchive.hasCoordinates()) {
            $('#prefix').val("");
            searchTitlesNearby();
            $("#welcomeText").hide();
            $("#readingArticle").hide();
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
        }
        else {
            alert("There are no usable coordinates in this archive. This feature is only available on deprecated Evopedia archives for now");
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
    $('#btnTop').on('click', function(e) {
        $("#articleContent").contents().scrollTop(0);
        // We return true, so that the link to #top is still triggered (useful in the About section)
        return true;
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
        $("#articleContent").hide();
        $('#geolocationProgress').hide();
        $("#articleContent").contents().empty();
        $('#searchingForTitles').hide();
        if (selectedArchive !== null && selectedArchive.isReady()) {
            $("#welcomeText").hide();
            goToMainArticle();
        }
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
        $("#articleContent").hide();
        $('#geolocationProgress').hide();
        $('#articleContent').hide();
        $('#searchingForTitles').hide();
        refreshAPIStatus();
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
        $("#articleContent").hide();
        $('#geolocationProgress').hide();
        $('#articleContent').hide();
        $('#searchingForTitles').hide();
        return false;
    });
    $('input:radio[name=contentInjectionMode]').on('change', function(e) {
        if (checkWarnServiceWorkerMode(this.value)) {
            // Do the necessary to enable or disable the Service Worker
            setContentInjectionMode(this.value);
            checkSelectedArchiveCompatibilityWithInjectionMode();
        }
        else {
            setContentInjectionMode('jquery');
        }
        
    });
    
    /**
     * Displays of refreshes the API status shown to the user
     */
    function refreshAPIStatus() {
        if (isMessageChannelAvailable()) {
            $('#messageChannelStatus').html("MessageChannel API available");
            $('#messageChannelStatus').removeClass("apiAvailable apiUnavailable")
                    .addClass("apiAvailable");
        } else {
            $('#messageChannelStatus').html("MessageChannel API unavailable");
            $('#messageChannelStatus').removeClass("apiAvailable apiUnavailable")
                    .addClass("apiUnavailable");
        }
        if (isServiceWorkerAvailable()) {
            if (isServiceWorkerReady()) {
                $('#serviceWorkerStatus').html("ServiceWorker API available, and registered");
                $('#serviceWorkerStatus').removeClass("apiAvailable apiUnavailable")
                        .addClass("apiAvailable");
            } else {
                $('#serviceWorkerStatus').html("ServiceWorker API available, but not registered");
                $('#serviceWorkerStatus').removeClass("apiAvailable apiUnavailable")
                        .addClass("apiUnavailable");
            }
        } else {
            $('#serviceWorkerStatus').html("ServiceWorker API unavailable");
            $('#serviceWorkerStatus').removeClass("apiAvailable apiUnavailable")
                    .addClass("apiUnavailable");
        }
    }
    
    var contentInjectionMode;
    
    /**
     * Sets the given injection mode.
     * This involves registering (or re-enabling) the Service Worker if necessary
     * It also refreshes the API status for the user afterwards.
     * 
     * @param {String} value The chosen content injection mode : 'jquery' or 'serviceworker'
     */
    function setContentInjectionMode(value) {
        if (value === 'jquery') {
            if (isServiceWorkerReady()) {
                // We need to disable the ServiceWorker
                // Unregistering it does not seem to work as expected : the ServiceWorker
                // is indeed unregistered but still active...
                // So we have to disable it manually (even if it's still registered and active)
                navigator.serviceWorker.controller.postMessage({'action': 'disable'});
                messageChannel = null;
            }
            refreshAPIStatus();
        } else if (value === 'serviceworker') {
            if (!isServiceWorkerAvailable()) {
                alert("The ServiceWorker API is not available on your device. Falling back to JQuery mode");
                setContentInjectionMode('jquery');
                return;
            }
            if (!isMessageChannelAvailable()) {
                alert("The MessageChannel API is not available on your device. Falling back to JQuery mode");
                setContentInjectionMode('jquery');
                return;
            }
            
            if (!messageChannel) {
                // Let's create the messageChannel for the 2-way communication
                // with the Service Worker
                messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = handleMessageChannelMessage;
            }
                    
            if (!isServiceWorkerReady()) {
                $('#serviceWorkerStatus').html("ServiceWorker API available : trying to register it...");
                navigator.serviceWorker.register('../service-worker.js').then(function (reg) {
                    console.log('serviceWorker registered', reg);
                    serviceWorkerRegistration = reg;
                    refreshAPIStatus();
                    
                    // We need to wait for the ServiceWorker to be activated
                    // before sending the first init message
                    var serviceWorker = reg.installing || reg.waiting || reg.active;
                    serviceWorker.addEventListener('statechange', function(statechangeevent) {
                        if (statechangeevent.target.state === 'activated') {
                            console.log("try to post an init message to ServiceWorker");
                            navigator.serviceWorker.controller.postMessage({'action': 'init'}, [messageChannel.port2]);
                            console.log("init message sent to ServiceWorker");
                        }
                    });
                }, function (err) {
                    console.error('error while registering serviceWorker', err);
                    refreshAPIStatus();
                });
            } else {
                console.log("try to re-post an init message to ServiceWorker, to re-enable it in case it was disabled");
                navigator.serviceWorker.controller.postMessage({'action': 'init'}, [messageChannel.port2]);
                console.log("init message sent to ServiceWorker");
            }
        }
        $('input:radio[name=contentInjectionMode]').prop('checked', false);
        $('input:radio[name=contentInjectionMode]').filter('[value="' + value + '"]').prop('checked', true);
        contentInjectionMode = value;
        // Save the value in a cookie, so that to be able to keep it after a reload/restart
        cookies.setItem('lastContentInjectionMode', value, Infinity);
    }
    
    /**
     * Checks if the archive selected by the user is compatible
     * with the injection mode, and warn the user if it's not
     * @returns {Boolean} true if they're compatible
     */
    function checkSelectedArchiveCompatibilityWithInjectionMode() {
        if (selectedArchive && selectedArchive.needsWikimediaCSS() && contentInjectionMode === 'serviceworker') {
            alert('You seem to want to use ServiceWorker mode for an Evopedia archive : this is not supported. Please use the JQuery mode or use a ZIM file');
            $("#btnConfigure").click();
            return false;
        }
        return true;
    }
    
    /**
     * If the ServiceWorker mode is selected, warn the user before activating it
     * @param chosenContentInjectionMode The mode that the user has chosen
     */
    function checkWarnServiceWorkerMode(chosenContentInjectionMode) {
        if (chosenContentInjectionMode === 'serviceworker' && !cookies.hasItem("warnedServiceWorkerMode")) {
            // The user selected the "serviceworker" mode, which is still unstable
            // So let's display a warning to the user

            // If the focus is on the search field, we have to move it,
            // else the keyboard hides the message
            if ($("#prefix").is(":focus")) {
                $("searchTitles").focus();
            }
            if (confirm("The 'Service Worker' mode is still UNSTABLE for now."
                + " It happens that the application needs to be reinstalled (or the ServiceWorker manually removed)."
                + " Please confirm with OK that you're ready to face this kind of bugs, or click Cancel to stay in 'jQuery' mode.")) {
                // We will not display this warning again for one day
                cookies.setItem("warnedServiceWorkerMode", true, 86400);
                return true;
            }
            else {
                return false;
            }
        }
        return true;
    }
    
    // At launch, we try to set the last content injection mode (stored in a cookie)
    var lastContentInjectionMode = cookies.getItem('lastContentInjectionMode');
    if (lastContentInjectionMode) {
        setContentInjectionMode(lastContentInjectionMode);
    }
    else {
        setContentInjectionMode('jquery');
    }
    
    var serviceWorkerRegistration = null;
    
    /**
     * Tells if the ServiceWorker API is available
     * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker
     * @returns {Boolean}
     */
    function isServiceWorkerAvailable() {
        return ('serviceWorker' in navigator);
    }
    
    /**
     * Tells if the MessageChannel API is available
     * https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel
     * @returns {Boolean}
     */
    function isMessageChannelAvailable() {
        try{
            var dummyMessageChannel = new MessageChannel();
            if (dummyMessageChannel) return true;
        }
        catch (e){
            return false;
        }
        return false;
    }
    
    /**
     * Tells if the ServiceWorker is registered, and ready to capture HTTP requests
     * and inject content in articles.
     * @returns {Boolean}
     */
    function isServiceWorkerReady() {
        // Return true if the serviceWorkerRegistration is not null and not undefined
        return (serviceWorkerRegistration);
    }
    
    /**
     * 
     * @type Array.<StorageFirefoxOS|StoragePhoneGap>
     */
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
        backend.scanForArchives(storages, populateDropDownListOfArchives);
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
        storages[0].get("fake-file-to-read").then(searchForArchivesInPreferencesOrStorage,
                                                  searchForArchivesInPreferencesOrStorage);
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
            $('#articleContent').contents().empty();
            
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
     * @param {Float} latitude
     * @param {Float} longitude
     * @param {Number} maxDistance
     */
    function searchTitlesNearbyGivenCoordinates(latitude, longitude, maxDistance) {
        var rectangle = new geometry.rect(
                longitude - maxDistance,
                latitude - maxDistance,
                maxDistance * 2,
                maxDistance * 2);

        selectedArchive.getTitlesInCoords(rectangle, MAX_SEARCH_RESULT_SIZE, populateListOfTitles);
    }
    
    /**
     * Populate the drop-down list of titles with the given list
     * @param {Array.<String>} archiveDirectories
     */
    function populateDropDownListOfArchives(archiveDirectories) {
        $('#scanningForArchives').hide();
        $('#chooseArchiveFromLocalStorage').show();
        var comboArchiveList = document.getElementById('archiveList');
        comboArchiveList.options.length = 0;
        for (var i = 0; i < archiveDirectories.length; i++) {
            var archiveDirectory = archiveDirectories[i];
            if (archiveDirectory === "/") {
                alert("It looks like you have put some archive files at the root of your sdcard (or internal storage). Please move them in a subdirectory");
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
            alert("Welcome to Kiwix! This application needs at least a ZIM file in your SD-card (or internal storage). Please download one and put it on the device (see About section). Also check that your device is not connected to a computer through USB device storage (which often locks the SD-card content)");
            $("#btnAbout").click();
            var isAndroid = (navigator.userAgent.indexOf("Android") !== -1);
            if (isAndroid) {
                alert("You seem to be using an Android device. Be aware that there is a bug on Firefox, that prevents finding wikipedia archives in a SD-card (at least on some devices. See about section). Please put the archive in the internal storage if the application can't find it.");
            }
        }
    }

    /**
     * Sets the localArchive from the selected archive in the drop-down list
     */
    function setLocalArchiveFromArchiveList() {
        var archiveDirectory = $('#archiveList').val();
        if (archiveDirectory && archiveDirectory.length > 0) {
            // Now, try to find which DeviceStorage has been selected by the user
            // It is the prefix of the archive directory
            var regexpStorageName = /^\/([^\/]+)\//;
            var regexpResults = regexpStorageName.exec(archiveDirectory);
            var selectedStorage = null;
            if (regexpResults && regexpResults.length>0) {
                var selectedStorageName = regexpResults[1];
                for (var i=0; i<storages.length; i++) {
                    var storage = storages[i];
                    if (selectedStorageName === storage.storageName) {
                        // We found the selected storage
                        selectedStorage = storage;
                    }
                }
                if (selectedStorage === null) {
                    alert("Unable to find which device storage corresponds to directory " + archiveDirectory);
                }
            }
            else {
                // This happens when the archiveDirectory is not prefixed by the name of the storage
                // (in the Simulator, or with FxOs 1.0, or probably on devices that only have one device storage)
                // In this case, we use the first storage of the list (there should be only one)
                if (storages.length === 1) {
                    selectedStorage = storages[0];
                }
                else {
                    alert("Something weird happened with the DeviceStorage API : found a directory without prefix : "
                        + archiveDirectory + ", but there were " + storages.length
                        + " storages found with getDeviceStorages instead of 1");
                }
            }
            selectedArchive = backend.loadArchiveFromDeviceStorage(selectedStorage, archiveDirectory, function (archive) {
                cookies.setItem("lastSelectedArchive", archiveDirectory, Infinity);
                if (checkSelectedArchiveCompatibilityWithInjectionMode()) {
                    // The archive is set : go back to home page to start searching
                    $("#btnHome").click();
                }
            });
            
        }
    }

    /**
     * Displays the zone to select files from the archive
     */
    function displayFileSelect() {
        $('#openLocalFiles').show();
        $('#archiveFiles').on('change', setLocalArchiveFromFileSelect);
    }

    function setLocalArchiveFromFileList(files) {
        selectedArchive = backend.loadArchiveFromFiles(files, function(archive){
            if (checkSelectedArchiveCompatibilityWithInjectionMode()) {
                // The archive is set : go back to home page to start searching
                $("#btnHome").click();
            }
        });
        
    }
    /**
     * Sets the localArchive from the File selects populated by user
     */
    function setLocalArchiveFromFileSelect() {
        setLocalArchiveFromFileList(document.getElementById('archiveFiles').files);
    }

    /**
     * This is used in the testing interface to inject a remote archive.
     */
    window.setRemoteArchive = function(url) {
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "blob";
        request.onload = function (e) {
            if (request.response) {
                // Hack to make this look similar to a file
                request.response.name = url;
                setLocalArchiveFromFileList([request.response]);
            }
        };
        request.send(null);
    };

    /**
     * Handle key input in the prefix input zone
     * @param {Event} evt
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
     * @param {String} prefix
     */
    function searchTitlesFromPrefix(prefix) {
        $('#searchingForTitles').show();
        $('#configuration').hide();
        $('#articleContent').contents().empty();
        if (selectedArchive !== null && selectedArchive.isReady()) {
            selectedArchive.findTitlesWithPrefix(prefix.trim(), MAX_SEARCH_RESULT_SIZE, populateListOfTitles);
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
     * @param {Array.<Title>} titleArray
     * @param {Integer} maxTitles
     * @param {Boolean} isNearbySearchSuggestions : it set to true, allow suggestions to
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
            
            titleListDivHtml += "<a href='#' titleid='" + title.toStringId().replace(/'/g,"&apos;")
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
        if (selectedArchive._language === "small" && !cookies.hasItem("warnedSmallArchive")) {
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
     * @param {Event} event
     * @returns {Boolean}
     */
    function handleTitleClick(event) {
        // If we use the small archive, a warning should be displayed to the user
        checkSmallArchive();
        
        var titleId = event.target.getAttribute("titleId");
        $("#titleList").empty();
        $('#titleListHeaderMessage').empty();
        $('#suggestEnlargeMaxDistance').hide();
        $('#suggestReduceMaxDistance').hide();
        $("#prefix").val("");
        findTitleFromTitleIdAndLaunchArticleRead(titleId);
        var title = selectedArchive.parseTitleId(titleId);
        pushBrowserHistoryState(title.name());
        return false;
    }
    

    /**
     * Creates an instance of title from given titleId (including resolving redirects),
     * and call the function to read the corresponding article
     * @param {String} titleId
     */
    function findTitleFromTitleIdAndLaunchArticleRead(titleId) {
        if (selectedArchive.isReady()) {
            var title = selectedArchive.parseTitleId(titleId);
            $("#articleName").html(title.name());
            $("#readingArticle").show();
            $("#articleContent").contents().html("");
            if (title.isRedirect()) {
                selectedArchive.resolveRedirect(title, readArticle);
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
     * @param {Title|DirEntry} title
     */
    function readArticle(title) {
        if (title.isRedirect()) {
            selectedArchive.resolveRedirect(title, readArticle);
        }
        else {
            selectedArchive.readArticle(title, displayArticleInForm);
        }
    }
    
    var messageChannel;
    
    /**
     * Function that handles a message of the messageChannel.
     * It tries to read the content in the backend, and sends it back to the ServiceWorker
     * @param {Event} event
     */
    function handleMessageChannelMessage(event) {
        if (event.data.error) {
            console.error("Error in MessageChannel", event.data.error);
            reject(event.data.error);
        } else {
            console.log("the ServiceWorker sent a message on port1", event.data);
            if (event.data.action === "askForContent") {
                console.log("we are asked for a content : let's try to answer to this message");
                var titleName = event.data.titleName;
                var messagePort = event.ports[0];
                var readFile = function(title) {
                    if (title === null) {
                        console.error("Title " + titleName + " not found in archive.");
                        messagePort.postMessage({'action': 'giveContent', 'titleName' : titleName, 'content': ''});
                    } else if (title.isRedirect()) {
                        selectedArchive.resolveRedirect(title, readFile);
                    } else {
                        console.log("Reading binary file...");
                        selectedArchive.readBinaryFile(title, function(readableTitleName, content) {
                            messagePort.postMessage({'action': 'giveContent', 'titleName' : titleName, 'content': content});
                            console.log("content sent to ServiceWorker");
                        });
                    }
                };
                selectedArchive.getTitleByName(titleName).then(readFile).fail(function() {
                    messagePort.postMessage({'action': 'giveContent', 'titleName' : titleName, 'content': new UInt8Array()});
                });
            }
            else {
                console.error("Invalid message received", event.data);
            }
        }
    };
    
    // Compile some regular expressions needed to modify links
    var regexpImageLink = /^.?\/?[^:]+:(.*)/;
    var regexpMathImageUrl = /^\/math.*\/([0-9a-f]{32})\.png$/;
    var regexpPath = /^(.*\/)[^\/]+$/;
    // These regular expressions match both relative and absolute URLs
    // Since late 2014, all ZIM files should use relative URLs
    var regexpImageUrl = /^(?:\.\.\/|\/)+(I\/.*)$/;
    var regexpMetadataUrl = /^(?:\.\.\/|\/)+(-\/.*)$/;

    /**
     * Display the the given HTML article in the web page,
     * and convert links to javascript calls
     * NB : in some error cases, the given title can be null, and the htmlArticle contains the error message
     * @param {Title|DirEntry} title
     * @param {String} htmlArticle
     */
    function displayArticleInForm(title, htmlArticle) {
        $("#readingArticle").hide();
        $("#articleContent").show();
        // Scroll the iframe to its top
        $("#articleContent").contents().scrollTop(0);

        // Apply Mediawiki CSS only when it's an Evopedia archive
        if (selectedArchive.needsWikimediaCSS() === true) {
            $('#articleContent').contents().find('head').empty();
            var currentHref = $(location).attr('href');
            var currentPath = regexpPath.exec(currentHref)[1];
            $('#articleContent').contents().find('head').append("<link rel='stylesheet' type='text/css' href='" + currentPath + "css/mediawiki-main.css' id='mediawiki-stylesheet' />");
        }

        // Display the article inside the web page.
        $('#articleContent').contents().find('body').html(htmlArticle);
        
        
        // If the ServiceWorker is not useable, we need to fallback to parse the DOM
        // to inject math images, and replace some links with javascript calls
        if (contentInjectionMode === 'jquery') {

            // Convert links into javascript calls
            $('#articleContent').contents().find('body').find('a').each(function() {
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
                else if (url.match(regexpImageLink)
                    && (util.endsWith(lowerCaseUrl, ".png")
                        || util.endsWith(lowerCaseUrl, ".svg")
                        || util.endsWith(lowerCaseUrl, ".jpg")
                        || util.endsWith(lowerCaseUrl, ".jpeg"))) {
                    // It's a link to a file of wikipedia : change the URL to the online version and open in a new tab
                    var onlineWikipediaUrl = url.replace(regexpImageLink, "https://" + selectedArchive._language + ".wikipedia.org/wiki/File:$1");
                    $(this).attr("href", onlineWikipediaUrl);
                    $(this).attr("target", "_blank");
                }
                else {
                    // It's a link to another article
                    // Add an onclick event to go to this article
                    // instead of following the link
                    
                    if (url.substring(0, 2) === "./") {
                        url = url.substring(2);
                    }
                    // Remove the initial slash if it's an absolute URL
                    else if (url.substring(0, 1) === "/") {
                        url = url.substring(1);
                    }
                    $(this).on('click', function(e) {
                        var titleName = decodeURIComponent(url);
                        pushBrowserHistoryState(titleName);
                        goToArticle(titleName);
                        return false;
                    });
                }
            });

            // Load images
            $('#articleContent').contents().find('body').find('img').each(function() {
                var image = $(this);
                var m = image.attr("src").match(regexpMathImageUrl);
                if (m) {
                    // It's a math image (Evopedia archive)
                    selectedArchive.loadMathImage(m[1], function(data) {
                        uiUtil.feedNodeWithBlob(image, 'src', data, 'image/png');
                    });
                } else {
                    // It's a standard image contained in the ZIM file
                    // We try to find its name (from an absolute or relative URL)
                    var imageMatch = image.attr("src").match(regexpImageUrl);
                    if (imageMatch) {
                        var titleName = decodeURIComponent(imageMatch[1]);
                        selectedArchive.getTitleByName(titleName).then(function(title) {
                            selectedArchive.readBinaryFile(title, function (readableTitleName, content) {
                                // TODO : use the complete MIME-type of the image (as read from the ZIM file)
                                uiUtil.feedNodeWithBlob(image, 'src', content, 'image');
                            });
                        }).fail(function (e) {
                            console.error("could not find title for image:" + titleName, e);
                        });
                    }
                }
            });

            // Load CSS content
            $('#articleContent').contents().find('link[rel=stylesheet]').each(function() {
                var link = $(this);
                // We try to find its name (from an absolute or relative URL)
                var hrefMatch = link.attr("href").match(regexpMetadataUrl);
                if (hrefMatch) {
                    // It's a CSS file contained in the ZIM file
                    var titleName = uiUtil.removeUrlParameters(decodeURIComponent(hrefMatch[1]));
                    selectedArchive.getTitleByName(titleName).then(function(title) {
                        selectedArchive.readBinaryFile(title, function (readableTitleName, content) {
                            var cssContent = util.uintToString(content);
                            // For some reason, Firefox OS does not accept the syntax <link rel="stylesheet" href="data:text/css,...">
                            // So we replace the tag with a <style type="text/css">...</style>
                            // while copying some attributes of the original tag
                            // Cf http://jonraasch.com/blog/javascript-style-node
                            var cssElement = document.createElement('style');
                            cssElement.type = 'text/css';

                            if (cssElement.styleSheet) {
                                cssElement.styleSheet.cssText = cssContent;
                            } else {
                                cssElement.appendChild(document.createTextNode(cssContent));
                            }
                            var mediaAttributeValue = link.attr('media');
                            if (mediaAttributeValue) {
                                cssElement.media = mediaAttributeValue;
                            }
                            var disabledAttributeValue = link.attr('media');
                            if (disabledAttributeValue) {
                                cssElement.disabled = disabledAttributeValue;
                            }
                            link.replaceWith(cssElement);
                        });
                    }).fail(function (e) {
                        console.error("could not find title for CSS : " + titleName, e);
                    });
                }
            });

            // Load Javascript content
            $('#articleContent').contents().find('script').each(function() {
                var script = $(this);
                // We try to find its name (from an absolute or relative URL)
                var srcMatch = script.attr("src").match(regexpMetadataUrl);
                // TODO check that the type of the script is text/javascript or application/javascript
                if (srcMatch) {
                    // It's a Javascript file contained in the ZIM file
                    var titleName = uiUtil.removeUrlParameters(decodeURIComponent(srcMatch[1]));
                    selectedArchive.getTitleByName(titleName).then(function(title) {
                        if (title === null)
                            console.log("Error: js file not found: " + titleName);
                        else
                            selectedArchive.readBinaryFile(title, function (readableTitleName, content) {
                                // TODO : I have to disable javascript for now
                                // var jsContent = encodeURIComponent(util.uintToString(content));
                                //script.attr("src", 'data:text/javascript;charset=UTF-8,' + jsContent);
                            });
                    }).fail(function (e) {
                        console.error("could not find title for javascript : " + titleName, e);
                    });
                }
            });

        }  
    }

    /**
     * Changes the URL of the browser page, so that the user might go back to it
     * 
     * @param {String} titleName
     * @param {String} titleSearch
     * @param {Float} latitude
     * @param {Float} longitude
     * @param {Float} maxDistance
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
     * @param {String} titleName
     */
    function goToArticle(titleName) {
        selectedArchive.getTitleByName(titleName).then(function(title) {
            if (title === null || title === undefined) {
                $("#readingArticle").hide();
                alert("Article with title " + titleName + " not found in the archive");
            }
            else {
                $("#articleName").html(titleName);
                $("#readingArticle").show();
                $('#articleContent').contents().find('body').html("");
                readArticle(title);
            }
        }).fail(function() { alert("Error reading title " + titleName); });
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
        $('#articleContent').contents().find('body').empty();
        if (selectedArchive !== null && selectedArchive.isReady()) {
            if (navigator.geolocation) {
                var geo_options = {
                    enableHighAccuracy: false,
                    maximumAge: 600000, // 10 minutes
                    timeout: Infinity 
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
    
    /**
     * Called when a geolocation request succeeds : start looking for titles around the location
     * @param {Position} pos Position given by geolocation
     */
    function geo_success(pos) {
        var crd = pos.coords;

        if ($('#geolocationProgress').is(":visible")) {
            $('#geolocationProgress').prop("step", "SearchInTitleIndex");
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
    }

    /**
     * Called when a geolocation fails
     * @param {PositionError} err
     */
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
    }

    function goToRandomArticle() {
        selectedArchive.getRandomTitle(function(title) {
            if (title === null || title === undefined) {
                alert("Error finding random article.");
            }
            else {
                if (title.namespace === 'A') {
                    $("#articleName").html(title.name());
                    pushBrowserHistoryState(title.name());
                    $("#readingArticle").show();
                    $('#articleContent').contents().find('body').html("");
                    readArticle(title);
                }
                else {
                    // If the random title search did not end up on an article,
                    // we try again, until we find one
                    goToRandomArticle();
                }
            }
        });
    }
    
    function goToMainArticle() {
        selectedArchive.getMainPageTitle(function(title) {
            if (title === null || title === undefined) {
                console.error("Error finding main article.");
            }
            else {
                if (title.namespace === 'A') {
                    $("#articleName").html(title.name());
                    pushBrowserHistoryState(title.name());
                    $("#readingArticle").show();
                    $('#articleContent').contents().find('body').html("");
                    readArticle(title);
                }
                else {
                    console.error("The main page of this archive does not seem to be an article");
                }
            }
        });
    }

});
