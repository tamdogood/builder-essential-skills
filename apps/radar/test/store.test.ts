import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  persistBundle,
  readSnapshot,
  StoreConflictError,
  StoreValidationError,
} from "../src/lib/store";
import { minimalBundle, now } from "./fixtures";

function temporaryStore(t: test.TestContext): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "radar-store-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test("commits an idempotent bundle once and materializes it", (t) => {
  const root = temporaryStore(t);
  assert.equal(persistBundle(minimalBundle(), root).status, "created");
  assert.equal(persistBundle(minimalBundle(), root).status, "duplicate");

  const snapshot = readSnapshot(root);
  assert.equal(snapshot.meta.bundleCount, 1);
  assert.equal(snapshot.topics.length, 1);
  assert.equal(snapshot.papers[0].title, "A bounded evaluation");
});

test("rejects reuse of a bundle id with different content", (t) => {
  const root = temporaryStore(t);
  persistBundle(minimalBundle(), root);
  const changed = minimalBundle();
  changed.upserts!.papers![0].evidenceScore = 4;
  assert.throws(() => persistBundle(changed, root), StoreConflictError);
  assert.equal(readSnapshot(root).papers[0].evidenceScore, 3);
});

test("rejects a delete that would orphan related research", (t) => {
  const root = temporaryStore(t);
  persistBundle(minimalBundle(), root);
  assert.throws(
    () =>
      persistBundle(
        {
          schemaVersion: 1,
          bundleId: "bundle-delete-topic",
          generatedAt: now,
          producer: { agent: "hermes", skill: "paper-opportunity-radar" },
          deletes: [{ kind: "topics", id: "topic-ml" }],
        },
        root,
      ),
    StoreValidationError,
  );
  assert.equal(readSnapshot(root).topics.length, 1);
});

test("detects journal tampering", (t) => {
  const root = temporaryStore(t);
  persistBundle(minimalBundle(), root);
  const journal = path.join(root, "journal", "v1");
  const entry = path.join(journal, fs.readdirSync(journal)[0]);
  const envelope = JSON.parse(fs.readFileSync(entry, "utf8"));
  envelope.bundle.upserts.papers[0].title = "Changed after commit";
  fs.writeFileSync(entry, JSON.stringify(envelope));
  assert.throws(() => readSnapshot(root), StoreValidationError);
});

test("recovers a stale write lock left behind by a terminated process", (t) => {
  const root = temporaryStore(t);
  const lock = path.join(root, ".write-lock");
  fs.mkdirSync(lock, { recursive: true });
  const stale = new Date(Date.now() - 60_000);
  fs.utimesSync(lock, stale, stale);

  assert.equal(persistBundle(minimalBundle(), root).status, "created");
  assert.equal(fs.existsSync(lock), false);
});
