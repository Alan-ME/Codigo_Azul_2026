// ─────────────────────────────────────────────────────────────
// client/public/sw.js
// Service Worker para soporte PWA y Resiliencia Offline de Código Azul
// Cachea la app web para que abra al instante aún sin conexión a internet.
// ─────────────────────────────────────────────────────────────

const CACHE_NAME = 'codigo-azul-pwa-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/alarma',
  '/mobile',
];

// Instalación: Cachear shell básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Fallo al precachear algunos recursos:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpiar cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Estrategia Stale-While-Revalidate para recursos estáticos y Network-First para APIs
self.addEventListener('fetch', (event) => {
  // Ignorar métodos no GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // No interceptar peticiones a la API ni WebSockets
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    return;
  }

  // Navegación de páginas (SPA fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('/index.html')) || (await cache.match('/')) || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Recursos estáticos
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En background actualizar caché si es posible
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => new Response('', { status: 408, statusText: 'Network Timeout' }));
    })
  );
});
