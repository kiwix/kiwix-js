#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"/..
cd $BASEDIR/tmp
git checkout gh-pages; git merge master; git push; git checkout master