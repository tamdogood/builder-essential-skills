# Inline research fan-out (for the build loop)

Read this only when a research trigger fires inside the factory (an oddity, a
failure diagnosis, a load-bearing fact the spec depends on). The fan-out uses the
`researcher` role as parallel web-research subagents — read-only, live search, on
the flat-rate subscription — and the Lead keeps all judgment: it verifies the
load-bearing claims and writes the spec itself. For discovery-scale research, use
the separate `/lead-research` skill; this is the slice-scale version.

## Fan out

Resolve the researcher model with `python skills/lead/config.py --role
researcher`. Decompose the question into 3–5 narrow, NON-OVERLAPPING questions —
cover different angles, not one angle five times. Typical split: official
docs/reference; changelog / breaking changes; community failure reports;
alternatives/comparisons; security/operational constraints.

One fresh researcher per question, all launched in parallel in the background.
Take the exact command from the resolver; for Codex it looks like:

```bash
codex exec -C <repo-root> --sandbox read-only -c web_search="live" \
  -m <model-id> -c model_reasoning_effort="<effort>" \
  -o .lead/research/<NN>-<topic>.md \
  - < .lead/research/<NN>-<topic>.prompt.md
```

Write each research block to a `.prompt.md` file and pass it via stdin (`-`),
never as a shell argument — quote-mangling shells make the CLI hang on stdin.
Launch ONE canary researcher and confirm it starts cleanly before fanning out. If
the resolved researcher is a Claude row or Codex is unavailable, run the fan-out
as read-only Claude subagents with web search — the block below works verbatim.

- `--sandbox read-only`: researchers never write to the repo.
- Effort is coverage-tier (`high`, not `xhigh`); synthesis happens on the Lead's
  side.
- Scope each researcher to ≤5 subjects and put hard context rules in the block
  (snippet over page; quote ≤2 sentences; stop the moment you can answer) — a
  researcher that fills its context window dies without writing its output.
  Bisect and re-dispatch a dead researcher; do not re-run it as-is.

## Research block template

```text
You are a web research agent. Answer ONE question. Do not write code, do not make
recommendations - judgment belongs to the Lead who reads your output.

QUESTION: <one narrow question>

OUTPUT FORMAT - a markdown report, <= ~2,500 tokens total:
- Findings as bullets. EVERY finding carries: a source tag (e.g. [S3]), source
  date (if shown), the exact figure or a short direct quote, and a confidence tag
  (high = primary source / med = reputable secondary / low = single blog or forum).
- Prefer primary sources (official docs, changelogs, release notes, source code)
  over blog posts. Record exact version numbers and dates.
- When sources disagree, report the disagreement - do not resolve it.
- If you cannot find evidence, write NOT FOUND - never infer or fill gaps from
  prior knowledge without flagging it.
- End with a numbered source list - every source URL appears EXACTLY ONCE - then
  the 2-3 findings most likely to change an implementation decision.
```

## Gather (Lead — your work, not a subagent's)

1. Read every findings file in `.lead/research/`.
2. Identify the **load-bearing claims** — the facts the spec will depend on (an
   API shape, a version constraint, a limit, a deprecation). Adversarially verify
   each against a second independent source or the live dependency itself.
   Discard single-source low-confidence claims or mark them as open questions.
3. Write `docs/spec/<slice>.md`: problem, decision + why, requirements, non-goals,
   verified facts **with citations**, open questions for the human. You write it;
   researchers gather, you judge.
4. Commit the spec. Raw findings stay in `.lead/research/` (gitignored) — only the
   distilled, cited spec is repo memory.
5. The slice spec references this spec instead of restating it; the builder's
   PHASE 0 is expected to challenge the spec's claims.
