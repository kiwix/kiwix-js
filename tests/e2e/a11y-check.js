/**
 * a11y-check.js : standalone accessibility check for the navbar toggler and ToC dropup.
 *
 * Verifies the behaviour that Bootstrap's collapse/dropdown plugins used to provide before
 * they were removed in #1233 (see review comments on PR #1460):
 *   - the navbar toggler keeps aria-expanded in sync on open, close, and indirect close paths
 *   - the ToC dropup keeps aria-expanded in sync, and supports Escape / Up / Down
 *
 * Run with `npm run test-e2e-a11y`, which starts the server and requires a built dist.
 * This is a standalone script rather than a mocha spec, so it is not part of the runners
 * used by the other e2e tests, and has only been exercised against Edge so far. Converting
 * it into a spec would mean handling the narrow viewport the navbar toggler needs, and
 * guarding the Actions API calls on the oldest browsers.
 */

/* eslint-disable no-unused-vars */
/* global process */

import { Builder, By, Key } from 'selenium-webdriver';
import edge from 'selenium-webdriver/edge.js';
import paths from './paths.js';

// Matches the port used by start-server-and-run-tests.js, but overridable for standalone runs
const PORT = process.env.TEST_PORT || '8080';
const BASE = 'http://localhost:' + PORT + '/dist/www/index.html?noPrompts=true';

let allParts = '';
for (let i = 0; i < 15; i++) {
    allParts += paths.rayCharlesBaseFile.replace(/zimaa$/, `zima${String.fromCharCode(97 + i)}`);
    if (i < 14) allParts += '\n';
}

const results = [];
const check = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log((cond ? '  PASS  ' : '  FAIL  ') + name + (detail ? '   [' + detail + ']' : ''));
};

const run = async () => {
    const options = new edge.Options();
    options.addArguments('--headless=new', '--window-size=500,800');
    const driver = await new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(options).build();
    driver.manage().setTimeouts({ implicit: 3000 });

    try {
        await driver.get(BASE);
        await driver.sleep(2000);
        try {
            await driver.findElement(By.css('.modal[style*="display: block"]'));
            await (await driver.findElement(By.id('approveConfirm'))).click();
            await driver.sleep(300);
        } catch (e) { /* none */ }
        await driver.manage().window().setRect({ width: 500, height: 800 });
        await driver.sleep(400);

        const navState = () => driver.executeScript(`
            var t = document.querySelector('.navbar-toggler');
            var c = document.querySelector('.navbar-collapse');
            return { aria: t.getAttribute('aria-expanded'), shown: c.classList.contains('show') };
        `);

        console.log('\n--- Navbar toggler ---');
        let s = await navState();
        check('initial: closed and aria-expanded="false"', s.aria === 'false' && !s.shown, JSON.stringify(s));

        const toggler = await driver.findElement(By.css('.navbar-toggler'));
        await toggler.click();
        await driver.sleep(300);
        s = await navState();
        check('after open: shown and aria-expanded="true"', s.aria === 'true' && s.shown, JSON.stringify(s));

        await toggler.click();
        await driver.sleep(300);
        s = await navState();
        check('after close: hidden and aria-expanded="false"', s.aria === 'false' && !s.shown, JSON.stringify(s));

        // An indirect closing path: open the navbar, then click "Configure" (an app.js site)
        await toggler.click();
        await driver.sleep(300);
        await driver.executeScript("document.getElementById('btnConfigure').click();");
        await driver.sleep(600);
        s = await navState();
        check('indirect close via btnConfigure resets aria-expanded', s.aria === 'false' && !s.shown, JSON.stringify(s));

        await driver.executeScript("document.getElementById('btnHome').click();");
        await driver.sleep(500);

        console.log('\n--- ToC dropup ---');
        await driver.manage().window().setRect({ width: 1000, height: 800 });
        await driver.sleep(300);

        const archiveFiles = await driver.findElement(By.id('archiveFiles'));
        await driver.executeScript('arguments[0].style.display = "block";', archiveFiles);
        await archiveFiles.sendKeys(allParts);
        await driver.wait(async () =>
            (await driver.executeScript('return document.getElementById("archiveFiles").files.length')) === 15, 8000);
        await driver.executeScript('window.setLocalArchiveFromFileSelect();');
        await driver.wait(async () => {
            try {
                return await driver.executeScript(
                    'var f = document.getElementById("articleContent");' +
                    'var d = f && (f.contentDocument || f.contentWindow.document);' +
                    'return !!(d && d.getElementById("mw-content-text"));');
            } catch (e) { return false; }
        }, 15000, 'Article did not load');
        await driver.sleep(1200);

        const tocState = () => driver.executeScript(`
            var b = document.getElementById('dropup');
            var l = document.getElementById('ToCList');
            var links = l.getElementsByTagName('a');
            var focused = 'none';
            if (document.activeElement === b) focused = 'dropup';
            else if (document.activeElement) {
                var idx = Array.prototype.indexOf.call(links, document.activeElement);
                focused = idx >= 0 ? 'item:' + idx : document.activeElement.tagName;
            }
            return {
                aria: b.getAttribute('aria-expanded'),
                open: getComputedStyle(l).display !== 'none',
                items: links.length,
                focused: focused
            };
        `);

        let t = await tocState();
        check('initial: closed and aria-expanded="false"', t.aria === 'false' && !t.open, JSON.stringify(t));

        await driver.executeScript("document.getElementById('dropup').click();");
        await driver.sleep(500);
        t = await tocState();
        check('after open: open and aria-expanded="true"', t.aria === 'true' && t.open, JSON.stringify(t));

        // Arrow Down from the button should enter the list at the first item
        await driver.executeScript("document.getElementById('dropup').focus();");
        await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
        await driver.sleep(300);
        t = await tocState();
        check('ArrowDown moves focus into the list', t.focused === 'item:0', JSON.stringify(t));

        // Arrow Up from the first item wraps round to the last
        await driver.actions().sendKeys(Key.ARROW_UP).perform();
        await driver.sleep(300);
        t = await tocState();
        check('ArrowUp from first item wraps to last', t.focused === 'item:' + (t.items - 1), JSON.stringify(t));

        // This article's ToC has only one entry, so the wrap test above is degenerate.
        // Inject extra anchors to exercise the index arithmetic properly; the handler reads
        // the list live via getElementsByTagName, so this still drives the real code path.
        await driver.executeScript(`
            var l = document.getElementById('ToCList');
            for (var i = 0; i < 3; i++) {
                var li = document.createElement('li');
                li.innerHTML = '<a href="#" data-heading-id="synthetic' + i + '">Synthetic ' + i + '</a>';
                l.appendChild(li);
            }
            l.getElementsByTagName('a')[0].focus();
        `);
        await driver.sleep(200);
        t = await tocState();
        check('multi-item list prepared', t.items === 4 && t.focused === 'item:0', JSON.stringify(t));

        await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
        await driver.sleep(200);
        t = await tocState();
        check('ArrowDown advances 0 -> 1', t.focused === 'item:1', JSON.stringify(t));

        await driver.actions().sendKeys(Key.ARROW_UP).perform();
        await driver.sleep(200);
        await driver.actions().sendKeys(Key.ARROW_UP).perform();
        await driver.sleep(200);
        t = await tocState();
        check('ArrowUp wraps 1 -> 0 -> last (3)', t.focused === 'item:3', JSON.stringify(t));

        await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
        await driver.sleep(200);
        t = await tocState();
        check('ArrowDown wraps last -> first', t.focused === 'item:0', JSON.stringify(t));

        // Escape closes and returns focus to the button
        await driver.actions().sendKeys(Key.ESCAPE).perform();
        await driver.sleep(400);
        t = await tocState();
        check('Escape closes ToC, resets aria, refocuses button',
            !t.open && t.aria === 'false' && t.focused === 'dropup', JSON.stringify(t));

        const failed = results.filter((r) => !r.pass);
        console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
        process.exitCode = failed.length ? 1 : 0;
    } finally {
        await driver.quit();
    }
};

run().catch((e) => { console.error('ERROR:', e.message); process.exitCode = 1; });
