const CACHE_NAME = 'brasa-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/globals.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Caching strategies
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Cache strategy for Images (Cache First)
  // We cache images from our domain and external sources like Supabase or Unsplash
  if (
    request.destination === 'image' || 
    url.hostname.includes('supabase.co') || 
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

  // 2. Cache strategy for Fonts (Cache First)
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

  // 3. Default strategy: Stale While Revalidate
  // For other requests, we try to serve from cache while updating it in the background
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((fetchResponse) => {
        // Only cache valid GET responses
        if (request.method === 'GET' && fetchResponse.ok) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
            });
        }
        return fetchResponse;
      }).catch(() => {
          // If network fails and no cache, return the cachedResponse (which might be null)
          return cachedResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
