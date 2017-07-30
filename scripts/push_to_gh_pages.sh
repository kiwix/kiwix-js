#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
cd "$BASEDIR"
git checkout gh-pages && git merge master && git push origin gh-pages && git checkout master
