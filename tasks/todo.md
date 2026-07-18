# Build: `session-profiler` skill

Profile & debug Claude Code and Codex sessions from their JSONL transcripts. Source spec = 4
photos of an internal Meta doc; genericized to run on any machine (per this repo's
convention for the parler skills).

## Verified transcript schema (from real sessions in ~/.claude/projects)
- Main transcript: `<project-munged-cwd>/<session-id>.jsonl`
- Subagents: `<session-id>/subagents/agent-<hex>.jsonl` (+ `.meta.json`:
  `{agentType, description, name, toolUseId, spawnDepth}`)
- Large tool outputs (when present): `<session-id>/tool-results/`
- Records: one JSON per line, top-level `type` in {assistant,user,system,...}
- Assistant: **each content block is a separate record sharing `message.id`**, and
  each repeats the same streaming `usage` snapshot → must dedup per `message.id`.
- Tool call: assistant `content[].type==tool_use` (name,id,input); result is a
  `user` record with `toolUseResult` + `content[].tool_result` (tool_use_id,is_error).
- Subagent spawn: tool_use `name in {Agent,Task}`; its `id` == meta.json `toolUseId`.
- Timestamps ISO-8601 UTC (Z). Subagent records `isSidechain:true`.

## Verified Codex rollout schema (from real sessions in ~/.codex/sessions)
- Main and subagent rollouts: `YYYY/MM/DD/rollout-*.jsonl`; archived sessions in
  `~/.codex/archived_sessions/`.
- `session_meta.payload.id` is the thread id. Subagent source metadata records
  `parent_thread_id`, depth, nickname, and role, allowing recursive tree discovery.
- `response_item` records carry messages, reasoning, tool calls, and tool outputs;
  calls and results pair by `call_id`.
- `event_msg.token_count.info.last_token_usage` is per-response usage. Cached input
  is a subset of input and must be subtracted before applying uncached-input rates.
- `turn_context` records the turn id and model. `task_started`/`task_complete`
  delimit turns without charging human idle time as inference.

## Plan
- [x] Inspect repo conventions + real transcript schema
- [x] `scripts/sp` — one bash wrapper; bootstraps uv venv (~/.cache/session-profiler-venv),
      remembers work dir between calls, dispatches to the CLI
- [x] `scripts/requirements.txt` — pandas, pyarrow
- [x] `session_profiler/dataset.py` — parse JSONL → events df + agents.json; `load()`; PRICE
- [x] `session_profiler/discover.py` — projects / list / find / info
- [x] `session_profiler/analyses.py` — agent-summary, costs, slowest-tools, tool-breakdown,
      inference-vs-tool, errors, turns, timeline, events
- [x] `session_profiler/toc.py` — junk-free digest → `claude -p --model sonnet` → toc.json/md
- [x] `session_profiler/trace.py` — events(+toc) → Perfetto trace.json.gz (public ui.perfetto.dev)
- [x] `session_profiler/cli.py` — argparse dispatch
- [x] `SKILL.md` — genericized instructions + derivation rules + gotchas
- [x] Update root README.md table
- [x] Verify end-to-end on a real session (parse → analyses → toc dry-run → trace)
- [x] Add Codex rollout parsing, recursive subagent discovery, model-aware pricing,
      automatic TOC engine selection, fixtures, and real single/multi-agent verification

## Derivation rules (baked in, documented in SKILL.md)
- Usage deduped per API message id (never sum raw JSONL — ~2.7x double count).
- Subagent tokens live only in the subagent transcript (summing across agents is safe).
- Tool duration = tool_use ts → matching tool_result ts (same transcript);
  same-assistant-record tools are concurrent.
- inference span = first→last assistant record for a message.id (excludes human idle).
- Background/subagent runtime = its own transcript first→last ts.
- Cost = ESTIMATE via per-model public price table; always labeled as estimate.

## Rebrand: Builder's Essential Skills

- [x] Establish the new dark workshop visual language across the README hero and all eight skill cards.
- [x] Rename public-facing collection and `npx` package references, including installer help and tests.
- [x] Run the installer tests and inspect the resulting visual assets and diff.

## Genericization (vs internal doc)
- venv: `uv venv` + `uv pip install` (fallback python3 -m venv); no Vault/fbpkg/proxy.
- share: `sp trace` writes trace.json.gz; open at public https://ui.perfetto.dev
  (replaces everstore/clowder/internalfb upload). `sp open` opens the UI.
