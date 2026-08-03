import crypto from "node:crypto";

export const MAX_JSON_BODY_BYTES = 10 * 1024 * 1024;

function safeEqual(left: string, right: string): boolean {
  const leftDigest = crypto.createHash("sha256").update(left).digest();
  const rightDigest = crypto.createHash("sha256").update(right).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

export function requireWriteAccess(request: Request): Response | null {
  const configuredToken = process.env.RADAR_WRITE_TOKEN;
  if (!configuredToken) {
    return Response.json(
      { error: "writes are disabled because RADAR_WRITE_TOKEN is not configured" },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const providedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!providedToken || !safeEqual(providedToken, configuredToken)) {
    return Response.json(
      { error: "invalid bearer token" },
      {
        status: 401,
        headers: { "WWW-Authenticate": "Bearer" },
      },
    );
  }

  return null;
}

export async function readBody(request: Request, maxBytes: number): Promise<Buffer> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RangeError(`request body exceeds ${maxBytes} bytes`);
  }

  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new RangeError(`request body exceeds ${maxBytes} bytes`);
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks, totalBytes);
}

export async function readJsonBody(
  request: Request,
  maxBytes = MAX_JSON_BODY_BYTES,
): Promise<unknown> {
  return JSON.parse((await readBody(request, maxBytes)).toString("utf8")) as unknown;
}
