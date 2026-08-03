import crypto from "node:crypto";
import { apiError, noStoreJson } from "@/lib/api";
import { readJsonBody, requireWriteAccess } from "@/lib/auth";
import { isCollectionKind, type ResearchBundle } from "@/lib/contract";
import { persistBundle, readSnapshot } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ kind: string; id: string }> };

function producer(request: Request) {
  return {
    agent: (request.headers.get("x-agent-name") ?? "agent-api").slice(0, 120),
    skill: (request.headers.get("x-agent-skill") ?? "direct-edit").slice(0, 120),
    sessionId: request.headers.get("x-agent-session")?.slice(0, 160),
  };
}

function bundleId(request: Request): string {
  return request.headers.get("x-idempotency-key") ?? `api-${crypto.randomUUID()}`;
}

function generatedAt(request: Request, entityUpdatedAt?: unknown): string {
  const requested = request.headers.get("x-generated-at");
  if (requested) return requested;
  if (typeof entityUpdatedAt === "string") return entityUpdatedAt;
  return new Date().toISOString();
}

export async function GET(_request: Request, context: Context) {
  const { kind, id } = await context.params;
  if (!isCollectionKind(kind)) return noStoreJson({ error: "unknown collection" }, { status: 404 });
  const entity = readSnapshot()[kind].find((entry) => entry.id === id);
  return entity
    ? noStoreJson(entity)
    : noStoreJson({ error: `${kind}:${id} was not found` }, { status: 404 });
}

export async function PUT(request: Request, context: Context) {
  const denied = requireWriteAccess(request);
  if (denied) return denied;
  const { kind, id } = await context.params;
  if (!isCollectionKind(kind)) return noStoreJson({ error: "unknown collection" }, { status: 404 });

  try {
    const entity = await readJsonBody(request);
    if (!entity || typeof entity !== "object" || (entity as { id?: unknown }).id !== id) {
      return noStoreJson({ error: "the body entity id must match the route id" }, { status: 400 });
    }
    const bundle = {
      schemaVersion: 1,
      bundleId: bundleId(request),
      generatedAt: generatedAt(request, (entity as { updatedAt?: unknown }).updatedAt),
      producer: producer(request),
      upserts: { [kind]: [entity] },
    } as ResearchBundle;
    const result = persistBundle(bundle);
    return noStoreJson(result, { status: result.status === "created" ? 201 : 200 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  const denied = requireWriteAccess(request);
  if (denied) return denied;
  const { kind, id } = await context.params;
  if (!isCollectionKind(kind)) return noStoreJson({ error: "unknown collection" }, { status: 404 });

  try {
    const bundle: ResearchBundle = {
      schemaVersion: 1,
      bundleId: bundleId(request),
      generatedAt: generatedAt(request),
      producer: producer(request),
      deletes: [{ kind, id }],
    };
    const result = persistBundle(bundle);
    return noStoreJson(result, { status: result.status === "created" ? 201 : 200 });
  } catch (error) {
    return apiError(error);
  }
}
