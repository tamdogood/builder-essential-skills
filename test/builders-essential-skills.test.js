const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const { test } = require("node:test");

const cli = path.resolve(__dirname, "..", "bin", "builder-essential-skills.js");

test("prints help without installing anything", () => {
  const result = spawnSync(process.execPath, [cli, "--help"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0);
  assert.match(
    result.stdout,
    /npx @tamng0905\/builder-essential-skills \[--skill <name>\] \[--project\]/,
  );
});

test("rejects unknown options", () => {
  const result = spawnSync(process.execPath, [cli, "--unknown"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option: --unknown/);
});

test("rejects an unknown skill", () => {
  const result = spawnSync(process.execPath, [cli, "--skill", "missing-skill"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown skill: missing-skill/);
});

test("installs only the selected skill", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "builders-essential-skills-"));

  try {
    execFileSync(process.execPath, [cli, "--skill", "lead", "--project"], {
      cwd: projectRoot,
      encoding: "utf8",
    });

    assert.equal(
      fs.existsSync(path.join(projectRoot, ".claude", "skills", "lead", "SKILL.md")),
      true,
    );
    assert.equal(
      fs.existsSync(path.join(projectRoot, ".claude", "skills", "write-blog")),
      false,
    );
    assert.equal(
      fs.existsSync(path.join(projectRoot, ".claude", "agents", "lead-builder.md")),
      true,
    );
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});

test("installs skills and agents into the current project", () => {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "builders-essential-skills-"));

  try {
    const output = execFileSync(process.execPath, [cli, "--project"], {
      cwd: projectRoot,
      encoding: "utf8",
    });

    assert.match(output, /Installed Claude \/lead/);
    assert.equal(
      fs.existsSync(path.join(projectRoot, ".claude", "skills", "lead", "SKILL.md")),
      true,
    );
    assert.equal(
      fs.existsSync(path.join(projectRoot, ".claude", "agents", "lead-builder.md")),
      true,
    );
    assert.equal(
      fs.existsSync(path.join(projectRoot, ".codex", "skills", "write-blog", "SKILL.md")),
      true,
    );
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});
