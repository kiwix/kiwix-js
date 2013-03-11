/*jslint nomen: true */
/*global define, navigator, location, window, chrome */

define(function (require) {
    'use strict';

    /**
     * Detects if the current app has been installed.
     *
     * See https://github.com/wavysandbox/install/blob/master/README.md
     * for details on how to use.
     *
     */
    function install() {
        var fn = install[install.type + 'Install'];
        if (fn) {
            fn();
        } else {
            install.trigger('error', 'unsupported install: ' + install.type);
        }
    }

    function triggerChange(state) {
        install.state = state;
        install.trigger('change', install.state);
    }

    /**
     *  The install state. Values are:
     *  'unknown': the code has not tried to detect any state.
     *
     * @type {String}
     */
    install.state = 'unknown';

    install.check = function () {
        var apps = navigator.mozApps,
            request;

        if (navigator.mozApps) {
            //Mozilla web apps
            install.type = 'mozilla';
            request = navigator.mozApps.getSelf();
            request.onsuccess = function () {
                if (this.result) {
                    triggerChange('installed');
                } else {
                    triggerChange('uninstalled');
                }
            };

            request.onerror = function (err) {
                // Just console log it, no need to bother the user.
                install.error = err;
                triggerChange('error');
            };

        } else if (typeof chrome !== 'undefined' &&
                   chrome.webstore &&
                   chrome.app) {
            //Chrome web apps
            install.type = 'chromeStore';
            if (chrome.app.isInstalled) {
                triggerChange('installed');
            } else {
                triggerChange('uninstalled');
            }
        } else if (typeof window.navigator.standalone !== 'undefined') {
            install.type = 'ios';
            if (window.navigator.standalone) {
                triggerChange('installed');
            } else {
                triggerChange('uninstalled');
            }
        } else {
            install.type = 'unsupported';
            triggerChange('unsupported');
        }
    };

    /* Mozilla/Firefox installation */
    install.mozillaInstallUrl = location.href + 'manifest.webapp';
    install.mozillaInstall = function () {
        var installRequest = navigator.mozApps.install(install.mozillaInstallUrl);

        installRequest.onsuccess = function (data) {
            triggerChange('installed');
        };

        installRequest.onerror = function (err) {
            install.error = err;
            triggerChange('error');
        };
    };

    /* Chrome installation */
    install.chromeInstallUrl = null;
    install.chromeInstall = function () {
        chrome.webstore.install(install.chromeInstallUrl,
            function () {
                triggerChange('installed');
            }, function (err) {
                install.error = err;
                triggerChange('error');
            });
    };

    /* iOS installation */
    //Right now, just asks that something show a UI
    //element mentioning how to install using the Safari
    //"Add to Home Screen" button.
    install.iosInstall = function () {
        install.trigger('showiOSInstall', navigator.platform.toLowerCase());
    };

    //Allow install to do events.
    var events = {};

    install.on = function(name, func) {
        events[name] = (events[name] || []).concat([func]);
    };

    install.off = function(name, func) {
        if(events[name]) {
            var res = [];

            for(var i=0, l=events[name].length; i<l; i++) {
                var f = events[name][i];
                if(f != func) {
                    res.push();
                }
            }

            events[name] = res;
        }
    };

    install.trigger = function(name) {
        var args = Array.prototype.slice.call(arguments, 1);

        if(events[name]) {
            for(var i=0, l=events[name].length; i<l; i++) {
                events[name][i].apply(this, args);
            }
        }
    };


    //Start up the checks
    install.check();

    return install;
});