#!/bin/bash

# This bash script tests whether PWAServer has been set correctly in app.js

SERVER=$(grep -E '^[^/]+params.+?PWAServer.+?http' ./www/js/app.js)
echo "The PWAServer is set to $SERVER"
SERVER_COUNT=$(grep -o 'PWAServer' <<< "$SERVER" | wc -l)
echo "$SERVER_COUNT server(s) are set in app.js"
if [[ $SERVER_COUNT > 1 || ! $SERVER =~ 'kiwix.org' ]]; then
  echo "WARNING: The value of params['PWAServer'] is incorrectly set in app.js!"
  exit 1
else
  echo "PWAServer is correctly set in app.js"
fi
