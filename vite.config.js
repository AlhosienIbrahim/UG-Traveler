import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',   // مهم عشان GitHub Pages والـ Android WebView
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
