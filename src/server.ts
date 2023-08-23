import * as Hapi from "@hapi/hapi";
import { DEFAULT_TIMEOUT_MS, HOST, PORT } from "./constants";
import { routes } from "./routes";

export function createServer() {
  const server = new Hapi.Server({
    host: HOST,
    port: PORT,
    routes: {
      cors: { origin: ["*"] },
      payload: { maxBytes: 52428800, timeout: DEFAULT_TIMEOUT_MS },
    },
  });

  server.route(routes);

  async function start() {
    await server.start();
    server.log("info", `Search server started on ${HOST}:${PORT}`);
  }

  async function stop() {
    await server.stop();
    server.log("info", "Search server stopped");
  }

  return { server, start, stop };
}
