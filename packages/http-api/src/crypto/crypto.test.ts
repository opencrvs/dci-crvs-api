import { describe, it } from 'node:test'
import assert from 'node:assert'
import { calculateJwkThumbprint, exportJWK, FlattenedEncrypt } from 'jose'
import { http, HttpResponse } from 'msw'
import { withRequestInterception } from '../test-utilities'
import { withSignature } from './sign'
import { verifySignature } from './verify'
import { encryptPayload } from './encrypt'
import { decryptPayload } from './decrypt'
import { getEncryptionKeys, getSigningKeys } from './keys'
import { maybeEncryptedAsyncSearchRequestSchema } from '../validations'

function buildAsyncHeader(isEncrypted: boolean) {
  return {
    version: '1.0.0' as const,
    message_id: 'msg-1',
    message_ts: new Date().toISOString(),
    action: 'search' as const,
    sender_id: 'http://sender.example.org',
    sender_uri: 'http://sender.example.org/callback/on-search',
    receiver_id: 'civilregistry.example.org',
    total_count: 0,
    is_msg_encrypted: isEncrypted
  }
}

function buildSearchRequestMessage() {
  return {
    transaction_id: 'txn-1',
    search_request: []
  }
}

describe('crypto', () => {
  it(
    'signs and verifies async payload signatures',
    withRequestInterception(
      [
        http.get(
          'http://sender.example.org/.well-known/jwks.json',
          async () => {
            const { publicKey } = await getSigningKeys()
            const jwk = await exportJWK(publicKey)
            const kid = await calculateJwkThumbprint(jwk)

            return HttpResponse.json({
              keys: [{ ...jwk, kid, use: 'sig', alg: 'RS256' }]
            })
          }
        )
      ],
      async () => {
        const payload = {
          header: buildAsyncHeader(false),
          message: buildSearchRequestMessage()
        }

        const signedPayload = await withSignature(payload)

        await assert.doesNotReject(async () => {
          await verifySignature(
            signedPayload,
            maybeEncryptedAsyncSearchRequestSchema
          )
        })

        const tamperedPayload = {
          ...signedPayload,
          message: {
            ...signedPayload.message,
            transaction_id: 'txn-tampered'
          }
        }

        await assert.rejects(async () => {
          await verifySignature(
            tamperedPayload,
            maybeEncryptedAsyncSearchRequestSchema
          )
        }, /Signature verification failed/)
      }
    )
  )

  it(
    'encrypts callback payload with receiver jwks',
    withRequestInterception(
      [
        http.get(
          'http://sender.example.org/.well-known/jwks.json',
          async () => {
            const { publicKey } = await getEncryptionKeys()
            const jwk = await exportJWK(publicKey)

            return HttpResponse.json({
              keys: [
                { ...jwk, kid: 'enc-key-1', use: 'enc', alg: 'RSA-OAEP-256' }
              ]
            })
          }
        )
      ],
      async () => {
        const responsePayload = {
          transaction_id: 'txn-1',
          correlation_id: 'corr-1',
          search_response: []
        }

        const encrypted = await encryptPayload(
          'http://sender.example.org/.well-known/jwks.json',
          responsePayload
        )

        assert.strictEqual(encrypted.header.alg, 'RSA-OAEP-256')
        assert.strictEqual(encrypted.header.enc, 'A256GCM')
        assert.strictEqual(encrypted.header.kid, 'enc-key-1')
        assert.ok(encrypted.ciphertext.length > 0)
        assert.ok(encrypted.encrypted_key.length > 0)
        assert.ok(encrypted.iv.length > 0)
        assert.ok(encrypted.tag.length > 0)
      }
    )
  )

  it('decrypts encrypted async request payloads', async () => {
    const { publicKey } = await getEncryptionKeys()
    const message = buildSearchRequestMessage()

    const jwe = await new FlattenedEncrypt(
      new TextEncoder().encode(JSON.stringify(message))
    )
      .setUnprotectedHeader({
        alg: 'RSA-OAEP-256',
        enc: 'A256GCM',
        kid: 'enc-key-1'
      })
      .encrypt(publicKey)

    const decrypted = await decryptPayload({
      header: buildAsyncHeader(true),
      message: {
        header: {
          alg: 'RSA-OAEP-256',
          enc: 'A256GCM',
          kid: 'enc-key-1'
        },
        ciphertext: jwe.ciphertext,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        encrypted_key: jwe.encrypted_key!,
        tag: jwe.tag,
        iv: jwe.iv
      }
    })

    assert.deepStrictEqual(decrypted.message, message)
  })
})
