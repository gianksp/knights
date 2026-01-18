const CACHE_NAME = "adb-cache-v4";

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/main.js',
  '/manifest.webmanifest',
  '/sw.js',
  '/scenes/WelcomeScene.js',
  '/scenes/MainScene.js',

  // Icons
  '/icons/icon-20.png',
  '/icons/icon-180.png',
  '/icons/icon-512.png',

  // Images
  '/assets/images/banner.png'
];

// Install: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch: cache-first for our app shell, network fallback for others
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        // Optionally cache new requests (for local assets)
        return networkResponse;
      });
    })
  );
});
