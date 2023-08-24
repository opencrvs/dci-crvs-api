import { SetupServer, setupServer } from "msw/node";

type ServerOptions = Parameters<typeof setupServer>;

export const withRequestInterception =
  (handlers: ServerOptions, test: (server: SetupServer) => any) => async () => {
    const server = setupServer(...handlers);
    server.listen();

    return Promise.resolve(test(server)).finally(() => {
      server.resetHandlers();
      server.close();
    });
  };
