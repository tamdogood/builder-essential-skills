import path from "node:path";
import { apiError, noStoreJson } from "@/lib/api";
import { readBody, requireWriteAccess } from "@/lib/auth";
import {
  artifactMime,
  MAX_ARTIFACT_BYTES,
  persistArtifact,
  readArtifact,
  resolveArtifactPath,
} from "@/lib/artifacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: Context) {
  try {
    const segments = (await context.params).path;
    const filePath = resolveArtifactPath(segments);
    const body = readArtifact(filePath);
    const mimeType = artifactMime(filePath);
    const previewable = /^(image\/(png|jpeg|webp)|application\/pdf|text\/|application\/json)/.test(mimeType);
    return new Response(body as unknown as BodyInit, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `${previewable ? "inline" : "attachment"}; filename="${path.basename(filePath).replaceAll('"', "")}"`,
        "Content-Security-Policy": "sandbox; default-src 'none'",
        "Content-Type": mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return noStoreJson({ error: "artifact was not found" }, { status: 404 });
    }
    return noStoreJson({ error: "invalid artifact path" }, { status: 400 });
  }
}

export async function PUT(request: Request, context: Context) {
  const denied = requireWriteAccess(request);
  if (denied) return denied;

  try {
    const bytes = await readBody(request, MAX_ARTIFACT_BYTES);
    const result = persistArtifact((await context.params).path, bytes);
    return noStoreJson(result, { status: result.status === "created" ? 201 : 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      return noStoreJson({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes("artifact path")) {
      return noStoreJson({ error: error.message }, { status: 400 });
    }
    return apiError(error);
  }
}
