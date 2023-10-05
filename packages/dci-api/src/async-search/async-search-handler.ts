import type * as Hapi from '@hapi/hapi'
import { type operations } from '../registry-core-api'
import {
  type AsyncSearchRequest,
  asyncSearchRequestSchema,
  maybeEncryptedAsyncSearchRequestSchema
} from '../validations'
import { fromZodError } from 'zod-validation-error'
import { ValidationError } from '../error'
import { search } from '../sync-search/sync-search-handler'
import { validateToken } from 'opencrvs-api'
import {
  registrySyncSearchBuilder,
  AuthorizationError
} from 'dci-opencrvs-bridge'
import { parseToken } from '../auth'
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
  const unencryptedResponse = (await withSignature(
    registrySyncSearchBuilder(results, request, correlationId)
  )) satisfies operations['post_reg_on-search']['requestBody']['content']['application/json']
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
    body: JSON.stringify(syncSearchResponse)
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
  const payload = await decryptPayload(result.data)

  await verifySignature(payload, asyncSearchRequestSchema)

  const correlationId = randomUUID()
  // We are not awaiting for this promise to resolve
  // for it to be an *async* request
  asyncSearch(token, payload, correlationId)
  return h
    .response({
      message: {
        ack_status: 'ACK',
        timestamp: new Date().toISOString(),
        correlation_id: correlationId
      }
    } satisfies operations['post_reg_search']['responses']['default']['content']['application/json'])
    .code(202)
}
