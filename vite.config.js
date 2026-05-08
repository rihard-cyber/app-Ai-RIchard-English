import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
  plugins: [
    react(),
    chunkLoadingNotifier(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'], // Cache semua file statis ini
        maximumFileSizeToCacheInBytes: 5000000, // Izinkan file hingga 5MB untuk di-cache
        cleanupOutdatedCaches: true, // Hapus cache versi lama secara otomatis
        navigateFallback: '/index.html', // Penting untuk SPA (React) agar routing offline berjalan lancar
        runtimeCaching: [
          {
            // Contoh: Cache Google Fonts atau asset eksternal yang aman di-cache (GET requests)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // Cache selama 1 tahun
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Englishku App',
        short_name: 'Englishku',
        description: 'Aplikasi Belajar Bahasa Inggris Berbasis AI',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
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
