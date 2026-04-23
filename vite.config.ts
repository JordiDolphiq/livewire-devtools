import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import { fileURLToPath, URL } from 'node:url'
import manifest from './src/manifest'

export default defineConfig({
  plugins: [vue(), crx({ manifest })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'chrome111',
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        panel: 'src/panel/panel.html',
        'popup-enabled': 'src/popup/enabled.html',
        'popup-disabled': 'src/popup/disabled.html'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5174 }
  }
})
