import { Activity, BookOpenCheck, FlaskConical, Lightbulb } from "lucide-react";
import { PaperExplorer } from "@/components/paper-explorer";
import { compactNumber, formatDateTime } from "@/lib/format";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function PapersPage() {
  const snapshot = readSnapshot();
  const activeRuns = snapshot.runs.filter((run) => run.status === "running" || run.status === "queued").length;
  const audited = snapshot.papers.filter((paper) => paper.auditedAt || paper.dossierMarkdown).length;

  return (
    <main className="page-canvas" id="main-content">
      <header className="index-hero">
        <div className="index-rail">
          <p className="section-kicker">01 / Research corpus</p>
          <p className="index-datum">Last journal commit<br /><span>{formatDateTime(snapshot.meta.generatedAt ?? undefined)}</span></p>
        </div>
        <div className="index-intro">
          <h1>Research papers</h1>
          <p>Claim-level audits, independent evidence, and reproducible experiments across every monitored domain.</p>
        </div>
        <div className="live-note">
          <span><i /> {activeRuns > 0 ? `${activeRuns} active runs` : "Corpus at rest"}</span>
          <strong>{snapshot.topics.filter((topic) => topic.status === "active").length}</strong>
          <p>active research topics</p>
        </div>
      </header>

      <section className="summary-strip" aria-label="Corpus summary">
        <div><BookOpenCheck aria-hidden="true" size={18} /><span>Audited papers</span><strong>{compactNumber(audited)}</strong></div>
        <div><FlaskConical aria-hidden="true" size={18} /><span>Experiments</span><strong>{compactNumber(snapshot.experiments.length)}</strong></div>
        <div><Lightbulb aria-hidden="true" size={18} /><span>Open opportunities</span><strong>{compactNumber(snapshot.opportunities.filter((item) => !["drop", "occupied"].includes(item.status)).length)}</strong></div>
        <div><Activity aria-hidden="true" size={18} /><span>Research runs</span><strong>{compactNumber(snapshot.runs.length)}</strong></div>
      </section>

      <PaperExplorer
        experiments={snapshot.experiments}
        opportunities={snapshot.opportunities}
        papers={snapshot.papers}
        runs={snapshot.runs}
        topics={snapshot.topics}
      />
    </main>
  );
}
