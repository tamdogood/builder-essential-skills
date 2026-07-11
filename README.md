# skills

A central hub for the AI agent **skills** I use across projects. One repo, one
install, and every skill is available in Claude Code (`~/.claude/skills`) and
Codex (`~/.agents/skills`).

This repo merges three former standalone repos into one place:

- [`async_ai_learning`](https://github.com/tamdogood/async_ai_learning) → `async-learning-teacher`
- [`techlead-loop`](https://github.com/tamdogood/techlead-loop) → `lead`, `lead-research`
- [`parler-protocol`](https://github.com/tamdogood/parler-protocol) → `validate-market`, `write-blog`, `code-standards` (genericized so they work on any project)

## Skills

| Skill | What it does |
| --- | --- |
| **`lead`** | Autonomous build factory. Turn a goal into a spec-approved GitHub issue plan, freeze acceptance checks, dispatch parallel builder jobs, review against frozen checks, and close a run with one PR. The lead model judges; cheaper submodels type. |
| **`lead-research`** | Discovery-scale research harness. A cheap scout maps the topic, the lead designs parallel researcher assignments from a source-class tactics library, verifies claims against sources, and writes a decision-oriented report. |
| **`async-learning-teacher`** | Turn saved links, papers, articles, posts, and videos into approachable teaching artifacts for later study, or run an interactive tutor that validates understanding across sessions. |
| **`validate-market`** | Honest market-fit and viability audit of any project or idea. Produces a decision doc (not code) with pre-committed pass/middle/kill criteria, a competitive field, an independent cold read, and a concrete week-1 assignment. |
| **`write-blog`** | Write and ship a blog post that reads like a human wrote it and earns SEO traffic. Enforces a human voice (no em dashes), picks a non-cannibalizing angle, wires the post into your site, and runs a humanizer pass before shipping. |
| **`code-standards`** | A disciplined, language-agnostic engineering-change workflow: orient → baseline → smallest change → test → verify → self-review, with hard gates for interfaces, dependencies, auth, and secrets. |
| **`session-profiler`** | Profile Claude Code and Codex JSONL sessions: inspect subagents, query events, break down time/tokens/estimated cost, generate a hierarchical TOC and improvement review, and export a Perfetto trace. |

The three skills from `parler-protocol` were **genericized**: all project-,
stack-, and brand-specific references were removed so they run on any repo.

## Install

Install into Claude Code and Codex at the user level:

```bash
./install.sh          # ~/.claude/skills, ~/.agents/skills, ~/.claude/agents
./install.sh -p       # install into the current repo only (.claude/, .agents/)
```

On Windows:

```powershell
./install.ps1         # user level
./install.ps1 -Project
```

The installer copies every folder under `skills/` into place and installs the
builder/reviewer subagents that `lead` dispatches (`.claude/agents/`). After
installing, the skills are available by name (e.g. `/lead`, `/validate-market`)
in a new session.

### Using `session-profiler`

Ask the installed skill to find and profile a session directly:

```text
# Claude Code
/session-profiler Profile my latest Claude Code session and explain where the time and tokens went.

# Codex
$session-profiler Profile my latest Codex session, including subagents, errors, cost, and a timeline.
```

For direct CLI access, point `SP` at the installed wrapper. It creates and
manages its own Python environment on first use.

```bash
# Installed for Claude Code
SP="$HOME/.claude/skills/session-profiler/scripts/sp"

# Or installed for Codex
SP="$HOME/.agents/skills/session-profiler/scripts/sp"
```

Discover and parse a Claude Code or Codex transcript:

```bash
$SP list --provider claude --n 20
$SP list --provider codex --n 20
$SP find <session-id-prefix>
$SP info <session-id-or-jsonl-path>
$SP parse <session-id-or-jsonl-path>
```

`parse` prints and remembers a work directory containing `events.parquet`,
`events.csv`, and `agents.json`. Subsequent commands use that directory unless
`--data-dir <dir>` or `SESSION_DATA_DIR` overrides it.

```bash
$SP agent-summary                 # time, tokens, and estimated cost per agent
$SP costs                         # provider/model token and cost table
$SP slowest-tools --n 20
$SP tool-breakdown
$SP errors
$SP turns
$SP events --agent main --grep rebase --n 30
$SP timeline 2026-07-08T19:14:00Z --window 120
```

Generate orientation and improvement artifacts, then create a Perfetto trace:

```bash
$SP toc --dry-run                 # inspect the sanitized digest first
$SP toc                           # uses Claude for Claude data, Codex for Codex data
$SP review                        # writes reusable observations to review.md
$SP trace                         # writes trace.json.gz
$SP open                          # opens https://ui.perfetto.dev
```

Token costs are estimates from public API reference rates, not billing data.
Transcripts and traces can contain prompts, code, paths, or sensitive text;
review generated artifacts before sharing them.

### `lead` / `lead-research` model routing

These two skills route roles (lead, builder, reviewer, researcher, scout,
critic) to different models. Resolve the effective routing with:

```bash
python skills/lead/config.py            # table of the effective routing
python skills/lead/config.py --role builder
python skills/lead/config.py --check    # verify each provider CLI is on PATH
```

Defaults live in `skills/lead/config.py` and `skills/lead/models.json`; override
per repo via `.lead/config` or globally via `~/.lead/config`. Codex is an
optional builder backend: `npm i -g @openai/codex@latest`.

## Layout

```
skills/
  async-learning-teacher/   # SKILL.md + README + agents/openai.yaml
  lead/                      # SKILL.md + dispatch/loop/research refs + config.py + status/watchdog scripts
  lead-research/             # SKILL.md + tactics.md
  validate-market/           # SKILL.md
  write-blog/                # SKILL.md + check.sh + reference/
  code-standards/            # SKILL.md
  session-profiler/          # SKILL.md + parser, analyses, TOC, trace exporter
.claude/agents/              # lead-builder.md, lead-reviewer.md (dispatched by /lead)
install.sh / install.ps1
```

## Adding a skill

Drop a new `skills/<name>/SKILL.md` (with `name` and `description` frontmatter),
re-run the installer, and it's live. Keep skills project-agnostic so the hub
stays reusable across repos.
