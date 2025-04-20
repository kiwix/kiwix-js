const config = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    ie: '11',
                    edge: '17',
                    firefox: '60',
                    chrome: '67',
                    safari: '11.1'
                },
                modules: 'auto',
                spec: true,
                useBuiltIns: 'usage',
                // "forceAllTransforms": true,
                corejs: '3.30.2'
                // This is necessary for enabling CSS module support
                // "shippedProposals": true
            }
        ]
    ],
    exclude: ['node_modules/**'],
    compact: true // Force compacting for large files
};

export default config;
