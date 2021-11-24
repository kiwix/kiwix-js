<# **
  This script is part of Kiwix. It checks that the list of offline files precached by the Service Worker is complete
  It is intended to be used primarily in CI testing, but can also be run from the commandline in open-source PS Core
  https://github.com/PowerShell/PowerShell/releases/
** #>

# Provide the path and name of the Service Worker file relative to the Repository root
$SWFile = 'service-worker.js'

# List below any files, relative to Repository root, that are not required by the offline precache
$ListOfExemptions = (
  'www/img/icons/kiwix-120.png',
  'www/img/icons/kiwix-128.png',
  'www/img/icons/kiwix-16.png',
  'www/img/icons/kiwix-19.png',
  'www/img/icons/kiwix-38.png',
  'www/img/icons/kiwix-48.png',
  'www/img/icons/kiwix-64.png',
  'www/img/icons/kiwix-90.png',
  'www/img/Kiwix_icon_transparent_600x600.png',
  'www/js/lib/webpHeroBundle_0.0.0-dev.27.js'
)

# Get the absolute root directory
$RepoRoot = $PSScriptRoot -replace '[\\/]scripts'

# List all files recursively in the /www directory, and process the FullName to remove the path up to 'www'
# and to replace any (back)slashes with forward slashes
$ListOfFSFiles = ls -r $RepoRoot/www/*.* | % { $_.FullName -replace '^.+?[\\/](?=www)', '' -replace '[\\/]', '/' }
# Select lines matching "www/.+" in service-worker.js and process the output to replace whitespace, quotation marks and commas 
$ListOfSWFiles = (sls '[''"]www/.+[''"]' $RepoRoot/service-worker.js) | % { $_.Line -replace '\s*[''"],?', '' }
# Flag to track any missing files
$MissingFiles = $false
Write-Output ""
# Iterate the list of files found in the FS and check if they are either listed in the Service Worker or in the list of exemptions
# NB The operator -ccontains is case-sensitive
$ListOfFSFiles | % {
  if (-Not ($ListOfSWFiles -ccontains $_ -or $ListOfExemptions -contains $_)) {
    Write-Warning "The file '$_' is not in the list of offline files"
    $MissingFiles = $true
  }
}
if ($MissingFiles) {
  Write-Host "`n** Please add the missing file(s) listed above to service-worker.js **`n" -ForegroundColor Red
  exit 1
} else {
  Write-Host "All non-exempt files in /www are listed in $SWFile`n" -ForegroundColor Green 
  exit 0
}
