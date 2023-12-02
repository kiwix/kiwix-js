// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import { transformAsync } from '@babel/core';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';
import { minify } from 'terser';
// import styles from "@ironkinoko/rollup-plugin-styles";

const config = {
    // The entry point for the bundler
    input: 'www/js/app.js',
    output: {
        format: 'iife',
        name: 'KiwixJSBundle'
    },
    treeshake: 'recommended',
    plugins: [
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled'
        }),
        // Needed to get rid of residual "requires" left in the code by Babel...
        commonjs(),
        // Resolves references to node_modules packages
        resolve({
            browser: true
        }),
        // styles({
        //     // mode: 'extract',
        //     modules: true
        // }),
        replace({
            // Prevent a fatal error in IE11 (bug with the URL constructor polyfill)
            'document.baseURI': "document.location.href.replace(/[^/]*$/, '')",
            // Redirect the libzim Worker loader to the new location
            'js/lib/libzim': 'js/libzim',
            'js/lib/darkreader.min.js': 'js/darkreader.min.js',
            preventAssignment: true
        }),
        copy({
            targets: [{
                src: ['www/js/lib/*dec-wasm.wasm', 'www/js/lib/libzim-asm.js', 'www/js/lib/libzim-wasm.*', 'www/js/lib/webpHeroBundle*',
                    'node_modules/bootstrap/dist/js/bootstrap.bundle.min.*', 'node_modules/jquery/dist/jquery.slim.min.*', '!www/js/lib/libzim-wasm.dev*'],
                dest: 'dist/www/js'
            },
            { src: ['node_modules/bootstrap/dist/css/bootstrap.min.*'], dest: 'dist/www/css' },
            { src: ['i18n/*'], dest: 'dist/i18n' },
            { src: ['archives', 'backgroundscript.js', 'index.html', 'manifest.json', 'manifest.fx.v3.json', 'manifest.v2.json', 'manifest.webapp', 'package.json', 'LICENSE-GPLv3.txt', 'CHANGELOG.md', 'README.md', '*.pfx', '*.cjs'], dest: 'dist' }
            ],
            flatten: true
        })
    ]
};
if (process.env.BUILD === 'production') {
    // Production (minified) build
    config.plugins.push(terser());
    config.plugins.push(
        // Copy static files and binary (WASM/ASM) files that need to be loaded relative to the bundle
        copy({
            targets: [
                {
                    src: ['www/**', '!www/js/app.js', '!www/js/lib', '!www/index.html'],
                    dest: 'dist/www',
                    expandDirectories: true,
                    onlyFiles: true
                },
                {
                    src: ['service-worker.js'],
                    dest: 'dist',
                    // Modify the Service Worker precache files
                    transform: async (contents, filename) => {
                        const result = await minify(
                            contents.toString()
                            // Replace the entry point with the bundle
                                .replace(/(www[\\/]js[\\/])app.js/, '$1bundle.min.js')
                            // Remove all the lib files that will be included in the bundle
                                .replace(/,\s+["']www[\\/]js[\\/]lib[\\/]abstractFilesystemAccess[\s\S]+zimfile.js["']\s*/, '')
                            // Replace any references to node_modules
                                .replace(/node_modules\/.*dist\/((?:js|css)\/)?/g, function (m, p1) {
                                    p1 = p1 || 'js/';
                                    return 'www/' + p1;
                                })
                            // Alter remaining lib references
                                .replace(/([\\/])js[\\/]lib/g, '$1js')
                            // Remove unneeded ASM/WASM binaries
                                .replace(/["']www[\\/]js[\\/].*dec.*js["'],\s*/g, '')
                        );
                        return result.code;
                    }
                },
                {
                    src: ['replayWorker.js'],
                    dest: 'dist',
                    transform: async (contents, filename) => {
                        const code = contents.toString();
                        // Now minify the replayWorker
                        const minified = await minify(code);
                        // How to transform with babel (tested to make a difference with Firefox 68+)
                        const result = await transformAsync(minified.code, {
                            filename,
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        targets: {
                                            edge: '18',
                                            firefox: '60',
                                            chrome: '67',
                                            safari: '11.1'
                                        },
                                        modules: false,
                                        spec: true
                                    }
                                ]
                            ]
                        });
                        return result.code;
                    }
                },
                {
                    src: 'www/index.html',
                    dest: 'dist/www',
                    // Link the html to the new bundle entry point
                    transform: (contents, filename) => contents.toString()
                    // Uncomment the bundle link
                        .replace(/<!--\s(<script type="text\/javascript.*bundle.js.*)\s-->/, '$1')
                        .replace(/bundle\.js/, 'bundle.min.js')
                    // Comment out the old app.js link
                        .replace(/(<script type="module.*app.js.*)/, '<!-- $1 -->')
                    // Redirect jQuery and bootstrap
                        .replace(/(<script\s.*src=").*jquery.slim.min.js/, '$1js/jquery.slim.min.js')
                        .replace(/(<script\s.*src=").*bootstrap.bundle.min.js/, '$1js/bootstrap.bundle.min.js')
                        .replace(/(<link\s.*href=").*bootstrap.min.css/, '$1css/bootstrap.min.css')
                }
            ],
            flatten: false
        })
    )
} else {
    // Normal (Uniminified) build
    config.plugins.push(
        // Copy static files and binary (WASM/ASM) files that need to be loaded relative to the bundle
        copy({
            targets: [
                {
                    src: ['www/**', '!www/js/app.js', '!www/js/lib', '!www/index.html'],
                    dest: 'dist/www',
                    expandDirectories: true,
                    onlyFiles: true
                },
                {
                    src: ['service-worker.js'],
                    dest: 'dist',
                    // Modify the Service Worker precache files
                    transform: (contents, filename) => contents.toString()
                    // Replace the entry point with the bundle
                        .replace(/(www\/js\/)app.js/, '$1bundle.js')
                    // Remove all the lib files that will be included in the bundle
                        .replace(/,\s+["']www\/js\/lib\/abstractFilesystemAccess[\s\S]+zimfile.js["']/, '')
                    // Replace any references to node_modules
                        .replace(/node_modules\/.*dist\/((?:js|css)\/)?/g, function (m, p1) {
                            p1 = p1 || 'js/';
                            return 'www/' + p1;
                        })
                    // Alter remaining lib references
                        .replace(/([\\/])js[\\/]lib/g, '$1js')
                    // Remove unneeded ASM/WASM binaries
                        .replace(/["']www[\\/]js[\\/].*dec.*js["'],\s*/g, '')
                },
                {
                    src: ['replayWorker.js'],
                    dest: 'dist'
                },
                {
                    src: 'www/index.html',
                    dest: 'dist/www',
                    // Link the html to the new bundle entry point
                    transform: (contents, filename) => contents.toString()
                    // Uncomment the bundle link
                        .replace(/<!--\s(<script type="text\/javascript.*bundle.js.*)\s-->/, '$1')
                    // Comment out the old app.js link
                        .replace(/(<script type="module.*app.js.*)/, '<!-- $1 -->')
                    // Redirect jQuery and bootstrap
                        .replace(/(<script\s.*src=").*jquery.slim.min.js/, '$1js/jquery.slim.min.js')
                        .replace(/(<script\s.*src=").*bootstrap.bundle.min.js/, '$1js/bootstrap.bundle.min.js')
                        .replace(/(<link\s.*href=").*bootstrap.min.css/, '$1css/bootstrap.min.css')
                }
            ],
            flatten: false
        })
    )
}

export default config;
