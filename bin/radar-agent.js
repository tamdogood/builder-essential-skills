#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const MAX_ARTIFACT_BYTES = 25 * 1024 * 1024;
const MAX_JSON_BYTES = 10 * 1024 * 1024;

const usage = `Opportunity Radar agent CLI

Usage:
  radar-agent health
  radar-agent snapshot [output.json]
  radar-agent get <collection> <id>
  radar-agent push <bundle.json>
  radar-agent upsert <collection> <id> <entity.json>
  radar-agent delete <collection> <id>
  radar-agent upload <local-file> <artifact/path>

Environment:
  RADAR_API_URL       API origin (default: http://localhost:3000)
  RADAR_WRITE_TOKEN   Bearer token for mutating commands
  RADAR_AGENT_NAME    Producer name sent with direct edits
  RADAR_AGENT_SKILL   Producer skill sent with direct edits
  RADAR_IDEMPOTENCY_KEY  Optional stable key for a retried upsert or delete
  RADAR_GENERATED_AT  Stable ISO timestamp paired with an idempotency key
  RADAR_REQUEST_TIMEOUT_MS  Request timeout from 1000-300000 (default: 30000)
`;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function apiUrl(route) {
  return `${(process.env.RADAR_API_URL || "http://localhost:3000").replace(/\/$/, "")}${route}`;
}

function mutationHeaders(extra = {}) {
  const token = process.env.RADAR_WRITE_TOKEN;
  if (!token) throw new Error("RADAR_WRITE_TOKEN is required for this command");
  return {
    Authorization: `Bearer ${token}`,
    "X-Agent-Name": process.env.RADAR_AGENT_NAME || "hermes",
    "X-Agent-Skill": process.env.RADAR_AGENT_SKILL || "paper-opportunity-radar",
    ...(process.env.HERMES_SESSION_ID ? { "X-Agent-Session": process.env.HERMES_SESSION_ID } : {}),
    ...(process.env.RADAR_IDEMPOTENCY_KEY
      ? { "X-Idempotency-Key": process.env.RADAR_IDEMPOTENCY_KEY }
      : {}),
    ...(process.env.RADAR_GENERATED_AT ? { "X-Generated-At": process.env.RADAR_GENERATED_AT } : {}),
    ...extra,
  };
}

async function request(route, options = {}) {
  const configuredTimeout = Number(process.env.RADAR_REQUEST_TIMEOUT_MS ?? 30_000);
  if (!Number.isInteger(configuredTimeout) || configuredTimeout < 1_000 || configuredTimeout > 300_000) {
    throw new Error("RADAR_REQUEST_TIMEOUT_MS must be an integer from 1000 to 300000");
  }
  const response = await fetch(apiUrl(route), {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(configuredTimeout),
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const detail = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`${response.status} ${response.statusText}: ${detail}`);
  }
  return body;
}

function readBoundedFile(filePath, maxBytes, name) {
  const resolved = path.resolve(filePath);
  const stat = fs.lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${name} must be a regular file`);
  if (stat.size > maxBytes) throw new Error(`${name} exceeds ${maxBytes} bytes`);
  return fs.readFileSync(resolved);
}

function encodeResource(kind, id) {
  return `/api/v1/resources/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(usage);
    return;
  }

  if (command === "health") {
    process.stdout.write(`${JSON.stringify(await request("/api/v1/health"), null, 2)}\n`);
    return;
  }

  if (command === "snapshot") {
    const snapshot = await request("/api/v1/snapshot");
    const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
    if (args[0]) fs.writeFileSync(path.resolve(args[0]), serialized, { mode: 0o600 });
    else process.stdout.write(serialized);
    return;
  }

  if (command === "get") {
    if (args.length !== 2) throw new Error("get requires <collection> <id>");
    const body = await request(encodeResource(args[0], args[1]));
    process.stdout.write(`${JSON.stringify(body, null, 2)}\n`);
    return;
  }

  if (command === "push") {
    if (args.length !== 1) throw new Error("push requires <bundle.json>");
    const body = readBoundedFile(args[0], MAX_JSON_BYTES, "bundle").toString("utf8");
    JSON.parse(body);
    const result = await request("/api/v1/bundles", {
      method: "POST",
      headers: mutationHeaders({ "Content-Type": "application/json" }),
      body,
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (command === "upsert") {
    if (args.length !== 3) throw new Error("upsert requires <collection> <id> <entity.json>");
    const body = readBoundedFile(args[2], MAX_JSON_BYTES, "entity").toString("utf8");
    JSON.parse(body);
    const result = await request(encodeResource(args[0], args[1]), {
      method: "PUT",
      headers: mutationHeaders({ "Content-Type": "application/json" }),
      body,
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (command === "delete") {
    if (args.length !== 2) throw new Error("delete requires <collection> <id>");
    const result = await request(encodeResource(args[0], args[1]), {
      method: "DELETE",
      headers: mutationHeaders(),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (command === "upload") {
    if (args.length !== 2) throw new Error("upload requires <local-file> <artifact/path>");
    const localFile = path.resolve(args[0]);
    const artifactRoute = args[1]
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
    const result = await request(`/api/v1/artifacts/${artifactRoute}`, {
      method: "PUT",
      headers: mutationHeaders({ "Content-Type": "application/octet-stream" }),
      body: readBoundedFile(localFile, MAX_ARTIFACT_BYTES, "artifact"),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  throw new Error(`unknown command: ${command}`);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
