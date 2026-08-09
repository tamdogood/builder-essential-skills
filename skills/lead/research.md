# Inline research fan-out

Use this only for a load-bearing fact, failure diagnosis, or unfamiliar API
inside a build run. Discovery-scale work belongs to `/lead-research`.

The Lead never searches, fetches sources, verifies claims, or writes the spec.
It dispatches native agents, reads their compact verdicts, and decides whether
the evidence is sufficient.

## Flow

1. Spawn one Research planner with the question, approved slice, and decision it
   informs. It returns 2–5 narrow, non-overlapping assignments and a source plan.
2. Approve or revise the assignments, then spawn one fresh Researcher per
   assignment in parallel within the runtime's proven concurrency limit.
3. Spawn a fresh Verifier with the raw findings. It fetches every load-bearing
   source, checks independent origin, runs an adversarial search, and writes a
   claim matrix.
4. If the matrix is thin, dispatch only the named gap assignments. Stop after
   two gap rounds.
5. Spawn a Spec writer to distill verified claims into
   `docs/spec/<slice>.md`, then a fresh Reviewer to check the spec against the
   claim matrix and sources.
6. On PASS, an Integrator commits the spec. Raw working files remain under
   `.lead/research/`.

No agent may both gather and verify the same claim, or write and approve the
same spec. If web/network access is unavailable, record NOT VERIFIED and stop;
the Lead must not research directly as a fallback.

## Researcher block

```text
ROLE: Researcher
QUESTION: <one narrow question>
DECISION: <what implementation decision this evidence informs>
BOUNDARY: read repo/web; write only <findings path>; do not write code or
          recommend a choice
BUDGET: <search/fetch limit>

Return <=2,500 tokens:
- Findings, each with [S#], source date, exact figure or short quote, and
  confidence (high primary / medium reputable secondary / low single informal
  source).
- Disagreements and NOT FOUND items; never fill gaps from memory.
- The 2–3 findings most likely to change the implementation.
- One numbered source list; every fetched URL appears exactly once.
End with: RESEARCH: COMPLETE | BLOCKED <reason>
```

## Verifier block

```text
ROLE: Verifier
INPUTS: <raw findings paths>
DECISION: <the implementation decision>
BOUNDARY: read repo/web; write only <claim-matrix path>; do not write code or
          recommendations

Extract only load-bearing claims. Fetch the cited sources yourself. Require two
independent-origin sources for VERIFIED; two articles repeating one upstream
claim count as one. Search for criticism, failure reports, and alternatives.
Label each claim VERIFIED, UNVERIFIED, DISPUTED, or SUSPICIOUS with exact source
evidence and dates. Carry every NOT FOUND item into a do-not-rechase list.
Write the claim matrix to <path>.
End with: VERIFY: PASS | THIN | BLOCKED <reason>
```

## Spec-writer block

```text
ROLE: Spec writer
INPUTS: <approved goal, claim matrix, open questions>
OWNERSHIP: docs/spec/<slice>.md only

Write problem, decision and rationale, requirements, non-goals, verified facts
with citations, and open questions. Use no claim absent from the matrix. Mark
UNVERIFIED and DISPUTED evidence explicitly. Do not implement.
End with: SPEC: READY | BLOCKED <reason>
```

The final slice references the committed research spec instead of restating it.
The Builder's disagreement pass should challenge its claims against the live
repository and dependencies.
