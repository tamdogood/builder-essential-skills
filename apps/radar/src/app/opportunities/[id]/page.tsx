import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperimentPanel } from "@/components/experiment-panel";
import { Markdown } from "@/components/markdown";
import { BackLink, DomainTags, Fact, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const opportunity = readSnapshot().opportunities.find((entry) => entry.id === id);
  return { title: opportunity?.title ?? "Opportunity not found" };
}

export default async function OpportunityDetailPage({ params }: Props) {
  const { id } = await params;
  const snapshot = readSnapshot();
  const opportunity = snapshot.opportunities.find((entry) => entry.id === id);
  if (!opportunity) notFound();
  const topic = snapshot.topics.find((entry) => entry.id === opportunity.topicId);
  const papers = snapshot.papers.filter((paper) => opportunity.paperIds?.includes(paper.id));
  const experiments = snapshot.experiments.filter(
    (experiment) => experiment.opportunityId === opportunity.id || opportunity.experimentIds?.includes(experiment.id),
  );

  return (
    <main className="page-canvas" id="main-content">
      <div className="detail-back"><BackLink href="/opportunities">All opportunities</BackLink></div>
      <header className="detail-hero opportunity-detail-hero">
        <aside><p className="section-kicker">Opportunity memo</p><StatusBadge status={opportunity.status} /><strong className="large-score">{opportunity.scores.value}<span>/5 value</span></strong></aside>
        <div><DomainTags domains={opportunity.domains ?? topic?.domains} /><h1>{opportunity.title}</h1><p className="detail-lede">{opportunity.oneLine}</p></div>
      </header>
      <div className="detail-layout">
        <aside className="detail-index">
          <nav aria-label="Opportunity sections"><a href="#thesis">01 / Thesis</a><a href="#scores">02 / Scorecard</a><a href="#experiment">03 / Decisive experiment</a><a href="#evidence">04 / Source evidence</a>{opportunity.reportMarkdown ? <a href="#memo">05 / Full memo</a> : null}</nav>
          <dl className="detail-facts"><Fact label="Topic">{topic?.name ?? "Unclassified"}</Fact><Fact label="Updated">{formatDate(opportunity.updatedAt)}</Fact><Fact label="Prior art">{opportunity.unexploredness}</Fact><Fact label="Source papers">{papers.length}</Fact></dl>
        </aside>
        <article className="detail-report">
          <section className="report-section" id="thesis"><div className="report-section-heading"><span>01</span><h2>Thesis</h2></div><div className="overview-grid"><div><h3>Demonstrated</h3><p>{opportunity.demonstrated ?? "The demonstrated mechanism was not separated from inference."}</p></div><div><h3>Inference</h3><p>{opportunity.inference ?? "No inference statement was recorded."}</p></div><div><h3>Why now</h3><p>{opportunity.whyNow ?? "No enabling change was recorded."}</p></div><div><h3>Binding constraint</h3><p>{opportunity.bindingConstraint}</p></div></div></section>
          <section className="report-section" id="scores"><div className="report-section-heading"><span>02</span><h2>Scorecard</h2></div><div className="large-score-grid">{Object.entries(opportunity.scores).map(([label, score]) => <div key={label}><span>{label}</span><strong>{score}<small>/5</small></strong><i><b style={{ width: `${score * 20}%` }} /></i></div>)}</div><div className="risk-band"><div><span>Prior-art position</span><p>{opportunity.priorArt ?? opportunity.unexploredness}</p></div><div><span>Risks</span>{opportunity.risks?.length ? <ul>{opportunity.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul> : <p>No risks were recorded.</p>}</div></div></section>
          <section className="report-section" id="experiment"><div className="report-section-heading"><span>03</span><h2>Decisive experiment</h2></div><div className="decision-test"><div><span>Test</span><p>{opportunity.decisiveExperiment ?? "No experiment was recorded."}</p></div><div><span>Kill criterion</span><p>{opportunity.killCriterion ?? "No kill criterion was recorded."}</p></div></div>{experiments.length ? <div className="experiment-stack">{experiments.map((experiment) => <ExperimentPanel experiment={experiment} key={experiment.id} />)}</div> : null}</section>
          <section className="report-section" id="evidence"><div className="report-section-heading"><span>04</span><h2>Source evidence</h2><p>{papers.length} papers</p></div>{papers.length ? <div className="linked-list">{papers.map((paper) => <Link href={`/papers/${encodeURIComponent(paper.id)}`} key={paper.id}><div><StatusBadge status={paper.verdict} /><h3>{paper.title}</h3><p>{paper.evidenceSummary}</p></div><span>{paper.evidenceScore}/5 evidence</span></Link>)}</div> : <p className="section-empty">No source paper records were attached.</p>}</section>
          {opportunity.reportMarkdown ? <section className="report-section" id="memo"><div className="report-section-heading"><span>05</span><h2>Full memo</h2></div><Markdown>{opportunity.reportMarkdown}</Markdown></section> : null}
        </article>
      </div>
    </main>
  );
}
