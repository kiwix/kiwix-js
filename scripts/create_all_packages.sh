#!/bin/bash

# DEV: If running this script manually, you probably want to build the app first (npm run build), copy the
# scripts/ into dist/scripts, and cd to the dist directory before running this script from dist/scripts.

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
echo -e "\nBASEDIR is $BASEDIR"
cd "$BASEDIR"

# Reading arguments
while getopts tcdv: option; do
    case "${option}" in
        t) TAG="-t";; # Indicates that we're releasing a public version from a tag
        c) CRON_LAUNCHED="-c";; # Simulates a CRON_LAUNCHED run
        d) DRYRUN="-d";; # Indicates a dryrun test, that does not modify anything on the network
        v) VERSION=${OPTARG};; # Gives the version string to use like -v 0.0 (else it will use the commit id)
    esac
done

VERSION_TO_REPLACE="$(grep '"version":' manifest.json | sed -E "s/[^[:digit:]]+([^\"']+).*/\1/")"
MAJOR_NUMERIC_VERSION=$(sed 's/-WIP//' <<<"$VERSION_TO_REPLACE")

if [ -n $DRYRUN ]; then
    echo "Executing script as DRYRUN"
fi
echo "Version passed to script: $VERSION"
echo "Major Numeric Version: $MAJOR_NUMERIC_VERSION"
echo -e "Version to replace: $VERSION_TO_REPLACE\n"

# Set the secret environment variables if available
# The file set_secret_environment_variables.sh should not be commited for security reasons
# It is only useful to run the scripts locally.
# Github injects the same environment variables by itself
if [ -r "$BASEDIR/scripts/set_secret_environment_variables.sh" ]; then
  . "$BASEDIR/scripts/set_secret_environment_variables.sh"
fi

# Use the passed version number, else use the commit id
if [ -n "${VERSION}" ]; then
    echo "Packaging version $VERSION because it has been passed as an argument"
    VERSION_FOR_MOZILLA_MANIFEST="$VERSION"
    if [ -n "${TAG}" ]; then
        echo "This version is a tag : we're releasing a public version"
    fi
else
    COMMIT_ID=$(git rev-parse --short HEAD)
    VERSION="${MAJOR_NUMERIC_VERSION}commit-${COMMIT_ID}"
    # Mozilla needs a unique version string for each version it signs
    # and we have to comply with their version string : https://developer.mozilla.org/en-US/docs/Mozilla/Toolkit_version_format
    # So we need to replace every number of the commit id by another string (with 32 cars max)
    # We are allowed only a few special caracters : +*.-_ so we prefered to use capital letters
    # (hoping this string is case-sensitive)
    COMMIT_ID_FOR_MOZILLA_MANIFEST=$(echo $COMMIT_ID | tr '[0123456789]' '[ABCDEFGHIJ]')
    VERSION_FOR_MOZILLA_MANIFEST="${MAJOR_NUMERIC_VERSION}commit${COMMIT_ID_FOR_MOZILLA_MANIFEST}"
    echo "Packaging version $VERSION"
    echo "Version string for Mozilla extension signing : $VERSION_FOR_MOZILLA_MANIFEST"
fi

# Copy only the necessary files in a temporary directory
mkdir -p tmp
rm -rf tmp/*
cp -r www i18n _locales manifest.json manifest.webapp LICENSE-GPLv3.txt service-worker.js README.md tmp/
# Remove unwanted files (this line should not be necessary if building from dist/)
rm -f tmp/www/js/lib/libzim-*dev.*

# Replace the version number everywhere (but NOT in manifest.json yet - we'll do that after copying Ubuntu Touch files)
# But Chrome would only accept a numeric version number : if it's not, we only use the prefix in manifest.json
regexpNumericVersion='^[0-9\.]+$'
sed -i -E "s/$VERSION_TO_REPLACE/$MAJOR_NUMERIC_VERSION/" tmp/manifest.json
sed -i -E "s/$VERSION_TO_REPLACE/$VERSION/" tmp/manifest.webapp
sed -i -E "s/$VERSION_TO_REPLACE/$VERSION/" tmp/service-worker.js
sed -i -E "s/$VERSION_TO_REPLACE/$VERSION/" tmp/www/js/init.js
sed -i -E "s/(appVersion.*?)$VERSION_TO_REPLACE/\1$VERSION/" tmp/www/js/bundle.js
sed -i -E "s/(appVersion=.)$VERSION_TO_REPLACE/\1$VERSION/" tmp/www/js/bundle.min.js

mkdir -p build
rm -rf build/*
# Package for Chromium/Chrome with Manifest V3
scripts/package_chrome_extension.sh -m 3 $DRYRUN $TAG -v $VERSION
# Package for Chromium/Chrome with Manifest V2
cp backgroundscript.js tmp/
cp manifest.v2.json tmp/manifest.json
sed -i -E "s/$VERSION_TO_REPLACE/$MAJOR_NUMERIC_VERSION/" tmp/manifest.json
scripts/package_chrome_extension.sh -m 2 $DRYRUN $TAG -v $VERSION
echo "The following extensions have been built so far:"
pwd & ls -l build

# Package for Firefox MV2
# We have to put a unique version string inside the manifest.json (which Chrome might not have accepted)
# So we take the original manifest v2 again, and replace the version inside it again
cp manifest.v2.json tmp/manifest.json
sed -i -E "s/$VERSION_TO_REPLACE/$VERSION_FOR_MOZILLA_MANIFEST/" tmp/manifest.json
echo "Manifest version for Firefox MV2 extension:"
cat tmp/manifest.json
echo -e "\nPacking for Firefox MV2..."
scripts/package_firefox_extension.sh -m 2 $DRYRUN $TAG -v $VERSION

# Package for Firefox MV3
cp manifest.fx.v3.json tmp/manifest.json
# Replace the browserAction key which is no longer supported in MV3
sed -i -E "s/browserAction/action/" tmp/backgroundscript.js
# Note that MV3 requires a numeric version number
sed -i -E "s/$VERSION_TO_REPLACE/$MAJOR_NUMERIC_VERSION/" tmp/manifest.json
echo "Manifest version for Firefox MV3 extension:"
cat tmp/manifest.json
echo -e "\nPacking for Firefox MV3..."
scripts/package_firefox_extension.sh -m 3 $DRYRUN $TAG -v $VERSION
echo "The following extensions have been built so far:"
pwd & ls -l build

# Package for Firefox OS
echo -e "\nPacking for Firefox OS..."
scripts/package_firefoxos_app.sh $DRYRUN $TAG -v $VERSION

# Copy Ubuntu Touch files and fix the manifest version
echo -e "\nPreparing Ubuntu Touch package..."
cp -f ubuntu_touch/* tmp/
# Replace version in the Ubuntu Touch manifest.json (which now has the correct framework)
sed -i -E "s/$VERSION_TO_REPLACE/$VERSION/" tmp/manifest.json
echo "Ubuntu Touch manifest.json after version replacement:"
cat tmp/manifest.json
echo ""
scripts/package_ubuntu_touch_app.sh $DRYRUN $TAG -v $VERSION
echo -e "\nThe following apps have been built:"
pwd & ls -l build

# Change permissions on source files to match those expected by the server
chmod 644 build/*
CURRENT_DATE=$(date +'%Y-%m-%d')
if [ -n "${CRON_LAUNCHED}" ]; then
    # It's a nightly build, so rename files to include the date and remove extraneous info so that permalinks can be generated
    echo -e "\nChanging filenames because it is a nightly build..."
    for file in build/*; do
        target=$(sed -E "s/-[0-9.]+commit[^.]+/_$CURRENT_DATE/" <<<"$file")
        mv "$file" "$target"
    done
fi
# If it's not a dryrun, then upload the files to the server
if [ -z "${DRYRUN}" ]; then
    # Upload the files on master.download.kiwix.org
    echo -e "\nUploading the files to https://download.kiwix.org/nightly/$CURRENT_DATE/"
    echo "mkdir /data/download/nightly/$CURRENT_DATE" | sftp -P 30022 -o StrictHostKeyChecking=no -i ./scripts/ssh_key ci@master.download.kiwix.org
    scp -P 30022 -r -p -o StrictHostKeyChecking=no -i ./scripts/ssh_key build/* ci@master.download.kiwix.org:/data/download/nightly/$CURRENT_DATE
else
    echo -e "\n[DRYRUN] Would have uploaded these files to https://download.kiwix.org/nightly/$CURRENT_DATE/ :\n"
    ls -l build/*
fi
# If we're dealing with a release, then we should also upload some files to the release directory
if [ -n "$TAG" ]; then
    if [ -z "${DRYRUN}" ]; then
        echo -e "\nUploading the files to https://download.kiwix.org/release/"
        scp -P 30022 -r -p -o StrictHostKeyChecking=no -i ./scripts/ssh_key build/kiwix-firefoxos* ci@master.download.kiwix.org:/data/download/release/firefox-os
        scp -P 30022 -r -p -o StrictHostKeyChecking=no -i ./scripts/ssh_key build/kiwix-ubuntu-touch* ci@master.download.kiwix.org:/data/download/release/ubuntu-touch
        scp -P 30022 -r -p -o StrictHostKeyChecking=no -i ./scripts/ssh_key build/kiwix-chrome-signed*mv2*.zip ci@master.download.kiwix.org:/data/download/release/browsers/chrome/kiwix-chrome-mv2_$VERSION.zip
        scp -P 30022 -r -p -o StrictHostKeyChecking=no -i ./scripts/ssh_key build/kiwix-chrome-signed*mv2*.zip ci@master.download.kiwix.org:/data/download/release/browsers/edge/kiwix-edge-mv2_$VERSION.zip
    else
        echo -e "\n[DRRUN] Would have uploaded these files to https://download.kiwix.org/release/ :\n"
        ls -l build/kiwix-firefoxos*
        ls -l build/kiwix-ubuntu-touch*
        ls -l build/kiwix-chrome*mv2*.zip
    fi
    echo -e "\n\e[0;32m*** DEV: Please note that Firefox and Chrome signed extension packages will need to be copied manually to the ***"
    echo -e "\e[0;32m*** release directory once they have been signed by the respective app stores. Unsigned versions in nightly.  ***\n\e[0m"
fi
