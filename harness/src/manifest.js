"use strict";

const path = require("node:path");

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SAFE_ALIAS = /^[a-z][a-z0-9-]{0,63}$/;
const SAFE_ENVIRONMENT_NAME = /^[A-Z][A-Z0-9_]{0,63}$/;
const IMAGE_ID = /^sha256:[a-f0-9]{64}$/;

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

function safeId(value, name) {
  if (typeof value !== "string" || !SAFE_ID.test(value)) {
    throw new Error(`${name} must be a safe identifier`);
  }
  return value;
}

function positiveNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

function relativePath(value, name) {
  if (typeof value !== "string" || !value || path.isAbsolute(value) || value.includes("\0")) {
    throw new Error(`${name} must be a non-empty relative path`);
  }
  const normalized = path.normalize(value);
  if (normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
    throw new Error(`${name} cannot escape its configured root`);
  }
  return normalized;
}

function validateConfig(value) {
  const config = object(value, "config");
  exactKeys(
    config,
    [
      "schemaVersion",
      "dataRoot",
      "workspaceRoot",
      "dockerBinary",
      "dockerHost",
      "allowNetwork",
      "allowedEnvironmentNames",
      "images",
      "defaults",
      "maximums",
    ],
    "config",
  );
  if (config.schemaVersion !== 1) throw new Error("config.schemaVersion must be 1");
  if (typeof config.dataRoot !== "string" || !config.dataRoot) throw new Error("config.dataRoot is required");
  if (typeof config.workspaceRoot !== "string" || !config.workspaceRoot) {
    throw new Error("config.workspaceRoot is required");
  }
  if (typeof config.dockerBinary !== "string" || !config.dockerBinary) {
    throw new Error("config.dockerBinary is required");
  }
  if (
    config.dockerHost !== null &&
    config.dockerHost !== undefined &&
    (typeof config.dockerHost !== "string" || !config.dockerHost.startsWith("unix:///"))
  ) {
    throw new Error("config.dockerHost must be null or an absolute unix:// socket URL");
  }
  if (typeof config.allowNetwork !== "boolean") throw new Error("config.allowNetwork must be boolean");
  if (!Array.isArray(config.allowedEnvironmentNames)) {
    throw new Error("config.allowedEnvironmentNames must be an array");
  }
  for (const name of config.allowedEnvironmentNames) {
    if (typeof name !== "string" || !SAFE_ENVIRONMENT_NAME.test(name)) {
      throw new Error(`invalid allowed environment name: ${name}`);
    }
  }

  object(config.images, "config.images");
  for (const [alias, definitionValue] of Object.entries(config.images)) {
    if (!SAFE_ALIAS.test(alias)) throw new Error(`invalid image alias: ${alias}`);
    const definition = object(definitionValue, `config.images.${alias}`);
    exactKeys(definition, ["reference", "expectedId"], `config.images.${alias}`);
    if (typeof definition.reference !== "string" || !definition.reference) {
      throw new Error(`config.images.${alias}.reference is required`);
    }
    if (typeof definition.expectedId !== "string" || !IMAGE_ID.test(definition.expectedId)) {
      throw new Error(`config.images.${alias}.expectedId must be a Docker sha256 image ID`);
    }
  }

  const defaults = object(config.defaults, "config.defaults");
  const maximums = object(config.maximums, "config.maximums");
  const resourceKeys = [
    "cpus",
    "memoryMb",
    "pids",
    "timeoutSeconds",
    "tmpfsMb",
    "maxInputBytes",
    "maxOutputBytes",
    "maxFiles",
  ];
  exactKeys(defaults, resourceKeys, "config.defaults");
  exactKeys(maximums, resourceKeys, "config.maximums");
  for (const key of resourceKeys) {
    positiveNumber(defaults[key], `config.defaults.${key}`);
    positiveNumber(maximums[key], `config.maximums.${key}`);
    if (defaults[key] > maximums[key]) throw new Error(`default ${key} exceeds its maximum`);
  }
  return config;
}

function validateManifest(value, config) {
  const manifest = object(value, "manifest");
  exactKeys(
    manifest,
    [
      "schemaVersion",
      "experimentId",
      "runId",
      "subject",
      "image",
      "inputDir",
      "command",
      "network",
      "environment",
      "resources",
      "expectedArtifacts",
    ],
    "manifest",
  );
  if (manifest.schemaVersion !== 1) throw new Error("manifest.schemaVersion must be 1");
  safeId(manifest.experimentId, "manifest.experimentId");
  safeId(manifest.runId, "manifest.runId");

  const subject = object(manifest.subject, "manifest.subject");
  exactKeys(subject, ["kind", "id"], "manifest.subject");
  if (!["paper", "opportunity", "topic"].includes(subject.kind)) {
    throw new Error("manifest.subject.kind must be paper, opportunity, or topic");
  }
  safeId(subject.id, "manifest.subject.id");

  if (typeof manifest.image !== "string" || !config.images[manifest.image]) {
    throw new Error(`manifest.image must name an allowed image alias`);
  }
  relativePath(manifest.inputDir, "manifest.inputDir");
  if (!Array.isArray(manifest.command) || manifest.command.length === 0 || manifest.command.length > 64) {
    throw new Error("manifest.command must contain 1-64 arguments");
  }
  for (const argument of manifest.command) {
    if (typeof argument !== "string" || !argument || argument.length > 2000 || argument.includes("\0")) {
      throw new Error("manifest.command contains an invalid argument");
    }
  }

  if (!['none', 'bridge'].includes(manifest.network)) {
    throw new Error("manifest.network must be none or bridge");
  }
  if (manifest.network === "bridge" && !config.allowNetwork) {
    throw new Error("manifest requests network access but config.allowNetwork is false");
  }

  const environment = manifest.environment ?? {};
  object(environment, "manifest.environment");
  for (const [name, value] of Object.entries(environment)) {
    if (!config.allowedEnvironmentNames.includes(name)) {
      throw new Error(`manifest environment variable ${name} is not allowlisted`);
    }
    if (typeof value !== "string" || value.length > 2000 || value.includes("\0")) {
      throw new Error(`manifest environment variable ${name} has an invalid value`);
    }
  }

  const requestedResources = manifest.resources ?? {};
  object(requestedResources, "manifest.resources");
  exactKeys(requestedResources, Object.keys(config.defaults), "manifest.resources");
  const resources = { ...config.defaults, ...requestedResources };
  for (const [key, value] of Object.entries(resources)) {
    positiveNumber(value, `manifest.resources.${key}`);
    if (value > config.maximums[key]) throw new Error(`manifest resource ${key} exceeds the configured maximum`);
  }

  if (!Array.isArray(manifest.expectedArtifacts) || manifest.expectedArtifacts.length > 100) {
    throw new Error("manifest.expectedArtifacts must be an array with at most 100 entries");
  }
  const seenArtifacts = new Set();
  for (const [index, expectedValue] of manifest.expectedArtifacts.entries()) {
    const expected = object(expectedValue, `manifest.expectedArtifacts[${index}]`);
    exactKeys(expected, ["path", "required", "mimeType", "description"], `manifest.expectedArtifacts[${index}]`);
    const artifactPath = relativePath(expected.path, `manifest.expectedArtifacts[${index}].path`);
    if (seenArtifacts.has(artifactPath)) throw new Error(`duplicate expected artifact: ${artifactPath}`);
    seenArtifacts.add(artifactPath);
    if (typeof expected.required !== "boolean") throw new Error("expected artifact required must be boolean");
    if (typeof expected.mimeType !== "string" || !expected.mimeType) {
      throw new Error("expected artifact mimeType is required");
    }
    if (expected.description !== undefined && typeof expected.description !== "string") {
      throw new Error("expected artifact description must be a string");
    }
  }

  return {
    ...manifest,
    inputDir: relativePath(manifest.inputDir, "manifest.inputDir"),
    environment,
    resources,
  };
}

module.exports = {
  IMAGE_ID,
  SAFE_ID,
  relativePath,
  validateConfig,
  validateManifest,
};
