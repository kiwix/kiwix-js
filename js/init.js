require.config({
    baseUrl: 'js/lib',
    paths: {
        'zepto': 'zepto',
        'bootstrap': 'bootstrap'
    },
    shim: {
        'zepto' : {
            exports : '$'
        },
        'bootstrap': {
            deps: ['zepto']
        }
    }
});

requirejs(['zepto', 'bootstrap', '../app']);
