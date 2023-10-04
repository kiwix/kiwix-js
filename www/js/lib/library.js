// This page will be loaded in an iframe in library.html
// If this page is directly loaded it will just throw a lot of errors

function resizeFrame (height) {
    const iframe = document.getElementById('libraryIframe')
    iframe.style.height = height - 20 + 'px'
}

function setIframeUrl (urls) {
    const libraryURl = urls.libraryUrl
    const fallbackLibraryURl = urls.altLibraryUrl

    const iframe = document.getElementById('libraryIframe')
    // console.log(iframe);
    try {
        // eslint-disable-next-line no-eval
        eval('try{}catch{}')
        iframe.setAttribute('src', libraryURl)
    } catch (error) {
        // console.error(error)
        iframe.setAttribute('src', fallbackLibraryURl)
    }
}

window.addEventListener('message', (e) => {
    console.log(e.data);
    if (e.data.event === 'resize') {
        const height = e.data.data
        resizeFrame(height)
    }
    if (e.data.event === 'setIframeUrl') {
        const urls = e.data.data
        setIframeUrl(urls)
    }
})
