"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { collectInputEvidence } = require("./evidence");
const { SAFE_ID, relativePath, validateConfig, validateManifest } = require("./manifest");
const { confinedPath, copyIsolatedWorkspace } = require("./paths");
const { readJson, runExperiment, writeJsonAtomic } = require("./runner");

const CAMPAIGN_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const DECISIONS = new Set(["keep", "discard", "inconclusive"]);

function object(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value;
}

function exactKeys(value, allowed, name) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) throw new Error(`${name} contains unknown fields: ${unknown.join(", ")}`);
}

function text(value, name, maximum = 4000) {
  if (typeof value !== "string" || !value.trim() || value.length > maximum || value.includes("\0")) {
    throw new Error(`${name} must be a non-empty string of at most ${maximum} characters`);
  }
  return value;
}

function safeCampaignId(value) {
  if (typeof value !== "string" || !CAMPAIGN_ID.test(value)) {
    throw new Error("campaignId must be a safe identifier of at most 80 characters");
  }
  return value;
}

function validatePrimaryMetric(value) {
  if (value === undefined) return undefined;
  const metric = object(value, "program.evaluation.primaryMetric");
  exactKeys(metric, ["name", "direction", "minDelta", "target"], "program.evaluation.primaryMetric");
  text(metric.name, "program.evaluation.primaryMetric.name", 120);
  if (!["minimize", "maximize", "target"].includes(metric.direction)) {
    throw new Error("program.evaluation.primaryMetric.direction is invalid");
  }
  if (typeof metric.minDelta !== "number" || !Number.isFinite(metric.minDelta) || metric.minDelta < 0) {
    throw new Error("program.evaluation.primaryMetric.minDelta must be a non-negative number");
  }
  if (metric.direction === "target" && (typeof metric.target !== "number" || !Number.isFinite(metric.target))) {
    throw new Error("a target metric requires a finite target");
  }
  if (metric.direction !== "target" && metric.target !== undefined) {
    throw new Error("target is only valid when the metric direction is target");
  }
  return metric;
}

function validateCampaignProgram(value, configValue) {
  const config = validateConfig(configValue);
  const program = object(value, "program");
  exactKeys(
    program,
    [
      "schemaVersion",
      "campaignId",
      "runId",
      "subject",
      "title",
      "question",
      "hypothesis",
      "seedInputDir",
      "mutablePaths",
      "image",
      "command",
      "network",
      "environment",
      "resources",
      "expectedArtifacts",
      "evaluation",
      "limits",
    ],
    "program",
  );
  if (program.schemaVersion !== 1) throw new Error("program.schemaVersion must be 1");
  safeCampaignId(program.campaignId);
  if (typeof program.runId !== "string" || !SAFE_ID.test(program.runId)) {
    throw new Error("program.runId must be a safe identifier");
  }
  text(program.title, "program.title", 240);
  text(program.question, "program.question", 4000);
  if (program.hypothesis !== undefined) text(program.hypothesis, "program.hypothesis", 4000);

  if (!Array.isArray(program.mutablePaths) || program.mutablePaths.length === 0 || program.mutablePaths.length > 100) {
    throw new Error("program.mutablePaths must contain 1-100 relative paths");
  }
  const mutablePaths = [...new Set(program.mutablePaths.map((entry, index) =>
    relativePath(entry, `program.mutablePaths[${index}]`).split(path.sep).join("/"),
  ))];

  const evaluation = object(program.evaluation, "program.evaluation");
  exactKeys(evaluation, ["artifactPath", "primaryMetric", "requiredChecks"], "program.evaluation");
  const artifactPath = relativePath(evaluation.artifactPath, "program.evaluation.artifactPath")
    .split(path.sep)
    .join("/");
  const primaryMetric = validatePrimaryMetric(evaluation.primaryMetric);
  if (!Array.isArray(evaluation.requiredChecks) || evaluation.requiredChecks.length > 100) {
    throw new Error("program.evaluation.requiredChecks must be an array with at most 100 entries");
  }
  const requiredChecks = [...new Set(evaluation.requiredChecks.map((entry, index) =>
    text(entry, `program.evaluation.requiredChecks[${index}]`, 120),
  ))];

  const limits = object(program.limits, "program.limits");
  exactKeys(limits, ["maxIterations"], "program.limits");
  if (!Number.isInteger(limits.maxIterations) || limits.maxIterations < 1 || limits.maxIterations > 10_000) {
    throw new Error("program.limits.maxIterations must be an integer from 1 to 10000");
  }

  const manifest = validateManifest(
    {
      schemaVersion: 1,
      experimentId: `${program.campaignId}-validation`,
      runId: program.runId,
      subject: program.subject,
      image: program.image,
      inputDir: program.seedInputDir,
      command: program.command,
      network: program.network,
      environment: program.environment,
      resources: program.resources,
      expectedArtifacts: program.expectedArtifacts,
    },
    config,
  );
  const evaluationArtifact = manifest.expectedArtifacts.find(
    (entry) => entry.path.split(path.sep).join("/") === artifactPath,
  );
  if (!evaluationArtifact?.required) {
    throw new Error("the evaluation artifact must be listed as a required expectedArtifact");
  }

  return {
    ...program,
    seedInputDir: manifest.inputDir,
    mutablePaths,
    environment: manifest.environment,
    resources: manifest.resources,
    expectedArtifacts: manifest.expectedArtifacts,
    evaluation: { artifactPath, primaryMetric, requiredChecks },
    limits: { maxIterations: limits.maxIterations },
  };
}

function validateEvaluation(value) {
  const evaluation = object(value, "evaluation");
  exactKeys(evaluation, ["schemaVersion", "status", "summary", "metrics", "checks", "limitations"], "evaluation");
  if (evaluation.schemaVersion !== 1) throw new Error("evaluation.schemaVersion must be 1");
  if (!["valid", "invalid", "inconclusive"].includes(evaluation.status)) {
    throw new Error("evaluation.status is invalid");
  }
  text(evaluation.summary, "evaluation.summary", 4000);
  if (!Array.isArray(evaluation.metrics) || evaluation.metrics.length > 100) {
    throw new Error("evaluation.metrics must be an array with at most 100 entries");
  }
  const metricNames = new Set();
  for (const [index, metricValue] of evaluation.metrics.entries()) {
    const metric = object(metricValue, `evaluation.metrics[${index}]`);
    exactKeys(metric, ["name", "value", "unit", "uncertainty"], `evaluation.metrics[${index}]`);
    text(metric.name, `evaluation.metrics[${index}].name`, 120);
    if (metricNames.has(metric.name)) throw new Error(`duplicate evaluation metric: ${metric.name}`);
    metricNames.add(metric.name);
    if (typeof metric.value !== "number" || !Number.isFinite(metric.value)) {
      throw new Error(`evaluation metric ${metric.name} must have a finite numeric value`);
    }
    if (metric.unit !== undefined) text(metric.unit, `evaluation.metrics[${index}].unit`, 80);
    if (
      metric.uncertainty !== undefined &&
      (typeof metric.uncertainty !== "number" || !Number.isFinite(metric.uncertainty) || metric.uncertainty < 0)
    ) {
      throw new Error(`evaluation metric ${metric.name} has invalid uncertainty`);
    }
  }
  if (!Array.isArray(evaluation.checks) || evaluation.checks.length > 100) {
    throw new Error("evaluation.checks must be an array with at most 100 entries");
  }
  const checkNames = new Set();
  for (const [index, checkValue] of evaluation.checks.entries()) {
    const check = object(checkValue, `evaluation.checks[${index}]`);
    exactKeys(check, ["name", "status", "details"], `evaluation.checks[${index}]`);
    text(check.name, `evaluation.checks[${index}].name`, 120);
    if (checkNames.has(check.name)) throw new Error(`duplicate evaluation check: ${check.name}`);
    checkNames.add(check.name);
    if (!["pass", "fail", "warning"].includes(check.status)) {
      throw new Error(`evaluation check ${check.name} has invalid status`);
    }
    if (check.details !== undefined) text(check.details, `evaluation.checks[${index}].details`, 2000);
  }
  if (!Array.isArray(evaluation.limitations) || evaluation.limitations.length > 100) {
    throw new Error("evaluation.limitations must be an array with at most 100 entries");
  }
  for (const [index, limitation] of evaluation.limitations.entries()) {
    text(limitation, `evaluation.limitations[${index}]`, 1000);
  }
  return evaluation;
}

function campaignPaths(config, campaignId) {
  safeCampaignId(campaignId);
  const data = path.join(path.resolve(config.dataRoot), "campaigns", campaignId);
  const workspace = path.join(path.resolve(config.workspaceRoot), "campaigns", campaignId);
  return {
    data,
    workspace,
    candidate: path.join(workspace, "candidate"),
    program: path.join(data, "program.json"),
    events: path.join(data, "events"),
    accepted: path.join(data, "accepted"),
    proposals: path.join(data, "proposals"),
    lock: path.join(data, ".campaign-lock"),
  };
}

function sealDirectory(root) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      sealDirectory(target);
      fs.chmodSync(target, 0o500);
    } else {
      const stat = fs.lstatSync(target);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`cannot seal non-regular file: ${target}`);
      fs.chmodSync(target, stat.mode & 0o100 ? 0o500 : 0o400);
    }
  }
  fs.chmodSync(root, 0o500);
}

function removeSealedTree(root) {
  if (!fs.existsSync(root)) return;
  const stat = fs.lstatSync(root);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.chmodSync(root, 0o700);
    for (const entry of fs.readdirSync(root)) removeSealedTree(path.join(root, entry));
  } else if (stat.isFile()) {
    fs.chmodSync(root, 0o600);
  }
  fs.rmSync(root, { recursive: true, force: true });
}

function readEvents(paths) {
  if (!fs.existsSync(paths.events)) return [];
  return fs
    .readdirSync(paths.events, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => readJson(path.join(paths.events, entry.name)))
    .sort((left, right) => left.sequence - right.sequence);
}

function writeEvent(paths, value) {
  fs.mkdirSync(paths.events, { recursive: true, mode: 0o700 });
  const events = readEvents(paths);
  const sequence = (events.at(-1)?.sequence ?? 0) + 1;
  const event = { ...value, sequence, recordedAt: new Date().toISOString() };
  const destination = path.join(
    paths.events,
    `${String(sequence).padStart(6, "0")}-${value.type}-${crypto.randomUUID()}.json`,
  );
  writeJsonAtomic(destination, event);
  fs.chmodSync(destination, 0o400);
  return event;
}

function loadCampaign(configValue, campaignId) {
  const config = validateConfig(configValue);
  const paths = campaignPaths(config, campaignId);
  if (!fs.existsSync(paths.program)) throw new Error(`campaign ${campaignId} does not exist`);
  return { config, paths, program: validateCampaignProgram(readJson(paths.program), config) };
}

function materializeCampaign(configValue, campaignId) {
  const loaded = loadCampaign(configValue, campaignId);
  const events = readEvents(loaded.paths);
  const initialized = events.find((event) => event.type === "initialized");
  if (!initialized) throw new Error(`campaign ${campaignId} has no initialization event`);
  let acceptedSnapshot = initialized.acceptedSnapshot;
  let acceptedEvidence = initialized.acceptedEvidence;
  let acceptedPrimary = null;
  let pendingAttempt = null;
  let iterationCount = 0;
  let consecutiveNonKeeps = 0;

  for (const event of events) {
    if (event.type === "attempt") {
      iterationCount += 1;
      pendingAttempt = event;
    } else if (event.type === "decision") {
      if (!pendingAttempt || pendingAttempt.attemptId !== event.attemptId) {
        throw new Error(`campaign ${campaignId} has an invalid decision sequence`);
      }
      if (event.decision === "keep") {
        acceptedSnapshot = event.acceptedSnapshot;
        acceptedEvidence = event.acceptedEvidence;
        acceptedPrimary = event.primaryValue ?? acceptedPrimary;
        consecutiveNonKeeps = 0;
      } else {
        consecutiveNonKeeps += 1;
      }
      pendingAttempt = null;
    }
  }

  return {
    ...loaded,
    events,
    state: {
      status: pendingAttempt
        ? "awaiting_decision"
        : iterationCount >= loaded.program.limits.maxIterations
          ? "complete"
          : "ready",
      iterationCount,
      maxIterations: loaded.program.limits.maxIterations,
      consecutiveNonKeeps,
      pendingAttempt,
      acceptedSnapshot,
      acceptedEvidence,
      acceptedPrimary,
      candidatePath: loaded.paths.candidate,
    },
  };
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error.code ?? "") !== "ESRCH";
  }
}

async function withCampaignLock(paths, operation) {
  function acquire() {
    try {
      fs.mkdirSync(paths.lock, { mode: 0o700 });
      writeJsonAtomic(path.join(paths.lock, "owner.json"), {
        pid: process.pid,
        acquiredAt: new Date().toISOString(),
      });
      return;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }

    let owner = null;
    try {
      owner = readJson(path.join(paths.lock, "owner.json"));
    } catch {}
    const ageMs = Date.now() - fs.statSync(paths.lock).mtimeMs;
    if (processIsAlive(owner?.pid) && ageMs < 24 * 60 * 60 * 1000) {
      throw new Error(`campaign ${path.basename(paths.data)} is already running`);
    }
    const stale = `${paths.lock}.stale.${crypto.randomUUID()}`;
    fs.renameSync(paths.lock, stale);
    fs.rmSync(stale, { recursive: true, force: true });
    acquire();
  }

  acquire();
  try {
    return await operation();
  } finally {
    fs.rmSync(paths.lock, { recursive: true, force: true });
  }
}

function relativeTo(root, target) {
  return path.relative(path.resolve(root), target).split(path.sep).join("/");
}

function evidenceChanges(accepted, candidate) {
  const before = new Map(accepted.files.map((file) => [file.path, file]));
  const after = new Map(candidate.files.map((file) => [file.path, file]));
  const names = [...new Set([...before.keys(), ...after.keys()])].sort();
  return names.filter((name) => {
    const left = before.get(name);
    const right = after.get(name);
    return !left || !right || left.sha256 !== right.sha256 || left.executable !== right.executable;
  });
}

function changeIsAllowed(filePath, mutablePaths) {
  return mutablePaths.some((mutable) =>
    mutable === "." || filePath === mutable || filePath.startsWith(`${mutable}/`),
  );
}

function readCampaignEvaluation(program, resultPath) {
  const artifactRoot = path.join(path.dirname(resultPath), "artifacts");
  const evaluationPath = path.resolve(artifactRoot, program.evaluation.artifactPath);
  if (!evaluationPath.startsWith(`${artifactRoot}${path.sep}`) || !fs.existsSync(evaluationPath)) {
    return { evaluation: null, error: "the required evaluation artifact was not produced" };
  }
  try {
    return { evaluation: validateEvaluation(readJson(evaluationPath)), error: null };
  } catch (error) {
    return { evaluation: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function suggestDecision(program, state, result, evaluation, evaluationError) {
  if (result.status !== "passed") {
    return { decision: "discard", reason: `experiment status was ${result.status}`, primaryValue: null };
  }
  if (evaluationError || !evaluation) {
    return { decision: "discard", reason: evaluationError ?? "evaluation is missing", primaryValue: null };
  }
  const failedRequiredCheck = program.evaluation.requiredChecks.find((required) =>
    evaluation.checks.find((check) => check.name === required)?.status !== "pass",
  );
  if (failedRequiredCheck) {
    return { decision: "discard", reason: `required check did not pass: ${failedRequiredCheck}`, primaryValue: null };
  }
  if (evaluation.status === "invalid") {
    return { decision: "discard", reason: "the evaluator marked the result invalid", primaryValue: null };
  }
  if (evaluation.status === "inconclusive") {
    return { decision: "review", reason: "the evaluator marked the result inconclusive", primaryValue: null };
  }

  const primary = program.evaluation.primaryMetric;
  if (!primary) return { decision: "review", reason: "no scalar primary metric is configured", primaryValue: null };
  const observed = evaluation.metrics.find((metric) => metric.name === primary.name);
  if (!observed) {
    return { decision: "discard", reason: `primary metric is missing: ${primary.name}`, primaryValue: null };
  }
  if (state.acceptedPrimary === null) {
    return { decision: "baseline", reason: "no accepted baseline metric exists", primaryValue: observed.value };
  }

  let improved = false;
  if (primary.direction === "minimize") {
    improved = observed.value < state.acceptedPrimary - primary.minDelta;
  } else if (primary.direction === "maximize") {
    improved = observed.value > state.acceptedPrimary + primary.minDelta;
  } else {
    improved =
      Math.abs(observed.value - primary.target) <
      Math.abs(state.acceptedPrimary - primary.target) - primary.minDelta;
  }
  return {
    decision: improved ? "keep" : "discard",
    reason: improved ? "the primary metric improved" : "the primary metric did not improve enough",
    primaryValue: observed.value,
  };
}

function replaceCandidate(source, destination, resources) {
  const parent = path.dirname(destination);
  const staging = path.join(parent, `.candidate-${crypto.randomUUID()}`);
  const retired = path.join(parent, `.retired-${crypto.randomUUID()}`);
  copyIsolatedWorkspace(source, staging, resources);
  fs.renameSync(destination, retired);
  try {
    fs.renameSync(staging, destination);
  } catch (error) {
    fs.renameSync(retired, destination);
    fs.rmSync(staging, { recursive: true, force: true });
    throw error;
  }
  fs.rmSync(retired, { recursive: true, force: true });
}

function initCampaign(configValue, programValue) {
  const config = validateConfig(configValue);
  const program = validateCampaignProgram(programValue, config);
  const paths = campaignPaths(config, program.campaignId);
  if (fs.existsSync(paths.data) || fs.existsSync(paths.workspace)) {
    throw new Error(`campaign ${program.campaignId} already exists`);
  }

  const seed = confinedPath(config.workspaceRoot, program.seedInputDir, "program.seedInputDir");
  fs.mkdirSync(path.dirname(paths.data), { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.dirname(paths.workspace), { recursive: true, mode: 0o700 });
  fs.mkdirSync(paths.data, { mode: 0o700 });
  fs.mkdirSync(paths.workspace, { mode: 0o700 });
  try {
    fs.mkdirSync(paths.accepted, { mode: 0o700 });
    fs.mkdirSync(paths.proposals, { mode: 0o700 });
    fs.mkdirSync(paths.events, { mode: 0o700 });
    copyIsolatedWorkspace(seed, paths.candidate, program.resources);
    const acceptedSeed = path.join(paths.accepted, "000000-seed");
    copyIsolatedWorkspace(seed, acceptedSeed, program.resources);
    const acceptedEvidence = collectInputEvidence(acceptedSeed, program.resources);
    sealDirectory(acceptedSeed);
    writeJsonAtomic(paths.program, program);
    fs.chmodSync(paths.program, 0o400);
    writeEvent(paths, {
      type: "initialized",
      campaignId: program.campaignId,
      acceptedSnapshot: relativeTo(paths.data, acceptedSeed),
      acceptedEvidence,
    });
    return materializeCampaign(config, program.campaignId).state;
  } catch (error) {
    removeSealedTree(paths.data);
    removeSealedTree(paths.workspace);
    throw error;
  }
}

async function runCampaign(configValue, campaignId) {
  const loaded = loadCampaign(configValue, campaignId);
  return withCampaignLock(loaded.paths, async () => {
    const current = materializeCampaign(loaded.config, campaignId);
    if (current.state.pendingAttempt) {
      throw new Error(`campaign ${campaignId} has an attempt awaiting a decision`);
    }
    if (current.state.iterationCount >= current.program.limits.maxIterations) {
      throw new Error(`campaign ${campaignId} reached its iteration limit`);
    }

    const candidateEvidence = collectInputEvidence(current.paths.candidate, current.program.resources);
    const changedPaths = evidenceChanges(current.state.acceptedEvidence, candidateEvidence);
    const forbidden = changedPaths.filter((entry) => !changeIsAllowed(entry, current.program.mutablePaths));
    if (forbidden.length > 0) {
      throw new Error(`candidate changed protected paths: ${forbidden.join(", ")}`);
    }

    const iteration = current.state.iterationCount + 1;
    const experimentId = `${campaignId}-i${String(iteration).padStart(4, "0")}`;
    const proposal = path.join(current.paths.proposals, experimentId);
    if (fs.existsSync(proposal)) removeSealedTree(proposal);
    copyIsolatedWorkspace(current.paths.candidate, proposal, current.program.resources);
    const proposalEvidence = collectInputEvidence(proposal, current.program.resources);
    sealDirectory(proposal);

    const manifest = {
      schemaVersion: 1,
      experimentId,
      runId: current.program.runId,
      subject: current.program.subject,
      image: current.program.image,
      inputDir: relativeTo(current.config.workspaceRoot, current.paths.candidate),
      command: current.program.command,
      network: current.program.network,
      environment: current.program.environment,
      resources: current.program.resources,
      expectedArtifacts: current.program.expectedArtifacts,
    };
    let event;
    try {
      const outcome = await runExperiment(current.config, manifest);
      if (outcome.result.inputs?.treeSha256 !== proposalEvidence.treeSha256) {
        throw new Error("the executed input snapshot did not match the sealed proposal");
      }
      const { evaluation, error: evaluationError } = readCampaignEvaluation(current.program, outcome.resultPath);
      const suggestion = suggestDecision(
        current.program,
        current.state,
        outcome.result,
        evaluation,
        evaluationError,
      );
      event = writeEvent(current.paths, {
        type: "attempt",
        campaignId,
        iteration,
        attemptId: outcome.result.attemptId,
        experimentId,
        proposalSnapshot: relativeTo(current.paths.data, proposal),
        sourceEvidence: proposalEvidence,
        changedPaths,
        resultPath: relativeTo(current.config.dataRoot, outcome.resultPath),
        resultStatus: outcome.result.status,
        evaluation,
        evaluationError,
        suggestion,
      });
    } catch (error) {
      const proposalWasRecorded = readEvents(current.paths).some(
        (recorded) => recorded.type === "attempt" && recorded.experimentId === experimentId,
      );
      if (!proposalWasRecorded) removeSealedTree(proposal);
      throw error;
    }
    return { event, state: materializeCampaign(current.config, campaignId).state };
  });
}

async function decideCampaign(configValue, campaignId, decision, reason) {
  if (!DECISIONS.has(decision)) throw new Error("decision must be keep, discard, or inconclusive");
  text(reason, "reason", 2000);
  const loaded = loadCampaign(configValue, campaignId);
  return withCampaignLock(loaded.paths, async () => {
    const current = materializeCampaign(loaded.config, campaignId);
    const attempt = current.state.pendingAttempt;
    if (!attempt) throw new Error(`campaign ${campaignId} has no attempt awaiting a decision`);
    const proposal = path.resolve(current.paths.data, attempt.proposalSnapshot);
    if (!proposal.startsWith(`${current.paths.proposals}${path.sep}`)) {
      throw new Error("the pending proposal path is invalid");
    }

    let acceptedSnapshot = current.state.acceptedSnapshot;
    let acceptedEvidence = current.state.acceptedEvidence;
    if (decision === "keep") {
      const candidateEvidence = collectInputEvidence(current.paths.candidate, current.program.resources);
      if (candidateEvidence.treeSha256 !== attempt.sourceEvidence.treeSha256) {
        throw new Error("candidate changed after the run; restore it before accepting this proposal");
      }
      const proposalEvidence = collectInputEvidence(proposal, current.program.resources);
      if (proposalEvidence.treeSha256 !== attempt.sourceEvidence.treeSha256) {
        throw new Error("the sealed proposal no longer matches the recorded input evidence");
      }
      const destination = path.join(
        current.paths.accepted,
        `${String(attempt.iteration).padStart(6, "0")}-${attempt.attemptId}`,
      );
      copyIsolatedWorkspace(proposal, destination, current.program.resources);
      acceptedEvidence = collectInputEvidence(destination, current.program.resources);
      sealDirectory(destination);
      acceptedSnapshot = relativeTo(current.paths.data, destination);
    } else {
      const accepted = path.resolve(current.paths.data, current.state.acceptedSnapshot);
      if (!accepted.startsWith(`${current.paths.accepted}${path.sep}`)) {
        throw new Error("the accepted snapshot path is invalid");
      }
      replaceCandidate(accepted, current.paths.candidate, current.program.resources);
    }

    const event = writeEvent(current.paths, {
      type: "decision",
      campaignId,
      iteration: attempt.iteration,
      attemptId: attempt.attemptId,
      experimentId: attempt.experimentId,
      decision,
      reason,
      suggestion: attempt.suggestion,
      primaryValue: attempt.suggestion.primaryValue,
      acceptedSnapshot,
      acceptedEvidence,
    });
    return { event, state: materializeCampaign(current.config, campaignId).state };
  });
}

function listCampaigns(configValue) {
  const config = validateConfig(configValue);
  const root = path.join(path.resolve(config.dataRoot), "campaigns");
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && CAMPAIGN_ID.test(entry.name))
    .map((entry) => {
      const campaign = materializeCampaign(config, entry.name);
      return {
        campaignId: entry.name,
        title: campaign.program.title,
        subject: campaign.program.subject,
        ...campaign.state,
      };
    });
}

module.exports = {
  decideCampaign,
  initCampaign,
  listCampaigns,
  materializeCampaign,
  runCampaign,
  validateCampaignProgram,
  validateEvaluation,
};
