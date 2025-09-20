# PWA Utils
Project for some reusable bits and pieces for PWAs. Experimental.
* CDN https://cdn.jsdelivr.net/gh/daffinm/pwa-utils@latest/

Comments and improvements welcome.

## Safe Area Insets
This will be a tiny library to help with handling safe area insets. Before even starting on this part I need to check if 
someone else has already done it. But before I do, this is what I am thinking do doing:

* A single master `safe-area-insets` css or js file that yields the safe area inset values as css variables that can then be used in other css files.
* Safe area insets have been around for a while now, so I need to check browser support.
* `dvh` and `dvw` units are also available now, so I need to check if these are a better solution, and how widely supported they are.
* What seems to be true is that safe area insets are currently better supported than dvh/dvw.
* What is needed is something else that can be derived and used whatever the browser support situation is.
* The env vars I think are needed are:
  * `--evh` - effective viewport height
  * `--evw` - effective viewport width
* These can be used to set the dimensions of a the pwa div, and need to be recalculated on orientation change and resize.
* I think that this recalculation can happen automatically in css plain css, (`constant()` and `env()` etc)
* But it may be necessary to augment the css with some javascript to handle orientation change and resize events.
  * In javascript we also have `CSS.supports()` to check for support for the various things we might want to use, but I don't know how widely supported this is.
  * I also need to check how widely supported `window.visualViewport` is.
  * If we need to use javascript to do the calculations and set the css variables, then we can also use it to detect support for the various things we might want to use.
* I want a small one file solution that can be used as a starting point for any PWA.
  * If we use javascript then this can write a style element into the bottom of the head element, so that the css variables are available to all other css files.
  * This css element will have a small amount of css to set the css variables, and also to set the dimensions of the main pwa div (the id of which can be passed as a parameter, with a sensible default e.g. `app` or `pwa`.
* The solution will also provide a way of testing safe area insets with your pwa, e.g. by providing an override class that can be applied to the document element or the pwa div.
  * The override class will enable you to simulate safe area insets so that you can see how your pwa looks and behaves with safe area insets.
* Create a simple demo app that shows the safe area insets working.
  * The demo for this part will be a simple pwa that shows the safe area insets working, and also has a button to toggle the override class on and off?
  * The demo will display the values for all the variables that are being used, written into the document by javascript, and updated on orientation change and resize.
  

## Test Service Worker Update Flow
The main thing I am starting with is exploring and documenting how to get the service worker update flow working perfectly (or well enough).

See directory: `service-worker-update-flow`

### Purpose of this part

* I want to get to the bottom of the whole service worker update flow in a simplified test space. 
* I want a piece of reusable code that solves the whole problem of handing updates to PWAs. 

### Questions
* How the hell did I deploy this demo to firebase? I cannot remember. Did I ever?
  * I think I actually didn't. I created another project (media-cache-test) and deployed that to firebase.
* What is the workbox solution to this problem like now? Last time I looked it was not good enough.
* Is there a better solution out there already?
* How do I move this code into a subdirectory of a project, so that it can be used as a module?

### Use case

The simple use case here (which I suspect is the main one) is:

1. Publish update to PWA.
1. User is notified next time they: reload/restart the simpleUI, or press a 'check for updates' button somewhere in the UI, or the update 
is discovered because of some kind of periodic background check (I think that's it).
1. User is given the option to use the update now or later. 
   * Updates cannot be rejected indefinitely in PWA land.
   * By the time the user hears of the update it has already been installed and is waiting to become active.
1. If the user accepts the update the new service worker version is activated and, once this happens, the simpleUI reloads to get
itself in sync with the new back end.
1. If the user rejects the update they carry on using the old version of the service worker and UI until next time one of the 
three things mentioned in step 2 happens again. 
1. At this point they will get the option, again, to accept or reject the update for the time being. 
   * The fact that they may have rejected an update before should not stop them changing their mind later.
1. The only exception to this is when the simpleUI is first accessed and the first version of the service worker is installed
on the user's machine (browser). 
   * At this point the page ('client') will not be controlled, so any update will activate 
automatically. 
   * If an update is found at this point the client must be forced to catch up and become controlled by the new service worker, otherwise
we will have a v1 client being served by a v2+ service worker, and things will get increasingly out  of whack.

The code here attempt so do all of this as simply as possible. 

Have I missed anything, or misunderstood, or made it too complicated? 

### Running and playing with the demo app

1. Run project using `npm start` and goto http://localhost:5001 in Chrome.
1. Open the dev tools console asap and check the console messages to see what's happening.
1. Simulate an upate by adding/removing spaces to/from the end of the `sw.js` file.
1. Press the 'Check for updates' button
1. Play with accepting and rejecting updates at different times. 
   * Note what happens if you reject an update when the page is not controlled by a service worker.
   
![Uncontrolled client](img/controller-absent.png)
![Controlled client](img/controller-present.png)


### Background reading

* https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68
* https://github.com/w3c/ServiceWorker/issues/1222
* https://github.com/w3c/ServiceWorker/issues/1247
* https://github.com/GoogleChrome/workbox/issues/2431
