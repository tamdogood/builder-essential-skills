import { ArrowUpRight, FileText, Layers3, Workflow } from "lucide-react";
import Link from "next/link";
import { DomainTags, EmptyState } from "@/components/ui";
import { formatDate, formatSkill } from "@/lib/format";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  const snapshot = readSnapshot();
  const skills = new Set(snapshot.reports.map((report) => report.skill));
  const domains = new Set(snapshot.reports.flatMap((report) => report.domains ?? []));
  return (
    <main className="page-canvas" id="main-content">
      <header className="collection-hero"><div><p className="section-kicker">01 / Research output</p><h1>Reports</h1></div><p>Daily radar reports, landscape maps, market validations, research programs, and learning briefs in one durable index.</p></header>
      <section className="summary-strip" aria-label="Report summary"><div><FileText aria-hidden="true" size={18} /><span>Published</span><strong>{snapshot.reports.length}</strong></div><div><Workflow aria-hidden="true" size={18} /><span>Skills</span><strong>{skills.size}</strong></div><div><Layers3 aria-hidden="true" size={18} /><span>Domains</span><strong>{domains.size}</strong></div><div><span>Latest</span><strong className="summary-date">{formatDate(snapshot.reports[0]?.publishedAt)}</strong></div></section>
      <section className="index-section"><div className="index-heading"><div><p className="section-kicker">02 / Document index</p><h2>All reports</h2></div><p>{snapshot.reports.length} documents</p></div>{snapshot.reports.length ? <div className="report-list">{snapshot.reports.map((report, index) => <Link href={`/reports/${encodeURIComponent(report.id)}`} key={report.id}><span className="report-number">{String(index + 1).padStart(2, "0")}</span><div className="report-list-main"><small>{formatSkill(report.skill)} / {report.kind}</small><h2>{report.title}</h2><p>{report.summary}</p><DomainTags domains={report.domains} /></div><time>{formatDate(report.publishedAt)}</time><ArrowUpRight aria-hidden="true" size={16} /></Link>)}</div> : <EmptyState detail="Any supported skill can publish a generic report through the same research bundle contract." title="No reports have been published" />}</section>
    </main>
  );
}
