({
    baseUrl: "js/lib",
    map: { '*': { 'jquery': 'zepto' } },
    dir: "../www-built",
    appDir: "../www",
    removeCombined: true,
    modules: [
        { name: "../app" }
    ]
})