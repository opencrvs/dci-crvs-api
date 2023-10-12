import type * as Hapi from '@hapi/hapi'
import { asyncSearchHandler } from './async-search/async-search-handler'
import { syncSearchHandler } from './sync-search/sync-search-handler'
import { healthcheckHandler } from './healthcheck/healthcheck-handler'
import { type ReqResWithAuthorization } from './server'
import { OPENCRVS_TOKEN_URL } from 'opencrvs-api'
import { getJwksHandler } from './jwks/jwks-handler'

export const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: healthcheckHandler
  },
  {
    method: 'GET',
    path: '/.well-known/jwks.json',
    handler: getJwksHandler
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
  },
  {
    method: 'POST',
    path: '/oauth2/client/token',
    handler: {
      proxy: {
        uri: `${OPENCRVS_TOKEN_URL.toString()}{query}`
      }
    }
  }
] satisfies Array<Hapi.ServerRoute<ReqResWithAuthorization>>
