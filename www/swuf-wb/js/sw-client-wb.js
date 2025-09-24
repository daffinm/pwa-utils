import {Workbox} from 'https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-window.prod.mjs';
import assert from './assert.js';
import DebugConsole from './debug-console.js';



export class WorkboxServiceWorkerClient {

    constructor(url,
                ui = new SimpleUI(),
                debug = new DebugConsole("Service Worker Client", 'lightblue')) {

        assert.isDefined(url);
        assert.isDefined(ui);
        assert.isFunction(ui.updateError);
        assert.isFunction(ui.updateFoundConfirmWithUser);
        assert.isFunction(ui.updateFoundReloadNeeded);
        assert.isFunction(ui.updateNotFound);
        assert.isFunction(ui.reload);

        this.url = url;
        this.ui = ui;
        this.debug = debug;

        // Brilliant prolyfil by dfabulich
        // https://github.com/w3c/ServiceWorker/issues/1222#issuecomment-351566460
        if (!('waiting' in navigator.serviceWorker)) {
            navigator.serviceWorker.waiting = new Promise(function (resolve) {
                navigator.serviceWorker.ready.then(function (reg) {
                    function awaitStateChange() {
                        reg.installing.addEventListener('statechange', function () {
                            if (this.state === 'installed') resolve(reg);
                        });
                    }

                    if (reg.waiting) resolve(reg);
                    if (reg.installing) awaitStateChange();
                    reg.addEventListener('updatefound', awaitStateChange);
                })
            });
        }
    }

    register() {

        if (this._isServiceWorkerUnsupported()) return;

        this.debug.log('Registering service worker...');
        navigator.serviceWorker.register(url)
            .then(reg=> {
                this.debug.log("Service worker registered.");
                this._logRegistrationState(reg, 'Service worker registered');
                navigator.serviceWorker.waiting.then(reg => {
                    this.debug.log('New waiting service worker found.');
                    this.handleUpdateTo(reg, false);
                });
                this.listenForControllerChangeAndReloadWhenItDoes();
            })
            .catch(err => {
                this.debug.error('Error registering service worker: ', err);
            });
    }

    /**
     * Check for an update to the service worker, and if found, handle it.
     * Mostly this will be called as a result of a user interaction such as a 'check for updates' button being pressed.
     * If not then override the default by calling this method with false.
     */
    update(updateButtonPressed = true) {

        if (this._isServiceWorkerUnsupported()) return;

        this.debug.log(`Checking for updates to service worker (updateButtonPressed=${updateButtonPressed})`);

        // Call register as this will trigger an error if the user if offline.
        navigator.serviceWorker.register(url).then(async reg => {
            await fetch(url, {method: 'HEAD'}); // trigger error if offline.
            reg.update().then(reg => {
                this._logRegistrationState(reg, 'Update check complete. Registration state:');
                if (this._isUpdateAvailable(reg)) {
                    debug.log('Update found by update checker. Handling it...');
                    handleUpdateTo(reg, updateButtonPressed);
                }
                else {
                    debug.log('No update found.');
                    if (updateButtonPressed) {
                        this.ui.updateNotFound();
                    }
                }
            });
        })
        .catch(err =>{
            debug.error('Error getting service worker registration: ', err);
            this.ui.updateError(err);
        });
    }

    //--------------------------------------------------------------------------------------------------------------
    // Private methods
    //--------------------------------------------------------------------------------------------------------------
    isServiceWorkerSupported() {
        return !this._isServiceWorkerUnsupported();
    }
    _isServiceWorkerUnsupported() {
        if (!('serviceWorker' in navigator)) {
            debug.warn('Service Workers are not supported by this browser.');
            return true;
        }
        else {
            return false;
        }
    }

    _logRegistrationState(reg, message = 'Service Worker registration state:') {
        const yes = '✓';
        const no = '✗';

        const swInstalling = reg.installing ? yes : no;
        const swInstallingState = reg.installing ? `(${reg.installing.state})` : '';
        const swWaiting = reg.waiting ? yes : no;
        const swWaitingState = reg.waiting ? `(${reg.waiting.state})` : '';
        const swActive = reg.active ? yes : no;
        const swActiveState = reg.active ? `(${reg.active.state})` : '';

        let fullMessage = `${message}:\n`;
        fullMessage += `---------------------------------------\n`;
        fullMessage += `| Worker     | Status\n`;
        fullMessage += `---------------------------------------\n`;
        fullMessage += `| installing | ${swInstalling} ${swInstallingState}\n`;
        fullMessage += `| waiting    | ${swWaiting} ${swWaitingState}\n`;
        fullMessage += `| active     | ${swActive} ${swActiveState}\n`;
        fullMessage += `---------------------------------------`;
        this.debug.log(fullMessage);
    }


    _isUpdateAvailable(reg) {
        let newSw = (reg.installing || reg.waiting);
        let activeSw = reg.active;
        let isUpdate = (newSw && activeSw);
        return isUpdate;
    }

    listenForControllerChangeAndReloadWhenItDoes() {
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

    handleUpdateTo(reg, updateButtonPressed = false) {
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
                this.ui.updateFoundConfirmWithUser(function (acceptUpdate) {
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

/**
 * @interface AppUI
 * Interface definition for the UI callback object that you must provide to the ServiceWorkerClient constructor.
 * This enables the service worker client to inform the user about what is happening, and to input where necessary.
 * Decouple the service worker client from the app that is using it.
 */
export class AppUI {
    updateError(err) {}
    updateFoundConfirmWithUser(callback) {}
    updateFoundReloadNeeded(callback) {}
    updateNotFound() {}
    reload() {}
}

/**
 * A simple demo implementation of the AppUI interface using alert() and confirm() dialogs.
 * You should provide your own implementation of the AppUI interface to the ServiceWorkerClient constructor.
 * @extends AppUI
 * @constructor
 * @param debug - DebugConsole instance for logging
 */
export class SimpleUI {
    constructor(debug = new DebugConsole('SimpleUI', 'teal')) {
        this.debug = debug;
    }

    updateError(err) {
        this.debug.error("Error checking for updates: ", err);
        alert(`Error!\n\nCannot check for updates.\n\nAre you offline?`);
    }

    updateFoundConfirmWithUser(callback) {
        if (confirm(`Update available!\n\nAn update is available for this app.\n\nUse it now?`)) {
            callback(true);
        }
        else {
            callback(false);
        }
    }

    /**
     * Called when an update is found but the client is not controlled by the service worker. This means that
     * the update will activate automatically. So the client will need to play catch up with the service worker:
     * to reload so that it becomes controlled by it (assuming it is routed through it).
     *
     * This method enables you to inform the user that an update/reload is about to happen.
     * - Give them time to register and respond to this message with with an alert dialog of some kind, then call
     *   the callback to signal that this has been done.
     * - The aim here is to give the user some sense of control over something that just has to happen, whether
     *   they like it or not.
     * - ui.reload() will then be called automatically by the swc as the next step.
     * @param callback
     */
    updateFoundReloadNeeded(callback) {
        callback();
    }

    updateNotFound() {
        alert(`No update found\n\nYou are already on the latest version.`);
    }

    reload() {
        const message = 'The app will reload now to complete the update.';
        debug.warn(message);
        document.body.style = 'color: red;';
        alert(message);
        setTimeout(() => window.location.reload(), 3000);
    }
}

