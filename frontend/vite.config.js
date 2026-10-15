import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const pagesBase =
  process.env.VITE_BASE ||
  (process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/')

export default defineConfig({
  plugins: [react()],
  base: pagesBase,
  server: {
    port: 5173,
    host: '0.0.0.0',
    watch: {
      usePolling: true
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    outDir: 'dist'
  }
})
