import { ArrowUpRight, CircleDot, TestTube2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { DomainTags, EmptyState, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function OpportunitiesPage() {
  const snapshot = readSnapshot();
  const open = snapshot.opportunities.filter((item) => !["drop", "occupied"].includes(item.status));
  const topics = new Map(snapshot.topics.map((topic) => [topic.id, topic]));

  return (
    <main className="page-canvas" id="main-content">
      <header className="collection-hero">
        <div><p className="section-kicker">01 / Opportunity ledger</p><h1>Opportunities</h1></div>
        <p>Defensible gaps ranked by evidence, unexploredness, feasibility, value, and the experiment that could kill them.</p>
      </header>
      <section className="summary-strip" aria-label="Opportunity summary">
        <div><TrendingUp aria-hidden="true" size={18} /><span>Promoted</span><strong>{snapshot.opportunities.filter((item) => item.status === "promote").length}</strong></div>
        <div><TestTube2 aria-hidden="true" size={18} /><span>Testing</span><strong>{snapshot.opportunities.filter((item) => item.status === "test").length}</strong></div>
        <div><CircleDot aria-hidden="true" size={18} /><span>Watching</span><strong>{snapshot.opportunities.filter((item) => ["watch", "verify paper"].includes(item.status)).length}</strong></div>
        <div><span>Open / total</span><strong>{open.length} / {snapshot.opportunities.length}</strong></div>
      </section>
      <section className="index-section">
        <div className="index-heading"><div><p className="section-kicker">02 / Ranked ledger</p><h2>Current candidates</h2></div><p>{snapshot.opportunities.length} records</p></div>
        {snapshot.opportunities.length ? (
          <div className="opportunity-grid">
            {snapshot.opportunities.map((opportunity, index) => (
              <Link className="opportunity-card" href={`/opportunities/${encodeURIComponent(opportunity.id)}`} key={opportunity.id}>
                <div className="opportunity-card-heading"><span>{String(index + 1).padStart(2, "0")}</span><StatusBadge status={opportunity.status} /><ArrowUpRight aria-hidden="true" size={16} /></div>
                <h2>{opportunity.title}</h2>
                <p>{opportunity.oneLine}</p>
                <DomainTags domains={opportunity.domains ?? topics.get(opportunity.topicId)?.domains} />
                <div className="score-axis">
                  {Object.entries(opportunity.scores).map(([label, score]) => <span key={label}><small>{label}</small><strong>{score}</strong><i><b style={{ width: `${score * 20}%` }} /></i></span>)}
                </div>
                <div className="opportunity-card-footer"><span>Constraint</span><p>{opportunity.bindingConstraint}</p><time>{formatDate(opportunity.updatedAt)}</time></div>
              </Link>
            ))}
          </div>
        ) : <EmptyState detail="Candidates will appear after a radar or market-validation run publishes the opportunity ledger." title="No opportunities have been published" />}
      </section>
    </main>
  );
}
