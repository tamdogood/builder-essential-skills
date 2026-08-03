import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  collectionKinds,
  emptySnapshot,
  type CollectionKind,
  type ResearchBundle,
  type Snapshot,
} from "@tamnguyen/radar-contract";
import bundleSchema from "@tamnguyen/radar-contract/schema";

const ajv = new Ajv2020({
  allErrors: true,
  allowUnionTypes: true,
  strict: true,
});

addFormats(ajv);
const validateSchema = ajv.compile(bundleSchema);

export type ValidationResult =
  | { ok: true; value: ResearchBundle }
  | { ok: false; errors: string[] };

function formatAjvError(error: ErrorObject): string {
  const path = error.instancePath || "/";
  return `${path} ${error.message ?? "is invalid"}`;
}

export function validateBundle(value: unknown): ValidationResult {
  if (!validateSchema(value)) {
    return {
      ok: false,
      errors: (validateSchema.errors ?? []).map(formatAjvError),
    };
  }

  const bundle = value as unknown as ResearchBundle;
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const kind of collectionKinds) {
    for (const entity of bundle.upserts?.[kind] ?? []) {
      const key = `${kind}:${entity.id}`;
      if (seen.has(key)) errors.push(`duplicate upsert for ${key}`);
      seen.add(key);
    }
  }

  for (const deletion of bundle.deletes ?? []) {
    const key = `${deletion.kind}:${deletion.id}`;
    if (seen.has(key)) errors.push(`${key} cannot be upserted and deleted in one bundle`);
    if (seen.has(`delete:${key}`)) errors.push(`duplicate delete for ${key}`);
    seen.add(`delete:${key}`);
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: bundle };
}

export function applyBundle(snapshot: Snapshot, bundle: ResearchBundle): Snapshot {
  const maps = Object.fromEntries(
    collectionKinds.map((kind) => [kind, new Map(snapshot[kind].map((entity) => [entity.id, entity]))]),
  ) as {
    [K in CollectionKind]: Map<string, Snapshot[K][number]>;
  };

  for (const kind of collectionKinds) {
    for (const entity of bundle.upserts?.[kind] ?? []) {
      maps[kind].set(entity.id, entity as never);
    }
  }

  for (const deletion of bundle.deletes ?? []) {
    maps[deletion.kind].delete(deletion.id);
  }

  return {
    topics: [...maps.topics.values()],
    runs: [...maps.runs.values()],
    papers: [...maps.papers.values()],
    experiments: [...maps.experiments.values()],
    opportunities: [...maps.opportunities.values()],
    reports: [...maps.reports.values()],
    sources: [...maps.sources.values()],
    meta: snapshot.meta,
  };
}

export function validateRelationships(bundle: ResearchBundle, current?: Snapshot): string[] {
  const next = applyBundle(current ?? emptySnapshot(), bundle);
  const topics = new Map(next.topics.map((topic) => [topic.id, topic]));
  const runs = new Map(next.runs.map((run) => [run.id, run]));
  const papers = new Map(next.papers.map((paper) => [paper.id, paper]));
  const experiments = new Map(next.experiments.map((experiment) => [experiment.id, experiment]));
  const opportunities = new Map(next.opportunities.map((opportunity) => [opportunity.id, opportunity]));
  const reports = new Map(next.reports.map((report) => [report.id, report]));
  const sources = new Map(next.sources.map((source) => [source.id, source]));
  const errors: string[] = [];

  function requireReferences(
    owner: string,
    field: string,
    ids: string[] | undefined,
    target: Map<string, unknown>,
    targetKind: string,
  ) {
    for (const id of ids ?? []) {
      if (!target.has(id)) errors.push(`${owner}.${field} references missing ${targetKind} ${id}`);
    }
  }

  for (const run of next.runs) {
    if (!topics.has(run.topicId)) errors.push(`runs:${run.id} references missing topic ${run.topicId}`);
    requireReferences(`runs:${run.id}`, "reportIds", run.reportIds, reports, "report");
  }

  for (const paper of next.papers) {
    if (!topics.has(paper.topicId)) errors.push(`papers:${paper.id} references missing topic ${paper.topicId}`);
    if (paper.runId && !runs.has(paper.runId)) errors.push(`papers:${paper.id} references missing run ${paper.runId}`);
    requireReferences(`papers:${paper.id}`, "opportunityIds", paper.opportunityIds, opportunities, "opportunity");
    requireReferences(`papers:${paper.id}`, "experimentIds", paper.experimentIds, experiments, "experiment");
    requireReferences(`papers:${paper.id}`, "sourceIds", paper.sourceIds, sources, "source");
  }

  for (const experiment of next.experiments) {
    if (!runs.has(experiment.runId)) errors.push(`experiments:${experiment.id} references missing run ${experiment.runId}`);
    if (experiment.paperId && !papers.has(experiment.paperId)) {
      errors.push(`experiments:${experiment.id} references missing paper ${experiment.paperId}`);
    }
    if (experiment.opportunityId && !opportunities.has(experiment.opportunityId)) {
      errors.push(`experiments:${experiment.id} references missing opportunity ${experiment.opportunityId}`);
    }
    if (experiment.parentExperimentId && !experiments.has(experiment.parentExperimentId)) {
      errors.push(
        `experiments:${experiment.id} references missing parent experiment ${experiment.parentExperimentId}`,
      );
    }
  }

  for (const opportunity of next.opportunities) {
    if (!topics.has(opportunity.topicId)) {
      errors.push(`opportunities:${opportunity.id} references missing topic ${opportunity.topicId}`);
    }
    if (opportunity.runId && !runs.has(opportunity.runId)) {
      errors.push(`opportunities:${opportunity.id} references missing run ${opportunity.runId}`);
    }
    requireReferences(`opportunities:${opportunity.id}`, "paperIds", opportunity.paperIds, papers, "paper");
    requireReferences(
      `opportunities:${opportunity.id}`,
      "experimentIds",
      opportunity.experimentIds,
      experiments,
      "experiment",
    );
  }

  for (const report of next.reports) {
    if (!topics.has(report.topicId)) errors.push(`reports:${report.id} references missing topic ${report.topicId}`);
    if (!runs.has(report.runId)) errors.push(`reports:${report.id} references missing run ${report.runId}`);
    requireReferences(`reports:${report.id}`, "paperIds", report.paperIds, papers, "paper");
    requireReferences(
      `reports:${report.id}`,
      "opportunityIds",
      report.opportunityIds,
      opportunities,
      "opportunity",
    );
    requireReferences(
      `reports:${report.id}`,
      "experimentIds",
      report.experimentIds,
      experiments,
      "experiment",
    );
    requireReferences(`reports:${report.id}`, "sourceIds", report.sourceIds, sources, "source");
  }

  return errors;
}

export function isCollectionKind(value: string): value is CollectionKind {
  return collectionKinds.includes(value as CollectionKind);
}

export type {
  CollectionKind,
  Experiment,
  Opportunity,
  Paper,
  Report,
  ResearchBundle,
  ResearchRun,
  Snapshot,
  Source,
  Topic,
} from "@tamnguyen/radar-contract";
