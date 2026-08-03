"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const {
  decideCampaign,
  initCampaign,
  listCampaigns,
  materializeCampaign,
  runCampaign,
} = require("./campaign");
const {
  DOCKER_CONTROL_TIMEOUT_MS,
  dockerArguments,
  dockerEnvironment,
  inspectImage,
} = require("./docker");
const { validateConfig } = require("./manifest");
const { readJson, runExperiment, writeJsonAtomic } = require("./runner");

const usage = `Paper Opportunity Radar experiment harness

Usage:
  radar-harness init --config <path> --data-root <path> --workspace-root <path>
  radar-harness build-image --config <path> [--alias science]
  radar-harness doctor --config <path>
  radar-harness run <experiment.json> --config <path>
  radar-harness campaign init <program.json> --config <path>
  radar-harness campaign list --config <path>
  radar-harness campaign status <campaign-id> --config <path>
  radar-harness campaign run <campaign-id> --config <path>
  radar-harness campaign decide <campaign-id> --decision <keep|discard|inconclusive> --reason <text> --config <path>

The harness never mounts the corpus, host credentials, or Docker socket into an
experiment. Network access is disabled unless both the manifest and operator
configuration explicitly enable it.
`;

function option(args, name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}

function requiredOption(args, name) {
  const value = option(args, name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function defaultConfig(dataRoot, workspaceRoot) {
  return {
    schemaVersion: 1,
    dataRoot: path.resolve(dataRoot),
    workspaceRoot: path.resolve(workspaceRoot),
    dockerBinary: "docker",
    dockerHost: null,
    allowNetwork: false,
    allowedEnvironmentNames: ["EXPERIMENT_SEED"],
    images: {},
    defaults: {
      cpus: 2,
      memoryMb: 4096,
      pids: 256,
      timeoutSeconds: 900,
      tmpfsMb: 256,
      maxInputBytes: 104857600,
      maxOutputBytes: 104857600,
      maxFiles: 1000,
    },
    maximums: {
      cpus: 8,
      memoryMb: 16384,
      pids: 1024,
      timeoutSeconds: 7200,
      tmpfsMb: 2048,
      maxInputBytes: 1073741824,
      maxOutputBytes: 1073741824,
      maxFiles: 10000,
    },
  };
}

async function main(args) {
  const command = args[0];
  if (!command || ["help", "--help", "-h"].includes(command)) {
    process.stdout.write(usage);
    return;
  }

  if (command === "init") {
    const configPath = path.resolve(requiredOption(args, "--config"));
    if (fs.existsSync(configPath)) throw new Error(`refusing to overwrite ${configPath}`);
    const config = defaultConfig(
      requiredOption(args, "--data-root"),
      requiredOption(args, "--workspace-root"),
    );
    validateConfig(config);
    fs.mkdirSync(path.dirname(configPath), { recursive: true, mode: 0o700 });
    fs.mkdirSync(config.dataRoot, { recursive: true, mode: 0o700 });
    fs.mkdirSync(config.workspaceRoot, { recursive: true, mode: 0o700 });
    writeJsonAtomic(configPath, config);
    process.stdout.write(`${configPath}\n`);
    return;
  }

  const configPath = path.resolve(requiredOption(args, "--config"));
  const config = validateConfig(readJson(configPath));

  if (command === "build-image") {
    const alias = option(args, "--alias", "science");
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(alias)) throw new Error("--alias is invalid");
    const imageReference = `opportunity-radar-${alias}:local`;
    const imageDirectory = path.resolve(__dirname, "../image");
    const build = spawnSync(
      config.dockerBinary,
      dockerArguments(config, ["build", "--pull", "--tag", imageReference, imageDirectory]),
      {
        env: dockerEnvironment(),
        killSignal: "SIGKILL",
        stdio: "inherit",
        timeout: 30 * 60 * 1000,
      },
    );
    if (build.status !== 0) throw new Error("sandbox image build failed");
    const inspect = spawnSync(
      config.dockerBinary,
      dockerArguments(config, ["image", "inspect", "--format", "{{.Id}}", imageReference]),
      {
        encoding: "utf8",
        env: dockerEnvironment(),
        killSignal: "SIGKILL",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: DOCKER_CONTROL_TIMEOUT_MS,
      },
    );
    if (inspect.status !== 0) throw new Error(inspect.stderr.trim() || "image inspection failed");
    config.images[alias] = { reference: imageReference, expectedId: inspect.stdout.trim() };
    validateConfig(config);
    writeJsonAtomic(configPath, config);
    process.stdout.write(`${alias} ${config.images[alias].expectedId}\n`);
    return;
  }

  if (command === "doctor") {
    const version = spawnSync(config.dockerBinary, dockerArguments(config, ["version", "--format", "{{.Server.Version}}"]), {
      encoding: "utf8",
      env: dockerEnvironment(),
      killSignal: "SIGKILL",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: DOCKER_CONTROL_TIMEOUT_MS,
    });
    if (version.status !== 0) throw new Error(version.stderr.trim() || "Docker is not available");
    const images = Object.keys(config.images).map((alias) => inspectImage(config, alias));
    process.stdout.write(
      `${JSON.stringify({ dockerServer: version.stdout.trim(), dataRoot: config.dataRoot, workspaceRoot: config.workspaceRoot, images }, null, 2)}\n`,
    );
    return;
  }

  if (command === "campaign") {
    const action = args[1];
    if (!action) throw new Error("campaign requires an action");
    if (action === "init") {
      const programPath = args[2];
      if (!programPath || programPath.startsWith("--")) {
        throw new Error("campaign init requires <program.json>");
      }
      const state = initCampaign(config, readJson(path.resolve(programPath)));
      process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
      return;
    }
    if (action === "list") {
      process.stdout.write(`${JSON.stringify(listCampaigns(config), null, 2)}\n`);
      return;
    }

    const campaignId = args[2];
    if (!campaignId || campaignId.startsWith("--")) {
      throw new Error(`campaign ${action} requires <campaign-id>`);
    }
    if (action === "status") {
      const campaign = materializeCampaign(config, campaignId);
      process.stdout.write(
        `${JSON.stringify({ campaignId, program: campaign.program, state: campaign.state }, null, 2)}\n`,
      );
      return;
    }
    if (action === "run") {
      process.stdout.write(`${JSON.stringify(await runCampaign(config, campaignId), null, 2)}\n`);
      return;
    }
    if (action === "decide") {
      const decision = requiredOption(args, "--decision");
      const reason = requiredOption(args, "--reason");
      process.stdout.write(
        `${JSON.stringify(await decideCampaign(config, campaignId, decision, reason), null, 2)}\n`,
      );
      return;
    }
    throw new Error(`unknown campaign action: ${action}`);
  }

  if (command === "run") {
    const manifestPath = args[1];
    if (!manifestPath || manifestPath.startsWith("--")) throw new Error("run requires <experiment.json>");
    const outcome = await runExperiment(config, readJson(path.resolve(manifestPath)));
    process.stdout.write(`${JSON.stringify({ resultPath: outcome.resultPath, result: outcome.result }, null, 2)}\n`);
    if (outcome.result.status !== "passed") process.exitCode = 2;
    return;
  }

  throw new Error(`unknown command: ${command}`);
}

module.exports = { defaultConfig, main };
