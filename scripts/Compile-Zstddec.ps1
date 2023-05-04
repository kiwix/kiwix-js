# This PowerShell script (principally for Windows 10/11) compiles zstddec.js using docker according to the values set in 
# /emscripten/ztandard/compile.sh . Please be sure to review the commandline in compile.sh before running this script, to
# be sure it's doing what you want. If you want to compile with a later version of emnsdk, specify it below after 'emsdk:'.
#
# Prerequisites:
#
#     * Ensure WSL 2 is enabled in Windows (WSL = Windows Subsystem for Linux) 
#     * Install docker desktop on Windows: choose the WSL 2 docker backend (not the legacy Hyper-V one)
#     * Open docker and ensure the docker daemon is running correctly (icon should be green)
#     * Ensure docker desktop is signed in to your dockerhub account (at least the first time you run this script)
#     * Run this script by opening a PowerShell terminal, cd to the kiwix-js repo and run './scripts/Compile-Zstddec.ps1'

$repo_dir = ($PSScriptRoot -replace '[\\/]scripts[\\/]*$', '')
docker container run -v $repo_dir\:/project -w /project emscripten/emsdk:3.1.37 /bin/sh -c 'cd emscripten/zstandard/; ./compile.sh'