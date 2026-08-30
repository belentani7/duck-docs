[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { $failures.Add($Message) }
}

$required = @(
    'README.md',
    'AGENTS.md',
    'PROMPT-MESTRE-DUCK-STUDIO.md',
    'ARQUITETURA-WIN11-FL-STUDIO.md',
    'MODELO-LOCAL-E-BASE-OFFLINE.md',
    'MAPA-CONHECIMENTO-PRODUTOR-PTBR.md',
    'RECURSOS-AUDIO-PLUGINS.md',
    'CATALOGO-PREMIUM-BENCHMARK.md',
    'CATALOGO-RECURSOS.json',
    'BASE-CONHECIMENTO-PTBR.json',
    'REFERENCIAS-LOCAIS.tsv',
    'GITHUB-CLONES-MANIFEST.tsv',
    'CHECKLIST-ACEITACAO.md',
    'PC-ALVO.md'
)

foreach ($relative in $required) {
    Assert-True (Test-Path -LiteralPath (Join-Path $root $relative) -PathType Leaf) "missing:$relative"
}

$catalog = Get-Content -LiteralPath (Join-Path $root 'CATALOGO-RECURSOS.json') -Raw | ConvertFrom-Json
$knowledge = Get-Content -LiteralPath (Join-Path $root 'BASE-CONHECIMENTO-PTBR.json') -Raw | ConvertFrom-Json
Assert-True ($catalog.schemaVersion -eq 1) 'catalog:schema'
Assert-True ($catalog.resources.Count -ge 20) 'catalog:resource_count'
Assert-True ($knowledge.schemaVersion -eq 1) 'knowledge:schema'
Assert-True ($knowledge.language -eq 'pt-BR') 'knowledge:language'
Assert-True ($knowledge.entries.Count -ge 10) 'knowledge:entry_count'

$prompt = Get-Content -LiteralPath (Join-Path $root 'PROMPT-MESTRE-DUCK-STUDIO.md') -Raw
$words = ([regex]::Matches($prompt, '\S+')).Count
Assert-True ($words -ge 3000) "prompt:too_short:$words"
Assert-True ($prompt -match 'Qwen2\.5 7B') 'prompt:model_primary'
Assert-True ($prompt -match 'Base local') 'prompt:offline_first'
Assert-True ($prompt -match 'Puter') 'prompt:online_opt_in'

$cloneManifest = Import-Csv -LiteralPath (Join-Path $root 'GITHUB-CLONES-MANIFEST.tsv') -Delimiter "`t"
Assert-True ($cloneManifest.Count -eq 9) 'clones:manifest_count'
foreach ($entry in $cloneManifest) {
    $repo = Join-Path (Join-Path $root 'github-clones') $entry.name
    Assert-True (Test-Path -LiteralPath (Join-Path $repo '.git')) "clones:missing:$($entry.name)"
    if (Test-Path -LiteralPath (Join-Path $repo '.git')) {
        $head = (git -C $repo rev-parse HEAD).Trim()
        $remote = (git -C $repo remote get-url origin).Trim()
        $dirty = @(git -C $repo status --porcelain).Count
        Assert-True ($head -eq $entry.head) "clones:head:$($entry.name)"
        Assert-True ($remote -eq $entry.remote) "clones:remote:$($entry.name)"
        Assert-True ($dirty -eq 0) "clones:dirty:$($entry.name)"
    }
}

$htmlRoot = Join-Path $root 'html-offline'
if (Test-Path -LiteralPath $htmlRoot -PathType Container) {
    $htmlRequired = @('index.html', 'mixer.html', 'instrumentos.html', 'agente.html', 'recursos.html', 'memoria.html')
    foreach ($name in $htmlRequired) {
        Assert-True (Test-Path -LiteralPath (Join-Path $htmlRoot $name) -PathType Leaf) "html:missing:$name"
    }
    $jsFiles = Get-ChildItem -LiteralPath (Join-Path $htmlRoot 'assets') -Filter '*.js' -File -ErrorAction SilentlyContinue
    foreach ($js in $jsFiles) {
        & node --check $js.FullName | Out-Null
        Assert-True ($LASTEXITCODE -eq 0) "html:syntax:$($js.Name)"
    }
    $jsText = ($jsFiles | ForEach-Object { Get-Content -LiteralPath $_.FullName -Raw }) -join "`n"
    Assert-True ($jsText -match 'duck\.temp\.') 'html:temp_namespace'
    Assert-True ($jsText -match 'duck\.userMemory\.v1') 'html:user_memory_namespace'
    Assert-True ($jsText -notmatch 'localStorage\.clear\s*\(') 'html:no_localstorage_clear'
    Assert-True ($jsText -notmatch 'sessionStorage\.clear\s*\(') 'html:no_sessionstorage_clear'
    Assert-True ($jsText -match 'https://js\.puter\.com/v2/') 'html:puter_opt_in_source'
}

$scanFiles = Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\\github-clones\\' -and $_.Length -lt 2MB }
$secretPatterns = @('ghp_[A-Za-z0-9]{20,}', 'sk-[A-Za-z0-9]{20,}', 'AIza[0-9A-Za-z_-]{20,}')
foreach ($file in $scanFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
    foreach ($pattern in $secretPatterns) {
        if ($content -match $pattern) { $failures.Add("secret:$($file.FullName)") }
    }
}

if ($failures.Count -gt 0) {
    $failures | Sort-Object -Unique | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output "DUCK_STUDIO_SPEC_PASS required=$($required.Count) resources=$($catalog.resources.Count) knowledge=$($knowledge.entries.Count) clones=$($cloneManifest.Count) prompt_words=$words"
