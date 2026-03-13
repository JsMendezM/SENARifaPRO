import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'RifaPro by Admin',
        short_name: 'RifaPro',
        description: 'Plataforma segura para rifas y sorteos',
        theme_color: '#10b981',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: true, // Permite que Localtunnel se conecte sin dar error 400
    host: true,         // Permite conexiones desde la red
    hmr: {
      clientPort: 443 // Obliga a WebSockets de Vite a usar el puerto del túnel HTTPS seguro
    }
  }
})
