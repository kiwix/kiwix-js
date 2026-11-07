/**
 * check-library-csp.js : Verifies that https://browse.library.kiwix.org/ returns
 * a Content-Security-Policy header with the required frame-ancestors directive
 * to allow embedding inside browser extensions and the PWA.
 *
 * Part of Kiwix JS issue #1528.
 */

/* global process */
import assert from 'assert';

/**
 * Checks the CSP frame-ancestors directive of the Kiwix Library endpoint.
 * @param {string} [url='https://browse.library.kiwix.org/'] The URL to test
 * @returns {Promise<boolean>} Resolves true on success, throws on failure
 */
export async function checkLibraryCsp (url = 'https://browse.library.kiwix.org/') {
    console.log(`Checking CSP headers from: ${url}`);
    let response;
    try {
        response = await fetch(url, { redirect: 'follow' });
    } catch (err) {
        throw new Error(`Failed to connect to ${url}: ${err.message}`);
    }

    assert.strictEqual(response.status, 200, `Expected HTTP status 200 from ${url}, received ${response.status}`);

    const csp = response.headers.get('content-security-policy');
    assert.ok(csp, `Response from ${url} is missing the Content-Security-Policy header`);

    const frameAncestorsMatch = csp.match(/frame-ancestors\s+([^;]+)/i);
    assert.ok(frameAncestorsMatch, `Content-Security-Policy header is missing the frame-ancestors directive. Header received: "${csp}"`);

    const frameAncestorsDirective = frameAncestorsMatch[1].trim();
    const sources = frameAncestorsDirective.split(/\s+/);
    console.log(`Found frame-ancestors directive: ${frameAncestorsDirective}`);

    const requiredSources = [
        "'self'",
        'https://browser-extension.kiwix.org',
        'moz-extension:',
        'chrome-extension:'
    ];

    const missingSources = requiredSources.filter(src => !sources.includes(src));
    assert.strictEqual(
        missingSources.length,
        0,
        `frame-ancestors directive is missing required source(s): [${missingSources.join(', ')}]. Found: [${sources.join(', ')}]`
    );

    console.log('All required frame-ancestors sources are present.');
    return true;
}

if (process.argv[1] && process.argv[1].endsWith('check-library-csp.js')) {
    checkLibraryCsp()
        .then(() => {
            console.log('Library CSP header check passed successfully.');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Library CSP header check failed:', err.message);
            process.exit(1);
        });
}

export default {
    checkLibraryCsp
};
