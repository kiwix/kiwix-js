#!/bin/bash

# This bash script compiles zstddec.js using emscripten docker image, according to the values set in 
# /emscripten/ztandard/compile.sh . Please be sure to review the commandline in compile.sh before running this script, to
# be sure it's doing what you want.
#
# Prerequisites:
#
#     * Ensure Docker is installed and its daemon is running
#     * If the current user is not in the docker group, you might need to run this script with sudo. See https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user

# Find the repo dir (it's the parent of the dir that contains this script)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

# Run the emscripten compilation through docker
docker run -v "$REPO_DIR":/project -w /project -u $(id -u):$(id -g) emscripten/emsdk:3.1.37 /bin/sh -c 'cd emscripten/zstandard/; sh ./compile.sh'
