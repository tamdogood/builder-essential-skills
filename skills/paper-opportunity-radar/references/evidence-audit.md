# Evidence and Integrity Audit

Audit the smallest important claim first. A paper can contain one durable result
and several unsupported extensions; verdicts must preserve that distinction.

## Evidence scale

| Score | Meaning |
| --- | --- |
| 0 | Claim withdrawn, retracted for a claim-relevant reason, or defeated by a fatal error |
| 1 | Claim mostly rests on assertion, inaccessible evidence, or an unsuitable design |
| 2 | Plausible signal with major validity gaps, unstable analysis, or no meaningful independent support |
| 3 | Methods reasonably fit the claim and the result survives basic robustness checks; independent validation is limited |
| 4 | Strong transparent design plus meaningful independent replication or convergent evidence |
| 5 | Multiple independent replications or real-world validations across relevant conditions, with remaining uncertainty bounded |

Do not calculate this score mechanically. Explain the decisive evidence and
what would move it up or down. `RETRACTED` does not automatically mean fraud;
read the notice and identify the affected claims.

## A. Resolve identity and status

- Record title, authors, affiliations, venue, DOI/repository IDs, submission and
  publication dates, and the version actually read.
- Check the publisher page, Crossmark when present, and Crossref updates.
  Crossref documents public access to Retraction Watch data and retraction
  metadata in its [Retraction Watch guide](https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/).
- Find corrections, errata, expressions of concern, withdrawals, retractions,
  linked protocols, registrations, supplements, and author responses.
- Record funding, declared conflicts, patent ownership, and commercial ties.
  Conflicts require scrutiny; they are not proof of invalidity.

## B. Build the claim-to-evidence table

For each load-bearing claim, record:

```text
claim | claim_type | population_or_system | input | comparator | outcome | magnitude | uncertainty | boundary_conditions | supporting_location
```

Classify the claim as descriptive, correlational, causal, predictive,
mechanistic, theoretical, or translational. Ask whether the design can support
that type. Compare the abstract, methods, results, figures, appendix, and
conclusion for scope drift.

## C. General validity checks

- Is the sample or dataset appropriate, representative, and independent?
- Were inclusion, exclusion, preprocessing, and stopping rules specified before
  outcomes were known?
- Are controls and baselines strong enough to isolate the claimed mechanism?
- Are units, denominators, group counts, dates, and totals internally coherent?
- Are effect sizes and uncertainty reported, not only thresholded p-values?
- Were multiple outcomes, comparisons, researcher choices, or subgroup analyses
  accounted for?
- Do tables and figures support the prose? Can key values be recomputed from the
  supplied data?
- Are missing data, attrition, failed runs, negative outcomes, and harms visible?
- Do robustness and sensitivity checks stress the assumptions that matter?
- Are code, data, materials, environment, and instructions sufficient for
  another group to attempt reproduction?
- Does a preregistration or protocol predate data access, and do reported
  outcomes match it? OSF describes preregistrations as time-stamped, read-only
  study plans in its [registration guide](https://help.osf.io/article/330-welcome-to-registrations).

Availability is not quality: public code can be wrong, and unavailable data can
have legitimate privacy constraints. Judge what can actually be verified.

## D. Apply the relevant domain branch

### Randomized and clinical studies

Inspect randomization, allocation concealment, blinding, deviations from the
intervention, attrition, outcome measurement, selective reporting, adverse
events, subgroup claims, protocol changes, and registration timing. For a full
randomized-trial assessment, route to Cochrane's
[RoB 2 guidance](https://www.cochrane.org/learn/courses-and-resources/cochrane-methodology/risk-bias/about-risk-bias-2-rob-2)
instead of inventing a simplified clinical score.

### Observational, social, and behavioral studies

Inspect construct validity, recruitment, representativeness, confounding,
reverse causality, common-method bias, measurement reliability, researcher
degrees of freedom, attrition, model specification, and out-of-sample validity.
Do not turn correlation into a causal or universal claim.

### Machine learning and computer science

Inspect train/validation/test independence, duplicate or benchmark
contamination, temporal leakage, hyperparameter selection, compute parity,
baseline strength, metric choice, seed variance, ablations, dataset licenses,
evaluation realism, code/environment completeness, and whether gains survive a
new dataset or distribution shift.

### Theory, mathematics, and simulation

Inspect definitions, assumptions, proof gaps, hidden regularity conditions,
numerical stability, solver verification, parameter sensitivity, calibration,
and whether the simulation validates a mechanism or merely demonstrates one
under chosen assumptions. Seek independent proof checking or reproduced
numerics.

### Engineering, materials, and laboratory systems

Inspect measurement calibration, controls, yield, tolerances, batch effects,
environmental conditions, scale, energy and material balances, degradation,
safety, manufacturability, and whether a one-off laboratory result survives
field conditions and repeat production.

### Qualitative and mixed-methods work

Inspect sampling logic, saturation rationale, interview or observation method,
reflexivity, coding process, negative cases, triangulation, participant context,
and whether the interpretation is grounded in the collected material.

## E. Search for independent reality

Search later literature by exact claim, method, dataset, and mechanism—not just
the title. Classify follow-up evidence as:

- direct replication;
- conceptual replication;
- independent convergent evidence;
- contradiction or failed replication;
- same-origin extension;
- commentary without new evidence;
- product or field deployment under comparable conditions.

Record shared authors, datasets, equipment, code, funders, and institutions.
Independence is about evidence origin, not merely a different citation.

## F. Handle integrity signals responsibly

Observable signals worth escalating include unexplained internal
inconsistencies, results that cannot follow from the stated method, duplicated
or impossible records, undisclosed outcome changes, images or data that appear
reused, missing primary data after a specific availability claim, and large
discrepancies between registry/protocol and publication.

For each signal:

1. quote or locate the exact anomaly;
2. test benign explanations such as version differences, rounding, labeling,
   or a documented correction;
3. search publisher notices, formal findings, author responses, and independent
   technical discussion;
4. state what expertise or raw artifact is required to decide it;
5. label the issue `UNRESOLVED` unless authoritative evidence resolves it.

Do not contact authors, institutions, journals, customers, or regulators
without the user's explicit request. Do not publish an accusation. Automated
statistical or image-forensics tools can surface questions; they do not by
themselves establish fabrication.

## Paper dossier

Every `papers/<canonical-id>.md` contains:

1. citation and canonical version;
2. why this paper was selected;
3. paper-in-one-paragraph, with author claims labeled;
4. claim-to-evidence table;
5. methods and validity audit;
6. statistics or proof checks performed;
7. code, data, protocol, and reproducibility status;
8. correction, retraction, conflict, and integrity checks;
9. independent support and contradiction map;
10. evidence score and scoped verdict;
11. harvestable mechanisms and constraints;
12. unknowns and the decisive next verification step;
13. fetched sources with access dates.
