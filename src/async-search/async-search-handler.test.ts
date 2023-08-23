import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import * as Hapi from "@hapi/hapi";
import { init } from "../server";
import { asyncSearchHandlerTestPayload } from "./test-payloads";

describe("POST /registry/search", () => {
  let server: Hapi.Server;

  beforeEach(async () => {
    server = await init();
  });

  afterEach(async () => {
    await server.stop();
  });

  it("responds with success", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/registry/search",
      payload: asyncSearchHandlerTestPayload,
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(
      res.payload,
      JSON.stringify({ message: { ack_status: "ACK" } })
    );
  });
});
