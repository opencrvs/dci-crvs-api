import * as Hapi from "@hapi/hapi";
import { HOST, PORT, DEFAULT_TIMEOUT_MS } from "./constants";
import { routes } from "./routes";
import { ParseError } from "dci-opencrvs-bridge";
import { AuthorizationError } from "opencrvs-api/src/error";
import * as Boom from "@hapi/boom";

const server = new Hapi.Server({
  host: HOST,
  port: PORT,
  routes: {
    cors: { origin: ["*"] },
    payload: { maxBytes: 52428800, timeout: DEFAULT_TIMEOUT_MS },
  },
});

server.route(routes);

server.ext("onPreResponse", (request, reply) => {
  if (request.response instanceof ParseError) {
    return Boom.badRequest(request.response);
  }

  if (request.response instanceof AuthorizationError) {
    return Boom.unauthorized(request.response);
  }

  return reply.continue;
});

export async function start() {
  await server.start();
  server.log(
    "info",
    `DCI-CRVS to OpenCRVS interoperability API started on ${HOST}:${PORT}`
  );
}

// async function stop() {
//   await server.stop();
//   server.log("info", "Search server stopped");
// }

export async function init() {
  await server.initialize();
  return server;
}
