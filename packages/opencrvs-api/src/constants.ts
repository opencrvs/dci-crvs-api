export const OPENCRVS_CLIENT_ID = process.env.OPENCRVS_CLIENT_ID;
export const OPENCRVS_CLIENT_SECRET = process.env.OPENCRVS_CLIENT_SECRET;
export const OPENCRVS_AUTH_URL =
  process.env.OPENCRVS_AUTH_URL ?? "http://localhost:4040/";
export const OPENCRVS_RECORD_SEARCH_URL =
  process.env.OPENCRVS_RECORD_SEARCH_URL ?? "http://localhost:9090/";
export const OPENCRVS_GATEWAY_URL =
  process.env.OPENCRVS_GATEWAY_URL ?? "http://localhost:7070/graphql";
