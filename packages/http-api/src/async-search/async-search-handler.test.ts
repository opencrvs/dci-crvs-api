import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert'
import type * as Hapi from '@hapi/hapi'
import jwt from 'jsonwebtoken'
import { http, HttpResponse } from 'msw'
import { createServer } from '../server'
import { withRequestInterception } from '../test-utilities'

async function waitWithTimeout(promise: Promise<void>, timeoutMs = 2_000) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  await Promise.race([
    promise,
    new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Timed out waiting for async callback'))
      }, timeoutMs)
    })
  ])

  if (timeoutId !== undefined) {
    clearTimeout(timeoutId)
  }
}

describe('POST /registry/search', () => {
  let server: Hapi.Server
  let callbackBody: any
  let resolveCallback: () => void = () => {}

  beforeEach(async () => {
    callbackBody = undefined
    resolveCallback = () => {}
    const { init } = await createServer()
    server = await init()
  })

  afterEach(async () => {
    await server.stop()
  })

  it(
    'returns ACK and posts on-search callback asynchronously',
    withRequestInterception(
      [
        http.get('http://localhost:4040/.well-known', () => {
          return HttpResponse.text('test-shared-secret')
        }),
        http.post(
          'http://sender.example.org/callback/on-search',
          async ({ request }) => {
            callbackBody = await request.json()
            resolveCallback()
            return HttpResponse.json({ message: { ack_status: 'ACK' } })
          }
        )
      ],
      async () => {
        const token = jwt.sign({ sub: 'test-user' }, 'test-shared-secret', {
          issuer: 'opencrvs:auth-service',
          audience: 'opencrvs:gateway-user',
          expiresIn: '1h'
        })

        const callbackPromise = new Promise<void>((resolve) => {
          resolveCallback = resolve
        })

        const payload = {
          header: {
            version: '1.0.0',
            message_id: 'msg-1',
            message_ts: new Date().toISOString(),
            action: 'search',
            sender_id: 'http://sender.example.org',
            sender_uri: 'http://sender.example.org/callback/on-search',
            receiver_id: 'civilregistry.example.org',
            total_count: 0,
            is_msg_encrypted: false
          },
          message: {
            transaction_id: 'txn-1',
            search_request: []
          }
        }

        const res = await server.inject({
          method: 'POST',
          url: '/registry/search',
          headers: {
            authorization: `Bearer ${token}`
          },
          payload
        })

        assert.strictEqual(res.statusCode, 200)
        const ack = JSON.parse(res.payload)

        assert.strictEqual(ack.message.ack_status, 'ACK')
        assert.strictEqual(typeof ack.message.correlation_id, 'string')

        await waitWithTimeout(callbackPromise)

        assert.strictEqual(callbackBody.header.action, 'on-search')
        assert.strictEqual(
          callbackBody.message.transaction_id,
          payload.message.transaction_id
        )
        assert.strictEqual(
          callbackBody.message.correlation_id,
          ack.message.correlation_id
        )
        assert.strictEqual(typeof callbackBody.signature, 'string')
      }
    )
  )
})
