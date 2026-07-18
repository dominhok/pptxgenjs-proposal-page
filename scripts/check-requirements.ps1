[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$checks = [System.Collections.Generic.List[object]]::new()
$failed = $false

function Add-Check {
    param([string]$Dependency, [bool]$Pass, [string]$Detected, [string]$Requirement)
    $script:checks.Add([pscustomobject]@{
        Dependency = $Dependency
        Pass = $Pass
        Detected = $Detected
        Requirement = $Requirement
    })
    if (-not $Pass) { $script:failed = $true }
}

function Get-CommandPath {
    param([string[]]$Names)
    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command) { return $command.Source }
    }
    return $null
}

$psPass = $PSVersionTable.PSVersion -ge [version]'5.1'
Add-Check 'PowerShell' $psPass $PSVersionTable.PSVersion.ToString() '5.1+'

$node = Get-CommandPath @('node.exe', 'node')
$nodeVersion = if ($node) { (& $node --version).TrimStart('v') } else { '' }
$nodePass = $node -and ([version]$nodeVersion -ge [version]'18.0.0')
Add-Check 'Node.js' ([bool]$nodePass) $(if ($node) { "$nodeVersion | $node" } else { 'not found' }) '18+'

$npm = Get-CommandPath @('npm.cmd', 'npm')
$npmVersion = if ($npm) { (& $npm --version).Trim() } else { '' }
Add-Check 'npm' ([bool]$npm) $(if ($npm) { "$npmVersion | $npm" } else { 'not found' }) 'available'

$python = Get-CommandPath @('python.exe', 'python')
$pythonPrefix = @()
if (-not $python) {
    $python = Get-CommandPath @('py.exe', 'py')
    if ($python) { $pythonPrefix = @('-3') }
}
$pythonVersion = if ($python) { (& $python @pythonPrefix -c 'import platform; print(platform.python_version())').Trim() } else { '' }
$pythonPass = $python -and ([version]$pythonVersion -ge [version]'3.10.0')
Add-Check 'Python' ([bool]$pythonPass) $(if ($python) { "$pythonVersion | $python" } else { 'not found' }) '3.10+'

$officeCli = Get-CommandPath @('officecli.exe', 'officecli')
if (-not $officeCli) {
    $localOfficeCli = Join-Path $env:LOCALAPPDATA 'OfficeCLI\officecli.exe'
    if (Test-Path -LiteralPath $localOfficeCli -PathType Leaf) { $officeCli = $localOfficeCli }
}
$officeCliVersion = if ($officeCli) { ((& $officeCli --version 2>&1) -join ' ').Trim() } else { 'not found' }
Add-Check 'OfficeCLI' ([bool]$officeCli) $(if ($officeCli) { "$officeCliVersion | $officeCli" } else { 'not found' }) 'installed'

$fontKeys = @(
    'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts',
    'HKCU:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts'
)
$pretendard = $false
foreach ($fontKey in $fontKeys) {
    if (-not (Test-Path -LiteralPath $fontKey)) { continue }
    $fontProperties = (Get-ItemProperty -LiteralPath $fontKey).PSObject.Properties
    if ($fontProperties.Name -match '^Pretendard') { $pretendard = $true; break }
}
if (-not $pretendard) {
    $fontFolders = @(
        'C:\Windows\Fonts',
        (Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Fonts')
    )
    foreach ($fontFolder in $fontFolders) {
        if (Test-Path -LiteralPath $fontFolder -PathType Container) {
            $match = Get-ChildItem -LiteralPath $fontFolder -Filter '*Pretendard*' -File -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($match) { $pretendard = $true; break }
        }
    }
}
Add-Check 'Pretendard' $pretendard $(if ($pretendard) { 'installed' } else { 'not found in Windows font registry' }) 'installed'

$powerPointCandidates = @(
    (Join-Path $env:ProgramFiles 'Microsoft Office\root\Office16\POWERPNT.EXE'),
    (Join-Path ${env:ProgramFiles(x86)} 'Microsoft Office\root\Office16\POWERPNT.EXE')
) | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) }
$powerPoint = $powerPointCandidates | Select-Object -First 1
Add-Check 'Microsoft PowerPoint' ([bool]$powerPoint) $(if ($powerPoint) { $powerPoint } else { 'not found' }) '2021+ native renderer'

try {
    Add-Type -AssemblyName System.Drawing
    Add-Check 'System.Drawing' $true 'available' 'required for panel crops'
} catch {
    Add-Check 'System.Drawing' $false $_.Exception.Message 'required for panel crops'
}

$skillRoot = Split-Path $PSScriptRoot -Parent
$skillsRoot = Split-Path $skillRoot -Parent
$proofreaderRoot = Join-Path $skillsRoot 'pptx-visual-proofreader'
if (-not (Test-Path -LiteralPath (Join-Path $proofreaderRoot 'scripts\pptx_layout_lint.py') -PathType Leaf)) {
    $proofreaderRoot = $skillsRoot
}
$requiredFiles = @(
    (Join-Path $skillRoot 'assets\pptxgenjs-kit\package.json'),
    (Join-Path $skillRoot 'assets\pptxgenjs-kit\package-lock.json'),
    (Join-Path $proofreaderRoot 'scripts\pptx_layout_lint.py'),
    (Join-Path $proofreaderRoot 'scripts\render_card_crops.ps1')
)
$missingFiles = @($requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) })
Add-Check 'Skill resources' ($missingFiles.Count -eq 0) $(if ($missingFiles.Count) { $missingFiles -join '; ' } else { 'complete' }) 'all required files present'

$checks | Format-Table -AutoSize
if ($failed) { throw 'Runtime requirement check failed. Resolve the failed dependencies before building.' }
Write-Output 'Runtime requirement check PASS.'
