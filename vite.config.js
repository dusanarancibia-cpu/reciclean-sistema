import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // En Replit, la env var PORT indica el puerto que expone el container.
    // En local/Vercel, se cae a 5173 default.
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: false,
    // Replit expone via subdomains *.replit.dev — permitir todos en dev
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
  },
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
