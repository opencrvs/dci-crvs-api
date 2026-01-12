import { type ExpressionQuery, type SearchCriteria } from 'http-api'
import { type SearchQuery } from '@opencrvs/toolkit/events'

function isExpressionQuery(
  criteria: SearchCriteria
): criteria is ExpressionQuery {
  return criteria.query_type === 'expression'
}

export function buildSearchParameters(
  criteria: SearchCriteria,
  { pageSize, pageNumber }: { pageSize: number; pageNumber: number }
): SearchQuery {
  const parameters = {
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    query: {} as any // @TODO
  } satisfies SearchQuery

  if (isExpressionQuery(criteria)) {
    parameters.query = {
      type: 'and',
      clauses: [
        {
          eventType: {
            'ocrvs:registry_type:birth': 'birth',
            'ocrvs:registry_type:death': 'death'
          }[criteria.reg_type],

          ...JSON.parse(criteria.query.value)
        }
      ]
    }
  }

  return parameters
}
