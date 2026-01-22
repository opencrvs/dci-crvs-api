import { EventIndex } from '@opencrvs/toolkit/events'
import type { SyncSearchRequest } from 'http-api'

export interface SearchResponseWithMetadata {
  registrations: EventIndex[]
  responseFinishedTimestamp: Date
  originalRequest: SyncSearchRequest['message']['search_request'][number]
  pageSize: number
  pageNumber: number
  totalItems: number
}
