# Source-class tactics library

Researcher assignments are DESIGNED per topic by the Lead (SKILL.md step 2); the
sections below are search tactics and verified endpoints per source class — draw
on whichever a designed researcher needs, mix freely. Every researcher block
starts with this preamble, then the researcher-specific objective:

```text
You are a web research agent. Answer ONE assigned objective. Do not write code,
do not make recommendations - judgment belongs to the Lead reading your output.
Budget: <N> searches; if two consecutive searches yield no new load-bearing
facts, stop and return. HARD CONTEXT RULES: never open a full page when the
search snippet answers the question; quote at most 2 sentences per source; the
moment you can answer, STOP and write your findings - partial findings beat
context exhaustion (a researcher that fills its window dies without writing
anything). OUTPUT: markdown findings, <= ~2,500 tokens - every finding carries a
source tag (e.g. [S3]), source date, the exact figure or a short direct quote,
and a confidence tag (high = primary / med = reputable secondary / low = single
blog or forum). Prefer primary sources. Record exact version numbers and dates.
When sources disagree, report the disagreement - do not resolve it. If you cannot
find evidence, write NOT FOUND - never fill gaps from prior knowledge without
flagging it. End with a numbered source list - every source URL appears EXACTLY
ONCE, numbered [S1], [S2], ... - then the 2-3 findings most likely to change a
design decision.
```

**Researcher scoping rule:** cap each researcher at ~5 subjects (repos, vendors,
people). Doc-heavy assignments burn the context window on fetched pages. A
researcher that dies returns NOTHING (the `-o` output only materializes on a
clean finish). If a researcher dies this way, bisect the assignment into narrower
researchers and re-dispatch; do not re-run it as-is.

## Researcher 0 — Scout (brainstorm scale; runs before assignment design)

Objective template: map the terrain of <topic> — do NOT gather findings. Return:
(1) canonical terminology and the names the field itself uses; (2) the 5–10
load-bearing systems/papers/repos/vendors, one line each on why they matter;
(3) the named people whose positions recur; (4) which source classes look rich vs
empty (papers? repos? vendor blogs? forums?); (5) the topic's natural fault lines
— the 3–6 sub-questions an expert would split it into. Budget ~10 searches;
breadth over depth; snippet over page. Output is a MAP for the Lead to design
researchers from — structure matters more than completeness.

## Researcher 1 — Academic (latest papers)

Objective: the current academic state of <topic> — most recent survey, the latest
preprints, and which papers the field treats as load-bearing.

Pipeline: **survey first → latest sweep → snowball → score.**

- Recent survey: Semantic Scholar `publicationTypes=Review`, or arXiv
  `ti:survey AND abs:<topic>` (last ~18 months). The survey supplies canonical
  terminology and the seed bibliography.
- Latest sweep (newest first): the arXiv Atom API
  `https://export.arxiv.org/api/query?search_query=cat:<cs.XX>+AND+abs:%22<topic>%22&sortBy=submittedDate&sortOrder=descending&max_results=25`
  (uppercase AND/OR; wait ~3s between calls) and Semantic Scholar
  `https://api.semanticscholar.org/graph/v1/paper/search?query=<topic>&fields=title,year,citationCount,tldr,venue&limit=20`
  (expect 429s — back off and retry; the `tldr` field is gold for triage).
- Snowball from the 2–3 most relevant seeds — forward citations and semantic
  neighbours via the Semantic Scholar graph API; fall back to OpenAlex
  `https://api.openalex.org/works?search=<topic>&sort=publication_date:desc&per-page=25`
  when S2 throttles.
- Score candidates by citations-per-month (not raw count — meaningless for 2026
  papers), venue/review decision, code availability. Red flags: preprint-only
  after 18+ months, self-citation-heavy.

## Researcher 2 — Popular repos (what the ecosystem actually uses)

Objective: the 5–10 repos/libraries the ecosystem has actually adopted for
<topic>, with adoption evidence beyond stars.

- Discovery: GitHub search — `topic:<topic> stars:>1000 archived:false sort:stars`,
  `"<topic>" in:name,description,readme stars:>2000`, plus awesome-lists as recall
  boosters — re-check `pushed:` on every list entry; lists go stale.
- **Adoption evidence beats stars**: dependents via `https://api.deps.dev` or
  `https://packages.ecosyste.ms` (keyless); registry download trends
  (`https://pypistats.org`, `https://api.npmjs.org/downloads`).
- **Fake-star check**: stars without proportional forks/issues/dependents = flag
  it. Report stars AND dependents AND last release for every repo.

## Researcher 3 — Cutting-edge repos (emerging, not hype)

Objective: what's emerging in <topic> in the last ~6 months that practitioners are
actually adopting — and which hyped repos are already abandoned.

- Where bleeding-edge surfaces first: Hacker News via Algolia
  `https://hn.algolia.com/api/v1/search_by_date?query=<topic>&tags=story&numericFilters=points>50`;
  `https://lobste.rs/t/<tag>.json`; GitHub
  `topic:<topic> created:>{90d ago} stars:>100 pushed:>{14d ago} sort:stars`.
- **Emerging-vs-hype test** (report which side each repo lands on): EMERGING =
  created recently AND pushed <14d AND sustained star velocity AND maintainer
  responses AND forks/issues growing in proportion to stars. HYPE = week-one
  spike then stalled pushes, unanswered issues, README >> code, single
  contributor, no tests/releases. Any single signal is gameable; the conjunction
  is not.

## Researcher 4 — Production-grade design patterns

Objective: how 2–3 production libraries adjacent to <topic> design the thing we're
about to build — API ergonomics, error handling, extension points, testing
patterns — and where they differ.

- Select subjects with the production-grade test: pushed <6mo (or explicitly
  stable + responsive issues), tagged releases + changelog in the last 12mo,
  dependents >100 (ecosystem-adjusted), ≥2 active maintainers, CI runs tests on
  PRs, OSI license. Ignore raw stars and commit counts.
- Reading order — never start at file #1: README + manifest (the deliberate
  public surface) → trace ONE canonical happy-path call end to end → tests for the
  relevant feature → 3 closed issues + 2 merged PRs in the area (the "why not").
- Extract four categories per library: API ergonomics, error handling, extension
  points (grep for hook/adapter/middleware/plugin/register/Protocol), testing
  patterns. Then the cross-library diff: shared patterns are load-bearing; where
  they differ is a trade-off to document.
- Tools: GitHub code search (`symbol:`, `/regex/`, `repo:`, `path:`),
  `https://grep.app`, `https://sourcegraph.com/search`.

## Researcher 5 — General web

Objective: everything the other researchers structurally miss on <topic> — expert
blog posts, postmortems and failure reports, comparisons, official vendor
docs/changelogs, pricing/operational constraints.

- Standard multi-angle sweep: official docs/changelogs; named-expert posts;
  "<X> postmortem" / "<X> at scale" / "<X> problems"; "<X> vs <Y>". Date-restrict
  queries on fast-moving topics.
- Source hierarchy applies hardest here: SEO listicles and AI-generated
  aggregators are pointers, never citations — chase them to the primary source or
  drop the claim.

## Researcher 6 — Expert opinion (second wave)

Objective: what the named experts in <topic> are saying right now — positions,
warnings, predictions, and especially disagreements — from their blogs, talks,
and social posts.

- **Build the roster first** (why this runs second): survey and top-paper authors
  (researcher 1), maintainers of the leading repos (researchers 2–3), and names
  that recur across researcher 5. Pick 5–8; record each expert's affiliation for
  conflict-of-interest tagging.
- Where to find their voice, in reliability order: personal blogs / newsletters
  (`"<name>" <topic>`, `site:<their-domain> <topic>`); HN comments
  (`https://hn.algolia.com/api/v1/search?tags=comment,author_<username>&query=<topic>`);
  conference talks / podcasts (prefer transcripts or the speaker's own writeup);
  indexed social (`site:x.com "<name>" <topic>`); Reddit / lobste.rs threads.
- **Opinion is its own evidence class.** For every position report: the exact
  quote or close paraphrase, where and when stated, and any conflict of interest.
  An opinion NEVER counts toward the ≥2-source rule for factual claims.
- **The highest-value output is disagreement**: where credible experts contradict
  each other is exactly where the genuinely open questions are. Map who stands
  where and what evidence each side cites.
