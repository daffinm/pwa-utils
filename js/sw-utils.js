SwUtils = Object.freeze({
    logRegistration(reg, message, debug) {
        message = message ? message : 'Service Worker registration';
        const yes = '✓';
        const no = '𐄂';
        let installing = reg.installing ? yes : no;
        let waiting = reg.waiting ? yes : no;
        let active = reg.active ? yes : no;
        message = `${message}\n - installing: ${installing}\n - waiting:    ${waiting}\n - active:     ${active}`;
        debug.log(message);
    }
});