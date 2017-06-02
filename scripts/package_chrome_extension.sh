#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
cd $BASEDIR

# Reading arguments
while getopts tdv: option; do
    case "${option}" in
        t) TAG="-t";; # Indicates that we're releasing a public version from a tag
        d) DRYRUN="-d";; # Indicates a dryrun test, that does not modify anything on the network
        v) VERSION=${OPTARG};;
    esac
done

echo "Packaging unsigned Chrome extension, version $VERSION"
cd tmp
zip -r ../build/kiwix-chrome-unsigned-extension-$VERSION.zip www webextension manifest.json LICENSE-GPLv3.txt service-worker.js README.md
cd ..
if [ "${TAG}zz" == "zz" ]; then
    # Package the extension with Chromium, if we're not packaging a public version
    echo "Signing the extension for Chrome with a local Chromium, version $VERSION"
    chromium-browser --no-sandbox --pack-extension=tmp --pack-extension-key=./scripts/kiwix-html5.pem
    mv tmp.crx build/kiwix-chrome-signed-extension-$VERSION.crx
else
    echo "This unsigned extension must be manually uploaded to Google to be signed and distributed from their store"
fi
