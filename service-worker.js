/* ===== VIERNES · service-worker.js =====
   Guarda una copia de la app la primera vez que hay internet,
   para que después funcione sin conexión. */

const CACHE = 'viernes-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './pdf.umd.min.js',
  './pdf.plugin.autotable.min.js',
  './viernes-bg.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './favicon-32.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Estrategia: responde rápido con lo que ya está guardado (sirve sin internet),
// y de paso intenta traer una versión más nueva en segundo plano para la próxima vez.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(resp => {
        if (resp && resp.ok && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
