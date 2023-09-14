import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import assert from 'node:assert'
import type * as Hapi from '@hapi/hapi'
import { createServer } from '../server'
import { withRequestInterception } from '../test-utilities'
import { http } from 'msw'
import { AUTHENTICATE_SYSTEM_CLIENT_URL } from 'opencrvs-api'
import testPayload from './test-payload.json'

describe('POST /registry/search', () => {
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
        http.post(AUTHENTICATE_SYSTEM_CLIENT_URL.toString(), () => {
          return new Response(JSON.stringify({ token: 'test-token' }))
        })
        /*
         * the callback provided to the setTimeout
         * doesn't get called after mocking it so these fetch
         * requests aren't getting called either
         *
         * http.post(OPENCRVS_GATEWAY_URL.toString(), () => {
         *   return new Response(JSON.stringify(testSearchEventsResponse))
         * }),
         * http.post(OPENCRVS_GATEWAY_URL.toString(), () => {
         *   return new Response(JSON.stringify(testFetchRegistrationResponse))
         * }),
         * http.post('https://integrating-server.com/callback/on-search', () => {
         *   return new Response(null, { status: 200 })
         * })
         */
      ],
      async () => {
        mock.timers.enable(['setTimeout'])
        const res = await server.inject({
          method: 'POST',
          url: '/registry/search',
          payload: testPayload
        })

        mock.timers.tick(1)

        const body = JSON.parse(res.payload)
        assert.strictEqual(res.statusCode, 202)
        assert.strictEqual(body.message.ack_status, 'ACK')
        mock.timers.reset()
      }
    )
  )
})
