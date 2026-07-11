param([string]$RepoRoot = ".")

# Read-only status tree for a techlead-loop run (Windows). Reads run artifacts
# plus `gh`; never a new state store. Callers print the output verbatim.

$root = (Resolve-Path -LiteralPath $RepoRoot).Path
if (-not (Test-Path -LiteralPath $root)) { Write-Output "unreadable repo: $RepoRoot"; exit 1 }

$useColor = ($Host.UI.RawUI -ne $null) -and (-not $env:NO_COLOR)
function Glyph($ch, $code) { if ($useColor) { "`e[$($code)m$ch`e[0m" } else { $ch } }
$gMerged   = Glyph ([char]0x2713) 32
$gReview   = Glyph ([char]0x25D0) 36
$gBlocked  = Glyph "!" 31
$gReported = Glyph ([char]0x25A3) 35
$gBuilding = Glyph ([char]0x25CF) 34
$gQueued   = Glyph ([char]0x2298) 33
$gReady    = Glyph ([char]0x25CB) 37

function NewestSpec {
    $specDir = Join-Path $root "docs/spec"
    if (-not (Test-Path -LiteralPath $specDir)) { return "unknown" }
    $newest = Get-ChildItem -LiteralPath $specDir -Filter *.md -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    if ($newest) { return $newest.Name } else { return "unknown" }
}
function TailText($Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return "" }
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $len = [Math]::Min(4096, $bytes.Length)
    $tail = $bytes[($bytes.Length - $len)..($bytes.Length - 1)]
    return [System.Text.Encoding]::UTF8.GetString($tail)
}
function StatusLine($Path) {
    $s = ""
    foreach ($line in ((TailText $Path) -split "`r?`n")) {
        if ($line -match '^\xEF\xBB\xBF?STATUS:') { $s = ($line -replace '^\xEF\xBB\xBF?STATUS:\s*', '') }
        elseif ($line -match '^STATUS:') { $s = ($line -replace '^STATUS:\s*', '') }
    }
    return $s
}
function Slugify($s) { (($s.ToLower() -replace '[^a-z0-9]', '-') -replace '-+', '-').Trim('-') }
function ReportPath($slug) {
    $inWt = Join-Path $root ".lead/wt/$slug-01/docs/jobs/$slug-01.md"
    if (Test-Path -LiteralPath $inWt) { return $inWt }
    return (Join-Path $root "docs/jobs/$slug-01.md")
}
function Phase($slug, $state, $blockers) {
    if ($state -eq "CLOSED") { return "$gMerged MERGED" }
    if ($state -eq "OPEN" -and $blockers) { return "$gQueued QUEUED" }
    $rep = ReportPath $slug
    $review = Get-ChildItem -LiteralPath (Join-Path $root ".lead/wt") -Filter "$slug-01.review*.md" -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ((Test-Path -LiteralPath $rep) -and $review) { return "$gReview REVIEWING" }
    if ((StatusLine $rep) -like "BLOCKED*") { return "$gBlocked BLOCKED" }
    if (Test-Path -LiteralPath $rep) { return "$gReported REPORTED" }
    if (Test-Path -LiteralPath (Join-Path $root ".lead/wt/$slug-01")) { return "$gBuilding BUILDING" }
    return "$gReady READY"
}
function TrackerLines {
    $jq = '. as $all | ([ $all[] | select(.parent != null) | .parent.number ] | unique) as $pnums | ([ $all[] | select(.state == "OPEN") | select(.number as $n | $pnums | index($n)) ] | map(.number) | max) as $t | if $t == null then "NOOPENRUN" else ("TRACK\t\($t)", ($all[] | select(.parent != null and .parent.number == $t) | [ "SUB", (.number|tostring), .state, ((.blockedBy.nodes // []) | map(select(.state == "OPEN") | (.number|tostring)) | join(",")), .title ] | @tsv)) end'
    if ($env:STATUS_GH_STUB -and (Test-Path -LiteralPath $env:STATUS_GH_STUB)) { return Get-Content -LiteralPath $env:STATUS_GH_STUB }
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { return $null }
    Push-Location $root
    try { gh issue list --state all --limit 200 --json number,title,state,parent,blockedBy --jq $jq } finally { Pop-Location }
}

$branch = "unknown"
if (Test-Path -LiteralPath (Join-Path $root ".git")) {
    $b = git -C $root branch --show-current 2>$null
    if ($b) { $branch = $b.Trim() }
}
$trackerTsv = TrackerLines
$tracker = ($null -ne $trackerTsv)
$tracking = $null
if ($tracker) {
    foreach ($row in $trackerTsv) {
        $cols = $row -split "`t"
        if ($cols[0] -eq "TRACK") { $tracking = $cols[1] }
    }
}
$slugDirs = Get-ChildItem -LiteralPath (Join-Path $root ".lead/wt") -Directory -Filter "*-01" -ErrorAction SilentlyContinue |
    ForEach-Object { $_.Name -replace '-01$', '' } | Sort-Object -Unique

if ((-not $tracker -or -not $tracking) -and -not $slugDirs) {
    Write-Output "NO ACTIVE FACTORY RUN"
    Write-Output "spec: $(NewestSpec)"
    exit 0
}
Write-Output "STATUS TREE spec: $(NewestSpec) branch: $branch"
if ($tracker -and $tracking) { Write-Output "tracker: #$tracking" }
elseif ($tracker) { Write-Output "tracker: no open run" }
else { Write-Output "tracker: unavailable (local view)" }
Write-Output "LEAD: local view"
$cfg = (Get-ChildItem -LiteralPath (Join-Path $root ".lead/tmp") -Filter "wd-*.json" -File -ErrorAction SilentlyContinue | Measure-Object).Count
$proc = if (Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'watchdog\.(ps1|sh)' }) { "True" } else { "False" }
Write-Output "WATCHDOG: process=$proc config=$cfg"

if ($tracker -and $tracking) {
    foreach ($row in $trackerTsv) {
        $cols = $row -split "`t"
        if ($cols[0] -ne "SUB") { continue }
        $num = $cols[1]; $state = $cols[2]; $blockers = $cols[3]; $title = $cols[4]
        $slug = Slugify $title
        $p = (Phase $slug $state $blockers) -split ' ', 2
        $extra = if ($p[1] -eq "QUEUED") { " blocked-by: $blockers" } else { "" }
        Write-Output "$($p[0]) #$num $title .lead/wt/$slug-01$extra"
    }
} else {
    foreach ($slug in $slugDirs) {
        $p = (Phase $slug "" "") -split ' ', 2
        if ($p[1] -in @("BUILDING", "BLOCKED", "REVIEWING", "REPORTED")) {
            Write-Output "$($p[0]) $slug .lead/wt/$slug-01"
        }
    }
}
