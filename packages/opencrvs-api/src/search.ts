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
  const response = await request.json()
  console.log(JSON.stringify(response, null, 4))
  /**
   *   "eventLocation": {
                "id": "0dffad78-623a-4b02-9144-e138382467c9",
                "_fhirID": null,
                "identifier": [
                    {
                        "system": "http://opencrvs.org/specs/id/internal-id",
                        "value": "HEALTH_FACILITY_pXhz0PLiYZX"
                    }
                ],
                "status": "active",
                "name": "Chamakubi Health Post",
                "alias": [
                    "Chamakubi Health Post"
                ],
                "description": null,
                "partOf": "Location/904bd0fa-5f4e-4684-a23e-e5efe9752153",
                "type": "HEALTH_FACILITY",
                "address": null,
                "longitude": null,
                "latitude": null,
                "altitude": null,
                "geoData": null
   */
  return response.data.fetchRegistration as Registration
}
