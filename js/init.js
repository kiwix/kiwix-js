require.config({
    baseUrl: 'js/lib',
    paths: {
        'zepto': 'zepto',
        'jquery': 'jquery-2.0.3',
        'bootstrap': 'bootstrap',
        'title': 'evopedia/title',
        'localArchive': 'evopedia/localArchive'
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