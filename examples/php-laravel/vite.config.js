import { defineConfig } from 'vite'
import { skybolt } from '@skybolt/vite-plugin'

export default defineConfig({
    base: '/',
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
            debug: true
        })
    ]
})
