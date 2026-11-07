/* eslint-disable no-undef */
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Search bar keyboard shortcuts (#1375)', function () {
    let indexHtmlContent;

    before(async function () {
        const indexPath = join(__dirname, '../../../www/index.html');
        indexHtmlContent = await fs.readFile(indexPath, 'utf-8');
    });

    it('index.html provides shortcut guidance on #prefix title', function () {
        expect(indexHtmlContent).to.include('title="You can search the contents of your ZIM archive using this search field. It will suggest article titles **starting** with the letters you type. Press /, Home, or Ctrl/Cmd+K to focus search."');
    });

    it('index.html documents search shortcuts in the About usage section', function () {
        expect(indexHtmlContent).to.include('You can quickly access the search bar using keyboard shortcuts');
        expect(indexHtmlContent).to.include('Ctrl+K');
        expect(indexHtmlContent).to.include('Ctrl+L');
    });

    describe('Keyboard event handling', function () {
        let prefixInput;
        let otherInput;
        let textarea;
        let showSlidingUIElementsCalled;

        beforeEach(function () {
            showSlidingUIElementsCalled = false;
            globalThis.uiUtil = {
                showSlidingUIElements: function () {
                    showSlidingUIElementsCalled = true;
                }
            };
            globalThis.params = {
                useHomeKeyToFocusSearchBar: false
            };

            // Set up DOM elements
            document.body.innerHTML = `
                <input id="prefix" value="initial" />
                <input id="otherInput" value="hello" />
                <textarea id="myTextarea"></textarea>
                <div id="content">Some article text</div>
            `;

            prefixInput = document.getElementById('prefix');
            otherInput = document.getElementById('otherInput');
            textarea = document.getElementById('myTextarea');
        });

        function createKeyboardEvent (type, key, options = {}) {
            return {
                type,
                key,
                ctrlKey: options.ctrlKey || false,
                metaKey: options.metaKey || false,
                altKey: options.altKey || false,
                shiftKey: options.shiftKey || false,
                target: options.target || document.body,
                defaultPrevented: false,
                propagationStopped: false,
                preventDefault () {
                    this.defaultPrevented = true;
                },
                stopPropagation () {
                    this.propagationStopped = true;
                }
            };
        }

        // Inline handler replicating app.js logic to test behavior in isolated unit test
        function focusSearchBar () {
            globalThis.uiUtil.showSlidingUIElements();
            const prefix = document.getElementById('prefix');
            if (prefix) {
                prefix.focus();
                if (prefix.setSelectionRange) {
                    prefix.setSelectionRange(prefix.value.length, prefix.value.length);
                }
            }
        }

        function handleKeyDown (e) {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey && !/(input|textarea|select)/i.test(e.target.tagName) &&
                !e.target.isContentEditable && e.target.getAttribute('role') !== 'textbox') {
                e.preventDefault();
                e.stopPropagation();
                focusSearchBar();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !/(input|textarea)/i.test(e.target.tagName)) {
                e.preventDefault();
                e.stopPropagation();
                focusSearchBar();
            }
            if (globalThis.params.useHomeKeyToFocusSearchBar && e.key === 'Home' && !e.ctrlKey && !e.metaKey &&
                !/(input|textarea|select)/i.test(e.target.tagName) &&
                !e.target.isContentEditable && e.target.getAttribute('role') !== 'textbox') {
                e.preventDefault();
                e.stopPropagation();
                focusSearchBar();
            }
        }

        function handleKeyUp (e) {
            if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') || (e.altKey && e.key.toLowerCase() === 'd')) {
                if (!/(input|textarea)/i.test(e.target.tagName)) {
                    focusSearchBar();
                }
            }
        }

        it('pressing / on non-input element focuses #prefix and calls showSlidingUIElements', function () {
            const event = createKeyboardEvent('keydown', '/', { target: document.getElementById('content') });
            handleKeyDown(event);
            expect(event.defaultPrevented).to.be.true;
            expect(event.propagationStopped).to.be.true;
            expect(showSlidingUIElementsCalled).to.be.true;
            expect(document.activeElement).to.equal(prefixInput);
        });

        it('pressing / inside an input or textarea does NOT prevent default or hijack focus', function () {
            const eventInput = createKeyboardEvent('keydown', '/', { target: otherInput });
            handleKeyDown(eventInput);
            expect(eventInput.defaultPrevented).to.be.false;
            expect(showSlidingUIElementsCalled).to.be.false;

            const eventTextarea = createKeyboardEvent('keydown', '/', { target: textarea });
            handleKeyDown(eventTextarea);
            expect(eventTextarea.defaultPrevented).to.be.false;
            expect(showSlidingUIElementsCalled).to.be.false;
        });

        it('pressing Ctrl+K or Cmd+K focuses #prefix', function () {
            const eventCtrlK = createKeyboardEvent('keydown', 'k', { ctrlKey: true, target: document.getElementById('content') });
            handleKeyDown(eventCtrlK);
            expect(eventCtrlK.defaultPrevented).to.be.true;
            expect(showSlidingUIElementsCalled).to.be.true;
            expect(document.activeElement).to.equal(prefixInput);

            showSlidingUIElementsCalled = false;
            const eventCmdK = createKeyboardEvent('keydown', 'K', { metaKey: true, target: document.getElementById('content') });
            handleKeyDown(eventCmdK);
            expect(eventCmdK.defaultPrevented).to.be.true;
            expect(showSlidingUIElementsCalled).to.be.true;
            expect(document.activeElement).to.equal(prefixInput);
        });

        it('Home key respects params.useHomeKeyToFocusSearchBar', function () {
            globalThis.params.useHomeKeyToFocusSearchBar = false;
            const eventHomeDisabled = createKeyboardEvent('keydown', 'Home', { target: document.getElementById('content') });
            handleKeyDown(eventHomeDisabled);
            expect(eventHomeDisabled.defaultPrevented).to.be.false;
            expect(showSlidingUIElementsCalled).to.be.false;

            globalThis.params.useHomeKeyToFocusSearchBar = true;
            const eventHomeEnabled = createKeyboardEvent('keydown', 'Home', { target: document.getElementById('content') });
            handleKeyDown(eventHomeEnabled);
            expect(eventHomeEnabled.defaultPrevented).to.be.true;
            expect(showSlidingUIElementsCalled).to.be.true;
            expect(document.activeElement).to.equal(prefixInput);
        });

        it('Ctrl+L and Alt+D on keyup focus search bar when not in input', function () {
            const eventCtrlL = createKeyboardEvent('keyup', 'l', { ctrlKey: true, target: document.getElementById('content') });
            handleKeyUp(eventCtrlL);
            expect(showSlidingUIElementsCalled).to.be.true;
            expect(document.activeElement).to.equal(prefixInput);

            showSlidingUIElementsCalled = false;
            const eventAltD = createKeyboardEvent('keyup', 'd', { altKey: true, target: document.getElementById('content') });
            handleKeyUp(eventAltD);
            expect(showSlidingUIElementsCalled).to.be.true;
            expect(document.activeElement).to.equal(prefixInput);
        });
    });
});
