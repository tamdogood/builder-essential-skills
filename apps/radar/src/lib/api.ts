import {
  StoreBusyError,
  StoreConflictError,
  StoreValidationError,
} from "./store";

export function noStoreJson(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(value, { ...init, headers });
}

export function apiError(error: unknown): Response {
  if (error instanceof StoreValidationError) {
    return noStoreJson({ error: "validation failed", details: error.errors }, { status: 422 });
  }
  if (error instanceof StoreConflictError) {
    return noStoreJson({ error: error.message }, { status: 409 });
  }
  if (error instanceof StoreBusyError) {
    return noStoreJson({ error: error.message }, { status: 503, headers: { "Retry-After": "1" } });
  }
  if (error instanceof RangeError) {
    return noStoreJson({ error: error.message }, { status: 413 });
  }
  if (error instanceof SyntaxError) {
    return noStoreJson({ error: "request body is not valid JSON" }, { status: 400 });
  }
  console.error(error);
  return noStoreJson({ error: "internal server error" }, { status: 500 });
}
