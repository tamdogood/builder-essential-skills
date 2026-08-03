# Discovery Protocol

Use this protocol to build high recall without making an indefensible claim of
exhaustiveness. The unit of progress is a logged source/query/time-band slice.

## 1. Build the query atlas

Create query families before searching:

| Family | Include |
| --- | --- |
| Canonical | Field-standard name and controlled vocabulary |
| Historical | Former names, obsolete terminology, translated terms |
| Mechanism | Physical, biological, computational, or causal mechanism |
| Outcome | What changes, improves, fails, or becomes measurable |
| Application | User, industry, workflow, environment, or disease/problem |
| Adjacent | Substitutes, complements, analogous mechanisms in other fields |
| Skeptical | Replication, correction, retraction, criticism, failure, negative result |

Store exact Boolean strings and field filters. Do not search only the user's
phrasing; buried work often uses older or disciplinary language.

## 2. Use complementary source layers

Search at least two multidisciplinary indexes and a relevant field index. These
links are routing documentation, not endorsements of completeness:

- [OpenAlex API](https://developers.openalex.org/api-reference/introduction) for
  works, authors, sources, topics, filters, and citation relationships;
- [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
  for DOI metadata and publisher-deposited updates;
- [Semantic Scholar Academic Graph](https://api.semanticscholar.org/api-docs/graph)
  for paper, reference, citation, and recommendation traversal;
- [arXiv API](https://info.arxiv.org/help/api/index.html) for arXiv-covered
  fields and version histories;
- [NCBI E-utilities](https://www.ncbi.nlm.nih.gov/books/NBK25501/) and
  [Europe PMC](https://europepmc.org/RestfulWebService) for biomedical and life
  sciences;
- [ClinicalTrials.gov API](https://clinicaltrials.gov/data-api/api) for trial
  registration and results follow-up;
- field repositories, conference proceedings, theses, and institutional
  archives when the topic's publication culture requires them.

Use reviews and meta-analyses to seed vocabulary and references, not as a
substitute for reading the primary papers. Use general web search to find
publisher pages, repositories, post-publication discussion, implementations,
and sources that scholarly indexes miss.

## 3. Traverse time deliberately

On the first run:

1. find recent systematic reviews or surveys and canonical seed papers;
2. run the full query atlas across each planned source;
3. partition high-volume results into explicit publication-date bands;
4. sample every band to test whether terminology changed;
5. queue the bands and record their cursors as `BASELINE IN PROGRESS`.

On later runs, cover the new-indexed delta and advance exactly one or more
backfill bands. Do not keep searching the recent literature while an old band
remains untouched.

## 4. Snowball without creating an echo chamber

For each load-bearing seed:

- inspect references for prior mechanisms and null results;
- inspect forward citations for replication, contradiction, extension, and
  implementation;
- search semantic neighbors that do not share the same citations;
- search the claim and mechanism without the seed author's terminology;
- inspect relevant work from independent groups and competing schools.

Two papers from the same lab, dataset, trial, benchmark, or consortium are not
independent evidence. Record the shared origin.

Stop a graph branch after two consecutive expansion batches add no new relevant
paper, terminology, contradictory result, or implementation class. This is a
saturation heuristic, not proof that nothing else exists.

## 5. Deduplicate and version

Match in this order:

1. DOI;
2. PMID, arXiv ID, or other stable repository identifier;
3. normalized title plus first author and year;
4. manual comparison when titles changed between preprint and publication.

Link preprint, accepted manuscript, version of record, correction, and
supplement as versions of one work. Preserve publication and version dates.
Treat conference and journal versions as one work only after comparing whether
the claims or evidence materially changed.

## 6. Log coverage

Append one row per source/query slice to `search-log.md`:

```text
run_at | source | exact_query | filters | time_band | results_seen | new_records | cursor_or_page | status | limitation
```

The daily report must distinguish:

- records returned;
- records deduplicated;
- records title/abstract screened;
- full texts accessed;
- papers deeply audited;
- papers excluded, with reason;
- papers queued for later.

Report missing databases, paywalls, language restrictions, indexing lag,
unavailable archives, and API failures. A reproducible partial search is more
useful than an opaque claim of total coverage.

## 7. Source handling rules

- Fetch the canonical page before citing it; a search snippet is not evidence.
- Respect access controls, robots rules, licenses, and rate limits.
- Back off on throttling and preserve the last successful cursor.
- If a source needs an API key, use a configured key without exposing it. When
  no key is available, log the limitation and use a documented alternative;
  never ask the user to paste a secret into the report or chat.
- Prefer stable identifiers and canonical URLs over tracking links.
- Record access dates for mutable sources.
- Never fabricate a citation from a title, DOI pattern, or remembered URL.

For systematic-review-grade work, use the
[PRISMA-S reporting checklist](https://www.equator-network.org/reporting-guidelines/prisma-s/)
as a completeness check for search reporting.
