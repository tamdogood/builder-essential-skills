# Opportunity Analysis and Daily Report

An unusual paper is not yet an opportunity. An opportunity needs a credible
capability, an unsolved problem, a feasible path, and evidence that the gap is
not already occupied.

## 1. Separate the layers

For each promising paper, extract:

- **demonstrated:** what the evidence directly establishes;
- **proposed:** what the authors believe might follow;
- **enabled now:** what changed since publication;
- **still blocking:** the binding technical, economic, regulatory, safety,
  data, manufacturing, IP, distribution, or adoption constraint;
- **customer reality:** whose costly or urgent problem this could change.

Keep a paper on the opportunity ledger when the mechanism is useful even if the
authors' original application is not.

## 2. Search opportunity archetypes

- a sound old result whose original bottleneck has recently become cheaper;
- a cross-domain transfer where the mechanism is known but the workflow is not;
- an abandoned prototype that failed for a now-removable dependency;
- a measurement, dataset, benchmark, or verification tool others need;
- a narrow enabling component instead of the paper's grand end product;
- a negative result that reveals what a successful design must avoid;
- a reproducibility, quality-control, compliance, or integration service;
- a public-good result with a viable delivery, licensing, or service model;
- a research technique that solves a painful non-research workflow.

Do not force every paper into a startup. `NO ACTIONABLE OPPORTUNITY` is a valid
and useful result.

## 3. Run the prior-art and implementation sweep

Search with the paper title, mechanism, outcome, synonyms, author names, cited
and citing work, and application-specific language. Use the relevant surfaces:

- later papers, reviews, replications, and standards;
- patents and patent families, including expired or abandoned claims;
- source repositories, packages, datasets, model hubs, and archived projects;
- commercial products, vendors, acquisitions, pricing, and customer case
  studies;
- clinical or field trials and regulatory databases;
- procurement records, grants, technical reports, theses, and conference demos;
- the manual workaround or status quo that already solves enough of the job.

Record exact searches and dates. A dormant repository may still be prior art; a
patent may not cover a working product; a paper implementation may not solve a
user's workflow. Preserve these distinctions. Patent presence and apparent
absence are not freedom-to-operate opinions—recommend qualified counsel before
material investment.

Use one of these unexploredness labels:

- `OCCUPIED`
- `PARTIALLY OCCUPIED — DIFFERENT WEDGE`
- `NOT FOUND IN SEARCH — STRONG COVERAGE`
- `NOT FOUND IN SEARCH — LIMITED COVERAGE`
- `PRIOR-ART SEARCH INCOMPLETE`

## 4. Test feasibility

Score and explain each dimension separately:

| Dimension | Questions |
| --- | --- |
| Technical | Can the key result be reproduced at useful scale and reliability? |
| Inputs | Are data, materials, equipment, talent, compute, and licenses obtainable? |
| Economics | What drives unit cost, capex, maintenance, margin, and time-to-value? |
| Safety/ethics | What could cause harm, exclusion, surveillance, misuse, or environmental cost? |
| Regulation/IP | Which approvals, standards, data rights, export rules, and patent claims matter? |
| Adoption | Who changes behavior, integrates it, trusts it, pays, and bears switching cost? |
| Defensibility | Does learning, data, workflow ownership, distribution, or manufacturing compound? |

Use feasibility scores consistently:

- 0: violates a known constraint or needs unavailable science;
- 1: no credible path with current resources;
- 2: plausible but blocked by a major unresolved dependency;
- 3: prototype path is credible; scale or adoption remains uncertain;
- 4: key dependencies are demonstrated and an execution path is clear;
- 5: independently demonstrated in conditions close to the target use.

Identify the **binding constraint**. A long list of minor risks must not hide one
fatal dependency.

## 5. Define the decisive experiment

Every promoted opportunity needs:

- hypothesis;
- smallest prototype or real-world test;
- target user or operating condition;
- observable success metric and fixed denominator;
- time, cost, equipment, data, and skill assumptions;
- safety and stop conditions;
- pass, ambiguous, and kill thresholds;
- the next action for each threshold.

Prefer an experiment that can falsify the opportunity before a product is
built. When the biggest uncertainty is demand, use interviews, observation,
precommitment, or paid behavior—not compliments. When the uncertainty is the
paper, reproduce the decisive result before market work.

## 6. Opportunity memo

For each candidate in `opportunity-ledger.md`, keep:

1. one-sentence opportunity and target user;
2. source papers and evidence verdicts;
3. demonstrated mechanism versus inference;
4. why now and why it may have stayed buried;
5. implementation and prior-art search log;
6. closest alternatives and status quo;
7. evidence, unexploredness, technical feasibility, operational feasibility,
   and value scores—with separate rationales;
8. binding constraint and disconfirming evidence;
9. safety, regulatory, ethical, IP, and adoption risks;
10. decisive experiment and kill criterion;
11. status: `watch`, `verify paper`, `test`, `promote`, `occupied`, or `drop`;
12. what would change the verdict.

## 7. Detailed daily report template

Write `reports/YYYY-MM-DD.md` in this order:

```markdown
# Paper Opportunity Radar — <topic> — <date>

## Bottom line
<What became more or less believable today, the best opportunity if any,
and the binding uncertainty.>

## Coverage and honesty statement
- Scope and historical horizon:
- Sources and exact search-log link:
- New-delta window:
- Archive-backfill band completed:
- Citation/replication branches followed:
- Records returned / new / deduplicated / screened / full-text / audited:
- Known blind spots and incomplete lanes:
- Baseline status and next cursor:

## What changed today
<Only changes from prior state: new evidence, overturned beliefs, corrections,
implementations, or newly feasible constraints.>

## Papers deeply audited
### <paper citation and stable ID>
- Selection reason:
- Authors' central claim:
- What the evidence directly supports:
- Strongest evidence:
- Strongest counterevidence or flaw:
- Integrity/retraction/correction status:
- Independent replication or contradiction:
- Evidence score and scoped verdict:
- Harvestable mechanism:
- Decisive next check:
- Dossier:

## Opportunity scoreboard
| Opportunity | Source evidence | Unexploredness | Technical | Operational | Value | Binding constraint | Next experiment | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |

## Opportunity memos
<One complete memo for every new or materially changed candidate.>

## Filtered out, contradicted, or already occupied
<Paper/opportunity, reason, supporting source, and whether to revisit.>

## Claim verification ledger
| Report claim | Evidence type | Primary source | Independent source | Status | Notes |
| --- | --- | --- | --- | --- | --- |

## Unknowns and disputes
<What cannot yet be established, why, and the exact artifact/search/experiment
that would resolve each item.>

## Next run
- New-delta start:
- Archive band/query/source cursor:
- Papers queued for deep audit:
- Follow-ups and monitored updates:
- Opportunity experiments awaiting evidence:

## Sources
<Fetched canonical sources, each listed once with type, date, and access date.>
```

## 8. Final quality bar

Reject the report if it:

- uses an abstract as if it were a methods audit;
- calls a finding fraud without authoritative support;
- treats a citation, patent, repository, or product page as independent
  scientific validation;
- claims nobody implemented an idea without a logged prior-art search;
- recommends an opportunity without a binding constraint and kill test;
- lacks counts that reconcile search, screening, and audit work;
- hides negative findings or already-occupied opportunities;
- restarts discovery instead of advancing the saved corpus.
