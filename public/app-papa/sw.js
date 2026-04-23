const CACHE = 'remedios-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  '../01_INPUT/audio_instrucciones_v2_2026-04-23.ogg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
