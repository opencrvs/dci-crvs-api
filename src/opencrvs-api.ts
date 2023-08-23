import {
  OPENCRVS_AUTH_URL,
  OPENCRVS_CLIENT_ID,
  OPENCRVS_CLIENT_SECRET,
} from "./constants";

const AUTHENTICATE_SYSTEM_CLIENT_URL = new URL(
  "authenticateSystemClient",
  OPENCRVS_AUTH_URL
);

export async function authenticateClient(
  authenticateUrl = AUTHENTICATE_SYSTEM_CLIENT_URL,
  clientId = OPENCRVS_CLIENT_ID,
  clientSecret = OPENCRVS_CLIENT_SECRET
) {
  const response = await fetch(authenticateUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const data = (await response.json()) as { token: string };
  return data.token;
}
