---
name: learn-by-reproducing
description: Turn an ML paper into a learning-centered reproduction project with one integrated note explaining critical decisions, derivations, runnable steps, controlled experiments, and practical uses of the outputs. Use when someone wants to learn ML by reproducing a paper or deepen an existing reproduction guide beyond execution instructions.
---

# Learn by Reproducing

Help the learner implement a paper's method and defend its important ML decisions. Treat a plausible result and demonstrated understanding as separate outcomes.

## Route the request

- For a guide or README, deliver a concrete, source-grounded learning project; do not imply its code has run.
- For implementation, follow the repository's conventions, build the smallest end-to-end slice, and verify it before scaling. Teach the decisions beside the relevant steps.
- For an existing project, revise the existing note and resume from observed evidence rather than regenerating the plan.
- For a narrow concept or question about output usefulness, answer it directly, then update the relevant part of the note. Do not substitute a new roadmap or a quiz for the answer.

This skill focuses on reproduction as deliberate ML practice. A paper summary alone, a broad career curriculum, or literature-based opportunity scouting is a different task.

## Establish the contract from available context

Identify the paper/version, targeted claim or result, learner background, dataset, compute constraints, current code, and desired artifact path. Inspect connected material and local project instructions first. Infer routine choices; ask only for information that materially blocks progress. Do useful independent work while a necessary question is pending.

Distinguish three ambitions: an exact numerical replication; a methodological reproduction on other data; and an extension that changes the task or method. State which is feasible, what is unavailable, and which results would support the selected claim. Preserve the learner's stated aim, such as current-player coverage or learning depth, when choosing trade-offs.

## Read the primary evidence

Read the actual method, experiments, limitations, and reproducibility appendix. Check official code and data documentation when available. Verify paper identity and version rather than trusting a URL slug or a secondary summary.

Record provenance for consequential choices: **paper-defined**, **released implementation**, **your adaptation**, or **unresolved**. Compare prose with executable behavior: indexing, boundary conditions, preprocessing, categorical encoding, historical defaults, metric aggregation, and split construction often differ. Cite the precise sources and state what was actually inspected.

Verify time-sensitive data claims when selecting data. Distinguish publication/update dates from dates of observed events, historical snapshots from ongoing feeds, and table/shot summaries from the input granularity the method requires. Do not freeze a one-time dataset recommendation into a standing claim of “latest.”

## Produce one integrated note

Use the user's existing reproduction note or README. If none exists, create one `README.md` in the selected project, subject to local writing rules. Keep the learning explanations and reproduction instructions in this same note. Separate code, references, data manifests, and large artifacts only when execution needs them; do not split the curriculum into a second learning note by default.

Read [references/learning-project.md](references/learning-project.md) when building or materially revising the note. It contains the decision template, experiment controls, and evidence gates. Use [references/vaep-example.md](references/vaep-example.md) only for VAEP or a relevant worked example; its domain-specific settings are not defaults for other papers.

The note should let the learner follow this thread:

1. **Usefulness:** what the outputs mean, who could use them, a concrete application, and unsupported interpretations.
2. **Problem formulation:** one training example, input availability, targets, estimand, objective, and evaluation unit. Distinguish prediction from attribution, recommendation, and causal claims.
3. **Decision map:** the few choices that drive the result, their assumptions, alternatives, and how to test them.
4. **Reproduction stages:** actionable steps from a hand-worked case to a small verified pipeline and a held-out result. Pair each stage with the relevant concepts and decision explanation.
5. **Experiments:** baseline, controlled ablation, comparison, failure inspection, and one justified extension. Include readiness checks and expected artifacts, not fabricated results.
6. **Capstone and record:** a useful result, reproducibility details, discrepancies, learner evidence, and the next practice task.

Adapt depth to the learner. Explain relevant math from first principles, define notation, work a small example, and invite a changed example. Preserve nuance rather than filling the note with an encyclopedic list of unrelated ML topics.

## Teach consequential choices

For each material choice, explain the mechanism, assumption, plausible alternative, consequence, and experiment that could change the decision. Connect implementation to concepts such as target design, representation, inductive bias, optimization, regularization, probability quality, dependence, uncertainty, and distribution shift only where they affect this paper.

Before a major experiment, have the learner record a hypothesis and failure condition. Freeze the comparison's data, labels, split, preprocessing, metrics, and unrelated settings. Separate task changes from model changes: a new horizon, population, or label definition can change the benchmark itself.

Start with one manually checked example and the simplest meaningful baseline. Reuse official or existing code when it fits, but expose its consequential assumptions. Make starter cells, placeholders, commands, expected outputs, and executed results distinguishable. Leave a small runnable check for nontrivial code that is actually added; never use arithmetic checks as evidence that a full pipeline works.

Protect an honest holdout, use split and uncertainty units appropriate to dependence, and fit preprocessing only on training data. If experiments were not run, say so. If a required dataset or implementation detail is missing, provide the achievable slice and mark the blocked comparison precisely.

## Connect outputs to decisions

Give a concrete downstream workflow: population, filters, output table or visualization, supporting evidence, decision it informs, and limitation. Explain the number's unit with an invented example clearly labeled as such. Keep probability, rank, rate, accumulated credit, expected outcome, causal effect, and monetary value distinct.

A component metric improvement does not automatically validate a downstream decision. Require interpretation, failure analysis, and uncertainty appropriate to the use case. Current entities require recent observations, not merely a current roster or an updated download timestamp.

## Verify and hand off

- Verify cited paper/code/data choices and local links; check math examples and any code actually added.
- Confirm the integrated note distinguishes original choices, adaptations, unknowns, and measured results.
- Confirm one smallest next task is actionable today; do not claim competence before assessing evidence.
- For implementation, run the project's appropriate checks and report material limits. Do not add unrelated infrastructure to make the reproduction look complete.
- Return the integrated note/project path, what changed, key unresolved constraints, and verification scope. Do not publish, purchase data, or contact authors merely because this skill was invoked.
