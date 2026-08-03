# Opportunity Radar console

This Next.js application is the agent-readable and human-readable index for
research runs. It renders paper verdicts, claim audits, sandbox evidence,
continuous campaign decisions, opportunities, generic skill reports, and run
coverage across domains.

## Commands

From the repository root:

```bash
npm --prefix apps/radar ci
npm --prefix apps/radar test
npm run radar:lint
npm run radar:typecheck
npm run radar:build
```

Run locally with an explicit data directory and write token:

```bash
export RADAR_DATA_DIR="$PWD/.context/radar-local"
export RADAR_WRITE_TOKEN="$(openssl rand -hex 32)"
npm run radar:dev -- --port 3000
```

`npm --prefix apps/radar run demo:seed` writes clearly labeled fixture data to
the configured data directory and refuses conflicting immutable bundle IDs.
Do not use demo data in production.

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `RADAR_DATA_DIR` | Journal and default artifact root | `apps/radar/.radar-data` relative to process cwd |
| `RADAR_ARTIFACT_DIR` | Optional separate artifact root | `<RADAR_DATA_DIR>/artifacts` |
| `RADAR_WRITE_TOKEN` | Bearer token for every mutation | unset, which disables writes |

The website exposes no token-bearing client code. Hermes writes server-to-server
with [the repository CLI](../../bin/radar-agent.js).

## API

- `GET /api/v1/health`
- `GET /api/v1/schema`
- `GET /api/v1/snapshot`
- `POST /api/v1/bundles`
- `GET|PUT|DELETE /api/v1/resources/{kind}/{id}`
- `GET|PUT /api/v1/artifacts/{path...}`
- `GET /openapi.json`

All writes require `Authorization: Bearer <RADAR_WRITE_TOKEN>`. The bundle route
uses `bundleId` for idempotency. Direct resource routes accept
`X-Idempotency-Key`, `X-Generated-At`, `X-Agent-Name`, `X-Agent-Skill`, and
`X-Agent-Session` provenance headers.

The console is an index, not a shell. Agent capabilities are strict CRUD over
the research schema and immutable artifact upload. Run executable research
through the separate [Docker harness](../../harness/README.md).
