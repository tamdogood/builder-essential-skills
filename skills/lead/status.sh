#!/usr/bin/env bash
# Read-only status tree for a techlead-loop run. Reads run artifacts plus `gh`;
# never a new state store. Piped output is plain text; color follows isatty and
# NO_COLOR. Callers print it verbatim instead of hand-composing status.
set -u

root=$(pwd)
while [ "$#" -gt 0 ]; do
  case "$1" in --repo-root) root=$2; shift 2;; *) shift;; esac
done
case "$root" in /*) ;; *) root="$(pwd)/$root";; esac
[ -d "$root" ] || { printf 'unreadable repo: %s\n' "$root"; exit 1; }

color_glyph(){ if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then printf '\033[%sm%s\033[0m' "$2" "$1"; else printf '%s' "$1"; fi; }
g_merged=$(color_glyph '✓' 32); g_review=$(color_glyph '◐' 36); g_blocked=$(color_glyph '!' 31)
g_reported=$(color_glyph '▣' 35); g_building=$(color_glyph '●' 34); g_queued=$(color_glyph '⊘' 33); g_ready=$(color_glyph '○' 37)

newest_spec(){
  spec_dir="$root/docs/spec"
  newest=; newest_mtime=
  [ -d "$spec_dir" ] || { printf unknown; return; }
  for spec in "$spec_dir"/*.md; do
    [ -f "$spec" ] || continue
    mtime=$(stat -c %Y "$spec" 2>/dev/null || stat -f %m "$spec" 2>/dev/null || printf 0)
    case "$mtime" in ''|*[!0-9]*) mtime=0;; esac
    if [ -z "$newest" ] || [ "$mtime" -gt "$newest_mtime" ]; then newest=$spec; newest_mtime=$mtime; fi
  done
  [ -n "$newest" ] && basename "$newest" || printf unknown
}
tail_text(){ [ -f "$1" ] && tail -c 4096 "$1" | tr -d '\000'; }
status_line(){ tail_text "$1" | sed 's/^\xEF\xBB\xBF//' | awk '/^STATUS:/{sub(/^STATUS:[[:space:]]*/,""); s=$0} END{print s}'; }
last_command(){
  ev="$root/.lead/wt/$1-01.events.jsonl"
  cmd=$(tail_text "$ev" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | tail -n 1)
  [ -n "$cmd" ] && printf '    last: %s age: unknown\n' "$cmd"
}
report_path(){
  in_wt="$root/.lead/wt/$1-01/docs/jobs/$1-01.md"
  in_repo="$root/docs/jobs/$1-01.md"
  [ -f "$in_wt" ] && { printf '%s' "$in_wt"; return; }
  printf '%s' "$in_repo"
}
slugify(){ printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g;s/--*/-/g;s/^-//;s/-$//'; }
artifact_slugs(){ find "$root/.lead/wt" -maxdepth 1 -type d -name '*-01' 2>/dev/null | sed 's|.*/||;s/-01$//' | sort -u; }
phase(){
  slug=$1; state=${2:-}; blockers=${3:-}
  [ "$state" = CLOSED ] && { printf '%s MERGED' "$g_merged"; return; }
  [ "$state" = OPEN ] && [ -n "$blockers" ] && { printf '%s QUEUED' "$g_queued"; return; }
  rep=$(report_path "$slug")
  review=$(find "$root/.lead/wt" -maxdepth 1 -type f -name "$slug-01.review*.md" 2>/dev/null | head -n 1)
  [ -f "$rep" ] && [ -n "$review" ] && { printf '%s REVIEWING' "$g_review"; return; }
  st=$(status_line "$rep")
  case "$st" in BLOCKED*) printf '%s BLOCKED' "$g_blocked"; return;; esac
  [ -f "$rep" ] && { printf '%s REPORTED' "$g_reported"; return; }
  [ -d "$root/.lead/wt/$slug-01" ] && { printf '%s BUILDING' "$g_building"; return; }
  printf '%s READY' "$g_ready"
}
tracker_lines(){
  jq_expr='. as $all | ([ $all[] | select(.parent != null) | .parent.number ] | unique) as $pnums | ([ $all[] | select(.state == "OPEN") | select(.number as $n | $pnums | index($n)) ] | map(.number) | max) as $t | if $t == null then "NOOPENRUN" else ("TRACK\t\($t)", ($all[] | select(.parent != null and .parent.number == $t) | [ "SUB", (.number|tostring), .state, ((.blockedBy.nodes // []) | map(select(.state == "OPEN") | (.number|tostring)) | join(",")), .title ] | @tsv)) end'
  if [ -n "${STATUS_GH_STUB:-}" ] && [ -r "$STATUS_GH_STUB" ]; then cat "$STATUS_GH_STUB"; return 0; fi
  command -v gh >/dev/null 2>&1 || return 1
  (cd "$root" && gh issue list --state all --limit 200 --json number,title,state,parent,blockedBy --jq "$jq_expr")
}

branch=
[ -e "$root/.git" ] && branch=$(git -C "$root" branch --show-current 2>/dev/null || true)
[ -n "$branch" ] || branch=unknown
tracker=0; tracker_tsv=
if tracker_tsv=$(tracker_lines 2>/dev/null); then tracker=1; fi
tracking=
if [ "$tracker" -eq 1 ]; then
  # Tab is IFS whitespace to bash: empty TSV fields shift columns. Use unit separators.
  while IFS="$(printf '\037')" read -r kind num state blockers title; do
    [ "$kind" = TRACK ] && tracking=$num
  done <<< "$(printf '%s\n' "$tracker_tsv" | tr '\t' '\037')"
fi
slugs=$(artifact_slugs)
if { [ "$tracker" -eq 0 ] || [ -z "$tracking" ]; } && [ -z "$slugs" ]; then
  printf 'NO ACTIVE FACTORY RUN\nspec: %s\n' "$(newest_spec)"
  exit 0
fi
printf 'STATUS TREE spec: %s branch: %s\n' "$(newest_spec)" "$branch"
if [ "$tracker" -eq 1 ] && [ -n "$tracking" ]; then
  printf 'tracker: #%s\n' "$tracking"
elif [ "$tracker" -eq 1 ]; then
  printf 'tracker: no open run\n'
else
  printf 'tracker: unavailable (local view)\n'
fi
printf 'LEAD: local view\n'
cfg=$(find "$root/.lead/tmp" -maxdepth 1 -type f -name 'wd-*.json' 2>/dev/null | wc -l | tr -d ' ')
ps -eo args= 2>/dev/null | grep 'watchdog\.\(ps1\|sh\)' >/dev/null && proc=True || proc=False
printf 'WATCHDOG: process=%s config=%s\n' "$proc" "$cfg"
if [ "$tracker" -eq 1 ] && [ -n "$tracking" ]; then
  while IFS="$(printf '\037')" read -r kind num state blockers title; do
    [ "$kind" = SUB ] || continue
    slug=$(slugify "$title"); set -- $(phase "$slug" "$state" "$blockers")
    extra=; [ "$2" = QUEUED ] && extra=" blocked-by: $blockers"
    printf '%s #%s %s .lead/wt/%s-01%s\n' "$1" "$num" "$title" "$slug" "$extra"
    [ "$2" = BUILDING ] && last_command "$slug"
  done <<< "$(printf '%s\n' "$tracker_tsv" | tr '\t' '\037')"
else
  for slug in $slugs; do
    set -- $(phase "$slug")
    case "$2" in BUILDING|BLOCKED|REVIEWING|REPORTED)
      printf '%s %s .lead/wt/%s-01\n' "$1" "$slug" "$slug"
      [ "$2" = BUILDING ] && last_command "$slug"
    esac
  done
fi
