#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const packageRoot = path.resolve(__dirname, "..");
const packageName = require(path.join(packageRoot, "package.json")).name;
const npxCommand = `npx ${packageName}`;
const skillsSource = path.join(packageRoot, "skills");
const agentsSource = path.join(packageRoot, ".claude", "agents");

function printHelp() {
  console.log(`Install Builder's Essential Skills.

Usage:
  ${npxCommand} [--skill <name>] [--project]

Options:
  -s, --skill    Install one skill instead of the full collection
  -p, --project  Install into the current repository instead of your user home
  -h, --help     Show this help message

User install locations:
  Claude Code  ~/.claude/skills and ~/.claude/agents
  Codex        $CODEX_HOME/skills (or ~/.codex/skills)

Project install locations:
  .claude/skills, .claude/agents, and .codex/skills in the current directory
`);
}

function parseArgs(args) {
  let project = false;
  let skill = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-p" || arg === "--project") {
      project = true;
    } else if (arg === "-s" || arg === "--skill") {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) {
        console.error("Missing skill name after --skill.");
        process.exit(1);
      }
      skill = value;
      index += 1;
    } else if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown option: ${arg}`);
      console.error(`Run \`${npxCommand} --help\` for usage.`);
      process.exit(1);
    }
  }

  return { project, skill };
}

function installDirectory(source, destination, label, selectedSkill) {
  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (!entry.isDirectory() || (selectedSkill && entry.name !== selectedSkill)) {
      continue;
    }

    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    fs.rmSync(destinationPath, { recursive: true, force: true });
    fs.cpSync(sourcePath, destinationPath, { recursive: true });
    removePythonCaches(destinationPath);
    console.log(`Installed ${label} /${entry.name} to ${destinationPath}`);
  }
}

function removePythonCaches(root) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory() && entry.name === "__pycache__") {
      fs.rmSync(entryPath, { recursive: true, force: true });
    } else if (entry.isDirectory()) {
      removePythonCaches(entryPath);
    }
  }
}

function installAgents(destination) {
  if (!fs.existsSync(agentsSource)) {
    return;
  }

  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(agentsSource, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }

    const destinationPath = path.join(destination, entry.name);
    fs.cpSync(path.join(agentsSource, entry.name), destinationPath);
    console.log(`Installed agent ${entry.name} to ${destinationPath}`);
  }
}

function main() {
  const { project, skill } = parseArgs(process.argv.slice(2));
  const availableSkills = fs
    .readdirSync(skillsSource, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (skill && !availableSkills.includes(skill)) {
    console.error(`Unknown skill: ${skill}`);
    console.error(`Available skills: ${availableSkills.join(", ")}`);
    process.exit(1);
  }

  const root = project ? process.cwd() : os.homedir();
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  const claudeRoot = path.join(root, ".claude");
  const codexRoot = project ? path.join(root, ".codex") : codexHome;

  installDirectory(skillsSource, path.join(claudeRoot, "skills"), "Claude", skill);
  installDirectory(skillsSource, path.join(codexRoot, "skills"), "Codex", skill);
  if (!skill || skill === "lead") {
    installAgents(path.join(claudeRoot, "agents"));
  }

  console.log("\nRestart Claude Code or Codex to load the installed skills.");
}

main();
