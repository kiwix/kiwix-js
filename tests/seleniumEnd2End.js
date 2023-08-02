import { Builder, By } from 'selenium-webdriver';
import assert from 'assert';
import path from 'path';

/* global describe, it, beforeEach, afterEach */

const rayCharlesBaseFile = path.resolve('./tests/wikipedia_en_ray_charles_2015-06.zimaa');
let rayCharlesAllParts = '';
for (let i = 0; i < 15; i++) {
    rayCharlesAllParts += rayCharlesBaseFile.replace(/zimaa$/, `zima${String.fromCharCode(97 + i)}`);
    if (i < 14) {
        rayCharlesAllParts += '\n';
    }
}
describe('Ray Charles test', function () {
    this.timeout(30000);
    let driver;
    beforeEach(async function () {
        driver = await new Builder().forBrowser('MicrosoftEdge').build()
    });
    afterEach(async function () {
        await driver.quit();
    });

    it('Load app', async function () {
        await driver.get('http://localhost:8080/dist/www/index.html');

        const title = await driver.getTitle();
        assert.equal('Kiwix', title);

        await driver.findElement(By.id('archiveFiles')).sendKeys(rayCharlesAllParts);
        await driver.manage().setTimeouts({ implicit: 500 });
        await driver.findElement(By.id('prefix')).sendKeys('Ray');

        const resultElement = await driver.findElement(By.xpath("//div[@id='articleList']/a[text()='Ray Charles']"));

        assert.equal('Ray Charles', await resultElement.getText());
    });
});
