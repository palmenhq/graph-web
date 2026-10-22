import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const API_BASE = process.env.API_BASE || 'http://localhost:8080'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': { target: API_BASE, changeOrigin: true },
      '/auth': { target: API_BASE, changeOrigin: true },
    },
  },
})
