module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      all: [
               'Gruntfile.js',
               'LaunchControlXL.control.js',
               'launchcontrolxl/board.js',
               'launchcontrolxl/controller.js/',
               'launchcontrolxl/device_board.js',
               'launchcontrolxl/live_board.js',
               'launchcontrolxl/macro_board.js',
               'launchcontrolxl/mixer_board.js',
               'launchcontrolxl/sends_board.js',
               'launchcontrolxl/soft_takeover_board.js',
               'launchcontrolxl/user_board.js',
               'launchcontrolxl/util.js',
           ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.registerTask('default', 'jshint');

};
