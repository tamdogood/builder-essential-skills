import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { emptySnapshot, type ResearchBundle, type Snapshot } from "@tamnguyen/radar-contract";
import { applyBundle, validateBundle, validateRelationships } from "./contract";

type StoredEnvelope = {
  storedAt: string;
  bundleSha256: string;
  bundle: ResearchBundle;
};

const STALE_LOCK_MS = 30_000;

export class StoreConflictError extends Error {}
export class StoreBusyError extends Error {}
export class StoreValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(errors.join("; "));
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function sha256(value: string | Buffer): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function dataRoot(): string {
  const configuredRoot = process.env.RADAR_DATA_DIR ?? path.join(process.cwd(), ".radar-data");
  return path.resolve(/* turbopackIgnore: true */ configuredRoot);
}

function journalRoot(root: string): string {
  return path.join(root, "journal", "v1");
}

function readEnvelope(filePath: string): StoredEnvelope {
  const envelope = JSON.parse(fs.readFileSync(filePath, "utf8")) as StoredEnvelope;
  const validation = validateBundle(envelope.bundle);
  if (!validation.ok) throw new StoreValidationError(validation.errors);
  if (sha256(stableStringify(envelope.bundle)) !== envelope.bundleSha256) {
    throw new StoreValidationError([`journal integrity check failed for ${path.basename(filePath)}`]);
  }
  return envelope;
}

export function readSnapshot(root = dataRoot()): Snapshot {
  const journal = journalRoot(root);
  if (!fs.existsSync(journal)) return emptySnapshot();

  const envelopes = fs
    .readdirSync(journal, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => readEnvelope(path.join(journal, entry.name)))
    .sort((left, right) =>
      left.storedAt === right.storedAt
        ? left.bundle.bundleId.localeCompare(right.bundle.bundleId)
        : left.storedAt.localeCompare(right.storedAt),
    );

  let snapshot = emptySnapshot();
  for (const envelope of envelopes) snapshot = applyBundle(snapshot, envelope.bundle);

  for (const kind of [
    "topics",
    "runs",
    "papers",
    "experiments",
    "opportunities",
    "reports",
    "sources",
  ] as const) {
    snapshot[kind].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  snapshot.meta = {
    bundleCount: envelopes.length,
    generatedAt: envelopes.at(-1)?.storedAt ?? null,
  };
  return snapshot;
}

function withWriteLock<T>(root: string, operation: () => T): T {
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const lockPath = path.join(root, ".write-lock");
  let ownsUninitializedLock = false;

  function acquireLock() {
    try {
      fs.mkdirSync(lockPath, { mode: 0o700 });
      ownsUninitializedLock = true;
      fs.writeFileSync(
        path.join(lockPath, "owner.json"),
        `${JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() })}\n`,
        { flag: "wx", mode: 0o600 },
      );
      ownsUninitializedLock = false;
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }

    const ageMs = Date.now() - fs.statSync(lockPath).mtimeMs;
    if (ageMs <= STALE_LOCK_MS) {
      throw new StoreBusyError("another bundle is being committed; retry this request");
    }

    const stalePath = `${lockPath}.stale.${crypto.randomUUID()}`;
    try {
      fs.renameSync(lockPath, stalePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new StoreBusyError("another bundle is being committed; retry this request");
      }
      throw error;
    }
    fs.rmSync(stalePath, { recursive: true, force: true });

    try {
      fs.mkdirSync(lockPath, { mode: 0o700 });
      ownsUninitializedLock = true;
      fs.writeFileSync(
        path.join(lockPath, "owner.json"),
        `${JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() })}\n`,
        { flag: "wx", mode: 0o600 },
      );
      ownsUninitializedLock = false;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new StoreBusyError("another bundle is being committed; retry this request");
      }
      throw error;
    }
  }

  try {
    acquireLock();
  } catch (error) {
    if (ownsUninitializedLock) {
      fs.rmSync(lockPath, { recursive: true, force: true });
    }
    throw error;
  }

  try {
    return operation();
  } finally {
    fs.rmSync(lockPath, { recursive: true, force: true });
  }
}

export function persistBundle(
  value: unknown,
  root = dataRoot(),
): { status: "created" | "duplicate"; bundleId: string; bundleSha256: string } {
  const validation = validateBundle(value);
  if (!validation.ok) throw new StoreValidationError(validation.errors);
  const bundle = validation.value;
  const serialized = stableStringify(bundle);
  const bundleSha256 = sha256(serialized);
  const fileKey = sha256(bundle.bundleId);

  return withWriteLock(root, () => {
    const journal = journalRoot(root);
    fs.mkdirSync(journal, { recursive: true, mode: 0o700 });
    const destination = path.join(journal, `${fileKey}.json`);

    if (fs.existsSync(destination)) {
      const existing = readEnvelope(destination);
      if (existing.bundleSha256 === bundleSha256) {
        return { status: "duplicate", bundleId: bundle.bundleId, bundleSha256 };
      }
      throw new StoreConflictError(`bundleId ${bundle.bundleId} was already used with different content`);
    }

    const snapshot = readSnapshot(root);
    const relationshipErrors = validateRelationships(bundle, snapshot);
    if (relationshipErrors.length > 0) throw new StoreValidationError(relationshipErrors);

    const previousStoredAt = snapshot.meta.generatedAt
      ? Date.parse(snapshot.meta.generatedAt)
      : Number.NEGATIVE_INFINITY;
    const envelope: StoredEnvelope = {
      storedAt: new Date(Math.max(Date.now(), previousStoredAt + 1)).toISOString(),
      bundleSha256,
      bundle,
    };
    const temporary = path.join(journal, `.${fileKey}.${crypto.randomUUID()}.tmp`);
    const handle = fs.openSync(temporary, "wx", 0o600);
    try {
      fs.writeFileSync(handle, `${JSON.stringify(envelope)}\n`, "utf8");
      fs.fsyncSync(handle);
    } finally {
      fs.closeSync(handle);
    }

    try {
      fs.linkSync(temporary, destination);
    } finally {
      fs.rmSync(temporary, { force: true });
    }

    return { status: "created", bundleId: bundle.bundleId, bundleSha256 };
  });
}
