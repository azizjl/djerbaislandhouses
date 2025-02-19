import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'logo.svg'],
    manifest: {
      name: 'Djerba Island Houses',
      short_name: 'Djerba',
      description: 'A Progressive Web App built with Vite and React',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        {
          src: '/logo.svg',
          sizes: '192x192',
          type: 'image/svg',
        },
        {
          src: '/logo.svg',
          sizes: '512x512',
          type: 'image/svg',
        },
      ],
    },
    workbox: {
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
    }
  }),],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Add other large dependencies here
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Optional: Increase warning limit if needed
  },
})
