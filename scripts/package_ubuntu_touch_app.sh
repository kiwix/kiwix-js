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

# Build with Clickable using the pure builder
echo "Building with Clickable (pure builder for web apps)..."
clickable build

# Find the generated click file
CLICK_FILE=$(find "$BASEDIR/tmp" -name "*.click" -type f | head -1)

if [ -n "$CLICK_FILE" ]; then
    mv "$CLICK_FILE" "$BASEDIR/build/kiwix-ubuntu-touch-$VERSION.click"
    echo "Successfully created $BASEDIR/build/kiwix-ubuntu-touch-$VERSION.click"
else
    echo "Error: No .click file was generated"
    echo "Contents of tmp directory:"
    ls -la "$BASEDIR/tmp"
    exit 1
fi
