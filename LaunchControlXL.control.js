
// Let's start the API
loadAPI(1);

host.defineController("Novation", "Launch Control XL", "1.0", "0048e1d0-23b4-11e5-867f-0800200c9a66");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Launch Control XL"], ["Launch Control XL"]);
host.defineSysexIdentityReply('F0 7E 00 06 02 00 20 29 61 00 00 00 00 00 03 06 F7');

//TODO FIXME: make it possible to have multiple LaunchControls (see How it's done for the Launchpad) automatically detected

load('launchcontrolxl/util.js');
load('launchcontrolxl/controller.js');
load('launchcontrolxl/board.js');
load('launchcontrolxl/soft_takeover_board.js');
load('launchcontrolxl/user_board.js');
load('launchcontrolxl/mixer_board.js');
load('launchcontrolxl/device_board.js');
load('launchcontrolxl/macro_board.js');
load('launchcontrolxl/sends_board.js');
load('launchcontrolxl/live_board.js');

if(host.platformIsLinux())
    host.addDeviceNameBasedDiscoveryPair(["Launch Control XL MIDI 1"], ["Launch Control XL MIDI 1"]);

// This variable will hold the ControlGroups for our 8 user channels
var controller = null;

function init() {
    host.getMidiInPort(0).setMidiCallback(onMidi);
    host.getMidiInPort(0).setSysexCallback(onSysex);

    controller = new Controller(host);
}

function onMidi(status, data1, data2) {
    controller.onMidi(status, data1, data2);
}

function onSysex(data) {
    controller.onSysEx(data);
}
