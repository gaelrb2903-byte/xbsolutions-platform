import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Durante `netlify dev`, las funciones corren en :8888 y Vite en :5173.
// El proxy deja que el front llame a /.netlify/functions/* sin CORS en local.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
});
