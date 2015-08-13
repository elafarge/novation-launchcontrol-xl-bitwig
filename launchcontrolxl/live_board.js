/* jshint loopfunc: true */

/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: The macro board is a DeviceBoard with each column of knobs
 * controlling the 8 macros of the primary instrument of each track. Vertical
 * scrolling is possible but it's always better to keep it to 3 macros not to
 * get lost between the tracks.
 *
 */

LiveBoard = function(controller, channel, channel_offset){
    log_info("Creating a macro board on channel " + channel);
    DeviceBoard.call(this, controller, channel);

    this.channel_offset = channel_offset;

    this.control_values.knobs = [
        [-1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1]
    ];

    this.layout = [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ];

    this.assigned = [
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false]
    ];

    // Since the number of controls can vary we have a function to make sure
    // every number in [[0, n]] gets a control assigned (where n is the
    // number of controls).
    this.control_count = this.assignNumbersToControls();

    // Let's create a reverse layout here for the knobs
    this.reverse_layout = new Array(this.control_count);

    for(var i=0; i < 3; i++){
        for(var j=0; j < 8; j++)
            this.reverse_layout[this.layout[i][j]] = ["knobs", i, j];
    }

    // Let's listen for changes in Bitwig
    for(i=0; i<this.control_count; i++){
        var control = this.controller.bitwig_user_controls.getControl(this.bitwigControlNumber(i));
        control.setLabel(this.channel.toString() + this.reverse_layout[i].toString());
        control.addValueObserver(128, this.getValueChangedCallback(this.reverse_layout[i]));
        // We need this one exceptionnaly because there's no other way to get the
        // unassigned state
        control.addValueDisplayObserver(10, "undefined", this.getValueDisplayChangedCallback(
            this.reverse_layout[i]));
    }

};

LiveBoard.USER_CONTROL_COUNT = 24;

LiveBoard.prototype = new DeviceBoard();

////////////////////////////////////////////////////////////////////////////////
/////////////                   Event handling                   ///////////////
////////////////////////////////////////////////////////////////////////////////

LiveBoard.prototype.onMidi = function(status, data1, data2){
    var path = Board.getControlPath(status, data1);

    if(path[0] != "knobs" || this.device_mode)
        return DeviceBoard.prototype.onMidi.call(this, status, data1, data2);

    SoftTakeoverBoard.prototype.onMidi.call(this, status, data1, data2);

    if(!this.isAssigned(path)){
       // Let's tweak Bitwig's value to get out of the unassigned state
       this.controller.bitwig_user_controls.getControl(this.getControlNumber(path)).
           set(data2, 128);
    }

    // Tweak the knobs
    if(this.hasControl(path))
        this.controller.bitwig_user_controls.getControl(this.getControlNumber(path)).
            set(data2, 128);
};

LiveBoard.prototype.getValueChangedCallback = function(path){
    var board_instance = this;
    return function(value){
        board_instance.setSoftValue(path, value);
        SoftTakeoverBoard.prototype.valueChangedCallback.call(board_instance, path, value);
    };
};

LiveBoard.prototype.getValueDisplayChangedCallback = function(path){
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

LiveBoard.prototype.enableAssignmentVisualFeedback = function(){
    DeviceBoard.prototype.enableAssignmentVisualFeedback.call(this);

    if(this.device_mode)
        return;

    // Let's put an indicator on every assigned fader and knob
    for(var i=0; i<8; i++){
        for(var j=0; j<3; j++){
            if(this.getState(['knobs', j, i]) != SoftTakeoverBoard.UNASSIGNED)
                this.controller.bitwig_user_controls.getControl(
                    this.getControlNumber(['knobs', j, i])).setIndication(true);
        }
    }
};

LiveBoard.prototype.disableAssignmentVisualFeedback = function(){
    DeviceBoard.prototype.disableAssignmentVisualFeedback.call(this);

    if(this.device_mode)
        return;

    // Let's put an indicator on every assigned fader and knob
    for(var i=0; i<8; i++){
        for(var j=0; j<3; j++)
            this.controller.bitwig_user_controls.getControl(
                this.getControlNumber(['knobs', j, i])).setIndication(false);
    }
};

////////////////////////////////////////////////////////////////////////////////
////// Getters, setters and utilities (play no role in the event stream) ///////
////////////////////////////////////////////////////////////////////////////////

LiveBoard.prototype.getColorBits = function(path){
    if(this.device_mode || path[0] != "knobs")
        return DeviceBoard.prototype.getColorBits.call(this, path);

    return SoftTakeoverBoard.prototype.getColorBits.call(this, path);
};

LiveBoard.prototype.getWeakColorBits = function(path){
    if(this.device_mode || path[0] != "knobs")
        return DeviceBoard.prototype.getWeakColorBits.call(this, path);

    return SoftTakeoverBoard.prototype.getWeakColorBits.call(this, path);
};

LiveBoard.prototype.getSoftValue = function(path){
    if(path[0] == "knobs" && this.control_values.knobs[path[1]][path[2]] == -1 &&
            !this.device_mode)
        return "unassigned";
    return DeviceBoard.prototype.getSoftValue.call(this, path);
};

LiveBoard.prototype.setSoftValue = function(path, value, from_device){
    if(typeof from_device == "undefined")
        from_device = false;

    return DeviceBoard.prototype.setSoftValue.call(this, path, value, from_device);
};

LiveBoard.prototype.getControlNumber = function(path){
    return this.bitwigControlNumber(this.layout[path[1]][path[2]]);
};

LiveBoard.prototype.bitwigControlNumber = function(i){
    return i + this.channel_offset;
};

LiveBoard.prototype.assignNumbersToControls = function(){
    var k = -1;
    for(var i = 0; i < 3; i++) {
        for(var j = 0; j < 8; j++)
            this.layout[i][j] = ++k;
    }
    return ++k;
};

LiveBoard.prototype.confirmAsAssigned = function(path){
    this.assigned[path[1]][path[2]] = true;
};

LiveBoard.prototype.isConfirmedAsAssigned = function(path){
    return this.assigned[path[1]][path[2]];
};

LiveBoard.prototype.getBoardName = function(){
    return "Live (" + this.channel + ")";
};
