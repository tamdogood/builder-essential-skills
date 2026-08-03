"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  decideCampaign,
  initCampaign,
  materializeCampaign,
  runCampaign,
  validateEvaluation,
} = require("../harness/src/campaign");
const { defaultConfig } = require("../harness/src/cli");

function makeWritable(root) {
  if (!fs.existsSync(root)) return;
  const stat = fs.lstatSync(root);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.chmodSync(root, 0o700);
    for (const entry of fs.readdirSync(root)) makeWritable(path.join(root, entry));
  } else if (stat.isFile()) {
    fs.chmodSync(root, 0o600);
  }
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "radar-campaign-"));
  const dataRoot = path.join(root, "data");
  const workspaceRoot = path.join(root, "workspace");
  const seed = path.join(workspaceRoot, "seeds", "generic");
  fs.mkdirSync(seed, { recursive: true });
  fs.writeFileSync(path.join(seed, "candidate.json"), `${JSON.stringify({ score: 10 })}\n`);
  fs.writeFileSync(path.join(seed, "evaluate.py"), "# fixed evaluator\n");

  const fakeDocker = path.join(root, "fake-docker.js");
  const imageId = `sha256:${"b".repeat(64)}`;
  fs.writeFileSync(
    fakeDocker,
    `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
if (args[0] === "image" && args[1] === "inspect") {
  process.stdout.write("${imageId}\\n");
  process.exit(0);
}
if (args[0] === "run") {
  const mounts = args.filter((value) => value.startsWith("type=bind"));
  const source = mounts.find((value) => value.endsWith("dst=/workspace")).split(",").find((value) => value.startsWith("src=")).slice(4);
  const output = mounts.find((value) => value.endsWith("dst=/output")).split(",").find((value) => value.startsWith("src=")).slice(4);
  const candidate = JSON.parse(fs.readFileSync(path.join(source, "candidate.json"), "utf8"));
  fs.writeFileSync(path.join(output, "evaluation.json"), JSON.stringify({
    schemaVersion: 1,
    status: "valid",
    summary: "Candidate evaluated against the fixed contract.",
    metrics: [{ name: "error", value: candidate.score, unit: "points" }],
    checks: [{ name: "contract", status: "pass" }],
    limitations: []
  }));
  process.stdout.write("evaluation complete\\n");
  process.exit(0);
}
process.exit(1);
`,
    { mode: 0o700 },
  );

  const config = defaultConfig(dataRoot, workspaceRoot);
  config.dockerBinary = fakeDocker;
  config.images.science = { reference: "radar-science:test", expectedId: imageId };
  const program = {
    schemaVersion: 1,
    campaignId: "generic-paper-loop",
    runId: "run-generic",
    subject: { kind: "paper", id: "paper-generic" },
    title: "Generic bounded search",
    question: "Can a candidate reduce the fixed evaluator error?",
    hypothesis: "A simpler candidate can improve the score.",
    seedInputDir: "seeds/generic",
    mutablePaths: ["candidate.json"],
    image: "science",
    command: ["python", "evaluate.py"],
    network: "none",
    environment: { EXPERIMENT_SEED: "1729" },
    resources: { timeoutSeconds: 30 },
    expectedArtifacts: [
      { path: "evaluation.json", required: true, mimeType: "application/json" },
    ],
    evaluation: {
      artifactPath: "evaluation.json",
      primaryMetric: { name: "error", direction: "minimize", minDelta: 0.1 },
      requiredChecks: ["contract"],
    },
    limits: { maxIterations: 10 },
  };
  t.after(() => {
    makeWritable(root);
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { config, program, root, seed };
}

test("validates the field-neutral evaluation contract", () => {
  const evaluation = validateEvaluation({
    schemaVersion: 1,
    status: "inconclusive",
    summary: "The observation is useful but not decisive.",
    metrics: [],
    checks: [{ name: "calibration", status: "warning", details: "Needs another run." }],
    limitations: ["The sample is small."],
  });
  assert.equal(evaluation.status, "inconclusive");
});

test("resumes a campaign, advances improvements, and restores discarded proposals", async (t) => {
  const { config, program, seed } = fixture(t);
  const initialized = initCampaign(config, program);
  assert.equal(initialized.status, "ready");

  const baseline = await runCampaign(config, program.campaignId);
  assert.equal(baseline.event.suggestion.decision, "baseline");
  assert.equal(baseline.state.status, "awaiting_decision");
  await assert.rejects(runCampaign(config, program.campaignId), /awaiting a decision/);

  const baselineDecision = await decideCampaign(
    config,
    program.campaignId,
    "keep",
    "Record the unchanged seed as the comparable baseline.",
  );
  assert.equal(baselineDecision.state.acceptedPrimary, 10);

  const candidate = path.join(baselineDecision.state.candidatePath, "candidate.json");
  fs.writeFileSync(candidate, `${JSON.stringify({ score: 8 })}\n`);
  const improvement = await runCampaign(config, program.campaignId);
  assert.equal(improvement.event.suggestion.decision, "keep");
  assert.deepEqual(improvement.event.changedPaths, ["candidate.json"]);
  const kept = await decideCampaign(
    config,
    program.campaignId,
    "keep",
    "The primary metric improved beyond the configured minimum delta.",
  );
  assert.equal(kept.state.acceptedPrimary, 8);

  fs.writeFileSync(candidate, `${JSON.stringify({ score: 12 })}\n`);
  const regression = await runCampaign(config, program.campaignId);
  assert.equal(regression.event.suggestion.decision, "discard");
  await decideCampaign(
    config,
    program.campaignId,
    "discard",
    "The primary metric regressed under the same evaluation contract.",
  );
  assert.deepEqual(JSON.parse(fs.readFileSync(candidate, "utf8")), { score: 8 });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(seed, "candidate.json"), "utf8")), { score: 10 });
  assert.equal(materializeCampaign(config, program.campaignId).state.iterationCount, 3);
});

test("blocks edits outside the campaign's declared mutable surface", async (t) => {
  const { config, program } = fixture(t);
  const state = initCampaign(config, { ...program, campaignId: "protected-surface" });
  fs.writeFileSync(path.join(state.candidatePath, "evaluate.py"), "# changed evaluator\n");
  await assert.rejects(runCampaign(config, "protected-surface"), /protected paths: evaluate.py/);
});

test("retries an iteration after cleaning an interrupted proposal", async (t) => {
  const { config, program } = fixture(t);
  initCampaign(config, { ...program, campaignId: "interrupted-loop" });
  const orphan = path.join(
    config.dataRoot,
    "campaigns",
    "interrupted-loop",
    "proposals",
    "interrupted-loop-i0001",
  );
  fs.mkdirSync(orphan, { recursive: true });
  fs.writeFileSync(path.join(orphan, "partial.json"), "{}\n");
  fs.chmodSync(path.join(orphan, "partial.json"), 0o400);
  fs.chmodSync(orphan, 0o500);

  const retried = await runCampaign(config, "interrupted-loop");
  assert.equal(retried.event.iteration, 1);
  assert.equal(retried.event.suggestion.decision, "baseline");
});
