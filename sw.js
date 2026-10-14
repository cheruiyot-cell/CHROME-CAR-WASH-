/* CHROME — Service Worker v4.1
   Fixes: extensionless-safe SHELL (uses .html consistently),
   network-first for book.html so the booking flow can't go stale,
   Promise.allSettled so a single missing asset doesn't kill install. */

const CACHE = 'chrome-v4-1';
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
  'manifest.webmanifest',
  'icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(SHELL.map(url => cache.add(url).catch(() => null)));
    await self.skipWaiting();
  })());
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

  // Booking flow: network-first so the user never sees stale state.
  if (isSameOrigin && (url.pathname === '/book.html' || url.pathname === '/book')) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(req)) || caches.match('offline.html');
      }
    })());
    return;
  }

  // Navigation: cache-first with background refresh.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; })
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
        .then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      return cached || (await network) || Response.error();
    })());
    return;
  }

  // Trusted CDNs: cache-first, opportunistically cache.
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