module.exports = function (config) {
  config.set({
    basePath: '../',
    // https://karma-runner.github.io/5.2/config/browsers.html
    browsers: [
      'FirefoxHeadless',
      'ChromeHeadless'
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
