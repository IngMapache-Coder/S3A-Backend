import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8787',
      '/usuarios': 'http://localhost:8787',
      '/materias': 'http://localhost:8787',
      '/sesiones': 'http://localhost:8787',
      '/asistencias': 'http://localhost:8787',
      '/firmas': 'http://localhost:8787',
      '/reportes': 'http://localhost:8787',
    },
  },
});
