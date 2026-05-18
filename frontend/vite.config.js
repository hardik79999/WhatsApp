import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
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

          // Vite attaches its listeners *after* configure is called.
          // We wait a tick to remove them and attach our own clean ones.
          setTimeout(() => {
            proxy.removeAllListeners('error');
            proxy.on('error', (err) => {
              if (err.code === 'EPIPE' || err.code === 'ECONNRESET') return;
              console.error('[proxy error]', err);
            });
            
            proxy.removeAllListeners('proxyReqWs');
            proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
              socket.on('error', (err) => {
                if (err.code === 'EPIPE' || err.code === 'ECONNRESET') return;
                console.error('[ws proxy socket error]', err);
              });
            });
          }, 100);
        }
      }
    }
  }
})
