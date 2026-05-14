import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // Forward Set-Cookie headers from backend to browser
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              proxyRes.headers['set-cookie'] = setCookie.map(cookie =>
                cookie.replace(/; secure/gi, '').replace(/; samesite=none/gi, '; SameSite=Lax')
              );
            }
          });
        }
      }
    }
  }
})