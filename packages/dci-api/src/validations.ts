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

const languageCode = z.string().regex(/^[a-z]{3,3}$/)

const version = z.string().default('1.0.0')

const syncHeader = z.object({
  version: version.optional(),
  message_id: z.string(),
  message_ts: dateTime,
  action: z.literal('search'),
  sender_id: z.string(),
  sender_uri: z.string().optional(),
  receiver_id: z.string().optional(),
  total_count: z.number(),
  is_msg_encrypted: z.boolean().optional().default(false)
})

const asyncHeader = z.object({
  version: version.optional(),
  message_id: z.string(),
  message_ts: dateTime,
  action: z.literal('search'),
  sender_id: z.string(),
  sender_uri: z.string(),
  receiver_id: z.string().optional(),
  total_count: z.number(),
  is_msg_encrypted: z.boolean().optional().default(false)
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

const commonSearchCriteria = z.object({
  version: version.optional(),
  reg_type: reference().optional(),
  reg_event_type: reference(eventTypes),
  result_record_type: reference(),
  sort: z.array(searchSort).optional(),
  pagination: paginationRequest.optional(),
  consent: consent.optional(),
  authorize: authorize.optional()
})

const identifier = z.enum(['BRN', 'DRN', 'MRN', 'OPENCRVS_RECORD_ID', 'NID'])

const identifierTypeValue = z.object({
  identifier_type: reference(identifier),
  identifier_value: z.string()
})

const identifierTypeQuery = commonSearchCriteria.and(
  z.object({
    query_type: z.literal('idtype-value'),
    query: identifierTypeValue
  })
)

const expressionCondition = z.enum(['and'])

const expression = z.enum(['gt', 'lt', 'eq', 'ge', 'le'])

const expressionSupportedFields = z.enum(['birthdate'])

const expressionPredicate = z.object({
  attribute_name: expressionSupportedFields,
  operator: expression,
  attribute_value: z.coerce.date()
})

const predicateQuery = commonSearchCriteria.and(
  z.object({
    query_type: z.literal('predicate'),
    query: z.array(
      z.object({
        seq_num: z.number().optional(),
        expression1: expressionPredicate,
        condition: expressionCondition,
        expression2: expressionPredicate
      })
    )
  })
)

const searchCriteria = predicateQuery.or(identifierTypeQuery)

export const searchRequestSchema = z.object({
  transaction_id: z.string().max(99),
  search_request: z.array(
    z.object({
      reference_id: z.string(),
      timestamp: dateTime,
      search_criteria: searchCriteria,
      locale: languageCode.optional().default('eng')
    })
  )
})

const encryptedMessage = z.object({
  header: z.object({
    alg: z.string(),
    enc: z.string(),
    kid: z.string()
  }),
  ciphertext: z.string(),
  encrypted_key: z.string(),
  tag: z.string(),
  iv: z.string()
})

export const syncSearchRequestSchema = z.object({
  signature: z.string().optional(),
  header: syncHeader,
  message: searchRequestSchema
})

export const encryptedSyncSearchRequestSchema = z.object({
  signature: z.string().optional(),
  header: syncHeader,
  message: encryptedMessage
})

export const asyncSearchRequestSchema = z.object({
  signature: z.string().optional(),
  header: asyncHeader,
  message: searchRequestSchema
})

export type SyncSearchRequest = TypeOf<typeof syncSearchRequestSchema>
export type EventType = TypeOf<typeof eventTypes>
export type AsyncSearchRequest = TypeOf<typeof asyncSearchRequestSchema>
export type SearchCriteria = TypeOf<typeof searchCriteria>
export type PredicateQuery = TypeOf<typeof predicateQuery>
export type IdentifierTypeQuery = TypeOf<typeof identifierTypeQuery>
