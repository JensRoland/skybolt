import { defineConfig } from 'vite'
import { resolve } from 'path'
import skybolt from '@skybolt/vite-plugin'

export default defineConfig({
  plugins: [
    skybolt()
  ],

  publicDir: 'public', // Copy public/ to dist/ (includes JS, images, fonts)

  build: {
    manifest: true,
    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        // CSS bundles
        critical: resolve(__dirname, 'src/css/critical.css'),
        main: resolve(__dirname, 'src/css/main.css'),
        fonts: resolve(__dirname, 'src/css/fonts-inline.css'),
      },

      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      }
    },

    cssMinify: 'esbuild',
  },

  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      // Cache headers for Vite dev server
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
})
