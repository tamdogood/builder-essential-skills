#!/usr/bin/env bash
set -euo pipefail

# Central skills hub installer. The same skills land in Claude Code
# (~/.claude/skills) and in Codex (~/.agents/skills), and the agents the /lead
# skill dispatches land in ~/.claude/agents. Pass --project (or -p) to install
# into the current repo only.

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC_ROOT="$ROOT/skills"
AGENTS_SRC="$ROOT/.claude/agents"
project=0
case "${1:-}" in --project|-p) project=1;; esac

if [ "$project" -eq 1 ]; then
    CLAUDE_DEST="$(pwd)/.claude/skills"
    CODEX_DEST="$(pwd)/.agents/skills"
    AGENTS_DEST="$(pwd)/.claude/agents"
else
    CLAUDE_DEST="$HOME/.claude/skills"
    CODEX_DEST="$HOME/.agents/skills"
    AGENTS_DEST="$HOME/.claude/agents"
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
# Codex reads skills from ~/.agents/skills (user) or $CWD/.agents/skills (repo).
install_into "$CODEX_DEST" "Codex"

# The /lead skill dispatches builder/reviewer subagents defined in .claude/agents.
if [ -d "$AGENTS_SRC" ]; then
    mkdir -p "$AGENTS_DEST"
    for agent in "$AGENTS_SRC"/*.md; do
        [ -e "$agent" ] || continue
        cp "$agent" "$AGENTS_DEST/"
        echo "Installed agent $(basename "$agent") to $AGENTS_DEST"
    done
fi

echo
if command -v python3 >/dev/null 2>&1; then
    echo "Model routing for /lead (defaults):"
    python3 "$SRC_ROOT/lead/config.py" --repo-root "$(pwd)" || true
else
    echo "python3 not found - install it to use 'python skills/lead/config.py' for model routing."
fi
if command -v codex >/dev/null 2>&1; then
    echo "Codex CLI found: $(codex --version)"
else
    echo "Codex CLI not found (optional builder backend for /lead): npm i -g @openai/codex@latest"
fi
