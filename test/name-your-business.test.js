const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");

const checker = path.resolve(
  __dirname,
  "..",
  "skills",
  "name-your-business",
  "scripts",
  "check_domains.py",
);

const rdapUnitTests = path.resolve(__dirname, "name-your-business-rdap.py");
const skill = path.resolve(__dirname, "..", "skills", "name-your-business", "SKILL.md");

test("skill separates fast, source-inspired, and validated naming modes", () => {
  const contents = fs.readFileSync(skill, "utf8");

  assert.match(contents, /### Fast naming — default/);
  assert.match(contents, /Do not browse, inspect registries, or check domains/);
  assert.match(contents, /### Source-inspired naming/);
  assert.match(contents, /code-license permission from trademark and product-name permission/);
  assert.match(contents, /### Validation/);
  assert.match(contents, /Validate only a small shortlist, normally three to five names/);
  assert.match(contents, /GitHub, npm, PyPI, crates\.io/);
  assert.match(contents, /verified available at check time/);
});

test("domain checker classifies mocked authoritative RDAP responses", () => {
  const result = spawnSync("python3", [rdapUnitTests], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /Ran 4 tests/);
});

test("domain checker rejects malformed domains before network lookup", () => {
  const result = spawnSync("python3", [checker, "--format", "json", "not-a-domain"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 1, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload[0].registry_status, "invalid");
  assert.match(payload[0].note, /fully qualified domain/);
});
