# Dispatch reference

Dispatch turns a frozen slice into fresh builder, reviewer, or critic work. The
Lead chooses the job shape, the model tier, the worktree, and the report path;
the subagent receives a self-contained task and returns raw evidence only.

## Model routing

Every role — `lead`, `builder`, `reviewer`, `researcher`, `scout`, `critic` — is
an independent slot resolved by `skills/lead/config.py`. The "submodel" of a role
is its reasoning effort. Do not hand-parse config; run the resolver and use what
it prints:

```bash
python skills/lead/config.py            # table of the effective routing
python skills/lead/config.py --role builder   # one role, with its command
python skills/lead/config.py --check    # verify each provider CLI is on PATH
```

Resolution order per role: repo `.lead/config`, then `~/.lead/config`, then the
shipped defaults in `config.py`. A role value is `<provider>/<model>[:<effort>]`,
a user-defined `alias`, or the sentinel `inherit-lead`. The provider registry
(`skills/lead/models.json`, extendable via `.lead/models.json`) maps a provider's
model aliases to real model ids and prints the exact CLI command — this is the
single place a model-generation change is reviewed. Full grammar: `MODELS.md`.

Defaults (see `config.py`): `lead = claude/fable:xhigh` (the leading model),
`reviewer = inherit-lead`, `builder = codex/best:xhigh`, `researcher =
codex/best:high`, `scout = codex/best:low`, `critic = claude/fable:high`.

Rules that always hold:

- **Tier is fixed at decomposition** by config plus dispatch rules; a job failure
  never moves it. A failure is a diagnosis task, not a retry-at-a-stronger-model
  task (see `loop.md` "## Failure ladder").
- **Codex-first builder fallback.** If the resolved builder's Codex CLI is not on
  PATH at preflight (`config.py --check` flags this), fall back to
  `claude/sonnet:high` and write one tracking-issue comment naming requested vs
  substituted. Never hard-fail on model availability alone.
- **Dispatch rules** (`when <task-class> -> <spec>`) route recipe-like work to a
  cheaper tier or ambiguous work to a deeper one; the resolver lists them. A
  matching rule is a judgment aid — record which rule you used and override with a
  reason on the issue when needed.
- **Cross-family review** for high-stakes slices reduces shared blind spots. When
  both CLIs are installed, prefer the reviewer be a different family than the
  builder, and record the direction in the verdict comment.

## Per-harness delegation

| | Claude Code | Codex |
|---|---|---|
| Builder | Agent tool with `.claude/agents/lead-builder.md`; `disallowedTools` denies git commit/push; `isolation: worktree`; run in background; model passed per invocation from the resolver. Verify `git worktree list` after each spawn; never run two Claude-backend builders concurrently without verified separate worktrees. Never pre-create a worktree for a Claude-backend job. | `codex exec` per the resolver's builder command; the Lead owns worktree creation via git. |
| Reviewer | Agent tool with `.claude/agents/lead-reviewer.md`; read-only tools plus a shell for check commands; lead tier via `model: inherit` or a per-invocation model. | Fresh `codex exec --sandbox read-only` with the fixed reviewer template. |
| Watchdog | Background `watchdog.sh` / `watchdog.ps1` whose exit wakes the Lead; the LLM fallback template only when the harness cannot wake on a process exit. | Same script watchdog. |
| Critic | One fresh read-only subagent over the whole decomposition, pre-freeze. | Same. |

Job and reviewer reports must name which executor (Bash or PowerShell) ran each
check command; some sandboxes strip one shell.

## Codex backend from a Claude Lead

When the Lead is Claude Code and the builder backend is Codex, write the builder
block to a file first, then pass it via stdin (`-`) — big prompt blocks contain
quotes that shells can mangle. Take the exact per-role command from
`config.py --role builder`; the effort pin is the only thing that changes for a
tier-down.

Single job in the current checkout:

```bash
codex exec -C <repo-root> --sandbox workspace-write \
  -m <model-id> -c model_reasoning_effort="<effort>" \
  --json -o .lead/last-run.md \
  - < .lead/dispatch-block.md
```

For 2–5 jobs, the Lead owns the worktree and runs them in parallel:

```bash
git -C <repo-root> worktree add .lead/wt/<slice>-<NN> -b job/<slice>-<NN> <freeze-sha>

codex exec -C <repo-root>/.lead/wt/<slice>-<NN> --sandbox workspace-write \
  -m <model-id> -c model_reasoning_effort="<effort>" \
  --json -o .lead/wt/<slice>-<NN>.last-run.md \
  - < .lead/wt/<slice>-<NN>.block.md
```

A worktree's `.git` is sandbox-protected; builders cannot commit or touch shared
history from any job.

## Integration commands

Integration is Lead-only, after per-job post-flight passes. For Claude-backend
jobs, commit inside the harness's auto-created worktree, then merge that branch:

```bash
git -C <repo-root> checkout -b slice/<name> <freeze-sha>
git -C <repo-root>/.lead/wt/<slice>-<NN> add -A
git -C <repo-root>/.lead/wt/<slice>-<NN> commit -m "job <NN>: <what>"
git -C <repo-root> merge --no-ff job/<slice>-<NN>
<rerun the check commands>
git -C <repo-root> worktree remove .lead/wt/<slice>-<NN>
git -C <repo-root> branch -d job/<slice>-<NN>
```

A merge conflict means the plan was not disjoint. Kill the conflicting job and
re-slice; never hand-resolve builder conflicts.

## Reviewer template

Send this as-is except for the placeholders. Add no slice-specific prose,
encouragement, summaries, or interpretation. Intent context is pointer-only.

<!-- lead-reviewer-template:start -->
```text
Frozen check file path: docs/checks/<slice>.md
Freeze commit SHA: <freeze-sha>
Branch to review: <branch>
Spec pointer: <spec path named by the frozen check>
Job report: docs/jobs/<issue-slug>-01.md
Rulings file: docs/jobs/<issue-slug>-rulings.md (absent = no post-freeze rulings)

You are a fresh, read-only reviewer. You did not build this job. Flag only gaps
that affect correctness, the stated requirements, or documented project
invariants -- cite file:line evidence for every finding. No stylistic preferences.

Tree audit: any tracked-file modification during review discards the verdict as
INVALID.

Verdict format:
- Checks integrity: PASS | FAIL | INVALID
  Raw evidence: git diff <freeze-sha>..HEAD -- docs/checks/
- Diff vs intent: PASS | FAIL | INVALID
  Raw evidence: file:line evidence from the diff and the frozen check/spec text
- Per check:
  - <check id>: PASS | FAIL | INVALID
    Command: <exact command from the frozen check>
    Executor: <Bash | PowerShell>
    Raw evidence: verbatim stdout/stderr and exit code
- Slice verdict: PASS | FAIL | INVALID
  Decisive reason: <one sentence tied to raw evidence>
```
<!-- lead-reviewer-template:end -->

Passing checks with wrong code still fails: the diff-vs-intent verdict is not
optional. INVALID means "not measured the way the check specifies" — unmeasured
never equals passed.

## Critic template

One pre-freeze pass over the whole decomposition. Send as-is except placeholders.

<!-- lead-critic-template:start -->
```text
Draft check file path: docs/checks/<slice>.md
Branch: <branch>
Issue bodies: <pasted issue bodies for this plan>

Task: try to falsify this plan. Execute each check command against the current
tree, verify every referenced path/SHA/pointer resolves, and attack each
acceptance criterion and issue body for contradictions and non-falsifiability --
including patterns that collide with repo realities (e.g. a grep pattern matching
the repo's own name). For every file a job deletes or renames, grep the repo for
references and confirm the owning job's boundary covers them or a dependency edge
orders the fix. For every NEW artifact path a job will create, run
`git check-ignore <path>` and flag the plan if it is ignored.

Defect report format:
- <check id or clause>: FALSIFIED | HOLDS
  Evidence: <command run and verbatim output, or file:line>
- Plan findings: <delete/rename reference and ignored-new-path findings, or none>
- Assumptions not evidenced in the repo: <list or none>
```
<!-- lead-critic-template:end -->

## Issue conventions

Claim is a Lead action, never a builder action: the Lead is the single
dispatcher and assigns exactly one issue per job immediately before spawning its
builder. On current backends, builders usually cannot post to issues (Codex has
no network; a Claude subagent may lose its shell), so `MIRROR: LEAD` is the
normal mode — the Lead mirrors status at event boundaries it already occupies.

```bash
gh issue edit <n> --add-assignee "@me"                          # Lead claims, before dispatch
gh issue comment <n> --body "PHASE 0: <disagreements, or what I checked>"
gh issue comment <n> --body "BLOCKED: <exact blocker> + <what I tried>"
gh issue comment <n> --body "STATUS: <the report's exact status line>"
gh issue comment <n> --body "RULING: <decision> - <one line why>"
gh issue comment <n> --body "ANSWER: <blocker answer>"
gh issue comment <n> --body "VERDICT: PASS|FAIL|INVALID - <decisive reason>"
gh issue comment <tracking-issue-n> --body "DIGEST: <batched escalations + run summary>"
```

Comments land at least 1 minute apart, each under 65,000 characters, never one
per commit (GitHub secondary rate limits). A running builder does NOT re-read
issue comments mid-job — the issue is the durable log, not a channel it polls; an
answer reaches a builder only through a fresh respawn's spawn context.

## Watchdog dispatch

The Lead writes one watchdog config JSON per wave, then launches the platform
script as a background process (`watchdog.sh` on POSIX, `watchdog.ps1` on
Windows):

```json
{
  "sweep_sec": 120,
  "stall_after_min": 10,
  "jobs": [
    { "id": "issue-31", "events_file": "<path>", "report_path": "<path>",
      "worktree": "<path>", "duration_hint_min": 0 }
  ]
}
```

The watchdog detects mechanically and never kills, nudges, or judges. It exits
with typed evidence; the Lead rules on it:

| Exit | Prefix | Meaning |
|---|---|---|
| 0 | `WATCHDOG: ALL_DONE` | every job report exists, with path + byte-size evidence |
| 2 | `WATCHDOG: INTEGRATED` | a worktree or events file vanished because the Lead integrated it mid-sweep |
| 3 | `WATCHDOG: STALL` | file growth and process activity both stopped past `stall_after_min` plus any duration hint |
| 4 | `WATCHDOG: REPEAT` | the last four parsed command events were identical and need an intentional-vs-stuck ruling |

A job is DONE only when its report's final non-blank line starts with `STATUS:`.
Report existence alone is not done. Liveness is output-file growth plus
process-tree activity, weighed against any duration hint — never wall-clock alone.

## Monitor fallback template

Use only when the backend cannot wake the Lead from a background process exit; it
counts against the concurrency cap while running.

<!-- lead-monitor-fallback-template:start -->
```text
You are the detection-only fallback monitor for this dispatch wave. You never
kill, nudge, or decide -- you only observe and report evidence.

In-flight jobs:
- Issue #<n>, events <path>, report docs/jobs/<issue-slug>-01.md,
  worktree <path>, duration hint <hint or none>.  (one line per job)

Sweep every ~10 minutes. For each job, check events/report byte growth, process
activity by command-line/worktree match, and repeated identical commands in the
tail. A quiet events file on a single sweep is normal model thinking.

Quiet exit is allowed ONLY when, for every job, you list the report path and byte
size as evidence. If a worktree or events file vanished because the Lead
integrated the job mid-sweep, exit INTEGRATED and list the vanished path. If you
cannot verify something from this sandbox, state what you cannot verify rather
than assuming the job is done. Any stall or repeat concern exits immediately with
the job id, minutes since last growth, process evidence, and a tail excerpt.
```
<!-- lead-monitor-fallback-template:end -->

## Respawn-with-answer template

Respawn-over-resume is the default recovery: a fresh builder spawns into the same
issue's job. The respawn block is built from four pieces — the original issue
body (unchanged), the Lead's answer or ruling (posted as an issue comment first,
copied verbatim into the spawn context), what the previous session completed
(read from its job report and the worktree's actual `git status`/`git diff`,
never assumed), and the unchanged boundaries.

```text
You are resuming issue #<n>. Do not redo completed edits; working-tree edits
survived unless the command output below proves otherwise.

Previous session completed (from docs/jobs/<issue-slug>-01.md and worktree state):
<summary of file:line evidence>.

Lead's answer/ruling (also posted on issue #<n>):
<answer, diagnosis, or rescue root cause>.

Required route-around (sandbox-hang cases only):
- Run exactly: <command with in-workspace temp/cache paths>.
- Run check commands sequentially only.

Boundaries remain:
- MAY TOUCH: <files>
- MUST NOT TOUCH: <files>
- Report path: docs/jobs/<issue-slug>-01.md
- End with exactly one STATUS line.
```

## Builder block template

```text
Execute the spec below. Operating rules:

PHASE 0 - Before any code: reply with your plan and EVERY disagreement you have
with this spec, with reasons, citing real files in this repo. Silent compliance
is a failure. Silent scope additions are a failure. If you have no disagreements,
state what you checked before concluding the spec is sound. Verify the named
APIs/formats/versions against the live dependencies before planning around them.

PHASE 1 - The files under docs/checks/ are read-only at all times; editing them
fails the slice regardless of results.

PHASE 2 - Build YOUR JOB ONLY: exactly the files listed in BOUNDARIES. Files
outside your job belong outside your authority - touching them fails your job. No
placeholder implementations - search the codebase before implementing; full
implementations only. No silent fallbacks or success-shaped defaults - never
swallow an error to make output look right. No unrequested backwards-
compatibility shims. Fail loudly, with context. Exception: fallbacks or compat
code are allowed only when the spec explicitly requests them. Verify your work by
running the job's check commands and record the verbatim output. Do NOT commit -
the Lead commits and merges after verification. Do NOT delete lock files or
escalate privileges if a git command fails; record the exact error and continue.

SANDBOX POLICY - All temp/basetemp/cache paths MUST be inside the workspace
(.lead/tmp/<purpose>); never system temp. Run check commands SEQUENTIALLY. The
spec may declare duration hints for known-long commands; they are context, not
kill ceilings. If a command appears stalled - no output growth and no process
activity well past its hint - record the exact command and stop the job; the
watchdog and Lead own stall handling. A filesystem/sandbox error on a path is
environmental: record it and route around it - never retry the same path.

When done, write your job report to docs/jobs/<issue-slug>-01.md with RAW results
only - tables, numbers, command output - no interpretation. Every status claim
must be backed by a command result from this run. Mirror your final STATUS line
as a comment on your issue when gh is available; otherwise write "MIRROR: LEAD"
in the report and continue. End the report with exactly one status line:
STATUS: COMPLETE | COMPLETE_WITH_CONCERNS (list them) | BLOCKED (exact blocker + what you tried).
Verdicts belong to the reviewer and the human. Persist until your job is handled
end to end.

=== OBJECTIVE (and why) ===
...
=== OUTPUT FORMAT ===
...
=== TOOL GUIDANCE (verification commands; verify-against-reality list) ===
...
=== BOUNDARIES (may touch / must not touch / out of scope) ===
...
=== DISAGREEMENT RULINGS (from last session) ===
...
=== ACCEPTANCE CHECKS (frozen at docs/checks/<slice>.md - read-only) ===
...
```
