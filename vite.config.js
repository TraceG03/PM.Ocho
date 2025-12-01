import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { existsSync } from 'fs'
import { join } from 'path'

// Safely check if icon files exist and build icons array
function getIcons() {
  try {
    const icon192Exists = existsSync(join(process.cwd(), 'public', 'pwa-192x192.png'))
    const icon512Exists = existsSync(join(process.cwd(), 'public', 'pwa-512x512.png'))
    
    const icons = []
    if (icon192Exists) {
      icons.push({
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      })
    }
    if (icon512Exists) {
      icons.push(
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      )
    }
    return icons
  } catch (error) {
    // If file system operations fail, return empty array (PWA will work without custom icons)
    console.warn('Could not check for PWA icons:', error.message)
    return []
  }
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Construction Project Management',
        short_name: 'Construction PM',
        description: 'Construction Project Management Web Application',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: getIcons()
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ],
})


