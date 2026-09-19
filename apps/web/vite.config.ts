import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest: escribimos nuestro propio service worker (src/sw.ts) y Workbox
      // solo inyecta la lista de archivos a precachear. Necesario para Background Sync propio.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      manifest: {
        name: 'Chashly — tus finanzas',
        short_name: 'Chashly',
        description: 'Registra ingresos y gastos, controla presupuestos. Funciona sin conexión.',
        lang: 'es-CO',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B0F3A',
        theme_color: '#0B0F3A',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: true, type: 'module', navigateFallback: 'index.html' },
    }),
  ],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
  },
});
