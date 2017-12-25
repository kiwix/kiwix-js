/**
 * nightwatch_runner.js : Tests to be run with nightwatch.
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
module.exports = {
    'Unit Tests': function(browser) {
        // We need to skip the UI tests on Internet Explorer,
        // because they are not supported, even if the UI tests are supported on this browser
        if (browser.options.desiredCapabilities.browserName !== "internet explorer") {
            browser
                .url('http://localhost:8080/tests.html')
                .waitForElementVisible('#qunit-testresult', 10000)
                .pause(10000);
            browser.expect.element('#qunit-testresult').text.to.contain('tests completed in');
            browser.expect.element('#qunit-testresult .failed').text.to.equal('0');
            browser.expect.element('#qunit-testresult .passed').text.not.to.equal('0');
            browser.end();
        }
    },
    'UI Tests': function(browser) {
        browser
            .url('http://localhost:8080/')
            .waitForElementVisible('#archiveFiles', 20000)
            // Select the ZIM archive of Ray Charles
            .execute(function() {
                window.setRemoteArchives('http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimaa',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimab',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimac',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimad',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimae',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimaf',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimag',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimah',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimai',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimaj',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimak',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimal',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimam',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.ziman',
                    'http://localhost:8080/tests/wikipedia_en_ray_charles_2015-06.zimao'
                    );
            })
            
            .waitForElementVisible('#formArticleSearch', 20000)
            .waitForElementVisible('#searchArticles', 20000)
            // Hide the bottom bar, so that it is not above any content
            .execute(function(vis){
                var footer = document.getElementsByTagName('footer')[0];
                footer.style.visibility=vis;
                },['hidden']
            )

            // Start a search with the prefix "Ray"
            .setValue('#prefix', "Ray")
            .click('#searchArticles')
            .waitForElementVisible('#articleList', 20000)
            // Choose the article "Ray Charles"
            .useXpath()
            .waitForElementVisible("//div[@id='articleList']/a[text()='Ray Charles']", 20000)
            .click("//div[@id='articleList']/a[text()='Ray Charles']")

            .frame('articleContent')
            // Check the text in the article "Ray Charles"
            .useXpath()
            .waitForElementPresent("//div[@id='content']/div[@id='mw-content-text']/h2[@id='mweQ']", 40000)
            .assert.containsText("//div[@id='content']/div[@id='mw-content-text']/h2[@id='mweQ']", 'Life and career')
            // Wait for a particular image to be visible and check its size
            .useXpath()
            .waitForElementVisible("//td[@id='mwCA']/p/span/img", 20000)
            .assert.attributeEquals("//td[@id='mwCA']/p/span/img", "naturalWidth", "250")
            // Check the CSS style
            .useCss()
            .waitForElementVisible('#mwBA', 20000)
            .assert.cssProperty("#mwBA", "float", "right");
    
        // For some reason, the following UI tests work on Edge 42 (version 17.x),
        // but not on Edge 40 (version 15.x), where it fails with "Error while running "waitForElementPresent" command: Timed out while waiting for element <//div[@id='content']/div[@id='mw-content-text']/h2[@id='mweQ']> to be present for 40000 milliseconds. - expected "found" but got: "not found" ",
        // and Edge 44 (version 18.x), where it fails with "An error occurred while running .getText() command on <//div[@id='content']/div[@id='mw-content-text']/blockquote[@id='mwnw']>: An unknown error occurred while processing the specified command. (WARNING: The server did not provide any stacktrace information)".
        // When Microsoft will release a new version of Edge (based on Chromium), we should let the tests run when version is not set (see if statement below).
        if (browser.options.desiredCapabilities.browserName !== "MicrosoftEdge"
                || (browser.options.desiredCapabilities.version
                    && browser.options.desiredCapabilities.version !== "15.15063")) {
    
        // Click on a hypertext link to another article "Quincy Jones"
        browser.waitForElementVisible('#mwBTI', 20000)
            .click("#mwBTI")
            // Check the text of the article "Quincy Jones"
            .useXpath()
            .waitForElementPresent("//div[@id='content']/div[@id='mw-content-text']/blockquote[@id='mwnw']", 40000)
            .assert.containsText("//div[@id='content']/div[@id='mw-content-text']/blockquote[@id='mwnw']", 'perspective of past, present and future')
            // Wait for a particular image to be visible and check its size
            .useCss()
            .waitForElementVisible("#mwAiI", 20000)
            .assert.attributeEquals("#mwAiI", "naturalWidth", "180")
            // Check the CSS style
            .waitForElementVisible('#mwBA', 20000)
            .assert.cssProperty("#mwBA", "float", "right")
    
            // Use the back button of the browser, to go back to "Ray Charles" article
            .back()
            .frameParent()
            .frame('articleContent')
            // Check the text in the article "Ray Charles"
            .useXpath()
            .waitForElementPresent("//div[@id='content']/div[@id='mw-content-text']/h2[@id='mweQ']", 40000)
            .assert.containsText("//div[@id='content']/div[@id='mw-content-text']/h2[@id='mweQ']", 'Life and career')
            // Wait for a particular image to be visible and check its size
            .useXpath()
            .waitForElementVisible("//td[@id='mwCA']/p/span/img", 20000)
            .assert.attributeEquals("//td[@id='mwCA']/p/span/img", "naturalWidth", "250")
            .end();
        }
    }
};
