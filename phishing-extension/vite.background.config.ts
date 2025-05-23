import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/background.ts'),
      output: {
        format: 'iife',
        entryFileNames: 'background.js',
        inlineDynamicImports: true // required for iife with single entry
      }
    }
  }
})
