import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import * as Hapi from "@hapi/hapi";
import { init } from "../server";
import { withRequestInterception } from "../test-utilities";
import { http } from "msw";
import {
  AUTHENTICATE_SYSTEM_CLIENT_URL,
  RECORD_SEARCH_URL,
} from "../opencrvs-api";
import testPayload from "./test-payload.json";
import testResponse from "./test-response.json";

describe("POST /registry/search", () => {
  let server: Hapi.Server;

  beforeEach(async () => {
    server = await init();
  });

  afterEach(async () => {
    await server.stop();
  });

  it(
    "responds with success",
    withRequestInterception(
      [
        http.post(AUTHENTICATE_SYSTEM_CLIENT_URL.toString(), () => {
          return new Response(JSON.stringify({ token: "test-token" }));
        }),
        http.post(RECORD_SEARCH_URL.toString(), () => {
          return new Response(JSON.stringify(testResponse));
        }),
      ],
      async () => {
        const res = await server.inject({
          method: "POST",
          url: "/registry/search",
          payload: testPayload,
        });

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(
          res.payload,
          JSON.stringify({ message: { ack_status: "ACK" } })
        );
      }
    )
  );
});
