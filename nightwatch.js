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
const build = `${process.env.GITHUB_REPOSITORY} run #${process.env.GITHUB_RUN_ID}`;

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
        "waitForConditionTimeout": 10000
      },
      // Configure when a request to the Selenium server should time out and optionally define the number of retries for a timed-out request
      // See https://github.com/nightwatchjs/nightwatch/issues/1936
      "request_timeout_options": {
        "timeout": 100000,
        "retry_attempts": 3
      }
    },
    "firefox45" : {
      "desiredCapabilities": {
        "browserName": "firefox",
        "version": "45.0",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": build
      }
    },
    "firefox" : {
      "desiredCapabilities": {
        "browserName": "firefox",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": build,
        "extendedDebugging": true
      }
    },
    "chrome58" : {
      "desiredCapabilities": {
        "browserName": "chrome",
        "version": "58.0",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": build
      }
    },
    "chrome" : {
      "desiredCapabilities": {
        "browserName": "chrome",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": build
      }
    },
    "edge" : {
      "desiredCapabilities": {
        "browserName": "MicrosoftEdge",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": build
      }
    },
    "edge40" : {
      "desiredCapabilities": {
        "browserName": "MicrosoftEdge",
        "version": "15.15063",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": build
      }
    },
    "edge44" : {
      "desiredCapabilities": {
        "browserName": "MicrosoftEdge",
        "version": "18.17763",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": build
      }
    },
    "ie11" : {
      "desiredCapabilities": {
        "browserName": "internet explorer",
        "javascriptEnabled": true,
        "acceptSslCerts": true,
        "build": build
      }
    }
  }
};
