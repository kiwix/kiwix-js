#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
cd $BASEDIR/tmp
VERSION=$1
echo "Packaging unsigned Firefox OS application, version $VERSION"
zip -r ../build/kiwix-firefoxos-$VERSION.zip www manifest.webapp LICENSE-GPLv3.txt service-worker.js README.md
