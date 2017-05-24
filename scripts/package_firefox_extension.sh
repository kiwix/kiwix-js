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
