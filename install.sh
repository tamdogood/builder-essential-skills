#!/usr/bin/env bash
set -euo pipefail

# Central skills hub installer. The same provider-neutral skills land in Claude
# Code (~/.claude/skills) and Codex (${CODEX_HOME:-~/.codex}/skills). Pass
# --project (or -p) to install into the current repo only.

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC_ROOT="$ROOT/skills"
project=0
case "${1:-}" in --project|-p) project=1;; esac

if [ "$project" -eq 1 ]; then
    CLAUDE_DEST="$(pwd)/.claude/skills"
    CODEX_DEST="$(pwd)/.codex/skills"
else
    CLAUDE_DEST="$HOME/.claude/skills"
    CODEX_DEST="${CODEX_HOME:-$HOME/.codex}/skills"
fi

install_into() {
    dest_root=$1; label=$2
    mkdir -p "$dest_root"
    for skill in "$SRC_ROOT"/*/; do
        name="$(basename "$skill")"
        rm -rf "${dest_root:?}/$name"
        cp -r "$skill" "$dest_root/$name"
        find "$dest_root/$name" -name '__pycache__' -type d -prune -exec rm -rf {} + 2>/dev/null || true
        echo "Installed $label /$name to $dest_root/$name"
    done
}

# Claude Code reads skills from ~/.claude/skills (user) or $CWD/.claude/skills (repo).
install_into "$CLAUDE_DEST" "Claude"
# Codex reads user skills from ${CODEX_HOME:-~/.codex}/skills.
install_into "$CODEX_DEST" "Codex"

echo
echo "Restart your agent runtime to load the installed skills."
