import type * as Hapi from '@hapi/hapi'
import { type operations } from '../registry-core-api'
import {
  type AsyncSearchRequest,
  asyncSearchRequestSchema
} from '../validations'
import { fromZodError } from 'zod-validation-error'
import { AuthorizationError, ValidationError } from '../error'
import { search } from '../sync-search/sync-search-handler'
import { validateToken } from 'opencrvs-api'
import { registrySyncSearchBuilder } from 'dci-opencrvs-bridge'

async function asyncSearch(token: string, request: AsyncSearchRequest) {
  const results = await search(token, request.message)
  const response = await fetch(request.header.sender_uri, {
    method: 'POST',
    body: JSON.stringify(
      registrySyncSearchBuilder(
        results,
        request
      ) satisfies operations['post_reg_on-search']['requestBody']['content']['application/json']
    )
  })
  if (!response.ok) {
    throw new Error(
      `Failed to notify ${request.header.sender_uri} on-search result`
    )
  }
}

export async function asyncSearchHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const token = request.headers['x-access-token'] as string | undefined
  if (token === undefined) {
    throw new AuthorizationError('Access token not found')
  }
  await validateToken(token)
  const result = asyncSearchRequestSchema.safeParse(request.payload)
  if (!result.success) {
    throw new ValidationError(fromZodError(result.error).message)
  }
  const payload = result.data
  // We are not awaiting for this promise to resolve
  // for it to be an *async* request
  asyncSearch(token, payload)
  return h
    .response({
      message: {
        ack_status: 'ACK',
        timestamp: new Date().toISOString(),
        correlation_id: '<<TODO>>'
      }
    } satisfies operations['post_reg_search']['responses']['default']['content']['application/json'])
    .code(202)
}
