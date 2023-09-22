import { createServer } from './server'

createServer().then(async (server) => {
  await server.start()
})

export type * from './registry-core-api'
export type {
  SyncSearchRequest,
  EventType,
  SearchCriteria,
  PredicateQuery,
  IdentifierTypeQuery
} from './validations'
