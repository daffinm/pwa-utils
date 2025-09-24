const BUILD_RELEASE = '__BUILD_RELEASE';
const BUILD_DATE = '__BUILD_DATE';
const BUILD_NUMBER = '__BUILD_NUMBER';
const APP_VERSION = '__APP_VERSION';


const DEBUG_LOGGING = true;
const WORKBOX_DEBUG = true;


importScripts('./js/debug-console.js');
importScripts('./js/assert.js');
const debug = new DebugConsole(`SW v${APP_VERSION}`, 'indianred', DEBUG_LOGGING);

debug.heading('New Service Worker installing');

const WORKBOX_VERSION = "7.3.0";
importScripts(`https://storage.googleapis.com/workbox-cdn/releases/${WORKBOX_VERSION}/workbox-sw.js`);
workbox.setConfig({debug: WORKBOX_DEBUG});
workbox.core.setCacheNameDetails({
    prefix: 'swuf',
    suffix: `v${BUILD_RELEASE}`,
    precache: 'installtime',
    runtime: 'runtime',
});

// New
self.addEventListener('message', (event) => {
    assert.isDefined(event.data);
    assert.isDefined(event.data.type);
    debug.log(`Message from client: ${event.data.type}`);
    if (event.data.type === 'SKIP_WAITING') {
        debug.log(`Executing skipWaiting()`);
        self.skipWaiting();
    }
});




