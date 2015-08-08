/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: The macro board is a DeviceBoard with each column of knobs
 * controlling the 8 macros of the primary instrument of each track. Vertical
 * scrolling is possible but it's always better to keep it to 3 macros not to
 * get lost between the tracks.
 *
 */

MacroBoard = function(controller, channel){
    log_info("Creating a macro board on channel " + channel);

    this.macro_offset = 0;

    this.macro_values = [
        // The indexing is (macro, channel) to fit the LaunchControl's Layout
        [-1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1]
    ];

    DeviceBoard.call(this, controller, channel);

    // Register listeners on the macro controls of the primary tracks
    var board = this;
    for(var i=0; i<8; i++){
        var track = this.controller.track_bank.getTrack(i);
        for(var j=0; j<8; j++){
            track.getPrimaryDevice().getMacro(j).getAmount().addValueObserver(128,
                    makeDoubleIndexedFunction(i, j, function(k, l, value){
                        board.macro_values[l][k] = value;
                        var row = 2 - l + board.macro_offset;
                        if(0 <= row && row < 3){
                            board.setSoftValue(["knobs", row, k], value);
                            SoftTakeoverBoard.prototype.valueChangedCallback.call(
                                board, ["knobs", row, k], value);
                        }
                    }));
        }
    }
};

MacroBoard.prototype = new DeviceBoard();

////////////////////////////////////////////////////////////////////////////////
/////////////                   Event handling                   ///////////////
////////////////////////////////////////////////////////////////////////////////

MacroBoard.prototype.onMidi = function(status, data1, data2){
    var path = Board.getControlPath(status, data1);

    if(path[0] == "nav" && ["up", "down"].indexOf(path[1]) > -1 && !this.device_mode &&
       data2 == 127){
        if(path[1] == "down" && this.macro_offset < 5){
            this.disableAssignmentVisualFeedback(false);
            this.macro_offset++;
            this.enableAssignmentVisualFeedback(false);
        } else if(path[1] == "up" && this.macro_offset > 0) {
            this.disableAssignmentVisualFeedback(false);
            this.macro_offset--;
            this.enableAssignmentVisualFeedback(false);
        }

        this.resetKnobsState();
    }

    if(path[0] != "knobs" || this.device_mode)
        return DeviceBoard.prototype.onMidi.call(this, status, data1, data2);

     SoftTakeoverBoard.prototype.onMidi.call(this, status, data1, data2);

     // Tweak the knobs
     if(this.hasControl(path) && this.macro_values[2 - path[1] + this.macro_offset][path[2]]
        != -1){
         this.controller.track_bank.getTrack(path[2]).getPrimaryDevice().
             getMacro(2 - path[1] + this.macro_offset).getAmount().set(data2, 128);
         this.macro_values[2 - path[1] + this.macro_offset][path[2]] = data2;
     }
};

MacroBoard.prototype.resetKnobsState = function(){
    for(var i=0; i<3; i++){
        for(var j=0; j<8; j++){
            this.setSoftValue(["knobs", i, j], this.macro_values[2 - i + this.macro_offset][j]);
            this.resetControlState(["knobs", i, j]);
        }
    }
};

////////////////////////////////////////////////////////////////////////////////
////// Getters, setters and utilities (play no role in the event stream) ///////
////////////////////////////////////////////////////////////////////////////////

MacroBoard.prototype.getColorBits = function(path){
    if(this.device_mode || path[0] != "knobs")
        return DeviceBoard.prototype.getColorBits.call(this, path);

    if(!this.track_enabled[path[2]])
        return 0;

    return this.track_color[path[2]][1];
};

MacroBoard.prototype.getWeakColorBits = function(path){
    if(this.device_mode || path[0] != "knobs")
        return DeviceBoard.prototype.getWeakColorBits.call(this, path);

    if(!this.track_enabled[path[2]])
        return 0;

    return this.track_color[path[2]][1];
};

MacroBoard.prototype.getSoftValue = function(path){
    if(this.device_mode || path[0] != "knobs")
        return DeviceBoard.prototype.getSoftValue.call(this, path);

    return this.macro_values[this.macro_offset + 2 - path[1]][path[2]];
};

MacroBoard.prototype.enableAssignmentVisualFeedback = function(horizontal){
    if(this.device_mode)
        return DeviceBoard.prototype.enableAssignmentVisualFeedback.call(this);

    if(typeof horizontal == "undefined")
        horizontal = true;

    if(horizontal)
        DeviceBoard.prototype.enableAssignmentVisualFeedback.call(this);

    for(var i=0; i<8; i++){
        for(var j=this.macro_offset; j<this.macro_offset + 3; j++)
            this.controller.track_bank.getTrack(i).getPrimaryDevice().getMacro(j).getAmount().
                setIndication(true);
    }
};

MacroBoard.prototype.disableAssignmentVisualFeedback = function(horizontal){
    if(this.device_mode)
        return DeviceBoard.prototype.disableAssignmentVisualFeedback.call(this);

    if(typeof horizontal == "undefined")
        horizontal = true;

    if(horizontal)
        DeviceBoard.prototype.disableAssignmentVisualFeedback.call(this);

    for(var i=0; i<8; i++){
        for(var j=this.macro_offset; j<this.macro_offset + 3; j++)
            this.controller.track_bank.getTrack(i).getPrimaryDevice().getMacro(j).getAmount().
                setIndication(false);
    }
};

MacroBoard.prototype.getBoardName = function(){
    return "Macro ";
};
