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
import { CompactSign, FlattenedEncrypt, exportJWK, generateKeyPair } from 'jose'
import { getEncryptionKeys } from '../crypto/keys'

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
  it(
    'decrypts encrypted payload',
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
        const { publicKey } = await getEncryptionKeys()
        const res = await server.inject({
          method: 'POST',
          url: '/registry/sync/search',
          payload: {
            ...testPayload,
            header: { ...testPayload.header, is_msg_encrypted: true },
            message: await new FlattenedEncrypt(
              new TextEncoder().encode(JSON.stringify(testPayload.message))
            )
              .setUnprotectedHeader({
                alg: 'RSA-OAEP-256',
                enc: 'A256GCM',
                kid: 'unique_kid'
              })
              .encrypt(publicKey)
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
