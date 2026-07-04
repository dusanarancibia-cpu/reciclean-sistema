import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// PWA cache versionado · git SHA inyectado en sw.js (Va DeepSeek 26-jun Q4)
// Preferencia: VERCEL_GIT_COMMIT_SHA (build remoto) → execSync git (build local) → fallback 'dev'
function resolveBuildSha() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch (_) { return 'dev'; }
}

function resolveBranch() {
  if (process.env.VERCEL_GIT_COMMIT_REF) return process.env.VERCEL_GIT_COMMIT_REF;
  try { return execSync('git rev-parse --abbrev-ref HEAD').toString().trim(); } catch (_) { return 'unknown'; }
}

const BUILD_SHA = resolveBuildSha();
const BUILD_BRANCH = resolveBranch();
const BUILD_TIME = new Date().toISOString();

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
  }, {
    // Escribe /dist/_version.json en build para health check + footer visible
    // Fuente única de verdad de qué versión está sirviendo Vercel.
    name: 'emit-version-json',
    apply: 'build',
    closeBundle() {
      const versionInfo = {
        sha: BUILD_SHA,
        branch: BUILD_BRANCH,
        buildTime: BUILD_TIME,
        env: process.env.VERCEL_ENV || 'local'
      };
      writeFileSync('dist/_version.json', JSON.stringify(versionInfo, null, 2));
      console.log('[vite plugin] _version.json emitido: ' + BUILD_SHA + ' · ' + BUILD_BRANCH);
    }
  }]
});
