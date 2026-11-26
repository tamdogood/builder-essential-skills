# Design an integrated learning and reproduction project

Read this when writing or revising the project's note. Use the relevant parts; the project, not this template, determines its shape.

## Contents

- Decision records and an integrated stage
- Core ML questions
- Experimental controls
- Learning evidence and capstone
- Review scenarios

## Decision records and an integrated stage

For each important decision, capture: **choice; provenance; mechanism; assumption; alternative; expected trade-off; experiment; observed evidence; revised decision**. A list of hyperparameters without the reason for their role is not a learning guide.

Use this shape inside the same note for a stage such as feature construction or training:

```markdown
## Stage — [concrete capability]

### Understand the decision
Define the relevant concept and connect it to this paper's goal.
Label the original choice, implementation behavior, and proposed adaptation.
Derive the important equation, if needed; define symbols and units.

### Work one example
Show a small, explicitly invented case. Include the interpretation.

### Reproduce
Give runnable steps or clearly marked starter cells and their prerequisites.
State what the learner should inspect and save.

### Compare an alternative
State a hypothesis, one controlled change, fixed factors, evaluation protocol,
and what result would change the decision. Results remain pending until run.

### Readiness gate
Require a small independent calculation, changed case, or justified decision.
Define the evidence that distinguishes understanding from copying the steps.
```

Do not add every subsection mechanically when a short paragraph suffices. When asked to combine existing learning/reproduction notes, preserve the content and interleave it at relevant stages. Respect local rules for old files; preserve links without leaving two competing copies of the teaching material.

## Core ML questions

Select the questions that materially affect the paper:

| Choice | Explain | Learn by testing |
| --- | --- | --- |
| Target | Observed label versus ultimate goal; label window and censoring; available inputs | Manually label boundary cases and compare task definitions |
| Representation | Information preserved, omitted, normalized, or inferred; invariances | Audit a raw example, then remove a feature group |
| Objective | Meaning and units of the loss; what minimizes expected loss | Derive a toy optimum and contrast a second loss |
| Model | Inductive bias, interactions, capacity, and required preprocessing | Compare a baseline and a stronger model on controlled data |
| Optimization | Learned parameters versus hyperparameters; stopping and regularization | Plot learning curves; change one optimization setting |
| Evaluation | Ranking versus calibration versus downstream utility | Construct a counterexample where one metric hides a failure |
| Generalization | Time, groups, leakage, domain shift, and repeated entities | Hold out the unit that matches the intended use |
| Aggregation | Denominators, exposure, weighting, duplicate joins | Reconstruct one aggregate from its raw records |
| Uncertainty | Dependence, sample size, model variation, and unsupported causal claims | Resample appropriate groups and state what remains unmeasured |
| Application | Who acts on this output; thresholds; evidence; consequences | Produce one decision report with traceable supporting examples |

The most useful learning sequence is usually formulation → measurement → baseline → stronger method → evaluation → application. Add advanced models when an observed limitation motivates them, rather than requiring every architecture to appear in every project.

## Experimental controls

Freeze an experiment record before observing its evaluation: paper/code version, dataset and event dates, population, exclusions, row key, target, feature availability, split IDs/dates, preprocessing fit scope, model/settings/seed, tuning budget, metrics, and expected result. Use a compact table or manifest appropriate to the project.

Separate three comparisons:

1. **Representation:** keep model, labels, and split fixed; change features/history.
2. **Learner:** keep representation, labels, and split fixed; record preprocessing and tuning differences.
3. **Task:** change horizon, target, population, or deployment setting; recognize that raw metrics may no longer measure the same problem.

Train fits parameters. Validation guides model/hyperparameter selection and calibration. A sealed test supports the final generalization claim. If a bug is fixed after seeing test results, disclose that use and reserve a fresh holdout where possible. A deterministic pipeline cannot rescue a leaked benchmark.

Account for dependent examples in both splitting and uncertainty. Distinguish validation leakage from outcome information legitimately available at the declared prediction time. Compare probability metrics against a relevant prevalence baseline and inspect rare-event bin counts where applicable.

Inspect failure slices and raw outputs before broad tuning. Report null results. Record uncertainty and runtime when deciding whether a small improvement is meaningful. A single global metric or famous entity at rank one does not validate a downstream ranking system.

## Learning evidence and capstone

Make a practical example visible before implementation. Define the output's unit, aggregation window, who will use it, and one useful decision. Then identify what extra evidence a deployment claim would need.

For a lesson: worked example → completion task → changed example → independent explanation. Give direct explanations before asking for retrieval when the learner lacks the prerequisites. Answer direct user questions instead of forcing an assessment. Revisit important mistakes in a later session with a different example.

Use a compact mastery record in the integrated note: capability, latest attempt, confidence before feedback, observed evidence, first important error, next drill, and revisit trigger. Mark preparation as preparation; no implementation evidence means no measured reproduction or demonstrated mastery yet.

The capstone should contain both a useful artifact and a defensible explanation: baseline, controlled comparison, held-out evaluation, audited examples, important uncertainty, discrepancy report, and one conclusion that follows from the evidence. Ask a reviewer whether the claim is supported, not whether the result looks impressive.

## Review scenarios

Use these as manual behavior checks when adapting this skill. They are evaluation prompts, not claims that an independent agent has executed them.

| Request | Expected behavior | Failure to catch |
| --- | --- | --- |
| “Teach me ML by reproducing this paper; update my README” | Read primary evidence, add decisions/math/experiments beside steps in one README | A command list, a generic syllabus, or a separate learning note |
| “I need this to work on current players” | Verify actual event dates, input granularity, and adapter requirements; label historical adaptation | Treat latest repository commit as current-match coverage |
| “What do these values buy me?” | Explain unit and a concrete evidence-backed workflow before extending the note | Claim metric equals isolated ability, causal effect, or money |
| “The original data is unavailable” | Offer a method reproduction on suitable alternatives and mark exact matching unavailable | Invent the original setup or promise published numbers |
| “I only want to understand this loss” | Explain and work an example directly, update the same relevant section | Restart an entire curriculum or quiz before answering |
| “I ran this experiment and got a worse result” | Diagnose the first supported failure, update evidence and next drill | Hide the result, rerun everything, or claim a stronger model must win |
