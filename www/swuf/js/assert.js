// A simple assertion library to fascilitate testing and runtime checking. Catch bugs early.
const assert = Object.freeze({
    isTrue: function (condition, failureMessage, data) {
        if(condition) return;
        if(assert.useDebugger) debugger; // Stop everything here and open the debugger.
        let theMessage = (failureMessage ? failureMessage : 'Assertion Failed!');
        theMessage = (arguments.length === 3 ? `${theMessage}: ${data}` : theMessage);
        throw new Error(theMessage);
    },
    isDefined: function (arg, message) {
        let basicFailureMessage = `arg is undefined/null`;
        let failureMessage = (message ? `${basicFailureMessage}\n${message}` : basicFailureMessage);
        assert.isTrue(
            !(typeof arg === 'undefined' || arg === null),
            failureMessage,
            arg);
    },
    isFunction: function (arg, message) {
        let basicFailureMessage = `arg is not a function`;
        let failureMessage = (message ? `${basicFailureMessage}\n${message}` : basicFailureMessage);
        assert.isTrue(
            (typeof arg === 'function'),
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
});

