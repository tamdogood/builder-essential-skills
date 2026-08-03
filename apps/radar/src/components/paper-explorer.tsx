"use client";

import { ArrowUpRight, FlaskConical, Lightbulb, RotateCcw, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Experiment, Opportunity, Paper, ResearchRun, Topic } from "@/lib/contract";
import { formatDate, formatSkill } from "@/lib/format";
import { DomainTags, EmptyState, EvidenceScore, VerdictBadge } from "./ui";

type Props = {
  papers: Paper[];
  topics: Topic[];
  runs: ResearchRun[];
  experiments: Experiment[];
  opportunities: Opportunity[];
};

export function PaperExplorer({ papers, topics, runs, experiments, opportunities }: Props) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("all");
  const [topicId, setTopicId] = useState("all");
  const [verdict, setVerdict] = useState("all");
  const topicsById = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics]);
  const runsById = useMemo(() => new Map(runs.map((run) => [run.id, run])), [runs]);
  const domains = useMemo(
    () => [...new Set(papers.flatMap((paper) => paper.domains))].sort((left, right) => left.localeCompare(right)),
    [papers],
  );
  const verdicts = useMemo(
    () => [...new Set(papers.map((paper) => paper.verdict))].sort((left, right) => left.localeCompare(right)),
    [papers],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return papers.filter((paper) => {
      const searchable = [
        paper.title,
        paper.evidenceSummary,
        paper.authors?.join(" ") ?? "",
        paper.tags?.join(" ") ?? "",
        paper.domains.join(" "),
      ].join(" ").toLowerCase();
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (domain === "all" || paper.domains.includes(domain)) &&
        (topicId === "all" || paper.topicId === topicId) &&
        (verdict === "all" || paper.verdict === verdict)
      );
    });
  }, [domain, papers, query, topicId, verdict]);

  const hasFilters = query || domain !== "all" || topicId !== "all" || verdict !== "all";
  const clearFilters = () => {
    setQuery("");
    setDomain("all");
    setTopicId("all");
    setVerdict("all");
  };

  return (
    <section className="index-section" aria-labelledby="paper-index-title">
      <div className="filter-bar">
        <label className="search-control">
          <span className="visually-hidden">Search papers</span>
          <Search aria-hidden="true" size={16} />
          <input onChange={(event) => setQuery(event.target.value)} placeholder="Search papers, claims, or tags" type="search" value={query} />
        </label>
        <label className="select-control">
          <span>Domain</span>
          <select onChange={(event) => setDomain(event.target.value)} value={domain}>
            <option value="all">All domains</option>
            {domains.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
        </label>
        <label className="select-control">
          <span>Topic</span>
          <select onChange={(event) => setTopicId(event.target.value)} value={topicId}>
            <option value="all">All topics</option>
            {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
          </select>
        </label>
        <label className="select-control">
          <span>Verdict</span>
          <select onChange={(event) => setVerdict(event.target.value)} value={verdict}>
            <option value="all">All verdicts</option>
            {verdicts.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
          </select>
        </label>
        <button className="icon-button" disabled={!hasFilters} onClick={clearFilters} title="Clear filters" type="button">
          <RotateCcw aria-hidden="true" size={16} /><span className="visually-hidden">Clear filters</span>
        </button>
      </div>
      <div className="index-heading">
        <div>
          <p className="section-kicker">02 / Audited corpus</p>
          <h2 id="paper-index-title">Paper index</h2>
        </div>
        <p>{filtered.length} of {papers.length} papers</p>
      </div>
      {filtered.length > 0 ? (
        <div className="paper-grid">
          {filtered.map((paper, index) => {
            const run = paper.runId ? runsById.get(paper.runId) : undefined;
            const paperExperiments = experiments.filter(
              (experiment) => experiment.paperId === paper.id || paper.experimentIds?.includes(experiment.id),
            );
            const paperOpportunities = opportunities.filter(
              (opportunity) => opportunity.paperIds?.includes(paper.id) || paper.opportunityIds?.includes(opportunity.id),
            );
            return (
              <Link className="paper-card" href={`/papers/${encodeURIComponent(paper.id)}`} key={paper.id}>
                <div className="paper-card-topline">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>{topicsById.get(paper.topicId)?.name ?? "Unclassified"}</span>
                  <ArrowUpRight aria-hidden="true" size={16} />
                </div>
                <div className="paper-card-body">
                  <VerdictBadge verdict={paper.verdict} />
                  <h3>{paper.title}</h3>
                  <p className="paper-byline">
                    {paper.authors?.slice(0, 2).join(", ") || "Authors not recorded"}
                    {paper.authors && paper.authors.length > 2 ? " et al." : ""}
                    {paper.year ? ` / ${paper.year}` : ""}
                  </p>
                  <p className="paper-summary">{paper.evidenceSummary}</p>
                  <DomainTags domains={paper.domains} />
                </div>
                <div className="paper-card-footer">
                  <EvidenceScore score={paper.evidenceScore} />
                  <span><FlaskConical aria-hidden="true" size={14} />{paperExperiments.length} experiments</span>
                  <span><Lightbulb aria-hidden="true" size={14} />{paperOpportunities.length} opportunities</span>
                  <span>{run ? formatSkill(run.skill) : formatDate(paper.auditedAt ?? paper.updatedAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          detail={papers.length === 0 ? "The first audited paper will appear after an agent publishes a research bundle." : "Change or clear the current filters."}
          title={papers.length === 0 ? "No papers have been published" : "No papers match"}
        />
      )}
    </section>
  );
}
