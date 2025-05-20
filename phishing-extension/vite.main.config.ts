import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    // debug config
    minify: false,
    sourcemap: true,
    // end debug config
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup/main.tsx')
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  }
})
