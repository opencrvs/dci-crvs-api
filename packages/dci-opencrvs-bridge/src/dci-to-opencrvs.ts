import { Event, type SearchEventsQueryVariables } from 'opencrvs-api'
import type { SyncSearchRequest, EventType } from 'dci-api'
import { ParseError } from './error'

function eventType(event: EventType) {
  switch (event) {
    case '1':
      return Event.Birth
    case '2':
      return Event.Death
    case '4':
      return Event.Marriage
  }
}

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
  // let sortOrder: "asc" | "desc" = "asc";
  // let sortColumn: string | undefined;

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

  parameters.event =
    request.search_criteria.reg_event_type !== undefined
      ? eventType(request.search_criteria.reg_event_type.value)
      : undefined

  if ((sort?.length ?? 0) > 1) {
    throw new ParseError('Sorting by more than one attribute is not supported')
  }

  if (sort?.[0]?.attribute_name === 'dateOfDeclaration') {
    // sortColumn = "dateOfDeclaration";
  }

  if (sort?.[0]?.sort_order !== undefined) {
    // sortOrder = sort?.[0]?.sort_order;
  }

  return { advancedSearchParameters: parameters }
}
