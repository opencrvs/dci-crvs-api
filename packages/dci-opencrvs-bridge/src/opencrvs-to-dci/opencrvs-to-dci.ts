import {
  type Registration,
  type BirthRegistration,
  type DeathRegistration,
  type MarriageRegistration,
  type IdentityType,
  type Location,
  Event
} from 'opencrvs-api'
import type { operations, components, SyncSearchRequest } from 'http-api'
import type { SearchResponseWithMetadata } from '../types'
import { ParseError } from '../error'
import { compact, isNil } from 'lodash/fp'
import { randomUUID } from 'node:crypto'
import * as spdci from './json-ld'

const name = ({
  firstNames,
  familyName
}: {
  firstNames: string | null // The names cannot be undefined, but they should be able to be null, to mark as it being intentionally empty
  familyName: string | null // ^
}) => ({
  given_name: firstNames?.split(' ')[0] ?? null,
  middle_name: firstNames?.split(' ')[1] ?? null,
  family_name: familyName
})

const sex = (value: string) => {
  switch (value) {
    case 'male':
      return 'male'
    case 'female':
      return 'female'
    case 'other':
      return 'other'
    default:
      return 'unknown'
  }
}

const identifier = ({ id: value, type }: IdentityType) => {
  switch (type) {
    case 'DEATH_REGISTRATION_NUMBER':
      return { type: 'DRN', value }
    case 'BIRTH_REGISTRATION_NUMBER':
      return { type: 'BRN', value }
    case 'MARRIAGE_REGISTRATION_NUMBER':
      return { type: 'MRN', value }
    case 'NATIONAL_ID':
      return { type: 'NID', value }
    default:
      throw new ParseError('Unimplemented identifier type')
  }
}

function locationToSpdciPlace(location: Location) {
  if (location.type === 'PRIVATE_HOME') {
    return spdci.place({
      address: `${location.address?.line?.[1]} ${location.address?.line?.[0]}
${location.address?.line?.[2]}
${location.address?.postalCode}
${location.address?.city}`,
      containedInPlace: `ocrvs:${location.address?.district}`
    })
  }

  return spdci.place({
    identifier: `ocrvs:${location.id}`,
    containedInPlace: `ocrvs:${
      location.partOf?.split('/')[1] ?? location.address?.state
    }`
  })
}

function birthPersonRecord(registration: BirthRegistration) {
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const motherIdentifier = !isNil(registration.mother?.identifier?.[0]?.id)
    ? {
        identifier_type: registration.mother!.identifier![0]!.type! as 'UIN',
        identifier: registration.mother!.identifier![0]!.id
      }
    : undefined

  const fatherIdentifier = !isNil(registration.father?.identifier?.[0]?.id)
    ? {
        identifier_type: registration.father!.identifier![0]!.type! as 'UIN',
        identifier: registration.father!.identifier![0]!.id
      }
    : undefined
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  return {
    identifier: compact(
      registration.child.identifier?.map((identity) =>
        identity !== null ? identifier(identity) : null
      )
    ),
    birthDate: registration.child.birthDate,
    ...name({
      firstNames: registration.child.name[0].firstNames,
      familyName: registration.child.name[0].familyName
    }),
    sex: sex(registration.child.gender),
    parent1_identifier: motherIdentifier,
    parent2_identifier: fatherIdentifier,
    birthPlace: locationToSpdciPlace(registration.eventLocation)
  }
}

function deathPersonRecord(registration: DeathRegistration) {
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const motherIdentifier = !isNil(registration.mother?.identifier?.[0]?.id)
    ? {
        identifier_type: registration.mother!.identifier![0]!.type! as 'UIN',
        identifier: registration.mother!.identifier![0]!.id
      }
    : undefined

  const fatherIdentifier = !isNil(registration.father?.identifier?.[0]?.id)
    ? {
        identifier_type: registration.father!.identifier![0]!.type! as 'UIN',
        identifier: registration.father!.identifier![0]!.id
      }
    : undefined
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  return {
    identifier: compact(
      registration.deceased.identifier?.map((identity) =>
        identity !== null ? identifier(identity) : null
      )
    ),
    birthdate: registration.deceased?.birthDate ?? undefined,
    deathdate: registration.deceased?.deceased?.deathDate ?? undefined,
    ...name({
      firstNames: registration.deceased.name[0].firstNames,
      familyName: registration.deceased.name[0].familyName
    }),
    sex: sex(registration.deceased.gender),
    parent1_identifier: motherIdentifier,
    parent2_identifier: fatherIdentifier,
    deathPlace: locationToSpdciPlace(registration.eventLocation)
  }
}

function marriagePersonRecord(registration: MarriageRegistration) {
  return {
    identifier: compact(
      registration.bride?.identifier?.map((identity) =>
        identity !== null ? identifier(identity) : null
      )
    ),
    ...name({
      firstNames: registration.bride.name[0].firstNames,
      familyName: registration.bride.name[0].familyName
    }),
    marriagedate: registration.bride?.dateOfMarriage,
    related_persons: [
      {
        identifier: compact(
          registration.groom?.identifier?.map((identity) =>
            identity !== null ? identifier(identity) : null
          )
        ),
        ...name({
          firstNames: registration.groom.name[0].firstNames,
          familyName: registration.groom.name[0].familyName
        })
      }
    ],
    marriagePlace: locationToSpdciPlace(registration.eventLocation)
  }
}

function eventType(event: Event) {
  switch (event) {
    case Event.Birth:
      return 'live_birth'
    case Event.Death:
      return 'death'
    case Event.Marriage:
      return 'marriage'
  }
}

function isBirthEventSearchSet(
  registration: BirthRegistration | DeathRegistration | MarriageRegistration
): registration is BirthRegistration {
  return registration.__typename === 'BirthRegistration'
}

function isMarriageEventSearchSet(
  registration: BirthRegistration | DeathRegistration | MarriageRegistration
): registration is MarriageRegistration {
  return registration.__typename === 'MarriageRegistration'
}

export function searchResponseBuilder(
  registrations: Registration[],
  {
    referenceId,
    timestamp,
    pageSize,
    pageNumber = 1,
    locale,
    event
  }: {
    referenceId: string
    timestamp: components['schemas']['DateTime']
    pageSize?: number
    pageNumber?: number
    locale: string
    event: Event
  }
): components['schemas']['SearchResponse']['search_response'][number] {
  pageSize ??= registrations.length // Return all records in one page if page size isn't defined

  const paginatedRegistrations = registrations.slice(
    (pageNumber - 1) * pageSize,
    pageNumber * pageSize
  )

  return {
    reference_id: referenceId,
    timestamp,
    status: 'succ',
    data: {
      reg_record_type: 'person',
      reg_event_type: eventType(event),
      reg_records: paginatedRegistrations.map((registration) =>
        isBirthEventSearchSet(registration)
          ? birthPersonRecord(registration)
          : isMarriageEventSearchSet(registration)
          ? marriagePersonRecord(registration)
          : deathPersonRecord(registration)
      )
    },
    pagination: {
      page_number: pageNumber,
      page_size: pageSize,
      total_count: registrations.length
    },
    // TODO: Handle locale, return a localized response? Currently this is just being passed directly from the request
    locale
  }
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
      receiver_id: request.header.receiver_id
    },
    message: {
      transaction_id: request.message.transaction_id,
      correlation_id: correlationId ?? randomUUID(),
      search_response: responses.flatMap(
        ({ registrations, originalRequest, responseFinishedTimestamp }) =>
          registrations.length > 0
            ? searchResponseBuilder(registrations, {
                referenceId: originalRequest.reference_id,
                timestamp: responseFinishedTimestamp.toISOString(),
                pageSize: originalRequest.search_criteria.pagination?.page_size,
                pageNumber:
                  originalRequest.search_criteria.pagination?.page_number,
                locale: originalRequest.locale,
                event: originalRequest.search_criteria.reg_event_type.value
              })
            : []
      )
    }
  } satisfies operations['post_reg_sync_search']['responses']['default']['content']['application/json']
}
