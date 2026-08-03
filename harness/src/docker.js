"use strict";

const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const MAX_CAPTURED_LOG_BYTES = 16 * 1024 * 1024;
const DOCKER_CONTROL_TIMEOUT_MS = 30_000;
const DOCKER_CLEANUP_TIMEOUT_MS = 10_000;
const OUTPUT_MONITOR_INTERVAL_MS = 100;

function dockerEnvironment() {
  return { PATH: process.env.PATH ?? "/usr/bin:/bin" };
}

function dockerArguments(config, args) {
  return config.dockerHost ? ["--host", config.dockerHost, ...args] : args;
}

function inspectImage(config, alias) {
  const definition = config.images[alias];
  const result = spawnSync(
    config.dockerBinary,
    dockerArguments(config, ["image", "inspect", "--format", "{{.Id}}", definition.reference]),
    {
      encoding: "utf8",
      env: dockerEnvironment(),
      killSignal: "SIGKILL",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: DOCKER_CONTROL_TIMEOUT_MS,
    },
  );
  if (result.status !== 0) {
    const reason = result.error?.code === "ETIMEDOUT" ? "Docker image inspection timed out" : result.stderr.trim();
    throw new Error(`cannot inspect image ${alias}: ${reason || "docker failed"}`);
  }
  const actualId = result.stdout.trim();
  if (actualId !== definition.expectedId) {
    throw new Error(
      `image ${alias} resolved to ${actualId}, expected ${definition.expectedId}; rebuild or re-approve it`,
    );
  }
  return { alias, reference: definition.reference, id: actualId };
}

function buildDockerArgs(config, manifest, paths, image) {
  const uid = typeof process.getuid === "function" ? process.getuid() : 65532;
  const gid = typeof process.getgid === "function" ? process.getgid() : 65532;
  const containerName = `radar-${manifest.experimentId.replace(/[^A-Za-z0-9_.-]/g, "-")}-${paths.attemptId
    .slice(-8)
    .replace(/[^A-Za-z0-9_.-]/g, "-")}`;
  const resources = manifest.resources;
  const args = [
    "run",
    "--rm",
    "--init",
    "--name",
    containerName,
    "--label",
    `opportunity-radar.run=${manifest.runId}`,
    "--label",
    `opportunity-radar.experiment=${manifest.experimentId}`,
    "--network",
    manifest.network,
    "--read-only",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--log-driver=none",
    "--pids-limit",
    String(resources.pids),
    "--memory",
    `${resources.memoryMb}m`,
    "--cpus",
    String(resources.cpus),
    "--user",
    `${uid}:${gid}`,
    "--tmpfs",
    `/tmp:rw,noexec,nosuid,nodev,size=${resources.tmpfsMb}m`,
    "--mount",
    `type=bind,src=${paths.workspace},dst=/workspace`,
    "--mount",
    `type=bind,src=${paths.output},dst=/output`,
    "--workdir",
    "/workspace",
    "--env",
    "HOME=/tmp",
    "--env",
    "PYTHONDONTWRITEBYTECODE=1",
    "--env",
    "RADAR_OUTPUT_DIR=/output",
    "--env",
    `RADAR_RUN_ID=${manifest.runId}`,
    "--env",
    `RADAR_EXPERIMENT_ID=${manifest.experimentId}`,
  ];
  for (const [name, value] of Object.entries(manifest.environment)) {
    args.push("--env", `${name}=${value}`);
  }
  args.push(image.id, ...manifest.command);
  return { args, containerName };
}

function createBoundedLog(filePath, limitBytes) {
  const handle = fs.openSync(filePath, "wx", 0o600);
  let bytesWritten = 0;
  let closed = false;
  let truncated = false;

  return {
    write(value) {
      if (closed) return;
      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
      const available = Math.max(0, limitBytes - bytesWritten);
      if (available > 0) {
        const length = Math.min(available, chunk.byteLength);
        bytesWritten += fs.writeSync(handle, chunk, 0, length);
      }
      if (chunk.byteLength > available) truncated = true;
    },
    close() {
      if (closed) return { truncated };
      if (truncated) {
        fs.writeSync(handle, Buffer.from("\n[radar harness: log truncated at configured limit]\n"));
      }
      fs.fsyncSync(handle);
      fs.closeSync(handle);
      closed = true;
      return { truncated };
    },
  };
}

function outputUsage(root, limits) {
  let fileCount = 0;
  let totalBytes = 0;

  function visit(directory) {
    const handle = fs.opendirSync(directory);
    try {
      while (fileCount <= limits.maxFiles && totalBytes <= limits.maxOutputBytes) {
        const entry = handle.readSync();
        if (!entry) break;
        const target = path.join(directory, entry.name);
        const stat = fs.lstatSync(target);
        if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) {
          throw new Error(`output contains a forbidden file: ${target}`);
        }
        if (stat.isDirectory()) {
          visit(target);
          continue;
        }
        fileCount += 1;
        totalBytes += stat.size;
      }
    } finally {
      handle.closeSync();
    }
  }

  visit(root);
  return { fileCount, totalBytes };
}

function runDocker(config, plan, paths, resources) {
  return new Promise((resolve, reject) => {
    const logLimitBytes = Math.max(
      1,
      Math.floor(Math.min(resources.maxOutputBytes, MAX_CAPTURED_LOG_BYTES)),
    );
    const stdout = createBoundedLog(paths.stdout, logLimitBytes);
    const stderr = createBoundedLog(paths.stderr, logLimitBytes);
    const child = spawn(config.dockerBinary, dockerArguments(config, plan.args), {
      env: dockerEnvironment(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    const started = Date.now();
    let timedOut = false;
    let settled = false;
    let outputLimitError = null;
    let terminationRequested = false;

    child.stdout.on("data", (chunk) => stdout.write(chunk));
    child.stderr.on("data", (chunk) => stderr.write(chunk));

    function terminateContainer() {
      if (terminationRequested) return;
      terminationRequested = true;
      spawnSync(config.dockerBinary, dockerArguments(config, ["rm", "--force", plan.containerName]), {
        env: dockerEnvironment(),
        killSignal: "SIGKILL",
        stdio: "ignore",
        timeout: DOCKER_CLEANUP_TIMEOUT_MS,
      });
      child.kill("SIGKILL");
    }

    const timer = setTimeout(() => {
      timedOut = true;
      terminateContainer();
    }, resources.timeoutSeconds * 1000);

    const outputMonitor = setInterval(() => {
      try {
        const usage = outputUsage(paths.output, resources);
        if (usage.fileCount > resources.maxFiles || usage.totalBytes > resources.maxOutputBytes) {
          outputLimitError = `output exceeded configured limits (${usage.fileCount} files, ${usage.totalBytes} bytes)`;
          terminateContainer();
        }
      } catch (error) {
        if ((error.code ?? "") === "ENOENT") return;
        outputLimitError = error instanceof Error ? error.message : String(error);
        terminateContainer();
      }
    }, OUTPUT_MONITOR_INTERVAL_MS);

    function finish() {
      clearTimeout(timer);
      clearInterval(outputMonitor);
      return {
        stdoutTruncated: stdout.close().truncated,
        stderrTruncated: stderr.close().truncated,
      };
    }

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      finish();
      reject(error);
    });

    child.on("close", (exitCode, signal) => {
      if (settled) return;
      settled = true;
      const logs = finish();
      resolve({
        exitCode: exitCode ?? -1,
        signal,
        timedOut,
        outputLimitError,
        durationMs: Date.now() - started,
        logLimitBytes,
        ...logs,
      });
    });
  });
}

module.exports = {
  MAX_CAPTURED_LOG_BYTES,
  DOCKER_CONTROL_TIMEOUT_MS,
  buildDockerArgs,
  dockerArguments,
  dockerEnvironment,
  inspectImage,
  outputUsage,
  runDocker,
};
