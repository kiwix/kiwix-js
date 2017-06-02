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

# Install web-ext if it's not already installed (and if we're not doing a dryrun test)
if [ ! -f node_modules/web-ext/bin/web-ext ] && [ "${DRYRUN}zz" == "zz" ]; then
    npm install web-ext
fi

cd tmp
if [ "${TAG}zz" == "zz" ]; then
    echo "Packaging unsigned Firefox extension, version $VERSION"
    zip -r ../build/kiwix-firefox-unsigned-extension-$VERSION.zip www webextension manifest.json LICENSE-GPLv3.txt service-worker.js README.md

    if [ "${DRYRUN}zz" == "zz" ]; then
        # Sign the extension with the Mozilla API through web-ext, if we're not packaging a public version
        echo "Signing the extension for Firefox with Mozilla API, version $VERSION"
        ../node_modules/web-ext/bin/web-ext sign --api-key=${MOZILLA_API_KEY} --api-secret=${MOZILLA_API_SECRET}
    else
        echo "Skipping signing the extension with the Mozilla API, because it's a dryrun test"
    fi

    # Check if the extension has been signed by Mozilla.
    # The reason signing usually fails is because the same version has already been signed by Mozilla.
    # So we try to find the signed extension of the same commit id in a previous nightly build
    FILECOUNT=$(find web-ext-artifacts -name '*.xpi' | wc -l)
    if [ $FILECOUNT -ge 1 ]; then
            echo "Extension properly signed by Mozilla"
            mv web-ext-artifacts/*.xpi ../build/kiwix-firefox-signed-extension-$VERSION.xpi
    else
            echo "Extension not signed by Mozilla. It might be because this commit id has already been signed : let's look for it in a previous nightly build"
            FOUND=0
            for FILE in $(ssh -i ../scripts/travisci_builder_id_key nightlybot@download.kiwix.org "find /var/www/download.kiwix.org/nightly -name \"kiwix-firefox-signed-extension-$VERSION.xpi\""); do
    		echo "Signed extension found on the server in $FILE : copying it locally"
                    scp -i ../scripts/travisci_builder_id_key nightlybot@download.kiwix.org:$FILE ../build/
                    FOUND=1
                    # We only need the first matching file
                    break
            done
            if [ $FOUND -ne 1 ]; then
    		echo "Signed extension not found in a previous build"
            fi
    fi
else
    # When packaging a public version, we need to prepare a 'listed' extension package to submit to Mozilla
    echo "Replacing the Firefox 'unlisted' extension id by the 'listed' one to be accepted by Mozilla"
    sed -i -e "s/kiwix-html5-unlisted@kiwix.org/kiwix-html5-listed@kiwix.org/" manifest.json

    echo "Packaging unsigned 'listed' Firefox extension, version $VERSION"
    zip -r ../build/kiwix-firefox-unsigned-listed-extension-$VERSION.zip www webextension manifest.json LICENSE-GPLv3.txt service-worker.js README.md
    echo "This unsigned extension must be manually uploaded to Mozilla to be signed and distributed from their store"
fi
