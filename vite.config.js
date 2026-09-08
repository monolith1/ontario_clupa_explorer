import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api-lio': {
        target: 'https://ws.lioservices.lrc.gov.on.ca',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-lio/, '')
      }
    }
  }
});
