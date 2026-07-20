const CACHE_VERSION = 'v3';
const CACHE_NAME = `mediroute-cache-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Core shell assets to pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512-maskable.png',
  '/icons/apple-touch-icon.png',
];

// ── Install: pre-cache shell ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Failed to pre-cache: ${url}`, err);
          })
        )
      );
    }).then(() => {
      // Force activate immediately — don't wait for old SW to die
      return self.skipWaiting();
    })
  );
});

// ── Activate: clean up old caches ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('mediroute-cache-') && name !== CACHE_NAME)
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for navigation, cache-first for assets ──
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip Next.js HMR and internal routes
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests: network-first, fallback offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a fresh copy of the navigated page
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Static assets (_next/static, icons, images): cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|woff2?|css)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
