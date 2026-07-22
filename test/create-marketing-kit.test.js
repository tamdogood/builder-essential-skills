const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");

const validator = path.resolve(
  __dirname,
  "..",
  "skills",
  "create-marketing-kit",
  "scripts",
  "validate_campaign_kit.py",
);

function writeFixture(root, width, declaredWidth = width) {
  fs.mkdirSync(path.join(root, "assets"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "assets", "hero.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="900" viewBox="0 0 ${width} 900"></svg>`,
  );
  fs.writeFileSync(
    path.join(root, "campaign-manifest.json"),
    `${JSON.stringify({
      campaign: "Honest launch",
      claims_reviewed: true,
      assets: [
        {
          path: "assets/hero.svg",
          role: "landscape hero",
          width: declaredWidth,
          height: 900,
        },
      ],
    })}\n`,
  );
}

test("validates campaign asset dimensions from the manifest", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "campaign-kit-"));

  try {
    writeFixture(root, 1600);
    const result = spawnSync(
      "python3",
      [validator, path.join(root, "campaign-manifest.json")],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Validated 1 campaign asset/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("rejects dimensions that do not match the exported asset", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "campaign-kit-"));

  try {
    writeFixture(root, 1600, 1080);
    const result = spawnSync(
      "python3",
      [validator, path.join(root, "campaign-manifest.json")],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /expected 1080x900, found 1600x900/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
