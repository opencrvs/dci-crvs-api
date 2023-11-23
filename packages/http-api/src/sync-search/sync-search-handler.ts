import type * as Hapi from '@hapi/hapi'
import { advancedRecordSearch, fetchRegistration } from 'opencrvs-api'
import {
  registrySyncSearchBuilder,
  AuthorizationError,
  pagination,
  searchRequestToAdvancedSearchParameters
} from 'dci-opencrvs-bridge'
import { compact } from 'lodash/fp'
import {
  type SyncSearchRequest,
  maybeEncryptedSyncSearchRequestSchema
} from '../validations'
import { fromZodError } from 'zod-validation-error'
import { ValidationError } from '../error'
import { parseToken } from '../auth'
import { type ReqResWithAuthorization } from '../server'
import { withSignature } from '../crypto/sign'
import { type operations } from '../registry-core-api'
import { verifySignature } from '../crypto/verify'
import { decryptPayload } from '../crypto/decrypt'
import { encryptPayload } from '../crypto/encrypt'

async function fetchRegistrations(token: string, ids: string[]) {
  return await Promise.all(
    ids.map(async (id) => await fetchRegistration(token, id))
  )
}

export async function search(
  token: string,
  request: SyncSearchRequest['message']
) {
  const searchRequests = request.search_request
  const searchResults = await Promise.all(
    searchRequests.map(async (searchRequest) => {
      const { skip, count, pageNumber, pageSize } = pagination(
        searchRequest.search_criteria.pagination?.page_size,
        searchRequest.search_criteria.pagination?.page_number
      )
      const params = searchRequestToAdvancedSearchParameters(
        searchRequest,
        skip,
        count
      )
      const response = await advancedRecordSearch(token, params)

      const responseIds = compact(
        response?.results?.map((result) => result?.id)
      )
      const registrations = await fetchRegistrations(token, responseIds)

      return {
        registrations: compact(registrations),
        responseFinishedTimestamp: new Date(),
        originalRequest: searchRequest,
        pageNumber,
        pageSize,
        totalItems: response?.totalItems ?? 0
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
  if (payload.header.is_msg_encrypted) {
    return await withSignature({
      ...unencryptedResponse,
      message: await encryptPayload(
        `${payload.header.sender_id}/.well-known/jwks.json`,
        unencryptedResponse.message
      )
    })
  }
  return await withSignature(unencryptedResponse)
}
