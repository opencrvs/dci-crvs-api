import {
  OPENCRVS_AUTH_URL,
  OPENCRVS_CLIENT_ID,
  OPENCRVS_CLIENT_SECRET,
  OPENCRVS_GATEWAY_URL,
  OPENCRVS_RECORD_SEARCH_URL,
} from "./constants";
import { AuthorizationError } from "./error";
import { type SearchEventsQueryVariables } from "./gateway";
import type { BirthComposition, RequestEvent, SearchResponse } from "./types";
import { print } from "graphql";
import gql from "graphql-tag";

export const AUTHENTICATE_SYSTEM_CLIENT_URL = new URL(
  "authenticateSystemClient",
  OPENCRVS_AUTH_URL
);

export async function authenticateClient(
  authenticateUrl = AUTHENTICATE_SYSTEM_CLIENT_URL,
  clientId = OPENCRVS_CLIENT_ID,
  clientSecret = OPENCRVS_CLIENT_SECRET
) {
  const request = await fetch(authenticateUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!request.ok) {
    throw new AuthorizationError(request.statusText);
  }

  const response = (await request.json()) as { token: string };
  return response.token;
}

export const SEARCH_EVENTS = print(gql`
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
        type
        registration {
          status
          contactNumber
          trackingId
          registrationNumber
          registeredLocationId
          duplicates
          assignment {
            userId
            firstName
            lastName
            officeName
            __typename
          }
          createdAt
          modifiedAt
          __typename
        }
        operationHistories {
          operationType
          operatedOn
          operatorRole
          operatorName {
            firstNames
            familyName
            use
            __typename
          }
          operatorOfficeName
          operatorOfficeAlias
          notificationFacilityName
          notificationFacilityAlias
          rejectReason
          rejectComment
          __typename
        }
        ... on BirthEventSearchSet {
          dateOfBirth
          childName {
            firstNames
            familyName
            use
            __typename
          }
          __typename
        }
        ... on DeathEventSearchSet {
          dateOfDeath
          deceasedName {
            firstNames
            familyName
            use
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }
`);

export const GATEWAY_URL = new URL(
  "advancedRecordSearch",
  OPENCRVS_RECORD_SEARCH_URL
);

export async function advancedRecordSearch(
  token: string,
  variables: SearchEventsQueryVariables,
  searchUrl = OPENCRVS_GATEWAY_URL
) {
  const request = await fetch(searchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      operationName: "searchEvents",
      variables,
      query: SEARCH_EVENTS,
    }),
  });
  const response = await request.json();
  console.log(response);
  return response as RequestEvent<SearchResponse<BirthComposition>>;
}

export * from "./gateway";
export * from "./types";
