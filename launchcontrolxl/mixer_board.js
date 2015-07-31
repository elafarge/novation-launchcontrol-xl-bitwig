/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: The mixer board (abstract board). A view of the mixer control
 * with mute, solo and record switch. The ability to focus on a track and
 * left <-> right navigation enabled.
 *
 */

MixerBoard = function(controller, channel){
    log_info("Creating MixerBoard on channel " + channel);
    SoftTakeoverBoard.call(this, controller, channel);

    // Let's create an array to hold the controls values (64 ie "unassigned" by default)
    // We're talking about SOFTWARE values
    this.control_values = {
        "knobs": [
            [64, 64, 64, 64, 64, 64, 64, 64],
            [64, 64, 64, 64, 64, 64, 64, 64],
            [64, 64, 64, 64, 64, 64, 64, 64]
        ],
        "faders": [64, 64, 64, 64, 64, 64, 64, 64],
        "buttons": [
             [64, 64, 64, 64, 64, 64, 64, 64],
             [64, 64, 64, 64, 64, 64, 64, 64]
        ],
        "nav": {
            "up": 0,
            "down": 0,
            "left": 0,
            "right": 0
        },
        "action": {
           "device": 0,
           "mute": 127,
           "solo": 0,
           "record": 0
        }
    };

    this.track_offset = 0;

    var board = this;

    this.controller.track_bank.addTrackScrollPositionObserver(function(position){
        board.track_offset = position;
        board.showChannelOffset();
    }, 0);

    var device_mode = false;

    this.button_states = {
        "mute": [false, false, false, false, false, false, false, false],
        "solo": [false, false, false, false, false, false, false, false],
        "record": [false, false, false, false, false, false, false, false]
    };

    this.setMode("mute");

    // Our nav and action control are assigned
    for(var k in this.control_values["nav"])
        this.setState(["nav", k], SoftTakeoverBoard.IN_CONTROL);

    for(var k in this.control_values["action"])
        this.setState(["action", k], SoftTakeoverBoard.IN_CONTROL);

    for(var i=0; i<8; i++){
        this.setState(["buttons", 0, i], SoftTakeoverBoard.IN_CONTROL);
        this.setState(["buttons", 1, i], SoftTakeoverBoard.IN_CONTROL);
    }

    // Let's add mute/solo/arm/volume observers in there
    var board = this;
    for(var i=0; i<8; i++){
        // In fact, I hate scopes and closures on second thought
        var track = this.controller.track_bank.getTrack(i);
        track.getMute().addValueObserver(makeIndexedFunction(i, function(j, yes){
            if(board.mode == "mute"){
                board.button_states["mute"][j] = yes;
                board.setSoftValue(["buttons", 1, j], yes ? 0 : 127);
                board.updateLed(["buttons", 1, j]);
            }
        }));
        track.getSolo().addValueObserver(makeIndexedFunction(i, function(j, yes){
            if(board.mode == "solo"){
                board.button_states["solo"][j] = yes;
                board.setSoftValue(["buttons", 1, j], yes ? 127 : 0);
                board.updateLed(["buttons", 1, j]);
            }
        }));
        track.getArm().addValueObserver(makeIndexedFunction(i, function(j, yes){
            if(board.mode == "record"){
                board.button_states["record"][j] = yes;
                board.setSoftValue(["buttons", 1, j], yes ? 127 : 0);
                board.updateLed(["buttons", 1, j]);
            }
        }));
        track.getVolume().addValueObserver(128, makeIndexedFunction(i, function(j, value){
            board.setSoftValue(["faders", j], value);
            SoftTakeoverBoard.prototype.valueChangedCallback.call(board, ["faders", j], value);
        }));
    }
};

MixerBoard.prototype = new SoftTakeoverBoard();

MixerBoard.MODES = ["mute", "solo", "record"];

////////////////////////////////////////////////////////////////////////////////
/////////////                   Event handling                   ///////////////
////////////////////////////////////////////////////////////////////////////////

MixerBoard.prototype.onMidi = function(status, data1, data2){
    var path = Board.getControlPath(status, data1);

    // Let's handle the navigation
    if (path[0] == "nav" && data2 != 0){
       if(path[1] == "left")
           this.controller.track_bank.scrollTracksUp();
       else if(path[1] == "right")
           this.controller.track_bank.scrollTracksDown();
    }

    // Let's handle modes
    if(path[0] == "action" && Math.floor(status/16) != 8){
        if(path[1] == "device")
            this.enableDeviceMode();
        else
            this.setMode(path[1]);
    }

    // Let's have fun with buttons
    if(path[0] == "buttons" && path[1] == 1 && Math.floor(status/16) != 8){
        var control;
        switch(this.mode){
            case "mute":
                control = this.controller.track_bank.getTrack(path[2]).getMute();
                break;
            case "solo":
                control = this.controller.track_bank.getTrack(path[2]).getSolo();
                break;
            case "record":
                control = this.controller.track_bank.getTrack(path[2]).getArm();
                break;

        }
        control.toggle();
    }

    // And let's update the "hasControl" (in case we caught up)
    SoftTakeoverBoard.prototype.onMidi.call(this, status, data1, data2);

    if(this.hasControl(path)){
        if(path[0] == "faders"){
            var target_track = this.controller.track_bank.getTrack(path[1]).getVolume().set(data2, 128);
            this.setSoftValue(path, data2);
        }
    }
};

MixerBoard.prototype.enable = function(){
    SoftTakeoverBoard.prototype.enable.call(this);
    this.showChannelOffset();
};

////////////////////////////////////////////////////////////////////////////////
/////////////             Led color and manipulations            ///////////////
////////////////////////////////////////////////////////////////////////////////

MixerBoard.prototype.getWeakColorBits = function(path){
    if(path[0] == "action")
        return 8;
    else if(path[0] == "knobs")
        return 0;
    else if(path[0] == "buttons" && path[1] == 0)
        return 16;
    else if(path[0] == "buttons" && path[1] == 1){
        switch(this.mode){
            case "mute": return 17;
            case "solo": return 16;
            case "record": return 1;
        }
    }
    else
        return SoftTakeoverBoard.prototype.getWeakColorBits.call(this, path);
};

MixerBoard.prototype.getColorBits = function(path){
    if(path[0] == "action")
        return 48;
    else if(path[0] == "knobs")
        return 0;
    else if(path[0] == "buttons" && path[1] == 0)
        return 48;
    else if(path[0] == "buttons" && path[1] == 1){
        switch(this.mode){
            case "mute": return 51;
            case "solo": return 48;
            case "record": return 3;
        }
    }
    else
        return SoftTakeoverBoard.prototype.getColorBits.call(this, path);
};

MixerBoard.prototype.updateEnabledTracks = function(){
    for(var i=0; i < this.track_count; i++){
        this.setState(["buttons", 0, i], SoftTakeoverBoard.IN_CONTROL);
        this.setState(["buttons", 1, i], SoftTakeoverBoard.IN_CONTROL);
        this.updateLed(["buttons", 0, i]);
        this.updateLed(["buttons", 1, i]);
    }
};

////////////////////////////////////////////////////////////////////////////////
////// Getters, setters and utilities (play no role in the event stream) ///////
////////////////////////////////////////////////////////////////////////////////

MixerBoard.prototype.getSoftValue = function(path){
    if(path.length == 3)
        return this.control_values[path[0]][path[1]][path[2]];
    else if(path.length == 2)
        return this.control_values[path[0]][path[1]];
    else
        throw "Incorrect path length, must be one or two";
};

MixerBoard.prototype.setSoftValue = function(path, value){
    if(path.length == 3)
        this.control_values[path[0]][path[1]][path[2]] = value;
    else if(path.length == 2)
        this.control_values[path[0]][path[1]] = value;
    else
        throw "Incorrect path length, must be one or two";
};

MixerBoard.prototype.showChannelOffset = function(){
    // TODO: Show track names instead of numbers
    this.controller.host.showPopupNotification("Mixer from channel " + (this.track_offset + 1) +
        " to channel " + (this.track_offset + 8) );
};

MixerBoard.prototype.toggleDeviceMode = function(){
    this.device_mode = !this.device_mode;
    if(device_mode)
        this.enableDeviceMode();
    else
        this.enableMixerMode();
};

MixerBoard.prototype.enableDeviceMode = function(){
    this.setSoftValue(["action", "device"], 127);
    this.updateLed(["action", "device"]);
};

MixerBoard.prototype.enableMixerMode = function(){
    this.setSoftValue(["action", "device"], 0);
    this.updateLed(["action", "device"]);
};

MixerBoard.prototype.setMode = function(mode){
    this.mode = mode;

    for(var i=0; i < MixerBoard.MODES.length; i++){
        m = MixerBoard.MODES[i];
        this.setSoftValue(["action", m], (m == mode) ? 127 : 0);
        this.updateLed(["action", m]);
    }

    // Let's update the row of buttons
    for(var i = 0; i < 8; i++){
        if(mode == "mute")
            this.setSoftValue(["buttons", 1, i], this.button_states[mode][i] ? 0 : 127);
        else
            this.setSoftValue(["buttons", 1, i], this.button_states[mode][i] ? 127 : 0);
        this.updateLed(["buttons", 1, i]);
    }
};
