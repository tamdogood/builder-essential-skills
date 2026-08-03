# Continuous Experiment Protocol

Use this protocol only when the repository checkout supplies the Opportunity
Radar harness. It borrows the general research loop from
[karpathy/autoresearch](https://github.com/karpathy/autoresearch): freeze the
evaluation, change a bounded candidate, measure, keep or discard, and repeat.
It does not depend on autoresearch's ML code, GPU, metric, or Git reset loop.

## Runtime contract

Resolve these before executing anything:

```text
RADAR_REPO             absolute path to this repository checkout
RADAR_HARNESS_CONFIG   absolute path to the operator-owned harness config
RADAR_API_URL          console origin, normally loopback on the VPS
RADAR_WRITE_TOKEN      console mutation token, provided only through environment
```

If the harness or Docker is unavailable, record the blocked validation and
continue the literature audit. Do not fall back to host execution.

## One-shot validation

For a single reproduction or check:

1. Create a subject-specific directory beneath the configured
   `workspaceRoot`. Copy only the files needed for this validation.
2. Write a manifest shaped like `harness/experiment.example.json` with a stable
   run ID, subject ID, experiment ID, approved image alias, offline command,
   fixed seed, resource cap, and expected artifacts.
3. Run from `RADAR_REPO`:

```bash
node bin/radar-harness.js run /absolute/path/to/experiment.json \
  --config "$RADAR_HARNESS_CONFIG"
```

4. Read `result.json`, logs, hashes, and produced artifacts. A zero exit code is
   not enough; verify the expected checks and whether the output addresses the
   paper's exact claim.
5. Upload evidence, then publish the `Experiment` and related entities.

Never put API keys, authentication cookies, proprietary datasets, the corpus,
or another subject's files in the input directory. Acquisition happens outside
the sandbox; execution is offline unless the operator explicitly approved
network use.

## Continuous campaign

Use a campaign when several controlled iterations can reduce one important
uncertainty. Good campaigns have a stable question, fixed evaluation contract,
comparable budget, bounded mutable surface, and explicit stop or kill rule.

Do not start a campaign merely because code is available. First state:

- the paper or opportunity claim being tested;
- the candidate surface that may change;
- the evaluator files and command that must remain protected;
- validity checks and boundary conditions;
- the primary metric and direction, if a scalar comparison is honest;
- per-attempt compute and time limits;
- the maximum total iterations;
- what result changes the paper verdict or opportunity decision.

Build a program from `harness/campaign.example.json`, then:

```bash
node bin/radar-harness.js campaign init /absolute/path/to/program.json \
  --config "$RADAR_HARNESS_CONFIG"

node bin/radar-harness.js campaign status <campaign-id> \
  --config "$RADAR_HARNESS_CONFIG"

node bin/radar-harness.js campaign run <campaign-id> \
  --config "$RADAR_HARNESS_CONFIG"

node bin/radar-harness.js campaign decide <campaign-id> \
  --decision <keep|discard|inconclusive> \
  --reason "<evidence-grounded reason>" \
  --config "$RADAR_HARNESS_CONFIG"
```

The first run uses the unchanged seed and establishes the baseline. After it is
accepted, repeat this bounded loop:

1. read campaign status and the prior attempt evidence;
2. propose one interpretable change and write the hypothesis before editing;
3. edit only the declared candidate path;
4. run one fresh sandbox attempt;
5. inspect the evaluator, uncertainty, validity checks, logs, and artifacts;
6. issue one reasoned decision before making another edit;
7. publish the attempt and decision to the console;
8. continue until the per-session iteration budget, campaign limit, kill rule,
   or a genuine blocker is reached.

For unattended Hermes operation, default to at most three campaign iterations
per cron invocation. Persist after each decision so the next fresh session can
resume. Continuous means cumulative across scheduled sessions, not an
unbounded process that can hide failures or spend without limit.

The harness automatically restores the last accepted snapshot after `discard`
or `inconclusive`. It refuses another run while an attempt awaits a decision,
and it refuses edits outside the declared mutable paths. Do not bypass either
guard.

## Generic evaluator

The required evaluation artifact is JSON with:

```json
{
  "schemaVersion": 1,
  "status": "valid",
  "summary": "What the fixed evaluator observed.",
  "metrics": [
    { "name": "primary_score", "value": 0.81, "unit": "normalized" }
  ],
  "checks": [
    { "name": "prespecified validity check", "status": "pass" }
  ],
  "limitations": ["The tested boundary is narrower than the paper's broad claim."]
}
```

Use `minimize`, `maximize`, or `target` only for a stable comparable metric.
Leave `primaryMetric` out of the program for qualitative or multi-objective
work. The harness will request review instead of collapsing incomparable
evidence into a false number.

For physics and other experimental sciences, sandbox simulation, numerical
analysis, calibration calculations, or analysis of already-authorized data.
Do not automate physical equipment, hazardous procedures, human-subject work,
or regulated action. Record those as proposed external experiments with an
owner, approvals, safety constraints, and kill criterion.

## Console publication

Use stable IDs and safe retries. For an upsert or delete, set both a stable
idempotency key and stable timestamp:

```bash
export RADAR_IDEMPOTENCY_KEY="<run-id>:<entity-kind>:<entity-id>:<revision>"
export RADAR_GENERATED_AT="<entity-updatedAt>"
node bin/radar-agent.js upsert <collection> <id> /path/to/entity.json
```

Upload artifacts first. Their console path should include the run, subject,
experiment, and attempt IDs. Then publish one atomic bundle with every related
entity revision. On validation failure, fix the bundle; do not weaken the
schema or delete evidence.

Map campaign data onto `Experiment` fields:

```text
campaignId       durable campaign ID
iteration        campaign iteration number
decision         baseline, keep, discard, or inconclusive
decisionReason   evidence-grounded decision record
metrics/checks   evaluator observations
artifacts/logs   immutable console evidence paths and captured log tails
limitations      boundaries and unresolved confounders
```

A kept iteration means it advanced this campaign under this evaluator. It does
not by itself substantiate a broad scientific claim, establish novelty, or
validate a market.
