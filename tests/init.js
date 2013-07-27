require.config({
    baseUrl: '../js/lib',
    paths: {
        'title': 'evopedia/title',
        'localArchive': 'evopedia/localArchive'
    },
});

requirejs(['../../tests/tests']);
