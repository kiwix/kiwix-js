#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
cd $BASEDIR
VERSION=$1

echo "Packaging unsigned Chrome extension, version $VERSION"
zip -r build/kiwix-chrome-unsigned-extension-$VERSION.zip www webextension manifest.json LICENSE-GPLv3.txt service-worker.js README.md
# Package the extension with Chromium
echo "Signing the extension for Chrome with a local Chromium, version $VERSION"
chromium-browser --no-sandbox --pack-extension=tmp --pack-extension-key=./scripts/kiwix-html5.pem
mv tmp.crx build/kiwix-chrome-signed-extension-$VERSION.crx
