# Deep lessons and ML-engineering transfer

Read for requests to learn deeply or broaden ML-engineering knowledge. This is an authoring guide, not a second learner-facing note. Put the resulting lessons in the same reproduction README/note.

## Choose a coherent expansion

Inspect what the learner already knows, the paper's actual decisions, and the failures its reproduction can expose. Explain the transferable mechanism in each selected lesson. For example, temporal labels connect naturally to delayed conversions; probability differencing connects to error propagation; action aggregation connects to exposure-normalized ranking. A list mentioning transformers, RL, causal inference, and MLOps without such mechanisms is not breadth.

Use three labels:

- **Reproduction core:** necessary to understand and implement the selected method.
- **Engineering extension:** a new controlled exercise that develops adjacent capability using the same project.
- **Adjacent study:** worthwhile theory that requires additional assumptions, data, or a separate project.

Add a navigation/evidence table with lesson, prerequisite, capability, concrete artifact, and readiness check. A broad map should give permission to start with the first small case, not create months of prerequisite reading.

## Make one unit teach rather than point

A strong unit includes a mechanism, intermediate reasoning, a solved example, a misconception, a lab, and transfer. Describe shape and availability contracts when they matter: N action rows by D features, one or multiple labels per row, join keys, feature availability time, prediction horizon, group/time split, and downstream aggregation unit.

Here is a compact worked mechanism, appropriate only when binary probabilistic learning is relevant. Let z=wᵀx+b, p=σ(z), and loss ℓ=−y log p−(1−y) log(1−p). Explain the chain rule:

1. dℓ/dp=−y/p+(1−y)/(1−p).
2. dp/dz=p(1−p).
3. Multiplying gives dℓ/dz=p−y.
4. Therefore the average weight gradient is Xᵀ(p−y)/N; an L2 penalty λ‖w‖²/2 adds λw.

For invented scalar features x=(1,2), labels y=(0,1), and w=b=0, both probabilities are 0.5. The average weight gradient is −0.25 and bias gradient is zero. With step size one, w becomes 0.25 and the mean loss falls from approximately 0.6931 to 0.6500. The negative example's individual loss rises: reducing total loss does not require every row to improve. Verify the arithmetic before publishing a numerical lesson.

Transfer: the same output-layer derivative appears in neural binary classifiers, but a neural network also needs gradients through its hidden representation. A boosted-tree learner uses a different parameterization; do not describe the linear update as CatBoost's exact algorithm.

The lab should then vary step size, compare analytic and finite-difference gradients, and inspect train/validation behavior. The expected gradient is a deterministic check. Which setting generalizes best is an empirical question, not a prewritten answer.

## Build connected engineering labs

Choose only labs justified by the paper and user's goals. Adapt these patterns rather than requiring the whole list.

| Lab | Mechanism to teach before the task | Concrete artifact |
| --- | --- | --- |
| Measurement contract | Label generation and missingness change what is estimated | Audited boundary cases and schema/availability table |
| Loss and optimization | Expected risk, gradients, regularization, numerical stability | Gradient check, loss trace, and explanation of one failed update |
| Capacity and representation | Inductive bias, interactions, encoding, bias/variance | Controlled linear/tree/feature comparison and a falsifiable interpretation |
| Temporal evaluation | Dependent windows, delayed labels, selection, model selection | Group/date manifests and rolling-origin validation report |
| Probability quality | Discrimination, calibration, prevalence, proper scores | Baselines, reliability bins with counts, and metric counterexamples |
| Statistical comparison | Paired groups, effect size, sampling variation, multiple exploration | Paired uncertainty interval with resampling scope stated |
| Ranking and aggregation | Exposure, denominator reliability, selection and regression to mean | Stable-population rank comparison with coverage and intervals |
| Explanation | Fitted-model reliance versus intrinsic signal versus causal effect | Retraining ablation, perturbation result, and raw failure examples |
| Data and inference systems | Join cardinality, deterministic order, state boundaries, feature parity | Replay equivalence check and stage-level time/memory profile |
| Distribution shift | Marginal, conditional, and annotation changes require different responses | Slice/prevalence/calibration report plus a justified response |
| Operational decision | Model output is one input to a human/product decision | Reproducible decision report and monitoring/rollback contract |

Each lab needs: start inputs and dependency; hypothesis; intervention and constants; metrics; deterministic checks; expected qualitative possibilities; failure diagnosis; saved output; transfer task; and readiness criteria. Include enough procedure to run it without inventing the protocol. Do not give every lab a new software framework.

## Avoid superficial transfer

Use **same mechanism → different context → changed assumption**:

- Overlapping soccer windows → overlapping conversion windows in advertising → outcomes and censoring may arrive days later.
- Per-90 contribution → engagement per exposure → exposure is selected by the current policy, so normalization does not remove selection bias.
- Probability calibration → auction/risk estimates → preserving rank does not preserve expected-value calculations.
- Sequence context → session features → chunked inference must preserve context without leaking across entities.
- Historical ranking → candidate selection → training/test separation alone does not identify causal benefit from choosing the candidate.

Keep these as conceptual connections until the learner performs a transfer exercise. Avoid unsupported claims about the learner's workplace, private data, or measured competence.

## Distinguish types of evidence

An algebraic result can have an exact answer. A synthetic program can validate the implementation of that result. A held-out experiment measures performance under its particular data and split. A deployment decision requires its own operational evidence. State which kind each artifact supplies.

For uncertainty, explain the sampling unit and what the interval omits. A match bootstrap conditional on a fitted model is not a retraining uncertainty estimate or a causal interval. For shift, explain which distributional condition a correction assumes before offering it. For causal/off-policy extensions, require relevant logging/support assumptions rather than casually treating observational scores as rewards for an optimal policy.

For systems extensions, report stage-level wall time, memory, batch size, hardware, threads, and cold/warm state. A faster kernel is not necessarily a faster pipeline. For model comparisons, preserve data and tuning budgets; for different targets, do not present raw metric differences as a common-task victory.

## Review the produced note

Reject a deep-learning section that only says “study calibration” or asks the learner to derive an unexplained equation. Ask whether a learner can follow at least one completed example before doing the changed case. Check that answers or feedback criteria are present and that the first task is small enough to start today.

Assess independent reasoning in three ways: reproduce the worked mechanism, solve a changed case, and diagnose a real pipeline result. Use later retrieval and a transfer example to distinguish familiarity from durable understanding. Keep the current evidence record honest; do not mark a topic mastered because its lesson exists.
