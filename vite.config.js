import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
      symbolId: 'icon-[name]',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'process.env': {},  // 让 Electron 渲染进程可以访问 `process.env`
    'global': 'window', // 兼容 Electron 依赖
  },
  base: './',
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    strictPort: true, // 确保端口不会随机变化
  },
})
