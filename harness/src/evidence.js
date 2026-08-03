"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function digestFile(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function collectInputEvidence(root, limits) {
  const files = [];
  let totalBytes = 0;

  function visit(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error(`input contains a forbidden symlink: ${absolute}`);
      if (stat.isDirectory()) {
        visit(absolute);
        continue;
      }
      if (!stat.isFile()) throw new Error(`input contains a non-regular file: ${absolute}`);
      totalBytes += stat.size;
      if (files.length + 1 > limits.maxFiles) {
        throw new Error("input exceeds the configured file-count limit");
      }
      if (totalBytes > limits.maxInputBytes) {
        throw new Error("input exceeds the configured byte limit");
      }
      files.push({
        path: path.relative(root, absolute).split(path.sep).join("/"),
        sha256: digestFile(absolute),
        sizeBytes: stat.size,
        executable: Boolean(stat.mode & 0o100),
      });
    }
  }

  visit(root);
  const treeHash = crypto.createHash("sha256");
  for (const file of files) {
    treeHash.update(`${file.path}\0${file.sha256}\0${file.sizeBytes}\0${file.executable ? 1 : 0}\n`);
  }
  return {
    treeSha256: treeHash.digest("hex"),
    totalBytes,
    fileCount: files.length,
    files,
  };
}

function logEvidence(filePath) {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "", { mode: 0o600 });
  const body = fs.readFileSync(filePath);
  return {
    path: path.basename(filePath),
    sha256: crypto.createHash("sha256").update(body).digest("hex"),
    sizeBytes: body.byteLength,
    tail: body.subarray(Math.max(0, body.byteLength - 16000)).toString("utf8"),
  };
}

function collectArtifacts(outputRoot, expectedArtifacts, limits) {
  const expected = new Map(expectedArtifacts.map((artifact) => [path.normalize(artifact.path), artifact]));
  const artifacts = [];
  let totalBytes = 0;
  let fileCount = 0;

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error(`output contains a forbidden symlink: ${absolute}`);
      if (stat.isDirectory()) {
        visit(absolute);
        continue;
      }
      if (!stat.isFile()) throw new Error(`output contains a non-regular file: ${absolute}`);
      fileCount += 1;
      totalBytes += stat.size;
      if (fileCount > limits.maxFiles) throw new Error("output exceeds the configured file-count limit");
      if (totalBytes > limits.maxOutputBytes) throw new Error("output exceeds the configured byte limit");
      const relative = path.relative(outputRoot, absolute);
      const declaration = expected.get(relative);
      artifacts.push({
        name: path.basename(relative),
        path: relative.split(path.sep).join("/"),
        mimeType: declaration?.mimeType ?? "application/octet-stream",
        description: declaration?.description,
        sha256: digestFile(absolute),
        sizeBytes: stat.size,
      });
    }
  }

  visit(outputRoot);
  const present = new Set(artifacts.map((artifact) => path.normalize(artifact.path)));
  const checks = expectedArtifacts.map((artifact) => ({
    name: `artifact:${artifact.path}`,
    status: present.has(path.normalize(artifact.path)) ? "pass" : artifact.required ? "fail" : "warning",
    details: present.has(path.normalize(artifact.path)) ? "Artifact was captured and hashed." : "Artifact was not produced.",
  }));
  return { artifacts, checks, totalBytes, fileCount };
}

module.exports = { collectArtifacts, collectInputEvidence, digestFile, logEvidence };
