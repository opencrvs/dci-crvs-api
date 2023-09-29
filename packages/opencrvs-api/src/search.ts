import { OPENCRVS_GATEWAY_URL } from './constants'
import {
  type SearchEventsQuery,
  type SearchEventsQueryVariables
} from './gateway'
import { print } from 'graphql'
import gql from 'graphql-tag'
import type { Registration } from './types'
import { AuthorizationError } from 'dci-opencrvs-bridge'

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

interface Success {
  data: {
    searchEvents: SearchEventsQuery['searchEvents']
  }
  errors: undefined
}

interface Error {
  errors: Array<{ message: string }>
}

function isError(response: Success | Error): response is Error {
  return (response?.errors?.length ?? 0) > 0
}

function isUnauthenticated(error: Error) {
  return error.errors.some((error) => error.message === 'Unauthorized')
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
  const response = (await request.json()) as Success | Error

  if (isError(response) && isUnauthenticated(response)) {
    throw new AuthorizationError('Unauthorized in gateway')
  }

  if (isError(response)) {
    throw new Error(
      `Gateway returned errors: ${response.errors
        .map((error) => error.message)
        .join(', ')}`
    )
  }

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
          __typename
          id
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
  const response = await request.json()
  return response.data.fetchRegistration as Registration
}
