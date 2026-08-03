import fs from "node:fs";
import path from "node:path";
import type { ResearchBundle } from "@tamnguyen/radar-contract";
import { persistArtifact } from "../src/lib/artifacts";
import { persistBundle } from "../src/lib/store";

const requestedRoot = process.argv[2] ?? process.env.RADAR_DATA_DIR ?? path.join(process.cwd(), ".radar-data");
const root = path.resolve(requestedRoot);
process.env.RADAR_DATA_DIR = root;
process.env.RADAR_ARTIFACT_DIR = path.join(root, "artifacts");

const bundle = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "fixtures", "demo-bundle.json"), "utf8"),
) as ResearchBundle;

const metrics = Buffer.from(`${JSON.stringify({ baselineAccuracy: 0.784, reproducedAccuracy: 0.779, tolerance: 0.01 }, null, 2)}\n`);
const artifactPath = ["run-demo-001", "paper-demo-001", "experiment-demo-001", "metrics.json"];
const artifactResult = persistArtifact(artifactPath, metrics);
const experiment = bundle.upserts?.experiments?.find((entry) => entry.id === "experiment-demo-001");
if (!experiment?.artifacts?.[0]) throw new Error("demo fixture is missing its metrics artifact record");
experiment.artifacts[0].sha256 = artifactResult.sha256;
experiment.artifacts[0].sizeBytes = artifactResult.sizeBytes;

const result = persistBundle(bundle);
process.stdout.write(`${JSON.stringify({ dataRoot: root, bundle: result, artifact: artifactResult }, null, 2)}\n`);
