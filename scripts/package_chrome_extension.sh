#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
cd "$BASEDIR"

# Reading arguments
while getopts m:tdv: option; do
    case "${option}" in
        m) MV=$OPTARG;; # Optionally indicates the manifest version we're using (2 or 3); if present, the version will be added to filename
        t) TAG="-t";; # Indicates that we're releasing a public version from a tag
        d) DRYRUN="-d";; # Indicates a dryrun test, that does not modify anything on the network
        v) VERSION=${OPTARG};;
    esac
done
if [ -n $MV ]; then
    echo -e "\nManifest version requested: $MV"
    VERSION="mv$MV-$VERSION"
fi
echo "Packaging unsigned Chrome extension, version $VERSION"
cd tmp
if [ $MV -eq 2 ]; then
    echo "Packing MV2 extension"
    pwd & ls -l
    cat manifest.json
    zip -r ../build/kiwix-chrome-unsigned-extension-$VERSION.zip www backgroundscript.js manifest.json LICENSE-GPLv3.txt service-worker.js README.md
else
    echo "Packing MV3 extension"
    pwd & ls -l
    cat manifest.json
    zip -r ../build/kiwix-chrome-unsigned-extension-$VERSION.zip www manifest.json LICENSE-GPLv3.txt service-worker.js README.md
fi
cd ..
if [ -z $TAG ]; then
    # Package the extension with Chrome or Chromium, if we're not packaging a public version
    if hash chromium-browser 2>/dev/null
    then
        echo "Chromium is available"
        CHROME_BIN=chromium-browser
    else
        echo "Chromium is not available: trying to use Chrome"
        CHROME_BIN=google-chrome-stable
    fi
    echo "Signing the extension for $CHROME_BIN, version $VERSION"
    $CHROME_BIN --no-sandbox --pack-extension=tmp --pack-extension-key=./scripts/kiwix-html5.pem
    mv tmp.crx build/kiwix-chrome-signed-extension-$VERSION.crx
    ls -l build/kiwix-chrome-signed-extension-$VERSION.crx
else
    echo "This unsigned extension must be manually uploaded to Google to be signed and distributed from their store"
fi
