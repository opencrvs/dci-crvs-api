import { type SearchEventsQueryVariables, Event } from 'opencrvs-api'
import {
  type SyncSearchRequest,
  type SearchCriteria,
  type IdentifierTypeQuery
} from 'http-api'
import { subDays, formatISOWithOptions, addDays } from 'date-fns/fp'

const formatDate = formatISOWithOptions({ representation: 'date' })

function isIdentifierTypeQuery(
  criteria: SearchCriteria
): criteria is IdentifierTypeQuery {
  return criteria.query_type === 'idtype-value'
}

function parameters(criteria: SearchCriteria) {
  const parameters: SearchEventsQueryVariables['advancedSearchParameters'] = {}

  parameters.event = criteria.reg_event_type?.value

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
    }
  } else {
    for (const criterion of criteria.query) {
      if (criteria.reg_event_type.value === Event.Birth) {
        if (criterion.expression1.operator === 'ge') {
          parameters.childDoBStart = formatDate(
            criterion.expression1.attribute_value
          )
        }

        if (criterion.expression1.operator === 'gt') {
          parameters.childDoBStart = formatDate(
            addDays(1)(criterion.expression1.attribute_value)
          )
        }

        if (criterion.expression2.operator === 'le') {
          parameters.childDoBEnd = formatDate(
            criterion.expression2.attribute_value
          )
        }

        if (criterion.expression2.operator === 'lt') {
          parameters.childDoBEnd = formatDate(
            subDays(1)(criterion.expression2.attribute_value)
          )
        }

        if (criterion.expression1.operator === 'eq') {
          parameters.childDoB = formatDate(
            criterion.expression1.attribute_value
          )
        }
      } else if (criteria.reg_event_type.value === Event.Death) {
        if (criterion.expression1.operator === 'ge') {
          parameters.deceasedDoBStart = formatDate(
            criterion.expression1.attribute_value
          )
        }

        if (criterion.expression1.operator === 'gt') {
          parameters.deceasedDoBStart = formatDate(
            addDays(1)(criterion.expression1.attribute_value)
          )
        }

        if (criterion.expression2?.operator === 'le') {
          parameters.deceasedDoBEnd = formatDate(
            criterion.expression2.attribute_value
          )
        }

        if (criterion.expression2?.operator === 'lt') {
          parameters.deceasedDoBEnd = formatDate(
            subDays(1)(criterion.expression2.attribute_value)
          )
        }

        if (criterion.expression1.operator === 'eq') {
          parameters.deceasedDoB = formatDate(
            criterion.expression1.attribute_value
          )
        }
      }
    }
  }

  return parameters
}

export function searchRequestToAdvancedSearchParameters(
  request: SyncSearchRequest['message']['search_request'][number]
): SearchEventsQueryVariables {
  const criteria = request.search_criteria
  const sort = request.search_criteria.sort
  const sortBy = sort?.map(
    ({ attribute_name: column = '', sort_order: order }) => ({
      column,
      order
    })
  )
  return { advancedSearchParameters: parameters(criteria), sortBy }
}
