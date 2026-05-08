import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Konfigurasi standar untuk memastikan CI/CD GitHub Actions berjalan lancar

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
  plugins: [
    react(),
    chunkLoadingNotifier(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'], // Cache semua file statis ini
        maximumFileSizeToCacheInBytes: 5000000, // Izinkan file hingga 5MB untuk di-cache
      },
      // Jika manifest disisipkan manual di index.html, kita bisa mematikan auto-inject manifest dari plugin
      manifest: false
    })
  ],
  base: './', // Mengubah path menjadi relatif agar support di GitHub Pages & Android APK
  esbuild: {
    drop: ['console', 'debugger'], // Optimasi Final: Membuang semua console.log di versi production
  },
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
