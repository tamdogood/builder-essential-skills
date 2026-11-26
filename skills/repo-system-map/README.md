# Repo System Map

<p align="center">
  <a href="SKILL.md"><img src="../../assets/skill-banners/repo-system-map.webp" alt="repo-system-map - interactive repository architecture learning skill" width="100%"></a>
</p>

Analyze the latest `main` commit of a repository, trace its real control and
data paths, and turn the result into an interactive isometric system map with
file citations and plain-language explanations. For a public GitHub repository,
the skill also submits the verified map to
[CodeTerrain](https://github.com/tamdogood/CodeTerrain) with a pull request so
others can explore and learn from it. Say `skip CodeTerrain submission` to keep
the result local.

## Install

Install this skill for your user account:

```bash
npx @tamng0905/builder-essential-skills --skill repo-system-map
```

Install it into the current repository instead:

```bash
npx @tamng0905/builder-essential-skills --skill repo-system-map --project
```

Restart Claude Code or Codex, then ask:

```text
$repo-system-map Analyze <repo URL> at latest main. Build an interactive isometric system map, teach me every term you use, and submit the verified public map to CodeTerrain.
```

See the complete workflow in [SKILL.md](SKILL.md) and the evidence, visual,
interaction, teaching, and accessibility contract in
[references/system-map-spec.md](references/system-map-spec.md).
