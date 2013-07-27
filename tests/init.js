require.config({
    baseUrl: '../js/lib',
    paths: {
        'zepto': 'zepto',
        'jquery': 'jquery-2.0.3',
        'title': 'evopedia/title',
        'localArchive': 'evopedia/localArchive'
    }
});

requirejs(['../../tests/tests']);