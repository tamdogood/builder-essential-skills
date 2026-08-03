export const collectionKinds = [
  "topics",
  "runs",
  "papers",
  "experiments",
  "opportunities",
  "reports",
  "sources",
];

export const paperVerdicts = [
  "SUBSTANTIATED",
  "PROMISING - UNREPLICATED",
  "MIXED OR FRAGILE",
  "CONTRADICTED OR NOT REPRODUCED",
  "INTEGRITY CONCERN - UNRESOLVED",
  "RETRACTED OR SUPERSEDED",
  "INSUFFICIENT ACCESS",
];

export const emptySnapshot = () => ({
  topics: [],
  runs: [],
  papers: [],
  experiments: [],
  opportunities: [],
  reports: [],
  sources: [],
  meta: {
    bundleCount: 0,
    generatedAt: null,
  },
});
