[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string]$DraftDir,
    [Parameter(Mandatory = $true)] [string]$CandidateDir,
    [Parameter(Mandatory = $true)] [string]$ReportDir,
    [ValidateRange(10, 72)] [int]$MinFontSize = 10,
    [switch]$UseExistingCandidates
)

$ErrorActionPreference = 'Stop'

function Resolve-OfficeCliPath {
    $command = Get-Command officecli -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $local = Join-Path $env:LOCALAPPDATA 'OfficeCLI\officecli.exe'
    if (Test-Path -LiteralPath $local) { return $local }
    throw 'officecli was not found.'
}

$OfficeCli = Resolve-OfficeCliPath

function Resolve-PythonCommand {
    $python = Get-Command python.exe -ErrorAction SilentlyContinue
    if (-not $python) { $python = Get-Command python -ErrorAction SilentlyContinue }
    if ($python) { return [pscustomobject]@{ Path = $python.Source; Prefix = @() } }

    $launcher = Get-Command py.exe -ErrorAction SilentlyContinue
    if (-not $launcher) { $launcher = Get-Command py -ErrorAction SilentlyContinue }
    if ($launcher) { return [pscustomobject]@{ Path = $launcher.Source; Prefix = @('-3') } }

    throw 'Python 3.10 or later was not found as python.exe or the py launcher.'
}

$Python = Resolve-PythonCommand
$PythonPrefix = @($Python.Prefix)
$skillRoot = Split-Path $PSScriptRoot -Parent
$skillsRoot = Split-Path $skillRoot -Parent
$proofreaderRoot = Join-Path $skillsRoot 'pptx-visual-proofreader'
if (-not (Test-Path -LiteralPath (Join-Path $proofreaderRoot 'scripts\pptx_layout_lint.py') -PathType Leaf)) {
    $proofreaderRoot = Join-Path $skillRoot 'dependencies\pptx-visual-proofreader'
}
$linter = Join-Path $proofreaderRoot 'scripts\pptx_layout_lint.py'
$cropScript = Join-Path $proofreaderRoot 'scripts\render_card_crops.ps1'

foreach ($required in @($linter, $cropScript)) {
    if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
        throw "Required pptx-visual-proofreader resource was not found: $required"
    }
}
if (-not (Test-Path -LiteralPath $DraftDir -PathType Container)) {
    throw "Draft directory was not found: $DraftDir"
}

New-Item -ItemType Directory -Force -Path $CandidateDir, $ReportDir | Out-Null
if (-not $UseExistingCandidates) {
    foreach ($draft in Get-ChildItem -LiteralPath $DraftDir -Filter '*.pptx' -File) {
        Copy-Item -LiteralPath $draft.FullName -Destination (Join-Path $CandidateDir $draft.Name) -Force
    }
}

$candidates = @(Get-ChildItem -LiteralPath $CandidateDir -Filter '*.pptx' -File | Sort-Object Name)
if ($candidates.Count -eq 0) { throw "No candidate PPTX files were found: $CandidateDir" }

$rows = [System.Collections.Generic.List[object]]::new()
$failed = $false
foreach ($candidate in $candidates) {
    $stem = [IO.Path]::GetFileNameWithoutExtension($candidate.Name)
    $deckReport = Join-Path $ReportDir $stem
    $previewDir = Join-Path $deckReport 'preview'
    New-Item -ItemType Directory -Force -Path $deckReport, $previewDir | Out-Null

    $validation = (& $OfficeCli validate $candidate.FullName 2>&1 | Out-String)
    $issues = (& $OfficeCli view $candidate.FullName issues --json 2>&1 | Out-String)
    Set-Content -LiteralPath (Join-Path $deckReport 'officecli-validation.txt') -Value $validation -Encoding utf8
    Set-Content -LiteralPath (Join-Path $deckReport 'officecli-issues.json') -Value $issues -Encoding utf8

    $layoutReport = Join-Path $deckReport 'layout.json'
    & $Python.Path @PythonPrefix -X utf8 $linter $candidate.FullName `
        --min-font-pt $MinFontSize `
        --min-card-gap-pt 4 `
        --min-container-padding-pt 6 `
        --max-padding-imbalance-pt 3 `
        --output $layoutReport `
        --render-dir $previewDir | Out-Host
    $lintExit = $LASTEXITCODE

    $validationPass = $validation -match '(?i)no errors found'
    $issuesPass = $issues -notmatch '"severity"\s*:\s*"(error|warning)"' -and $issues -notmatch '\[(O|C|S)\d+\]'
    $lintPass = $lintExit -eq 0
    if (-not ($validationPass -and $issuesPass -and $lintPass)) { $failed = $true }

    $rows.Add([pscustomobject]@{
        File = $candidate.Name
        ValidationPass = $validationPass
        OfficeCliIssuesPass = $issuesPass
        LintPass = $lintPass
        LayoutReport = $layoutReport
    })
    & $OfficeCli close $candidate.FullName 2>$null | Out-Null
}

$cropDir = Join-Path $ReportDir 'card-crops'
& powershell -NoProfile -ExecutionPolicy Bypass -File $cropScript `
    -DeckDir $CandidateDir -OutputDir $cropDir -OfficeCli $OfficeCli `
    -MinimumWidthPt 45 -MinimumHeightPt 20
if ($LASTEXITCODE -ne 0) { throw 'Native card-crop rendering failed.' }

$summaryPath = Join-Path $ReportDir 'proofread-summary.json'
$rows | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $summaryPath -Encoding utf8

Write-Output "Proofread summary: $summaryPath"
Write-Output "Card crop manifest: $(Join-Path $cropDir 'card-crop-manifest.csv')"
if ($failed) {
    throw 'Proofreader mechanical gate failed. Correct the candidate files or regenerate the drafts, then rerun with -UseExistingCandidates.'
}
Write-Output 'Mechanical gate PASS. Directly review every native full-slide render and card crop, mark the manifest, and only then run final validation.'
