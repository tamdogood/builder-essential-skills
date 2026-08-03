import { noStoreJson } from "@/lib/api";
import { readSnapshot } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return noStoreJson(readSnapshot());
  } catch (error) {
    console.error(error);
    return noStoreJson({ error: "the research journal could not be read" }, { status: 500 });
  }
}
