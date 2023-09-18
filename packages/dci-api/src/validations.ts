import { type TypeOf, z, type ZodType } from 'zod'
import { Event } from 'opencrvs-api'

const dateTime = z.string().datetime({ offset: true })

const paginationRequest = z.object({
  page_size: z.number().positive().int(),
  page_number: z.number().positive().int().optional()
})

const searchSort = z.object({
  attribute_name: z.string().optional(),
  sort_order: z.enum(['asc', 'desc'])
})

const consent = z.object({
  id: z.string().optional(),
  ts: dateTime.optional(),
  purpose: z
    .object({
      text: z.string().optional(),
      code: z.string().optional(),
      refUri: z.string().optional()
    })
    .optional()
})

const authorize = z.object({
  id: z.string().optional(),
  ts: dateTime.optional(),
  purpose: z
    .object({
      text: z.string().optional(),
      code: z.string().optional(),
      refUri: z.string().optional()
    })
    .optional()
})

const languageCode = z.string()

const version = z.string().optional().default('1.0.0')

const header = z.object({
  version,
  message_id: z.string(),
  message_ts: dateTime,
  action: z.string(),
  sender_id: z.string(),
  sender_uri: z.string().optional(),
  receiver_id: z.string().optional(),
  total_count: z.number(),
  is_msg_encrypted: z.boolean().optional()
})

/**
 * https://digital-convergence-initiative-d.gitbook.io/dci-standards-1/standards/1.-crvs/6.5-data-standards/6.5.2-code-directory#cd.04-vital_events
 * OpenCRVS only supports [1 = Live Birth] [2 = Death] [4 = Marriage]
 */
const eventTypes = z.enum(['1', '2', '4']).transform((number) => {
  switch (number) {
    case '1':
      return Event.Birth
    case '2':
      return Event.Death
    case '4':
      return Event.Marriage
  }
})

const reference = (value: ZodType = z.string()) =>
  z.object({
    namespace: z.string().optional(),
    refUri: z.string().optional(),
    value
  })

const attributeValue = z.string().or(z.number()).or(z.boolean())

const identifierTypeValue = z.object({
  identifier_type: reference(),
  identifier_value: attributeValue
})

const identifierTypeQuery = z.object({
  query_type: z.literal('idtype-value'),
  query: identifierTypeValue
})

const expressionCondition = z.enum(['and', 'or', 'not'])

const expressionOperator = z.enum(['gt', 'lt', 'eq', 'ge', 'le', 'in'])

const expressionPredicate = z.object({
  attribute_name: z.string(),
  operator: expressionOperator,
  attribute_value: attributeValue
})

const predicateQuery = z.object({
  query_type: z.literal('predicate'),
  query: z.array(
    z.object({
      seq_num: z.number().optional(),
      expression1: expressionPredicate,
      condition: expressionCondition.optional(),
      expression2: expressionPredicate.optional()
    })
  )
})

const searchRequest = z.object({
  transaction_id: z.string(),
  search_request: z.array(
    z.object({
      reference_id: z.string(),
      timestamp: dateTime,
      search_criteria: z
        .object({
          version,
          reg_type: reference().optional(),
          reg_event_type: reference(eventTypes),
          result_record_type: reference(),
          sort: z.array(searchSort).optional(),
          pagination: paginationRequest.optional(),
          consent: consent.optional(),
          authorize: authorize.optional()
        })
        .and(predicateQuery.or(identifierTypeQuery)),
      locale: languageCode.optional().default('eng')
    })
  )
})

export const requestSchema = z.object({
  signature: z.string().optional(),
  header,
  action: z.enum(['search']).optional(),
  message: searchRequest
})

export type SyncSearchRequest = TypeOf<typeof requestSchema>
export type EventType = TypeOf<typeof eventTypes>
