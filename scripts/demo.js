const SipPhone = require('..');

void async function () {
    try {
        const sipPhone = new SipPhone('baresip', {
            callEstablished: number => console.log(`!!!!!!!!!!a call with ${number} has been established!!!!!!!!!!`),
            hangUp: number => console.log(`********the call with ${number} has been terminated********`),
            serverConnected: () => {
                SipPhone.dial('1111');
                setTimeout(() => sipPhone.process.stdin.write('/quit\n'), 9600);
            }
        });
    } catch (error) {
        console.error(error);
    }
}();
