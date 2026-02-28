// Prevent white flash on reload by applying correct background
(function () {

    // DEV: keyPrefix must match params['keyPrefix'] in init.js
    var keyPrefix = 'kiwixjs-';

    function getStoredValue(key) {
        try {
            var val = localStorage.getItem(keyPrefix + key);
            if (val !== null) return val;
        } catch (e) {}

        var match = document.cookie.match(
            new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)')
        );

        return match ? decodeURIComponent(match[1]) : null;
    }

    var storedTheme = getStoredValue('appTheme') || 'light';
    var appCache = getStoredValue('appCache');

    function prefersDark() {
        return window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    var isDark = false;

    if (storedTheme.includes('dark') ) {
        isDark = true;
    } else if (  storedTheme.includes('auto')  || storedTheme.includes('auto_wikimediaNative')  ) {
        isDark = prefersDark();
    }

    var htmlEl = document.documentElement;

    
    if ( appCache === null || appCache === 'true') {
        if (isDark) {
            htmlEl.classList.add('dark');
        } else {
            if(htmlEl.classList.contains('dark')){
                 htmlEl.classList.remove('dark');
            }
        }
    }

   
    else {
        htmlEl.style.backgroundColor =
            isDark ? '#300000' : 'mistyrose';
    }

})();