param([switch]$Project)

# Central skills hub installer. The same skills land in Claude Code
# (~\.claude\skills) and in Codex (${CODEX_HOME:-~\.codex}\skills); the agents /lead dispatches
# land in ~\.claude\agents. Use -Project to install into the current repo only.

$srcRoot   = Join-Path $PSScriptRoot "skills"
$agentsSrc = Join-Path $PSScriptRoot ".claude\agents"
if ($Project) {
    $claudeDest = Join-Path (Get-Location) ".claude\skills"
    $codexDest  = Join-Path (Get-Location) ".codex\skills"
    $agentsDest = Join-Path (Get-Location) ".claude\agents"
} else {
    $claudeDest = Join-Path $env:USERPROFILE ".claude\skills"
    $codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE ".codex" }
    $codexDest  = Join-Path $codexHome "skills"
    $agentsDest = Join-Path $env:USERPROFILE ".claude\agents"
}

function Install-Into($destRoot, $label) {
    New-Item -ItemType Directory -Force $destRoot | Out-Null
    foreach ($skill in Get-ChildItem -Directory $srcRoot) {
        $dest = Join-Path $destRoot $skill.Name
        if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
        Copy-Item -Recurse $skill.FullName $dest
        Get-ChildItem -LiteralPath $dest -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
        Write-Host "Installed $label /$($skill.Name) to $dest"
    }
}

# Claude Code reads skills from ~\.claude\skills; Codex from ${CODEX_HOME:-~\.codex}\skills.
Install-Into $claudeDest "Claude"
Install-Into $codexDest  "Codex"

# The /lead skill dispatches builder/reviewer subagents defined in .claude\agents.
if (Test-Path $agentsSrc) {
    New-Item -ItemType Directory -Force $agentsDest | Out-Null
    foreach ($agent in Get-ChildItem -File -Filter "*.md" $agentsSrc) {
        Copy-Item $agent.FullName (Join-Path $agentsDest $agent.Name)
        Write-Host "Installed agent $($agent.Name) to $agentsDest"
    }
}

Write-Host ""
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command python3 -ErrorAction SilentlyContinue }
if ($py) {
    Write-Host "Model routing for /lead (defaults):"
    & $py.Path (Join-Path $srcRoot "lead\config.py") --repo-root (Get-Location)
} else {
    Write-Host "python not found - install it to use 'python skills\lead\config.py' for model routing."
}
$codex = Get-Command codex -ErrorAction SilentlyContinue
if ($codex) {
    Write-Host "Codex CLI found: $(codex --version)"
} else {
    Write-Host "Codex CLI not found (optional builder backend for /lead): npm i -g @openai/codex@latest"
}
