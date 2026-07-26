const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");
const workflowPath = path.join(root, ".github", "workflows", "release.yml");
const workflow = fs.readFileSync(workflowPath, "utf8");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, ".release-please-manifest.json"), "utf8"),
);
const config = JSON.parse(
  fs.readFileSync(path.join(root, "release-please-config.json"), "utf8"),
);
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);

test("release workflow publishes through npm trusted publishing", () => {
  assert.match(workflow, /Check release baseline/);
  assert.match(
    workflow,
    /npm view "\$PACKAGE_NAME@\$BASELINE_VERSION" version/,
  );
  assert.match(workflow, /git rev-parse "v\$BASELINE_VERSION\^\{commit\}"/);
  assert.match(workflow, /needs\.bootstrap\.outputs\.ready == 'true'/);
  assert.match(workflow, /googleapis\/release-please-action@v5/);
  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /node-version: "24"/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /npm publish --access public/);
  assert.doesNotMatch(workflow, /NPM_TOKEN|NODE_AUTH_TOKEN/);
});

test("release configuration starts from the package version", () => {
  assert.equal(config.packages["."]["release-type"], "node");
  assert.equal(manifest["."], packageJson.version);
  assert.equal(packageJson.publishConfig.access, "public");
  assert.equal(packageJson.publishConfig.registry, "https://registry.npmjs.org/");
  assert.equal(
    packageJson.repository.url,
    "git+https://github.com/tamdogood/builder-essential-skills.git",
  );
});
