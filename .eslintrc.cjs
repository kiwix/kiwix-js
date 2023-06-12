module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: 'standard',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        semi: 0,
        indent: ['error', 4],
        'dot-notation': 0
    }
}
