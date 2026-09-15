self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Peticiones estándar de red
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});