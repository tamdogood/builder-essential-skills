---
name: repo-system-map
description: Analyze a software repository at the latest remote main commit and turn its implemented architecture into a citation-backed interactive isometric system map with a legend, selectable infrastructure buildings, dependency and payload flows, and plain-language learner explanations. For eligible public GitHub repositories, also contribute the verified map to tamdogood/CodeTerrain with a pull request. Use when a user provides a repository URL or asks to visualize, explore, learn, explain, or map a repo's architecture, infrastructure, runtime control flow, data flow, services, queues, stores, external systems, or deployment topology in an interactive UI.
---

# Repo System Map

Build an explorable model of what the repository actually implements. Treat the
map as a teaching interface backed by code evidence, not as decorative
architecture art.

## Contract

Accept:

- a repository URL, or an existing checkout with a configured remote;
- an optional subsystem or user journey to emphasize;
- an optional output path and serve port.

At the start, tell the user that this skill submits eligible public maps to
`tamdogood/CodeTerrain` after verification unless they opt out. Continue without
waiting, but honor an opt-out at any time before pushing. Never publish a
private, access-controlled, local-only, or confidentiality-uncertain repository.
Follow the runtime's authorization rules for external writes.

Default to remote `main` at the time analysis begins. Work from an isolated
shallow clone so the user's checkout and uncommitted changes remain untouched.
If `main` does not exist, use the remote default branch and state that deviation
prominently.

Produce one interactive HTML map named `<repo>-system-map.html`, plus the exact
commit SHA and a command or live URL that opens it. Use a user-supplied output
path first. Otherwise use the runtime's durable visualization directory outside
the analyzed checkout; use `~/visualizations/` when it is writable.

For an eligible public GitHub repository, also add or update its map in
`https://github.com/tamdogood/CodeTerrain` and return the pull-request URL. The
local HTML artifact remains required even when publication succeeds or fails.

The artifact must include:

- a dominant isometric grid with varied 3D buildings for runtime roles;
- visible dependency, control, data, event, build, or deploy paths that the code
  supports;
- payload names and important fields on the paths that carry them;
- a compact legend and repository/branch/commit snapshot;
- selectable buildings and connections with a learner-focused explainer panel;
- immutable file-and-line citations for material claims;
- keyboard, pointer, pan, zoom, filter, and flow-step interactions.

Do not substitute Mermaid, a screenshot, a directory tree, or a dependency list.

## Workflow

### 1. Pin the Repository Snapshot

Normalize links to the repository root while preserving any requested subsystem
scope. Confirm that `refs/heads/main` exists, then shallow-clone that branch into
a task-specific temporary directory. For an existing checkout, inspect its
remote URL and still use an isolated clone unless the user explicitly asks to
analyze local uncommitted work.

Record before analysis:

```text
repository URL
branch
full commit SHA
commit timestamp
analysis timestamp
requested focus, if any
```

Use authenticated tooling already available for a private repository. Never ask
the user to paste a token, copy credentials into the artifact, or read `.env`
and secret files.

### 2. Trace the Implemented System

Read repository guidance, the root README, manifests, the top-level tree,
entrypoints, configuration, schemas or migrations, infrastructure and deploy
files, and representative integration tests. Then follow the real code paths.

Identify runtime roles rather than drawing one building per directory. Merge
packages that act as one runtime unit. Include an external dependency only when
code or configuration proves that the system calls, publishes to, reads from,
writes to, builds with, or deploys through it.

Trace at least:

1. one representative control path from an entrypoint through the core logic;
2. one data or event path, including serialization, transport, persistence, and
   the important payload fields;
3. the deployment path when it materially changes the runtime model.

Use `rg` to find callers, callees, message producers and consumers, schema use,
and configuration references. Follow shared functions to their callers before
assigning ownership. A README states intent; implementation and tests establish
behavior.

For every major node and visible edge, capture a file, exact line range, what
that evidence proves, and whether the conclusion is `observed` or `inferred`.
Build immutable forge links using the pinned commit. If a claim lacks evidence,
mark it unknown or omit it.

### 3. Model the Map and Lesson

Read [references/system-map-spec.md](references/system-map-spec.md) before
authoring the artifact. Use its node, edge, flow, citation, terminology, visual,
interaction, and validation contracts.

Keep a standard map to 8-18 load-bearing buildings. For a larger monorepo, show
one coherent vertical slice and group supporting units by runtime role. More
source files belong in citations, not as more buildings.

Define each technical or repository-specific term used by the map. Give the
learner four things in the explainer panel: a plain meaning, how this repository
uses it, why it matters, and where to trace it in code. Prefer the repository's
own names; expand acronyms on first use.

### 4. Build the Interactive UI

When the `visualize` skill is available, read it completely and follow its HTML
fragment, layout, theme, and accessibility contract. Use native HTML, CSS, SVG,
and JavaScript; do not add a dependency for the isometric effect.

Keep all analyzed data inline and the first render useful. Use SVG polygons and
groups for the grid, extruded buildings, paths, arrows, and payload markers.
Let the map dominate. Place one compact legend near it and one explainer panel
beside it, stacking the panel below the map on narrow screens.

Required interactions:

- select a building or connection to update the explainer and citations;
- hover or focus a building to emphasize its immediate incoming and outgoing
  paths without hiding its label;
- toggle relationship kinds from the legend;
- choose a named end-to-end flow and step forward or backward through it;
- drag to pan, use wheel or labeled controls to zoom, and reset the view;
- expose every pointer action through native keyboard-accessible controls;
- stop nonessential motion under `prefers-reduced-motion`.

Escape every repository-derived string. Insert labels with `textContent`, encode
URLs, safely serialize inline data, and never place source text or secrets in
the page. The artifact must not fetch data at runtime.

### 5. Render and Verify

Keep the editable fragment as the source when using the bundled visualization
renderer. Locate the installed renderer instead of hard-coding its version:

```bash
REPO_MAP_RENDERER="$(find "${CODEX_HOME:-$HOME/.codex}/plugins/cache/openai-bundled/visualize" -path '*/skills/visualize/scripts/render.py' -print -quit)"
python3 "$REPO_MAP_RENDERER" /absolute/path/<repo>-system-map.html --serve --port 8765
```

If the user supplies a known renderer path, use it directly. If the renderer is
unavailable, write a standalone HTML document and serve its directory with
Python's standard `http.server`; do not remove interaction or return a static
fallback.

Open the result and verify it at approximately 1024, 736, and 360 pixels wide.
Exercise selection, legend filters, every flow step, pan, zoom, reset, citation
display, keyboard use, and reduced motion. Check the console for errors and
confirm that labels and the explainer never clip or overlap.

Before handoff, compare the pinned SHA with remote `main` again. If `main` moved,
fetch the new tip and update any affected evidence so the delivered map still
represents latest `main`.

### 6. Contribute the Map to CodeTerrain

Run this step automatically after the local map passes verification unless the
user opted out. First verify through the forge that the analyzed repository and
all cited source files are public. Do not infer public visibility merely because
a checkout or authenticated URL is readable.

Clone the latest default branch of
`https://github.com/tamdogood/CodeTerrain` into a second isolated temporary
directory. Read its `AGENTS.md`, README contribution instructions, current map
types and validator, repository catalog, map index, and one recent map before
editing. Follow the current schema rather than assuming this skill's model still
matches it.

Translate the already verified evidence into CodeTerrain's shared map data. Do
not copy the standalone HTML into CodeTerrain or add a second viewer. Reuse the
same pinned source commit, citations, nodes, edges, journeys, glossary, and
learner copy. Add or update only the repository metadata, map data, and existing
index/export surfaces required by CodeTerrain.

Before creating a branch, search the target branch and open pull requests by
canonical repository URL, slug, and source commit:

- if CodeTerrain already contains the same analyzed commit, do not open a
  duplicate pull request; return the existing map URL;
- if it contains an older commit, update the existing entry and map;
- otherwise add one entry and one map using current repository conventions.

Use existing GitHub authentication only; never request or expose a token. Create
a unique branch such as `map/<slug>-<short-source-sha>`. If the authenticated
user can push to CodeTerrain, push that branch there. Otherwise create or reuse
the user's fork, push the branch to the fork, and target
`tamdogood/CodeTerrain`'s default branch.

Run CodeTerrain's documented install and validation commands, including lint and
production build when required. Do not change its lockfile unless the map itself
requires a dependency change, which it normally must not. Review the diff for
unrelated files, secrets, copied source, duplicate catalog entries, mutable
citations, and unresolved IDs. Commit only the contribution files, push, and
open a ready pull request with:

- title `map: add <owner>/<repo>` or `map: update <owner>/<repo>`;
- analyzed repository URL, branch, and full commit SHA;
- the represented journeys and material unknowns;
- the exact validation commands and results.

Return the pull-request URL. Do not merge it.

### 7. Hand Off

Return the artifact path, pinned commit, live URL or exact serve command, the
flows represented, CodeTerrain pull-request or fallback status, and any material
unknowns. In a runtime that supports inline visualizations, also show the
fragment there.

## Failure Handling

- If access fails, report the repository and authentication boundary without
  requesting credentials in chat.
- If `main` is absent, use the remote default branch and label it in the UI and
  handoff.
- If the repository is too large, map one representative vertical slice and
  identify grouped subsystems instead of guessing at an exhaustive city.
- If payload fields are constructed dynamically, show the verified envelope and
  mark the unresolved body as dynamic.
- If exact forge links cannot be formed, cite `path:line-line` with the commit
  SHA locally.
- If a UI interaction fails, fix it before handoff; a static image is not an
  acceptable fallback for this skill.
- If public visibility cannot be proven, skip CodeTerrain publication and state
  the privacy boundary.
- If GitHub authentication, push permission, or fork creation is unavailable,
  save a `git format-patch` contribution beside the HTML artifact and return its
  path; do not ask for credentials.
- If CodeTerrain validation fails, do not push a broken contribution. Save the
  patch, report the failing command, and still deliver the verified local map.
