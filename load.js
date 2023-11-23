async function main () {
    const sw = navigator.serviceWorker;

    if (!sw) {
        let msg;
        // check if service worker doesn't work due to http loading
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            const httpsUrl = window.location.href.replace('http:', 'https:');
            document.querySelector('#error').innerHTML = '<p>This page must be loaded via an HTTPS URL to support service workers.</p>' +
          `<a href="${httpsUrl}">Try Loading HTTPS URL?</a>`;
            // otherwise, assume service worker not available at all
        } else {
            document.querySelector('#error').innerHTML = `<h2>Error</h2>\n
      <p>The requested URL can not be loaded because service workers are not supported here.</p>
      <p>If you use Firefox in Private Mode, try regular mode instead.</p>
      <p>If you use Kiwix-Serve locally, replace the IP in your browser address bar with <code>localhost</code>.</p>`;
        }

        document.querySelector('#loading').style.display = 'none';
        return;
    }

    // finds  '/A/' followed by a domain name with a .
    var prefix = window.location.href.slice(0, window.location.href.search(/[/]A[/][^/]+[.]/));

    const name = prefix.slice(prefix.lastIndexOf('/') + 1).replace(/[\W]+/, '');

    prefix += '/A/';

    await sw.register('./sw.js?replayPrefix=&root=' + name, { scope: prefix });

    sw.addEventListener('message', (event) => {
        if (event.data.msg_type === 'collAdded' && event.data.name === name) {
            if (window.location.hash && window.location.hash.startsWith('#redirect=')) {
                prefix += decodeURIComponent(window.location.hash.slice('#redirect='.length));
            } else {
                const inx = window.mainUrl.indexOf('//');
                prefix += inx >= 0 ? window.mainUrl.slice(inx + 2) : window.mainUrl;
            }

            console.log('final: ' + prefix);
            window.location.href = prefix;
        }
    });

    await new Promise((resolve) => {
        if (!sw.controller) {
            sw.addEventListener('controllerchange', () => {
                resolve();
            });
        } else {
            resolve();
        }
    });

    sw.controller.postMessage({
        msg_type: 'addColl',
        name: name,
        file: { sourceUrl: 'proxy:../' },
        root: true,
        skipExisting: false,
        extraConfig: { sourceType: 'kiwix', notFoundPageUrl: './404.html' },
        topTemplateUrl: './topFrame.html'
    });
}

window.addEventListener('load', main);
