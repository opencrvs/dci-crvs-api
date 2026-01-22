import type * as Hapi from '@hapi/hapi'
// import { asyncSearchHandler } from './async-search/async-search-handler'
import { syncSearchHandler } from './sync-search/sync-search-handler'
import { healthcheckHandler } from './healthcheck/healthcheck-handler'
import { type ReqResWithAuthorization } from './server'
import { OPENCRVS_TOKEN_URL } from './constants'
import { getJwksHandler } from './.well-known/jwks-handler'
import { getLocationsHandler } from './.well-known/locations-handler'

export const routes = [
  {
    method: 'GET',
    path: '/health',
    handler: healthcheckHandler,
    options: {
      description: 'Health check endpoint',
      notes: 'Returns the health status of the API service',
      tags: ['api', 'health']
    }
  },
  {
    method: 'GET',
    path: '/.well-known/jwks.json',
    handler: getJwksHandler,
    options: {
      description: 'JSON Web Key Set endpoint',
      notes: 'Provides the public keys for JWT verification',
      tags: ['api', 'auth']
    }
  },
  {
    method: 'GET',
    path: '/.well-known/locations.json',
    handler: getLocationsHandler,
    options: {
      description: 'Locations endpoint',
      notes: 'Returns available locations for CRVS operations',
      tags: ['api', 'metadata']
    }
  },
  // {
  //   method: 'POST',
  //   path: '/registry/search',
  //   handler: asyncSearchHandler
  // },
  {
    method: 'POST',
    path: '/registry/sync/search',
    handler: syncSearchHandler,
    options: {
      description: 'Synchronous search for CRVS records',
      notes:
        'Search for birth/death records using various criteria including BRN, UIN, or expression queries',
      tags: ['api', 'search'],
      payload: {
        output: 'data',
        parse: true
      }
    }
  },
  {
    method: 'POST',
    path: '/oauth2/client/token',
    handler: {
      proxy: {
        uri: `${OPENCRVS_TOKEN_URL.toString()}{query}`,
        passThrough: true
      }
    },
    options: {
      description: 'OAuth2 client token endpoint',
      notes: 'Proxies token requests to the OpenCRVS authentication service',
      tags: ['api', 'auth']
    }
  }
] satisfies Array<Hapi.ServerRoute<ReqResWithAuthorization>>
