param(
    [Parameter(Mandatory = $true)] [string]$DeckDir,
    [Parameter(Mandatory = $true)] [string]$OutputDir,
    [string]$OfficeCli = "$env:LOCALAPPDATA\OfficeCLI\officecli.exe",
    [double]$MinimumWidthPt = 80,
    [double]$MinimumHeightPt = 30,
    [double]$CropPaddingPt = 8
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function Convert-ToPoints {
    param([object]$Value)
    if ($null -eq $Value) { return $null }
    if ($Value -is [ValueType] -and $Value -isnot [bool]) { return [double]$Value }
    $text = [string]$Value
    if ($text -notmatch '^\s*(-?[0-9]+(?:\.[0-9]+)?)(pt|cm|in|px|emu)?\s*$') { return $null }
    $number = [double]$Matches[1]
    switch ($Matches[2]) {
        'cm'  { return $number * 72.0 / 2.54 }
        'in'  { return $number * 72.0 }
        'px'  { return $number * 0.75 }
        'emu' { return $number / 12700.0 }
        default { return $number }
    }
}

function Invoke-OfficeCliJson {
    param([string[]]$Arguments)
    $raw = (& $OfficeCli @Arguments 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "OfficeCLI failed: $($Arguments -join ' ')`n$raw" }
    $jsonStart = $raw.IndexOf('{')
    if ($jsonStart -lt 0) { throw "OfficeCLI returned no JSON: $raw" }
    return ($raw.Substring($jsonStart) | ConvertFrom-Json)
}

function Test-VisibleFill {
    param([object]$Format)
    $fill = [string]$Format.fill
    if ([string]::IsNullOrWhiteSpace($fill)) { return $false }
    if ($fill -match '^#[0-9A-Fa-f]{8}$' -and $fill.EndsWith('00')) { return $false }
    if ($null -ne $Format.opacity -and [double]$Format.opacity -le 0.02) { return $false }
    return $true
}

if (-not (Test-Path -LiteralPath $OfficeCli -PathType Leaf)) { throw "OfficeCLI not found: $OfficeCli" }
if (-not (Test-Path -LiteralPath $DeckDir -PathType Container)) { throw "Deck directory not found: $DeckDir" }

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
$renderDir = Join-Path $OutputDir '_full-slide-renders'
New-Item -ItemType Directory -Path $renderDir -Force | Out-Null
$manifest = [System.Collections.Generic.List[object]]::new()
$decks = Get-ChildItem -LiteralPath $DeckDir -Filter '*.pptx' -File | Sort-Object Name

foreach ($deck in $decks) {
    $stem = [IO.Path]::GetFileNameWithoutExtension($deck.Name)
    $deckOut = Join-Path $OutputDir $stem
    New-Item -ItemType Directory -Path $deckOut -Force | Out-Null
    $renderPath = Join-Path $renderDir ($stem + '.png')
    $null = Invoke-OfficeCliJson @('view', $deck.FullName, 'screenshot', '--page', '1', '--render', 'native', '--out', $renderPath, '--json')
    $shapes = (Invoke-OfficeCliJson @('query', $deck.FullName, 'shape', '--json')).data.results
    $slideFormat = (Invoke-OfficeCliJson @('get', $deck.FullName, '/', '--depth', '0', '--json')).data.results[0].format
    $slideWidthPt = Convert-ToPoints $slideFormat.slideWidth
    $slideHeightPt = Convert-ToPoints $slideFormat.slideHeight

    $source = [Drawing.Image]::FromFile($renderPath)
    try {
        $scaleX = $source.Width / $slideWidthPt
        $scaleY = $source.Height / $slideHeightPt
        $cropPaths = [System.Collections.Generic.List[string]]::new()
        $cropLabels = [System.Collections.Generic.List[string]]::new()

        foreach ($shape in $shapes) {
            $fmt = $shape.format
            $text = [string]$shape.text
            if ([string]::IsNullOrWhiteSpace($text) -or -not (Test-VisibleFill $fmt)) { continue }
            if ([string]$fmt.geometry -notin @('rect', 'roundRect')) { continue }
            $x = Convert-ToPoints $fmt.x; $y = Convert-ToPoints $fmt.y
            $w = Convert-ToPoints $fmt.width; $h = Convert-ToPoints $fmt.height
            if ($null -eq $x -or $null -eq $y -or $null -eq $w -or $null -eq $h) { continue }
            if ($w -lt $MinimumWidthPt -or $h -lt $MinimumHeightPt) { continue }
            if ($y -lt 100 -or $y -gt ($slideHeightPt - 30)) { continue }

            $left = [Math]::Max(0, [Math]::Floor(($x - $CropPaddingPt) * $scaleX))
            $top = [Math]::Max(0, [Math]::Floor(($y - $CropPaddingPt) * $scaleY))
            $right = [Math]::Min($source.Width, [Math]::Ceiling(($x + $w + $CropPaddingPt) * $scaleX))
            $bottom = [Math]::Min($source.Height, [Math]::Ceiling(($y + $h + $CropPaddingPt) * $scaleY))
            $cropWidth = [int]($right - $left); $cropHeight = [int]($bottom - $top)
            if ($cropWidth -le 0 -or $cropHeight -le 0) { continue }

            $id = [int]$fmt.id
            $cropPath = Join-Path $deckOut ("shape-{0}.png" -f $id)
            $crop = [Drawing.Bitmap]::new($cropWidth * 2, $cropHeight * 2)
            try {
                $graphics = [Drawing.Graphics]::FromImage($crop)
                try {
                    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graphics.DrawImage($source,
                        [Drawing.Rectangle]::new(0, 0, $crop.Width, $crop.Height),
                        [Drawing.Rectangle]::new([int]$left, [int]$top, $cropWidth, $cropHeight),
                        [Drawing.GraphicsUnit]::Pixel)
                } finally { $graphics.Dispose() }
                $crop.Save($cropPath, [Drawing.Imaging.ImageFormat]::Png)
            } finally { $crop.Dispose() }

            $preview = ($text -replace '\s+', ' ').Trim()
            if ($preview.Length -gt 70) { $preview = $preview.Substring(0, 70) + '...' }
            $cropPaths.Add($cropPath); $cropLabels.Add("shape $id | $preview")
            $manifest.Add([pscustomobject]@{
                File=$deck.Name; Path=[string]$shape.path; ShapeId=$id
                XPt=[Math]::Round($x,2); YPt=[Math]::Round($y,2)
                WidthPt=[Math]::Round($w,2); HeightPt=[Math]::Round($h,2)
                Crop=$cropPath; Status='PENDING'; Note=''
            })
        }

        if ($cropPaths.Count -gt 0) {
            $font = [Drawing.Font]::new('Arial', 11, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Point)
            try {
                $sheetWidth = 900; $labelHeight = 34; $gap = 18
                $heights = [System.Collections.Generic.List[int]]::new(); $sheetHeight = $gap
                foreach ($cropPath in $cropPaths) {
                    $img = [Drawing.Image]::FromFile($cropPath)
                    try {
                        $drawWidth = [Math]::Min($img.Width, $sheetWidth - 2 * $gap)
                        $drawHeight = [int][Math]::Ceiling($img.Height * $drawWidth / $img.Width)
                        $heights.Add($drawHeight); $sheetHeight += $labelHeight + $drawHeight + $gap
                    } finally { $img.Dispose() }
                }
                $sheet = [Drawing.Bitmap]::new($sheetWidth, $sheetHeight)
                try {
                    $graphics = [Drawing.Graphics]::FromImage($sheet)
                    try {
                        $graphics.Clear([Drawing.Color]::White)
                        $graphics.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
                        $yCursor = $gap
                        for ($i = 0; $i -lt $cropPaths.Count; $i++) {
                            $graphics.DrawString($cropLabels[$i], $font, [Drawing.Brushes]::Black, [single]$gap, [single]$yCursor)
                            $yCursor += $labelHeight
                            $img = [Drawing.Image]::FromFile($cropPaths[$i])
                            try {
                                $drawWidth = [Math]::Min($img.Width, $sheetWidth - 2 * $gap)
                                $drawHeight = $heights[$i]
                                $graphics.DrawImage($img, $gap, $yCursor, $drawWidth, $drawHeight)
                                $graphics.DrawRectangle([Drawing.Pens]::Gray, $gap, $yCursor, $drawWidth - 1, $drawHeight - 1)
                            } finally { $img.Dispose() }
                            $yCursor += $drawHeight + $gap
                        }
                    } finally { $graphics.Dispose() }
                    $sheet.Save((Join-Path $OutputDir ($stem + '-card-sheet.png')), [Drawing.Imaging.ImageFormat]::Png)
                } finally { $sheet.Dispose() }
            } finally { $font.Dispose() }
        }
    } finally { $source.Dispose() }
}

$manifestPath = Join-Path $OutputDir 'card-crop-manifest.csv'
$manifest | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding UTF8
Write-Output "Generated $($manifest.Count) card crops for $($decks.Count) decks."
Write-Output "Manifest: $manifestPath"
