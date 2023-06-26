/* global fixture, test */

import { Selector } from 'testcafe'; // first import testcafe selectors

fixture`Start QUnit tests`// declare the fixture
    .page`http://localhost:8080/tests/`; // specify the start page

// then create a test and place your code within it
test('Check for success', async t => {
    await t
        // Use the assertion to check if actual header text equals expected text
        .expect(Selector('#qunit-testresult-display').innerText).match(/0\s+failed.+?0\s+skipped.+?0\s+todo/);
});
