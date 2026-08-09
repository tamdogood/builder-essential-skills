const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const { test } = require("node:test");

const packageRoot = path.resolve(__dirname, "..");
const cli = path.join(packageRoot, "bin", "builder-essential-skills.js");

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
      false,
    );
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});

test("installs skills into the current project", () => {
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
      false,
    );
    assert.equal(
      fs.existsSync(path.join(projectRoot, ".codex", "skills", "write-blog", "SKILL.md")),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(projectRoot, ".codex", "skills", "create-marketing-kit", "SKILL.md"),
      ),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(
          projectRoot,
          ".codex",
          "skills",
          "create-marketing-kit",
          "agents",
          "openai.yaml",
        ),
      ),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(
          projectRoot,
          ".codex",
          "skills",
          "name-your-business",
          "agents",
          "openai.yaml",
        ),
      ),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(
          projectRoot,
          ".codex",
          "skills",
          "build-scenario-tests",
          "examples",
          "web-workspace-invite.scenario.md",
        ),
      ),
      true,
    );
    assert.equal(
      fs.existsSync(
        path.join(
          projectRoot,
          ".claude",
          "skills",
          "run-smoke-tests",
          "examples",
          "saas-team-onboarding.smoke.md",
        ),
      ),
      true,
    );
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});

test("lead skills use native agents without provider routing", () => {
  const lead = fs.readFileSync(path.join(packageRoot, "skills", "lead", "SKILL.md"), "utf8");
  const research = fs.readFileSync(
    path.join(packageRoot, "skills", "lead-research", "SKILL.md"),
    "utf8",
  );
  const workflow = [
    lead,
    research,
    fs.readFileSync(path.join(packageRoot, "skills", "lead", "dispatch.md"), "utf8"),
    fs.readFileSync(path.join(packageRoot, "skills", "lead", "research.md"), "utf8"),
  ].join("\n");

  assert.match(lead, /The Lead must never:[\s\S]*write or edit code/);
  assert.match(research, /The Research Lead must never search the web/);
  assert.match(workflow, /native (?:agent|delegation)/i);
  assert.doesNotMatch(workflow, /codex exec|claude -p|config\.py|models\.json/i);
  assert.equal(fs.existsSync(path.join(packageRoot, "skills", "lead", "config.py")), false);
  assert.equal(fs.existsSync(path.join(packageRoot, "skills", "lead", "models.json")), false);
});
