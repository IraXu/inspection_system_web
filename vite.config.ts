/*
 * @Author: AloofXu
 * @Date: 2026-05-25 18:23:11
 * @LastEditors: null
 * @LastEditTime: 2026-05-29 18:11:45
 * @FilePath: /web-prototype/vite.config.ts
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  base: '/inspection_system_web/', //github pages部署需要设置base路径
  server: {
    port: 5173,
  },
})
