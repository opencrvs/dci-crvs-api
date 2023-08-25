import * as Hapi from "@hapi/hapi";
import { HOST, PORT, DEFAULT_TIMEOUT_MS } from "./constants";
import { routes } from "./routes";

const server = new Hapi.Server({
  host: HOST,
  port: PORT,
  routes: {
    cors: { origin: ["*"] },
    payload: { maxBytes: 52428800, timeout: DEFAULT_TIMEOUT_MS },
  },
});

server.route(routes);

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
