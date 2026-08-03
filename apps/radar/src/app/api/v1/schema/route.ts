import bundleSchema from "@tamnguyen/radar-contract/schema";

export async function GET() {
  return Response.json(bundleSchema, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
