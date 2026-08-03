# Experiment harness

The harness executes research code in disposable Docker containers and records
hashed evidence. It supports isolated one-shot validations and resumable
continuous campaigns. It is intentionally field-neutral: the contract cares
about inputs, commands, limits, checks, metrics, and artifacts rather than a
particular model, benchmark, or scientific discipline.

## Trust boundary

The host-side harness is trusted. Paper code, generated validation code, and
downloaded repositories are not. Every attempt receives:

- a fresh copy of exactly one declared input directory;
- a fresh output directory that no other attempt uses;
- an operator-approved image resolved to its exact Docker `sha256` image ID;
- a read-only container root, dropped Linux capabilities, no new privileges,
  a non-root UID, resource limits, and a bounded timeout;
- no host environment except a small explicit allowlist;
- no Docker socket, corpus directory, console data, SSH keys, or cloud
  credentials;
- no Docker daemon log retention; captured stdout and stderr are each capped at
  the lower of 16 MiB or the attempt's output-byte limit;
- no network by default.

The candidate workspace and output directory are the only host mounts for a
normal attempt. The harness rejects path traversal, symlinks, non-regular
files, arbitrary image references, unapproved environment variables, and
network requests that the operator has not enabled.

The harness checks aggregate output bytes and file count while the container
runs and again during evidence collection. A bind-mounted directory is not a
kernel-enforced storage quota, so a hostile process can briefly outrun the
monitor. Put `dataRoot` on a dedicated quota-limited filesystem if experiments
must be unable to consume space needed by other campaigns or host services.

Docker is an isolation boundary, not a proof that an experimental conclusion
is true. A malicious kernel exploit, a dishonest evaluator, physical lab work,
or access to protected data is outside this harness's guarantee. Run it under a
dedicated VPS account with rootless Docker when possible.

## Bootstrap

From the repository root on the VPS:

```bash
node bin/radar-harness.js init \
  --config /etc/opportunity-radar/harness.json \
  --data-root /var/lib/opportunity-radar/harness \
  --workspace-root /srv/opportunity-radar/experiments

node bin/radar-harness.js build-image \
  --config /etc/opportunity-radar/harness.json \
  --alias science

node bin/radar-harness.js doctor \
  --config /etc/opportunity-radar/harness.json
```

`build-image` builds [image/Dockerfile](image/Dockerfile), inspects the local
image, and writes the exact ID into the operator config. Later runs fail closed
if the image tag points at different bytes. Review Dockerfile changes before
building a new approved image.

The supplied image covers common numerical, statistical, symbolic, graph, and
plotting work. Create another reviewed image when a field needs different
dependencies; do not let an experiment install packages at runtime.

## One-shot validation

Create a private input directory under the configured `workspaceRoot` and a
manifest based on [experiment.example.json](experiment.example.json). Then run:

```bash
node bin/radar-harness.js run /path/to/experiment.json \
  --config /etc/opportunity-radar/harness.json
```

Attempts are stored independently under:

```text
<dataRoot>/runs/<run-id>/<subject-kind>s/<subject-id>/experiments/
  <experiment-id>/attempts/<timestamp-random>/
    manifest.json
    result.json
    stdout.log
    stderr.log
    workspace/
    artifacts/
```

`result.json` records the image ID, exact command, resource and isolation
policy, exit state, input tree hash and per-file hashes, output hashes, expected
artifact checks, log hashes and tails, and timing. A new attempt never reuses a
prior workspace or output directory.

## Continuous campaigns

The campaign protocol adapts the useful control-loop ideas from
[karpathy/autoresearch](https://github.com/karpathy/autoresearch) without taking
its ML training code or GPU assumptions:

1. freeze the question, evaluator command, environment, resource budget, and
   primary metric;
2. declare the only paths the agent may change;
3. run the unchanged candidate once to establish a baseline;
4. snapshot and hash every proposal before executing it in a fresh sandbox;
5. record the evaluator output and a mechanical keep/discard suggestion;
6. require an explicit, reasoned `keep`, `discard`, or `inconclusive` decision;
7. advance the accepted checkpoint only on `keep`; otherwise restore it;
8. resume the same ledger in the next Hermes session.

Campaigns do not use Git branches or resets. Each campaign has its own mutable
candidate directory and immutable data ledger, so one paper or topic cannot
alter another campaign's accepted state.

Copy the smoke example beneath your configured workspace root and initialize a
program based on [campaign.example.json](campaign.example.json):

```bash
install -d /srv/opportunity-radar/experiments/seeds/generic-campaign
cp harness/examples/generic-campaign/* \
  /srv/opportunity-radar/experiments/seeds/generic-campaign/

node bin/radar-harness.js campaign init harness/campaign.example.json \
  --config /etc/opportunity-radar/harness.json

node bin/radar-harness.js campaign status topic-example-bounded-loop \
  --config /etc/opportunity-radar/harness.json

node bin/radar-harness.js campaign run topic-example-bounded-loop \
  --config /etc/opportunity-radar/harness.json

node bin/radar-harness.js campaign decide topic-example-bounded-loop \
  --decision keep \
  --reason "Record the unchanged candidate as the baseline." \
  --config /etc/opportunity-radar/harness.json
```

After the baseline, Hermes edits only the candidate paths printed by `campaign
status`, runs one iteration, inspects the full evidence, decides, and repeats.
The harness refuses a second run while an attempt awaits a decision and refuses
changes outside `mutablePaths`.

### Evaluation contract

Every campaign produces the required `evaluation.artifactPath`, using
[evaluation.example.json](evaluation.example.json) as the schema:

- `status`: `valid`, `invalid`, or `inconclusive`;
- `summary`: what the fixed evaluator actually observed;
- `metrics`: zero or more finite numeric measurements with optional units and
  uncertainty;
- `checks`: named `pass`, `fail`, or `warning` validity checks;
- `limitations`: boundaries that prevent overclaiming.

The primary metric is optional. Use `minimize`, `maximize`, or `target` when a
stable numeric comparison is honest. Omit it for qualitative or
multi-objective research; the harness then recommends review instead of
inventing a composite score. Required checks must all pass before it recommends
keeping a result.

The suggestion is not the scientific verdict. Hermes must inspect uncertainty,
confounders, artifacts, logs, and the paper's claim boundary before deciding.

### Field patterns

| Field or task | Mutable candidate | Fixed evaluator | Useful evidence |
| --- | --- | --- | --- |
| Algorithm or ML | implementation or config | held-out benchmark and time budget | accuracy, cost, latency, robustness |
| Physics | simulation parameters or analysis method | conserved quantities and reference data | residuals, uncertainty, sensitivity plots |
| Biology or medicine | analysis code only | prespecified statistical checks | effect estimates, intervals, exclusions |
| Market research | interview coding or offer variant | prespecified response rubric | observed behavior, conversion, objections |
| Reproducibility | adapter or reconstruction code | claim-level tolerance | reproduced table, mismatch log, provenance |
| Qualitative inquiry | synthesis or taxonomy | source and contradiction checks | audit trail, counterexamples, limitations |

Do not automate wet-lab procedures, human-subject recruitment, medical action,
hazardous equipment, or financial transactions through this harness. It can
analyze already-authorized data and record a bounded plan for work that needs a
qualified person.

## Publishing evidence

Upload immutable files before committing entities that refer to them:

```bash
node bin/radar-agent.js upload \
  /var/lib/opportunity-radar/harness/runs/<run>/papers/<paper>/experiments/<experiment>/attempts/<attempt>/artifacts/evaluation.json \
  <run>/<paper>/<experiment>/<attempt>/evaluation.json

node bin/radar-agent.js push /path/to/research-bundle.json
```

Map each campaign attempt to an `Experiment` entity. Set `campaignId`,
`iteration`, `decision`, `decisionReason`, metrics, checks, hashes, logs, and
limitations. Never publish a `keep` decision as proof of a paper's broad claim;
state exactly which evaluator and boundary it passed.
