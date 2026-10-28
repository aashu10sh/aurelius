import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { router } from 'sv-router/vite-plugin'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte(),
    router(),
    // Installable PWA: manifest + a service worker that precaches the app
    // shell. API calls always go to the network. New versions wait and are
    // applied while the app is hidden ($lib/updates.ts).
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Aurelius',
        short_name: 'Aurelius',
        description: 'A growth log: long-term goals, small daily tasks.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#110e0b',
        theme_color: '#110e0b',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Push and notification-click handlers live in public/push-sw.js.
        importScripts: ['push-sw.js'],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // iOS reads launch screens when the app is added to the home screen, not from here.
        globIgnores: ['splash/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) },
  },
  // Tags the saved query cache, so data from an older build is never restored ($lib/api/persist.ts).
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
})
