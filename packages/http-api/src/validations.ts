import { type TypeOf, z } from 'zod'
import { type components } from './crvs-api'

const dateTime = z.string().datetime({ offset: true })

const paginationRequest = z.object({
  page_size: z.number().positive().int(),
  page_number: z.number().positive().int()
})

const searchSort = z.object({
  attribute_name: z.string(),
  sort_order: z.enum(['asc', 'desc'])
})

const languageCode = z.string().regex(/^[a-z]{3,3}$/)

const version = z.literal('1.0.0').default('1.0.0')

const syncHeader = z.object({
  version,
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
  version,
  message_id: z.string(),
  message_ts: dateTime,
  action: z.literal('search'),
  sender_id: z.string(),
  sender_uri: z.string(),
  receiver_id: z.string().optional(),
  total_count: z.number(),
  is_msg_encrypted: z.boolean().optional().default(false)
})

const regType = z
  .string()
  .describe('Any event type supported by OpenCRVS, e.g. birth, death')
  .default('birth')

const commonSearchCriteria = z.object({
  version,
  reg_type: regType,
  sort: z.array(searchSort).optional(),
  pagination: paginationRequest.optional()
})

const identifierTypeValue = z.object({
  type: z.enum(['UIN', 'BIRTH_REG_NO']),
  value: z.string()
})

const identifierTypeQuery = commonSearchCriteria.and(
  z.object({
    version,
    query_type: z.literal('idtype-value'),
    query: identifierTypeValue
  })
)

const expressionCondition = z.enum(['and'])

const expression = z.enum(['gt', 'lt', 'eq', 'ge', 'le'])

const expressionSupportedFields = z.enum(['birthdate', 'birthplace'])

const expressionPredicate = z.object({
  attribute_name: expressionSupportedFields,
  operator: expression,
  attribute_value: z.string()
})

const predicateQuery = commonSearchCriteria.and(
  z.object({
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
)

const expressionQuery = commonSearchCriteria.and(
  z.object({
    query_type: z.literal('expression'),
    query: z.object({
      type: z.literal('ns:org:QueryType:expression'),
      value: z
        .record(z.string(), z.any())
        .describe(
          'e.g. `{"createdAt":{"type":"range", "gte":"2020-01-01", "lte":"2026-01-10"}}`'
        )
    })
  })
)

const searchCriteria = expressionQuery.or(identifierTypeQuery)

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
}) satisfies z.Schema<components['schemas']['SearchRequest']>

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

const syncSearchRequest = z.object({
  signature: z.string().optional(),
  header: syncHeader,
  message: searchRequestSchema
})

const encryptedSyncSearchRequest = z.object({
  signature: z.string().optional(),
  header: syncHeader,
  message: encryptedMessage
})

const asyncSearchRequest = z.object({
  signature: z.string().optional(),
  header: asyncHeader,
  message: searchRequestSchema
})

const encryptedAsyncSearchRequest = z.object({
  signature: z.string().optional(),
  header: asyncHeader,
  message: encryptedMessage
})

export const maybeEncryptedSyncSearchRequestSchema = syncSearchRequest.or(
  encryptedSyncSearchRequest
)

export const maybeEncryptedAsyncSearchRequestSchema = asyncSearchRequest.or(
  encryptedAsyncSearchRequest
)

export type MaybeEncryptedSyncSearchRequest = TypeOf<
  typeof maybeEncryptedSyncSearchRequestSchema
>
export type MaybeEncryptedAsyncSearchRequest = TypeOf<
  typeof maybeEncryptedAsyncSearchRequestSchema
>
export type SyncSearchRequest = TypeOf<typeof syncSearchRequest>
export type AsyncSearchRequest = TypeOf<typeof asyncSearchRequest>
export type SearchCriteria = TypeOf<typeof searchCriteria>
export type PredicateQuery = TypeOf<typeof predicateQuery>
export type IdentifierTypeQuery = TypeOf<typeof identifierTypeQuery>
export type ExpressionQuery = TypeOf<typeof expressionQuery>
export type EventType = TypeOf<typeof regType>
