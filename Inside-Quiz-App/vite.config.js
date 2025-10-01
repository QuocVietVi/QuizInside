import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mkcert() // plugin tạo cert tự ký để chạy HTTPS
  ],
  base: "/QuizInsideBuild/",
  server: {
    https: true,   // bật HTTPS
    port: 5173,    // bạn có thể đổi port nếu muốn
    proxy: {
      // Proxy API calls to bypass CORS
      '/api': {
        target: 'https://game1-wss-mcp.gamota.net:8843',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        onProxyReq: (proxyReq, req, res) => {
          // Forward cookies from browser to server
          if (req.headers.cookie) {
            proxyReq.setHeader('cookie', req.headers.cookie);
          }
          // Add origin header
          proxyReq.setHeader('origin', 'https://game1-wss-mcp.gamota.net:8843');
        },
        onProxyRes: (proxyRes, req, res) => {
          // Handle set-cookie headers from server
          const setCookie = proxyRes.headers['set-cookie'];
          if (setCookie) {
            proxyRes.headers['set-cookie'] = setCookie.map(cookie => {
              return cookie
                .replace(/Domain=[^;]+/gi, 'Domain=localhost')
                .replace(/Secure[;]?/gi, '')
                .replace(/SameSite=None/gi, 'SameSite=Lax')
                .replace(/Path=[^;]+/gi, 'Path=/');
            });
          }
        }
      },
      '/ws': {
        target: 'ws://localhost:8360', // backend WebSocket server
        ws: true,                      // enable websocket proxy
        changeOrigin: true
      }
    }
  }
})
