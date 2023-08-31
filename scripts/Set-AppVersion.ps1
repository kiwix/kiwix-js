# Updates the app version in all required places according to the custom value

[CmdletBinding()]
param (
    [string]$customversion = ''
)

if ($customversion) {
    "`nUser set custom input version: $customversion"
    $INPUT_VERSION = $customversion
} else {
    $init_params = Get-Content -Raw "$PSScriptRoot\..\www\js\init.js"
    $file_tag = ''
    if ($init_params -match 'params\[[''"]appVersion[''"]]\s*=\s*[''"]([^''"]+)') {
        $file_tag = 'v' + $matches[1] 
    }
    if ($file_tag) {
        "`nCurrent app version is: $file_tag"
        if ($file_tag -match '(^.*\.)([0-9]+)(.*$)') {
            if ($matches[2]) {
                $file_tag = $matches[1] + ($matches[2] / 1 + 1) + $matches[3]
            }
        }
    }
    $tag_name = Read-Host "`nEnter the tag name for this release, Enter to accept suggested tag [$file_tag]"
    if ($tag_name -eq "") { $tag_name = $file_tag }
    if ($tag_name -NotMatch '^v?\d+\.\d+\.\d+([+EN-]|$)') {
        "`nTag name must be in the format " + '"[v]0.0.0"!' + "`n"
        exit
    }
    $INPUT_VERSION = $tag_name
}

if ($INPUT_VERSION) {
    $VERSION = $INPUT_VERSION
} elseif ($TAG_VERSION) {
    $VERSION = $TAG_VERSION
}

if ($VERSION -match '^v?[\d.]') {
    $VERSION = $VERSION -replace '^v', ''
    "`nSetting App Version to $VERSION in service-worker.js and init.js ..."
    (Get-Content ./service-worker.js) -replace '(appVersion\s*=\s*["''])[^"'']+', "`${1}$VERSION" | Set-Content ./service-worker.js
    (Get-Content ./www/js/init.js) -replace '(appVersion..\s*=\s*["''])[^"'']+', "`${1}$VERSION" | Set-Content ./www/js/init.js
    $FileList = './manifest.json', 'manifest.v2.json', './manifest.webapp', './ubuntu_touch/manifest.json'
    ForEach ($File in $FileList) {
        $FileContent = Get-Content -Raw $File
        "Setting App Version to $VERSION in $File ..."
        $FileContent = $FileContent -replace '("version"\s*:\s*")[^"]*', "`${1}$VERSION"
        # Remove extra whitespace
        $FileContent = $FileContent -replace '\s+$', ''
        # DEV: don't set BOM, as Linux tools crash with it
        Set-Content $File $FileContent
    }
    "`nDone. Please check the updated files.`n"
} else {
    "No valid INPUT_VERSION or TAG_VERSION were provided. File version numbers were unchanged.`n"
}