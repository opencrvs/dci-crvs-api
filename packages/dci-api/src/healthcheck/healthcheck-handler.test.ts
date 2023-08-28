import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import type * as Hapi from "@hapi/hapi";
import { init } from "../server";

describe("GET /health", () => {
  let server: Hapi.Server;

  beforeEach(async () => {
    server = await init();
  });

  afterEach(async () => {
    await server.stop();
  });

  it("responds with success", async () => {
    const res = await server.inject({
      method: "GET",
      url: "/health",
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.payload, JSON.stringify({ success: true }));
  });
});
