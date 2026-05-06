import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-oxc';

function chunkLoadingNotifier() {
  return {
    name: 'chunk-loading-notifier',
    renderChunk(code, chunk) {
      const sizeKB = (code.length / 1024).toFixed(2);
      if (code.length > 500 * 1024) { // Berikan notifikasi di console untuk chunk > 500KB
        console.log(`\x1b[33m[Rolldown/Vite] 📦 Memproses chunk besar: ${chunk.fileName} (${sizeKB} KB)\x1b[0m`);
      }
      return null;
    }
  };
}

export default defineConfig({
  plugins: [react(), chunkLoadingNotifier()],
  base: './', // Mengubah path menjadi relatif agar support di GitHub Pages & Android APK
  build: {
    target: 'esnext',
    cssMinify: true,
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor-utils';
          }
        }
      }
    }
  }
});
