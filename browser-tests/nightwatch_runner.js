module.exports = {
    'All Tests': function(browser) {
        browser
            .url('http://localhost:8080/tests.html')
            .waitForElementVisible('#qunit-testresult', 10000);
        var resultsAvailable = false;
        while (!resultsAvailable) {
            browser
                .pause(500)
                .getText('#qunit-testresult', function(result) {
                    resultsAvailable = result.search(/Tests completed in/);
                });
        }
        browser
            .expect.element('#qunit-testresult failed').text.to.equal('0')
            .expect.element('#qunit-testresult passed').text.not.to.equal('0')
            .end();
    }
};