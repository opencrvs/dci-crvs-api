import { type SearchEventsQueryVariables } from 'opencrvs-api'
import type { SyncSearchRequest } from 'dci-api'
import { ParseError } from './error'

export function searchRequestToAdvancedSearchParameters(
  request: SyncSearchRequest['message']['search_request'][number]
): SearchEventsQueryVariables {
  const query = request.search_criteria.query as {
    identifier_type: { value: string }
    identifier_value: string
  }
  const sort = request.search_criteria.sort as
    | Array<{
        attribute_name: 'dateOfDeclaration'
        sort_order: 'asc' | 'desc'
      }>
    | undefined
  const parameters: SearchEventsQueryVariables['advancedSearchParameters'] = {}
  const sortBy = sort?.map(({ attribute_name: column, sort_order: order }) => ({
    column,
    order
  }))

  if (query.identifier_type.value === 'BRN') {
    parameters.registrationNumber = query.identifier_value
  } else if (query.identifier_type.value === 'DRN') {
    parameters.registrationNumber = query.identifier_value
  } else if (query.identifier_type.value === 'MRN') {
    parameters.registrationNumber = query.identifier_value
  } else if (query.identifier_type.value === 'OPENCRVS_RECORD_ID') {
    parameters.recordId = query.identifier_value
  } else if (query.identifier_type.value === 'NID') {
    parameters.nationalId = query.identifier_value
  } else {
    throw new ParseError('Unsupported identifier type')
  }

  parameters.event = request.search_criteria.reg_event_type?.value

  return { advancedSearchParameters: parameters, sortBy }
}
