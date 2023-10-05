// This page will be loaded in an iframe in library.html
// If this page is directly loaded it will just throw a lot of errors

let LIB_URL = {
    libraryUrl: '',
    altLibraryUrl: ''
}

function resizeFrame (height) {
    const iframe = document.getElementById('libraryIframe')
    iframe.style.height = height - 20 + 'px'
}

function setIframeUrl () {
    // const libraryURl = urls.libraryUrl
    // const fallbackLibraryURl = urls.altLibraryUrl
    const libraryURl = LIB_URL.libraryUrl
    const fallbackLibraryURl = LIB_URL.altLibraryUrl
    const iframe = document.getElementById('libraryIframe')

    if (!libraryURl && !fallbackLibraryURl && iframe.getElementsByTagName('body')[0]) return

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

    console.log(iframe);
    if (isOptionalChainSupported && isParentWindowSupported && false) {
        iframe.setAttribute('src', libraryURl)
        console.log('library loaded');
    } else {
        const xhr = new XMLHttpRequest();
        console.log(xhr, fallbackLibraryURl);
        xhr.open('GET', fallbackLibraryURl);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    iframe.setAttribute('srcdoc', xhr.responseText)
                } else {
                    throw new Error('Failed to get content from');
                }
            }
        };
        console.log('download.kiwix loaded');
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
