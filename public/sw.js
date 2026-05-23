const CACHE_NAME = 'brasa-cache-v4';
const STATIC_ASSETS = [
  '/',
  '/globals.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/admin',
  '/pos',
  '/kds',
  '/delivery',
  '/login',
  '/menu',
  '/icons/apple-touch-icon.png'
];

// ─── Install: precachear activos estáticos ──────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  // No llamamos skipWaiting() aquí intencionalmente;
  // la actualización se controla vía el mensaje SKIP_WAITING (ver abajo).
});

// ─── Activate: eliminar cachés antiguas ─────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ─── Message: saltar espera para activar nueva versión de inmediato ─────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Helpers para detectar URLs sensibles que nunca deben cachearse ─────────
function isSensitiveRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.href.includes('supabase.co/auth/') ||
    url.href.includes('supabase.co/rest/')
  );
}

// ─── Fetch: estrategias de caché ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar peticiones HTTP/HTTPS
  if (!url.protocol.startsWith('http')) return;

  // 0. Peticiones sensibles: siempre network, nunca caché
  if (isSensitiveRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // 1. Imágenes — Cache First
  // Cacheamos imágenes propias y externas (Unsplash) pero NO las de Supabase auth/rest
  if (
    request.destination === 'image' ||
    url.hostname.includes('unsplash.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // 2. Fuentes — Cache First
  if (request.destination === 'font' || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // 3. Navegaciones (HTML) — Network First con fallback offline a '/'
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((fetchResponse) => {
          // Actualizar caché con la respuesta fresca
          if (fetchResponse.ok) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return fetchResponse;
        })
        .catch(() => {
          // Sin red: intentar caché exacta, o fallback a la raíz '/'
          return caches.match(request).then((cachedPage) => {
            return cachedPage || caches.match('/');
          });
        })
    );
    return;
  }

  // 4. Resto — Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((fetchResponse) => {
          // Solo cachear respuestas GET válidas
          if (request.method === 'GET' && fetchResponse.ok) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return fetchResponse;
        })
        .catch(() => {
          // Sin red: devolver lo que haya en caché
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// ─── Notification Click: abrir/enfocar la ventana correcta ──────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/admin/orders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Buscar si ya hay una pestaña abierta del mismo origen
      for (const client of windowClients) {
        if (new URL(client.url).origin === self.location.origin) {
          client.focus();
          if (typeof client.navigate === 'function') {
            return client.navigate(targetUrl);
          }
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return;
        }
      }
      // No hay pestañas abiertas: abrir una nueva
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ─── Notification Close: log para debug ─────────────────────────────────────
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event.notification.tag);
});
