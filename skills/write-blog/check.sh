#!/usr/bin/env bash
# check.sh — pre-ship scan for a blog draft.
# Flags the house-style hard fails (em/en dashes, curly quotes, emoji) and the most
# common AI-slop phrases so they get fixed before the post ships.
#
# Usage: bash check.sh <path/to/post>   (a markdown source or a rendered post body)
# Exit:  0 = clean, 1 = hard issues found, 2 = bad usage.
#
# Unicode checks run through perl (portable across macOS BSD grep + Linux GNU grep,
# which disagree on -P). Soft-phrase check uses portable grep -E.

set -u

file="${1:-}"
if [ -z "$file" ] || [ ! -f "$file" ]; then
  echo "usage: bash check.sh <file>" >&2
  exit 2
fi

fails=0

# perl_scan REGEX LABEL — print "line:text" for each matching line, count as a hard fail.
perl_scan() {
  local re="$1" label="$2" hits
  hits="$(perl -CSD -ne 'print "    $.: $_" if /'"$re"'/' "$file")"
  if [ -n "$hits" ]; then
    echo "✗ $label:"
    printf '%s\n' "$hits"
    fails=$((fails + 1))
  fi
}

# --- Hard fails: characters the house style bans -----------------------------
perl_scan '[\x{2013}\x{2014}]' "em/en dash (— or –) — replace with a period, comma, or parentheses"
perl_scan '[\x{2018}\x{2019}\x{201C}\x{201D}]' "curly quote (‘ ’ “ ”) — use straight quotes"
perl_scan '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2190}-\x{21FF}\x{2B00}-\x{2BFF}]' "emoji / pictograph in prose"

# --- Soft flags: common AI tells. Review each; not every hit is wrong. --------
tells='testament to|pivotal|groundbreaking|seamless(ly)?|ever-evolving|evolving landscape|cutting-edge|game-chang|revolutioniz|underscor|it is (important|worth noting) to note|in conclusion|in order to|due to the fact|at this point in time|delve|leverage|robust and|it.s not just|isn.t just|serves as a|stands as a|plays a (vital|key|crucial) role|the possibilities are endless'
soft="$(grep -nEi "$tells" "$file" 2>/dev/null)"
if [ -n "$soft" ]; then
  echo "⚠ possible AI-slop phrasing (review, don't blindly delete):"
  printf '%s\n' "$soft" | sed 's/^/    /'
fi

echo
if [ "$fails" -gt 0 ]; then
  echo "FAIL: $fails hard-style issue group(s). Fix before shipping."
  exit 1
fi
echo "OK: no hard-style issues. Still eyeball the ⚠ soft flags above."
exit 0
