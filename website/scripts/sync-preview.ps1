$ErrorActionPreference = 'Stop'
$source = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$destination = Join-Path $env:LOCALAPPDATA 'TamidZamin\website-preview'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
& robocopy $source $destination /E /XD node_modules dist .astro data test-results playwright-report /XF .env /NFL /NDL /NJH /NJS /NP
if ($LASTEXITCODE -gt 7) { throw "Preview copy failed with robocopy exit code $LASTEXITCODE" }
Write-Output "Source copied to $destination. Secrets and generated directories were not copied."
Write-Output "From that folder, run npm ci, npm run build, then npm start."
exit 0
