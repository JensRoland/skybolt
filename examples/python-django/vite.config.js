import { defineConfig } from 'vite'
import { skybolt } from '@skybolt/vite-plugin'

export default defineConfig({
    base: '/static/',
    build: {
        manifest: true,
        outDir: 'static/dist',
        rollupOptions: {
            input: {
                critical: 'static/css/critical.css',
                app: 'static/css/app.css',
                main: 'static/js/app.js'
            }
        }
    },
    plugins: [
        skybolt({
            debug: true
        })
    ]
})
