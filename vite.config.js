import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          // 后端未启动时避免 Vite 刷屏抛 AggregateError
          proxy.on('error', (err, req, res) => {
            console.warn(`[vite proxy] 后端不可达: ${req?.url || ''} (${err.code || err.message})`)
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json;charset=UTF-8' })
              res.end(JSON.stringify({ code: 502, message: '后端未启动或无法连接 (localhost:8888)' }))
            }
          })
        }
      }
    }
  }
})
