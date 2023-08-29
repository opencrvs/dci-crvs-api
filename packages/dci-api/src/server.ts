import * as Hapi from "@hapi/hapi";
import { HOST, PORT, DEFAULT_TIMEOUT_MS, NODE_ENV } from "./constants";
import { routes } from "./routes";
import { ParseError } from "dci-opencrvs-bridge";
import { AuthorizationError } from "opencrvs-api/src/error";
import pino from "hapi-pino";
import { error } from "./error";

export async function createServer() {
  const server = new Hapi.Server({
    host: HOST,
    port: PORT,
    routes: {
      cors: { origin: ["*"] },
      payload: { maxBytes: 52428800, timeout: DEFAULT_TIMEOUT_MS },
    },
  });

  server.route(routes);

  await server.register({
    plugin: pino,
    options: {
      redact: ['req.headers["x-access-token"]'],
      ...(NODE_ENV === "production"
        ? {}
        : {
            transport: {
              target: "pino-pretty",
            },
          }),
    },
  });

  server.ext("onPreResponse", (request, reply) => {
    if (request.response instanceof ParseError) {
      return error(request, reply, 400);
    }

    if (request.response instanceof AuthorizationError) {
      return error(request, reply, 401);
    }

    if ("isBoom" in request.response) {
      return error(request, reply, 500);
    }

    return reply.continue;
  });

  async function start() {
    await server.start();
    server.log(
      "info",
      `DCI-CRVS to OpenCRVS interoperability API started on ${HOST}:${PORT}`
    );
  }

  async function stop() {
    await server.stop();
    server.log("info", "Search server stopped");
  }

  async function init() {
    await server.initialize();
    return server;
  }

  return { start, init, stop };
}
