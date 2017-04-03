'use strict'
var TRAVIS_JOB_NUMBER = process.env.TRAVIS_JOB_NUMBER

module.exports = {
  "src_folders" : ["browser-tests"],
  "output_folder" : "reports",
  "custom_commands_path" : "",
  "custom_assertions_path" : "",
  "page_objects_path" : "",
  "globals_path" : "",

  "test_settings" : {
    "default" : {
      "launch_url": "http://ondemand.saucelabs.com:80",
      "selenium_port": 80,
      "selenium_host": "ondemand.saucelabs.com",
      "silent": true,
      "username": "${SAUCE_USERNAME}",
      "access_key": "${SAUCE_ACCESS_KEY}",
      "screenshots" : {
        "enabled" : false
      },
      "globals": {
        "waitForConditionTimeout": 600
      }
    },
    "firefox" : {
      "desiredCapabilities": {
        "browserName": "firefox",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": "build-" + TRAVIS_JOB_NUMBER,
        "tunnel-identifier": TRAVIS_JOB_NUMBER
      }
    }
  }
}
