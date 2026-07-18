[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$WorkDir,

    [switch]$Force,

    [switch]$InstallDependencies
)

$ErrorActionPreference = 'Stop'
$kit = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets\pptxgenjs-kit'
$target = [System.IO.Path]::GetFullPath($WorkDir)

if ((Test-Path -LiteralPath $target) -and -not $Force) {
    throw "WorkDir already exists. Use -Force to refresh the kit: $target"
}

New-Item -ItemType Directory -Path $target -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $kit 'package.json') -Destination $target -Force
Copy-Item -LiteralPath (Join-Path $kit 'package-lock.json') -Destination $target -Force
Copy-Item -LiteralPath (Join-Path $kit 'proposal-kit.mjs') -Destination $target -Force
Copy-Item -LiteralPath (Join-Path $kit 'page-template.mjs') -Destination $target -Force
Copy-Item -LiteralPath (Join-Path $kit 'repair-pptxgenjs-ooxml.mjs') -Destination $target -Force

if ($InstallDependencies) {
    $npm = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
    if (-not $npm) { $npm = (Get-Command npm -ErrorAction SilentlyContinue).Source }
    if (-not $npm) { throw 'npm was not found.' }
    & $npm ci --no-audit --no-fund --prefix $target
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
}

Write-Output $target
