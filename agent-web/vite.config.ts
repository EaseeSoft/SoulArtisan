import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // 使用绝对路径，确保 SPA 路由刷新时资源路径正确
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5173,
    strictPort: true, // 如果端口被占用则报错
    cors: true, // 启用 CORS
    allowedHosts: ['www.matuto.com', 'localhost', '127.0.0.1'], // 允许的主机名
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})