import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert'
import type * as Hapi from '@hapi/hapi'
import { createServer } from '../server'
import { withRequestInterception } from '../test-utilities'
import { http } from 'msw'
import { OPENCRVS_AUTH_URL, OPENCRVS_GATEWAY_URL } from 'opencrvs-api'
import testPayload from './test-payload.json'
import testFetchRegistrationResponse from '../sync-search/test-fetchregistration-response.json'
import testSearchEventsResponse from '../sync-search/test-searchevents-response.json'
import { readFileSync } from 'node:fs'
import jwt from 'jsonwebtoken'

async function flushPromises() {
  return await new Promise((resolve) => setTimeout(resolve, 0))
}

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
        http.get(new URL('.well-known', OPENCRVS_AUTH_URL).href, () => {
          return new Response(readFileSync('./test/cert.key.pub').toString())
        }),
        http.post(OPENCRVS_GATEWAY_URL.toString(), () => {
          return new Response(JSON.stringify(testSearchEventsResponse))
        }),
        http.post(OPENCRVS_GATEWAY_URL.toString(), () => {
          return new Response(JSON.stringify(testFetchRegistrationResponse))
        }),
        http.post('https://integrating-server.com/callback/on-search', () => {
          return new Response(null, { status: 200 })
        })
      ],
      async () => {
        const token = jwt.sign({}, readFileSync('./test/cert.key'), {
          algorithm: 'RS256',
          issuer: 'opencrvs:auth-service',
          audience: ['opencrvs:gateway-user', 'opencrvs:search-user']
        })
        const res = await server.inject({
          method: 'POST',
          url: '/registry/search',
          payload: testPayload,
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const body = JSON.parse(res.payload)
        assert.strictEqual(res.statusCode, 202)
        assert.strictEqual(body.message.ack_status, 'ACK')

        // wait for the async request to finish
        await flushPromises()
      }
    )
  )
})
