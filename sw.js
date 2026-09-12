const CACHE_NAME = 'bill-gen-v21'; // 🆕 v29 (fail-safe install)
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './script.js',
  './update.js',
  './bills-history-actions.js',
  './bills-edit-actions.js',
  './bills-download-actions.js',
  './new-bill-order.js',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. 🛡️ FAIL-SAFE INSTALL:
// Ek file missing ho to SIRF wo skip hogi — poora cache NAHI tootega!
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS.map(url => 
          cache.add(url).catch(err => {
            console.warn('⚠️ Cache skip (file missing?):', url);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. Clear old caches on activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Old cache deleted:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Network first, fallback to cache
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
