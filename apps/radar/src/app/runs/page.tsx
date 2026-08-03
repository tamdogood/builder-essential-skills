import { ArrowUpRight, CheckCircle2, CircleDotDashed, XCircle } from "lucide-react";
import Link from "next/link";
import { EmptyState, StatusBadge } from "@/components/ui";
import { formatDateTime, formatSkill } from "@/lib/format";
import { readSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function RunsPage() {
  const snapshot = readSnapshot();
  const topics = new Map(snapshot.topics.map((topic) => [topic.id, topic]));
  return <main className="page-canvas" id="main-content"><header className="collection-hero"><div><p className="section-kicker">01 / Agent operations</p><h1>Runs</h1></div><p>Every skill invocation, its bounded scope, coverage, completion state, and resulting research objects.</p></header><section className="summary-strip" aria-label="Run summary"><div><CheckCircle2 aria-hidden="true" size={18} /><span>Completed</span><strong>{snapshot.runs.filter((run) => run.status === "completed").length}</strong></div><div><CircleDotDashed aria-hidden="true" size={18} /><span>Active</span><strong>{snapshot.runs.filter((run) => ["queued", "running"].includes(run.status)).length}</strong></div><div><XCircle aria-hidden="true" size={18} /><span>Failed</span><strong>{snapshot.runs.filter((run) => run.status === "failed").length}</strong></div><div><span>Total</span><strong>{snapshot.runs.length}</strong></div></section><section className="index-section"><div className="index-heading"><div><p className="section-kicker">02 / Run log</p><h2>Execution history</h2></div><p>{snapshot.runs.length} runs</p></div>{snapshot.runs.length ? <div className="run-list">{snapshot.runs.map((run) => <Link href={`/runs/${encodeURIComponent(run.id)}`} key={run.id}><span className="run-status-line" data-status={run.status} /><div><StatusBadge status={run.status} /><small>{formatSkill(run.skill)} / {topics.get(run.topicId)?.name ?? "Unclassified"}</small><h2>{run.title}</h2><p>{run.summary}</p></div><time>{formatDateTime(run.startedAt)}</time><ArrowUpRight aria-hidden="true" size={16} /></Link>)}</div> : <EmptyState detail="The first scheduled Hermes invocation will create the initial run record." title="No runs have been recorded" />}</section></main>;
}
