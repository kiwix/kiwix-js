// This page will be loaded in an iframe in library.html
// If this page is directly loaded it will just throw a lot of errors

let LIB_URL = {
    libraryUrl: '',
    altLibraryUrl: ''
}

function resizeFrame (height) {
    // setTimeout(function () {
    //     const iframe = document.getElementById('libraryIframe')
    //     iframe.style.height = height - 20 + 'px'
    // }, 1000);
    const iframe = document.getElementById('libraryIframe')
    if (iframe) iframe.style.height = height - 20 + 'px'
}

const script = ''
function getHTMLContent (url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                let html = xhr.responseText
                // html = html.replace('href="', '')
                html = html.replace(/href="/gm, 'href="' + url) // append the url to all href
                html = html.replace(/src="/gm, 'src="' + url) // append the url to all href
                // html = html.replace(/alt="[DIR]"/gm, '')
                console.log(html);
                callback(html)

                const links = document.getElementsByTagName('a')
                for (let index = 0; index < links.length; index++) {
                    const element = links[index];
                    element.addEventListener('click', function (e) {
                        e.preventDefault();

                        console.log('clicked', e.target.href);
                        if (String(e.target.href).slice(-4) === '.zim') {
                            window.open(e.target.href, '_blank')
                            return
                        }
                        getHTMLContent(e.target.href, function (html) {
                            document.getElementsByTagName('body')[0].innerHTML = html
                        })
                    })
                }
                console.log(links);
            } else {
                throw new Error('Failed to get content from');
            }
        }
    };
}

function setIframeUrl () {
    // const libraryURl = urls.libraryUrl
    // const fallbackLibraryURl = urls.altLibraryUrl
    const libraryURl = LIB_URL.libraryUrl
    const fallbackLibraryURl = LIB_URL.altLibraryUrl
    const iframe = document.getElementById('libraryIframe')

    if (!libraryURl || !fallbackLibraryURl || !iframe) return

    let isOptionalChainSupported = true // if not supported, that means the browser is too old
    let isParentWindowSupported = true // if not supported, that means it's chrome extension
    try {
        // eslint-disable-next-line no-eval
        eval('try{}catch{}')
    } catch (error) {
        isOptionalChainSupported = false
    }
    try {
        window.parent.params
    } catch (error) {
        isParentWindowSupported = false
    }

    // console.log(iframe);
    if (isOptionalChainSupported && isParentWindowSupported  && false) {
        iframe.setAttribute('src', libraryURl)
        console.log('library loaded');
    } else {
        // iframe.setAttribute('src', fallbackLibraryURl)
        // console.log(xhr, fallbackLibraryURl);
        getHTMLContent(fallbackLibraryURl, function (html) {
            document.getElementsByTagName('body')[0].innerHTML = html
        })
        // console.log('download.kiwix loaded');
    }
}

window.addEventListener('DOMContentLoaded', function () {
    setIframeUrl()
})

window.addEventListener('message', function (e) {
    console.log(e.data);
    if (e.data.event === 'resize') {
        const height = e.data.data
        resizeFrame(height)
    }
    if (e.data.event === 'setIframeUrl') {
        const urls = e.data.data
        LIB_URL = {
            libraryUrl: urls.libraryUrl,
            altLibraryUrl: urls.altLibraryUrl
        }
        setIframeUrl()
    }
})
