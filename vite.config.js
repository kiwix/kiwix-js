import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        open: 'www/index.html?appCache=false'
    }
    // build: {
    //     rollupOptions: {
    //         input: 'www/index.html',
    //     }
    // }
});
