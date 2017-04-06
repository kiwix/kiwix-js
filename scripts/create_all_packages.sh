#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
echo "BASEDIR is $BASEDIR"
cd $BASEDIR

# Set the secret environment variables if available
# The file set_secret_environment_variables.sh should not be commited for security reasons
# It is only useful to run the scripts locally.
# Travis injects the same environment variables by itself
if [ -r "$BASEDIR/scripts/set_secret_environment_variables.sh" ]; then
  . "$BASEDIR/scripts/set_secret_environment_variables.sh"
fi

# Use the first argument as a version number, else use the Travis tag, else use the commit id
VERSION_TO_REPLACE="2\.0-beta"
VERSION_PREFIX="2.0.0"
if [ ! "$1zz" == "zz" ]; then
    VERSION=$1
    echo "Packaging version $VERSION because it has been passed as an argument"
else
    COMMIT_ID=$(git rev-parse --short HEAD)
    VERSION="${VERSION_PREFIX}commit-${COMMIT_ID}"
    echo "Packaging version $VERSION"
fi

# Copy only the necessary files in a temporary directory
mkdir -p tmp
rm -rf tmp/*
cp -r www webextension manifest.json manifest.webapp LICENSE-GPLv3.txt service-worker.js README.md tmp/

# Replace the version number everywhere
# But Chrome would only accept a numeric version number : if it's not, we only use the prefix in manifest.json
regexpNumericVersion='^[0-9\.]+$'
if [[ $VERSION =~ $regexpNumericVersion ]] ; then
   sed -i -e "s/$VERSION_TO_REPLACE/$VERSION/" tmp/manifest.json
else
   sed -i -e "s/$VERSION_TO_REPLACE/$VERSION_PREFIX/" tmp/manifest.json
fi
sed -i -e "s/$VERSION_TO_REPLACE/$VERSION/" tmp/manifest.webapp
sed -i -e "s/$VERSION_TO_REPLACE/$VERSION/" tmp/www/index.html

mkdir -p build
rm -rf build/*
# Package for Chromium/Chrome
scripts/package_chrome_extension.sh $VERSION
# Package for Firefox and Firefox OS
# We have to put the real version string inside the manifest.json (which Chrome might not have accepted)
# So we take the original manifest again, and replace the version inside it again
cp manifest.json tmp/
sed -i -e "s/$VERSION_TO_REPLACE/$VERSION/" tmp/manifest.json
scripts/package_firefox_extension.sh $VERSION
scripts/package_firefoxos_app.sh $VERSION

CURRENT_DATE=$(date +'%Y-%m-%d')
# Upload the files on download.kiwix.org
echo "Uploading the files on http://download.kiwix.org/nightly/$CURRENT_DATE/"
scp -r -p -i scripts/travisci_builder_id_key build/* nightlybot@download.kiwix.org:/var/www/download.kiwix.org/nightly/$CURRENT_DATE