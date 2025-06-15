#!/bin/bash
#
# to install:
#
# $ adb push kiwix-*.click /tmp
# $ adb shell
# $ pkcon install-local --allow-untrusted /tmp/kiwix-*.click

BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
cd "$BASEDIR/tmp"

# Reading arguments
while getopts tdv: option; do
    case "${option}" in
        t) TAG="-t";; # Indicates that we're releasing a public version from a tag
        d) DRYRUN="-d";; # Indicates a dryrun test, that does not modify anything on the network
        v) VERSION=${OPTARG};;
    esac
done

echo "Packaging .click application for Ubuntu Touch using Clickable, version $VERSION"

# Copy the clickable.yaml configuration file to the tmp directory
cp "$BASEDIR/ubuntu_touch/clickable.yaml" "$BASEDIR/tmp/"

# Show clickable version for debugging
echo "Clickable version:"
clickable --version

# Show the clickable.yaml we're using
echo "Using clickable.yaml:"
cat clickable.yaml

# Build with Clickable (using --yes to auto-accept any prompts)
echo "Building with Clickable..."
clickable build --yes

# Find the generated click file
CLICK_FILE=$(find "$BASEDIR/tmp" -name "*.click" -type f | head -1)

if [ -n "$CLICK_FILE" ]; then
    mv "$CLICK_FILE" "$BASEDIR/build/kiwix-ubuntu-touch-$VERSION.click"
    echo "Successfully created $BASEDIR/build/kiwix-ubuntu-touch-$VERSION.click"
else
    echo "Error: No .click file was generated"
    echo "Searching for click files in the build area:"
    find "$BASEDIR" -name "*.click" -type f 2>/dev/null
    echo "Contents of tmp directory:"
    ls -la "$BASEDIR/tmp"
    
    # Check if clickable generated files in a subdirectory
    echo "Looking for any clickable build output:"
    find "$BASEDIR/tmp" -type f -name "*.click" -o -name "*click*" 2>/dev/null
    
    exit 1
fi
