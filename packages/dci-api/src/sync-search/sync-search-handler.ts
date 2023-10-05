import type * as Hapi from '@hapi/hapi'
import { advancedRecordSearch, fetchRegistration } from 'opencrvs-api'
import {
  registrySyncSearchBuilder,
  AuthorizationError,
  searchRequestToAdvancedSearchParameters
} from 'dci-opencrvs-bridge'
import { compact } from 'lodash/fp'
import { type SyncSearchRequest, syncSearchRequestSchema } from '../validations'
import { fromZodError } from 'zod-validation-error'
import { ValidationError } from '../error'
import { parseToken } from '../auth'
import { type ReqResWithAuthorization } from '../server'
import { generateSignature } from '../crypto/sign'
import { type operations } from '../registry-core-api'
import { verifySignature } from '../crypto/verify'

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
      const response = await advancedRecordSearch(
        token,
        searchRequestToAdvancedSearchParameters(searchRequest)
      )

      const responseIds = compact(
        response?.results?.map((result) => result?.id)
      )
      const registrations = await fetchRegistrations(token, responseIds)

      return {
        registrations: compact(registrations),
        responseFinishedTimestamp: new Date(),
        originalRequest: searchRequest
      }
    })
  )

  return searchResults
}

export async function syncSearchHandler(
  request: Hapi.Request<ReqResWithAuthorization>,
  _h: Hapi.ResponseToolkit
) {
  const result = syncSearchRequestSchema.safeParse(request.payload)
  if (!result.success) {
    throw new ValidationError(fromZodError(result.error).message)
  }
  const header = request.headers.authorization
  if (header === undefined) {
    throw new AuthorizationError('Authorization header is missing')
  }
  const token = parseToken(header)
  const payload = result.data

  await verifySignature(payload, syncSearchRequestSchema)

  const results = await search(token, payload.message)
  let response: operations['post_reg_sync_search']['responses']['default']['content']['application/json'] =
    registrySyncSearchBuilder(results, payload)
  response = {
    signature: await generateSignature({
      message: response.message,
      header: response.header
    }),
    ...response
  }
  return response
}
