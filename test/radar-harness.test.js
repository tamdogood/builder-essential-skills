"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { defaultConfig } = require("../harness/src/cli");
const { buildDockerArgs, dockerArguments, dockerEnvironment } = require("../harness/src/docker");
const { collectArtifacts } = require("../harness/src/evidence");
const { validateConfig, validateManifest } = require("../harness/src/manifest");
const { confinedPath, copyIsolatedWorkspace, makeAttemptPaths } = require("../harness/src/paths");
const { runExperiment } = require("../harness/src/runner");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "radar-harness-"));
  const dataRoot = path.join(root, "data");
  const workspaceRoot = path.join(root, "workspace");
  const input = path.join(workspaceRoot, "run-001", "paper-001", "experiment");
  fs.mkdirSync(input, { recursive: true });
  fs.writeFileSync(path.join(input, "validate.py"), "print('ok')\n");
  const config = defaultConfig(dataRoot, workspaceRoot);
  config.images.science = {
    reference: "opportunity-radar-science:local",
    expectedId: `sha256:${"a".repeat(64)}`,
  };
  const manifest = {
    schemaVersion: 1,
    experimentId: "experiment-001",
    runId: "run-001",
    subject: { kind: "paper", id: "paper-001" },
    image: "science",
    inputDir: "run-001/paper-001/experiment",
    command: ["python", "validate.py"],
    network: "none",
    environment: { EXPERIMENT_SEED: "1729" },
    resources: { timeoutSeconds: 30 },
    expectedArtifacts: [
      { path: "metrics.json", required: true, mimeType: "application/json" },
    ],
  };
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { config, input, manifest, root, workspaceRoot };
}

test("validates an operator-approved offline experiment", (t) => {
  const { config, manifest } = fixture(t);
  assert.equal(validateConfig(config), config);
  const validated = validateManifest(manifest, config);
  assert.equal(validated.network, "none");
  assert.equal(validated.resources.timeoutSeconds, 30);
  assert.equal(validated.resources.memoryMb, config.defaults.memoryMb);
});

test("rejects workspace traversal, arbitrary images, environment, and network", (t) => {
  const { config, manifest } = fixture(t);
  assert.throws(
    () => validateManifest({ ...manifest, inputDir: "../another-paper" }, config),
    /cannot escape/,
  );
  assert.throws(() => validateManifest({ ...manifest, image: "ubuntu" }, config), /allowed image alias/);
  assert.throws(
    () => validateManifest({ ...manifest, environment: { AWS_SECRET_ACCESS_KEY: "secret" } }, config),
    /not allowlisted/,
  );
  assert.throws(
    () => validateManifest({ ...manifest, network: "bridge" }, config),
    /allowNetwork is false/,
  );
  assert.throws(
    () => validateConfig({ ...config, dockerHost: "tcp://127.0.0.1:2375" }),
    /absolute unix:\/\/ socket/,
  );
});

test("addresses an operator-selected rootless Docker socket without inheriting host environment", (t) => {
  const { config } = fixture(t);
  config.dockerHost = "unix:///run/user/1001/docker.sock";
  assert.deepEqual(dockerArguments(validateConfig(config), ["version"]), [
    "--host",
    "unix:///run/user/1001/docker.sock",
    "version",
  ]);
  assert.deepEqual(dockerEnvironment(), { PATH: process.env.PATH ?? "/usr/bin:/bin" });
});

test("realpath confinement blocks a parent symlink escape", (t) => {
  const { root, workspaceRoot } = fixture(t);
  const outside = path.join(root, "outside");
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(workspaceRoot, "linked"));
  assert.throws(() => confinedPath(workspaceRoot, "linked", "input"), /escapes/);
});

test("each attempt gets a separate copied workspace and only two host mounts", (t) => {
  const { config, input, manifest } = fixture(t);
  const validated = validateManifest(manifest, config);
  const first = makeAttemptPaths(config, validated);
  const second = makeAttemptPaths(config, validated);
  assert.notEqual(first.attemptRoot, second.attemptRoot);
  copyIsolatedWorkspace(input, first.workspace, validated.resources);
  fs.writeFileSync(path.join(first.workspace, "validate.py"), "changed\n");
  assert.equal(fs.readFileSync(path.join(input, "validate.py"), "utf8"), "print('ok')\n");

  const image = {
    alias: "science",
    reference: "opportunity-radar-science:local",
    id: config.images.science.expectedId,
  };
  const plan = buildDockerArgs(config, validated, first, image);
  assert.equal(plan.args.filter((argument) => argument === "--mount").length, 2);
  assert.ok(plan.args.includes("--read-only"));
  assert.ok(plan.args.includes("--cap-drop=ALL"));
  assert.ok(plan.args.includes("--security-opt=no-new-privileges"));
  assert.ok(plan.args.includes("--log-driver=none"));
  assert.ok(plan.args.includes("none"));
  assert.ok(plan.args.includes(image.id));
  assert.ok(!plan.args.includes(config.workspaceRoot));
});

test("rejects symlinked inputs and outputs", (t) => {
  const { config, input, manifest, root } = fixture(t);
  const validated = validateManifest(manifest, config);
  fs.symlinkSync(path.join(input, "validate.py"), path.join(input, "alias.py"));
  assert.throws(
    () => copyIsolatedWorkspace(input, path.join(root, "copy"), validated.resources),
    /forbidden symlink/,
  );

  const output = path.join(root, "output");
  fs.mkdirSync(output);
  fs.symlinkSync(path.join(input, "validate.py"), path.join(output, "metrics.json"));
  assert.throws(
    () => collectArtifacts(output, validated.expectedArtifacts, validated.resources),
    /forbidden symlink/,
  );
});

test("records hashed evidence for a complete isolated attempt", async (t) => {
  const { config, manifest, root } = fixture(t);
  const fakeDocker = path.join(root, "fake-docker.js");
  fs.writeFileSync(
    fakeDocker,
    `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
if (args[0] === "image" && args[1] === "inspect") {
  process.stdout.write("${config.images.science.expectedId}\\n");
  process.exit(0);
}
if (args[0] === "run") {
  const mountValues = args.filter((value) => value.startsWith("type=bind"));
  const outputMount = mountValues.find((value) => value.endsWith("dst=/output"));
  const source = outputMount.split(",").find((value) => value.startsWith("src=")).slice(4);
  fs.writeFileSync(require("node:path").join(source, "metrics.json"), JSON.stringify({ reproduced: true }));
process.stdout.write("x".repeat(256));
  process.exit(0);
}
process.exit(1);
`,
    { mode: 0o700 },
  );
  config.dockerBinary = fakeDocker;
  manifest.resources.maxOutputBytes = 32;

  const outcome = await runExperiment(config, manifest);
  assert.equal(outcome.result.status, "passed");
  assert.equal(outcome.result.exitCode, 0);
  assert.equal(outcome.result.artifacts.length, 1);
  assert.equal(outcome.result.inputs.fileCount, 1);
  assert.match(outcome.result.inputs.treeSha256, /^[a-f0-9]{64}$/);
  assert.match(outcome.result.artifacts[0].sha256, /^[a-f0-9]{64}$/);
  assert.equal(outcome.result.stdout.truncated, true);
  assert.match(outcome.result.stdout.tail, /log truncated/);
  assert.equal(JSON.parse(fs.readFileSync(outcome.resultPath, "utf8")).status, "passed");
});
