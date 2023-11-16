/** Used to get JWT information such as .well-known to ensure JWT's are valid */
export const OPENCRVS_AUTH_URL =
  process.env.OPENCRVS_AUTH_URL ?? 'http://localhost:4040/'
/** Used for record search */
export const OPENCRVS_GATEWAY_URL =
  process.env.OPENCRVS_GATEWAY_URL ?? 'http://localhost:7070/graphql'
/** Used to redirect API request directly to core */
export const OPENCRVS_TOKEN_URL = new URL('token', OPENCRVS_AUTH_URL)
/** FHIR Location API URL */
export const OPENCRVS_FHIR_LOCATION_API =
  process.env.OPENCRVS_FHIR_LOCATION_API ??
  'http://localhost:7070/location?_count=0'
