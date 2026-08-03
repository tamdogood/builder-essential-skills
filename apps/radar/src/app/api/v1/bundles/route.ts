import { apiError, noStoreJson } from "@/lib/api";
import { readJsonBody, requireWriteAccess } from "@/lib/auth";
import { persistBundle } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = requireWriteAccess(request);
  if (denied) return denied;

  try {
    const result = persistBundle(await readJsonBody(request));
    return noStoreJson(result, { status: result.status === "created" ? 201 : 200 });
  } catch (error) {
    return apiError(error);
  }
}
