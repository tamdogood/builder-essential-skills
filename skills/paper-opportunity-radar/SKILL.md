---
name: paper-opportunity-radar
description: Run a cumulative daily or retrospective sweep of research papers on a chosen topic, audit their claims, methods, integrity signals, and independent support, then identify overlooked but feasible project or business opportunities in a detailed source-grounded report. Use when asked to monitor papers every day, mine buried research, evaluate whether a paper is credible or reproducible, find unimplemented research ideas, or separate promising work from hype, weak evidence, and retracted or contradicted results.
metadata:
  effort: high
---

# Paper Opportunity Radar

Treat the literature as an evidence base to traverse over time, not a feed to
summarize. Build a cumulative corpus, audit important papers at claim level,
look for what happened after publication, and turn only defensible gaps into
testable opportunities.

This skill runs when invoked. It does not silently create a background
scheduler. If the user wants a daily cadence, preserve resumable state and give
their scheduler the recurring prompt in [Daily Operation](#daily-operation).
Never say monitoring is active until a recurring job actually exists.

## Non-negotiable Standards

- **Never claim exhaustive coverage without a bounded corpus.** Define the
  databases, query strings, dates, languages, document types, and traversal
  cursor. Say "all records returned by this protocol," not "all papers ever."
- **Fact-check at claim level.** Every factual statement in a report needs a
  fetched source. Mark interpretations as `INFERENCE` and gaps as `UNKNOWN`.
- **A paper verifies what its authors reported, not that the result is true.**
  Independent replication, convergent evidence, or real-world validation is a
  separate evidence layer.
- **Do not infer fraud.** Use `INTEGRITY CONCERN` for observable anomalies. Use
  `RETRACTED`, `CORRECTED`, or `FORMAL MISCONDUCT FINDING` only when the
  publisher, institution, court, or regulator supports that status.
- **Citation count is attention, not validity.** Peer review, venue prestige,
  author reputation, and code availability are signals to inspect, never proof.
- **Absence of search results is not proof of novelty.** Report exactly where,
  how, and when prior art was searched and use `NOT FOUND IN SEARCH`.
- **Keep four judgments separate:** evidence strength, unexploredness
  confidence, implementation feasibility, and real-world value. Never average
  them into one score that hides a fatal weakness.

## Inputs and Defaults

Require a **topic**. Infer the remaining inputs when safe:

- decision: explore a business, find a project, understand feasibility, or
  monitor scientific progress;
- historical horizon: earliest searchable record through today by default;
- domains and adjacent fields;
- geography, language, and publication-type limits;
- available skills, capital, equipment, compute, data, and time;
- daily depth: `standard` by default; `brief` or `deep` when requested.

Ask one concise question only when the topic is missing or a domain ambiguity
would materially change the corpus. Otherwise state the inferred scope and
begin. For medical, legal, safety-critical, or investment decisions, describe
the work as research analysis and identify where a qualified professional is
needed.

## Durable Workspace

Use the user's requested location. Otherwise use
`research/paper-opportunity-radar/<topic-slug>/` and keep:

```text
scope.md                         Stable boundary, query atlas, and run policy
search-log.md                    Exact source/query/filter/time/result log
corpus.tsv                       Deduplicated paper inventory and queue
opportunity-ledger.md            Living opportunities, blockers, and verdicts
papers/<canonical-id>.md         One deep-audit dossier per paper
reports/YYYY-MM-DD.md            Detailed daily report
```

Use DOI as the canonical ID when available, then PMID/arXiv/other repository
ID, then a normalized title-year hash. `corpus.tsv` must include:

```text
paper_id title year canonical_url discovered_at discovery_source status relevance evidence_verdict next_action
```

Allowed status values are `discovered`, `triaged`, `queued`, `audited`,
`monitor`, and `excluded`. Never overwrite a prior report. Update living files
atomically and preserve user edits.

## Workflow

### 1. Frame a Falsifiable Search

Write the topic as:

1. the core phenomenon, mechanism, or problem;
2. synonyms, former names, acronyms, and neighboring terminology;
3. inclusion and exclusion rules;
4. the opportunity decision the research should inform;
5. what evidence would make a paper or opportunity uninteresting.

Read [references/discovery-protocol.md](references/discovery-protocol.md), then
write the query atlas and source plan to `scope.md`. If the topic is huge,
partition it by mechanism or use case. Do not silently narrow it.

### 2. Resume Before Searching

Read `scope.md`, the most recent report, unresolved paper dossiers,
`opportunity-ledger.md`, and `corpus.tsv`. Resume the recorded source cursor and
backfill window. On the first run, create these files and label the historical
corpus `BASELINE IN PROGRESS` until every planned source/time band has been
visited.

### 3. Traverse Three Lanes

Every daily run covers:

- **new delta:** papers published or indexed since the last successful run;
- **archive backfill:** the next unvisited historical source/query/time band;
- **follow-up graph:** references, forward citations, corrections, replications,
  and later implementations connected to high-value or disputed papers.

Use at least two independent scholarly indexes plus one domain index when one
exists. Search exact terms, controlled vocabulary, mechanism synonyms, and
application language. Record every exact query, filter, timestamp, result
count, new-paper count, and limitation in `search-log.md` before changing lanes.

Deduplicate before screening. A database hit is not a paper read. Triage every
new candidate for scope, paper type, accessible evidence, and likely audit
value; deep-audit only what can receive genuine attention. Queue the remainder
with a reason and resume cursor instead of pretending it was reviewed.

### 4. Select Papers for Deep Audit

Prioritize a balanced set:

- load-bearing or field-shaping claims;
- surprisingly large effects or unusually broad conclusions;
- under-cited work with a specific, testable mechanism;
- papers made newly feasible by cheaper compute, sensors, fabrication, data,
  distribution, regulation, or standards;
- negative results and abandoned prototypes that reveal a bottleneck;
- papers whose later citations disagree about whether the result holds.

`standard` depth means up to five full-paper audits per run. Increase only when
full text, context, and verification time allow it. A queued paper is more
honest than an abstract-only "deep dive."

### 5. Audit the Paper, Not Its Story

Read [references/evidence-audit.md](references/evidence-audit.md) before the
first deep audit in a run. For each selected paper:

1. resolve the canonical version, publication history, corrections,
   retractions, and conflicts;
2. extract each load-bearing claim with its population/system, input,
   comparator, outcome, uncertainty, and boundary conditions;
3. trace every claim to the method, table, figure, appendix, data, or proof that
   is supposed to support it;
4. inspect design fit, sampling, controls, leakage, exclusions, outcome
   switching, statistics, robustness, code/data provenance, and reproducibility
   using the correct domain branch;
5. search backward and forward for independent replication, contradiction,
   failed follow-up, meta-analysis, post-publication review, and deployed use;
6. write a dossier with evidence citations, uncertainty, and the decisive next
   verification step.

If only an abstract is accessible, label the dossier `ABSTRACT-ONLY`, cap the
evidence score at 2/5, and do not issue an integrity verdict. Never bypass a
paywall or invent missing methods.

### 6. Assign an Evidence Verdict

Use the evidence rubric in the audit reference and choose one:

- `SUBSTANTIATED`
- `PROMISING — UNREPLICATED`
- `MIXED OR FRAGILE`
- `CONTRADICTED OR NOT REPRODUCED`
- `INTEGRITY CONCERN — UNRESOLVED`
- `RETRACTED OR SUPERSEDED`
- `INSUFFICIENT ACCESS`

State what the verdict applies to. A correction may invalidate one result but
not the whole paper. Record contrary evidence even when the paper remains
promising.

### 7. Harvest and Challenge Opportunities

Read
[references/opportunity-and-report.md](references/opportunity-and-report.md).
Separate the demonstrated mechanism from the authors' proposed application.
Generate opportunities from validated capabilities, newly removable
bottlenecks, cross-domain transfers, enabling tools, datasets, replication
needs, and unserved workflows.

For every candidate, conduct a prior-art and implementation sweep across later
papers, patents, repositories, products, standards, trials, procurement, and
the status quo as relevant. Then assess:

- evidence strength, 0–5;
- unexploredness confidence, 0–5;
- technical and operational feasibility, 0–5 each;
- user pain and value-capture evidence, 0–5;
- safety, regulatory, IP, ethical, and adoption blockers;
- the cheapest decisive experiment and explicit kill criterion.

Only promote an opportunity when its evidence score is at least 3/5, unless the
opportunity itself is to resolve the evidence gap. Rank by bottleneck and next
experiment, not by excitement.

### 8. Write the Daily Report

Write `reports/YYYY-MM-DD.md` using the template in the opportunity reference.
Lead with the decision-relevant findings, then show the coverage and method.
Include papers rejected as weak or already implemented; filtering is a result,
not invisible labor.

Before delivery, verify:

- every factual claim has a nearby fetched citation;
- every load-bearing conclusion has two independent-origin sources or is
  labeled `SINGLE-SOURCE`;
- every cited URL resolves and supports the sentence;
- dates, versions, sample sizes, effect sizes, units, and denominators match the
  primary source;
- direct evidence, author claim, inference, and unknown are visibly distinct;
- current product, patent, regulatory, and implementation claims include an
  as-of date;
- search coverage and unsearched blind spots are explicit;
- the report, dossiers, corpus, opportunity ledger, and next-run cursor agree.

### 9. Hand Off the Next Run

End with the next archive band, unresolved verification tasks, monitored
papers, and opportunities awaiting experiments. For a recurring scheduler, use:

```text
Use $paper-opportunity-radar to run today's cumulative sweep for <topic>.
Resume <workspace>; do not restart the corpus. Cover the new delta, the next
archive-backfill band, and unresolved citation or replication follow-ups. Audit
the strongest candidates, update every ledger, and write today's detailed
source-grounded report. Do not claim completeness beyond the logged protocol.
```

## Failure Handling

- If a source blocks access or rate-limits, record the failed source and time,
  use a documented alternative, and leave the lane incomplete.
- If metadata conflicts, prefer the publisher or canonical repository for
  version facts and preserve the disagreement.
- If full text, supplements, code, data, or a preregistration are unavailable,
  lower confidence and name the artifact needed. Non-availability alone is not
  evidence of misconduct.
- If reproduction needs unsafe procedures, protected data, expensive equipment,
  or credentials, do not attempt it. Design a bounded verification plan.
- If novelty cannot be established, keep the opportunity but label it
  `PRIOR-ART SEARCH INCOMPLETE`.
- If the baseline is larger than the run budget, finish one auditable slice,
  persist the cursor, and report the backlog. Never trade audit quality for a
  false claim of traversal.

## Completion Criteria

A run is complete only when the search log is reproducible, new records are
deduplicated, selected papers have claim-level dossiers, integrity language is
responsible, opportunities have prior-art and feasibility checks, the detailed
report is source-grounded, and the next run can resume without rediscovery.
