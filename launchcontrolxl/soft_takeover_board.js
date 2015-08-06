/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: Abstraction for a mapping (we call a mapping a board because
 * it represents a physical LaunchControl board physically speaking).
 *
 */

SoftTakeoverBoard = function(controller, channel){
    Board.call(this, controller, channel);

    this.diff = {
        "knobs": [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],
        "buttons": [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],
        "faders": [0, 0, 0, 0, 0, 0, 0, 0],
        "nav": {
           "up": 0,
           "down": 0,
           "left": 0,
           "right": 0
       },
       "action": {
          "device": 0,
          "mute": 0,
          "solo": 0,
          "record": 0
       }
    };

    this.control_state = {
        "knobs": [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],
        "faders": [0, 0, 0, 0, 0, 0, 0, 0],
        "buttons": [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ],
        "nav": {
           "up": 0,
           "down": 0,
           "left": 0,
           "right": 0
       },
       "action": {
          "device": 0,
          "mute": 0,
          "solo": 0,
          "record": 0
       }
    };

    // TODO: find a way to fill in CONTROL_VALUE with the actual knobs values here
    // so that we on't have to tweak all the knobs at every Bitwig start (Bitwig's
    // observers give us the initial value when set up)
};

SoftTakeoverBoard.prototype = new Board();

// This will hold the real value of all the faders (0-127) on the controller
// It's static since it should be persisted accross boards
SoftTakeoverBoard.CONTROL_VALUE = {
    "knobs": [
        [64, 64, 64, 64, 64, 64, 64, 64],
        [64, 64, 64, 64, 64, 64, 64, 64],
        [64, 64, 64, 64, 64, 64, 64, 64]
    ],
    "faders": [0, 0, 0, 0, 0, 0, 0, 0],
    "buttons": [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    "nav": {
       "up": 0,
       "down": 0,
       "left": 0,
       "right": 0
   },
   "action": {
      "device": 0,
      "mute": 0,
      "solo": 0,
      "record": 0
   }
};

SoftTakeoverBoard.UNASSIGNED = 0;
SoftTakeoverBoard.TAKING_OVER = 1;
SoftTakeoverBoard.IN_CONTROL = 2;
SoftTakeoverBoard.MOVIN_CONTROL = 3; // Nickname for Miving in control

////////////////////////////////////////////////////////////////////////////////
/////////////             Led color and manipulations            ///////////////
////////////////////////////////////////////////////////////////////////////////

// The diff ranges in percent for each color intensity
SoftTakeoverBoard.COLOR_SPLIT_BY_DIFF = [0.35, 0.80];

SoftTakeoverBoard.prototype.getWeakColorBits = function(path){
    if(path[0] == "action") {
        return 8;
    } else {
        switch(path[2] % 4){
            case 0: return 16;
            case 1: return 18;
            case 2: return 17;
            case 3: return 1;
        }
    }
};

SoftTakeoverBoard.prototype.getColorBits = function(path){
    if(path[0] == "action") {
        return 48;
    } else if (path[0] == "faders"){
        return (path[1] % 4) + (3 - path[1] % 4)*16;
    } else {
        switch(path[2] % 4){
            case 0: return 48;
            case 1: return 50;
            case 2: return 51;
            case 3: return 3;
        }
    }
};


SoftTakeoverBoard.prototype.updateLed = function(path){

    // We don't want to use the nav leds for other things than diff indications
    if(path[0] == "nav")
        return;

    var color_bits = this.getColorBits(path);

    var color_code;
    if(this.getState(path) == SoftTakeoverBoard.UNASSIGNED){
        color_code = 12; // As always, 12 has an essential role
        color_code_weak = color_code;
    } else if(this.getState(path) == SoftTakeoverBoard.TAKING_OVER) {
        color_code = color_bits + 8;
    } else {
        // Full brightness...
        color_code = color_bits + 12;

        // Unless we have a button here...
        if(["buttons", "action"].indexOf(path[0]) > -1){
            if(this.getSoftValue(path) < 64)
                color_code = this.getWeakColorBits(path) + 12;
        }
    }
    // Faders don't have leds, give it up (we still have the takeover leds to help
    // us catch up)
    if(path[0] == "faders")
        return;

    var led_index = Board.getLedIndex(path);

    this.controller.sendSysEx("f0 00 20 29 02 11 78 " +
                              intToHex(this.channel) + " " +
                              intToHex(led_index) + " " +
                              intToHex(color_code) + " F7");
};

SoftTakeoverBoard.prototype.updateTakeoverLeds = function(path){
    if(this.getState(path) != SoftTakeoverBoard.TAKING_OVER){
        this.goodNightNav(["up", "down", "left", "right"]);
        return;
    }

    diff = this.getDiff(path);

    if(path[0] == "faders"){
        if(diff > 0){
            this.sendBlinker("down");
            this.goodNightNav(["up"]);
        } else {
            this.sendBlinker("up");
            this.goodNightNav(["down"]);
        }
        this.goodNightNav(["left", "right"]);
    } else { // i.e. knobs
        if(diff > 0){
            this.sendBlinker("left");
            this.goodNightNav(["right"]);
        } else {
            this.sendBlinker("right");
            this.goodNightNav(["left"]);
        }
        this.goodNightNav(["up", "down"]);
    }
};

SoftTakeoverBoard.prototype.sendBlinker = function(nav_direction){
    var led_index = Board.getLedIndex(["nav", nav_direction]);
    this.controller.sendSysEx("f0 00 20 29 02 11 78 " +
                              intToHex(this.channel) + " " +
                              intToHex(led_index) + " " +
                              intToHex(59) + " F7");
};

SoftTakeoverBoard.prototype.goodNightNav = function(nav_directions){
    for(var i = 0; i < nav_directions.length; i++){
    var led_index = Board.getLedIndex(["nav", nav_directions[i]]);
    this.controller.sendSysEx("f0 00 20 29 02 11 78 " +
                              intToHex(this.channel) + " " +
                              intToHex(led_index) + " " +
                              intToHex(0) + " F7");
    }
};


////////////////////////////////////////////////////////////////////////////////
/////////////                   Event handling                   ///////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Returns true if the control under the given path is in sync zith the software.
 * Note : unassigned knob always have control
 */
SoftTakeoverBoard.prototype.hasControl = function(path){
    return this.getState(path) == SoftTakeoverBoard.IN_CONTROL ||
           this.getState(path) == SoftTakeoverBoard.MOVIN_CONTROL;
};

SoftTakeoverBoard.prototype.isAssigned = function(path){
    return this.getState(path) != SoftTakeoverBoard.UNASSIGNED;
};

// Let's update the appropriate led when a led controller is tweaked
// What happens to button leds is left to the underlying implementation
SoftTakeoverBoard.prototype.onMidi = function(status, data1, data2){
    // Paranoia check, but in case...
    if(status % 16 != this.channel)
        throw "Warning: messages from channel " + status % 16 +
              " also get sent to channel " + this.channel + "!"
    var path = Board.getControlPath(status, data1);

    switch(this.getState(path)){
        case SoftTakeoverBoard.TAKING_OVER:
            var diff = this.getDiff(path);
            var new_diff = SoftTakeoverBoard.getControlValue(path) - this.getSoftValue(path);
            if(diff * new_diff  <= 0){
                this.setState(path, SoftTakeoverBoard.IN_CONTROL);
                new_diff = 0;
            }
            this.setDiff(path, new_diff);
            break;
        case SoftTakeoverBoard.IN_CONTROL:
            //Paranoia check
            if(data2 != SoftTakeoverBoard.getControlValue(path)){
                this.setState(path, SoftTakeoverBoard.MOVIN_CONTROL);
            }
            break;
        case SoftTakeoverBoard.MOVIN_CONTROL:
            if(data2 != SoftTakeoverBoard.getControlValue(path)){
                this.setState(path, SoftTakeoverBoard.MOVIN_CONTROL);
            }
            break;
    }

    SoftTakeoverBoard.setControlValue(path, data2);

    if(["nav", "buttons", "action"].indexOf(path[0]) == -1)
        this.updateTakeoverLeds(path);
};

// Assumption that you have to respect in the callback calling this one
// this.getSoftValue(path) == value !!
SoftTakeoverBoard.prototype.valueChangedCallback = function(path, value){
    if(value == "undefined")
        this.setState(path, SoftTakeoverBoard.UNASSIGNED);

    var new_diff = SoftTakeoverBoard.getControlValue(path) - value;
    switch(this.getState(path)){
        case SoftTakeoverBoard.TAKING_OVER:
            var diff = this.getDiff(path);
            if(diff * new_diff  <= 0){
                this.setState(path, SoftTakeoverBoard.IN_CONTROL);
                new_diff = 0;
            }
            this.setDiff(path, new_diff);
            break;

        case SoftTakeoverBoard.IN_CONTROL:
            if(SoftTakeoverBoard.getControlValue(path) != value)
                this.setState(path, SoftTakeoverBoard.TAKING_OVER);
            this.setDiff(path, new_diff);
            break;

        case SoftTakeoverBoard.MOVIN_CONTROL:
            if(SoftTakeoverBoard.getControlValue(path) == value)
                this.setState(path, SoftTakeoverBoard.IN_CONTROL);
            this.setDiff(path, new_diff);
            break;
    }

    if(["nav", "buttons", "action"].indexOf(path[0]) == -1)
        this.updateTakeoverLeds(path);
}

SoftTakeoverBoard.prototype.enable = function(){
    // Let's reset the LEDs for this template
    this.controller.sendMidi(11*16 + this.channel, 0, 0);

    this.resetAllControlsState();

    // Let's enable flashing for this channel
    this.controller.sendMidi(176 + this.channel, 0, 40);
};

SoftTakeoverBoard.prototype.resetAllControlsState = function(){
    // Let's update all the leds
    for(var i=0; i<3; i++)
        for(var j=0; j<8; j++)
            this.resetControlState(["knobs", i, j]);

    for(var i=0; i<8; i++)
            this.resetControlState(["faders", i]);

    for(var i=0; i<2; i++)
        for(var j=0; j<8; j++)
            this.resetControlState(["buttons", i, j]);

    for(key in this.diff['nav'])
        this.resetControlState(["nav", key]);

    for(key in this.diff['action'])
        this.resetControlState(["action", key]);
}

SoftTakeoverBoard.prototype.resetControlState = function(path){
    var soft_value = this.getSoftValue(path);
    if(soft_value == "unassigned"){
        this.setState(path, SoftTakeoverBoard.UNASSIGNED);
    } else {
        var diff = SoftTakeoverBoard.getControlValue(path) - soft_value;
        if(["buttons", "nav", "action"].indexOf(path[0]) > -1){
            if(diff != 0)
                this.setSoftValue(path, soft_value);
        } else {
                this.setDiff(path, diff);
                this.setState(path, (diff == 0) ? SoftTakeoverBoard.IN_CONTROL :
                        SoftTakeoverBoard.TAKING_OVER);
            }
        // We have to send led information even if the state didn't change
        if(path[0] != "nav")
            this.updateLed(path);
    }
}

////////////////////////////////////////////////////////////////////////////////
////// Getters, setters and utilities (play no role in the event stream) ///////
////////////////////////////////////////////////////////////////////////////////

SoftTakeoverBoard.getControlValue = function(path){
    if(path.length == 3)
        return SoftTakeoverBoard.CONTROL_VALUE[path[0]][path[1]][path[2]];
    else if(path.length == 2)
        return SoftTakeoverBoard.CONTROL_VALUE[path[0]][path[1]];
    else
        throw "Incorrect path length, must be one or two";
};

SoftTakeoverBoard.prototype.getDiff = function(path){
    if(path.length == 3)
        return this.diff[path[0]][path[1]][path[2]];
    else if(path.length == 2)
        return this.diff[path[0]][path[1]];
    else
        throw "Incorrect path length, must be one or two";
};

SoftTakeoverBoard.prototype.getState = function(path){
    if(path.length == 3)
        return this.control_state[path[0]][path[1]][path[2]];
    else if(path.length == 2)
        return this.control_state[path[0]][path[1]];
    else
        throw "Incorrect path length, must be one or two";
};

SoftTakeoverBoard.setControlValue = function(path, value){
    if(path.length == 3)
        SoftTakeoverBoard.CONTROL_VALUE[path[0]][path[1]][path[2]] = value;
    else if(path.length == 2)
        SoftTakeoverBoard.CONTROL_VALUE[path[0]][path[1]] = value;
    else
        throw "Incorrect path length, must be one or two";
};

SoftTakeoverBoard.prototype.setDiff = function(path, value){
    if(path.length == 3)
        this.diff[path[0]][path[1]][path[2]] = value;
    else if(path.length == 2)
        this.diff[path[0]][path[1]] = value;
    else
        throw "Incorrect path length, must be one or two (" + path.toString + ")";
};

SoftTakeoverBoard.prototype.setState = function(path, state){
    if(state < 0 || state > 3)
        throw "Ain't a state dude!";
    var old_state = this.getState(path);
    if(path.length == 3)
        this.control_state[path[0]][path[1]][path[2]] = state;
    else if(path.length == 2)
        this.control_state[path[0]][path[1]] = state;
    else
        throw "Incorrect path length, must be one or two (" + path.toString + ")";

    if(path[0] != "nav" && (old_state != state ||
           ["action", "buttons"].indexOf(path[0]) > -1))
        this.updateLed(path);
}

/**
 * The implementations are dummy, child classes should always implement these
 * methods
 */
SoftTakeoverBoard.prototype.getSoftValue = function(path){
    return 63;
};

SoftTakeoverBoard.prototype.setSoftValue = function(path, value){
};
