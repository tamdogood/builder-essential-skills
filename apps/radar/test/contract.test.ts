import assert from "node:assert/strict";
import test from "node:test";
import { validateBundle, validateRelationships } from "../src/lib/contract";
import { minimalBundle } from "./fixtures";

test("accepts a valid research bundle", () => {
  const result = validateBundle(minimalBundle());
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.bundleId, "bundle-001");
});

test("rejects unknown fields and unsupported verdicts", () => {
  const bundle = minimalBundle() as unknown as Record<string, unknown>;
  bundle.untrusted = true;
  const paper = (bundle.upserts as { papers: Array<Record<string, unknown>> }).papers[0];
  paper.verdict = "LOOKS GREAT";

  const result = validateBundle(bundle);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.errors.join("\n"), /additional properties|allowed values/);
  }
});

test("rejects a paper whose required parent does not exist", () => {
  const bundle = minimalBundle();
  bundle.upserts!.papers![0].topicId = "missing-topic";
  const errors = validateRelationships(bundle);
  assert.deepEqual(errors, ["papers:paper-001 references missing topic missing-topic"]);
});

test("rejects dangling optional evidence links", () => {
  const bundle = minimalBundle();
  bundle.upserts!.papers![0].sourceIds = ["source-missing"];
  const errors = validateRelationships(bundle);
  assert.deepEqual(errors, ["papers:paper-001.sourceIds references missing source source-missing"]);
});
