import { type SearchEventsQueryVariables, Event } from 'opencrvs-api'
import type {
  SyncSearchRequest,
  SearchCriteria,
  IdentifierTypeQuery
} from 'dci-api'
import { ParseError } from './error'
import { subDays, formatISO, addDays } from 'date-fns/fp'

function isIdentifierTypeQuery(
  criteria: SearchCriteria
): criteria is IdentifierTypeQuery {
  return criteria.query_type === 'idtype-value'
}

export function searchRequestToAdvancedSearchParameters(
  request: SyncSearchRequest['message']['search_request'][number]
): SearchEventsQueryVariables {
  const criteria = request.search_criteria
  const sort = request.search_criteria.sort
  const parameters: SearchEventsQueryVariables['advancedSearchParameters'] = {}
  const sortBy = sort?.map(
    ({ attribute_name: column = '', sort_order: order }) => ({
      column,
      order
    })
  )

  if (isIdentifierTypeQuery(criteria)) {
    if (criteria.query.identifier_type.value === 'BRN') {
      parameters.registrationNumber = criteria.query.identifier_value
    } else if (criteria.query.identifier_type.value === 'DRN') {
      parameters.registrationNumber = criteria.query.identifier_value
    } else if (criteria.query.identifier_type.value === 'MRN') {
      parameters.registrationNumber = criteria.query.identifier_value
    } else if (criteria.query.identifier_type.value === 'OPENCRVS_RECORD_ID') {
      parameters.recordId = criteria.query.identifier_value
    } else if (criteria.query.identifier_type.value === 'NID') {
      parameters.nationalId = criteria.query.identifier_value
    } else {
      throw new ParseError('Unsupported identifier type')
    }
  } else {
    for (const criterion of criteria.query) {
      if (criteria.reg_event_type.value === Event.Birth) {
        if (criterion.expression1.operator === 'ge') {
          parameters.childDoBStart = formatISO(
            criterion.expression1.attribute_value
          )
        }

        if (criterion.expression1.operator === 'gt') {
          parameters.childDoBStart = formatISO(
            addDays(1)(criterion.expression1.attribute_value)
          )
        }

        if (criterion.expression2.operator === 'le') {
          parameters.childDoBEnd = formatISO(
            criterion.expression2.attribute_value
          )
        }

        if (criterion.expression2.operator === 'lt') {
          parameters.childDoBEnd = formatISO(
            subDays(1)(criterion.expression2.attribute_value)
          )
        }

        if (criterion.expression1.operator === 'eq') {
          parameters.childDoB = formatISO(criterion.expression1.attribute_value)
        }
      } else if (criteria.reg_event_type.value === Event.Death) {
        if (criterion.expression1.operator === 'ge') {
          parameters.deceasedDoBStart = formatISO(
            criterion.expression1.attribute_value
          )
        }

        if (criterion.expression1.operator === 'gt') {
          parameters.deceasedDoBStart = formatISO(
            addDays(1)(criterion.expression1.attribute_value)
          )
        }

        if (criterion.expression2?.operator === 'le') {
          parameters.deceasedDoBEnd = formatISO(
            criterion.expression2.attribute_value
          )
        }

        if (criterion.expression2?.operator === 'lt') {
          parameters.deceasedDoBEnd = formatISO(
            subDays(1)(criterion.expression2.attribute_value)
          )
        }

        if (criterion.expression1.operator === 'eq') {
          parameters.deceasedDoB = formatISO(
            criterion.expression1.attribute_value
          )
        }
      }
    }
  }

  parameters.event = request.search_criteria.reg_event_type?.value

  return { advancedSearchParameters: parameters, sortBy }
}
