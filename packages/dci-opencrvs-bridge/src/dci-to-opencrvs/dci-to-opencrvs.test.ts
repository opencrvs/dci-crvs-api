import { describe, it } from 'node:test'
import { searchRequestToAdvancedSearchParameters } from './dci-to-opencrvs'
import assert from 'node:assert'

describe('DCI standard to OpenCRVS', () => {
  // `gt` = > now + 1 day
  // `ge` = > now
  // etc.
  it('converts gt and lt properly', () => {
    const parameters = searchRequestToAdvancedSearchParameters({
      reference_id: '123456789020211216223812',
      timestamp: '2022-12-04T17:20:07-04:00',
      search_criteria: {
        reg_event_type: { namespace: '?', value: 'birth' },
        result_record_type: { value: 'person' },
        sort: [{ attribute_name: 'dateOfDeclaration', sort_order: 'asc' }],
        pagination: { page_size: 5, page_number: 1 },
        query_type: 'predicate',
        query: [
          {
            expression1: {
              attribute_name: 'birthdate',
              operator: 'gt',
              attribute_value: new Date('2010-05-04T00:00:00.000Z')
            },
            condition: 'and',
            expression2: {
              attribute_name: 'birthdate',
              operator: 'lt',
              attribute_value: new Date('2022-05-04T00:00:00.000Z')
            }
          }
        ]
      },
      locale: 'eng'
    })

    assert.strictEqual(
      parameters.advancedSearchParameters.childDoBStart,
      '2010-05-05'
    )
    assert.strictEqual(
      parameters.advancedSearchParameters.childDoBEnd,
      '2022-05-03'
    )
  })

  it('converts ge and le properly', () => {
    const parameters = searchRequestToAdvancedSearchParameters({
      reference_id: '123456789020211216223812',
      timestamp: '2022-12-04T17:20:07-04:00',
      search_criteria: {
        reg_event_type: { namespace: '?', value: 'birth' },
        result_record_type: { value: 'person' },
        sort: [{ attribute_name: 'dateOfDeclaration', sort_order: 'asc' }],
        pagination: { page_size: 5, page_number: 1 },
        query_type: 'predicate',
        query: [
          {
            expression1: {
              attribute_name: 'birthdate',
              operator: 'ge',
              attribute_value: new Date('2010-05-04')
            },
            condition: 'and',
            expression2: {
              attribute_name: 'birthdate',
              operator: 'le',
              attribute_value: new Date('2022-05-04')
            }
          }
        ]
      },
      locale: 'eng'
    })

    assert.strictEqual(
      parameters.advancedSearchParameters.childDoBStart,
      '2010-05-04'
    )
    assert.strictEqual(
      parameters.advancedSearchParameters.childDoBEnd,
      '2022-05-04'
    )
  })
})
