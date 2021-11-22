#!/bin/bash

# This bash script tests whether app.js and service-worker.js have the same value for appVersion and for ASSETS_CACHE.

# Find the repo dir (it's the parent of the dir that contains this script)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

# Check values in files
cd $REPO_DIR
SW_VERSION="$(grep 'appVersion\s=' service-worker.js | sed -E 's/[^[:digit:]]+([[:digit:].]+).*/\1/')"
APP_VERSION="$(grep 'params\[.appVersion' www/js/app.js | sed -E 's/[^[:digit:]]+([[:digit:].]+).*/\1/')"
echo "service-worker.js : $SW_VERSION"
echo "app.js            : $APP_VERSION"
if [ $SW_VERSION == $APP_VERSION ] ; then
    echo "Both values of 'appVersion' are identical"
else
    echo "ERROR! Please ensure values for 'appVersion' in app.js and service-worker.js are identical!"
    exit 1
fi
SW_ASSETS_CACHE="$( grep 'ASSETS_CACHE\s=' service-worker.js | sed -E "s/[^']+'([^']+).*/\1/")"
APP_ASSETS_CACHE="$(grep 'ASSETS_CACHE\s=' www/js/app.js | sed -E "s/[^']+'([^']+).*/\1/")"
echo "service-worker.js : $SW_ASSETS_CACHE"
echo "app.js            : $APP_ASSETS_CACHE"
if [ $SW_ASSETS_CACHE == $APP_ASSETS_CACHE ] ; then
    echo "Both values of 'ASSETS_CACHE' are identical"
else
    echo "ERROR! Please ensure values for 'ASSETS_CACHE' in app.js and service-worker.js are identical!"
    exit 1
fi
