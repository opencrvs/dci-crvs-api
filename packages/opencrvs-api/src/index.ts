import {
  OPENCRVS_AUTH_URL,
  OPENCRVS_CLIENT_ID,
  OPENCRVS_CLIENT_SECRET,
  OPENCRVS_GATEWAY_URL
} from './constants'
import { AuthorizationError } from './error'
import {
  type SearchEventsQuery,
  type SearchEventsQueryVariables
} from './gateway'
import { print } from 'graphql'
import gql from 'graphql-tag'
import type { Registration } from './types'

export const AUTHENTICATE_SYSTEM_CLIENT_URL = new URL(
  'authenticateSystemClient',
  OPENCRVS_AUTH_URL
)

export async function authenticateClient(
  authenticateUrl = AUTHENTICATE_SYSTEM_CLIENT_URL,
  clientId = OPENCRVS_CLIENT_ID,
  clientSecret = OPENCRVS_CLIENT_SECRET
) {
  const request = await fetch(authenticateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret
    })
  })

  if (!request.ok) {
    throw new AuthorizationError(request.statusText)
  }

  const response = (await request.json()) as { token: string }
  return response.token
}

export const SEARCH_EVENTS = gql`
  query searchEvents(
    $advancedSearchParameters: AdvancedSearchParametersInput!
    $sort: String
    $count: Int
    $skip: Int
  ) {
    searchEvents(
      advancedSearchParameters: $advancedSearchParameters
      sort: $sort
      count: $count
      skip: $skip
    ) {
      totalItems
      results {
        id
      }
    }
  }
`

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
      variables,
      query: print(SEARCH_EVENTS)
    })
  })
  const response = await request.json()
  return response.data.searchEvents as SearchEventsQuery['searchEvents']
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
        }
        groom {
          id
          name {
            use
            firstNames
            familyName
          }
          dateOfMarriage
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

export * from './types'
export * from './error'
export { OPENCRVS_GATEWAY_URL } from './constants'
