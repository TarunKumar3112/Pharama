import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/webhook': {
        target: 'https://myaidesigntools.app.n8n.cloud',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
