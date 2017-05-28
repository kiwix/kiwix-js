module.exports = {
    'Unit Tests': function(browser) {
        browser
            .url('http://localhost:8080/tests.html')
            .waitForElementVisible('#qunit-testresult', 10000)
            .pause(10000);
        browser.expect.element('#qunit-testresult').text.to.contain('tests completed in');
        browser.expect.element('#qunit-testresult .failed').text.to.equal('0');
        browser.expect.element('#qunit-testresult .passed').text.not.to.equal('0');
        browser.end();
    },
    'UI Tests': function(browser) {
        browser
            .url('http://localhost:8080/')
            .waitForElementVisible('body', 1000)
            .execute(function() {
                window.setRemoteArchive('https://kiwix.github.io/kiwix-html5/tests/wikipedia_en_ray_charles_2015-06.zim');
            })
            .waitForElementVisible('#formArticleSearch', 20000)
            .waitForElementVisible('#searchArticles', 20000)
            .setValue('#prefix', "Ray")
            .click('#searchArticles')
            .waitForElementVisible('#articleList', 20000)
            .useXpath()
            .waitForElementVisible("//div[@id='articleList']/a[text()='Ray Charles']", 20000)
            .click("//div[@id='articleList']/a[text()='Ray Charles']")
            .useCss()
            .frame('articleContent')
                .waitForElementPresent('#mweQ', 2000000)
                .assert.containsText('#mweQ', 'Life and career')
            .end();
    }
};
