---
name: map-the-landscape
description: Map the big picture around a topic or software repository by identifying its boundaries, layers, actors, components, relationships, flows, history, fault lines, and open questions, then explain how the pieces fit together and where to look next. Use when a user asks to understand a whole field, domain, technology, ecosystem, industry, codebase, architecture, unfamiliar repo, or phrases such as "give me the big picture", "map the landscape", "how does this all fit together?", "help me get oriented", or "what am I missing?"
---

# Map the Landscape

Build a useful mental model, not an exhaustive catalog. Reveal the structure
that makes details make sense: what is inside the boundary, what sits outside
it, which relationships matter, how value or data moves, why the landscape
looks this way, and where uncertainty remains.

## Set the Zoom

Infer these from the request and available context:

- **Subject:** the topic, field, ecosystem, or repository to map.
- **Mode:** `topic`, `repository`, or `hybrid` when a repo must be placed in its
  wider ecosystem.
- **Audience:** the user's current knowledge and intended use.
- **Decision:** what the map should help the user understand or do next.
- **Depth:** `snapshot`, `standard`, or `deep`.
- **Time horizon:** current state by default; add history when it explains the
  present.

Ask at most one clarifying question only when the subject or intended zoom is
genuinely ambiguous. Otherwise state the chosen boundary and proceed. Use
`standard` depth unless the user requests a quick overview or a deep study.

## Evidence Discipline

Keep the map auditable without making it read like a research paper.

- Label important statements as **Observed** when read directly from repository
  files, **Sourced** when supported by an external source, **Inferred** when
  deduced from evidence, and **Unknown** when evidence is insufficient.
- For current or unstable topic claims, browse and cite authoritative sources.
  Prefer primary documentation, specifications, papers, repositories, release
  notes, and first-party material.
- For repository claims, inspect code and local documentation before relying on
  summaries. Use `rg --files`, manifests, entry points, configuration, tests,
  and recent history to learn the system's own vocabulary.
- Do not present directory names, dependency lists, search snippets, stars, or
  popularity as explanations. Translate evidence into relationships and
  consequences.
- Distinguish the implemented system from stated intent. A README describes a
  promise; code paths and tests show what is enforced.

## Workflow

### 1. Frame the Map

Write a two- or three-line orientation:

1. A one-sentence mental model: "`X` is a ___ that connects ___ to ___ by ___."
2. The boundary: what is in scope, adjacent, and explicitly out of scope.
3. The organizing question or decision.

List five to nine load-bearing questions the map must answer. Adapt them to the
subject rather than using a fixed taxonomy.

### 2. Gather the Minimum Evidence

For a **topic**:

- Establish canonical vocabulary, major subdomains, important actors and
  institutions, core artifacts or standards, and the main resource or value
  flows.
- Find enough history to explain current divisions and defaults.
- Seek competing schools, substitutes, complements, bottlenecks, incentives,
  and active changes.
- Stop gathering when new sources add examples but no new major nodes,
  relationships, or fault lines.

For a **repository**:

- Read repository guidance, the root README, manifests, top-level tree, primary
  entry points, configuration, and representative tests.
- Identify runtime units, ownership boundaries, persistent state, external
  systems, public interfaces, and build/deploy paths.
- Trace one representative user or data flow end to end. Prefer a real vertical
  path over reading every directory.
- Inspect recent history only when it explains architecture, migration, or
  unfinished change.
- Stop when every load-bearing component has a role, a relationship, and at
  least one evidence anchor.

For a **hybrid**, map the repository first, then place only its important
external dependencies, standards, competitors, and users around it.

Use [references/map-lenses.md](references/map-lenses.md) for mode-specific
lenses, evidence targets, and output templates. Select only the lenses that
reveal structure for this subject.

### 3. Construct from the Center Out

Build the map in this order:

1. **Center:** the core job, problem, or invariant.
2. **Inner system:** the parts that directly perform that job.
3. **Supporting layer:** infrastructure, tools, governance, and enabling
   institutions.
4. **Outer ecosystem:** users, producers, competitors, complements, regulators,
   and external systems.
5. **Forces:** incentives, constraints, bottlenecks, feedback loops, and trends
   that move the system.

For every major node, state:

- its role;
- what it connects to;
- what passes across that connection;
- why the connection matters.

Merge nodes that have the same role. Omit isolated facts. The map is complete
when its important relationships are clear, not when every noun has appeared.

### 4. Trace Flows and Time

Explain at least one end-to-end flow:

- Topic mode: value, money, information, authority, supply, or attention.
- Repository mode: request, event, data, control, build, or deployment.

Then add a short evolution:

- What existed before?
- What changed the structure?
- Which legacy constraints remain?
- What is moving now?

Include history only when it explains a present-day boundary, convention,
tradeoff, or conflict.

### 5. Stress-Test the Picture

Before synthesizing, challenge the draft:

- Which important perspective is absent?
- Is a component described without its incoming and outgoing relationships?
- Are stated goals being mistaken for implemented behavior?
- Are two source names hiding the same underlying role?
- Is a popular example being mistaken for the whole category?
- Which claim would most change the map if false?
- What did the chosen boundary make invisible?

Mark disagreements and unknowns instead of smoothing them over. If the evidence
supports multiple plausible maps, show the alternatives and explain what would
distinguish them.

### 6. Explain the Landscape

Lead with the simplest useful model, then reveal detail in layers. Default to:

1. **The picture in one minute**
2. **Boundary and vocabulary**
3. **Landscape map** with a Mermaid diagram for a non-trivial system
4. **How the pieces fit together**
5. **The most important flow**
6. **How it got here and what is changing**
7. **Fault lines, tradeoffs, and blind spots**
8. **What to inspect or learn next**
9. **Evidence and unknowns**

Keep the prose primary; the diagram supports it. Use plain relationship labels
such as "publishes", "calls", "funds", "stores", "governs", or "competes
with". Do not create a dense diagram that is harder to understand than the
subject.

End with a prioritized orientation path:

- the first three concepts, files, or sources to examine;
- one representative flow to trace;
- one common misconception to avoid;
- one unresolved question worth investigating.

Return the map in chat unless the user requests a saved artifact. When saving,
use the user's path or default to `docs/landscape/<subject>.md`.

## Depth Control

- **Snapshot:** one-minute picture, 5-8 nodes, one flow, three next steps.
- **Standard:** layered map, 8-15 nodes, history, fault lines, evidence, and
  learning path.
- **Deep:** multiple maps or zoom levels, competing models, more source
  verification, and a saved artifact when useful.

Escalate to a dedicated deep-research workflow when the user needs an
investment-grade survey, exhaustive comparison, or decision backed by broad
source triangulation. Keep this skill responsible for orientation and
synthesis.

## Failure Handling

- If a repository is too large, map one vertical flow and its surrounding
  boundaries first, then identify the next zoom level.
- If code cannot be accessed, clearly separate a documentation map from an
  implementation map and list what remains unverified.
- If current web sources are inaccessible, use available primary evidence,
  label time-sensitive gaps, and avoid claims of completeness.
- If the subject is too broad, choose and state a useful boundary rather than
  producing a shallow encyclopedia.
- If the user names an unfamiliar term that could refer to multiple subjects,
  ask which one before researching.
