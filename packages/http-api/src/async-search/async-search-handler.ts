import type * as Hapi from '@hapi/hapi'
import { type operations } from '../crvs-api'
import {
  type AsyncSearchRequest,
  maybeEncryptedAsyncSearchRequestSchema
} from '../validations'
import { fromZodError } from 'zod-validation-error'
import { AuthorizationError, ValidationError } from '../error'
import { search } from '../sync-search/sync-search-handler'
import { registrySyncSearchBuilder } from 'dci-opencrvs-bridge'
import { parseToken, validateToken } from '../auth'
import { randomUUID } from 'node:crypto'
import { type ReqResWithAuthorization } from '../server'
import { withSignature } from '../crypto/sign'
import { verifySignature } from '../crypto/verify'
import { decryptPayload } from '../crypto/decrypt'
import { encryptPayload } from '../crypto/encrypt'

async function asyncSearch(
  token: string,
  request: AsyncSearchRequest,
  correlationId: ReturnType<typeof randomUUID>
) {
  const results = await search(token, request.message)
  const unencryptedResponse = registrySyncSearchBuilder(
    results,
    request,
    correlationId
  ) satisfies operations['post_reg_on-search']['requestBody']['content']['application/json']
  const syncSearchResponse = {
    ...unencryptedResponse,
    message: request.header.is_msg_encrypted
      ? encryptPayload(
          `${request.header.sender_id}/.well-known/jwks.json`,
          unencryptedResponse.message
        )
      : unencryptedResponse.message
  }
  const response = await fetch(request.header.sender_uri, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(await withSignature(syncSearchResponse))
  })
  if (!response.ok) {
    throw new Error(
      `Failed to notify ${request.header.sender_uri} on-search result`
    )
  }
}

export async function asyncSearchHandler(
  request: Hapi.Request<ReqResWithAuthorization>,
  h: Hapi.ResponseToolkit
) {
  const header = request.headers.authorization
  if (header === undefined) {
    throw new AuthorizationError('Authorization header is missing')
  }
  const token = parseToken(header)
  await validateToken(token)
  const result = maybeEncryptedAsyncSearchRequestSchema.safeParse(
    request.payload
  )
  if (!result.success) {
    throw new ValidationError(fromZodError(result.error).message)
  }
  await verifySignature(result.data, maybeEncryptedAsyncSearchRequestSchema)

  const payload = await decryptPayload(result.data)

  const correlationId = randomUUID()
  void asyncSearch(token, payload, correlationId).catch((error) => {
    console.error('Async search callback failed:', error)
  })

  return h.response({
    message: {
      ack_status: 'ACK',
      timestamp: new Date().toISOString(),
      correlation_id: correlationId
    }
  } satisfies operations['post_reg_search']['responses']['default']['content']['application/json'])
}
