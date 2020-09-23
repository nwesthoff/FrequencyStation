#!/bin/sh
# launcher.sh
# navigate to home directory, then to this directory, then execute python script, then back home

cd /
cd ~/FrequencyStation/client-pi/ #where the script is
export QUICK2WIRE_API_HOME=~/FrequencyStation/client-pi/q2w
export PYTHONPATH=$PYTHONPATH:$QUICK2WIRE_API_HOME
python3 start.py #a command to run the script
cd /
