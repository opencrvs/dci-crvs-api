import type {
  operations,
  components,
  SyncSearchRequest,
  RegistryType
} from 'http-api'
import type { SearchResponseWithMetadata } from '../types'
import { randomUUID } from 'node:crypto'
import * as spdci from './json-ld'
import { EventIndex, NameFieldValue } from '@opencrvs/toolkit/events'

const context = {
  '@vocab': 'https://schema.spdci.org/common/v1',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  schema: 'http://schema.org/',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#'
}

function birthPersonRecord(event: EventIndex) {
  const childName = event.declaration['child.name'] as NameFieldValue
  const childNid = event.declaration['child.nid'] as string | undefined
  const motherNid = event.declaration['mother.nid'] as string | undefined
  const fatherNid = event.declaration['father.nid'] as string | undefined
  const registrationNumber = (event as any).legalStatuses?.REGISTERED
    ?.registrationNumber as string | undefined

  const identifiers = [
    ...(childNid ? [spdci.identifier({ type: 'NID', value: childNid })] : []),
    ...(registrationNumber
      ? [spdci.identifier({ type: 'BRN', value: registrationNumber })]
      : [])
  ]

  return {
    '@context': context,
    '@type': 'CRVS_Person',
    '@id': `urn:uuid:${event.id}`,

    ...(identifiers.length > 0 && {
      identifiers
    }),

    name: spdci.name(childName),
    sex: event.declaration['child.gender'],
    birth_date: event.dateOfEvent,
    birth_place: (event as any).placeOfEvent, // @FIXME: placeOfEvent is not yet typed in EventIndex

    ...(motherNid && {
      parent1_identifier: spdci.identifier({ type: 'NID', value: motherNid })
    }),

    ...(fatherNid && {
      parent2_identifier: spdci.identifier({ type: 'NID', value: fatherNid })
    })
  }
}

function deathPersonRecord(event: EventIndex) {
  const deceasedName = event.declaration['deceased.name'] as NameFieldValue
  const deceasedNid = event.declaration['deceased.nid'] as string | undefined
  const registrationNumber = (event as any).legalStatuses?.REGISTERED
    ?.registrationNumber as string | undefined

  const identifiers = [
    ...(deceasedNid
      ? [spdci.identifier({ type: 'NID', value: deceasedNid })]
      : []),
    ...(registrationNumber
      ? [spdci.identifier({ type: 'DRN', value: registrationNumber })]
      : [])
  ]

  return {
    '@context': context,
    '@type': 'CRVS_Person',
    '@id': `urn:uuid:${event.id}`,

    ...(identifiers.length > 0 && {
      identifiers
    }),

    name: spdci.name(deceasedName),
    sex: event.declaration['deceased.gender'],
    death_place: (event as any).placeOfEvent // @FIXME: placeOfEvent is not yet typed in EventIndex
  }
}

export function searchResponseBuilder(
  registrations: EventIndex[],
  {
    referenceId,
    timestamp,
    pageSize,
    pageNumber,
    totalCount,
    locale,
    event
  }: {
    referenceId: string
    timestamp: string
    pageSize: number
    pageNumber: number
    totalCount: number
    locale: string
    event: RegistryType
  }
) {
  return {
    reference_id: referenceId,
    timestamp,
    status: 'succ',
    data: {
      version: '1.0.0',
      reg_record_type: 'person',
      reg_type: event,
      reg_records: registrations.map((event) =>
        event.type === 'birth'
          ? birthPersonRecord(event)
          : deathPersonRecord(event)
      ) as any // OpenAPI type is Record<string, never>[] because of limitation in JSON-LD
    },
    pagination: {
      page_number: pageNumber,
      page_size: pageSize,
      total_count: totalCount
    },
    // TODO: Handle locale, return a localized response? Currently this is just being passed directly from the request
    locale
  } satisfies components['schemas']['SearchResponse']['search_response'][number]
}

export function registrySyncSearchBuilder(
  responses: SearchResponseWithMetadata[],
  request: SyncSearchRequest,
  correlationId?: ReturnType<typeof randomUUID>
) {
  const totalCount = responses
    .map(({ registrations }) => registrations.length ?? 0)
    .reduce((a, b) => a + b, 0)

  return {
    header: {
      version: '1.0.0',
      message_id: request.header.message_id,
      message_ts: new Date().toISOString(),
      action: 'on-search',
      status: 'succ',
      total_count: totalCount,
      sender_id: request.header.sender_id,
      receiver_id: request.header.receiver_id,
      is_msg_encrypted: false // @TODO
    },
    message: {
      transaction_id: request.message.transaction_id,
      correlation_id: correlationId ?? randomUUID(),
      search_response: responses.map(
        ({
          registrations,
          originalRequest,
          responseFinishedTimestamp,
          pageSize,
          pageNumber,
          totalItems
        }) =>
          searchResponseBuilder(registrations, {
            referenceId: originalRequest.reference_id,
            timestamp: responseFinishedTimestamp.toISOString(),
            pageSize,
            pageNumber,
            totalCount: totalItems,
            locale: originalRequest.locale,
            event: originalRequest.search_criteria.reg_type
          })
      )
    }
  } satisfies operations['post_reg_sync_search']['responses']['default']['content']['application/json']
}
