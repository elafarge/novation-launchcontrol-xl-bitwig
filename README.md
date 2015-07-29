Novation LaunchControl XL - Bitwig Script
=========================================

About this repository
---------------------

A Bitwig controller script for the Novation LaunchControl XL. Right now it
binds the 8 user modes of the device to any controller in Bitwig using Bitwig's
"controller assign" feature. It provides more than enough for a big live set but
factory modes, more appropriate for editing, composing and jamming in general
are to come.

The code is easily extensible so feel free to fork this repository, create new
boards extending `SoftTakeoverBoard` and to make PRs against this repository
once you're done :).

How to Install this script
--------------------------

TODO

Room for improvement
--------------------

Apart from the Factory modes, one feature would be great: being able to save the
state (values) on the faders and knobs across Bitwig sessions, restarts and
system reboots. Bitwig's API doesn't allow us to save anything on the hard drive
but... we can communicate with TCP services.
Therefore it would be possible to create such a service to save and retrieve
the control states on disk everytime the controller script is stopped or
started.

Right know I'm planning to write a little something in Go, built by Omnibus and
distributed as a system service across platforms.

Also, leveraging this TCP capabilities could make it possible to communicate
with an enhanced version of the Launchpad Script and have awesome mappings
involving both the Launchpad and the Launchcontrol XL (scroll sync would be the
first really useful feature).

Authors
-------

* Etienne LAFARGE <etienne.lafarge\_at\_gmail.com>
