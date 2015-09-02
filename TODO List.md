TODO List
---------

Feel free to pick up a task and implement it.

New Features
============

* Have a fifth factory board with with the same fader/knob mapping as the last selected factory
  board (4th by default ?) but whith buttons allowing control for transport (play/pause/record/
  automation), "insert loop in clip" feature with a way to set the length of the loop in bars,
  overdub not far from it, the device button with a mixerboard behaviour (redirect midi too), and
  to a possible extent, in software navigation to add new tracks, browse devices and presets,
  samples kits, an undo/redo mapping.
* A new User Mode with the ability to "freeze" a "track" (in the sense of a column on the
  Launchcontrol). That would be cool for a mixing session where one might want to be able to
  switch between effects only. Extending the existing UserMode should be a good approach.
* Track navigation synchronized with the Novation Launchpad (make a PR against their repo).
* Scroll in sends: investigate what doesn't work and fix it
* Save the state of the launchpad when the script is exited and retrieve it when it wakes up
  (state = physical values of all the knobs and faders for a direct takeover when starting the
  script). Since Bitwig's API doesn't seem to provide a good way to write on DIsk, I was thinking
  of hiding the state in controller parameters on `exit()` and to fetch them on `start()` and then
  get them deleted to stop the end user from witnessing this dirty trick in the UI.


Code improvements
=================

* Add a cursor_track to have control over the selected device Arm would be cool, right now I
  honestly don't know why the button is magicaly updating after the arm state has changed.
* Add a CONTRIBUTING.md file to the repo.

Miscanellous
============

* Write a quick article describing the features of this script and put it in the README.md. Also
  installation instructions and a little history of this repo would be welcome. Github pages or
  the standard Github wiki could also be interesting alternatives for docs.
