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

define(['jquery', 'zimArchiveLoader', 'uiUtil', 'settingsStore','abstractFilesystemAccess'],
 function($, zimArchiveLoader, uiUtil, settingsStore, abstractFilesystemAccess) {
     
    /**
     * The delay (in milliseconds) between two "keepalive" messages sent to the ServiceWorker (so that it is not stopped
     * by the browser, and keeps the MessageChannel to communicate with the application)
     * @type Integer
     */
    const DELAY_BETWEEN_KEEPALIVE_SERVICEWORKER = 30000;

    /**
     * The name of the Cache API cache to use for caching Service Worker requests and responses for certain asset types
     * We need access to the cache name in app.js in order to complete utility actions when Service Worker is not initialized,
     * so we have to duplicate it here 
     * @type {String}
     */
    // DEV: Ensure this matches the name defined in service-worker.js (a check is provided in refreshCacheStatus() below)
    const ASSETS_CACHE = 'kiwixjs-assetsCache';
    
    /**
     * Memory cache for CSS styles contained in ZIM: it significantly speeds up subsequent page display
     * This cache is used by default in jQuery mode, but can be turned off in Configuration for low-memory devices
     * In Service Worker mode, the Cache API will be used instead
     * @type {Map}
     */
    var cssCache = new Map();

    /**
     * A global object for storing app state
     * 
     * @type Object
     */
    var appstate = {};

    /**
     * @type ZIMArchive
     */
    var selectedArchive = null;
    
    /**
     * Set parameters from the Settings Store, together with any defaults
     * Note that the params global object is declared in init.js so that it is available to modules
     * WARNING: Only change these paramaeters if you know what you are doing
     */
    // The current version number of this app
    params['appVersion'] = '3.4-WIP'; // **IMPORTANT** Ensure this is the same as the version number in service-worker.js
    // The PWA server (currently only for use with the Mozilla extension)
    params['PWAServer'] = 'https://moz-extension.kiwix.org/current/'; // Include final slash!
    // params['PWAServer'] = 'https://kiwix.github.io/kiwix-js/'; // DEV: Uncomment this line for testing code on GitHub Pages
    // params['PWAServer'] = 'http://localhost:8080/'; // DEV: Uncomment this line (and adjust) for local testing
    // A parameter to determine the Settings Store API in use
    params['storeType'] = settingsStore.getBestAvailableStorageAPI();
    params['hideActiveContentWarning'] = settingsStore.getItem('hideActiveContentWarning') === 'true';
    params['showUIAnimations'] = settingsStore.getItem('showUIAnimations') ? settingsStore.getItem('showUIAnimations') === 'true' : true;
    // Maximum number of article titles to return (range is 5 - 50, default 25)
    params['maxSearchResultsSize'] = settingsStore.getItem('maxSearchResultsSize') || 25;
    // Turns caching of assets on or off and deletes the cache (it defaults to true unless explicitly turned off in UI)
    params['assetsCache'] = settingsStore.getItem('assetsCache') !== 'false';
    // Turns caching of the PWA's code on or off and deletes the cache (it defaults to true unless the bypass option is set in Expert Settings)
    params['appCache'] = settingsStore.getItem('appCache') !== 'false';
    // A parameter to set the app theme and, if necessary, the CSS theme for article content (defaults to 'light')
    params['appTheme'] = settingsStore.getItem('appTheme') || 'light'; // Currently implemented: light|dark|dark_invert|dark_mwInvert
    // A global parameter to turn on/off the use of Keyboard HOME Key to focus search bar
    params['useHomeKeyToFocusSearchBar'] = settingsStore.getItem('useHomeKeyToFocusSearchBar') === 'true';
    // A parameter to access the URL of any extension that this app was launched from
    params['referrerExtensionURL'] = settingsStore.getItem('referrerExtensionURL');
    // A parameter to set the content injection mode ('jquery' or 'serviceworker') used by this app
    params['contentInjectionMode'] = settingsStore.getItem('contentInjectionMode') || 
        // Defaults to jquery in extensions, and serviceworker if accessing as a PWA
        ((/^https?:$/i.test(window.location.protocol) && isServiceWorkerAvailable()) ? 'serviceworker' : 'jquery');

    // An object to hold the current search and its state (allows cancellation of search across modules)
    appstate['search'] = {
        'prefix': '', // A field to hold the original search string
        'status': '',  // The status of the search: ''|'init'|'interim'|'cancelled'|'complete'
        'type': ''    // The type of the search: 'basic'|'full' (set automatically in search algorithm)
    };

    // A Boolean to store the update status of the PWA version (currently only used with Firefox Extension)
    appstate['pwaUpdateNeeded'] = false; // This will be set to true if the Service Worker has an update waiting
    
    /**
     * Apply any override parameters that might be in the querystring.
     * This is used for communication between the PWA and any local code (e.g. Firefox Extension), both ways.
     * It is also possible for DEV (or user) to launch the app with certain settings, or to unset potentially
     * problematic settings, by crafting the querystring appropriately.
     */
    (function overrideParams() {
        var regexpUrlParams = /[?&]([^=]+)=([^&]+)/g;
        var matches = regexpUrlParams.exec(window.location.search);
        while (matches) {
            if (matches[1] && matches[2]) {
                var paramKey = decodeURIComponent(matches[1]);
                var paramVal = decodeURIComponent(matches[2]);
                if (paramKey !== 'title') {
                    console.debug('Setting key-pair: ' + paramKey + ':' + paramVal);
                    // Make values Boolean if 'true'/'false'
                    paramVal = paramVal === 'true' || (paramVal === 'false' ? false : paramVal);
                    settingsStore.setItem(paramKey, paramVal, Infinity);
                    params[paramKey] = paramVal;
                }
            }
            matches = regexpUrlParams.exec(window.location.search);
        }
        // If we are in the PWA version launched from an extension, send a 'success' message to the extension
        if (params.referrerExtensionURL && ~window.location.href.indexOf(params.PWAServer)) {
            var message = '?PWA_launch=success';
            // DEV: To test failure of the PWA, you could pause on next line and set message to '?PWA_launch=fail'
            // Note that, as a failsafe, the PWA_launch key is set to 'fail' (in the extension) before each PWA launch
            // so we need to send a 'success' message each time the PWA is launched
            var frame = document.createElement('iframe');
            frame.id = 'kiwixComm';
            frame.style.display = 'none';
            document.body.appendChild(frame);
            frame.src = params.referrerExtensionURL + '/www/index.html'+ message;
            // Now remove redundant frame. We cannot use onload, because it doesn't give time for the script to run.
            setTimeout(function () {
                var kiwixComm = document.getElementById('kiwixComm');
                // The only browser which does not support .remove() is IE11, but it will never run this code
                if (kiwixComm) kiwixComm.remove();
            }, 3000);
        }
    })();

    /**
     * Set the State and UI settings associated with parameters defined above
     */
    document.getElementById('hideActiveContentWarningCheck').checked = params.hideActiveContentWarning;
    document.getElementById('showUIAnimationsCheck').checked = params.showUIAnimations;
    document.getElementById('titleSearchRange').value = params.maxSearchResultsSize;
    document.getElementById('titleSearchRangeVal').textContent = params.maxSearchResultsSize;
    document.getElementById('appThemeSelect').value = params.appTheme;
    uiUtil.applyAppTheme(params.appTheme);
    document.getElementById('useHomeKeyToFocusSearchBarCheck').checked = params.useHomeKeyToFocusSearchBar;
    switchHomeKeyToFocusSearchBar();
    document.getElementById('bypassAppCacheCheck').checked = !params.appCache;
    document.getElementById('appVersion').innerHTML = 'Kiwix ' + params.appVersion;
    setContentInjectionMode(params.contentInjectionMode);

    // Define globalDropZone (universal drop area) and configDropZone (highlighting area on Config page)
    var globalDropZone = document.getElementById('search-article');
    var configDropZone = document.getElementById('configuration');
    
    // Unique identifier of the article expected to be displayed
    var expectedArticleURLToBeDisplayed = "";
    
    /**
     * Resize the IFrame height, so that it fills the whole available height in the window
     */
    function resizeIFrame() {
        var headerStyles = getComputedStyle(document.getElementById('top'));
        var iframe = document.getElementById('articleContent');
        var region = document.getElementById('search-article');
        if (iframe.style.display === 'none') {
            // We are in About or Configuration, so we only set the region height
            region.style.height = window.innerHeight + 'px';
        } else { 
            // IE cannot retrieve computed headerStyles till the next paint, so we wait a few ticks
            setTimeout(function() {
                // Get  header height *including* its bottom margin
                var headerHeight = parseFloat(headerStyles.height) + parseFloat(headerStyles.marginBottom);
                iframe.style.height = window.innerHeight - headerHeight + 'px';
                // We have to allow a minimum safety margin of 10px for 'iframe' and 'header' to fit within 'region'
                region.style.height = window.innerHeight + 10 + 'px';
            }, 100);
        }
    }
    $(document).ready(resizeIFrame);
    $(window).resize(resizeIFrame);
    
    // Define behavior of HTML elements
    var searchArticlesFocused = false;
    $('#searchArticles').on('click', function() {
        var prefix = document.getElementById('prefix').value;
        // Do not initiate the same search if it is already in progress
        if (appstate.search.prefix === prefix && !/^(cancelled|complete)$/.test(appstate.search.status)) return;
        $("#welcomeText").hide();
        $('.kiwix-alert').hide();
        $("#searchingArticles").show();
        pushBrowserHistoryState(null, prefix);
        // Initiate the search
        searchDirEntriesFromPrefix(prefix);
        $('.navbar-collapse').collapse('hide');
        document.getElementById('prefix').focus();
        // This flag is set to true in the mousedown event below
        searchArticlesFocused = false;
    });
    $('#searchArticles').on('mousedown', function() {
        // We set the flag so that the blur event of #prefix can know that the searchArticles button has been clicked
        searchArticlesFocused = true;
    });
    $('#formArticleSearch').on('submit', function() {
        document.getElementById('searchArticles').click();
        return false;
    });
    // Handle keyboard events in the prefix (article search) field
    var keyPressHandled = false;
    $('#prefix').on('keydown', function(e) {
        // If user presses Escape...
        // IE11 returns "Esc" and the other browsers "Escape"; regex below matches both
        if (/^Esc/.test(e.key)) {
            // Hide the article list
            e.preventDefault();
            e.stopPropagation();
            $('#articleListWithHeader').hide();
            $('#articleContent').focus();
            keyPressHandled = true;
        }
        // Arrow-key selection code adapted from https://stackoverflow.com/a/14747926/9727685
        // IE11 produces "Down" instead of "ArrowDown" and "Up" instead of "ArrowUp"
        if (/^((Arrow)?Down|(Arrow)?Up|Enter)$/.test(e.key)) {
            // User pressed Down arrow or Up arrow or Enter
            e.preventDefault();
            e.stopPropagation();
            // This is needed to prevent processing in the keyup event : https://stackoverflow.com/questions/9951274
            keyPressHandled = true;
            var activeElement = document.querySelector("#articleList .hover") || document.querySelector("#articleList a");
            if (!activeElement) return;
            // If user presses Enter, read the dirEntry
            if (/Enter/.test(e.key)) {
                if (activeElement.classList.contains('hover')) {
                    var dirEntryId = activeElement.getAttribute('dirEntryId');
                    findDirEntryFromDirEntryIdAndLaunchArticleRead(decodeURIComponent(dirEntryId));
                    return;
                }
            }
            // If user presses ArrowDown...
            // (NB selection is limited to five possibilities by regex above)
            if (/Down/.test(e.key)) {
                if (activeElement.classList.contains('hover')) {
                    activeElement.classList.remove('hover');
                    activeElement = activeElement.nextElementSibling || activeElement;
                    var nextElement = activeElement.nextElementSibling || activeElement;
                    if (!uiUtil.isElementInView(nextElement, true)) nextElement.scrollIntoView(false);
                }
            }
            // If user presses ArrowUp...
            if (/Up/.test(e.key)) {
                activeElement.classList.remove('hover');
                activeElement = activeElement.previousElementSibling || activeElement;
                var previousElement = activeElement.previousElementSibling || activeElement;
                if (!uiUtil.isElementInView(previousElement, true)) previousElement.scrollIntoView();
                if (previousElement === activeElement) document.getElementById('top').scrollIntoView();
            }
            activeElement.classList.add('hover');
        }
    });
    // Search for titles as user types characters
    $('#prefix').on('keyup', function(e) {
        if (selectedArchive !== null && selectedArchive.isReady()) {
            // Prevent processing by keyup event if we already handled the keypress in keydown event
            if (keyPressHandled)
                keyPressHandled = false;
            else
                onKeyUpPrefix(e);
        }
    });
    // Restore the search results if user goes back into prefix field
    $('#prefix').on('focus', function() {
        if ($('#prefix').val() !== '') 
            $('#articleListWithHeader').show();
    });
    // Hide the search results if user moves out of prefix field
    $('#prefix').on('blur', function() {
        if (!searchArticlesFocused) {
            appstate.search.status = 'cancelled';
            $("#searchingArticles").hide();
            $('#articleListWithHeader').hide();
        }
    });
    $("#btnRandomArticle").on("click", function() {
        $('#prefix').val("");
        goToRandomArticle();
        $("#welcomeText").hide();
        $('#articleListWithHeader').hide();
        $('.navbar-collapse').collapse('hide');
    });
    
    $('#btnRescanDeviceStorage').on("click", function() {
        searchForArchivesInStorage();
    });
    // Bottom bar :
    $('#btnBack').on('click', function() {
        history.back();
        return false;
    });
    $('#btnForward').on('click', function() {
        history.forward();
        return false;
    });
    $('#btnHomeBottom').on('click', function() {
        $('#btnHome').click();
        return false;
    });
    $('#btnTop').on('click', function() {
        $("#articleContent").contents().scrollTop(0);
        // We return true, so that the link to #top is still triggered (useful in the About section)
        return true;
    });
    // Top menu :
    $('#btnHome').on('click', function() {
        // Highlight the selected section in the navbar
        $('#liHomeNav').attr("class","active");
        $('#liConfigureNav').attr("class","");
        $('#liAboutNav').attr("class","");
        $('.navbar-collapse').collapse('hide');
        // Show the selected content in the page
        uiUtil.removeAnimationClasses();
        if (params.showUIAnimations) { 
           uiUtil.applyAnimationToSection("home");
        } else {
            $('#articleContent').show();
            $('#about').hide();
            $('#configuration').hide();
        }
        $('#navigationButtons').show();
        $('#formArticleSearch').show();
        $("#welcomeText").show();
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
        // Use a timeout of 400ms because uiUtil.applyAnimationToSection uses a timeout of 300ms
        setTimeout(resizeIFrame, 400);
        return false;
    });
    $('#btnConfigure').on('click', function() {
        // Highlight the selected section in the navbar
        $('#liHomeNav').attr("class","");
        $('#liConfigureNav').attr("class","active");
        $('#liAboutNav').attr("class","");
        $('.navbar-collapse').collapse('hide');
        // Show the selected content in the page
        uiUtil.removeAnimationClasses();
        if (params.showUIAnimations) { 
            uiUtil.applyAnimationToSection("config");
        } else {
            $('#about').hide();
            $('#configuration').show();
            $('#articleContent').hide();
        }    
        $('#navigationButtons').hide();
        $('#formArticleSearch').hide();
        $("#welcomeText").hide();
        $("#searchingArticles").hide();
        $('.kiwix-alert').hide();
        refreshAPIStatus();
        refreshCacheStatus();
        uiUtil.checkUpdateStatus(appstate);
        // Use a timeout of 400ms because uiUtil.applyAnimationToSection uses a timeout of 300ms
        setTimeout(resizeIFrame, 400);
        return false;
    });
    $('#btnAbout').on('click', function() {
        // Highlight the selected section in the navbar
        $('#liHomeNav').attr("class","");
        $('#liConfigureNav').attr("class","");
        $('#liAboutNav').attr("class","active");
        $('.navbar-collapse').collapse('hide');
        // Show the selected content in the page
        uiUtil.removeAnimationClasses();
        if (params.showUIAnimations) { 
            uiUtil.applyAnimationToSection("about");
        } else {
            $('#about').show();
            $('#configuration').hide();
            $('#articleContent').hide();
        }
        $('#navigationButtons').hide();
        $('#formArticleSearch').hide();
        $("#welcomeText").hide();
        $('#articleListWithHeader').hide();
        $("#searchingArticles").hide();
        $('.kiwix-alert').hide();
        // Use a timeout of 400ms because uiUtil.applyAnimationToSection uses a timeout of 300ms
        setTimeout(resizeIFrame, 400);
        return false;
    });
    $('input:radio[name=contentInjectionMode]').on('change', function() {
        // Do the necessary to enable or disable the Service Worker
        setContentInjectionMode(this.value);
    });
    document.getElementById('btnReset').addEventListener('click', function () {
        settingsStore.reset();
    });
    document.getElementById('bypassAppCacheCheck').addEventListener('change', function () {
        if (params.contentInjectionMode !== 'serviceworker') {
            alert('This setting can only be used in Service Worker mode!');
            this.checked = false;
        } else {
            params.appCache = !this.checked;
            settingsStore.setItem('appCache', params.appCache, Infinity);
            settingsStore.reset('cacheAPI');
        }
        // This will also send any new values to Service Worker
        refreshCacheStatus();
    });
    $('input:checkbox[name=hideActiveContentWarning]').on('change', function () {
        params.hideActiveContentWarning = this.checked ? true : false;
        settingsStore.setItem('hideActiveContentWarning', params.hideActiveContentWarning, Infinity);
    });
    $('input:checkbox[name=showUIAnimations]').on('change', function () {
        params.showUIAnimations = this.checked ? true : false;
        settingsStore.setItem('showUIAnimations', params.showUIAnimations, Infinity);
    });
    $('input:checkbox[name=useHomeKeyToFocusSearchBar]').on('change', function () {
        params.useHomeKeyToFocusSearchBar = this.checked ? true : false;
        settingsStore.setItem('useHomeKeyToFocusSearchBar', params.useHomeKeyToFocusSearchBar, Infinity);
        switchHomeKeyToFocusSearchBar();
    });
    document.getElementById('appThemeSelect').addEventListener('change', function (e) {
        params.appTheme = e.target.value;
        settingsStore.setItem('appTheme', params.appTheme, Infinity);
        uiUtil.applyAppTheme(params.appTheme);
    });
    document.getElementById('cachedAssetsModeRadioTrue').addEventListener('change', function (e) {
        if (e.target.checked) {
            settingsStore.setItem('assetsCache', true, Infinity);
            params.assetsCache = true;
            refreshCacheStatus();
        }
    });
    document.getElementById('cachedAssetsModeRadioFalse').addEventListener('change', function (e) {
        if (e.target.checked) {
            settingsStore.setItem('assetsCache', false, Infinity);
            params.assetsCache = false;
            // Delete all caches
            resetCssCache();
            if ('caches' in window) caches.delete(ASSETS_CACHE);
            refreshCacheStatus();
        }
    });
    var titleSearchRangeVal = document.getElementById('titleSearchRangeVal');
    document.getElementById('titleSearchRange').addEventListener('change', function(e) {
        settingsStore.setItem('maxSearchResultsSize', e.target.value, Infinity);
        params.maxSearchResultsSize = e.target.value;
        titleSearchRangeVal.textContent = e.target.value;
    });
    document.getElementById('titleSearchRange').addEventListener('input', function(e) {
        titleSearchRangeVal.textContent = e.target.value;
    });
    document.getElementById('modesLink').addEventListener('click', function () {
        document.getElementById('btnAbout').click();
        // We have to use a timeout or the scroll is cancelled by the slide transtion animation
        // @TODO This is a workaround. The regression should be fixed as it affects the Active content warning
        // links as well.
        setTimeout(function () {
            document.getElementById('modes').scrollIntoView();
        }, 600);
    });

    //Adds an event listener to kiwix logo and bottom navigation bar which gets triggered when these elements are dragged.
    //Returning false prevents their dragging (which can cause some unexpected behavior)
    //Doing that in javascript is the only way to make it cross-browser compatible
    document.getElementById('kiwixLogo').ondragstart=function () {return false;}
    document.getElementById('navigationButtons').ondragstart=function () {return false;}

    //focus search bar (#prefix) if Home key is pressed
    function focusPrefixOnHomeKey(event) {
        //check if home key is pressed
        if (event.key === 'Home') {
            // wait to prevent interference with scrolling (default action)
            setTimeout(function() {
                document.getElementById('prefix').focus();
            },0);
        }
    }
    //switch on/off the feature to use Home Key to focus search bar
    function switchHomeKeyToFocusSearchBar() {
        var iframeContentWindow = document.getElementById('articleContent').contentWindow;
        // Test whether iframe is accessible (because if not, we do not want to throw an error at this point, before we can tell the user what is wrong)
        var isIframeAccessible = true;
        try {
            iframeContentWindow.removeEventListener('keydown', focusPrefixOnHomeKey);
        }
        catch (err) {
            console.error('The iframe is probably not accessible', err);
            isIframeAccessible = false;
        }
        if (!isIframeAccessible) return;
        // when the feature is in active state
        if (params.useHomeKeyToFocusSearchBar) {
            //Handle Home key press inside window(outside iframe) to focus #prefix
            window.addEventListener('keydown', focusPrefixOnHomeKey);
            //only for initial empty iFrame loaded using `src` attribute
            //in any other case listener gets removed on reloading of iFrame content
            iframeContentWindow.addEventListener('keydown', focusPrefixOnHomeKey);
        }
        // when the feature is not active
        else {
            //remove event listener for window(outside iframe)
            window.removeEventListener('keydown', focusPrefixOnHomeKey);
            //if feature is deactivated and no zim content is loaded yet
            iframeContentWindow.removeEventListener('keydown', focusPrefixOnHomeKey);
        }
    }
    /**
     * Displays or refreshes the API status shown to the user
     */
    function refreshAPIStatus() {
        var apiStatusPanel = document.getElementById('apiStatusDiv');
        apiStatusPanel.classList.remove('card-success', 'card-warning', 'card-danger');
        var apiPanelClass = 'card-success';
        if (isMessageChannelAvailable()) {
            $('#messageChannelStatus').html("MessageChannel API available");
            $('#messageChannelStatus').removeClass("apiAvailable apiUnavailable")
                    .addClass("apiAvailable");
        } else {
            apiPanelClass = 'card-warning';
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
                apiPanelClass = 'card-warning';
                $('#serviceWorkerStatus').html("ServiceWorker API available, but not registered");
                $('#serviceWorkerStatus').removeClass("apiAvailable apiUnavailable")
                        .addClass("apiUnavailable");
            }
        } else {
            apiPanelClass = 'card-warning';
            $('#serviceWorkerStatus').html("ServiceWorker API unavailable");
            $('#serviceWorkerStatus').removeClass("apiAvailable apiUnavailable")
                    .addClass("apiUnavailable");
        }
        // Update Settings Store section of API panel with API name
        var settingsStoreStatusDiv = document.getElementById('settingsStoreStatus');
        var apiName = params.storeType === 'cookie' ? 'Cookie' : params.storeType === 'local_storage' ? 'Local Storage' : 'None';
        settingsStoreStatusDiv.innerHTML = 'Settings Storage API in use: ' + apiName;
        settingsStoreStatusDiv.classList.remove('apiAvailable', 'apiUnavailable');
        settingsStoreStatusDiv.classList.add(params.storeType === 'none' ? 'apiUnavailable' : 'apiAvailable');
        apiPanelClass = params.storeType === 'none' ? 'card-warning' : apiPanelClass;
        // Update Decompressor API section of panel
        var decompAPIStatusDiv = document.getElementById('decompressorAPIStatus');
        apiName = params.decompressorAPI.assemblerMachineType;
        apiPanelClass = params.decompressorAPI.errorStatus ? 'card-danger' : apiName === 'WASM' ? apiPanelClass : 'card-warning';
        decompAPIStatusDiv.className = apiName ? params.decompressorAPI.errorStatus ? 'apiBroken' : apiName === 'WASM' ? 'apiAvailable' : 'apiSuboptimal' : 'apiUnavailable';
        // Add the last used decompressor, if known, to the apiName
        if (apiName && params.decompressorAPI.decompressorLastUsed) {
            apiName += ' [&nbsp;' + params.decompressorAPI.decompressorLastUsed + '&nbsp;]';
        }
        apiName = params.decompressorAPI.errorStatus || apiName || 'Not initialized';
        decompAPIStatusDiv.innerHTML = 'Decompressor API: ' + apiName;
        // Add a warning colour to the API Status Panel if any of the above tests failed
        apiStatusPanel.classList.add(apiPanelClass);

        // Set visibility of UI elements according to mode
        document.getElementById('bypassAppCacheDiv').style.display = params.contentInjectionMode === 'serviceworker' ? 'block' : 'none';
    }

    /**
     * Queries Service Worker if possible to determine cache capability and returns an object with cache attributes
     * If Service Worker is not available, the attributes of the memory cache are returned instead
     * @returns {Promise<Object>} A Promise for an object with cache attributes 'type', 'description', and 'count'
     */
    function getAssetsCacheAttributes() {
        return new Promise(function (resolve, reject) {
            if (params.contentInjectionMode === 'serviceworker' && navigator.serviceWorker && navigator.serviceWorker.controller) {
                // Create a Message Channel
                var channel = new MessageChannel();
                // Handler for recieving message reply from service worker
                channel.port1.onmessage = function (event) {
                    var cache = event.data;
                    if (cache.error) reject(cache.error);
                    else resolve(cache);
                };
                // Ask Service Worker for its cache status and asset count
                navigator.serviceWorker.controller.postMessage({
                    'action': {
                        'assetsCache': params.assetsCache ? 'enable' : 'disable',
                        'appCache': params.appCache ? 'enable' : 'disable',
                        'checkCache': window.location.href
                    }
                }, [channel.port2]);
            } else {
                // No Service Worker has been established, so we resolve the Promise with cssCache details only
                resolve({
                    'type': params.assetsCache ? 'memory' : 'none',
                    'name': 'cssCache',
                    'description': params.assetsCache ? 'Memory' : 'None',
                    'count': cssCache.size
                });
            }
        });
    }

    /** 
     * Refreshes the UI (Configuration) with the cache attributes obtained from getAssetsCacheAttributes()
     */
    function refreshCacheStatus() {
        // Update radio buttons and checkbox
        document.getElementById('cachedAssetsModeRadio' + (params.assetsCache ? 'True' : 'False')).checked = true;
        // Get cache attributes, then update the UI with the obtained data
        getAssetsCacheAttributes().then(function (cache) {
            if (cache.type === 'cacheAPI' && ASSETS_CACHE !== cache.name) {
                console.error('DEV: The ASSETS_CACHE defined in app.js does not match the ASSETS_CACHE defined in service-worker.js!');
            }
            document.getElementById('cacheUsed').innerHTML = cache.description;
            document.getElementById('assetsCount').innerHTML = cache.count;
            var cacheSettings = document.getElementById('performanceSettingsDiv');
            var cacheStatusPanel = document.getElementById('cacheStatusPanel');
            [cacheSettings, cacheStatusPanel].forEach(function (card) {
                // IE11 cannot remove more than one class from a list at a time
                card.classList.remove('card-success');
                card.classList.remove('card-warning');
                if (params.assetsCache) card.classList.add('card-success');
                else card.classList.add('card-warning');
            });
        });
    }

    var keepAliveServiceWorkerHandle;
    var serviceWorkerRegistration;
    
    /**
     * Send an 'init' message to the ServiceWorker with a new MessageChannel
     * to initialize it, or to keep it alive.
     * This MessageChannel allows a 2-way communication between the ServiceWorker
     * and the application
     */
    function initOrKeepAliveServiceWorker() {
        var delay = DELAY_BETWEEN_KEEPALIVE_SERVICEWORKER;
        if (params.contentInjectionMode === 'serviceworker') {
            // Create a new messageChannel
            var tmpMessageChannel = new MessageChannel();
            tmpMessageChannel.port1.onmessage = handleMessageChannelMessage;
            // Send the init message to the ServiceWorker, with this MessageChannel as a parameter
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    'action': 'init'
                }, [tmpMessageChannel.port2]);
            } else if (keepAliveServiceWorkerHandle) {
                console.error('The Service Worker is active but is not controlling the current page! We have to reload.');
                window.location.reload();
            } else {
                // If this is the first time we are initiating the SW, allow Promises to complete by delaying potential reload till next tick
                delay = 0;
            }
            messageChannel = tmpMessageChannel;
            // Schedule to do it again regularly to keep the 2-way communication alive.
            // See https://github.com/kiwix/kiwix-js/issues/145 to understand why
            clearTimeout(keepAliveServiceWorkerHandle);
            keepAliveServiceWorkerHandle = setTimeout(initOrKeepAliveServiceWorker, delay, false);
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
        params.contentInjectionMode = value;
        if (value === 'jquery') {
            if (!params.appCache) {
                alert('You must deselect the "Bypass AppCache" option before switching to JQuery mode!');
                setContentInjectionMode('serviceworker');
                return;
            }
            if (params.referrerExtensionURL) {
                // We are in an extension, and the user may wish to revert to local code
                var message = 'This will switch to using locally packaged code only. Some configuration settings may be lost.\n\n' +
                'WARNING: After this, you may not be able to switch back to SW mode without an online connection!';
                var launchLocal = function () {
                    settingsStore.setItem('allowInternetAccess', false, Infinity);
                    var uriParams = '?allowInternetAccess=false&contentInjectionMode=jquery&hideActiveContentWarning=false';
                    uriParams += '&appTheme=' + params.appTheme;
                    uriParams += '&showUIAnimations=' + params.showUIAnimations; 
                    window.location.href = params.referrerExtensionURL + '/www/index.html' + uriParams;
                    'Beam me down, Scotty!';
                };
                var response = confirm(message);
                if (response) {
                    launchLocal();
                } else {
                    setContentInjectionMode('serviceworker');
                }
                return;
            }
            // Because the Service Worker must still run in a PWA app so that it can work offline, we don't actually disable the SW in this context,
            // but it will no longer be intercepting requests for ZIM assets (only requests for the app's own code)
            if (isServiceWorkerAvailable()) {
                serviceWorkerRegistration = null;
            }
            refreshAPIStatus();
            // User has switched to jQuery mode, so no longer needs ASSETS_CACHE
            // We should empty it and turn it off to prevent unnecessary space usage
            if ('caches' in window && isMessageChannelAvailable()) {
                var channel = new MessageChannel();
                if (isServiceWorkerAvailable() && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        'action': { 'assetsCache': 'disable' }
                    }, [channel.port2]);
                }
                caches.delete(ASSETS_CACHE);
            }
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
            var protocol = window.location.protocol;
            if (!isServiceWorkerReady()) {
                $('#serviceWorkerStatus').html("ServiceWorker API available : trying to register it...");
                if (navigator.serviceWorker.controller) {
                    console.log("Active service worker found, no need to register");
                    serviceWorkerRegistration = true;
                    // Remove any jQuery hooks from a previous jQuery session
                    $('#articleContent').contents().remove();
                    // Create the MessageChannel and send 'init'
                    initOrKeepAliveServiceWorker();
                    refreshAPIStatus();
                } else {
                    navigator.serviceWorker.register('../service-worker.js').then(function (reg) {
                        // The ServiceWorker is registered
                        serviceWorkerRegistration = reg;
                        // We need to wait for the ServiceWorker to be activated
                        // before sending the first init message
                        var serviceWorker = reg.installing || reg.waiting || reg.active;
                        serviceWorker.addEventListener('statechange', function(statechangeevent) {
                            if (statechangeevent.target.state === 'activated') {
                                // Remove any jQuery hooks from a previous jQuery session
                                $('#articleContent').contents().remove();
                                // Create the MessageChannel and send the 'init' message to the ServiceWorker
                                initOrKeepAliveServiceWorker();
                                // We need to refresh cache status here on first activation because SW was inaccessible till now
                                // We also initialize the ASSETS_CACHE constant in SW here
                                refreshCacheStatus();
                                refreshAPIStatus();
                            }
                        });
                        if (serviceWorker.state === 'activated') {
                            // Even if the ServiceWorker is already activated,
                            // We need to re-create the MessageChannel
                            // and send the 'init' message to the ServiceWorker
                            // in case it has been stopped and lost its context
                            initOrKeepAliveServiceWorker();
                        }
                        refreshCacheStatus();
                        refreshAPIStatus();
                    }).catch(function (err) {
                        if (protocol === 'moz-extension:') {
                            launchMozillaExtensionServiceWorker();
                        } else {
                            console.error('Error while registering serviceWorker', err);
                            refreshAPIStatus();
                            var message = "The ServiceWorker could not be properly registered. Switching back to jQuery mode. Error message : " + err;
                            if (protocol === 'file:') {
                                message += "\n\nYou seem to be opening kiwix-js with the file:// protocol. You should open it through a web server : either through a local one (http://localhost/...) or through a remote one (but you need SSL : https://webserver/...)";
                            }
                            alert(message);                        
                            setContentInjectionMode("jquery");
                        }
                    });
                }
            } else {
                // We need to reactivate Service Worker
                initOrKeepAliveServiceWorker();
            }
            // User has switched to Service Worker mode, so no longer needs the memory cache
            // We should empty it to ensure good memory management
            resetCssCache();
        }
        $('input:radio[name=contentInjectionMode]').prop('checked', false);
        $('input:radio[name=contentInjectionMode]').filter('[value="' + value + '"]').prop('checked', true);
        // Save the value in the Settings Store, so that to be able to keep it after a reload/restart
        settingsStore.setItem('contentInjectionMode', value, Infinity);
        refreshCacheStatus();
        refreshAPIStatus();
    }
    
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

    function launchMozillaExtensionServiceWorker () {
        // DEV: See explanation below for why we access localStorage directly here 
        var PWASuccessfullyLaunched = localStorage.getItem(params.keyPrefix + 'PWA_launch') === 'success';
        var allowInternetAccess = settingsStore.getItem('allowInternetAccess') === 'true';
        var message = 'To enable the Service Worker, we need one-time access to our secure server ' + 
            'so that the app can re-launch as a Progressive Web App (PWA).\n\n' +
            'The PWA will be able to run offline, but will auto-update periodically when online ' + 
            'as per the Service Worker spec.\n\n' +
            'You can switch back any time by returning to JQuery mode.\n\n' +
            'WARNING: This will attempt to access the following server: \n' + params.PWAServer + '\n';
        var launchPWA = function () {
            uiUtil.spinnerDisplay(false);
            var uriParams = '?contentInjectionMode=serviceworker&allowInternetAccess=true';
            uriParams += '&referrerExtensionURL=' + encodeURIComponent(window.location.href.replace(/\/www\/index.html.*$/i, ''));
            if (!PWASuccessfullyLaunched || !allowInternetAccess) {
                // Add any further params that should only be passed when the user is intentionally switching to SW mode
                uriParams += '&appTheme=' + params.appTheme;
                uriParams += '&showUIAnimations=' + params.showUIAnimations;
            }
            settingsStore.setItem('contentInjectionMode', 'serviceworker', Infinity);
            // This is needed so that we get passthrough on subsequent launches
            settingsStore.setItem('allowInternetAccess', true, Infinity);
            // Signal failure of PWA until it has successfully launched (in init.js it will be changed to 'success')
            // DEV: We write directly to localStorage instead of using settingsStore here because we need 100% certainty
            // regarding the location of the key to be able to retrieve it in init.js before settingsStore is initialized
            localStorage.setItem(params.keyPrefix + 'PWA_launch', 'fail');
            window.location.href = params.PWAServer + 'www/index.html' + uriParams;
            'Beam me up, Scotty!';
        };
        var checkPWAIsOnline = function () {
            uiUtil.spinnerDisplay(true, 'Checking server access...');
            uiUtil.checkServerIsAccessible(params.PWAServer + 'www/img/icons/kiwix-32.png', launchPWA, function () {
                uiUtil.spinnerDisplay(false);
                alert('The server is not currently accessible! ' +
                    '\n\n(Kiwix needs one-time access to the server to cache the PWA).' +
                    '\nPlease try again when you have a stable Internet connection.', 'Error!');
                settingsStore.setItem('allowInternetAccess', false, Infinity);
                setContentInjectionMode('jquery');
            });
        };
        var response;
        if (settingsStore.getItem('allowInternetAccess') === 'true') {
            if (PWASuccessfullyLaunched) {
                launchPWA();
            } else {
                response = confirm('The last attempt to launch the PWA appears to have failed.\n\nDo you wish to try again?');
                if (response) {
                    checkPWAIsOnline();
                } else {
                    settingsStore.setItem('allowInternetAccess', false, Infinity);
                    setContentInjectionMode('jquery');
                }
            }
        } else {
            response = confirm(message);
            if (response) checkPWAIsOnline();
            else {
                setContentInjectionMode('jquery');
                settingsStore.setItem('allowInternetAccess', false, Infinity);
            }    
        }
    }
    
    /**
     * 
     * @type Array.<StorageFirefoxOS>
     */
    var storages = [];
    function searchForArchivesInPreferencesOrStorage() {
        // First see if the list of archives is stored in the Settings Store
        var listOfArchivesFromSettingsStore = settingsStore.getItem("listOfArchives");
        if (listOfArchivesFromSettingsStore !== null && listOfArchivesFromSettingsStore !== undefined && listOfArchivesFromSettingsStore !== "") {
            var directories = listOfArchivesFromSettingsStore.split('|');
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
            $('.navbar-collapse').collapse('hide');
            $('#configuration').hide();
            $('#articleListWithHeader').hide();
            $('#articleContent').contents().empty();
            
            if (title && !(""===title)) {
                goToArticle(title);
            }
            else if (titleSearch && titleSearch !== '') {
                $('#prefix').val(titleSearch);
                if (titleSearch !== appstate.search.prefix) {
                    searchDirEntriesFromPrefix(titleSearch);
                } else {
                    $('#prefix').focus();
                }
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
        // Store the list of archives in the Settings Store, to avoid rescanning at each start
        settingsStore.setItem("listOfArchives", archiveDirectories.join('|'), Infinity);
        
        $('#archiveList').on('change', setLocalArchiveFromArchiveList);
        if (comboArchiveList.options.length > 0) {
            var lastSelectedArchive = settingsStore.getItem("lastSelectedArchive");
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
            var regexpStorageName = /^\/([^/]+)\//;
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
            selectedArchive = zimArchiveLoader.loadArchiveFromDeviceStorage(selectedStorage, archiveDirectory, function () {
                settingsStore.setItem("lastSelectedArchive", archiveDirectory, Infinity);
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
        document.getElementById('openLocalFiles').style.display = 'block';
        // Set the main drop zone
        configDropZone.addEventListener('dragover', handleGlobalDragover);
        configDropZone.addEventListener('dragleave', function() {
            configDropZone.style.border = '';
        });
        // Also set a global drop zone (allows us to ensure Config is always displayed for the file drop)
        globalDropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (configDropZone.style.display === 'none') document.getElementById('btnConfigure').click();
            e.dataTransfer.dropEffect = 'link';
        });
        globalDropZone.addEventListener('drop', handleFileDrop);
        // This handles use of the file picker
        document.getElementById('archiveFiles').addEventListener('change', setLocalArchiveFromFileSelect);
    }

    function handleGlobalDragover(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'link';
        configDropZone.style.border = '3px dotted red';
    }

    function handleIframeDragover(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'link';
        document.getElementById('btnConfigure').click();
    }

    function handleIframeDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        return;
    }

    function handleFileDrop(packet) {
        packet.stopPropagation();
        packet.preventDefault();
        configDropZone.style.border = '';
        var files = packet.dataTransfer.files;
        document.getElementById('openLocalFiles').style.display = 'none';
        document.getElementById('downloadInstruction').style.display = 'none';
        document.getElementById('selectorsDisplay').style.display = 'inline';
        setLocalArchiveFromFileList(files);
        // This clears the display of any previously picked archive in the file selector
        document.getElementById('archiveFiles').value = null;
    }

    // Add event listener to link which allows user to show file selectors
    document.getElementById('selectorsDisplayLink').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('openLocalFiles').style.display = 'block';
        document.getElementById('selectorsDisplay').style.display = 'none';
    });

    function setLocalArchiveFromFileList(files) {
        // Check for usable file types
        for (var i = files.length; i--;) {
            // DEV: you can support other file types by adding (e.g.) '|dat|idx' after 'zim\w{0,2}'
            if (!/\.(?:zim\w{0,2})$/i.test(files[i].name)) {
                alert("One or more files does not appear to be a ZIM file!");
                return;
            }
        }
        resetCssCache();
        selectedArchive = zimArchiveLoader.loadArchiveFromFiles(files, function () {
            // The archive is set : go back to home page to start searching
            $("#btnHome").click();
            document.getElementById('downloadInstruction').style.display = 'none';
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
     * @param {String} url The URL of the archive to read
     * @returns {Promise<Blob>} A promise for the requested file (blob)
     */
    function readRemoteArchive(url) {
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open("GET", url);
            request.responseType = "blob";
            request.onreadystatechange = function () {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status >= 200 && request.status < 300 || request.status === 0) {
                        // Hack to make this look similar to a file
                        request.response.name = url;
                        resolve(request.response);
                    } else {
                        reject("HTTP status " + request.status + " when reading " + url);
                    }
                }
            };
            request.onabort = request.onerror = reject;
            request.send();
        });
    }
    
    /**
     * This is used in the testing interface to inject remote archives
     * @returns {Promise<Array>} A Promise for an array of archives  
     */
    window.setRemoteArchives = function () {
        var readRequests = [];
        Array.prototype.slice.call(arguments).forEach(function (arg) {
            readRequests.push(readRemoteArchive(arg));
        });
        return Promise.all(readRequests).then(function (arrayOfArchives) {
            setLocalArchiveFromFileList(arrayOfArchives);
        }).catch(function (e) {
            console.error('Unable to load remote archive(s)', e);
        });
    };

    /**
     * Handle key input in the prefix input zone
     * @param {Event} evt The event data to handle
     */
    function onKeyUpPrefix() {
        // Use a timeout, so that very quick typing does not cause a lot of overhead
        // It is also necessary for the words suggestions to work inside Firefox OS
        if (window.timeoutKeyUpPrefix) {
            window.clearTimeout(window.timeoutKeyUpPrefix);
        }
        window.timeoutKeyUpPrefix = window.setTimeout(function () {
            var prefix = $("#prefix").val();
            if (prefix && prefix.length > 0 && prefix !== appstate.search.prefix) {
                $('#searchArticles').click();
            }
        }, 500);
    }

    /**
     * Search the index for DirEntries with title that start with the given prefix (implemented
     * with a binary search inside the index file)
     * @param {String} prefix The string that must appear at the start of any title searched for
     */
    function searchDirEntriesFromPrefix(prefix) {
        if (selectedArchive !== null && selectedArchive.isReady()) {
            // Cancel the old search (zimArchive search object will receive this change)
            appstate.search.status = 'cancelled';
            // Initiate a new search object and point appstate.search to it (the zimArchive search object will continue to point to the old object)
            // DEV: Technical explanation: the appstate.search is a pointer to an underlying object assigned in memory, and we are here defining a new object
            // in memory {'prefix': prefix, 'status': 'init', .....}, and pointing appstate.search to it; the old search object that was passed to selectedArchive
            // (zimArchive.js) continues to exist in the scope of the functions initiated by the previous search until all Promises have returned
            appstate.search = {'prefix': prefix, 'status': 'init', 'type': '', 'size': params.maxSearchResultsSize};
            $('#activeContent').hide();
            selectedArchive.findDirEntriesWithPrefix(appstate.search, populateListOfArticles);
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
     * @param {Object} reportingSearch The reporting search object
     */
    function populateListOfArticles(dirEntryArray, reportingSearch) {
        // Do not allow cancelled searches to report
        if (reportingSearch.status === 'cancelled') return;
        var stillSearching = reportingSearch.status === 'interim';
        var articleListHeaderMessageDiv = $('#articleListHeaderMessage');
        var nbDirEntry = dirEntryArray ? dirEntryArray.length : 0;

        var message;
        if (stillSearching) {
            message = 'Searching [' + reportingSearch.type + ']... found: ' + nbDirEntry;
        } else if (nbDirEntry >= params.maxSearchResultsSize) {
            message = 'First ' + params.maxSearchResultsSize + ' articles found (refine your search).';
        } else {
            message = 'Finished. ' + (nbDirEntry ? nbDirEntry : 'No') + ' articles found' + (
                reportingSearch.type === 'basic' ? ': try fewer words for full search.' : '.'
            );
        }

        articleListHeaderMessageDiv.html(message);

        var articleListDiv = $('#articleList');
        var articleListDivHtml = '';
        var listLength = dirEntryArray.length < params.maxSearchResultsSize ? dirEntryArray.length : params.maxSearchResultsSize;
        for (var i = 0; i < listLength; i++) {
            var dirEntry = dirEntryArray[i];
            // NB We use encodeURIComponent rather than encodeURI here because we know that any question marks in the title are not querystrings,
            // and should be encoded [kiwix-js #806]. DEV: be very careful if you edit the dirEntryId attribute below, because the contents must be
            // inside double quotes (in the final HTML string), given that dirEntryStringId may contain bare apostrophes
            // Info: encodeURIComponent encodes all characters except  A-Z a-z 0-9 - _ . ! ~ * ' ( ) 
            var dirEntryStringId = encodeURIComponent(dirEntry.toStringId());
            articleListDivHtml += '<a href="#" dirEntryId="' + dirEntryStringId +
                '" class="list-group-item">' + dirEntry.getTitleOrUrl() + '</a>';
        }
        articleListDiv.html(articleListDivHtml);
        // We have to use mousedown below instead of click as otherwise the prefix blur event fires first 
        // and prevents this event from firing; note that touch also triggers mousedown
        $('#articleList a').on('mousedown', function (e) {
            // Cancel search immediately
            appstate.search.status = 'cancelled';
            handleTitleClick(e);
            return false;
        });
        if (!stillSearching) $('#searchingArticles').hide();
        $('#articleListWithHeader').show();
    }

    /**
     * Handles the click on the title of an article in search results
     * @param {Event} event The click event to handle
     * @returns {Boolean} Always returns false for JQuery event handling
     */
    function handleTitleClick(event) {       
        var dirEntryId = decodeURIComponent(event.target.getAttribute('dirEntryId'));
        findDirEntryFromDirEntryIdAndLaunchArticleRead(dirEntryId);
        return false;
    }

    /**
     * Creates an instance of DirEntry from given dirEntryId (including resolving redirects),
     * and call the function to read the corresponding article
     * @param {String} dirEntryId The stringified Directory Entry to parse and launch
     */
    function findDirEntryFromDirEntryIdAndLaunchArticleRead(dirEntryId) {
        if (selectedArchive.isReady()) {
            var dirEntry = selectedArchive.parseDirEntryId(dirEntryId);
            // Remove focus from search field to hide keyboard and to allow navigation keys to be used
            document.getElementById('articleContent').contentWindow.focus();
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
     * Check whether the given URL from given dirEntry equals the expectedArticleURLToBeDisplayed
     * @param {DirEntry} dirEntry The directory entry of the article to read
     */
    function isDirEntryExpectedToBeDisplayed(dirEntry) {
        var curArticleURL = dirEntry.namespace + "/" + dirEntry.url;

        if (expectedArticleURLToBeDisplayed !== curArticleURL) {
            console.debug("url of current article :" + curArticleURL + ", does not match the expected url :" + 
            expectedArticleURLToBeDisplayed);
            return false;
        }
        return true;
    }

    /**
     * Read the article corresponding to the given dirEntry
     * @param {DirEntry} dirEntry The directory entry of the article to read
     */
    function readArticle(dirEntry) {
        // Reset search prefix to allow users to search the same string again if they want to
        appstate.search.prefix = '';
        // Only update for expectedArticleURLToBeDisplayed.
        expectedArticleURLToBeDisplayed = dirEntry.namespace + "/" + dirEntry.url;
        // We must remove focus from UI elements in order to deselect whichever one was clicked (in both jQuery and SW modes),
        // but we should not do this when opening the landing page (or else one of the Unit Tests fails, at least on Chrome 58)
        if (!params.isLandingPage) document.getElementById('articleContent').contentWindow.focus();

        if (params.contentInjectionMode === 'serviceworker') {
            // In ServiceWorker mode, we simply set the iframe src.
            // (reading the backend is handled by the ServiceWorker itself)

            // We will need the encoded URL on article load so that we can set the iframe's src correctly,
            // but we must not encode the '/' character or else relative links may fail [kiwix-js #498]
            var encodedUrl = dirEntry.url.replace(/[^/]+/g, function (matchedSubstring) {
                return encodeURIComponent(matchedSubstring);
            });
            var iframeArticleContent = document.getElementById('articleContent');
            iframeArticleContent.onload = function () {
                // The content is fully loaded by the browser : we can hide the spinner
                $("#cachingAssets").html("Caching assets...");
                $("#cachingAssets").hide();
                $("#searchingArticles").hide();
                // Set the requested appTheme
                uiUtil.applyAppTheme(params.appTheme);
                // Display the iframe content
                $("#articleContent").show();
                // Deflect drag-and-drop of ZIM file on the iframe to Config
                var doc = iframeArticleContent.contentDocument ? iframeArticleContent.contentDocument.documentElement : null;
                var docBody = doc ? doc.getElementsByTagName('body') : null;
                docBody = docBody ? docBody[0] : null;
                if (docBody) {
                    docBody.addEventListener('dragover', handleIframeDragover);
                    docBody.addEventListener('drop', handleIframeDrop);
                }
                resizeIFrame();

                if (iframeArticleContent.contentWindow) {
                    // Configure home key press to focus #prefix only if the feature is in active state
                    if (params.useHomeKeyToFocusSearchBar)
                        iframeArticleContent.contentWindow.addEventListener('keydown', focusPrefixOnHomeKey);
                    // Reset UI when the article is unloaded
                    iframeArticleContent.contentWindow.onunload = function () {
                        // remove eventListener to avoid memory leaks
                        iframeArticleContent.contentWindow.removeEventListener('keydown', focusPrefixOnHomeKey);
                        $("#articleList").empty();
                        $('#articleListHeaderMessage').empty();
                        $('#articleListWithHeader').hide();
                        $("#prefix").val("");
                        $("#searchingArticles").show();
                    };
                }
            };

            if(! isDirEntryExpectedToBeDisplayed(dirEntry)){
                return;
            } 

            // We put the ZIM filename as a prefix in the URL, so that browser caches are separate for each ZIM file
            iframeArticleContent.src = "../" + selectedArchive._file.name + "/" + dirEntry.namespace + "/" + encodedUrl;
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
     * 
     * @param {Event} event The event object of the message channel
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
                var readFile = function (dirEntry) {
                    if (dirEntry === null) {
                        console.error("Title " + title + " not found in archive.");
                        messagePort.postMessage({ 'action': 'giveContent', 'title': title, 'content': '' });
                    } else if (dirEntry.isRedirect()) {
                        selectedArchive.resolveRedirect(dirEntry, function (resolvedDirEntry) {
                            var redirectURL = resolvedDirEntry.namespace + "/" + resolvedDirEntry.url;
                            // Ask the ServiceWork to send an HTTP redirect to the browser.
                            // We could send the final content directly, but it is necessary to let the browser know in which directory it ends up.
                            // Else, if the redirect URL is in a different directory than the original URL,
                            // the relative links in the HTML content would fail. See #312
                            messagePort.postMessage({ 'action': 'sendRedirect', 'title': title, 'redirectUrl': redirectURL });
                        });
                    } else {
                        // Let's read the content in the ZIM file
                        selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                            var mimetype = fileDirEntry.getMimetype();
                            // Let's send the content to the ServiceWorker
                            var message = { 'action': 'giveContent', 'title': title, 'content': content.buffer, 'mimetype': mimetype };
                            messagePort.postMessage(message, [content.buffer]);
                        });
                    }
                };
                selectedArchive.getDirEntryByPath(title).then(readFile).catch(function () {
                    messagePort.postMessage({ 'action': 'giveContent', 'title': title, 'content': new Uint8Array() });
                });
            } else {
                console.error("Invalid message received", event.data);
            }
        }
    }
    
    // Compile some regular expressions needed to modify links
    // Pattern to find a ZIM URL (with its namespace) - see https://wiki.openzim.org/wiki/ZIM_file_format#Namespaces
    var regexpZIMUrlWithNamespace = /^[./]*([-ABCIJMUVWX]\/.+)$/;
    // The case-insensitive regex below finds images, scripts, stylesheets and tracks with ZIM-type metadata and image namespaces.
    // It first searches for <img, <script, <link, etc., then scans forward to find, on a word boundary, either src=["'] or href=["']
    // (ignoring any extra whitespace), and it then tests the path of the URL with a non-capturing negative lookahead (?!...) that excludes
    // absolute URIs with protocols that conform to RFC 3986 (e.g. 'http:', 'data:'). It then captures the whole of the URL up until either
    // the opening delimiter (" or ', which is capture group \3) or a querystring or hash character (? or #). When the regex is used
    // below, it will be further processed to calculate the ZIM URL from the relative path. This regex can cope with legitimate single
    // quote marks (') in the URL.
    var regexpTagsWithZimUrl = /(<(?:img|script|link|track)\b[^>]*?\s)(?:src|href)(\s*=\s*(["']))(?![a-z][a-z0-9+.-]+:)(.+?)(?=\3|\?|#)/ig;
    // Regex below tests the html of an article for active content [kiwix-js #466]
    // It inspects every <script> block in the html and matches in the following cases: 1) the script loads a UI application called app.js;
    // 2) the script block has inline content that does not contain "importScript()", "toggleOpenSection" or an "articleId" assignment
    // (these strings are used widely in our fully supported wikimedia ZIMs, so they are excluded); 3) the script block is not of type "math" 
    // (these are MathJax markup scripts used extensively in Stackexchange ZIMs). Note that the regex will match ReactJS <script type="text/html">
    // markup, which is common in unsupported packaged UIs, e.g. PhET ZIMs.
    var regexpActiveContent = /<script\b(?:(?![^>]+src\b)|(?=[^>]+src\b=["'][^"']+?app\.js))(?!>[^<]+(?:importScript\(\)|toggleOpenSection|articleId\s?=\s?['"]))(?![^>]+type\s*=\s*["'](?:math\/|[^"']*?math))/i;
    // DEV: The regex below matches ZIM links (anchor hrefs) that should have the html5 "donwnload" attribute added to 
    // the link. This is currently the case for epub and pdf files in Project Gutenberg ZIMs -- add any further types you need
    // to support to this regex. The "zip" has been added here as an example of how to support further filetypes
    var regexpDownloadLinks = /^.*?\.epub($|\?)|^.*?\.pdf($|\?)|^.*?\.zip($|\?)/i;

    // A string to hold any anchor parameter in clicked ZIM URLs (as we must strip these to find the article in the ZIM)
    var anchorParameter;

    /**
     * Display the the given HTML article in the web page,
     * and convert links to javascript calls
     * NB : in some error cases, the given title can be null, and the htmlArticle contains the error message
     * @param {DirEntry} dirEntry
     * @param {String} htmlArticle
     */
    function displayArticleContentInIframe(dirEntry, htmlArticle) {
        if(! isDirEntryExpectedToBeDisplayed(dirEntry)){
            return;
        }		
        // Display Bootstrap warning alert if the landing page contains active content
        if (!params.hideActiveContentWarning && params.isLandingPage) {
            if (regexpActiveContent.test(htmlArticle)) uiUtil.displayActiveContentWarning();
        }

        // Calculate the current article's ZIM baseUrl to use when processing relative links
        var baseUrl = dirEntry.namespace + '/' + dirEntry.url.replace(/[^/]+$/, '');

        // Replaces ZIM-style URLs of img, script, link and media tags with a data-kiwixurl to prevent 404 errors [kiwix-js #272 #376]
        // This replacement also processes the URL relative to the page's ZIM URL so that we can find the ZIM URL of the asset
        // with the correct namespace (this works for old-style -,I,J namespaces and for new-style C namespace)
        htmlArticle = htmlArticle.replace(regexpTagsWithZimUrl, function(match, blockStart, equals, quote, relAssetUrl) {
            var assetZIMUrl = uiUtil.deriveZimUrlFromRelativeUrl(relAssetUrl, baseUrl);
            // DEV: Note that deriveZimUrlFromRelativeUrl produces a *decoded* URL (and incidentally would remove any URI component
            // if we had captured it). We therefore re-encode the URI with encodeURI (which does not encode forward slashes) instead
            // of encodeURIComponent.
            return blockStart + 'data-kiwixurl' + equals + encodeURI(assetZIMUrl);
        });

        // Extract any css classes from the html tag (they will be stripped when injected in iframe with .innerHTML)
        var htmlCSS = htmlArticle.match(/<html[^>]*class\s*=\s*["']\s*([^"']+)/i);
        // Normalize classList and convert to array
        htmlCSS = htmlCSS ? htmlCSS[1].replace(/\s+/g, ' ').split(' ') : [];
        
        // Tell jQuery we're removing the iframe document: clears jQuery cache and prevents memory leaks [kiwix-js #361]
        $('#articleContent').contents().remove();

        // Hide any alert box that was activated in uiUtil.displayFileDownloadAlert function
        $('#downloadAlert').hide();

        var iframeArticleContent = document.getElementById('articleContent');
        
        iframeArticleContent.onload = function() {
            iframeArticleContent.onload = function(){};
            $("#articleList").empty();
            $('#articleListHeaderMessage').empty();
            $('#articleListWithHeader').hide();
            $("#prefix").val("");
            
            var iframeContentDocument = iframeArticleContent.contentDocument;
            if (!iframeContentDocument && window.location.protocol === 'file:') {
                alert("You seem to be opening kiwix-js with the file:// protocol, which is blocked by your browser for security reasons."
                        + "\nThe easiest way to run it is to download and run it as a browser extension (from the vendor store)."
                        + "\nElse you can open it through a web server : either through a local one (http://localhost/...) or through a remote one (but you need SSL : https://webserver/...)"
                        + "\nAnother option is to force your browser to accept that (but you'll open a security breach) : on Chrome, you can start it with --allow-file-access-from-files command-line argument; on Firefox, you can set privacy.file_unique_origin to false in about:config");
                return;
            }
            
            // Inject the new article's HTML into the iframe
            var articleContent = iframeContentDocument.documentElement;
            articleContent.innerHTML = htmlArticle;
            
            var docBody = articleContent.getElementsByTagName('body');
            docBody = docBody ? docBody[0] : null;
            if (docBody) {
                // Add any missing classes stripped from the <html> tag
                if (htmlCSS) htmlCSS.forEach(function (cl) {
                    docBody.classList.add(cl);
                });
                // Deflect drag-and-drop of ZIM file on the iframe to Config
                docBody.addEventListener('dragover', handleIframeDragover);
                docBody.addEventListener('drop', handleIframeDrop);
            }

            // Set the requested appTheme
            uiUtil.applyAppTheme(params.appTheme);
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
            // Jump to any anchor parameter
            if (anchorParameter) {
                var target = iframeContentDocument.getElementById(anchorParameter);
                if (target) target.scrollIntoView();
                anchorParameter = '';
            } 
            if (iframeArticleContent.contentWindow) {
                // Configure home key press to focus #prefix only if the feature is in active state
                if (params.useHomeKeyToFocusSearchBar)
                    iframeArticleContent.contentWindow.addEventListener('keydown', focusPrefixOnHomeKey);
                // when unloaded remove eventListener to avoid memory leaks
                iframeArticleContent.contentWindow.onunload = function () {
                    iframeArticleContent.contentWindow.removeEventListener('keydown', focusPrefixOnHomeKey);
                };
            }
        };
     
        // Load the blank article to clear the iframe (NB iframe onload event runs *after* this)
        iframeArticleContent.src = "article.html";

        function parseAnchorsJQuery() {
            var currentProtocol = location.protocol;
            var currentHost = location.host;
            // Percent-encode dirEntry.url and add regex escape character \ to the RegExp special characters - see https://www.regular-expressions.info/characters.html;
            // NB dirEntry.url can also contain path separator / in some ZIMs (Stackexchange). } and ] do not need to be escaped as they have no meaning on their own. 
            var escapedUrl = encodeURIComponent(dirEntry.url).replace(/([\\$^.|?*+/()[{])/g, '\\$1');
            // Pattern to match a local anchor in an href even if prefixed by escaped url; will also match # on its own
            // Note that we exclude any # with a semicolon between it and the end of the string, to avoid accidentally matching e.g. &#39;
            var regexpLocalAnchorHref = new RegExp('^(?:#|' + escapedUrl + '#)([^#;]*$)');
            var iframe = iframeArticleContent.contentDocument;
            Array.prototype.slice.call(iframe.querySelectorAll('a, area')).forEach(function (anchor) {
                // Attempts to access any properties of 'this' with malformed URLs causes app crash in Edge/UWP [kiwix-js #430]
                try {
                    var testHref = anchor.href;
                } catch (err) {
                    console.error('Malformed href caused error:' + err.message);
                    return;
                }
                var href = anchor.getAttribute('href');
                if (href === null || href === undefined || /^javascript:/i.test(anchor.protocol)) return;
                var anchorTarget = href.match(regexpLocalAnchorHref);
                if (href.length === 0) {
                    // It's a link with an empty href, pointing to the current page: do nothing.
                } else if (anchorTarget) {
                    // It's a local anchor link : remove escapedUrl if any (see above)
                    anchor.setAttribute('href', '#' + anchorTarget[1]);
                } else if (anchor.protocol !== currentProtocol ||
                    anchor.host !== currentHost) {
                    // It's an external URL : we should open it in a new tab
                    anchor.target = '_blank';
                } else {
                    // It's a link to an article or file in the ZIM
                    var uriComponent = uiUtil.removeUrlParameters(href);
                    var contentType;
                    var downloadAttrValue;
                    // Some file types need to be downloaded rather than displayed (e.g. *.epub)
                    // The HTML download attribute can be Boolean or a string representing the specified filename for saving the file
                    // For Boolean values, getAttribute can return any of the following: download="" download="download" download="true"
                    // So we need to test hasAttribute first: see https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute
                    // However, we cannot rely on the download attribute having been set, so we also need to test for known download file types
                    var isDownloadableLink = anchor.hasAttribute('download') || regexpDownloadLinks.test(href);
                    if (isDownloadableLink) {
                        downloadAttrValue = anchor.getAttribute('download');
                        // Normalize the value to a true Boolean or a filename string or true if there is no download attribute
                        downloadAttrValue = /^(download|true|\s*)$/i.test(downloadAttrValue) || downloadAttrValue || true;
                        contentType = anchor.getAttribute('type');
                    }
                    // Add an onclick event to extract this article or file from the ZIM
                    // instead of following the link
                    anchor.addEventListener('click', function (e) {
                        anchorParameter = href.match(/#([^#;]+)$/);
                        anchorParameter = anchorParameter ? anchorParameter[1] : '';
                        var zimUrl = uiUtil.deriveZimUrlFromRelativeUrl(uriComponent, baseUrl);
                        goToArticle(zimUrl, downloadAttrValue, contentType);
                        e.preventDefault();
                    });
                }
            });
        }
        
        function loadImagesJQuery() {
            // Make an array from the images that need to be processed
            var images = Array.prototype.slice.call(iframeArticleContent.contentDocument.querySelectorAll('img[data-kiwixurl]'));
            // This ensures cancellation of image extraction if the user navigates away from the page before extraction has finished
            images.owner = expectedArticleURLToBeDisplayed;
            // DEV: This self-invoking function is recursive, calling itself only when an image has been fully processed into a
            // blob: or data: URI (or returns an error). This ensures that images are processed sequentially from the top of the
            // DOM, making for a better user experience (because images above the fold are extracted first)
            (function extractImage() {
                if (!images.length || images.busy || images.owner !== expectedArticleURLToBeDisplayed) return;
                images.busy = true;
                // Extract the image at the top of the images array and remove it from the array
                var image = images.shift();
                var imageUrl = image.getAttribute('data-kiwixurl');
                var url = decodeURIComponent(imageUrl);
                selectedArchive.getDirEntryByPath(url).then(function (dirEntry) {
                    selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                        var mimetype = dirEntry.getMimetype();
                        uiUtil.feedNodeWithBlob(image, 'src', content, mimetype, function() {
                            images.busy = false;
                            extractImage();
                        });
                    });
                }).catch(function (e) {
                    console.error("could not find DirEntry for image:" + url, e);
                    images.busy = false;
                    extractImage();
                });
            })();
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
            var iframe = iframeArticleContent.contentDocument;
            var collapsedBlocks = iframe.querySelectorAll('.collapsible-block:not(.open-block), .collapsible-heading:not(.open-block)');
            // Using decrementing loop to optimize performance : see https://stackoverflow.com/questions/3520688 
            for (var i = collapsedBlocks.length; i--;) {
                collapsedBlocks[i].classList.add('open-block');
            }
            var cssCount = 0;
            var cssFulfilled = 0;
            Array.prototype.slice.call(iframe.querySelectorAll('link[data-kiwixurl]')).forEach(function (link) {
                cssCount++;
                var linkUrl = link.getAttribute('data-kiwixurl');
                var url = decodeURIComponent(uiUtil.removeUrlParameters(linkUrl));
                if (cssCache.has(url)) {
                    var nodeContent = cssCache.get(url);
                    if (/stylesheet/i.test(link.rel)) uiUtil.replaceCSSLinkWithInlineCSS(link, nodeContent);
                    else uiUtil.feedNodeWithBlob(link, 'href', nodeContent, link.type || 'image');
                    cssFulfilled++;
                } else {
                    if (params.assetsCache) $('#cachingAssets').show();
                    selectedArchive.getDirEntryByPath(url).then(function (dirEntry) {
                        if (!dirEntry) {
                            cssCache.set(url, ''); // Prevent repeated lookups of this unfindable asset
                            throw 'DirEntry ' + typeof dirEntry;
                        }
                        var mimetype = dirEntry.getMimetype();
                        var readFile = /^text\//i.test(mimetype) ? selectedArchive.readUtf8File : selectedArchive.readBinaryFile;
                        return readFile(dirEntry, function (fileDirEntry, content) {
                            var fullUrl = fileDirEntry.namespace + "/" + fileDirEntry.url;
                            if (params.assetsCache) cssCache.set(fullUrl, content);
                            if (/text\/css/i.test(mimetype)) uiUtil.replaceCSSLinkWithInlineCSS(link, content);
                            else uiUtil.feedNodeWithBlob(link, 'href', content, mimetype);
                            cssFulfilled++;
                            renderIfCSSFulfilled(fileDirEntry.url);
                        });
                    }).catch(function (e) {
                        console.error("Could not find DirEntry for link element: " + url, e);
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
                    $('#cachingAssets').html('Caching assets...');
                    $('#cachingAssets').hide();
                    $('#searchingArticles').hide();
                    $('#articleContent').show();
                    // We have to resize here for devices with On Screen Keyboards when loading from the article search list
                    resizeIFrame();
                } else {
                    updateCacheStatus(title);
                }
            }
        }

       /**
        * Code below is currently non-functional in jQuery mode, but provides an outline of how JS scripts could
        * be attached to the DOM. Users who want JS support should switch to Service Worker mode if avaialable on
        * their browser/OS. There is an experimental implementation of JS support in jQuery mode in the branch
        * <kiwix-js/javaScript-support>. 
        */
        // function loadJavaScriptJQuery() {
        //     $('#articleContent').contents().find('script[data-kiwixurl]').each(function() {
        //         var script = $(this);
        //         var scriptUrl = script.attr("data-kiwixurl");
        //         // TODO check that the type of the script is text/javascript or application/javascript
        //         var title = uiUtil.removeUrlParameters(scriptUrl);
        //         selectedArchive.getDirEntryByPath(title).then(function(dirEntry) {
        //             if (dirEntry === null) {
        //                 console.log("Error: js file not found: " + title);
        //             } else {
        //                 selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
        //                     // TODO : JavaScript support not yet functional [kiwix-js #152]
        //                     uiUtil.feedNodeWithBlob(script, 'src', content, 'text/javascript');
        //                 });
        //             }
        //         }).catch(function (e) {
        //             console.error("could not find DirEntry for javascript : " + title, e);
        //         });
        //     });
        // }

        function insertMediaBlobsJQuery() {
            var iframe = iframeArticleContent.contentDocument;
            Array.prototype.slice.call(iframe.querySelectorAll('video, audio, source, track'))
            .forEach(function(mediaSource) {
                var source = mediaSource.getAttribute('src');
                source = source ? uiUtil.deriveZimUrlFromRelativeUrl(source, baseUrl) : null;
                // We have to exempt text tracks from using deriveZimUrlFromRelativeurl due to a bug in Firefox [kiwix-js #496]
                source = source ? source : decodeURIComponent(mediaSource.dataset.kiwixurl);
                if (!source || !regexpZIMUrlWithNamespace.test(source)) {
                    if (source) console.error('No usable media source was found for: ' + source);
                    return;
                }
                var mediaElement = /audio|video/i.test(mediaSource.tagName) ? mediaSource : mediaSource.parentElement;
                // If the "controls" property is missing, we need to add it to ensure jQuery-only users can operate the video. See kiwix-js #760.
                if (/audio|video/i.test(mediaElement.tagName) && !mediaElement.hasAttribute('controls')) mediaElement.setAttribute('controls', ''); 
                selectedArchive.getDirEntryByPath(source).then(function(dirEntry) {
                    return selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, mediaArray) {
                        var mimeType = mediaSource.type ? mediaSource.type : dirEntry.getMimetype();
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
     * Displays a message to the user that a style or other asset is being cached
     * @param {String} title The title of the file to display in the caching message block 
     */
    function updateCacheStatus(title) {
        if (params.assetsCache && /\.css$|\.js$/i.test(title)) {
            var cacheBlock = document.getElementById('cachingAssets');
            cacheBlock.style.display = 'block';
            title = title.replace(/[^/]+\//g, '').substring(0,18);
            cacheBlock.innerHTML = 'Caching ' + title + '...';
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
     * Extracts the content of the given article pathname, or a downloadable file, from the ZIM
     * 
     * @param {String} path The pathname (namespace + filename) to the article or file to be extracted
     * @param {Boolean|String} download A Bolean value that will trigger download of title, or the filename that should
     *     be used to save the file in local FS (in HTML5 spec, a string value for the download attribute is optional)
     * @param {String} contentType The mimetype of the downloadable file, if known 
     */
    function goToArticle(path, download, contentType) {
        $("#searchingArticles").show();
        selectedArchive.getDirEntryByPath(path).then(function(dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                $("#searchingArticles").hide();
                alert("Article with url " + path + " not found in the archive");
            } else if (download) {
                selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                    var mimetype = contentType || fileDirEntry.getMimetype();
                    uiUtil.displayFileDownloadAlert(path, download, mimetype, content);
                });
            } else {
                params.isLandingPage = false;
                $('#activeContent').hide();
                readArticle(dirEntry);
            }
        }).catch(function(e) { alert("Error reading article with url " + path + " : " + e); });
    }
    
    function goToRandomArticle() {
        $("#searchingArticles").show();
        selectedArchive.getRandomDirEntry(function(dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                $("#searchingArticles").hide();
                alert("Error finding random article.");
            } else {
                // We fall back to the old A namespace to support old ZIM files without a text/html MIME type for articles
                // DEV: If articlePtrPos is defined in zimFile, then we are using a v1 article-only title listing. By definition,
                // all dirEntries in an article-only listing must be articles.  
                if (selectedArchive._file.articlePtrPos || dirEntry.getMimetype() === 'text/html' || dirEntry.namespace === 'A') {
                    params.isLandingPage = false;
                    $('#activeContent').hide();
                    $('#searchingArticles').show();
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
                // DEV: see comment above under goToRandomArticle()
                if (dirEntry.redirect || dirEntry.getMimetype() === 'text/html' || dirEntry.namespace === 'A') {
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
