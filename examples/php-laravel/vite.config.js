import { defineConfig } from 'vite'
import { skybolt } from '@skybolt/vite-plugin'

export default defineConfig({
    base: '/build/',
    publicDir: false,  // Laravel's public/ is served directly by the web server
    build: {
        manifest: true,
        outDir: 'public/build',
        rollupOptions: {
            input: {
                critical: 'resources/css/critical.css',
                app: 'resources/css/app.css',
                main: 'resources/js/app.js'
            }
        }
    },
    plugins: [
        skybolt({
            debug: true,
            swPath: '/build/skybolt-sw.js'
        })
    ]
})
