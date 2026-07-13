import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'hnote — Ghi chú nhanh',
        short_name: 'hnote',
        description:
          'Ứng dụng ghi chú hiện đại: Markdown, mã hóa đầu-cuối, đồng bộ thời gian thực.',
        lang: 'vi',
        display: 'standalone',
        theme_color: '#4f6bff',
        background_color: '#f3f4f8',
        icons: [
          { src: 'favicon.png', sizes: '192x192', type: 'image/png' },
          { src: 'favicon.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the built app shell so it opens offline. The large 1024px
        // favicon is loaded on demand instead of bloating the precache.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: ['**/favicon.png'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
  },
})
