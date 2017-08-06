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

echo "Packaging .click application for Ubuntu Touch, version $VERSION"

# We need to remove the *.woff* files because click considers they are forbidden binaries
rm -f "$BASEDIR/tmp/www/fonts"/*.woff*
# We need to remove these files because the --ignore option of click is not supported in the version of Trusty
rm -rf "$BASEDIR/tmp/webextension"
rm -f "$BASEDIR/tmp/manifest.webapp"
click build "$BASEDIR/tmp"
mv kiwix*.click $BASEDIR/build/kiwix-ubuntu-touch-$VERSION.click
