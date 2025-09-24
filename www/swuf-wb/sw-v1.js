const BUILD_RELEASE = '__BUILD_RELEASE';
const BUILD_DATE = '__BUILD_DATE';
const BUILD_NUMBER = '__BUILD_NUMBER';
const APP_VERSION = '__APP_VERSION';


const DEBUG_LOGGING = true;
const WORKBOX_DEBUG = false;

function logRegistration(reg, message) {
    message = message ? message : 'Service Worker registration';
    const yes = '✓';
    const no = '𐄂';
    let installing = reg.installing ? yes : no;
    let waiting = reg.waiting ? yes : no;
    let active = reg.active ? yes : no;
    message = `${message}\n - installing: ${installing}\n - waiting:    ${waiting}\n - active:     ${active}`;
    debug.log(message);
}

function countControlledClients() {
    self.clients.matchAll().then(function (clientArray) {
        let controlledClients = clientArray.length;
        debug.log(`I am currently controlling ${controlledClients} client(s).`);
    });
}

importScripts('js/debug-console.js');
importScripts('js/assert.js');
const debug = new DebugConsole('Service Worker', 'indianred');

debug.heading('New Service Worker installing...');

const FIRST_TIME = (!self.registration.active);
if (FIRST_TIME) {
    debug.log('Installing for the first time. Activating automatically...');
}

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

self.addEventListener('install', function (event) {
    logRegistration(self.registration, 'install event handler. Registration state:', debug);
    countControlledClients();
});

// If there are no controlled clients then a new service worker will activate automatically, even if there
// is a previous active version. And it will carry on doing this each time until a client becomes controlled.
self.addEventListener('activate', function(event) {
    logRegistration(self.registration, 'activate event handler. Registration state:', debug);
    countControlledClients();
    // Note. Our client page is initially uncontrolled by a service worker because it was not served by a the
    // service worker. So how do we bring it under control in a way that does not take control away from the user?
    // ---
    // self.clients.claim() will bring clients under control of this service worker. This means that requests from those
    // clients will be handled by this service worker. It will also cause the oncontrollerchange event to fire in the
    // client, causing our client page to reload (that's how its configured).
    // ---
    // If we  claim clients the first time the service worker installs then the page reloads on startup at activation,
    // here, for no apparent reason or gain. So don't do it.
    if (!FIRST_TIME) {
        // And so I thought I might claim clients here... But that's not going to work either.
        // If no clients are currently controlled by the service worker defined in this file then a new version will
        // activate *automatically* causing the oncontrollerchange event to fire in the previously uncontrolled clients
        // leading to a reload. This will happen even if the user has rejected the update. So we cannot do this here.
        // ---
        // self.clients.claim();
        // ---
        // Q: So how do we ensure that our clients end up being controlled by this service worker?
        // A: The decision to reload if uncontrolled has to be made (or to appear to have been made) by the user.
    }
});

// Note: does not matter if you stick the index.html in precache or runtime cache. Does not matter which cache stragegy
// you use. First time the simpleUI runs it will not be controlled by a service worker. Because the page loads, then
// registers the service worker for the first time, which then installs and activates and starts handling fetches from the
// simpleUI clients.
// ---
// workbox.precaching.precacheAndRoute([
//     {"revision":"001","url":"index.html"},
// ]);
workbox.routing.registerRoute(
    new RegExp('.*\.(css|html|ico|js|json)'),
    // Use NetworkFirst strategy so we always get the updated copy from the network, and cache this.
    // Was using StaleFirst but this means you are always one step behind reality.
    new workbox.strategies.NetworkFirst({
        matchOptions: {
            ignoreSearch: true,
            ignoreVary: true,
        }
    })
);



