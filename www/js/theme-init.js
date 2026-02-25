// Prevent white flash on reload by applying correct background
(
    function () {
        var storedTheme = localStorage.getItem('kiwixjs-appTheme') || "light";
        var htmlEl = document.documentElement;
        if (localStorage.getItem('kiwixjs-appCache') === 'true') {
            if (storedTheme.includes('dark')) {

                htmlEl.classList.add('dark');

            }
            else {
                if (htmlEl.classList.contains('dark')) {
                    htmlEl.classList.remove('dark');
                };
            }
        }
        else {
            htmlEl.style.backgroundColor =
                storedTheme.includes('dark')
                    ? '#300000'
                    : 'mistyrose';
        }
    }
)();