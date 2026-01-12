import type * as Hapi from '@hapi/hapi'
import {
  registrySyncSearchBuilder,
  // pagination,
  // searchRequestToAdvancedSearchParameters,
  buildSearchParameters
} from 'dci-opencrvs-bridge'
import {
  type SyncSearchRequest,
  maybeEncryptedSyncSearchRequestSchema
} from '../validations'
import { fromZodError } from 'zod-validation-error'
import { ValidationError, AuthorizationError } from '../error'
import { parseToken } from '../auth'
import { type ReqResWithAuthorization } from '../server'
// import { withSignature } from '../crypto/sign'
// import { type operations } from '../crvs-api'
import { verifySignature } from '../crypto/verify'
import { decryptPayload } from '../crypto/decrypt'
// import { encryptPayload } from '../crypto/encrypt'
import { createClient } from '@opencrvs/toolkit/api'
import { OPENCRVS_EVENTS_URL } from '../constants'
import { operations } from '../crvs-api'

export async function search(
  token: string,
  request: SyncSearchRequest['message']
) {
  const searchRequests = request.search_request
  const searchResults = await Promise.all(
    searchRequests.map(async (searchRequest) => {
      const pageSize = searchRequest.search_criteria.pagination?.page_size ?? 20
      const pageNumber =
        searchRequest.search_criteria.pagination?.page_number ?? 1

      const client = createClient(OPENCRVS_EVENTS_URL, `Bearer ${token}`)
      const searchQuery = buildSearchParameters(searchRequest.search_criteria, {
        pageSize,
        pageNumber
      })
      console.log('Search Query:', JSON.stringify(searchQuery, null, 2))
      const { results, total } = await client.event.search.query(searchQuery)

      return {
        registrations: results,
        responseFinishedTimestamp: new Date(),
        originalRequest: searchRequest,
        pageNumber,
        pageSize,
        totalItems: total
      }
    })
  )

  return searchResults
}

export async function syncSearchHandler(
  request: Hapi.Request<ReqResWithAuthorization>,
  _h: Hapi.ResponseToolkit
) {
  const header = request.headers.authorization
  if (header === undefined) {
    throw new AuthorizationError('Authorization header is missing')
  }
  const token = parseToken(header)
  const result = maybeEncryptedSyncSearchRequestSchema.safeParse(
    request.payload
  )
  if (!result.success) {
    throw new ValidationError(fromZodError(result.error).message)
  }
  await verifySignature(result.data, maybeEncryptedSyncSearchRequestSchema)

  const payload = await decryptPayload(result.data)

  const results = await search(token, payload.message)
  const unencryptedResponse = registrySyncSearchBuilder(
    results,
    payload
  ) satisfies operations['post_reg_sync_search']['responses']['default']['content']['application/json']

  // if (payload.header.is_msg_encrypted) {
  //   return await withSignature({
  //     ...unencryptedResponse,
  //     message: await encryptPayload(
  //       `${payload.header.sender_id}/.well-known/jwks.json`,
  //       unencryptedResponse.message
  //     )
  //   })
  // }

  // return await withSignature(unencryptedResponse)
  return unencryptedResponse
}
