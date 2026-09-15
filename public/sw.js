// Nombre de las cachés (si cambias algo gordo, subes la versión a v2, v3, etc.)
const STATIC_CACHE_NAME = 'dolar-hoy-static-v2';
const DYNAMIC_CACHE_NAME = 'dolar-hoy-dynamic-v2';

// Archivos vitales para que la app abra de una vez
const STATIC_ASSETS = [
  '/',
  '/tasas',
  '/styles/global.css',
  '/manifest.json'
];

// Evento de instalación: Precarga todo lo estático
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precargando archivos estáticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Evento de activación: Borra cachés viejas para no acumular basura
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  event.clients.claim();
});

// Evento de intercepción (Fetch): Inteligente según el tipo de petición
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Estrategia para la API de precios (Network First con respaldo en caché)
  // Intentamos buscar la tasa fresca en internet; si no hay señal, tiramos de la última guardada.
  if (url.pathname.includes('/api/prices')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Si responde la red, guardamos una copia fresca en la caché dinámica
          return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Si no hay internet, buscamos la última tasa guardada
          return caches.match(request);
        })
    );
    return;
  }

  // 2. Estrategia para el resto de la app (Stale-While-Revalidate / Caché primero con actualización)
  // Devuelve lo que hay en caché al instante para que vuele, y busca actualizaciones por detrás.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // Si falla la red y no está en caché, puedes retornar una página offline genérica si quisieras
      });

      return cachedResponse || fetchPromise;
    })
  );
});