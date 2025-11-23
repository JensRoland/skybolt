import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Build configuration
  build: {
    // Generate manifest for Skybolt
    manifest: true,

    // Output to dist directory
    outDir: 'dist',

    // Clear output directory before build
    emptyOutDir: true,

    // Rollup options
    rollupOptions: {
      input: {
        // Critical CSS (above-the-fold styles)
        critical: resolve(__dirname, 'src/css/critical.css'),

        // Main CSS bundle
        main: resolve(__dirname, 'src/css/main.css'),

        // Main JavaScript bundle
        app: resolve(__dirname, 'src/js/app.js'),
      },

      output: {
        // Asset naming pattern (includes hash for cache busting)
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    },

    // Use Lightning CSS for minification (faster than cssnano)
    cssMinify: 'lightningcss',
  },

  // Dev server configuration
  server: {
    port: 5173,
    strictPort: true,

    // Serve from public directory
    open: '/public/index.php',

    // CORS for dev server
    cors: true,
  },

  // Don't set base path here - Skybolt handles the URL prefix
  // The manifest will have paths like "assets/main-hash.js"
  // and Skybolt will prepend basePath to create "/assets/assets/main-hash.js"
  // base: '/assets/',
})
