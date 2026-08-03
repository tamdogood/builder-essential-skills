"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { buildDockerArgs, inspectImage, runDocker } = require("./docker");
const { collectArtifacts, collectInputEvidence, logEvidence } = require("./evidence");
const { validateConfig, validateManifest } = require("./manifest");
const { confinedPath, copyIsolatedWorkspace, makeAttemptPaths } = require("./paths");

function writeJsonAtomic(destination, value) {
  const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
  const handle = fs.openSync(temporary, "wx", 0o600);
  try {
    fs.writeFileSync(handle, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fs.fsyncSync(handle);
  } finally {
    fs.closeSync(handle);
  }
  fs.renameSync(temporary, destination);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function runExperiment(configValue, manifestValue) {
  const config = validateConfig(configValue);
  const manifest = validateManifest(manifestValue, config);
  const paths = makeAttemptPaths(config, manifest);
  const startedAt = new Date().toISOString();
  let image = null;
  let execution = null;
  let evidence = { artifacts: [], checks: [], totalBytes: 0, fileCount: 0 };
  let inputs = null;
  let infrastructureError = null;

  writeJsonAtomic(paths.manifest, manifest);

  try {
    const source = confinedPath(config.workspaceRoot, manifest.inputDir, "manifest.inputDir");
    copyIsolatedWorkspace(source, paths.workspace, manifest.resources);
    inputs = collectInputEvidence(paths.workspace, manifest.resources);
    image = inspectImage(config, manifest.image);
    const plan = buildDockerArgs(config, manifest, paths, image);
    execution = await runDocker(config, plan, paths, manifest.resources);
    if (execution.outputLimitError) throw new Error(execution.outputLimitError);
    evidence = collectArtifacts(paths.output, manifest.expectedArtifacts, manifest.resources);
  } catch (error) {
    infrastructureError = error instanceof Error ? error.message : String(error);
    try {
      evidence = collectArtifacts(paths.output, manifest.expectedArtifacts, manifest.resources);
    } catch (evidenceError) {
      infrastructureError = `${infrastructureError}; evidence collection failed: ${
        evidenceError instanceof Error ? evidenceError.message : String(evidenceError)
      }`;
    }
  }

  const stdout = {
    ...logEvidence(paths.stdout),
    truncated: execution?.stdoutTruncated ?? false,
  };
  const stderr = {
    ...logEvidence(paths.stderr),
    truncated: execution?.stderrTruncated ?? false,
  };
  const checksPassed = evidence.checks.every((check) => check.status !== "fail");
  const passed = !infrastructureError && execution?.exitCode === 0 && !execution.timedOut && checksPassed;
  const result = {
    schemaVersion: 1,
    attemptId: paths.attemptId,
    experimentId: manifest.experimentId,
    runId: manifest.runId,
    subject: manifest.subject,
    status: passed ? "passed" : execution?.timedOut ? "timed_out" : "failed",
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: execution?.durationMs ?? 0,
    image,
    command: manifest.command,
    isolation: {
      freshWorkspace: true,
      network: manifest.network,
      readOnlyRoot: true,
      capabilities: "none",
      noNewPrivileges: true,
      dockerSocketMounted: false,
      hostEnvironmentInherited: false,
      resources: manifest.resources,
    },
    exitCode: execution?.exitCode ?? -1,
    signal: execution?.signal ?? null,
    timedOut: execution?.timedOut ?? false,
    infrastructureError,
    inputs,
    checks: evidence.checks,
    artifacts: evidence.artifacts,
    stdout,
    stderr,
    evidenceRoot: path.relative(path.resolve(config.dataRoot), paths.attemptRoot).split(path.sep).join("/"),
  };
  writeJsonAtomic(paths.result, result);
  return { result, resultPath: paths.result };
}

module.exports = { readJson, runExperiment, writeJsonAtomic };
