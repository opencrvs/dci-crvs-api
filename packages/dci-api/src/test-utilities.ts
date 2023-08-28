import { setupServer } from "msw/node";
import type { SetupServer } from "msw/node";
import { NO_RESPONSE_MOCK } from "./constants";

type ServerOptions = Parameters<typeof setupServer>;

export const withRequestInterception =
  (handlers: ServerOptions, test: (server: SetupServer) => any) => async () => {
    if (NO_RESPONSE_MOCK) {
      return await Promise.resolve(test(setupServer()));
    }

    const server = setupServer(...handlers);
    server.listen();

    return await Promise.resolve(test(server)).finally(() => {
      server.resetHandlers();
      server.close();
    });
  };
