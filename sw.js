/* CHROME — Service Worker v3
   Navigation uses stale-while-revalidate so cached pages load instantly
   on 3G. Cache name bumped to force a clean install of the new strategy. */
const CACHE = 'chrome-v3';
const SHELL = [
  'index.html',
  'services.html',
  'pricing.html',
  'gallery.html',
  'reviews.html',
  'about.html',
  'contact.html',
  'book.html',
  'offline.html',
  'style.css',
  'script.js',
  'booking.js',
  'manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Navigation requests: serve cache immediately, refresh in background.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);

      const network = fetch(req)
        .then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) return cached;
      const fresh = await network;
      if (fresh) return fresh;
      return caches.match('offline.html');
    })());
    return;
  }

  // Same-origin assets: cache-first with background refresh.
  if (isSameOrigin) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);

      const network = fetch(req)
        .then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      return cached || (await network) || Response.error();
    })());
    return;
  }

  // Cross-origin (fonts, images): cache-first, opportunistically cache
  // only successful same-host responses from known CDNs.
  const trustedCDN =
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('images.unsplash.com');

  e.respondWith((async () => {
    if (!trustedCDN) return fetch(req);

    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;

    try {
      const res = await fetch(req);
      if (res && res.ok && res.type !== 'opaque') cache.put(req, res.clone());
      return res;
    } catch {
      return cached || Response.error();
    }
  })());
});