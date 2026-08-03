import { ArrowLeft, ExternalLink, FileQuestion } from "lucide-react";
import Link from "next/link";
import { statusTone, verdictTone } from "@/lib/format";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function VerdictBadge({ verdict }: { verdict: string }) {
  return <Badge tone={verdictTone(verdict)}>{verdict}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>;
}

export function EvidenceScore({ score, label = true }: { score: number; label?: boolean }) {
  const rounded = Math.round(score);
  return (
    <span className="evidence-score" aria-label={`Evidence score ${score} out of 5`}>
      {label ? <span className="evidence-score-label">{score.toFixed(score % 1 === 0 ? 0 : 1)} / 5</span> : null}
      <span className="score-cells" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((cell) => <span className={cell <= rounded ? "score-cell score-cell-filled" : "score-cell"} key={cell} />)}
      </span>
    </span>
  );
}

export function DomainTags({ domains }: { domains?: string[] }) {
  if (!domains?.length) return null;
  return <span className="domain-tags">{domains.map((domain) => <span key={domain}>{domain}</span>)}</span>;
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link className="back-link" href={href}><ArrowLeft aria-hidden="true" size={14} />{children}</Link>;
}

export function ExternalSourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="external-link" href={href} rel="noreferrer" target="_blank">
      {children}<ExternalLink aria-hidden="true" size={14} />
    </a>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <FileQuestion aria-hidden="true" size={30} strokeWidth={1.4} />
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  );
}

export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="fact"><dt>{label}</dt><dd>{children}</dd></div>;
}
