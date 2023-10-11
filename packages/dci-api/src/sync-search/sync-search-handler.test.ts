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
import { CompactSign, exportJWK, generateKeyPair } from 'jose'

describe('POST /registry/sync/search', async () => {
  let server: Hapi.Server
  const { privateKey, publicKey } = await generateKeyPair('RS256')

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
            Authorization: 'Bearer test-token'
          }
        })

        assert.strictEqual(res.statusCode, 200)
        assert.strictEqual(JSON.parse(res.payload).header.version, '1.0.0')
      }
    )
  )

  it(
    'returns 401 when gateway is unauthorized',
    withRequestInterception(
      [
        http.post(OPENCRVS_GATEWAY_URL.toString(), () => {
          return new Response(
            JSON.stringify({
              errors: [
                {
                  message: 'Unauthorized',
                  locations: [{ line: 2, column: 3 }],
                  path: ['searchEvents'],
                  extensions: {
                    code: 'UNAUTHENTICATED',
                    exception: {
                      stacktrace: [
                        'AuthenticationError: Unauthorized',
                        '    at /root/Projects/opencrvs-core/packages/gateway/src/graphql/config.ts:123:17',
                        '    at Generator.next (<anonymous>)',
                        '    at /root/Projects/opencrvs-core/packages/gateway/src/graphql/config.ts:8:71',
                        '    at new Promise (<anonymous>)',
                        '    at __awaiter (/root/Projects/opencrvs-core/packages/gateway/src/graphql/config.ts:4:12)',
                        '    at fieldConfig.resolve (/root/Projects/opencrvs-core/packages/gateway/src/graphql/config.ts:81:24)',
                        '    at field.resolve (/root/Projects/opencrvs-core/node_modules/apollo-server-core/src/utils/schemaInstrumentation.ts:106:18)',
                        '    at resolveField (/root/Projects/opencrvs-core/node_modules/graphql/execution/execute.js:464:18)',
                        '    at executeFields (/root/Projects/opencrvs-core/node_modules/graphql/execution/execute.js:292:18)',
                        '    at executeOperation (/root/Projects/opencrvs-core/node_modules/graphql/execution/execute.js:236:122)'
                      ]
                    }
                  }
                }
              ],
              data: { searchEvents: null }
            })
          )
        })
      ],
      async () => {
        const res = await server.inject({
          method: 'POST',
          url: '/registry/sync/search',
          payload: testPayload,
          headers: {
            Authorization: 'Bearer test-token'
          }
        })

        assert.strictEqual(res.statusCode, 401)
      }
    )
  )

  it(
    'verifies signature',
    withRequestInterception(
      [
        http.post(OPENCRVS_GATEWAY_URL.toString(), () => {
          return new Response(JSON.stringify(testSearchEventsResponse))
        }),
        http.post(OPENCRVS_GATEWAY_URL.toString(), () => {
          return new Response(JSON.stringify(testFetchRegistrationResponse))
        }),
        http.get(
          'https://integrating-server.com/.well-known/jwks.json',
          async () => {
            return new Response(
              JSON.stringify({ keys: [await exportJWK(publicKey)] })
            )
          }
        )
      ],
      async () => {
        const res = await server.inject({
          method: 'POST',
          url: '/registry/sync/search',
          payload: {
            signature: await new CompactSign(
              new TextEncoder().encode(
                JSON.stringify({
                  header: testPayload.header,
                  message: testPayload.message
                })
              )
            )
              .setProtectedHeader({ alg: 'RS256' })
              .sign(privateKey),
            ...testPayload
          },
          headers: {
            Authorization: 'Bearer test-token'
          }
        })

        assert.strictEqual(res.statusCode, 200)
        assert.strictEqual(JSON.parse(res.payload).header.version, '1.0.0')
      }
    )
  )
})
