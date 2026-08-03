import type { ResearchBundle } from "@tamnguyen/radar-contract";

export const now = "2026-08-02T20:00:00.000Z";

export function minimalBundle(bundleId = "bundle-001"): ResearchBundle {
  return {
    schemaVersion: 1,
    bundleId,
    generatedAt: now,
    producer: {
      agent: "hermes",
      skill: "paper-opportunity-radar",
      sessionId: "session-001",
    },
    upserts: {
      topics: [
        {
          id: "topic-ml",
          name: "Machine learning systems",
          slug: "machine-learning-systems",
          domains: ["Machine learning"],
          status: "active",
          updatedAt: now,
        },
      ],
      runs: [
        {
          id: "run-001",
          topicId: "topic-ml",
          skill: "paper-opportunity-radar",
          status: "completed",
          title: "Daily radar",
          summary: "Audited one paper.",
          startedAt: now,
          completedAt: now,
          updatedAt: now,
        },
      ],
      papers: [
        {
          id: "paper-001",
          topicId: "topic-ml",
          runId: "run-001",
          title: "A bounded evaluation",
          canonicalUrl: "https://example.com/paper",
          domains: ["Machine learning"],
          verdict: "PROMISING - UNREPLICATED",
          evidenceScore: 3,
          evidenceSummary: "The central result survives the reported controls.",
          updatedAt: now,
        },
      ],
    },
  };
}
