const BUILD_RELEASE = '__BUILD_RELEASE';
const BUILD_DATE = '__BUILD_DATE';
const BUILD_NUMBER = '__BUILD_NUMBER';
const APP_VERSION = '__APP_VERSION';

const APP_NAME = 'Service Worker Update Flow Demo';

const debug = new DebugConsole("index.js");

debug.log(`Running ${APP_NAME} [${APP_VERSION}]`);
document.getElementById('version').innerHTML = APP_VERSION;