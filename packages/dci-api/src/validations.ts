import { z } from 'zod'

const dateTimeSchema = z.date()

// TODO
const recordTypeSchema = z.enum(['Person'])

const paginationRequestSchema = z.object({
  page_size: z.number(),
  page_number: z.number().optional()
})

const searchSortSchema = z.object({
  attribute_name: z.string().optional(),
  sort_order: z.enum(['asc', 'desc'])
})

const consentSchema = z.object({
  id: z.string().optional(),
  ts: dateTimeSchema.optional(),
  purpose: z
    .object({
      text: z.string().optional(),
      code: z.string().optional(),
      refUri: z.string().optional()
    })
    .optional()
})

const authorizeSchema = z.object({
  id: z.string().optional(),
  ts: dateTimeSchema.optional(),
  purpose: z
    .object({
      text: z.string().optional(),
      code: z.string().optional(),
      refUri: z.string().optional()
    })
    .optional()
})

const languageCodeSchema = z.string()

const versionSchema = z.string().optional().default('1.0.0')

const headerSchema = z.object({
  version: versionSchema,
  message_id: z.string(),
  message_ts: dateTimeSchema,
  action: z.string(),
  sender_id: z.string(),
  sender_uri: z.string().optional(),
  receiver_id: z.string().optional(),
  total_count: z.number(),
  is_msg_encrypted: z.boolean().optional()
})

const referenceSchema = z.object({
  namespace: z.string().optional(),
  refUri: z.string().optional(),
  value: z.string()
})

const attributeValueSchema = z.string().or(z.number()).or(z.boolean())

const identifierTypeValueSchema = z.object({
  identifier_type: referenceSchema,
  identifier_value: attributeValueSchema
})

const identifierTypeQuerySchema = z.object({
  query_type: z.literal('idtype-value'),
  query: identifierTypeValueSchema
})

const expressionConditionSchema = z.enum(['and', 'or', 'not'])

const expressionOperatorSchema = z.enum(['gt', 'lt', 'eq', 'ge', 'le', 'in'])

const expressionPredicateSchema = z.object({
  attribute_name: z.string(),
  operator: expressionOperatorSchema,
  attribute_value: attributeValueSchema
})

const predicateQuerySchema = z.object({
  query_type: z.literal('predicate'),
  query: z.array(
    z.object({
      seq_num: z.number().optional(),
      expression1: expressionPredicateSchema,
      condition: expressionConditionSchema.optional(),
      expression2: expressionPredicateSchema.optional()
    })
  )
})

const searchRequestSchema = z.object({
  transaction_id: z.string(),
  search_request: z.array(
    z.object({
      reference_id: z.string(),
      timestamp: dateTimeSchema,
      search_criteria: z
        .object({
          version: versionSchema,
          reg_type: referenceSchema.optional(),
          reg_event_type: referenceSchema.optional(),
          record_type: recordTypeSchema,
          sort: z.array(searchSortSchema).optional(),
          pagination: paginationRequestSchema.optional(),
          consent: consentSchema.optional(),
          authorize: authorizeSchema.optional()
        })
        .and(predicateQuerySchema.or(identifierTypeQuerySchema)),
      locale: languageCodeSchema.optional()
    })
  )
})

export const requestSchema = z.object({
  signature: z.string().optional(),
  header: headerSchema,
  action: z.enum(['search']).optional(),
  message: searchRequestSchema
})
