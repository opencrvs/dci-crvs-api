import {
  OPENCRVS_AUTH_URL,
  OPENCRVS_CLIENT_ID,
  OPENCRVS_CLIENT_SECRET,
  OPENCRVS_RECORD_SEARCH_URL,
} from "./constants";
import { SearchCriteria, SearchResponse } from "./opencrvs-api-types";

const AUTHENTICATE_SYSTEM_CLIENT_URL = new URL(
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
  const response = (await request.json()) as { token: string };
  return response.token;
}

export async function recordSearch(
  token: string,
  criteria: SearchCriteria,
  searchUrl = OPENCRVS_RECORD_SEARCH_URL
) {
  const request = await fetch(`${searchUrl}advancedRecordSearch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(criteria),
  });
  const response = await request.json();
  return response as { body: SearchResponse<any>; statusCode: number };
}
