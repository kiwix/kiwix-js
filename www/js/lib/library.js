window.addEventListener('message', async function (event) {
    let isEvalWorking = true
    try {
        eval(event.data)
    } catch (error) {
        isEvalWorking = false
    }
    event.source.window.postMessage(isEvalWorking, event.origin);
});
