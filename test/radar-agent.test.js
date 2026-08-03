"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const cli = path.resolve(__dirname, "../bin/radar-agent.js");

function run(args, environment = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "/usr/bin:/bin", ...environment },
  });
}

test("prints agent CLI help", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Opportunity Radar agent CLI/);
  assert.match(result.stdout, /RADAR_REQUEST_TIMEOUT_MS/);
});

test("rejects an invalid request timeout before fetching", () => {
  const result = run(["health"], { RADAR_REQUEST_TIMEOUT_MS: "0" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be an integer from 1000 to 300000/);
});

test("rejects an oversized artifact before loading or uploading it", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "radar-agent-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const artifact = path.join(root, "oversized.bin");
  fs.writeFileSync(artifact, "");
  fs.truncateSync(artifact, 25 * 1024 * 1024 + 1);

  const result = run(["upload", artifact, "run/experiment/oversized.bin"], {
    RADAR_WRITE_TOKEN: "test-token",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /artifact exceeds 26214400 bytes/);
});
