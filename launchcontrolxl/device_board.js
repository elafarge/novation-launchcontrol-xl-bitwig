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
    log_info("Creating a device board on channel " + channel);
    MixerBoard.call(this, controller, channel);

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

        // Tweak the right control
    }
};

DeviceBoard.prototype.getColorBits = function(path){
    if(!this.device_mode)
        return MixerBoard.prototype.getColorBits.call(this, path);

    return 51;
};

DeviceBoard.prototype.getWeakColorBits = function(path){
    if(!this.device_mode)
        return MixerBoard.prototype.getWeakColorBits.call(this, path);

    return 51;

};

DeviceBoard.prototype.enableAssignmentVisualFeedback = function(){
    if(!this.device_mode)
        return MixerBoard.prototype.enableAssignmentVisualFeedback.call(this);
};

DeviceBoard.prototype.disableAssignmentVisualFeedback = function(){
    if(!this.device_mode)
        return MixerBoard.prototype.disableAssignmentVisualFeedback.call(this);
};

DeviceBoard.prototype.getSoftValue = function(path){
    if(!this.device_mode)
        return MixerBoard.prototype.getSoftValue.call(this, path);

    return -1;
};

DeviceBoard.prototype.setSoftValue = function(path, value){
    if(!this.device_mode)
        return MixerBoard.prototype.setSoftValue.call(this, path, value);
};
