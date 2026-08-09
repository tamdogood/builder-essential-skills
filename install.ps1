param([switch]$Project)

# Central skills hub installer. The same provider-neutral skills land in Claude
# Code (~\.claude\skills) and Codex (${CODEX_HOME:-~\.codex}\skills). Use
# -Project to install into the current repo only.

$srcRoot = Join-Path $PSScriptRoot "skills"
if ($Project) {
    $claudeDest = Join-Path (Get-Location) ".claude\skills"
    $codexDest  = Join-Path (Get-Location) ".codex\skills"
} else {
    $claudeDest = Join-Path $env:USERPROFILE ".claude\skills"
    $codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE ".codex" }
    $codexDest  = Join-Path $codexHome "skills"
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

Write-Host ""
Write-Host "Restart your agent runtime to load the installed skills."
