// Reciclean App · Service Worker
// Sub-PR B.1 D-DIEGO-50X-V4 Ola B · Pablo 02-jun-2026
// MVP: cache shell mínimo + network-first para todo lo demás.
// Próximos sub-PRs (B.2 onboarding · B.3 chat) suman más rutas y cache.

const CACHE_NAME = 'reciclean-app-v1';
const SHELL = [
  '/app/',
  '/app/index.html',
  '/app/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Solo manejamos rutas dentro del scope /app/
  if (!url.pathname.startsWith('/app/')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Network-first: cache la respuesta para offline futuro
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('/app/index.html')))
  );
});
