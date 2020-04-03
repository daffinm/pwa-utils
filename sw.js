const DEBUG_LOGGING = true;
const WORKBOX_DEBUG = false;

function logRegistration(reg, message, console) {
    message = message ? message : 'Service Worker registration';
    const yes = '✓';
    const no = '𐄂';
    let installing = reg.installing ? yes : no;
    let waiting = reg.waiting ? yes : no;
    let active = reg.active ? yes : no;
    message = `${message}\n - installing: ${installing}\n - waiting:    ${waiting}\n - active:     ${active}`;
    console.log(message);
}

importScripts('js/debug.js');
const debug = new Debug(DEBUG_LOGGING, 'Service Worker', 'indianred');
debug.heading('New Service Worker installing...');
logRegistration(self.registration, 'At startup: registration state', debug);

const WORKBOX_VERSION = "5.1.2";
importScripts(`https://storage.googleapis.com/workbox-cdn/releases/${WORKBOX_VERSION}/workbox-sw.js`);
workbox.setConfig({debug: WORKBOX_DEBUG});
workbox.core.setCacheNameDetails({
    prefix: 'test',
    suffix: 'v1.0.0',
    precache: 'installtime',
    runtime: 'runtime',
});
self.addEventListener('message', (event) => {
    debug.log(`Received message from client: ${event.data.message}`);
    if (event.data.message === 'SKIP_WAITING') {
        debug.log(`Executing skipWaiting()`);
        self.skipWaiting();
    }
});
self.addEventListener('install', function (event) {
    logRegistration(self.registration, 'On install: registration state', debug);
});
const FIRST_TIME = (!self.registration.active);
if (FIRST_TIME) {
    debug.log('Installing for the first time. Activating automatically...');
}
let controlledClients = 0;
self.clients.matchAll().then(function (clientArray) {
    controlledClients = clientArray.length;
    debug.log(`I am currently controlling ${controlledClients} client(s)`);
    if (controlledClients === 0) {
        debug.log('Activating automatically...');
    }
});

// If there are no controlled clients then a new service worker will activate automatically, even if there
// is a previous active version.
self.addEventListener('activate', function(event) {
    logRegistration(self.registration, 'On activate: registration state', debug);
    // Note. Our client page is initially uncontrolled by a service worker because it is not precached. So how do we bring
    // it under control?
    // self.clients.claim() will bring it under control and will cause the oncontrollerchange to fire.
    // Our client page will reload oncontrollerchange.
    // So if claim clients the first time then the page reloads immediately for no apparent reason or gain.
    if (!FIRST_TIME) {
        // debug.log('Claiming all clients...');
        // Note. If no clients are currently controlled by a service worker defined in this file
        // then a new version will activate automatically. Previously uncontrolled clients
        // will then reload even if they have rejected an update....
        // So we cannot do this here.
        // self.clients.claim();
        // Q: So how do we ensure that our clients end up being controlled by this service worker?
        // A: The decision to reload if uncontrolled has to be made by the client.
    }
});

// Note: does not matter if you stick the index.html in precache or runtime cache. First time it runs it will not be
// controlled by a service worker.
// Which came first: the client or the service worker? Answer: the client came first. It spawned the service worker,
// so it must reload in order to be loaded via the service worker and thus be controlled by it.

// workbox.precaching.precacheAndRoute([
//     {"revision":"001","url":"index.html"},
// ]);

workbox.routing.registerRoute(
    new RegExp('.*\.(html|ico|js|json)'),
    // new RegExp('.*\.(ico|js|json)'),
    // Use NetworkFirst strategy so we always get the updated copy from the network, and cache this.
    // Was using StaleFirst but this means you are always one step behind reality.
    new workbox.strategies.NetworkFirst({
        matchOptions: {
            ignoreSearch: true,
            ignoreVary: true,
        }
    })
);




