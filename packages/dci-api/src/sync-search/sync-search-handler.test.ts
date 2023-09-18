import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert'
import type * as Hapi from '@hapi/hapi'
import { createServer } from '../server'
import { withRequestInterception } from '../test-utilities'
import { http } from 'msw'
import { OPENCRVS_GATEWAY_URL } from 'opencrvs-api'
import testPayload from './test-payload.json'
import testFetchRegistrationResponse from './test-fetchregistration-response.json'
import testSearchEventsResponse from './test-searchevents-response.json'

describe('POST /registry/sync/search', () => {
  let server: Hapi.Server

  beforeEach(async () => {
    const { init } = await createServer()
    server = await init()
  })

  afterEach(async () => {
    await server.stop()
  })

  it(
    'responds with success',
    withRequestInterception(
      [
        http.post(OPENCRVS_GATEWAY_URL.toString(), () => {
          return new Response(JSON.stringify(testSearchEventsResponse))
        }),
        http.post(OPENCRVS_GATEWAY_URL.toString(), () => {
          return new Response(JSON.stringify(testFetchRegistrationResponse))
        })
      ],
      async () => {
        const res = await server.inject({
          method: 'POST',
          url: '/registry/sync/search',
          payload: testPayload,
          headers: {
            'x-access-token': 'test-token'
          }
        })

        assert.strictEqual(res.statusCode, 200)
        assert.strictEqual(JSON.parse(res.payload).header.version, '1.0.0')
      }
    )
  )
})
