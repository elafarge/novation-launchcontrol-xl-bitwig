/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: Container for all the mappings
 *
 */

Controller = function(bw_host){
    log_info("Initializing Novation LaunchControl XL");

    this.host = bw_host;
    this.boards = [];
    this.current_board_number = -1;

    // Unfortunately we can have only one control section per controller so we
    // have to create it here once and for all for the 8 user channels
    this.user_control_count = Board.CONTROL_COUNT*8 + 2*LiveBoard.USER_CONTROL_COUNT;
    this.bitwig_user_controls = this.host.createUserControls(this.user_control_count);
    this.track_bank = this.host.createMainTrackBank(8, 2, 0);

    var channel_offset = 0;
    for(var i=0; i<8; i++){
        this.boards.push(new UserBoard(this, i, channel_offset));
        channel_offset += Board.CONTROL_COUNT;
    }

    this.boards.push(new MacroBoard(this, 8));
    this.boards.push(new SendsBoard(this, 9));
    this.boards.push(new LiveBoard(this, 10, channel_offset));
    channel_offset += LiveBoard.USER_CONTROL_COUNT;
    this.boards.push(new LiveBoard(this, 11, channel_offset));
    channel_offset += LiveBoard.USER_CONTROL_COUNT;

    // Select the first template to match with the above
    this.enableBoard(11);
    this.sendSysEx("F0 00 20 29 02 11 77 0b F7");
};

Controller.prototype.onMidi = function(status, data1, data2){
    if(this.currentBoard != null)
        this.currentBoard().onMidi(status, data1, data2);
};

/**
 * This function gets called when a SysEx message is sent by the controller.
 * Since the only SysEx message it sends is a "template change" one, we process
 * it right there by selecting the desired board. If the board doesn't exist
 * the controller just won't work on the channel bound to this board.
 */
Controller.prototype.onSysEx = function(data){
    if (data.matchesHexPattern('F0 00 20 29 02 11 77 ?? F7')){
        var i = data.hexByteAt(7);

        log_info("Received SysEx message from controller, switching from channel " +
            this.current_board_number + " to channel " + i);

        this.enableBoard(i);
    } else {
        log_info("An unrecognized SysEx message has been caught. Here it is: ");
        log_sysex(data);
    }
};

/**
 * Sends a SysEx message to the controller
 */
Controller.prototype.sendSysEx = function(data){
    this.host.getMidiOutPort(0).sendSysex(data);
};

/**
 * Sends a midi message to the controller
 */
Controller.prototype.sendMidi = function(status, data1, data2){
    this.host.getMidiOutPort(0).sendMidi(status, data1, data2);
};

Controller.prototype.enableBoard = function(i){
    // Paranoia check
    if(i < 0 || i >= this.boards.length)
        throw "Error in enableBoard(" + i + "): Invalid board number. There " +
            "is only " + this.boards.length + " boards available."

    if(this.current_board_number >= 0)
        this.currentBoard().disable();

    this.boards[i].enable();
    this.current_board_number = i;
};

Controller.prototype.currentBoard = function(){
    if(this.current_board_number == -1)
        return null;

    return this.boards[this.current_board_number];
};
