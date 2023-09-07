import type { SearchEventsQueryVariables } from 'opencrvs-api'
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
  // let sortOrder: "asc" | "desc" = "asc";
  // let sortColumn: string | undefined;

  // TODO: Support more than one identifier
  if (query.identifier_type.value === 'BRN') {
    parameters.registrationNumber = query.identifier_value
  } else if (query.identifier_type.value === 'DRN') {
    parameters.registrationNumber = query.identifier_value
  } else if (query.identifier_type.value === 'MRN') {
    parameters.registrationNumber = query.identifier_value
  } else if (query.identifier_type.value === 'OPENCRVS_RECORD_ID') {
    parameters.recordId = query.identifier_value
  } else {
    throw new ParseError('Unsupported identifier type')
  }

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
