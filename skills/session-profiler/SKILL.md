---
name: session-profiler
description: Profile and debug Claude Code and OpenAI Codex sessions from their JSONL transcripts. Find a session and its subagents, build a queryable event table, summarize the work as a hierarchical table of contents, break down wall time, inference, tools, tokens, and estimated cost per agent, identify errors and improvement opportunities, and export a shareable Perfetto trace. Use when a user wants to inspect what a Claude or Codex session did, debug agent or subagent activity, understand session cost or latency, create a session timeline, generate a trace, or learn how to improve the next agent run.
---

# Session Profiler

Turn one Claude Code or Codex main transcript plus its subagent transcripts into analysis artifacts. Route every operation through the bundled wrapper so it uses a consistent environment and remembers the latest parsed work directory.

```bash
SP="$SKILL/scripts/sp"
```

Resolve `SKILL` to this skill's directory. If it is unavailable, use the absolute path to `scripts/sp` beside this file.

## Workflow

1. Find and inspect the session.

```bash
$SP projects
$SP list [--provider claude|codex] [--n 20]
$SP list --project-dir ~/.claude/projects/<munged-cwd>
$SP find <session-id-prefix>
$SP info <session-id-or-path>
```

Claude Code stores main transcripts at `~/.claude/projects/<munged-cwd>/<session-id>.jsonl`; its subagents normally live at `<session-id>/subagents/agent-*.jsonl`. Codex stores rollouts under `${CODEX_HOME:-~/.codex}/sessions/YYYY/MM/DD/rollout-*.jsonl` and archived rollouts under `archived_sessions/`. Codex subagent rollouts identify their parent thread recursively in `session_meta`.

2. Parse the session before analyzing it. Re-run this for a session that is still active.

```bash
$SP parse <session-id-or-main-jsonl-path>
```

The command prints and remembers its work directory. It writes `events.parquet`, `events.csv`, and `agents.json`. Override the remembered directory with global `--data-dir <dir>` or `SESSION_DATA_DIR`.

3. Start with the summary, then narrow the investigation.

```bash
$SP agent-summary
$SP costs
$SP slowest-tools --n 20 [--agent <id-or-name>]
$SP tool-breakdown [--agent <id-or-name>]
$SP inference-vs-tool
$SP errors
$SP turns
$SP timeline 2026-07-08T19:14:00Z --window 120
$SP events [--agent main] [--tool Bash] [--grep rebase] [--since 2026-07-08] [--n 30] [--long]
```

For ad hoc pandas analysis, set `SESSION_DATA_DIR`, add `scripts/` to `PYTHONPATH`, and use `from session_profiler.dataset import load; df = load()` inside the wrapper's venv.

4. Summarize the session and preserve lessons for the next run.

```bash
$SP toc --dry-run
$SP toc                       # auto-selects claude or codex from the parsed provider
$SP toc --engine codex        # optional override; --model is also supported
$SP review
```

Use `toc --dry-run` to inspect the sanitized, junk-free digest without calling another model. `toc` automatically calls `claude -p` for Claude data or an ephemeral, read-only `codex exec` for Codex data, then writes `toc.json` plus `toc.md`. Show `toc.md` to orient the user. `review` writes `review.md` with deterministic observations about failed calls, slow paths, active-time mix, delegation, and estimated cost. Turn those observations into concrete changes to prompts, tool batching, preflight checks, or subagent assignments; do not claim the profiler automatically changes agent behavior.

5. Build and open the trace.

```bash
$SP trace
$SP open
```

Load the emitted `trace.json.gz` in [Perfetto](https://ui.perfetto.dev). The trace contains TOC phases when `toc.json` exists, per-agent inference and tool activity, human prompts, and cumulative token/cost counters.

## Interpretation Rules

Trust these derivations instead of recomputing them from raw rows:

- For Claude, deduplicate usage per API `message.id`: content-block records repeat a growing usage snapshot, so keep only the final snapshot once. For Codex, consume `last_token_usage` once per `token_count` event and treat `cached_input_tokens` as a subset of input tokens.
- Sum tokens across agents. Subagent token usage lives in the subagent transcript, not the parent transcript.
- Measure a tool from `tool_use` to its matching `tool_result` within the same transcript. Treat multiple tool uses sharing one assistant message as concurrent.
- Measure inference from the first to last assistant record for one message ID. Do not treat human idle time as inference.
- Measure each subagent's wall runtime from the first to last timestamp in its own transcript, not from the parent's spawn tool span.
- Treat active-time totals as sums of spans, not wall time. Concurrent tools and agents can make summed active time exceed elapsed wall time.
- Label all dollar values as estimates. Claude uses the source specification's Opus-tier reference rates. Codex uses model-specific public OpenAI API rates when the model is known, including long-context multipliers recorded by the pricing docs. Codex subscriptions, credits, priority processing, tool fees, and negotiated rates can differ; an unknown model is marked unavailable instead of guessed.

## Privacy And Failure Handling

- Treat transcripts and traces as sensitive. Previews redact long opaque tokens and common auth/cookie headers, but can still contain source code, prompts, paths, personal data, or secrets. Review before sharing and share only where the session owner would.
- Expect UTC timestamps throughout.
- If parsing a growing transcript, rerun `parse` immediately before final analysis.
- If dependency bootstrap fails, report the `uv` or `pip` error and let the user fix local network/package configuration. Do not add machine-specific proxy settings to this skill.
- If `toc` fails because the matching `claude` or `codex` CLI is missing or unauthenticated, keep the parsed data and analyses; use `toc --dry-run` as a digest and explain the missing prerequisite.
