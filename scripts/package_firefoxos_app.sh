#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
cd $BASEDIR/tmp

# Reading arguments
while getopts tdv: option; do
    case "${option}" in
        t) TAG="-t";; # Indicates that we're releasing a public version from a tag
        d) DRYRUN="-d";; # Indicates a dryrun test, that does not modify anything on the network
        v) VERSION=${OPTARG};;
    esac
done

echo "Packaging unsigned Firefox OS application, version $VERSION"
zip -r ../build/kiwix-firefoxos-$VERSION.zip www manifest.webapp LICENSE-GPLv3.txt service-worker.js README.md

# NB : The Firefox Marketplace (that distributes signed Firefox OS applications) does not allow new submissions any more
