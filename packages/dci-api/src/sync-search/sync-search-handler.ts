import type * as Hapi from '@hapi/hapi'
import {
  authenticateClient,
  advancedRecordSearch,
  fetchRegistration
} from 'opencrvs-api'
import {
  registrySyncSearchBuilder,
  searchRequestToAdvancedSearchParameters
} from 'dci-opencrvs-bridge'
import { compact } from 'lodash/fp'
import { type SyncSearchRequest, requestSchema } from '../validations'
import { fromZodError } from 'zod-validation-error'
import { ValidationError } from '../error'

async function fetchRegistrations(token: string, ids: string[]) {
  return await Promise.all(
    ids.map(async (id) => await fetchRegistration(token, id))
  )
}

async function search(token: string, request: SyncSearchRequest['message']) {
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
  request: Hapi.Request,
  _h: Hapi.ResponseToolkit
) {
  const result = requestSchema.safeParse(request.payload)
  if (!result.success) {
    throw new ValidationError(fromZodError(result.error).message)
  }
  const payload = result.data
  const token = await authenticateClient()
  const results = await search(token, payload.message)
  return registrySyncSearchBuilder(results, payload)
}
