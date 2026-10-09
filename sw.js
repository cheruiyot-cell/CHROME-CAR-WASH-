/* CHROME — Service Worker v1 */
const CACHE = 'chrome-v2';
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
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Don't cache cross-origin fonts/images aggressively — let them hit cache network-first
  const isSameOrigin = url.origin === self.location.origin;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('offline.html'))
    );
    return;
  }

  if (isSameOrigin) {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => cached))
    );
    return;
  }

  // Cross-origin (fonts, images): cache-first with network fallback
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok && (url.hostname.includes('fonts.') || url.hostname.includes('unsplash'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => cached))
  );
});