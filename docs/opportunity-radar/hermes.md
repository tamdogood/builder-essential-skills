# Hermes runbook

Hermes cron jobs run in fresh agent sessions, can attach one or more skills, and
can set an absolute working directory. The recurring prompt therefore must name
the topic, durable workspace, repository, harness config, console protocol,
iteration budget, and completion output every time.

This guide prepares the job but does not schedule it for you.

## Install the skills

Use this repository as a Hermes skill tap:

```bash
hermes skills tap add tamdogood/builder-essential-skills
hermes skills install tamdogood/builder-essential-skills/paper-opportunity-radar
hermes skills install tamdogood/builder-essential-skills/lead-research
hermes skills install tamdogood/builder-essential-skills/validate-market
hermes skills install tamdogood/builder-essential-skills/top-one-percent
```

You can instead install one skill directly with its GitHub path:

```bash
hermes skills install \
  tamdogood/builder-essential-skills/skills/paper-opportunity-radar
```

Review community skill scan results before overriding any warning. To use the
live checkout rather than installed copies, add its `skills/` directory under
`skills.external_dirs` in `~/.hermes/config.yaml`. An external directory is not
a write-protection boundary, so make it read-only to the Hermes user if the
agent must not modify skill instructions.

## Configure the environment

The scheduled Hermes process needs:

```text
RADAR_API_URL=http://127.0.0.1:3000
RADAR_WRITE_TOKEN=<console write token>
RADAR_HARNESS_CONFIG=/etc/opportunity-radar/harness.json
RADAR_REQUEST_TIMEOUT_MS=30000
```

Set secrets through `hermes setup`, the Hermes service environment, or
`~/.hermes/.env`; never paste them into a cron prompt. The skill declares the
two console variables so Hermes can pass them to terminal execution when
configured. Confirm the gateway service sees the same environment as an
interactive shell.

The cron platform needs `web`, `file`, and `terminal` toolsets. Browser access
is optional and should be enabled only when a planned source requires it.
Configure the cron platform through `hermes tools`, or set
`enabled_toolsets` on the individual `cronjob` call. Do not enable delegation,
messaging, or unrelated toolsets by default.

Verify the full path before scheduling:

```bash
cd /srv/opportunity-radar/repo
node bin/radar-agent.js health
node bin/radar-harness.js doctor --config "$RADAR_HARNESS_CONFIG"
hermes skills list
hermes cron status
```

## Create one topic job

Start from [hermes-prompt.txt](hermes-prompt.txt). Replace `TOPIC_NAME`,
`TOPIC_SLUG`, and all example absolute paths. The repository should be the cron
working directory so relative CLI paths and repository instructions resolve.

One possible command is:

```bash
hermes cron create "0 6 * * *" \
  "$(sed -e 's/TOPIC_NAME/room-temperature quantum sensing/g' \
          -e 's/TOPIC_SLUG/room-temperature-quantum-sensing/g' \
          docs/opportunity-radar/hermes-prompt.txt)" \
  --skill paper-opportunity-radar \
  --workdir /srv/opportunity-radar/repo \
  --name "Radar: quantum sensing"
```

The user owns the cadence, model, provider, delivery target, and spend cap.
Trigger the job once manually, inspect its output and persisted state, then
enable the desired schedule. Pin a model/provider when unattended cost or
behavior must not drift with global defaults.

## Separate topics and writers

Use one job and one durable workspace per topic. A broad label such as
"physics" is normally a portfolio, not a searchable topic; split it into
mechanisms or decisions such as quantum sensing calibration, plasma control,
or photonic inverse design. The UI's domain tags reunify those slices.

Give only one scheduled job write ownership of a given topic workspace. Jobs
with a `workdir` run sequentially within a Hermes scheduler tick, but manual
runs or another service can still overlap. The console serializes atomic bundle
writes; the Markdown corpus does not. Stagger jobs, use distinct workspaces,
and do not launch a second writer for the same topic.

## Continuous experiment cadence

Continuous campaigns are cumulative across fresh sessions. They are not an
infinite shell loop. The recommended daily job does at most three campaign
iterations after the literature lanes, and persists after each decision. This
keeps cost and failure visible while still allowing the search to continue for
weeks.

Start a campaign only for a decisive uncertainty. A campaign ID belongs to one
paper, opportunity, or topic and has its own candidate, proposal snapshots,
accepted checkpoints, event ledger, and attempt outputs. The first iteration is
the unchanged baseline. Later iterations change one interpretable idea at a
time where possible.

When a session is interrupted:

1. run `campaign status`;
2. if it says `awaiting_decision`, inspect that attempt and decide before any
   edit;
3. verify the console before re-uploading artifacts;
4. reuse the same idempotency key and timestamp for an exact retry;
5. resume from the accepted checkpoint.

## Use other skills deliberately

The console accepts generic reports, but the skills should not all steer the
same daily run.

| Need | Recommended workflow | Console output |
| --- | --- | --- |
| Map an unfamiliar domain | separate `lead-research` run | landscape `Report` linked to a topic |
| Test a promoted business wedge | separate `validate-market` run | market `Report`, updated `Opportunity`, experiments |
| Learn the frontier deeply | separate `top-one-percent` run | teaching `Report` linked to papers and sources |
| Build a validated project | `lead` in the target product repository | build `Report` and external repository link |

Do not attach `lead` to the daily radar job; it is an implementation workflow
and should not have write access to the research console repository merely to
produce analysis. A useful operating pattern is:

1. daily paper radar;
2. weekly landscape synthesis over accumulated topic state;
3. on-demand market validation only for an opportunity at `test` or `promote`;
4. on-demand teaching report for a concept or paper cluster;
5. a separate build workspace only after an explicit decision.

Hermes supports multiple attached skills and chained job outputs, but skill
order affects the prompt and a chain reads the latest completed upstream
output. Query the durable console and topic workspace by ID instead of assuming
two jobs scheduled in the same tick completed in order.

## Run acceptance

Do not count a cron invocation as successful solely because Hermes returned a
message. It is successful when:

- the search and corpus logs agree with the report;
- no executable research code ran on the host;
- every harness attempt has a result, evidence hashes, and a decision or an
  explicit pending state;
- the console health endpoint is healthy and the expected run/report IDs are
  present in the snapshot;
- limitations, blind spots, source failures, next cursor, and next decisive
  action are recorded;
- the final message names the durable report and console links.

Use `hermes cron list`, `hermes cron status`, the saved cron output directory,
gateway logs, the console health endpoint, and harness campaign status during
incident diagnosis. Pause a repeatedly failing job before changing prompts,
permissions, images, or data.
