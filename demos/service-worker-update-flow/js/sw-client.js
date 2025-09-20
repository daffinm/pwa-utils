// Uses assert from assert.js

function ServiceWorkerClient(url, debug, ui) {

    if (serviceWorkerIsUnsupported()) return;

    assert.isDefined(url);
    assert.isDefined(debug);
    assert.isDefined(ui);
    assert.isFunction(ui.updateError);
    assert.isFunction(ui.updateFoundConfirmWithUser);
    assert.isFunction(ui.updateFoundReloadNeeded);
    assert.isFunction(ui.updateNotFound);
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

        if (serviceWorkerIsUnsupported()) return;

        debug.log('Registering service worker...');
        navigator.serviceWorker.register(url)
            .then(function (reg) {
                logRegistration(reg, 'Service worker registered', debug);
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
    // Mostly this will be called as a result of a user interaction such as a 'check for updates' button being pressed.
    // If not then override this default by calling this method with false.
    this.update = function (updateButtonPressed) {

        if (serviceWorkerIsUnsupported()) return;

        // Default
        if (typeof updateButtonPressed === 'undefined' || updateButtonPressed === null) {
            updateButtonPressed = true;
        }

        debug.log(`Checking for updates to service worker (updateButtonPressed=${updateButtonPressed})`);

        // Call register as this will trigger an error if the user if offline.
        navigator.serviceWorker.register(url).then(async function (reg) {
            await fetch(url, {method: 'HEAD'}); // trigger error if offline.
            reg.update().then(function (reg) {
                logRegistration(reg, 'Update check complete. Registration state:');
                if (updateIsAvailable(reg)) {
                    debug.log('Update found by update checker. Handling it...');
                    handleUpdateTo(reg, updateButtonPressed);
                }
                else {
                    debug.log('No update found.');
                    if (updateButtonPressed) {
                        ui.updateNotFound();
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
    function serviceWorkerIsUnsupported() {
        if (!('serviceWorker' in navigator)) {
            debug.warn('Service Workers are not supported by this browser.');
            return true;
        }
        else {
            return false;
        }
    }
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
                debug.log('Controller is NEW. Reloading....');
                ui.reload();
            }
            else {
                debug.log('Controller is DEAD :-( Doing nothing.');
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
                ui.updateFoundConfirmWithUser(function (acceptUpdate) {
                    if (acceptUpdate) {
                        debug.log('++OK: Proceeding with update...');
                        debug.log('Sending SKIP_WAITING command to new service worker so that it activates.');
                        // TODO ensure your service worker implements a message listener that looks for messages like this.
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
                // The assumption here is that this app is not running in multiple tabs in the same browser, in different
                // states in each tab. If you have an advanced use case that needs this then - DIY :)
                debug.warn('This client is NOT controlled by the service worker.\n - New service worker should activate automatically.\n - Reload is needed NOW.');
                ui.updateFoundReloadNeeded(function () {
                    debug.warn('User has acknowledged. Reloading application...');
                    ui.reload();
                });
            }
        }
    }
}

// Demo ui callback object - implements an interface (I wish) that enables us to decouple the service worker
// client from the app that's using it.
function SimpleUI(debug) {
    this.updateError = function (err) {
        alert(`Error!\n\nCannot check for updates.\n\nAre you offline?`);
    };
    this.updateFoundConfirmWithUser = function (callback) {
        if (confirm(`Update available!\n\nAn update is available for this app.\n\nUse it now?`)) {
            callback(true);
        }
        else {
            callback(false);
        }
    };
    this.updateFoundReloadNeeded = function (callback) {
        // Called when an update is found but the client is not controlled by the service worker. This means that
        // the update will activate automatically. So the client will need to play catch up with the service worker:
        // to reload so that it becomes controlled by it (assuming it is routed through it).
        //
        // This method enables you to inform the user that an update/reload is about to happen.
        // - Give them time to register and respond to this message with with an alert dialog of some kind, then call
        //   the callback to signal that this has been done.
        // - The aim here is to give the user some sense of control over something that just has to happen, whether
        //   they like it or not.
        // - ui.reload() will then be called automatically by the swc as the next step.
        alert('Update found!\n\nApp will reload when you press OK.');
        callback();
    };
    this.updateNotFound = function () {
        alert(`No update found\n\nYou are already on the latest version.`);
    };
    this.reload = function () {
        debug.warn('Reloading app...');
        document.body.style = 'color: red;';
        setTimeout(() => window.location.reload(), 1000);
    };
}

