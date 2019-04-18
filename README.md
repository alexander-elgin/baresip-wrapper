# BareSIP NodeJS Wrapper

## Install
```sh
$ npm install baresip-wrapper
```

## Usage
```javascript
import Baresip from 'baresip-wrapper';

const baresip = new Baresip('command to start baresip');
```

## Methods

* accept () *to accept an incoming call*
* dial (phoneNumber) *to dial the phone number*
* hangUp () *to hang up*
* kill () *to kill the spawned process.*
* on (event, callback) *to set event handlers*
* reload () *to re-create the spawned process (it is required e.g. once the accounts file has been changed)* 
* toggleCallMuted ()  *to mute or unmute your microphone for the current call*

## Events

* **ready** *BareSIP has been initialized*
* **serverConnected** *BareSIP has been connected to the SIP server provider*
* **hangUp** *the phone has been hanged up on the other side*
* **callEstablished** *your outgoing call has been accepted by the other side*
* **callReceived** *an incoming call has been received*
* **callMuted** *your microphone has been muted for the current call*
* **callUnmuted** *your microphone has been un-muted for the current call*

phone number is provided as an argument for the following event handlers

* hangUp
* callReceived
