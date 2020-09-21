#!/bin/sh
# launcher.sh
# navigate to home directory, then to this directory, then execute python script, then back home

cd /
cd home/pi/FrequencyStation/client-pi/ #where the script is
python3 start.py #a command to run the script
cd /
