import type * as Hapi from '@hapi/hapi'
import { type operations } from '../registry-core-api'
import {
  type AsyncSearchRequest,
  asyncSearchRequestSchema
} from '../validations'
import { fromZodError } from 'zod-validation-error'
import { ValidationError } from '../error'
import { search } from '../sync-search/sync-search-handler'
import { authenticateClient } from 'opencrvs-api'
import { registrySyncSearchBuilder } from 'dci-opencrvs-bridge'

function asyncSearch(token: string, request: AsyncSearchRequest) {
  setTimeout(() => {
    search(token, request.message)
      .then((results) => {
        return registrySyncSearchBuilder(
          results,
          request
        ) satisfies operations['post_reg_on-search']['requestBody']['content']['application/json']
      })
      .then(async (response) => {
        return await fetch(request.header.sender_uri, {
          method: 'POST',
          body: JSON.stringify(response)
        })
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Failed to notify ${request.header.sender_uri} on-search result`
          )
        }
      })
  }, 2000)
}

export async function asyncSearchHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const result = asyncSearchRequestSchema.safeParse(request.payload)
  if (!result.success) {
    throw new ValidationError(fromZodError(result.error).message)
  }
  const payload = result.data
  const token = await authenticateClient()
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
