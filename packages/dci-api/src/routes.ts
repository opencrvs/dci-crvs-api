import * as Hapi from "@hapi/hapi";
import { syncSearchHandler } from "./sync-search/sync-search-handler";
import { healthcheckHandler } from "./healthcheck/healthcheck-handler";

export const routes = [
  {
    method: "GET",
    path: "/ping",
    handler: healthcheckHandler,
  },
  {
    method: "POST",
    path: "/registry/sync/search",
    handler: syncSearchHandler,
  },
] satisfies Hapi.ServerRoute<Hapi.ReqRefDefaults>[];
