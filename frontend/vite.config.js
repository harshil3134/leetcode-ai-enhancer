import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/main.jsx'),
        content: resolve(__dirname, 'src/content/ContentScript.js'),
        background: resolve(__dirname, 'src/background/background.js')
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'popup') return 'popup/popup.js'
          if (chunk.name === 'content') return 'content/ContentScript.js'
          if (chunk.name === 'background') return 'background/background.js'
          return '[name]/[name].js'
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
})
