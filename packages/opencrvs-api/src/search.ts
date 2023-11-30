import { OPENCRVS_GATEWAY_URL } from './constants'
import {
  type SearchEventsQuery,
  type SearchEventsQueryVariables
} from './gateway'
import { print } from 'graphql'
import gql from 'graphql-tag'
import type { Registration } from './types'
import { DailyQuotaExceededError, AuthorizationError } from './error'

export const SEARCH_EVENTS = gql`
  query searchEvents(
    $advancedSearchParameters: AdvancedSearchParametersInput!
    $count: Int
    $skip: Int
    $sortBy: [SortBy!]
  ) {
    searchEvents(
      advancedSearchParameters: $advancedSearchParameters
      count: $count
      skip: $skip
      sortBy: $sortBy
    ) {
      totalItems
      results {
        id
      }
    }
  }
`

interface Success<T = any> {
  data: T
  errors: undefined
}

interface Error {
  errors: Array<{
    message: string
    extensions: { code: 'DAILY_QUOTA_EXCEEDED' | 'INTERNAL_SERVER_ERROR' }
  }>
}

function isError<T>(response: Success<T> | Error): response is Error {
  return (response?.errors?.length ?? 0) > 0
}

function isUnauthenticated(error: Error) {
  return error.errors.some((error) => error.message === 'Unauthorized')
}

function isDailyQuotaExceeded(error: Error) {
  return error.errors.some(
    (error) => error.extensions.code === 'DAILY_QUOTA_EXCEEDED'
  )
}

export async function advancedRecordSearch(
  token: string,
  variables: SearchEventsQueryVariables,
  searchUrl = OPENCRVS_GATEWAY_URL
) {
  const request = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      operationName: 'searchEvents',
      variables: {
        registrationStatuses: ['REGISTERED'],
        ...variables
      },
      query: print(SEARCH_EVENTS)
    })
  })
  const response = (await request.json()) as
    | Success<{ searchEvents: SearchEventsQuery['searchEvents'] }>
    | Error

  if (isError(response) && isUnauthenticated(response)) {
    throw new AuthorizationError('Unauthorized in gateway')
  }

  if (isError(response) && isDailyQuotaExceeded(response)) {
    throw new DailyQuotaExceededError(
      'OpenCRVS Search API daily quota exceeded'
    )
  }

  if (isError(response)) {
    throw new Error(
      `Gateway returned errors: ${response.errors
        .map((error) => error.message)
        .join(', ')}`
    )
  }

  console.log(
    'searchEvents [params]:',
    JSON.stringify({
      operationName: 'searchEvents',
      variables: {
        registrationStatuses: ['REGISTERED'],
        ...variables
      },
      query: print(SEARCH_EVENTS)
    })
  )
  console.log('searchEvents [result]:', JSON.stringify(response, null, 4))

  return response.data.searchEvents
}

export const FETCH_REGISTRATION = gql`
  query fetchRegistration($id: ID!) {
    fetchRegistration(id: $id) {
      id
      registration {
        id
        type
        trackingId
        status {
          type
        }
        duplicates {
          compositionId
          trackingId
        }
        assignment {
          userId
          firstName
          lastName
          officeName
          avatarURL
        }
      }
      ... on BirthRegistration {
        __typename
        child {
          id
          birthDate
          name {
            use
            firstNames
            familyName
          }
          gender
          identifier {
            id
            type
          }
          detailsExist
        }
        father {
          id
          birthDate
          name {
            use
            firstNames
            familyName
          }
          gender
          identifier {
            id
            type
          }
          address {
            type
            line
            district
            state
            city
            postalCode
            country
            partOf
          }
          detailsExist
        }
        mother {
          id
          birthDate
          name {
            use
            firstNames
            familyName
          }
          gender
          identifier {
            id
            type
          }
          address {
            type
            line
            district
            state
            city
            postalCode
            country
            partOf
          }
          detailsExist
        }
        eventLocation {
          id
          identifier {
            system
            value
          }
          status
          name
          alias
          partOf
          type
          address {
            type
            line
            district
            state
            city
            postalCode
            country
          }
        }
      }
      ... on DeathRegistration {
        __typename
        deceased {
          id
          name {
            use
            firstNames
            familyName
          }
          gender
          identifier {
            id
            type
          }
        }
        eventLocation {
          id
          identifier {
            system
            value
          }
          status
          name
          alias
          partOf
          type
          address {
            type
            line
            district
            state
            city
            postalCode
            country
            partOf
          }
        }
      }
      ... on MarriageRegistration {
        __typename
        bride {
          id
          name {
            use
            firstNames
            familyName
          }
          dateOfMarriage
          identifier {
            id
            type
          }
        }
        groom {
          id
          name {
            use
            firstNames
            familyName
          }
          dateOfMarriage
          identifier {
            id
            type
          }
        }
        eventLocation {
          id
          identifier {
            system
            value
          }
          status
          name
          alias
          partOf
          type
          address {
            type
            line
            district
            state
            city
            postalCode
            country
          }
        }
      }
    }
  }
`

export async function fetchRegistration(
  token: string,
  id: string,
  gatewayUrl = OPENCRVS_GATEWAY_URL
) {
  const request = await fetch(gatewayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      operationName: 'fetchRegistration',
      variables: { id },
      query: print(FETCH_REGISTRATION)
    })
  })
  const response = (await request.json()) as
    | Success<{ fetchRegistration: Registration }>
    | Error

  if (isError(response)) {
    console.log('errors', response.errors.length)
    throw new Error(
      `Gateway returned errors: ${response.errors
        .map((error) => error.message)
        .join(', ')}`
    )
  }

  console.log(
    'fetchRegistration [params]:',
    JSON.stringify({
      operationName: 'fetchRegistration',
      variables: { id },
      query: print(FETCH_REGISTRATION)
    })
  )
  console.log('fetchRegistration [result]:', JSON.stringify(response, null, 4))

  return response.data.fetchRegistration
}
