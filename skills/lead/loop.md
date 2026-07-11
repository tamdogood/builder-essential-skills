# Factory-loop reference

The loop is one Lead session that runs the factory to completion after approval.
GitHub issues carry coordination state; git carries specs and frozen checks. The
Lead dispatches the ready issues, sleeps, and wakes only on an event.

Parallel rules: reviewers dispatch immediately and run concurrently for every
DONE, never queued behind another review; the ready-issue frontier recomputes on
every merge, not at wave boundaries; independent bookkeeping batches into
parallel calls; merges, synthesis, and the critic pass stay serial by design.

## Factory block procedure

1. **Dispatch the ready issues.** Compute the ready set (every issue whose
   blockers are closed), up to 5 builder jobs plus one watchdog (see `dispatch.md`
   "## Watchdog dispatch"). Check `docs/STOP` and `docs/PAUSE` before every wave.
2. **Sleep.** Zero Lead work between dispatch and the next event — no polling.
3. **Wake on exactly one event:**
   - **Job DONE.** Send the fixed reviewer template to one fresh reviewer; record
     the verdict as an issue comment; merge on PASS, diagnose on FAIL.
   - **Job BLOCKED.** A blocker comment is a completion event. Read it, rule an
     answer, and respawn a fresh builder with the answer in its spawn context
     (`dispatch.md` "## Respawn-with-answer template"). A running job never
     re-reads its own comments — the spawn context is the only delivery channel.
   - **Watchdog ANOMALY.** Read the evidence and rule one of: healthy-long-run
     (relaunch the watchdog, sleep again), needs a nudge or answer, or wedged
     (kill the job, discard its worktree, respawn from the frozen check with a
     route-around).
4. **Recompute the ready set.** Closing an issue may unblock others.
5. **Repeat** until no issues remain open, then post the end-of-run digest.

## Watchdog protocol

Launch the script watchdog at wave dispatch; its typed exit wakes the Lead.

- Exit 0 `ALL_DONE` -> proceed to the review backlog for every report listed by
  path and byte size.
- Exit 2 `INTEGRATED` -> benign mid-sweep integration; relaunch if jobs remain.
- Exit 3 `STALL` -> run the rescue ladder: inspect the named job, kill stuck
  children if needed, discard a wedged worktree, and respawn from the frozen
  check with a route-around.
- Exit 4 `REPEAT` -> rule intentional-vs-stuck before acting; deliberate polling
  loops are a known false positive.

Backends without background-exit notifications use the LLM fallback template in
`dispatch.md`; it keeps the same detection-only boundary and per-job evidence.

## Verdict comments

Judgment is recorded on the issue, not in a file. One comment per reviewed job
carries: per-check PASS/FAIL/INVALID, a checks-integrity verdict, a
diff-vs-intent verdict, the slice call, and the decisive reason tied to raw
evidence (exact `gh` command in `dispatch.md` "## Issue conventions"). The
reviewer's intent context is exactly the frozen check file, the spec, the job
report, and `docs/jobs/<issue-slug>-rulings.md`. That rulings file is Lead-owned,
append-only, and committed before reviewer dispatch. No verdict comment on an
issue means the next block must not build on it as accepted; you may re-run review
with a fresh reviewer if evidence is missing, but may not fill in a verdict from
memory. The issue closes on merge.

## Failure ladder

First FAIL on an issue: diagnose from the reviewer's evidence (not the full
diff), optionally fan out researchers (`research.md`) to inform the diagnosis,
fix the input — issue text, missing context, or a forbidden-pattern note — and
respawn a fresh builder at the same tier. Tier is set once, at decomposition, and
never changes because a job failed. Second FAIL on the same issue after an
intervention: re-decompose the issue or escalate to the digest. A merge conflict
is a decomposition failure, not a build failure: kill the conflicting job and
re-slice; never hand-resolve builder conflicts.

## Escalation digest

Batched on the tracking issue instead of interleaved per-job noise: completed and
failed jobs with verdicts; open blockers and the answers given; decisions the
approved spec genuinely does not answer. Ask-the-human items are batched here
unless a hard stop requires an immediate stop.

## Hard stops

| Situation | Hard stop |
|---|---|
| `docs/STOP` exists | Stop before dispatching the next wave. |
| `docs/PAUSE` exists | Finish in-flight jobs; dispatch nothing new; ask the human. |
| No verdict comment for completed work | Do not build on it as accepted. |
| Builder touched `docs/checks/` | Automatic FAIL for that job. |
| Merge conflict | Decomposition failure: kill the job, re-slice. |
| Second FAIL on the same issue | Re-decompose or escalate to the digest. |
| Two consecutive KILLs | Stop the factory and ask the human. |
| Watchdog reports an anomaly | Rule on it before any further dispatch on that job. |
| Blocker collides with a recorded assumption | Ask the human; a spec decision surfacing late. |
| Session context degrades | End the session; the next session grounds from the tracker and git. |
| Scope grows beyond the approved spec | Stop the factory. |
| High-stakes issue | Add cross-model review before CONTINUE. |

## Context discipline

- Delegate heavy reading to reviewer, watchdog, or builder subagents; the Lead
  stays thin and never reads a full diff directly.
- The tracker and git are the memory: specs, frozen checks, verdict comments, and
  job reports carry state across sessions, not the conversation.
- Compact proactively when the harness supports it. Ending a degraded session is
  free because the tracker and git are the memory.
