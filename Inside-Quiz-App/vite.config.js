import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/QuizInsideBuild/",
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8360', // backend WebSocket server
        ws: true,                      // enable websocket proxy
      }
    }
  }
})
