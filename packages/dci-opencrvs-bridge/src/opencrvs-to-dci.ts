import type {
  Registration,
  BirthRegistration,
  DeathRegistration,
  MarriageRegistration,
  IdentityType
} from 'opencrvs-api'
import type { operations, components, SyncSearchRequest } from 'dci-api'
import type { SearchResponseWithMetadata } from './types'
import { ParseError } from './error'
import { compact, isNil } from 'lodash/fp'

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
      return '1'
    case 'female':
      return '2'
    case 'other':
      return '3'
    default:
      return '4'
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
    ) as any, // TODO: Change this to a proper identity type after the typing gets updated to support multiple identifiers?
    birthdate: registration.child.birthDate,
    ...name({
      firstNames: registration.child.name[0].firstNames,
      familyName: registration.child.name[0].familyName
    }),
    sex: sex(registration.child.gender),
    parent1_identifier: motherIdentifier,
    parent2_identifier: fatherIdentifier
  } satisfies components['schemas']['dci_PersonRecord']
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
    ) as any, // TODO: Change this to a proper identity type
    birthdate: registration.deceased?.birthDate ?? undefined,
    deathdate: registration.deceased?.deceased?.deathDate ?? undefined,
    ...name({
      firstNames: registration.deceased.name[0].firstNames,
      familyName: registration.deceased.name[0].familyName
    }),
    sex: sex(registration.deceased.gender),
    parent1_identifier: motherIdentifier,
    parent2_identifier: fatherIdentifier,
    deathplace: undefined // TODO: Add deathplace after we've figured addresses with MOSIP?
  } satisfies components['schemas']['dci_PersonRecord']
}

function marriagePersonRecord(
  registration: MarriageRegistration
): components['schemas']['dci_PersonRecord'] {
  return {
    identifier: compact(
      registration.bride?.identifier?.map((identity) =>
        identity !== null ? identifier(identity) : null
      )
    ) as any, // TODO: Change this to a proper identity type
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
        ) as any, // TODO: Change this to a proper identity type
        ...name({
          firstNames: registration.groom.name[0].firstNames,
          familyName: registration.groom.name[0].familyName
        })
      }
    ]
  } as any // TODO: How do we inform about the related persons? GitBook and typing don't match
}

function eventType(event: string) {
  switch (event) {
    case 'Birth':
      return '1' satisfies components['schemas']['dci_VitalEvents']
    case 'Death':
      return '2' satisfies components['schemas']['dci_VitalEvents']
    case 'Marriage':
      return '4' satisfies components['schemas']['dci_VitalEvents']
    default:
      throw new ParseError('Unimplemented event type')
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
    pageNumber = 1
  }: {
    referenceId: string
    timestamp: components['schemas']['DateTime']
    pageSize?: number
    pageNumber?: number
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
      reg_record_type: {
        namespace: 'person-v1',
        value: 'person'
      },
      reg_event_type: {
        namespace: 'ns:dci:vital-events:v1',
        value: eventType('Birth') // TODO: Shouldn't this be per reg_record?
      },
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
    locale: 'en' // TODO: How do we figure this out?
  }
}

export function registrySyncSearchBuilder(
  responses: SearchResponseWithMetadata[],
  request: SyncSearchRequest
) {
  const totalCount = responses
    .map(({ registrations }) => registrations.length ?? 0)
    .reduce((a, b) => a + b, 0)

  return {
    signature: '<<todo>>',
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
      correlation_id: '<<TODO>>', // TODO: Couldn't find this from Gitbook
      search_response: responses.flatMap(
        ({ registrations, originalRequest, responseFinishedTimestamp }) =>
          registrations.length > 0
            ? searchResponseBuilder(registrations, {
                referenceId: originalRequest.reference_id,
                timestamp: responseFinishedTimestamp.toISOString(),
                pageSize: originalRequest.search_criteria.pagination?.page_size,
                pageNumber:
                  originalRequest.search_criteria.pagination?.page_number
              })
            : []
      )
    }
  } satisfies operations['post_reg_sync_search']['responses']['default']['content']['application/json']
}
