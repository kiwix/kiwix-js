require.config({
    baseUrl: 'js/lib',
    paths: {
        'zepto': 'zepto',
        'bootstrap': 'bootstrap',
        'title': 'evopedia/title',
        'localArchive': 'evopedia/localArchive'
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
