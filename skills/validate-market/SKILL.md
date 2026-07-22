---
name: validate-market
description: >-
  Run an honest market-fit and viability audit of any project or idea and produce
  a decision doc, not code. Use when someone asks "is this viable as a business",
  "audit the market fit", "make the case and compare to competitors", "should I
  apply to YC or bootstrap", or wants to validate a project, product, or market
  before investing more time. Gathers verifiable traction data first, researches
  the competitive field, gets an independent cold read, writes a doc with
  pre-committed pass/middle/kill criteria and a concrete week-1 assignment, then
  hardens it with an adversarial review loop.
compatibility: claude-code
allowed-tools: Read Write Edit Grep Glob Bash WebSearch WebFetch Agent AskUserQuestion
---

# Validate a project / market

You are running a validation audit. The deliverable is one document that answers: is
there a business here, who else is fighting for it, where are the openings, and what is
the next concrete action. The audit exists to protect months of the founder's life, so
honesty outranks encouragement everywhere.

**Hard gate: no implementation.** No code, no scaffolding, no renames, no site changes.
The only output is the doc (plus its adversarial review). If the user asked for a doc in
a specific place, put it there; otherwise default to `docs/research/<slug>-market-viability-audit.md`
in a repo, or `./<slug>-market-viability-audit.md` outside one.

## Posture (non-negotiable)

- **Interest is not demand.** Stars, waitlists, compliments, and "that's interesting"
  count for nothing. Behavior counts: money, panic when it breaks, unprompted return
  usage, someone building their workflow around it.
- **The status quo is competitor #1.** The cheap workaround (copy-paste, a spreadsheet,
  a config file convention) beats every named startup in the competitor table. Always
  list it first and price what it costs the user today.
- **Take a position on everything.** Never write "there are many ways to think about
  this" or "that could work". Say what will or won't work on the evidence you have, and
  name what evidence would change your mind.
- **Papercut vs bleeding wound.** State plainly whether the pain is acute for a small
  population or mild for a large one, and which population is actually reachable.
- **Lead with the disconfirming evidence.** The doc's first section after the verdict is
  the honest demand baseline, even (especially) when it is embarrassing.

## Phase 0: Ground truth before opinion

Collect verifiable numbers before writing a single judgment. Do not skip this; it is
what separates an audit from a vibe.

- Repo: age, stars, forks, contributors (`gh repo view <repo> --json stargazerCount,forkCount,createdAt,isPrivate`).
- Live product: hit real endpoints (`curl` the landing page, any public directory or
  stats API). Distinguish "deployed" from "used".
- Any analytics, revenue, waitlist, install counts the user can show. Ask if not obvious.
- Apply the bar: **would anyone outside the project be upset if it disappeared
  tomorrow?** Write the answer down. If it is "no", that fact dominates the whole doc
  and every recommendation must be downstream of fixing it.

## Phase 1: Problem and wedge

- State the problem in the founder's own words; quote them. The founder's phrasing
  usually reveals the wedge better than the pitch does.
- Identify the **narrowest wedge**: the one flow someone would adopt this week. One
  sentence, verb first ("move X from A to B in 10 seconds"). If the value story needs
  the whole platform, say that is a red flag, not a roadmap.
- Name the **target user as a findable human**: role, where they hang out, what they
  already pay for. "Developers" or "enterprises" is a filter, not a person.

## Phase 2: Landscape research

Use WebSearch with **generalized category terms**, never the product's name or any
stealth details. Run at least these four searches and read the top results:

1. Standards and platform state of the category ("<category> protocol landscape <year>").
2. Funding and startups in the category ("<category> startups <year> funding").
3. Direct adjacent products solving the same wedge ("<the wedge, described generically> tool").
4. What incumbents absorbed recently ("<big platform> <category> features <year>").

Synthesize three things explicitly:

- **Who owns the lane** the wedge sits in, and whether it is genuinely open.
- **Feature or company?** Could a platform above (the IDE, the OS, the incumbent chat
  tool, the lab) absorb this in one release? Name the absorption clock honestly.
- **Is the timing argument already won?** If the market no longer needs educating,
  that cuts both ways: no education cost, but the obvious framing is taken.

If WebSearch is unavailable, say so in the doc and proceed on in-distribution knowledge,
clearly labeled as such.

## Phase 3: Premises

Write 3 to 5 premises the whole recommendation rests on. Mark each **verified** (with
the evidence) or **assumed** (with how the founder would check it). Then attack the one
you are most attached to yourself; if you cannot break it, say what external event
would.

## Phase 4: Independent cold read

Get a second opinion that has not seen your reasoning:

- If `codex` is on PATH: assemble a structured context block (product, stage and demand
  evidence, founder's stated problem, landscape summary, premises) into a temp file and
  run `codex exec` read-only against it with these asks: (1) steelman the strongest
  version, (2) quote the one detail that reveals what to actually build, (3) name one
  premise that is wrong and the evidence that would prove it, (4) a 48-hour plan with
  channels, metrics, and kill criteria.
- Otherwise: dispatch a fresh subagent (Agent tool) with the same prompt. Fresh context
  is the point; do not paste your own conclusions.

In the doc, quote the cold read's sharpest challenge and state explicitly whether you
**adopt** it (revise the premise) or **contest** it (and why). Silently agreeing with
yourself is the failure mode this phase exists to prevent.

## Phase 5: Write the doc

Structure (adapt names, keep the order; verdict first, evidence before judgment):

1. **Header + verdict up front.** One paragraph: is there a business here, what is the
   binding constraint, what to do next. No hedging.
2. **Problem statement.**
3. **Demand evidence (the honest part).** External evidence first, internal second,
   clearly separated. Include the "would anyone be upset?" answer.
4. **Status quo.** The workarounds and what they cost. Papercut-or-wound verdict.
5. **Target user and narrowest wedge.**
6. **Market and timing.** The 2-4 numbers that matter, sourced.
7. **Competitive field.** A table: player, what it is, overlap, real threat (with the
   status quo as row 1 and a one-line "why" in every threat cell). Then 1-3 structural
   observations, including the feature-vs-company question.
8. **Strengths.** Only real, verifiable ones. "Founder-problem fit" counts; "great
   tech" only counts if it changes distribution or cost structure.
9. **Weaknesses and risks.** Include the ones the founder will not enjoy reading
   (naming/trademark, platform absorption, solo-founder, undefined pricing). For each,
   say what to do about it and what it costs.
10. **Premises** (from Phase 3, with the cold-read revision applied).
11. **Cross-model perspective** (from Phase 4, positions preserved).
12. **Approaches considered.** 2-3, always including a **minimal validation sprint**
    (weeks, near-zero cost, outreach-first) and usually a **lateral repositioning**.
    Effort, risk, pros, cons, what existing assets each reuses.
13. **Recommendation.** Pick one. If the honest answer is "sequence, don't choose",
    give the sequence with dates.
14. **Business model sketch**, explicitly deferred until after validation. Name the
    closest working analogy (e.g. the Tailscale playbook) rather than inventing tiers
    from nothing.
15. **Open questions**, each with where its answer will come from.
16. **Success criteria: three bands, pre-committed** (see rigor checklist below).
17. **The assignment.** One concrete real-world action for this week. Not "go build";
    an outreach or observation action with names and counts.

### Rigor checklist for the pre-committed criteria

These are the holes adversarial review reliably finds. Close them before review:

- **Every branch has a consequence, including kill.** "Kill (or re-frame)" is not a
  decision. Pass, middle, and kill each name the next action and its deadline.
- **Band precedence is explicit.** Mixed results happen; say which band wins (e.g.
  "kill conditions are evaluated first").
- **Denominators are fixed.** "Up to 100 asks" plus "fewer than 5 replies" is elastic;
  add a minimum-effort precondition ("kill is valid only if 80+ asks were sent, else
  the verdict is insufficient effort, extend one week").
- **Terms are defined.** "Serious reply", "real conversation", "active user" each get
  one defining line where they are used as triggers.
- **Calendar math closes.** If the recommendation targets an external deadline (a
  batch application, a launch window), the sprint end date plus writing time must land
  before it. Do the arithmetic in the doc.
- **Measurement exists.** If a criterion needs instrumentation, verifying that
  instrumentation is a named week-1 task, with a self-report fallback.
- **Week 1 is schedulable.** Cold outreach has reply latency; targets for week 1 are
  "scheduled", not "completed". State the founder-availability assumption (full-time
  vs nights-and-weekends) and give the part-time variant.
- **Outreach measures the market, not the founder's DM skills.** Require 2+ channels
  and absolute count bars, not conversion rates.

## Phase 6: Adversarial review loop

1. Dispatch a fresh subagent (Agent tool) that reads only the doc, not this
   conversation. Have it review 5 dimensions: completeness (are all promised questions
   answered), consistency (do sections contradict, does the timeline survive its own
   calendar), clarity (could the founder act without asking anything), scope (audit
   only, no padding), feasibility (executable by this founder in the stated time).
   Ask for a numbered issue list and a 1-10 score. Tell it not to fact-check external
   market claims, only internal logic.
2. Fix every real issue in the doc. Push back in the doc itself where the reviewer is
   wrong, do not silently drop findings.
3. Re-dispatch once. Stop after two re-reviews or when new findings are cosmetic;
   record any surviving disagreements in the doc under "Reviewer concerns".
4. Report to the user: rounds run, issues found and fixed, final score.

## Closing

End with, in the final message: the verdict in two sentences, the doc's location, the
three-band decision rule, and the week-1 assignment. If the founder profile fits (real
problem, domain expertise, agency), say so plainly and point at the relevant next step
(accelerator application, design-partner outreach), but only when the evidence in the
doc supports it. No congratulations for work the market has not yet validated.
