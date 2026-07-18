<p align="center">
  <img src="assets/readme-hero.png" alt="An abstract field of colorful signal ribbons representing reusable AI agent skills" width="100%">
</p>

<h1 align="center">AI Agent Skills</h1>

<p align="center">
  <strong>Reusable workflows that help Claude Code and Codex do sharper work.</strong><br>
  Plan, build, research, learn, validate, write, and review without starting from zero each time.
</p>

<p align="center">
  <a href="#get-started">Get started</a> ·
  <a href="#pick-a-skill">Pick a skill</a> ·
  <a href="#bring-your-own-workflow">Create a skill</a>
</p>

## Why this exists

An AI agent is much more useful when it has a repeatable way to handle the
work. This collection packages practical workflows as portable skills: compact
instructions, scripts, references, and agent definitions that you can install,
adapt, and share.

Use the whole collection, or take only the skills your team needs.

## Get started

From the repository root, install every skill for the current user:

```bash
./install.sh
```

On Windows:

```powershell
./install.ps1
```

Restart Claude Code or Codex, then invoke a skill in plain English:

```text
/lead Build the smallest version of this feature and open a PR.
$async-learning-teacher Teach me this paper step by step: https://arxiv.org/abs/...
```

Want to try the collection inside one repository first? Install it locally
instead:

```bash
./install.sh --project
```

```powershell
./install.ps1 -Project
```

The project install uses `.claude/skills` and `.codex/skills`, so it stays
with that repository rather than changing your user-level setup.

## Pick a skill

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="skills/lead/SKILL.md"><img src="assets/skill-cards/lead.svg" alt="lead — build and delivery skill" width="100%"></a>
    </td>
    <td width="50%" valign="top">
      <a href="skills/lead-research/SKILL.md"><img src="assets/skill-cards/lead-research.svg" alt="lead-research — research and strategy skill" width="100%"></a>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="skills/async-learning-teacher/SKILL.md"><img src="assets/skill-cards/async-learning-teacher.svg" alt="async-learning-teacher — learning skill" width="100%"></a>
    </td>
    <td width="50%" valign="top">
      <a href="skills/validate-market/SKILL.md"><img src="assets/skill-cards/validate-market.svg" alt="validate-market — product and market skill" width="100%"></a>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="skills/write-blog/SKILL.md"><img src="assets/skill-cards/write-blog.svg" alt="write-blog — writing and growth skill" width="100%"></a>
    </td>
    <td width="50%" valign="top">
      <a href="skills/orwell-writing/SKILL.md"><img src="assets/skill-cards/orwell-writing.svg" alt="orwell-writing — direct writing skill" width="100%"></a>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="skills/code-standards/SKILL.md"><img src="assets/skill-cards/code-standards.svg" alt="code-standards — engineering quality skill" width="100%"></a>
    </td>
    <td width="50%" valign="top">
      <a href="skills/session-profiler/SKILL.md"><img src="assets/skill-cards/session-profiler.svg" alt="session-profiler — developer tools skill" width="100%"></a>
    </td>
  </tr>
</table>

Every skill lives in `skills/<name>/SKILL.md`. Some also ship scripts,
reference material, or agent definitions that support the workflow.

## What gets installed

The installers copy each folder in `skills/` to the right location for your
agent and install the `lead` builder and reviewer agents for Claude Code.

| Install mode | Claude Code | Codex |
| --- | --- | --- |
| User | `~/.claude/skills` | `${CODEX_HOME:-~/.codex}/skills` |
| Current project | `.claude/skills` | `.codex/skills` |

You will need Claude Code and/or Codex, depending on which agent you use.
Python 3 is required for the `lead` routing helper and the
`session-profiler` tools. The Codex CLI is optional, but `lead` can use it for
builder jobs:

```bash
npm i -g @openai/codex@latest
```

## Go deeper

### Route models for `lead`

`lead` and `lead-research` can assign different models to roles such as
lead, builder, reviewer, researcher, scout, and critic. Inspect the active
routing before a run:

```bash
python skills/lead/config.py
python skills/lead/config.py --role builder
python skills/lead/config.py --check
```

Defaults live in `skills/lead/config.py` and `skills/lead/models.json`. Use
`.lead/config` for a repository override or `~/.lead/config` for a personal
default.

### Profile an agent session

After installation, point `SP` at the wrapper for your agent:

```bash
# Claude Code install
SP="$HOME/.claude/skills/session-profiler/scripts/sp"

# Codex install
SP="${CODEX_HOME:-$HOME/.codex}/skills/session-profiler/scripts/sp"
```

Then explore your sessions:

```bash
$SP list --provider codex --n 20
$SP info <session-id-or-jsonl-path>
$SP parse <session-id-or-jsonl-path>
$SP review
$SP trace
```

Cost reports are estimates based on public model pricing, not billing records.
Session files and traces can include prompts, code, file paths, and other
sensitive project context. Review them before sharing.

## Repository map

```text
skills/                  The skill collection
  <skill>/SKILL.md        Each skill's entry point and workflow
assets/readme-hero.png    README banner
.claude/agents/          Builder and reviewer agents for lead
install.sh                macOS/Linux installer
install.ps1               Windows installer
```

## Bring your own workflow

Start with one folder:

```text
skills/my-skill/
  SKILL.md
```

Give `SKILL.md` clear frontmatter and a focused workflow:

```markdown
---
name: my-skill
description: Explain when an agent should use this skill.
---

# My Skill

Write the workflow, rules, examples, and expected output here.
```

Keep skills easy to move between projects:

- Avoid hard-coding a company, repository, branch, or tool unless the skill is intentionally private.
- Put reusable scripts beside the skill instead of relying on global shell state.
- Include request examples that show exactly when the skill should run.
- Never put credentials, tokens, or private data in a skill folder.

Re-run the installer after adding or changing a skill:

```bash
./install.sh
```

## License

Add the license that matches how you want others to use this collection before
publishing it broadly.
