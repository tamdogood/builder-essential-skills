# Opportunity Radar system

Opportunity Radar turns the `paper-opportunity-radar` workflow into an
operable research system:

```text
Hermes fresh cron session
  |-- reads and updates the durable Markdown corpus
  |-- discovers and audits sources with web tools
  |-- runs bounded code through radar-harness
  |     `-- disposable Docker attempt + hashed evidence
  `-- publishes through radar-agent
        `-- authenticated API -> immutable journal/artifacts -> Next.js UI
```

The system has two durable records with distinct jobs:

- The topic workspace under `research/paper-opportunity-radar/` is the research
  source of truth: scope, exact queries, corpus queue, paper dossiers,
  opportunity ledger, daily reports, and next cursor.
- The console store is the structured delivery index: topics, runs, papers,
  experiments, opportunities, reports, sources, and immutable evidence files.

The console can hold outputs from any skill. A paper audit is a `Paper`; a
validation is an `Experiment`; a business wedge is an `Opportunity`; and every
long-form output from `paper-opportunity-radar`, `lead-research`,
`validate-market`, `top-one-percent`, `lead`, or another workflow is a generic
`Report` with its own `skill`, `kind`, domain tags, and relationships.

## Components

| Component | Purpose | Trust level |
| --- | --- | --- |
| `skills/paper-opportunity-radar/` | Cumulative evidence and opportunity workflow | Trusted instructions |
| `harness/` and `bin/radar-harness.js` | Isolated one-shot and continuous experiments | Trusted host process |
| `packages/radar-contract/` | Strict versioned JSON contract | Trusted validation boundary |
| `bin/radar-agent.js` | Minimal API client for Hermes | Trusted client, bearer token required for writes |
| `apps/radar/` | Next.js console and API | No shell or Docker access |
| `deploy/` | Hardened single-VPS container deployment | Operator controlled |

Research code is untrusted. It runs only inside a harness container. The web
container has no Docker socket, terminal endpoint, dynamic code runner, or host
filesystem mount. "Agent-native" means the agent can perform structured CRUD
and immutable artifact publication, not arbitrary remote command execution
through the website.

## Local quick start

Node.js 20.9 or newer is required for the console. From the repository root:

```bash
npm --prefix apps/radar ci
export RADAR_DATA_DIR="$PWD/.context/radar-local"
export RADAR_WRITE_TOKEN="$(openssl rand -hex 32)"
npm --prefix apps/radar run demo:seed
npm run radar:dev -- --port 3000
```

The demo is explicitly labeled and covers machine learning, artificial
intelligence, physics, opportunity validation, a continuous experiment, a
landscape report, a market report, and a teaching report. Do not seed the demo
into production data.

In another shell with the same URL and token:

```bash
export RADAR_API_URL=http://127.0.0.1:3000
export RADAR_WRITE_TOKEN=<same-token>
node bin/radar-agent.js health
node bin/radar-agent.js snapshot /tmp/radar-snapshot.json
node bin/radar-agent.js push /path/to/research-bundle.json
```

OpenAPI is served at `/openapi.json`; the authoritative bundle schema is served
at `/api/v1/schema` and lives in
`packages/radar-contract/research-bundle.schema.json`.

## Agent write protocol

Prefer one atomic bundle at the end of a coherent run. The API validates the
entire schema, rejects unknown fields, and verifies parent relationships before
publishing any part of it.

1. Read `/api/v1/snapshot` before writing so IDs and relationships are current.
2. Use stable topic IDs across days and a new run ID for each skill execution.
3. Give every entity a stable ID and ISO 8601 `updatedAt`.
4. Upload experiment artifacts first using paths that include run, subject,
   experiment, and attempt IDs.
5. Hash each artifact locally and put the exact hash and size in the
   `Experiment` entity.
6. Commit one bundle with a globally unique `bundleId`.
7. Retry the exact same bytes after a timeout. An identical bundle ID is
   idempotent; different content under the same ID is a conflict.
8. Re-read the snapshot and confirm the report, paper, and experiment IDs.

Direct resource upserts are available for small corrections. Pair
`RADAR_IDEMPOTENCY_KEY` with `RADAR_GENERATED_AT`; changing a generated
timestamp while retrying also changes the bundle and correctly causes a
conflict.

Limits are 10 MiB per JSON request and 25 MiB per artifact. Split large raw
data into an external, access-controlled research store and publish a small
manifest, summary, hash, and durable locator. Never put credentials or
restricted raw data in a report or artifact.

## Data behavior

Bundles are immutable JSON envelopes stored in `journal/v1/`. Each envelope
contains a canonical SHA-256 hash, and reads revalidate both its schema and hash
before materializing the latest state. Writes use a single-process filesystem
lock, atomic publication, idempotency checks, and stale-lock recovery.

Artifacts are immutable. Retrying the same bytes at the same path succeeds;
different bytes at that path fail. Artifact responses use content sniffing
protection and a sandboxed content policy.

The current journal implementation is designed for a personal, single-writer
VPS and a modest daily research cadence. It materializes the journal on read.
Before using it for a team, high write volume, or millions of entities, add a
tested compaction/index layer or move the same contract to a transactional
database. Do not run multiple console replicas against a shared filesystem.

## Operating guides

- [Harness and continuous campaigns](../../harness/README.md)
- [Hermes runbook](hermes.md)
- [VPS deployment, security, backup, and recovery](vps.md)
- [Research bundle schema](../../packages/radar-contract/research-bundle.schema.json)
