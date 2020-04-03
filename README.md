# Test Service Worker Update Flow
Project for exploring and documenting how to get the service worker update flow working perfectly.

1. Run project using `npm start` and goto http://localhost:5001 in Chrome.
1. Open the dev tools console asap and check the console messages to see what's happening.
1. Simulate an upate by adding/removing spaces from the end of the `sw.js` file.
1. Press the 'Check for updates' button
1. Play with accepting and rejecting updates at different times. 
   * Note what happens if you reject an update when the page is not controlled by a service worker.

Comments welcome.
