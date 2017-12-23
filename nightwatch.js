/**
 * nightwatch.js : Configuration of nightwatch.
 * Global settings of NightWatch.
 * 
 * Copyright 2017 Mossroy and contributors
 * License GPL v3:
 * 
 * This file is part of Kiwix.
 * 
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */
'use strict';
var TRAVIS_JOB_NUMBER = process.env.TRAVIS_JOB_NUMBER;

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
    "firefox45" : {
      "desiredCapabilities": {
        "browserName": "firefox",
        "version": "45.0",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": "build-" + TRAVIS_JOB_NUMBER,
        "tunnel-identifier": TRAVIS_JOB_NUMBER
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
    },
    "chrome58" : {
      "desiredCapabilities": {
        "browserName": "chrome",
        "version": "58.0",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": "build-" + TRAVIS_JOB_NUMBER,
        "tunnel-identifier": TRAVIS_JOB_NUMBER
      }
    },
    "chrome" : {
      "desiredCapabilities": {
        "browserName": "chrome",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": "build-" + TRAVIS_JOB_NUMBER,
        "tunnel-identifier": TRAVIS_JOB_NUMBER
      }
    },
    "edge" : {
      "desiredCapabilities": {
        "browserName": "MicrosoftEdge",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": "build-" + TRAVIS_JOB_NUMBER,
        "tunnel-identifier": TRAVIS_JOB_NUMBER
      }
    },
    "ie11" : {
      "desiredCapabilities": {
        "browserName": "internet explorer",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": "build-" + TRAVIS_JOB_NUMBER,
        "tunnel-identifier": TRAVIS_JOB_NUMBER
      }
    }
  }
};
