import type * as Hapi from '@hapi/hapi'
import { asyncSearchHandler } from './async-search/async-search-handler'
import { syncSearchHandler } from './sync-search/sync-search-handler'
import { healthcheckHandler } from './healthcheck/healthcheck-handler'

export const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: healthcheckHandler
  },
  {
    method: 'POST',
    path: '/registry/search',
    handler: asyncSearchHandler
  },
  {
    method: 'POST',
    path: '/registry/sync/search',
    handler: syncSearchHandler
  }
] satisfies Array<Hapi.ServerRoute<Hapi.ReqRefDefaults>>
