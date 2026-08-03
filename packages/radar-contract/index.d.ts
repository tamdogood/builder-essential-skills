export type CollectionKind =
  | "topics"
  | "runs"
  | "papers"
  | "experiments"
  | "opportunities"
  | "reports"
  | "sources";

export type PaperVerdict =
  | "SUBSTANTIATED"
  | "PROMISING - UNREPLICATED"
  | "MIXED OR FRAGILE"
  | "CONTRADICTED OR NOT REPRODUCED"
  | "INTEGRITY CONCERN - UNRESOLVED"
  | "RETRACTED OR SUPERSEDED"
  | "INSUFFICIENT ACCESS";

export interface EntityBase {
  id: string;
  createdAt?: string;
  updatedAt: string;
  extensions?: Record<string, unknown>;
}

export interface Topic extends EntityBase {
  name: string;
  slug: string;
  description?: string;
  domains: string[];
  status: "active" | "paused" | "archived";
}

export interface Coverage {
  recordsReturned?: number;
  recordsNew?: number;
  recordsDeduplicated?: number;
  recordsScreened?: number;
  fullTextsAccessed?: number;
  papersAudited?: number;
  baselineStatus?: string;
  nextCursor?: string;
  blindSpots?: string[];
}

export interface ResearchRun extends EntityBase {
  topicId: string;
  skill: string;
  status: "queued" | "running" | "completed" | "partial" | "failed";
  title: string;
  summary: string;
  scope?: string;
  startedAt: string;
  completedAt?: string;
  coverage?: Coverage;
  reportIds?: string[];
  error?: string;
}

export interface Paper extends EntityBase {
  topicId: string;
  runId?: string;
  title: string;
  authors?: string[];
  year?: number;
  venue?: string;
  canonicalUrl: string;
  identifiers?: Record<string, string>;
  abstract?: string;
  domains: string[];
  tags?: string[];
  verdict: PaperVerdict;
  evidenceScore: number;
  evidenceSummary: string;
  selectionReason?: string;
  authorsClaim?: string;
  evidenceSupports?: string;
  strongestEvidence?: string;
  strongestCounterevidence?: string;
  integrityStatus?: string;
  replicationStatus?: string;
  decisiveNextCheck?: string;
  dossierMarkdown?: string;
  opportunityIds?: string[];
  experimentIds?: string[];
  sourceIds?: string[];
  discoveredAt?: string;
  auditedAt?: string;
}

export interface ExperimentMetric {
  name: string;
  value: number | string | boolean;
  unit?: string;
  target?: string;
  verdict?: "pass" | "fail" | "informational";
}

export interface ExperimentCheck {
  name: string;
  status: "pass" | "fail" | "warning";
  details?: string;
}

export interface ExperimentArtifact {
  name: string;
  path: string;
  mimeType: string;
  sha256: string;
  sizeBytes: number;
  description?: string;
}

export interface Experiment extends EntityBase {
  runId: string;
  paperId?: string;
  opportunityId?: string;
  campaignId?: string;
  iteration?: number;
  decision?: "baseline" | "keep" | "discard" | "inconclusive";
  decisionReason?: string;
  parentExperimentId?: string;
  title: string;
  hypothesis?: string;
  status: "queued" | "running" | "passed" | "failed" | "inconclusive" | "blocked";
  summary: string;
  decisiveResult?: string;
  environment: {
    image: string;
    imageDigest?: string;
    network: "none" | "bridge";
    isolation: string[];
    resources?: {
      cpus?: number;
      memoryMb?: number;
      pids?: number;
      timeoutSeconds?: number;
    };
  };
  command?: string[];
  startedAt?: string;
  completedAt?: string;
  exitCode?: number;
  durationMs?: number;
  reproducible?: boolean;
  metrics?: ExperimentMetric[];
  checks?: ExperimentCheck[];
  logs?: { stdout?: string; stderr?: string };
  artifacts?: ExperimentArtifact[];
  limitations?: string[];
}

export interface OpportunityScores {
  evidence: number;
  unexploredness: number;
  technical: number;
  operational: number;
  value: number;
}

export interface Opportunity extends EntityBase {
  topicId: string;
  runId?: string;
  title: string;
  oneLine: string;
  status: "watch" | "verify paper" | "test" | "promote" | "occupied" | "drop";
  unexploredness:
    | "OCCUPIED"
    | "PARTIALLY OCCUPIED - DIFFERENT WEDGE"
    | "NOT FOUND IN SEARCH - STRONG COVERAGE"
    | "NOT FOUND IN SEARCH - LIMITED COVERAGE"
    | "PRIOR-ART SEARCH INCOMPLETE";
  scores: OpportunityScores;
  bindingConstraint: string;
  whyNow?: string;
  demonstrated?: string;
  inference?: string;
  priorArt?: string;
  decisiveExperiment?: string;
  killCriterion?: string;
  risks?: string[];
  paperIds?: string[];
  experimentIds?: string[];
  reportMarkdown?: string;
  domains?: string[];
  tags?: string[];
}

export interface Report extends EntityBase {
  topicId: string;
  runId: string;
  kind: string;
  skill: string;
  title: string;
  summary: string;
  markdown: string;
  publishedAt: string;
  domains?: string[];
  tags?: string[];
  paperIds?: string[];
  opportunityIds?: string[];
  experimentIds?: string[];
  sourceIds?: string[];
}

export interface Source extends EntityBase {
  title: string;
  url: string;
  type: string;
  accessedAt: string;
  publishedAt?: string;
  authors?: string[];
  identifier?: string;
}

export interface CollectionMap {
  topics: Topic;
  runs: ResearchRun;
  papers: Paper;
  experiments: Experiment;
  opportunities: Opportunity;
  reports: Report;
  sources: Source;
}

export type Upserts = {
  [K in CollectionKind]?: CollectionMap[K][];
};

export interface ResearchBundle {
  schemaVersion: 1;
  bundleId: string;
  generatedAt: string;
  producer: {
    agent: string;
    skill: string;
    version?: string;
    sessionId?: string;
  };
  upserts?: Upserts;
  deletes?: Array<{ kind: CollectionKind; id: string }>;
}

export type Snapshot = {
  [K in CollectionKind]: CollectionMap[K][];
} & {
  meta: {
    bundleCount: number;
    generatedAt: string | null;
  };
};

export const collectionKinds: CollectionKind[];
export const paperVerdicts: PaperVerdict[];
export const emptySnapshot: () => Snapshot;
