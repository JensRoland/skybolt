import { defineConfig } from 'vite'
import { skybolt } from '@skybolt/vite-plugin'

export default defineConfig({
  base: '/',
  build: {
    manifest: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        critical: 'src/css/critical.css',
        main: 'src/css/main.css',
        app: 'src/js/app.js'
      }
    }
  },
  plugins: [
    skybolt({
      debug: true
    })
  ]
})
