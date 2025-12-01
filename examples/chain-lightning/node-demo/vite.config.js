import { defineConfig } from 'vite'
import { skybolt } from '@skybolt/vite-plugin'
import { chainLightning } from '@skybolt/chain-lightning/vite'

export default defineConfig({
  build: {
    manifest: true,
    outDir: 'dist',
    rollupOptions: {
      input: {
        // CSS managed by Skybolt
        'main-css': 'src/css/main.css',
        // Components managed by Chain Lightning
        'search-component': 'src/components/search-component.js',
        'counter-component': 'src/components/counter-component.js',
        // Main entry
        'main': 'src/main.js'
      }
    }
  },
  plugins: [
    skybolt({
      debug: true
    }),
    chainLightning({
      components: [
        // Simple string format (no version specifier)
        'search-component',
        // Object format with explicit version
        { name: 'counter-component', version: '1' }
      ],
      debug: true
    })
  ]
})
