import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperimentPanel } from "@/components/experiment-panel";
import { Markdown } from "@/components/markdown";
import { BackLink, DomainTags, EvidenceScore, ExternalSourceLink, Fact, StatusBadge, VerdictBadge } from "@/components/ui";
import { formatDate, formatSkill } from "@/lib/format";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const paper = readSnapshot().papers.find((entry) => entry.id === id);
  return { title: paper?.title ?? "Paper not found" };
}

export default async function PaperDetailPage({ params }: Props) {
  const { id } = await params;
  const snapshot = readSnapshot();
  const paper = snapshot.papers.find((entry) => entry.id === id);
  if (!paper) notFound();
  const topic = snapshot.topics.find((entry) => entry.id === paper.topicId);
  const run = paper.runId ? snapshot.runs.find((entry) => entry.id === paper.runId) : undefined;
  const experiments = snapshot.experiments.filter(
    (experiment) => experiment.paperId === paper.id || paper.experimentIds?.includes(experiment.id),
  );
  const opportunities = snapshot.opportunities.filter(
    (opportunity) => opportunity.paperIds?.includes(paper.id) || paper.opportunityIds?.includes(opportunity.id),
  );
  const sources = snapshot.sources.filter((source) => paper.sourceIds?.includes(source.id));

  return (
    <main className="page-canvas" id="main-content">
      <div className="detail-back"><BackLink href="/">All papers</BackLink></div>
      <header className="detail-hero">
        <aside>
          <p className="section-kicker">Paper audit</p>
          <VerdictBadge verdict={paper.verdict} />
          <EvidenceScore score={paper.evidenceScore} />
          <ExternalSourceLink href={paper.canonicalUrl}>Canonical paper</ExternalSourceLink>
        </aside>
        <div>
          <DomainTags domains={paper.domains} />
          <h1>{paper.title}</h1>
          <p className="detail-byline">
            {paper.authors?.join(", ") || "Authors not recorded"}
            {paper.venue ? ` / ${paper.venue}` : ""}
            {paper.year ? ` / ${paper.year}` : ""}
          </p>
          <p className="detail-lede">{paper.evidenceSummary}</p>
        </div>
      </header>

      <div className="detail-layout">
        <aside className="detail-index">
          <nav aria-label="Paper report sections">
            <a href="#overview">01 / Overview</a>
            <a href="#evidence">02 / Evidence audit</a>
            <a href="#experiments">03 / Experiments</a>
            <a href="#opportunities">04 / Opportunities</a>
            {paper.dossierMarkdown ? <a href="#dossier">05 / Dossier</a> : null}
            <a href="#sources">06 / Sources</a>
          </nav>
          <dl className="detail-facts">
            <Fact label="Topic">{topic?.name ?? "Unclassified"}</Fact>
            <Fact label="Audited">{formatDate(paper.auditedAt ?? paper.updatedAt)}</Fact>
            <Fact label="Workflow">{run ? formatSkill(run.skill) : "Direct audit"}</Fact>
            <Fact label="Experiments">{experiments.length}</Fact>
          </dl>
        </aside>

        <article className="detail-report">
          <section className="report-section" id="overview">
            <div className="report-section-heading"><span>01</span><h2>Overview</h2></div>
            <div className="overview-grid">
              <div><h3>Why it was selected</h3><p>{paper.selectionReason ?? "Selection rationale was not recorded."}</p></div>
              <div><h3>Authors&apos; central claim</h3><p>{paper.authorsClaim ?? "The central claim was not separately recorded."}</p></div>
              <div><h3>What the evidence supports</h3><p>{paper.evidenceSupports ?? paper.evidenceSummary}</p></div>
              <div><h3>Decisive next check</h3><p>{paper.decisiveNextCheck ?? "No decisive next check was recorded."}</p></div>
            </div>
          </section>

          <section className="report-section" id="evidence">
            <div className="report-section-heading"><span>02</span><h2>Evidence audit</h2></div>
            <div className="evidence-audit-grid">
              <div><span>Strongest evidence</span><p>{paper.strongestEvidence ?? paper.evidenceSummary}</p></div>
              <div><span>Strongest counterevidence</span><p>{paper.strongestCounterevidence ?? "No counterevidence was recorded."}</p></div>
              <div><span>Replication map</span><p>{paper.replicationStatus ?? "Independent replication status is unknown."}</p></div>
              <div><span>Integrity and publication status</span><p>{paper.integrityStatus ?? "No formal integrity status was recorded."}</p></div>
            </div>
          </section>

          <section className="report-section" id="experiments">
            <div className="report-section-heading"><span>03</span><h2>Experiments</h2><p>{experiments.length} captured</p></div>
            {experiments.length ? <div className="experiment-stack">{experiments.map((experiment) => <ExperimentPanel experiment={experiment} key={experiment.id} />)}</div> : <p className="section-empty">No sandbox experiment has been attached to this paper.</p>}
          </section>

          <section className="report-section" id="opportunities">
            <div className="report-section-heading"><span>04</span><h2>Opportunities</h2><p>{opportunities.length} linked</p></div>
            {opportunities.length ? (
              <div className="linked-list">
                {opportunities.map((opportunity) => (
                  <Link href={`/opportunities/${encodeURIComponent(opportunity.id)}`} key={opportunity.id}>
                    <div><StatusBadge status={opportunity.status} /><h3>{opportunity.title}</h3><p>{opportunity.oneLine}</p></div>
                    <span>{opportunity.scores.evidence}/5 evidence<br />{opportunity.scores.value}/5 value</span>
                  </Link>
                ))}
              </div>
            ) : <p className="section-empty">No actionable opportunity is currently linked to this paper.</p>}
          </section>

          {paper.dossierMarkdown ? (
            <section className="report-section" id="dossier">
              <div className="report-section-heading"><span>05</span><h2>Full dossier</h2></div>
              <Markdown>{paper.dossierMarkdown}</Markdown>
            </section>
          ) : null}

          <section className="report-section" id="sources">
            <div className="report-section-heading"><span>06</span><h2>Sources</h2><p>{sources.length} captured</p></div>
            {sources.length ? (
              <ol className="source-list">
                {sources.map((source) => <li key={source.id}><a href={source.url} rel="noreferrer" target="_blank">{source.title}</a><span>{source.type} / accessed {formatDate(source.accessedAt)}</span></li>)}
              </ol>
            ) : <p className="section-empty">Open the canonical paper above; no additional source records were attached.</p>}
          </section>
        </article>
      </div>
    </main>
  );
}
