/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: Container for all the mappings
 *
 */

TransportBoard = function(controller, channel, ref_board){
    SoftTakeoverBoard.call(this, controller, channel);

    this.ref_board = ref_board;

    this.button_states = {
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
           "mute": 0,
           "solo": 0,
           "record": 0
        }
    };

    // Buttons are always in control
    for(var i=0; i<8; i++){
        this.setState(["buttons", 0, i], SoftTakeoverBoard.IN_CONTROL);
        this.setState(["buttons", 1, i], SoftTakeoverBoard.IN_CONTROL);
    }

    // TODO: let's add our observers here
};

TransportBoard.prototype = new SoftTakeoverBoard();

TransportBoard.prototype.onMidi = function(status, data1, data2){
    var path = Board.getControlPath(status, data1);

    if(!this.shouldHandle(path))
        return this.ref_board.onMidi(status, data1, data2);

    SoftTakeoverBoard.prototype.onMidi.call(this, status, data1, data2);

    // TODO: trigger stuff in Bitwig
};

TransportBoard.prototype.getSoftValue = function(path){
    if(!this.shouldHandle(path))
        return this.ref_board.getSoftValue(path);

    if(path.length == 3)
        return this.button_states[path[0]][path[1]][path[2]];
    else if(path.length == 2)
        return this.button_states[path[0]][path[1]];
    else
        throw "Incorrect path length, must be one or two";
};

TransportBoard.prototype.enable = function(){
    SoftTakeoverBoard.prototype.enable.call(this);

    this.ref_board = this.controller.currentBoard();
    this.ref_board.enable();
};

TransportBoard.prototype.disable = function(){
    this.ref_board.disable();
};

TransportBoard.prototype.setSoftValue = function(path, value){
    if(!this.shouldHandle(path))
        return this.ref_board.setSoftValue(path, value);

    if(path.length == 3)
        this.button_states[path[0]][path[1]][path[2]] = value;
    else if(path.length == 2)
        this.button_states[path[0]][path[1]] = value;
    else
        throw "Incorrect path length, must be one or two";
};

TransportBoard.prototype.shouldHandle = function(path){
    return (["knobs", "faders"].indexOf(path[0]) == -1);
};

TransportBoard.prototype.getWeakColorBits = function(path){
    if(!this.shouldHandle(path))
        return this.ref_board.getWeakColorBits(path);

    return 1;
};

TransportBoard.prototype.getColorBits = function(path){
    if(!this.shouldHandle(path))
        return this.ref_board.getColorBits(path);

    return 3;
};

TransportBoard.prototype.getBoardName = function(){
    return "Transport";
};
