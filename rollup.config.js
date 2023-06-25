// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';
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
        // Resolves references to node_modules packages
        resolve({
            browser: true
        }),
        // Needed to get rid of residual "requires" left in the code by Babel...
        commonjs(),
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
            { src: ['archives', 'index.html', 'manifest.json', 'manifest.v2.json', 'package.json', 'LICENSE', 'CHANGELOG.md', '*.pfx', '*.cjs'], dest: 'dist' }
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
                    transform: (contents, filename) => contents.toString()
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
