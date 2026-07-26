---
name: run-smoke-tests
description: Inspect an unfamiliar repository, interpret a broad Markdown user journey at runtime, operate the real product through its supported web, API, CLI, desktop, or mobile surface, and produce an auditable pass, fail, or blocked judgment with screenshots, logs, recordings, and a step timeline when available. Use when asked to run smoke tests, validate an end-to-end user journey, dogfood a product, test a release candidate, or execute a non-deterministic workflow that may include authentication or human checkpoints. Do not use as a substitute for deterministic unit, integration, or scenario tests.
---

# Run Smoke Tests

Execute a broad user journey against a real build and leave enough evidence for
a person to audit the judgment. Understand the host project before starting the
product or touching its state.

## Operating contract

- Treat the Markdown as runtime instructions, not source to compile into code.
- Test through a supported user-facing surface: web UI, API, CLI, desktop,
  mobile, or a documented combination.
- Separate execution from repair. Do not edit the product, tests, or journey
  during a run. Finish the report before starting any requested fix.
- Default to local, test, preview, or staging environments. Never mutate
  production, spend money, send real invitations, or change real user data
  without explicit authorization.
- Make every pass or fail claim traceable to captured evidence.
- Keep the first failed run. Do not erase evidence by retrying until green.

## Workflow

### 1. Pass the repository-understanding gate

Read the nearest repository instructions, product README, runbook,
contribution guide, manifests, launch scripts, existing smoke or end-to-end
tests, and the smallest relevant product documentation. Search for auth setup,
seed data, test accounts, feature flags, observability, artifact conventions,
and cleanup commands. Trace the journey across the relevant UI, service, state,
and external-system boundaries so failures can be attributed to the right part
of the product.

Before launching anything, be able to state:

```text
product and user surface:
authoritative journey source:
relevant architecture and system boundaries:
build and start commands:
target environment and data boundary:
interaction driver or available tools:
authentication and human checkpoints:
evidence capture capabilities:
safe cleanup path:
known abort conditions:
```

Do not guess missing commands, URLs, credentials, or permissions. If a missing
item blocks safe execution, report it as a preflight blocker.

### 2. Validate the journey contract

Read [references/smoke-format.md](references/smoke-format.md). Normalize supplied
prose without silently adding product behavior.

Confirm that the journey:

- represents one coherent user goal;
- names its environment and allowed mutations;
- defines critical and noncritical oracles;
- identifies authentication, payment, security, or destructive checkpoints;
- has a cleanup or quarantine plan;
- names conditions that require an immediate abort.

Move small deterministic behaviors into scenario tests. Keep smoke coverage for
the larger path and the seams between systems.

### 3. Preflight without changing product behavior

Build or launch the product with documented commands. Confirm health, test-data
availability, driver connectivity, recording support, and enough storage for
artifacts.

Prefer the repository's existing artifact directory. Otherwise use
`.context/smoke-runs/` when `.context` already exists; if it does not, create a
temporary directory and report its absolute path. Do not add generated evidence
to version control unless the user asks.

Create a run manifest containing:

```text
journey ID and source path
commit or build identifier
environment and base URL or executable
start time and executor
human checkpoints
recording and log sources
```

Abort before step one when the build is unhealthy, the environment is wrong,
the account or data boundary is unsafe, or required evidence capture is
unavailable for a critical oracle.

### 4. Interpret and execute the Markdown

Follow the journey in order through the real product surface. For each step,
record:

```text
timestamp
instruction
action taken
observable result
evidence path or log reference
provisional judgment
deviation, latency, or uncertainty
```

Use normal user affordances. Do not call internal APIs to bypass UI steps unless
the journey explicitly tests an API or uses setup APIs only for isolated
fixtures.

Pause at a declared human checkpoint. State the exact action needed and resume
from the same state after the human completes it. Never request that a user
paste secrets into chat.

If the driver supports video, record the complete run and generate subtitles or
a timestamped transcript from the step timeline. Otherwise capture screenshots,
terminal output, structured logs, and state snapshots. Do not claim to have a
video when the environment cannot produce one.

### 5. Judge once, retry carefully

Assign one primary result:

- `PASS`: every critical oracle was observed and no abort condition occurred;
- `FAIL`: a critical oracle was violated or an unexpected product error
  prevented the goal;
- `BLOCKED`: an external prerequisite, permission, environment, or human
  checkpoint prevented a valid judgment.

Add `FLAKY` as a flag when the same build and inputs produce inconsistent
results.

Do not convert missing evidence into a pass. A noncritical issue may preserve a
pass only when the report calls it out separately.

Retry at most once, and only when evidence points to an environmental or driver
failure rather than a product failure. Preserve both runs and explain why the
retry was allowed.

### 6. Clean up and hand off

Run only the cleanup authorized by the journey. If cleanup fails, quarantine
the test data, record identifiers, and report the residue. Do not hide a
cleanup failure behind a passing product judgment.

Write a report with:

1. result, confidence, build, environment, and duration;
2. a timestamped step table;
3. critical oracle results with evidence links;
4. human checkpoints and deviations;
5. console, network, log, screenshot, and recording locations;
6. cleanup result and residual data;
7. candidate deterministic tests exposed by the run.

The final user message must distinguish product failures, test-environment
failures, and uncertain judgments.

## Demonstration examples

- [SaaS team onboarding](examples/saas-team-onboarding.smoke.md), including an
  authentication checkpoint and a
  [sample audited report](examples/saas-team-onboarding.sample-report.md).
- [Developer CLI first run](examples/developer-cli-first-run.smoke.md), covering
  installation, authentication, recovery from invalid configuration, and
  cleanup in an isolated project.

Use the examples to demonstrate runtime interpretation. Replace every command,
URL, account, and expected result with evidence from the host repository.

## Failure handling

- Product cannot start: capture build and launch output, mark `BLOCKED`, and do
  not improvise a different environment.
- Authentication unavailable: pause at the checkpoint or mark `BLOCKED`; never
  bypass it with unapproved credentials.
- Product behavior diverges from the Markdown: preserve evidence and mark
  `FAIL` unless the behavior source is genuinely contradictory.
- Evidence capture fails mid-run: abort when it affects a critical oracle;
  otherwise continue with the limitation visible.
- A defect is found: finish the report first. Diagnose or fix only under a
  separate user request.
