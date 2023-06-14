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
        'dot-notation': 0,
        'no-var': 0,
        'no-mixed-operators': 0,
        'no-extra-parens': 1,
        'no-unused-expressions': 1,
        'no-unused-vars': 1,
        'n/no-callback-literal': 0,
        'object-shorthand': 0,
        'multiline-ternary': 0,
        'no-extend-native': 0,
        'no-global-assign': 0
    }
}
