import { OPENCRVS_GATEWAY_URL } from './constants'
import {
  type SearchEventsQuery,
  type SearchEventsQueryVariables
} from './gateway'
import { print } from 'graphql'
import gql from 'graphql-tag'
import type { Registration } from './types'

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

export async function advancedRecordSearch(
  token: string,
  variables: SearchEventsQueryVariables,
  searchUrl = OPENCRVS_GATEWAY_URL
) {
  console.log(variables)
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
