import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: false, // Evita alto uso de CPU em alguns sistemas
    },
    hmr: {
      overlay: false, // Desativa o overlay de erro para ser mais leve
    }
  },
  optimizeDeps: {
    force: false, // Evita re-otimização constante
  }
})
