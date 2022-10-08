#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
echo "BASEDIR is $BASEDIR"
cd "$BASEDIR"

# Reading arguments
while getopts tdv: option; do
    case "${option}" in
        t) TAG="-t";; # Indicates that we're releasing a public version from a tag
        d) DRYRUN="-d";; # Indicates a dryrun test, that does not modify anything on the network
        v) VERSION=${OPTARG};; # Gives the version string to use (else it will use the commit id)
    esac
done

MAJOR_NUMERIC_VERSION="3.6"
VERSION_TO_REPLACE="3\.6-WIP"

# Set the secret environment variables if available
# The file set_secret_environment_variables.sh should not be commited for security reasons
# It is only useful to run the scripts locally.
# Travis injects the same environment variables by itself
if [ -r "$BASEDIR/scripts/set_secret_environment_variables.sh" ]; then
  . "$BASEDIR/scripts/set_secret_environment_variables.sh"
fi

# Use the passed version number, else use the commit id
if [ ! "${VERSION}zz" == "zz" ]; then
    echo "Packaging version $VERSION because it has been passed as an argument"
    VERSION_FOR_MOZILLA_MANIFEST="$VERSION"
    if [ ! "${TAG}zz" == "zz" ]; then
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
cp -r www webextension manifest.json manifest.webapp LICENSE-GPLv3.txt service-worker.js README.md tmp/

# Replace the version number everywhere
# But Chrome would only accept a numeric version number : if it's not, we only use the prefix in manifest.json
regexpNumericVersion='^[0-9\.]+$'
if [[ $VERSION =~ $regexpNumericVersion ]] ; then
   sed -i -e "s/$VERSION_TO_REPLACE/$VERSION/" tmp/manifest.json
else
   sed -i -e "s/$VERSION_TO_REPLACE/$MAJOR_NUMERIC_VERSION/" tmp/manifest.json
fi
sed -i -e "s/$VERSION_TO_REPLACE/$VERSION/" tmp/manifest.webapp
sed -i -e "s/$VERSION_TO_REPLACE/$VERSION/" tmp/service-worker.js
sed -i -e "s/$VERSION_TO_REPLACE/$VERSION/" tmp/www/js/app.js

mkdir -p build
rm -rf build/*
# Package for Chromium/Chrome
scripts/package_chrome_extension.sh $DRYRUN $TAG -v $VERSION
# Package for Firefox and Firefox OS
# We have to put a unique version string inside the manifest.json (which Chrome might not have accepted)
# So we take the original manifest again, and replace the version inside it again
cp manifest.json tmp/
sed -i -e "s/$VERSION_TO_REPLACE/$VERSION_FOR_MOZILLA_MANIFEST/" tmp/manifest.json
scripts/package_firefox_extension.sh $DRYRUN $TAG -v $VERSION
scripts/package_firefoxos_app.sh $DRYRUN $TAG -v $VERSION
cp -f ubuntu_touch/* tmp/
sed -i -e "s/$VERSION_TO_REPLACE/$VERSION/" tmp/manifest.json
scripts/package_ubuntu_touch_app.sh $DRYRUN $TAG -v $VERSION

if [ "${DRYRUN}zz" == "zz" ]; then
    # Change permissions on source files to match those expected by the server
    chmod 644 build/*
    CURRENT_DATE=$(date +'%Y-%m-%d')
    if [ -n "${CRON_LAUNCHED}" ]; then
        # It's a nightly build, so rename files to include the date and remove extraneous info so that permalinks can be generated
        for file in build/*; do
            target=$(sed -E "s/-[0-9.]+commit[^.]+/_$CURRENT_DATE/" <<<"$file")
            mv "$file" "$target"
        done
    fi
    # Upload the files on master.download.kiwix.org
    echo "Uploading the files on https://download.kiwix.org/nightly/$CURRENT_DATE/"
    echo "mkdir /data/download/nightly/$CURRENT_DATE" | sftp -P 30022 -o StrictHostKeyChecking=no -i ./scripts/ssh_key ci@master.download.kiwix.org
    scp -P 30022 -r -p -o StrictHostKeyChecking=no -i ./scripts/ssh_key build/* ci@master.download.kiwix.org:/data/download/nightly/$CURRENT_DATE
else
    echo "Skipping uploading the files, because it's a dryrun test"
fi
