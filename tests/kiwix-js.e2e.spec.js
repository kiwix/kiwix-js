import { By } from 'selenium-webdriver';
// import firefox from 'selenium-webdriver/firefox.js';
import assert from 'assert';
import path from 'path';

/* eslint-disable camelcase */
/* global describe, it */

// const options = new firefox.Options();
// options.setBinary('C:/UTILS/FirefoxPortable/App/Firefox64/firefox.exe');

// Set the browsers to test
// const driver_fx = new Builder().forBrowser('firefox').build();
// const driver_chr = new Builder().forBrowser('chrome').build();
// const driver_edge = new Builder().forBrowser('MicrosoftEdge').build();

// Set the archives to load
const rayCharlesBaseFile = path.resolve('./tests/wikipedia_en_ray_charles_2015-06.zimaa');
let rayCharlesAllParts = '';
for (let i = 0; i < 15; i++) {
    rayCharlesAllParts += rayCharlesBaseFile.replace(/zimaa$/, `zima${String.fromCharCode(97 + i)}`);
    if (i < 14) {
        rayCharlesAllParts += '\n';
    }
}

// Run the tests
// runTests(driver_fx);
// runTests(driver_chr);
// runTests(driver_edge);

function runTests (driver) {
    driver.getCapabilities().then(function (caps) {
        console.log('\nRunning tests on: ' + caps.get('browserName'));
    });
    describe('Legacy Ray Charles test (XZ compression)', function () {
        this.timeout(30000);
        // afterEach(async function () {
        //     await driver.quit();
        // });

        it('Load app', async function () {
            await driver.get('http://localhost:8080/dist/www/index.html');

            const title = await driver.getTitle();
            assert.equal('Kiwix', title);

            await driver.findElement(By.id('archiveFiles')).sendKeys(rayCharlesAllParts);
            await driver.manage().setTimeouts({ implicit: 500 });
            await driver.findElement(By.id('prefix')).sendKeys('Ray');

            const resultElement = await driver.findElement(By.xpath("//div[@id='articleList']/a[text()='Ray Charles']"));

            assert.equal('Ray Charles', await resultElement.getText());

            await driver.quit();
        });
    });
}

export default {
    runTests: runTests
};
