// Uses assert from assert.js
// Uses SwUtils.logRegistration from sw-utils.js

function ServiceWorkerClient(url, debug, ui) {
    assert.isDefined(url);
    assert.isDefined(debug);
    assert.isDefined(ui);
    assert.isFunction(ui.noUpdateFound);
    assert.isFunction(ui.updateError);
    assert.isFunction(ui.updateFoundReloadNeeded);
    assert.isFunction(ui.confirmUpdateWithUser);
    assert.isFunction(ui.reload);

    // Brilliant prolyfil by dfabulich
    // https://github.com/w3c/ServiceWorker/issues/1222#issuecomment-351566460
    if (!('waiting' in navigator.serviceWorker)) {
        navigator.serviceWorker.waiting = new Promise(function(resolve) {
            navigator.serviceWorker.ready.then(function(reg) {
                function awaitStateChange() {
                    reg.installing.addEventListener('statechange', function() {
                        if (this.state === 'installed') resolve(reg);
                    });
                }
                if (reg.waiting) resolve(reg);
                if (reg.installing) awaitStateChange();
                reg.addEventListener('updatefound', awaitStateChange);
            })
        });
    }
    this.register = function () {
        debug.log('Registering service worker...');
        navigator.serviceWorker.register(url)
            .then(function (reg) {
                SwUtils.logRegistration(reg, 'Service worker registered', debug);
                navigator.serviceWorker.waiting.then(function(reg) {
                    debug.log('New waiting service worker found.');
                    handleUpdateTo(reg, false);
                });
                listenForControllerChangeAndReloadWhenItDoes();
            })
            .catch(function (err) {
                debug.error('Error registering service worker: ', err);
            });
    };
    this.update = function (updateButtonPressed) {
        // Call register as this will trigger an error if the user if offline.
        navigator.serviceWorker.register(url).then(async function (reg) {
            await fetch(url, {method: 'HEAD'}); // trigger error if offline.
            reg.update().then(function (reg) {
                SwUtils.logRegistration(reg, 'Checking for updates', debug);
                if (updateIsAvailable(reg)) {
                    debug.log('Update found by update checker. Handling it...');
                    handleUpdateTo(reg, updateButtonPressed);
                }
                else {
                    debug.log('No update found.');
                    if (updateButtonPressed) {
                        ui.noUpdateFound();
                    }
                }
            })
        })
            .catch(function(err){
                debug.error('Error getting service worker registration: ', err);
                ui.updateError(err);
            });
    };
    //--------------------------------------------------------------------------------------------------------------
    // Private methods
    //--------------------------------------------------------------------------------------------------------------
    function updateIsAvailable(reg) {
        let newSw = (reg.installing || reg.waiting);
        let activeSw = reg.active;
        let isUpdate = (newSw && activeSw);
        return isUpdate;
    }
    function listenForControllerChangeAndReloadWhenItDoes() {
        navigator.serviceWorker.oncontrollerchange = function (e) {
            debug.log('Controller has changed!');
            if (navigator.serviceWorker.controller) {
                debug.log('Controller is new. Reloading....');
                ui.reload();
            }
            else {
                debug.log('Controller has died :-( Doing nothing.');
            }
        };
    }
    let updateButtonHasBeenPressed = false;
    function handleUpdateTo(reg, updateButtonPressed) {
        if (updateButtonPressed) {
            updateButtonHasBeenPressed = true;
        }
        if (!updateButtonPressed && updateButtonHasBeenPressed) {
            // Block call from the waiting promise which comes after call from update checker the first time.
            // Otherwise we run the update routine twice that time.
            // You may say "well, why not just let the waiting listener trigger all updates?" Because if we do this,
            // and the user rejects an update, then the waiting listener will not fire again until we reload.
            // Subsequent clicks on the 'check for updates' button will not find any, even though one is still waiting
            // to be told to skip.
            debug.log('Blocking redundant attempt to handle update.');
            return;
        }
        let newSw = (reg.installing || reg.waiting);
        let activeSw = reg.active;
        let isFirstTime = (newSw && !activeSw);
        let isUpdate = (newSw && activeSw);
        if (!newSw) {
            debug.error('No update to handle!');
        }
        if (isFirstTime) {
            debug.log('Service worker installing for the first time. Activation should be automatic.');
        }
        if (isUpdate) {
            if (navigator.serviceWorker.controller) {
                ui.confirmUpdateWithUser(function (acceptUpdate) {
                    if (acceptUpdate) {
                        debug.log('++OK: Proceeding with update...');
                        debug.log('Sending SKIP_WAITING command to new service worker so that it activates.')
                        newSw.postMessage({message: 'SKIP_WAITING'});
                    } else {
                        debug.log('++CANCEL: update rejected by user.');
                        // The rejected update will be stuck in the waiting state where we will find it the next
                        // time we press the update button, or the next time we reload.
                    }
                });
            } else {
                // If we are uncontrolled then the update will have activated automatically - whether we like it
                // or not.
                // In addition, oncontrollerchange will not have fired since we are not currently controlled.
                // So we need to play catch up, and reload so we become controlled by our service worker.
                // If we don't do this now then we will have to wait until we reload or restart, or for another update,
                // in order to become controlled by our service worker.
                debug.log('New service worker is activating automatically. Reloading to become controlled by it.');
                ui.updateFoundReloadNeeded();
            }
        }
    }
}
