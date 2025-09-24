/**
 * Logging utility used by both client side and server (service worker) side of the app. Each side has a separate instance of this object.
 * @param on - true to enable logging, false to disable (errors and warnings are always logged)
 * @param prefix - text prefix to identify the source of the log messages
 * @param color - CSS color name or hex code to use for the prefix background
 * @param shortHeader - padding for the heading style - true for less padding, false for more
 * @constructor
 */
class DebugConsole {
    constructor(prefix = 'DebugConsole Logger', background = 'black', color = 'white', on = true) {
        const cssH1Padding = '2px 8px';
        const cssH1 = `background:${background};color:${color};border:1px solid ${color};padding:${cssH1Padding};border-radius:10px;font-weight:bold;font-size:larger;`;
        const cssPrefix = `background:${background};color:${color};border:1px solid ${color};border-radius:5px;padding:1px 5px;font-weight:bold;font-size:normal;margin-right:5px;`;
        const cssNormal = 'color:unset';

        // debug — Detailed, low-level information for debugging.
        // log — General-purpose messages.
        // info — Informational messages about application state/progress.
        // warn — Warnings about potential issues.
        // error — Errors that require attention.

        // The logging functions. Always log warnings & errors.
        this.warn  = self.console.warn.bind(self.console,  `%c${prefix}%c[WARNING] %s`, cssPrefix, cssNormal);
        this.error = self.console.error.bind(self.console, `%c${prefix}%c[ERROR] %s`, cssPrefix, cssNormal);
        if (on) {
            this.heading = self.console.log.bind(self.console,   `%c%s`, cssH1);
            this.debug   = self.console.debug.bind(self.console, `%c${prefix}%c[DEBUG] %s`, cssPrefix, cssNormal);
            this.log     = self.console.log.bind(self.console,   `%c${prefix}%c[LOG] %s`, cssPrefix, cssNormal);
            this.info    = self.console.info.bind(self.console,  `%c${prefix}%c[INFO] %s`, cssPrefix, cssNormal);
        } else {
            this.heading = function(){};
            this.debug = function(){};
            this.log     = function(){};
            this.info    = function(){};
        }
    }
}

export default DebugConsole;
