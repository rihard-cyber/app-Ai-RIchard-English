import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: projectRoot,
  plugins: [
    react()
  ],
  base: './',
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    target: 'esnext',
    cssMinify: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('@supabase')) return 'vendor-supabase';
            return 'vendor-utils';
          }
        }
      }
    }
  }
});
