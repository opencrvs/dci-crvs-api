import {
  type Registration,
  type BirthRegistration,
  type DeathRegistration,
  type MarriageRegistration,
  type IdentityType,
  type Location
} from 'opencrvs-api'
import type {
  operations,
  components,
  SyncSearchRequest,
  EventType
} from 'http-api'
import type { SearchResponseWithMetadata } from '../types'
import { compact } from 'lodash/fp'
import { randomUUID } from 'node:crypto'
import * as spdci from './json-ld'

const name = ({
  firstNames,
  familyName
}: {
  firstNames: string | null // The names cannot be undefined, but they should be able to be null, to mark as it being intentionally empty
  familyName: string | null // ^
}) => ({
  givenName: firstNames,
  familyName
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

const identifier = ({ id, type }: IdentityType) => {
  if (id === undefined || id === null) return null

  switch (type) {
    case 'DEATH_REGISTRATION_NUMBER':
      return { name: 'DRN', identifier: id }
    case 'BIRTH_REGISTRATION_NUMBER':
      return { name: 'BRN', identifier: id }
    case 'MARRIAGE_REGISTRATION_NUMBER':
      return { name: 'MRN', identifier: id }
    case 'NATIONAL_ID':
      return { name: 'NID', identifier: id }
  }

  // Unidentified identifier type
  return null
}

function locationToSpdciPlace(location: Location) {
  if (location.type === 'PRIVATE_HOME') {
    return spdci.place({
      address: `${location.address?.line?.[1]} ${location.address?.line?.[0]}
${location.address?.line?.[2]}
${location.address?.postalCode}
${location.address?.city}`,
      containedInPlace: location.address?.district,
      additionalType: location.type ?? undefined
    })
  }

  return spdci.place({
    identifier: location.id,
    additionalType: location.type ?? undefined
  })
}

function birthPersonRecord(registration: BirthRegistration) {
  const father =
    registration.father?.detailsExist === true ? registration.father : undefined
  const mother =
    registration.mother?.detailsExist === true ? registration.mother : undefined

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const motherIdentifier = compact(
    mother?.identifier?.map((identity) =>
      identity != null ? identifier(identity) : undefined
    )
  )

  const fatherIdentifier = compact(
    father?.identifier?.map((identity) =>
      identity != null ? identifier(identity) : undefined
    )
  )
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
    birthPlace: locationToSpdciPlace(registration.eventLocation),
    relations: compact([
      mother !== undefined
        ? spdci.mother({
            identifier: motherIdentifier,
            givenName: mother.name?.[0]?.firstNames ?? undefined,
            familyName: mother.name?.[0]?.familyName ?? undefined,
            homeLocation: mother.address?.[0]?.partOf ?? undefined
          })
        : null,
      father !== undefined
        ? spdci.father({
            identifier: fatherIdentifier,
            givenName: father.name?.[0]?.firstNames ?? undefined,
            familyName: father.name?.[0]?.familyName ?? undefined,
            homeLocation: father.address?.[0]?.partOf ?? undefined
          })
        : null
    ])
  }
}

function deathPersonRecord(registration: DeathRegistration) {
  const father =
    registration.father?.detailsExist === true ? registration.father : undefined
  const mother =
    registration.mother?.detailsExist === true ? registration.mother : undefined

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const motherIdentifier = compact(
    mother?.identifier?.map((identity) =>
      identity != null ? identifier(identity) : undefined
    )
  )

  const fatherIdentifier = compact(
    father?.identifier?.map((identity) =>
      identity != null ? identifier(identity) : undefined
    )
  )
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  return {
    identifier: compact(
      registration.deceased.identifier?.map((identity) =>
        identity !== null ? identifier(identity) : null
      )
    ),
    birthDate: registration.deceased?.birthDate ?? undefined,
    deathDate: registration.deceased?.deceased?.deathDate ?? undefined,
    ...name({
      firstNames: registration.deceased.name[0].firstNames,
      familyName: registration.deceased.name[0].familyName
    }),
    sex: sex(registration.deceased.gender),
    deathPlace: locationToSpdciPlace(registration.eventLocation),
    relations: compact([
      mother !== undefined
        ? spdci.mother({
            identifier: motherIdentifier,
            givenName: mother.name?.[0]?.firstNames ?? undefined,
            familyName: mother.name?.[0]?.familyName ?? undefined
          })
        : null,
      father !== undefined
        ? spdci.father({
            identifier: fatherIdentifier,
            givenName: father.name?.[0]?.firstNames ?? undefined,
            familyName: father.name?.[0]?.familyName ?? undefined
          })
        : null
    ])
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
    relations: [
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
    event: EventType
  }
) {
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
      reg_type: event,
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
                event: originalRequest.search_criteria.reg_type
              })
            : []
      )
    }
  } satisfies operations['post_reg_sync_search']['responses']['default']['content']['application/json']
}
