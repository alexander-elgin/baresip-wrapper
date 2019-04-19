require('whatwg-fetch');
const spawn = require('child_process').spawn;

const callRegexps = {
    callEstablished: /Call established: (.+)/,
    callReceived: /Incoming call from: (\w+ )?(\S+) -/,
    hangUp: /(.+): session closed/,
};

const executeCommand = command => fetch(`http://127.0.0.1:8000/?${command}`);

class Baresip {
    static accept() {
        executeCommand('a');
    }

    static dial(phoneNumber) {
        executeCommand(`d${phoneNumber}`);
    }

    static hangUp() {
        executeCommand('b');
    }

    static toggleCallMuted() {
        executeCommand('m');
    }

    constructor(processPath, callbacks = {}) {
        this.callbacks = {};

        [
            'serverConnected',
            'ready',
            'hangUp',
            'callReceived',
            'callEstablished',
        ].forEach((event) => {
            this.on(event, callbacks[event] === undefined ? () => {} : callbacks[event]);
        });

        this.connect(processPath);

        [
            'on',
            'connect',
            'kill',
            'reload',
        ].forEach((method) => {
            this[method] = this[method].bind(this);
        });
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    connect(processPath) {
        this.processPath = processPath;
        this.baresip = spawn(this.processPath);

        this.baresip.stdout.on('data', (data) => {
            const parsedData = `${data}`;

            if (parsedData.includes('baresip is ready')) {
                this.callbacks.ready();
            }

            Object.keys(callRegexps).forEach((event) => {
                const matches = parsedData.match(callRegexps[event]);

                if ((matches !== null) && (matches.length > 0)) {
                    this.callbacks[event](matches[matches.length - 1]);
                }
            });

            console.log(parsedData);
        });

        this.baresip.stderr.on('data', (data) => {
            const parsedData = `${data}`;

            if (parsedData.includes('registered successfully')) {
                this.callbacks.serverConnected();
            }

            console.error(parsedData);
        });
    }

    kill() {
        this.baresip.kill();
    }

    reload() {
        this.kill();
        this.connect(this.processPath);
    }
}

module.exports = Baresip;
