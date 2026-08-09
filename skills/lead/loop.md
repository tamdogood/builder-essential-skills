# Factory-loop reference

The loop is a sequence of Lead decisions around agent events. The Lead spawns,
waits, messages, and rules; agents inspect, write, run, review, and integrate.
There is no direct-execution escape hatch.

## Event loop

1. Spawn an Operator to compute the ready set from tracker and git evidence and
   check `docs/STOP` / `docs/PAUSE`.
2. Dispatch ready Builders up to the canary-proven concurrency limit. Use only
   disjoint mutable ownership plus runtime-provided isolation or
   Integrator-created worktrees. Otherwise serialize writers.
3. Wait on native completion notifications. Missing completion handles are a
   preflight hard stop.
4. Rule on each typed event:
   - `STATUS: COMPLETE*` -> spawn a fresh Reviewer immediately.
   - `STATUS: BLOCKED` -> decide from evidence, have an Integrator record the
     ruling, then spawn a fresh Builder with the answer.
   - `REVIEW: PASS` -> spawn an Integrator to commit, merge, rerun checks, and
     close the issue.
   - `REVIEW: FAIL` -> spawn a diagnostic Planner or Researcher; revise the
     input through a fresh author, then spawn a fresh Builder.
   - `REVIEW: INVALID` -> repair the measurement through a Check author or
     runtime capability fix; do not treat unmeasured work as passing.
   - suspected stall -> ask an Operator for process/worktree evidence, then
     choose WAIT, STOP, or fresh-agent RESPAWN.
   - integration conflict -> send the evidence to a Planner for re-slicing. The
     Lead and Integrator never hand-resolve code conflicts.
5. After integration, spawn an Operator to recompute the ready set. Do not wait
   for a wave boundary; newly unblocked jobs start as soon as a slot is free.
6. Repeat until every issue is closed or a hard stop is recorded.

Reviewers run as soon as their Builders finish and may run concurrently in the
corresponding isolated worktrees. Integrations remain serial and rerun checks in
a clean integration checkout. The critic pass remains serial because it
evaluates the whole plan.

## Evidence rules

- Agent status is valid only when the promised report ends in its typed status
  line and names the artifact paths it produced.
- Reviewer verdicts require check-integrity, per-check, and diff-vs-intent
  evidence. The Lead cannot fill missing fields from memory.
- The Integrator records every authorized external mutation and resulting SHA or
  URL. No evidence means no integration.
- Post-freeze Lead rulings are written append-only by an Integrator to
  `docs/jobs/<issue-slug>-rulings.md` before review.
- A completed job with no independent verdict cannot unblock downstream work.

## Failure ladder

First FAIL: give the review evidence to one diagnostic Planner or Researcher.
Have a fresh author repair the spec, check, context, or boundary, then spawn a
fresh Builder.

Second FAIL after a real intervention: spawn a Planner to re-decompose the slice
or escalate it in the digest. Three failures at one seam are architecture
evidence; stop patching and ask the Planner for a structural alternative.

Never respond to failure by changing providers, silently increasing model tier,
having the Lead patch code, or letting the Builder grade a retry.

## Status and monitoring

For status questions, spawn an Operator with the repository root, tracking
issue, and live-agent identifiers. It reconciles tracker, reports, git, and live
agent state into a compact tree with path/issue/SHA evidence. Print that tree
verbatim before any Lead interpretation.

Native wait is the completion mechanism. On a suspected stall, an Operator
reports process, worktree, and report-growth evidence; it never kills or judges.
The Lead never polls, runs commands, kills a process, or edits a worktree.
Those actions require an Operator or Integrator with explicit authorization.

## Hard stops

Stop on: an active STOP/PAUSE policy; irreversible action; missing independent
review; check-file mutation; two consecutive killed attempts; a blocker that
contradicts an approved assumption; scope growth; failed tracker preflight;
degraded session context; or loss of native subagent delegation.

## Context discipline

Keep the Lead thin. Grounders summarize repository state, Reviewers inspect
diffs, Operators inspect processes, and Integrators mutate external state. Git,
tracker entries, frozen checks, rulings, and reports are durable memory. A new
Lead session resumes by spawning a Grounder, never by trusting chat history.
