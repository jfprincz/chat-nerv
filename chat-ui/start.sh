#!/bin/bash

# Kill any existing proxy servers
pkill -f "python chat-ui/proxy.py" > /dev/null 2>&1

# Change to the project directory
cd /Users/jack/Downloads/Storage/Projects/modeltest

# Start the proxy server
python chat-ui/proxy.py 