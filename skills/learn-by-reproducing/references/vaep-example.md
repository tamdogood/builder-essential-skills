# Worked application: learn ML through VAEP

Use only for the soccer action-valuation paper or as a compact example of the learning design. This reference is not a frozen environment or a universal recipe for other papers.

## Primary evidence

- [Actions Speak Louder than Goals](https://ar5iv.labs.arxiv.org/html/1802.07127): formulation, experiments, limitations, and reproducibility appendix.
- [socceraction VAEP documentation](https://socceraction.readthedocs.io/en/latest/documentation/valuing_actions/vaep.html): features, probabilities, and valuation API.
- [v1.5.3 label code](https://github.com/ML-KULeuven/socceraction/blob/v1.5.3/socceraction/vaep/labels.py) and [formula code](https://github.com/ML-KULeuven/socceraction/blob/v1.5.3/socceraction/vaep/formula.py): audit executable conventions before implementing.
- [Probability calibration](https://scikit-learn.org/stable/modules/calibration.html): distinguish ranking, calibration, and proper scoring rules.

## Formulation and interpretation

Learn scoring and conceding probabilities from observed action states, then difference net state value from one team's perspective. There are no direct ground-truth action-value labels. The final rating therefore needs interpretation beyond component prediction metrics.

Write U(S)=p_score(S)−p_concede(S), and v=U(after)−U(before). For invented probabilities before=(0.04,0.02) and after=(0.11,0.01), offensive credit is 0.07, defensive credit 0.01, and total 0.08. This is short-horizon modeled credit, not a change in match-win probability or a proved causal contribution.

Most windows contain neither outcome, so p_concede is not 1−p_score. A player with aggregate credit 4.0 in 900 minutes has 90×4/900=0.4 per 90. Separate role/context, exposure, and uncertainty from that arithmetic.

## Decisions worth teaching

| Decision | Lesson and small experiment |
| --- | --- |
| Goal indicator target | Learn observable proxy outcomes instead of subjective quality; hand-label a sequence |
| Recent-action context | Test state compression with 1/3/5 actions, fixed horizon and split |
| Horizon | Compare 5/10/20 actions; report prevalence and acknowledge changed tasks |
| Binary probabilistic loss | Derive why expected log loss is minimized at the conditional positive probability |
| Linear versus boosted model | Compare under one representation before adding native categorical variants |
| Probability metrics | Square probabilities: ordering/AUC stays unchanged, but their differences change |
| Temporal split | Keep complete matches apart and hold out later dates for future-match claims |
| Player aggregation | Reconcile minutes and action sums; bootstrap matches with their exposure |

In v1.5.3, the horizon parameter ten includes the current action plus offsets 1–9. Audit own goals, final rows, and period boundaries. An observed shot result is available for post-action valuation, not for deciding whether to take that shot. The formula implementation swaps previous-state score/concede probabilities when the actor's team changes and has special reset/set-piece rules. Read the linked sources before describing behavior from prose alone.

## Useful capstone

For a deeper ML-engineering request, build substantial lessons around the reproduction rather than adding a list of topics. Derive logistic-loss gradients and run a finite-difference toy check; explain a simplified regularized boosting update; compare models with paired match-level uncertainty; distinguish fitted-model explanations from causal claims; test full-match versus chunked history/value parity; and diagnose season/provider shift before choosing calibration or retraining. Mark these as core teaching or proposed extensions, not extra results of the original paper.

Transfer the mechanism to another problem: overlapping action labels to delayed conversions, per-90 rates to engagement per selected exposure, sequence boundaries to session features, and probability quality to expected-value ranking. Include the changed assumption so the connection is more than an analogy. Start with one solved example and one small lab, then expand as the learner supplies evidence.

Build a midfielder shortlist within a declared competition and evaluation window. Include minutes, passing/carrying/shooting contribution per 90, action volume, mean value/action, intervals, model version, and dated supporting sequences. Inspect both high-value actions and random actions so the report is not just a highlight reel.

Use it to prioritize video review or compare observed contribution profiles. Do not infer best unchosen passes, off-ball ability, market price, or guaranteed transfer performance from retrospective credit. For form tracking, keep the scoring model fixed or rerate all compared windows after an update.

## Data adaptation

Check the original data's accessibility before promising numerical replication. For recent/current players, verify season/event coverage and the required full action stream. Inspect snapshots such as [Openplay](https://github.com/nlbair/openplay) or the [StatsBomb open manifest](https://github.com/hudl/open-data/blob/master/data/competitions.json) only as candidates; recheck their coverage at use time.

A community event table may need an adapter into SPADL. Audit taxonomy, coordinate orientation, clocks, goal/own-goal semantics, IDs/order, missing fields, and player-match minutes. A published current roster or a recent correction to an old match does not establish current action coverage. Preserve provider consistency across training and scoring or explicitly evaluate the shift.
