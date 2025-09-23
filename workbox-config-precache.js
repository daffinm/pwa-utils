// File generated initially by $ workbox wizard
// For args @see https://developer.chrome.com/docs/workbox/modules/workbox-cli
/**
 * Configuration for injecting a list of all the files that we want to be cached up front. Everything apart from audio files.
 */
const DEMO_DIR = process.env.DEMO_DIR || null;
if (DEMO_DIR === null) {
    throw new Error('DEMO_DIR environment variable must be set');
}

module.exports = {
    globDirectory: `www-deploy/${DEMO_DIR}/`,
    globPatterns: [
        '**/*',
    ],
    swSrc: `www-deploy/${DEMO_DIR}/sw.js`,
    swDest: `www-deploy/${DEMO_DIR}/sw.js`,
    injectionPoint: 'self.__PRECACHE_MANIFEST',
};