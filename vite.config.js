import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// VitePWA - uncomment after: npm install
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({ ... }) - uncomment after npm install
  ],
  server: {
    port: parseInt(process.env.PORT) || 5173,
    strictPort: false,
  },
})
