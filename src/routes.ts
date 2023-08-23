import * as Hapi from "@hapi/hapi";
import { asyncSearchHandler } from "./async-search/async-search-handler";
import { healthcheckHandler } from "./healthcheck/healthcheck-handler";

export const routes = [
  {
    method: "GET",
    path: "/ping",
    handler: healthcheckHandler,
  },
  {
    method: "POST",
    path: "/registry/search",
    handler: asyncSearchHandler,
  },
] satisfies Hapi.ServerRoute<Hapi.ReqRefDefaults>[];
