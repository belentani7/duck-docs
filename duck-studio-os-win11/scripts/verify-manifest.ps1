[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $root 'MANIFEST-SHA256.tsv'
$failures = [System.Collections.Generic.List[string]]::new()

if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    Write-Error 'manifest:missing'
    exit 1
}

$entries = @(Import-Csv -LiteralPath $manifestPath -Delimiter "`t")
$listed = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($entry in $entries) {
    $relative = [string]$entry.path
    [void]$listed.Add($relative)
    $target = Join-Path $root ($relative.Replace('/', '\'))
    if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
        $failures.Add("missing:$relative")
        continue
    }
    $file = Get-Item -LiteralPath $target
    if ($file.Length -ne [long]$entry.bytes) { $failures.Add("size:$relative") }
    $actualHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    if ($actualHash -ne $entry.sha256) { $failures.Add("hash:$relative") }
}

$actualFiles = @(Get-ChildItem -LiteralPath $root -Recurse -File -Force | Where-Object {
    $_.FullName -notmatch '\\github-clones\\' -and
    $_.FullName -notmatch '\\.git\\' -and
    $_.Name -ne 'MANIFEST-SHA256.tsv'
})

foreach ($file in $actualFiles) {
    $relative = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
    if (-not $listed.Contains($relative)) { $failures.Add("unlisted:$relative") }
}

if ($entries.Count -ne $actualFiles.Count) { $failures.Add("count:manifest=$($entries.Count):actual=$($actualFiles.Count)") }

if ($failures.Count -gt 0) {
    $failures | Sort-Object -Unique | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "DUCK_STUDIO_MANIFEST_PASS entries=$($entries.Count)"
