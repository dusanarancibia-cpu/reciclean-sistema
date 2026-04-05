import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        asistente: 'asistente.html',
        login: 'login.html'
      }
    }
  }
});
