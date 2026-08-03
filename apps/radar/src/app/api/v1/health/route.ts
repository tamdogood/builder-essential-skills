import { noStoreJson } from "@/lib/api";
import { readSnapshot } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = readSnapshot();
    return noStoreJson({
      status: "ok",
      writesConfigured: Boolean(process.env.RADAR_WRITE_TOKEN),
      journal: snapshot.meta,
      counts: {
        topics: snapshot.topics.length,
        runs: snapshot.runs.length,
        papers: snapshot.papers.length,
        experiments: snapshot.experiments.length,
        opportunities: snapshot.opportunities.length,
        reports: snapshot.reports.length,
      },
    });
  } catch (error) {
    console.error(error);
    return noStoreJson({ status: "degraded" }, { status: 503 });
  }
}
