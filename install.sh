#!/bin/sh

echo "-- INSTALLING THE BITWIG MAPPINGS FOR THE LAUNCHCONTROL --"
echo "---- Determining the location of Bitwig's controller scripts.----"
# Are we on OSX or on Linux
KNOWN_DISTRIBUTION="(Debian|Ubuntu|RedHat|CentOS|openSUSE|Amazon)"
DISTRIBUTION=$(lsb_release -d 2>/dev/null | grep -Eo $KNOWN_DISTRIBUTION  || grep -Eo $KNOWN_DISTRIBUTION /etc/issue 2>/dev/null || uname -s)

# Let's cd into the controller script directory
if [ $DISTRIBUTION = "Darwin" ]; then
  cd ~/Documents/Bitwig\ Studio/Controller\ Scripts/
else
  cd ~/Bitwig\ Studio/Controller\ Scripts/
fi

echo $DISTRIBUTION;

echo "---- Checking for older versions of the mapping ----"
rm -rf novation-elafarge

# Let's download and install the beast
echo "---- Download of the controller script starts ----"
curl -L https://github.com/elafarge/novation-launchcontrol-xl-bitwig/tarball/master -o novation-elafarge.tar.gz
echo "---- Download successfull, decompressing and unarchiving the script ----"
tar -xf novation-elafarge.tar.gz

# And let's prompt our user
echo "---- The controller script for your LaunchControl XL has been installed successfully ----"
