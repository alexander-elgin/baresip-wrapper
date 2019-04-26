const { spawn } = require('child_process');
const { get } = require('http');
const { fixPath } = require('os-dependent-path-delimiter');

const eventRegexps = {
    callEstablished: /Call established: (.+)/,
    callReceived: /Incoming call from: (\w+ )?(\S+) -/,
    hangUp: /(.+): session closed/,
    ready: /baresip is ready/,
    serverConnected: /\[1 binding\]/,
};

const options = { host: '127.0.0.1', port: '8000', agent: false };
const nop = () => {};

const executeCommand = (command) => {
    options.path = `/?${command}`;
    get(options, nop);
};

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

        Object.keys(eventRegexps).forEach((event) => {
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
        this.processPath = fixPath(processPath);
        this.process = spawn(this.processPath);

        this.process.stdout.on('data', (data) => {
            const parsedData = `${data}`;

            Object.keys(eventRegexps).forEach((event) => {
                const matches = parsedData.match(eventRegexps[event]);

                if ((matches !== null) && (matches.length > 0)) {
                    this.callbacks[event](matches[matches.length - 1]);
                }
            });

            console.log(parsedData);
        });

        this.process.stderr.on('data', (data) => console.error(`${data}`));
    }

    kill() {
        this.process.kill();
    }

    reload() {
        this.kill();
        this.connect(this.processPath);
    }
}

module.exports = Baresip;
