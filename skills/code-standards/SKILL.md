---
name: code-standards
description: >-
  Apply a disciplined engineering workflow to any code change. Use whenever
  implementing a feature, fixing a bug, or refactoring — before writing code,
  not after. Walks orient → baseline → smallest change → test → verify →
  self-review, and enforces language-agnostic hard gates (don't mass-reformat,
  keep the linter and type-checker clean, keep the build and tests green, make
  interface changes additive, protect security invariants).
compatibility: claude-code
---

# Code standards — the change workflow

You are making a code change. This skill is the execution order; it is
stack-agnostic. Adapt every command to the project's actual toolchain: read the
project's own docs (README, CONTRIBUTING, `AGENTS.md`/`CLAUDE.md`, a Makefile or
package scripts) once to learn its build, test, lint, and format commands before
you start.

## Steps

1. **Orient.** Read any project lessons/gotchas file (e.g. `tasks/lessons.md`) and obey it.
   Find and read the one doc for the subsystem you're changing, not the whole tree.
2. **Plan if non-trivial** (3+ steps or an architectural choice): short plan in `tasks/todo.md` —
   files touched, tests to add, risks. Going sideways → stop and re-plan.
3. **Baseline:** get the project's build + test command green *before* touching anything. A
   pre-existing red is the first task; never build on top of a broken baseline.
4. **Implement** the smallest root-cause change. Hand-match the surrounding style.
   **Don't run a mass auto-formatter** on files you touch; it buries your real diff in noise.
5. **Test:** new behavior gets a test that fails without the change; security gates get
   negative-assertion tests (wrong token → denied, state unchanged, no data leak).
6. **Verify:** run the full check suite (build + lint + type-check + tests) until green
   before you call it "done".
7. **Self-review** your own diff as if it were someone else's PR (or invoke a review
   skill). Fix findings before presenting.
8. **Close out:** update docs in the same change; append to a lessons file if you were
   corrected or surprised; write a conventional commit message (`feat|fix|docs(scope): …`).

## Tripwires — stop and re-check the project's guidelines when you're about to…

- change a public or shared interface (API, wire format, schema) → check every caller; prefer additive changes
- add a dependency → weigh transitive weight and licenses, and whether the stdlib already covers it
- touch auth, tokens, or permissions → audit every writer and reader path, add negative tests
- write a secret to disk → use the platform's atomic create-private API, never write-then-chmod
- hold a lock across an `await`/blocking call, or read env inside logic → extract a pure decision function

## No-progress guard

The same failure surviving two fix attempts means stop: write the finding to your lessons
file, mark the item `[BLOCKED]`, and surface it. Don't thrash.
