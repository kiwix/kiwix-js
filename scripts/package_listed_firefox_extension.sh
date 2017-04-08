#!/bin/bash
# This script must be run manually on each release, with the version as first parameter
# It must be run after the create_all_packages.sh, so that the tmp directory has been populated
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
echo "BASEDIR is $BASEDIR"
cd $BASEDIR
VERSION=$1

echo "Replacing the Firefox 'unlisted' extension id by the 'listed' one to be accepted by Mozilla"
sed -i -e "s/kiwix-html5-unlisted@kiwix.org/kiwix-html5-listed@kiwix.org/" tmp/manifest.json

cd tmp
echo "Packaging unsigned 'listed' Firefox extension, version $VERSION"
zip -r ../build/kiwix-firefox-unsigned-listed-extension-$VERSION.xpi www webextension manifest.json LICENSE-GPLv3.txt service-worker.js README.md
cd ..

CURRENT_DATE=$(date +'%Y-%m-%d')
# Upload the files on download.kiwix.org
echo "Uploading the file on http://download.kiwix.org/nightly/$CURRENT_DATE/"
scp -r -p -i scripts/travisci_builder_id_key build/* nightlybot@download.kiwix.org:/var/www/download.kiwix.org/nightly/$CURRENT_DATE