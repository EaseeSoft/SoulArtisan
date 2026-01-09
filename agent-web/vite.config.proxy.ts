import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/proxy': {
        target: 'https://duomiapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy/, ''),
        headers: {
          'Authorization': 'PDVks1q5NdSjYxGiKblmv0Za9I'
        }
      }
    }
  }
});
