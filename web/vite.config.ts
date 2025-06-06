import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: "http://localhost:5298/",
      },
      '/openai':{
        target: "http://localhost:5298/",
      }
    }
  },
  build: {
    // 启用源码映射用于调试
    sourcemap: false,
    // 优化构建输出
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // 分块策略优化
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons'],
          router: ['react-router-dom'],
        },
      },
    },
    // 资源内联阈值
    assetsInlineLimit: 4096,
  },
  // 预构建优化
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', 'react-router-dom'],
  },
  // SEO相关的HTML处理
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
