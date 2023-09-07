import type { SyncSearchRequest } from 'dci-api'
import type { Registration } from 'opencrvs-api'

export interface SearchResponseWithMetadata {
  registrations: Registration[]
  responseFinishedTimestamp: Date
  originalRequest: SyncSearchRequest['message']['search_request'][number]
}
