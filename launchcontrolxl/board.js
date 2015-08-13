/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: Abstraction for a mapping (we call a mapping a board because
 * it represents a physical LaunchControl board physically speaking).
 *
 */

// Let's build out the led indexes

Board = function(controller, channel){
    // For inheritance with new
    if(typeof controller == "undefined")
        return;

    this.controller = controller;
    this.channel = channel;
}

Board.LAYOUT = {
    "knobs": [
        [13, 14, 15, 16, 17, 18, 19, 20],
        [29, 30, 31, 32, 33, 34, 35, 36],
        [49, 50, 51, 52, 53, 54, 55, 56]
    ],
    "faders": [77, 78, 79, 80, 81, 82, 83, 84],
    "buttons": [
        [41, 42, 43, 44, 57, 58, 59, 60],
        [73, 74, 75, 76, 89, 90, 91, 92]
    ],
    "nav": {
        "up": 104,
        "down": 105,
        "left": 106,
        "right": 107
    },
    "action": {
       "device": 105,
       "mute": 106,
       "solo": 107,
       "record": 108
    }
};

Board.CONTROL_COUNT = 56;

Board.LED_LAYOUT = {
    "knobs": [
        [ 0,  1,  2,  3,  4,  5,  6,  7],
        [ 8,  9, 10, 11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20, 21, 22, 23]
    ],

    "buttons": [
        [24, 25, 26, 27, 28, 29, 30, 31],
        [32, 33, 34, 35, 36, 37, 38, 39]
    ],

    "nav": {
        "up": 44,
        "down": 45,
        "left": 46,
        "right": 47
    },

    "action": {
       "device": 40,
       "mute": 41,
       "solo": 42,
       "record": 43
    }
};

// Let's build the reverse version of this layout (from MIDI to a path in our LAYOUT dict)
Board.REVERSE_LAYOUT = {};

for(var key in Board.LAYOUT) {
    if(key == "nav") {
        for(var subkey in Board.LAYOUT[key])
            Board.REVERSE_LAYOUT["b" + intToHex(Board.LAYOUT[key][subkey])] = [key, subkey];
    } else {
        if(key == "action"){
            for(var subkey in Board.LAYOUT[key]){
                Board.REVERSE_LAYOUT["8" + intToHex(Board.LAYOUT[key][subkey])] = [key, subkey];
                Board.REVERSE_LAYOUT["9" + intToHex(Board.LAYOUT[key][subkey])] = [key, subkey];
            }
        } else if(key == "faders") {
            for(var i = 0; i < Board.LAYOUT[key].length; i++)
                Board.REVERSE_LAYOUT["b" + intToHex(Board.LAYOUT[key][i])] = [key, i];
        } else if(key == "knobs") {
            for(var i = 0; i < Board.LAYOUT[key].length; i++) {
                for(var j = 0; j < Board.LAYOUT[key][i].length; j++)
                    Board.REVERSE_LAYOUT["b" + intToHex(Board.LAYOUT[key][i][j])] = [key, i, j];
            }
        } else if(key == "buttons") {
            for(var i = 0; i < Board.LAYOUT[key].length; i++) {
                for(var j = 0; j < Board.LAYOUT[key][i].length; j++) {
                    Board.REVERSE_LAYOUT["8" + intToHex(Board.LAYOUT[key][i][j])] = [key, i, j];
                    Board.REVERSE_LAYOUT["9" + intToHex(Board.LAYOUT[key][i][j])] = [key, i, j];
                }
            }
        }
    }
}

Board.getControlPath = function(status, data1) {
    return Board.REVERSE_LAYOUT[intToHex(status)[0] + intToHex(data1)];
};

Board.getLedIndex = function(path){
    if(path[0] == "faders")
        throw "Faders don't have leds";

    if(path.length == 3)
        return Board.LED_LAYOUT[path[0]][path[1]][path[2]];
    else if(path.length == 2)
        return Board.LED_LAYOUT[path[0]][path[1]];
    else
        throw "Incorrect path length, must be one or two";
}

Board.getMidiChannel = function(status){
    return status % 16;
}

/**
 * Returns the path to a given control.
 * It can be an array of two or three values depending on the context. These
 * should be the indexes of a given control (ex. : ["buttons", 2, 5] or "nav").
 */

Board.prototype.enable = function(){};

Board.prototype.disable = function(){};

Board.prototype.is_active = function(){
    return this.channel == this.controller.current_board_number;
};

Board.prototype.onMidi = function(status, data1, data2){};
