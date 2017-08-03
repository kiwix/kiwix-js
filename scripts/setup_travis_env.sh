#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
# Decrypt the secret files
openssl aes-256-cbc -K $encrypted_3275b0f28807_key -iv $encrypted_3275b0f28807_iv -in "$BASEDIR/scripts/secret_files.tar.gz.enc" -out "$BASEDIR/scripts/secret_files.tar.gz" -d
tar xvzf "$BASEDIR/scripts/secret_files.tar.gz" --directory "$BASEDIR/scripts/"
# On Travis, we need to make Chromium believe it has a display else it fails signing the package
export DISPLAY=:99.0
sh -e /etc/init.d/xvfb start
