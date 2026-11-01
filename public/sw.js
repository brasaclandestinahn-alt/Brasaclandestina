const CACHE_NAME = 'brasa-cache-v6';

// Solo activos estáticos indispensables e inmutables (evitamos pre-cachear HTML dinámico)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  // Activación inmediata
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Escuchar mensaje del frontend para recargar si hay nueva versión
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isBypassUrl(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.href.includes('supabase.co') ||
    url.searchParams.has('_rsc') // RSC payloads dinámicos de Next.js
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;

  // 1. Bypass absoluto para APIs y Supabase
  if (isBypassUrl(url)) {
    event.respondWith(fetch(request));
    return;
  }

  // 2. Chunks estáticos inmutables de Next.js (/_next/static/...) -> Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return res;
          })
        );
      })
    );
    return;
  }

  // 3. Navegaciones HTML -> Network First con reintento y fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return networkRes;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // 4. Resto de recursos (Imágenes/Fuentes) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((networkRes) => {
        if (networkRes.ok && request.method === 'GET') {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return networkRes;
      }).catch(() => cached);

      return cached || fetchPromise;
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
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ─── Notification Close: log para debug ─────────────────────────────────────
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event.notification.tag);
});
