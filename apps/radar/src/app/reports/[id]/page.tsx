import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { BackLink, DomainTags, Fact, StatusBadge } from "@/components/ui";
import { formatDate, formatSkill } from "@/lib/format";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: readSnapshot().reports.find((entry) => entry.id === id)?.title ?? "Report not found" };
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const snapshot = readSnapshot();
  const report = snapshot.reports.find((entry) => entry.id === id);
  if (!report) notFound();
  const topic = snapshot.topics.find((entry) => entry.id === report.topicId);
  const run = snapshot.runs.find((entry) => entry.id === report.runId);
  const papers = snapshot.papers.filter((paper) => report.paperIds?.includes(paper.id));
  const opportunities = snapshot.opportunities.filter((item) => report.opportunityIds?.includes(item.id));
  return <main className="page-canvas" id="main-content"><div className="detail-back"><BackLink href="/reports">All reports</BackLink></div><header className="document-hero"><aside><p className="section-kicker">{report.kind}</p><span>{formatSkill(report.skill)}</span><time>{formatDate(report.publishedAt)}</time></aside><div><DomainTags domains={report.domains ?? topic?.domains} /><h1>{report.title}</h1><p>{report.summary}</p></div></header><div className="detail-layout"><aside className="detail-index"><dl className="detail-facts"><Fact label="Topic">{topic?.name ?? "Unclassified"}</Fact><Fact label="Workflow">{formatSkill(report.skill)}</Fact><Fact label="Run">{run?.status ?? "Unknown"}</Fact><Fact label="Related records">{papers.length + opportunities.length}</Fact></dl></aside><article className="detail-report"><section className="report-section"><Markdown>{report.markdown}</Markdown></section>{papers.length || opportunities.length ? <section className="report-section"><div className="report-section-heading"><span>+</span><h2>Related records</h2></div><div className="linked-list">{papers.map((paper) => <Link href={`/papers/${encodeURIComponent(paper.id)}`} key={paper.id}><div><StatusBadge status={paper.verdict} /><h3>{paper.title}</h3><p>{paper.evidenceSummary}</p></div><span>{paper.evidenceScore}/5 evidence</span></Link>)}{opportunities.map((opportunity) => <Link href={`/opportunities/${encodeURIComponent(opportunity.id)}`} key={opportunity.id}><div><StatusBadge status={opportunity.status} /><h3>{opportunity.title}</h3><p>{opportunity.oneLine}</p></div><span>{opportunity.scores.value}/5 value</span></Link>)}</div></section> : null}</article></div></main>;
}
