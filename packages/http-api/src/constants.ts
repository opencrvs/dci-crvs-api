export const HOST = process.env.HOST ?? '0.0.0.0'
export const PORT = process.env.PORT ?? 1660
export const DEFAULT_TIMEOUT_MS = 600000
export const NODE_ENV = process.env.NODE_ENV
/** Used to get JWT information such as .well-known to ensure JWT's are valid */
export const OPENCRVS_AUTH_URL =
  process.env.OPENCRVS_AUTH_URL ?? 'http://localhost:4040/'
/** Used to redirect API request directly to core */
export const OPENCRVS_TOKEN_URL = new URL('token', OPENCRVS_AUTH_URL)

/** Tests */
export const NO_RESPONSE_MOCK = Boolean(process.env.NO_RESPONSE_MOCK)
