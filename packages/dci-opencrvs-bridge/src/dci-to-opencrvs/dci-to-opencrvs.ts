import {
  type ExpressionQuery,
  type SearchCriteria,
  type IdentifierTypeQuery,
  type PredicateQuery
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
  return criteria.query_type === 'idtype-value' && criteria.query.type === 'UIN'
}

function isRegistrationNumberQuery(
  criteria: SearchCriteria
): criteria is IdentifierTypeQuery {
  return (
    criteria.query_type === 'idtype-value' &&
    (criteria.query.type === 'BRN' || criteria.query.type === 'DRN')
  )
}

function isPredicateQuery(
  criteria: SearchCriteria
): criteria is PredicateQuery {
  return criteria.query_type === 'predicate'
}

function mapPredicateExpression(expr: {
  attribute_name: string
  operator: string
  attribute_value: string
}) {
  const field = expr.attribute_name
  const value = expr.attribute_value
  switch (expr.operator) {
    case 'eq':
      return { [field]: { type: 'exact', term: value } }
    case 'ge':
      return { [field]: { type: 'range', gte: value } }
    case 'le':
      return { [field]: { type: 'range', lte: value } }
    case 'gt':
      return { [field]: { type: 'range', gt: value } }
    case 'lt':
      return { [field]: { type: 'range', lt: value } }
    case 'in':
      return { [field]: { type: 'anyOf', terms: value.split(',') } } // Assume comma-separated values
    default:
      throw new Error(`Unsupported predicate operator: ${expr.operator}`)
  }
}

export function buildSearchParameters(
  criteria: SearchCriteria,
  { pageSize, pageNumber }: { pageSize: number; pageNumber: number }
): SearchQuery {
  const parameters = {
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    query: {},
    sort: criteria.sort?.map((sortItem) => ({
      field: sortItem.attribute_name,
      direction: sortItem.sort_order
    }))
  } satisfies SearchQuery

  if (isExpressionQuery(criteria)) {
    parameters.query = {
      type: 'and',
      clauses: [
        {
          eventType: criteria.reg_event_type,
          status: { type: 'exact', term: 'REGISTERED' },
          ...criteria.query.value.expression.query
        }
      ]
    }
  }

  if (isRegistrationNumberQuery(criteria)) {
    parameters.query = {
      type: 'and',
      clauses: [
        {
          eventType: criteria.reg_event_type,
          status: { type: 'exact', term: 'REGISTERED' },
          'legalStatuses.REGISTERED.registrationNumber': {
            type: 'exact',
            term: criteria.query.value
          }
        }
      ]
    }
  }

  if (isNationalIdQuery(criteria)) {
    const nidField =
      criteria.reg_event_type === 'birth' ? 'child.nid' : 'deceased.nid'
    parameters.query = {
      type: 'and',
      clauses: [
        {
          eventType: criteria.reg_event_type,
          status: { type: 'exact', term: 'REGISTERED' },
          data: {
            [nidField]: {
              type: 'exact',
              term: criteria.query.value
            }
          }
        }
      ]
    }
  }

  if (isPredicateQuery(criteria)) {
    const clauses: Array<Record<string, any>> = []
    for (const item of criteria.query) {
      clauses.push(mapPredicateExpression(item.expression1))
      if (item.expression2 !== undefined) {
        clauses.push(mapPredicateExpression(item.expression2))
      }
    }
    parameters.query = {
      type: 'and',
      clauses: [
        {
          eventType: criteria.reg_event_type,
          status: 'REGISTERED',
          ...Object.assign({}, ...clauses)
        }
      ]
    }
  }

  return parameters
}
