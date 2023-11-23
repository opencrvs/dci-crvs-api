import type { SyncSearchRequest } from 'http-api'
import type { Registration } from 'opencrvs-api'

export interface SearchResponseWithMetadata {
  registrations: Registration[]
  responseFinishedTimestamp: Date
  originalRequest: SyncSearchRequest['message']['search_request'][number]
  pageSize: number
  pageNumber: number
  totalItems: number
}
