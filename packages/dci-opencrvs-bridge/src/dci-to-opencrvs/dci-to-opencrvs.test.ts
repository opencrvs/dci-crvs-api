import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'
import { buildSearchParameters } from './dci-to-opencrvs'

describe('buildSearchParameters', () => {
  const pageSize = 20
  const pageNumber = 1

  test('expression query', () => {
    const criteria = {
      version: '1.0.0' as const,
      reg_type: 'ns:org:RegistryType:Civil',
      reg_event_type: 'birth',
      query_type: 'expression' as const,
      query: {
        type: 'ns:org:QueryType:expression' as const,
        value: {
          createdAt: {
            type: 'range',
            gte: '2025-01-01',
            lte: '2025-12-31'
          }
        }
      }
    }

    const result = buildSearchParameters(criteria, { pageSize, pageNumber })

    assert.equal(result.limit, 20)
    assert.equal(result.offset, 0)
    assert.equal(result.query.type, 'and')
    assert.equal(result.query.clauses[0].eventType, 'birth')
    assert.equal(result.query.clauses[0].createdAt.type, 'range')
  })

  test('BRN idtype-value query', () => {
    const criteria = {
      version: '1.0.0' as const,
      reg_type: 'ns:org:RegistryType:Civil',
      reg_event_type: 'birth',
      query_type: 'idtype-value' as const,
      query: {
        type: 'BRN' as const,
        value: '12345'
      }
    }

    const result = buildSearchParameters(criteria, { pageSize, pageNumber })

    assert.equal(result.query.type, 'and')
    assert.deepEqual(
      result.query.clauses[0]['legalStatuses.REGISTERED.registrationNumber'],
      {
        type: 'exact',
        term: '12345'
      }
    )
  })

  test('UIN idtype-value query for birth', () => {
    const criteria = {
      version: '1.0.0' as const,
      reg_type: 'ns:org:RegistryType:Civil',
      reg_event_type: 'birth',
      query_type: 'idtype-value' as const,
      query: {
        type: 'UIN' as const,
        value: '67890'
      }
    }

    const result = buildSearchParameters(criteria, { pageSize, pageNumber })

    assert.deepEqual(result.query.clauses[0]['child.nid'], {
      type: 'anyOf',
      terms: ['67890']
    })
  })

  test('UIN idtype-value query for death', () => {
    const criteria = {
      version: '1.0.0' as const,
      reg_type: 'ns:org:RegistryType:Civil',
      reg_event_type: 'death',
      query_type: 'idtype-value' as const,
      query: {
        type: 'UIN' as const,
        value: '11111'
      }
    }

    const result = buildSearchParameters(criteria, { pageSize, pageNumber })

    assert.deepEqual(result.query.clauses[0]['deceased.nid'], {
      type: 'anyOf',
      terms: ['11111']
    })
  })
})
