import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { persistArtifact, readArtifact, resolveArtifactPath } from "../src/lib/artifacts";

function temporaryRoot(t: test.TestContext): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "radar-artifacts-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test("stores an immutable artifact and accepts an identical retry", (t) => {
  const root = temporaryRoot(t);
  const segments = ["run-001", "paper-001", "experiment-001", "metrics.json"];
  const bytes = Buffer.from('{"accuracy":0.81}\n');
  const first = persistArtifact(segments, bytes, root);
  const second = persistArtifact(segments, bytes, root);
  assert.equal(first.status, "created");
  assert.equal(second.status, "duplicate");
  assert.deepEqual(readArtifact(resolveArtifactPath(segments, root)), bytes);
});

test("rejects traversal and conflicting artifact content", (t) => {
  const root = temporaryRoot(t);
  assert.throws(() => resolveArtifactPath(["run-001", "..", "secret"], root));
  const segments = ["run-001", "paper-001", "result.txt"];
  persistArtifact(segments, Buffer.from("first"), root);
  assert.throws(() => persistArtifact(segments, Buffer.from("second"), root), /different content/);
});
