param (
    [string]$machine_name = "",
    [string]$branch_name = "",
    [switch]$dryrun = $false
)

# DEV: To build the Docker container with a manual dispatch (for testing only), provide a machine_name (this could be 'dev')
# Ensure that your personal github token is in your local copy of the '/scripts' directory, saved as 'github_token'

# Provide parameters
$release_uri = 'https://api.github.com/repos/kiwix/kiwix-js/actions/workflows/publish-docker.yaml/dispatches'
$github_token = Get-Content -Raw "$PSScriptRoot/github_token"

$app_params = Get-Content -Raw "$PSScriptRoot\..\www\js\app.js"
$serviceworker = Get-Content -Raw "$PSScriptRoot\..\service-worker.js"
$suggested_build = ''
$init_tag = ''
if ($app_params -match 'params\[[''"]appVersion[''"]]\s*=\s*[''"]([^''"]+)') {
  $init_tag = $matches[1]
  $suggested_build = 'dev_' + $init_tag 
}
$sw_tag = ''
if ($serviceworker -match 'appVersion\s*=\s*[''"]([^''"]+)') {
  $sw_tag = $matches[1]
  if ($sw_tag -ne $init_tag) {
    "`n*** WARNING: The tag in init.js [$init_tag] does not match the tag in service-worker.js [$sw_tag]! ***"
    "Please correct before continuing.`n"
    exit
  }
}

if ($machine_name -eq "") {
  if (-Not $dryrun) {
    $dryrun_check = Read-Host "Is this a dry run? [Y/N]"
    $dryrun = -Not ( $dryrun_check -imatch 'n' )
    If ($dryrun) {
      "[DRYRUN]: Initiating dry run..."
    }
  }
  $machine_name = Read-Host "`nGive the tag name to use for the docker build, or Enter to accept suggested build name [$suggested_build]"
  if (-Not $machine_name) { $machine_name = $suggested_build }
}

if ($branch_name -eq "") {
  $suggested_branch = &{ git branch --show-current }
  $branch_name = Read-Host "Give the branch name to use of the docker build, or Enter to accept [$suggested_branch]"
  if (-Not $branch_name) { $branch_name = $suggested_branch }
}

"`nTag name set to: $machine_name"
"Branch name set to: $branch_name"

# Set up dispatch_params object - for API see https://docs.github.com/en/rest/reference/actions#create-a-workflow-dispatch-event
$dispatch_params = @{
    Uri = $release_uri
    Method = 'POST'
    Headers = @{
      'Authorization' = "token $github_token"
      'Accept' = 'application/vnd.github.v3+json'
    }
    Body = @{
      'ref' = $branch_name
      'inputs' = @{ 'version' = $machine_name }
    } | ConvertTo-Json
    ContentType = "application/json"
}

$dispatch_f = ($dispatch_params | Format-List | Out-String);
"`nDispatch parameters:`n$dispatch_f"
  
# Post to the release server
if (-Not $dryrun) { 
  $dispatch = Invoke-RestMethod @dispatch_params 
  "`nServer returned: $dispatch"
  "`nAn empty dispatch is normal, and indicates that the command was accepted.`n"
} else {
  "[DRYRUN]: Complete.`n"
}
