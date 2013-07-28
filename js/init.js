require.config({
    baseUrl: 'js/lib',
    paths: {
        'zepto': 'zepto',
        'jquery': 'jquery-2.0.3',
        'bootstrap': 'bootstrap',
        'title': 'title',
        'archive': 'archive'
    },
    shim: {
        'zepto' : {
            exports : '$'
        },
        'jquery' : {
            exports : '$'
        },
        'bootstrap': {
            deps: ['jquery']
        }
    }
});

requirejs(['bootstrap', '../app']);