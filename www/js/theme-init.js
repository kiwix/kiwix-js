(function() {
    // Immediately apply theme background to prevent flash
    try {
        var theme = localStorage.getItem('kiwixjs-appTheme');
        console.log('Theme init: Retrieved theme =', theme); 
        
       
        var bgColor = '#FBEAEA'; 
        var isDark = false;
        
        if (theme && theme.includes('dark')) {
            bgColor = '#300000';
            isDark = true;
            console.log('Theme init: Applying dark theme');
        } else {
            console.log('Theme init: Applying light theme');
        }
        
      
        var html = document.documentElement;
        html.style.backgroundColor = bgColor;
        
        if (isDark) {
            html.classList.add('dark');
        }
        
       
        var style = document.createElement('style');
        style.textContent = 'html, body { background-color: ' + bgColor +';}';
        document.head.appendChild(style);
        
       
        if (document.body) {
            document.body.style.backgroundColor = bgColor;
            if (isDark) {
                document.body.classList.add('dark');
            }
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.style.backgroundColor = bgColor;
                if (isDark) {
                    document.body.classList.add('dark');
                }
            });
        }
    } catch (e) {
        console.error('Theme init error:', e);
    }
})();