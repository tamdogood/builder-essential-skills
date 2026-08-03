import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const MAX_ARTIFACT_BYTES = 25 * 1024 * 1024;
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export function artifactRoot(): string {
  const configuredRoot =
    process.env.RADAR_ARTIFACT_DIR ??
    path.join(process.env.RADAR_DATA_DIR ?? path.join(process.cwd(), ".radar-data"), "artifacts");
  return path.resolve(/* turbopackIgnore: true */ configuredRoot);
}

export function resolveArtifactPath(segments: string[], root = artifactRoot()): string {
  if (segments.length < 2 || segments.length > 10 || segments.some((segment) => !SAFE_SEGMENT.test(segment))) {
    throw new Error("artifact path must contain 2-10 safe path segments");
  }
  const resolved = path.resolve(root, ...segments);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error("artifact path escapes the artifact root");
  return resolved;
}

export function artifactMime(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  return (
    {
      ".csv": "text/csv; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".log": "text/plain; charset=utf-8",
      ".md": "text/markdown; charset=utf-8",
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".txt": "text/plain; charset=utf-8",
      ".webp": "image/webp",
    }[extension] ?? "application/octet-stream"
  );
}

export function readArtifact(filePath: string): Buffer {
  const stat = fs.lstatSync(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("artifact is not a regular file");
  return fs.readFileSync(filePath);
}

export function persistArtifact(
  segments: string[],
  bytes: Buffer,
  root = artifactRoot(),
): { status: "created" | "duplicate"; path: string; sha256: string; sizeBytes: number } {
  if (bytes.byteLength > MAX_ARTIFACT_BYTES) {
    throw new RangeError(`artifact exceeds ${MAX_ARTIFACT_BYTES} bytes`);
  }
  const destination = resolveArtifactPath(segments, root);
  const digest = crypto.createHash("sha256").update(bytes).digest("hex");
  fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });

  if (fs.existsSync(destination)) {
    const existing = readArtifact(destination);
    const existingDigest = crypto.createHash("sha256").update(existing).digest("hex");
    if (existingDigest === digest) {
      return { status: "duplicate", path: segments.join("/"), sha256: digest, sizeBytes: bytes.byteLength };
    }
    throw new Error("artifact path already exists with different content");
  }

  const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
  const handle = fs.openSync(temporary, "wx", 0o600);
  try {
    fs.writeFileSync(handle, bytes);
    fs.fsyncSync(handle);
  } finally {
    fs.closeSync(handle);
  }
  try {
    fs.linkSync(temporary, destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const existing = readArtifact(destination);
    const existingDigest = crypto.createHash("sha256").update(existing).digest("hex");
    if (existingDigest === digest) {
      return { status: "duplicate", path: segments.join("/"), sha256: digest, sizeBytes: bytes.byteLength };
    }
    throw new Error("artifact path already exists with different content");
  } finally {
    fs.rmSync(temporary, { force: true });
  }

  return { status: "created", path: segments.join("/"), sha256: digest, sizeBytes: bytes.byteLength };
}

export { MAX_ARTIFACT_BYTES };
