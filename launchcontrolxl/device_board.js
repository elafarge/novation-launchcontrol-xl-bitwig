/* jshint loopfunc: true */

/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: The device board (abstract board) is an extension of the mixer
 * board which can be switched to device mode and control the selected devices.
 * Macros + pages navigation is available as well as 2 page scrolling, device
 * navigation, in and out navigation (if possible in Bitwig's API) and, also if
 * possible, a modulation select and amount feature or if not, when modulation
 * is enabled in Bitwig, tweaking a control should set the modultion amount, not
 * the value of the control itself.
 *
 */

DeviceBoard = function(controller, channel){
    if(typeof controller == "undefined")
        return;

    log_info("Creating a device board on channel " + channel);
    MixerBoard.call(this, controller, channel);

    this.device_values = {
        "knobs": [
            [64, 64, 64, 64, 64, 64, 64, 64],
            [64, 64, 64, 64, 64, 64, 64, 64],
            [64, 64, 64, 64, 64, 64, 64, 64]
        ],
        "faders": [64, 64, 64, 64, 64, 64, 64, 64],
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

    // Let's register our observers
    var board = this;
    for(var i=0; i<8; i++){
        this.controller.cursor_device.getEnvelopeParameter(i).addValueObserver(128,
            makeIndexedFunction(i, function(k, value){
                board.setSoftValue(["faders", k], value, true);
                SoftTakeoverBoard.prototype.valueChangedCallback.call(board,
                    ["faders", k], value);
            }));
        this.controller.cursor_device.getMacro(i).getAmount().addValueObserver(128,
            makeIndexedFunction(i, function(k, value){
                board.setSoftValue(["knobs", 2, k], value, true);
                SoftTakeoverBoard.prototype.valueChangedCallback.call(board,
                    ["knobs", 2, k], value);
            }));
        this.controller.cursor_device.getCommonParameter(i).addValueObserver(128,
            makeIndexedFunction(i, function(k, value){
                board.setSoftValue(["knobs", 0, k], value, true);
                SoftTakeoverBoard.prototype.valueChangedCallback.call(board,
                    ["knobs", 0, k], value);
            }));
        this.controller.cursor_device.getParameter(i).addValueObserver(128,
            makeIndexedFunction(i, function(k, value){
                board.setSoftValue(["knobs", 1, k], value, true);
                SoftTakeoverBoard.prototype.valueChangedCallback.call(board,
                    ["knobs", 1, k], value);
            }));
        // The modulation source observer
        this.controller.cursor_device.getMacro(i).getModulationSource().addIsMappingObserver(
            makeIndexedFunction(i, function(k, is_mapping){
                var x = Math.floor(k/4);
                var y = k % 4;

                board.setSoftValue(["buttons", x, y], is_mapping? 127 : 0, true);
                SoftTakeoverBoard.prototype.valueChangedCallback.call(board, ["buttons", x, y],
                    is_mapping? 127 : 0);

                // Let's have soft takeover enabled for when we exit modulation mode, unfortunately
                // we can't do that when we enter modulation mode because we don't have access to
                // the modulation amount. It leads to a shitty glitch in modulation value when the
                // controller for a modulation target is first tweaked :(
                if(!is_mapping)
                    board.resetAllControlsState();
                else {
                    // Yeah, it avoids having to go to a fictive point when that controller was
                    // taking over before. Since there will be a glitch anyway... :/
                    for(var i=0; i < 8; i++){
                        board.setState(["faders", i], SoftTakeoverBoard.IN_CONTROL);
                        for(var j=0; j < 3; j++)
                            board.setState(["knobs", j, i], SoftTakeoverBoard.IN_CONTROL);
                    }
                }
            }));
        // The is_enabled toggle
        this.controller.cursor_device.addIsEnabledObserver(function(yes){
            board.setSoftValue(["buttons", 0, 4], yes? 127 : 0, true);
            SoftTakeoverBoard.prototype.valueChangedCallback.call(board, ["buttons", 0, 4],
                yes? 127 : 0);
        });
    }
};

DeviceBoard.prototype = new MixerBoard();

////////////////////////////////////////////////////////////////////////////////
/////////////                   Event handling                   ///////////////
////////////////////////////////////////////////////////////////////////////////
DeviceBoard.prototype.onMidi = function(status, data1, data2){
    // If we're not in device mode we redirect the Midi
    if(!this.device_mode)
        MixerBoard.prototype.onMidi.call(this, status, data1, data2);
    else {
        var path = Board.getControlPath(status, data1);

        if(path[0] == "action" && path[1] == "device" && Math.floor(status/16) != 8)
            return this.enableMixerMode();

        SoftTakeoverBoard.prototype.onMidi.call(this, status, data1, data2);

        // Navigation accross devices and pages
        if(path[0] == "nav" && data2 == 127){
            this.disableAssignmentVisualFeedback();
            switch(path[1]){
                case "left": this.controller.cursor_device.selectPrevious(); break;
                case "right": this.controller.cursor_device.selectNext(); break;
                case "up": this.controller.cursor_device.previousParameterPage(); break;
                case "down": this.controller.cursor_device.nextParameterPage(); break;
            }
            this.enableAssignmentVisualFeedback();
        }

        // In case one of the preset navigation button is released
        if(path[0] == "buttons" && Math.floor(status/16) == 8 && path[2] > 4){
            this.setSoftValue(path, 0, true);
            SoftTakeoverBoard.prototype.valueChangedCallback.call(this, path, 0);
        }

        if(path[0] == "buttons" && Math.floor(status/16) != 8){
            // Let's deals with macro modulation here and quit
            if(path[2] < 4){
                i = path[2] + 4 * path[1];
                this.controller.cursor_device.getMacro(i).getModulationSource().toggleIsMapping();
                return;
            } else {
                // Navigation accross presets
                if(path[1] === 0){
                    switch(path[2]){
                        case 4: this.controller.cursor_device.toggleEnabledState(); break;
                        case 5: this.controller.cursor_device.switchToNextPresetCreator(); break;
                        case 6: this.controller.cursor_device.switchToNextPresetCategory(); break;
                        case 7: this.controller.cursor_device.switchToNextPreset(); break;
                    }
                } else {
                    switch(path[2]){
                        case 4:
                            this.controller.track_bank.getTrack(this.selected_track_index).
                                getArm().toggle();
                            break;
                        case 5: this.controller.cursor_device.switchToPreviousPresetCreator(); break;
                        case 6: this.controller.cursor_device.switchToPreviousPresetCategory(); break;
                        case 7: this.controller.cursor_device.switchToPreviousPreset(); break;
                    }
                }
                if(path[2] > 4){
                    this.setSoftValue(path, 127, true);
                    SoftTakeoverBoard.prototype.valueChangedCallback.call(this, path, 127);
                }
            }
        }

        // Tweak the right control
        if(this.hasControl(path)){
            if(path[0] == "faders"){
                this.controller.cursor_device.getEnvelopeParameter(path[1]).set(data2, 128);
            }

            if(path[0] == "knobs"){
                if(path[1] == 2){
                    this.controller.cursor_device.getMacro(path[2]).getAmount().set(data2, 128);
                } else if(path[1] === 0){
                    this.controller.cursor_device.getCommonParameter(path[2]).set(data2, 128);
                }else{
                    this.controller.cursor_device.getParameter(path[2]).set(data2, 128);
                }
            }
        }
    }
};

DeviceBoard.prototype.enableDeviceMode = function(){
    // Let's cheat a bit to togglethe device view: we have no way to figure out which panel is
    // displayed and we can only toggle so what we do is make sure the device panel isn't shown
    // by toggling the noteeditor and then we toggle the device panel... yeah that's called a hack
    this.controller.application.toggleNoteEditor();
    this.controller.application.toggleDevices();

    // Ok now let's select the first device and get a cursor on it
    this.controller.application.focusPanelBelow();
    this.controller.application.arrowKeyRight();

    // And now our cursor device should be pointing to the right place, let's give the user
    // feedback
    MixerBoard.prototype.enableDeviceMode.call(this);
};

DeviceBoard.prototype.enableMixerMode = function(){
    MixerBoard.prototype.enableMixerMode.call(this);

    this.controller.application.toggleNoteEditor();
    this.controller.application.toggleDevices();
    this.controller.application.toggleDevices();
};

DeviceBoard.prototype.getColorBits = function(path){
    if(!this.device_mode)
        return MixerBoard.prototype.getColorBits.call(this, path);

    if(["knobs", "faders"].indexOf(path[0]) > -1){
        var i = (path[0] == "knobs")? path[2] : path[1];
        switch(i){
            case 0: return 3;
            case 1: return 35;
            case 2: return 50;
            case 3: return 48;
            case 4: return 49;
            case 5: return 49;
            case 6: return 34;
            case 7: return 19;
        }
    }

    // The buttons
    if(path[0] == "buttons"){
        if (path[2] < 4)
            return 48;
        if(path[2] == 4){
            if(path[1] === 0)
                return 48;
            else
                return 3;
        }
        switch(path[2]){
            case 5: return 51;
            case 6: return 48;
            case 7: return 50;
        }
    }

    return 51;
};

DeviceBoard.prototype.getWeakColorBits = function(path){
    if(!this.device_mode)
        return MixerBoard.prototype.getWeakColorBits.call(this, path);

    //knobs and faders
    if(["knobs", "faders"].indexOf(path[0]) > -1){
        var i = (path[0] == "knobs")? path[2] : path[1];
        switch(i){
            case 0: return 1;
            case 1: return 17;
            case 2: return 34;
            case 3: return 16;
            case 4: return 16;
            case 4: return 17;
            case 6: return 33;
            case 7: return 18;
        }
    }

    // TODO: Action buttons

    // The buttons
    if(path[0] == "buttons"){
        if (path[2] < 4)
            return 17;
        if(path[2] == 4){
            if(path[1] === 0)
                return 16;
            else
                return 1;
        }
        switch(path[2]){
            case 5: return 17;
            case 6: return 16;
            case 7: return 34;
        }
    }

    return 17;
};

DeviceBoard.prototype.enableAssignmentVisualFeedback = function(){
    if(!this.device_mode)
        return MixerBoard.prototype.enableAssignmentVisualFeedback.call(this);

    // Let's give feedback over the enveloppes
    for(var i=0; i<8; i++){
        this.controller.cursor_device.getEnvelopeParameter(i).setIndication(true);
        this.controller.cursor_device.getCommonParameter(i).setIndication(true);
        this.controller.cursor_device.getMacro(i).getAmount().setIndication(true);
        this.controller.cursor_device.getParameter(i).setIndication(true);
    }
};

DeviceBoard.prototype.disableAssignmentVisualFeedback = function(){
    if(!this.device_mode)
        return MixerBoard.prototype.disableAssignmentVisualFeedback.call(this);

    for(var i=0; i<8; i++){
        this.controller.cursor_device.getEnvelopeParameter(i).setIndication(false);
        this.controller.cursor_device.getCommonParameter(i).setIndication(false);
        this.controller.cursor_device.getMacro(i).getAmount().setIndication(false);
        this.controller.cursor_device.getParameter(i).setIndication(false);
    }
};

DeviceBoard.prototype.getSoftValue = function(path){
    if(!this.device_mode)
        return MixerBoard.prototype.getSoftValue.call(this, path);

    // An exception for the record state, yeah that's a sneaky workaround :)
    if(path[0] == "buttons" && path[1] == 1 && path[2] == 4)
        return this.button_states.record[this.selected_track_index]? 127 : 0;

    if(path.length == 3)
        return this.device_values[path[0]][path[1]][path[2]];
    else if(path.length == 2)
        return this.device_values[path[0]][path[1]];
    else
        throw "Incorrect path length, must be one or two";
};

DeviceBoard.prototype.setSoftValue = function(path, value, from_device){
    if(typeof from_device == "undefined")
        from_device = false;

    if(!this.device_mode && !from_device)
        return MixerBoard.prototype.setSoftValue.call(this, path, value);

    if(path.length == 3)
        this.device_values[path[0]][path[1]][path[2]] = value;
    else if(path.length == 2)
        this.device_values[path[0]][path[1]] = value;
    else
        throw "Incorrect path length, must be one or two";
};
