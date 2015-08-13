Novation LaunchControl XL - Bitwig Script
=========================================

About this repository
---------------------

Here is a Bitwig controller script for the Novation LaunchControl XL.

It contains 8 User modes thanks to which you can map any parameter in Bitwig and
4 factory modes that will suit to your different use cases and workflows: there's
a macro mode on which you can use the knobs to control 3 macros on each device,
a mode to control pan and fx sends and a live mode where knobs can be assigned
to anything in Bitwig (there's two boards using this mode since I thought it was
cool to have one for drums and another one for filters and effects.

The buttons and faders control the track volumes and mute/solo/arm toggles, as
well as track selection.

In each of these 3 factory modes, you can switch to device mode and get the
focus on the primary device of the selected track. Scrolling along the device
chain is possible as well (nested scrolling will come soon).

In device mode, the faders control the envelope parameters, the top row of knobs
controls the common parameters of the device, the bottom one controls the macros
and the middle one is a scrollable (using the up/down buttons) view over the
device's pages of parameters. You can use the fifth column of buttons to enable/
disable the device and the arm status of the current track. The last three
columns are mapped to preset scrolling features (author, category and the preset
itself) so that you can quickly try different presets in a given category.
Finally the first four columns help you select one of the device's macro as a
modulation source. When one is selected, you can tweak any knob to set the
modulation amount the control he's mapped to will get.

Oh and yeah, since switching between different modes is one of the key features
of this mapping, all the controls have a soft-takeover functionality enabled: it
means that if, at some point, a fader or knob is not at the same position on the
board and in Bitwig, you'll have to reach the position it has in the software to
actually take control. You can see which knobs are taking control because their
leds will have a lower brightness. In case the control you're moving is taking
over, the nav leds will indicate in which direction it has to be moved to take
control back.

You can find more documentation about the features offered by this mapping [here](http://elafarge.github.io/novation-launchcontrol-xl-bitwig).

The code is easily extensible so feel free to fork this repository, create new
boards extending `SoftTakeoverBoard` and to make PRs against this repository
once you're done :).

How do I install the mapping ?
------------------------------

Bitwig actually provides instructions to install controller scripts here : https://www.bitwig.com/en/community/control_scripts/installation_guide . You can download an archive containing the scripts to copy on top of this page.

Alternatively, if you're too lazy to follow a link or if you want a funky tour of all the possible installation methods and then pickup your favorite one, you can read below.



#### For Linux users
- If you have `git` installed just run `git clone https://github.com/elafarge/novation-launchcontrol-xl-bitwig.git`  under `~/Bitwig Studio/Controller Scripts`. Run `git push` when you you to update the mapping to the latest version.
- we have a one-line install/update script (you'll need to have curl installed):
```shell
sh -c "$(curl -L https://raw.githubusercontent.com/elafarge/novation-launchcontrol-xl-bitwig/master/install.sh)"
```
- or else, you can just download the archive here and extract it under `~/Bitwig Studio/Controller Scripts`

#### For OSX Users
- If you have `git` installed just run `git clone https://github.com/elafarge/novation-launchcontrol-xl-bitwig.git`  under `~/Documents/Bitwig Studio/Controller Scripts` in your Terminal. Run `git push` when you you to update the mapping to the latest version.
- we also have a one-line install/update script for you here, just open a Terminal and paste the below line in it:
```shell
sh -c "$(curl -L https://raw.githubusercontent.com/elafarge/novation-launchcontrol-xl-bitwig/master/install.sh)"
```
- or else, you can just download the archive here and extract it under `~/Bitwig Studio/Controller Scripts`

#### For Windows users
- Just follow the instructions on Bitwig's website please.

Once done, you should be able to
- use the `Detect Available Controllers` feature in Bitwig
- configure your LaunchControl manually.

Troubleshooting
---------------

If the installation script fails, please be aware that depending on
- your platform
- your amount of luck
- the version of Bitwig you are using
you might have to restart
- Bitwig
- your computer

If it still doesn't work
- check that the launchpad is ACTUALLY connected to your computer... Yeah, yeah I know 0_o
- check your midi configuration

Feel free to report bugs and any other type of issue you may encounter [on Github](https://github.com/elafarge/novation-launchcontrol-xl-bitwig/issues/new) :)

Authors
-------
* Etienne LAFARGE <etienne.lafarge\_at\_gmail.com>
