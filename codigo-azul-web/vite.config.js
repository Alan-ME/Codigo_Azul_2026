import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy /api y /socket.io hacia el backend en localhost:3000 para que el
// navegador vea todas las llamadas como same-origin y no dispare CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
