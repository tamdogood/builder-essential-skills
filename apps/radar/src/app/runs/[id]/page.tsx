import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink, Fact, StatusBadge } from "@/components/ui";
import { formatDateTime, formatSkill } from "@/lib/format";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: readSnapshot().runs.find((entry) => entry.id === id)?.title ?? "Run not found" };
}

export default async function RunDetailPage({ params }: Props) {
  const { id } = await params;
  const snapshot = readSnapshot();
  const run = snapshot.runs.find((entry) => entry.id === id);
  if (!run) notFound();
  const topic = snapshot.topics.find((entry) => entry.id === run.topicId);
  const reports = snapshot.reports.filter((entry) => entry.runId === run.id);
  const papers = snapshot.papers.filter((entry) => entry.runId === run.id);
  const opportunities = snapshot.opportunities.filter((entry) => entry.runId === run.id);
  const experiments = snapshot.experiments.filter((entry) => entry.runId === run.id);
  const coverage = run.coverage;
  return <main className="page-canvas" id="main-content"><div className="detail-back"><BackLink href="/runs">All runs</BackLink></div><header className="run-detail-hero"><aside><p className="section-kicker">Agent run</p><StatusBadge status={run.status} /><span>{formatSkill(run.skill)}</span></aside><div><h1>{run.title}</h1><p>{run.summary}</p></div></header><div className="detail-layout"><aside className="detail-index"><dl className="detail-facts"><Fact label="Topic">{topic?.name ?? "Unclassified"}</Fact><Fact label="Started">{formatDateTime(run.startedAt)}</Fact><Fact label="Completed">{formatDateTime(run.completedAt)}</Fact><Fact label="Outputs">{reports.length + papers.length + opportunities.length}</Fact></dl></aside><article className="detail-report"><section className="report-section"><div className="report-section-heading"><span>01</span><h2>Scope</h2></div><p className="long-summary">{run.scope ?? run.summary}</p>{run.error ? <p className="run-error"><strong>Run error</strong>{run.error}</p> : null}</section><section className="report-section"><div className="report-section-heading"><span>02</span><h2>Coverage</h2></div>{coverage ? <div className="coverage-grid"><div><span>Returned</span><strong>{coverage.recordsReturned ?? 0}</strong></div><div><span>New</span><strong>{coverage.recordsNew ?? 0}</strong></div><div><span>Screened</span><strong>{coverage.recordsScreened ?? 0}</strong></div><div><span>Full text</span><strong>{coverage.fullTextsAccessed ?? 0}</strong></div><div><span>Audited</span><strong>{coverage.papersAudited ?? 0}</strong></div><div><span>Baseline</span><strong>{coverage.baselineStatus ?? "Unknown"}</strong></div></div> : <p className="section-empty">Coverage counts were not attached to this run.</p>}{coverage?.blindSpots?.length ? <div className="limitations"><strong>Known blind spots</strong><ul>{coverage.blindSpots.map((spot) => <li key={spot}>{spot}</li>)}</ul></div> : null}</section><section className="report-section"><div className="report-section-heading"><span>03</span><h2>Outputs</h2><p>{reports.length + papers.length + opportunities.length + experiments.length} records</p></div><div className="linked-list">{reports.map((report) => <Link href={`/reports/${encodeURIComponent(report.id)}`} key={report.id}><div><StatusBadge status={report.kind} /><h3>{report.title}</h3><p>{report.summary}</p></div><span>Report</span></Link>)}{papers.map((paper) => <Link href={`/papers/${encodeURIComponent(paper.id)}`} key={paper.id}><div><StatusBadge status={paper.verdict} /><h3>{paper.title}</h3><p>{paper.evidenceSummary}</p></div><span>{paper.evidenceScore}/5</span></Link>)}{opportunities.map((opportunity) => <Link href={`/opportunities/${encodeURIComponent(opportunity.id)}`} key={opportunity.id}><div><StatusBadge status={opportunity.status} /><h3>{opportunity.title}</h3><p>{opportunity.oneLine}</p></div><span>Opportunity</span></Link>)}</div></section></article></div></main>;
}
