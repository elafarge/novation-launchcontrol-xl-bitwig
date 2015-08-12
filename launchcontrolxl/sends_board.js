/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: The sends board is a DeviceBoard with the bottom row of knobs
 * assigned to Pan and the two top rows assigned to FXes. Vertical scrolling
 * through effects is possible too.
 *
 */

SendsBoard = function(controller, channel){
    log_info("Creating a pan/fx board on channel " + channel);
    DeviceBoard.call(this, controller, channel);

    this.fx_offset = 0;

    DeviceBoard.call(this, controller, channel);

    // Register listeners on the pans and the FXes (+ "unassigned" fx ?)
    var board = this;
    for(var i=0; i<8; i++){
        var track = this.controller.track_bank.getTrack(i);
        track.getPan().addValueObserver(128, makeIndexedFunction(i, function(k, value){
            board.setSoftValue(["knobs", 2, k], value);
            SoftTakeoverBoard.prototype.valueChangedCallback.call(
                board, ["knobs", 2, k], value);
        }));
        for(var j=0; j<2; j++){
            track.getSend(j).addValueObserver(128, makeDoubleIndexedFunction(i, j,
                function(k, l, value){
                    board.setSoftValue(["knobs", 1-l, k], value);
                    SoftTakeoverBoard.prototype.valueChangedCallback.call(
                        board, ["knobs", 1-l, k], value);
                }));
        }
    }
};

SendsBoard.prototype = new DeviceBoard();

////////////////////////////////////////////////////////////////////////////////
/////////////                   Event handling                   ///////////////
////////////////////////////////////////////////////////////////////////////////

SendsBoard.prototype.onMidi = function(status, data1, data2){
    var path = Board.getControlPath(status, data1);

    if(path[0] == "nav" && ["up", "down"].indexOf(path[1]) > -1 && !this.device_mode &&
       data2 == 127){
        if(path[1] == "down") {
            this.disableAssignmentVisualFeedback(false);
            this.controller.track_bank.scrollSendsUp();
            this.enableAssignmentVisualFeedback(false);
        } else {
            this.disableAssignmentVisualFeedback(false);
            this.controller.track_bank.scrollSendsDown();
            this.enableAssignmentVisualFeedback(false);
        }
    }

    if(path[0] != "knobs" || this.device_mode)
        return DeviceBoard.prototype.onMidi.call(this, status, data1, data2);

    SoftTakeoverBoard.prototype.onMidi.call(this, status, data1, data2);

    if(this.hasControl(path)){
        if(path[1] == 2)
            this.controller.track_bank.getTrack(path[2]).getPan().set(data2, 128);
        else
            this.controller.track_bank.getTrack(path[2]).getSend(1-path[1]).set(data2, 128);
    }
};

////////////////////////////////////////////////////////////////////////////////
////// Getters, setters and utilities (play no role in the event stream) ///////
////////////////////////////////////////////////////////////////////////////////

SendsBoard.prototype.getColorBits = function(path){
    if(this.device_mode || path[0] != "knobs")
        return DeviceBoard.prototype.getColorBits.call(this, path);

    if(!this.track_enabled[path[2]])
        return 0;

    if(path[1] == 2)
        return 48;

    return this.track_color[path[2]][1];
};

SendsBoard.prototype.getWeakColorBits = function(path){
    if(this.device_mode || path[0] != "knobs")
        return DeviceBoard.prototype.getWeakColorBits.call(this, path);

    if(!this.track_enabled[path[2]])
        return 0;

    if(path[1] == 2)
        return 48;

    return this.track_color[path[2]][1];
};

SendsBoard.prototype.enableAssignmentVisualFeedback = function(horizontal){
    if(this.device_mode)
        return DeviceBoard.prototype.enableAssignmentVisualFeedback.call(this);

    if(typeof horizontal == "undefined")
        horizontal = true;

    if(horizontal)
        DeviceBoard.prototype.enableAssignmentVisualFeedback.call(this);

    for(var i=0; i<8; i++){
        this.controller.track_bank.getTrack(i).getPan().setIndication(true);
        this.controller.track_bank.getTrack(i).getSend(0).setIndication(true);
        this.controller.track_bank.getTrack(i).getSend(1).setIndication(true);
    }
};

SendsBoard.prototype.disableAssignmentVisualFeedback = function(horizontal){
    if(this.device_mode)
        return DeviceBoard.prototype.disableAssignmentVisualFeedback.call(this);

    if(typeof horizontal == "undefined")
        horizontal = true;

    if(horizontal)
        DeviceBoard.prototype.disableAssignmentVisualFeedback.call(this);

    for(var i=0; i<8; i++){
        this.controller.track_bank.getTrack(i).getPan().setIndication(false);
        this.controller.track_bank.getTrack(i).getSend(0).setIndication(false);
        this.controller.track_bank.getTrack(i).getSend(1).setIndication(false);
    }
};

SendsBoard.prototype.getBoardName = function(){
    return "Pan/FX";
};
