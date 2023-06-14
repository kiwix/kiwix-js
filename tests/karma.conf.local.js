module.exports = function (config) {
    config.set({
        basePath: '../',
        // https://karma-runner.github.io/5.2/config/browsers.html
        browsers: [
            'FirefoxHeadless',
            // During local development, consider Chrome and Chromium to be similar enough
            // and pick whichever the developer is most likely to have.
            // In general, Linux distros provide and update Chromium only,
            // whereas Windows and macOS users tend to have auto-updating Google Chrome.
            //
            // See package.json for commands to run tests in a single browser only.
            //
            // The CHROME_BIN check is to temporarily accomodate GitHub Actions
            // which oddly uses Ubuntu but replaces the standard Chromium distribution
            // with a custom install of Google Chrome. Being fixed in the next release:
            // https://github.com/actions/virtual-environments/issues/2388
            process.platform === 'linux' && !process.env.CHROME_BIN ? 'ChromiumHeadless' : 'ChromeHeadless'
        ],
        frameworks: ['qunit'],
        client: {
            qunit: {
                autostart: false
            }
        },
        // logLevel: 'DEBUG',
        files: [
            'www/js/lib/require.js',
            'tests/init.js',
            { pattern: 'www/**/*', included: false },
            { pattern: 'tests/**/*', included: false }
        ],
        singleRun: true,
        autoWatch: false
    });
};
