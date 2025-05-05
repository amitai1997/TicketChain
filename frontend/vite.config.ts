import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Handle for ethers.js
    global: 'globalThis',
    // Necessary for imported JSON files
    'process.env': {}
  },
  build: {
    rollupOptions: {
      external: [
        '@safe-globalThis/safe-apps-provider',
        '@safe-globalThis/safe-apps-sdk'
      ]
    }
  },
  server: {
    port: 3000,
    host: true,
    strictPort: false,
    open: true
  }
})
