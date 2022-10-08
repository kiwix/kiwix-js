module.exports = function (config) {
  config.set({
    basePath: '../',
    // https://karma-runner.github.io/5.2/config/browsers.html
    // https://github.com/karma-runner/karma-sauce-launcher
    sauceLabs: {
      build: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_REPOSITORY} run #${process.env.GITHUB_RUN_ID}` : null,
      startConnect: true,
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY
    },
    customLaunchers: {
      firefox45: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '45.0'
      },
      firefox: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '104'
      },
      chrome58: {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: '58.0'
      },
      chrome: {
        base: 'SauceLabs',
        browserName: 'chrome',
        version: 'latest'
      },
      edge: {
        base: 'SauceLabs',
        browserName: 'MicrosoftEdge',
        version: 'latest'
      },
      edge40: {
        base: 'SauceLabs',
        browserName: 'MicrosoftEdge',
        version: '15.15063'
      },
      edge44: {
        base: 'SauceLabs',
        browserName: 'MicrosoftEdge',
        version: '18.17763'
      },
      ie11: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        version: 'latest'
      }
    },
    // The free account on Sauce does not allow more than 5 concurrent sessions
    concurrency: 4,

    // REMINDER: Keep this list in sync with the UI tests, in .github/workflows/CI.yml.
    browsers: [
      'firefox',
      'chrome',
      'edge',
      'edge40',
      'edge44',
      'firefox45',
      'chrome58'
      // Skip unit tests in Internet Explorer due to Promise undefined
      // 'ie11'
    ],
    frameworks: ['qunit'],
    client: {
      qunit: {
        autostart: false
      }
    },
    reporters: ['dots'],
    logLevel: 'WARN',
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
