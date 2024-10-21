import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/songs': 'http://api:8080',
    }
  }
});