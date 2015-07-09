/**
 * Author: Etienne Lafarge (etienne.lafarge@gmail.com, Github: elafarge)
 * Date: 07/2015
 * Description: A set of utility function for the LaunchControl XL controller
 * script for Bitwig (and for Midi parsing in general)
 *
 */

function intToHex(my_int){
    ret = my_int.toString(16);
    if(ret.length == 1)
        ret = "0" + ret;
    return ret;
}

// Logging utilities (very minimalistic since we don't have access to that many
// outputs

INFO = 1;
ERROR = 2;
LOG_LEVEL = INFO;

function log_info(message){
    if(LOG_LEVEL <= INFO)
        println("== INFO === > " + message);
}

function log_error(error_message){
    if(LOG_LEVEL <= ERROR)
        println("== ERROR == > " + error_message);
}

function log_midi(status, data1, data2){
    if(LOG_LEVEL <= INFO)
        printMidi(status, data1, data2);
}
