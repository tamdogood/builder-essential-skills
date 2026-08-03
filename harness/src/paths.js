"use strict";

const fs = require("node:fs");
const path = require("node:path");

function confinedPath(root, relative, name) {
  const absoluteRoot = fs.realpathSync(path.resolve(root));
  const candidate = path.resolve(absoluteRoot, relative);
  const resolved = fs.realpathSync(candidate);
  if (resolved !== absoluteRoot && !resolved.startsWith(`${absoluteRoot}${path.sep}`)) {
    throw new Error(`${name} escapes ${absoluteRoot}`);
  }
  return resolved;
}

function copyIsolatedWorkspace(source, destination, limits) {
  const sourceStat = fs.lstatSync(source);
  if (!sourceStat.isDirectory() || sourceStat.isSymbolicLink()) {
    throw new Error("manifest inputDir must resolve to a regular directory");
  }
  fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
  let fileCount = 0;
  let totalBytes = 0;

  function visit(sourceDir, destinationDir) {
    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
      const sourcePath = path.join(sourceDir, entry.name);
      const destinationPath = path.join(destinationDir, entry.name);
      const stat = fs.lstatSync(sourcePath);
      if (stat.isSymbolicLink()) throw new Error(`input contains a forbidden symlink: ${sourcePath}`);
      if (stat.isDirectory()) {
        fs.mkdirSync(destinationPath, { mode: 0o700 });
        visit(sourcePath, destinationPath);
        continue;
      }
      if (!stat.isFile()) throw new Error(`input contains a non-regular file: ${sourcePath}`);
      fileCount += 1;
      totalBytes += stat.size;
      if (fileCount > limits.maxFiles) throw new Error("input exceeds the configured file-count limit");
      if (totalBytes > limits.maxInputBytes) throw new Error("input exceeds the configured byte limit");
      fs.copyFileSync(sourcePath, destinationPath, fs.constants.COPYFILE_EXCL);
      fs.chmodSync(destinationPath, stat.mode & 0o100 ? 0o700 : 0o600);
    }
  }

  visit(source, destination);
  return { fileCount, totalBytes };
}

function makeAttemptPaths(config, manifest) {
  const safeTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = path.join(
    path.resolve(config.dataRoot),
    "runs",
    manifest.runId,
    `${manifest.subject.kind}s`,
    manifest.subject.id,
    "experiments",
    manifest.experimentId,
    "attempts",
  );
  fs.mkdirSync(base, { recursive: true, mode: 0o700 });
  const attemptRoot = fs.mkdtempSync(path.join(base, `${safeTimestamp}-`));
  const workspace = path.join(attemptRoot, "workspace");
  const output = path.join(attemptRoot, "artifacts");
  fs.mkdirSync(workspace, { mode: 0o700 });
  fs.mkdirSync(output, { mode: 0o700 });
  return {
    attemptId: path.basename(attemptRoot),
    attemptRoot,
    workspace,
    output,
    stdout: path.join(attemptRoot, "stdout.log"),
    stderr: path.join(attemptRoot, "stderr.log"),
    manifest: path.join(attemptRoot, "manifest.json"),
    result: path.join(attemptRoot, "result.json"),
  };
}

module.exports = { confinedPath, copyIsolatedWorkspace, makeAttemptPaths };
