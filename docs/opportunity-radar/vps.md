# VPS operations

This is a personal single-VPS deployment. Keep the web console, Hermes, and
experiment runtime as separate trust zones even when they share a machine.

## Recommended layout

```text
/srv/opportunity-radar/repo/          versioned application and skills
/srv/opportunity-radar/data/          console journal and artifacts
/srv/opportunity-radar/research/      durable Markdown topic workspaces
/srv/opportunity-radar/experiments/   agent-authored sandbox inputs/candidates
/var/lib/opportunity-radar/harness/   attempt evidence and campaign ledgers
/var/backups/opportunity-radar/       local backup staging
/etc/opportunity-radar/harness.json   operator-approved harness policy
```

Use separate OS identities where practical:

- an operator owns the repository, rootful web deployment, Caddy, and backups;
- the web container runs as UID/GID `10001` and can write only the console data
  directory;
- Hermes owns the research and experiment workspaces;
- Hermes uses rootless Docker for experiments and is not a member of the
  rootful `docker` group.

Membership in a rootful Docker group is effectively host root. Do not grant it
to an unattended agent. Install rootless Docker for the Hermes account and set
`dockerHost` in `harness.json` to its absolute Unix socket, for example:

```json
"dockerHost": "unix:///run/user/1001/docker.sock"
```

The harness refuses TCP Docker endpoints and does not inherit `DOCKER_HOST` or
the host environment. The web container never receives either Docker socket.

## Host preparation

Install Docker Engine and Compose for the operator, rootless Docker for Hermes,
Node.js 20.9 or newer for the repository tools, and a TLS reverse proxy such as
Caddy. On the operator account:

```bash
sudo install -d -m 0750 /srv/opportunity-radar
sudo install -d -m 0700 -o 10001 -g 10001 /srv/opportunity-radar/data
sudo install -d -m 0700 /var/backups/opportunity-radar
git clone https://github.com/tamdogood/builder-essential-skills.git \
  /srv/opportunity-radar/repo
cd /srv/opportunity-radar/repo
npm --prefix apps/radar ci
npm test
npm run radar:lint
npm run radar:typecheck
npm run radar:build
```

Create the Hermes-owned research and experiment directories and the harness
configuration with permissions appropriate to the actual Hermes UID. Keep the
operator config non-writable by Hermes after image approval. Hermes needs to
read it and write the configured workspace and harness data roots.

Build and approve the experiment image through the rootless socket:

```bash
node bin/radar-harness.js build-image \
  --config /etc/opportunity-radar/harness.json \
  --alias science
node bin/radar-harness.js doctor \
  --config /etc/opportunity-radar/harness.json
```

Review the image diff and installed dependencies before every rebuild. The
command replaces the allowed image ID only after a successful local build.

## Deploy the console

From `deploy/`, create a private `.env` using
[.env.example](../../deploy/.env.example). Generate at least 32 random bytes:

```bash
cd /srv/opportunity-radar/repo/deploy
umask 077
token=$(openssl rand -hex 32)
printf 'RADAR_PORT=3000\nRADAR_DATA_PATH=/srv/opportunity-radar/data\nRADAR_WRITE_TOKEN=%s\n' \
  "$token" > .env
unset token

docker compose build --pull
docker compose up -d
docker compose ps
curl --fail http://127.0.0.1:3000/api/v1/health
```

The Compose service binds only to loopback, drops every capability, enables no
new privileges, uses a read-only root filesystem, has a small no-exec tmpfs,
and mounts only the console data directory. It does not mount the repository,
research corpus, experiment directories, harness evidence, or Docker socket.

Copy [Caddyfile.example](../../deploy/Caddyfile.example) into the host's Caddy
configuration, replace the domain, and reload Caddy. Keep port 3000 blocked at
the firewall; expose only SSH and the reverse proxy ports.

## Protect reads as well as writes

The API bearer token protects mutations. Collection pages, snapshots, schema,
and evidence GETs are intentionally unauthenticated so the UI and agent can
read them simply. Anyone who can reach the site can therefore read the research
index and artifacts.

For private research, put the public hostname behind a Tailscale ACL, VPN,
Cloudflare Access, or reverse-proxy authentication. Let Hermes use the
loopback URL so browser authentication does not consume the API bearer header.
Do not expose the console directly to the Internet if reports, opportunity
ideas, or paper annotations are sensitive.

Rotate the write token by updating `deploy/.env`, restarting the console, and
updating the Hermes secret environment. Do not place the token in shell
history, a skill, a prompt, a bundle, an artifact, or a cron output.

## Backups

Back up three roots, not only the website:

1. console journal and immutable artifacts;
2. durable Markdown research workspaces;
3. harness results, campaign ledgers, accepted checkpoints, and proposals.

The console store publishes immutable files atomically, so a live filesystem
archive is safe at its file boundaries. Run:

```bash
cd /srv/opportunity-radar/repo
deploy/backup.sh \
  /srv/opportunity-radar/data \
  /var/backups/opportunity-radar

tar -C /srv/opportunity-radar -czf \
  /var/backups/opportunity-radar/research-$(date -u +%Y%m%dT%H%M%SZ).tar.gz \
  research

tar -C /var/lib/opportunity-radar -czf \
  /var/backups/opportunity-radar/harness-$(date -u +%Y%m%dT%H%M%SZ).tar.gz \
  harness
```

Use daily local backups, encrypted offsite replication, and a regular restore
drill. Store checksums separately from the archives. A backup on the same VPS
is staging, not disaster recovery.

## Recovery drill

Test recovery into new empty directories; never merge an old journal into a
live one.

1. Stop scheduled Hermes jobs and `docker compose down`.
2. Verify the archive checksum and inspect `tar -tzf` before extraction.
3. Extract the console archive into a new empty data directory.
4. Restore research and harness roots into new empty directories.
5. restore ownership and restrictive modes;
6. point `RADAR_DATA_PATH` and harness config at the restored roots;
7. start the console and check health, snapshot counts, several paper pages,
   artifacts, campaign status, and `radar-harness doctor`;
8. trigger one read-only Hermes inspection before resuming schedules.

The journal validates every bundle hash during reads. A degraded health result
after restoration usually means an incomplete archive, tampering, or schema
incompatibility. Preserve the failed restore for diagnosis; do not delete the
only good backup.

## Retention and capacity

Keep the append-only journal and daily reports indefinitely for provenance.
Keep complete campaign directories while a campaign is active because discard
restoration depends on accepted checkpoints. Keep all evidence that changed a
paper verdict, opportunity decision, or published report.

Place the harness `dataRoot` on a dedicated filesystem, volume, or project
quota rather than the root filesystem. Set its quota above the largest approved
attempt but below the space needed by the console, Docker, and the operating
system. The harness terminates attempts that cross declared byte or file-count
limits, but its bind mount cannot provide a hard filesystem quota by itself.

Do not enable automatic deletion initially. Measure:

```bash
df -h /srv/opportunity-radar /var/lib/opportunity-radar
du -sh /srv/opportunity-radar/data \
  /srv/opportunity-radar/research \
  /var/lib/opportunity-radar/harness
curl --fail http://127.0.0.1:3000/api/v1/health
```

Pause scheduled experiments before free space becomes critical. Once actual
growth is known, define a reviewed policy for failed one-shot workspaces whose
result, logs, input hashes, and artifacts are already published and backed up.
Never prune by age alone and never delete a file referenced by a report or
campaign ledger.

## Updates and incidents

Before updating application or schema code:

1. take and verify a backup;
2. fetch the intended revision and review the diff;
3. run tests, lint, types, and the production build;
4. rebuild the web image and, only when needed, separately reapprove harness
   images;
5. deploy, check health, and verify a representative artifact and detail page;
6. run a no-op idempotency retry through `radar-agent`.

Alert on a degraded health endpoint, restart loops, low disk, failed backups,
campaigns stuck awaiting decisions, repeated harness infrastructure errors,
and cron runs that return text without persisting their expected run/report
IDs. Pause first, preserve evidence, and diagnose before rerunning a costly or
safety-sensitive experiment.
