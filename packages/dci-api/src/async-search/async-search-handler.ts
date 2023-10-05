import type * as Hapi from '@hapi/hapi'
import { type operations } from '../registry-core-api'
import {
  type AsyncSearchRequest,
  asyncSearchRequestSchema
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
import { generateSignature } from '../crypto/sign'
import { verifySignature } from '../crypto/verify'

async function asyncSearch(
  token: string,
  request: AsyncSearchRequest,
  correlationId: ReturnType<typeof randomUUID>
) {
  const results = await search(token, request.message)
  let syncSearchResponse: operations['post_reg_on-search']['requestBody']['content']['application/json'] =
    registrySyncSearchBuilder(results, request, correlationId)
  syncSearchResponse = {
    signature: await generateSignature({
      header: syncSearchResponse.header,
      message: syncSearchResponse.message
    }),
    ...syncSearchResponse
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
  const result = asyncSearchRequestSchema.safeParse(request.payload)
  if (!result.success) {
    throw new ValidationError(fromZodError(result.error).message)
  }
  const payload = result.data

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
