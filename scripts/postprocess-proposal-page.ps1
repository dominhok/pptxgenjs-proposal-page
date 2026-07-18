[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$PptxPath,

    [string]$ScreenshotPath,

    [ValidateRange(9, 72)]
    [int]$MinFontSize = 10
)

$ErrorActionPreference = 'Stop'

function Resolve-OfficeCliPath {
    $command = Get-Command officecli -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $local = Join-Path $env:LOCALAPPDATA 'officecli\officecli.exe'
    if (Test-Path -LiteralPath $local) { return $local }
    throw 'officecli was not found on PATH or at %LOCALAPPDATA%\officecli\officecli.exe.'
}

$OfficeCli = Resolve-OfficeCliPath
$pptx = (Resolve-Path -LiteralPath $PptxPath).Path
if ([string]::IsNullOrWhiteSpace($ScreenshotPath)) {
    $ScreenshotPath = [System.IO.Path]::ChangeExtension($pptx, '.png')
}
$png = [System.IO.Path]::GetFullPath($ScreenshotPath)
$pngDir = Split-Path $png -Parent
if ($pngDir) { New-Item -ItemType Directory -Path $pngDir -Force | Out-Null }

function Invoke-OfficeCli {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & $OfficeCli @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
    if ($exitCode -ne 0) {
        throw "OfficeCLI failed: $($Arguments -join ' ')`n$($output -join "`n")"
    }
    return @($output)
}

function Invoke-OfficeCliJson {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    $output = Invoke-OfficeCli $Arguments
    $text = ($output | ForEach-Object { $_.ToString() }) -join "`n"
    try { return $text | ConvertFrom-Json }
    catch { throw "OfficeCLI did not return valid JSON.`n$text" }
}

function Get-QueryResults {
    param([string]$Selector)
    $json = Invoke-OfficeCliJson @('query', $pptx, $Selector, '--json')
    if ($null -eq $json.data.results) { return @() }
    return @($json.data.results)
}

Invoke-OfficeCli @('open', $pptx) | Out-Null
Invoke-OfficeCli @('save', $pptx) | Out-Null
Invoke-OfficeCli @('close', $pptx) | Out-Null

$root = Invoke-OfficeCli @('get', $pptx, '/', '--depth', '0')
$rootDump = $root -join "`n"
if ($rootDump -notmatch 'slideWidth=19\.05cm' -or $rootDump -notmatch 'slideHeight=(?:9905970emu|27\.516\d*cm)') {
    throw "Gate 0 failed: slide size is not 7.5 x 10.8333 in portrait.`n$rootDump"
}

$outline = Invoke-OfficeCli @('view', $pptx, 'outline')
if (($outline -join "`n") -notmatch '\|\s*1 slides\b') {
    throw "Gate 0 failed: output must contain exactly one slide.`n$($outline -join "`n")"
}

$validation = Invoke-OfficeCli @('validate', $pptx)
if (($validation -join "`n") -notmatch '(?i)no errors found') {
    throw "Gate 1 failed: OOXML validation error.`n$($validation -join "`n")"
}

$issues = Invoke-OfficeCli @('view', $pptx, 'issues')
if (($issues -join "`n") -match '\[(O|C|S)\d+\]') {
    throw "Gate 2 failed: OfficeCLI reported issues.`n$($issues -join "`n")"
}

$text = Invoke-OfficeCli @('view', $pptx, 'text')
$textDump = $text -join "`n"
if ($textDump -match '(?i)lorem|ipsum|xxxx|<TODO>|placeholder|OpenAI|LibreOffice|python-pptx') {
    throw "Gate 3 failed: banned token or placeholder found.`n$textDump"
}

$annotated = Invoke-OfficeCli @('view', $pptx, 'annotated')
$annotatedDump = $annotated -join "`n"
$textLines = @($annotated | Where-Object { $_.ToString() -match '\[(Text Box|Shape)\].*←' })
if ($textLines.Count -eq 0) { throw 'Gate 4 failed: no editable text shapes were detected.' }
foreach ($line in $textLines) {
    $s = $line.ToString()
    if ($s -notmatch 'Pretendard') {
        throw "Gate 4 failed: non-Pretendard text detected.`n$s"
    }
    if ($s -notmatch '(\d+(?:\.\d+)?)pt') {
        throw "Gate 4 failed: font size could not be determined.`n$s"
    }
    $sizeText = $Matches[1]
    if ($sizeText -match '\.') {
        throw "Gate 4 failed: decimal font size detected.`n$s"
    }
    if ([int]$sizeText -lt $MinFontSize) {
        throw "Gate 4 failed: text below ${MinFontSize}pt detected.`n$s"
    }
}

$shapeResults = Get-QueryResults 'shape'
$editableTextCount = 0
foreach ($shape in $shapeResults) {
    if (-not [string]::IsNullOrWhiteSpace([string]$shape.text)) {
        $editableTextCount++
        $shadowProperty = $shape.format.PSObject.Properties['shadow']
        if ($shadowProperty -and $shadowProperty.Value -and ([string]$shadowProperty.Value -notmatch '^(none|false|0)$')) {
            throw "Gate 5 failed: text-bearing shadow detected at $($shape.path)."
        }
    }
}
if ($editableTextCount -lt 10) {
    throw "Gate 5 failed: too few editable text shapes; possible rasterized infographic. Count=$editableTextCount"
}

foreach ($requiredName in @('TopRule', 'SectionCode', 'Title', 'Subtitle', 'Footer')) {
    Invoke-OfficeCli @('get', $pptx, "/slide[1]/shape[@name=$requiredName]") | Out-Null
}

Invoke-OfficeCli @('view', $pptx, 'screenshot', '--page', '1', '--render', 'auto', '-o', $png) | Out-Null

Write-Output 'Gate 0 PASS: page size and slide count'
Write-Output 'Gate 1 PASS: OOXML'
Write-Output 'Gate 2 PASS: OfficeCLI issues'
Write-Output 'Gate 3 PASS: text leak'
Write-Output "Gate 4 PASS: Pretendard and integer font sizes >= ${MinFontSize}pt"
Write-Output 'Gate 5 PASS: editable text, no text shadow, shared chrome'
Write-Output "Gate 6 READY: exact-file visual comparison required - $png"
