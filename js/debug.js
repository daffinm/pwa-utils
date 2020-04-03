
function Debug(on, prefix, color) {
    prefix = (prefix ? prefix : 'Debug Logger');
    color = (color ? color : 'black');
    const headerMessageStyle = `border:1px solid ${color};border-radius:10px;padding:10px 30px;font-weight:bold;font-size:larger;background:${color};color:white;`;
    const prefixStyle = `border:1px solid ${color};border-radius:5px;padding:1px 5px;font-weight:bold;font-size:normal;background:${color};color:white;margin-right:5px;`;
    const normalStyle = 'color:unset';

    this.turnOn = function (on) {
        if (on) {
            this.heading = self.console.log.bind(self.console, `%c%s`, headerMessageStyle);
            this.log     = self.console.log.bind(self.console,   `%c${prefix}%c%s`, prefixStyle, normalStyle);
            this.info    = self.console.info.bind(self.console,  `%c${prefix}%c%s`, prefixStyle, normalStyle);
            this.warn    = self.console.warn.bind(self.console,  `%c${prefix}%c[WARNING] %s`, prefixStyle, normalStyle);
            this.error   = self.console.error.bind(self.console, `%c${prefix}%c[ERROR] %s`, prefixStyle, normalStyle);
            this.debug   = self.console.debug.bind(self.console, `%c${prefix}%c[DEBUG] %s`, prefixStyle, normalStyle);
        }
        else {
            this.heading = function(){};
            this.log =     function(){};
            this.info =    function(){};
            this.warn =    function(){};
            this.error =   function(){};
            this.debug =   function(){};
        }
    };
    this.turnOn(on);
}

const assert = {
    isTrue: function (condition, failureMessage, data) {
        if(condition) return;
        if(assert.useDebugger) debugger; // Stop everything here and open the debugger.
        let theMessage = (failureMessage ? failureMessage : 'Assertion Failed!');
        theMessage = (arguments.length === 3 ? `${theMessage}: ${data}` : theMessage);
        throw new Error(theMessage);
    },
    isDefined: function (arg, argName, message) {
        argName = (argName ? argName : 'arg');
        let basicFailureMessage = `${argName} is undefined/null`;
        let failureMessage = (message ? `${basicFailureMessage}\n${message}` : basicFailureMessage);
        assert.isTrue(
            !(typeof arg === 'undefined' || arg === null),
            failureMessage,
            arg);
    },
    equals(expected, actual) {
        if (!(expected === actual)) {
            throw new Error(`assert equals failed!\n - expected: ${expected}\n - actual:   ${actual}`);
        }
    },
    fail(message) {
        throw new Error(message);
    }
};
