const BUILD_RELEASE = '__BUILD_RELEASE';
const BUILD_DATE = '__BUILD_DATE';
const BUILD_NUMBER = '__BUILD_NUMBER';
const APP_VERSION = '__APP_VERSION';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    self.clients.claim();
});