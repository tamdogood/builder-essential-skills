<p align="center">
  <img src="assets/readme-hero.png" alt="AI Agent Skills hero banner">
</p>

# AI Agent Skills

A reusable collection of agent skills for Claude Code and Codex.

This repository is designed to be copied, forked, and adapted. It gives you one
place to keep reusable workflows, install them into your local agent tools, and
share them with teammates or the community.

## What Is Included

| Skill | Use it when you want to... |
| --- | --- |
| `lead` | Run an autonomous build loop: turn a goal into a reviewed plan, dispatch builder jobs, verify frozen acceptance checks, and finish with one pull request. |
| `lead-research` | Run parallel, source-grounded research for technology choices, product decisions, market scans, or state-of-the-art reviews. |
| `async-learning-teacher` | Turn papers, articles, links, videos, and saved references into clear teaching artifacts or interactive tutoring sessions. |
| `validate-market` | Audit whether an idea or project has real market pull, competitive space, and a concrete next validation step. |
| `write-blog` | Draft, improve, and wire in blog posts with a consistent voice, SEO angle, and publishing checklist. |
| `code-standards` | Apply a disciplined engineering workflow before and during code changes: orient, baseline, implement, test, verify, and self-review. |
| `session-profiler` | Inspect Claude Code or Codex JSONL sessions, including subagents, timing, errors, token usage, estimated cost, and Perfetto traces. |

Each skill lives in `skills/<name>/SKILL.md`. Some skills also include scripts,
reference material, or agent definitions used by the workflow.

## Requirements

- macOS, Linux, or Windows with PowerShell
- Claude Code and/or Codex, depending on where you want to use the skills
- Python 3 for the `lead` model-routing helper and the `session-profiler` tools
- Optional: Codex CLI for `lead` builder jobs that use Codex as a backend

Install Codex CLI if you want that optional builder backend:

```bash
npm i -g @openai/codex@latest
```

## Installation

Clone or copy this repository, then run the installer from the repository root.

### macOS and Linux

Install for the current user:

```bash
./install.sh
```

Install only into the current project:

```bash
./install.sh --project
```

### Windows

Install for the current user:

```powershell
./install.ps1
```

Install only into the current project:

```powershell
./install.ps1 -Project
```

The installer copies every folder under `skills/` into the matching skill
directories for the selected install mode:

- Claude Code user skills: `~/.claude/skills`
- Codex user skills: `${CODEX_HOME:-~/.codex}/skills`
- Project-local Claude skills: `.claude/skills`
- Project-local Codex skills: `.codex/skills`

It also installs the `lead` builder and reviewer agents into the matching
`.claude/agents` directory.

Restart your agent session after installing so the new skills are discovered.

## Usage

Invoke a skill by name from your agent session.

Claude Code examples:

```text
/lead Build the smallest version of this feature and open a PR.
/validate-market Audit this project idea before I spend another week on it.
/session-profiler Profile my latest Claude Code session and explain where the time went.
```

Codex examples:

```text
$async-learning-teacher Teach me this paper step by step: https://arxiv.org/abs/...
$code-standards Apply the project workflow while fixing this bug.
$session-profiler Profile my latest Codex session, including subagents and cost.
```

You can also copy one skill folder by itself into your own skills directory if
you do not want the full collection.

## Model Routing For `lead`

The `lead` and `lead-research` skills can route roles such as lead, builder,
reviewer, researcher, scout, and critic to different models.

Inspect the effective routing:

```bash
python skills/lead/config.py
python skills/lead/config.py --role builder
python skills/lead/config.py --check
```

Defaults live in:

- `skills/lead/config.py`
- `skills/lead/models.json`

Override routing per repository with `.lead/config` or globally with
`~/.lead/config`.

## Session Profiler CLI

The `session-profiler` skill includes a command-line wrapper that creates and
manages its own Python environment on first use.

After installation, choose the wrapper for your agent:

```bash
# Claude Code install
SP="$HOME/.claude/skills/session-profiler/scripts/sp"

# Codex install
SP="${CODEX_HOME:-$HOME/.codex}/skills/session-profiler/scripts/sp"
```

Find and inspect sessions:

```bash
$SP list --provider claude --n 20
$SP list --provider codex --n 20
$SP find <session-id-prefix>
$SP info <session-id-or-jsonl-path>
```

Parse a session and run common analyses:

```bash
$SP parse <session-id-or-jsonl-path>
$SP agent-summary
$SP costs
$SP slowest-tools --n 20
$SP errors
$SP turns
```

Generate richer artifacts:

```bash
$SP toc
$SP review
$SP trace
$SP open
```

Cost reports are estimates based on public model pricing, not billing records.
Session files and traces can contain prompts, code, file paths, and sensitive
project context. Review artifacts before sharing them.

## Repository Layout

```text
skills/
  async-learning-teacher/   SKILL.md, README, and optional agent config
  code-standards/           disciplined engineering-change workflow
  lead/                     autonomous build-loop skill, routing, and scripts
  lead-research/            research harness and source tactics
  session-profiler/         transcript parser, analyses, and trace exporter
  validate-market/          market validation audit workflow
  write-blog/               blog writing workflow and voice references
assets/
  readme-hero.png           README hero banner
.claude/agents/             lead-builder and lead-reviewer agent definitions
install.sh                  macOS/Linux installer
install.ps1                 Windows installer
```

## Creating Your Own Skill

Add a new directory under `skills/`:

```text
skills/my-skill/
  SKILL.md
```

Use frontmatter at the top of `SKILL.md`:

```markdown
---
name: my-skill
description: Explain when an agent should use this skill.
---

# My Skill

Write the workflow, rules, examples, and expected output here.
```

Then reinstall:

```bash
./install.sh
```

Keep skills portable when possible:

- Avoid hard-coding a company, repository, branch, or tool unless the skill is
  intentionally private.
- Put reusable scripts beside the skill instead of relying on global shell state.
- Include examples that show the exact type of request the skill should handle.
- Keep sensitive credentials, tokens, and private data out of the skill folder.

## Adapting This Repository

If you are using this as a template:

1. Delete any skills you do not need.
2. Rename or rewrite skill descriptions so they match your own workflows.
3. Run the installer with `--project` while testing.
4. Move to user-level installation once the skills are stable.
5. Share only the skills that are generic enough for others to reuse safely.

## License

Add the license that matches how you want others to use this collection before
publishing it broadly.
