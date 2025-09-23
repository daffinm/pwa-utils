const BUILD_RELEASE = '__BUILD_RELEASE';
const BUILD_DATE = '__BUILD_DATE';
const BUILD_NUMBER = '__BUILD_NUMBER';
const APP_VERSION = '__APP_VERSION';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            const clients = await self.clients.matchAll({ type: 'window' });
            for (const client of clients) {
                client.navigate(client.url);
            }
            self.clients.claim();
        })()
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
});
