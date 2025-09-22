// Simple service worker that does nothing but pass through requests.
self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Pass-through: just fetch as normal
    event.respondWith(fetch(event.request));
});
