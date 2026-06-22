const CACHE_NAME = 'reciclean-v4';
const ASSETS_TO_CACHE = [
  '/asistente.html',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // No cachear: Supabase API, métodos no-GET, chrome-extension
  if (
    url.includes('supabase.co') ||
    url.includes('supabase.in') ||
    event.request.method !== 'GET' ||
    url.startsWith('chrome-extension')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML siempre fresco (cache: 'reload' bypass CDN + browser cache)
  const isHtml = event.request.headers.get('accept')?.includes('text/html');
  if (isHtml) {
    event.respondWith(fetch(event.request, { cache: 'reload' }));
    return;
  }

  // Otros assets: network first, fallback a cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
