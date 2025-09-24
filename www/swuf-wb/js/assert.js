/**
 * A simple assertion library to facilitate testing and runtime checking. Catch bugs early.
 * Usage:
 *   import { assert } from 'js/assert.js';
 *   assert.isTrue(someCondition, 'Optional message', optionalData, useDebugger);
 *   assert.isFalse(someCondition, 'Optional message', optionalData, useDebugger);
 *   assert.isDefined(someArg, useDebugger);
 *   assert.isFunction(someArg, 'Optional message', useDebugger);
 *   assert.equals(expectedValue, actualValue, 'Optional message', useDebugger);
 *   assert.fail('Message', useDebugger);
 *
 * The optional useDebugger argument (default true) will trigger the debugger statement before throwing the error.
 * This allows you to inspect the state of the program at the point of failure.
 */
class  AppAsserter {
    isTrue(condition, message = 'Assertion Failed!', data = null, useDebugger = true) {
        if(condition) return; // It IS true - nothing to do.
        let theMessage = (data ? `${message}:\n${data}` : message);
        this._throwError(theMessage, useDebugger);
    }
    isFalse(condition, message = 'Assertion Failed!', data = null, useDebugger = true) {
        if(!condition) return; // It IS false - nothing to do.
        let theMessage = (data ? `${message}:\n${data}` : message);
        this._throwError(theMessage, useDebugger);
    }
    isDefined(arg, useDebugger = true) {
        const argIsUndefinedOrNull = (typeof arg === 'undefined' || arg === null);
        if (!argIsUndefinedOrNull) return; // It IS defined - nothing to do.
        this._throwError(`arg is ${arg}`, useDebugger);
    }
    isFunction(arg, message = null, useDebugger = true) {
        let defaultMessage = `${arg}() is not a function!}`;
        let actualMessage = (message ? `${defaultMessage}\n${message}` : defaultMessage);
        if (typeof arg != 'function') {
            this._throwError(actualMessage, useDebugger);
        }
    }
    equals(expected, actual, message = "Assertion Failed!", useDebugger = true) {
        if (!(expected === actual)) {
            this._throwError(`${message}\n - expected: ${expected}\n - actual:   ${actual}`, useDebugger);
        }
    }
    fail(message, useDebugger = true) {
        this._throwError(message, useDebugger);
    }
    _throwError(message, useDebugger) {
        const frame = 3; // The stack frame to report as the caller.
        if(useDebugger) debugger; // Stop everything here and open the debugger.
        throw new Error(`${message}\nCaller: ${new Error().stack.split('\n')[frame]?.trim()}`);
    }
}
export const assert = new AppAsserter();