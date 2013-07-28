require.config({
    baseUrl: 'js/lib',
    paths: {
        'zepto': 'zepto',
        'jquery': 'jquery-2.0.3',
        'title': 'title',
        'archive': 'archive'
    }
});

requirejs(['../../tests/tests']);