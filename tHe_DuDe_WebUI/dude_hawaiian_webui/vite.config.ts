import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/ag_pos_health': {
        target: 'http://localhost:11116',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ag_pos_health/, '/health')
      },
      '/ag_pos_api': {
        target: 'http://localhost:11116',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ag_pos_api/, '/api/pos')
      }
    }
  }
})
