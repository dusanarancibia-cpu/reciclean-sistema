import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// PWA cache versionado · git SHA inyectado en sw.js (Va DeepSeek 26-jun Q4)
// Preferencia: VERCEL_GIT_COMMIT_SHA (build remoto) → execSync git (build local) → fallback 'dev'
function resolveBuildSha() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch (_) { return 'dev'; }
}

const BUILD_SHA = resolveBuildSha();

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
  },
  plugins: [{
    name: 'inject-build-sha-sw',
    apply: 'build',
    closeBundle() {
      const swPath = 'dist/sw.js';
      if (!existsSync(swPath)) return;
      const content = readFileSync(swPath, 'utf8').replace(/__BUILD_SHA__/g, BUILD_SHA);
      writeFileSync(swPath, content);
      console.log('[vite plugin] sw.js CACHE_NAME inyectado con SHA: ' + BUILD_SHA);
    }
  }]
});
