/**
 * app.js : User Interface implementation
 * This file handles the interaction between the application and the user
 * 
 * Copyright 2013-2014 Mossroy and contributors
 * License GPL v3:
 * 
 * This file is part of Kiwix.
 * 
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */

'use strict';

// This uses require.js to structure javascript:
// http://requirejs.org/docs/api.html#define

define(['jquery', 'zimArchiveLoader', 'util', 'uiUtil', 'cookies','abstractFilesystemAccess','q'],
 function($, zimArchiveLoader, util, uiUtil, cookies, abstractFilesystemAccess, q) {
     
    /**
     * Maximum number of articles to display in a search
     * @type Integer
     */
    var MAX_SEARCH_RESULT_SIZE = 50;

    /**
     * The delay (in milliseconds) between two "keepalive" messages
     * sent to the ServiceWorker (so that it is not stopped by
     * the browser, and keeps the MessageChannel to communicate
     * with the application)
     * @type Integer
     */
    var DELAY_BETWEEN_KEEPALIVE_SERVICEWORKER = 30000;

    /**
     * @type ZIMArchive
     */
    var selectedArchive = null;
    
    /**
     * A global parameter object for storing variables that need to be remembered between page loads
     * or across different functions
     * 
     * @type Object
     */
    var params = {};

    // Set parameters and associated UI elements from cookie
    params['hideActiveContentWarning'] = cookies.getItem('hideActiveContentWarning') === 'true';
    document.getElementById('hideActiveContentWarningCheck').checked = params.hideActiveContentWarning;
    
    /**
     * Resize the IFrame height, so that it fills the whole available height in the window
     */
    function resizeIFrame() {
        var height = $(window).outerHeight()
                - $("#top").outerHeight(true)
                - $("#articleListWithHeader").outerHeight(true)
                // TODO : this 5 should be dynamically computed, and not hard-coded
                - 5;
        $(".articleIFrame").css("height", height + "px");
    }
    $(document).ready(resizeIFrame);
    $(window).resize(resizeIFrame);
    
    // Define behavior of HTML elements
    $('#searchArticles').on('click', function(e) {
        $("#welcomeText").hide();
        $("#searchingArticles").show();
        pushBrowserHistoryState(null, $('#prefix').val());
        searchDirEntriesFromPrefix($('#prefix').val());
        if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
            $('#navbarToggle').click();
        }
    });
    $('#formArticleSearch').on('submit', function(e) {
        document.getElementById("searchArticles").click();
        return false;
    });
    $('#prefix').on('keyup', function(e) {
        if (selectedArchive !== null && selectedArchive.isReady()) {
            onKeyUpPrefix(e);
        }
    });
    $("#btnRandomArticle").on("click", function(e) {
        $('#prefix').val("");
        goToRandomArticle();
        $("#welcomeText").hide();
        $('#articleListWithHeader').hide();
        $("#searchingArticles").hide();
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
        $('#formArticleSearch').show();
        $("#welcomeText").show();
        $('#articleContent').show();
        // Give the focus to the search field, and clean up the page contents
        $("#prefix").val("");
        $('#prefix').focus();
        $("#articleList").empty();
        $('#articleListHeaderMessage').empty();
        $("#searchingArticles").hide();
        $("#articleContent").hide();
        $("#articleContent").contents().empty();
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
        $('#formArticleSearch').hide();
        $("#welcomeText").hide();
        $('#articleListWithHeader').hide();
        $("#searchingArticles").hide();
        $('#articleContent').hide();
        $('.alert').hide();
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
        $('#formArticleSearch').hide();
        $("#welcomeText").hide();
        $('#articleListWithHeader').hide();
        $("#searchingArticles").hide();
        $('#articleContent').hide();
        $('.alert').hide();
        return false;
    });
    $('input:radio[name=contentInjectionMode]').on('change', function(e) {
        // Do the necessary to enable or disable the Service Worker
        setContentInjectionMode(this.value);
    });
    $('input:checkbox[name=hideActiveContentWarning]').on('change', function (e) {
        params.hideActiveContentWarning = this.checked ? true : false;
        cookies.setItem('hideActiveContentWarning', params.hideActiveContentWarning, Infinity);
    });

    /**
     * Displays of refreshes the API status shown to the user
     */
    function refreshAPIStatus() {
        var apiStatusPanel = document.getElementById('apiStatusDiv');
        apiStatusPanel.classList.remove('panel-success', 'panel-warning');
        var apiPanelClass = 'panel-success';
        if (isMessageChannelAvailable()) {
            $('#messageChannelStatus').html("MessageChannel API available");
            $('#messageChannelStatus').removeClass("apiAvailable apiUnavailable")
                    .addClass("apiAvailable");
        } else {
            apiPanelClass = 'panel-warning';
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
                apiPanelClass = 'panel-warning';
                $('#serviceWorkerStatus').html("ServiceWorker API available, but not registered");
                $('#serviceWorkerStatus').removeClass("apiAvailable apiUnavailable")
                        .addClass("apiUnavailable");
            }
        } else {
            apiPanelClass = 'panel-warning';
            $('#serviceWorkerStatus').html("ServiceWorker API unavailable");
            $('#serviceWorkerStatus').removeClass("apiAvailable apiUnavailable")
                    .addClass("apiUnavailable");
        }
        apiStatusPanel.classList.add(apiPanelClass);

    }
    
    var contentInjectionMode;
    var keepAliveServiceWorkerHandle;
    
    /**
     * Send an 'init' message to the ServiceWorker with a new MessageChannel
     * to initialize it, or to keep it alive.
     * This MessageChannel allows a 2-way communication between the ServiceWorker
     * and the application
     */
    function initOrKeepAliveServiceWorker() {
        if (contentInjectionMode === 'serviceworker') {
            // Create a new messageChannel
            var tmpMessageChannel = new MessageChannel();
            tmpMessageChannel.port1.onmessage = handleMessageChannelMessage;
            // Send the init message to the ServiceWorker, with this MessageChannel as a parameter
            navigator.serviceWorker.controller.postMessage({'action': 'init'}, [tmpMessageChannel.port2]);
            messageChannel = tmpMessageChannel;
            // Schedule to do it again regularly to keep the 2-way communication alive.
            // See https://github.com/kiwix/kiwix-js/issues/145 to understand why
            clearTimeout(keepAliveServiceWorkerHandle);
            keepAliveServiceWorkerHandle = setTimeout(initOrKeepAliveServiceWorker, DELAY_BETWEEN_KEEPALIVE_SERVICEWORKER, false);
        }
    }
    
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
            
            if (!isServiceWorkerReady()) {
                $('#serviceWorkerStatus').html("ServiceWorker API available : trying to register it...");
                navigator.serviceWorker.register('../service-worker.js').then(function (reg) {
                    // The ServiceWorker is registered
                    serviceWorkerRegistration = reg;
                    refreshAPIStatus();
                    
                    // We need to wait for the ServiceWorker to be activated
                    // before sending the first init message
                    var serviceWorker = reg.installing || reg.waiting || reg.active;
                    serviceWorker.addEventListener('statechange', function(statechangeevent) {
                        if (statechangeevent.target.state === 'activated') {
                            // Remove any jQuery hooks from a previous jQuery session
                            $('#articleContent').contents().remove();
                            // Create the MessageChannel
                            // and send the 'init' message to the ServiceWorker
                            initOrKeepAliveServiceWorker();
                        }
                    });
                    if (serviceWorker.state === 'activated') {
                        // Even if the ServiceWorker is already activated,
                        // We need to re-create the MessageChannel
                        // and send the 'init' message to the ServiceWorker
                        // in case it has been stopped and lost its context
                        initOrKeepAliveServiceWorker();
                    }
                }, function (err) {
                    console.error('error while registering serviceWorker', err);
                    refreshAPIStatus();
                    var message = "The ServiceWorker could not be properly registered. Switching back to jQuery mode. Error message : " + err;
                    var protocol = window.location.protocol;
                    if (protocol === 'moz-extension:') {
                        message += "\n\nYou seem to be using kiwix-js through a Firefox extension : ServiceWorkers are disabled by Mozilla in extensions.";
                        message += "\nPlease vote for https://bugzilla.mozilla.org/show_bug.cgi?id=1344561 so that some future Firefox versions support it";
                    }
                    else if (protocol === 'file:') {
                        message += "\n\nYou seem to be opening kiwix-js with the file:// protocol. You should open it through a web server : either through a local one (http://localhost/...) or through a remote one (but you need SSL : https://webserver/...)";
                    }
                    alert(message);                        
                    setContentInjectionMode("jquery");
                    return;
                });
            } else {
                // We need to set this variable earlier else the ServiceWorker does not get reactivated
                contentInjectionMode = value;
                initOrKeepAliveServiceWorker();
            }
        }
        $('input:radio[name=contentInjectionMode]').prop('checked', false);
        $('input:radio[name=contentInjectionMode]').filter('[value="' + value + '"]').prop('checked', true);
        contentInjectionMode = value;
        // Save the value in a cookie, so that to be able to keep it after a reload/restart
        cookies.setItem('lastContentInjectionMode', value, Infinity);
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
     * @type Array.<StorageFirefoxOS>
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
        zimArchiveLoader.scanForArchives(storages, populateDropDownListOfArchives);
    }

    if ($.isFunction(navigator.getDeviceStorages)) {
        // The method getDeviceStorages is available (FxOS>=1.1)
        storages = $.map(navigator.getDeviceStorages("sdcard"), function(s) {
            return new abstractFilesystemAccess.StorageFirefoxOS(s);
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
            var title = event.state.title;
            var titleSearch = event.state.titleSearch;
            
            $('#prefix').val("");
            $("#welcomeText").hide();
            $("#searchingArticles").hide();
            if ($('#navbarToggle').is(":visible") && $('#liHomeNav').is(':visible')) {
                $('#navbarToggle').click();
            }
            $('#configuration').hide();
            $('#articleListWithHeader').hide();
            $('#articleContent').contents().empty();
            
            if (title && !(""===title)) {
                goToArticle(title);
            }
            else if (titleSearch && !(""===titleSearch)) {
                $('#prefix').val(titleSearch);
                searchDirEntriesFromPrefix($('#prefix').val());
            }
        }
    };
    
    /**
     * Populate the drop-down list of archives with the given list
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
                alert("You seem to be using an Android device. Be aware that there is a bug on Firefox, that prevents finding Wikipedia archives in a SD-card (at least on some devices. See about section). Please put the archive in the internal storage if the application can't find it.");
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
            resetCssCache();
            selectedArchive = zimArchiveLoader.loadArchiveFromDeviceStorage(selectedStorage, archiveDirectory, function (archive) {
                cookies.setItem("lastSelectedArchive", archiveDirectory, Infinity);
                // The archive is set : go back to home page to start searching
                $("#btnHome").click();
            });
            
        }
    }
    
    /**
     * Resets the CSS Cache (used only in jQuery mode)
     */
    function resetCssCache() {
        // Reset the cssCache. Must be done when archive changes.
        if (cssCache) {
            cssCache = new Map();
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
        resetCssCache();
        selectedArchive = zimArchiveLoader.loadArchiveFromFiles(files, function (archive) {
            // The archive is set : go back to home page to start searching
            $("#btnHome").click();
        });
    }
    /**
     * Sets the localArchive from the File selects populated by user
     */
    function setLocalArchiveFromFileSelect() {
        setLocalArchiveFromFileList(document.getElementById('archiveFiles').files);
    }

    /**
     * Reads a remote archive with given URL, and returns the response in a Promise.
     * This function is used by setRemoteArchives below, for UI tests
     * 
     * @param url The URL of the archive to read
     * @returns {Promise}
     */
    function readRemoteArchive(url) {
        var deferred = q.defer();
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "blob";
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if ((request.status >= 200 && request.status < 300) || request.status === 0) {
                    // Hack to make this look similar to a file
                    request.response.name = url;
                    deferred.resolve(request.response);
                }
                else {
                    deferred.reject("HTTP status " + request.status + " when reading " + url);
                }
            }
        };
        request.onabort = function (e) {
            deferred.reject(e);
        };
        request.send(null);
        return deferred.promise;
    }
    
    /**
     * This is used in the testing interface to inject remote archives
     */
    window.setRemoteArchives = function() {
        var readRequests = [];
        var i;
        for (i = 0; i < arguments.length; i++) {
            readRequests[i] = readRemoteArchive(arguments[i]);
        }
        return q.all(readRequests).then(function(arrayOfArchives) {
            setLocalArchiveFromFileList(arrayOfArchives);
        });
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
                $('#searchArticles').click();
            }
        }
        ,500);
    }


    /**
     * Search the index for DirEntries with title that start with the given prefix (implemented
     * with a binary search inside the index file)
     * @param {String} prefix
     */
    function searchDirEntriesFromPrefix(prefix) {
        if (selectedArchive !== null && selectedArchive.isReady()) {
            $('#activeContent').alert('close');
            selectedArchive.findDirEntriesWithPrefix(prefix.trim(), MAX_SEARCH_RESULT_SIZE, populateListOfArticles);
        } else {
            $('#searchingArticles').hide();
            // We have to remove the focus from the search field,
            // so that the keyboard does not stay above the message
            $("#searchArticles").focus();
            alert("Archive not set : please select an archive");
            $("#btnConfigure").click();
        }
    }

  
    /**
     * Display the list of articles with the given array of DirEntry
     * @param {Array} dirEntryArray The array of dirEntries returned from the binary search
     */
    function populateListOfArticles(dirEntryArray) {
        var articleListHeaderMessageDiv = $('#articleListHeaderMessage');
        var nbDirEntry = dirEntryArray ? dirEntryArray.length : 0;

        var message;
        if (nbDirEntry >= MAX_SEARCH_RESULT_SIZE) {
            message = 'First ' + MAX_SEARCH_RESULT_SIZE + ' articles below (refine your search).';
        } else {
            message = nbDirEntry + ' articles found.';
        }
        if (nbDirEntry === 0) {
            message = 'No articles found.';
        }

        articleListHeaderMessageDiv.html(message);

        var articleListDiv = $('#articleList');
        var articleListDivHtml = '';
        var listLength = dirEntryArray.length < MAX_SEARCH_RESULT_SIZE ? dirEntryArray.length : MAX_SEARCH_RESULT_SIZE;
        for (var i = 0; i < listLength; i++) {
            var dirEntry = dirEntryArray[i];
            var title = dirEntry.title ? dirEntry.title : '[' + dirEntry.url + ']';
            articleListDivHtml += '<a href="#" dirEntryId="' + dirEntry.toStringId().replace(/'/g, '&apos;') +
                '" class="list-group-item">' + title + '</a>';
        }
        articleListDiv.html(articleListDivHtml);
        $('#articleList a').on('click', handleTitleClick);
        $('#searchingArticles').hide();
        $('#articleListWithHeader').show();
    }
    
    /**
     * Handles the click on the title of an article in search results
     * @param {Event} event
     * @returns {Boolean}
     */
    function handleTitleClick(event) {       
        var dirEntryId = event.target.getAttribute("dirEntryId");
        findDirEntryFromDirEntryIdAndLaunchArticleRead(dirEntryId);
        var dirEntry = selectedArchive.parseDirEntryId(dirEntryId);
        return false;
    }
    

    /**
     * Creates an instance of DirEntry from given dirEntryId (including resolving redirects),
     * and call the function to read the corresponding article
     * @param {String} dirEntryId
     */
    function findDirEntryFromDirEntryIdAndLaunchArticleRead(dirEntryId) {
        if (selectedArchive.isReady()) {
            var dirEntry = selectedArchive.parseDirEntryId(dirEntryId);
            // Remove focus from search field to hide keyboard
            $("#searchArticles").focus();
            $("#searchingArticles").show();
            if (dirEntry.isRedirect()) {
                selectedArchive.resolveRedirect(dirEntry, readArticle);
            } else {
                params.isLandingPage = false;
                readArticle(dirEntry);
            }
        } else {
            alert("Data files not set");
        }
    }

    /**
     * Read the article corresponding to the given dirEntry
     * @param {DirEntry} dirEntry
     */
    function readArticle(dirEntry) {
        if (contentInjectionMode === 'serviceworker') {
            // In ServiceWorker mode, we simply set the iframe src.
            // (reading the backend is handled by the ServiceWorker itself)
            var iframeArticleContent = document.getElementById('articleContent');
            iframeArticleContent.onload = function() {
                // The iframe is empty, show spinner on load of landing page
                $("#searchingArticles").show();
                $("#articleList").empty();
                $('#articleListHeaderMessage').empty();
                $('#articleListWithHeader').hide();
                $("#prefix").val("");
                iframeArticleContent.onload = function () {
                    // The content is fully loaded by the browser : we can hide the spinner
                    iframeArticleContent.onload = function () {};
                    $("#searchingArticles").hide();
                };
                iframeArticleContent.src = dirEntry.namespace + "/" + encodeURIComponent(dirEntry.url);
                // Display the iframe content
                $("#articleContent").show();
            };
            iframeArticleContent.src = "article.html";
        } else {
            // In jQuery mode, we read the article content in the backend and manually insert it in the iframe
            if (dirEntry.isRedirect()) {
                selectedArchive.resolveRedirect(dirEntry, readArticle);
            } else {
                // Line below was inserted to prevent the spinner being hidden, possibly by an async function, when pressing the Random button in quick succession
                // TODO: Investigate whether it is really an async issue or whether there is a rogue .hide() statement in the chain
                $("#searchingArticles").show();
                selectedArchive.readUtf8File(dirEntry, displayArticleContentInIframe);
            }
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
            // We received a message from the ServiceWorker
            if (event.data.action === "askForContent") {
                // The ServiceWorker asks for some content
                var title = event.data.title;
                var messagePort = event.ports[0];
                var readFile = function(dirEntry) {
                    if (dirEntry === null) {
                        console.error("Title " + title + " not found in archive.");
                        messagePort.postMessage({'action': 'giveContent', 'title' : title, 'content': ''});
                    } else if (dirEntry.isRedirect()) {
                        selectedArchive.resolveRedirect(dirEntry, function(resolvedDirEntry) {
                            var redirectURL = resolvedDirEntry.namespace + "/" +resolvedDirEntry.url;
                            // Ask the ServiceWork to send an HTTP redirect to the browser.
                            // We could send the final content directly, but it is necessary to let the browser know in which directory it ends up.
                            // Else, if the redirect URL is in a different directory than the original URL,
                            // the relative links in the HTML content would fail. See #312
                            messagePort.postMessage({'action':'sendRedirect', 'title':title, 'redirectUrl': redirectURL});
                        });
                    } else {
                        // Let's read the content in the ZIM file
                        selectedArchive.readBinaryFile(dirEntry, function(fileDirEntry, content) {
                            // Let's send the content to the ServiceWorker
                            var message = {'action': 'giveContent', 'title' : title, 'content': content.buffer};
                            messagePort.postMessage(message, [content.buffer]);
                        });
                    }
                };
                selectedArchive.getDirEntryByTitle(title).then(readFile).fail(function() {
                    messagePort.postMessage({'action': 'giveContent', 'title' : title, 'content': new UInt8Array()});
                });
            }
            else {
                console.error("Invalid message received", event.data);
            }
        }
    }
    
    // Compile some regular expressions needed to modify links
    // Pattern to find the path in a url
    var regexpPath = /^(.*\/)[^\/]+$/;
    // Pattern to find a ZIM URL (with its namespace) - see https://wiki.openzim.org/wiki/ZIM_file_format#Namespaces
    var regexpZIMUrlWithNamespace = /(?:^|\/)([-ABIJMUVWX]\/.+)/;
    // Regex below finds images, scripts, stylesheets and media sources with ZIM-type metadata and image namespaces [kiwix-js #378]
    // It first searches for <img, <script, <link, etc., then scans forward to find, on a word boundary, either src=["']
    // or href=["'] (ignoring any extra whitespace), and it then tests the path of the URL with a non-capturing lookahead that
    // matches ZIM URLs with namespaces [-IJ] ('-' = metadata or 'I'/'J' = image). When the regex is used below, it will also
    // remove any relative or absolute path from ZIM-style URLs.
    // DEV: If you want to support more namespaces, add them to the END of the character set [-IJ] (not to the beginning) 
    var regexpTagsWithZimUrl = /(<(?:img|script|link|video|audio|source|track)\b[^>]*?\s)(?:src|href)(\s*=\s*["'])(?:\.\.\/|\/)+(?=[-IJ]\/)/ig;
    // Regex below tests the html of an article for active content [kiwix-js #466]
    // It inspects every <script> block in the html and matches in the following cases: 1) the script loads a UI application called app.js;
    // 2) the script block has inline content that does not contain "importScript()" or "toggleOpenSection" (these strings are used widely
    // in our fully supported wikimedia ZIMs, so they are excluded); 3) the script block is not of type "math" (these are MathJax markup
    // scripts used extensively in Stackexchange ZIMs). Note that the regex will match ReactJS <script type="text/html"> markup, which is
    // common in unsupported packaged UIs, e.g. PhET ZIMs.
    var regexpActiveContent = /<script\b(?:(?![^>]+src\b)|(?=[^>]+src\b=["'][^"']+?app\.js))(?!>[^<]+(?:importScript\(\)|toggleOpenSection))(?![^>]+type\s*=\s*["'](?:math\/|[^"']*?math))/i;
    
    // Cache for CSS styles contained in ZIM.
    // It significantly speeds up subsequent page display. See kiwix-js issue #335
    var cssCache = new Map();

    /**
     * Display the the given HTML article in the web page,
     * and convert links to javascript calls
     * NB : in some error cases, the given title can be null, and the htmlArticle contains the error message
     * @param {DirEntry} dirEntry
     * @param {String} htmlArticle
     */
    function displayArticleContentInIframe(dirEntry, htmlArticle) {
        // Display Bootstrap warning alert if the landing page contains active content
        if (!params.hideActiveContentWarning && params.isLandingPage) {
            if (regexpActiveContent.test(htmlArticle)) uiUtil.displayActiveContentWarning();
        }

        // Replaces ZIM-style URLs of img, script, link and media tags with a data-kiwixurl to prevent 404 errors [kiwix-js #272 #376]
        // This replacement also processes the URL to remove the path so that the URL is ready for subsequent jQuery functions
        htmlArticle = htmlArticle.replace(regexpTagsWithZimUrl, '$1data-kiwixurl$2');

        // Compute base URL
        var urlPath = regexpPath.test(dirEntry.url) ? urlPath = dirEntry.url.match(regexpPath)[1] : '';
        var baseUrl = dirEntry.namespace + '/' + urlPath;

        // Inject base tag into html
        htmlArticle = htmlArticle.replace(/(<head[^>]*>\s*)/i, '$1<base href="' + baseUrl + '" />\r\n');
        // Extract any css classes from the html tag (they will be stripped when injected in iframe with .innerHTML)
        var htmlCSS = htmlArticle.match(/<html[^>]*class\s*=\s*["']\s*([^"']+)/i);
        htmlCSS = htmlCSS ? htmlCSS[1] : '';
        
        // Tell jQuery we're removing the iframe document: clears jQuery cache and prevents memory leaks [kiwix-js #361]
        $('#articleContent').contents().remove();
        
        var iframeArticleContent = document.getElementById('articleContent');
        
        iframeArticleContent.onload = function() {
            iframeArticleContent.onload = function(){};
            $("#articleList").empty();
            $('#articleListHeaderMessage').empty();
            $('#articleListWithHeader').hide();
            $("#prefix").val("");
            // Inject the new article's HTML into the iframe
            var articleContent = iframeArticleContent.contentDocument.documentElement;
            articleContent.innerHTML = htmlArticle;
            // Add any missing classes stripped from the <html> tag
            if (htmlCSS) articleContent.getElementsByTagName('body')[0].classList.add(htmlCSS);
            // Allow back/forward in browser history
            pushBrowserHistoryState(dirEntry.namespace + "/" + dirEntry.url);
            
            parseAnchorsJQuery();
            loadImagesJQuery();
            // JavaScript is currently disabled, so we need to make the browser interpret noscript tags
            // NB : if javascript is properly handled in jQuery mode in the future, this call should be removed
            // and noscript tags should be ignored
            loadNoScriptTags();
            //loadJavaScriptJQuery();
            loadCSSJQuery();
            insertMediaBlobsJQuery();
        };
     
        // Load the blank article to clear the iframe (NB iframe onload event runs *after* this)
        iframeArticleContent.src = "article.html";

        function parseAnchorsJQuery() {
            var currentProtocol = location.protocol;
            var currentHost = location.host;
            // Percent-encode dirEntry.url and add regex escape character \ to the RegExp special characters - see https://www.regular-expressions.info/characters.html;
            // NB dirEntry.url can also contain path separator / in some ZIMs (Stackexchange). } and ] do not need to be escaped as they have no meaning on their own. 
            var escapedUrl = encodeURIComponent(dirEntry.url).replace(/([\\$^.|?*+\/()[{])/g, '\\$1');
            // Pattern to match a local anchor in an href even if prefixed by escaped url
            var regexpLocalAnchorHref = new RegExp('^(?:#|' + escapedUrl + '#)([^#]+$)');
            $('#articleContent').contents().find('body').find('a').each(function () {
                // Attempts to access any properties of 'this' with malformed URLs causes app crash in Edge/UWP [kiwix-js #430]
                try {
                    var testHref = this.href;
                } catch (err) {
                    console.error("Malformed href caused error:" + err.message);
                    return;
                }
                var href = this.getAttribute('href');
                if (href === null || href === undefined) return;
                // Compute current link's url (with its namespace), if applicable
                // NB We need to access 'this.href' here because, unlike 'this.getAttribute("href")', it contains the fully qualified URL [kiwix-js #432]
                var zimUrl = regexpZIMUrlWithNamespace.test(this.href) ? this.href.match(regexpZIMUrlWithNamespace)[1] : '';
                if (href.length === 0) {
                    // It's a link with an empty href, pointing to the current page.
                    // Because of the base tag, we need to modify it
                    $(this).on('click', function (e) {
                        return false;
                    });
                } else if (regexpLocalAnchorHref.test(href)) {
                    // It's an anchor link : we need to make it work with javascript
                    // because of the base tag
                    var anchorRef = href.replace(regexpLocalAnchorHref, '$1');
                    $(this).on('click', function (e) {
                        document.getElementById('articleContent').contentWindow.location.hash = anchorRef;
                        return false;
                    });
                } else if (this.protocol !== currentProtocol ||
                    this.host !== currentHost) {
                    // It's an external URL : we should open it in a new tab
                    this.target = "_blank";
                } else {
                    // It's a link to another article
                    // Add an onclick event to go to this article
                    // instead of following the link
                    $(this).on('click', function (e) {
                        var decodedURL = decodeURIComponent(zimUrl);
                        goToArticle(decodedURL);
                        return false;
                    });
                }
            });
        }
        
        function loadImagesJQuery() {
            $('#articleContent').contents().find('body').find('img[data-kiwixurl]').each(function() {
                var image = $(this);
                var imageUrl = image.attr("data-kiwixurl");
                var title = decodeURIComponent(imageUrl);
                selectedArchive.getDirEntryByTitle(title).then(function(dirEntry) {
                    selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                        // TODO : use the complete MIME-type of the image (as read from the ZIM file)
                        var url = fileDirEntry.url;
                        // Attempt to construct a generic mimetype first as a catchall
                        var mimetype = url.match(/\.(\w{2,4})$/);
                        mimetype = mimetype ? "image/" + mimetype[1].toLowerCase() : "image";
                        // Then make more specific for known image types
                        mimetype = /\.jpg$/i.test(url) ? "image/jpeg" : mimetype;
                        mimetype = /\.tif$/i.test(url) ? "image/tiff" : mimetype;
                        mimetype = /\.ico$/i.test(url) ? "image/x-icon" : mimetype;
                        mimetype = /\.svg$/i.test(url) ? "image/svg+xml" : mimetype;
                        uiUtil.feedNodeWithBlob(image, 'src', content, mimetype);
                    });
                }).fail(function (e) {
                    console.error("could not find DirEntry for image:" + title, e);
                });
            });
        }
        
        function loadNoScriptTags() {
            // For each noscript tag, we replace it with its content, so that the browser interprets it
            $('#articleContent').contents().find('noscript').replaceWith(function () {
                // When javascript is enabled, browsers interpret the content of noscript tags as text
                // (see https://html.spec.whatwg.org/multipage/scripting.html#the-noscript-element)
                // So we can read this content with .textContent
                return this.textContent;
            });
        }

        function loadCSSJQuery() {
            // Ensure all sections are open for clients that lack JavaScript support, or that have some restrictive CSP [kiwix-js #355].
            // This is needed only for some versions of ZIM files generated by mwoffliner (at least in early 2018), where the article sections are closed by default on small screens.
            // These sections can be opened by clicking on them, but this is done with some javascript.
            // The code below is a workaround we still need for compatibility with ZIM files generated by mwoffliner in 2018.
            // A better fix has been made for more recent ZIM files, with the use of noscript tags : see https://github.com/openzim/mwoffliner/issues/324
            var iframe = document.getElementById('articleContent').contentDocument;
            var collapsedBlocks = iframe.querySelectorAll('.collapsible-block:not(.open-block), .collapsible-heading:not(.open-block)');
            // Using decrementing loop to optimize performance : see https://stackoverflow.com/questions/3520688 
            for (var i = collapsedBlocks.length; i--;) {
                collapsedBlocks[i].classList.add('open-block');
            }

            var cssCount = 0;
            var cssFulfilled = 0;
            $('#articleContent').contents().find('link[data-kiwixurl]').each(function () {
                cssCount++;
                var link = $(this);
                var linkUrl = link.attr("data-kiwixurl");
                var title = uiUtil.removeUrlParameters(decodeURIComponent(linkUrl));
                if (cssCache.has(title)) {
                    var cssContent = cssCache.get(title);
                    uiUtil.replaceCSSLinkWithInlineCSS(link, cssContent);
                    cssFulfilled++;
                } else {
                    $('#cachingCSS').show();
                    selectedArchive.getDirEntryByTitle(title)
                    .then(function (dirEntry) {
                        return selectedArchive.readUtf8File(dirEntry,
                            function (fileDirEntry, content) {
                                var fullUrl = fileDirEntry.namespace + "/" + fileDirEntry.url;
                                cssCache.set(fullUrl, content);
                                uiUtil.replaceCSSLinkWithInlineCSS(link, content);
                                cssFulfilled++;
                                renderIfCSSFulfilled(fileDirEntry.url);
                            }
                        );
                    }).fail(function (e) {
                        console.error("could not find DirEntry for CSS : " + title, e);
                        cssCount--;
                        renderIfCSSFulfilled();
                    });
                }
            });
            renderIfCSSFulfilled();

            // Some pages are extremely heavy to render, so we prevent rendering by keeping the iframe hidden
            // until all CSS content is available [kiwix-js #381]
            function renderIfCSSFulfilled(title) {
                if (cssFulfilled >= cssCount) {
                    $('#cachingCSS').html('Caching styles...');
                    $('#cachingCSS').hide();
                    $('#searchingArticles').hide();
                    $('#articleContent').show();
                    // We have to resize here for devices with On Screen Keyboards when loading from the article search list
                    resizeIFrame();
                } else if (title) {
                    title = title.replace(/[^/]+\//g, '').substring(0,18);
                    $('#cachingCSS').html('Caching ' + title + '...');
                }
            }
        }

        function loadJavaScriptJQuery() {
            $('#articleContent').contents().find('script[data-kiwixurl]').each(function() {
                var script = $(this);
                var scriptUrl = script.attr("data-kiwixurl");
                // TODO check that the type of the script is text/javascript or application/javascript
                var title = uiUtil.removeUrlParameters(decodeURIComponent(scriptUrl));
                selectedArchive.getDirEntryByTitle(title).then(function(dirEntry) {
                    if (dirEntry === null) {
                        console.log("Error: js file not found: " + title);
                    } else {
                        selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                            // TODO : JavaScript support not yet functional [kiwix-js #152]
                            uiUtil.feedNodeWithBlob(script, 'src', content, 'text/javascript');
                        });
                    }
                }).fail(function (e) {
                    console.error("could not find DirEntry for javascript : " + title, e);
                });
            });
        }

        function insertMediaBlobsJQuery() {
            var iframe = iframeArticleContent.contentDocument;
            Array.prototype.slice.call(iframe.querySelectorAll('video[data-kiwixurl], audio[data-kiwixurl], source[data-kiwixurl], track'))
            .forEach(function(mediaSource) {
                var source = mediaSource.dataset.kiwixurl;
                if (!source && mediaSource.src) {
                    // Some ZIMs list text tracks as a relative link within the directory containing the article
                    source = regexpZIMUrlWithNamespace.test(mediaSource.src) ? mediaSource.src.match(regexpZIMUrlWithNamespace)[1] : source;
                }
                if (!source || !regexpZIMUrlWithNamespace.test(source)) {
                    console.error('No usable media source was found!');
                    return;
                }
                var mediaElement = /audio|video/i.test(mediaSource.tagName) ? mediaSource : mediaSource.parentElement;
                var mimeType = mediaSource.type;
                // Check mimeType
                if (!mimeType) {
                    // Try to guess type from file extension
                    var mediaType = mediaElement.tagName.toLowerCase();
                    if (!/audio|video/i.test(mediaType)) mediaType = 'video';
                    if (/track/i.test(mediaSource.tagName)) mediaType = 'text';
                    mimeType = source.replace(/^.*\.([^.]+)$/, mediaType + '/$1');
                }
                selectedArchive.getDirEntryByTitle(decodeURIComponent(source)).then(function(dirEntry) {
                    return selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, mediaArray) {
                        var blob = new Blob([mediaArray], { type: mimeType });
                        mediaSource.src = URL.createObjectURL(blob);
                        // In Firefox and Chromium it is necessary to re-register the inserted media source
                        // but do not reload for text tracks (closed captions / subtitles)
                        if (/track/i.test(mediaSource.tagName)) return;
                        mediaElement.load();
                    });
                });
            });
        }
    }

    /**
     * Changes the URL of the browser page, so that the user might go back to it
     * 
     * @param {String} title
     * @param {String} titleSearch
     */
    function pushBrowserHistoryState(title, titleSearch) {
        var stateObj = {};
        var urlParameters;
        var stateLabel;
        if (title && !(""===title)) {
            // Prevents creating a double history for the same page
            if (history.state && history.state.title === title) return;
            stateObj.title = title;
            urlParameters = "?title=" + title;
            stateLabel = "Wikipedia Article : " + title;
        }
        else if (titleSearch && !(""===titleSearch)) {
            stateObj.titleSearch = titleSearch;
            urlParameters = "?titleSearch=" + titleSearch;
            stateLabel = "Wikipedia search : " + titleSearch;
        }
        else {
            return;
        }
        window.history.pushState(stateObj, stateLabel, urlParameters);
    }


    /**
     * Replace article content with the one of the given title
     * @param {String} title
     */
    function goToArticle(title) {
        $("#searchingArticles").show();
        title = uiUtil.removeUrlParameters(title);
        selectedArchive.getDirEntryByTitle(title).then(function(dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                $("#searchingArticles").hide();
                alert("Article with title " + title + " not found in the archive");
            } else {
                params.isLandingPage = false;
                $('#activeContent').alert('close');
                readArticle(dirEntry);
            }
        }).fail(function(e) { alert("Error reading article with title " + title + " : " + e); });
    }
    
    function goToRandomArticle() {
        $("#searchingArticles").show();
        selectedArchive.getRandomDirEntry(function(dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                $("#searchingArticles").hide();
                alert("Error finding random article.");
            } else {
                if (dirEntry.namespace === 'A') {
                    params.isLandingPage = false;
                    $('#activeContent').alert('close');
                    readArticle(dirEntry);
                } else {
                    // If the random title search did not end up on an article,
                    // we try again, until we find one
                    goToRandomArticle();
                }
            }
        });
    }
    
    function goToMainArticle() {
        $("#searchingArticles").show();
        selectedArchive.getMainPageDirEntry(function(dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                console.error("Error finding main article.");
                $("#searchingArticles").hide();
                $("#welcomeText").show();
            } else {
                if (dirEntry.namespace === 'A') {
                    params.isLandingPage = true;
                    readArticle(dirEntry);
                } else {
                    console.error("The main page of this archive does not seem to be an article");
                    $("#searchingArticles").hide();
                    $("#welcomeText").show();
                }
            }
        });
    }

});
