import {
  type ExpressionQuery,
  type SearchCriteria,
  type IdentifierTypeQuery
} from 'http-api'
import { type SearchQuery } from '@opencrvs/toolkit/events'

function isExpressionQuery(
  criteria: SearchCriteria
): criteria is ExpressionQuery {
  return criteria.query_type === 'expression'
}

function isNationalIdQuery(
  criteria: SearchCriteria
): criteria is IdentifierTypeQuery {
  return (
    criteria.query_type === 'idtype-value' && criteria.query.value === 'NID'
  )
}

function isRegistrationNumberQuery(
  criteria: SearchCriteria
): criteria is IdentifierTypeQuery {
  return (
    criteria.query_type === 'idtype-value' &&
    criteria.query.value === 'BIRTH_REG_NO'
  )
}

export function buildSearchParameters(
  criteria: SearchCriteria,
  { pageSize, pageNumber }: { pageSize: number; pageNumber: number }
): SearchQuery {
  const parameters = {
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    query: {}
  } satisfies SearchQuery

  if (isExpressionQuery(criteria)) {
    parameters.query = {
      type: 'and',
      clauses: [
        {
          eventType: criteria.reg_type,
          ...criteria.query.value
        }
      ]
    }
  }

  if (isRegistrationNumberQuery(criteria)) {
    parameters.query = {
      type: 'and',
      clauses: [
        {
          eventType: criteria.reg_type,
          'legalStatuses.REGISTERED.registrationNumber': {
            type: 'exact',
            term: criteria.query.value
          }
        }
      ]
    }
  }

  if (isNationalIdQuery(criteria)) {
    parameters.query = {
      type: 'and',
      clauses: [
        {
          eventType: criteria.reg_type,

          /** @warn The field which is NID can change between implementations. This is the one OpenCRVS-MOSIP integration uses at https://github.com/opencrvs/mosip/blob/v1.9.1/packages/mosip-api/src/opencrvs-api.ts#L52 */
          'child.nid': {
            type: 'exact',
            term: criteria.query.value
          }
        }
      ]
    }
  }

  return parameters
}
