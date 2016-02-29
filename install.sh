#!/bin/bash

virtualenv -p python2 ve2
virtualenv -p python3 ve3

ve2/bin/pip install crossbar honcho
ve3/bin/pip install -r requirements.txt
