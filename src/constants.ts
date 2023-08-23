export const HOST = process.env.HOST || "0.0.0.0";
export const PORT = process.env.PORT || 1660;
export const DEFAULT_TIMEOUT_MS = 600000;

export const OPENCRVS_CLIENT_ID = process.env.OPENCRVS_CLIENT_ID;
export const OPENCRVS_CLIENT_SECRET = process.env.OPENCRVS_CLIENT_SECRET;
export const OPENCRVS_AUTH_URL =
  process.env.OPENCRVS_AUTH_URL || "http://localhost:4040/";
export const OPENCRVS_RECORD_SEARCH_URL =
  process.env.OPENCRVS_AUTH_URL || "http://localhost:9090/";
