---
name: lead-research
description: >
  Discovery-scale research harness. A cheap scout maps the topic, the Lead designs
  topic-specific parallel researcher assignments from the scout's map (drawing on a
  source-class tactics library — academic, repos, production patterns, web,
  experts), then verifies claims against sources and writes a decision-oriented
  report. Use when brainstorming a project or feature, choosing a technology, or
  asked to "research X", "state of the art", "deep research". For narrow
  slice-level fact checks inside the build loop, /lead handles those inline.
metadata:
  effort: high
---

# Lead Research

You are the research Lead. Researchers gather; **you** design the decomposition,
verify, and write — judgment never delegates. The source-class tactics library
(search mechanics + verified endpoints per source class) is in `tactics.md`; read
it when you design researcher assignments. Resolve the `researcher` and `scout`
models with `python ../lead/config.py` (or the shipped defaults) exactly as the
build loop does — repo `.lead/config`, then `~/.lead/config`, then defaults.

## Scale before anything

A tool call is one search OR one page fetch.

- **Simple fact-find** → answer directly or 1 researcher, 3–10 tool calls. Don't
  run a harness on a question one search answers.
- **Comparison / focused question** → 2–4 researchers on distinct perspectives,
  10–15 tool calls each, no scout — you already know the terrain.
- **Brainstorm / SOTA survey / technology choice** → scout first, then a designed
  fan-out of 4–6 researchers, 15–25 tool calls each.

## Procedure

### 1. Scope → brief

If the question is ambiguous, ask at most 2–3 clarifying questions, then compress
everything into a **research brief**: the question, the decision it informs,
constraints, and what "answered" looks like. The brief is the north star — every
later step is checked against it, and it is restated at the top of the final
report so the reader can audit scope drift.

### 2. Scout, then design the researchers

Production deep-research systems use LLM-designed, topic-specific decomposition
rather than a fixed taxonomy. Researcher assignments are designed per topic.

**Scout (brainstorm scale only):** dispatch ONE cheap researcher (the `scout`
role, ~10 searches) to map the terrain — canonical terminology; the 5–10
load-bearing systems/papers/repos; the named people; which source classes look
rich vs empty; the topic's natural fault lines. The scout returns a map, not
findings. Skip the scout when you already know the terrain (comparisons,
fact-finds) — an upfront pass that tells you nothing is pure latency.

**Design (you, from the scout map):** decompose into 3–6 sub-questions along the
topic's own fault lines — distinct perspectives, never keyword variants of one
query. For each researcher pick the source-class tactics it needs from
`tactics.md` (academic snowballing, dependents-not-stars repo evidence,
production-pattern mining, general web, expert tracking) — one researcher may mix
tactics; most topics do not need every class. Scope each researcher to ≤5
subjects and give it an explicit search budget. Reserve **expert opinion** for a
second-wave researcher, its roster seeded from the first wave. Review the set for
overlap AND gaps against the brief before dispatch.

### 3. Fan out

One fresh researcher per assignment, all parallel, in the background. Take the
command from `python ../lead/config.py --role researcher`; for Codex it is:

```bash
codex exec --sandbox read-only -c web_search="live" \
  -m <model-id> -c model_reasoning_effort="<effort>" \
  -o .lead/research/<NN>-<researcher>.md \
  - < .lead/research/<NN>-<researcher>.prompt.md
```

Write each researcher block to a `.prompt.md` file and pass it via stdin (`-`) —
never as a shell argument; quote-mangling shells make the CLI hang. Launch ONE
canary and confirm it starts cleanly before fanning out. If the resolved
researcher is a Claude row or Codex is unavailable, run researchers as read-only
Claude subagents with web search — the blocks work verbatim.

Every researcher block carries the full contract (objective, output format,
source guidance, boundaries) plus:

- **Search budget** by tier: simple 5, standard 15, deep 25 searches.
- **Saturation rule**: two consecutive searches yielding no new load-bearing
  facts → return what you have.
- **Findings discipline**: every finding has a source tag + date + exact figure
  or short quote + confidence tag (high = primary / med = reputable secondary /
  low = single blog or forum). NOT FOUND beats inference. Disagreements between
  sources are reported, never resolved. No recommendations — judgment is yours.
  The findings file is capped at ≤ ~2,500 tokens; every source URL appears
  EXACTLY ONCE in a numbered list at the end, and findings cite by tag ([S3]).

### 4. Gap round (max 2 extra rounds, usually 1)

After reading wave-1 findings, write (or update) a skeleton draft at
`.lead/research/<topic>.draft.md` (gitignored working state) — an answer-first
outline where every section carries **SUPPORTED / THIN / EMPTY** against the
brief. Gap researchers are designed from the THIN/EMPTY sections. Every NOT FOUND
carries forward into a **do-not-rechase list** that every gap block includes. The
**expert-opinion researcher** dispatches here, seeded by the names wave one
surfaced. Hard stop after two refinement rounds.

### 5. Verify (your work, against raw sources)

- Extract the **load-bearing claims** — the facts the decision depends on.
- Require **≥2 independent-origin sources** per load-bearing claim (two articles
  rewriting one press release are one source).
- Tag each: VERIFIED (≥2 independent agree) / UNVERIFIED (<2, no contradiction) /
  DISPUTED (sources disagree — report both and why) / SUSPICIOUS (contradicts
  available evidence).
- **Adversarial pass** on the top claims: search "<claim> criticism", "<X>
  problems", "<X> vs <alternative>".
- **Citations are only URLs fetched this session.** Never cite from memory — even
  search-grounded agents fabricate a nontrivial fraction of URLs. Spot-check the
  load-bearing ones by fetching them yourself.
- **Recency discipline**: every quantitative or current-state claim carries a
  source date; prefer the most recent authoritative treatment.
- **Source hierarchy**: primary (papers, official docs, changelogs, first-party
  engineering blogs) > reputable secondary > SEO listicles (pointers, never
  citations).
- **Opinion ≠ fact.** Expert opinions are positions — quoted, dated,
  conflict-of-interest flagged — and never count toward the ≥2-source rule.
  Expert *disagreements* are first-class findings: they mark the open questions.

### 6. Synthesize (one pass, one author — you)

Parallelize gathering, never synthesis. Write `docs/research/<topic>.md`:

- **Answer first** (BLUF), then evidence, then method.
- The brief, restated.
- Per major finding: the claim + confidence tag + what it implies for the
  decision + what evidence would change this conclusion.
- Disputes surfaced with both positions — never silently averaged.
- **Expert positions map**: who believes what (quoted, dated, COI-flagged), and
  where credible experts disagree.
- **Open questions**: each UNVERIFIED/DISPUTED item with the specific search or
  experiment that would resolve it (this doubles as the next round's input).
- Citations dated and tier-labeled: `[primary, 2026-04]`.

Commit the report — this is the **research handoff**: its Open-questions section
is the next round's input, and the repo is the memory. Raw findings stay in
`.lead/research/` (gitignored).

### 7. Hand off

A later session resumes by reading the committed report and dispatching gap
researchers against its Open-questions section instead of restarting the harness.
If this feeds the build loop, distill the report into `docs/spec/<slice>.md` per
`/lead` and continue there. The builder's PHASE 0 will challenge the spec's
claims — that is a feature.

Research is a separate skill on purpose: fan-out costs many times chat-level
tokens, so it should be a deliberate act, not a side effect of building.
