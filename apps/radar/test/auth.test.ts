import assert from "node:assert/strict";
import test from "node:test";
import { readBody } from "../src/lib/auth";

test("reads a streamed body within the configured limit", async () => {
  const request = new Request("http://radar.test/upload", {
    method: "POST",
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("evidence"));
        controller.close();
      },
    }),
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  assert.equal((await readBody(request, 8)).toString("utf8"), "evidence");
});

test("stops reading a streamed body as soon as it crosses the limit", async () => {
  const request = new Request("http://radar.test/upload", {
    method: "POST",
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(5));
        controller.enqueue(new Uint8Array(5));
        controller.close();
      },
    }),
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  await assert.rejects(readBody(request, 8), /exceeds 8 bytes/);
});
