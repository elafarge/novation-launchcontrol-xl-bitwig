/* jshint loopfunc: true */

/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: The user board (freely assignable knobs, faders and buttons)
 *
 */

UserBoard = function(controller, channel, channel_offset){
    log_info("Creating UserBoard on channel " + channel);
    SoftTakeoverBoard.call(this, controller, channel);

    // Let's create an array to hold the controls values (-1 ie "unassigned" by default)
    // We're talking about SOFTWARE values
    this.control_values = {
        "knobs": [
            [-1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1, -1, -1, -1]
        ],
        "faders": [-1, -1, -1, -1, -1, -1, -1, -1],
        "buttons": [
             [-1, -1, -1, -1, -1, -1, -1, -1],
             [-1, -1, -1, -1, -1, -1, -1, -1]
        ],
        "nav": {
            "up": -1,
            "down": -1,
            "left": -1,
            "right": -1
        },
        "action": {
           "device": -1,
           "mute": -1,
           "solo": -1,
           "record": -1
        }
    };

    this.channel_offset = channel_offset;

    // Mapping between the board's controls and a Bitwig UserControl section with 56 controls
    // Will be filled with actual numbers right after
    this.layout = {
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

    this.assigned = {
        "knobs": [
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false]
        ],
        "faders": [false, false, false, false, false, false, false, false],
        "buttons": [
            [false, false, false, false, false, false, false, false],
            [false, false, false, false, false, false, false, false]
        ],
        "nav": {
            "up": false,
            "down": false,
            "left": false,
            "right": false
        },
        "action": {
           "device": false,
           "mute": false,
           "solo": false,
           "record": false
        }
    };

    // Since the number of controls can vary we have a function to make sure
    // every number in [[0, n]] gets a control assigned (where n is the
    // number of controls).
    this.control_count = this.assignNumbersToControls();

    // Let's create a reverse mapping in Bitwig's user control sense
    this.reverse_layout = new Array(this.control_count);

    for(var key in this.layout) {
        if(["nav", "action"].indexOf(key) > -1) {
            for(var subkey in this.layout[key]){
                this.reverse_layout[this.layout[key][subkey]] = [key, subkey];
            }
        } else {
            if(key == "faders") {
                for(var i = 0; i < this.layout[key].length; i++)
                    this.reverse_layout[this.layout[key][i]] = [key, i];
            } else {
                for(var k=0; k < this.layout[key].length; k++) {
                    for(var j = 0; j < this.layout[key][k].length; j++){
                        this.reverse_layout[this.layout[key][k][j]] = [key, k, j];
                    }
                }
            }
        }
    }

    // Let's bind the controls to bitwig's user board and setup observers on it
    for(var l=0; l<this.control_count; l++){
        var control = this.controller.bitwig_user_controls.getControl(this.bitwigControlNumber(l));
        control.setLabel(this.channel.toString() + this.reverse_layout[l].toString());
        control.addValueObserver(128, this.getValueChangedCallback(this.reverse_layout[l]));
        // We need this one exceptionnaly because there's no other way to get the
        // unassigned state
        control.addValueDisplayObserver(10, "undefined", this.getValueDisplayChangedCallback(
            this.reverse_layout[l]));

    }
};

UserBoard.prototype = new SoftTakeoverBoard();

////////////////////////////////////////////////////////////////////////////////
/////////////                   Event handling                   ///////////////
////////////////////////////////////////////////////////////////////////////////

UserBoard.prototype.onMidi = function(status, data1, data2){
    // And let's update the "hasControl" (in case we caught up)
    SoftTakeoverBoard.prototype.onMidi.call(this, status, data1, data2);

    // Let's get the path of the tweaked control
    var path = Board.getControlPath(status, data1);

    if(!this.isAssigned(path)){
       // Let's tweak Bitwig's value to get out of the unassigned state
       this.controller.bitwig_user_controls.getControl(this.getControlNumber(path)).
           set(data2, 128);
    }

    // Let's tweak it in the software
    if(this.hasControl(path)){
        if(['knobs', 'faders'].indexOf(path[0]) > -1){
            this.controller.bitwig_user_controls.getControl(this.getControlNumber(path)).
                set(data2, 128);
            this.setSoftValue(path, data2);
        } else {
            // Let's ignore note off events (button release)
            if(Math.floor(status/16) == 8 || path[0] == 'nav' && data2 === 0)
                return;

            // In our user mapping, we want buttons to act as toggles
            if(this.getSoftValue(path) > 63){
                this.controller.bitwig_user_controls.getControl(this.getControlNumber(path)).
                    set(0, 128);
                this.setSoftValue(path, 0);
            } else {
                this.controller.bitwig_user_controls.getControl(this.getControlNumber(path)).
                    set(127, 128);
                this.setSoftValue(path, 0);
            }
        }
    }
};

// A callback generator (I love closures by the way, it's just a pity bind()
// isn't implemented in Bitwig's API but this workaround isn't that dirty :) )
UserBoard.prototype.getValueChangedCallback = function(path){
    var board_instance = this;
    return function(value){
        board_instance.setSoftValue(path, value);
        SoftTakeoverBoard.prototype.valueChangedCallback.call(board_instance, path, value);
    };
};

UserBoard.prototype.getValueDisplayChangedCallback = function(path){
    var board_instance = this;
    return function(value){
        if(value == "undefined")
            board_instance.setState(path, SoftTakeoverBoard.UNASSIGNED);
        else if(!board_instance.isConfirmedAsAssigned(path)){
            board_instance.confirmAsAssigned(path);
            board_instance.setState(path, SoftTakeoverBoard.MOVIN_CONTROL);
            board_instance.controller.bitwig_user_controls.getControl(board_instance.
                getControlNumber(path)).setIndication(true);
        }
    };
};

UserBoard.prototype.enable = function(){
    SoftTakeoverBoard.prototype.enable.call(this);

    // Let's put an indicator on every assigned fader and knob
    for(var i=0; i<8; i++){
        if(this.getState(['faders', i]) != SoftTakeoverBoard.UNASSIGNED)
            this.controller.bitwig_user_controls.getControl(this.getControlNumber(['faders', i])).
                setIndication(true);
        for(var j=0; j<3; j++){
            if(this.getState(['knobs', j, i]) != SoftTakeoverBoard.UNASSIGNED)
                this.controller.bitwig_user_controls.getControl(
                    this.getControlNumber(['knobs', j, i])).setIndication(true);
        }
    }
};

UserBoard.prototype.disable = function(){
    SoftTakeoverBoard.prototype.disable.call(this);

    // Let's put an indicator on every assigned fader and knob
    for(var i=0; i<8; i++){
        this.controller.bitwig_user_controls.getControl(this.getControlNumber(['faders', i])).
            setIndication(false);
        for(var j=0; j<3; j++){
            this.controller.bitwig_user_controls.getControl(
                this.getControlNumber(['knobs', j, i])).setIndication(false);
        }
    }
};

////////////////////////////////////////////////////////////////////////////////
////// Getters, setters and utilities (play no role in the event stream) ///////
////////////////////////////////////////////////////////////////////////////////

UserBoard.prototype.getSoftValue = function(path){
    var value;
    if(path.length == 3)
        value = this.control_values[path[0]][path[1]][path[2]];
    else if(path.length == 2)
        value =  this.control_values[path[0]][path[1]];
    else
        throw "Incorrect path length, must be one or two";
    return (value == -1) ? "unassigned" : value;
};

UserBoard.prototype.setSoftValue = function(path, value){
    if(path.length == 3)
        this.control_values[path[0]][path[1]][path[2]] = value;
    else if(path.length == 2)
        this.control_values[path[0]][path[1]] = value;
    else
        throw "Incorrect path length, must be one or two";
};

UserBoard.prototype.getControlNumber = function(path){
    if(path.length == 3)
        return this.bitwigControlNumber(this.layout[path[0]][path[1]][path[2]]);
    else if(path.length == 2)
        return this.bitwigControlNumber(this.layout[path[0]][path[1]]);
    else
        throw "Incorrect path length, must be one or two";
};

UserBoard.prototype.bitwigControlNumber = function(i){
    return i + this.channel_offset;
};

UserBoard.prototype.assignNumbersToControls = function(){
    var k = -1;
    for(var key in this.layout) {
        if(["nav", "action"].indexOf(key) > -1) {
            for(var subkey in this.layout[key])
                this.layout[key][subkey] = ++k;
        } else {
            if(key == "faders") {
                for(var i = 0; i < this.layout[key].length; i++)
                    this.layout[key][i] = ++k;
            } else {
                for(var l=0; l < this.layout[key].length; l++) {
                    for(var j = 0; j < this.layout[key][l].length; j++)
                        this.layout[key][l][j] = ++k;
                }
            }
        }
    }
    return ++k;
};

UserBoard.prototype.confirmAsAssigned = function(path){
    if(path.length == 3)
        this.assigned[path[0]][path[1]][path[2]] = true;
    else if(path.length == 2)
        this.assigned[path[0]][path[1]] = true;
    else
        throw "Incorrect path length, must be one or two";

};

UserBoard.prototype.isConfirmedAsAssigned = function(path){
    if(path.length == 3)
        return this.assigned[path[0]][path[1]][path[2]];
    else if(path.length == 2)
        return this.assigned[path[0]][path[1]];
    else
        throw "Incorrect path length, must be one or two";
};
