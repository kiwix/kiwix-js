import { By, until } from 'selenium-webdriver';
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

function runTests (driver) {
    driver.getCapabilities().then(function (caps) {
        console.log('\nRunning tests on: ' + caps.get('browserName'));
    });
    // Set the implicit wait to 10 seconds
    driver.manage().setTimeouts({ implicit: 5000 });
    describe('Legacy Ray Charles test (XZ compression)', function () {
        this.timeout(30000);
        this.slow(10000);
        describe('Load app', function () {
            it('Load Kiwix JS and check title', async function () {
                await driver.get('http://localhost:8080/dist/www/index.html');
                const title = await driver.getTitle();
                assert.equal('Kiwix', title);
            });
        });
        describe('Load archive', function () {
            it('Load legacy Ray Charles and check index contains specified article', async function () {
                await driver.findElement(By.id('archiveFiles')).sendKeys(rayCharlesAllParts);
                // await driver.wait(until.elementLocated(By.id('btHome')), 5000);
                await driver.findElement(By.id('btnHome')).click()
                await driver.findElement(By.id('btnHome')).click()
                await driver.switchTo().frame(0);
                const articleLink = await driver.findElement(By.linkText('This Little Girl of Mine'));
                // console.log(articleLink);
                assert.equal('This Little Girl of Mine', await articleLink.getText());
            });
        });
        describe('Initiate search', function () {
            it('Search for Ray Charles in title index', async function () {
                await driver.switchTo().defaultContent()
                await driver.findElement(By.id('prefix')).sendKeys('Ray');
                const resultElement = await driver.findElement(By.xpath("//div[@id='articleList']/a[text()='Ray Charles']"));
                assert.equal('Ray Charles', await resultElement.getText());
                driver.quit();
            });
        });
    });
}

export default {
    runTests: runTests
};
