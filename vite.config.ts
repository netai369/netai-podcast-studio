import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import { fileURLToPath } from 'url'
import { sveltePreprocess } from 'svelte-preprocess'

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative paths for all assets to support deployment to any path.
  base: './',
  plugins: [svelte({
    preprocess: sveltePreprocess()
  })],
  resolve: {
    alias: {
      // FIX: __dirname is not available in ES modules.
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
  define: {
    'process.env': process.env
  },
  server: {
    // Listen on all addresses (useful for Docker / proxies)
    host: true
  },
  // Serve PDF.js worker and other static files from public directory
  publicDir: 'public',
  // Configure module resolution
  optimizeDeps: {
    include: [
      '@google/genai',
      'mammoth',
      'jszip',
      'pdfjs-dist',
      'lamejs'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
