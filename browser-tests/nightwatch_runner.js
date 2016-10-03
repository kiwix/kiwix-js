module.exports = {
    'All Tests': function(browser) {
        browser
            .url('http://localhost:8080/tests.html')
            .waitForElementVisible('#qunit-testresult', 10000)
            .pause(10000);
        browser.expect.element('#qunit-testresult').text.to.contain('Tests completed in');
        browser.expect.element('#qunit-testresult .failed').text.to.equal('0');
        browser.expect.element('#qunit-testresult .passed').text.not.to.equal('0');
        browser.end();
    }
};
