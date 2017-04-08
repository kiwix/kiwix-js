#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
cd $BASEDIR
VERSION=$1

# Install web-ext if it's not already installed
if [ ! -f node_modules/web-ext/bin/web-ext ]; then
    npm install web-ext
fi

cd tmp
echo "Packaging unsigned Firefox extension, version $VERSION"
zip -r ../build/kiwix-firefox-unsigned-extension-$VERSION.xpi www webextension manifest.json LICENSE-GPLv3.txt service-worker.js README.md

# Sign the extension with the Mozilla API through web-ext
echo "Signing the extension for Firefox with Mozilla API, version $VERSION"
../node_modules/web-ext/bin/web-ext sign --api-key=${MOZILLA_API_KEY} --api-secret=${MOZILLA_API_SECRET}
mv web-ext-artifacts/*.xpi ../build/kiwix-firefox-signed-extension-$VERSION.xpi
