import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';

export default defineConfig([
    { files: ['**/*.{js,mjs,cjs}'] },
    { files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: globals.browser } },
    { files: ['**/*.{js,mjs,cjs}'], plugins: { js }, extends: ['js/recommended'] },
    { ignores: ['dist/**', 'emscripten/**', '**/xzdec*.js', '**/zstddec*.js', '**/webpHero*.js', '**/jquery*.js',
      '**/bootstrap*.js', '**/require.js', '**/solid.js', '**/fontawesome.js', '**/replayWorker.js',
      '**/*-wasm*.js', '**/*-asm*.js', 'tmp/**'] }
]);
