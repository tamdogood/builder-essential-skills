---
name: create-skill
description: Create or update a complete repository skill from a user's idea, including the workflow instructions, references, scripts or assets, agent metadata, skill-card artwork, cinematic banner artwork, README links, discovery metadata, and validation. Use when the user asks to create a new skill, add a skill to this collection, turn a workflow into a reusable skill, or make a skill's documentation and artwork consistent with the repository.
---

# Create Skill

Turn a skill idea into a complete, discoverable, and shippable skill folder. Treat the skill instructions, metadata, artwork, README wiring, and validation as one deliverable.

## Workflow

1. **Orient the repository.** Read `AGENTS.md`, the root `README.md`, the nearest existing skill with a similar purpose, and any local lessons file. Inspect `package.json`, `skills.sh.json`, the installer, and the existing `assets/skill-cards/` and `assets/skill-banners/` conventions before editing.

2. **Define the contract.** Extract the skill slug, purpose, audience, trigger phrases, inputs, outputs, and acceptance checks from the request. Normalize the slug to lowercase hyphen-case. Preserve the user's terminology, but make the frontmatter description explicit about both the capability and the situations that should trigger it.

3. **Choose the smallest useful structure.** Create only the resources the skill needs:

   - `skills/<slug>/SKILL.md` for the core workflow and routing rules.
   - `skills/<slug>/agents/openai.yaml` for display metadata and an explicit `$<slug>` default prompt.
   - `skills/<slug>/references/` for detailed domain guidance that should load progressively.
   - `skills/<slug>/scripts/` only for deterministic, repeatable automation.
   - `skills/<slug>/assets/` only for files the skill will reuse in its outputs.
   - `skills/<slug>/README.md` because this repository documents every published skill.

   Keep `SKILL.md` under 500 lines. Put deep specifications and long examples in one-level-deep references and link them directly from the skill.

4. **Write the skill.** Use imperative instructions. State the decision points, required tools, file paths, invariants, failure handling, and verification commands another agent cannot safely infer. Prefer a short workflow in `SKILL.md` and conditional links such as `references/artwork.md` for specialized work.

5. **Create the required artwork.** In this repository, every new skill needs `assets/skill-cards/<slug>.svg` and a linked row in the root README's **Pick a skill** table. When the collection uses cinematic banners, also create `assets/skill-banners/<slug>.webp` and use the banner in the root and skill READMEs. Read [references/artwork.md](references/artwork.md) before creating either asset.

6. **Wire every discovery surface.** Update all surfaces that explicitly enumerate skills: the root README card table, the skill README, `skills.sh.json` groupings, and any registry or installer allowlist discovered during orientation. Do not invent a new registry file. Confirm that `package.json` already includes the `skills/` and `assets/` trees; change it only if the package would otherwise omit the new files.

7. **Validate before handoff.** Run the skill validator, parse the SVG, inspect the rendered card and banner, check every new README link, run the repository test suite, and run `git diff --check`. Review the diff for stale names, placeholder text, missing metadata, broken relative paths, untracked required assets, and accidental unrelated edits.

## Skill content requirements

Include these sections when relevant:

- **Scope and trigger behavior:** what the skill handles and what it should not handle.
- **Inputs and outputs:** expected files, links, user decisions, and final artifacts.
- **Workflow:** the smallest reliable sequence, with explicit branch points.
- **Resources:** when to read each reference or run each script.
- **Validation:** concrete commands and visual or semantic acceptance checks.
- **Failure handling:** what to do when a tool, dependency, reference, or user choice is missing.

Never leave TODO markers, template prose, guessed tool names, or unsupported claims in a published skill. Avoid duplicating long reference material in `SKILL.md`.

## Artwork routing

Use the built-in image-generation tool for a new raster banner. First inspect two or more existing banners and any user-provided reference images. Treat references as style and composition guidance, not as content to copy. Generate a wide cinematic scene with exact title text only when the tool can render it reliably; inspect the result and iterate on one targeted issue at a time. Save the final project asset as WebP and keep the SVG card deterministic and accessible.

For the detailed visual system, prompt template, composition rules, conversion commands, and review checklist, read [references/artwork.md](references/artwork.md).

## Validation commands

From the repository root, adapt these commands to the local toolchain:

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" skills/<slug>
xmllint --noout assets/skill-cards/<slug>.svg
npm test
git diff --check
```

If a command is unavailable, use the repository's documented equivalent and report the substitution. Do not call the work complete while required files are untracked or a validation check is red.
