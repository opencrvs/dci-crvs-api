import { type SearchEventsQueryVariables, Event } from 'opencrvs-api'
import {
  type SyncSearchRequest,
  type SearchCriteria,
  type IdentifierTypeQuery
} from 'http-api'
import { subDays, formatISOWithOptions, addDays, parseISO } from 'date-fns/fp'

const formatDate = formatISOWithOptions({ representation: 'date' })

function isIdentifierTypeQuery(
  criteria: SearchCriteria
): criteria is IdentifierTypeQuery {
  return criteria.query_type === 'idtype'
}

function parameters(criteria: SearchCriteria) {
  const parameters: SearchEventsQueryVariables['advancedSearchParameters'] = {}

  parameters.event = {
    'ocrvs:registry_type:birth': Event.Birth,
    'ocrvs:registry_type:death': Event.Death,
    'ocrvs:registry_type:marriage': Event.Marriage
  }[criteria.reg_type]

  if (isIdentifierTypeQuery(criteria)) {
    if (criteria.query.type === 'BRN') {
      parameters.registrationNumber = criteria.query.value
    } else if (criteria.query.type === 'DRN') {
      parameters.registrationNumber = criteria.query.value
    } else if (criteria.query.type === 'MRN') {
      parameters.registrationNumber = criteria.query.value
    } else if (criteria.query.type === 'OPENCRVS_RECORD_ID') {
      parameters.recordId = criteria.query.value
    } else if (criteria.query.type === 'NID') {
      parameters.nationalId = criteria.query.value
    }
  } else {
    for (const criterion of criteria.query) {
      if (criteria.reg_type === 'ocrvs:registry_type:birth') {
        if (
          criterion.expression1.attribute_name === 'birthdate' &&
          criterion.expression2 !== undefined
        ) {
          if (criterion.expression1.operator === 'ge') {
            parameters.childDoBStart = formatDate(
              parseISO(criterion.expression1.attribute_value)
            )
          }

          if (criterion.expression1.operator === 'gt') {
            parameters.childDoBStart = formatDate(
              addDays(1)(parseISO(criterion.expression1.attribute_value))
            )
          }

          if (criterion.expression2.operator === 'le') {
            parameters.childDoBEnd = formatDate(
              parseISO(criterion.expression2.attribute_value)
            )
          }

          if (criterion.expression2.operator === 'lt') {
            parameters.childDoBEnd = formatDate(
              subDays(1)(parseISO(criterion.expression2.attribute_value))
            )
          }

          if (criterion.expression1.operator === 'eq') {
            parameters.childDoB = formatDate(
              parseISO(criterion.expression1.attribute_value)
            )
          }
        } else if (criterion.expression1.attribute_name === 'birthplace') {
          parameters.declarationJurisdictionId =
            criterion.expression1.attribute_value
        }
      } else if (criteria.reg_type === 'ocrvs:registry_type:death') {
        if (criterion.expression1.attribute_name === 'birthdate') {
          if (criterion.expression1.operator === 'ge') {
            parameters.deceasedDoBStart = formatDate(
              parseISO(criterion.expression1.attribute_value)
            )
          }

          if (criterion.expression1.operator === 'gt') {
            parameters.deceasedDoBStart = formatDate(
              addDays(1)(parseISO(criterion.expression1.attribute_value))
            )
          }

          if (criterion.expression2?.operator === 'le') {
            parameters.deceasedDoBEnd = formatDate(
              parseISO(criterion.expression2.attribute_value)
            )
          }

          if (criterion.expression2?.operator === 'lt') {
            parameters.deceasedDoBEnd = formatDate(
              subDays(1)(parseISO(criterion.expression2.attribute_value))
            )
          }

          if (criterion.expression1.operator === 'eq') {
            parameters.deceasedDoB = formatDate(
              parseISO(criterion.expression1.attribute_value)
            )
          }
        } else if (criterion.expression1.attribute_name === 'birthplace') {
          parameters.declarationJurisdictionId =
            criterion.expression1.attribute_value
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
