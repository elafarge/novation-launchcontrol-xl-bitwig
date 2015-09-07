/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: Container for all the mappings
 *
 */

TransportBoard = function(controller, channel, ref_board){
    SoftTakeoverBoard.call(this, controller, channel);

    this.ref_board = ref_board;

    this.selected_panel_layout = "MIX";

    this.button_states = {
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

    // Buttons are always in control
    for(var i=0; i<8; i++){
        this.setState(["buttons", 0, i], SoftTakeoverBoard.IN_CONTROL);
        this.setState(["buttons", 1, i], SoftTakeoverBoard.IN_CONTROL);
    }

    var board=this;

    this.controller.transport.addIsPlayingObserver(function(is_playing){
        board.setSoftValue(["buttons", 1, 1], is_playing ? 127 : 0);
        board.updateLed(["buttons", 1, 1]);
    });

    this.controller.transport.addIsRecordingObserver(function(is_recording){
        board.setSoftValue(["buttons", 0, 0], is_recording ? 127 : 0);
        board.updateLed(["buttons", 0, 0]);
    });

    this.controller.transport.addLauncherOverdubObserver(function(is_overdubbing){
        board.setSoftValue(["buttons", 0, 3], is_overdubbing ? 127 : 0);
        board.updateLed(["buttons", 0, 3]);
    });

    this.controller.transport.addIsWritingArrangerAutomationObserver(function(is_writing){
        board.setSoftValue(["buttons", 0, 1], is_writing ? 127 : 0);
        board.updateLed(["buttons", 0, 1]);
    });

    this.controller.transport.addIsWritingClipLauncherAutomationObserver(function(is_writing){
        board.setSoftValue(["buttons", 0, 2], is_writing ? 127 : 0);
        board.updateLed(["buttons", 0, 2]);
    });

    this.controller.application.addPanelLayoutObserver(function(layout){
        board.selected_panel_layout = layout;
    }, 24);

    this.controller.arranger.isTimelineVisible().addValueObserver(function(visible){
        board.setSoftValue(["buttons", 0, 5], visible ? 127 : 0);
        board.updateLed(["buttons", 0, 5]);
    });
};

TransportBoard.prototype = new SoftTakeoverBoard();

TransportBoard.prototype.onMidi = function(status, data1, data2){
    var path = Board.getControlPath(status, data1);

    if(!this.shouldHandle(path))
        return this.ref_board.onMidi(status, data1, data2);

    // For the buttons whose color isn't mapped to something in Bitwig
    if(path[0] === "buttons" && Math.floor(status/16) === 8){
        if(path[1] === 1){
            switch(path[2]){
                case 0:
                case 2:
                case 3:
                case 4:
                case 5:
                    this.setSoftValue(path, 0);
                    this.updateLed(path);
                    break;
            }
        } else {
            switch(path[2]){
                case 4:
                    this.setSoftValue(path, 0);
                    this.updateLed(path);
                    break;
            }
        }

    }

    if(path[0] === "buttons" && Math.floor(status/16) !== 8){
        if(path[1] === 1){
            switch(path[2]){
                case 0:
                    this.setSoftValue(path, 127);
                    this.updateLed(path);
                    this.controller.transport.stop();
                    break;
                case 1:
                    this.controller.transport.togglePlay();
                    break;
                case 2:
                    this.setSoftValue(path, 127);
                    this.updateLed(path);
                    this.controller.application.undo();
                    break;
                case 3:
                    this.setSoftValue(path, 127);
                    this.updateLed(path);
                    this.controller.application.redo();
                    break;
                case 4:
                    this.setSoftValue(path, 127);
                    this.updateLed(path);
                    this.controller.transport.getTempo().incRaw(-0.5);
                    break;
                case 5:
                    this.setSoftValue(path, 127);
                    this.updateLed(path);
                    if(this.selected_panel_layout === 'ARRANGE')
                        this.controller.application.setPanelLayout('MIX');
                    else
                        this.controller.application.setPanelLayout('ARRANGE');
                    break;
            }
        } else {
            switch(path[2]){
                case 0:
                    this.controller.transport.record();
                    break;
                case 1:
                    this.controller.transport.toggleWriteArrangerAutomation();
                    break;
                case 2:
                    this.controller.transport.toggleWriteClipLauncherAutomation();
                    break;
                case 3:
                    this.controller.transport.toggleLauncherOverdub();
                    break;
                case 4:
                    this.setSoftValue(path, 127);
                    this.updateLed(path);
                    this.controller.transport.getTempo().incRaw(0.5);
                    break;
                case 5:
                    this.setSoftValue(path, 127);
                    this.updateLed(path);
                    this.controller.arranger.isClipLauncherVisible().set(true);
                    this.controller.arranger.isTimelineVisible().toggle();
                    break;
            }
        }
    }

    SoftTakeoverBoard.prototype.onMidi.call(this, status, data1, data2);
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

    if(path[0] === "buttons"){
        if(path[1] === 1){
            switch(path[2]){
                case 0: return 17;
                case 1: return 16;
                case 2: return 17;
                case 3: return 17;
                case 4: return 17;
                case 5: return 18;
            }
        } else {
            switch(path[2]){
                case 0: return 1;
                case 1: return 1;
                case 2: return 1;
                case 3: return 1;
                case 4: return 17;
                case 5: return 18;
            }
        }
    }

    return 0;
};

TransportBoard.prototype.getColorBits = function(path){
    if(!this.shouldHandle(path))
        return this.ref_board.getColorBits(path);

    if(path[0] === "buttons"){
        if(path[1] === 1){
            switch(path[2]){
                case 0: return 51;
                case 1: return 48;
                case 2: return 50;
                case 3: return 50;
                case 4: return 50;
                case 5: return 51;
            }
        } else {
            switch(path[2]){
                case 0: return 3;
                case 1: return 3;
                case 2: return 3;
                case 3: return 3;
                case 4: return 50;
                case 5: return 51;
            }
        }
    }

    return 51;
};

TransportBoard.prototype.getBoardName = function(){
    return "Transport";
};
