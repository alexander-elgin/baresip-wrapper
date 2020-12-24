const { spawn } = require('child_process');
const { get } = require('http');
const { fixPath } = require('os-dependent-path-delimiter');
const kill = require('tree-kill');

const eventRegexps = {
    callEstablished: /Call established: (.+)/,
    callReceived: /Incoming call from: ([\+\w]+ )?(\S+) -/,
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
    constructor(processPath, callbacks = {}) {
        this.connected = false;
        this.processPath = fixPath(processPath);
        this.callbacks = {};

        Object.keys(eventRegexps).forEach((event) => {
            this.on(event, callbacks[event] === undefined ? () => {} : callbacks[event]);
        });

        [
            'on',
            'connect',
            'kill',
            'reload',
        ].forEach((method) => {
            this[method] = this[method].bind(this);
        });
    }

    accept() {
        executeCommand('a');
    }

    dial(phoneNumber) {
        executeCommand(`d${phoneNumber}`);
    }

    hangUp() {
        executeCommand('b');
    }

    toggleCallMuted() {
        executeCommand('m');
    }

    on(event, callback) {
        this.callbacks[event] = callback;
    }

    kill(callback) {
        kill(this.process.pid, 'SIGKILL', (err) => {
            if (!err) {
                this.connected = false;

                if (callback !== undefined) {
                    callback();
                }
            }
        });
    }

    reload() {
        this.kill(() => this.connect());
    }

    connect() {
        this.connected = true;
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
}

module.exports = Baresip;
