import { type TypeOf, z } from 'zod'

const dateTime = z.date()

const paginationRequest = z.object({
  page_size: z.number(),
  page_number: z.number().optional()
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

const reference = z.object({
  namespace: z.string().optional(),
  refUri: z.string().optional(),
  value: z.string()
})

const attributeValue = z.string().or(z.number()).or(z.boolean())

const identifierTypeValue = z.object({
  identifier_type: reference,
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
          reg_type: reference.optional(),
          reg_event_type: reference.optional(),
          result_record_type: reference,
          sort: z.array(searchSort).optional(),
          pagination: paginationRequest.optional(),
          consent: consent.optional(),
          authorize: authorize.optional()
        })
        .and(predicateQuery.or(identifierTypeQuery)),
      locale: languageCode.optional()
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
