const spawn = require('child_process').spawn;

const callRegexps = {
    callEstablished: /Call established: (.+)/,
    callReceived: /Incoming call from: (\d+ )?(\S+) -/,
    hangUp: /(.+): session closed/,
};

const keyErrorLogs = {
    callMuted: 'call muted',
    callUnmuted: 'call un-muted',
    serverConnected: 'registered successfully',
};

class Baresip {
    constructor(processPath, callbacks = {}) {
        this.callbacks = {};

        [
            'serverConnected',
            'ready',
            'hangUp',
            'callReceived',
            'callEstablished',
            'callMuted',
            'callUnmuted',
        ].forEach((event) => {
            this.on(event, callbacks[event] === undefined ? () => {} : callbacks[event]);
        });

        this.connect(processPath);

        [
            'on',
            'connect',
            'hangUp',
            'kill',
            'reload',
            'accept',
            'dial',
            'toggleCallMuted',
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
                    this.callbacks[event](matches[matches.length - 1].replace('SIP ', ''));
                }
            });

            console.log(parsedData);
        });

        this.baresip.stderr.on('data', (data) => {
            const parsedData = `${data}`;

            Object.keys(keyErrorLogs).forEach((event) => {
                if (parsedData.includes(keyErrorLogs[event])) {
                    this.callbacks[event]();
                }
            });

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

    executeCommand(command) {
        this.baresip.stdin.write(`/${command}\n`);
    }

    accept() {
        this.executeCommand('accept');
    }

    dial(phoneNumber) {
        this.executeCommand(`dial ${phoneNumber}`);
    }

    hangUp() {
        this.executeCommand('hangup');
    }

    toggleCallMuted() {
        this.executeCommand('mute');
    }
}

module.exports = Baresip;
