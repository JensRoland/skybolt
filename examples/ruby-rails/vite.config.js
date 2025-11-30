import { defineConfig } from 'vite'
import { skybolt } from '@skybolt/vite-plugin'

export default defineConfig({
    base: '/dist/',
    build: {
        manifest: true,
        outDir: 'public/dist',
        rollupOptions: {
            input: {
                critical: 'app/assets/stylesheets/critical.css',
                application: 'app/assets/stylesheets/application.css',
                main: 'app/assets/javascripts/application.js'
            }
        }
    },
    plugins: [
        skybolt({
            debug: true
            // Keep SW at default /skybolt-sw.js - Rails controller sets Service-Worker-Allowed header
        })
    ]
})
