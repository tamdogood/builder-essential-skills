import { Check, Download, FileCode2, X } from "lucide-react";
import Image from "next/image";
import type { Experiment } from "@/lib/contract";
import { formatDateTime, formatDuration } from "@/lib/format";
import { StatusBadge } from "./ui";

function artifactUrl(path: string): string {
  return `/api/v1/artifacts/${path.split("/").filter(Boolean).map(encodeURIComponent).join("/")}`;
}

export function ExperimentPanel({ experiment }: { experiment: Experiment }) {
  const imageArtifacts = experiment.artifacts?.filter((artifact) => artifact.mimeType.startsWith("image/")) ?? [];
  return (
    <article className="experiment-panel" id={`experiment-${experiment.id}`}>
      <header className="experiment-header">
        <div>
          <p className="section-kicker">Sandbox experiment</p>
          <h3>{experiment.title}</h3>
        </div>
        <StatusBadge status={experiment.status} />
      </header>
      {experiment.campaignId ? (
        <div className="campaign-context">
          <span>Continuous campaign</span>
          <strong>{experiment.campaignId}</strong>
          {experiment.iteration ? <small>Iteration {experiment.iteration}</small> : null}
          {experiment.decision ? <StatusBadge status={experiment.decision} /> : null}
          {experiment.decisionReason ? <p>{experiment.decisionReason}</p> : null}
        </div>
      ) : null}
      {experiment.hypothesis ? <div className="experiment-hypothesis"><span>Hypothesis</span><p>{experiment.hypothesis}</p></div> : null}
      <p className="experiment-summary">{experiment.summary}</p>
      {experiment.decisiveResult ? <p className="decisive-result"><strong>Decisive result</strong>{experiment.decisiveResult}</p> : null}

      <dl className="experiment-provenance">
        <div><dt>Image</dt><dd>{experiment.environment.imageDigest ?? experiment.environment.image}</dd></div>
        <div><dt>Network</dt><dd>{experiment.environment.network}</dd></div>
        <div><dt>Duration</dt><dd>{formatDuration(experiment.durationMs)}</dd></div>
        <div><dt>Completed</dt><dd>{formatDateTime(experiment.completedAt)}</dd></div>
      </dl>

      {experiment.metrics?.length ? (
        <div className="metric-grid" aria-label="Experiment metrics">
          {experiment.metrics.map((metric) => (
            <div key={metric.name}>
              <span>{metric.name}</span>
              <strong>{String(metric.value)}{metric.unit ? ` ${metric.unit}` : ""}</strong>
              <small>{metric.target ? `Target ${metric.target}` : metric.verdict ?? "Observed"}</small>
            </div>
          ))}
        </div>
      ) : null}

      {experiment.checks?.length ? (
        <div className="check-list">
          {experiment.checks.map((check) => (
            <div data-status={check.status} key={check.name}>
              {check.status === "pass" ? <Check aria-hidden="true" size={15} /> : <X aria-hidden="true" size={15} />}
              <strong>{check.name}</strong>
              <span>{check.details ?? check.status}</span>
            </div>
          ))}
        </div>
      ) : null}

      {imageArtifacts.length > 0 ? (
        <div className="evidence-previews">
          {imageArtifacts.map((artifact) => (
            <figure key={artifact.path}>
              <Image alt={artifact.description ?? artifact.name} height={675} src={artifactUrl(artifact.path)} unoptimized width={1200} />
              <figcaption>{artifact.description ?? artifact.name}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}

      {experiment.artifacts?.length ? (
        <div className="artifact-list">
          <h4>Evidence artifacts</h4>
          {experiment.artifacts.map((artifact) => (
            <a href={artifactUrl(artifact.path)} key={artifact.path} rel="noreferrer" target="_blank">
              <FileCode2 aria-hidden="true" size={16} />
              <span><strong>{artifact.name}</strong><small>{artifact.mimeType} / {artifact.sizeBytes.toLocaleString()} bytes / sha256 {artifact.sha256.slice(0, 12)}</small></span>
              <Download aria-hidden="true" size={15} />
            </a>
          ))}
        </div>
      ) : null}

      {experiment.logs?.stdout || experiment.logs?.stderr || experiment.command?.length ? (
        <details className="experiment-logs">
          <summary>Command and captured logs</summary>
          {experiment.command?.length ? <pre><code>{experiment.command.join(" ")}</code></pre> : null}
          {experiment.logs?.stdout ? <><h4>stdout</h4><pre><code>{experiment.logs.stdout}</code></pre></> : null}
          {experiment.logs?.stderr ? <><h4>stderr</h4><pre><code>{experiment.logs.stderr}</code></pre></> : null}
        </details>
      ) : null}
      {experiment.limitations?.length ? <div className="limitations"><strong>Limitations</strong><ul>{experiment.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></div> : null}
    </article>
  );
}
