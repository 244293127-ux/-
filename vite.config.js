import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 前端请求 /api/coze/xxx 时，由 Vite 转发到 https://api.coze.cn/xxx，解决 CORS
      '/api/coze': {
        target: 'https://api.coze.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coze/, ''),
      },
    },
  },
})
