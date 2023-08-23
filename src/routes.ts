import * as Hapi from "@hapi/hapi";

export const routes = [
  {
    method: "GET",
    path: "/ping",
    handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
      return { success: true };
    },
  },
] satisfies Hapi.ServerRoute<Hapi.ReqRefDefaults>[];
